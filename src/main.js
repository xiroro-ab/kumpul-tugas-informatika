import { supabase } from './supabase.js';
import { fetchStudentsFromDB, getCachedStudents } from './rosterData.js';

let rosterStudents = [];
let allAssignments = [];
let allMaterials = [];
let allQuizzes = [];
let studentFiles = [];
let studentQuizzes = [];
let studentQuizSubmissions = [];
let currentAssignmentStatusFilter = 'all';
let activeQuizData = null;
let quizTimerInterval = null;
let currentSubmissionMode = 'file';
let currentFormQuestions = [];

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function splitQuestionImage(text) {
    if (!text || typeof text !== 'string') {
        return { text: text || '', gambar_url: '' };
    }
    const match = text.match(/\n?\[GAMBAR:\s*([^\]]+)\]/i);
    if (match) {
        return {
            text: text.replace(/\n?\[GAMBAR:\s*([^\]]+)\]/i, '').trim(),
            gambar_url: match[1].trim()
        };
    }
    return { text, gambar_url: '' };
}

export function parseQuizConfig(petunjukRaw, quizObj = {}) {
    const base = {
        violation_limit: 3,
        fullscreen: true,
        token: (quizObj.token || '').toString().trim().toUpperCase(),
        token_required: quizObj.token_required !== undefined ? !!quizObj.token_required : !!(quizObj.token || '').toString().trim()
    };

    if (!petunjukRaw || typeof petunjukRaw !== 'string') {
        return {
            cleanPetunjuk: petunjukRaw || '',
            config: base
        };
    }
    const match = petunjukRaw.match(/\[CONFIG:\s*(\{.*?\})\s*\]/);
    if (match) {
        try {
            const config = JSON.parse(match[1]);
            const cleanPetunjuk = petunjukRaw.replace(/\[CONFIG:\s*\{.*?\}\s*\]/, '').trim();
            const tokenVal = (quizObj.token || config.token || '').toString().trim().toUpperCase();
            const tokenReq = quizObj.token_required !== undefined 
                ? !!quizObj.token_required 
                : (config.token_required !== undefined ? !!config.token_required : (tokenVal.length > 0));

            return {
                cleanPetunjuk,
                config: {
                    violation_limit: config.violation_limit !== undefined ? config.violation_limit : 3,
                    fullscreen: config.fullscreen !== undefined ? config.fullscreen : true,
                    token: tokenVal,
                    token_required: tokenReq
                }
            };
        } catch (_) {}
    }
    return {
        cleanPetunjuk: petunjukRaw,
        config: base
    };
}

export function parseAssignmentQuestions(assignment) {
    if (!assignment || !assignment.deskripsi) {
        return { petunjuk: '', questions: [], tipe_pengumpulan: 'bebas' };
    }
    const raw = String(assignment.deskripsi).trim();
    let tipePengumpulan = '';
    let petunjuk = '';
    let qList = [];

    if (raw.startsWith('{') || raw.startsWith('[')) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                qList = parsed;
            } else if (parsed && typeof parsed === 'object') {
                petunjuk = parsed.petunjuk || '';
                tipePengumpulan = parsed.tipe_pengumpulan || '';
                if (Array.isArray(parsed.questions)) {
                    qList = parsed.questions;
                }
            }
            if (qList.length > 0) {
                qList.forEach(q => {
                    if (!q.gambar_url && q.pertanyaan) {
                        const s = splitQuestionImage(q.pertanyaan);
                        if (s.gambar_url) {
                            q.pertanyaan = s.text;
                            q.gambar_url = s.gambar_url;
                        }
                    }
                });
            }
        } catch (_) {}
    } else {
        const s = splitQuestionImage(raw);
        petunjuk = s.text;
    }

    // Auto-deteksi tipe pengumpulan jika belum tersimpan di JSON
    if (!tipePengumpulan) {
        const combined = `${assignment.judul_tugas || ''} ${petunjuk || ''} ${raw}`.toLowerCase();
        if (combined.includes('hanya menerima link') || combined.includes('kirim link') || combined.includes('tautan link') || combined.includes('link tugas')) {
            tipePengumpulan = 'link';
        } else if (combined.includes('unggah berkas') || combined.includes('upload file') || combined.includes('upload berkas')) {
            tipePengumpulan = 'file';
        } else if (qList.length > 0 && !(qList.length === 1 && (!qList[0].pertanyaan || qList[0].pertanyaan.trim() === ''))) {
            tipePengumpulan = 'form';
        } else {
            tipePengumpulan = 'bebas';
        }
    }

    return { petunjuk, questions: qList, tipe_pengumpulan: tipePengumpulan };
}

