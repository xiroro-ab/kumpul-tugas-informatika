// Skor otomatis ujian. Objektif dan subjektif dipisah agar tidak dihitung dua kali
// saat guru menyimpan hasil koreksi di admin.
function getBobot(q) {
    return Number(q.bobot) || (q.tipe === 'menjodohkan' ? 20 : 10);
}

export function getMaxScore(questions) {
    return (questions || []).reduce((total, q) => total + getBobot(q), 0);
}

export function toPercent(score, maxScore) {
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

export function calculateExamScore(questions, answers) {
    let autoScoreTotal = 0;
    let autoSubjectiveScore = 0;
    let hasSubjective = false;

    (questions || []).forEach(q => {
        const bobot = getBobot(q);
        const val = answers ? answers[q.id] : undefined;

        if (q.tipe === 'pg') {
            if (val && String(val).toUpperCase() === String(q.kunci_pg || '').toUpperCase()) {
                autoScoreTotal += bobot;
            }
        } else if (q.tipe === 'pg_kompleks') {
            const studentKeys = (Array.isArray(val) ? val : String(val || '').split(','))
                .map(s => s.trim().toUpperCase())
                .filter(Boolean)
                .sort();
            const correctKeys = String(q.kunci_pg || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean).sort();
            if (studentKeys.length > 0 && studentKeys.join(',') === correctKeys.join(',')) {
                autoScoreTotal += bobot;
            }
        } else if (q.tipe === 'benar_salah') {
            if (val && String(val).trim().toLowerCase() === String(q.kunci_pg || '').trim().toLowerCase()) {
                autoScoreTotal += bobot;
            }
        } else if (q.tipe === 'singkat') {
            if (val && q.kunci_pg && String(val).trim().toLowerCase() === String(q.kunci_pg).trim().toLowerCase()) {
                autoSubjectiveScore += bobot;
            } else if (val) {
                hasSubjective = true;
            }
        } else if (q.tipe === 'menjodohkan') {
            let pairs = [];
            try { pairs = JSON.parse(q.rubrik_esai); } catch (_) { pairs = q.pasangan || []; }
            const studentPairs = val || {};
            let correctCount = 0;
            (Array.isArray(pairs) ? pairs : []).forEach((p, pIdx) => {
                const stAns = studentPairs[pIdx];
                if (stAns && p.kanan && String(stAns).trim().toLowerCase() === String(p.kanan).trim().toLowerCase()) {
                    correctCount++;
                }
            });
            if (pairs.length > 0) {
                autoSubjectiveScore += Math.round(bobot * (correctCount / pairs.length));
            }
        } else if (q.tipe === 'upload_foto' || q.tipe === 'esai') {
            if (val) hasSubjective = true;
        }
    });

    return { autoScoreTotal, autoSubjectiveScore, hasSubjective };
}

// jawaban_siswa disimpan sebagai { answers, doubtful, cheatAttempts, ... }.
export function getSubmissionAnswers(submission) {
    if (!submission) return {};
    let raw = submission.jawaban_siswa;
    if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch (_) { return {}; }
    }
    if (raw && typeof raw === 'object') {
        if (raw.answers && typeof raw.answers === 'object') return raw.answers;
        return raw;
    }
    return {};
}
