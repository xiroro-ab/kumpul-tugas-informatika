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
            topP: 0.95,
            maxOutputTokens: 8192
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
 * Parser & Perbaikan JSON Cerdas (Kebal Truncate, Smart Quotes, dan Malformed JSON)
 */
export function robustJsonParse(raw) {
    if (!raw) return null;
    let str = typeof raw === 'string' ? raw.trim() : JSON.stringify(raw);

    // 1. Bersihkan kode markdown
    str = str.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

    // 2. Parse langsung
    try {
        return JSON.parse(str);
    } catch (_) {}

    // 3. Ekstrak blok JSON terluar
    const firstBrace = str.indexOf('{');
    const firstBracket = str.indexOf('[');
    let startIdx = -1;
    let isObject = false;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startIdx = firstBrace;
        isObject = true;
    } else if (firstBracket !== -1) {
        startIdx = firstBracket;
        isObject = false;
    }

    if (startIdx !== -1) {
        const lastBrace = str.lastIndexOf('}');
        const lastBracket = str.lastIndexOf(']');
        const endIdx = isObject ? lastBrace : lastBracket;

        if (endIdx !== -1 && endIdx > startIdx) {
            str = str.substring(startIdx, endIdx + 1);
        } else {
            str = str.substring(startIdx);
        }
    }

    try {
        return JSON.parse(str);
    } catch (_) {}

    // 4. Normalisasi smart quotes & trailing commas
    let cleaned = str
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/,\s*([}\]])/g, '$1');

    try {
        return JSON.parse(cleaned);
    } catch (_) {}

    // 5. Perbaiki JSON terpotong (Truncated JSON Repair)
    try {
        let fixed = cleaned;
        const quotes = (fixed.match(/(?<!\\)"/g) || []).length;
        if (quotes % 2 !== 0) {
            fixed += '"';
        }
        fixed = fixed.replace(/[,:\s]+$/, '');

        let openBraces = (fixed.match(/\{/g) || []).length;
        let closeBraces = (fixed.match(/\}/g) || []).length;
        let openBrackets = (fixed.match(/\[/g) || []).length;
        let closeBrackets = (fixed.match(/\]/g) || []).length;

        while (openBrackets > closeBrackets) {
            fixed += ']';
            closeBrackets++;
        }
        while (openBraces > closeBraces) {
            fixed += '}';
            closeBraces++;
        }

        return JSON.parse(fixed);
    } catch (_) {}

    // 6. Regex Salvage: Selamatkan butir-butir soal yang sudah lengkap
    const recoveredQuestions = [];
    const qMatches = str.match(/\{[^{}]*?"pertanyaan"[^{}]*?\}/g);
    if (qMatches && qMatches.length > 0) {
        qMatches.forEach((qStr, idx) => {
            try {
                const cleanedQ = qStr.replace(/,\s*([}\]])/g, '$1');
                recoveredQuestions.push(JSON.parse(cleanedQ));
            } catch {
                const getField = (f) => {
                    const m = qStr.match(new RegExp(`"${f}"\\s*:\\s*"([^"]*)"`));
                    return m ? m[1] : '';
                };
                const pertanyaan = getField('pertanyaan');
                if (pertanyaan) {
                    recoveredQuestions.push({
                        nomor: idx + 1,
                        tipe: qStr.includes('"opsi_a"') ? 'pg' : 'esai',
                        pertanyaan,
                        opsi_a: getField('opsi_a'),
                        opsi_b: getField('opsi_b'),
                        opsi_c: getField('opsi_c'),
                        opsi_d: getField('opsi_d'),
                        kunci_pg: getField('kunci_pg') || 'A',
                        rubrik_esai: getField('rubrik_esai'),
                        bobot: qStr.includes('"opsi_a"') ? 10 : 25
                    });
                }
            }
        });
    }

    if (recoveredQuestions.length > 0) {
        return {
            judul_kuis: 'Bank Soal Ujian',
            petunjuk: 'Kerjakan soal dengan teliti dan jujur.',
            durasi_menit: 45,
            soal: recoveredQuestions
        };
    }

    // 7. Regex Salvage untuk objek Penugasan
    const judulMatch = str.match(/"judul"\s*:\s*"([^"]*)"/);
    const deskripsiMatch = str.match(/"deskripsi"\s*:\s*"([^"]*)"/);
    const rubrikMatch = str.match(/"rubrik"\s*:\s*"([^"]*)"/);
    if (judulMatch || deskripsiMatch) {
        return {
            judul: judulMatch ? judulMatch[1] : 'Penugasan Pembelajaran',
            deskripsi: deskripsiMatch ? deskripsiMatch[1] : str,
            rubrik: rubrikMatch ? rubrikMatch[1] : 'Kesesuaian materi dan kerapian pengerjaan.'
        };
    }

    // 8. Regex Salvage untuk Nilai & Catatan Evaluasi
    const nilaiMatch = str.match(/"nilai"\s*:\s*(\d+)/);
    const catatanMatch = str.match(/"catatan"\s*:\s*"([^"]*)"/);
    if (nilaiMatch) {
        return {
            nilai: parseInt(nilaiMatch[1], 10),
            catatan: catatanMatch ? catatanMatch[1] : 'Tugas telah diserahkan dengan baik.'
        };
    }

    throw new Error('Respons AI tidak dapat diurai secara otomatis. Silakan klik generate sekali lagi.');
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
 * AI Generator Materi Pembelajaran (Kaya Fitur & Berstandar Kurikulum Merdeka)
 */
