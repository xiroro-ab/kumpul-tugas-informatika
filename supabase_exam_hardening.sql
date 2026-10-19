-- =====================================================
-- HARDENING EXAM: RPC server-side + RLS + unique index
-- Jalankan di SQL Editor Supabase setelah schema dasar
-- =====================================================

-- 1) Deduplikasi quiz_submissions: pertahankan yang terbaru
WITH ranked AS (
  SELECT id, quiz_id, student_id, nama_siswa, kelas, created_at,
         ROW_NUMBER() OVER (
           PARTITION BY quiz_id, student_id
           ORDER BY (
             CASE WHEN status_koreksi IN ('selesai','belum_dikoreksi','terkunci_curang') THEN 2
                  WHEN status_koreksi = 'sedang_ujian' THEN 1
                  ELSE 0
             END
           ) DESC,
           created_at DESC,
           id DESC
         ) AS rn
  FROM public.quiz_submissions
  WHERE nullif(btrim(student_id), '') IS NOT NULL
)
DELETE FROM public.quiz_submissions qs
USING ranked r
WHERE qs.id = r.id AND r.rn > 1;

-- 2) Unique index (mencegah re-entry baru)
CREATE UNIQUE INDEX IF NOT EXISTS uq_quiz_submissions_quizid_studentid
  ON public.quiz_submissions (quiz_id, student_id)
  WHERE nullif(btrim(student_id), '') IS NOT NULL;

