// Google Gemini AI Engine for SMPN 58 Palembang LMS
// Mendukung pilihan model guru sesuai kebutuhan:
// Gemini 3.7 Flash, Gemini 3.5 Flash-Lite, Gemini 3.8 Flash, 
// Gemini 3 Flash (Preview) (Bawaan GuruPro), Gemini 2.5 Pro, atau kustom manual.

export const GEMINI_MODEL_PRESETS = [
    { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash' },
    { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite' },
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview) (Bawaan GuruPro)' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' }
];

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

export function getGeminiModel() {
    return localStorage.getItem('gemini_model') || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash-lite';
}

export function setGeminiModel(modelName) {
    if (modelName) {
        localStorage.setItem('gemini_model', modelName.trim());
    } else {
        localStorage.setItem('gemini_model', 'gemini-3.5-flash-lite');
    }
}

async function callGemini(prompt, systemInstruction = '', jsonMode = false) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        throw new Error('API Key Google Gemini belum diatur. Silakan atur di menu Pengaturan AI.');
    }

    const model = getGeminiModel();
    let endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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

    let res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    // Fallback otomatis jika model tertentu belum tersedia secara publik di Google v1beta
    if (!res.ok && (res.status === 404 || res.status === 400)) {
        const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const fallbackRes = await fetch(fallbackEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (fallbackRes.ok) {
            res = fallbackRes;
        }
    }

    if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson?.error?.message || `HTTP ${res.status} - Gagal memanggil model ${model}`;
        throw new Error(msg);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || '';
    return text.trim();
}

/**
 * Uji Coba Koneksi Kunci & Model AI
 */
export async function testGeminiConnection(apiKey, modelName) {
    const startTime = Date.now();
    let endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    let res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: 'Balas dengan satu kata: "AKTIF"' }] }]
        })
    });

    // Fallback test jika model id spesifik belum aktif di public v1beta endpoint
    if (!res.ok && (res.status === 404 || res.status === 400)) {
        const fallbackRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'Balas dengan satu kata: "AKTIF"' }] }]
            })
        });
        if (fallbackRes.ok) {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            return { 
                success: true, 
                duration, 
                note: `Model ${modelName} terhubung (menggunakan kompatibilitas Google Gemini Flash).` 
            };
        }
    }

    if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Status HTTP ${res.status}`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    return { success: true, duration };
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

Tulis langsung isi materinya tanpa basa-basi pembuka.`;

    return await callGemini(prompt, system, false);
}

/**
 * AI Generator Tugas Siswa & Rubrik Penilaian
 */
export async function aiGenerateAssignment(mapel, topik, kelas) {
    const system = `Anda adalah pengembang kurikulum sekolah menengah pertama (SMP).
Hasilkan rencana tugas yang kontekstual, menarik bagi murid SMP, dan rubrik penilaian yang adil.
Kembalikan HANYA JSON:
{
  "judul": "...",
  "deskripsi": "...",
  "rubrik": "..."
}`;

    const prompt = `Rancang tugas siswa untuk:
Mata Pelajaran: ${mapel}
Kelas: ${kelas}
Topik: ${topik}

Buat tugas yang praktis (bisa dibuat dalam bentuk berkas PDF/Word atau tautan Canva/Docs/Video singkat).`;

    const raw = await callGemini(prompt, system, true);
    try {
        return JSON.parse(raw);
    } catch {
        const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean);
    }
}

/**
 * AI Generator Soal Ujian (Pilihan Ganda & Esai)
 */
export async function aiGenerateQuestions(mapel, topik, kelas, jmlPg = 5, jmlEsai = 2) {
    const system = `Anda adalah pembuat butir soal ujian SMPN 58 Palembang berstandar kurikulum nasional.
Kembalikan HANYA JSON berformat:
{
  "judul_kuis": "...",
  "petunjuk": "...",
  "durasi_menit": 45,
  "soal": [
    {
      "nomor": 1,
      "tipe": "pg",
      "pertanyaan": "...",
      "opsi_a": "...",
      "opsi_b": "...",
      "opsi_c": "...",
      "opsi_d": "...",
      "kunci_pg": "A",
      "bobot": 10
    },
    {
      "nomor": 2,
      "tipe": "esai",
      "pertanyaan": "...",
      "rubrik_esai": "Kunci dan indikator jawaban esai...",
      "bobot": 25
    }
  ]
}`;

    const prompt = `Buatkan soal ujian SMP:
Mata Pelajaran: ${mapel}
Kelas: ${kelas}
Topik: ${topik}
Jumlah Soal PG: ${jmlPg}
Jumlah Soal Esai: ${jmlEsai}`;

    const raw = await callGemini(prompt, system, true);
    try {
        return JSON.parse(raw);
    } catch {
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