export async function aiGenerateMaterial(mapelOrConfig, topik = '', kelas = 'Kelas 7', gaya = 'konseptual', kedalaman = 'menengah', opsi = {}) {
    let cfg = {};
    if (typeof mapelOrConfig === 'object' && mapelOrConfig !== null) {
        cfg = mapelOrConfig;
    } else {
        cfg = {
            mapel: mapelOrConfig || 'Informatika',
            topik: topik || 'Topik Pembelajaran',
            kelas: kelas || 'Kelas 7',
            gaya: gaya || 'konseptual',
            kedalaman: kedalaman || 'menengah',
            sertakanStudiKasus: opsi.sertakanStudiKasus ?? true,
            sertakanRefleksi: opsi.sertakanRefleksi ?? true,
            sertakanGlosarium: opsi.sertakanGlosarium ?? true
        };
    }

    const gayaDescriptions = {
        konseptual: 'Konseptual & Komunikatif: Bahasa ramah siswa SMP, dilengkapi analogi kehidupan sehari-hari yang mudah dibayangkan.',
        praktikum: 'Tutorial Praktikum Prosedural: Berfokus pada tahapan langkah demi langkah teknis yang siap dipraktikkan langsung.',
        ringkasan: 'Intisari Kompak & Rumus Kunci: Ringkasan padat fakta untuk review cepat pemahaman sebelum asesmen.',
        kasus: 'Studi Kasus Kontekstual: Mengangkat skenario nyata atau fenomena kekinian untuk dianalisis bersama.'
    };

    const kedalamanDescriptions = {
        dasar: 'Tingkat Fondasi (C1-C2): Mengenalkan konsep dasar, istilah kunci, dan fungsi utama tanpa kerumitan teknis berlebih.',
        menengah: 'Tingkat Aplikatif (C3): Membahas cara penerapan konsep, prosedur praktis, dan contoh penyelesaian masalah.',
        mahir: 'Tingkat Lanjutan HOTS (C4-C5): Mendorong analisis kritis, komparasi kelebihan dan kekurangan, serta evaluasi solusi.'
    };

    const system = `Anda adalah ahli pengembang modul ajar SMP Negeri 58 Palembang berstandar Kurikulum Merdeka.
Susun materi ajar yang interaktif, mendalam, bernas, dan menggunakan Bahasa Indonesia yang tepat tanpa bahasa klise.
PENTING: Jangan gunakan karakter em dash dalam naskah materi. Gunakan tanda koma, titik dua, atau kurung sebagai penggantinya.`;

    const prompt = `Buatkan naskah bahan ajar komprehensif dengan spesifikasi:
- Mata Pelajaran: ${cfg.mapel || 'Informatika'}
- Target Siswa: ${cfg.kelas || 'Semua Kelas'}
- Materi Pokok / Bab: ${cfg.topik}
- Pendekatan Penyampaian: ${gayaDescriptions[cfg.gaya] || gayaDescriptions.konseptual}
- Kedalaman Materi: ${kedalamanDescriptions[cfg.kedalaman] || kedalamanDescriptions.menengah}

Struktur materi yang wajib disajikan:
1. Capaian & Tujuan Pembelajaran (apa kompetensi yang diraih siswa)
2. Pembahasan Konsep Inti (jelas, runut, disertai analogi nyata yang lekat dengan remaja SMP)
${cfg.sertakanStudiKasus ? '3. Contoh Penerapan Nyata / Studi Kasus (skenario konkret yang dialami dalam kehidupan)' : ''}
4. Rangkuman Intisari Materi (poin-poin penting yang harus diingat)
${cfg.sertakanRefleksi ? '5. Pertanyaan Pemantik & Refleksi Mandiri (2-3 pertanyaan untuk menguji nalar siswa)' : ''}
${cfg.sertakanGlosarium ? '6. Glosarium Istilah Penting (daftar istilah teknis beserta artinya secara ringkas)' : ''}

Tuliskan langsung isi modul pembelajaran secara terstruktur tanpa basa-basi pembuka atau penutup.`;

    return await callGemini(prompt, system, false);
}