-- 3) Helpers
CREATE OR REPLACE FUNCTION public.exam_config(p_petunjuk TEXT, p_token_required BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO public
AS $$
DECLARE v_cfg JSONB := '{}'::jsonb;
BEGIN
  BEGIN
    v_cfg := coalesce(substring(coalesce(p_petunjuk,''), '\[CONFIG:([^]]*)\]')::jsonb, '{}'::jsonb);
  EXCEPTION WHEN OTHERS THEN
    v_cfg := '{}'::jsonb;
  END;
  RETURN jsonb_build_object(
    'violation_limit', coalesce((v_cfg->>'violation_limit')::int, 3),
    'fullscreen', coalesce((v_cfg->>'fullscreen')::boolean, true),
    'token_required', p_token_required
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('violation_limit', 3, 'fullscreen', true, 'token_required', p_token_required);
END; $$;

CREATE OR REPLACE FUNCTION public.sanitize_question(q public.quiz_questions)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE v JSONB; pairs JSONB;
BEGIN
  v := to_jsonb(q) - 'kunci_pg' - 'rubrik_esai' - 'pasangan';
  IF q.tipe = 'menjodohkan' THEN
    BEGIN
      pairs := coalesce(nullif(q.rubrik_esai,'')::jsonb, '[]'::jsonb);
    EXCEPTION WHEN OTHERS THEN
      pairs := '[]'::jsonb;
    END;
    IF jsonb_typeof(pairs) <> 'array' THEN pairs := '[]'::jsonb; END IF;
    v := v || jsonb_build_object(
      'pasangan', coalesce(
        (SELECT jsonb_agg(jsonb_build_object('kiri', elem->>'kiri') ORDER BY ord)
           FROM jsonb_array_elements(pairs) WITH ORDINALITY t(elem, ord)
          WHERE nullif(btrim(elem->>'kiri'), '') IS NOT NULL),
        '[]'::jsonb
      ),
      'opsi_kanan', coalesce(
        (SELECT jsonb_agg(DISTINCT btrim(elem->>'kanan'))
           FROM jsonb_array_elements(pairs) elem
          WHERE nullif(btrim(elem->>'kanan'), '') IS NOT NULL),
        '[]'::jsonb
      )
    );
  END IF;
  RETURN v;
END; $$;

CREATE OR REPLACE FUNCTION public.sanitized_questions(p_quiz_id BIGINT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
SELECT coalesce(jsonb_agg(public.sanitize_question(q) ORDER BY q.nomor), '[]'::jsonb)
  FROM public.quiz_questions q
 WHERE q.quiz_id = p_quiz_id
$$;

-- 4) Server-side scoring
CREATE OR REPLACE FUNCTION public.score_exam_submission(p_quiz_id BIGINT, p_answers JSONB)
RETURNS TABLE(skor_pg INT, skor_esai INT, total_nilai INT, has_subjective BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  q record;
  bobot NUMERIC;
  max_total NUMERIC := 0;
  auto_total NUMERIC := 0;
  subj_total NUMERIC := 0;
  has_subj BOOLEAN := false;
  v_answers JSONB := coalesce(p_answers, '{}'::jsonb);
  ans_text TEXT;
  student_keys TEXT[];
  correct_keys TEXT[];
  pairs JSONB;
  pair_count INT := 0;
  correct_count INT := 0;
BEGIN
  FOR q IN SELECT * FROM public.quiz_questions WHERE quiz_id = p_quiz_id LOOP
    bobot := coalesce(nullif(q.bobot, 0), CASE WHEN q.tipe='menjodohkan' THEN 20 ELSE 10 END);
    max_total := max_total + bobot;
    ans_text := v_answers ->> q.id::text;

    IF q.tipe = 'pg' THEN
      IF nullif(btrim(coalesce(ans_text,'')), '') IS NOT NULL AND
         upper(btrim(ans_text)) = upper(btrim(coalesce(q.kunci_pg,'')))
      THEN auto_total := auto_total + bobot;
      END IF;
    ELSIF q.tipe = 'benar_salah' THEN
      IF nullif(btrim(coalesce(ans_text,'')), '') IS NOT NULL AND
         lower(btrim(ans_text)) = lower(btrim(coalesce(q.kunci_pg,'')))
      THEN auto_total := auto_total + bobot;
      END IF;
    ELSIF q.tipe = 'pg_kompleks' THEN
      IF jsonb_typeof(v_answers -> q.id::text) = 'array' THEN
        SELECT coalesce(array_agg(DISTINCT upper(btrim(x)) ORDER BY upper(btrim(x))), '{}')
          INTO student_keys
          FROM jsonb_array_elements_text(v_answers -> q.id::text) x
         WHERE nullif(btrim(x), '') IS NOT NULL;
      ELSE
        SELECT coalesce(array_agg(DISTINCT upper(btrim(x)) ORDER BY upper(btrim(x))), '{}')
          INTO student_keys
          FROM unnest(string_to_array(coalesce(ans_text,''), ',')) x
         WHERE nullif(btrim(x), '') IS NOT NULL;
      END IF;
      SELECT coalesce(array_agg(DISTINCT upper(btrim(x)) ORDER BY upper(btrim(x))), '{}')
        INTO correct_keys
        FROM unnest(string_to_array(coalesce(q.kunci_pg,''), ',')) x
       WHERE nullif(btrim(x), '') IS NOT NULL;
      IF array_length(student_keys, 1) IS NOT NULL AND array_length(correct_keys, 1) IS NOT NULL AND student_keys = correct_keys THEN
        auto_total := auto_total + bobot;
      END IF;
    ELSIF q.tipe = 'singkat' OR q.tipe = 'isian' THEN
      IF nullif(btrim(coalesce(ans_text,'')), '') IS NOT NULL THEN
        IF nullif(btrim(coalesce(q.kunci_pg,'')), '') IS NOT NULL AND lower(btrim(ans_text)) = lower(btrim(q.kunci_pg)) THEN
          subj_total := subj_total + bobot;
        ELSE
          has_subj := true;
        END IF;
      END IF;
    ELSIF q.tipe = 'menjodohkan' THEN
      BEGIN
        pairs := coalesce(nullif(q.rubrik_esai,''), '[]'::text)::jsonb;
      EXCEPTION WHEN OTHERS THEN
        pairs := '[]'::jsonb;
      END;
      IF jsonb_typeof(pairs) = 'array' THEN
        SELECT COUNT(*) FILTER (WHERE nullif(btrim(elem->>'kanan'),'') IS NOT NULL),
               COUNT(*) FILTER (WHERE nullif(btrim(elem->>'kanan'),'') IS NOT NULL AND
                 lower(btrim(coalesce((v_answers -> q.id::text) ->> (ord-1)::text,''))) = lower(btrim(elem->>'kanan')))
          INTO pair_count, correct_count
          FROM jsonb_array_elements(pairs) WITH ORDINALITY t(elem, ord)
         WHERE jsonb_typeof(elem) = 'object';
        IF pair_count > 0 THEN
          subj_total := subj_total + round((bobot::numeric * correct_count::numeric) / (pair_count::numeric));
        END IF;
      END IF;
    ELSIF q.tipe = 'esai' OR q.tipe = 'uraian' OR q.tipe = 'essay' OR q.tipe = 'upload_foto' OR q.tipe = 'foto' THEN
      IF nullif(btrim(coalesce(ans_text,'')), '') IS NOT NULL THEN
        has_subj := true;
      END IF;
    ELSE
      IF nullif(btrim(coalesce(ans_text,'')), '') IS NOT NULL THEN
        has_subj := true;
      END IF;
    END IF;
  END LOOP;

  IF max_total <= 0 THEN
    RETURN QUERY SELECT 0, 0, 0, false;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    round(auto_total)::int,
    round(subj_total)::int,
    round((auto_total + subj_total) * 100 / max_total)::int,
    has_subj;
END; $$;

-- 5) RPC: list, start, resume
CREATE OR REPLACE FUNCTION public.list_student_quizzes()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
SELECT coalesce(jsonb_agg(jsonb_build_object(
  'id', q.id,
  'mapel', q.mapel,
  'kelas', q.kelas,
  'judul_kuis', q.judul_kuis,
  'petunjuk', regexp_replace(coalesce(q.petunjuk,''), '\[CONFIG:[^]]*\]', '', 'g'),
  'durasi_menit', q.durasi_menit,
  'created_at', q.created_at,
  'token_required', (coalesce(q.token_required, (nullif(btrim(coalesce(q.token,'')),'') IS NOT NULL)) AND (nullif(btrim(coalesce(q.token,'')),'') IS NOT NULL)),
  'question_count', (SELECT count(*) FROM public.quiz_questions qq WHERE qq.quiz_id = q.id)
) ORDER BY q.created_at DESC), '[]'::jsonb)
FROM public.quizzes q
WHERE q.status = 'aktif'
$$;

CREATE OR REPLACE FUNCTION public.start_exam_session(
  p_quiz_id BIGINT,
  p_student_id TEXT,
  p_student_name TEXT,
  p_kelas TEXT,
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_quiz public.quizzes;
  v_sub public.quiz_submissions;
  v_req BOOLEAN;
  v_key TEXT;
  v_resumed BOOLEAN := false;
BEGIN
  SELECT * INTO v_quiz FROM public.quizzes WHERE id = p_quiz_id AND status = 'aktif';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ujian tidak ditemukan atau sudah tidak aktif.');
  END IF;

  v_req := (coalesce(v_quiz.token_required, (nullif(btrim(coalesce(v_quiz.token,'')),'') IS NOT NULL))) AND (nullif(btrim(coalesce(v_quiz.token,'')),'') IS NOT NULL);
  IF v_req THEN
    IF upper(btrim(coalesce(v_quiz.token,''))) <> upper(btrim(coalesce(p_token,''))) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Token ujian salah atau tidak valid.');
    END IF;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_quiz_id::text || ':' || coalesce(nullif(p_student_id,''), lower(btrim(p_student_name)))));
  IF nullif(btrim(p_student_id), '') IS NOT NULL THEN
    SELECT * INTO v_sub FROM public.quiz_submissions WHERE quiz_id = p_quiz_id AND student_id = p_student_id ORDER BY created_at DESC LIMIT 1;
  ELSE
    SELECT * INTO v_sub FROM public.quiz_submissions WHERE quiz_id = p_quiz_id AND lower(nama_siswa)=lower(btrim(p_student_name)) AND kelas = p_kelas ORDER BY created_at DESC LIMIT 1;
  END IF;

  IF FOUND THEN
    IF v_sub.id IS NOT NULL AND v_sub.status_koreksi = 'terkunci_curang' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Akun ujian dibekukan karena pelanggaran anti-kecurangan.', 'code', 'locked');
    ELSIF v_sub.id IS NOT NULL AND v_sub.status_koreksi IN ('selesai', 'belum_dikoreksi', 'perlu_dinilai') THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Anda sudah menyelesaikan ujian ini.', 'code', 'finished');
    ELSIF v_sub.id IS NOT NULL AND v_sub.status_koreksi = 'sedang_ujian' THEN
      IF coalesce(v_sub.jawaban_siswa->>'sessionKey','') = '' THEN
        v_key := replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
        UPDATE public.quiz_submissions
           SET jawaban_siswa = coalesce(jawaban_siswa, '{}'::jsonb) || jsonb_build_object('sessionKey', v_key)
         WHERE id = v_sub.id
        RETURNING * INTO v_sub;
      END IF;
      v_resumed := true;
    ELSE
      v_key := replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
      INSERT INTO public.quiz_submissions (quiz_id, student_id, nama_siswa, kelas, jawaban_siswa, skor_pg, skor_esai, total_nilai, status_koreksi)
      VALUES (p_quiz_id, coalesce(p_student_id,''), btrim(p_student_name), p_kelas,
              jsonb_build_object('answers','{}'::jsonb,'doubtful','{}'::jsonb,'cheatAttempts',0,'cheatLogs','[]'::jsonb,'startedAt', now()::text, 'sessionKey', v_key),
              0, 0, 0, 'sedang_ujian')
      RETURNING * INTO v_sub;
      v_resumed := false;
    END IF;
  ELSE
    v_key := replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
    INSERT INTO public.quiz_submissions (quiz_id, student_id, nama_siswa, kelas, jawaban_siswa, skor_pg, skor_esai, total_nilai, status_koreksi)
    VALUES (p_quiz_id, coalesce(p_student_id,''), btrim(p_student_name), p_kelas,
            jsonb_build_object('answers','{}'::jsonb,'doubtful','{}'::jsonb,'cheatAttempts',0,'cheatLogs','[]'::jsonb,'startedAt', now()::text, 'sessionKey', v_key),
            0, 0, 0, 'sedang_ujian')
    RETURNING * INTO v_sub;
    v_resumed := false;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'resumed', v_resumed,
    'quiz', jsonb_build_object(
      'id', v_quiz.id,
      'mapel', v_quiz.mapel,
      'kelas', v_quiz.kelas,
      'judul_kuis', v_quiz.judul_kuis,
      'petunjuk', regexp_replace(coalesce(v_quiz.petunjuk,''), '\[CONFIG:[^]]*\]', '', 'g'),
      'durasi_menit', v_quiz.durasi_menit,
      'token_required', v_req,
      'config', public.exam_config(v_quiz.petunjuk, v_req),
      'quiz_questions', public.sanitized_questions(p_quiz_id)
    ),
    'submission', to_jsonb(v_sub)
  );