export function detectPlatform(url) {
    const u = String(url || '').toLowerCase();
    if (u.includes('canva.com')) return { name: 'Canva', bg: 'bg-teal-100 text-teal-800 border-teal-300' };
    if (u.includes('docs.google.com') || u.includes('drive.google.com')) return { name: 'Google Docs/Drive', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
    if (u.includes('instagram.com')) return { name: 'Instagram Reels', bg: 'bg-pink-100 text-pink-800 border-pink-300' };
    if (u.includes('tiktok.com')) return { name: 'TikTok', bg: 'bg-stone-200 text-stone-900 border-stone-400' };
    if (u.includes('scratch.mit.edu')) return { name: 'Scratch MIT', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
    if (u.includes('youtube.com') || u.includes('youtu.be')) return { name: 'YouTube', bg: 'bg-red-100 text-red-800 border-red-300' };
    return { name: 'Tautan Web', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
}

window.handleStudentLinkInput = (input, qNum) => {
    const val = input.value.trim();
    const badge = document.getElementById(`student_link_badge_q_${qNum}`);
    if (badge) {
        if (val.length > 5) {
            const detected = detectPlatform(val);
            badge.textContent = detected.name;
            badge.className = `text-[10px] font-black px-2 py-0.5 rounded-full border inline-block ${detected.bg}`;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
};

export function isClassMatch(targetKelas, studentKelas) {
    if (!targetKelas || !studentKelas) return true;
    const target = String(targetKelas).trim().toLowerCase();
    const student = String(studentKelas).trim().toLowerCase();

    if (target === '' || target === 'semua' || target === 'semua kelas' || (target.includes('semua') && !target.match(/[789]|vii|viii|ix/))) {
        return true;
    }

    const getGradeLevel = (str) => {
        if (str.includes('9') || str.includes('ix')) return '9';
        if (str.includes('8') || str.includes('viii')) return '8';
        if (str.includes('7') || str.includes('vii')) return '7';
        return '';
    };

    const studentLevel = getGradeLevel(student);
    const isLevelTarget = (
        target.includes('semua kelas 7') || target.includes('semua kelas vii') || target === 'kelas 7' || target === 'kelas vii' || target === '7' || target === 'vii' ||
        target.includes('semua kelas 8') || target.includes('semua kelas viii') || target === 'kelas 8' || target === 'kelas viii' || target === '8' || target === 'viii' ||
        target.includes('semua kelas 9') || target.includes('semua kelas ix') || target === 'kelas 9' || target === 'kelas ix' || target === '9' || target === 'ix'
    );

    if (isLevelTarget) {
        return studentLevel === getGradeLevel(target);
    }

    const cleanTarget = target.replace(/kelas/g, '').trim();
    const cleanStudent = student.replace(/kelas/g, '').trim();
    return cleanTarget === cleanStudent;
}

window.handleStudentFilePreview = (qNum, inputEl) => {
    if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
    const file = inputEl.files[0];
    const nameEl = document.getElementById(`student_file_name_q_${qNum}`);
    const prevEl = document.getElementById(`student_preview_q_${qNum}`);

    if (nameEl) {
        nameEl.innerText = `Berkas terpilih: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        nameEl.classList.remove('hidden');
    }

    if (file.type.startsWith('image/') && prevEl) {
        const reader = new FileReader();
        reader.onload = (e) => {
            prevEl.innerHTML = `<img src="${e.target.result}" class="max-h-48 rounded-xl border-2 border-black object-contain bg-white mt-1.5" />`;
            prevEl.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
};

function renderStudentFormQuestions(questions, previousAnswersMap = {}, isReadOnly = false) {
    const container = document.getElementById('student-form-questions-list');
    if (!container) return;
    container.innerHTML = '';

    if (isReadOnly) {
        const lockedBanner = document.createElement('div');
        lockedBanner.className = "p-3.5 bg-amber-100 border-2 border-black rounded-2xl text-xs font-black text-amber-950 flex items-center gap-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
        lockedBanner.innerHTML = `
            <span class="text-2xl"></span>
            <div>
                <div class="font-black uppercase tracking-wider">Formulir Terkunci &bull; 1x Pengisian Selesai</div>
                <div class="text-[11px] font-bold text-amber-900 mt-0.5">Anda sudah mengumpulkan formulir tugas ini. Sesuai ketentuan, setiap siswa hanya berhak mengirimkan 1 kali jawaban.</div>
            </div>
        `;
        container.appendChild(lockedBanner);
    }

    questions.forEach((q, idx) => {
        const qNum = q.nomor || (idx + 1);
        const prevAnswer = previousAnswersMap[qNum] || '';
        const tipe = q.tipe || 'esai';
        const isPg = tipe === 'pg' || tipe === 'pilihan_ganda';
        const isPgKompleks = tipe === 'pg_kompleks';
        const isBs = tipe === 'benar_salah';
        const isFoto = tipe === 'upload_foto';
        const isLink = tipe === 'link';
        const isMatch = tipe === 'menjodohkan';
        const isSingkat = tipe === 'singkat' || tipe === 'isian_singkat';

        const card = document.createElement('div');
        card.className = "bg-white border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3";

        let typeLabel = 'Esai / Uraian';
        let typeBadgeClass = 'bg-purple-100 text-purple-900 border-purple-300';
        if (isPg) {
            typeLabel = 'Pilihan Ganda';
            typeBadgeClass = 'bg-blue-100 text-blue-900 border-blue-300';
        } else if (isPgKompleks) {
            typeLabel = 'Pilihan Ganda Kompleks';
            typeBadgeClass = 'bg-cyan-100 text-cyan-900 border-cyan-300';
        } else if (isBs) {
            typeLabel = 'Benar / Salah';
            typeBadgeClass = 'bg-teal-100 text-teal-900 border-teal-300';
        } else if (isLink) {
            typeLabel = 'Tautan Link URL';
            typeBadgeClass = 'bg-pink-100 text-pink-900 border-pink-300';
        } else if (isFoto) {
            typeLabel = 'Upload Foto / Bukti';
            typeBadgeClass = 'bg-orange-100 text-orange-900 border-orange-300';
        } else if (isMatch) {
            typeLabel = 'Menjodohkan';
            typeBadgeClass = 'bg-pink-100 text-pink-900 border-pink-300';
        } else if (isSingkat) {
            typeLabel = 'Isian Singkat';
            typeBadgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-300';
        }

        let inputHtml = '';
        if (isPg || isPgKompleks) {
            const optA = q.opsi_a || q.opsi?.A || '';
            const optB = q.opsi_b || q.opsi?.B || '';
            const optC = q.opsi_c || q.opsi?.C || '';
            const optD = q.opsi_d || q.opsi?.D || '';
            const options = [
                { key: 'A', text: optA },
                { key: 'B', text: optB },
                { key: 'C', text: optC },
                { key: 'D', text: optD }
            ].filter(o => o.text || o.key === 'A' || o.key === 'B');

            const disabledAttr = isReadOnly ? 'disabled' : '';
            const cursorStyle = isReadOnly ? 'cursor-not-allowed opacity-90' : 'cursor-pointer';
            const prevKeys = isPgKompleks 
                ? (Array.isArray(prevAnswer) ? prevAnswer : String(prevAnswer || '').split(',').map(s => s.trim().toUpperCase()))
                : [String(prevAnswer || '').toUpperCase()];

            inputHtml = `
                <div class="space-y-2 pt-1">
                    ${isPgKompleks ? '<p class="text-[11px] font-bold text-slate-500 mb-1">Pilihlah satu atau lebih opsi jawaban yang benar:</p>' : ''}
                    ${options.map(opt => {
                        const isChecked = prevKeys.includes(opt.key) ? 'checked' : '';
                        const inputType = isPgKompleks ? 'checkbox' : 'radio';
                        return `
                            <label class="flex items-start gap-3 p-3 rounded-xl border-2 border-black bg-slate-50 ${isReadOnly ? '' : 'hover:bg-indigo-50'} ${cursorStyle} transition select-none has-[:checked]:bg-indigo-100 has-[:checked]:border-indigo-600">
                                <input type="${inputType}" name="student_q_${qNum}" value="${opt.key}" ${isChecked} ${disabledAttr} ${isPgKompleks ? '' : 'required'} class="w-4 h-4 mt-0.5 accent-indigo-600 shrink-0">
                                <div class="text-xs font-bold text-slate-800 leading-snug">
                                    <span class="font-black text-indigo-700 mr-1">${opt.key}.</span> ${escapeHtml(opt.text)}
                                </div>
                            </label>
                        `;
                    }).join('')}
                </div>
            `;
        } else if (isBs) {
            const isBenar = String(prevAnswer).toUpperCase() === 'BENAR';
            const isSalah = String(prevAnswer).toUpperCase() === 'SALAH';
            const disabledAttr = isReadOnly ? 'disabled' : '';
            const cursorStyle = isReadOnly ? 'cursor-not-allowed opacity-90' : 'cursor-pointer';

            inputHtml = `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <label class="flex items-center gap-3 p-3 rounded-xl border-2 border-black bg-slate-50 ${isReadOnly ? '' : 'hover:bg-teal-50'} ${cursorStyle} transition select-none has-[:checked]:bg-teal-100 has-[:checked]:border-teal-700">
                        <input type="radio" name="student_q_${qNum}" value="BENAR" ${isBenar ? 'checked' : ''} ${disabledAttr} required class="w-4 h-4 accent-teal-600 shrink-0">
                        <span class="text-xs font-black text-teal-950">BENAR (Sesuai)</span>
                    </label>
                    <label class="flex items-center gap-3 p-3 rounded-xl border-2 border-black bg-slate-50 ${isReadOnly ? '' : 'hover:bg-red-50'} ${cursorStyle} transition select-none has-[:checked]:bg-red-100 has-[:checked]:border-red-700">
                        <input type="radio" name="student_q_${qNum}" value="SALAH" ${isSalah ? 'checked' : ''} ${disabledAttr} required class="w-4 h-4 accent-red-600 shrink-0">
                        <span class="text-xs font-black text-red-950">SALAH (Tidak Sesuai)</span>
                    </label>
                </div>
            `;
        } else if (isFoto) {
            const hasPrev = prevAnswer && String(prevAnswer).startsWith('http');
            if (isReadOnly) {
                inputHtml = `
                    <div class="p-3.5 bg-slate-50 border-2 border-black rounded-xl space-y-2">
                        ${hasPrev ? `
                            <div class="text-xs font-black text-emerald-800">
                                Berkas tersimpan: <a href="${escapeHtml(prevAnswer)}" target="_blank" class="underline text-indigo-700">Lihat Berkas Foto</a>
                            </div>
                            <img src="${escapeHtml(prevAnswer)}" class="max-h-48 rounded-xl border border-black object-contain bg-white" />
                        ` : '<p class="text-xs font-bold text-slate-500 italic">Tidak ada berkas foto yang diunggah.</p>'}
                    </div>
                `;
            } else {
                inputHtml = `
                    <div class="space-y-2 pt-1">
                        <div class="border-2 border-dashed border-black rounded-xl p-4 bg-orange-50/50 hover:bg-orange-50 transition text-center cursor-pointer" onclick="document.getElementById('student_file_q_${qNum}').click()">
                            <input type="file" id="student_file_q_${qNum}" accept="image/*,.pdf,.doc,.docx" class="hidden" onchange="window.handleStudentFilePreview(${qNum}, this)">
                            <div class="flex flex-col items-center gap-1.5">
                                <span class="text-2xl"></span>
                                <span class="text-xs font-black uppercase text-black">Pilih / Unggah Berkas Foto Pekerjaan</span>
                                <span class="text-[10px] text-slate-600 font-bold">Maksimal 10MB (Foto, Tangkapan Layar, atau PDF)</span>
                            </div>
                        </div>
                        <div id="student_file_name_q_${qNum}" class="text-xs font-black text-emerald-800 ${hasPrev ? '' : 'hidden'}">
                            ${hasPrev ? `Berkas tersimpan sebelumnya: <a href="${escapeHtml(prevAnswer)}" target="_blank" class="underline text-indigo-700">Buka Berkas Anda</a>` : ''}
                        </div>
                        <div id="student_preview_q_${qNum}" class="${hasPrev ? '' : 'hidden'} mt-1.5">
                            ${hasPrev ? `<img src="${escapeHtml(prevAnswer)}" class="max-h-48 rounded-xl border-2 border-black object-contain bg-white" />` : ''}
                        </div>
                    </div>
                `;
            }
        } else if (isMatch) {
            const pairs = Array.isArray(q.pasangan) ? q.pasangan : [];
            const rightChoices = pairs.map(p => p.kanan).filter(Boolean);
            const prevMatches = (typeof prevAnswer === 'object' && prevAnswer !== null) ? prevAnswer : {};
            const disabledAttr = isReadOnly ? 'disabled' : '';

            inputHtml = `
                <div class="space-y-2.5 pt-1">
                    <p class="text-[11px] font-bold text-slate-600">Jodohkan setiap pernyataan di sebelah kiri dengan pilihan yang tepat di sebelah kanan:</p>
                    ${pairs.map((p, pIdx) => {
                        const chosenVal = prevMatches[p.kiri] || '';
                        return `
                            <div class="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-xl border-2 border-black bg-slate-50">
                                <div class="sm:w-1/2 font-bold text-xs text-black">
                                    <span class="font-black text-pink-700 mr-1.5">${pIdx + 1}.</span> ${escapeHtml(p.kiri)}
                                </div>
                                <div class="sm:w-1/2">
                                    <select name="student_match_${qNum}_${pIdx}" data-premise="${escapeHtml(p.kiri)}" ${disabledAttr} required class="w-full h-9 px-2.5 rounded-lg border-2 border-black ${isReadOnly ? 'bg-slate-100 cursor-not-allowed' : 'bg-white cursor-pointer'} font-bold text-xs">
                                        <option value="">-- Pilih Pasangan --</option>
                                        ${rightChoices.map(opt => `
                                            <option value="${escapeHtml(opt)}" ${chosenVal === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else if (isLink) {
            const prevUrl = prevAnswer || '';
            const detected = detectPlatform(prevUrl);
            inputHtml = `
                <div class="space-y-2 pt-1">
                    <input type="url" name="student_q_${qNum}" value="${escapeHtml(prevUrl)}" ${isReadOnly ? 'readonly disabled' : ''} required placeholder="https://... (Tempel tautan Instagram, TikTok, YouTube, Canva, Google Drive, dll)" oninput="window.handleStudentLinkInput(this, ${qNum})" class="w-full h-10 px-3 rounded-xl border-2 border-black ${isReadOnly ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50 focus:bg-white'} font-bold text-xs outline-none">
                    <div id="student_link_badge_q_${qNum}" class="${prevUrl ? '' : 'hidden'} text-[10px] font-black px-2 py-0.5 rounded-full border inline-block ${detected.bg}">
                        ${detected.name}
                    </div>
                </div>
            `;
        } else if (isSingkat) {
            inputHtml = `
                <div class="pt-1">
                    <input type="text" name="student_q_${qNum}" value="${escapeHtml(prevAnswer)}" ${isReadOnly ? 'readonly disabled' : ''} required placeholder="Ketikkan jawaban singkat Anda di sini..." class="w-full h-10 px-3 rounded-xl border-2 border-black ${isReadOnly ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50 focus:bg-white'} font-bold text-xs outline-none">
                </div>
            `;
        } else {
            // esai
            inputHtml = `
                <div class="pt-1 space-y-1">
                    <textarea name="student_q_${qNum}" rows="4" ${isReadOnly ? 'readonly disabled' : ''} required placeholder="Tuliskan jawaban uraian/penjelasan Anda secara lengkap di sini..." class="w-full p-3 rounded-xl border-2 border-black ${isReadOnly ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50 focus:bg-white'} font-medium text-xs outline-none resize-y">${escapeHtml(prevAnswer)}</textarea>
                    ${isReadOnly ? '' : '<p class="text-[10px] text-slate-500 font-bold ml-1">Ketikkan penjelasan selengkap mungkin agar evaluasi AI dan guru lebih akurat.</p>'}
                </div>
            `;
        }

        const { text: cleanPertanyaan, gambar_url: parsedImg } = splitQuestionImage(q.pertanyaan || '');
        const imgUrl = q.gambar_url || parsedImg;

        card.innerHTML = `
            <div class="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 flex-wrap">
                <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-lg bg-black text-white font-black text-xs flex items-center justify-center">
                        ${qNum}
                    </span>
                    <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded border ${typeBadgeClass}">
                        ${typeLabel}
                    </span>
                </div>
                <span class="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                    Bobot: ${q.bobot || 10} Poin
                </span>
            </div>
            <div class="text-xs font-black text-slate-900 leading-relaxed whitespace-pre-line">
                ${escapeHtml(cleanPertanyaan)}
            </div>
            ${imgUrl ? `
                <div class="my-2.5 p-2 border-2 border-black rounded-xl bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] max-w-lg">
                    <a href="${escapeHtml(imgUrl)}" target="_blank" title="Klik untuk memperbesar gambar">
                        <img src="${escapeHtml(imgUrl)}" alt="Gambar Soal ${qNum}" class="max-h-72 w-auto object-contain rounded-lg border border-slate-300 mx-auto hover:opacity-95 transition" />
                    </a>
                    <div class="mt-1 px-1 text-center text-[10px] font-bold text-slate-500 flex justify-between items-center">
                        <span>Stimulus / Ilustrasi Soal</span>
                        <span class="text-indigo-600 underline">Buka Ukuran Penuh</span>
                    </div>
                </div>
            ` : ''}
            ${inputHtml}
        `;

        container.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', async () => {

    // Helper Modal Alert/Confirm Neobrutalisme (Standard LMS SMPN 58)
    window.showCustomModal = (message, type = 'alert', title = 'Pemberitahuan', icon = '') => {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-modal');
            const titleEl = document.getElementById('custom-modal-title');
            const iconEl = document.getElementById('custom-modal-icon');
            const msgEl = document.getElementById('custom-modal-message');
            const actionsEl = document.getElementById('custom-modal-actions');
            if (!modal) {
                resolve(true);
                return;
            }

            if (titleEl) titleEl.innerText = title;
            if (iconEl) iconEl.innerText = icon;
            if (msgEl) msgEl.innerText = message;
            if (actionsEl) {
                actionsEl.innerHTML = '';
                if (type === 'confirm') {
                    const cancelBtn = document.createElement('button');
                    cancelBtn.className = "bg-white border-2 border-black text-black font-black py-2.5 px-5 rounded-xl hover:bg-slate-100 transition text-xs uppercase tracking-wider";
                    cancelBtn.innerText = "Batal";
                    cancelBtn.onclick = () => {
                        modal.classList.add('hidden');
                        modal.classList.remove('flex');
                        resolve(false);
                    };

                    const confirmBtn = document.createElement('button');
                    confirmBtn.className = "bg-red-500 text-white border-2 border-black font-black py-2.5 px-5 rounded-xl hover:bg-red-600 transition text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
                    confirmBtn.innerText = "Ya, Lanjutkan";
                    confirmBtn.onclick = () => {
                        modal.classList.add('hidden');
                        modal.classList.remove('flex');
                        resolve(true);
                    };

                    actionsEl.appendChild(cancelBtn);
                    actionsEl.appendChild(confirmBtn);
                } else {
                    const okBtn = document.createElement('button');
                    okBtn.className = "bg-black text-white font-black py-2.5 px-6 rounded-xl hover:bg-slate-800 transition active:translate-y-0.5 uppercase tracking-wider text-xs border-2 border-black";
                    okBtn.innerText = "OK, Mengerti";
                    okBtn.onclick = () => {
                        modal.classList.add('hidden');
                        modal.classList.remove('flex');
                        resolve(true);
                    };
                    actionsEl.appendChild(okBtn);
                }
            }

            modal.classList.remove('hidden');
            modal.classList.add('flex');
        });
    };

    // ==========================================
    // 1. Inisialisasi Profil Siswa (Auto-Remember)
    // ==========================================
    const globalNameInput = document.getElementById('global-student-name');
    const globalKelasSelect = document.getElementById('global-student-kelas');
    const getActiveStudentName = () => (globalNameInput?.value || '').trim() || localStorage.getItem('student_nama') || '';
    const getActiveStudentKelas = () => (globalKelasSelect?.value || '').trim() || localStorage.getItem('student_kelas') || '';
    const btnSaveProfile = document.getElementById('btn-save-profile');
    const greetingEl = document.getElementById('student-greeting');
    const metaEl = document.getElementById('student-meta');
    const savedBadge = document.getElementById('profile-saved-badge');
    const checkNameInput = document.getElementById('check-name-input');

    const subKelasSelect = document.getElementById('sub-kelas');

    let availableClasses = [];

    // Helper Modal & Banner Pemilih Kelas Cepat (Fitur 1, 3, & 4)
    window.openClassPickerModal = () => {
        const modal = document.getElementById('class-picker-modal');
        if (!modal) return;
        renderClassPickerGrid();
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

    window.closeClassPickerModal = () => {
        const modal = document.getElementById('class-picker-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };

    function renderClassPickerGrid() {
        const grid = document.getElementById('class-picker-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const currentKelas = getActiveStudentKelas();

        availableClasses.forEach(c => {
            const isSelected = String(c).trim().toLowerCase() === String(currentKelas).trim().toLowerCase();
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `p-3 sm:p-4 rounded-2xl border-2 border-black font-black transition active:translate-y-0.5 flex flex-col items-center justify-center gap-1 ${
                isSelected
                    ? 'bg-black text-yellow-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ring-2 ring-yellow-400'
                    : 'bg-slate-50 hover:bg-yellow-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
            }`;
            btn.innerHTML = `
                <span class="text-[10px] opacity-70 uppercase tracking-widest font-extrabold">Kelas</span>
                <span class="text-base sm:text-xl font-black">${escapeHtml(c)}</span>
            `;
            btn.onclick = () => window.selectStudentClass(c);
            grid.appendChild(btn);
        });

        // Tombol Tampilkan Semua Kelas
        const allBtn = document.createElement('button');
        allBtn.type = 'button';
        allBtn.className = `col-span-2 sm:col-span-3 py-2.5 px-3 rounded-xl border-2 border-black font-black text-xs text-slate-700 bg-white hover:bg-slate-100 uppercase tracking-wider transition active:translate-y-0.5 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mt-1 ${
            !currentKelas ? 'ring-2 ring-black font-black bg-slate-100' : ''
        }`;
        allBtn.textContent = 'Tampilkan Semua Kelas';
        allBtn.onclick = () => window.selectStudentClass('');
        grid.appendChild(allBtn);
    }

    function renderStudentClassBanner(kelas) {
        const bannerContainer = document.getElementById('student-class-alert-banner');
        if (!bannerContainer) return;

        const currentKelas = kelas !== undefined ? kelas : getActiveStudentKelas();

        if (!currentKelas) {
            // Skenario A: Belum Memilih Kelas
            bannerContainer.innerHTML = `
                <div class="bg-amber-300 border-[3px] border-black rounded-2xl md:rounded-[24px] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-white border-2 border-black rounded-xl flex items-center justify-center font-black text-black shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"></path></svg>
                        </div>
                        <div>
                            <div class="font-black text-xs md:text-sm text-black uppercase tracking-wide">Kelas Belum Dipilih</div>
                            <div class="text-[11px] md:text-xs font-bold text-slate-800">Pilih kelas untuk menampilkan materi, tugas, dan ujian yang sesuai.</div>
                        </div>
                    </div>
                    <button type="button" onclick="window.openClassPickerModal()" class="w-full sm:w-auto px-4 py-2.5 bg-black hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition shrink-0">
                        Pilih Kelas
                    </button>
                </div>
            `;
        } else {
            // Skenario B: Sudah Memilih Kelas
            bannerContainer.innerHTML = `
                <div class="bg-emerald-100 border-[3px] border-black rounded-2xl md:rounded-[24px] p-3.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div class="flex items-center gap-2.5">
                        <span class="inline-flex items-center justify-center w-7 h-7 bg-emerald-500 border-2 border-black text-white rounded-lg font-black text-xs shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0">
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"></path></svg>
                        </span>
                        <div class="text-xs font-black text-slate-900 leading-tight">
                            Menampilkan konten:
                            <span class="bg-black text-yellow-300 px-2.5 py-0.5 rounded-lg text-xs font-black tracking-wider uppercase ml-1 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                Kelas ${escapeHtml(currentKelas)}
                            </span>
                        </div>
                    </div>
                    <button type="button" onclick="window.openClassPickerModal()" class="w-full sm:w-auto px-3.5 py-1.5 bg-white hover:bg-slate-100 text-black font-black text-xs uppercase tracking-wider rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition shrink-0">
                        Ganti Kelas
                    </button>
                </div>
            `;
        }
    }

    window.selectStudentClass = async (selectedKelas) => {
        const cleanKelas = (selectedKelas || '').trim();
        if (cleanKelas) {
            localStorage.setItem('student_kelas', cleanKelas);
        } else {
            localStorage.removeItem('student_kelas');
        }
        if (globalKelasSelect) globalKelasSelect.value = cleanKelas;
        updateStudentProfileUI(cleanKelas);
        renderStudentClassBanner(cleanKelas);
        renderClassPickerGrid();
        window.closeClassPickerModal();

        // Re-fetch dan render konten otomatis seketika
        await loadStudentAssignments();
        await loadStudentMaterials();
        renderStudentQuizzes();
        await updatePortalOverviewStats();
    };

    async function loadClassOptions() {
        try {
            const { data } = await supabase.from('options').select('name').eq('type', 'kelas');
            if (data && data.length > 0) {
                availableClasses = data.map(o => o.name);
            }
        } catch (e) {
            console.warn("Could not load classes from database", e);
        }

        // Fallback jika database options kosong
        if (availableClasses.length === 0) {
            try {
                const { data: roster } = await supabase.from('students').select('kelas');
                if (roster && roster.length > 0) {
                    availableClasses = [...new Set(roster.map(r => r.kelas).filter(Boolean))].sort();
                }
            } catch (err) {
                console.warn("Could not load classes from students roster", err);
            }
        }

        const populate = (el, includeAll = false) => {
            if (!el) return;
            el.innerHTML = includeAll ? '<option value="">Semua Kelas</option>' : '<option value="" disabled selected>Pilih Kelas</option>';
            availableClasses.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = `Kelas ${c}`;
                el.appendChild(opt);
            });
        };

        populate(globalKelasSelect, true);
        populate(subKelasSelect, false);
        renderClassPickerGrid();
    }

    await loadClassOptions();

    // Fitur 1: Deteksi Parameter Kelas dari Link WhatsApp (?kelas=8A atau ?k=8A)
    const urlParams = new URLSearchParams(window.location.search);
    const queryKelasRaw = (urlParams.get('kelas') || urlParams.get('k') || '').trim();
    let savedKelas = localStorage.getItem('student_kelas') || '';

    if (queryKelasRaw) {
        // Cocokkan secara fleksibel dengan opsi kelas yang tersedia
        const matched = availableClasses.find(c => c.toLowerCase() === queryKelasRaw.toLowerCase()) || queryKelasRaw;
        savedKelas = matched;
        localStorage.setItem('student_kelas', matched);
    }

    if (savedKelas && globalKelasSelect) {
        globalKelasSelect.value = savedKelas;
    }

    function updateStudentProfileUI(kelas) {
        if (metaEl) {
            metaEl.textContent = kelas
                ? `Menampilkan konten tugas, materi, dan ujian khusus Kelas ${kelas}.`
                : 'Pilih kelas Anda untuk menyaring tugas, materi, dan ujian secara otomatis.';
        }
        if (savedBadge) {
            if (kelas) {
                savedBadge.textContent = `Kelas ${kelas}`;
                savedBadge.classList.remove('hidden');
            } else {
                savedBadge.classList.add('hidden');
            }
        }
    }

    updateStudentProfileUI(savedKelas);
    renderStudentClassBanner(savedKelas);

    // Fitur 3: Pop-up Otomatis saat pertama kali buka web jika belum ada kelas tersimpan & bukan dari link URL
    if (!savedKelas && !queryKelasRaw) {
        setTimeout(() => {
            window.openClassPickerModal();
        }, 350);
    }

    // Event listener langsung saat siswa mengganti kelas melalui dropdown
    if (globalKelasSelect) {
        globalKelasSelect.addEventListener('change', async () => {
            const kelas = globalKelasSelect.value;
            if (kelas) {
                localStorage.setItem('student_kelas', kelas);
            } else {
                localStorage.removeItem('student_kelas');
            }
            updateStudentProfileUI(kelas);
            renderStudentClassBanner(kelas);
            renderClassPickerGrid();

            // Re-fetch dan render konten otomatis seketika
            await loadStudentAssignments();
            await loadStudentMaterials();
            renderStudentQuizzes();
            updatePortalOverviewStats();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.closeClassPickerModal();
        }
    });

    // ==========================================
    // 2. Tab Portal Switcher
    // ==========================================
    window.switchStudentPortal = (viewName) => {
        const tabs = ['tugas', 'materi', 'ujian', 'nilai'];
        tabs.forEach(t => {
            const btn = document.getElementById(`nav-btn-${t}`);
            const content = document.getElementById(`view-${t}`);
            if (t === viewName) {
                if (btn) btn.className = "portal-nav-item py-2 px-1.5 md:py-2.5 md:px-4 rounded-xl flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 font-black text-[10px] md:text-xs uppercase tracking-wider transition-all min-h-[48px] bg-black text-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
                if (content) {
                    content.classList.remove('hidden', '!hidden');
                    content.style.display = 'block';
                }
            } else {
                if (btn) btn.className = "portal-nav-item py-2 px-1.5 md:py-2.5 md:px-4 rounded-xl flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 font-bold text-[10px] md:text-xs uppercase tracking-wider transition-all min-h-[48px] text-slate-700 hover:text-black hover:bg-slate-100";
                if (content) {
                    content.classList.add('hidden');
                    content.classList.remove('!hidden');
                    content.style.display = 'none';
                }
            }
        });

        if (viewName === 'tugas') loadStudentAssignments();
        if (viewName === 'materi') loadStudentMaterials();
        if (viewName === 'ujian') loadStudentQuizzes();
        if (viewName === 'nilai') {
            if (typeof window.populateRaporKelasSelect === 'function') {
                window.populateRaporKelasSelect();
            }
            const curName = getActiveStudentName();
            if (curName) {
                if (checkNameInput) checkNameInput.value = curName;
                checkStudentGrades();
            }
        }
    };

    // ==========================================
    // 3. Ringkasan Statistik Portal LMS
    // ==========================================
    async function updatePortalOverviewStats() {
        const studentKelas = getActiveStudentKelas();
        const studentName = getActiveStudentName();

        // Count assignments
        const relevantAssignments = allAssignments.filter(a => !studentKelas || isClassMatch(a.kelas, studentKelas));
        const statAssEl = document.getElementById('stat-assignments-count');
        if (statAssEl) statAssEl.textContent = `${relevantAssignments.length} Tugas`;

        // Count materials
        const relevantMaterials = allMaterials.filter(m => !studentKelas || isClassMatch(m.kelas, studentKelas));
        const statMatEl = document.getElementById('stat-materials-count');
        if (statMatEl) statMatEl.textContent = `${relevantMaterials.length} Materi`;

        // Count quizzes
        const relevantQuizzes = allQuizzes.filter(q => !studentKelas || isClassMatch(q.kelas, studentKelas));
        const statQuizEl = document.getElementById('stat-quizzes-count');
        if (statQuizEl) statQuizEl.textContent = `${relevantQuizzes.length} Ujian`;

        // Count graded items
        const statGradeEl = document.getElementById('stat-grades-count');
        if (studentName) {
            try {
                const { count } = await supabase.from('files').select('*', { count: 'exact', head: true }).ilike('nama', `%${studentName}%`).not('nilai', 'is', null);
                if (statGradeEl) statGradeEl.textContent = `${count || 0} Nilai`;
            } catch (e) {
                console.warn(e);
            }
        } else if (statGradeEl) {
            statGradeEl.textContent = `Buku Nilai`;
        }
    }

    // ==========================================
    // 4. TAB 1: DAFTAR TUGAS & PR SISWA
    // ==========================================
    window.loadStudentAssignments = async () => {
        const container = document.getElementById('student-assignments-list');
        const filterSelect = document.getElementById('filter-tugas-mapel');
        if (!container) return;

        container.innerHTML = `
            <div class="col-span-2 text-center py-10 font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                Memuat tugas siswa dari database...
            </div>
        `;

        try {
            // Fetch assignments
            const { data: assignments, error: assErr } = await supabase
                .from('assignments')
                .select('*')
                .order('created_at', { ascending: false });
            if (assErr) throw assErr;
            allAssignments = assignments || [];

            // Fetch student uploads to check submission status
            const studentName = getActiveStudentName();
            if (studentName) {
                const { data: files } = await supabase
                    .from('files')
                    .select('*')
                    .ilike('nama', `%${studentName}%`);
                studentFiles = files || [];
            } else {
                studentFiles = [];
            }

            // Populate Mapel Filter
            const mapelSet = new Set(allAssignments.map(a => a.mapel));
            filterSelect.innerHTML = '<option value="">Semua Mapel</option>';
            mapelSet.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m; opt.textContent = m;
                filterSelect.appendChild(opt);
            });

            renderStudentAssignments();
            updatePortalOverviewStats();
        } catch (e) {
            console.error(e);
            container.innerHTML = `
                <div class="col-span-2 bg-red-50 border-2 border-red-300 rounded-2xl p-6 text-center text-red-700 font-bold">
                    Gagal memuat tugas: ${e.message}
                </div>
            `;
        }
    };

    window.setAssignmentStatusFilter = (status) => {
        currentAssignmentStatusFilter = status;
        const pills = ['all', 'todo', 'submitted', 'graded'];
        pills.forEach(p => {
            const btn = document.getElementById(`filter-btn-${p}`);
            if (!btn) return;
            if (p === status) {
                btn.className = "assign-filter-pill px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-black bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap active:translate-y-0.5 transition";
            } else {
                btn.className = "assign-filter-pill px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-black bg-white hover:bg-slate-100 text-slate-800 whitespace-nowrap active:translate-y-0.5 transition";
            }
        });
        renderStudentAssignments();
    };

    function renderStudentAssignments() {
        const container = document.getElementById('student-assignments-list');
        const filterMapel = document.getElementById('filter-tugas-mapel')?.value || '';
        const studentKelas = globalKelasSelect?.value || '';

        if (!container) return;
        container.innerHTML = '';

        // Kumpulan tugas relevan berdasarkan filter Mapel & Kelas
        const relevant = allAssignments.filter(a => {
            const matchMapel = !filterMapel || a.mapel === filterMapel;
            const matchKelas = !studentKelas || isClassMatch(a.kelas, studentKelas);
            return matchMapel && matchKelas;
        });

        // Hitung statistik status To-Do siswa
        let countAll = relevant.length;
        let countTodo = 0;
        let countSubmitted = 0;
        let countGraded = 0;

        relevant.forEach(a => {
            const sub = studentFiles.find(f => 
                (f.assignment_id && String(f.assignment_id) === String(a.id)) ||
                (f.materi && f.materi.toLowerCase().trim() === a.judul_tugas.toLowerCase().trim())
            );
            if (!sub) {
                countTodo++;
            } else if (sub.nilai !== null && sub.nilai !== undefined && sub.nilai !== '') {
                countGraded++;
            } else {
                countSubmitted++;
            }
        });

        // Perbarui angka di badge filter
        const countAllEl = document.getElementById('count-filter-all');
        const countTodoEl = document.getElementById('count-filter-todo');
        const countSubmittedEl = document.getElementById('count-filter-submitted');
        const countGradedEl = document.getElementById('count-filter-graded');
        if (countAllEl) countAllEl.textContent = countAll;
        if (countTodoEl) countTodoEl.textContent = countTodo;
        if (countSubmittedEl) countSubmittedEl.textContent = countSubmitted;
        if (countGradedEl) countGradedEl.textContent = countGraded;

        // Filter berdasarkan status tab To-Do
        const filtered = relevant.filter(a => {
            const sub = studentFiles.find(f => 
                (f.assignment_id && String(f.assignment_id) === String(a.id)) ||
                (f.materi && f.materi.toLowerCase().trim() === a.judul_tugas.toLowerCase().trim())
            );
            if (currentAssignmentStatusFilter === 'todo') return !sub;
            if (currentAssignmentStatusFilter === 'submitted') return sub && (sub.nilai === null || sub.nilai === undefined || sub.nilai === '');
            if (currentAssignmentStatusFilter === 'graded') return sub && sub.nilai !== null && sub.nilai !== undefined && sub.nilai !== '';
            return true;
        });

        if (filtered.length === 0) {
            let emptyMsg = `Saat ini belum ada tugas untuk kelas ${studentKelas || 'ini'} pada mata pelajaran yang dipilih.`;
            if (currentAssignmentStatusFilter === 'todo') {
                emptyMsg = `Hore! Tidak ada tugas yang tertunda. Seluruh tugas telah Anda kumpulkan! `;
            } else if (currentAssignmentStatusFilter === 'submitted') {
                emptyMsg = `Belum ada tugas yang sedang menunggu koreksi guru/AI.`;
            } else if (currentAssignmentStatusFilter === 'graded') {
                emptyMsg = `Belum ada tugas yang selesai dinilai. Silakan kumpulkan tugas Anda terlebih dahulu.`;
            }

            container.innerHTML = `
                <div class="col-span-2 bg-white border-[3px] border-black rounded-[28px] p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <span class="text-4xl block mb-2"></span>
                    <h4 class="font-black text-lg text-black uppercase">Daftar Tugas Kosong</h4>
                    <p class="text-xs font-bold text-slate-500 mt-1">${emptyMsg}</p>
                </div>
            `;
            return;
        }

        filtered.forEach(a => {
            // Cek apakah siswa sudah mengumpulkan tugas ini
            const mySubmission = studentFiles.find(f => 
                (f.assignment_id && String(f.assignment_id) === String(a.id)) ||
                (f.materi && f.materi.toLowerCase().trim() === a.judul_tugas.toLowerCase().trim())
            );

            // Periksa deadline
            let deadlineBadge = '';
            if (a.deadline) {
                const dlDate = new Date(a.deadline);
                const now = new Date();
                const isPast = dlDate < now;
                const formattedDate = dlDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                
                if (isPast) {
                    deadlineBadge = `<span class="bg-red-100 text-red-800 border border-red-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">Lewat Tenggat (${formattedDate})</span>`;
                } else {
                    deadlineBadge = `<span class="bg-yellow-100 text-yellow-900 border border-yellow-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">Batas: ${formattedDate} WIB</span>`;
                }
            } else {
                deadlineBadge = `<span class="bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">Tanpa Batas Waktu</span>`;
            }

            const parsed = parseAssignmentQuestions(a);
            const isForm = parsed.tipe_pengumpulan === 'form' && parsed.questions && parsed.questions.length > 0;
            const tipeTugas = parsed.tipe_pengumpulan || 'bebas';

            let tipeBadgeHtml = '';
            if (isForm) {
                tipeBadgeHtml = `<span class="bg-indigo-600 text-white font-black text-[10px] px-2 py-0.5 rounded uppercase border border-black">Form Soal (${parsed.questions.length} Soal)</span>`;
            } else if (tipeTugas === 'link') {
                tipeBadgeHtml = `<span class="bg-pink-100 text-pink-900 border border-pink-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">Khusus Tautan Link</span>`;
            } else if (tipeTugas === 'file') {
                tipeBadgeHtml = `<span class="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">Khusus Berkas</span>`;
            } else if (tipeTugas === 'text') {
                tipeBadgeHtml = `<span class="bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">Khusus Form Web</span>`;
            } else {
                tipeBadgeHtml = `<span class="bg-teal-100 text-teal-900 border border-teal-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">Pengumpulan Bebas</span>`;
            }

            // Status submission badge
            let submissionBadge = '';
            let defaultActionText = isForm ? 'Kerjakan Soal Online ↗' : (tipeTugas === 'link' ? 'Kirim Tautan Link ↗' : (tipeTugas === 'file' ? 'Unggah Berkas ↗' : 'Kumpul Tugas Ini ↗'));
            let actionBtnText = defaultActionText;
            let actionBtnClass = 'bg-indigo-600 hover:bg-black text-white';

            if (mySubmission) {
                if (mySubmission.nilai !== null && mySubmission.nilai !== undefined && mySubmission.nilai !== '') {
                    submissionBadge = `<span class="bg-emerald-400 text-black border-2 border-black font-black text-xs px-2.5 py-1 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Nilai: ${mySubmission.nilai}/100 &bull; Terkunci 1x</span>`;
                } else {
                    submissionBadge = `<span class="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs px-2 py-0.5 rounded-lg">Sudah Dikumpulkan &bull; Terkunci 1x</span>`;
                }
                actionBtnText = isForm ? 'Lembar Jawaban (Terkunci)' : 'Lihat Pengumpulan (Terkunci)';
                actionBtnClass = 'bg-white hover:bg-slate-100 text-black border-2 border-black';
            } else {
                submissionBadge = `<span class="bg-red-100 text-red-800 border border-red-300 font-bold text-xs px-2 py-0.5 rounded-lg">Belum Dikerjakan</span>`;
            }

            const card = document.createElement('div');
            card.className = "bg-white border-2 sm:border-[3px] border-black rounded-2xl sm:rounded-[28px] p-4 sm:p-5 md:p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between";
            card.innerHTML = `
                <div>
                    <div class="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="bg-indigo-100 text-indigo-900 border border-indigo-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                ${a.mapel}
                            </span>
                            <span class="bg-yellow-200 text-black border border-black text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                Kelas ${a.kelas}
                            </span>
                            ${tipeBadgeHtml}
                        </div>
                        <div>${deadlineBadge}</div>
                    </div>

                    <h4 class="font-black text-lg md:text-xl text-black mb-1.5">${a.judul_tugas}</h4>
                    <p class="text-xs text-slate-700 font-medium leading-relaxed mb-3 whitespace-pre-line">${escapeHtml(parsed.petunjuk || a.deskripsi || '')}</p>

                    ${mySubmission && mySubmission.nilai !== null && mySubmission.nilai !== undefined && mySubmission.nilai !== '' ? `
                        <div class="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-3 text-xs mb-3">
                            <div class="flex justify-between items-center mb-1">
                                <span class="font-black text-emerald-950 text-xs">Hasil Koreksi Guru:</span>
                                <span class="font-black text-sm bg-emerald-300 text-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-500">${mySubmission.nilai} / 100</span>
                            </div>
                            ${mySubmission.catatan_guru ? `<p class="text-[11px] font-medium text-slate-800 italic">"${mySubmission.catatan_guru}"</p>` : ''}
                        </div>
                    ` : ''}
                </div>

                <div class="pt-3 border-t-2 border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div class="w-full sm:w-auto">${submissionBadge}</div>
                    <button type="button" onclick="openAssignmentSubmissionModal(${JSON.stringify(a).replace(/"/g, '&quot;')})" class="w-full sm:w-auto px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 text-center flex items-center justify-center ${actionBtnClass}">
                        ${actionBtnText}
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    window.filterStudentAssignments = () => {
        renderStudentAssignments();
    };

    // ==========================================
    // 5. MODAL FORM PENGUMPULAN TUGAS DEDIKASI
    // ==========================================
    const subModal = document.getElementById('submission-modal');
    const subForm = document.getElementById('submission-form');
    const subAssignIdInput = document.getElementById('sub-assignment-id');
    const subNamaInput = document.getElementById('sub-nama');
    const subMapelSelect = document.getElementById('sub-mapel');
    const subMateriInput = document.getElementById('sub-materi');
    const tabModeText = document.getElementById('tabModeText');
    const tabModeFile = document.getElementById('tabModeFile');
    const tabModeLink = document.getElementById('tabModeLink');
    const sectionText = document.getElementById('sectionText');
    const sectionFile = document.getElementById('sectionFile');
    const sectionLink = document.getElementById('sectionLink');
    const subTextAnswerInput = document.getElementById('sub-text-answer');
    const subTextCount = document.getElementById('sub-text-count');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('sub-file');
    const fileInfo = document.getElementById('file-info');
    const fileSelected = document.getElementById('file-selected');
    const filenameDisplay = document.getElementById('filename-display');
    const clearFileBtn = document.getElementById('clearFileBtn');
    const linkUrlInput = document.getElementById('sub-link-url');
    const linkNoteInput = document.getElementById('sub-link-note');
    const platformBadge = document.getElementById('platformBadge');
    const subSubmitBtn = document.getElementById('sub-btn-submit');
    const subStudentSelect = document.getElementById('sub-student-select');
    const subStudentIdInput = document.getElementById('sub-student-id');

    window.onSubStudentSelectChange = async (sel) => {
        if (!sel || !sel.value) {
            if (subNamaInput) subNamaInput.value = '';
            if (subStudentIdInput) subStudentIdInput.value = '';
            return;
        }
        const opt = sel.options[sel.selectedIndex];
        const studentName = opt ? (opt.getAttribute('data-name') || sel.value) : sel.value;
        const studentId = opt ? (opt.getAttribute('data-id') || '') : '';
        if (subNamaInput) subNamaInput.value = studentName;
        if (subStudentIdInput) subStudentIdInput.value = studentId;

        if (subStudentSelect) {
            subStudentSelect.classList.remove('border-red-500', 'ring-2', 'ring-red-300');
        }

        // Cek secara dinamis jika nama siswa yang baru dipilih ini sudah pernah mengumpulkan tugas ini
        const curAssignId = subAssignIdInput ? subAssignIdInput.value : '';
        const statusEl = document.getElementById('modal-banner-status');
        if (curAssignId) {
            try {
                const { data: existingSub } = await supabase
                    .from('files')
                    .select('id, created_at, nilai, catatan_guru, storage_path')
                    .eq('assignment_id', Number(curAssignId))
                    .ilike('nama', studentName.trim())
                    .maybeSingle();

                if (existingSub) {
                    if (subSubmitBtn) {
                        subSubmitBtn.disabled = true;
                        subSubmitBtn.classList.add('opacity-50', 'cursor-not-allowed');
                        subSubmitBtn.innerText = 'TANGGAPAN SUDAH TERKIRIM (TERKUNCI)';
                    }
                    if (statusEl) {
                        statusEl.classList.remove('hidden');
                        const subDate = existingSub.created_at ? new Date(existingSub.created_at).toLocaleString('id-ID') : '';
                        statusEl.innerHTML = `
                            <div class="flex items-center justify-between">
                                <span class="font-black text-emerald-900">Siswa Ini Sudah Mengumpulkan</span>
                                <span class="text-[10px] bg-slate-200 text-slate-800 font-black px-2 py-0.5 rounded border border-slate-400">Terkunci 1x</span>
                            </div>
                            <p class="text-[11px] text-slate-700 font-bold mt-1">Siswa (${studentName}) tercatat sudah mengumpulkan tugas ini (${subDate}). Tanggapan dibatasi 1 kali.</p>
                        `;
                    }
                    if (currentFormQuestions && currentFormQuestions.length > 0 && existingSub.storage_path && existingSub.storage_path.startsWith('FORM:')) {
                        try {
                            const parsed = JSON.parse(existingSub.storage_path.replace('FORM:', ''));
                            const prevMap = {};
                            if (Array.isArray(parsed)) parsed.forEach(ans => { prevMap[ans.nomor] = ans.jawaban_siswa; });
                            renderStudentFormQuestions(currentFormQuestions, prevMap, true);
                        } catch (_) {}
                    }
                } else {
                    if (subSubmitBtn) {
                        subSubmitBtn.disabled = false;
                        subSubmitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                        subSubmitBtn.innerText = 'KIRIM JAWABAN TUGAS';
                    }
                    if (statusEl) {
                        statusEl.classList.add('hidden');
                    }
                    if (currentFormQuestions && currentFormQuestions.length > 0) {
                        renderStudentFormQuestions(currentFormQuestions, {}, false);
                    }
                }
            } catch (_) {}
        }
    };

    async function populateSubStudentSelect(kelas, preselectedName = '') {
        if (!subStudentSelect) return;
        if (!rosterStudents || rosterStudents.length === 0) {
            try {
                rosterStudents = await fetchStudentsFromDB();
            } catch (_) {}
        }

        if (!kelas) {
            subStudentSelect.disabled = true;
            subStudentSelect.innerHTML = '<option value="">-- Pilih Kelas Terlebih Dahulu --</option>';
            if (subNamaInput) subNamaInput.value = '';
            if (subStudentIdInput) subStudentIdInput.value = '';
            return;
        }

        const filtered = (rosterStudents || [])
            .filter(s => String(s.kelas).trim().toLowerCase() === String(kelas).trim().toLowerCase())
            .sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || '')));

        if (filtered.length === 0) {
            subStudentSelect.disabled = true;
            subStudentSelect.innerHTML = '<option value="">(Belum ada data roster di kelas ini)</option>';
            if (subNamaInput) subNamaInput.value = '';
            if (subStudentIdInput) subStudentIdInput.value = '';
            return;
        }

        subStudentSelect.disabled = false;
        subStudentSelect.innerHTML = '<option value="">-- Pilih Nama Siswa (Sesuai Roster Resmi) --</option>' + 
            filtered.map(s => {
                const nisnText = s.nisn ? ` (NISN: ${s.nisn})` : '';
                return `<option value="${escapeHtml(s.nama)}" data-name="${escapeHtml(s.nama)}" data-id="${escapeHtml(s.id || '')}">${escapeHtml(s.nama)}${nisnText}</option>`;
            }).join('');

        const currentName = preselectedName || getActiveStudentName();
        if (currentName) {
            const match = filtered.find(s => s.nama.toLowerCase().trim() === currentName.toLowerCase().trim());
            if (match) {
                subStudentSelect.value = match.nama;
                if (subNamaInput) subNamaInput.value = match.nama;
                if (subStudentIdInput) subStudentIdInput.value = match.id || '';
            } else {
                if (subNamaInput) subNamaInput.value = '';
                if (subStudentIdInput) subStudentIdInput.value = '';
            }
        }
    }

    if (subKelasSelect) {
        subKelasSelect.addEventListener('change', () => {
            subKelasSelect.classList.remove('border-red-500', 'ring-2', 'ring-red-300');
            populateSubStudentSelect(subKelasSelect.value);
        });
    }

    // Live word & character counter for web form answers
    if (subTextAnswerInput) {
        subTextAnswerInput.addEventListener('input', () => {
            const val = subTextAnswerInput.value.trim();
            const words = val ? val.split(/\s+/).filter(Boolean).length : 0;
            const chars = val.length;
            if (subTextCount) subTextCount.textContent = `${words} kata | ${chars} karakter`;
        });
    }

    // Buka Modal Terkait Tugas Tertentu
    window.openAssignmentSubmissionModal = async (assignment) => {
        const parsed = parseAssignmentQuestions(assignment);
        currentFormQuestions = parsed.questions || [];

        subAssignIdInput.value = assignment.id || '';
        document.getElementById('modal-banner-mapel').textContent = assignment.mapel || 'Mapel';
        document.getElementById('modal-banner-kelas').textContent = `Kelas ${assignment.kelas || 'Semua'}`;
        document.getElementById('modal-banner-title').textContent = assignment.judul_tugas || 'Tugas';
        document.getElementById('modal-banner-desc').textContent = parsed.petunjuk || assignment.deskripsi || '';
        document.getElementById('modal-assignment-banner').classList.remove('hidden');

        const deadlineEl = document.getElementById('modal-banner-deadline');
        if (deadlineEl) {
            deadlineEl.textContent = assignment.deadline 
                ? `Batas: ${new Date(assignment.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` 
                : 'Tanpa Batas Waktu';
        }

        const rubrikEl = document.getElementById('modal-banner-rubrik');
        if (rubrikEl) {
            rubrikEl.classList.add('hidden');
        }

        if (!rosterStudents || rosterStudents.length === 0) {
            try {
                rosterStudents = await fetchStudentsFromDB();
            } catch (_) {}
        }

        const allRosterClasses = [...new Set((rosterStudents || []).map(s => String(s.kelas).trim()))].filter(Boolean).sort();
        const allClassesList = allRosterClasses.length > 0 ? allRosterClasses : availableClasses;

        const rawK = String(assignment.kelas || '').trim();
        let applicableClasses = allClassesList;
        let isSingleExactClass = false;

        const exactMatch = allClassesList.find(c => c.toLowerCase() === rawK.toLowerCase());
        if (exactMatch) {
            applicableClasses = [exactMatch];
            isSingleExactClass = true;
        } else if (rawK && rawK !== 'Semua' && rawK !== 'Semua Kelas') {
            if (rawK.includes('9') || rawK.toUpperCase().includes('IX')) {
                applicableClasses = allClassesList.filter(c => c.startsWith('9.') || c.startsWith('9') || c.toUpperCase().includes('IX'));
            } else if (rawK.includes('8') || rawK.toUpperCase().includes('VIII')) {
                applicableClasses = allClassesList.filter(c => c.startsWith('8.') || c.startsWith('8') || c.toUpperCase().includes('VIII'));
            } else if (rawK.includes('7') || rawK.toUpperCase().includes('VII')) {
                applicableClasses = allClassesList.filter(c => c.startsWith('7.') || c.startsWith('7') || c.toUpperCase().includes('VII'));
            }
        }

        if (applicableClasses.length === 0) {
            applicableClasses = allClassesList;
        }

        if (subKelasSelect) {
            subKelasSelect.classList.remove('border-red-500', 'ring-2', 'ring-red-300');
            subKelasSelect.innerHTML = '<option value="">-- Pilih Kelas Anda --</option>' +
                applicableClasses.map(k => `<option value="${escapeHtml(k)}">Kelas ${escapeHtml(k)}</option>`).join('');

            if (isSingleExactClass) {
                subKelasSelect.value = applicableClasses[0];
                subKelasSelect.disabled = true;
                subKelasSelect.classList.add('cursor-not-allowed', 'bg-slate-100');
            } else {
                subKelasSelect.disabled = false;
                subKelasSelect.classList.remove('cursor-not-allowed', 'bg-slate-100');
                // Kosongkan kelas saat pertama modal dibuka agar siswa memilih secara sadar
                subKelasSelect.value = '';
            }

            // Kosongkan nama siswa agar tidak terisi otomatis dari perangkat/cache
            populateSubStudentSelect(subKelasSelect.value, '');
        }

        if (subNamaInput) subNamaInput.value = '';
        if (subStudentIdInput) subStudentIdInput.value = '';
        if (subStudentSelect) {
            subStudentSelect.classList.remove('border-red-500', 'ring-2', 'ring-red-300');
        }

        if (subMapelSelect) {
            subMapelSelect.value = assignment.mapel || 'Informatika';
            subMapelSelect.readOnly = true;
        }
        subMateriInput.value = assignment.judul_tugas || '';
        subMateriInput.readOnly = true;

        if (subTextAnswerInput) subTextAnswerInput.value = '';
        if (subTextCount) subTextCount.textContent = '0 kata | 0 karakter';
        resetFileInput();
        if (linkUrlInput) linkUrlInput.value = '';
        if (linkNoteInput) linkNoteInput.value = '';

        const statusEl = document.getElementById('modal-banner-status');
        if (statusEl) {
            statusEl.classList.add('hidden');
        }

        if (subSubmitBtn) {
            subSubmitBtn.disabled = false;
            subSubmitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            subSubmitBtn.innerText = 'KIRIM JAWABAN TUGAS';
        }

        let mySubmission = null;
        let isLocked = false;

        const formSheet = document.getElementById('task-google-form-sheet');
        const legacySheet = document.getElementById('task-legacy-text-sheet');
        const modeSwitcher = document.getElementById('sub-mode-switcher-container');
        const counterBadge = document.getElementById('student-form-counter-badge');
        const tipeBadge = document.getElementById('modal-banner-tipe');

        const assignmentTipe = parsed.tipe_pengumpulan || 'bebas';

        if (tipeBadge) {
            tipeBadge.classList.remove('hidden');
            if (assignmentTipe === 'form') {
                tipeBadge.textContent = 'Form Soal Interaktif';
                tipeBadge.className = 'bg-purple-100 text-purple-950 border border-purple-300 font-black text-[10px] px-2 py-0.5 rounded uppercase';
            } else if (assignmentTipe === 'link') {
                tipeBadge.textContent = 'Khusus Tautan Link';
                tipeBadge.className = 'bg-pink-100 text-pink-950 border border-pink-300 font-black text-[10px] px-2 py-0.5 rounded uppercase';
            } else if (assignmentTipe === 'file') {
                tipeBadge.textContent = 'Khusus Berkas';
                tipeBadge.className = 'bg-amber-100 text-amber-950 border border-amber-300 font-black text-[10px] px-2 py-0.5 rounded uppercase';
            } else if (assignmentTipe === 'text') {
                tipeBadge.textContent = 'Khusus Form Web';
                tipeBadge.className = 'bg-blue-100 text-blue-950 border border-blue-300 font-black text-[10px] px-2 py-0.5 rounded uppercase';
            } else {
                tipeBadge.textContent = 'Pengumpulan Bebas';
                tipeBadge.className = 'bg-teal-100 text-teal-950 border border-teal-300 font-black text-[10px] px-2 py-0.5 rounded uppercase';
            }
        }

        if (assignmentTipe === 'form' && currentFormQuestions && currentFormQuestions.length > 0) {
            // Tampilkan Google Form Sheet
            if (formSheet) formSheet.classList.remove('hidden');
            if (legacySheet) legacySheet.classList.add('hidden');
            if (modeSwitcher) modeSwitcher.classList.add('hidden');
            if (counterBadge) counterBadge.textContent = `${currentFormQuestions.length} Soal`;

            let prevAnswersMap = {};
            if (mySubmission && mySubmission.storage_path && mySubmission.storage_path.startsWith('FORM:')) {
                try {
                    const parsedAnswers = JSON.parse(mySubmission.storage_path.replace('FORM:', ''));
                    if (Array.isArray(parsedAnswers)) {
                        parsedAnswers.forEach(ans => {
                            prevAnswersMap[ans.nomor] = ans.jawaban_siswa;
                        });
                    }
                } catch (e) {
                    console.error('Gagal parse jawaban lama:', e);
                }
            }

            renderStudentFormQuestions(currentFormQuestions, prevAnswersMap, isLocked);
            setSubmissionMode('text');
        } else {
            // Tampilkan Legacy Text Sheet
            if (formSheet) formSheet.classList.add('hidden');
            if (legacySheet) legacySheet.classList.remove('hidden');

            if (subTextAnswerInput) subTextAnswerInput.readOnly = isLocked;
            if (linkUrlInput) linkUrlInput.readOnly = isLocked;
            if (linkNoteInput) linkNoteInput.readOnly = isLocked;
            if (fileInput) fileInput.disabled = isLocked;
            if (dropzone) {
                if (isLocked) {
                    dropzone.classList.add('pointer-events-none', 'opacity-60');
                } else {
                    dropzone.classList.remove('pointer-events-none', 'opacity-60');
                }
            }

            if (assignmentTipe === 'link') {
                if (modeSwitcher) modeSwitcher.classList.add('hidden');
                setSubmissionMode('link');
            } else if (assignmentTipe === 'file') {
                if (modeSwitcher) modeSwitcher.classList.add('hidden');
                setSubmissionMode('file');
            } else if (assignmentTipe === 'text') {
                if (modeSwitcher) modeSwitcher.classList.add('hidden');
                setSubmissionMode('text');
            } else {
                if (modeSwitcher) modeSwitcher.classList.remove('hidden');
                if (mySubmission) {
                    if (mySubmission.storage_path && mySubmission.storage_path.startsWith('TEXT:')) {
                        const prevText = mySubmission.storage_path.replace('TEXT:', '');
                        if (subTextAnswerInput) {
                            subTextAnswerInput.value = prevText;
                            const words = prevText.split(/\s+/).filter(Boolean).length;
                            if (subTextCount) subTextCount.textContent = `${words} kata | ${prevText.length} karakter`;
                        }
                        setSubmissionMode('text');
                    } else if (mySubmission.link_url || (mySubmission.storage_path && mySubmission.storage_path.startsWith('LINK:'))) {
                        const prevUrl = mySubmission.link_url || mySubmission.storage_path.replace('LINK:', '');
                        if (linkUrlInput) linkUrlInput.value = prevUrl;
                        setSubmissionMode('link');
                    } else if (mySubmission.tipe === 'file') {
                        setSubmissionMode('file');
                    } else {
                        setSubmissionMode('text');
                    }
                } else {
                    setSubmissionMode('text');
                }
            }
        }

        subModal.classList.remove('hidden');
        subModal.classList.add('flex');
    };

    // Buka Modal Tugas Mandiri / Bebas
    window.openFreeSubmissionModal = async () => {
        currentFormQuestions = [];
        subAssignIdInput.value = '';
        document.getElementById('modal-banner-mapel').textContent = 'Tugas Mandiri';
        document.getElementById('modal-banner-kelas').textContent = 'Bebas';
        document.getElementById('modal-banner-title').textContent = 'Pengumpulan Tugas Bebas';
        document.getElementById('modal-banner-desc').textContent = 'Ketik jawaban tugas langsung di web, unggah berkas, atau tautkan link pekerjaan Anda.';
        document.getElementById('modal-assignment-banner').classList.remove('hidden');

        const formSheet = document.getElementById('task-google-form-sheet');
        const legacySheet = document.getElementById('task-legacy-text-sheet');
        const modeSwitcher = document.getElementById('sub-mode-switcher-container');
        if (formSheet) formSheet.classList.add('hidden');
        if (legacySheet) legacySheet.classList.remove('hidden');
        if (modeSwitcher) modeSwitcher.classList.remove('hidden');

        if (!rosterStudents || rosterStudents.length === 0) {
            try {
                rosterStudents = await fetchStudentsFromDB();
            } catch (_) {}
        }
        const allRosterClasses = [...new Set((rosterStudents || []).map(s => String(s.kelas).trim()))].filter(Boolean).sort();
        const allClassesList = allRosterClasses.length > 0 ? allRosterClasses : availableClasses;

        if (subKelasSelect) {
            subKelasSelect.classList.remove('border-red-500', 'ring-2', 'ring-red-300');
            subKelasSelect.disabled = false;
            subKelasSelect.classList.remove('cursor-not-allowed', 'bg-slate-100');
            subKelasSelect.innerHTML = '<option value="">-- Pilih Kelas Anda --</option>' +
                allClassesList.map(k => `<option value="${escapeHtml(k)}">Kelas ${escapeHtml(k)}</option>`).join('');

            subKelasSelect.value = '';
            populateSubStudentSelect('', '');
        }
        if (subNamaInput) subNamaInput.value = '';
        if (subStudentIdInput) subStudentIdInput.value = '';
        if (subStudentSelect) {
            subStudentSelect.classList.remove('border-red-500', 'ring-2', 'ring-red-300');
        }
        if (subMapelSelect) {
            subMapelSelect.value = 'Informatika';
            subMapelSelect.readOnly = false;
        }
        subMateriInput.value = '';
        subMateriInput.readOnly = false;

        if (subTextAnswerInput) {
            subTextAnswerInput.value = '';
            subTextAnswerInput.readOnly = false;
        }
        if (subTextCount) subTextCount.textContent = '0 kata | 0 karakter';
        resetFileInput();
        if (fileInput) fileInput.disabled = false;
        if (dropzone) dropzone.classList.remove('pointer-events-none', 'opacity-60');
        if (linkUrlInput) {
            linkUrlInput.value = '';
            linkUrlInput.readOnly = false;
        }
        if (linkNoteInput) {
            linkNoteInput.value = '';
            linkNoteInput.readOnly = false;
        }
        if (subSubmitBtn) {
            subSubmitBtn.disabled = false;
            subSubmitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            subSubmitBtn.innerText = 'KIRIM TUGAS BEBAS ';
        }
        setSubmissionMode('text');

        subModal.classList.remove('hidden');
        subModal.classList.add('flex');
    };

    window.closeSubmissionModal = () => {
        subModal.classList.add('hidden');
        subModal.classList.remove('flex');
    };

    window.setSubmissionMode = (mode) => {
        currentSubmissionMode = mode;
        const activeTabClass = "py-1.5 px-1.5 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
        const inactiveTabClass = "py-1.5 px-1.5 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 text-slate-500 hover:text-black";

        if (tabModeText) tabModeText.className = (mode === 'text') ? activeTabClass : inactiveTabClass;
        if (tabModeFile) tabModeFile.className = (mode === 'file') ? activeTabClass : inactiveTabClass;
        if (tabModeLink) tabModeLink.className = (mode === 'link') ? activeTabClass : inactiveTabClass;

        if (sectionText) sectionText.classList.toggle('hidden', mode !== 'text');
        if (sectionFile) sectionFile.classList.toggle('hidden', mode !== 'file');
        if (sectionLink) sectionLink.classList.toggle('hidden', mode !== 'link');

        if (subTextAnswerInput) subTextAnswerInput.required = (mode === 'text');
        if (fileInput) fileInput.required = (mode === 'file');
        if (linkUrlInput) linkUrlInput.required = (mode === 'link');
    };

    // Deteksi Platform Link
    function detectPlatform(url) {
        const u = url.toLowerCase();
        if (u.includes('canva.com')) return { name: 'Canva', bg: 'bg-teal-100 text-teal-800 border-teal-300' };
        if (u.includes('docs.google.com') || u.includes('drive.google.com')) return { name: 'Google Docs/Drive', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
        if (u.includes('instagram.com')) return { name: 'Instagram Reels', bg: 'bg-pink-100 text-pink-800 border-pink-300' };
        if (u.includes('tiktok.com')) return { name: 'TikTok', bg: 'bg-stone-200 text-stone-900 border-stone-400' };
        if (u.includes('scratch.mit.edu')) return { name: 'Scratch MIT', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
        if (u.includes('youtube.com') || u.includes('youtu.be')) return { name: 'YouTube', bg: 'bg-red-100 text-red-800 border-red-300' };
        return { name: 'Tautan Web', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
    }

    if (linkUrlInput) {
        linkUrlInput.addEventListener('input', () => {
            const val = linkUrlInput.value.trim();
            if (val.length > 5) {
                const detected = detectPlatform(val);
                platformBadge.textContent = detected.name;
                platformBadge.className = `text-[10px] font-black px-2 py-0.5 rounded-full border ${detected.bg}`;
                platformBadge.classList.remove('hidden');
            } else {
                platformBadge.classList.add('hidden');
            }
        });
    }

    // Drag-and-drop & File Selection
    if (dropzone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => {
            dropzone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
        });

        dropzone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length) {
                fileInput.files = files;
                handleFileSelect();
            }
        });

        fileInput.addEventListener('change', handleFileSelect);
    }

    function handleFileSelect() {
        if (fileInput.files.length > 0) {
            let names = [];
            for (let i = 0; i < fileInput.files.length; i++) {
                const file = fileInput.files[i];
                if (file.size > 10 * 1024 * 1024) {
                    showCustomModal('Ukuran berkas melebihi batas 10MB.', 'alert', 'Peringatan', '');
                    resetFileInput();
                    return;
                }
                names.push(file.name);
            }
            fileInfo.classList.add('hidden');
            fileSelected.classList.remove('hidden');
            fileSelected.classList.add('flex');
            filenameDisplay.textContent = names.join(', ');
        } else {
            resetFileInput();
        }
    }

    function resetFileInput() {
        fileInput.value = '';
        fileInfo.classList.remove('hidden');
        fileSelected.classList.add('hidden');
        fileSelected.classList.remove('flex');
    }

    if (clearFileBtn) clearFileBtn.addEventListener('click', resetFileInput);

    // Kirim Tugas (File / Link)
    subForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nama = (subNamaInput.value || subStudentSelect?.value || '').trim();
        const kelas = subKelasSelect?.value || '';
        const mapel = subMapelSelect?.value || '';
        const materi = subMateriInput?.value?.trim() || '';
        const assignmentId = subAssignIdInput.value ? Number(subAssignIdInput.value) : null;

        if (!kelas) {
            if (subKelasSelect) {
                subKelasSelect.classList.add('border-red-500', 'ring-2', 'ring-red-300');
                subKelasSelect.focus();
            }
            await showCustomModal('Peringatan: Kelas belum dipilih!\n\nSilakan pilih Kelas Anda terlebih dahulu pada formulir.', 'alert', 'Kelas Belum Dipilih', '');
            return;
        }

        if (!nama) {
            if (subStudentSelect) {
                subStudentSelect.classList.add('border-red-500', 'ring-2', 'ring-red-300');
                subStudentSelect.focus();
                subStudentSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            await showCustomModal('Peringatan: Nama Siswa Belum Dipilih!\n\nSilakan pilih nama Anda dari daftar peserta didik resmi di atas sebelum mengirim jawaban tugas.', 'alert', 'Nama Belum Dipilih', '');
            return;
        }

        if (!materi) {
            if (subMateriInput) subMateriInput.focus();
            await showCustomModal('Judul atau topik tugas belum terisi.', 'alert', 'Data Belum Lengkap', '');
            return;
        }

        // Konfirmasi identitas siswa sebelum submit agar tidak salah kirim atas nama siswa lain
        const isConfirmed = await showCustomModal(
            `Konfirmasi Pengiriman Tugas:\n\n👤 Nama Siswa: ${nama}\n🏫 Kelas: ${kelas}\n📚 Mapel: ${mapel}\n📝 Tugas: ${materi}\n\nPastikan identitas nama Anda sudah sesuai karena tanggapan tugas hanya dapat dikirim 1 kali. Lanjutkan pengiriman?`,
            'confirm',
            'Konfirmasi Pengiriman',
            ''
        );
        if (!isConfirmed) return;

        // Simpan ke localStorage siswa
        localStorage.setItem('student_nama', nama);
        localStorage.setItem('student_kelas', kelas);
        if (globalNameInput) globalNameInput.value = nama;
        if (globalKelasSelect) globalKelasSelect.value = kelas;
        updateStudentProfileUI(kelas);

        // Database level check: Cegah siswa mengirimkan jawaban lebih dari 1 kali
        if (assignmentId) {
            const { data: existingSub } = await supabase
                .from('files')
                .select('id, created_at')
                .eq('assignment_id', assignmentId)
                .ilike('nama', nama.trim())
                .maybeSingle();

            if (existingSub) {
                const subDate = existingSub.created_at ? new Date(existingSub.created_at).toLocaleString('id-ID') : '';
                await showCustomModal(
                    `Akses Dibatasi: Anda (${nama}) sudah tercatat mengumpulkan tugas ini sebelumnya pada ${subDate}.\n\nSesuai ketentuan, setiap siswa hanya berhak mengirimkan 1 kali tanggapan. Jawaban tidak dapat dikirim ulang.`,
                    'alert',
                    'Tanggapan Terkunci (1x Saja)',
                    ''
                );
                if (subSubmitBtn) {
                    subSubmitBtn.disabled = true;
                    subSubmitBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    subSubmitBtn.innerText = 'TANGGAPAN SUDAH TERKIRIM (TERKUNCI)';
                }
                return;
            }
        } else if (materi) {
            const { data: existingSub } = await supabase
                .from('files')
                .select('id, created_at')
                .ilike('materi', materi.trim())
                .ilike('nama', nama.trim())
                .maybeSingle();

            if (existingSub) {
                await showCustomModal(
                    `Akses Dibatasi: Anda (${nama}) sudah pernah mengumpulkan tugas "${materi}".\n\nSistem membatasi pengumpulan hanya 1 kali dan tidak dapat dikirim ulang.`,
                    'alert',
                    'Tanggapan Terkunci (1x Saja)',
                    ''
                );
                if (subSubmitBtn) {
                    subSubmitBtn.disabled = true;
                    subSubmitBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    subSubmitBtn.innerText = 'TANGGAPAN SUDAH TERKIRIM (TERKUNCI)';
                }
                return;
            }
        }

        if (currentSubmissionMode === 'text') {
            if (currentFormQuestions && currentFormQuestions.length > 0) {
                // Evaluated in payload generation below
            } else {
                const textAnswer = subTextAnswerInput.value.trim();
                if (!textAnswer) {
                    await showCustomModal('Silakan tuliskan lembar jawaban tugas Anda terlebih dahulu.', 'alert', 'Jawaban Kosong', '');
                    return;
                }
            }
        } else if (currentSubmissionMode === 'file') {
            if (!fileInput.files || fileInput.files.length === 0) {
                await showCustomModal('Silakan pilih setidaknya 1 berkas tugas.', 'alert', 'Berkas Diperlukan', '');
                return;
            }
        } else {
            const linkUrl = linkUrlInput.value.trim();
            if (!linkUrl || (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://'))) {
                await showCustomModal('Tautan tidak valid! Mohon awali dengan http:// atau https://', 'alert', 'Tautan Tidak Valid', '');
                return;
            }
        }

        subSubmitBtn.innerText = 'Mengirim ke LMS...';
        subSubmitBtn.disabled = true;

        const loadingPopup = document.getElementById('loadingPopup');
        if (loadingPopup) {
            loadingPopup.classList.remove('hidden');
            loadingPopup.classList.add('flex');
        }

        try {
            let submittedDetail = '';

            if (currentSubmissionMode === 'text') {
                if (currentFormQuestions && currentFormQuestions.length > 0) {
                    const studentAnswers = [];
                    for (let i = 0; i < currentFormQuestions.length; i++) {
                        const q = currentFormQuestions[i];
                        const qNum = q.nomor || (i + 1);
                        const tipe = q.tipe || 'esai';
                        let val = '';

                        if (tipe === 'pg_kompleks') {
                            const checked = Array.from(document.querySelectorAll(`input[name="student_q_${qNum}"]:checked`)).map(c => c.value);
                            val = checked.join(',');
                        } else if (tipe === 'pg' || tipe === 'pilihan_ganda' || tipe === 'benar_salah') {
                            const checked = document.querySelector(`input[name="student_q_${qNum}"]:checked`);
                            if (checked) val = checked.value;
                        } else if (tipe === 'upload_foto') {
                            const fileInputEl = document.getElementById(`student_file_q_${qNum}`);
                            if (fileInputEl && fileInputEl.files && fileInputEl.files[0]) {
                                const file = fileInputEl.files[0];
                                if (file.size > 10 * 1024 * 1024) {
                                    throw new Error(`Berkas foto pada soal nomor ${qNum} melebihi batas 10MB!`);
                                }
                                const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                                const filePath = `form_${Date.now()}_${safeFilename}`;
                                const { error: upErr } = await supabase.storage.from('uploads').upload(filePath, file);
                                if (upErr) throw upErr;
                                const { data: pUrl } = supabase.storage.from('uploads').getPublicUrl(filePath);
                                val = pUrl.publicUrl;
                            } else {
                                // Fallback to previous submission answer if already present
                                const mySub = studentFiles.find(f => (f.assignment_id && String(f.assignment_id) === String(assignmentId)));
                                if (mySub && mySub.storage_path && mySub.storage_path.startsWith('FORM:')) {
                                    try {
                                        const parsedAnswers = JSON.parse(mySub.storage_path.replace('FORM:', ''));
                                        if (Array.isArray(parsedAnswers)) {
                                            const prevObj = parsedAnswers.find(pa => pa.nomor === qNum);
                                            if (prevObj && prevObj.jawaban_siswa) val = prevObj.jawaban_siswa;
                                        }
                                    } catch (_) {}
                                }
                            }
                        } else if (tipe === 'menjodohkan') {
                            const pairs = Array.isArray(q.pasangan) ? q.pasangan : [];
                            const matches = {};
                            let allFilled = true;
                            pairs.forEach((p, pIdx) => {
                                const sel = document.querySelector(`[name="student_match_${qNum}_${pIdx}"]`);
                                if (sel && sel.value) {
                                    matches[p.kiri] = sel.value;
                                } else {
                                    allFilled = false;
                                }
                            });
                            if (allFilled && Object.keys(matches).length > 0) {
                                val = matches;
                            }
                        } else {
                            const inputEl = document.querySelector(`[name="student_q_${qNum}"]`);
                            if (inputEl) val = inputEl.value.trim();
                        }

                        if (!val || (typeof val === 'object' && Object.keys(val).length === 0)) {
                            if (loadingPopup) {
                                loadingPopup.classList.add('hidden');
                                loadingPopup.classList.remove('flex');
                            }
                            await showCustomModal(`Soal Nomor ${qNum} belum dijawab atau belum lengkap! Mohon lengkapi semua butir soal terlebih dahulu.`, 'alert', 'Lengkapi Jawaban', '');
                            return;
                        }

                        studentAnswers.push({
                            nomor: qNum,
                            tipe,
                            pertanyaan: q.pertanyaan || '',
                            gambar_url: q.gambar_url || '',
                            opsi_a: q.opsi_a || '',
                            opsi_b: q.opsi_b || '',
                            opsi_c: q.opsi_c || '',
                            opsi_d: q.opsi_d || '',
                            jawaban_siswa: val,
                            kunci: q.kunci || '',
                            pasangan: q.pasangan || [],
                            bobot: q.bobot || 10
                        });
                    }

                    let totalObjektifScore = 0;
                    let hasEssayOrManual = false;

                    studentAnswers.forEach(item => {
                        const tipe = item.tipe || 'esai';
                        const bobot = Number(item.bobot) || 10;
                        const isPg = tipe === 'pg' || tipe === 'pilihan_ganda';
                        const isPgk = tipe === 'pg_kompleks' || tipe === 'pilihan_ganda_kompleks';
                        const isBs = tipe === 'benar_salah';
                        const isSingkat = tipe === 'singkat' || tipe === 'isian_singkat';
                        const isMatch = tipe === 'menjodohkan';

                        if (isPg) {
                            const isCorrect = String(item.jawaban_siswa || '').trim().toUpperCase() === String(item.kunci || '').trim().toUpperCase();
                            item.skor_guru = isCorrect ? bobot : 0;
                            item.catatan_guru = isCorrect ? 'Jawaban tepat sesuai kunci.' : `Jawaban kurang tepat (Kunci: ${item.kunci}).`;
                            totalObjektifScore += item.skor_guru;
                        } else if (isPgk) {
                            const studentAns = item.jawaban_siswa || [];
                            const studentKeys = (Array.isArray(studentAns) ? studentAns : String(studentAns).split(',')).map(s => s.trim().toUpperCase()).filter(Boolean).sort();
                            const correctKeys = (item.kunci || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean).sort();
                            const isCorrect = studentKeys.length > 0 && studentKeys.join(',') === correctKeys.join(',');
                            item.skor_guru = isCorrect ? bobot : 0;
                            item.catatan_guru = isCorrect ? 'Pilihan ganda kompleks tepat.' : `Pilihan kurang tepat (Kunci: ${correctKeys.join(', ')}).`;
                            totalObjektifScore += item.skor_guru;
                        } else if (isBs) {
                            const isCorrect = String(item.jawaban_siswa || '').trim().toUpperCase() === String(item.kunci || '').trim().toUpperCase();
                            item.skor_guru = isCorrect ? bobot : 0;
                            item.catatan_guru = isCorrect ? 'Jawaban tepat sesuai kunci kebenaran.' : `Jawaban kurang tepat (Kunci: ${item.kunci}).`;
                            totalObjektifScore += item.skor_guru;
                        } else if (isSingkat) {
                            const isHasKey = Boolean(String(item.kunci || '').trim());
                            if (isHasKey) {
                                const isCorrect = String(item.jawaban_siswa || '').trim().toLowerCase() === String(item.kunci || '').trim().toLowerCase();
                                item.skor_guru = isCorrect ? bobot : 0;
                                item.catatan_guru = isCorrect ? 'Jawaban isian singkat tepat sesuai kunci.' : `Jawaban singkat belum tepat (Kunci: ${item.kunci}).`;
                                totalObjektifScore += item.skor_guru;
                            } else {
                                hasEssayOrManual = true;
                                item.skor_guru = null;
                                item.catatan_guru = 'Menunggu evaluasi guru/AI (Isian singkat terbuka).';
                            }
                        } else if (isMatch) {
                            const pairs = Array.isArray(item.pasangan) ? item.pasangan : [];
                            const studentMatches = (typeof item.jawaban_siswa === 'object' && item.jawaban_siswa !== null) ? item.jawaban_siswa : {};
                            let matchCount = 0;
                            pairs.forEach(p => {
                                if (String(studentMatches[p.kiri] || '').trim().toLowerCase() === String(p.kanan || '').trim().toLowerCase()) {
                                    matchCount++;
                                }
                            });
                            const matchScore = pairs.length > 0 ? Math.round(bobot * (matchCount / pairs.length)) : 0;
                            item.skor_guru = matchScore;
                            item.catatan_guru = `Berhasil menjodohkan ${matchCount} dari ${pairs.length} pasangan dengan tepat.`;
                            totalObjektifScore += matchScore;
                        } else {
                            hasEssayOrManual = true;
                            item.skor_guru = null;
                            if (tipe === 'link') {
                                item.catatan_guru = 'Menunggu evaluasi guru (Tautan tugas siswa).';
                            } else if (tipe === 'upload_foto') {
                                item.catatan_guru = 'Menunggu evaluasi guru/AI (Lampiran berkas/foto siswa).';
                            } else {
                                item.catatan_guru = 'Menunggu evaluasi guru/AI (Jawaban esai/uraian siswa).';
                            }
                        }
                    });

                    const displayFilename = `[Form Web] ${materi} (${studentAnswers.length} Soal)`;
                    const payload = {
                        nama,
                        kelas,
                        materi,
                        mapel,
                        assignment_id: assignmentId,
                        filename: displayFilename,
                        storage_path: `FORM:${JSON.stringify(studentAnswers)}`,
                        link_url: null,
                        tipe: 'form',
                        nilai: hasEssayOrManual ? (totalObjektifScore > 0 ? totalObjektifScore : null) : totalObjektifScore,
                        status_koreksi: hasEssayOrManual ? 'belum_dikoreksi' : 'sudah_dikoreksi',
                        catatan_guru: hasEssayOrManual 
                            ? (totalObjektifScore > 0 ? `Skor sementara objektif: ${totalObjektifScore} poin (Menunggu penilaian soal esai).` : 'Menunggu pemeriksaan dan penilaian guru.')
                            : 'Tuntas otomatis oleh sistem.'
                    };

                    const { error: dbError } = await supabase.from('files').insert([payload]);
                    if (dbError) throw dbError;
                    submittedDetail = `Form Soal Online (${studentAnswers.length} Soal Terjawab)`;
                } else {
                    const textAnswer = subTextAnswerInput.value.trim();
                    const displayFilename = `[Form Web] ${materi}`;

                    const payload = {
                        nama,
                        kelas,
                        materi,
                        mapel,
                        assignment_id: assignmentId,
                        filename: displayFilename,
                        storage_path: `TEXT:${textAnswer}`,
                        link_url: null,
                        tipe: 'text',
                        status_koreksi: 'belum_dikoreksi'
                    };

                    const { error: dbError } = await supabase.from('files').insert([payload]);
                    if (dbError) throw dbError;
                    submittedDetail = textAnswer.length > 90 ? textAnswer.slice(0, 90) + '...' : textAnswer;
                }
            } else if (currentSubmissionMode === 'file') {
                let fileNames = [];
                for (let i = 0; i < fileInput.files.length; i++) {
                    const file = fileInput.files[i];
                    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                    const filePath = `${Date.now()}_${safeFilename}`;
                    
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('uploads')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const payload = {
                        nama,
                        kelas,
                        materi,
                        mapel,
                        assignment_id: assignmentId,
                        filename: file.name,
                        storage_path: uploadData.path,
                        tipe: 'file',
                        status_koreksi: 'belum_dikoreksi'
                    };

                    const { error: dbError } = await supabase.from('files').insert([payload]);
                    if (dbError) throw dbError;
                    fileNames.push(file.name);
                }
                submittedDetail = fileNames.join(', ');
            } else {
                const linkUrl = linkUrlInput.value.trim();
                const linkNote = linkNoteInput.value.trim();
                const platform = detectPlatform(linkUrl);
                const displayFilename = linkNote ? `[${platform.name}] ${linkNote}` : `[${platform.name}] Tautan Tugas`;

                const payload = {
                    nama,
                    kelas,
                    materi,
                    mapel,
                    assignment_id: assignmentId,
                    filename: displayFilename,
                    storage_path: `LINK:${linkUrl}`,
                    link_url: linkUrl,
                    tipe: 'link',
                    status_koreksi: 'belum_dikoreksi'
                };

                const { error: dbError } = await supabase.from('files').insert([payload]);
                if (dbError) throw dbError;
                submittedDetail = linkUrl;
            }

            if (loadingPopup) {
                loadingPopup.classList.add('hidden');
                loadingPopup.classList.remove('flex');
            }

            closeSubmissionModal();

            // Tampilkan Resi Bukti Pengumpulan Resmi
            showReceiptModal({
                receiptId: 'TGS-' + Math.floor(100000 + Math.random() * 900000),
                time: new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
                student: nama,
                meta: `${kelas} • ${mapel}`,
                title: materi,
                detail: submittedDetail
            });

            // Refresh data tugas
            loadStudentAssignments();

        } catch (e) {
            console.error(e);
            if (loadingPopup) {
                loadingPopup.classList.add('hidden');
                loadingPopup.classList.remove('flex');
            }
            await showCustomModal('Gagal mengirim tugas: ' + e.message, 'alert', 'Gagal', '');
        } finally {
            subSubmitBtn.innerText = 'KIRIM TUGAS SEKARANG ';
            subSubmitBtn.disabled = false;
        }
    });

    function showReceiptModal(data) {
        document.getElementById('receipt-id').textContent = data.receiptId || '-';
        document.getElementById('receipt-time').textContent = data.time || '-';
        document.getElementById('receipt-student').textContent = data.student || '-';
        document.getElementById('receipt-meta').textContent = data.meta || '-';
        document.getElementById('receipt-title').textContent = data.title || '-';
        document.getElementById('receipt-detail').textContent = data.detail || '-';

        const modal = document.getElementById('receipt-modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    window.closeReceiptModal = () => {
        const modal = document.getElementById('receipt-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };

    // ==========================================
    // 6. TAB 2: PERPUSTAKAAN MATERI BELAJAR
    // ==========================================
    async function loadStudentMaterials() {
        const container = document.getElementById('student-materials-list');
        const filterSelect = document.getElementById('filter-materi-mapel');
        if (!container) return;

        container.innerHTML = '<div class="col-span-2 text-center py-8 font-bold text-slate-400 uppercase animate-pulse">Memuat materi belajar...</div>';

        try {
            const { data, error } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            allMaterials = data || [];

            // Isi filter mapel
            const mapelSet = new Set(allMaterials.map(m => m.mapel));
            filterSelect.innerHTML = '<option value="">Semua Mapel</option>';
            mapelSet.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m; opt.textContent = m;
                filterSelect.appendChild(opt);
            });

            renderStudentMaterials();
            updatePortalOverviewStats();
        } catch (e) {
            container.innerHTML = `<div class="col-span-2 text-center text-red-500 font-bold">Gagal memuat materi: ${e.message}</div>`;
        }
    }

    function renderStudentMaterials() {
        const container = document.getElementById('student-materials-list');
        const filterVal = document.getElementById('filter-materi-mapel')?.value || '';
        const studentKelas = globalKelasSelect?.value || '';

        if (!container) return;
        container.innerHTML = '';

        const filtered = allMaterials.filter(m => {
            const matchMapel = !filterVal || m.mapel === filterVal;
            const matchKelas = !studentKelas || isClassMatch(m.kelas, studentKelas);
            return matchMapel && matchKelas;
        });

        if (filtered.length === 0) {
            container.innerHTML = '<div class="col-span-2 text-center py-8 text-slate-500 font-bold uppercase">Belum ada materi pembelajaran untuk kelas ini.</div>';
            return;
        }

        filtered.forEach(m => {
            const card = document.createElement('div');
            card.className = "bg-white border-2 sm:border-[3px] border-black rounded-2xl sm:rounded-[28px] p-4 sm:p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between";
            card.innerHTML = `
                <div>
                    <div class="flex items-center gap-2 mb-2">
                        <span class="bg-indigo-100 text-indigo-900 border border-indigo-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            ${m.mapel} &bull; Kelas ${m.kelas}
                        </span>
                    </div>
                    <h4 class="font-black text-lg text-black mb-2">${m.judul}</h4>
                    <p class="text-xs text-slate-700 font-medium leading-relaxed mb-3 whitespace-pre-line">${m.konten}</p>
                </div>
                ${m.link_video ? `
                    <div class="pt-2 border-t border-slate-100">
                        <a href="${m.link_video}" target="_blank" class="inline-flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:text-black transition">
                            <span>Tonton Video Pembelajaran</span> ↗
                        </a>
                    </div>
                ` : ''}
            `;
            container.appendChild(card);
        });
    }

    window.filterStudentMaterials = () => {
        renderStudentMaterials();
    };

    // ==========================================
    // 7. TAB 3: UJIAN & KUIS ONLINE SISWA
    // ==========================================
    async function loadStudentQuizzes() {
        const container = document.getElementById('student-quizzes-list');
        const filterSelect = document.getElementById('filter-quiz-mapel');
        if (!container) return;

        container.innerHTML = '<div class="bg-white border-2 border-black rounded-2xl p-6 text-center font-bold text-slate-500 uppercase animate-pulse">Memuat daftar ujian aktif...</div>';

        try {
            let quizList = [];
            const { data, error } = await supabase.rpc('list_student_quizzes');
            if (error) {
                console.warn('RPC list_student_quizzes tidak ditemukan / error (404), fallback ke tabel quizzes:', error);
                const { data: directData, error: dirErr } = await supabase
                    .from('quizzes')
                    .select('*')
                    .eq('status', 'aktif')
                    .order('created_at', { ascending: false });
                if (dirErr) throw error;
                quizList = (directData || []).map(q => ({
                    ...q,
                    petunjuk: (q.petunjuk || '').replace(/\[CONFIG:[^]]*\]/g, ''),
                    token_required: (q.token_required ?? (!!q.token && q.token.trim() !== '')) && !!q.token
                }));
            } else {
                quizList = Array.isArray(data) ? data : [];
            }
            allQuizzes = quizList;

            // Riwayat submit kuis siswa aktif (data aman, tanpa kunci jawaban)
            const studentName = getActiveStudentName();
            const studentKelas = getActiveStudentKelas();
            if (studentName) {
                let mySubs = [];
                const { data: rpcSubs, error: subErr } = await supabase.rpc('get_student_exam_submissions', {
                    p_student_id: '',
                    p_student_name: studentName,
                    p_kelas: studentKelas || ''
                });
                if (subErr) {
                    console.warn('RPC get_student_exam_submissions fallback:', subErr);
                    let q = supabase
                        .from('quiz_submissions')
                        .select('id, quiz_id, student_id, nama_siswa, kelas, status_koreksi, skor_pg, skor_esai, total_nilai, created_at')
                        .ilike('nama_siswa', studentName)
                        .order('created_at', { ascending: false });
                    if (studentKelas) q = q.eq('kelas', studentKelas);
                    const { data: dirSubs } = await q;
                    mySubs = dirSubs || [];
                } else {
                    mySubs = (Array.isArray(rpcSubs) ? rpcSubs : []).filter(sub => {
                        if (studentKelas && sub.kelas) return isClassMatch(sub.kelas, studentKelas);
                        return true;
                    });
                }
                studentQuizSubmissions = mySubs;
            } else {
                studentQuizSubmissions = [];
            }

            // Populate Mapel Filter
            const mapelSet = new Set(allQuizzes.map(q => q.mapel));
            if (filterSelect) {
                filterSelect.innerHTML = '<option value="">Semua Mapel</option>';
                mapelSet.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m; opt.textContent = m;
                    filterSelect.appendChild(opt);
                });
            }

            renderStudentQuizzes();
            updatePortalOverviewStats();
        } catch (e) {
            container.innerHTML = `<div class="bg-white border-2 border-black rounded-2xl p-6 text-center text-red-600 font-bold">Gagal memuat ujian: ${e.message}</div>`;
        }
    }

    window.showMyQuizResult = (subId) => {
        const sub = studentQuizSubmissions.find(s => String(s.id) === String(subId));
        if (!sub) return;
        const quiz = allQuizzes.find(q => String(q.id) === String(sub.quiz_id));
        const judul = quiz?.judul_kuis || 'Ujian Online';
        const mapel = quiz?.mapel || 'Ujian';

        let statusText = 'Menunggu Koreksi Guru';
        if (sub.status_koreksi === 'selesai') statusText = 'Sudah Dinilai Lengkap';
        else if (sub.status_koreksi === 'terkunci_curang') statusText = 'UJIAN DIBEKUKAN (Pelanggaran Anti-Kecurangan)';

        showCustomModal(
            `Mata Pelajaran: ${mapel}\n` +
            `Judul Ujian: ${judul}\n` +
            `Nama Siswa: ${sub.nama_siswa} (${sub.kelas})\n\n` +
            `Skor Objektif : ${sub.skor_pg || 0}\n` +
            `Skor Subjektif: ${sub.skor_esai || 0}\n` +
            `TOTAL NILAI   : ${sub.total_nilai || 0} / 100\n\n` +
            `Status: ${statusText}`,
            'alert',
            'Hasil Ujian Siswa',
            ''
        );
    };

    function renderStudentQuizzes() {
        const container = document.getElementById('student-quizzes-list');
        const filterMapel = document.getElementById('filter-quiz-mapel')?.value || '';
        const studentKelas = globalKelasSelect?.value || '';

        if (!container) return;
        container.innerHTML = '';

        const filtered = allQuizzes.filter(q => {
            const matchMapel = !filterMapel || q.mapel === filterMapel;
            const matchKelas = !studentKelas || isClassMatch(q.kelas, studentKelas);
            return matchMapel && matchKelas;
        });

        if (filtered.length === 0) {
            container.innerHTML = '<div class="bg-white border-2 border-black rounded-2xl p-8 text-center font-bold text-slate-500 uppercase">Saat ini tidak ada ujian aktif untuk kelas ini.</div>';
            return;
        }

        filtered.forEach(q => {
            const questions = q.quiz_questions || [];
            const mySub = studentQuizSubmissions.find(s => String(s.quiz_id) === String(q.id));
            const { cleanPetunjuk, config } = parseQuizConfig(q.petunjuk || '', q);

            let examStatusBadge = '';
            let actionBtnHtml = '';

            if (mySub) {
                const isLocked = mySub.status_koreksi === 'terkunci_curang';
                const isOngoing = mySub.status_koreksi === 'sedang_ujian';

                if (isLocked) {
                    examStatusBadge = `
                        <span class="bg-red-100 text-red-900 border border-red-500 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            Dibekukan &bull; Pelanggaran Anti-Cheat
                        </span>
                    `;
                    actionBtnHtml = `
                        <button type="button" onclick="showMyQuizResult('${mySub.id}')" class="w-full sm:w-auto px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-900 border-2 border-red-500 font-black text-xs uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 text-center flex items-center justify-center shrink-0">
                            Status Pelanggaran
                        </button>
                    `;
                } else if (isOngoing) {
                    examStatusBadge = `
                        <span class="bg-yellow-200 text-yellow-950 border border-yellow-500 text-[10px] font-black px-2 py-0.5 rounded uppercase animate-pulse">
                            Sedang Dikerjakan (Live)
                        </span>
                    `;
                    actionBtnHtml = `
                        <button type="button" onclick="openExamTokenModal('${q.id}')" class="w-full sm:w-auto px-5 py-2.5 bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black font-black text-xs uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 text-center flex items-center justify-center shrink-0">
                            Lanjutkan Ujian
                        </button>
                    `;
                } else {
                    const isReview = mySub.status_koreksi === 'belum_dikoreksi' || mySub.status_koreksi === 'perlu_dinilai';
                    examStatusBadge = `
                        <span class="${isReview ? 'bg-amber-100 text-amber-900 border border-amber-400' : 'bg-emerald-100 text-emerald-900 border border-emerald-400'} text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            ${isReview ? 'Menunggu Koreksi Guru' : `Selesai &bull; Skor: ${mySub.total_nilai}/100`} &bull; 1x Pengerjaan
                        </span>
                    `;
                    actionBtnHtml = `
                        <button type="button" onclick="showMyQuizResult('${mySub.id}')" class="w-full sm:w-auto px-4 py-2.5 bg-emerald-400 hover:bg-emerald-500 text-black border-2 border-black font-black text-xs uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 text-center flex items-center justify-center shrink-0">
                            Lihat Skor Nilai
                        </button>
                    `;
                }
            } else {
                examStatusBadge = `
                    <span class="bg-red-100 text-red-800 border border-red-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                        Belum Dikerjakan
                    </span>
                `;
                actionBtnHtml = `
                    <button type="button" onclick="openExamTokenModal('${q.id}')" class="w-full sm:w-auto px-5 py-2.5 bg-black hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 text-center flex items-center justify-center shrink-0">
                        Mulai Ujian
                    </button>
                `;
            }

            const isTokenRequired = config.token_required !== false;

            const card = document.createElement('div');
            card.className = "bg-white border-2 sm:border-[3px] border-black rounded-2xl p-4 sm:p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 sm:gap-4";
            card.innerHTML = `
                <div>
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                        <span class="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            ${escapeHtml(q.mapel)} &bull; Kelas ${escapeHtml(q.kelas)}
                        </span>
                        <span class="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            Durasi: ${q.durasi_menit || 45} Menit
                        </span>
                        <span class="bg-indigo-100 text-indigo-900 border border-indigo-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            ${q.question_count ?? questions.length} Soal
                        </span>
                        ${isTokenRequired ? `
                            <span class="bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                Wajib Token Pengawas
                            </span>
                        ` : ''}
                        ${examStatusBadge}
                    </div>
                    <h4 class="font-black text-xl text-black">${escapeHtml(q.judul_kuis)}</h4>
                    <p class="text-xs text-slate-600 font-bold mt-0.5">${escapeHtml(cleanPetunjuk || 'Kerjakan dengan teliti dan jujur.')}</p>
                </div>
                ${actionBtnHtml}
            `;
            container.appendChild(card);
        });
    }

    window.filterStudentQuizzes = () => {
        renderStudentQuizzes();
    };

    // ========================================================
    // CBT EXAM ENGINE & ANTI-CHEAT ENFORCEMENT SYSTEM
    // ========================================================
    let activeCbtExam = null;
    let isWarningActive = false;
    let cbtRealtimeChannel = null;
    let lockedPollingInterval = null;

    function updateStudentViolationUI(cheatCount, isLocked = false) {
        const cheatIndText = document.getElementById('cbt-cheat-count-text');
        const cheatIndBox = document.getElementById('cbt-cheat-indicator');
        if (cheatIndText) {
            cheatIndText.textContent = `Anti-Cheat: ${cheatCount} Pelanggaran`;
        }
        if (cheatIndBox) {
            if (isLocked || cheatCount >= (activeCbtExam?.violationLimit || 3)) {
                cheatIndBox.className = "bg-rose-100 border-2 border-rose-500 text-rose-950 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
            } else if (cheatCount > 0) {
                cheatIndBox.className = "bg-amber-100 border-2 border-amber-500 text-amber-950 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
            } else {
                cheatIndBox.className = "bg-emerald-100 border-2 border-emerald-400 text-emerald-950 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
            }
        }
    }

    function handleServerExamUpdate(sub) {
        if (!activeCbtExam || !sub) return;
        let jawaban = sub.jawaban_siswa;
        if (typeof jawaban === 'string') {
            try { jawaban = JSON.parse(jawaban); } catch (_) { jawaban = {}; }
        }
        const serverCheats = Number(jawaban?.cheatAttempts || 0);

        // 1. Jika guru klik PAKSA SELESAI
        if (sub.status_koreksi === 'selesai') {
            showCustomModal("Ujian Anda telah diselesaikan oleh Guru Pengawas.", "alert", "Ujian Selesai", "");
            window.confirmSubmitCbtExam({ skipConfirm: true, teacherForceSubmit: true });
            return;
        }

        // 2. Jika guru me-RESET PELANGGARAN atau MEMBUKA KUNCI
        if (sub.status_koreksi === 'sedang_ujian' && (serverCheats === 0 || !!jawaban?.unlockedAt)) {
            activeCbtExam.cheatAttempts = 0;
            activeCbtExam.cheatLogs = [];
            activeCbtExam.isLocked = false;
            isWarningActive = false;
            saveCbtExamStateLocally();

            updateStudentViolationUI(0, false);

            const warningOverlay = document.getElementById('cheat-warning-overlay');
            if (warningOverlay) warningOverlay.classList.add('hidden');
            const lockedOverlay = document.getElementById('cheat-locked-overlay');
            if (lockedOverlay) lockedOverlay.classList.add('hidden');

            resumeCbtTimerIfNeeded();
        }
    }

    function subscribeToStudentExamRealtime(submissionId) {
        if (cbtRealtimeChannel) {
            try { supabase.removeChannel(cbtRealtimeChannel); } catch (_) {}
            cbtRealtimeChannel = null;
        }
        if (!submissionId) return;

        try {
            cbtRealtimeChannel = supabase.channel(`student_exam_${submissionId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'quiz_submissions',
                        filter: `id=eq.${submissionId}`
                    },
                    (payload) => {
                        handleServerExamUpdate(payload.new);
                    }
                )
                .subscribe();
        } catch (_) {}
    }

    function resumeCbtTimerIfNeeded() {
        if (!activeCbtExam) return;
        if (lockedPollingInterval) {
            clearInterval(lockedPollingInterval);
            lockedPollingInterval = null;
        }
        if (!activeCbtExam.timerInterval) {
            const timerEl = document.getElementById('quiz-timer');
            activeCbtExam.timerInterval = setInterval(() => {
                activeCbtExam.timerSeconds--;
                const m = Math.floor(activeCbtExam.timerSeconds / 60);
                const s = activeCbtExam.timerSeconds % 60;
                if (timerEl) {
                    timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                }

                // Kirim sinkronisasi status live setiap 2 detik
                if (activeCbtExam.timerSeconds % 2 === 0) {
                    const hasFocus = !document.hidden && document.hasFocus();
                    reportExamPresence(hasFocus);
                }

                if (activeCbtExam.timerSeconds <= 0) {
                    activeCbtExam.timerSeconds = 0;
                    clearInterval(activeCbtExam.timerInterval);
                    window.confirmSubmitCbtExam({ skipConfirm: true });
                }
            }, 1000);
            addAntiCheatListeners();
        }
    }

    function enterExamMode() {
        const header = document.getElementById('portal-global-header');
        const profileCard = document.getElementById('portal-student-profile-card');
        const classBanner = document.getElementById('student-class-alert-banner');
        const navbar = document.getElementById('portal-student-navbar');
        const tabs = document.getElementById('portal-student-tabs');
        const landing = document.getElementById('quiz-portal-landing');
        const room = document.getElementById('quiz-room-container');
        const footer = document.querySelector('footer');
        const pageContainer = document.getElementById('portal-page-container');

        [header, profileCard, classBanner, navbar, tabs, landing, footer].forEach(el => {
            if (el) {
                el.classList.add('hidden', '!hidden');
                el.style.display = 'none';
            }
        });

        if (pageContainer) {
            pageContainer.classList.remove('pb-20');
        }

        if (room) {
            room.classList.remove('hidden', '!hidden');
            room.style.display = 'block';
        }

        document.querySelectorAll('.portal-view').forEach(v => {
            if (v.id !== 'view-ujian') {
                v.classList.add('hidden', '!hidden');
                v.style.display = 'none';
            }
        });
        const viewUjian = document.getElementById('view-ujian');
        if (viewUjian) {
            viewUjian.classList.remove('hidden', '!hidden');
            viewUjian.style.display = 'block';
        }
    }

    function exitExamMode() {
        if (cbtRealtimeChannel) {
            try { supabase.removeChannel(cbtRealtimeChannel); } catch (_) {}
            cbtRealtimeChannel = null;
        }
        if (lockedPollingInterval) {
            clearInterval(lockedPollingInterval);
            lockedPollingInterval = null;
        }
        const header = document.getElementById('portal-global-header');
        const profileCard = document.getElementById('portal-student-profile-card');
        const classBanner = document.getElementById('student-class-alert-banner');
        const navbar = document.getElementById('portal-student-navbar');
        const tabs = document.getElementById('portal-student-tabs');
        const landing = document.getElementById('quiz-portal-landing');
        const room = document.getElementById('quiz-room-container');
        const footer = document.querySelector('footer');
        const pageContainer = document.getElementById('portal-page-container');

        [header, profileCard, classBanner, navbar, landing, footer].forEach(el => {
            if (el) {
                el.classList.remove('hidden', '!hidden');
                el.style.display = '';
            }
        });
        if (tabs) {
            tabs.classList.add('hidden', '!hidden');
            tabs.style.display = 'none';
        }

        if (pageContainer) {
            pageContainer.classList.add('pb-20');
        }

        if (room) {
            room.classList.add('hidden', '!hidden');
            room.style.display = 'none';
        }

        try {
            sessionStorage.removeItem('cbt_active_exam_session');
        } catch (_) {}
    }

    async function requestFullscreenLock() {
        try {
            const el = document.documentElement;
            if (el.requestFullscreen) {
                await el.requestFullscreen();
            } else if (el.webkitRequestFullscreen) {
                await el.webkitRequestFullscreen();
            } else if (el.msRequestFullscreen) {
                await el.msRequestFullscreen();
            }
        } catch (_) {}
    }

    function exitFullscreenLock() {
        try {
            if (document.fullscreenElement || document.webkitFullscreenElement) {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            }
        } catch (_) {}
    }

    function pushExamProgressToServer({ isFocus = true, isOnline = true, reason = '' } = {}) {
        if (!activeCbtExam || !activeCbtExam.submissionId) return;
        supabase.rpc('sync_exam_progress', {
            p_submission_id: activeCbtExam.submissionId,
            p_session_key: activeCbtExam.sessionKey || '',
            p_answers: activeCbtExam.answers || {},
            p_doubtful: activeCbtExam.doubtful || {},
            p_cheat_attempts: activeCbtExam.cheatAttempts || 0,
            p_cheat_logs: activeCbtExam.cheatLogs || [],
            p_remaining_seconds: activeCbtExam.timerSeconds,
            p_is_focus: isFocus,
            p_is_online: isOnline,
            p_reason: reason
        }).then(({ data }) => {
            if (data && typeof data === 'object') {
                if (data.status === 'selesai') {
                    showCustomModal("Ujian Anda telah diselesaikan oleh Guru Pengawas.", "alert", "Ujian Selesai", "");
                    window.confirmSubmitCbtExam({ skipConfirm: true, teacherForceSubmit: true });
                    return;
                }
                const srvCheats = Number(data.serverCheatAttempts);
                // Jika Guru me-reset pelanggaran di server menjadi 0, sinkronkan memori & UI siswa seketika!
                if (srvCheats === 0 && activeCbtExam.cheatAttempts > 0) {
                    activeCbtExam.cheatAttempts = 0;
                    activeCbtExam.cheatLogs = [];
                    activeCbtExam.isLocked = false;
                    isWarningActive = false;
                    saveCbtExamStateLocally();
                    updateStudentViolationUI(0, false);
                    const warningOverlay = document.getElementById('cheat-warning-overlay');
                    if (warningOverlay) warningOverlay.classList.add('hidden');
                    const lockedOverlay = document.getElementById('cheat-locked-overlay');
                    if (lockedOverlay) lockedOverlay.classList.add('hidden');
                    resumeCbtTimerIfNeeded();
                }
            }
        }).catch(() => {});
    }

    function reportExamPresence(isFocus, reason = '') {
        if (!activeCbtExam) return;
        activeCbtExam.isFocus = isFocus;
        activeCbtExam.lastActiveAt = new Date().toISOString();

        saveCbtExamStateLocally();
        pushExamProgressToServer({ isFocus, isOnline: true, reason: reason || (isFocus ? 'fokus' : 'tidak_fokus') });
    }

    function onFullscreenChange() {
        if (!activeCbtExam || !activeCbtExam.fullscreenEnabled) return;
        const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        if (!isFull) {
            handleViolation("Meninggalkan mode layar penuh (Fullscreen) dilarang!");
        } else {
            reportExamPresence(true, "Kembali ke mode Fullscreen");
        }
    }

    function onVisibilityChange() {
        if (!activeCbtExam) return;
        if (document.hidden) {
            handleViolation("Berpindah tab atau meminimalkan browser terdeteksi!");
        } else {
            reportExamPresence(true, "Kembali ke tab ujian");
        }
    }

    function onWindowBlur() {
        if (!activeCbtExam) return;
        handleViolation("Jendela ujian kehilangan fokus (membuka aplikasi lain / split screen)!");
    }

    function onWindowFocus() {
        if (!activeCbtExam) return;
        reportExamPresence(true, "Jendela ujian kembali fokus");
    }

    function onBeforeUnload() {
        if (!activeCbtExam || !activeCbtExam.submissionId) return;
        try {
            pushExamProgressToServer({ isFocus: false, isOnline: false, reason: "Siswa menutup tab/halaman" });
        } catch (_) {}
    }

    function onKeyDown(e) {
        if (!activeCbtExam) return;
        // Blokir F12, DevTools shortcuts, Ctrl+U
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) || (e.ctrlKey && e.key.toUpperCase() === 'U')) {
            e.preventDefault();
            e.stopPropagation();
            handleViolation("Membuka Developer Tools / Inspect Element dilarang!");
            return false;
        }
        // Blokir pintasan salin/tempel/cetak
        if (e.ctrlKey && ['C', 'V', 'X', 'P'].includes(e.key.toUpperCase())) {
            e.preventDefault();
            e.stopPropagation();
            handleViolation(`Kombinasi tombol Ctrl+${e.key.toUpperCase()} dilarang saat ujian!`);
            return false;
        }
    }

    function onContextMenu(e) {
        if (!activeCbtExam) return;
        e.preventDefault();
        return false;
    }

    function onCopyCut(e) {
        if (!activeCbtExam) return;
        e.preventDefault();
        return false;
    }

    function onPopState() {
        if (!activeCbtExam) return;
        history.pushState(null, document.title, location.href);
    }

    function addAntiCheatListeners() {
        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', onFullscreenChange);
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('blur', onWindowBlur);
        window.addEventListener('focus', onWindowFocus);
        window.addEventListener('beforeunload', onBeforeUnload);
        window.addEventListener('pagehide', onBeforeUnload);
        window.addEventListener('keydown', onKeyDown, true);
        document.addEventListener('contextmenu', onContextMenu);
        document.addEventListener('copy', onCopyCut);
        document.addEventListener('cut', onCopyCut);
        window.addEventListener('popstate', onPopState);
        history.pushState(null, document.title, location.href);
    }

    function removeAntiCheatListeners() {
        document.removeEventListener('fullscreenchange', onFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('blur', onWindowBlur);
        window.removeEventListener('focus', onWindowFocus);
        window.removeEventListener('beforeunload', onBeforeUnload);
        window.removeEventListener('pagehide', onBeforeUnload);
        window.removeEventListener('keydown', onKeyDown, true);
        document.removeEventListener('contextmenu', onContextMenu);
        document.removeEventListener('copy', onCopyCut);
        document.removeEventListener('cut', onCopyCut);
        window.removeEventListener('popstate', onPopState);
    }

    function handleViolation(reason) {
        if (!activeCbtExam) return;

        // Satu kejadian (blur + visibility + fullscreen) bisa memicu beberapa event.
        // Abaikan duplikat dalam 2 detik, tetapi jangan kunci pelanggaran berikutnya.
        const now = Date.now();
        if (activeCbtExam.lastViolationAt && now - activeCbtExam.lastViolationAt < 2000) return;
        activeCbtExam.lastViolationAt = now;
        
        activeCbtExam.cheatAttempts++;
        activeCbtExam.cheatLogs.push({
            reason,
            time: new Date().toISOString()
        });

        // 1. SIMPAN SEKETIKA KE STORAGE LOKAL
        saveCbtExamStateLocally();

        // 2. UPDATE BADGE & WARNA INDIKATOR DI TAB SISWA SEKETIKA (REALTIME 0 DELAY!)
        updateStudentViolationUI(activeCbtExam.cheatAttempts, false);

        // 3. PUSH LANGSUNG KE SERVER SUPABASE (0 DELAY)
        pushExamProgressToServer({ isFocus: false, isOnline: true, reason });

        // 4. CEK BATAS LIMIT PELANGGARAN SEGERA!
        // Sesuai sistem CBT: Jika limit tercapai, BEKUKAN LANGSUNG. Jangan tunggu countdown selesai!
        if (activeCbtExam.violationLimit > 0 && activeCbtExam.cheatAttempts >= activeCbtExam.violationLimit) {
            isWarningActive = false;
            const warningOverlay = document.getElementById('cheat-warning-overlay');
            if (warningOverlay) warningOverlay.classList.add('hidden');
            lockExamDueToCheating();
            return;
        }

        isWarningActive = true;
        const warningOverlay = document.getElementById('cheat-warning-overlay');
        const reasonEl = document.getElementById('cheat-warning-reason');
        const countEl = document.getElementById('cheat-warning-count');
        const timerEl = document.getElementById('cheat-warning-timer');

        if (reasonEl) reasonEl.textContent = reason;
        if (countEl) countEl.textContent = `Pelanggaran Ke: ${activeCbtExam.cheatAttempts} / Batas: ${activeCbtExam.violationLimit || 3}`;
        if (warningOverlay) warningOverlay.classList.remove('hidden');

        let countdown = 5;
        if (timerEl) timerEl.textContent = `Peringatan akan ditutup dalam ${countdown} detik...`;

        if (activeCbtExam.warningCountdownInterval) clearInterval(activeCbtExam.warningCountdownInterval);

        activeCbtExam.warningCountdownInterval = setInterval(async () => {
            countdown--;
            if (timerEl) timerEl.textContent = `Peringatan akan ditutup dalam ${countdown} detik...`;
            if (countdown <= 0) {
                clearInterval(activeCbtExam.warningCountdownInterval);
                if (warningOverlay) warningOverlay.classList.add('hidden');
                isWarningActive = false;

                if (activeCbtExam.fullscreenEnabled) {
                    await requestFullscreenLock();
                }
            }
        }, 1000);
    }

    async function lockExamDueToCheating() {
        if (!activeCbtExam) return;
        const exam = activeCbtExam;
        activeCbtExam.isLocked = true;
        removeAntiCheatListeners();
        exitFullscreenLock();
        if (exam.timerInterval) clearInterval(exam.timerInterval);
        exam.timerInterval = null;
        if (exam.warningCountdownInterval) clearInterval(exam.warningCountdownInterval);
        exam.warningCountdownInterval = null;

        updateStudentViolationUI(exam.cheatAttempts, true);

        try {
            if (exam.submissionId) {
                await supabase.rpc('lock_exam', {
                    p_submission_id: exam.submissionId,
                    p_session_key: exam.sessionKey || '',
                    p_answers: exam.answers || {},
                    p_doubtful: exam.doubtful || {},
                    p_cheat_attempts: exam.cheatAttempts || 0,
                    p_cheat_logs: exam.cheatLogs || []
                });
            }

            // Tandai juga di local storage bahwa statusnya terkunci
            const key = `cbt_exam_${exam.quizData.id}_${encodeURIComponent(exam.studentName)}`;
            localStorage.setItem(key, JSON.stringify({
                answers: exam.answers,
                doubtful: exam.doubtful,
                cheatAttempts: exam.cheatAttempts,
                cheatLogs: exam.cheatLogs,
                isLocked: true,
                status_koreksi: 'terkunci_curang'
            }));
        } catch (_) {}

        const lockedOverlay = document.getElementById('cheat-locked-overlay');
        if (lockedOverlay) lockedOverlay.classList.remove('hidden');

        // Polling darurat jika WebSocket tertunda: cek status buka kunci dari guru setiap 1.5 detik
        if (lockedPollingInterval) clearInterval(lockedPollingInterval);
        lockedPollingInterval = setInterval(async () => {
            if (!activeCbtExam || !activeCbtExam.submissionId) {
                if (lockedPollingInterval) clearInterval(lockedPollingInterval);
                return;
            }
            try {
                const { data } = await supabase
                    .from('quiz_submissions')
                    .select('id, status_koreksi, jawaban_siswa')
                    .eq('id', activeCbtExam.submissionId)
                    .single();
                if (data && data.status_koreksi === 'sedang_ujian') {
                    let jw = data.jawaban_siswa;
                    if (typeof jw === 'string') {
                        try { jw = JSON.parse(jw); } catch (_) { jw = {}; }
                    }
                    if (jw?.cheatAttempts === 0 || !!jw?.unlockedAt) {
                        if (lockedPollingInterval) clearInterval(lockedPollingInterval);
                        lockedPollingInterval = null;
                        handleServerExamUpdate(data);
                    }
                }
            } catch (_) {}
        }, 1500);
    }

    window.closeLockedExamAndReturn = () => {
        const lockedOverlay = document.getElementById('cheat-locked-overlay');
        if (lockedOverlay) lockedOverlay.classList.add('hidden');
        activeCbtExam = null;
        exitExamMode();
        switchStudentPortal('tugas');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    function saveCbtExamStateLocally() {
        if (!activeCbtExam) return;
        try {
            const key = `cbt_exam_${activeCbtExam.quizData.id}_${encodeURIComponent(activeCbtExam.studentName)}`;
            const state = {
                answers: activeCbtExam.answers,
                doubtful: activeCbtExam.doubtful,
                cheatAttempts: activeCbtExam.cheatAttempts,
                cheatLogs: activeCbtExam.cheatLogs,
                timerSeconds: activeCbtExam.timerSeconds,
                lastSavedAt: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(state));

            // Simpan pointer sesi aktif ke sessionStorage
            sessionStorage.setItem('cbt_active_exam_session', JSON.stringify({
                quizId: activeCbtExam.quizData.id,
                studentName: activeCbtExam.studentName,
                studentId: activeCbtExam.studentId,
                submissionId: activeCbtExam.submissionId,
                sessionKey: activeCbtExam.sessionKey || ''
            }));
        } catch (_) {}
    }

    window.saveCbtAnswer = (qId, val) => {
        if (!activeCbtExam) return;
        activeCbtExam.answers[qId] = val;
        saveCbtExamStateLocally();
        window.renderCbtNavGrid();
    };

    window.toggleCbtComplexKey = (qId, opt) => {
        if (!activeCbtExam) return;
        let current = activeCbtExam.answers[qId];
        let arr = Array.isArray(current) ? [...current] : (typeof current === 'string' && current ? current.split(',') : []);
        arr = arr.map(s => s.trim().toUpperCase()).filter(Boolean);
        const set = new Set(arr);
        if (set.has(opt)) set.delete(opt);
        else set.add(opt);
        activeCbtExam.answers[qId] = Array.from(set).sort();
        saveCbtExamStateLocally();
        window.renderCbtNavGrid();
        window.renderCbtQuestion(activeCbtExam.currentIndex);
    };

    window.saveCbtMatchAnswer = (qId, pIdx, value) => {
        if (!activeCbtExam) return;
        if (!activeCbtExam.answers[qId] || typeof activeCbtExam.answers[qId] !== 'object') {
            activeCbtExam.answers[qId] = {};
        }
        activeCbtExam.answers[qId][pIdx] = value;
        saveCbtExamStateLocally();
        window.renderCbtNavGrid();
    };

    window.renderCbtQuestion = (index) => {
        if (!activeCbtExam || !activeCbtExam.questions || activeCbtExam.questions.length === 0) return;
        if (index < 0) index = 0;
        if (index >= activeCbtExam.questions.length) index = activeCbtExam.questions.length - 1;

        activeCbtExam.currentIndex = index;
        const q = activeCbtExam.questions[index];
        const totalQ = activeCbtExam.questions.length;

        // Update badges
        const numBadge = document.getElementById('cbt-q-number-badge');
        const typeBadge = document.getElementById('cbt-q-type-badge');
        const bobotBadge = document.getElementById('cbt-q-bobot-badge');

        if (numBadge) numBadge.textContent = `Soal No. ${index + 1} / ${totalQ}`;
        if (bobotBadge) bobotBadge.textContent = `Bobot: ${q.bobot || 10} Poin`;

        const typeLabels = {
            pg: 'Pilihan Ganda',
            pg_kompleks: 'PG Kompleks',
            benar_salah: 'Benar / Salah',
            singkat: 'Isian Singkat',
            menjodohkan: 'Menjodohkan',
            upload_foto: 'Upload Foto',
            esai: 'Soal Esai'
        };
        if (typeBadge) typeBadge.textContent = typeLabels[q.tipe] || 'Soal Ujian';

        // Parse image stimulus
        const { text: cleanPertanyaan, gambar_url: qImgUrl } = splitQuestionImage(q.pertanyaan || '');
        const displayImg = q.gambar_url || qImgUrl;
        const imgStimulusHtml = displayImg ? `
            <div class="my-3 max-w-md border-2 border-black rounded-xl overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <a href="${escapeHtml(displayImg)}" target="_blank" title="Klik untuk memperbesar gambar">
                    <img src="${escapeHtml(displayImg)}" alt="Stimulus Gambar Soal ${index + 1}" class="w-full max-h-72 object-contain bg-white hover:opacity-95 transition" />
                </a>
                <div class="px-3 py-1.5 bg-slate-100 border-t border-slate-300 text-[10px] font-bold text-slate-600 flex justify-between items-center">
                    <span>Stimulus / Ilustrasi Soal</span>
                    <span class="text-indigo-600 font-black">Klik untuk perbesar</span>
                </div>
            </div>
        ` : '';

        const bodyEl = document.getElementById('cbt-question-body');
        if (!bodyEl) return;

        let inputHtml = '';
        const currentAns = activeCbtExam.answers[q.id];

        if (q.tipe === 'pg') {
            inputHtml = `
                <div class="space-y-2.5 pt-2">
                    ${['A', 'B', 'C', 'D'].map(opt => {
                        const optKey = `opsi_${opt.toLowerCase()}`;
                        const optText = q[optKey];
                        if (!optText) return '';
                        const isChecked = currentAns === opt;
                        return `
                            <label class="flex items-center gap-3 p-3.5 rounded-2xl border-2 border-black cursor-pointer transition ${isChecked ? 'bg-indigo-100 border-indigo-700 ring-2 ring-indigo-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-50 hover:bg-slate-100'}">
                                <input type="radio" name="cbt_answer_${q.id}" value="${opt}" ${isChecked ? 'checked' : ''} onchange="window.saveCbtAnswer('${q.id}', '${opt}')" class="w-4 h-4 accent-indigo-700 cursor-pointer">
                                <span class="font-black text-sm text-black">${opt}.</span>
                                <span class="font-bold text-xs md:text-sm text-slate-800 leading-snug">${escapeHtml(optText)}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
            `;
        } else if (q.tipe === 'pg_kompleks') {
            const selectedArr = Array.isArray(currentAns) ? currentAns : (currentAns ? String(currentAns).split(',') : []);
            inputHtml = `
                <div class="space-y-2 pt-2">
                    <div class="p-2.5 bg-cyan-50 border border-cyan-300 rounded-xl text-xs font-bold text-cyan-950 flex items-center gap-2">
                        <span></span> <strong>Pilihan Ganda Kompleks:</strong> Anda dapat mencentang lebih dari satu pilihan jawaban yang benar.
                    </div>
                    <div class="space-y-2.5 pt-1">
                        ${['A', 'B', 'C', 'D'].map(opt => {
                            const optKey = `opsi_${opt.toLowerCase()}`;
                            const optText = q[optKey];
                            if (!optText) return '';
                            const isChecked = selectedArr.includes(opt);
                            return `
                                <label class="flex items-center gap-3 p-3.5 rounded-2xl border-2 border-black cursor-pointer transition ${isChecked ? 'bg-cyan-100 border-cyan-700 ring-2 ring-cyan-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-50 hover:bg-slate-100'}">
                                    <input type="checkbox" value="${opt}" ${isChecked ? 'checked' : ''} onchange="window.toggleCbtComplexKey('${q.id}', '${opt}')" class="w-4 h-4 accent-cyan-700 rounded cursor-pointer">
                                    <span class="font-black text-sm text-black">${opt}.</span>
                                    <span class="font-bold text-xs md:text-sm text-slate-800 leading-snug">${escapeHtml(optText)}</span>
                                </label>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        } else if (q.tipe === 'benar_salah') {
            const isBenar = currentAns === 'Benar';
            const isSalah = currentAns === 'Salah';
            inputHtml = `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                    <label class="flex items-center gap-3 p-4 rounded-2xl border-2 border-black cursor-pointer transition ${isBenar ? 'bg-emerald-200 border-black ring-2 ring-emerald-500 font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-50 hover:bg-slate-100 font-bold'}">
                        <input type="radio" name="cbt_answer_${q.id}" value="Benar" ${isBenar ? 'checked' : ''} onchange="window.saveCbtAnswer('${q.id}', 'Benar')" class="w-5 h-5 accent-emerald-700 cursor-pointer">
                        <span class="text-sm md:text-base text-black">PERNYATAAN BENAR</span>
                    </label>
                    <label class="flex items-center gap-3 p-4 rounded-2xl border-2 border-black cursor-pointer transition ${isSalah ? 'bg-red-200 border-black ring-2 ring-red-500 font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-50 hover:bg-slate-100 font-bold'}">
                        <input type="radio" name="cbt_answer_${q.id}" value="Salah" ${isSalah ? 'checked' : ''} onchange="window.saveCbtAnswer('${q.id}', 'Salah')" class="w-5 h-5 accent-red-700 cursor-pointer">
                        <span class="text-sm md:text-base text-black">PERNYATAAN SALAH</span>
                    </label>
                </div>
            `;
        } else if (q.tipe === 'singkat') {
            inputHtml = `
                <div class="pt-2 space-y-1.5">
                    <label class="block text-xs font-black uppercase text-slate-700">Tuliskan Jawaban Singkat Anda:</label>
                    <input type="text" value="${escapeHtml(currentAns || '')}" oninput="window.saveCbtAnswer('${q.id}', this.value)" placeholder="Ketik kata kunci jawaban..." class="w-full h-12 px-4 border-2 border-black rounded-xl font-bold text-sm bg-white focus:ring-2 focus:ring-black">
                    <p class="text-[11px] text-slate-500 font-bold">Pastikan ejaan jawaban benar dan teliti.</p>
                </div>
            `;
        } else if (q.tipe === 'menjodohkan') {
            const pairs = Array.isArray(q.pasangan) ? q.pasangan : [];
            let rightOptions = Array.isArray(q.opsi_kanan) ? [...q.opsi_kanan] : [];
            if (rightOptions.length === 0) {
                try {
                    const full = JSON.parse(q.rubrik_esai);
                    if (Array.isArray(full)) {
                        full.forEach(p => { if (p && p.kanan) rightOptions.push(p.kanan); });
                    }
                } catch (_) {}
            }
            // Gabung fallback dari rubrik
            try {
                const full2 = JSON.parse(q.rubrik_esai);
                if (Array.isArray(full2)) full2.forEach(p => { if (p && p.kanan && !rightOptions.includes(p.kanan)) rightOptions.push(p.kanan); });
            } catch (_) {}
            rightOptions = rightOptions.filter(Boolean).sort((a, b) => String(a).localeCompare(String(b)));
            const studentPairs = (typeof currentAns === 'object' && currentAns) ? currentAns : {};

            inputHtml = `
                <div class="space-y-3 pt-2">
                    <div class="p-2.5 bg-teal-50 border border-teal-300 rounded-xl text-xs font-bold text-teal-950 flex items-center gap-2">
                        <span></span> Pasangkan setiap premis di sebelah kiri dengan pilihan yang tepat di sebelah kanan.
                    </div>
                    <div class="space-y-2.5">
                        ${(Array.isArray(pairs) ? pairs : []).map((p, pIdx) => {
                            const selVal = studentPairs[pIdx] || '';
                            return `
                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <div class="font-bold text-xs md:text-sm text-black flex items-center gap-2">
                                        <span class="w-6 h-6 rounded-full bg-teal-700 text-white font-black text-xs flex items-center justify-center shrink-0">${pIdx + 1}</span>
                                        <span>${escapeHtml(p.kiri)}</span>
                                    </div>
                                    <select onchange="window.saveCbtMatchAnswer('${q.id}', ${pIdx}, this.value)" class="h-10 px-3 border-2 border-black rounded-lg font-bold text-xs bg-slate-50 focus:bg-white cursor-pointer">
                                        <option value="">-- Pilih Pasangan Cocok --</option>
                                        ${rightOptions.map(opt => `<option value="${escapeHtml(opt)}" ${selVal === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('')}
                                    </select>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        } else if (q.tipe === 'upload_foto') {
            const fileUrl = currentAns || '';
            inputHtml = `
                <div class="space-y-3 pt-2">
                    ${q.rubrik_esai ? `<div class="p-3 bg-pink-50 border border-pink-300 rounded-xl text-xs font-bold text-pink-950">${escapeHtml(q.rubrik_esai)}</div>` : ''}
                    <div class="p-4 border-2 border-dashed border-black rounded-2xl bg-white space-y-3">
                        <div class="flex items-center gap-3 flex-wrap">
                            <input type="file" id="cbt_file_upload_${q.id}" accept="image/*,.pdf" class="hidden" onchange="window.handleCbtExamFileUpload(event, '${q.id}')">
                            <button type="button" onclick="document.getElementById('cbt_file_upload_${q.id}').click()" class="px-4 py-2.5 bg-pink-500 hover:bg-black text-white font-black text-xs uppercase rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition flex items-center gap-1.5">
                                <span></span> Ambil Foto / Pilih Berkas
                            </button>
                            <span id="cbt_file_status_${q.id}" class="text-xs font-bold text-slate-600">
                                ${fileUrl ? 'Berkas telah diunggah' : 'Belum ada berkas terlampir'}
                            </span>
                        </div>
                        ${fileUrl ? `
                            <div class="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-300">
                                <a href="${fileUrl}" target="_blank" class="text-xs font-bold text-indigo-700 underline truncate max-w-xs block">
                                    ${fileUrl}
                                </a>
                                <span class="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-400 font-black px-2 py-0.5 rounded">Tersimpan</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else {
            inputHtml = `
                <div class="pt-2 space-y-1.5">
                    <label class="block text-xs font-black uppercase text-slate-700">Tuliskan Uraian / Jawaban Lengkap Anda:</label>
                    <textarea rows="5" placeholder="Tuliskan uraian jawaban di sini..." oninput="window.saveCbtAnswer('${q.id}', this.value)" class="w-full p-3.5 border-2 border-black rounded-xl font-medium text-xs md:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black">${escapeHtml(currentAns || '')}</textarea>
                </div>
            `;
        }

        bodyEl.innerHTML = `
            <div class="text-sm md:text-base font-bold text-black leading-relaxed">
                ${escapeHtml(cleanPertanyaan)}
            </div>
            ${imgStimulusHtml}
            ${inputHtml}
        `;

        // Bottom Navigation Buttons
        const btnPrev = document.getElementById('cbt-btn-prev');
        const btnNext = document.getElementById('cbt-btn-next');
        const btnSubmit = document.getElementById('btn-submit-exam');
        const btnDoubtful = document.getElementById('cbt-btn-doubtful');
        const textDoubtful = document.getElementById('cbt-doubtful-text');

        if (btnPrev) {
            btnPrev.disabled = index === 0;
            btnPrev.style.opacity = index === 0 ? '0.4' : '1';
            btnPrev.style.cursor = index === 0 ? 'not-allowed' : 'pointer';
        }

        if (btnNext) {
            if (index === totalQ - 1) {
                btnNext.classList.add('hidden');
            } else {
                btnNext.classList.remove('hidden');
            }
        }

        if (btnSubmit) {
            if (index === totalQ - 1) {
                btnSubmit.classList.remove('hidden');
            } else {
                btnSubmit.classList.add('hidden');
            }
        }

        const isDoubtful = !!activeCbtExam.doubtful[q.id];
        if (btnDoubtful && textDoubtful) {
            if (isDoubtful) {
                btnDoubtful.className = "px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-black border-2 border-black font-black text-xs uppercase rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ring-2 ring-black active:translate-y-0.5 transition flex items-center gap-1.5";
                textDoubtful.textContent = "Batal Ragu";
            } else {
                btnDoubtful.className = "px-4 py-2.5 bg-amber-200 hover:bg-amber-300 text-black border-2 border-black font-black text-xs uppercase rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition flex items-center gap-1.5";
                textDoubtful.textContent = "Ragu-Ragu";
            }
        }

        window.renderCbtNavGrid();
    };

    window.renderCbtNavGrid = () => {
        if (!activeCbtExam || !activeCbtExam.questions) return;
        const gridEl = document.getElementById('cbt-nav-grid');
        if (!gridEl) return;

        let answeredCount = 0;

        gridEl.innerHTML = activeCbtExam.questions.map((q, idx) => {
            const isCurrent = activeCbtExam.currentIndex === idx;
            const ans = activeCbtExam.answers[q.id];
            let hasAnswer = false;
            if (ans !== undefined && ans !== null && ans !== '') {
                if (Array.isArray(ans)) hasAnswer = ans.length > 0;
                else if (typeof ans === 'object') hasAnswer = Object.keys(ans).length > 0;
                else hasAnswer = true;
            }
            if (hasAnswer) answeredCount++;
            const isDoubt = !!activeCbtExam.doubtful[q.id];

            let btnClass = '';
            if (isCurrent) {
                btnClass = 'bg-black text-white border-2 border-black ring-4 ring-indigo-400 font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]';
            } else if (isDoubt) {
                btnClass = 'bg-amber-300 text-black border-2 border-black font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-400';
            } else if (hasAnswer) {
                btnClass = 'bg-emerald-400 text-black border-2 border-black font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-500';
            } else {
                btnClass = 'bg-slate-100 text-slate-800 border-2 border-slate-300 font-bold hover:bg-slate-200';
            }

            return `
                <button type="button" onclick="window.goToCbtQuestion(${idx})" class="w-full h-10 rounded-xl text-xs flex items-center justify-center transition relative ${btnClass}">
                    ${idx + 1}
                    ${isDoubt ? `<span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 text-white rounded-full text-[9px] flex items-center justify-center font-black">?</span>` : ''}
                </button>
            `;
        }).join('');

        const progressEl = document.getElementById('cbt-progress-summary');
        if (progressEl) {
            progressEl.textContent = `${answeredCount} / ${activeCbtExam.questions.length} Dijawab`;
        }
    };

    window.navigateCbtQuestion = (dir) => {
        if (!activeCbtExam) return;
        if (dir === 'prev') {
            window.renderCbtQuestion(activeCbtExam.currentIndex - 1);
        } else {
            window.renderCbtQuestion(activeCbtExam.currentIndex + 1);
        }
    };

    window.goToCbtQuestion = (idx) => {
        window.renderCbtQuestion(idx);
    };

    window.toggleCbtDoubtful = () => {
        if (!activeCbtExam || !activeCbtExam.questions) return;
        const q = activeCbtExam.questions[activeCbtExam.currentIndex];
        if (!q) return;
        activeCbtExam.doubtful[q.id] = !activeCbtExam.doubtful[q.id];
        saveCbtExamStateLocally();
        window.renderCbtQuestion(activeCbtExam.currentIndex);
    };

    window.handleCbtExamFileUpload = async (event, qId) => {
        const file = event.target.files[0];
        if (!file) return;

        const statusEl = document.getElementById(`cbt_file_status_${qId}`);
        if (statusEl) statusEl.innerHTML = `<span class="text-indigo-600 font-bold animate-pulse">Mengunggah ${escapeHtml(file.name)}...</span>`;

        try {
            const fileExt = file.name.split('.').pop();
            const safeName = `${Date.now()}_exam_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `exam_submissions/${safeName}`;

            const { error: uploadErr } = await supabase.storage.from('uploads').upload(filePath, file);
            if (uploadErr) throw uploadErr;

            const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
            const publicUrl = publicUrlData.publicUrl;

            window.saveCbtAnswer(qId, publicUrl);
            window.renderCbtQuestion(activeCbtExam.currentIndex);
        } catch (err) {
            if (statusEl) statusEl.innerHTML = `<span class="text-red-600 font-bold">Gagal unggah: ${escapeHtml(err.message)}</span>`;
        }
    };

    window.confirmSubmitCbtExam = async (options = {}) => {
        if (!activeCbtExam || activeCbtExam.isSubmitting) return;
        const answeredCount = activeCbtExam.questions.filter(q => {
            const a = activeCbtExam.answers[q.id];
            return a !== undefined && a !== null && a !== '';
        }).length;
        const totalQ = activeCbtExam.questions.length;

        const msg = answeredCount < totalQ 
            ? `Perhatian: Anda baru menjawab ${answeredCount} dari total ${totalQ} butir soal.\n\nApakah Anda yakin ingin menyelesaikan dan mengumpulkan lembar ujian ke database sekarang?`
            : `Semua ${totalQ} butir soal telah terjawab!\n\nApakah Anda yakin ingin menyelesaikan dan mengumpulkan ujian ini sekarang?`;

        if (!options.skipConfirm) {
            const conf = await showCustomModal(msg, 'confirm', 'Selesai Ujian', '');
            if (!conf) return;
        }

        const exam = activeCbtExam;

        if (!exam.submissionId) {
            await showCustomModal("Sesi ujian tidak valid. Silakan muat ulang halaman lalu mulai ujian kembali dari token.", 'alert', 'Gagal', '');
            return;
        }

        exam.isSubmitting = true;
        removeAntiCheatListeners();
        exitFullscreenLock();
        if (exam.timerInterval) clearInterval(exam.timerInterval);
        if (exam.warningCountdownInterval) clearInterval(exam.warningCountdownInterval);

        try {
            // Penilaian dilakukan di server (kunci jawaban tidak pernah dikirim ke browser).
            const { data, error } = await supabase.rpc('submit_exam', {
                p_submission_id: exam.submissionId,
                p_session_key: exam.sessionKey || '',
                p_answers: exam.answers || {},
                p_doubtful: exam.doubtful || {},
                p_cheat_attempts: exam.cheatAttempts || 0,
                p_cheat_logs: exam.cheatLogs || []
            });
            if (error) throw error;
            if (!data || !data.ok) {
                throw new Error(data?.error || 'Sesi ujian sudah ditutup oleh guru pengawas.');
            }

            const finalSub = data.submission || {};
            const finalStatus = finalSub.status_koreksi;
            const totalScore = Number(finalSub.total_nilai) || 0;
            const hasSubjective = finalStatus === 'belum_dikoreksi' || finalStatus === 'perlu_dinilai';

            try {
                const key = `cbt_exam_${exam.quizData.id}_${encodeURIComponent(exam.studentName)}`;
                localStorage.removeItem(key);
                sessionStorage.removeItem('cbt_active_exam_session');
            } catch (_) {}

            activeCbtExam = null;
            exitExamMode();
            switchStudentPortal('tugas');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            const successMsg = hasSubjective
                ? `Ujian berhasil dikumpulkan! Jawaban Anda telah direkam di sistem. Nilai instrumen otomatis: ${totalScore}/100. Butir soal uraian/lembar foto Anda akan diperiksa dan dinilai oleh guru.`
                : `Ujian berhasil dikumpulkan! Jawaban Anda telah direkam di sistem. Nilai akhir Anda: ${totalScore}/100.`;
            await showCustomModal(successMsg, 'alert', 'Ujian Selesai', '');

        } catch (e) {
            if (activeCbtExam) activeCbtExam.isSubmitting = false;
            await showCustomModal("Gagal mengirim jawaban: " + e.message, 'alert', 'Gagal', '');
        }
    };

    window.cancelExam = async () => {
        // Tidak ada opsi keluar-masuk bebas tab ujian. Tombol dialihkan langsung ke konfirmasi selesai ujian agar terekam di database.
        await window.confirmSubmitCbtExam();
    };

    let pendingExamQuiz = null;

    window.onExamTokenKelasChange = (selectedKelas) => {
        const studentSelect = document.getElementById('exam-token-student-select');
        const idInput = document.getElementById('exam-token-student-id');
        const nameInput = document.getElementById('exam-token-student-name');
        const kelasInput = document.getElementById('exam-token-student-kelas');
        if (!studentSelect) return;

        if (idInput) idInput.value = '';
        if (nameInput) nameInput.value = '';
        if (kelasInput) kelasInput.value = selectedKelas || '';

        if (!selectedKelas) {
            studentSelect.disabled = true;
            studentSelect.innerHTML = '<option value="">Pilih kelas terlebih dahulu</option>';
            return;
        }

        const filtered = rosterStudents
            .filter(s => String(s.kelas).trim() === String(selectedKelas).trim())
            .sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || '')));

        if (filtered.length === 0) {
            studentSelect.disabled = true;
            studentSelect.innerHTML = '<option value="">Belum ada siswa terdaftar di kelas ini</option>';
            return;
        }

        studentSelect.disabled = false;
        studentSelect.innerHTML = '<option value="">-- Pilih Nama Anda --</option>' +
            filtered.map(s => {
                const nisnText = s.nisn ? ` (NISN: ${s.nisn})` : '';
                return `<option value="${escapeHtml(s.id)}" data-name="${escapeHtml(s.nama)}" data-nisn="${escapeHtml(s.nisn || '')}" data-kelas="${escapeHtml(s.kelas)}">${escapeHtml(s.nama)}${nisnText}</option>`;
            }).join('');

        const savedName = getActiveStudentName().toLowerCase();
        if (savedName) {
            const matched = filtered.find(s => s.nama.toLowerCase() === savedName);
            if (matched) {
                studentSelect.value = matched.id;
                window.onExamTokenStudentSelectChange(studentSelect);
            }
        }
    };

    window.onExamTokenStudentSelectChange = (sel) => {
        const idInput = document.getElementById('exam-token-student-id');
        const nameInput = document.getElementById('exam-token-student-name');
        const kelasInput = document.getElementById('exam-token-student-kelas');
        if (!sel || !sel.value) {
            if (idInput) idInput.value = '';
            if (nameInput) nameInput.value = '';
            return;
        }
        const opt = sel.options[sel.selectedIndex];
        const studentId = sel.value;
        const studentName = opt.getAttribute('data-name') || opt.text;
        const studentKelas = opt.getAttribute('data-kelas') || document.getElementById('exam-token-kelas-select')?.value;

        if (idInput) idInput.value = studentId;
        if (nameInput) nameInput.value = studentName;
        if (kelasInput) kelasInput.value = studentKelas;

        if (globalNameInput) globalNameInput.value = studentName;
        if (studentName) {
            localStorage.setItem('student_nama', studentName);
        }
        if (studentKelas) {
            if (globalKelasSelect) globalKelasSelect.value = studentKelas;
            localStorage.setItem('student_kelas', studentKelas);
            updateStudentProfileUI(studentKelas);
            renderStudentClassBanner(studentKelas);
        }
    };

    window.openExamTokenModal = async (quizId) => {
        const quiz = allQuizzes.find(q => String(q.id) === String(quizId));
        if (!quiz) {
            await showCustomModal("Informasi ujian tidak ditemukan. Segarkan halaman lalu coba lagi.", 'alert', 'Gagal', '');
            return;
        }

        const { cleanPetunjuk, config } = parseQuizConfig(quiz.petunjuk || '', quiz);
        pendingExamQuiz = { ...quiz, parsedConfig: config };

        document.getElementById('exam-token-mapel-badge').textContent = `${quiz.mapel} • Kelas ${quiz.kelas}`;
        document.getElementById('exam-token-duration-badge').textContent = `${quiz.durasi_menit || 45} Menit`;
        document.getElementById('exam-token-quiz-title').textContent = quiz.judul_kuis;
        document.getElementById('exam-token-quiz-petunjuk').textContent = cleanPetunjuk || 'Kerjakan dengan teliti, jujur, dan mandiri.';

        if (!rosterStudents || rosterStudents.length === 0) {
            rosterStudents = await fetchStudentsFromDB();
        }

        const kelasSelect = document.getElementById('exam-token-kelas-select');
        if (kelasSelect) {
            const allRosterClasses = [...new Set(rosterStudents.map(s => String(s.kelas).trim()))].sort();
            
            // Auto-deteksi kelas yang berhak mengikuti ujian ini sesuai jenjang soal
            const targetK = String(quiz.kelas || '').trim();
            let applicableClasses = allRosterClasses;

            if (targetK && targetK !== 'Semua Kelas') {
                if (targetK.includes('9') || targetK.toUpperCase().includes('IX')) {
                    applicableClasses = allRosterClasses.filter(c => c.startsWith('9.') || c.startsWith('9') || c.toUpperCase().includes('IX'));
                } else if (targetK.includes('8') || targetK.toUpperCase().includes('VIII')) {
                    applicableClasses = allRosterClasses.filter(c => c.startsWith('8.') || c.startsWith('8') || c.toUpperCase().includes('VIII'));
                } else if (targetK.includes('7') || targetK.toUpperCase().includes('VII')) {
                    applicableClasses = allRosterClasses.filter(c => c.startsWith('7.') || c.startsWith('7') || c.toUpperCase().includes('VII'));
                } else if (allRosterClasses.includes(targetK)) {
                    applicableClasses = [targetK];
                }
            }

            if (applicableClasses.length === 0) {
                applicableClasses = allRosterClasses;
            }

            kelasSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>' +
                applicableClasses.map(k => `<option value="${escapeHtml(k)}">Kelas ${escapeHtml(k)}</option>`).join('');

            // Pilih otomatis kelas siswa jika sebelumnya sudah dipilih atau gunakan kelas pertama yang berhak
            const preferredClass = getActiveStudentKelas();
            if (preferredClass && applicableClasses.includes(preferredClass)) {
                kelasSelect.value = preferredClass;
            } else if (applicableClasses.length > 0) {
                kelasSelect.value = applicableClasses[0];
            }

            // Langsung panggil onExamTokenKelasChange untuk memfilter HANYA siswa di kelas yang terpilih
            window.onExamTokenKelasChange(kelasSelect.value);
        }

        const tokenInput = document.getElementById('exam-token-input');
        if (tokenInput) tokenInput.value = '';

        const tokenGroup = document.getElementById('exam-token-input-group');
        const isTokenRequired = config.token_required !== false;
        if (tokenGroup) {
            tokenGroup.style.display = isTokenRequired ? 'block' : 'none';
        }

        const modal = document.getElementById('exam-token-modal');
        if (modal) {
            modal.classList.remove('hidden');
            if (isTokenRequired && tokenInput) {
                setTimeout(() => {
                    tokenInput.focus();
                    tokenInput.select();
                }, 150);
            }
        }
    };

    window.closeExamTokenModal = () => {
        pendingExamQuiz = null;
        const modal = document.getElementById('exam-token-modal');
        if (modal) modal.classList.add('hidden');
    };

    window.verifyAndStartExam = async () => {
        if (!pendingExamQuiz) return;
        const quiz = pendingExamQuiz;

        const studentId = document.getElementById('exam-token-student-id')?.value;
        const studentName = document.getElementById('exam-token-student-name')?.value;
        const studentKelas = document.getElementById('exam-token-student-kelas')?.value;

        if (!studentId || !studentName) {
            await showCustomModal("Silakan pilih kelas dan nama lengkap Anda dari daftar resmi peserta didik!", 'alert', 'Pilih Nama Siswa', '');
            return;
        }

        const config = quiz.parsedConfig || {};
        const isTokenRequired = config.token_required !== false;
        const enteredToken = (document.getElementById('exam-token-input')?.value || '').trim().toUpperCase().replace(/\s+/g, '');

        if (isTokenRequired && !enteredToken) {
            await showCustomModal("Silakan masukkan Token Ujian yang diberikan oleh Guru Pengawas kelas Anda!", 'alert', 'Token Wajib Diisi', '');
            const inputEl = document.getElementById('exam-token-input');
            if (inputEl) inputEl.focus();
            return;
        }

        const btn = document.getElementById('btn-submit-exam-token');
        if (btn) {
            btn.disabled = true;
            btn.innerText = "Memverifikasi Sesi Ujian...";
        }

        try {
            const { data, error } = await supabase.rpc('start_exam_session', {
                p_quiz_id: quiz.id,
                p_student_id: studentId,
                p_student_name: studentName,
                p_kelas: studentKelas || '',
                p_token: enteredToken
            });
            if (error) throw error;

            if (!data || data.error) {
                if (btn) { btn.disabled = false; btn.innerText = "Mulai Kerjakan Ujian"; }
                const msg = data?.error || 'Gagal memulai ujian. Hubungi guru pengawas.';
                const isTokenErr = msg.toLowerCase().includes('token');
                if (!isTokenErr) {
                    closeExamTokenModal();
                } else {
                    const inputEl = document.getElementById('exam-token-input');
                    if (inputEl) {
                        setTimeout(() => {
                            inputEl.focus();
                            inputEl.select();
                        }, 200);
                    }
                }
                const title = data?.code === 'locked' ? 'Ujian Terkunci (Pelanggaran)'
                    : data?.code === 'finished' ? 'Ujian Selesai (1x Pengerjaan)' : 'Gagal Memulai Ujian';
                await showCustomModal(msg, 'alert', title, '');
                return;
            }

            const serverQuiz = data.quiz;
            const serverSub = data.submission || {};
            const sessionKey = serverSub?.jawaban_siswa?.sessionKey || '';

            if (!data.resumed) {
                try {
                    localStorage.removeItem(`cbt_exam_${quiz.id}_${encodeURIComponent(studentName)}`);
                    sessionStorage.removeItem('cbt_active_exam_session');
                } catch (_) {}
            }

            closeExamTokenModal();
            await launchCbtExam(serverQuiz, studentName, serverSub.id, studentId, serverSub, sessionKey);

        } catch (e) {
            await showCustomModal("Gagal memulai ujian: " + e.message, 'alert', 'Gagal', '');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = "Mulai Kerjakan Ujian";
            }
        }
    };

    window.launchCbtExam = async (quizData, studentName, submissionId = null, studentId = '', existingSub = null, sessionKey = '') => {
        const { config } = parseQuizConfig(quizData.petunjuk || '', quizData);
        const questions = quizData.quiz_questions || [];
        questions.sort((a, b) => (a.nomor || 0) - (b.nomor || 0));

        if (questions.length === 0) {
            await showCustomModal("Ujian ini belum memiliki butir soal yang aktif.", 'alert', 'Pemberitahuan', '');
            return;
        }

        const violationLimit = config.violation_limit !== undefined ? config.violation_limit : 3;

        // Ambil riwayat dari server database jika ada
        let serverJawaban = existingSub?.jawaban_siswa;
        if (typeof serverJawaban === 'string') {
            try { serverJawaban = JSON.parse(serverJawaban); } catch (_) { serverJawaban = {}; }
        }
        const serverCheats = serverJawaban?.cheatAttempts || 0;
        const serverLogs = Array.isArray(serverJawaban?.cheatLogs) ? serverJawaban.cheatLogs : [];
        const serverAnswers = serverJawaban?.answers || {};
        const serverDoubtful = serverJawaban?.doubtful || {};
        const isServerUnlocked = (existingSub?.status_koreksi === 'sedang_ujian') && (serverCheats === 0 || !!serverJawaban?.unlockedAt);
        const serverRemaining = Number(serverJawaban?.remainingSeconds);
        const serverLastActiveAt = serverJawaban?.lastActiveAt ? new Date(serverJawaban.lastActiveAt).getTime() : 0;
        const serverStartedAt = serverJawaban?.startedAt ? new Date(serverJawaban.startedAt).getTime() : 0;

        // Ambil riwayat dari localStorage jika ada
        let localAnswers = {};
        let localDoubtful = {};
        let localCheats = 0;
        let localLogs = [];
        let localTimerSeconds = null;
        let isLocalLocked = false;

        const localKey = `cbt_exam_${quizData.id}_${encodeURIComponent(studentName)}`;
        try {
            const savedRaw = localStorage.getItem(localKey);
            if (savedRaw) {
                const savedState = JSON.parse(savedRaw);
                localAnswers = savedState.answers || {};
                localDoubtful = savedState.doubtful || {};
                localCheats = savedState.cheatAttempts || 0;
                localLogs = Array.isArray(savedState.cheatLogs) ? savedState.cheatLogs : [];
                localTimerSeconds = savedState.timerSeconds;
                isLocalLocked = !!savedState.isLocked;
            }
        } catch (_) {}

        // JIKA SERVER SUDAH MEMBUKA KUNCI: bersihkan status lock lokal!
        if (isServerUnlocked) {
            isLocalLocked = false;
            localCheats = 0;
            localLogs = [];
            try {
                const savedRaw = localStorage.getItem(localKey);
                if (savedRaw) {
                    const localData = JSON.parse(savedRaw);
                    localData.isLocked = false;
                    localData.cheatAttempts = 0;
                    localData.cheatLogs = [];
                    localStorage.setItem(localKey, JSON.stringify(localData));
                }
            } catch (_) {}
        }

        // Konsolidasi: jika sudah di-unlock oleh guru di server, gunakan serverCheats (0)
        const effectiveCheats = isServerUnlocked ? serverCheats : Math.max(serverCheats, localCheats);
        const effectiveLogs = isServerUnlocked ? serverLogs : (serverLogs.length >= localLogs.length ? serverLogs : localLogs);
        const effectiveAnswers = { ...serverAnswers, ...localAnswers };
        const effectiveDoubtful = { ...serverDoubtful, ...localDoubtful };

        const maxSeconds = (quizData.durasi_menit || 45) * 60;
        let restoredTimerSeconds = null;
        if (serverJawaban?.remainingSeconds !== undefined && Number.isFinite(serverRemaining) && serverRemaining >= 0) {
            const elapsedSinceSave = serverLastActiveAt ? Math.max(0, (Date.now() - serverLastActiveAt) / 1000) : 0;
            restoredTimerSeconds = Math.max(0, Math.floor(serverRemaining - Math.max(0, elapsedSinceSave - 5)));
        } else if (serverStartedAt && Number.isFinite(serverStartedAt)) {
            restoredTimerSeconds = Math.max(0, Math.floor(maxSeconds - (Date.now() - serverStartedAt) / 1000));
        }
        const localSeconds = (localTimerSeconds && localTimerSeconds > 0) ? localTimerSeconds : null;
        const initialTimerSeconds = restoredTimerSeconds !== null
            ? Math.min(maxSeconds, restoredTimerSeconds)
            : (localSeconds ? Math.min(maxSeconds, localSeconds) : maxSeconds);

        activeCbtExam = {
            quizData,
            studentName,
            submissionId,
            studentId,
            sessionKey: sessionKey || existingSub?.jawaban_siswa?.sessionKey || '',
            questions,
            currentIndex: 0,
            answers: effectiveAnswers,
            doubtful: effectiveDoubtful,
            cheatAttempts: effectiveCheats,
            cheatLogs: effectiveLogs,
            violationLimit,
            fullscreenEnabled: config.fullscreen !== undefined ? config.fullscreen : true,
            timerInterval: null,
            warningCountdownInterval: null,
            isSubmitting: false,
            timerSeconds: initialTimerSeconds
        };

        // Berlangganan event realtime perubahan sesi ujian dari guru pengawas
        subscribeToStudentExamRealtime(submissionId);

        // Jika terdeteksi terkunci atau kecurangan telah mencapai/melampaui limit, langsung bekukan!
        if (existingSub?.status_koreksi === 'terkunci_curang' || (!isServerUnlocked && (isLocalLocked || (violationLimit > 0 && effectiveCheats >= violationLimit)))) {
            enterExamMode();
            await lockExamDueToCheating();
            return;
        }

        // Beralih ke layar ujian eksklusif (sembunyikan tab navigasi & profil portal)
        enterExamMode();

        // Simpan pointer sesi aktif ke sessionStorage
        sessionStorage.setItem('cbt_active_exam_session', JSON.stringify({
            quizId: quizData.id,
            studentName,
            studentId,
            submissionId,
            sessionKey: activeCbtExam.sessionKey
        }));

        document.getElementById('quiz-room-mapel').textContent = quizData.mapel || 'Ujian Online';
        document.getElementById('quiz-room-title').textContent = quizData.judul_kuis;
        const studentTag = document.getElementById('cbt-student-tag');
        if (studentTag) studentTag.textContent = '';

        updateStudentViolationUI(activeCbtExam.cheatAttempts, false);

        window.renderCbtQuestion(0);

        const timerEl = document.getElementById('quiz-timer');
        if (quizTimerInterval) clearInterval(quizTimerInterval);

        activeCbtExam.timerInterval = setInterval(() => {
            activeCbtExam.timerSeconds--;
            const m = Math.floor(activeCbtExam.timerSeconds / 60);
            const s = activeCbtExam.timerSeconds % 60;
            if (timerEl) {
                timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            }

            // Simpan lokal dan kirim status live setiap 2 detik
            if (activeCbtExam.timerSeconds % 2 === 0) {
                const hasFocus = !document.hidden && document.hasFocus();
                reportExamPresence(hasFocus);
            }

            if (activeCbtExam.timerSeconds <= 0) {
                activeCbtExam.timerSeconds = 0;
                clearInterval(activeCbtExam.timerInterval);
                window.confirmSubmitCbtExam({ skipConfirm: true });
            }
        }, 1000);

        addAntiCheatListeners();
        reportExamPresence(true, "Mulai masuk ujian");
        if (activeCbtExam.fullscreenEnabled) {
            await requestFullscreenLock();
        }

        const room = document.getElementById('quiz-room-container');
        if (room) {
            window.scrollTo({ top: room.offsetTop - 30, behavior: 'smooth' });
        }
    };

    window.startExam = async (quizId) => {
        await window.openExamTokenModal(quizId);
    };

    // ==========================================
    // 8. TAB 4: CEK RAPOR & BUKU NILAI SISWA
    // ==========================================
    window.populateRaporKelasSelect = () => {
        const kelasSelect = document.getElementById('rapor-kelas-select');
        if (!kelasSelect) return;
        const currentVal = kelasSelect.value;
        const activeKelas = getActiveStudentKelas();

        const classes = (availableClasses && availableClasses.length > 0)
            ? availableClasses
            : ['VII.1', 'VII.2', 'VII.3', 'VII.4', 'VII.5', 'VII.6', 'VIII.1', 'VIII.2', 'VIII.3', 'VIII.4', 'VIII.5', 'VIII.6', 'IX.1', 'IX.2', 'IX.3', 'IX.4', 'IX.5', 'IX.6'];

        kelasSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>' +
            classes.map(c => `<option value="${escapeHtml(c)}">Kelas ${escapeHtml(c)}</option>`).join('');

        if (currentVal && classes.includes(currentVal)) {
            kelasSelect.value = currentVal;
        } else if (activeKelas && classes.includes(activeKelas)) {
            kelasSelect.value = activeKelas;
        }

        if (kelasSelect.value) {
            window.onRaporKelasChange();
        }
    };

    window.onRaporKelasChange = async () => {
        const kelasSelect = document.getElementById('rapor-kelas-select');
        const studentSelect = document.getElementById('rapor-student-select');
        if (!kelasSelect || !studentSelect) return;

        const kelas = kelasSelect.value.trim();
        if (!kelas) {
            studentSelect.disabled = true;
            studentSelect.classList.add('bg-slate-100');
            studentSelect.classList.remove('bg-white');
            studentSelect.innerHTML = '<option value="">-- Pilih Kelas Terlebih Dahulu --</option>';
            return;
        }

        if (!rosterStudents || rosterStudents.length === 0) {
            try {
                rosterStudents = await fetchStudentsFromDB();
            } catch (_) {}
        }

        const filtered = (rosterStudents || [])
            .filter(s => String(s.kelas).trim().toLowerCase() === kelas.toLowerCase())
            .sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || '')));

        if (filtered.length === 0) {
            studentSelect.disabled = true;
            studentSelect.classList.add('bg-slate-100');
            studentSelect.classList.remove('bg-white');
            studentSelect.innerHTML = '<option value="">(Belum ada data roster di kelas ini)</option>';
            return;
        }

        studentSelect.disabled = false;
        studentSelect.classList.remove('bg-slate-100');
        studentSelect.classList.add('bg-white');
        studentSelect.innerHTML = '<option value="">-- Pilih Nama Siswa (' + filtered.length + ' Siswa) --</option>' +
            filtered.map(s => {
                const nisnText = s.nisn ? ` (NISN: ${s.nisn})` : '';
                return `<option value="${escapeHtml(s.nama)}" data-nisn="${escapeHtml(s.nisn || '')}" data-kelas="${escapeHtml(s.kelas || '')}" data-id="${escapeHtml(s.id || '')}">${escapeHtml(s.nama)}${nisnText}</option>`;
            }).join('');

        const activeName = getActiveStudentName();
        if (activeName) {
            const found = filtered.find(s => s.nama.toLowerCase().trim() === activeName.toLowerCase().trim());
            if (found) {
                studentSelect.value = found.nama;
                window.checkStudentGrades();
            }
        }
    };

    window.onRaporStudentSelectChange = () => {
        const studentSelect = document.getElementById('rapor-student-select');
        const nameInput = document.getElementById('check-name-input');
        if (studentSelect && studentSelect.value) {
            if (nameInput) nameInput.value = studentSelect.value;
            window.checkStudentGrades();
        }
    };

    window.printStudentReportCard = (nama) => {
        const reportContainer = document.getElementById('student-grades-result');
        if (!reportContainer) {
            window.print();
            return;
        }
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            window.print();
            return;
        }
        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <title>Rapor Portofolio Nilai Siswa - ${escapeHtml(nama)}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body { font-family: sans-serif; padding: 24px; color: black; }
                    @media print {
                        button { display: none !important; }
                    }
                </style>
            </head>
            <body class="bg-white">
                <div class="max-w-4xl mx-auto space-y-6">
                    <div class="border-b-4 border-double border-black pb-4 text-center">
                        <h2 class="text-xs font-black uppercase tracking-widest text-slate-700">Pemerintah Kota Palembang &bull; Dinas Pendidikan</h2>
                        <h1 class="text-xl sm:text-2xl font-black uppercase text-black tracking-tight mt-0.5">SMP NEGERI 58 PALEMBANG</h1>
                        <p class="text-xs text-slate-600 font-bold mt-1">Laporan Portofolio Belajar & Buku Nilai Digital Siswa Terpadu</p>
                    </div>
                    ${reportContainer.innerHTML}
                    <div class="pt-8 border-t-2 border-black flex justify-between text-xs font-bold text-center">
                        <div>
                            <p class="mb-14">Mengetahui,<br>Orang Tua / Wali Siswa</p>
                            <p class="border-b border-black w-40 inline-block"></p>
                        </div>
                        <div>
                            <p class="mb-14">Palembang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br>Guru Mata Pelajaran</p>
                            <p class="border-b border-black w-40 inline-block font-black">Guru Pengampu LMS</p>
                        </div>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(() => window.print(), 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    window.navigateToAssignment = (assignId) => {
        if (typeof switchStudentPortal === 'function') {
            switchStudentPortal('tugas');
        }
        const target = (allAssignments || []).find(a => String(a.id) === String(assignId));
        if (target && typeof window.openAssignmentSubmissionModal === 'function') {
            window.openAssignmentSubmissionModal(target);
        } else {
            setTimeout(() => {
                const el = document.getElementById(`assignment-card-${assignId}`) || document.querySelector(`[data-assignment-id="${assignId}"]`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    };

    window.navigateToExam = async (quizId) => {
        if (typeof switchStudentPortal === 'function') {
            switchStudentPortal('ujian');
        }
        if (typeof window.openExamTokenModal === 'function') {
            await window.openExamTokenModal(quizId);
        } else {
            setTimeout(() => {
                const el = document.getElementById(`quiz-card-${quizId}`) || document.querySelector(`[data-quiz-id="${quizId}"]`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    };

    window.checkStudentGrades = async () => {
        const studentSelect = document.getElementById('rapor-student-select');
        const kelasSelect = document.getElementById('rapor-kelas-select');
        const nameInput = document.getElementById('check-name-input');
        const resultContainer = document.getElementById('student-grades-result');
        const summaryBox = document.getElementById('grade-summary-cards');

        let nameVal = (studentSelect?.value || '').trim();
        if (!nameVal && nameInput) {
            nameVal = nameInput.value.trim();
        }

        if (!nameVal) {
            await showCustomModal("Silakan pilih atau masukkan nama siswa untuk melihat rapor dan buku nilai!", 'alert', 'Nama Belum Dipilih', '');
            return;
        }

        // Pastikan roster, assignments, quizzes sudah terload
        if (!rosterStudents || rosterStudents.length === 0) {
            try { rosterStudents = await fetchStudentsFromDB(); } catch (_) {}
        }
        if (!allAssignments || allAssignments.length === 0) {
            try {
                const { data } = await supabase.from('assignments').select('*').order('created_at', { ascending: false });
                allAssignments = data || [];
            } catch (_) {}
        }
        if (!allQuizzes || allQuizzes.length === 0) {
            try {
                const { data } = await supabase.from('quizzes').select('*').order('created_at', { ascending: false });
                allQuizzes = data || [];
            } catch (_) {}
        }

        const selectedOpt = studentSelect?.selectedOptions?.[0];
        const optKelas = selectedOpt?.dataset?.kelas || '';
        const optNisn = selectedOpt?.dataset?.nisn || '';
        const selectedKelas = (kelasSelect?.value || '').trim();
        const activeKelas = getActiveStudentKelas();

        const effectiveKelas = optKelas || selectedKelas || activeKelas || '';

        // Cari info siswa di roster dengan mencocokkan nama DAN kelas (mencegah nama kembar beda jenjang/kelas tertukar)
        let studentInfo = null;
        if (effectiveKelas) {
            studentInfo = (rosterStudents || []).find(s => 
                s.nama.toLowerCase().trim() === nameVal.toLowerCase().trim() &&
                isClassMatch(s.kelas, effectiveKelas)
            );
        }
        if (!studentInfo && optNisn) {
            studentInfo = (rosterStudents || []).find(s => String(s.nisn).trim() === optNisn.trim());
        }
        if (!studentInfo) {
            studentInfo = (rosterStudents || []).find(s => s.nama.toLowerCase().trim() === nameVal.toLowerCase().trim());
        }
        if (!studentInfo) {
            studentInfo = {
                nama: nameVal,
                kelas: effectiveKelas || '-',
                nisn: optNisn || '-'
            };
        }

        const studentKelas = effectiveKelas || (studentInfo.kelas && studentInfo.kelas !== '-' ? studentInfo.kelas : '');

        resultContainer.innerHTML = '<div class="text-center py-10 text-slate-500 font-bold text-xs uppercase animate-pulse">Memuat portofolio nilai, tugas, dan ujian siswa dari database...</div>';

        try {
            // 1. Ambil nilai tugas siswa ini
            const { data: rawFileGrades, error: fErr } = await supabase
                .from('files')
                .select('*')
                .ilike('nama', nameVal.trim())
                .order('created_at', { ascending: false });

            if (fErr) throw fErr;

            // Saring agar hanya tugas di kelas siswa ini (mencegah nama sama beda kelas tertukar)
            const fileGrades = (rawFileGrades || []).filter(f => {
                const matchName = (f.nama || '').toLowerCase().trim() === nameVal.toLowerCase().trim();
                if (!matchName) return false;
                if (studentKelas && studentKelas !== '-' && f.kelas) {
                    return isClassMatch(f.kelas, studentKelas);
                }
                return true;
            });

            // 2. Ambil nilai ujian online lewat RPC
            const { data: quizGradeRows, error: qErr } = await supabase
                .rpc('get_student_exam_grades', { p_name: nameVal.trim() });

            if (qErr) throw qErr;

            // Saring agar HANYA ujian di kelas siswa ini (mencegah nama kembar beda jenjang/kelas tertukar)
            const quizGrades = (quizGradeRows || []).filter(q => {
                if (!['selesai', 'belum_dikoreksi', 'perlu_dinilai'].includes(q.status_koreksi)) return false;
                if (studentKelas && studentKelas !== '-') {
                    if (q.kelas && !isClassMatch(q.kelas, studentKelas)) return false;
                    const matchedQuiz = allQuizzes.find(item => String(item.id) === String(q.quiz_id));
                    if (matchedQuiz && !isClassMatch(matchedQuiz.kelas, studentKelas)) return false;
                }
                return true;
            });

            // 3. Tentukan Tugas yang ditujukan untuk kelas siswa ini
            const classAssignments = allAssignments.filter(a => isClassMatch(a.kelas, studentKelas));
            
            const submittedAssignIds = new Set((fileGrades || []).map(f => String(f.assignment_id || '')));
            const submittedAssignTitles = new Set((fileGrades || []).map(f => (f.materi || '').toLowerCase().trim()));

            const completedTasks = fileGrades || [];
            const pendingTasks = classAssignments.filter(a => 
                !submittedAssignIds.has(String(a.id)) && 
                !submittedAssignTitles.has((a.judul_tugas || '').toLowerCase().trim())
            );

            // 4. Tentukan Ujian yang ditujukan untuk kelas siswa ini
            const classQuizzes = allQuizzes.filter(q => isClassMatch(q.kelas, studentKelas));
            const submittedQuizIds = new Set((quizGrades || []).map(q => String(q.quiz_id || q.quizzes?.id || '')));
            const submittedQuizTitles = new Set((quizGrades || []).map(q => (q.judul_kuis || q.quizzes?.judul_kuis || '').toLowerCase().trim()));

            const completedExams = quizGrades || [];
            const pendingExams = classQuizzes.filter(q =>
                !submittedQuizIds.has(String(q.id)) &&
                !submittedQuizTitles.has((q.judul_kuis || '').toLowerCase().trim())
            );

            // 5. Hitung rata-rata
            const gradedFiles = completedTasks.filter(f => f.nilai !== null && f.nilai !== undefined && f.nilai !== '');
            const avgTugas = gradedFiles.length > 0 
                ? Math.round(gradedFiles.reduce((acc, f) => acc + Number(f.nilai), 0) / gradedFiles.length)
                : 0;

            const gradedQuizzes = completedExams.filter(q => q.status_koreksi === 'selesai' && q.total_nilai !== null && q.total_nilai !== undefined);
            const avgUjian = gradedQuizzes.length > 0
                ? Math.round(gradedQuizzes.reduce((acc, q) => acc + Number(q.total_nilai || 0), 0) / gradedQuizzes.length)
                : 0;

            // Update Bento summary cards
            document.getElementById('summary-avg-tugas').textContent = gradedFiles.length > 0 ? avgTugas : '-';
            document.getElementById('summary-avg-ujian').textContent = gradedQuizzes.length > 0 ? avgUjian : '-';
            document.getElementById('summary-tugas-progress').textContent = `${completedTasks.length} / ${classAssignments.length || completedTasks.length} Selesai`;
            document.getElementById('summary-ujian-progress').textContent = `${completedExams.length} / ${classQuizzes.length || completedExams.length} Selesai`;
            summaryBox.classList.remove('hidden');

            // Render Rapor Lengkap
            resultContainer.innerHTML = `
                <!-- Kartu Profil Siswa -->
                <div class="bg-indigo-600 text-white border-2 sm:border-[3px] border-black rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-yellow-300 text-black border-2 border-black rounded-2xl flex items-center justify-center font-black text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                            ${escapeHtml((studentInfo.nama || 'S').charAt(0))}
                        </div>
                        <div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <h4 class="font-black text-lg sm:text-xl uppercase tracking-tight text-white">${escapeHtml(studentInfo.nama)}</h4>
                                <span class="bg-yellow-300 text-black text-[10px] font-black px-2 py-0.5 rounded border border-black uppercase">
                                    Kelas ${escapeHtml(studentKelas)}
                                </span>
                            </div>
                            <p class="text-xs text-indigo-100 font-bold mt-0.5">NISN: ${escapeHtml(studentInfo.nisn || '-')} &bull; SMP Negeri 58 Palembang</p>
                        </div>
                    </div>
                    <button type="button" onclick="window.printStudentReportCard('${escapeHtml(studentInfo.nama)}')" class="px-4 py-2 bg-white hover:bg-slate-100 text-black border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition flex items-center gap-1.5 shrink-0 cursor-pointer">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24-1.077-.42-2.2-.42-3.329 0-4.418 3.582-8 8-8s8 3.582 8 8c0 1.129-.18 2.252-.42 3.329M9 17.25h6m-6 3h6m-9-6.75h12a2.25 2.25 0 012.25 2.25v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-2.25A2.25 2.25 0 018.25 10.5z"></path></svg>
                        <span>Cetak Rapor Siswa</span>
                    </button>
                </div>

                <!-- BAGIAN 1: STATUS PENUGASAN (TUGAS & PR) -->
                <div class="space-y-3">
                    <div class="flex justify-between items-center border-b-2 border-black pb-2">
                        <div class="flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full bg-emerald-500 border border-black"></span>
                            <h4 class="font-black text-sm uppercase tracking-wider text-black">1. Rekap Pengerjaan Tugas & PR</h4>
                        </div>
                        <span class="text-xs font-black px-2.5 py-0.5 bg-slate-100 border border-black rounded-lg text-slate-800">
                            ${completedTasks.length} dari ${classAssignments.length || completedTasks.length} Tugas Selesai
                        </span>
                    </div>

                    <!-- Tugas Selesai -->
                    <div class="space-y-2.5">
                        ${completedTasks.length === 0 ? `
                            <div class="p-4 bg-slate-50 border-2 border-black rounded-2xl text-center text-xs font-bold text-slate-500 uppercase">
                                Belum ada tugas yang dikumpulkan oleh siswa ini.
                            </div>
                        ` : completedTasks.map(g => {
                            const hasGrade = g.nilai !== null && g.nilai !== undefined && g.nilai !== '';
                            const gradeBadge = hasGrade
                                ? `<div class="text-right"><span class="bg-emerald-400 text-black font-black text-xl px-3 py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block">${g.nilai}</span><span class="block text-[10px] font-bold text-slate-500 uppercase mt-1">Nilai Tugas</span></div>`
                                : `<span class="bg-amber-200 text-amber-900 font-black text-xs px-2.5 py-1 rounded-lg border border-amber-400">Menunggu Koreksi</span>`;

                            return `
                                <div class="bg-white border-2 border-black rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <div class="flex-grow">
                                        <div class="flex items-center gap-2 mb-1 flex-wrap">
                                            <span class="text-[10px] bg-emerald-100 text-emerald-900 font-black px-2 py-0.5 rounded border border-emerald-300 uppercase">
                                                SUDAH DIKUMPULKAN &bull; ${escapeHtml(g.mapel || 'Informatika')}
                                            </span>
                                            <span class="text-[10px] font-bold text-slate-500">
                                                Dikirim: ${new Date(g.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <h5 class="font-black text-base text-black">${escapeHtml(g.materi)}</h5>
                                        <p class="text-xs text-slate-600 font-bold mt-0.5">${escapeHtml(g.filename || 'Formulir Jawaban')}</p>
                                        ${g.catatan_guru ? `<div class="mt-2 text-xs bg-amber-50 p-2.5 rounded-xl border border-amber-300 font-medium text-slate-800"><strong>Catatan Guru:</strong> ${escapeHtml(g.catatan_guru)}</div>` : ''}
                                        ${g.ai_feedback ? `<div class="mt-1.5 text-xs bg-purple-50 p-2.5 rounded-xl border border-purple-200 font-medium text-purple-900"><strong>Evaluasi AI:</strong> ${escapeHtml(g.ai_feedback)}</div>` : ''}
                                    </div>
                                    <div class="shrink-0 self-start sm:self-center">
                                        ${gradeBadge}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <!-- Tugas Belum Dikerjakan (Jika Ada) -->
                    ${pendingTasks.length > 0 ? `
                        <div class="mt-3 pt-3 border-t border-dashed border-red-300">
                            <span class="text-[11px] font-black uppercase text-red-700 tracking-wider flex items-center gap-1.5 mb-2">
                                <span class="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                                Tugas Belum Dikerjakan (${pendingTasks.length} Tugas):
                            </span>
                            <div class="space-y-2">
                                ${pendingTasks.map(t => `
                                    <div class="bg-red-50 border-2 border-red-300 rounded-2xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <div>
                                            <div class="flex items-center gap-2">
                                                <span class="bg-red-200 text-red-900 text-[10px] font-black px-2 py-0.5 rounded border border-red-400 uppercase">
                                                    BELUM DIKUMPULKAN
                                                </span>
                                                <span class="text-[10px] font-bold text-red-700 uppercase">${escapeHtml(t.mapel)}</span>
                                            </div>
                                            <h5 class="font-black text-sm text-red-950 mt-1">${escapeHtml(t.judul_tugas)}</h5>
                                            ${t.deadline ? `<span class="text-[10px] font-bold text-red-600 block mt-0.5">Batas Pengumpulan: ${escapeHtml(t.deadline)}</span>` : ''}
                                        </div>
                                        <div class="flex items-center gap-2 shrink-0 self-start sm:self-center">
                                            <button type="button" onclick="window.navigateToAssignment('${escapeHtml(String(t.id))}')" class="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition flex items-center gap-1.5 cursor-pointer">
                                                <span>Kerjakan Tugas</span>
                                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- BAGIAN 2: STATUS UJIAN ONLINE (CBT) -->
                <div class="space-y-3 pt-4">
                    <div class="flex justify-between items-center border-b-2 border-black pb-2">
                        <div class="flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full bg-purple-500 border border-black"></span>
                            <h4 class="font-black text-sm uppercase tracking-wider text-black">2. Rekap Ujian Online (CBT)</h4>
                        </div>
                        <span class="text-xs font-black px-2.5 py-0.5 bg-slate-100 border border-black rounded-lg text-slate-800">
                            ${completedExams.length} dari ${classQuizzes.length || completedExams.length} Ujian Diikuti
                        </span>
                    </div>

                    <!-- Ujian Selesai -->
                    <div class="space-y-2.5">
                        ${completedExams.length === 0 ? `
                            <div class="p-4 bg-slate-50 border-2 border-black rounded-2xl text-center text-xs font-bold text-slate-500 uppercase">
                                Belum ada riwayat ujian CBT yang diselesaikan oleh siswa ini.
                            </div>
                        ` : completedExams.map(q => {
                            const isGraded = q.status_koreksi === 'selesai';
                            const scoreBadge = isGraded
                                ? `<div class="text-right"><span class="bg-yellow-300 text-black font-black text-xl px-3 py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block">${q.total_nilai}</span><span class="block text-[10px] font-bold text-slate-500 uppercase mt-1">Nilai Akhir</span></div>`
                                : `<span class="bg-amber-200 text-amber-900 font-black text-xs px-3 py-1.5 rounded-xl border-2 border-amber-500 inline-block">Menunggu Koreksi Esai</span>`;

                            return `
                                <div class="bg-white border-2 border-black rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <div class="flex-grow">
                                        <div class="flex items-center gap-2 mb-1 flex-wrap">
                                            <span class="text-[10px] bg-purple-100 text-purple-900 font-black px-2 py-0.5 rounded border border-purple-300 uppercase">
                                                UJIAN SELESAI &bull; ${escapeHtml(q.mapel || q.quizzes?.mapel || 'Ujian')}
                                            </span>
                                            <span class="text-[10px] font-bold text-slate-500">
                                                Waktu: ${new Date(q.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <h5 class="font-black text-base text-black">${escapeHtml(q.judul_kuis || q.quizzes?.judul_kuis || 'Ujian Online')}</h5>
                                        <div class="flex items-center gap-3 mt-1.5 text-xs font-bold text-slate-700">
                                            <span>Skor PG: <strong>${q.skor_pg || 0}</strong></span>
                                            <span>Skor Esai: <strong>${q.skor_esai || 0}</strong></span>
                                        </div>
                                        ${q.catatan_guru ? `<div class="mt-2 text-xs bg-amber-50 p-2.5 rounded-xl border border-amber-300 font-medium text-slate-800"><strong>Catatan Guru:</strong> ${escapeHtml(q.catatan_guru)}</div>` : ''}
                                    </div>
                                    <div class="shrink-0 self-start sm:self-center">
                                        ${scoreBadge}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <!-- Ujian Belum Diikuti (Jika Ada) -->
                    ${pendingExams.length > 0 ? `
                        <div class="mt-3 pt-3 border-t border-dashed border-red-300">
                            <span class="text-[11px] font-black uppercase text-red-700 tracking-wider flex items-center gap-1.5 mb-2">
                                <span class="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                                Ujian Belum Diikuti (${pendingExams.length} Ujian):
                            </span>
                            <div class="space-y-2">
                                ${pendingExams.map(u => `
                                    <div class="bg-red-50 border-2 border-red-300 rounded-2xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <div>
                                            <div class="flex items-center gap-2">
                                                <span class="bg-red-200 text-red-900 text-[10px] font-black px-2 py-0.5 rounded border border-red-400 uppercase">
                                                    BELUM MENGIKUTI
                                                </span>
                                                <span class="text-[10px] font-bold text-red-700 uppercase">${escapeHtml(u.mapel)}</span>
                                            </div>
                                            <h5 class="font-black text-sm text-red-950 mt-1">${escapeHtml(u.judul_kuis)}</h5>
                                            <span class="text-[10px] font-bold text-red-600 block mt-0.5">Durasi: ${escapeHtml(String(u.durasi_menit || 60))} Menit</span>
                                        </div>
                                        <div class="flex items-center gap-2 shrink-0 self-start sm:self-center">
                                            <button type="button" onclick="window.navigateToExam('${escapeHtml(String(u.id))}')" class="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition flex items-center gap-1.5 cursor-pointer">
                                                <span>Ikuti Ujian</span>
                                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        } catch (e) {
            resultContainer.innerHTML = `<div class="bg-red-50 border-2 border-red-400 rounded-2xl p-4 text-center text-xs font-bold text-red-800">Gagal memuat buku nilai: ${escapeHtml(e.message)}</div>`;
        }
    };

    // Muat data penugasan default saat halaman terbuka
    loadStudentAssignments();
    loadStudentMaterials();
    await loadStudentQuizzes();

    // Auto-resume sesi ujian aktif jika siswa me-reload browser
    try {
        const rawActive = sessionStorage.getItem('cbt_active_exam_session');
        if (rawActive) {
            const activeData = JSON.parse(rawActive);
            if (activeData && activeData.quizId && activeData.submissionId) {
                let resumeData = null;
                try {
                    const { data } = await supabase.rpc('resume_exam_session', {
                        p_submission_id: activeData.submissionId,
                        p_session_key: activeData.sessionKey || '',
                        p_student_id: activeData.studentId || '',
                        p_student_name: activeData.studentName
                    });
                    resumeData = data;
                } catch (_) {}

                if (!resumeData || resumeData.error) {
                    // Sesi sudah selesai / dihapus / tidak valid: bersihkan sisa data lokal
                    sessionStorage.removeItem('cbt_active_exam_session');
                    const localKey = `cbt_exam_${activeData.quizId}_${encodeURIComponent(activeData.studentName)}`;
                    try { localStorage.removeItem(localKey); } catch (_) {}
                } else {
                    if (typeof switchStudentPortal === 'function') {
                        switchStudentPortal('ujian');
                    }
                    const serverSub = resumeData.submission || {};
                    await launchCbtExam(
                        resumeData.quiz,
                        activeData.studentName,
                        serverSub.id,
                        activeData.studentId,
                        serverSub,
                        serverSub?.jawaban_siswa?.sessionKey || ''
                    );
                }
            }
        }
    } catch (_) {}

});