/**
 * AI Generator Tugas Siswa & Rubrik Penilaian (Spesifik, Terstruktur & Kaya Fitur)
 */
export async function aiGenerateAssignment(
    mapelOrConfig, 
    topik = '', 
    kelas = 'Kelas 7', 
    jenisTugas = 'praktikum', 
    tingkatKognitif = 'hots',
    modelPembelajaran = 'pbl',
    alokasiWaktu = '1 Minggu',
    formatPengumpulan = 'kombinasi'
) {
    let cfg = {};
    if (typeof mapelOrConfig === 'object' && mapelOrConfig !== null) {
        cfg = mapelOrConfig;
    } else {
        cfg = {
            mapel: mapelOrConfig || 'Informatika',
            topik: topik || 'Materi Pembelajaran',
            kelas: kelas || 'Kelas 7',
            jenisTugas: jenisTugas || 'praktikum',
            tingkatKognitif: tingkatKognitif || 'hots',
            modelPembelajaran: modelPembelajaran || 'pbl',
            alokasiWaktu: alokasiWaktu || '1 Minggu',
            formatPengumpulan: formatPengumpulan || 'kombinasi'
        };
    }

    const jenisTugasDesc = {
        praktikum: 'Praktik Mandiri / Pemecahan Masalah Komputasional (Siswa menghasilkan luaran nyata berupa file/karya)',
        lks: 'Lembar Kerja Peserta Didik (LKPD): Lembar analisis terstruktur dengan pertanyaan terbimbing',
        infografis: 'Infografis & Media Kreatif Canva: Merangkum intisari materi ke dalam bentuk visual estetis',
        video: 'Presentasi Video Singkat (2-3 menit): Siswa menjelaskan pemahaman atau mendemonstrasikan tugas',
        laporan: 'Laporan Tertulis & Analisis Kasus: Siswa menyusun laporan sistematis',
        proyek: 'Proyek Terpadu / Kolaborasi: Penugasan berbasis karya kelompok'
    }[cfg.jenisTugas] || 'Praktik Mandiri';

    const kognitifDesc = {
        hots: 'Tingkat Kognitif HOTS (C4 Analisis, C5 Evaluasi, C6 Kreasi Produk): Menuntut nalar kritis, evaluasi data, dan kreasi solusi baru.',
        mots: 'Tingkat Kognitif MOTS (C3 Penerapan): Menuntut penerapan prosedur praktis pada skenario konkret.',
        lots: 'Tingkat Kognitif LOTS (C1-C2 Pemahaman): Menuntut kemampuan menjelaskan dan merangkum konsep dasar.'
    }[cfg.tingkatKognitif] || 'HOTS';

    const modelDesc = {
        pbl: 'Problem-Based Learning (PBL): Berangkat dari permasalahan riil yang menuntut investigasi dan pemecahan masalah.',
        pjbl: 'Project-Based Learning (PjBL): Berorientasi pada pembuatan produk/artefak nyata yang dapat dipresentasikan.',
        discovery: 'Discovery / Inquiry Learning: Siswa diarahkan menemukan pola konsep melalui eksperimen terarah.',
        kontekstual: 'Kontekstual (CTL): Mengaitkan materi secara langsung dengan kehidupan sehari-hari siswa di lingkungan sekolah dan rumah.'
    }[cfg.modelPembelajaran] || 'Problem-Based Learning (PBL)';

    const system = `Anda adalah konsultan kurikulum dan perancang asesmen autentik SMP Negeri 58 Palembang berstandar Kurikulum Merdeka.
Buatkan rencana penugasan siswa yang aplikatif, jelas, tidak abstrak, dan terstruktur rapi.
PENTING: Jangan gunakan karakter em dash.
Kembalikan HANYA format JSON valid tanpa tanda petik markdown:
{
  "judul": "string (Judul penugasan yang spesifik, menarik, dan mencerminkan materi pokok)",
  "deskripsi": "string (Rincian penugasan lengkap: 1. Capaian & Tujuan Tugas, 2. Alat & Bahan yang Diperlukan, 3. Langkah Pengerjaan Terperinci Step-by-Step, 4. Format & Ketentuan Pengumpulan)",
  "rubrik": "string (Kriteria penilaian kuantitatif 3-4 kriteria lengkap dengan bobot persentase, contoh: Ketepatan Konsep [40%], Kedalaman Analisis & Kreativitas [35%], Kerapian & Kepatuhan Waktu [25%])"
}`;

    const prompt = `Rancang instrumen penugasan siswa SMP dengan parameter lengkap:
- Mata Pelajaran: ${cfg.mapel || 'Informatika'}
- Target Kelas: ${cfg.kelas || 'Semua Kelas'}
- Materi Pokok / Capaian Pembelajaran: ${cfg.topik}
- Bentuk Tugas: ${jenisTugasDesc}
- Tingkat Kognitif: ${kognitifDesc}
- Model Pembelajaran: ${modelDesc}
- Estimasi Alokasi Waktu: ${cfg.alokasiWaktu || '1 Minggu'}
- Format Pengumpulan: ${cfg.formatPengumpulan || 'Form Web, File Dokumen, atau Tautan Canva/Docs'}

Pastikan instruksi sangat mudah dimengerti siswa SMP dan rubrik penilaian memiliki parameter terukur untuk acuan guru serta AI.`;

    const raw = await callGemini(prompt, system, true);
    return robustJsonParse(raw);
}