END; $$;

CREATE OR REPLACE FUNCTION public.resume_exam_session(
  p_submission_id BIGINT,
  p_session_key TEXT,
  p_student_id TEXT,
  p_student_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_sub public.quiz_submissions;
  v_quiz public.quizzes;
  v_key TEXT;
BEGIN
  SELECT * INTO v_sub FROM public.quiz_submissions WHERE id = p_submission_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Sesi ujian tidak ditemukan.'); END IF;

  IF nullif(btrim(p_student_id), '') IS NOT NULL THEN
    IF v_sub.student_id <> p_student_id THEN RETURN jsonb_build_object('ok', false, 'error', 'Identitas siswa tidak cocok.'); END IF;
  ELSE
    IF lower(v_sub.nama_siswa) <> lower(btrim(p_student_name)) THEN RETURN jsonb_build_object('ok', false, 'error', 'Identitas siswa tidak cocok.'); END IF;
  END IF;

  IF coalesce(v_sub.jawaban_siswa->>'sessionKey','') <> '' AND coalesce(p_session_key,'') <> coalesce(v_sub.jawaban_siswa->>'sessionKey','') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sesi ujian tidak valid.');
  END IF;

  IF v_sub.status_koreksi = 'terkunci_curang' THEN RETURN jsonb_build_object('ok', false, 'error', 'Sesi ujian terkunci.'); END IF;
  IF v_sub.status_koreksi IN ('selesai','belum_dikoreksi','perlu_dinilai') THEN RETURN jsonb_build_object('ok', false, 'error', 'Sesi ujian sudah selesai.'); END IF;
  IF v_sub.status_koreksi <> 'sedang_ujian' THEN RETURN jsonb_build_object('ok', false, 'error', 'Sesi ujian tidak dalam kondisi sedang berjalan.'); END IF;

  IF coalesce(v_sub.jawaban_siswa->>'sessionKey','') = '' THEN
    v_key := replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
    UPDATE public.quiz_submissions
       SET jawaban_siswa = coalesce(jawaban_siswa, '{}'::jsonb) || jsonb_build_object('sessionKey', v_key)
     WHERE id = v_sub.id
    RETURNING * INTO v_sub;
  END IF;

  SELECT * INTO v_quiz FROM public.quizzes WHERE id = v_sub.quiz_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Ujian terkait tidak ditemukan.'); END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'quiz', jsonb_build_object(
      'id', v_quiz.id,
      'mapel', v_quiz.mapel,
      'kelas', v_quiz.kelas,
      'judul_kuis', v_quiz.judul_kuis,
      'petunjuk', regexp_replace(coalesce(v_quiz.petunjuk,''), '\[CONFIG:[^]]*\]', '', 'g'),
      'durasi_menit', v_quiz.durasi_menit,
      'token_required', (coalesce(v_quiz.token_required, nullif(btrim(coalesce(v_quiz.token,'')),'') IS NOT NULL) AND nullif(btrim(coalesce(v_quiz.token,'')),'') IS NOT NULL),
      'config', public.exam_config(v_quiz.petunjuk, (coalesce(v_quiz.token_required, nullif(btrim(coalesce(v_quiz.token,'')),'') IS NOT NULL) AND nullif(btrim(coalesce(v_quiz.token,'')),'') IS NOT NULL)),
      'quiz_questions', public.sanitized_questions(v_quiz.id)
    ),
    'submission', to_jsonb(v_sub)
  );
