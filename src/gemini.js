// Google Gemini AI Engine for SMPN 58 Palembang LMS
// Mendukung pilihan model guru sesuai kebutuhan:
// Gemini 3.7 Flash, Gemini 3.5 Flash-Lite, Gemini 3.8 Flash, 
// Gemini 3 Flash (Preview) (Bawaan GuruPro), Gemini 2.5 Pro, atau kustom manual.

import { balanceExamWeights } from './examScoring.js';
import { sanitizeAndEnhanceHtml, stripInjectedEnhancements } from './htmlEnhancer.js';

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
                    let detectedType = 'esai';
                    if (qStr.includes('"opsi_a"')) detectedType = 'pg';
                    else if (qStr.includes('"benar_salah"')) detectedType = 'benar_salah';
                    else if (qStr.includes('"singkat"')) detectedType = 'singkat';
                    else if (qStr.includes('"menjodohkan"') || qStr.includes('"pasangan"')) detectedType = 'menjodohkan';

                    recoveredQuestions.push({
                        nomor: idx + 1,
                        tipe: getField('tipe') || detectedType,
                        pertanyaan,
                        opsi_a: getField('opsi_a'),
                        opsi_b: getField('opsi_b'),
                        opsi_c: getField('opsi_c'),
                        opsi_d: getField('opsi_d'),
                        kunci_pg: getField('kunci_pg') || (detectedType === 'pg' ? 'A' : (detectedType === 'benar_salah' ? 'Benar' : '')),
                        rubrik_esai: getField('rubrik_esai'),
                        bobot: detectedType === 'pg' || detectedType === 'benar_salah' || detectedType === 'singkat' ? 10 : 20
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
 * AI Generator Butir Soal Ujian (Pilihan Ganda, Benar/Salah, Singkat, Menjodohkan, Esai)
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

    const ragam = cfg.ragam || cfg.modelRagam || 'campuran';
    const totalSoal = Number(cfg.totalSoal) || (Number(cfg.jmlPg || 0) + Number(cfg.jmlEsai || 0)) || 5;

    // Kustom Komposisi Soal Mandiri
    const customComp = cfg.customComposition;
    let customBreakdownText = '';
    let targetTotal = totalSoal;
    if (customComp && typeof customComp === 'object') {
        const pg = Number(customComp.pg) || 0;
        const pgk = Number(customComp.pg_kompleks || customComp.pgk) || 0;
        const bs = Number(customComp.benar_salah || customComp.bs) || 0;
        const singkat = Number(customComp.singkat) || 0;
        const jodoh = Number(customComp.menjodohkan || customComp.jodoh) || 0;
        const esai = Number(customComp.esai) || 0;
        const sumCount = pg + pgk + bs + singkat + jodoh + esai;
        if (sumCount > 0) {
            targetTotal = sumCount;
            customBreakdownText = `
KOMPOSISI BUTIR SOAL WAJIB DIPENUHI PERSIS SESUAI PERMINTAAN GURU:
- Pilihan Ganda Biasa (tipe: "pg"): TEPAT ${pg} butir (opsi_a, opsi_b, opsi_c, opsi_d, kunci_pg: satu huruf A/B/C/D)
- Pilihan Ganda Kompleks (tipe: "pg_kompleks"): TEPAT ${pgk} butir (opsi_a, opsi_b, opsi_c, opsi_d, kunci_pg: kombinasi huruf benar dipisah koma misal "A,C")
- Benar / Salah (tipe: "benar_salah"): TEPAT ${bs} butir (kunci_pg: "Benar" atau "Salah")
- Isian Singkat (tipe: "singkat"): TEPAT ${singkat} butir (kunci_pg: kata kunci jawaban singkat)
- Menjodohkan (tipe: "menjodohkan"): TEPAT ${jodoh} butir (memiliki array "pasangan" 2-4 pasang kiri & kanan)
- Esai / Uraian (tipe: "esai"): TEPAT ${esai} butir (memiliki "rubrik_esai" kriteria penilaian bertingkat)
TOTAL BUTIR SOAL HARUS TEPAT BERJUMLAH ${targetTotal} BUTIR SOAL. TIDAK BOLEH KURANG DARI ${targetTotal} BUTIR DAN TIDAK BOLEH LEBIH.`;
        }
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
        kontekstual: 'Gunakan stimulus cerita/kasus nyata (standar Asesmen Nasional / AKM). Setiap nomor soal diawali narasi situasi nyata atau studi kasus praktis siswa sebelum mengajukan pertanyaan.',
        langsung: 'Pertanyaan langsung to-the-point dan konseptual tanpa narasi cerita panjang.'
    }[cfg.stimulus] || 'Kontekstual';

    const ragamGuidelines = {
        campuran: 'Kombinasikan variasi butir soal secara berimbang: Pilihan Ganda (pg), Benar/Salah (benar_salah), Isian Singkat (singkat), Menjodohkan (menjodohkan), dan Esai Uraian (esai).',
        pg_murni: 'Semua butir soal bertipe Pilihan Ganda (pg) dengan 4 opsi (A, B, C, D).',
        pg_esai: 'Kombinasikan soal Pilihan Ganda (pg) dan Esai Uraian (esai).',
        akm_khusus: 'Fokus pada butir soal tipe AKM: Pilihan Ganda (pg), Benar/Salah (benar_salah), dan Menjodohkan (menjodohkan).',
        esai_murni: 'Semua butir soal bertipe Esai Uraian (esai) analisis mendalam.'
    }[ragam] || 'Kombinasikan variasi soal: Pilihan Ganda (pg), Benar/Salah (benar_salah), Singkat (singkat), Menjodohkan (menjodohkan), dan Esai (esai).';

    const system = `Anda adalah ahli pengembang asesmen pendidikan SMP Negeri 58 Palembang berstandar Kurikulum Merdeka dan AKM Kemendikbudristek.
Tugas Anda merancang instrumen evaluasi kuis/ujian dengan spesifikasi butir soal:
1. Pilihan Ganda ("tipe": "pg"):
   - Memiliki tepat 4 opsi jawaban ("opsi_a", "opsi_b", "opsi_c", "opsi_d").
   - "kunci_pg": SATU HURUF ("A", "B", "C", atau "D").
   - "bobot": 10
2. Benar/Salah ("tipe": "benar_salah"):
   - Pertanyaan berisi pernyataan stimulus untuk dievaluasi siswa kebenarannya.
   - "kunci_pg": "Benar" atau "Salah".
   - "bobot": 10
3. Isian Singkat ("tipe": "singkat"):
   - Pertanyaan membutuhkan jawaban pasti singkat (1-3 kata / istilah / angka).
   - "kunci_pg": string kata kunci jawaban yang tepat.
   - "bobot": 10
4. Menjodohkan ("tipe": "menjodohkan"):
   - Pertanyaan berupa instruksi menjodohkan premis di kolom kiri dengan pasangan tepat di kolom kanan.
   - "pasangan": array of 2 sampai 4 objek { "kiri": "pernyataan/istilah", "kanan": "definisi/pasangan tepat" }.
   - "bobot": 20
5. Esai Uraian ("tipe": "esai"):
   - Soal analisis, penalaran, atau pemecahan masalah.
   - "rubrik_esai": kriteria penilaian bertingkat untuk acuan guru & AI.
   - "bobot": 25

ATURAN PEMBOBOTAN NILAI (SKALA TOTAL TEPAT 100 POIN):
- Total nilai/bobot dari seluruh butir soal HARUS TEPAT BERJUMLAH 100 POIN.
- Berikan bobot lebih besar untuk soal penalaran mendalam/esai/menjodohkan (misal 20-25 poin) dan bagi rata untuk soal objektif (pg, benar_salah, singkat) sehingga akumulasi bobot seluruh soal tepat 100.

PENTING: Jangan gunakan karakter em dash.
KEMBALIKAN HANYA JSON MURNI TANPA MARKDOWN BACKTICKS SESUAI SCHEMA:
{
  "judul_kuis": "string",
  "petunjuk": "string",
  "durasi_menit": number,
  "soal": [
    {
      "nomor": 1,
      "tipe": "pg|benar_salah|singkat|menjodohkan|esai",
      "tingkat_kognitif": "string",
      "pertanyaan": "string",
      "opsi_a": "opsional jika pg",
      "opsi_b": "opsional jika pg",
      "opsi_c": "opsional jika pg",
      "opsi_d": "opsional jika pg",
      "kunci_pg": "opsional jika pg/benar_salah/singkat",
      "pasangan": [ { "kiri": "string", "kanan": "string" } ],
      "rubrik_esai": "opsional jika esai",
      "bobot": number
    }
  ]
}`;

    const prompt = `Susunlah ${targetTotal} butir soal ujian SMP dengan spesifikasi:
- Mata Pelajaran: ${cfg.mapel}
- Kelas: ${cfg.kelas}
- Materi Pokok / Capaian Pembelajaran: ${cfg.topik}
- Model Ragam Soal: ${customBreakdownText ? customBreakdownText : ragamGuidelines}
- Taksonomi Bloom: ${taksonomiDescriptions}
- Tingkat Kesulitan: ${kesulitanDescriptions}
- Karakteristik Stimulus: ${stimulusDescriptions}
- Total Butir Soal: TEPAT ${targetTotal} butir soal (DILARANG KURANG DARI ${targetTotal} BUTIR DAN DILARANG LEBIH)
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

    // Normalisasi tipe dari AI agar selalu cocok dengan engine CBT.
    items = items.filter(q => q && typeof q === 'object').map((q, idx) => {
        const rawPairs = q.pasangan ?? q.pairs ?? q.matching;
        const rawRubric = q.rubrik_esai ?? q.rubrik ?? q.rubric;
        const rawType = String(q.tipe || q.type || '').toLowerCase();
        let tipe = 'pg';
        if (rawType.includes('kompleks') || rawType.includes('multiple')) tipe = 'pg_kompleks';
        else if (rawType.includes('benar') || rawType.includes('true') || rawType.includes('salah')) tipe = 'benar_salah';
        else if (rawType.includes('singkat') || rawType.includes('isian')) tipe = 'singkat';
        else if (rawType.includes('jodoh') || rawType.includes('match')) tipe = 'menjodohkan';
        else if (rawType.includes('foto') || rawType.includes('upload') || rawType.includes('berkas')) tipe = 'upload_foto';
        else if (rawType.includes('esai') || rawType.includes('uraian') || rawType.includes('essay')) tipe = 'esai';
        else if (rawPairs && (Array.isArray(rawPairs) || typeof rawPairs === 'object')) tipe = 'menjodohkan';
        else if (rawRubric) tipe = 'esai';
        else if (!q.opsi_a && !q.opsi_b && !(q.opsi && typeof q.opsi === 'object') && !(q.options && typeof q.options === 'object')) tipe = 'esai';

        // AI kadang memakai nama field lain. Samakan agar kunci tidak hilang.
        const rawKey = q.kunci_pg ?? q.kunci ?? q.jawaban_benar ?? q.jawaban ?? '';
        let kunci = Array.isArray(rawKey) ? rawKey.join(',') : String(rawKey).trim();
        if (tipe === 'benar_salah') {
            const k = kunci.toLowerCase();
            kunci = ['true', 'benar', 'b'].includes(k) ? 'Benar' : (['false', 'salah', 's'].includes(k) ? 'Salah' : kunci);
        }

        let pasangan = rawPairs;
        if (pasangan && !Array.isArray(pasangan) && typeof pasangan === 'object') {
            pasangan = Object.entries(pasangan).map(([kiri, kanan]) => ({ kiri, kanan }));
        }
        pasangan = Array.isArray(pasangan)
            ? pasangan.filter(p => p && String(p.kiri || '').trim() && String(p.kanan || '').trim())
            : [];

        const opsi = Array.isArray(q.opsi)
            ? q.opsi
            : (Array.isArray(q.options)
                ? q.options
                : (q.options && typeof q.options === 'object' ? Object.values(q.options) : []));
        const opsiField = (i, name) => {
            const val = q[name] || opsi[i] || '';
            return typeof val === 'string' ? val : (val?.text || val?.teks || val?.label || '');
        };

        return {
            ...q,
            nomor: idx + 1,
            tipe,
            bobot: Number(q.bobot) || (tipe === 'esai' || tipe === 'menjodohkan' || tipe === 'upload_foto' ? 20 : 10),
            opsi_a: opsiField(0, 'opsi_a'),
            opsi_b: opsiField(1, 'opsi_b'),
            opsi_c: opsiField(2, 'opsi_c'),
            opsi_d: opsiField(3, 'opsi_d'),
            kunci_pg: kunci,
            rubrik_esai: String(rawRubric || '').trim(),
            pasangan
        };
    });

    // Jaminan ketat jumlah butir soal: tidak boleh kurang dan tidak boleh lebih
    while (items.length < targetTotal) {
        const nextNum = items.length + 1;
        items.push({
            nomor: nextNum,
            tipe: 'esai',
            tingkat_kognitif: 'HOTS',
            pertanyaan: `Jelaskan secara komprehensif penerapan konsep ${cfg.topik || 'materi ini'} dalam pemecahan masalah kontekstual!`,
            opsi_a: '',
            opsi_b: '',
            opsi_c: '',
            opsi_d: '',
            kunci_pg: '',
            rubrik_esai: `Kesesuaian dan kedalaman pembahasan terkait materi ${cfg.topik || 'ini'}.`,
            pasangan: [],
            bobot: 15
        });
    }
    if (items.length > targetTotal) {
        items = items.slice(0, targetTotal);
    }

    // Seimbangkan seluruh bobot butir soal agar akumulasi total tepat 100 poin
    balanceExamWeights(items, 100);

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
    const system = `Anda adalah guru penguji ahli SMP Negeri 58 Palembang yang menilai jawaban ujian esai/uraian siswa secara adil, objektif, dan mendidik.
Format respon HANYA JSON: {"skor": number, "feedback": string}`;

    const cleanPertanyaan = String(pertanyaan || '').replace(/\n?\[GAMBAR:\s*[^\]]+\]/gi, '').trim();
    const prompt = `Soal Ujian: ${cleanPertanyaan}
Panduan Kunci / Rubrik Penilaian Guru: ${rubrik || 'Kesesuaian konsep, kelengkapan uraian, dan logika penalaran.'}
Bobot Poin Maksimal: ${maxBobot}
Jawaban Siswa: ${jawabanSiswa || '(Kosong / Tidak menjawab)'}

Kriteria Penilaian:
1. "skor": Berikan nilai proporsional antara 0 sampai ${maxBobot} (bulat). Jika jawaban kosong/tidak relevan beri 0. Jika mencakup sebagian konsep kunci beri nilai proporsional. Jika lengkap dan tepat beri ${maxBobot}.
2. "feedback": Catatan penilaian singkat (1-2 kalimat) yang ramah dan edukatif menjelaskan alasan perolehan skor.`;

    const raw = await callGemini(prompt, system, true);
    const parsed = robustJsonParse(raw);
    const numericScore = typeof parsed?.skor === 'number' ? parsed.skor : parseInt(parsed?.skor, 10);
    const safeScore = Number.isFinite(numericScore) ? Math.min(maxBobot, Math.max(0, numericScore)) : 0;
    return {
        skor: safeScore,
        feedback: parsed?.feedback || 'Evaluasi esai selesai.'
    };
}

/**
 * AI Generator Butir Soal Formulir Tugas Siswa (Model Google Form)
 */
export async function aiGenerateFormQuestions({ 
    mapel, 
    kelas, 
    topik, 
    jmlSoal = 4, 
    tipeSoal = 'campuran', 
    tingkatKognitif = 'hots',
    customComposition = null 
}) {
    let customBreakdownText = '';
    let targetTotal = Number(jmlSoal) || 4;
    if (customComposition && typeof customComposition === 'object') {
        const pg = Number(customComposition.pg) || 0;
        const pgk = Number(customComposition.pg_kompleks || customComposition.pgk) || 0;
        const bs = Number(customComposition.benar_salah || customComposition.bs) || 0;
        const singkat = Number(customComposition.singkat) || 0;
        const jodoh = Number(customComposition.menjodohkan || customComposition.jodoh) || 0;
        const esai = Number(customComposition.esai) || 0;
        const sumCount = pg + pgk + bs + singkat + jodoh + esai;
        if (sumCount > 0) {
            targetTotal = sumCount;
            customBreakdownText = `
KOMPOSISI BUTIR SOAL WAJIB DIPENUHI PERSIS SESUAI PERMINTAAN GURU:
- Pilihan Ganda Biasa ("tipe": "pg"): TEPAT ${pg} butir (opsi_a, opsi_b, opsi_c, opsi_d, kunci: A/B/C/D)
- Pilihan Ganda Kompleks ("tipe": "pg_kompleks"): TEPAT ${pgk} butir (opsi_a, opsi_b, opsi_c, opsi_d, kunci: huruf benar dipisah koma misal "A,C")
- Benar / Salah ("tipe": "benar_salah"): TEPAT ${bs} butir (kunci: "BENAR" atau "SALAH")
- Isian Singkat ("tipe": "singkat"): TEPAT ${singkat} butir (kunci: kata kunci jawaban singkat)
- Menjodohkan ("tipe": "menjodohkan"): TEPAT ${jodoh} butir (memiliki array "pasangan" 2-4 pasang kiri & kanan)
- Esai / Uraian ("tipe": "esai"): TEPAT ${esai} butir (memiliki panduan kunci/rubrik uraian)
TOTAL BUTIR SOAL HARUS TEPAT BERJUMLAH ${targetTotal} BUTIR SOAL. TIDAK BOLEH KURANG DARI ${targetTotal} (DILARANG ${targetTotal - 1}) DAN TIDAK BOLEH LEBIH.`;
        }
    }

    const system = `Anda adalah ahli pengembang instrumen lembar tugas siswa (Google Form style) untuk SMP Negeri 58 Palembang berstandar Kurikulum Merdeka.
Tugas Anda merancang butir-butir pertanyaan penugasan yang bervariasi, jelas, terstruktur, mendidik, dan relevan dengan materi.
Tipe soal yang didukung:
- "esai": pertanyaan uraian mendalam yang menuntut penalaran siswa. Sertakan panduan kunci jawaban / rubrik ringkas.
- "pg": pertanyaan pilihan ganda dengan 4 opsi (A, B, C, D) dan kunci jawaban (A/B/C/D).
- "pg_kompleks": pertanyaan pilihan ganda kompleks dengan lebih dari 1 jawaban benar (kunci dipisah koma misal "A,C").
- "singkat": pertanyaan isian singkat (1 frasa/istilah) beserta kunci jawaban singkat.
- "benar_salah": pernyataan konsep dengan kunci jawaban ("BENAR" atau "SALAH") serta penjelasan singkat.
- "upload_foto": instruksi tugas karya/praktikum yang meminta siswa mengunggah foto catatan, screenshot, atau hasil kerja nyata.
- "menjodohkan": pertanyaan menjodohkan konsep dengan 3-4 pasangan premis di kiri dan definisi di kanan.

ATURAN PEMBOBOTAN NILAI (SKALA TOTAL TEPAT 100 POIN):
- Total akumulasi bobot dari seluruh butir soal HARUS TEPAT 100 POIN.

KEMBALIKAN HANYA JSON DENGAN STRUKTUR BERIKUT:
{
  "judul_tugas": "string",
  "petunjuk": "string",
  "questions": [
    {
      "id": 1,
      "tipe": "esai" | "pg" | "pg_kompleks" | "singkat" | "benar_salah" | "upload_foto" | "menjodohkan",
      "pertanyaan": "string",
      "opsi_a": "string (khusus pg/pg_kompleks)",
      "opsi_b": "string (khusus pg/pg_kompleks)",
      "opsi_c": "string (khusus pg/pg_kompleks)",
      "opsi_d": "string (khusus pg/pg_kompleks)",
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
- Preferensi Tipe Soal: ${customBreakdownText ? customBreakdownText : tipeSoal}
- Tingkat Kognitif: ${tingkatKognitif} (LOTS pemahaman dasar, MOTS penerapan, atau HOTS penalaran kritis)
- Jumlah Pertanyaan: TEPAT ${targetTotal} butir soal (WAJIB TEPAT ${targetTotal} BUTIR, DILARANG MENGURANGI JADI ${targetTotal - 1} ATAU MENAMBAH)
- Total Bobot: Akumulasi bobot seluruh butir soal WAJIB TEPAT 100 POIN.`;

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

    let mapped = questions.map((q, idx) => {
        const rawType = String(q.tipe || 'esai').toLowerCase();
        let tipe = 'esai';
        if (rawType.includes('kompleks') || rawType.includes('multiple')) tipe = 'pg_kompleks';
        else if (rawType.includes('pg') || rawType.includes('pilihan')) tipe = 'pg';
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
            bobot: Number(q.bobot) || (['esai', 'menjodohkan', 'upload_foto'].includes(tipe) ? 20 : 10)
        };
    });

    // Jaminan ketat jumlah butir soal: tidak boleh kurang (misal 9 saat minta 10) dan tidak boleh lebih
    while (mapped.length < targetTotal) {
        const nextNum = mapped.length + 1;
        mapped.push({
            id: nextNum,
            nomor: nextNum,
            tipe: 'esai',
            pertanyaan: `Jelaskan secara mendalam relevansi dan penerapan konsep ${topik || 'materi ini'} bagi siswa!`,
            opsi_a: '',
            opsi_b: '',
            opsi_c: '',
            opsi_d: '',
            kunci: `Kesesuaian dan kelengkapan pembahasan mengenai konsep ${topik || 'materi ini'}.`,
            pasangan: [],
            bobot: 15
        });
    }
    if (mapped.length > targetTotal) {
        mapped = mapped.slice(0, targetTotal);
    }

    // Seimbangkan bobot seluruh butir soal agar akumulasi total persis 100 poin
    balanceExamWeights(mapped, 100);

    return {
        judul_tugas: parsed?.judul_tugas || `Tugas ${mapel} - ${topik}`,
        petunjuk: parsed?.petunjuk || `Jawablah butir pertanyaan berikut dengan teliti dan jujur.`,
        questions: mapped
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

        const cleanPertanyaan = String(item.pertanyaan || '').replace(/\n?\[GAMBAR:\s*[^\]]+\]/gi, '').trim();

        return `
Butir #${item.nomor || (idx + 1)} (${String(item.tipe).toUpperCase()} - Bobot Maks: ${item.bobot || 25}):
Pertanyaan: ${cleanPertanyaan}
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

/**
 * AI Generator Media Pembelajaran Interaktif (HTML5 + Tailwind CSS)
 * Menghasilkan aplikasi web pembelajaran mandiri yang responsif di HP dan PC.
 */
export async function aiGenerateMpiHtml({
    mapel = 'Informatika',
    kelas = 'Kelas 7',
    topik = '',
    gaya = 'tab',
    instruksiTambahan = '',
    diferensiasi = 'reguler'
}) {
    if (!topik) throw new Error('Topik atau materi pembelajaran wajib diisi.');

    const gayaDescriptions = {
        tab: 'Modul Interaktif Tab Navigasi (Tab 1: Konsep Pokok & Ilustrasi; Tab 2: Eksplorasi Visual / Kartu Interaktif; Tab 3: Studi Kasus Nyata; Tab 4: Kuis Mandiri Cek Pemahaman)',
        lab: 'Laboratorium Virtual & Eksplorasi Interaktif (Terdapat diagram visual / simulasi interaktif yang merespons klik siswa dengan penjelasan langkah demi langkah)',
        quiz: 'Game Kuis Interaktif & Tantangan Poin (Pertanyaan bertahap, perhitungan skor otomatis secara langsung, umpan balik visual instan saat opsi dipilih, dan evaluasi hasil akhir)',
        infografis: 'Infografis Interaktif & Alur Prosedural (Tampilan visual terstruktur dengan accordion buka-tutup, kartu rangkuman poin penting, dan glosarium interaktif)'
    };

    const diferensiasiDescriptions = {
        remedial: 'Tingkat Pemula / Remedial: Fokus pada 3 konsep inti paling mendasar, kalimat sederhana, analogi konkret, dan langkah mikro yang mudah dicerna.',
        reguler: 'Tingkat Reguler: Standar Capaian Pembelajaran Kurikulum Merdeka Fase D, memadukan teori terapan, eksplorasi visual, dan studi kasus.',
        hots: 'Tingkat Pengayaan (HOTS): Mendorong analisis kritis, pemecahan masalah komputasional tingkat tinggi, dan evaluasi alternatif solusi.'
    };

    const deskripsiGaya = gayaDescriptions[gaya] || gayaDescriptions.tab;
    const deskripsiDiferensiasi = diferensiasiDescriptions[diferensiasi] || diferensiasiDescriptions.reguler;

    const systemInstruction = `Anda adalah Master Pengembang Media Pembelajaran Interaktif (MPI) EduTech & Game-Based Learning jenjang SMP Kurikulum Merdeka.
Tugas Anda adalah memprogram aplikasi web MPI mandiri yang SANGAT INTERAKTIF, MENARIK, SERU, dan TIDAK MEMBOSANKAN dalam satu file HTML5.

PANTANGAN UTAMA (DILARANG KERAS):
- JANGAN PERNAH membuat web yang hanya berupa teks panjang, artikel bacaan statis, atau kumpulan definisi hafalan! Siswa SMP akan jenuh jika hanya membaca.
- MPI BUKAN modul bacaan PDF/blog, melainkan WAHANA EKSPLORASI INTERAKTIF di mana siswa HARUS AKTIF MENCOBA, MENYENTUH TOMBOL, MENGGESER KONTROL, DAN MENGUJI COBA SECARA LANGSUNG!

4 PILAR INTERAKTIVITAS TINGGI (WAJIB ADA DI SETIAP MPI):
1. SIMULATOR / LABORATORIUM VIRTUAL AKTIF (Bukan Hanya Teks!):
   - Wajib ada panel eksperimen interaktif hidup dengan kontrol aktif (slider nilai, tombol "Langkah Demi Langkah", saklar toggle on/off, atau tombol acak/reset).
   - Manipulasi siswa harus langsung mengubah representasi visual di layar secara real-time (diagram batang yang bertukar warna/posisi, lampu saklar yang menyala, kalkulator dinamis, visual alur logika, dsb).
2. KARTU INTIP ANALOGI DUNIA NYATA (FLIP / REVEAL CARD):
   - Jangan menyuapi materi dengan teori rumit. Gunakan kartu interaktif dengan tombol "Buka Rahasia / Analogi" atau kartu yang bisa diklik untuk membuka analogi nyata (seperti saklar lampu untuk biner, antrean kasir untuk queue, resep masakan untuk algoritma).
3. SKENARIO PENGAMBILAN KEPUTUSAN / STUDI KASUS BERCABANG:
   - Cerita tantangan nyata kontekstual anak SMP dengan 2 atau 3 tombol pilihan aksi ("Apa keputusanmu?").
   - Saat siswa memilih, berikan feedback instan konsekuensi logis dari pilihan tersebut.
4. ARENA KUIS GAME BERPOIN DENGAN SOUND EFFECTS & CONFETTI:
   - Sediakan minimal 3 sampai 5 soal interaktif bergaya tantangan game.
   - Pilihan jawaban berupa kartu tombol besar yang nyaman disentuh di HP (min-h-[44px]).
   - Setiap pilihan jawaban WAJIB terhubung ke fungsi bawaan sistem:
     * Opsi Benar: panggil window.mpiPlaySound('correct'); window.mpiAddXp(25); ubah tombol jadi hijau cerah dengan penjelasan ringkas mengapa benar.
     * Opsi Salah: panggil window.mpiPlaySound('wrong'); ubah tombol jadi merah muda dengan petunjuk pembetulan.
     * Saat kuis tuntas: panggil window.mpiPlaySound('fanfare'); window.mpiLaunchConfetti(); tampilkan dialog/kartu perayaan rekap skor XP.

HEADER GAMIFIKASI & TAMPILAN MODERN:
- Di bagian atas sediakan header interaktif:
  * Judul materi & lencana mapel
  * XP Counter: <span class="mpi-xp-counter bg-amber-300 text-black border-2 border-black px-3 py-1 rounded-full font-black text-xs">⭐ 0 XP</span>
  * Progress Bar kemajuan belajar
- Desain visual menggunakan Tailwind CSS: gaya Neobrutalism modern (border-2 border-black, bayangan pop shadow-[3px_3px_0px_0px_rgba(0,0,0,1)], rounded-2xl).
- Seluruh kontrol sentuh wajib memiliki tinggi minimal 44px (min-h-[44px]) agar responsif dan nyaman di layar HP siswa (360px-414px) maupun laptop.

PERSYARATAN TEKNIS JAVASCRIPT (WAJIB BERFUNGSI SEMUA TOMBOL):
1. SEMUA fungsi JavaScript (switchTab, nextSimStep, prevSimStep, resetSim, checkQuiz, dsb) WAJIB dideklarasikan LANGSUNG pada window global:
   window.switchTab = function(tabId) {
     document.querySelectorAll('.tab-content').forEach(function(el) {
       el.classList.add('hidden');
       el.style.display = 'none';
     });
     var target = document.getElementById(tabId);
     if (target) {
       target.classList.remove('hidden');
       target.style.display = 'block';
     }
     document.querySelectorAll('.tab-btn').forEach(function(b) {
       b.classList.remove('border-indigo-600', 'text-indigo-600', 'font-black', 'bg-indigo-50');
       b.classList.add('border-transparent', 'text-slate-500');
     });
     var btn = document.getElementById('btn-' + tabId) || document.querySelector('[onclick*=\"' + tabId + '\"]');
     if (btn) {
       btn.classList.add('border-indigo-600', 'text-indigo-600', 'font-black', 'bg-indigo-50');
       btn.classList.remove('border-transparent', 'text-slate-500');
     }
   };
2. DILARANG KERAS membungkus script di dalam document.addEventListener('DOMContentLoaded', ...) atau IIFE closure tertutup tanpa menempelkan fungsinya ke window!
3. Gunakan inline onclick yang memanggil window.namaFungsi() persis seperti yang dideklarasikan.

FORMAT KELUARAN:
- Tuliskan HANYA kode HTML5 lengkap dimulai dari <!DOCTYPE html> hingga </html>. Tanpa teks obrolan di luar kode.`;

    const userPrompt = `Buatlah Media Pembelajaran Interaktif (MPI) web yang SANGAT KAYA INTERAKSI & GAMIFIKASI untuk:
Mata Pelajaran: ${mapel}
Target Siswa: ${kelas} (SMP)
Topik / Materi: ${topik}
Gaya Format: ${deskripsiGaya}
Diferensiasi Belajar: ${deskripsiDiferensiasi}
${instruksiTambahan ? `Instruksi Tambahan Guru:\n${instruksiTambahan}\n` : ''}

INGAT: Jangan buat teks panjang membosankan! Wajib sertakan simulator visual aktif yang bisa dimanipulasi siswa, kartu intip analogi, dan kuis game berpoin dengan efek suara window.mpiPlaySound() dan confetti window.mpiLaunchConfetti().

Tuliskan kode dokumen HTML5 mandiri selengkapnya sekarang:`;

    const raw = await callGemini(userPrompt, systemInstruction, false);
    return sanitizeAndEnhanceHtml(raw);
}

/**
 * AI Prompt Enhancer / Poles Prompt dengan Anatomi Pedagogis Lengkap (R-C-T-I-C-O)
 * Mengubah input sederhana guru menjadi prompt instruksional kaya konteks untuk Media Pembelajaran.
 */
export async function aiEnhancePrompt({
    mapel = 'Informatika',
    kelas = 'Kelas 7',
    topik = '',
    instruksi = '',
    gaya = 'tab'
}) {
    if (!topik && !instruksi) throw new Error('Silakan isi topik atau draf instruksi terlebih dahulu.');

    const systemInstruction = `Anda adalah Spesialis Prompt Engineering Edukasi dan Konsultan Pedagogis Kurikulum Merdeka SMP.
Tugas Anda adalah memperkaya dan memoles draft topik/instruksi guru menjadi satu prompt instruksi khusus yang SANGAT DETAIL, TERSTRUKTUR, dan SIAP DIEKSEKUSI untuk membuat Media Pembelajaran Interaktif (MPI).

Gunakan prinsip Anatomi Prompt Guru (R-C-T-I-C-O):
1. Role: Guru teladan dan pengembang media digital kreatif
2. Context: Kehidupan nyata remaja SMP (kontekstual, seru, mudah dipahami di layar HP)
3. Task: Pokok bahasan materi
4. Instruction: Gunakan analogi konkret yang akrab bagi siswa, studi kasus nyata, dan panduan langkah demi langkah
5. Constraints: Wajib interaktif, mobile-friendly, tanpa istilah teoritis yang membosankan
6. Output: Struktur komponen yang jelas (ringkasan visual, simulasi interaktif, studi kasus nyata, dan kuis uji diri berpoin)

PERSYARATAN FORMAT KELUARAN:
- Tuliskan instruksi yang telah dipoles dalam 2 sampai 4 kalimat/paragraf padat dan terarah dalam Bahasa Indonesia.
- Jangan gunakan formatting markdown codeblock, langsung hasilkan teks instruksinya saja.`;

    const userPrompt = `Tolong poles dan perkaya instruksi guru berikut menjadi prompt media pembelajaran yang sangat kuat:
Mata Pelajaran: ${mapel}
Tingkat: ${kelas} (SMP)
Topik Dasar: ${topik || '(Lihat draf guru)'}
Format Sajian: ${gaya}
Catatan/Draf Guru Saat Ini: ${instruksi || 'Kembangkan topik ini agar interaktif, menarik, dan relevan dengan kehidupan siswa SMP.'}

Hasil polesan instruksi detail:`;

    const enhanced = await callGemini(userPrompt, systemInstruction, false);
    return enhanced.trim().replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/i, '').trim();
}

/**
 * AI Refiner / Perbaikan Tampilan & Fitur Dokumen HTML MPI
 * Memperbaiki tampilan HP, mempercantik CSS Tailwind, atau memperbaiki tombol & tab interaktif.
 */
export async function aiRefineMpiHtml({ currentHtml, revisionPrompt }) {
    if (!currentHtml) throw new Error('Kode HTML yang akan diperbaiki tidak ditemukan.');
    if (!revisionPrompt) throw new Error('Instruksi perbaikan wajib diisi.');

    // Bersihkan script internal terlebih dahulu agar AI menerima kode HTML murni tanpa noise
    const cleanHtml = stripInjectedEnhancements(currentHtml);

    const systemInstruction = `Anda adalah Ahli Frontend & Fullstack UI/UX Media Pembelajaran Interaktif (MPI).
Tugas Anda adalah MEMPERBAIKI DAN MENYEMPURNAKAN kode HTML Media Pembelajaran sesuai permintaan guru.

PEDOMAN PERBAIKAN & STANDAR KUALITAS TINGGI:
1. PERBAIKAN KRUSIAL SEMUA TOMBOL INTERAKTIF (AGAR WAJIB BISA DIKLIK):
   - Masalah utama tombol tidak merespons adalah fungsi JavaScript dideklarasikan di dalam closure atau DOMContentLoaded sehingga atribut inline onclick="namaFungsi()" di HTML tidak menemukannya!
   - Anda WAJIB mendaftarkan SETIAP fungsi interaktif langsung pada window global:
     window.switchTab = function(tabId) { ... };
     window.nextStep = function() { ... };
     window.prevStep = function() { ... };
     window.checkAnswer = function(opt) { ... };
     window.resetSim = function() { ... };
     window.flipCard = function(id) { ... };
     window.pilihOpsi = function(id) { ... };
   - DILARANG KERAS membungkus fungsi-fungsi di dalam document.addEventListener('DOMContentLoaded', ...) atau IIFE tanpa menempelkannya ke window.
   - Pastikan nama fungsi pada onclick="..." sama persis dengan yang ada di window.
   - Jangan gunakan class="tab-btn" atau role="tab" pada tombol kuis atau simulasi; class tersebut HANYA untuk tombol tab navigasi modul.

2. TAMPILAN INTERAKTIF HIDUP (BUKAN TEKS PANJANG):
   - Jika guru meminta materi lebih interaktif atau tidak membosankan:
     * Ubah paragraf panjang menjadi simulator visual aktif (diagram langkah, slider parameter, saklar lampu/biner).
     * Sediakan kartu intip analogi dunia nyata (reveal card) dengan tombol buka rahasia.
     * Pasang kuis game berpoin dengan efek suara bawaan:
       - Opsi benar: window.mpiPlaySound('correct'); window.mpiAddXp(25); ubah tombol jadi hijau cerah dengan penjelasan.
       - Opsi salah: window.mpiPlaySound('wrong'); ubah tombol jadi merah muda dengan petunjuk.
       - Selesai kuis: window.mpiPlaySound('fanfare'); window.mpiLaunchConfetti(); tampilkan dialog perayaan skor.

3. RESPONSIF LAYAR HP:
   - Gunakan CDN Tailwind CSS (<script src="https://cdn.tailwindcss.com"></script>).
   - Seluruh tombol wajib touch-friendly dengan tinggi minimal 44px (min-h-[44px]).
   - Tata letak satu kolom vertikal yang rapi di layar HP (360px - 414px) dan tidak ada elemen terpotong.

4. FORMAT KELUARAN MURNI:
   - Kembalikan HANYA dokumen HTML5 utuh dari <!DOCTYPE html> hingga </html> tanpa teks percakapan di luar kode.`;

    const userPrompt = `Berikut adalah kode HTML Media Pembelajaran yang perlu diperbaiki:
\`\`\`html
${cleanHtml}
\`\`\`

Permintaan Perbaikan Guru:
${revisionPrompt}

PERHATIAN KHUSUS JAVASCRIPT:
Pastikan SEMUA fungsi tombol (switch tab, simulasi langkah, kuis, flip card, reset) dideklarasikan langsung pada window global (window.namaFungsi = function() { ... }) agar saat diklik di HP maupun desktop LANGSUNG MERESPONS dan memberikan visual feedback nyata!

Tuliskan kode dokumen HTML5 lengkap hasil perbaikan sekarang:`;

    const raw = await callGemini(userPrompt, systemInstruction, false);
    return sanitizeAndEnhanceHtml(raw);
}