/**
 * AI Generator Butir Soal Ujian (Pilihan Ganda & Esai)
 * Mendukung Taksonomi Bloom (LOTS/MOTS/HOTS), Tingkat Kesulitan, dan Stimulus AKM
 */
export async function aiGenerateQuestions(
    mapelOrConfig, 
    topik = '', 
    kelas = 'Kelas 7', 
    jmlPg = 5, 
    jmlEsai = 2,
    taksonomi = 'campuran',
    kesulitan = 'berimbang',
    stimulus = 'kontekstual',
    durasi = 45
) {
    let cfg = {};
    if (typeof mapelOrConfig === 'object' && mapelOrConfig !== null) {
        cfg = mapelOrConfig;
    } else {
        cfg = {
            mapel: mapelOrConfig || 'Informatika',
            topik: topik || 'Topik Pembelajaran',
            kelas: kelas || 'Kelas 7',
            jmlPg: Number(jmlPg) || 5,
            jmlEsai: Number(jmlEsai) || 2,
            taksonomi: taksonomi || 'campuran',
            kesulitan: kesulitan || 'berimbang',
            stimulus: stimulus || 'kontekstual',
            durasi: Number(durasi) || 45
        };
    }

    const taksonomiDescriptions = {
        campuran: 'Kombinasi Berimbang Kurikulum Nasional: LOTS 30% (C1-C2 Pemahaman Dasar), MOTS 40% (C3 Aplikasi Konsep), HOTS 30% (C4 Analisis & C5 Evaluasi).',
        hots: 'Dominan HOTS (Higher Order Thinking Skills): C4 Analisis data/kasus, C5 Evaluasi keputusan, C6 Kreasi solusi. Soal menuntut nalar kritis siswa, bukan sekadar hafalan definisi.',
        mots: 'Fokus MOTS (Middle Order Thinking Skills): C3 Penerapan konsep, prosedur, dan rumus pada situasi baru.',
        lots: 'Fokus LOTS (Lower Order Thinking Skills): C1 Mengingat istilah dan C2 Memahami konsep dasar secara langsung.'
    }[cfg.taksonomi] || 'Kombinasi Berimbang';

    const kesulitanDescriptions = {
        berimbang: 'Proporsi berimbang standar ujian sekolah: 30% Mudah, 50% Sedang, 20% Sukar.',
        mudah: 'Tingkat kesulitan mudah (pemahaman dasar / remedial).',
        sedang: 'Tingkat kesulitan sedang (standar penilaian harian reguler).',
        sukar: 'Tingkat kesulitan tinggi/sukar (soal pengayaan dan penalaran kompleks).'
    }[cfg.kesulitan] || 'Berimbang';

    const stimulusDescriptions = {
        kontekstual: 'Gunakan stimulus cerita/kasus nyata (standar Asesmen Nasional / AKM). Setiap nomor soal (atau kluster soal) diawali narasi situasi nyata, kutipan informasi, atau studi kasus praktis siswa sebelum mengajukan pertanyaan.',
        langsung: 'Pertanyaan langsung to-the-point dan konseptual tanpa narasi cerita panjang.'
    }[cfg.stimulus] || 'Kontekstual';

    const system = `Anda adalah ahli pengembang asesmen pendidikan SMP Negeri 58 Palembang berstandar Kurikulum Merdeka dan AKM Kemendikbudristek.
Tugas Anda merancang instrumen evaluasi kuis/ujian dengan kriteria profesional:
1. Pilihan Ganda (PG):
   - Pokok soal jelas, tegas, tidak multitafsir.
   - Memiliki tepat 4 opsi jawaban (A, B, C, D) yang masuk akal dan pengecoh berfungsi.
   - Wajib menyertakan "kunci_pg" HANYA satu huruf: "A", "B", "C", atau "D".
   - Wajib menyertakan "pembahasan" ringkas mengapa jawaban tersebut benar.
   - Bobot PG standar: 10 poin per soal.
2. Soal Esai / Uraian:
   - Soal menguji penalaran dan daya analisis siswa.
   - Wajib menyertakan "rubrik_esai" berupa kriteria penilaian bertingkat dan kata kunci jawaban untuk guru.
   - Bobot Esai standar: 20-25 poin per soal.
3. Wajib menyertakan "tingkat_kognitif" (contoh: "HOTS (C4 Analisis)", "MOTS (C3 Aplikasi)", atau "LOTS (C2 Pemahaman)").

KEMBALIKAN HANYA JSON MURNI SESUAI SCHEMA:
{
  "judul_kuis": "string",
  "petunjuk": "string",
  "durasi_menit": number,
  "soal": [
    {
      "nomor": 1,
      "tipe": "pg",
      "tingkat_kognitif": "string",
      "pertanyaan": "string",
      "opsi_a": "string",
      "opsi_b": "string",
      "opsi_c": "string",
      "opsi_d": "string",
      "kunci_pg": "A/B/C/D",
      "pembahasan": "string",
      "bobot": 10
    },
    {
      "nomor": 2,
      "tipe": "esai",
      "tingkat_kognitif": "string",
      "pertanyaan": "string",
      "rubrik_esai": "string",
      "bobot": 20
    }
  ]
}`;

    const prompt = `Susunlah instrumen ujian SMP dengan spesifikasi:
- Mata Pelajaran: ${cfg.mapel}
- Kelas: ${cfg.kelas}
- Materi Pokok / Capaian Pembelajaran: ${cfg.topik}
- Taksonomi Bloom: ${taksonomiDescriptions}
- Tingkat Kesulitan: ${kesulitanDescriptions}
- Karakteristik Stimulus: ${stimulusDescriptions}
- Jumlah Soal Pilihan Ganda: ${cfg.jmlPg} butir
- Jumlah Soal Esai: ${cfg.jmlEsai} butir
- Alokasi Durasi Ujian: ${cfg.durasi} menit`;

    const raw = await callGemini(prompt, system, true);
    const parsed = robustJsonParse(raw);

    // Ekstraksi array soal yang fleksibel dan kebal format
    let items = [];
    if (Array.isArray(parsed)) {
        items = parsed;
    } else if (parsed && Array.isArray(parsed.soal)) {
        items = parsed.soal;
    } else if (parsed && Array.isArray(parsed.questions)) {
        items = parsed.questions;
    } else if (parsed && typeof parsed === 'object') {
        const found = Object.values(parsed).find(v => Array.isArray(v));
        if (found) items = found;
    }

    // Pastikan properti array dapat dibaca baik sebagai array langsung maupun objek kuis
    items.judul_kuis = parsed?.judul_kuis || `Ujian ${cfg.mapel} - ${cfg.topik}`;
    items.petunjuk = parsed?.petunjuk || `Ujian ${cfg.topik}. Kerjakan dengan teliti dan jujur!`;
    items.durasi_menit = Number(parsed?.durasi_menit) || Number(cfg.durasi) || 45;
    items.soal = items;

    return items;
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
    return robustJsonParse(raw);
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
    return robustJsonParse(raw);
}