END; $$;

-- 6) Progress/submit/lock
CREATE OR REPLACE FUNCTION public.sync_exam_progress(
  p_submission_id BIGINT,
  p_session_key TEXT,
  p_answers JSONB,
  p_doubtful JSONB,
  p_cheat_attempts INT,
  p_cheat_logs JSONB,
  p_remaining_seconds INT,
  p_is_focus BOOLEAN,
  p_is_online BOOLEAN,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE v_sub public.quiz_submissions;
BEGIN
  SELECT * INTO v_sub FROM public.quiz_submissions WHERE id = p_submission_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF coalesce(v_sub.jawaban_siswa->>'sessionKey','') <> coalesce(p_session_key,'') THEN RETURN false; END IF;
  IF v_sub.status_koreksi <> 'sedang_ujian' THEN RETURN false; END IF;

  UPDATE public.quiz_submissions
     SET jawaban_siswa = coalesce(jawaban_siswa, '{}'::jsonb) || jsonb_build_object(
       'answers', coalesce(p_answers, '{}'::jsonb),
       'doubtful', coalesce(p_doubtful, '{}'::jsonb),
       'cheatAttempts', greatest(coalesce(p_cheat_attempts,0), coalesce((jawaban_siswa->>'cheatAttempts')::int,0)),
       'cheatLogs', coalesce(p_cheat_logs, '[]'::jsonb),
       'remainingSeconds', p_remaining_seconds,
       'isFocus', p_is_focus,
       'isOnline', p_is_online,
       'focusReason', p_reason,
       'lastActiveAt', now()::text
     )
   WHERE id = p_submission_id;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.submit_exam(
  p_submission_id BIGINT,
  p_session_key TEXT,
  p_answers JSONB,
  p_doubtful JSONB,
  p_cheat_attempts INT,
  p_cheat_logs JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE v_sub public.quiz_submissions; v_score record; v_status TEXT;
BEGIN
  SELECT * INTO v_sub FROM public.quiz_submissions WHERE id = p_submission_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Sesi ujian tidak ditemukan.'); END IF;
  IF coalesce(v_sub.jawaban_siswa->>'sessionKey','') <> coalesce(p_session_key,'') THEN RETURN jsonb_build_object('ok', false, 'error', 'Sesi ujian tidak valid.'); END IF;
  IF v_sub.status_koreksi <> 'sedang_ujian' THEN RETURN jsonb_build_object('ok', false, 'error', 'Sesi ujian sudah ditutup.'); END IF;

  SELECT * INTO v_score FROM public.score_exam_submission(v_sub.quiz_id, coalesce(p_answers, '{}'::jsonb));
  v_status := CASE WHEN v_score.has_subjective THEN 'belum_dikoreksi' ELSE 'selesai' END;

  UPDATE public.quiz_submissions
     SET jawaban_siswa = coalesce(jawaban_siswa, '{}'::jsonb) || jsonb_build_object(
       'answers', coalesce(p_answers, '{}'::jsonb),
       'doubtful', coalesce(p_doubtful, '{}'::jsonb),
       'cheatAttempts', coalesce(p_cheat_attempts, coalesce((jawaban_siswa->>'cheatAttempts')::int,0)),
       'cheatLogs', coalesce(p_cheat_logs, '[]'::jsonb),
       'completedAt', now()::text
     ),
         skor_pg = v_score.skor_pg,
         skor_esai = v_score.skor_esai,
         total_nilai = v_score.total_nilai,
         status_koreksi = v_status
   WHERE id = p_submission_id
  RETURNING * INTO v_sub;

  RETURN jsonb_build_object('ok', true, 'submission', to_jsonb(v_sub));
END; $$;

CREATE OR REPLACE FUNCTION public.lock_exam(
  p_submission_id BIGINT,
  p_session_key TEXT,
  p_answers JSONB,
  p_doubtful JSONB,
  p_cheat_attempts INT,
  p_cheat_logs JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE v_sub public.quiz_submissions; v_score record;
BEGIN
  SELECT * INTO v_sub FROM public.quiz_submissions WHERE id = p_submission_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Sesi ujian tidak ditemukan.'); END IF;
  IF coalesce(v_sub.jawaban_siswa->>'sessionKey','') <> coalesce(p_session_key,'') THEN RETURN jsonb_build_object('ok', false, 'error', 'Sesi ujian tidak valid.'); END IF;
  IF v_sub.status_koreksi <> 'sedang_ujian' THEN RETURN jsonb_build_object('ok', false, 'error', 'Sesi ujian sudah ditutup.'); END IF;

  SELECT * INTO v_score FROM public.score_exam_submission(v_sub.quiz_id, coalesce(p_answers, '{}'::jsonb));

  UPDATE public.quiz_submissions
     SET jawaban_siswa = coalesce(jawaban_siswa, '{}'::jsonb) || jsonb_build_object(
       'answers', coalesce(p_answers, '{}'::jsonb),
       'doubtful', coalesce(p_doubtful, '{}'::jsonb),
       'cheatAttempts', coalesce(p_cheat_attempts, coalesce((jawaban_siswa->>'cheatAttempts')::int,0)),
       'cheatLogs', coalesce(p_cheat_logs, '[]'::jsonb),
       'lockedDueToCheating', true,
       'completedAt', now()::text
     ),
         skor_pg = v_score.skor_pg,
         skor_esai = v_score.skor_esai,
         total_nilai = v_score.total_nilai,
         status_koreksi = 'terkunci_curang'
   WHERE id = p_submission_id
  RETURNING * INTO v_sub;

  RETURN jsonb_build_object('ok', true, 'submission', to_jsonb(v_sub));
END; $$;

-- 7) Student read RPCs (aman)
CREATE OR REPLACE FUNCTION public.get_student_exam_submissions(
  p_student_id TEXT,
  p_student_name TEXT,
  p_kelas TEXT
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
SELECT coalesce(jsonb_agg(x ORDER BY x.created_at DESC), '[]'::jsonb)
  FROM (
    SELECT id, quiz_id, student_id, nama_siswa, kelas, status_koreksi, skor_pg, skor_esai, total_nilai, created_at
      FROM public.quiz_submissions
     WHERE (nullif(btrim(p_student_id),'') IS NOT NULL AND student_id = p_student_id)
        OR (nullif(btrim(p_student_id),'') IS NULL AND lower(nama_siswa)=lower(btrim(p_student_name)) AND (nullif(btrim(p_kelas),'') IS NULL OR kelas = p_kelas))
  ) x
$$;

CREATE OR REPLACE FUNCTION public.get_student_exam_grades(p_name TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
SELECT coalesce(jsonb_agg(jsonb_build_object(
  'id', s.id,
  'quiz_id', s.quiz_id,
  'student_id', s.student_id,
  'nama_siswa', s.nama_siswa,
  'kelas', s.kelas,
  'status_koreksi', s.status_koreksi,
  'skor_pg', s.skor_pg,
  'skor_esai', s.skor_esai,
  'total_nilai', s.total_nilai,
  'created_at', s.created_at,
  'judul_kuis', q.judul_kuis,
  'mapel', q.mapel
) ORDER BY s.created_at DESC), '[]'::jsonb)
  FROM public.quiz_submissions s
  LEFT JOIN public.quizzes q ON q.id = s.quiz_id
 WHERE lower(s.nama_siswa)=lower(btrim(p_name))
   AND s.status_koreksi IN ('selesai', 'belum_dikoreksi', 'perlu_dinilai')
$$;

-- 8) Grants
GRANT EXECUTE ON FUNCTION public.list_student_quizzes() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_exam_session(BIGINT,TEXT,TEXT,TEXT,TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resume_exam_session(BIGINT,TEXT,TEXT,TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_exam_progress(BIGINT,TEXT,JSONB,JSONB,INT,JSONB,INT,BOOLEAN,BOOLEAN,TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_exam(BIGINT,TEXT,JSONB,JSONB,INT,JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lock_exam(BIGINT,TEXT,JSONB,JSONB,INT,JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_exam_submissions(TEXT,TEXT,TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_exam_grades(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.score_exam_submission(BIGINT,JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sanitized_questions(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exam_config(TEXT,BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sanitize_question(public.quiz_questions) TO authenticated;

-- Helper re-grants
REVOKE EXECUTE ON FUNCTION public.score_exam_submission(BIGINT,JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION public.sanitized_questions(BIGINT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.exam_config(TEXT,BOOLEAN) FROM anon;
REVOKE EXECUTE ON FUNCTION public.sanitize_question(public.quiz_questions) FROM anon;
