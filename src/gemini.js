// Google Gemini Flash AI Engine for SMPN 58 Palembang LMS
// Provides serverless AI features for 30 teachers:
// 1. Material generation
// 2. Quiz & Exam question generation (PG & Esai)
// 3. Auto-grading with rubric matching & feedback

const GEMINI_MODEL = 'gemini-1.5-flash';

export function getGeminiApiKey() {
    return localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
}

export function setGeminiApiKey(key) {
    if (key) {
        localStorage.setItem('gemini_api_key', key.trim());
    } else {
        localStorage.removeItem('gemini_api_key');
    }
}

async function callGemini(prompt, systemInstruction = '', jsonMode = false) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        throw new Error('API Key Google Gemini belum diatur. Silakan atur di menu Pengaturan AI.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const payload = {
        contents: [
            {
                role: 'user',
                parts: [{ text: prompt }]
            }
        ],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95
        }
    };

    if (systemInstruction) {
        payload.systemInstruction = {
            parts: [{ text: systemInstruction }]
        };
    }

    if (jsonMode) {
        payload.generationConfig.responseMimeType = 'application/json';
    }

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson?.error?.message || `HTTP ${res.status} - Gagal memanggil Gemini AI`;
        throw new Error(msg);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || '';
    return text.trim();
}

/**
 * AI Generator Materi Pembelajaran
 */
export async function aiGenerateMaterial(mapel, topik, kelas) {
    const system = `Anda adalah asisten kurikulum cerdas untuk guru SMP Negeri 58 Palembang. 
Gaya bahasa ramah, edukatif, terstruktur, menggunakan Bahasa Indonesia yang baik dan mudah dipahami siswa SMP.`;

    const prompt = `Buatkan materi ajar lengkap untuk:
Mata Pelajaran: ${mapel}
Kelas: ${kelas}
Topik/Bab: ${topik}

Sajikan dengan struktur rapi:
1. Pengantar Singkat & Tujuan Pembelajaran
2. Penjelasan Konsep Inti (jelas, dengan analogi sehari-hari)
3. Poin-Poin Penting / Rangkuman
4. Glosarium / Istilah Penting
5. 2 Pertanyaan Pemantik Refleksi Siswa

Format dalam teks terstruktur (gunakan bullet points dan penomoran rapi).`;

    return await callGemini(prompt, system, false);
}

/**
 * AI Generator Bank Soal Ujian (Pilihan Ganda & Esai)
 */
export async function aiGenerateQuestions(mapel, topik, kelas, countPG = 5, countEsai = 2) {
    const system = `Anda adalah pembuat soal evaluasi pembelajaran standar SMP. Kembalikan HANYA format JSON valid tanpa markdown backtick.`;

    const prompt = `Buatkan ${countPG} soal Pilihan Ganda (4 pilihan: A, B, C, D) dan ${countEsai} soal Esai untuk:
Mata Pelajaran: ${mapel}
Kelas: ${kelas}
Materi: ${topik}

Format respon HARUS berupa JSON array persis seperti ini:
[
  {
    "tipe": "pg",
    "pertanyaan": "Teks pertanyaan pilihan ganda...",
    "opsi_a": "Teks opsi A",
    "opsi_b": "Teks opsi B",
    "opsi_c": "Teks opsi C",
    "opsi_d": "Teks opsi D",
    "kunci_pg": "A",
    "bobot": 10
  },
  {
    "tipe": "esai",
    "pertanyaan": "Teks pertanyaan esai / uraian...",
    "opsi_a": "",
    "opsi_b": "",
    "opsi_c": "",
    "opsi_d": "",
    "kunci_pg": "",
    "rubrik_esai": "Kriteria penilaian: menyebutkan faktor X (skor 10), menjelaskan Y (skor 15)...",
    "bobot": 20
  }
]`;

    const raw = await callGemini(prompt, system, true);
    try {
        return JSON.parse(raw);
    } catch {
        // Fallback jika ada formatting tak terduga
        const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean);
    }
}

/**
 * AI Auto-Koreksi Tugas Berkas / Tautan Siswa
 */
export async function aiEvaluateSubmission(mapel, materi, judulTugas, rubrik, studentTextOrLink) {
    const system = `Anda adalah guru penguji objektif SMPN 58 Palembang.
Tugas Anda adalah menilai hasil kerja siswa dan memberikan skor (0 - 100) serta umpan balik edukatif.
Kembalikan HANYA JSON: {"nilai": 85, "catatan": "Penjelasan evaluasi..."}`;

    const prompt = `Evaluasi tugas berikut:
Mata Pelajaran: ${mapel}
Materi: ${materi}
Judul Penugasan: ${judulTugas}
Rubrik/Kriteria Penilaian: ${rubrik || 'Kesesuaian dengan materi, kelengkapan, dan ketelitian.'}
Pengumpulan Siswa (Teks/Tautan/Deskripsi): ${studentTextOrLink}

Tentukan:
1. Skor numerik 0 - 100 (objektif sesuai rubrik).
2. Catatan feedback (2-3 kalimat ramah, sebutkan kelebihannya dan apa yang bisa ditingkatkan).`;

    const raw = await callGemini(prompt, system, true);
    try {
        return JSON.parse(raw);
    } catch {
        const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean);
    }
}

/**
 * AI Auto-Koreksi Jawaban Esai Ujian Siswa
 */
export async function aiGradeQuizEssay(pertanyaan, rubrik, jawabanSiswa, maxBobot = 20) {
    const system = `Anda adalah penilai ujian esai SMP objektif. Berikan skor dan evaluasi singkat dalam JSON: {"skor": number, "feedback": string}`;

    const prompt = `Soal Esai: ${pertanyaan}
Rubrik Jawaban Guru: ${rubrik}
Bobot Maksimal: ${maxBobot}
Jawaban Siswa: ${jawabanSiswa || '(Kosong / Tidak menjawab)'}

Berikan:
- "skor": angka antara 0 sampai ${maxBobot}
- "feedback": kalimat masukan singkat (maks 2 kalimat)`;

    const raw = await callGemini(prompt, system, true);
    try {
        return JSON.parse(raw);
    } catch {
        const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean);
    }
}