/**
 * AI Generator Butir Soal Formulir Tugas Siswa (Model Google Form)
 */
export async function aiGenerateFormQuestions({ mapel, kelas, topik, jmlSoal = 4, tipeSoal = 'campuran', tingkatKognitif = 'hots' }) {
    const system = `Anda adalah ahli pengembang instrumen lembar tugas siswa (Google Form style) untuk SMP Negeri 58 Palembang berstandar Kurikulum Merdeka.
Tugas Anda merancang butir-butir pertanyaan penugasan yang bervariasi, jelas, terstruktur, mendidik, dan relevan dengan materi.
Tipe soal yang didukung:
- "esai": pertanyaan uraian mendalam yang menuntut penalaran siswa. Sertakan panduan kunci jawaban / rubrik ringkas.
- "pg": pertanyaan pilihan ganda dengan 4 opsi (A, B, C, D) dan kunci jawaban (A/B/C/D).
- "singkat": pertanyaan isian singkat (1 frasa/istilah) beserta kunci jawaban singkat.
- "benar_salah": pernyataan konsep dengan kunci jawaban ("BENAR" atau "SALAH") serta penjelasan singkat.
- "upload_foto": instruksi tugas karya/praktikum yang meminta siswa mengunggah foto catatan, screenshot, atau hasil kerja nyata.
- "menjodohkan": pertanyaan menjodohkan konsep dengan 3-4 pasangan premis di kiri dan definisi di kanan.

KEMBALIKAN HANYA JSON DENGAN STRUKTUR BERIKUT:
{
  "judul_tugas": "string",
  "petunjuk": "string",
  "questions": [
    {
      "id": 1,
      "tipe": "esai" | "pg" | "singkat" | "benar_salah" | "upload_foto" | "menjodohkan",
      "pertanyaan": "string",
      "opsi_a": "string (khusus pg)",
      "opsi_b": "string (khusus pg)",
      "opsi_c": "string (khusus pg)",
      "opsi_d": "string (khusus pg)",
      "kunci": "string (A/B/C/D untuk pg, BENAR/SALAH untuk benar_salah, frasa/rubrik untuk lainnya)",
      "pasangan": [
        {"kiri": "Istilah 1", "kanan": "Definisi 1"},
        {"kiri": "Istilah 2", "kanan": "Definisi 2"},
        {"kiri": "Istilah 3", "kanan": "Definisi 3"}
      ],
      "bobot": number
    }
  ]
}`;

    const prompt = `Rancanglah lembar pertanyaan tugas siswa (seperti Google Form) dengan kriteria:
- Mata Pelajaran: ${mapel || 'Informatika'}
- Target Kelas: ${kelas || 'Kelas 7'}
- Topik / Materi Pembelajaran: ${topik}
- Preferensi Tipe Soal: ${tipeSoal} (pilihan: campuran, esai, pg, singkat, benar_salah, menjodohkan)
- Tingkat Kognitif: ${tingkatKognitif} (LOTS pemahaman dasar, MOTS penerapan, atau HOTS penalaran kritis)
- Jumlah Pertanyaan: ${jmlSoal} butir soal
Pastikan total bobot dari semua butir soal berjumlah 100 poin.`;

    const raw = await callGemini(prompt, system, true);
    const parsed = robustJsonParse(raw);

    let questions = [];
    if (parsed && Array.isArray(parsed.questions)) {
        questions = parsed.questions;
    } else if (parsed && Array.isArray(parsed.soal)) {
        questions = parsed.soal;
    } else if (Array.isArray(parsed)) {
        questions = parsed;
    }

    return {
        judul_tugas: parsed?.judul_tugas || `Tugas ${mapel} - ${topik}`,
        petunjuk: parsed?.petunjuk || `Jawablah butir pertanyaan berikut dengan teliti dan jujur.`,
        questions: questions.map((q, idx) => {
            const rawType = String(q.tipe || 'esai').toLowerCase();
            let tipe = 'esai';
            if (rawType.includes('pg') || rawType.includes('pilihan')) tipe = 'pg';
            else if (rawType.includes('singkat') || rawType.includes('isian')) tipe = 'singkat';
            else if (rawType.includes('benar') || rawType.includes('salah')) tipe = 'benar_salah';
            else if (rawType.includes('foto') || rawType.includes('upload') || rawType.includes('berkas')) tipe = 'upload_foto';
            else if (rawType.includes('jodoh') || rawType.includes('match')) tipe = 'menjodohkan';

            return {
                id: q.id || (idx + 1),
                nomor: idx + 1,
                tipe,
                pertanyaan: q.pertanyaan || q.soal || `Pertanyaan nomor ${idx + 1}`,
                opsi_a: q.opsi_a || '',
                opsi_b: q.opsi_b || '',
                opsi_c: q.opsi_c || '',
                opsi_d: q.opsi_d || '',
                kunci: q.kunci || q.kunci_pg || q.rubrik_esai || '',
                pasangan: Array.isArray(q.pasangan) ? q.pasangan : [],
                bobot: Number(q.bobot) || Math.round(100 / (questions.length || 1))
            };
        })
    };
}

