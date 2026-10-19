import { supabase } from './supabase.js';

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

export function parseAssignmentQuestions(assignment) {
    if (!assignment || !assignment.deskripsi) {
        return { petunjuk: '', questions: [] };
    }
    const raw = String(assignment.deskripsi).trim();
    if (raw.startsWith('{') || raw.startsWith('[')) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return { petunjuk: '', questions: parsed };
            }
            if (parsed.questions && Array.isArray(parsed.questions)) {
                return { petunjuk: parsed.petunjuk || '', questions: parsed.questions };
            }
        } catch (_) {}
    }
    return { petunjuk: raw, questions: [] };
}

export function isClassMatch(targetKelas, studentKelas) {
    if (!targetKelas || !studentKelas) return true;
    const target = String(targetKelas).trim().toLowerCase();
    const student = String(studentKelas).trim().toLowerCase();

    if (target === 'semua' || target === 'semua kelas' || (target.includes('semua') && !target.match(/[789]|vii|viii|ix/))) {
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
        nameEl.innerText = `📎 Berkas terpilih: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
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

function renderStudentFormQuestions(questions, previousAnswersMap = {}) {
    const container = document.getElementById('student-form-questions-list');
    if (!container) return;
    container.innerHTML = '';

    questions.forEach((q, idx) => {
        const qNum = q.nomor || (idx + 1);
        const prevAnswer = previousAnswersMap[qNum] || '';
        const tipe = q.tipe || 'esai';
        const isPg = tipe === 'pg' || tipe === 'pilihan_ganda';
        const isBs = tipe === 'benar_salah';
        const isFoto = tipe === 'upload_foto';
        const isMatch = tipe === 'menjodohkan';
        const isSingkat = tipe === 'singkat' || tipe === 'isian_singkat';

        const card = document.createElement('div');
        card.className = "bg-white border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3";

        let typeLabel = 'Esai / Uraian';
        let typeBadgeClass = 'bg-purple-100 text-purple-900 border-purple-300';
        if (isPg) {
            typeLabel = 'Pilihan Ganda';
            typeBadgeClass = 'bg-blue-100 text-blue-900 border-blue-300';
        } else if (isBs) {
            typeLabel = 'Benar / Salah';
            typeBadgeClass = 'bg-teal-100 text-teal-900 border-teal-300';
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
        if (isPg) {
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

            inputHtml = `
                <div class="space-y-2 pt-1">
                    ${options.map(opt => {
                        const isChecked = prevAnswer === opt.key ? 'checked' : '';
                        return `
                            <label class="flex items-start gap-3 p-3 rounded-xl border-2 border-black bg-slate-50 hover:bg-indigo-50 cursor-pointer transition select-none has-[:checked]:bg-indigo-100 has-[:checked]:border-indigo-600">
                                <input type="radio" name="student_q_${qNum}" value="${opt.key}" ${isChecked} required class="w-4 h-4 mt-0.5 accent-indigo-600 shrink-0">
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
            inputHtml = `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <label class="flex items-center gap-3 p-3 rounded-xl border-2 border-black bg-slate-50 hover:bg-teal-50 cursor-pointer transition select-none has-[:checked]:bg-teal-100 has-[:checked]:border-teal-700">
                        <input type="radio" name="student_q_${qNum}" value="BENAR" ${isBenar ? 'checked' : ''} required class="w-4 h-4 accent-teal-600 shrink-0">
                        <span class="text-xs font-black text-teal-950">✅ BENAR (Sesuai)</span>
                    </label>
                    <label class="flex items-center gap-3 p-3 rounded-xl border-2 border-black bg-slate-50 hover:bg-red-50 cursor-pointer transition select-none has-[:checked]:bg-red-100 has-[:checked]:border-red-700">
                        <input type="radio" name="student_q_${qNum}" value="SALAH" ${isSalah ? 'checked' : ''} required class="w-4 h-4 accent-red-600 shrink-0">
                        <span class="text-xs font-black text-red-950">❌ SALAH (Tidak Sesuai)</span>
                    </label>
                </div>
            `;
        } else if (isFoto) {
            const hasPrev = prevAnswer && String(prevAnswer).startsWith('http');
            inputHtml = `
                <div class="space-y-2 pt-1">
                    <div class="border-2 border-dashed border-black rounded-xl p-4 bg-orange-50/50 hover:bg-orange-50 transition text-center cursor-pointer" onclick="document.getElementById('student_file_q_${qNum}').click()">
                        <input type="file" id="student_file_q_${qNum}" accept="image/*,.pdf,.doc,.docx" class="hidden" onchange="window.handleStudentFilePreview(${qNum}, this)">
                        <div class="flex flex-col items-center gap-1.5">
                            <span class="text-2xl">📸</span>
                            <span class="text-xs font-black uppercase text-black">Pilih / Unggah Berkas Foto Pekerjaan</span>
                            <span class="text-[10px] text-slate-600 font-bold">Maksimal 10MB (Foto, Tangkapan Layar, atau PDF)</span>
                        </div>
                    </div>
                    <div id="student_file_name_q_${qNum}" class="text-xs font-black text-emerald-800 ${hasPrev ? '' : 'hidden'}">
                        ${hasPrev ? `✅ Berkas tersimpan sebelumnya: <a href="${escapeHtml(prevAnswer)}" target="_blank" class="underline text-indigo-700">Buka Berkas Anda</a>` : ''}
                    </div>
                    <div id="student_preview_q_${qNum}" class="${hasPrev ? '' : 'hidden'} mt-1.5">
                        ${hasPrev ? `<img src="${escapeHtml(prevAnswer)}" class="max-h-48 rounded-xl border-2 border-black object-contain bg-white" />` : ''}
                    </div>
                </div>
            `;
        } else if (isMatch) {
            const pairs = Array.isArray(q.pasangan) ? q.pasangan : [];
            const rightChoices = pairs.map(p => p.kanan).filter(Boolean);
            const prevMatches = (typeof prevAnswer === 'object' && prevAnswer !== null) ? prevAnswer : {};

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
                                    <select name="student_match_${qNum}_${pIdx}" data-premise="${escapeHtml(p.kiri)}" required class="w-full h-9 px-2.5 rounded-lg border-2 border-black bg-white font-bold text-xs cursor-pointer">
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
        } else if (isSingkat) {
            inputHtml = `
                <div class="pt-1">
                    <input type="text" name="student_q_${qNum}" value="${escapeHtml(prevAnswer)}" required placeholder="Ketikkan jawaban singkat Anda di sini..." class="w-full h-10 px-3 rounded-xl border-2 border-black bg-slate-50 font-bold text-xs outline-none focus:bg-white">
                </div>
            `;
        } else {
            // esai
            inputHtml = `
                <div class="pt-1 space-y-1">
                    <textarea name="student_q_${qNum}" rows="4" required placeholder="Tuliskan jawaban uraian/penjelasan Anda secara lengkap di sini..." class="w-full p-3 rounded-xl border-2 border-black bg-slate-50 font-medium text-xs outline-none focus:bg-white resize-y">${escapeHtml(prevAnswer)}</textarea>
                    <p class="text-[10px] text-slate-500 font-bold ml-1">Ketikkan penjelasan selengkap mungkin agar evaluasi AI dan guru lebih akurat.</p>
                </div>
            `;
        }

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
                ${escapeHtml(q.pertanyaan || '')}
            </div>
            ${inputHtml}
        `;

        container.appendChild(card);
    });
}

const DEFAULT_CLASSES = [
    '7.1', '7.2', '7.3', '7.4', '7.5', '7.6', '7.7', '7.8', '7.9', '7.10',
    '8.1', '8.2', '8.3', '8.4', '8.5', '8.6', '8.7', '8.8', '8.9', '8.10',
    '9.1', '9.2', '9.3', '9.4', '9.5', '9.6', '9.7', '9.8', '9.9', '9.10'
];

document.addEventListener('DOMContentLoaded', async () => {

    // Helper Modal Alert/Confirm Neobrutalisme (Standard LMS SMPN 58)
    window.showCustomModal = (message, type = 'alert', title = 'Pemberitahuan', icon = '📢') => {
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
    const btnSaveProfile = document.getElementById('btn-save-profile');
    const greetingEl = document.getElementById('student-greeting');
    const metaEl = document.getElementById('student-meta');
    const savedBadge = document.getElementById('profile-saved-badge');
    const checkNameInput = document.getElementById('check-name-input');

    const subKelasSelect = document.getElementById('sub-kelas');

    async function loadClassOptions() {
        let classes = [...DEFAULT_CLASSES];
        try {
            const { data } = await supabase.from('options').select('name').eq('type', 'kelas');
            if (data && data.length > 0) {
                classes = data.map(o => o.name);
            }
        } catch (e) {
            console.warn("Using fallback class options", e);
        }

        const populate = (el, includeAll = false) => {
            if (!el) return;
            el.innerHTML = includeAll ? '<option value="">Semua Kelas</option>' : '<option value="" disabled selected>Pilih Kelas</option>';
            classes.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = `Kelas ${c}`;
                el.appendChild(opt);
            });
        };

        populate(globalKelasSelect, true);
        populate(subKelasSelect, false);
    }

    await loadClassOptions();

    // Pulihkan profil siswa dari localStorage
    const savedName = localStorage.getItem('student_nama') || '';
    const savedKelas = localStorage.getItem('student_kelas') || '';

    if (savedName) {
        globalNameInput.value = savedName;
        if (checkNameInput) checkNameInput.value = savedName;
    }
    if (savedKelas) {
        globalKelasSelect.value = savedKelas;
    }

    function updateStudentProfileUI(name, kelas) {
        if (name) {
            greetingEl.textContent = `Halo, ${name}!`;
            metaEl.textContent = kelas ? `Siswa Kelas ${kelas} SMP Negeri 58 Palembang` : 'Siswa SMP Negeri 58 Palembang';
            if (savedBadge) savedBadge.classList.remove('hidden');
        } else {
            greetingEl.textContent = "Halo, Siswa SMPN 58!";
            metaEl.textContent = "Isi nama & kelas Anda agar tugas dan ujian tersaring otomatis.";
            if (savedBadge) savedBadge.classList.add('hidden');
        }
    }

    updateStudentProfileUI(savedName, savedKelas);

    if (btnSaveProfile) {
        btnSaveProfile.addEventListener('click', async () => {
            const name = globalNameInput.value.trim();
            const kelas = globalKelasSelect.value;
            localStorage.setItem('student_nama', name);
            localStorage.setItem('student_kelas', kelas);
            updateStudentProfileUI(name, kelas);

            // Re-fetch dan render konten sesuai profil siswa aktif
            await loadStudentAssignments();
            await loadStudentMaterials();
            await loadStudentQuizzes();
            updatePortalOverviewStats();
        });
    }

    // ==========================================
    // 2. Tab Portal Switcher
    // ==========================================
    window.switchStudentPortal = (viewName) => {
        const tabs = ['tugas', 'materi', 'ujian', 'nilai'];
        tabs.forEach(t => {
            const btn = document.getElementById(`nav-btn-${t}`);
            const content = document.getElementById(`view-${t}`);
            if (t === viewName) {
                if (btn) btn.className = "portal-tab-btn py-3 px-3 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-black text-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
                if (content) content.classList.remove('hidden');
            } else {
                if (btn) btn.className = "portal-tab-btn py-3 px-3 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-white text-black border-[3px] border-black hover:bg-slate-100";
                if (content) content.classList.add('hidden');
            }
        });

        if (viewName === 'tugas') loadStudentAssignments();
        if (viewName === 'materi') loadStudentMaterials();
        if (viewName === 'ujian') loadStudentQuizzes();
        if (viewName === 'nilai') {
            const curName = globalNameInput.value.trim();
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
        const studentKelas = globalKelasSelect.value;
        const studentName = globalNameInput.value.trim();

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
        if (studentName) {
            try {
                const { count } = await supabase.from('files').select('*', { count: 'exact', head: true }).ilike('nama', `%${studentName}%`).not('nilai', 'is', null);
                const statGradeEl = document.getElementById('stat-grades-count');
                if (statGradeEl) statGradeEl.textContent = `${count || 0} Nilai`;
            } catch (e) {
                console.warn(e);
            }
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
            const studentName = globalNameInput.value.trim();
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
                emptyMsg = `Hore! Tidak ada tugas yang tertunda. Seluruh tugas telah Anda kumpulkan! 🎉`;
            } else if (currentAssignmentStatusFilter === 'submitted') {
                emptyMsg = `Belum ada tugas yang sedang menunggu koreksi guru/AI.`;
            } else if (currentAssignmentStatusFilter === 'graded') {
                emptyMsg = `Belum ada tugas yang selesai dinilai. Silakan kumpulkan tugas Anda terlebih dahulu.`;
            }

            container.innerHTML = `
                <div class="col-span-2 bg-white border-[3px] border-black rounded-[28px] p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <span class="text-4xl block mb-2">🎉</span>
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
                    deadlineBadge = `<span class="bg-red-100 text-red-800 border border-red-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">⚠️ Lewat Tenggat (${formattedDate})</span>`;
                } else {
                    deadlineBadge = `<span class="bg-yellow-100 text-yellow-900 border border-yellow-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">⏳ Batas: ${formattedDate} WIB</span>`;
                }
            } else {
                deadlineBadge = `<span class="bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">Tanpa Batas Waktu</span>`;
            }

            const parsed = parseAssignmentQuestions(a);
            const hasQuestions = parsed.questions && parsed.questions.length > 0;

            // Status submission badge
            let submissionBadge = '';
            let actionBtnText = hasQuestions ? 'Kerjakan Soal Online 🚀' : 'Kumpul Tugas Ini 🚀';
            let actionBtnClass = 'bg-indigo-600 hover:bg-black text-white';

            if (mySubmission) {
                if (mySubmission.nilai !== null && mySubmission.nilai !== undefined && mySubmission.nilai !== '') {
                    submissionBadge = `<span class="bg-emerald-400 text-black border-2 border-black font-black text-xs px-2.5 py-1 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">✅ Nilai: ${mySubmission.nilai}/100</span>`;
                } else {
                    submissionBadge = `<span class="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs px-2 py-0.5 rounded-lg">✅ Sudah Dikumpulkan (Menunggu Koreksi)</span>`;
                }
                actionBtnText = hasQuestions ? 'Perbarui Jawaban Form ✏️' : 'Kirim Ulang / Perbarui ✏️';
                actionBtnClass = 'bg-white hover:bg-slate-100 text-black border-2 border-black';
            } else {
                submissionBadge = `<span class="bg-red-100 text-red-800 border border-red-300 font-bold text-xs px-2 py-0.5 rounded-lg">🔴 Belum Dikerjakan</span>`;
            }

            const card = document.createElement('div');
            card.className = "bg-white border-[3px] border-black rounded-[28px] p-5 md:p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between";
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
                            ${hasQuestions ? `
                                <span class="bg-indigo-600 text-white font-black text-[10px] px-2 py-0.5 rounded uppercase border border-black">
                                    📋 Form Online (${parsed.questions.length} Soal)
                                </span>
                            ` : ''}
                        </div>
                        <div>${deadlineBadge}</div>
                    </div>

                    <h4 class="font-black text-lg md:text-xl text-black mb-1.5">${a.judul_tugas}</h4>
                    <p class="text-xs text-slate-700 font-medium leading-relaxed mb-3 whitespace-pre-line">${hasQuestions ? (parsed.petunjuk || 'Silakan buka dan kerjakan lembar soal interaktif online.') : a.deskripsi}</p>

                    ${a.rubrik_ai ? `
                        <div class="bg-purple-50 border border-purple-200 rounded-xl p-3 text-[11px] font-bold text-purple-900 mb-3">
                            🎯 <strong>Rubrik Penilaian AI:</strong> ${a.rubrik_ai}
                        </div>
                    ` : ''}

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

                <div class="pt-3 border-t-2 border-slate-100 flex items-center justify-between gap-2">
                    <div>${submissionBadge}</div>
                    <button type="button" onclick="openAssignmentSubmissionModal(${JSON.stringify(a).replace(/"/g, '&quot;')})" class="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 ${actionBtnClass}">
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
    window.openAssignmentSubmissionModal = (assignment) => {
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
            if (assignment.rubrik_ai) {
                rubrikEl.innerHTML = `🎯 <strong>Rubrik Penilaian AI:</strong> ${assignment.rubrik_ai}`;
                rubrikEl.classList.remove('hidden');
            } else {
                rubrikEl.classList.add('hidden');
            }
        }

        subNamaInput.value = globalNameInput.value.trim();
        subKelasSelect.value = globalKelasSelect.value || assignment.kelas || '';
        subMapelSelect.value = assignment.mapel || 'Informatika';
        subMateriInput.value = assignment.judul_tugas || '';
        subMateriInput.readOnly = true;

        if (subTextAnswerInput) subTextAnswerInput.value = '';
        if (subTextCount) subTextCount.textContent = '0 kata | 0 karakter';
        resetFileInput();
        if (linkUrlInput) linkUrlInput.value = '';
        if (linkNoteInput) linkNoteInput.value = '';

        // Cek apakah siswa telah mengirim tugas ini sebelumnya
        const mySubmission = studentFiles.find(f => 
            (f.assignment_id && String(f.assignment_id) === String(assignment.id)) ||
            (f.materi && f.materi.toLowerCase().trim() === (assignment.judul_tugas || '').toLowerCase().trim())
        );

        const statusEl = document.getElementById('modal-banner-status');
        if (statusEl) {
            if (mySubmission) {
                statusEl.classList.remove('hidden');
                if (mySubmission.nilai !== null && mySubmission.nilai !== undefined && mySubmission.nilai !== '') {
                    statusEl.innerHTML = `
                        <div class="flex items-center justify-between">
                            <span class="font-black text-emerald-950">✅ Nilai Anda: ${mySubmission.nilai} / 100</span>
                            <span class="text-[10px] bg-emerald-200 text-emerald-950 font-black px-2 py-0.5 rounded">Telah Dikoreksi</span>
                        </div>
                        ${mySubmission.catatan_guru ? `<p class="text-[11px] font-medium text-emerald-950 mt-1"><strong>Catatan Guru:</strong> ${mySubmission.catatan_guru}</p>` : ''}
                    `;
                } else {
                    statusEl.innerHTML = `
                        <div class="flex items-center justify-between">
                            <span class="font-black text-emerald-900">✅ Tugas Sudah Dikumpulkan</span>
                            <span class="text-[10px] bg-amber-200 text-amber-950 font-black px-2 py-0.5 rounded">Menunggu Koreksi Guru</span>
                        </div>
                        <p class="text-[10px] text-slate-700 font-medium">Anda dapat memperbarui jawaban Anda di bawah ini jika diperlukan.</p>
                    `;
                }
            } else {
                statusEl.classList.add('hidden');
            }
        }

        const formSheet = document.getElementById('task-google-form-sheet');
        const legacySheet = document.getElementById('task-legacy-text-sheet');
        const modeSwitcher = document.getElementById('sub-mode-switcher-container');
        const counterBadge = document.getElementById('student-form-counter-badge');

        if (currentFormQuestions && currentFormQuestions.length > 0) {
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

            renderStudentFormQuestions(currentFormQuestions, prevAnswersMap);
            setSubmissionMode('text');
        } else {
            // Tampilkan Legacy Text Sheet
            if (formSheet) formSheet.classList.add('hidden');
            if (legacySheet) legacySheet.classList.remove('hidden');
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
                } else {
                    setSubmissionMode('text');
                }
            } else {
                setSubmissionMode('text');
            }
        }

        subModal.classList.remove('hidden');
        subModal.classList.add('flex');
    };

    // Buka Modal Tugas Mandiri / Bebas
    window.openFreeSubmissionModal = () => {
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

        subNamaInput.value = globalNameInput.value.trim();
        subKelasSelect.value = globalKelasSelect.value || '';
        subMateriInput.value = '';
        subMateriInput.readOnly = false;

        if (subTextAnswerInput) subTextAnswerInput.value = '';
        if (subTextCount) subTextCount.textContent = '0 kata | 0 karakter';
        resetFileInput();
        if (linkUrlInput) linkUrlInput.value = '';
        if (linkNoteInput) linkNoteInput.value = '';
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
                    showCustomModal('Ukuran berkas melebihi batas 10MB.', 'alert', 'Peringatan', '⚠️');
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

        const nama = subNamaInput.value.trim();
        const kelas = subKelasSelect.value;
        const mapel = subMapelSelect.value;
        const materi = subMateriInput.value.trim();
        const assignmentId = subAssignIdInput.value ? Number(subAssignIdInput.value) : null;

        if (!nama || !kelas || !materi) {
            await showCustomModal('Lengkapi Nama Siswa, Kelas, dan Judul Tugas!', 'alert', 'Data Belum Lengkap', '⚠️');
            return;
        }

        // Simpan ke localStorage siswa
        localStorage.setItem('student_nama', nama);
        localStorage.setItem('student_kelas', kelas);
        globalNameInput.value = nama;
        globalKelasSelect.value = kelas;
        updateStudentProfileUI(nama, kelas);

        if (currentSubmissionMode === 'text') {
            if (currentFormQuestions && currentFormQuestions.length > 0) {
                // Evaluated in payload generation below
            } else {
                const textAnswer = subTextAnswerInput.value.trim();
                if (!textAnswer) {
                    await showCustomModal('Silakan tuliskan lembar jawaban tugas Anda terlebih dahulu.', 'alert', 'Jawaban Kosong', '⚠️');
                    return;
                }
            }
        } else if (currentSubmissionMode === 'file') {
            if (!fileInput.files || fileInput.files.length === 0) {
                await showCustomModal('Silakan pilih setidaknya 1 berkas tugas.', 'alert', 'Berkas Diperlukan', '⚠️');
                return;
            }
        } else {
            const linkUrl = linkUrlInput.value.trim();
            if (!linkUrl || (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://'))) {
                await showCustomModal('Tautan tidak valid! Mohon awali dengan http:// atau https://', 'alert', 'Tautan Tidak Valid', '⚠️');
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

                        if (tipe === 'pg' || tipe === 'pilihan_ganda' || tipe === 'benar_salah') {
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
                            await showCustomModal(`Soal Nomor ${qNum} belum dijawab atau belum lengkap! Mohon lengkapi semua butir soal terlebih dahulu.`, 'alert', 'Lengkapi Jawaban', '⚠️');
                            return;
                        }

                        studentAnswers.push({
                            nomor: qNum,
                            tipe,
                            pertanyaan: q.pertanyaan || '',
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
                        status_koreksi: 'belum_dikoreksi'
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
            await showCustomModal('Gagal mengirim tugas: ' + e.message, 'alert', 'Gagal', '❌');
        } finally {
            subSubmitBtn.innerText = 'KIRIM TUGAS SEKARANG 🚀';
            subSubmitBtn.disabled = false;
        }
    });

    function showReceiptModal(data) {
        document.getElementById('receipt-id').textContent = data.receiptId;
        document.getElementById('receipt-time').textContent = data.time;
        document.getElementById('receipt-student').textContent = data.student;
        document.getElementById('receipt-meta').textContent = data.meta;
        document.getElementById('receipt-title').textContent = data.title;
        document.getElementById('receipt-detail').textContent = data.detail;

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
            card.className = "bg-white border-[3px] border-black rounded-[28px] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between";
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
            const { data, error } = await supabase.from('quizzes').select('*, quiz_questions(*)').eq('status', 'aktif').order('created_at', { ascending: false });
            if (error) throw error;
            allQuizzes = data || [];

            // Ambil riwayat submit kuis siswa aktif
            const studentName = globalNameInput?.value?.trim();
            if (studentName) {
                const { data: mySubs } = await supabase
                    .from('quiz_submissions')
                    .select('*')
                    .ilike('nama_siswa', `%${studentName}%`);
                studentQuizSubmissions = mySubs || [];
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

    window.showMyQuizResult = (sub, judul, mapel) => {
        showCustomModal(
            `Mata Pelajaran: ${mapel}\n` +
            `Judul Ujian: ${judul}\n` +
            `Nama Siswa: ${sub.nama_siswa} (${sub.kelas})\n\n` +
            `Skor Pilihan Ganda : ${sub.skor_pg || 0}\n` +
            `Skor Esai         : ${sub.skor_esai || 0}\n` +
            `TOTAL NILAI AKHIR : ${sub.total_nilai || 0} / 100\n\n` +
            `Status: ${sub.status_koreksi === 'selesai' ? 'Sudah Dinilai Lengkap' : 'Menunggu Koreksi Guru'}`,
            'alert',
            'Hasil Ujian Siswa',
            '📊'
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

            let examStatusBadge = '';
            let actionBtnHtml = '';

            if (mySub) {
                examStatusBadge = `
                    <span class="bg-emerald-100 text-emerald-900 border border-emerald-400 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                        ✅ Sudah Dikerjakan &bull; Total Skor: ${mySub.total_nilai}/100
                    </span>
                `;
                actionBtnHtml = `
                    <button type="button" onclick="showMyQuizResult(${JSON.stringify(mySub).replace(/"/g, '&quot;')}, '${q.judul_kuis.replace(/'/g, "\\'")}', '${q.mapel}')" class="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-500 text-black border-2 border-black font-black text-xs uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5">
                        Lihat Skor Nilai 🎯
                    </button>
                `;
            } else {
                examStatusBadge = `
                    <span class="bg-red-100 text-red-800 border border-red-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                        🔴 Belum Dikerjakan
                    </span>
                `;
                actionBtnHtml = `
                    <button type="button" onclick="startExam('${q.id}')" class="px-5 py-2.5 bg-black hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5">
                        Mulai Ujian ✍️
                    </button>
                `;
            }

            const card = document.createElement('div');
            card.className = "bg-white border-[3px] border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4";
            card.innerHTML = `
                <div>
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                        <span class="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            ${q.mapel} &bull; Kelas ${q.kelas}
                        </span>
                        <span class="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            Durasi: ${q.durasi_menit} Menit
                        </span>
                        <span class="bg-indigo-100 text-indigo-900 border border-indigo-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            ${questions.length} Soal
                        </span>
                        ${examStatusBadge}
                    </div>
                    <h4 class="font-black text-xl text-black">${q.judul_kuis}</h4>
                    <p class="text-xs text-slate-600 font-bold mt-0.5">${q.petunjuk || 'Kerjakan dengan teliti dan jujur.'}</p>
                </div>
                ${actionBtnHtml}
            `;
            container.appendChild(card);
        });
    }

    window.filterStudentQuizzes = () => {
        renderStudentQuizzes();
    };

    window.startExam = async (quizId) => {
        const studentName = globalNameInput.value.trim();
        if (!studentName) {
            await showCustomModal("Silakan masukkan nama lengkap siswa pada kolom identitas siswa di atas sebelum memulai ujian.", 'alert', 'Nama Siswa Diperlukan', '⚠️');
            return;
        }

        const mySub = studentQuizSubmissions.find(s => String(s.quiz_id) === String(quizId));
        if (mySub) {
            const retake = await showCustomModal(`Anda sudah mengerjakan ujian ini dengan skor: ${mySub.total_nilai}/100.\n\nApakah Anda yakin ingin mengulang pengerjaan ujian ini?`, 'confirm', 'Ujian Ulang', '❓');
            if (!retake) return;
        }

        try {
            const { data, error } = await supabase.from('quizzes').select('*, quiz_questions(*)').eq('id', quizId).single();
            if (error) throw error;
            activeQuizData = { ...data, studentName };

            // Render ke Quiz Room
            document.getElementById('quiz-portal-landing').classList.add('hidden');
            const room = document.getElementById('quiz-room-container');
            room.classList.remove('hidden');

            document.getElementById('quiz-room-mapel').textContent = `${data.mapel} • Kelas ${data.kelas}`;
            document.getElementById('quiz-room-title').textContent = data.judul_kuis;
            document.getElementById('quiz-room-instructions').textContent = data.petunjuk || 'Kerjakan dengan teliti.';

            const qList = document.getElementById('quiz-questions-list');
            qList.innerHTML = '';

            const questions = data.quiz_questions || [];
            questions.sort((a, b) => a.nomor - b.nomor);

            questions.forEach((q, idx) => {
                const qBox = document.createElement('div');
                qBox.className = "bg-slate-50 border-2 border-black rounded-2xl p-4 md:p-5 space-y-3";
                
                if (q.tipe === 'pg') {
                    qBox.innerHTML = `
                        <div class="flex items-start gap-2">
                            <span class="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center font-black text-xs shrink-0">${idx + 1}</span>
                            <p class="font-bold text-sm text-black leading-relaxed">${q.pertanyaan}</p>
                        </div>
                        <div class="space-y-2 pl-8">
                            ${['A', 'B', 'C', 'D'].map(opt => {
                                const optKey = `opsi_${opt.toLowerCase()}`;
                                const optText = q[optKey];
                                if (!optText) return '';
                                return `
                                    <label class="flex items-center gap-2.5 p-2.5 bg-white border border-slate-300 rounded-xl cursor-pointer hover:bg-indigo-50 transition text-xs font-bold text-slate-800">
                                        <input type="radio" name="question_${q.id}" value="${opt}" class="w-4 h-4 text-indigo-600">
                                        <span><strong>${opt}.</strong> ${optText}</span>
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    `;
                } else {
                    qBox.innerHTML = `
                        <div class="flex items-start gap-2">
                            <span class="w-6 h-6 bg-purple-700 text-white rounded-full flex items-center justify-center font-black text-xs shrink-0">${idx + 1}</span>
                            <div>
                                <span class="text-[10px] bg-purple-100 text-purple-900 font-black px-1.5 py-0.5 rounded border border-purple-300 uppercase">Soal Esai</span>
                                <p class="font-bold text-sm text-black leading-relaxed mt-1">${q.pertanyaan}</p>
                            </div>
                        </div>
                        <div class="pl-8">
                            <textarea name="question_${q.id}" rows="3" placeholder="Tuliskan jawaban Anda di sini..." class="w-full p-3 border-2 border-black rounded-xl font-medium text-xs focus:outline-none bg-white"></textarea>
                        </div>
                    `;
                }
                qList.appendChild(qBox);
            });

            // Countdown Timer
            let remainingSeconds = (data.durasi_menit || 45) * 60;
            const timerEl = document.getElementById('quiz-timer');
            if (quizTimerInterval) clearInterval(quizTimerInterval);

            quizTimerInterval = setInterval(() => {
                remainingSeconds--;
                const m = Math.floor(remainingSeconds / 60);
                const s = remainingSeconds % 60;
                timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

                if (remainingSeconds <= 0) {
                    clearInterval(quizTimerInterval);
                    showCustomModal("Waktu ujian telah habis! Jawaban Anda dikirim secara otomatis.", 'alert', 'Waktu Habis', '⏰');
                    submitExamAnswers();
                }
            }, 1000);

            window.scrollTo({ top: room.offsetTop - 50, behavior: 'smooth' });

        } catch (e) {
            await showCustomModal("Gagal memulai ujian: " + e.message, 'alert', 'Gagal', '❌');
        }
    };

    window.cancelExam = async () => {
        const confExit = await showCustomModal("Apakah Anda yakin ingin membatalkan dan keluar dari ujian? Jawaban Anda tidak akan tersimpan.", 'confirm', 'Keluar Ujian', '⚠️');
        if (confExit) {
            if (quizTimerInterval) clearInterval(quizTimerInterval);
            activeQuizData = null;
            document.getElementById('quiz-room-container').classList.add('hidden');
            document.getElementById('quiz-portal-landing').classList.remove('hidden');
        }
    };

    window.submitExamAnswers = async () => {
        if (!activeQuizData) return;
        const confirmSubmit = await showCustomModal("Apakah Anda yakin ingin menyelesaikan dan mengirim jawaban ujian ini?", 'confirm', 'Kumpulkan Ujian', '📝');
        if (!confirmSubmit) return;

        if (quizTimerInterval) clearInterval(quizTimerInterval);

        const btn = document.getElementById('btn-submit-exam');
        btn.disabled = true;
        btn.innerText = "Mengirim Jawaban...";

        try {
            const questions = activeQuizData.quiz_questions || [];
            let answers = {};
            let pgScoreTotal = 0;

            questions.forEach(q => {
                if (q.tipe === 'pg') {
                    const selected = document.querySelector(`input[name="question_${q.id}"]:checked`);
                    const val = selected ? selected.value : '';
                    answers[q.id] = val;
                    if (val && val.toUpperCase() === (q.kunci_pg || '').toUpperCase()) {
                        pgScoreTotal += (q.bobot || 10);
                    }
                } else {
                    const textEl = document.querySelector(`textarea[name="question_${q.id}"]`);
                    answers[q.id] = textEl ? textEl.value.trim() : '';
                }
            });

            // Simpan ke Supabase quiz_submissions
            const { error } = await supabase.from('quiz_submissions').insert([{
                quiz_id: activeQuizData.id,
                nama_siswa: activeQuizData.studentName,
                kelas: activeQuizData.kelas,
                jawaban_siswa: answers,
                skor_pg: pgScoreTotal,
                skor_esai: 0,
                total_nilai: pgScoreTotal,
                status_koreksi: 'selesai'
            }]);

            if (error) throw error;

            await showCustomModal(`Ujian berhasil dikumpulkan! Nilai Pilihan Ganda Anda: ${pgScoreTotal} poin.`, 'alert', 'Ujian Selesai', '🎉');
            activeQuizData = null;
            document.getElementById('quiz-room-container').classList.add('hidden');
            document.getElementById('quiz-portal-landing').classList.remove('hidden');
            loadStudentQuizzes();
        } catch (e) {
            await showCustomModal("Gagal mengirim jawaban: " + e.message, 'alert', 'Gagal', '❌');
            btn.disabled = false;
            btn.innerText = "SELESAI & KIRIM JAWABAN";
        }
    };

    // ==========================================
    // 8. TAB 4: CEK RAPOR & BUKU NILAI SISWA
    // ==========================================
    window.checkStudentGrades = async () => {
        const nameVal = document.getElementById('check-name-input').value.trim();
        const resultContainer = document.getElementById('student-grades-result');
        const summaryBox = document.getElementById('grade-summary-cards');

        if (!nameVal) {
            await showCustomModal("Silakan masukkan nama lengkap siswa untuk mencari nilai!", 'alert', 'Pemberitahuan', '⚠️');
            return;
        }

        resultContainer.innerHTML = '<div class="text-center py-8 text-slate-500 font-bold text-xs uppercase animate-pulse">Mencari riwayat nilai di database...</div>';

        try {
            // 1. Ambil nilai tugas (files)
            const { data: fileGrades, error: fErr } = await supabase
                .from('files')
                .select('*')
                .ilike('nama', `%${nameVal}%`)
                .order('created_at', { ascending: false });

            if (fErr) throw fErr;

            // 2. Ambil nilai ujian (quiz_submissions)
            const { data: quizGrades, error: qErr } = await supabase
                .from('quiz_submissions')
                .select('*, quizzes(judul_kuis, mapel)')
                .ilike('nama_siswa', `%${nameVal}%`)
                .order('created_at', { ascending: false });

            if (qErr) throw qErr;

            resultContainer.innerHTML = '';

            const hasFiles = fileGrades && fileGrades.length > 0;
            const hasQuizzes = quizGrades && quizGrades.length > 0;

            if (!hasFiles && !hasQuizzes) {
                summaryBox.classList.add('hidden');
                resultContainer.innerHTML = `
                    <div class="bg-slate-50 border-2 border-black rounded-2xl p-8 text-center text-slate-500 font-bold uppercase text-xs">
                        Tidak ditemukan riwayat tugas maupun ujian atas nama "${nameVal}".
                    </div>
                `;
                return;
            }

            // Hitung ringkasan rata-rata
            const gradedFiles = (fileGrades || []).filter(f => f.nilai !== null && f.nilai !== undefined);
            const avgTugas = gradedFiles.length > 0 
                ? Math.round(gradedFiles.reduce((acc, f) => acc + Number(f.nilai), 0) / gradedFiles.length)
                : 0;

            const avgUjian = (quizGrades || []).length > 0
                ? Math.round((quizGrades || []).reduce((acc, q) => acc + Number(q.total_nilai || 0), 0) / (quizGrades || []).length)
                : 0;

            document.getElementById('summary-avg-tugas').textContent = gradedFiles.length > 0 ? avgTugas : '-';
            document.getElementById('summary-avg-ujian').textContent = (quizGrades || []).length > 0 ? avgUjian : '-';
            document.getElementById('summary-total-items').textContent = `${gradedFiles.length + (quizGrades || []).length} Selesai`;
            summaryBox.classList.remove('hidden');

            // Render Nilai Tugas
            if (hasFiles) {
                const tugasHeader = document.createElement('h4');
                tugasHeader.className = "font-black text-sm uppercase tracking-wider text-black mt-4 mb-2 flex items-center gap-1.5";
                tugasHeader.innerHTML = "<span>📌</span> Riwayat Pengumpulan Tugas";
                resultContainer.appendChild(tugasHeader);

                fileGrades.forEach(g => {
                    const card = document.createElement('div');
                    card.className = "bg-slate-50 border-2 border-black rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3";
                    
                    const hasGrade = g.nilai !== null && g.nilai !== undefined;
                    const gradeBadge = hasGrade 
                        ? `<div class="text-right"><span class="bg-emerald-400 text-black font-black text-xl px-3 py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block">${g.nilai}</span><span class="block text-[10px] font-bold text-slate-500 uppercase mt-1">Skor Tugas</span></div>`
                        : `<span class="bg-amber-200 text-amber-900 font-bold text-xs px-2.5 py-1 rounded-lg border border-amber-400">Menunggu Koreksi Guru</span>`;

                    card.innerHTML = `
                        <div class="flex-grow">
                            <div class="flex items-center gap-2 mb-1 flex-wrap">
                                <span class="text-[10px] bg-indigo-100 text-indigo-900 font-black px-2 py-0.5 rounded border border-indigo-300 uppercase">
                                    ${g.mapel || 'Informatika'} &bull; Kelas ${g.kelas}
                                </span>
                                <span class="text-[10px] font-bold text-slate-500">
                                    ${new Date(g.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                            <h4 class="font-black text-base text-black">${g.materi}</h4>
                            <p class="text-xs text-slate-600 font-bold mt-0.5">${g.filename || 'Tautan Tugas'}</p>
                            ${g.catatan_guru ? `<div class="mt-2 text-xs bg-white p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800">💬 <strong>Catatan Guru:</strong> ${g.catatan_guru}</div>` : ''}
                            ${g.ai_feedback ? `<div class="mt-1.5 text-xs bg-purple-50 p-2.5 rounded-xl border border-purple-200 font-medium text-purple-900">🤖 <strong>Evaluasi AI:</strong> ${g.ai_feedback}</div>` : ''}
                        </div>
                        <div class="flex items-center gap-2 self-end md:self-center shrink-0">
                            ${gradeBadge}
                        </div>
                    `;
                    resultContainer.appendChild(card);
                });
            }

            // Render Nilai Ujian
            if (hasQuizzes) {
                const ujianHeader = document.createElement('h4');
                ujianHeader.className = "font-black text-sm uppercase tracking-wider text-black mt-6 mb-2 flex items-center gap-1.5";
                ujianHeader.innerHTML = "<span>📝</span> Riwayat Ujian Online";
                resultContainer.appendChild(ujianHeader);

                quizGrades.forEach(q => {
                    const card = document.createElement('div');
                    card.className = "bg-amber-50 border-2 border-black rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3";
                    
                    card.innerHTML = `
                        <div class="flex-grow">
                            <div class="flex items-center gap-2 mb-1 flex-wrap">
                                <span class="text-[10px] bg-amber-200 text-amber-900 font-black px-2 py-0.5 rounded border border-amber-400 uppercase">
                                    ${q.quizzes?.mapel || 'Ujian'} &bull; Kelas ${q.kelas}
                                </span>
                                <span class="text-[10px] font-bold text-slate-500">
                                    ${new Date(q.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                            <h4 class="font-black text-base text-black">${q.quizzes?.judul_kuis || 'Ujian Online'}</h4>
                            <div class="flex items-center gap-3 mt-1 text-xs font-bold text-slate-700">
                                <span>Skor Pilihan Ganda: <strong>${q.skor_pg}</strong></span>
                                <span>Skor Esai: <strong>${q.skor_esai}</strong></span>
                            </div>
                            ${q.catatan_guru ? `<div class="mt-2 text-xs bg-white p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800">💬 <strong>Catatan Guru:</strong> ${q.catatan_guru}</div>` : ''}
                        </div>
                        <div class="text-right shrink-0">
                            <span class="bg-yellow-300 text-black font-black text-xl px-3 py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block">
                                ${q.total_nilai}
                            </span>
                            <span class="block text-[10px] font-bold text-slate-500 uppercase mt-1">Total Nilai</span>
                        </div>
                    `;
                    resultContainer.appendChild(card);
                });
            }

        } catch (e) {
            resultContainer.innerHTML = `<div class="text-center text-red-600 font-bold text-xs">Gagal mencari nilai: ${e.message}</div>`;
        }
    };

    // Muat data penugasan default saat halaman terbuka
    loadStudentAssignments();
    loadStudentMaterials();
    loadStudentQuizzes();

});
