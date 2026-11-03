-- ==============================================================================
-- MIGRATION: FITUR HAPUS JAWABAN SISWA (AGAR BISA UPLOAD ULANG)
-- SMPN 58 KOTA PALEMBANG
-- ==============================================================================

-- 1. Berikan hak akses kepada 'anon' untuk menghapus baris di tabel public.files
-- Syarat keamanan: Hanya bisa menghapus tugas yang belum dinilai oleh guru
DROP POLICY IF EXISTS "Allow student delete own unrated files" ON public.files;
CREATE POLICY "Allow student delete own unrated files" ON public.files
FOR DELETE TO anon
USING (nilai IS NULL AND (status_koreksi IS NULL OR status_koreksi != 'sudah_dikoreksi'));

-- 2. Fungsi Stored Procedure (RPC) untuk Hapus Pengumpulan Siswa secara aman
CREATE OR REPLACE FUNCTION public.delete_student_submission(
  p_submission_id BIGINT,
  p_student_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_sub RECORD;
  v_group_tag TEXT;
  v_storage_path TEXT;
BEGIN
  -- Cari pengumpulan berdasarkan ID dan Nama Siswa
  SELECT id, nama, kelas, materi, nilai, status_koreksi, storage_path, catatan_guru
  INTO v_sub
  FROM public.files
  WHERE id = p_submission_id AND LOWER(TRIM(nama)) = LOWER(TRIM(p_student_name));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pengumpulan tugas tidak ditemukan atau nama siswa tidak sesuai.');
  END IF;

  -- Lindungi tugas yang sudah dinilai guru agar integritas nilai tetap terjaga
  IF v_sub.nilai IS NOT NULL OR v_sub.status_koreksi = 'sudah_dikoreksi' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Tugas ini sudah dinilai oleh guru dan tidak dapat dihapus.');
  END IF;

  v_storage_path := v_sub.storage_path;

  -- Jika tugas kelompok, hapus seluruh data pengumpulan anggota yang terkait
  IF v_sub.catatan_guru LIKE '%[TAG:GRP_%' THEN
    v_group_tag := substring(v_sub.catatan_guru from '\[TAG:(GRP_[^\]]+)\]');
    IF v_group_tag IS NOT NULL THEN
      DELETE FROM public.files WHERE catatan_guru LIKE '%' || v_group_tag || '%';
      RETURN jsonb_build_object(
        'success', true,
        'message', 'Tugas kelompok berhasil dihapus untuk seluruh anggota.',
        'storage_path', v_storage_path
      );
    END IF;
  END IF;

  -- Hapus pengumpulan individu
  DELETE FROM public.files WHERE id = p_submission_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Pengumpulan tugas berhasil dihapus.',
    'storage_path', v_storage_path
  );
END;
$$;

-- Berikan izin eksekusi RPC ke siswa (anon) dan guru (authenticated)
GRANT EXECUTE ON FUNCTION public.delete_student_submission(BIGINT, TEXT) TO anon, authenticated;