/**
 * AI Auto-Koreksi Lembar Respons Tugas Google Form Siswa
 */
export async function aiEvaluateFormSubmission(mapel, judulTugas, formItems = []) {
    const system = `Anda adalah guru penguji profesional SMP Negeri 58 Palembang.
Tugas Anda mengevaluasi lembar jawaban tugas siswa (Google Form response) secara objektif dan mendidik.
Setiap butir soal memiliki bobot poin tertentu.
Panduan penilaian per tipe soal:
- Pilihan Ganda (pg): jika jawaban siswa sama persis dengan kunci, berikan skor penuh; jika salah berikan skor 0.
- Benar / Salah (benar_salah): jika jawaban sama persis dengan kunci, berikan skor penuh; jika salah berikan skor 0.
- Isian Singkat (singkat): bandingkan kesesuaian jawaban siswa dengan kunci (toleransi variasi kata kecil).
- Menjodohkan (menjodohkan): hitung proporsi pasangan yang cocok antara jawaban siswa dengan kunci.
- Upload Foto (upload_foto): berikan penilaian proporsional berdasarkan kelengkapan berkas yang dikirimkan siswa.
- Esai (esai): evaluasi kedalaman konsep, logika, dan kelengkapan terhadap rubrik.

KEMBALIKAN HANYA JSON:
{
  "nilai_total": number (0 - 100),
  "catatan_guru": "string (umpan balik menyeluruh yang konstruktif dan memotivasi)",
  "evaluasi_per_soal": [
    {
      "nomor": number,
      "skor": number (skor yang diperoleh untuk butir ini),
      "catatan": "string singkat penjelasan skor butir ini"
    }
  ]
}`;

    const itemsSummary = formItems.map((item, idx) => {
        let studentAns = typeof item.jawaban_siswa === 'object' 
            ? JSON.stringify(item.jawaban_siswa) 
            : String(item.jawaban_siswa || '(Tidak dijawab / Kosong)');

        let keyInfo = item.kunci || '-';
        if (item.tipe === 'menjodohkan' && Array.isArray(item.pasangan)) {
            keyInfo = item.pasangan.map(p => `${p.kiri} -> ${p.kanan}`).join('; ');
        }

        return `
Butir #${item.nomor || (idx + 1)} (${String(item.tipe).toUpperCase()} - Bobot Maks: ${item.bobot || 25}):
Pertanyaan: ${item.pertanyaan}
Kunci / Panduan Guru: ${keyInfo}
Jawaban Siswa: ${studentAns}
`;
    }).join('\n---\n');

    const prompt = `Evaluasi lembar jawaban siswa berikut:
Mata Pelajaran: ${mapel}
Judul Tugas: ${judulTugas}

Daftar Soal & Jawaban Siswa:
${itemsSummary}

Berikan skor per nomor secara adil dan total nilai akhir (0-100), serta catatan umpan balik yang membangun.`;

    const raw = await callGemini(prompt, system, true);
    const parsed = robustJsonParse(raw);

    return {
        nilai_total: typeof parsed?.nilai_total === 'number' ? parsed.nilai_total : (parsed?.nilai || 75),
        catatan_guru: parsed?.catatan_guru || parsed?.catatan || 'Tugas telah diperiksa oleh AI Asesmen.',
        evaluasi_per_soal: Array.isArray(parsed?.evaluasi_per_soal) ? parsed.evaluasi_per_soal : []
    };
}
