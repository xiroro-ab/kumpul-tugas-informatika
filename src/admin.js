import { supabase } from './supabase.js';
import { 
    getGeminiApiKey, 
    setGeminiApiKey, 
    getGeminiModel,
    setGeminiModel,
    testGeminiConnection,
    aiGenerateMaterial, 
    aiGenerateAssignment,
    aiGenerateQuestions, 
    aiEvaluateSubmission,
    aiGradeQuizEssay,
    aiGenerateFormQuestions,
    aiEvaluateFormSubmission
} from './gemini.js';
import { 
    fetchStudentsFromDB, 
    addStudentToDB, 
    updateStudentInDB, 
    deleteStudentFromDB, 
    syncRosterToDB, 
    parseRosterCsvText, 
    initialStudents 
} from './rosterData.js';
import { calculateExamScore, getMaxScore, toPercent, getSubmissionAnswers, balanceExamWeights } from './examScoring.js';

let currentSession = null;
let currentTeacher = null;
let stateKelas = [];
let stateStudents = [];
let pendingFiles = [];
let assignmentsList = [];
let materialsList = [];
let quizzesList = [];
let activeGradeItem = null;
let activeQuizForResults = null;
let activeQuizSubmissions = [];
let activeReviewSubmission = null;
let activeAssignmentForSubmissions = null;
let formBuilderQuestions = [];
let editingAssignmentId = null;

export function getDynamicClassOptions(classes = stateKelas) {
    const list = Array.isArray(classes) ? classes.filter(Boolean) : [];
    const options = [
        { value: 'Semua Kelas', label: 'Semua Kelas (Seluruh Siswa)' }
    ];

    if (list.length === 0) {
        return options;
    }

    // Deteksi tingkat kelas yang benar-benar ada di daftar pengaturan
    const hasGrade7 = list.some(k => /\b7\b|vii/i.test(k));
    const hasGrade8 = list.some(k => /\b8\b|viii/i.test(k));
    const hasGrade9 = list.some(k => /\b9\b|ix/i.test(k));

    if (hasGrade7) {
        options.push({ value: 'Semua Kelas 7 (VII)', label: 'Khusus Semua Kelas 7 (VII)' });
    }
    if (hasGrade8) {
        options.push({ value: 'Semua Kelas 8 (VIII)', label: 'Khusus Semua Kelas 8 (VIII)' });
    }
    if (hasGrade9) {
        options.push({ value: 'Semua Kelas 9 (IX)', label: 'Khusus Semua Kelas 9 (IX)' });
    }

    // Tambahkan HANYA kelas yang terdaftar di Pengaturan
    list.forEach(k => {
        options.push({ value: k, label: `Kelas ${k}` });
    });

    return options;
}

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

export function populateTargetClassSelect(selectElement, selectedValue = 'Semua Kelas', includeAllFilter = false) {
    if (!selectElement) return;
    const currentVal = selectedValue !== undefined ? selectedValue : selectElement.value;
    selectElement.innerHTML = '';

    if (includeAllFilter) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Semua Pengumpulan Kelas';
        selectElement.appendChild(opt);
    }

    const options = getDynamicClassOptions(stateKelas);
    options.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.value;
        opt.textContent = item.label;
        if (item.value === currentVal) opt.selected = true;
        selectElement.appendChild(opt);
    });

    if (currentVal && !Array.from(selectElement.options).some(o => o.value === currentVal)) {
        const fallbackOpt = document.createElement('option');
        fallbackOpt.value = currentVal;
        fallbackOpt.textContent = `Kelas ${currentVal}`;
        fallbackOpt.selected = true;
        selectElement.appendChild(fallbackOpt);
    }
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
        token_required: quizObj.token_required !== undefined ? !!quizObj.token_required : false
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

    if (qList.length === 0 && tipePengumpulan === 'form') {
        const s = splitQuestionImage(raw);
        qList = [
            {
                id: 1,
                nomor: 1,
                tipe: 'esai',
                pertanyaan: s.text,
                gambar_url: s.gambar_url,
                kunci: assignment.rubrik_ai || '',
                bobot: 100
            }
        ];
    }

    return { petunjuk, questions: qList, tipe_pengumpulan: tipePengumpulan };
}

document.addEventListener('DOMContentLoaded', () => {

    // Helper Modal Alert/Confirm Neobrutalisme
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

    // Helper Modal Loading Notifikasi AI Beranimasi (Neobrutalisme)
    let aiLoadingInterval = null;

    window.showAiLoadingModal = (options = {}) => {
        const modal = document.getElementById('ai-loading-modal');
        const badgeEl = document.getElementById('ai-loading-badge');
        const titleEl = document.getElementById('ai-loading-title');
        const stepEl = document.getElementById('ai-loading-step');
        if (!modal) return;

        if (badgeEl) badgeEl.textContent = options.badge || 'ASISTEN AI SMPN 58';
        if (titleEl) titleEl.textContent = options.title || 'Sedang Memproses...';

        const steps = options.steps && options.steps.length > 0 ? options.steps : [
            'Menghubungkan ke Google Gemini AI...',
            'Menganalisis materi pokok dan capaian pembelajaran...',
            'Merumuskan butir-butir instrumen berkualitas...',
            'Menyusun kunci jawaban dan panduan evaluasi...',
            'Memvalidasi format dan menyimpan ke sistem...'
        ];

        let currentStepIdx = 0;
        if (stepEl) stepEl.textContent = steps[0];

        if (aiLoadingInterval) clearInterval(aiLoadingInterval);
        aiLoadingInterval = setInterval(() => {
            currentStepIdx = (currentStepIdx + 1) % steps.length;
            if (stepEl) {
                stepEl.textContent = steps[currentStepIdx];
            }
        }, 2200);

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

    window.hideAiLoadingModal = () => {
        if (aiLoadingInterval) {
            clearInterval(aiLoadingInterval);
            aiLoadingInterval = null;
        }
        const modal = document.getElementById('ai-loading-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    };

    // Tab Navigation
    window.switchTab = (tabName) => {
        const isSuperadmin = currentTeacher?.role === 'superadmin';

        // Proteksi ketat: jika bukan superadmin, tolak akses ke tab approval
        if (tabName === 'approval' && !isSuperadmin) {
            showCustomModal("Akses Ditolak: Fitur Persetujuan Guru hanya dapat diakses oleh Superadmin sekolah.");
            tabName = 'penugasan';
        }

        const tabs = ['penugasan', 'materi', 'kuis', 'siswa', 'setting', 'approval'];
        tabs.forEach(t => {
            const btn = document.getElementById(`tab-btn-${t}`);
            const content = document.getElementById(`tab-content-${t}`);

            // Khusus tab approval: JANGAN PERNAH dibuat tampak jika bukan superadmin!
            if (t === 'approval' && !isSuperadmin) {
                if (btn) {
                    btn.classList.add('hidden');
                    btn.classList.remove('flex');
                }
                if (content) content.classList.add('hidden');
                return;
            }

            if (t === tabName) {
                if (btn) {
                    if (t === 'approval') {
                        btn.className = "lms-tab-btn py-2 px-1 md:py-2.5 md:px-3 rounded-xl flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 font-black text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider transition-all min-h-[48px] bg-purple-700 text-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer";
                    } else {
                        btn.className = "lms-tab-btn py-2 px-1 md:py-2.5 md:px-3 rounded-xl flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 font-black text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider transition-all min-h-[48px] bg-black text-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer";
                    }
                }
                if (content) content.classList.remove('hidden');
            } else {
                if (btn) {
                    if (t === 'approval') {
                        btn.className = "lms-tab-btn py-2 px-1 md:py-2.5 md:px-3 rounded-xl flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 font-bold text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider transition-all min-h-[48px] bg-purple-100 text-purple-900 border border-purple-300 hover:bg-purple-200 cursor-pointer";
                    } else {
                        btn.className = "lms-tab-btn py-2 px-1 md:py-2.5 md:px-3 rounded-xl flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 font-bold text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider transition-all min-h-[48px] text-slate-700 hover:text-black hover:bg-slate-100 cursor-pointer";
                    }
                }
                if (content) content.classList.add('hidden');
            }
        });

        const tabsGrid = document.getElementById('lms-tabs-grid');
        if (tabsGrid) {
            if (isSuperadmin) {
                tabsGrid.classList.remove('grid-cols-5');
                tabsGrid.classList.add('grid-cols-6');
            } else {
                tabsGrid.classList.remove('grid-cols-6');
                tabsGrid.classList.add('grid-cols-5');
            }
        }

        if (tabName === 'penugasan') {
            loadAssignments();
            loadFilesTable();
        }
        if (tabName === 'materi') loadMaterials();
        if (tabName === 'kuis') loadQuizzes();
        if (tabName === 'siswa') loadStudentsRoster();
        if (tabName === 'approval' && isSuperadmin) loadAllTeachers();
    };

    // Sub-view Switcher dalam Tab Kelola Tugas & Meja Koreksi
    window.switchPenugasanSubView = (view) => {
        const btnCards = document.getElementById('subview-btn-cards');
        const btnTable = document.getElementById('subview-btn-table');
        const cardsView = document.getElementById('penugasan-cards-view');
        const tableView = document.getElementById('penugasan-table-view');

        if (view === 'cards') {
            if (btnCards) btnCards.className = "px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition cursor-pointer";
            if (btnTable) btnTable.className = "px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-white text-black border-2 border-black hover:bg-slate-100 active:translate-y-0.5 transition cursor-pointer";
            if (cardsView) cardsView.classList.remove('hidden');
            if (tableView) tableView.classList.add('hidden');
        } else {
            if (btnTable) btnTable.className = "px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition cursor-pointer";
            if (btnCards) btnCards.className = "px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-white text-black border-2 border-black hover:bg-slate-100 active:translate-y-0.5 transition cursor-pointer";
            if (cardsView) cardsView.classList.add('hidden');
            if (tableView) tableView.classList.remove('hidden');
            loadFilesTable();
        }
    };

    // Auth Session Listener
    supabase.auth.getSession().then(({ data: { session } }) => {
        handleSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
        handleSession(session);
    });

    window.toggleAuthMode = (mode) => {
        const tabLogin = document.getElementById('auth-tab-login');
        const tabRegister = document.getElementById('auth-tab-register');
        const formLogin = document.getElementById('form-login');
        const formRegister = document.getElementById('form-register');

        if (mode === 'login') {
            tabLogin.className = "py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition";
            tabRegister.className = "py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-black hover:bg-white/50 transition";
            formLogin.classList.remove('hidden');
            formRegister.classList.add('hidden');
        } else {
            tabRegister.className = "py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition";
            tabLogin.className = "py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-black hover:bg-white/50 transition";
            formRegister.classList.remove('hidden');
            formLogin.classList.add('hidden');
        }
    };

    window.loginWithEmail = async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('btn-login-submit');

        btn.disabled = true;
        btn.innerText = "MEMERIKSA...";

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
        } catch (error) {
            console.error("Login failed", error);
            showCustomModal("Login gagal: " + (error.message || "Email atau password salah."));
        } finally {
            btn.disabled = false;
            btn.innerText = "MASUK KE DASHBOARD";
        }
    };

    window.registerWithEmail = async (e) => {
        e.preventDefault();
        const nama = document.getElementById('reg-nama').value.trim();
        const mapel = document.getElementById('reg-mapel').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const btn = document.getElementById('btn-reg-submit');

        if (!nama || !mapel || !email || !password) {
            showCustomModal("Mohon lengkapi semua kolom pendaftaran.");
            return;
        }

        btn.disabled = true;
        btn.innerText = "MENDAFTARKAN...";

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: nama,
                        nama_guru: nama,
                        mapel: mapel
                    }
                }
            });

            if (error) throw error;

            if (data.session) {
                let isFirstTeacher = false;
                try {
                    const { data: superadmins, error: sErr } = await supabase
                        .from('teachers')
                        .select('id')
                        .eq('role', 'superadmin')
                        .limit(1);
                    if (!sErr && superadmins && superadmins.length > 0) {
                        isFirstTeacher = false;
                    } else if (!sErr) {
                        const { count } = await supabase.from('teachers').select('*', { count: 'exact', head: true });
                        isFirstTeacher = (count === 0);
                    }
                } catch (_) {
                    isFirstTeacher = false;
                }

                await supabase.from('teachers').upsert([{
                    id: data.user.id,
                    email: data.user.email,
                    nama_guru: nama,
                    mapel: mapel,
                    role: isFirstTeacher ? 'superadmin' : 'guru',
                    status: isFirstTeacher ? 'approved' : 'pending'
                }]);

                if (isFirstTeacher) {
                    showCustomModal("Pendaftaran berhasil! Anda terdaftar sebagai Superadmin sekolah.");
                } else {
                    showCustomModal("Pendaftaran berhasil! Akun Anda sedang MENUNGGU PERSETUJUAN dari Admin Sekolah sebelum dapat digunakan.");
                }
            } else {
                showCustomModal("Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan dari Admin Sekolah.");
                toggleAuthMode('login');
            }
        } catch (error) {
            console.error("Registration failed", error);
            showCustomModal("Gagal mendaftar: " + error.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "DAFTAR AKUN SEKARANG";
        }
    };

    window.logout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    async function handleSession(session) {
        currentSession = session;
        if (session) {
            document.getElementById('login-section').classList.add('hidden');
            const teacher = await loadOrCreateTeacherProfile(session.user);

            const pendingSection = document.getElementById('pending-section');
            const dashboardSection = document.getElementById('dashboard-section');

            if (!teacher || teacher.status === 'pending') {
                dashboardSection.classList.add('hidden');
                if (pendingSection) {
                    pendingSection.classList.remove('hidden');
                    document.getElementById('pending-name').textContent = teacher?.nama_guru || session.user.email;
                    document.getElementById('pending-mapel').textContent = teacher?.mapel || '-';
                    document.getElementById('pending-email').textContent = session.user.email;
                }
                return;
            }

            if (teacher.status === 'rejected') {
                dashboardSection.classList.add('hidden');
                if (pendingSection) pendingSection.classList.add('hidden');
                showCustomModal("Akun Anda telah dinonaktifkan oleh administrator sekolah.");
                await supabase.auth.signOut();
                return;
            }

            if (pendingSection) pendingSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
            document.getElementById('user-email').innerText = session.user.email;

            // Jika Superadmin, aktifkan tab Persetujuan Guru
            const approvalTabBtn = document.getElementById('tab-btn-approval');
            const tabsGrid = document.getElementById('lms-tabs-grid');
            const roleBadge = document.getElementById('teacher-role-badge');
            if (teacher.role === 'superadmin') {
                if (approvalTabBtn) {
                    approvalTabBtn.classList.remove('hidden');
                    approvalTabBtn.classList.add('flex');
                }
                if (tabsGrid) {
                    tabsGrid.classList.remove('grid-cols-5');
                    tabsGrid.classList.add('grid-cols-6');
                }
                if (roleBadge) roleBadge.classList.remove('hidden');
            } else {
                if (approvalTabBtn) {
                    approvalTabBtn.classList.add('hidden');
                    approvalTabBtn.classList.remove('flex');
                }
                const approvalTabContent = document.getElementById('tab-content-approval');
                if (approvalTabContent) approvalTabContent.classList.add('hidden');
                if (tabsGrid) {
                    tabsGrid.classList.remove('grid-cols-6');
                    tabsGrid.classList.add('grid-cols-5');
                }
                if (roleBadge) roleBadge.classList.add('hidden');
            }

            loadOptionsSettings();
            loadAssignments();
            loadFilesTable();
            loadModelSettingsUI();
        } else {
            document.getElementById('login-section').classList.remove('hidden');
            const pendingSection = document.getElementById('pending-section');
            if (pendingSection) pendingSection.classList.add('hidden');
            document.getElementById('dashboard-section').classList.add('hidden');
        }
    }

    // ==========================================
    // 1. Profil Guru & Mata Pelajaran
    // ==========================================
    async function loadOrCreateTeacherProfile(user) {
        try {
            const { data, error } = await supabase
                .from('teachers')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.warn("Could not fetch teacher profile:", error);
            }

            if (data) {
                currentTeacher = data;
                updateTeacherDisplay(data.nama_guru, data.mapel);
                return data;
            } else {
                let isFirstTeacher = false;
                try {
                    const { data: superadmins, error: sErr } = await supabase
                        .from('teachers')
                        .select('id')
                        .eq('role', 'superadmin')
                        .limit(1);
                    if (!sErr && superadmins && superadmins.length > 0) {
                        isFirstTeacher = false;
                    } else if (!sErr) {
                        const { count } = await supabase.from('teachers').select('*', { count: 'exact', head: true });
                        isFirstTeacher = (count === 0);
                    }
                } catch (_) {
                    isFirstTeacher = false;
                }

                const defaultName = user.user_metadata?.full_name || user.user_metadata?.nama_guru || user.email.split('@')[0];
                const defaultMapel = user.user_metadata?.mapel || 'Informatika';

                const newTeacher = {
                    id: user.id,
                    email: user.email,
                    nama_guru: defaultName,
                    mapel: defaultMapel,
                    role: isFirstTeacher ? 'superadmin' : 'guru',
                    status: isFirstTeacher ? 'approved' : 'pending'
                };

                const { data: inserted, error: insErr } = await supabase
                    .from('teachers')
                    .upsert([newTeacher])
                    .select()
                    .single();

                if (!insErr && inserted) {
                    currentTeacher = inserted;
                    updateTeacherDisplay(inserted.nama_guru, inserted.mapel);
                    return inserted;
                } else {
                    currentTeacher = newTeacher;
                    updateTeacherDisplay(defaultName, defaultMapel);
                    return newTeacher;
                }
            }
        } catch (e) {
            console.error("Teacher profile error", e);
            updateTeacherDisplay('Bpk/Ibu Guru', 'Informatika');
            return null;
        }
    }

    function updateTeacherDisplay(name, mapel) {
        const nameEl = document.getElementById('teacher-name-display');
        const mapelEl = document.getElementById('teacher-mapel-badge');
        if (nameEl) nameEl.textContent = name;
        if (mapelEl) mapelEl.textContent = mapel;
    }

    window.openProfileModal = () => {
        const nameInput = document.getElementById('prof-nama');
        const mapelInput = document.getElementById('prof-mapel');
        if (currentTeacher) {
            nameInput.value = currentTeacher.nama_guru || '';
            mapelInput.value = currentTeacher.mapel || 'Informatika';
        }
        document.getElementById('profile-modal').classList.remove('hidden');
    };

    window.closeProfileModal = () => {
        document.getElementById('profile-modal').classList.add('hidden');
    };

    window.saveTeacherProfile = async () => {
        const nameInput = document.getElementById('prof-nama').value.trim();
        const mapelInput = document.getElementById('prof-mapel').value.trim();
        if (!nameInput || !mapelInput) {
            showCustomModal("Mohon isi Nama Lengkap dan Mata Pelajaran.");
            return;
        }

        try {
            const { error } = await supabase.from('teachers').update({
                nama_guru: nameInput,
                mapel: mapelInput
            }).eq('id', currentSession.user.id);

            if (error) throw error;
            if (currentTeacher) {
                currentTeacher.nama_guru = nameInput;
                currentTeacher.mapel = mapelInput;
            }
            updateTeacherDisplay(nameInput, mapelInput);
            closeProfileModal();
            showCustomModal("Profil guru berhasil diperbarui!");
        } catch (e) {
            showCustomModal("Gagal menyimpan profil: " + e.message);
        }
    };

    // ==========================================
    // 2. Koreksi Tugas Masuk dari Siswa
    // ==========================================
    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function isFormSubmission(f) {
        return Boolean(f && (f.tipe === 'form' || (f.storage_path && f.storage_path.startsWith('FORM:'))));
    }

    function isTextSubmission(f) {
        if (isFormSubmission(f)) return false;
        return f.tipe === 'text' || (f.storage_path && f.storage_path.startsWith('TEXT:'));
    }

    function getTextContent(f) {
        if (f.storage_path && f.storage_path.startsWith('TEXT:')) {
            return f.storage_path.replace('TEXT:', '');
        }
        return f.link_url || '';
    }

    function isLinkSubmission(f) {
        if (isFormSubmission(f)) return false;
        if (isTextSubmission(f)) return false;
        return f.tipe === 'link' || 
               (f.storage_path && (f.storage_path.startsWith('LINK:') || f.storage_path.startsWith('http://') || f.storage_path.startsWith('https://'))) || 
               Boolean(f.link_url);
    }

    function getLinkUrl(f) {
        if (f.link_url) return f.link_url;
        if (f.storage_path && f.storage_path.startsWith('LINK:')) return f.storage_path.replace('LINK:', '');
        if (f.storage_path && (f.storage_path.startsWith('http://') || f.storage_path.startsWith('https://'))) return f.storage_path;
        return '';
    }

    window.downloadSubmissionFile = async (idOrUrl, filename) => {
        try {
            let url = idOrUrl;
            let downloadName = filename || 'berkas_tugas_siswa';

            const item = pendingFiles.find(f => String(f.id) === String(idOrUrl));
            if (item) {
                const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(item.storage_path);
                url = publicUrlData.publicUrl;
                downloadName = item.filename || 'berkas_tugas_siswa';
            }

            const res = await fetch(url);
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = downloadName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch {
            window.open(url, '_blank');
        }
    };

    async function loadFilesTable() {
        const tbody = document.getElementById('files-tbody');
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-6 text-center text-slate-500 font-bold uppercase tracking-widest border-b-2 border-black animate-pulse">Memuat tugas siswa...</td></tr>';
        
        try {
            const isSuperadmin = currentTeacher?.role === 'superadmin';
            let filesQuery = supabase.from('files').select('*').order('created_at', { ascending: false });
            if (!isSuperadmin && currentTeacher?.id) {
                const tIds = (assignmentsList || []).map(a => a.id).filter(Boolean);
                if (tIds.length > 0) {
                    filesQuery = filesQuery.or(`guru_id.eq.${currentTeacher.id},assignment_id.in.(${tIds.join(',')})`);
                } else {
                    filesQuery = filesQuery.eq('guru_id', currentTeacher.id);
                }
            }
            const { data, error } = await filesQuery;
            if (error) throw error;
            
            pendingFiles = data || [];
            const sBadge = document.getElementById('submissions-count-badge');
            if (sBadge) sBadge.textContent = pendingFiles.length;
            applyFilters();
        } catch (e) {
            console.error(e);
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-6 text-center text-red-500 font-bold uppercase tracking-widest border-b-2 border-black">Gagal memuat tugas: ${e.message}</td></tr>`;
        }
    }

    const searchInput = document.getElementById('search-tugas');
    const filterKelasSelect = document.getElementById('filter-kelas-tugas');
    const filterAssignmentSelect = document.getElementById('filter-assignment-tugas');

    function applyFilters() {
        const term = searchInput ? searchInput.value.toLowerCase() : '';
        const kelasVal = filterKelasSelect ? filterKelasSelect.value : '';
        const assignVal = filterAssignmentSelect ? filterAssignmentSelect.value : '';

        const filtered = pendingFiles.filter(f => {
            const matchTerm = (f.nama && f.nama.toLowerCase().includes(term)) ||
                              (f.filename && f.filename.toLowerCase().includes(term));
            const matchKelas = kelasVal === '' || isClassMatch(kelasVal, f.kelas);
            const matchAssignment = assignVal === '' || (
                (f.assignment_id && String(f.assignment_id) === assignVal) ||
                (assignmentsList.find(a => String(a.id) === assignVal)?.judul_tugas?.toLowerCase().trim() === (f.materi || '').toLowerCase().trim())
            );
            return matchTerm && matchKelas && matchAssignment;
        });
        renderFilesTable(filtered);
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (filterKelasSelect) filterKelasSelect.addEventListener('change', applyFilters);
    if (filterAssignmentSelect) filterAssignmentSelect.addEventListener('change', applyFilters);

    function renderFilesTable(filesToRender) {
        const tbody = document.getElementById('files-tbody');
        tbody.innerHTML = '';
        if (filesToRender.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500 font-bold uppercase tracking-widest border-b-2 border-black">Tidak ada tugas siswa yang cocok.</td></tr>';
            return;
        }

        filesToRender.forEach(f => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50 transition-colors";
            
            const isForm = isFormSubmission(f);
            const isText = isTextSubmission(f);
            const isLink = isLinkSubmission(f);
            let detailCell = '';
            let downloadBtnHtml = '';

            if (isForm) {
                let formItems = [];
                try {
                    formItems = JSON.parse(f.storage_path.replace(/^FORM:/, ''));
                } catch (_) {}
                const qCount = formItems.length || 0;
                detailCell = `
                    <div class="inline-flex items-center gap-1.5 py-0.5">
                        <span class="inline-flex items-center bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-300 uppercase">
                            FORM ONLINE
                        </span>
                        <span class="text-xs font-bold text-slate-700">${qCount} Soal</span>
                    </div>
                `;
            } else if (isText) {
                const textSnippet = getTextContent(f);
                detailCell = `
                    <div class="flex flex-col gap-1 py-0.5 w-full pr-2">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="inline-flex items-center shrink-0 bg-amber-100 text-amber-900 text-[10px] font-black px-1.5 py-0.5 rounded border border-amber-300 uppercase">
                                FORM WEB
                            </span>
                            <span class="font-bold text-xs text-slate-800 break-all">${escapeHtml(f.filename || 'Jawaban Form Web')}</span>
                        </div>
                        <p class="text-xs text-slate-600 font-medium line-clamp-2 italic bg-amber-50/60 p-1.5 rounded border border-amber-200">${escapeHtml(textSnippet)}</p>
                    </div>
                `;
            } else if (isLink) {
                const targetUrl = getLinkUrl(f);
                detailCell = `
                    <div class="flex flex-col gap-1 py-0.5 w-full pr-2">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="inline-flex items-center shrink-0 bg-purple-100 text-purple-900 text-[10px] font-black px-1.5 py-0.5 rounded border border-purple-300 uppercase">
                                LINK
                            </span>
                            <span class="font-bold text-xs text-slate-800 break-all">${escapeHtml(f.filename || 'Tautan Tugas')}</span>
                        </div>
                        <a href="${targetUrl}" target="_blank" class="text-indigo-600 hover:text-indigo-900 font-semibold text-xs break-all hover:underline" title="${targetUrl}">
                            ${targetUrl} ↗
                        </a>
                    </div>
                `;
            } else {
                const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(f.storage_path);
                const targetUrl = publicUrlData.publicUrl;
                detailCell = `
                    <div class="flex items-start gap-1.5 py-0.5 w-full pr-2">
                        <span class="inline-flex items-center shrink-0 bg-blue-100 text-blue-900 text-[10px] font-black px-1.5 py-0.5 rounded border border-blue-300 uppercase mt-0.5">
                            FILE
                        </span>
                        <a href="${targetUrl}" target="_blank" class="font-bold text-xs text-indigo-700 hover:underline break-all leading-relaxed" title="${f.filename}">
                            ${f.filename} ↗
                        </a>
                    </div>
                `;
                downloadBtnHtml = `
                    <button onclick="downloadSubmissionFile('${f.id}')" title="Unduh Berkas Siswa ke Komputer" class="inline-flex items-center bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1.5 rounded-lg uppercase tracking-wider text-xs font-black transition-colors border border-slate-300">
                        Unduh
                    </button>
                `;
            }

            let gradeBadge = '';
            if (f.nilai !== null && f.nilai !== undefined && f.nilai !== '') {
                gradeBadge = `
                    <span class="inline-flex items-center justify-center bg-emerald-100 text-emerald-900 font-black text-sm px-2.5 py-1 rounded-xl border border-emerald-400">
                        ${f.nilai}
                    </span>
                `;
            } else {
                gradeBadge = `
                    <span class="inline-flex items-center justify-center bg-amber-100 text-amber-900 font-bold text-[10px] px-2 py-1 rounded-lg border border-amber-300 whitespace-nowrap">
                        Belum
                    </span>
                `;
            }
            
            tr.innerHTML = `
                <td class="px-3 py-3 whitespace-nowrap font-black text-black border-b-2 border-black border-r-2 text-xs">${escapeHtml(f.kelas)}</td>
                <td class="px-3 py-3 font-bold text-black border-b-2 border-black border-r-2 text-xs align-middle">
                    <div class="min-w-[160px] max-w-[280px] whitespace-normal break-words leading-relaxed text-slate-900">
                        ${escapeHtml(f.materi)}
                    </div>
                </td>
                <td class="px-3 py-3 whitespace-nowrap font-bold text-black border-b-2 border-black border-r-2 text-xs">${escapeHtml(f.nama)}</td>
                <td class="px-3 py-3 font-medium text-black border-b-2 border-black border-r-2 min-w-[160px]">${detailCell}</td>
                <td class="px-3 py-3 text-center border-b-2 border-black border-r-2">${gradeBadge}</td>
                <td class="px-3 py-3 whitespace-nowrap font-black text-xs border-b-2 border-black">
                    <div class="flex items-center gap-1.5">
                        <button onclick="openGradeModal('${f.id}')" class="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 rounded-lg uppercase tracking-wider text-xs font-black transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            Koreksi
                        </button>
                        ${downloadBtnHtml}
                        <button onclick="deleteFile('${f.id}')" class="inline-flex items-center bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1.5 rounded-lg uppercase tracking-wider text-xs font-black transition-colors border border-red-300">
                            Hapus
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Modal Koreksi Tugas
    window.openGradeModal = (id) => {
        const item = pendingFiles.find(f => String(f.id) === String(id));
        if (!item) return;
        activeGradeItem = item;

        document.getElementById('grade-modal-student').textContent = item.nama;
        document.getElementById('grade-modal-meta').textContent = `Kelas: ${item.kelas} • Tugas: ${item.materi}`;
        
        const formSection = document.getElementById('grade-form-responses-section');
        const formContainer = document.getElementById('grade-form-responses-container');
        const previewBox = document.getElementById('grade-modal-preview-box');
        const totalBadge = document.getElementById('grade-form-total-badge');

        let isForm = false;
        let formItems = [];

        if (item.storage_path && item.storage_path.startsWith('FORM:')) {
            isForm = true;
            try {
                formItems = JSON.parse(item.storage_path.replace(/^FORM:/, ''));
            } catch (_) {}
        } else if (item.tipe === 'form') {
            isForm = true;
            try {
                formItems = JSON.parse(item.storage_path || '[]');
            } catch (_) {}
        }

        if (isForm && Array.isArray(formItems) && formItems.length > 0) {
            if (formSection) formSection.classList.remove('hidden');
            if (previewBox) previewBox.classList.add('hidden');
            if (totalBadge) totalBadge.textContent = `${formItems.length} Butir Soal`;

            if (formContainer) {
                formContainer.innerHTML = formItems.map((q, idx) => {
                    const tipe = q.tipe || 'esai';
                    const isPg = tipe === 'pg' || tipe === 'pilihan_ganda';
                    const isPgk = tipe === 'pg_kompleks' || tipe === 'pilihan_ganda_kompleks';
                    const isBs = tipe === 'benar_salah';
                    const isFoto = tipe === 'upload_foto';
                    const isLink = tipe === 'link';
                    const isMatch = tipe === 'menjodohkan';
                    const isSingkat = tipe === 'singkat' || tipe === 'isian_singkat';

                    let typeLabel = 'Soal Esai';
                    let typeBadgeClass = 'text-purple-900 bg-purple-100 border-purple-300';
                    if (isLink) {
                        typeLabel = 'Tautan Link URL';
                        typeBadgeClass = 'text-pink-900 bg-pink-100 border-pink-300';
                    }
                    let statusBadge = '';

                    const itemMaxScore = Number(q.bobot) || 10;
                    let initialScore = '';
                    let initialFeedback = q.catatan_guru || q.feedback_ai || '';

                    let isCorrect = false;
                    let studentKeys = [];
                    let correctKeys = [];
                    let correctMatches = 0;
                    let pairs = [];

                    if (isPg) {
                        typeLabel = 'Pilihan Ganda';
                        typeBadgeClass = 'text-blue-900 bg-blue-100 border-blue-300';
                        isCorrect = String(q.jawaban_siswa || '').trim().toUpperCase() === String(q.kunci || '').trim().toUpperCase();
                        statusBadge = isCorrect
                            ? `<span class="bg-emerald-100 text-emerald-900 border border-emerald-400 text-xs font-black px-2.5 py-0.5 rounded-lg uppercase">Benar (${itemMaxScore}/${itemMaxScore})</span>`
                            : `<span class="bg-red-100 text-red-900 border border-red-400 text-xs font-black px-2.5 py-0.5 rounded-lg uppercase">Salah (0/${itemMaxScore})</span>`;
                        initialScore = (q.skor_guru !== undefined && q.skor_guru !== null && q.skor_guru !== '') ? q.skor_guru : (isCorrect ? itemMaxScore : 0);
                        if (!initialFeedback) initialFeedback = isCorrect ? 'Jawaban tepat sesuai kunci.' : `Jawaban kurang tepat (Kunci: ${q.kunci}).`;
                    } else if (isPgk) {
                        typeLabel = 'PG Kompleks';
                        typeBadgeClass = 'text-cyan-900 bg-cyan-100 border-cyan-300';
                        const studentAns = q.jawaban_siswa || [];
                        studentKeys = (Array.isArray(studentAns) ? studentAns : String(studentAns).split(',')).map(s => s.trim().toUpperCase()).filter(Boolean).sort();
                        correctKeys = (q.kunci || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean).sort();
                        isCorrect = studentKeys.length > 0 && studentKeys.join(',') === correctKeys.join(',');
                        statusBadge = isCorrect
                            ? `<span class="bg-emerald-100 text-emerald-900 border border-emerald-400 text-xs font-black px-2.5 py-0.5 rounded-lg uppercase">Benar (${itemMaxScore}/${itemMaxScore})</span>`
                            : `<span class="bg-red-100 text-red-900 border border-red-400 text-xs font-black px-2.5 py-0.5 rounded-lg uppercase">Kurang Tepat (0/${itemMaxScore})</span>`;
                        initialScore = (q.skor_guru !== undefined && q.skor_guru !== null && q.skor_guru !== '') ? q.skor_guru : (isCorrect ? itemMaxScore : 0);
                        if (!initialFeedback) initialFeedback = isCorrect ? 'Pilihan ganda kompleks tepat.' : `Pilihan kurang tepat (Kunci: ${correctKeys.join(', ')}).`;
                    } else if (isBs) {
                        typeLabel = 'Benar / Salah';
                        typeBadgeClass = 'text-amber-900 bg-amber-100 border-amber-300';
                        isCorrect = String(q.jawaban_siswa || '').trim().toUpperCase() === String(q.kunci || '').trim().toUpperCase();
                        statusBadge = isCorrect
                            ? `<span class="bg-emerald-100 text-emerald-900 border border-emerald-400 text-xs font-black px-2.5 py-0.5 rounded-lg uppercase">Benar (${itemMaxScore}/${itemMaxScore})</span>`
                            : `<span class="bg-red-100 text-red-900 border border-red-400 text-xs font-black px-2.5 py-0.5 rounded-lg uppercase">Salah (0/${itemMaxScore})</span>`;
                        initialScore = (q.skor_guru !== undefined && q.skor_guru !== null && q.skor_guru !== '') ? q.skor_guru : (isCorrect ? itemMaxScore : 0);
                        if (!initialFeedback) initialFeedback = isCorrect ? 'Jawaban tepat sesuai kunci.' : `Jawaban kurang tepat (Kunci: ${q.kunci}).`;
                    } else if (isSingkat) {
                        typeLabel = 'Isian Singkat';
                        typeBadgeClass = 'text-blue-900 bg-blue-100 border-blue-300';
                        isCorrect = String(q.jawaban_siswa || '').trim().toLowerCase() === String(q.kunci || '').trim().toLowerCase();
                        statusBadge = isCorrect
                            ? `<span class="bg-emerald-100 text-emerald-900 border border-emerald-400 text-xs font-black px-2.5 py-0.5 rounded-lg uppercase">Cocok Otomatis (${itemMaxScore}/${itemMaxScore})</span>`
                            : `<span class="bg-amber-100 text-amber-900 border border-amber-400 text-xs font-black px-2.5 py-0.5 rounded-lg uppercase">Perlu Evaluasi Guru/AI</span>`;
                        if (q.skor_guru !== undefined && q.skor_guru !== null && q.skor_guru !== '') {
                            initialScore = q.skor_guru;
                        } else if (isCorrect) {
                            initialScore = itemMaxScore;
                        } else if (q.skor_ai !== undefined && q.skor_ai !== null) {
                            initialScore = q.skor_ai;
                        } else {
                            initialScore = 0;
                        }
                        if (!initialFeedback) initialFeedback = isCorrect ? 'Jawaban isian singkat tepat sesuai kunci.' : '';
                    } else if (isMatch) {
                        typeLabel = 'Menjodohkan';
                        typeBadgeClass = 'text-teal-900 bg-teal-100 border-teal-300';
                        const studentMatches = (typeof q.jawaban_siswa === 'object' && q.jawaban_siswa !== null) ? q.jawaban_siswa : {};
                        pairs = Array.isArray(q.pasangan) ? q.pasangan : [];
                        correctMatches = 0;
                        pairs.forEach(p => {
                            if (String(studentMatches[p.kiri] || '').trim().toLowerCase() === String(p.kanan || '').trim().toLowerCase()) {
                                correctMatches++;
                            }
                        });
                        const matchScore = pairs.length > 0 ? Math.round(itemMaxScore * (correctMatches / pairs.length)) : 0;
                        statusBadge = `<span class="bg-teal-100 text-teal-900 border border-teal-400 text-xs font-black px-2.5 py-0.5 rounded-lg uppercase">Cocok: ${correctMatches}/${pairs.length} (${matchScore}/${itemMaxScore})</span>`;
                        initialScore = (q.skor_guru !== undefined && q.skor_guru !== null && q.skor_guru !== '') ? q.skor_guru : matchScore;
                        if (!initialFeedback) initialFeedback = `Berhasil menjodohkan ${correctMatches} dari ${pairs.length} pasangan dengan tepat.`;
                    } else if (isFoto) {
                        typeLabel = 'Upload Foto';
                        typeBadgeClass = 'text-pink-900 bg-pink-100 border-pink-300';
                        if (q.skor_guru !== undefined && q.skor_guru !== null && q.skor_guru !== '') {
                            initialScore = q.skor_guru;
                        } else if (q.skor_ai !== undefined && q.skor_ai !== null) {
                            initialScore = q.skor_ai;
                        }
                        statusBadge = initialScore !== ''
                            ? `<span class="bg-indigo-100 text-indigo-900 border border-indigo-400 text-xs font-black px-2.5 py-0.5 rounded-lg uppercase">Dinilai: ${initialScore}/${itemMaxScore}</span>`
                            : `<span class="bg-amber-100 text-amber-900 border border-amber-400 text-xs font-black px-2.5 py-0.5 rounded-lg uppercase">Perlu Koreksi (${itemMaxScore} Poin)</span>`;
                    } else {
                        // Esai
                        typeLabel = 'Soal Esai';
                        typeBadgeClass = 'text-purple-900 bg-purple-100 border-purple-300';
                        if (q.skor_guru !== undefined && q.skor_guru !== null && q.skor_guru !== '') {
                            initialScore = q.skor_guru;
                        } else if (q.skor_ai !== undefined && q.skor_ai !== null) {
                            initialScore = q.skor_ai;
                        }
                        statusBadge = initialScore !== ''
                            ? `<span class="bg-indigo-100 text-indigo-900 border border-indigo-400 text-xs font-black px-2.5 py-0.5 rounded-lg uppercase">Dinilai: ${initialScore}/${itemMaxScore}</span>`
                            : `<span class="bg-amber-100 text-amber-900 border border-amber-400 text-xs font-black px-2.5 py-0.5 rounded-lg uppercase">Perlu Koreksi (${itemMaxScore} Poin)</span>`;
                    }

                    let answerComparisonHtml = '';
                    if (isPg) {
                        answerComparisonHtml = `
                            <div class="bg-slate-50 p-3 rounded-xl border border-slate-300 text-xs space-y-2">
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 font-medium">
                                    <div><strong>A:</strong> ${escapeHtml(q.opsi_a || '-')}</div>
                                    <div><strong>B:</strong> ${escapeHtml(q.opsi_b || '-')}</div>
                                    <div><strong>C:</strong> ${escapeHtml(q.opsi_c || '-')}</div>
                                    <div><strong>D:</strong> ${escapeHtml(q.opsi_d || '-')}</div>
                                </div>
                                <div class="pt-2 border-t border-slate-200 flex flex-wrap gap-4 items-center font-bold">
                                    <span>Jawaban Siswa: <strong class="${isCorrect ? 'text-emerald-700 font-black' : 'text-red-700 font-black'}">${escapeHtml(q.jawaban_siswa || '(Kosong)')}</strong></span>
                                    <span>Kunci Benar: <strong class="text-slate-900 font-black">${escapeHtml(q.kunci || '-')}</strong></span>
                                </div>
                            </div>
                        `;
                    } else if (isPgk) {
                        answerComparisonHtml = `
                            <div class="bg-slate-50 p-3 rounded-xl border border-slate-300 text-xs space-y-2">
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 font-medium">
                                    <div><strong>A:</strong> ${escapeHtml(q.opsi_a || '-')}</div>
                                    <div><strong>B:</strong> ${escapeHtml(q.opsi_b || '-')}</div>
                                    <div><strong>C:</strong> ${escapeHtml(q.opsi_c || '-')}</div>
                                    <div><strong>D:</strong> ${escapeHtml(q.opsi_d || '-')}</div>
                                </div>
                                <div class="pt-2 border-t border-slate-200 flex flex-wrap gap-4 items-center font-bold">
                                    <span>Pilihan Siswa: <strong class="${isCorrect ? 'text-emerald-700 font-black' : 'text-red-700 font-black'}">${escapeHtml(studentKeys.join(', ') || '(Tidak dijawab)')}</strong></span>
                                    <span>Kunci Benar: <strong class="text-slate-900 font-black">${escapeHtml(correctKeys.join(', '))}</strong></span>
                                </div>
                            </div>
                        `;
                    } else if (isBs) {
                        answerComparisonHtml = `
                            <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-300 text-xs flex flex-wrap gap-4 items-center font-bold">
                                <span>Jawaban Siswa: <strong class="${isCorrect ? 'text-emerald-700 font-black' : 'text-red-700 font-black'}">${escapeHtml(q.jawaban_siswa || '(Kosong)')}</strong></span>
                                <span>Kunci Kebenaran: <strong class="text-slate-900 font-black">${escapeHtml(q.kunci || '-')}</strong></span>
                            </div>
                        `;
                    } else if (isSingkat) {
                        answerComparisonHtml = `
                            <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-300 text-xs flex flex-wrap gap-4 items-center font-bold">
                                <span>Jawaban Siswa: <strong class="${isCorrect ? 'text-emerald-700 font-black' : 'text-slate-900 font-black'}">${escapeHtml(q.jawaban_siswa || '(Kosong)')}</strong></span>
                                <span>Kunci Kata Jawaban: <strong class="text-emerald-700 font-black">${escapeHtml(q.kunci || '-')}</strong></span>
                            </div>
                        `;
                    } else if (isMatch) {
                        const studentMatches = (typeof q.jawaban_siswa === 'object' && q.jawaban_siswa !== null) ? q.jawaban_siswa : {};
                        answerComparisonHtml = `
                            <div class="overflow-x-auto bg-white rounded-xl border border-slate-300">
                                <table class="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr class="bg-slate-100 text-slate-800 font-black text-[11px] uppercase border-b border-slate-300">
                                            <th class="p-2">Premis / Istilah</th>
                                            <th class="p-2">Pilihan Siswa</th>
                                            <th class="p-2">Kunci Benar</th>
                                            <th class="p-2 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${pairs.map(p => {
                                            const stAns = studentMatches[p.kiri] || '(Belum dipilih)';
                                            const matchCorrect = String(stAns).trim().toLowerCase() === String(p.kanan).trim().toLowerCase();
                                            return `
                                                <tr class="${matchCorrect ? 'bg-emerald-50/50' : 'bg-red-50/50'} border-b border-slate-200">
                                                    <td class="p-2 font-bold">${escapeHtml(p.kiri)}</td>
                                                    <td class="p-2 font-semibold ${matchCorrect ? 'text-emerald-800' : 'text-red-700'}">${escapeHtml(stAns)}</td>
                                                    <td class="p-2 font-semibold text-purple-900">${escapeHtml(p.kanan)}</td>
                                                    <td class="p-2 text-center font-black">${matchCorrect ? '✅ Cocok' : '❌ Salah'}</td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `;
                    } else if (isFoto) {
                        const fileUrl = q.jawaban_siswa;
                        const hasUrl = fileUrl && (String(fileUrl).startsWith('http://') || String(fileUrl).startsWith('https://'));
                        answerComparisonHtml = `
                            <div class="space-y-2">
                                ${q.kunci ? `
                                    <div class="bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-xs text-amber-950 font-medium">
                                        <span class="block text-[10px] font-black uppercase text-amber-900 mb-0.5">Kriteria Foto yang Diharapkan:</span>
                                        <div class="leading-relaxed font-semibold">${escapeHtml(q.kunci)}</div>
                                    </div>
                                ` : ''}
                                <div class="bg-slate-50 p-3 rounded-xl border border-slate-300 text-xs">
                                    <span class="font-black uppercase text-slate-500 text-[10px] block mb-1.5">Berkas / Foto Unggahan Siswa:</span>
                                    ${hasUrl ? `
                                        <div class="flex items-center gap-3">
                                            <img src="${escapeHtml(fileUrl)}" alt="Unggahan Siswa" class="w-20 h-20 object-cover rounded-lg border-2 border-black bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" />
                                            <a href="${escapeHtml(fileUrl)}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black rounded-lg text-xs font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                                Buka Berkas / Foto Asli ↗
                                            </a>
                                        </div>
                                    ` : `<span class="text-slate-500 italic font-semibold">(Siswa tidak melampirkan berkas foto)</span>`}
                                </div>
                            </div>
                        `;
                    } else if (isLink) {
                        const linkUrl = q.jawaban_siswa;
                        const isUrlValid = linkUrl && (String(linkUrl).startsWith('http://') || String(linkUrl).startsWith('https://'));
                        answerComparisonHtml = `
                            <div class="space-y-2">
                                ${q.kunci ? `
                                    <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 text-xs text-indigo-950 font-medium">
                                        <span class="block text-[10px] font-black uppercase text-indigo-900 mb-0.5">Kriteria Tautan yang Diharapkan:</span>
                                        <div class="leading-relaxed font-semibold">${escapeHtml(q.kunci)}</div>
                                    </div>
                                ` : ''}
                                <div class="bg-slate-50 p-3 rounded-xl border border-slate-300 text-xs">
                                    <span class="font-black uppercase text-slate-500 text-[10px] block mb-1.5">Tautan Tugas Siswa:</span>
                                    ${isUrlValid ? `
                                        <div class="flex items-center gap-2 flex-wrap">
                                            <a href="${escapeHtml(linkUrl)}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-black text-white border-2 border-black rounded-lg text-xs font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                                Buka Tautan Siswa ↗
                                            </a>
                                            <span class="text-xs font-bold text-indigo-700 underline break-all">${escapeHtml(linkUrl)}</span>
                                        </div>
                                    ` : `<span class="text-slate-500 italic font-semibold">${escapeHtml(linkUrl || '(Siswa tidak menyertakan tautan)')}</span>`}
                                </div>
                            </div>
                        `;
                    } else {
                        // Esai
                        answerComparisonHtml = `
                            <div class="space-y-2">
                                ${q.kunci ? `
                                    <div class="bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-xs text-amber-950 font-medium">
                                        <span class="block text-[10px] font-black uppercase text-amber-900 mb-0.5">Kunci Jawaban / Panduan Esai Guru:</span>
                                        <div class="leading-relaxed font-semibold">${escapeHtml(q.kunci)}</div>
                                    </div>
                                ` : ''}
                                <div class="bg-slate-50 p-3 rounded-xl border border-slate-300 text-xs">
                                    <span class="font-black uppercase text-slate-500 text-[10px] block mb-1">Uraian Jawaban Siswa:</span>
                                    <div class="font-medium text-slate-900 whitespace-pre-line leading-relaxed">${escapeHtml(q.jawaban_siswa || '(Tidak dijawab / Kosong)')}</div>
                                </div>
                            </div>
                        `;
                    }

                    const { text: cleanPertanyaan, gambar_url: qImg } = splitQuestionImage(q.pertanyaan || '');
                    const imgUrl = q.gambar_url || qImg;
                    const isObjectiveLocked = isPg || isPgk || isBs || isMatch || (isSingkat && isCorrect);

                    let gradingControlHtml = '';
                    if (isObjectiveLocked) {
                        gradingControlHtml = `
                            <input type="hidden" id="grade-item-score-${idx}" value="${initialScore}">
                            <input type="hidden" id="grade-item-feedback-${idx}" value="${escapeHtml(initialFeedback)}">
                            <div class="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                                <div class="flex items-center gap-2 font-bold text-slate-700">
                                    <span class="text-[10px] font-black uppercase text-slate-400">Skor Butir:</span>
                                    <span class="px-2.5 py-0.5 rounded-lg border font-black ${Number(initialScore) > 0 ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-red-100 text-red-900 border-red-300'}">
                                        ${initialScore} / ${itemMaxScore} Poin (Terkunci Sesuai Kunci)
                                    </span>
                                </div>
                                <span class="text-[10px] font-bold text-slate-400 italic">Otomatis Terkoreksi</span>
                            </div>
                        `;
                    } else {
                        gradingControlHtml = `
                            <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2.5 items-center border-t border-slate-200 mt-2">
                                <div class="sm:col-span-3">
                                    <label class="block text-[10px] font-black uppercase text-slate-700 mb-0.5">Nilai Esai (0 - ${itemMaxScore})</label>
                                    <input type="number" id="grade-item-score-${idx}" value="${initialScore !== '' ? initialScore : ''}" min="0" max="${itemMaxScore}" oninput="window.recalcGradeFormTotalScore()" placeholder="0" class="w-full h-9 px-2 border-2 border-black rounded-lg font-black text-sm bg-white text-center">
                                </div>
                                <div class="sm:col-span-6">
                                    <label class="block text-[10px] font-black uppercase text-slate-700 mb-0.5">Catatan / Evaluasi Guru</label>
                                    <input type="text" id="grade-item-feedback-${idx}" value="${escapeHtml(initialFeedback)}" placeholder="Catatan evaluasi guru..." class="w-full h-9 px-3 border-2 border-black rounded-lg font-bold text-xs bg-white">
                                </div>
                                <div class="sm:col-span-3 flex items-end">
                                    <button type="button" onclick="window.runAiGradeSingleItem(${idx})" class="w-full h-9 bg-purple-100 hover:bg-purple-200 text-purple-900 border-2 border-purple-400 rounded-lg font-black text-[10px] uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition cursor-pointer">
                                        Koreksi AI Butir
                                    </button>
                                </div>
                            </div>
                        `;
                    }

                    return `
                        <div class="border-2 border-black rounded-2xl p-4 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-2.5">
                            <div class="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
                                <div class="flex items-center gap-2">
                                    <span class="font-black text-xs uppercase px-2.5 py-1 rounded-lg border ${typeBadgeClass}">
                                        No. ${idx + 1} (${typeLabel})
                                    </span>
                                    <span class="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                                        Bobot: ${itemMaxScore} Poin
                                    </span>
                                </div>
                                ${statusBadge}
                            </div>

                            <p class="font-bold text-xs md:text-sm text-slate-900 leading-relaxed">${escapeHtml(cleanPertanyaan)}</p>
                            ${imgUrl ? `
                                <div class="my-2 p-1.5 border-2 border-black rounded-xl bg-slate-50 max-w-sm">
                                    <a href="${escapeHtml(imgUrl)}" target="_blank" title="Buka gambar stimulus">
                                        <img src="${escapeHtml(imgUrl)}" alt="Gambar Soal" class="max-h-48 rounded-lg border border-slate-300 object-contain mx-auto" />
                                    </a>
                                    <div class="text-[10px] text-slate-500 font-bold text-center mt-1">Stimulus Gambar Soal (Klik untuk perbesar)</div>
                                </div>
                            ` : ''}

                            ${answerComparisonHtml}

                            ${gradingControlHtml}
                        </div>
                    `;
                }).join('');

                window.recalcGradeFormTotalScore();
            }
        } else {
            // Legacy / File / Link / Plain Text
            if (formSection) formSection.classList.add('hidden');
            if (previewBox) {
                previewBox.classList.remove('hidden');
                const isText = isTextSubmission(item);
                const isLink = isLinkSubmission(item);

                if (isText) {
                    const textContent = getTextContent(item);
                    previewBox.innerHTML = `
                        <div class="space-y-1.5">
                            <span class="font-black text-amber-950 text-xs">Jawaban Siswa (Teks Online):</span>
                            <div class="bg-amber-50 border-2 border-amber-300 rounded-xl p-3.5 text-xs font-semibold text-slate-900 whitespace-pre-line max-h-56 overflow-y-auto leading-relaxed shadow-inner">
                                ${escapeHtml(textContent)}
                            </div>
                        </div>
                    `;
                } else if (isLink) {
                    const url = getLinkUrl(item);
                    previewBox.innerHTML = `
                        <div class="space-y-1">
                            <span class="font-bold text-purple-900 block">Tautan Tugas Siswa:</span>
                            <a href="${url}" target="_blank" class="text-indigo-600 font-bold underline break-all">${url} ↗</a>
                        </div>
                    `;
                } else {
                    const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(item.storage_path);
                    previewBox.innerHTML = `
                        <div class="flex items-center justify-between gap-2">
                            <span class="font-bold text-slate-800 truncate">${escapeHtml(item.filename)}</span>
                            <div class="flex items-center gap-1.5 shrink-0">
                                <a href="${publicUrlData.publicUrl}" target="_blank" class="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-lg border border-indigo-300">Buka Berkas ↗</a>
                                <button type="button" onclick="downloadSubmissionFile('${publicUrlData.publicUrl}', '${item.filename.replace(/'/g, "\\'")}')" class="bg-slate-100 text-slate-800 font-bold px-3 py-1 rounded-lg border border-slate-300">Unduh</button>
                            </div>
                        </div>
                    `;
                }
            }
        }

        if (item.nilai !== null && item.nilai !== undefined && item.nilai !== '') {
            document.getElementById('grade-input-score').value = item.nilai;
        } else if (isForm) {
            window.recalcGradeFormTotalScore();
        } else {
            document.getElementById('grade-input-score').value = '';
        }
        document.getElementById('grade-input-feedback').value = item.catatan_guru || item.ai_feedback || '';
        document.getElementById('grade-modal').classList.remove('hidden');
    };

    window.closeGradeModal = () => {
        document.getElementById('grade-modal').classList.add('hidden');
        activeGradeItem = null;
    };

    // Kalkulasi Otomatis Total Skor Tugas Form dari Skor Butir
    window.recalcGradeFormTotalScore = () => {
        if (!activeGradeItem) return;
        let isForm = false;
        let formItems = [];

        if (activeGradeItem.storage_path && activeGradeItem.storage_path.startsWith('FORM:')) {
            isForm = true;
            try { formItems = JSON.parse(activeGradeItem.storage_path.replace(/^FORM:/, '')); } catch (_) {}
        } else if (activeGradeItem.tipe === 'form') {
            isForm = true;
            try { formItems = JSON.parse(activeGradeItem.storage_path || '[]'); } catch (_) {}
        }

        if (isForm && Array.isArray(formItems) && formItems.length > 0) {
            let total = 0;
            formItems.forEach((_, idx) => {
                const sEl = document.getElementById(`grade-item-score-${idx}`);
                if (sEl && sEl.value !== '') {
                    total += Number(sEl.value) || 0;
                }
            });
            const clamped = Math.max(0, Math.min(100, Math.round(total)));
            const inputScore = document.getElementById('grade-input-score');
            if (inputScore) inputScore.value = clamped;
        }
    };

    // Koreksi AI untuk Butir Soal Tunggal (Esai / Isian / Non-Objektif)
    window.runAiGradeSingleItem = async (idx) => {
        if (!activeGradeItem) return;
        let isForm = false;
        let formItems = [];

        if (activeGradeItem.storage_path && activeGradeItem.storage_path.startsWith('FORM:')) {
            isForm = true;
            try { formItems = JSON.parse(activeGradeItem.storage_path.replace(/^FORM:/, '')); } catch (_) {}
        } else if (activeGradeItem.tipe === 'form') {
            isForm = true;
            try { formItems = JSON.parse(activeGradeItem.storage_path || '[]'); } catch (_) {}
        }

        const q = formItems[idx];
        if (!q) return;

        const tipe = q.tipe || 'esai';
        const maxBobot = Number(q.bobot) || 10;
        const isPg = tipe === 'pg' || tipe === 'pilihan_ganda';
        const isPgk = tipe === 'pg_kompleks' || tipe === 'pilihan_ganda_kompleks';
        const isBs = tipe === 'benar_salah';
        const isSingkat = tipe === 'singkat' || tipe === 'isian_singkat';
        const isMatch = tipe === 'menjodohkan';

        const scoreInput = document.getElementById(`grade-item-score-${idx}`);
        const fbInput = document.getElementById(`grade-item-feedback-${idx}`);

        if (isPg) {
            const isCorrect = String(q.jawaban_siswa || '').trim().toUpperCase() === String(q.kunci || '').trim().toUpperCase();
            if (scoreInput) scoreInput.value = isCorrect ? maxBobot : 0;
            if (fbInput) fbInput.value = isCorrect ? "Jawaban tepat sesuai kunci." : `Jawaban kurang tepat (Kunci: ${q.kunci}).`;
            window.recalcGradeFormTotalScore();
            return;
        }

        if (isPgk) {
            const studentAns = q.jawaban_siswa || [];
            const studentKeys = (Array.isArray(studentAns) ? studentAns : String(studentAns).split(',')).map(s => s.trim().toUpperCase()).filter(Boolean).sort();
            const correctKeys = (q.kunci || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean).sort();
            const isCorrect = studentKeys.length > 0 && studentKeys.join(',') === correctKeys.join(',');
            if (scoreInput) scoreInput.value = isCorrect ? maxBobot : 0;
            if (fbInput) fbInput.value = isCorrect ? "Pilihan ganda kompleks tepat." : `Pilihan kurang tepat (Kunci: ${correctKeys.join(', ')}).`;
            window.recalcGradeFormTotalScore();
            return;
        }

        if (isBs) {
            const isCorrect = String(q.jawaban_siswa || '').trim().toUpperCase() === String(q.kunci || '').trim().toUpperCase();
            if (scoreInput) scoreInput.value = isCorrect ? maxBobot : 0;
            if (fbInput) fbInput.value = isCorrect ? "Jawaban tepat sesuai kunci kebenaran." : `Jawaban kurang tepat (Kunci: ${q.kunci}).`;
            window.recalcGradeFormTotalScore();
            return;
        }

        if (isSingkat) {
            const isCorrect = String(q.jawaban_siswa || '').trim().toLowerCase() === String(q.kunci || '').trim().toLowerCase();
            if (isCorrect) {
                if (scoreInput) scoreInput.value = maxBobot;
                if (fbInput) fbInput.value = "Jawaban isian singkat tepat sesuai kunci.";
                window.recalcGradeFormTotalScore();
                return;
            }
        }

        if (isMatch) {
            const pairs = Array.isArray(q.pasangan) ? q.pasangan : [];
            const studentMatches = (typeof q.jawaban_siswa === 'object' && q.jawaban_siswa !== null) ? q.jawaban_siswa : {};
            let matchCount = 0;
            pairs.forEach(p => {
                if (String(studentMatches[p.kiri] || '').trim().toLowerCase() === String(p.kanan || '').trim().toLowerCase()) {
                    matchCount++;
                }
            });
            const matchScore = pairs.length > 0 ? Math.round(maxBobot * (matchCount / pairs.length)) : 0;
            if (scoreInput) scoreInput.value = matchScore;
            if (fbInput) fbInput.value = `Berhasil menjodohkan ${matchCount} dari ${pairs.length} pasangan dengan tepat.`;
            window.recalcGradeFormTotalScore();
            return;
        }

        showAiLoadingModal({
            badge: 'KOREKSI BUTIR AI',
            title: `Mengevaluasi Butir Soal #${idx + 1}...`,
            steps: [
                'Membaca teks jawaban siswa...',
                'Mencocokkan dengan panduan kunci & rubrik guru...',
                'Mengestimasi perolehan skor esai/butir...'
            ]
        });

        try {
            const studentAns = q.jawaban_siswa || '';
            const keyOrRubric = q.kunci || q.rubrik_esai || 'Kesesuaian dan kelengkapan konsep materi.';

            const result = await aiGradeQuizEssay(q.pertanyaan, keyOrRubric, String(studentAns), maxBobot);
            if (scoreInput && result.skor !== undefined) scoreInput.value = result.skor;
            if (fbInput && result.feedback) fbInput.value = result.feedback;

            window.recalcGradeFormTotalScore();
        } catch (e) {
            showCustomModal("Gagal koreksi AI butir soal: " + e.message);
        } finally {
            hideAiLoadingModal();
        }
    };

    window.runAiGrade = async () => {
        if (!activeGradeItem) return;
        const btn = document.getElementById('btn-run-ai-grade');
        btn.disabled = true;
        btn.innerText = "Menganalisis Jawaban...";

        showAiLoadingModal({
            badge: 'KOREKSI TUGAS AI',
            title: 'Mengevaluasi Jawaban Siswa...',
            steps: [
                'Menghubungkan ke Google Gemini AI...',
                'Membaca lembar jawaban per butir soal...',
                'Mengevaluasi kesesuaian dengan rubrik tugas...',
                'Menghitung estimasi skor capaian...',
                'Menyusun masukan evaluasi dan catatan guru...'
            ]
        });

        try {
            let isForm = false;
            let formItems = [];

            if (activeGradeItem.storage_path && activeGradeItem.storage_path.startsWith('FORM:')) {
                isForm = true;
                try {
                    formItems = JSON.parse(activeGradeItem.storage_path.replace(/^FORM:/, ''));
                } catch (_) {}
            } else if (activeGradeItem.tipe === 'form') {
                isForm = true;
                try {
                    formItems = JSON.parse(activeGradeItem.storage_path || '[]');
                } catch (_) {}
            }

            if (isForm && Array.isArray(formItems) && formItems.length > 0) {
                // Evaluasi setiap butir soal secara komprehensif
                for (let i = 0; i < formItems.length; i++) {
                    const q = formItems[i];
                    const tipe = q.tipe || 'esai';
                    const maxBobot = Number(q.bobot) || 10;
                    const isPg = tipe === 'pg' || tipe === 'pilihan_ganda';
                    const isPgk = tipe === 'pg_kompleks' || tipe === 'pilihan_ganda_kompleks';
                    const isBs = tipe === 'benar_salah';
                    const isSingkat = tipe === 'singkat' || tipe === 'isian_singkat';
                    const isMatch = tipe === 'menjodohkan';

                    const scoreInput = document.getElementById(`grade-item-score-${i}`);
                    const fbInput = document.getElementById(`grade-item-feedback-${i}`);

                    if (isPg) {
                        const isCorrect = String(q.jawaban_siswa || '').trim().toUpperCase() === String(q.kunci || '').trim().toUpperCase();
                        if (scoreInput) scoreInput.value = isCorrect ? maxBobot : 0;
                        if (fbInput) fbInput.value = isCorrect ? "Jawaban tepat sesuai kunci." : `Jawaban kurang tepat (Kunci: ${q.kunci}).`;
                    } else if (isPgk) {
                        const studentAns = q.jawaban_siswa || [];
                        const studentKeys = (Array.isArray(studentAns) ? studentAns : String(studentAns).split(',')).map(s => s.trim().toUpperCase()).filter(Boolean).sort();
                        const correctKeys = (q.kunci || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean).sort();
                        const isCorrect = studentKeys.length > 0 && studentKeys.join(',') === correctKeys.join(',');
                        if (scoreInput) scoreInput.value = isCorrect ? maxBobot : 0;
                        if (fbInput) fbInput.value = isCorrect ? "Pilihan ganda kompleks tepat." : `Pilihan kurang tepat (Kunci: ${correctKeys.join(', ')}).`;
                    } else if (isBs) {
                        const isCorrect = String(q.jawaban_siswa || '').trim().toUpperCase() === String(q.kunci || '').trim().toUpperCase();
                        if (scoreInput) scoreInput.value = isCorrect ? maxBobot : 0;
                        if (fbInput) fbInput.value = isCorrect ? "Jawaban tepat sesuai kunci kebenaran." : `Jawaban kurang tepat (Kunci: ${q.kunci}).`;
                    } else if (isSingkat) {
                        const isCorrect = String(q.jawaban_siswa || '').trim().toLowerCase() === String(q.kunci || '').trim().toLowerCase();
                        if (isCorrect) {
                            if (scoreInput) scoreInput.value = maxBobot;
                            if (fbInput) fbInput.value = "Jawaban isian singkat tepat sesuai kunci.";
                        } else {
                            const result = await aiGradeQuizEssay(
                                q.pertanyaan,
                                q.kunci || 'Jawaban singkat konsep materi.',
                                String(q.jawaban_siswa || ''),
                                maxBobot
                            );
                            if (scoreInput && result.skor !== undefined) scoreInput.value = result.skor;
                            if (fbInput && result.feedback) fbInput.value = result.feedback;
                        }
                    } else if (isMatch) {
                        const pairs = Array.isArray(q.pasangan) ? q.pasangan : [];
                        const studentMatches = (typeof q.jawaban_siswa === 'object' && q.jawaban_siswa !== null) ? q.jawaban_siswa : {};
                        let matchCount = 0;
                        pairs.forEach(p => {
                            if (String(studentMatches[p.kiri] || '').trim().toLowerCase() === String(p.kanan || '').trim().toLowerCase()) {
                                matchCount++;
                            }
                        });
                        const matchScore = pairs.length > 0 ? Math.round(maxBobot * (matchCount / pairs.length)) : 0;
                        if (scoreInput) scoreInput.value = matchScore;
                        if (fbInput) fbInput.value = `Berhasil menjodohkan ${matchCount} dari ${pairs.length} pasangan dengan tepat.`;
                    } else {
                        // Esai & upload_foto
                        const result = await aiGradeQuizEssay(
                            q.pertanyaan,
                            q.kunci || q.rubrik_esai || 'Kesesuaian dan kelengkapan konsep materi.',
                            String(q.jawaban_siswa || ''),
                            maxBobot
                        );
                        if (scoreInput && result.skor !== undefined) scoreInput.value = result.skor;
                        if (fbInput && result.feedback) fbInput.value = result.feedback;
                    }
                }

                window.recalcGradeFormTotalScore();
                const totalScore = document.getElementById('grade-input-score').value;
                document.getElementById('grade-input-feedback').value = `Hasil evaluasi tugas: pencapaian skor akumulatif ${totalScore}/100. Seluruh butir esai dan objektif telah dievaluasi.`;
                showCustomModal("Seluruh lembar butir soal berhasil dianalisis oleh AI! Anda dapat menyesuaikan skor secara manual sebelum menyimpan.");
            } else {
                let studentContent = '';
                if (isTextSubmission(activeGradeItem)) {
                    studentContent = getTextContent(activeGradeItem);
                } else if (isLinkSubmission(activeGradeItem)) {
                    studentContent = getLinkUrl(activeGradeItem);
                } else {
                    studentContent = activeGradeItem.filename;
                }

                let rubricToUse = 'Kesesuaian tugas dengan instruksi, kelengkapan pembahasan, dan kerapian pengerjaan.';
                let assignmentTitle = activeGradeItem.materi;
                let assignmentInstructions = activeGradeItem.materi;

                const relatedAssign = assignmentsList.find(a => 
                    (activeGradeItem.assignment_id && String(a.id) === String(activeGradeItem.assignment_id)) ||
                    (a.judul_tugas && a.judul_tugas.toLowerCase().trim() === (activeGradeItem.materi || '').toLowerCase().trim())
                );

                if (relatedAssign) {
                    assignmentTitle = relatedAssign.judul_tugas;
                    assignmentInstructions = relatedAssign.deskripsi || relatedAssign.judul_tugas;
                    if (relatedAssign.rubrik_ai) rubricToUse = relatedAssign.rubrik_ai;
                }

                const result = await aiEvaluateSubmission(
                    currentTeacher?.mapel || 'Informatika',
                    assignmentTitle,
                    assignmentInstructions,
                    rubricToUse,
                    studentContent
                );

                if (result.nilai !== undefined) {
                    document.getElementById('grade-input-score').value = result.nilai;
                }
                if (result.catatan) {
                    document.getElementById('grade-input-feedback').value = result.catatan;
                }
            }
        } catch (e) {
            showCustomModal("Gagal menjalankan AI Koreksi: " + e.message);
        } finally {
            hideAiLoadingModal();
            btn.disabled = false;
            btn.innerText = "Koreksi Otomatis AI";
        }
    };

    window.saveGrade = async () => {
        if (!activeGradeItem) return;
        const scoreVal = document.getElementById('grade-input-score').value.trim();
        const feedbackVal = document.getElementById('grade-input-feedback').value.trim();

        if (scoreVal === '') {
            showCustomModal("Silakan masukkan nilai angka.");
            return;
        }

        const scoreNum = parseInt(scoreVal, 10);
        if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
            showCustomModal("Nilai harus berupa angka antara 0 dan 100.");
            return;
        }

        const saveBtn = document.getElementById('btn-save-grade');
        saveBtn.disabled = true;
        saveBtn.innerText = "Menyimpan...";

        try {
            let isForm = false;
            let formItems = [];

            if (activeGradeItem.storage_path && activeGradeItem.storage_path.startsWith('FORM:')) {
                isForm = true;
                try { formItems = JSON.parse(activeGradeItem.storage_path.replace(/^FORM:/, '')); } catch (_) {}
            } else if (activeGradeItem.tipe === 'form') {
                isForm = true;
                try { formItems = JSON.parse(activeGradeItem.storage_path || '[]'); } catch (_) {}
            }

            let updatedStoragePath = activeGradeItem.storage_path;

            if (isForm && Array.isArray(formItems) && formItems.length > 0) {
                formItems.forEach((q, idx) => {
                    const sInput = document.getElementById(`grade-item-score-${idx}`);
                    const fbInput = document.getElementById(`grade-item-feedback-${idx}`);
                    if (sInput && sInput.value !== '') q.skor_guru = Number(sInput.value);
                    if (fbInput) q.catatan_guru = fbInput.value.trim();
                });
                updatedStoragePath = 'FORM:' + JSON.stringify(formItems);
            }

            const updatePayload = {
                nilai: scoreNum,
                catatan_guru: feedbackVal,
                status_koreksi: 'sudah_dikoreksi'
            };
            if (isForm) {
                updatePayload.storage_path = updatedStoragePath;
            }

            const { error } = await supabase.from('files').update(updatePayload).eq('id', activeGradeItem.id);

            if (error) throw error;

            activeGradeItem.nilai = scoreNum;
            activeGradeItem.catatan_guru = feedbackVal;
            activeGradeItem.status_koreksi = 'sudah_dikoreksi';
            if (isForm) activeGradeItem.storage_path = updatedStoragePath;

            closeGradeModal();
            applyFilters();

            // Refresh modal pengumpulan penugasan aktif jika sedang terbuka
            if (activeAssignmentForSubmissions) {
                renderAssignmentSubmissionsTable(activeAssignmentForSubmissions);
                loadAssignments();
            }

            showCustomModal("Nilai dan catatan evaluasi berhasil disimpan!");
        } catch (e) {
            showCustomModal("Gagal menyimpan nilai: " + e.message);
        }
        saveBtn.disabled = false;
        saveBtn.innerText = "Simpan Nilai & Evaluasi";
    };

    window.deleteFile = async (id, legacyPath = '', legacyIsLink = false) => {
        const item = pendingFiles.find(f => String(f.id) === String(id));
        const studentName = item?.nama || 'Siswa ini';
        const taskTitle = item?.materi || 'tugas ini';

        const confirmed = await showCustomModal(
            `Apakah Anda yakin ingin menghapus pengumpulan tugas "${taskTitle}" dari "${studentName}" secara permanen?`,
            'confirm',
            'Konfirmasi Hapus Tugas',
            ''
        );
        if (!confirmed) return;
        
        try {
            const rawPath = item?.storage_path || legacyPath;
            const isLink = item ? (item.tipe === 'link' || (rawPath && rawPath.startsWith('LINK:'))) : legacyIsLink;
            const isTextOrForm = item ? (item.tipe === 'form' || item.tipe === 'text' || (rawPath && (rawPath.startsWith('FORM:') || rawPath.startsWith('TEXT:')))) : false;

            // Hapus berkas fisik di storage Supabase hanya jika file upload nyata (bukan form/text/link)
            if (!isLink && !isTextOrForm && rawPath && !rawPath.startsWith('FORM:') && !rawPath.startsWith('TEXT:') && !rawPath.startsWith('LINK:')) {
                const { error: storageError } = await supabase.storage.from('uploads').remove([rawPath]);
                if (storageError) console.warn("Storage removal warning:", storageError);
            }

            const { error: dbError } = await supabase.from('files').delete().eq('id', id);
            if (dbError) throw dbError;

            await showCustomModal(`Tugas "${taskTitle}" dari "${studentName}" berhasil dihapus.`, 'alert', 'Tugas Dihapus', '');
            await loadFilesTable();
        } catch (e) {
            console.error(e);
            await showCustomModal('Gagal menghapus tugas: ' + e.message, 'alert', 'Gagal Menghapus', '');
        }
    };

    window.exportCSV = async () => {
        if (pendingFiles.length === 0) {
            await showCustomModal('Tidak ada data tugas untuk diekspor.');
            return;
        }
        
        let csvContent = "\uFEFF";
        csvContent += "No,Kelas,Mata Pelajaran,Judul Tugas/Materi,Nama Siswa,Metode Pengerjaan,Rincian/Tautan/Jawaban,Nilai Angka,Catatan Guru / Evaluasi AI,Waktu Pengumpulan\n";
        
        pendingFiles.forEach((f, idx) => {
            const isText = isTextSubmission(f);
            const isLink = isLinkSubmission(f);
            let tipeStr = "Berkas File";
            let detailStr = f.filename;
            if (isText) {
                tipeStr = "Formulir Web";
                detailStr = getTextContent(f).replace(/"/g, '""');
            } else if (isLink) {
                tipeStr = "Tautan / Link";
                detailStr = getLinkUrl(f);
            }
            const mapelStr = (f.mapel || currentTeacher?.mapel || "Informatika").replace(/"/g, '""');
            const nilaiStr = f.nilai !== null && f.nilai !== undefined && f.nilai !== '' ? f.nilai : "";
            const catatanStr = (f.catatan_guru || f.ai_feedback || "").replace(/"/g, '""');
            const dateStr = f.created_at ? new Date(f.created_at).toLocaleString('id-ID') : '';
            const row = [
                idx + 1,
                `"${f.kelas}"`,
                `"${mapelStr}"`,
                `"${f.materi}"`,
                `"${f.nama}"`,
                `"${tipeStr}"`,
                `"${detailStr}"`,
                `"${nilaiStr}"`,
                `"${catatanStr}"`,
                `"${dateStr}"`
            ].join(",");
            csvContent += row + "\n";
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Rekap_Nilai_Tugas_SMPN58_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    window.printOfficialGradebook = () => {
        if (!pendingFiles || pendingFiles.length === 0) {
            showCustomModal("Tidak ada data nilai tugas untuk dicetak.");
            return;
        }

        const mapel = currentTeacher?.mapel || 'Informatika';
        const teacherName = currentTeacher?.name || currentSession?.user?.email || 'Guru Pengampu';
        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        const graded = pendingFiles.filter(f => f.nilai !== null && f.nilai !== undefined && f.nilai !== '');
        const avg = graded.length > 0 ? (graded.reduce((acc, f) => acc + Number(f.nilai), 0) / graded.length).toFixed(1) : 0;

        let rowsHtml = '';
        pendingFiles.forEach((f, idx) => {
            const isText = isTextSubmission(f);
            const isLink = isLinkSubmission(f);
            const tipeStr = isText ? "Form Web" : (isLink ? "Tautan Link" : "Berkas File");
            const scoreVal = f.nilai !== null && f.nilai !== undefined && f.nilai !== '' ? f.nilai : '-';
            const statusStr = scoreVal !== '-' ? 'Tuntas' : 'Belum Dinilai';

            rowsHtml += `
                <tr>
                    <td style="border: 1px solid black; padding: 6px; text-align: center;">${idx + 1}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: center; font-weight: bold;">${escapeHtml(f.kelas)}</td>
                    <td style="border: 1px solid black; padding: 6px; font-weight: bold;">${escapeHtml(f.nama)}</td>
                    <td style="border: 1px solid black; padding: 6px;">${escapeHtml(f.materi)}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: center;">${tipeStr}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: center; font-weight: bold; font-size: 13px;">${scoreVal}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: center;">${statusStr}</td>
                    <td style="border: 1px solid black; padding: 6px; font-size: 11px;">${escapeHtml(f.catatan_guru || f.ai_feedback || '-')}</td>
                </tr>
            `;
        });

        const printWin = window.open('', '_blank');
        printWin.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Rekap Nilai Siswa - SMP Negeri 58 Palembang</title>
                <style>
                    body { font-family: 'Times New Roman', Times, serif; padding: 25px; color: #000; }
                    .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 16px; }
                    .kop h2 { margin: 0; font-size: 17px; text-transform: uppercase; font-weight: bold; }
                    .kop h1 { margin: 3px 0; font-size: 21px; text-transform: uppercase; font-weight: 900; }
                    .kop p { margin: 1px 0; font-size: 12px; }
                    .title { text-align: center; font-size: 15px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; }
                    .meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th { border: 1px solid black; padding: 6px; background-color: #f2f2f2; text-transform: uppercase; }
                    .stats { margin-top: 12px; font-size: 12px; font-weight: bold; }
                    .footer-sig { margin-top: 35px; display: flex; justify-content: flex-end; text-align: center; font-size: 12px; }
                    .sig-box { width: 220px; }
                    @media print {
                        @page { size: landscape; margin: 12mm; }
                    }
                </style>
            </head>
            <body>
                <div class="kop">
                    <h2>Pemerintah Kota Palembang &bull; Dinas Pendidikan</h2>
                    <h1>SMP NEGERI 58 PALEMBANG</h1>
                    <p>Jl. Macan Lindungan, Kec. Ilir Barat I, Kota Palembang, Sumatera Selatan</p>
                    <p>Portal Belajar & Sistem Asesmen Digital Siswa</p>
                </div>
                <div class="title">LEMBAR REKAPITULASI BUKU NILAI TUGAS SISWA</div>
                <div class="meta">
                    <div>
                        <strong>Mata Pelajaran:</strong> ${escapeHtml(mapel)}<br>
                        <strong>Tahun Ajaran:</strong> 2026/2027
                    </div>
                    <div style="text-align: right;">
                        <strong>Tanggal Cetak:</strong> ${dateStr}<br>
                        <strong>Total Tugas Masuk:</strong> ${pendingFiles.length} Siswa
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 25px;">No</th>
                            <th style="width: 50px;">Kelas</th>
                            <th>Nama Lengkap Siswa</th>
                            <th>Judul Tugas / Materi</th>
                            <th style="width: 80px;">Metode</th>
                            <th style="width: 45px;">Nilai</th>
                            <th style="width: 70px;">Status</th>
                            <th>Catatan Guru / Evaluasi AI</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
                <div class="stats">
                    Rata-Rata Nilai Tugas: ${avg} / 100 (${graded.length} tugas telah dinilai dari ${pendingFiles.length} pengumpulan)
                </div>
                <div class="footer-sig">
                    <div class="sig-box">
                        <p>Palembang, ${dateStr}<br>Guru Mata Pelajaran,</p>
                        <br><br><br>
                        <p style="font-weight: bold; text-decoration: underline;">${escapeHtml(teacherName)}</p>
                        <p style="margin-top: -6px; font-size: 10px;">Guru Pengampu / NIP. -</p>
                    </div>
                </div>
                <script>
                    window.onload = function() { window.print(); };
                <\/script>
            </body>
            </html>
        `);
        printWin.document.close();
    };

    // ==========================================
    // 3. Kelola Tugas / Penugasan Guru (Baru)
    // ==========================================
    async function loadAssignments() {
        const container = document.getElementById('assignments-container');
        container.innerHTML = '<div class="col-span-2 text-center py-6 font-bold text-black uppercase animate-pulse">Memuat daftar tugas siswa...</div>';

        try {
            const isSuperadmin = currentTeacher?.role === 'superadmin';
            let assignQuery = supabase.from('assignments').select('*').order('created_at', { ascending: false });
            if (!isSuperadmin && currentTeacher?.id) {
                assignQuery = assignQuery.or(`guru_id.eq.${currentTeacher.id}`);
            }
            const { data, error } = await assignQuery;
            if (error) throw error;
            assignmentsList = data || [];
            const pBadge = document.getElementById('penugasan-count-badge');
            if (pBadge) pBadge.textContent = assignmentsList.length;

            if (filterAssignmentSelect) {
                filterAssignmentSelect.innerHTML = '<option value="">Semua Penugasan</option>';
                assignmentsList.forEach(a => {
                    const opt = document.createElement('option');
                    opt.value = a.id;
                    opt.textContent = `${a.judul_tugas} — Kelas ${a.kelas}`;
                    filterAssignmentSelect.appendChild(opt);
                });
            }

            // Pastikan data pengumpulan siswa termutakhir tersedia untuk penghitungan
            if (!pendingFiles || pendingFiles.length === 0) {
                try {
                    let filesQ = supabase.from('files').select('*').order('created_at', { ascending: false });
                    if (!isSuperadmin && currentTeacher?.id) {
                        const tIds = assignmentsList.map(a => a.id).filter(Boolean);
                        if (tIds.length > 0) {
                            filesQ = filesQ.or(`guru_id.eq.${currentTeacher.id},assignment_id.in.(${tIds.join(',')})`);
                        } else {
                            filesQ = filesQ.eq('guru_id', currentTeacher.id);
                        }
                    }
                    const { data: fileData } = await filesQ;
                    if (fileData) pendingFiles = fileData;
                } catch (_) {}
            }

            container.innerHTML = '';
            if (assignmentsList.length === 0) {
                container.innerHTML = '<div class="col-span-2 bg-white border-2 border-black rounded-2xl p-8 text-center text-slate-500 font-bold uppercase">Belum ada tugas/PR yang dibuat guru.</div>';
                return;
            }

            assignmentsList.forEach(a => {
                const card = document.createElement('div');
                card.className = "bg-white border-[3px] border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between";
                const deadlineText = a.deadline ? new Date(a.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Tidak ada batas waktu';

                const matchingSubs = pendingFiles.filter(f => 
                    (f.assignment_id && String(f.assignment_id) === String(a.id)) ||
                    (f.materi && f.materi.toLowerCase().trim() === a.judul_tugas.toLowerCase().trim())
                );
                const gradedCount = matchingSubs.filter(f => f.nilai !== null && f.nilai !== undefined && f.nilai !== '').length;

                const parsed = parseAssignmentQuestions(a);
                const descText = parsed.petunjuk || 'Petunjuk penugasan siswa';
                const qCount = parsed.questions ? parsed.questions.length : 0;
                const tipePengumpulan = parsed.tipe_pengumpulan || 'bebas';

                let tipeBadgeHtml = '';
                if (tipePengumpulan === 'form') {
                    tipeBadgeHtml = `<span class="bg-indigo-100 text-indigo-900 border border-indigo-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">Form Soal (${qCount} Butir)</span>`;
                } else if (tipePengumpulan === 'link') {
                    tipeBadgeHtml = `<span class="bg-pink-100 text-pink-900 border border-pink-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">Khusus Tautan Link</span>`;
                } else if (tipePengumpulan === 'file') {
                    tipeBadgeHtml = `<span class="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">Khusus Berkas</span>`;
                } else if (tipePengumpulan === 'text') {
                    tipeBadgeHtml = `<span class="bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">Khusus Form Web</span>`;
                } else {
                    tipeBadgeHtml = `<span class="bg-teal-100 text-teal-900 border border-teal-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">Pengumpulan Bebas</span>`;
                }

                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start gap-2 mb-2 flex-wrap">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                    Kelas ${escapeHtml(a.kelas)} &bull; ${escapeHtml(a.mapel)}
                                </span>
                                ${tipeBadgeHtml}
                            </div>
                            <span class="bg-red-100 text-red-800 border border-red-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                Batas: ${deadlineText}
                            </span>
                        </div>
                        <h4 class="font-black text-lg text-black mb-1">${escapeHtml(a.judul_tugas)}</h4>
                        <p class="text-xs text-slate-700 font-medium leading-relaxed mb-3 whitespace-pre-line line-clamp-3">${escapeHtml(descText)}</p>
                        ${(a.rubrik_ai && !a.rubrik_ai.includes('Soal #') && !a.rubrik_ai.includes('(')) ? `<div class="bg-purple-50 border border-purple-200 rounded-lg p-2 text-[11px] font-bold text-purple-900 mb-3"><strong>Rubrik Penilaian:</strong> ${escapeHtml(a.rubrik_ai)}</div>` : ''}
                    </div>
                    <div class="pt-3 border-t-2 border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                        <span class="text-xs font-black text-slate-800 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-xl">
                            ${matchingSubs.length} Siswa (${gradedCount} Dinilai)
                        </span>
                        <div class="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                            <button type="button" onclick="editAssignment('${a.id}')" class="h-9 px-3 bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition flex items-center justify-center text-center">
                                ${tipePengumpulan === 'form' ? 'Edit Soal' : 'Edit Tugas'}
                            </button>
                            ${tipePengumpulan === 'form' ? `
                                <button type="button" onclick="addQuestionToExistingAssignment('${a.id}')" class="h-9 px-3 bg-cyan-300 hover:bg-cyan-400 text-black border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition flex items-center justify-center text-center">
                                    Tambah Soal
                                </button>
                            ` : ''}
                            <button type="button" onclick="openAssignmentSubmissionsModal('${a.id}')" class="h-9 px-3.5 bg-emerald-400 hover:bg-emerald-500 text-black border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition flex items-center justify-center text-center col-span-2 sm:col-span-1">
                                Periksa (${matchingSubs.length})
                            </button>
                            <button type="button" onclick="deleteAssignment('${a.id}')" class="h-9 px-3 bg-rose-100 hover:bg-rose-200 text-rose-800 border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition flex items-center justify-center text-center col-span-2 sm:col-span-1">
                                Hapus
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        } catch (e) {
            container.innerHTML = `<div class="col-span-2 text-center text-red-600 font-bold">Gagal memuat tugas: ${e.message}</div>`;
        }
    }

    // Modal Hasil Pengumpulan Per Tugas (LMS)
    window.openAssignmentSubmissionsModal = (assignId) => {
        const a = assignmentsList.find(item => String(item.id) === String(assignId));
        if (!a) {
            showCustomModal("Penugasan tidak ditemukan.");
            return;
        }
        activeAssignmentForSubmissions = a;

        const titleEl = document.getElementById('assign-sub-modal-title');
        const metaEl = document.getElementById('assign-sub-modal-meta');
        const descEl = document.getElementById('assign-sub-modal-desc');
        const rubrikEl = document.getElementById('assign-sub-modal-rubrik');

        if (titleEl) titleEl.textContent = a.judul_tugas;
        if (metaEl) {
            const dlText = a.deadline ? new Date(a.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Tanpa Batas Waktu';
            metaEl.textContent = `Kelas: ${a.kelas} • Mapel: ${a.mapel} • Tenggat: ${dlText}`;
        }
        if (descEl) {
            let petunjukText = a.deskripsi || 'Tidak ada petunjuk khusus.';
            let metaSoal = '';
            if (a.deskripsi && (a.deskripsi.trim().startsWith('{') || a.deskripsi.trim().startsWith('['))) {
                try {
                    const parsed = JSON.parse(a.deskripsi);
                    if (parsed.petunjuk) petunjukText = parsed.petunjuk;
                    if (Array.isArray(parsed.questions)) {
                        const totalBobot = parsed.questions.reduce((sum, q) => sum + (Number(q.bobot) || 0), 0);
                        metaSoal = `\n\n📌 Format: Formulir Kuis Online • ${parsed.questions.length} Butir Soal • Akumulasi Bobot: ${totalBobot} Poin`;
                    }
                } catch (_) {}
            }
            descEl.textContent = petunjukText + metaSoal;
        }
        if (rubrikEl) {
            if (a.rubrik_ai && !a.rubrik_ai.includes('Soal #') && !a.rubrik_ai.includes('(')) {
                rubrikEl.innerHTML = `<strong>Rubrik Penilaian:</strong> ${escapeHtml(a.rubrik_ai)}`;
                rubrikEl.classList.remove('hidden');
            } else {
                rubrikEl.classList.add('hidden');
            }
        }

        renderAssignmentSubmissionsTable(a);

        const modal = document.getElementById('assignment-submissions-modal');
        if (modal) modal.classList.remove('hidden');
    };

    function renderAssignmentSubmissionsTable(assignment) {
        const tbody = document.getElementById('assign-submissions-tbody');
        const countBadge = document.getElementById('assign-sub-count-badge');
        if (!tbody) return;

        const matchingSubs = pendingFiles.filter(f => 
            (f.assignment_id && String(f.assignment_id) === String(assignment.id)) ||
            (f.materi && f.materi.toLowerCase().trim() === assignment.judul_tugas.toLowerCase().trim())
        );

        if (countBadge) {
            const gradedCount = matchingSubs.filter(f => f.nilai !== null && f.nilai !== undefined && f.nilai !== '').length;
            countBadge.textContent = `${matchingSubs.length} Siswa Mengumpulkan (${gradedCount} Telah Dinilai)`;
        }

        tbody.innerHTML = '';
        if (matchingSubs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-slate-500 font-bold uppercase tracking-wider">
                        Belum ada siswa yang mengumpulkan tugas ini.
                    </td>
                </tr>
            `;
            return;
        }

        matchingSubs.forEach((f) => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50 transition-colors";

            const isForm = isFormSubmission(f);
            const isText = isTextSubmission(f);
            const isLink = isLinkSubmission(f);
            let detailHtml = '';
            let formItems = [];
            let hasEssay = false;

            if (isForm) {
                try {
                    formItems = JSON.parse(f.storage_path.replace(/^FORM:/, ''));
                    hasEssay = formItems.some(q => ['esai', 'upload_foto'].includes(q.tipe));
                } catch (_) {}
                const qCount = formItems.length || 0;
                detailHtml = `
                    <div class="inline-flex items-center gap-1.5 py-1">
                        <span class="inline-flex items-center bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-300 uppercase">
                            Form Web
                        </span>
                        <span class="text-xs font-bold text-slate-700">${qCount} Soal Terjawab</span>
                    </div>
                `;
            } else if (isText) {
                const textSnippet = getTextContent(f);
                detailHtml = `
                    <div class="space-y-1 py-1 max-w-xs md:max-w-sm">
                        <span class="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded border border-amber-300 uppercase">
                            Teks Jawaban
                        </span>
                        <p class="text-xs text-slate-700 italic bg-amber-50/70 p-2 rounded-lg border border-amber-200 line-clamp-3">
                            ${escapeHtml(textSnippet)}
                        </p>
                    </div>
                `;
            } else if (isLink) {
                const url = getLinkUrl(f);
                detailHtml = `
                    <div class="space-y-1 py-1 max-w-xs">
                        <span class="inline-flex items-center gap-1 bg-purple-100 text-purple-900 text-[10px] font-black px-2 py-0.5 rounded border border-purple-300 uppercase">
                            Link Online
                        </span>
                        <a href="${url}" target="_blank" class="text-indigo-600 font-bold text-xs underline block truncate" title="${url}">
                            ${url} ↗
                        </a>
                    </div>
                `;
            } else {
                const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(f.storage_path);
                const fileUrl = publicUrlData.publicUrl;
                detailHtml = `
                    <div class="flex items-center gap-2 py-1">
                        <span class="inline-flex items-center gap-1 bg-blue-100 text-blue-900 text-[10px] font-black px-2 py-0.5 rounded border border-blue-300 uppercase">
                            Berkas
                        </span>
                        <a href="${fileUrl}" target="_blank" class="text-indigo-700 font-bold text-xs underline truncate max-w-[180px]" title="${escapeHtml(f.filename)}">
                            ${escapeHtml(f.filename)} ↗
                        </a>
                    </div>
                `;
            }

            let statusHtml = '';
            if (f.status_koreksi === 'sudah_dikoreksi' && f.nilai !== null && f.nilai !== undefined && f.nilai !== '') {
                statusHtml = `
                    <div class="flex flex-col items-center gap-1">
                        <span class="inline-block bg-emerald-100 text-emerald-950 font-black text-sm px-3 py-1 rounded-xl border border-emerald-400">
                            ${f.nilai}/100
                        </span>
                        <span class="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Tuntas Dinilai</span>
                        ${f.catatan_guru ? `<span class="text-[10px] text-slate-600 line-clamp-1 italic max-w-[140px]" title="${escapeHtml(f.catatan_guru)}">"${escapeHtml(f.catatan_guru)}"</span>` : ''}
                    </div>
                `;
            } else if (isForm && hasEssay && f.status_koreksi !== 'sudah_dikoreksi') {
                statusHtml = `
                    <div class="flex flex-col items-center gap-1">
                        <span class="inline-block bg-amber-100 text-amber-950 font-black text-xs px-2.5 py-1 rounded-xl border border-amber-400">
                            Objektif: ${f.nilai !== null && f.nilai !== undefined && f.nilai !== '' ? f.nilai : 0}/100
                        </span>
                        <span class="text-[9px] font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded uppercase">Perlu Koreksi Esai</span>
                    </div>
                `;
            } else if (f.nilai !== null && f.nilai !== undefined && f.nilai !== '') {
                statusHtml = `
                    <div class="flex flex-col items-center gap-1">
                        <span class="inline-block bg-emerald-100 text-emerald-950 font-black text-sm px-3 py-1 rounded-xl border border-emerald-400">
                            ${f.nilai}/100
                        </span>
                        ${f.catatan_guru ? `<span class="text-[10px] text-slate-600 line-clamp-1 italic max-w-[140px]" title="${escapeHtml(f.catatan_guru)}">"${escapeHtml(f.catatan_guru)}"</span>` : ''}
                    </div>
                `;
            } else {
                statusHtml = `
                    <div class="text-center">
                        <span class="inline-block bg-amber-100 text-amber-900 font-bold text-[11px] px-2.5 py-1 rounded-lg border border-amber-300 uppercase">
                            Belum Dinilai
                        </span>
                    </div>
                `;
            }

            const dateStr = f.created_at ? new Date(f.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';

            tr.innerHTML = `
                <td class="px-4 py-3 font-black text-slate-900 border-b-2 border-black border-r-2 text-xs">
                    <div>${escapeHtml(f.nama)}</div>
                    <div class="text-[10px] text-slate-500 font-medium">Dikirim: ${dateStr} WIB</div>
                </td>
                <td class="px-4 py-3 font-bold text-black border-b-2 border-black border-r-2 text-xs">${escapeHtml(f.kelas)}</td>
                <td class="px-4 py-3 border-b-2 border-black border-r-2">${detailHtml}</td>
                <td class="px-4 py-3 border-b-2 border-black border-r-2 text-center">${statusHtml}</td>
                <td class="px-4 py-3 border-b-2 border-black text-center whitespace-nowrap">
                    <button onclick="openGradeModal('${f.id}')" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-black text-white font-black text-xs uppercase rounded-xl border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition">
                        Koreksi & Nilai </button>
                </td>
            `;

            tbody.appendChild(tr);
        });
    }

    window.closeAssignmentSubmissionsModal = () => {
        const modal = document.getElementById('assignment-submissions-modal');
        if (modal) modal.classList.add('hidden');
        activeAssignmentForSubmissions = null;
    };

    window.printCurrentAssignmentReport = () => {
        if (!activeAssignmentForSubmissions) {
            showCustomModal("Pilih tugas terlebih dahulu sebelum mencetak rekap.");
            return;
        }

        const a = activeAssignmentForSubmissions;
        const matchingSubs = pendingFiles.filter(f => 
            (f.assignment_id && String(f.assignment_id) === String(a.id)) ||
            (f.materi && f.materi.toLowerCase().trim() === a.judul_tugas.toLowerCase().trim())
        );

        if (matchingSubs.length === 0) {
            showCustomModal("Belum ada data pengumpulan siswa untuk tugas ini.");
            return;
        }

        const mapel = a.mapel || currentTeacher?.mapel || 'Informatika';
        const teacherName = currentTeacher?.name || currentSession?.user?.email || 'Guru Pengampu';
        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        const graded = matchingSubs.filter(f => f.nilai !== null && f.nilai !== undefined && f.nilai !== '');
        const avg = graded.length > 0 ? (graded.reduce((acc, f) => acc + Number(f.nilai), 0) / graded.length).toFixed(1) : 0;

        let rowsHtml = '';
        matchingSubs.forEach((f, idx) => {
            const isText = isTextSubmission(f);
            const isLink = isLinkSubmission(f);
            const tipeStr = isText ? "Form Web" : (isLink ? "Tautan Link" : "Berkas File");
            const scoreVal = f.nilai !== null && f.nilai !== undefined && f.nilai !== '' ? f.nilai : '-';
            const statusStr = scoreVal !== '-' ? 'Tuntas' : 'Belum Dinilai';

            rowsHtml += `
                <tr>
                    <td style="border: 1px solid black; padding: 6px; text-align: center;">${idx + 1}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: center; font-weight: bold;">${escapeHtml(f.kelas)}</td>
                    <td style="border: 1px solid black; padding: 6px; font-weight: bold;">${escapeHtml(f.nama)}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: center;">${tipeStr}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: center; font-weight: bold; font-size: 13px;">${scoreVal}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: center;">${statusStr}</td>
                    <td style="border: 1px solid black; padding: 6px; font-size: 11px;">${escapeHtml(f.catatan_guru || f.ai_feedback || '-')}</td>
                </tr>
            `;
        });

        const printWin = window.open('', '_blank');
        printWin.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Rekap Penugasan: ${escapeHtml(a.judul_tugas)} - SMPN 58 Palembang</title>
                <style>
                    body { font-family: 'Times New Roman', Times, serif; padding: 25px; color: #000; }
                    .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 16px; }
                    .kop h2 { margin: 0; font-size: 17px; text-transform: uppercase; font-weight: bold; }
                    .kop h1 { margin: 3px 0; font-size: 21px; text-transform: uppercase; font-weight: 900; }
                    .kop p { margin: 1px 0; font-size: 12px; }
                    .title { text-align: center; font-size: 15px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; }
                    .meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th { border: 1px solid black; padding: 6px; background-color: #f2f2f2; text-transform: uppercase; }
                    .stats { margin-top: 12px; font-size: 12px; font-weight: bold; }
                    .footer-sig { margin-top: 35px; display: flex; justify-content: flex-end; text-align: center; font-size: 12px; }
                    .sig-box { width: 220px; }
                    @media print {
                        @page { size: portrait; margin: 12mm; }
                    }
                </style>
            </head>
            <body>
                <div class="kop">
                    <h2>Pemerintah Kota Palembang &bull; Dinas Pendidikan</h2>
                    <h1>SMP NEGERI 58 PALEMBANG</h1>
                    <p>Jl. Macan Lindungan, Kec. Ilir Barat I, Kota Palembang, Sumatera Selatan</p>
                    <p>Portal Belajar & Sistem Asesmen Digital Siswa</p>
                </div>
                <div class="title">REKAPITULASI PENILAIAN TUGAS: ${escapeHtml(a.judul_tugas.toUpperCase())}</div>
                <div class="meta">
                    <div>
                        <strong>Mata Pelajaran:</strong> ${escapeHtml(mapel)}<br>
                        <strong>Sasaran Kelas:</strong> ${escapeHtml(a.kelas)}<br>
                        <strong>Tahun Ajaran:</strong> 2026/2027
                    </div>
                    <div style="text-align: right;">
                        <strong>Tanggal Cetak:</strong> ${dateStr}<br>
                        <strong>Total Pengumpulan:</strong> ${matchingSubs.length} Siswa
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 25px;">No</th>
                            <th style="width: 55px;">Kelas</th>
                            <th>Nama Lengkap Siswa</th>
                            <th style="width: 85px;">Metode</th>
                            <th style="width: 50px;">Nilai</th>
                            <th style="width: 75px;">Status</th>
                            <th>Catatan Guru / Evaluasi AI</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
                <div class="stats">
                    Rata-Rata Nilai: ${avg} / 100 (${graded.length} dari ${matchingSubs.length} siswa telah dinilai)
                </div>
                <div class="footer-sig">
                    <div class="sig-box">
                        <p>Palembang, ${dateStr}<br>Guru Mata Pelajaran,</p>
                        <br><br><br>
                        <p style="font-weight: bold; text-decoration: underline;">${escapeHtml(teacherName)}</p>
                        <p style="margin-top: -6px; font-size: 10px;">Guru Pengampu / NIP. -</p>
                    </div>
                </div>
                <script>
                    window.onload = function() { window.print(); };
                <\/script>
            </body>
            </html>
        `);
        printWin.document.close();
    };

    // ==========================================
    // 3. Modul Kelola Penugasan Siswa
    // ==========================================
    // ==========================================
    // 3. Modul Kelola Penugasan Siswa
    // ==========================================
    window.onAssignTipePengumpulanChange = (type) => {
        const section = document.getElementById('assign-form-builder-section');
        const notice = document.getElementById('assign-non-form-notice');
        const badge = document.getElementById('assign-notice-badge');
        const title = document.getElementById('assign-notice-title');
        const desc = document.getElementById('assign-notice-desc');

        if (type === 'form') {
            if (section) section.classList.remove('hidden');
            if (notice) notice.classList.add('hidden');
        } else {
            if (section) section.classList.add('hidden');
            if (notice) notice.classList.remove('hidden');

            if (type === 'link') {
                if (badge) { badge.textContent = 'Khusus Tautan Link'; badge.className = 'px-2.5 py-1 rounded-lg bg-pink-600 text-white font-black text-[10px] uppercase border border-black'; }
                if (title) title.textContent = 'Siswa Mengumpulkan Berupa Tautan Link URL';
                if (desc) desc.textContent = 'Siswa akan langsung diarahkan ke form input tautan link (Instagram Reels, TikTok, YouTube, presentasi Canva, atau Google Drive) dengan deteksi platform otomatis. Anda tidak perlu menyusun butir soal per nomor.';
            } else if (type === 'file') {
                if (badge) { badge.textContent = 'Khusus Unggah Berkas'; badge.className = 'px-2.5 py-1 rounded-lg bg-amber-600 text-white font-black text-[10px] uppercase border border-black'; }
                if (title) title.textContent = 'Siswa Mengumpulkan Berupa File Dokumen / Foto';
                if (desc) desc.textContent = 'Siswa akan langsung diarahkan ke kotak dropzone upload berkas untuk mengunggah dokumen PDF, Word, Excel, ataupun foto bukti praktik. Anda tidak perlu menyusun butir soal per nomor.';
            } else if (type === 'text') {
                if (badge) { badge.textContent = 'Khusus Teks Web'; badge.className = 'px-2.5 py-1 rounded-lg bg-blue-600 text-white font-black text-[10px] uppercase border border-black'; }
                if (title) title.textContent = 'Siswa Mengumpulkan Berupa Teks / Esai Terbuka di Browser';
                if (desc) desc.textContent = 'Siswa akan langsung diberikan lembar pengetikan online di browser untuk mengetik resume, jawaban esai terbuka, atau laporan mandiri. Anda tidak perlu menyusun butir soal per nomor.';
            } else {
                // 'bebas'
                if (badge) { badge.textContent = 'Bebas / Fleksibel'; badge.className = 'px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-black text-[10px] uppercase border border-black'; }
                if (title) title.textContent = 'Siswa Bebas Memilih Metode Pengumpulan';
                if (desc) desc.textContent = 'Siswa dapat bebas memilih salah satu dari 3 cara pengumpulan yang paling sesuai: Mengetik Form Web, Mengunggah Berkas (PDF/Foto), atau Menyisipkan Tautan Link URL.';
            }
        }
    };

    window.openAssignmentModal = (assignment = null) => {
        editingAssignmentId = assignment ? assignment.id : null;

        const titleEl = document.getElementById('assignment-modal-title');
        if (titleEl) {
            titleEl.innerText = assignment ? "Kelola & Edit Formulir Tugas" : "Buat Penugasan Siswa Baru";
        }
        const saveBtnText = document.getElementById('btn-save-assignment-text');
        if (saveBtnText) {
            saveBtnText.innerText = assignment ? "SIMPAN PERUBAHAN TUGAS" : "PUBLIKASIKAN TUGAS KE SISWA";
        }

        const kelasSelect = document.getElementById('assign-kelas');
        populateTargetClassSelect(kelasSelect, assignment ? assignment.kelas : 'Semua Kelas');

        const mapelSelect = document.getElementById('assign-mapel');
        if (mapelSelect) {
            mapelSelect.value = assignment ? (assignment.mapel || 'Informatika') : (currentTeacher?.mapel || 'Informatika');
        }

        const tipeSelect = document.getElementById('assign-tipe-pengumpulan');

        if (assignment) {
            document.getElementById('assign-judul').value = assignment.judul_tugas || '';
            document.getElementById('assign-deadline').value = assignment.deadline ? assignment.deadline.slice(0, 16) : '';
            const parsed = parseAssignmentQuestions(assignment);
            document.getElementById('assign-deskripsi').value = parsed.petunjuk || '';
            if (tipeSelect) {
                tipeSelect.value = parsed.tipe_pengumpulan || 'bebas';
            }
            formBuilderQuestions = parsed.questions && parsed.questions.length > 0 ? parsed.questions : [
                { id: 1, tipe: 'esai', pertanyaan: '', kunci: '', bobot: 25 }
            ];
            window.onAssignTipePengumpulanChange(tipeSelect ? tipeSelect.value : 'bebas');
        } else {
            document.getElementById('assign-judul').value = '';
            document.getElementById('assign-deskripsi').value = 'Jawablah setiap instruksi tugas berikut dengan teliti dan jujur.';
            document.getElementById('assign-deadline').value = '';
            if (tipeSelect) {
                tipeSelect.value = 'bebas';
            }
            formBuilderQuestions = [
                { id: 1, tipe: 'esai', pertanyaan: '', kunci: '', bobot: 25 },
                { id: 2, tipe: 'pg', pertanyaan: '', opsi_a: '', opsi_b: '', opsi_c: '', opsi_d: '', kunci: 'A', bobot: 25 }
            ];
            window.onAssignTipePengumpulanChange('bebas');
        }

        renderFormBuilderQuestions();
        document.getElementById('assignment-modal').classList.remove('hidden');
    };

    window.editAssignment = (id) => {
        const a = assignmentsList.find(item => String(item.id) === String(id));
        if (!a) {
            showCustomModal("Penugasan tidak ditemukan!");
            return;
        }
        openAssignmentModal(a);
    };

    window.addQuestionToExistingAssignment = (id) => {
        const a = assignmentsList.find(item => String(item.id) === String(id));
        if (!a) {
            showCustomModal("Penugasan tidak ditemukan!");
            return;
        }
        openAssignmentModal(a);
        window.addFormQuestionItem('esai');
        setTimeout(() => {
            const list = document.getElementById('form-builder-questions-list');
            if (list && list.lastElementChild) {
                list.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const input = list.lastElementChild.querySelector('textarea, input');
                if (input) input.focus();
            }
        }, 200);
    };

    window.closeAssignmentModal = () => {
        document.getElementById('assignment-modal').classList.add('hidden');
        editingAssignmentId = null;
    };

    window.renderFormBuilderQuestions = () => {
        const totalCountEl = document.getElementById('form-total-soal');
        const totalBobotEl = document.getElementById('form-total-bobot');
        const list = document.getElementById('form-builder-questions-list');
        if (!list) return;

        let totalBobot = 0;
        formBuilderQuestions.forEach(q => { totalBobot += Number(q.bobot) || 0; });

        if (totalCountEl) totalCountEl.innerText = formBuilderQuestions.length;
        if (totalBobotEl) totalBobotEl.innerText = totalBobot;

        if (formBuilderQuestions.length === 0) {
            list.innerHTML = `
                <div class="p-6 text-center text-xs font-bold text-slate-500 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl">
                    Belum ada butir pertanyaan pada form ini. Klik tombol di atas untuk menambah soal Esai, Pilihan Ganda, Benar/Salah, Upload Foto, Menjodohkan, atau minta AI membuatkan otomatis.
                </div>
            `;
            return;
        }

        list.innerHTML = formBuilderQuestions.map((q, idx) => {
            const { text: cleanPertanyaan, gambar_url: parsedImg } = splitQuestionImage(q.pertanyaan || '');
            if (!q.gambar_url && parsedImg) {
                q.gambar_url = parsedImg;
                q.pertanyaan = cleanPertanyaan;
            }

            const tipe = q.tipe || 'esai';
            const isPg = tipe === 'pg';
            const isPgKompleks = tipe === 'pg_kompleks';
            const isSingkat = tipe === 'singkat';
            const isBs = tipe === 'benar_salah';
            const isFoto = tipe === 'upload_foto';
            const isLink = tipe === 'link';
            const isMatch = tipe === 'menjodohkan';

            return `
                <div class="border-2 border-black rounded-2xl p-4 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
                    <div class="flex items-center justify-between border-b-2 border-slate-200 pb-2.5 flex-wrap gap-2">
                        <div class="flex items-center gap-2">
                            <span class="w-7 h-7 rounded-lg bg-black text-white font-black text-xs flex items-center justify-center">
                                ${idx + 1}
                            </span>
                            <select onchange="window.changeFormQuestionType(${idx}, this.value)" class="h-8 px-2 border-2 border-black rounded-lg font-black text-xs bg-slate-50 cursor-pointer">
                                <option value="esai" ${tipe === 'esai' ? 'selected' : ''}>Esai / Uraian</option>
                                <option value="pg" ${isPg ? 'selected' : ''}>Pilihan Ganda (PG)</option>
                                <option value="pg_kompleks" ${isPgKompleks ? 'selected' : ''}>Pilihan Ganda Kompleks</option>
                                <option value="singkat" ${isSingkat ? 'selected' : ''}>Isian Singkat</option>
                                <option value="benar_salah" ${isBs ? 'selected' : ''}>Benar / Salah</option>
                                <option value="link" ${isLink ? 'selected' : ''}>Tautan Link URL (Sosmed/Drive/Canva)</option>
                                <option value="upload_foto" ${isFoto ? 'selected' : ''}>Upload Foto / Bukti</option>
                                <option value="menjodohkan" ${isMatch ? 'selected' : ''}>Menjodohkan Konsep</option>
                            </select>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="flex items-center gap-1.5">
                                <label class="text-[11px] font-black uppercase text-slate-600">Bobot Poin:</label>
                                <input type="number" min="1" max="100" value="${q.bobot || 25}" oninput="window.updateFormQuestionField(${idx}, 'bobot', this.value)" class="w-14 h-8 px-1.5 border-2 border-black rounded-lg font-black text-xs text-center bg-slate-50">
                            </div>
                            <button type="button" onclick="window.deleteFormQuestionItem(${idx})" title="Hapus Soal" class="w-8 h-8 rounded-lg border-2 border-red-500 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center font-black transition">
                                &times;
                            </button>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-black uppercase text-black mb-1.5">Pertanyaan / Instruksi Soal #${idx + 1}</label>
                        <textarea rows="5" placeholder="Tuliskan pertanyaan atau instruksi soal di sini..." oninput="window.updateFormQuestionField(${idx}, 'pertanyaan', this.value)" class="w-full min-h-[125px] p-3.5 border-2 border-black rounded-xl font-medium text-sm text-slate-900 bg-slate-50 focus:bg-white leading-relaxed resize-y shadow-inner">${escapeHtml(cleanPertanyaan)}</textarea>
                    </div>

                    <!-- Lampiran Stimulus Gambar Soal -->
                    <div class="p-2.5 rounded-xl border border-dashed border-slate-400 bg-slate-50/80 space-y-2">
                        <div class="flex items-center justify-between flex-wrap gap-2">
                            <span class="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                                <span></span> Lampiran Gambar Soal (Stimulus / Ilustrasi / Diagram)
                            </span>
                            ${q.gambar_url ? `
                                <button type="button" onclick="window.removeQuestionImage(${idx}, 'form')" class="text-[10px] font-black uppercase text-red-600 bg-red-100 hover:bg-red-200 px-2 py-0.5 rounded border border-red-300 transition">
                                    Hapus Gambar
                                </button>
                            ` : ''}
                        </div>

                        ${q.gambar_url ? `
                            <div class="flex items-center gap-3 bg-white p-2 rounded-lg border border-black">
                                <img src="${escapeHtml(q.gambar_url)}" alt="Preview Gambar Soal" class="h-16 w-20 object-contain rounded border border-slate-300 bg-slate-50 shrink-0" />
                                <div class="flex-1 min-w-0">
                                    <a href="${escapeHtml(q.gambar_url)}" target="_blank" class="text-xs font-bold text-indigo-700 hover:underline truncate block">
                                        ${escapeHtml(q.gambar_url)}
                                    </a>
                                    <span class="text-[10px] text-emerald-700 font-bold">Gambar aktif terpasang pada butir soal ini</span>
                                </div>
                            </div>
                        ` : `
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                                <div>
                                    <input type="file" id="form_img_file_${idx}" accept="image/*" class="hidden" onchange="window.handleQuestionImageUpload(event, ${idx}, 'form')">
                                    <button type="button" onclick="document.getElementById('form_img_file_${idx}').click()" class="w-full h-9 px-2.5 bg-white hover:bg-slate-100 border border-black rounded-lg text-xs font-black text-slate-800 flex items-center justify-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition">
                                        Pilih Gambar dari Komputer
                                    </button>
                                </div>
                                <div class="flex items-center gap-1.5">
                                    <input type="url" placeholder="Atau tempel URL gambar (https://...)" value="${escapeHtml(q.gambar_url || '')}" oninput="window.updateQuestionImage(${idx}, this.value, 'form')" class="w-full h-9 px-2.5 border border-black rounded-lg text-xs font-medium bg-white">
                                </div>
                            </div>
                        `}
                    </div>

                    ${isPg ? `
                        <div class="space-y-2 pt-1">
                            <label class="block text-xs font-black uppercase text-black">Opsi Pilihan Jawaban & Kunci</label>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div class="flex items-center gap-2">
                                    <span class="w-6 text-center font-black text-sm text-slate-700">A</span>
                                    <input type="text" placeholder="Teks opsi A..." value="${escapeHtml(q.opsi_a || '')}" oninput="window.updateFormQuestionField(${idx}, 'opsi_a', this.value)" class="flex-1 h-10 px-3 border-2 border-black rounded-lg font-medium text-sm bg-slate-50 text-slate-900">
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="w-6 text-center font-black text-sm text-slate-700">B</span>
                                    <input type="text" placeholder="Teks opsi B..." value="${escapeHtml(q.opsi_b || '')}" oninput="window.updateFormQuestionField(${idx}, 'opsi_b', this.value)" class="flex-1 h-10 px-3 border-2 border-black rounded-lg font-medium text-sm bg-slate-50 text-slate-900">
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="w-6 text-center font-black text-sm text-slate-700">C</span>
                                    <input type="text" placeholder="Teks opsi C..." value="${escapeHtml(q.opsi_c || '')}" oninput="window.updateFormQuestionField(${idx}, 'opsi_c', this.value)" class="flex-1 h-10 px-3 border-2 border-black rounded-lg font-medium text-sm bg-slate-50 text-slate-900">
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="w-6 text-center font-black text-sm text-slate-700">D</span>
                                    <input type="text" placeholder="Teks opsi D..." value="${escapeHtml(q.opsi_d || '')}" oninput="window.updateFormQuestionField(${idx}, 'opsi_d', this.value)" class="flex-1 h-10 px-3 border-2 border-black rounded-lg font-medium text-sm bg-slate-50 text-slate-900">
                                </div>
                            </div>
                            <div class="flex items-center gap-2 pt-1">
                                <label class="text-xs font-black uppercase text-black">Kunci Jawaban Benar:</label>
                                <select onchange="window.updateFormQuestionField(${idx}, 'kunci', this.value)" class="h-9 px-3 border-2 border-black rounded-lg font-black text-xs bg-yellow-200 text-black cursor-pointer">
                                    <option value="A" ${q.kunci === 'A' ? 'selected' : ''}>A</option>
                                    <option value="B" ${q.kunci === 'B' ? 'selected' : ''}>B</option>
                                    <option value="C" ${q.kunci === 'C' ? 'selected' : ''}>C</option>
                                    <option value="D" ${q.kunci === 'D' ? 'selected' : ''}>D</option>
                                </select>
                            </div>
                        </div>
                    ` : isPgKompleks ? `
                        <div class="space-y-2 pt-1">
                            <label class="block text-xs font-black uppercase text-black">Opsi Pilihan Ganda Kompleks & Kunci Jawaban</label>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div class="flex items-center gap-2">
                                    <span class="w-6 text-center font-black text-sm text-slate-700">A</span>
                                    <input type="text" placeholder="Teks opsi A..." value="${escapeHtml(q.opsi_a || '')}" oninput="window.updateFormQuestionField(${idx}, 'opsi_a', this.value)" class="flex-1 h-10 px-3 border-2 border-black rounded-lg font-medium text-sm bg-slate-50 text-slate-900">
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="w-6 text-center font-black text-sm text-slate-700">B</span>
                                    <input type="text" placeholder="Teks opsi B..." value="${escapeHtml(q.opsi_b || '')}" oninput="window.updateFormQuestionField(${idx}, 'opsi_b', this.value)" class="flex-1 h-10 px-3 border-2 border-black rounded-lg font-medium text-sm bg-slate-50 text-slate-900">
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="w-6 text-center font-black text-sm text-slate-700">C</span>
                                    <input type="text" placeholder="Teks opsi C..." value="${escapeHtml(q.opsi_c || '')}" oninput="window.updateFormQuestionField(${idx}, 'opsi_c', this.value)" class="flex-1 h-10 px-3 border-2 border-black rounded-lg font-medium text-sm bg-slate-50 text-slate-900">
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="w-6 text-center font-black text-sm text-slate-700">D</span>
                                    <input type="text" placeholder="Teks opsi D..." value="${escapeHtml(q.opsi_d || '')}" oninput="window.updateFormQuestionField(${idx}, 'opsi_d', this.value)" class="flex-1 h-10 px-3 border-2 border-black rounded-lg font-medium text-sm bg-slate-50 text-slate-900">
                                </div>
                            </div>
                            <div class="flex items-center gap-2 pt-1">
                                <label class="text-xs font-black uppercase text-black">Kunci Benar (Pisahkan Koma):</label>
                                <input type="text" placeholder="Contoh: A,C atau B,D" value="${escapeHtml(q.kunci || '')}" oninput="window.updateFormQuestionField(${idx}, 'kunci', this.value.toUpperCase())" class="h-9 px-3 border-2 border-black rounded-lg font-black text-xs bg-cyan-100 text-cyan-950 uppercase">
                            </div>
                        </div>
                    ` : isBs ? `
                        <div class="space-y-2 pt-1">
                            <label class="block text-xs font-black uppercase text-black">Kunci Jawaban Benar / Salah:</label>
                            <div class="flex items-center gap-3">
                                <select onchange="window.updateFormQuestionField(${idx}, 'kunci', this.value)" class="h-10 px-3.5 border-2 border-black rounded-xl font-black text-xs bg-teal-100 text-teal-950 cursor-pointer">
                                    <option value="BENAR" ${String(q.kunci).toUpperCase() === 'BENAR' ? 'selected' : ''}>BENAR (Pernyataan Sesuai)</option>
                                    <option value="SALAH" ${String(q.kunci).toUpperCase() === 'SALAH' ? 'selected' : ''}>SALAH (Pernyataan Keliru)</option>
                                </select>
                            </div>
                        </div>
                    ` : isFoto ? `
                        <div class="space-y-2 pt-1">
                            <div class="bg-orange-50 border-2 border-orange-200 rounded-xl p-3 text-xs text-orange-950">
                                <span class="font-black uppercase text-[10px] block mb-1">Format Soal Pengunggahan Berkas / Foto:</span>
                                <p class="text-[11px] font-medium leading-relaxed">Siswa akan diberikan area dropzone unggah foto/dokumen hasil pekerjaan langsung di formulir.</p>
                            </div>
                            <div>
                                <label class="block text-xs font-black uppercase text-purple-950 mb-1.5">Kriteria Foto yang Diharapkan (Acuan Penilaian AI & Guru)</label>
                                <input type="text" placeholder="Contoh: Foto catatan tulisan tangan yang rapi dan terbaca, atau screenshot praktik coding..." value="${escapeHtml(q.kunci || '')}" oninput="window.updateFormQuestionField(${idx}, 'kunci', this.value)" class="w-full h-10 px-3.5 border-2 border-purple-300 rounded-xl font-bold text-sm bg-purple-50 focus:bg-white text-purple-950">
                            </div>
                        </div>
                    ` : isLink ? `
                        <div class="space-y-2 pt-1">
                            <div class="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-3 text-xs text-indigo-950">
                                <span class="font-black uppercase text-[10px] block mb-1">Format Soal Pengumpulan Tautan Link:</span>
                                <p class="text-[11px] font-medium leading-relaxed">Siswa akan diberikan kolom input khusus untuk menempelkan tautan link (misal: Instagram Reels, TikTok, YouTube, presentasi Canva, Google Drive, atau portofolio praktik).</p>
                            </div>
                            <div>
                                <label class="block text-xs font-black uppercase text-purple-950 mb-1.5">Kriteria Tautan yang Diharapkan (Acuan Penilaian Guru & AI)</label>
                                <input type="text" placeholder="Contoh: Link video reels Instagram durasi 60 detik dengan hashtag #Informatika58..." value="${escapeHtml(q.kunci || '')}" oninput="window.updateFormQuestionField(${idx}, 'kunci', this.value)" class="w-full h-10 px-3.5 border-2 border-purple-300 rounded-xl font-bold text-sm bg-purple-50 focus:bg-white text-purple-950">
                            </div>
                        </div>
                    ` : isMatch ? `
                        <div class="space-y-2 pt-1">
                            <div class="flex items-center justify-between">
                                <label class="text-xs font-black uppercase text-black">Pasangan Premis & Jodoh Jawaban:</label>
                                <button type="button" onclick="window.addMatchingPair(${idx})" class="px-2.5 py-1 bg-pink-200 hover:bg-pink-300 border-2 border-black rounded-lg font-black text-[10px] uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition">
                                    Tambah Pasangan
                                </button>
                            </div>
                            <div class="space-y-2">
                                ${(q.pasangan || []).map((p, pIdx) => `
                                    <div class="flex items-center gap-2">
                                        <span class="w-5 text-center font-black text-xs text-slate-700">${pIdx + 1}</span>
                                        <input type="text" placeholder="Istilah / Premis (Kiri)..." value="${escapeHtml(p.kiri || '')}" oninput="window.updateMatchingPair(${idx}, ${pIdx}, 'kiri', this.value)" class="flex-1 h-9 px-3 border-2 border-black rounded-lg font-medium text-sm bg-slate-50 text-slate-900">
                                        <span class="font-black text-xs text-slate-500">&rarr;</span>
                                        <input type="text" placeholder="Pasangan / Definisi (Kanan)..." value="${escapeHtml(p.kanan || '')}" oninput="window.updateMatchingPair(${idx}, ${pIdx}, 'kanan', this.value)" class="flex-1 h-9 px-3 border-2 border-black rounded-lg font-medium text-sm bg-slate-50 text-slate-900">
                                        <button type="button" onclick="window.deleteMatchingPair(${idx}, ${pIdx})" title="Hapus Pasangan" class="w-7 h-7 rounded border border-red-400 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center font-black text-xs transition">
                                            &times;
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <div>
                            <label class="block text-xs font-black uppercase text-purple-950 mb-1.5">Kunci Jawaban / Panduan Evaluasi AI (Acuan Penilaian)</label>
                            <textarea rows="3" placeholder="Tuliskan kata kunci atau kriteria jawaban yang diharapkan siswa..." oninput="window.updateFormQuestionField(${idx}, 'kunci', this.value)" class="w-full min-h-[85px] p-3 border-2 border-purple-300 rounded-xl font-medium text-sm bg-purple-50 focus:bg-white text-purple-950 leading-relaxed resize-y">${escapeHtml(q.kunci || '')}</textarea>
                        </div>
                    `}
                </div>
            `;
        }).join('');
    };

    window.addMatchingPair = (qIdx) => {
        if (formBuilderQuestions[qIdx]) {
            if (!Array.isArray(formBuilderQuestions[qIdx].pasangan)) {
                formBuilderQuestions[qIdx].pasangan = [];
            }
            formBuilderQuestions[qIdx].pasangan.push({ kiri: '', kanan: '' });
            renderFormBuilderQuestions();
        }
    };

    window.deleteMatchingPair = (qIdx, pIdx) => {
        if (formBuilderQuestions[qIdx] && Array.isArray(formBuilderQuestions[qIdx].pasangan)) {
            if (formBuilderQuestions[qIdx].pasangan.length <= 1) {
                showCustomModal("Soal menjodohkan minimal memiliki 1 pasang premis!");
                return;
            }
            formBuilderQuestions[qIdx].pasangan.splice(pIdx, 1);
            renderFormBuilderQuestions();
        }
    };

    window.updateMatchingPair = (qIdx, pIdx, side, value) => {
        if (formBuilderQuestions[qIdx] && Array.isArray(formBuilderQuestions[qIdx].pasangan) && formBuilderQuestions[qIdx].pasangan[pIdx]) {
            formBuilderQuestions[qIdx].pasangan[pIdx][side] = value;
        }
    };

    window.addFormQuestionItem = (type = 'esai') => {
        const newItem = {
            id: Date.now() + Math.random(),
            tipe: type,
            pertanyaan: '',
            bobot: type === 'pg' || type === 'benar_salah' ? 15 : 25
        };
        if (type === 'pg') {
            newItem.opsi_a = '';
            newItem.opsi_b = '';
            newItem.opsi_c = '';
            newItem.opsi_d = '';
            newItem.kunci = 'A';
        } else if (type === 'benar_salah') {
            newItem.kunci = 'BENAR';
        } else if (type === 'upload_foto') {
            newItem.kunci = 'Foto lembar kerja atau tangkapan layar praktikum jelas dan lengkap';
        } else if (type === 'link') {
            newItem.kunci = 'Tautan link dapat diakses publik dan sesuai instruksi penugasan';
        } else if (type === 'menjodohkan') {
            newItem.pasangan = [
                { kiri: '', kanan: '' },
                { kiri: '', kanan: '' }
            ];
        } else {
            newItem.kunci = '';
        }
        formBuilderQuestions.push(newItem);
        renderFormBuilderQuestions();
    };

    window.deleteFormQuestionItem = (idx) => {
        if (formBuilderQuestions.length <= 1) {
            showCustomModal("Minimal form tugas harus memiliki 1 butir pertanyaan!");
            return;
        }
        formBuilderQuestions.splice(idx, 1);
        renderFormBuilderQuestions();
    };

    window.updateFormQuestionField = (idx, field, value) => {
        if (formBuilderQuestions[idx]) {
            formBuilderQuestions[idx][field] = value;
            if (field === 'bobot') {
                const totalBobotEl = document.getElementById('form-total-bobot');
                let totalBobot = 0;
                formBuilderQuestions.forEach(q => { totalBobot += Number(q.bobot) || 0; });
                if (totalBobotEl) totalBobotEl.innerText = totalBobot;
            }
        }
    };

    window.changeFormQuestionType = (idx, newType) => {
        if (formBuilderQuestions[idx]) {
            formBuilderQuestions[idx].tipe = newType;
            if (newType === 'pg' || newType === 'pg_kompleks') {
                if (!formBuilderQuestions[idx].kunci) {
                    formBuilderQuestions[idx].kunci = newType === 'pg' ? 'A' : 'A,B';
                }
                if (!formBuilderQuestions[idx].opsi_a) formBuilderQuestions[idx].opsi_a = '';
                if (!formBuilderQuestions[idx].opsi_b) formBuilderQuestions[idx].opsi_b = '';
                if (!formBuilderQuestions[idx].opsi_c) formBuilderQuestions[idx].opsi_c = '';
                if (!formBuilderQuestions[idx].opsi_d) formBuilderQuestions[idx].opsi_d = '';
            } else if (newType === 'benar_salah') {
                if (formBuilderQuestions[idx].kunci !== 'BENAR' && formBuilderQuestions[idx].kunci !== 'SALAH') {
                    formBuilderQuestions[idx].kunci = 'BENAR';
                }
            } else if (newType === 'menjodohkan') {
                if (!Array.isArray(formBuilderQuestions[idx].pasangan) || formBuilderQuestions[idx].pasangan.length === 0) {
                    formBuilderQuestions[idx].pasangan = [
                        { kiri: '', kanan: '' },
                        { kiri: '', kanan: '' }
                    ];
                }
            } else if (newType === 'upload_foto') {
                if (!formBuilderQuestions[idx].kunci) {
                    formBuilderQuestions[idx].kunci = 'Unggah foto lembar pekerjaan dengan jelas';
                }
            } else if (newType === 'link') {
                if (!formBuilderQuestions[idx].kunci) {
                    formBuilderQuestions[idx].kunci = 'Tautan link dapat diakses publik dan sesuai instruksi penugasan';
                }
            }
            renderFormBuilderQuestions();
        }
    };

    window.saveAssignment = async () => {
        const mapel = document.getElementById('assign-mapel')?.value || currentTeacher?.mapel || 'Informatika';
        const kelas = document.getElementById('assign-kelas')?.value || stateKelas[0] || 'Semua Kelas';
        const judul = document.getElementById('assign-judul').value.trim();
        const petunjuk = document.getElementById('assign-deskripsi').value.trim();
        const deadline = document.getElementById('assign-deadline').value;
        const tipePengumpulan = document.getElementById('assign-tipe-pengumpulan')?.value || 'bebas';

        if (!judul) {
            showCustomModal("Judul formulir tugas wajib diisi!");
            return;
        }

        if (tipePengumpulan === 'form') {
            if (formBuilderQuestions.length === 0) {
                showCustomModal("Form tugas model interaktif harus memiliki minimal 1 butir pertanyaan!");
                return;
            }

            for (let i = 0; i < formBuilderQuestions.length; i++) {
                if (!formBuilderQuestions[i].pertanyaan.trim()) {
                    showCustomModal(`Pertanyaan nomor ${i + 1} masih kosong. Mohon lengkapi teks pertanyaan.`);
                    return;
                }
            }
        }

        const btn = document.getElementById('btn-save-assignment');
        if (btn) {
            btn.disabled = true;
            btn.innerText = editingAssignmentId ? "Menyimpan Perubahan..." : "Menerbitkan Tugas...";
        }

        try {
            const payloadDeskripsi = JSON.stringify({
                tipe_pengumpulan: tipePengumpulan,
                petunjuk: petunjuk || 'Ikuti petunjuk pengerjaan tugas berikut dengan teliti.',
                questions: tipePengumpulan === 'form' ? formBuilderQuestions : []
            });

            const cleanRubrik = 'Kesesuaian pemahaman konsep materi, kelengkapan uraian nalar, dan ketepatan pengerjaan butir soal.';

            if (editingAssignmentId) {
                const { error } = await supabase.from('assignments').update({
                    mapel,
                    kelas,
                    judul_tugas: judul,
                    deskripsi: payloadDeskripsi,
                    rubrik_ai: cleanRubrik,
                    deadline: deadline || null,
                    guru_id: currentTeacher?.id || currentSession?.user?.id,
                    teacher_id: currentSession?.user?.id
                }).eq('id', editingAssignmentId);

                if (error) throw error;
                editingAssignmentId = null;
                closeAssignmentModal();
                loadAssignments();
                showCustomModal(`Tugas "${judul}" berhasil diperbarui!`);
            } else {
                const { error } = await supabase.from('assignments').insert([{
                    guru_id: currentTeacher?.id || currentSession?.user?.id,
                    mapel,
                    kelas,
                    judul_tugas: judul,
                    deskripsi: payloadDeskripsi,
                    rubrik_ai: cleanRubrik,
                    deadline: deadline || null
                }]);

                if (error) throw error;

                try {
                    await supabase.from('options').insert([{ type: 'materi', name: judul }]);
                } catch (_) {}

                closeAssignmentModal();
                loadAssignments();
                loadOptionsSettings();
                showCustomModal(`Tugas "${judul}" berhasil dipublikasikan untuk ${kelas}!`);
            }
        } catch (e) {
            showCustomModal("Gagal menyimpan tugas: " + e.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                const saveBtnText = document.getElementById('btn-save-assignment-text');
                if (saveBtnText) {
                    saveBtnText.innerText = editingAssignmentId ? "SIMPAN PERUBAHAN TUGAS" : "PUBLIKASIKAN TUGAS KE SISWA";
                }
            }
        }
    };

    window.deleteAssignment = async (id) => {
        const conf = await showCustomModal("Hapus penugasan ini?", "confirm");
        if (!conf) return;
        try {
            const isSuperadmin = currentTeacher?.role === 'superadmin';
            let delQuery = supabase.from('assignments').delete().eq('id', id);
            if (!isSuperadmin && currentTeacher?.id) {
                delQuery = delQuery.or(`guru_id.eq.${currentTeacher.id}`);
            }
            const { error } = await delQuery;
            if (error) throw error;
            loadAssignments();
        } catch (e) {
            showCustomModal("Gagal menghapus: " + e.message);
        }
    };

    window.toggleAiAssignCustomTotal = () => {
        const presetBox = document.getElementById('ai-assign-total-preset-box');
        const customBox = document.getElementById('ai-assign-total-custom-box');
        const customInput = document.getElementById('ai-assign-jumlah-custom');
        const select = document.getElementById('ai-assign-jumlah');
        if (!presetBox || !customBox) return;

        const isCustomVisible = !customBox.classList.contains('hidden');
        if (isCustomVisible) {
            customBox.classList.add('hidden');
            presetBox.classList.remove('hidden');
            if (select && select.value === 'custom') select.value = '4';
        } else {
            presetBox.classList.add('hidden');
            customBox.classList.remove('hidden');
            if (customInput) {
                if (!customInput.value && select && select.value !== 'custom') {
                    customInput.value = select.value;
                }
                customInput.focus();
            }
        }
    };

    window.cancelAiAssignCustomTotal = () => {
        const presetBox = document.getElementById('ai-assign-total-preset-box');
        const customBox = document.getElementById('ai-assign-total-custom-box');
        const select = document.getElementById('ai-assign-jumlah');
        if (customBox) customBox.classList.add('hidden');
        if (presetBox) presetBox.classList.remove('hidden');
        if (select && select.value === 'custom') select.value = '4';
    };

    window.onAiAssignTotalSelectChange = (sel) => {
        if (sel && sel.value === 'custom') {
            window.toggleAiAssignCustomTotal();
        }
    };

    window.onAiAssignTipeChange = (sel) => {
        const customBox = document.getElementById('ai-assign-custom-box');
        if (sel && sel.value === 'custom_komposisi') {
            if (customBox) customBox.classList.remove('hidden');
            window.updateAiAssignCustomTotal();
        } else {
            if (customBox) customBox.classList.add('hidden');
        }
    };

    window.updateAiAssignCustomTotal = () => {
        const pg = Number(document.getElementById('ai-assign-count-pg')?.value) || 0;
        const pgk = Number(document.getElementById('ai-assign-count-pgk')?.value) || 0;
        const bs = Number(document.getElementById('ai-assign-count-bs')?.value) || 0;
        const singkat = Number(document.getElementById('ai-assign-count-singkat')?.value) || 0;
        const jodoh = Number(document.getElementById('ai-assign-count-jodoh')?.value) || 0;
        const esai = Number(document.getElementById('ai-assign-count-esai')?.value) || 0;
        const total = pg + pgk + bs + singkat + jodoh + esai;

        const badge = document.getElementById('ai-assign-custom-badge');
        if (badge) badge.textContent = `Total: ${total} Soal`;

        const totalSelect = document.getElementById('ai-assign-jumlah');
        if (totalSelect) {
            const hasOption = Array.from(totalSelect.options).some(o => o.value === String(total));
            if (hasOption) {
                totalSelect.value = String(total);
            }
        }
    };

    window.openAiAssignmentModal = () => {
        const kelasSelect = document.getElementById('ai-assign-kelas');
        populateTargetClassSelect(kelasSelect, 'Semua Kelas');
        const mapelSelect = document.getElementById('ai-assign-mapel');
        if (mapelSelect && currentTeacher?.mapel) {
            mapelSelect.value = currentTeacher.mapel;
        }
        document.getElementById('ai-assign-topik').value = '';
        window.cancelAiAssignCustomTotal();
        const customInput = document.getElementById('ai-assign-jumlah-custom');
        if (customInput) customInput.value = '';
        const assignSelect = document.getElementById('ai-assign-jumlah');
        if (assignSelect) assignSelect.value = '4';

        const tipeSelect = document.getElementById('ai-assign-tipe');
        if (tipeSelect) tipeSelect.value = 'campuran';
        const customBox = document.getElementById('ai-assign-custom-box');
        if (customBox) customBox.classList.add('hidden');
        ['pg', 'pgk', 'bs', 'singkat', 'jodoh', 'esai'].forEach(k => {
            const el = document.getElementById(`ai-assign-count-${k}`);
            if (el) el.value = '0';
        });

        document.getElementById('ai-assignment-modal').classList.remove('hidden');
    };

    window.closeAiAssignmentModal = () => {
        document.getElementById('ai-assignment-modal').classList.add('hidden');
    };

    window.runAiGenerateAssignment = async () => {
        const mapel = document.getElementById('ai-assign-mapel')?.value || currentTeacher?.mapel || 'Informatika';
        const kelas = document.getElementById('ai-assign-kelas')?.value || stateKelas[0] || 'Semua Kelas';
        const tipeSoal = document.getElementById('ai-assign-tipe')?.value || 'campuran';

        let jumlah = 4;
        let customComposition = null;

        if (tipeSoal === 'custom_komposisi') {
            const pg = Number(document.getElementById('ai-assign-count-pg')?.value) || 0;
            const pgk = Number(document.getElementById('ai-assign-count-pgk')?.value) || 0;
            const bs = Number(document.getElementById('ai-assign-count-bs')?.value) || 0;
            const singkat = Number(document.getElementById('ai-assign-count-singkat')?.value) || 0;
            const jodoh = Number(document.getElementById('ai-assign-count-jodoh')?.value) || 0;
            const esai = Number(document.getElementById('ai-assign-count-esai')?.value) || 0;
            const sumCount = pg + pgk + bs + singkat + jodoh + esai;
            if (sumCount <= 0) {
                showCustomModal("Silakan masukkan minimal 1 butir soal pada rincian komposisi kustom!");
                return;
            }
            customComposition = { pg, pgk, bs, singkat, jodoh, esai };
            jumlah = sumCount;
        } else {
            const assignCustomBox = document.getElementById('ai-assign-total-custom-box');
            const assignCustomInput = document.getElementById('ai-assign-jumlah-custom');
            const assignSelect = document.getElementById('ai-assign-jumlah');

            if (assignCustomBox && !assignCustomBox.classList.contains('hidden') && assignCustomInput && assignCustomInput.value.trim() !== '') {
                jumlah = parseInt(assignCustomInput.value.trim(), 10);
            } else if (assignSelect && assignSelect.value === 'custom' && assignCustomInput && assignCustomInput.value.trim() !== '') {
                jumlah = parseInt(assignCustomInput.value.trim(), 10);
            } else if (assignSelect && assignSelect.value !== 'custom') {
                jumlah = parseInt(assignSelect.value, 10) || 4;
            }
        }

        if (isNaN(jumlah) || jumlah < 1) {
            showCustomModal("Jumlah butir pertanyaan minimal 1 butir.");
            return;
        }
        if (jumlah > 50) {
            showCustomModal("Jumlah butir pertanyaan maksimal 50 butir.");
            return;
        }

        const tingkatKognitif = document.getElementById('ai-assign-kognitif')?.value || 'hots';
        const topik = document.getElementById('ai-assign-topik')?.value.trim();

        if (!topik) {
            showCustomModal("Silakan masukkan materi pokok / capaian pembelajaran terlebih dahulu!");
            return;
        }

        const btn = document.getElementById('btn-run-ai-assign');
        btn.disabled = true;
        btn.innerText = "Merumuskan Butir Soal Form...";

        showAiLoadingModal({
            badge: 'GENERATOR TUGAS AI',
            title: 'Menyusun Formulir Tugas Interaktif...',
            steps: [
                'Menghubungkan ke Google Gemini AI...',
                `Menganalisis capaian topik "${topik}" untuk kelas ${kelas}...`,
                'Merumuskan butir-butir pertanyaan tugas siswa...',
                'Menyusun rubrik penilaian dan panduan guru...',
                'Menyiapkan form builder tugas online...'
            ]
        });

        try {
            const res = await aiGenerateFormQuestions({
                mapel,
                kelas,
                topik,
                jmlSoal: jumlah,
                tipeSoal,
                tingkatKognitif,
                customComposition
            });

            closeAiAssignmentModal();
            openAssignmentModal();

            if (document.getElementById('assign-mapel')) document.getElementById('assign-mapel').value = mapel;
            if (document.getElementById('assign-kelas')) document.getElementById('assign-kelas').value = kelas;
            if (document.getElementById('assign-judul')) document.getElementById('assign-judul').value = res.judul_tugas || `Tugas ${mapel} - ${topik}`;
            if (document.getElementById('assign-deskripsi')) document.getElementById('assign-deskripsi').value = res.petunjuk || 'Jawablah setiap butir soal berikut dengan teliti.';

            if (res.questions && res.questions.length > 0) {
                formBuilderQuestions = res.questions;
            }
            renderFormBuilderQuestions();

            showCustomModal(`AI berhasil menyusun ${formBuilderQuestions.length} butir soal formulir tugas dengan total bobot 100 poin! Silakan periksa atau langsung publikasikan ke siswa.`);
        } catch (e) {
            showCustomModal("Gagal generate soal form AI: " + e.message);
        } finally {
            hideAiLoadingModal();
            btn.disabled = false;
            btn.innerText = "BUATKAN SOAL KE FORM BUILDER";
        }
    };

    // ==========================================
    // 4. Modul Materi Pembelajaran
    // ==========================================
    async function loadMaterials() {
        const container = document.getElementById('materials-container');
        container.innerHTML = '<div class="col-span-2 text-center py-6 font-bold text-black uppercase animate-pulse">Memuat materi pembelajaran...</div>';

        try {
            const isSuperadmin = currentTeacher?.role === 'superadmin';
            let matQuery = supabase.from('materials').select('*').order('created_at', { ascending: false });
            if (!isSuperadmin && currentTeacher?.id) {
                matQuery = matQuery.or(`teacher_id.eq.${currentTeacher.id},guru_id.eq.${currentTeacher.id}`);
            }
            const { data, error } = await matQuery;
            if (error) throw error;
            materialsList = data || [];

            container.innerHTML = '';
            if (materialsList.length === 0) {
                container.innerHTML = '<div class="col-span-2 bg-white border-2 border-black rounded-2xl p-8 text-center text-slate-500 font-bold uppercase">Belum ada materi pembelajaran yang dibuat.</div>';
                return;
            }

            materialsList.forEach(m => {
                const card = document.createElement('div');
                card.className = "bg-white border-[3px] border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between";
                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start gap-2 mb-2">
                            <span class="bg-indigo-100 text-indigo-900 border border-indigo-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                Kelas ${m.kelas} &bull; ${m.mapel}
                            </span>
                            <button onclick="deleteMaterial('${m.id}')" class="text-red-500 hover:text-red-700 font-black text-xs uppercase">Hapus</button>
                        </div>
                        <h4 class="font-black text-lg text-black mb-2">${m.judul}</h4>
                        <p class="text-xs text-slate-700 font-medium line-clamp-4 leading-relaxed mb-3 whitespace-pre-line">${m.konten}</p>
                    </div>
                    ${m.link_video ? `<a href="${m.link_video}" target="_blank" class="text-xs font-bold text-indigo-600 underline">Tonton Video Pembelajaran ↗</a>` : ''}
                `;
                container.appendChild(card);
            });
        } catch (e) {
            container.innerHTML = `<div class="col-span-2 text-center text-red-600 font-bold">Gagal memuat materi: ${e.message}</div>`;
        }
    }

    window.openMaterialModal = () => {
        const matKelasSelect = document.getElementById('mat-kelas');
        populateTargetClassSelect(matKelasSelect, 'Semua Kelas');
        const matMapelSelect = document.getElementById('mat-mapel');
        if (matMapelSelect && currentTeacher?.mapel) {
            matMapelSelect.value = currentTeacher.mapel;
        }
        document.getElementById('mat-judul').value = '';
        document.getElementById('mat-konten').value = '';
        document.getElementById('mat-video').value = '';
        if (document.getElementById('mat-kategori')) document.getElementById('mat-kategori').value = 'modul';
        if (document.getElementById('mat-level')) document.getElementById('mat-level').value = 'menengah';
        document.getElementById('material-modal').classList.remove('hidden');
    };

    window.closeMaterialModal = () => {
        document.getElementById('material-modal').classList.add('hidden');
    };

    window.insertMaterialSection = (section) => {
        const kontenEl = document.getElementById('mat-konten');
        if (!kontenEl) return;
        let snippet = '';
        if (section === 'tujuan') {
            snippet = `\n\nCapaian & Tujuan Pembelajaran:\n1. Memahami konsep pokok dan fungsi utama materi ini.\n2. Mampu menerapkan konsep untuk memecahkan persoalan sehari-hari.`;
        } else if (section === 'kasus') {
            snippet = `\n\nContoh Kasus & Penerapan Sehari-Hari:\nBayangkan situasi berikut pada kehidupan remaja sehari-hari:\n[Tuliskan skenario studi kasus konkret di sini].`;
        } else if (section === 'rangkuman') {
            snippet = `\n\nRangkuman Intisari Materi:\n- Poin 1: [Prinsip penting yang harus diingat]\n- Poin 2: [Aturan atau langkah kunci]\n- Poin 3: [Hal yang perlu diperhatikan]`;
        } else if (section === 'glosarium') {
            snippet = `\n\nGlosarium Istilah Penting:\n- Istilah 1: Penjelasan ringkas istilah 1.\n- Istilah 2: Penjelasan ringkas istilah 2.`;
        }
        kontenEl.value = (kontenEl.value.trim() + snippet).trim();
        kontenEl.focus();
    };

    window.saveMaterial = async () => {
        const mapel = document.getElementById('mat-mapel')?.value || currentTeacher?.mapel || 'Informatika';
        const kelas = document.getElementById('mat-kelas')?.value || stateKelas[0] || 'Semua Kelas';
        const judul = document.getElementById('mat-judul').value.trim();
        const konten = document.getElementById('mat-konten').value.trim();
        const video = document.getElementById('mat-video').value.trim();

        if (!judul || !konten) {
            showCustomModal("Judul dan uraian materi wajib diisi!");
            return;
        }

        const btn = document.getElementById('btn-save-material');
        if (btn) {
            btn.disabled = true;
            btn.innerText = "Menyimpan Materi...";
        }

        try {
            const { error } = await supabase.from('materials').insert([{
                teacher_id: currentSession?.user?.id,
                guru_id: currentTeacher?.id || currentSession?.user?.id,
                mapel,
                kelas,
                judul,
                konten,
                link_video: video
            }]);

            if (error) throw error;
            closeMaterialModal();
            loadMaterials();
            showCustomModal(`Modul materi "${judul}" berhasil disimpan dan dapat diakses siswa ${kelas}!`);
        } catch (e) {
            showCustomModal("Gagal menyimpan materi: " + e.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = "SIMPAN & TERBITKAN MATERI";
            }
        }
    };

    window.deleteMaterial = async (id) => {
        const conf = await showCustomModal("Hapus materi ini?", "confirm");
        if (!conf) return;
        try {
            const { error } = await supabase.from('materials').delete().eq('id', id);
            if (error) throw error;
            loadMaterials();
        } catch (e) {
            showCustomModal("Gagal menghapus: " + e.message);
        }
    };

    window.openAiMaterialModal = () => {
        const kelasSelect = document.getElementById('ai-mat-kelas');
        populateTargetClassSelect(kelasSelect, 'Semua Kelas');
        const mapelSelect = document.getElementById('ai-mat-mapel');
        if (mapelSelect && currentTeacher?.mapel) {
            mapelSelect.value = currentTeacher.mapel;
        }
        document.getElementById('ai-mat-topik').value = '';
        document.getElementById('ai-material-modal').classList.remove('hidden');
    };

    window.closeAiMaterialModal = () => {
        document.getElementById('ai-material-modal').classList.add('hidden');
    };

    window.runAiGenerateMaterial = async () => {
        const mapel = document.getElementById('ai-mat-mapel')?.value || currentTeacher?.mapel || 'Informatika';
        const kelas = document.getElementById('ai-mat-kelas')?.value || stateKelas[0] || 'Semua Kelas';
        const gaya = document.getElementById('ai-mat-gaya').value;
        const kedalaman = document.getElementById('ai-mat-kedalaman').value;
        const sertakanStudiKasus = document.getElementById('ai-mat-opt-kasus')?.checked ?? true;
        const sertakanRefleksi = document.getElementById('ai-mat-opt-refleksi')?.checked ?? true;
        const sertakanGlosarium = document.getElementById('ai-mat-opt-glosarium')?.checked ?? true;
        const topik = document.getElementById('ai-mat-topik').value.trim();

        if (!topik) {
            showCustomModal("Masukkan materi pokok / capaian pembelajaran terlebih dahulu!");
            return;
        }

        const btn = document.getElementById('btn-run-ai-mat');
        btn.disabled = true;
        btn.innerText = "Menyusun Modul Ajar Komprehensif...";

        showAiLoadingModal({
            badge: 'GENERATOR MODUL AJAR AI',
            title: 'Menyusun Modul Ajar Komprehensif...',
            steps: [
                'Menghubungkan ke Google Gemini AI...',
                `Menganalisis materi pokok "${topik}" untuk kelas ${kelas}...`,
                'Menyusun capaian pembelajaran & tujuan belajar...',
                'Menyusun uraian konsep, studi kasus kontekstual & glosarium...',
                'Memformat teks modul ajar ke editor...'
            ]
        });

        try {
            const generatedText = await aiGenerateMaterial({
                mapel,
                topik,
                kelas,
                gaya,
                kedalaman,
                sertakanStudiKasus,
                sertakanRefleksi,
                sertakanGlosarium
            });

            closeAiMaterialModal();
            openMaterialModal();
            if (document.getElementById('mat-mapel')) document.getElementById('mat-mapel').value = mapel;
            if (document.getElementById('mat-kelas')) document.getElementById('mat-kelas').value = kelas;
            document.getElementById('mat-judul').value = topik;
            document.getElementById('mat-konten').value = generatedText;
        } catch (e) {
            showCustomModal("Gagal generate materi: " + e.message);
        } finally {
            hideAiLoadingModal();
            btn.disabled = false;
            btn.innerText = "GENERATE MODUL AJAR SEKARANG";
        }
    };

    // ==========================================
    // 5. Modul Bank Soal, Ujian & Hasil Koreksi
    // ==========================================
    window.generateRandomQuizToken = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let randomStr = '';
        for (let i = 0; i < 3; i++) {
            randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const token = `CBT58${randomStr}`;
        const input = document.getElementById('manual-quiz-token');
        if (input) input.value = token;
        return token;
    };

    window.copyQuizToken = async (token) => {
        if (!token) return;
        try {
            await navigator.clipboard.writeText(token);
            showCustomModal(`Token ujian [${token}] berhasil disalin ke clipboard! Bagikan token ini kepada siswa saat ujian dimulai.`, 'alert', 'Token Disalin', '');
        } catch (_) {
            showCustomModal(`Token Ujian: ${token}\nSilakan salin token di atas secara manual.`, 'alert', 'Token Ujian', '');
        }
    };

    async function loadQuizzes() {
        const container = document.getElementById('quizzes-container');
        container.innerHTML = '<div class="text-center py-6 font-bold text-black uppercase">Memuat bank soal ujian...</div>';

        try {
            const isSuperadmin = currentTeacher?.role === 'superadmin';
            let quizQuery = supabase.from('quizzes').select('*, quiz_questions(*)').order('created_at', { ascending: false });
            if (!isSuperadmin && currentTeacher?.id) {
                quizQuery = quizQuery.or(`teacher_id.eq.${currentTeacher.id},guru_id.eq.${currentTeacher.id}`);
            }
            const { data, error } = await quizQuery;
            if (error) throw error;
            quizzesList = data || [];

            container.innerHTML = '';
            if (quizzesList.length === 0) {
                container.innerHTML = '<div class="bg-white border-2 border-black rounded-2xl p-8 text-center text-slate-500 font-bold uppercase">Belum ada ujian atau kuis online yang dibuat.</div>';
                return;
            }

            quizzesList.forEach(q => {
                const questions = q.quiz_questions || [];
                const typeBreakdown = [];
                const typeDefs = [
                    { key: 'pg', label: 'PG' },
                    { key: 'pg_kompleks', label: 'PG Kompleks' },
                    { key: 'benar_salah', label: 'Benar/Salah' },
                    { key: 'singkat', label: 'Isian' },
                    { key: 'menjodohkan', label: 'Menjodohkan' },
                    { key: 'upload_foto', label: 'Upload' },
                    { key: 'esai', label: 'Esai' }
                ];
                typeDefs.forEach(t => {
                    const cnt = questions.filter(item => item.tipe === t.key).length;
                    if (cnt > 0) typeBreakdown.push(`${cnt} ${t.label}`);
                });
                const summaryText = typeBreakdown.length > 0 ? `(${typeBreakdown.join(' • ')})` : '';

                const { config: qCfg } = parseQuizConfig(q.petunjuk || '', q);
                const quizToken = qCfg.token || (q.token || '').trim().toUpperCase();

                let tokenBadgeHtml = '';
                if (quizToken && qCfg.token_required !== false) {
                    tokenBadgeHtml = `
                        <div class="inline-flex items-center gap-1.5 bg-yellow-200 border-2 border-black px-2.5 py-0.5 rounded-lg text-xs font-black text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            <span>Token:</span>
                            <span class="font-mono tracking-wider">${escapeHtml(quizToken)}</span>
                            <button type="button" onclick="copyQuizToken('${escapeHtml(quizToken)}')" title="Salin Token" class="ml-1 hover:underline text-indigo-700 font-bold text-[11px]">
                                Salin
                            </button>
                        </div>
                    `;
                } else {
                    tokenBadgeHtml = `
                        <span class="bg-slate-100 text-slate-600 border border-slate-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            Tanpa Token
                        </span>
                    `;
                }

                const card = document.createElement('div');
                card.className = "bg-white border-[3px] border-black rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4";
                card.innerHTML = `
                    <div class="w-full md:w-auto">
                        <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <span class="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                ${q.mapel} &bull; Kelas ${q.kelas}
                            </span>
                            <span class="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                Durasi: ${q.durasi_menit} Menit
                            </span>
                            ${tokenBadgeHtml}
                        </div>
                        <h4 class="font-black text-lg sm:text-xl text-black">${q.judul_kuis}</h4>
                        <p class="text-xs text-slate-600 font-bold mt-1">
                            ${questions.length} Soal ${summaryText}
                        </p>
                    </div>
                    <div class="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto shrink-0 mt-2 md:mt-0">
                        <button type="button" onclick="openQuizResultsModal('${q.id}')" class="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition flex items-center justify-center text-center">
                            Hasil & Koreksi
                        </button>
                        <button type="button" onclick="openEditQuizModal('${q.id}')" class="h-9 px-3.5 bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition flex items-center justify-center text-center">
                            Edit Kuis
                        </button>
                        <button type="button" onclick="addQuestionToExistingQuiz('${q.id}')" class="h-9 px-3.5 bg-cyan-300 hover:bg-cyan-400 text-black border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition flex items-center justify-center text-center">
                            Tambah Soal
                        </button>
                        <button type="button" onclick="deleteQuiz('${q.id}')" class="h-9 px-3.5 bg-rose-100 hover:bg-rose-200 text-rose-800 border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition flex items-center justify-center text-center">
                            Hapus
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        } catch (e) {
            container.innerHTML = `<div class="text-center text-red-600 font-bold">Gagal memuat ujian: ${e.message}</div>`;
        }
    }

    window.toggleAiQuizCustomTotal = () => {
        const presetBox = document.getElementById('ai-quiz-total-preset-box');
        const customBox = document.getElementById('ai-quiz-total-custom-box');
        const customInput = document.getElementById('ai-quiz-total-soal-custom');
        const select = document.getElementById('ai-quiz-total-soal');
        if (!presetBox || !customBox) return;

        const isCustomVisible = !customBox.classList.contains('hidden');
        if (isCustomVisible) {
            customBox.classList.add('hidden');
            presetBox.classList.remove('hidden');
            if (select && select.value === 'custom') select.value = '5';
        } else {
            presetBox.classList.add('hidden');
            customBox.classList.remove('hidden');
            if (customInput) {
                if (!customInput.value && select && select.value !== 'custom') {
                    customInput.value = select.value;
                }
                customInput.focus();
            }
        }
    };

    window.cancelAiQuizCustomTotal = () => {
        const presetBox = document.getElementById('ai-quiz-total-preset-box');
        const customBox = document.getElementById('ai-quiz-total-custom-box');
        const select = document.getElementById('ai-quiz-total-soal');
        if (customBox) customBox.classList.add('hidden');
        if (presetBox) presetBox.classList.remove('hidden');
        if (select && select.value === 'custom') select.value = '5';
    };

    window.onAiQuizTotalSelectChange = (sel) => {
        if (sel && sel.value === 'custom') {
            window.toggleAiQuizCustomTotal();
        }
    };

    window.onAiQuizRagamChange = (sel) => {
        const customBox = document.getElementById('ai-quiz-custom-box');
        if (sel && sel.value === 'custom_komposisi') {
            if (customBox) customBox.classList.remove('hidden');
            window.updateAiQuizCustomTotal();
        } else {
            if (customBox) customBox.classList.add('hidden');
        }
    };

    window.updateAiQuizCustomTotal = () => {
        const pg = Number(document.getElementById('ai-quiz-count-pg')?.value) || 0;
        const pgk = Number(document.getElementById('ai-quiz-count-pgk')?.value) || 0;
        const bs = Number(document.getElementById('ai-quiz-count-bs')?.value) || 0;
        const singkat = Number(document.getElementById('ai-quiz-count-singkat')?.value) || 0;
        const jodoh = Number(document.getElementById('ai-quiz-count-jodoh')?.value) || 0;
        const esai = Number(document.getElementById('ai-quiz-count-esai')?.value) || 0;
        const total = pg + pgk + bs + singkat + jodoh + esai;

        const badge = document.getElementById('ai-quiz-custom-badge');
        if (badge) badge.textContent = `Total: ${total} Soal`;

        const totalSelect = document.getElementById('ai-quiz-total-soal');
        if (totalSelect) {
            const hasOption = Array.from(totalSelect.options).some(o => o.value === String(total));
            if (hasOption) {
                totalSelect.value = String(total);
            }
        }
    };

    window.openAiQuizModal = () => {
        const kelasSelect = document.getElementById('ai-quiz-kelas');
        populateTargetClassSelect(kelasSelect, 'Semua Kelas');
        const mapelSelect = document.getElementById('ai-quiz-mapel');
        if (mapelSelect && currentTeacher?.mapel) {
            mapelSelect.value = currentTeacher.mapel;
        }
        document.getElementById('ai-quiz-judul').value = '';
        document.getElementById('ai-quiz-topik').value = '';
        window.cancelAiQuizCustomTotal();
        const customInput = document.getElementById('ai-quiz-total-soal-custom');
        if (customInput) customInput.value = '';
        const quizSelect = document.getElementById('ai-quiz-total-soal');
        if (quizSelect) quizSelect.value = '5';

        const ragamSelect = document.getElementById('ai-quiz-model-ragam');
        if (ragamSelect) ragamSelect.value = 'campuran';
        const customBox = document.getElementById('ai-quiz-custom-box');
        if (customBox) customBox.classList.add('hidden');
        ['pg', 'pgk', 'bs', 'singkat', 'jodoh', 'esai'].forEach(k => {
            const el = document.getElementById(`ai-quiz-count-${k}`);
            if (el) el.value = '0';
        });

        document.getElementById('ai-quiz-modal').classList.remove('hidden');
    };

    window.closeAiQuizModal = () => {
        document.getElementById('ai-quiz-modal').classList.add('hidden');
    };

    window.runAiGenerateQuiz = async () => {
        const mapel = document.getElementById('ai-quiz-mapel').value;
        const kelas = document.getElementById('ai-quiz-kelas').value || stateKelas[0] || 'Semua Kelas';
        const judul = document.getElementById('ai-quiz-judul').value.trim();
        const topik = document.getElementById('ai-quiz-topik').value.trim();
        const taksonomi = document.getElementById('ai-quiz-taksonomi').value;
        const kesulitan = document.getElementById('ai-quiz-kesulitan').value;
        const stimulus = document.getElementById('ai-quiz-stimulus').value;
        const ragam = document.getElementById('ai-quiz-model-ragam')?.value || 'campuran';
        
        let totalSoal = 5;
        let customComposition = null;

        if (ragam === 'custom_komposisi') {
            const pg = Number(document.getElementById('ai-quiz-count-pg')?.value) || 0;
            const pgk = Number(document.getElementById('ai-quiz-count-pgk')?.value) || 0;
            const bs = Number(document.getElementById('ai-quiz-count-bs')?.value) || 0;
            const singkat = Number(document.getElementById('ai-quiz-count-singkat')?.value) || 0;
            const jodoh = Number(document.getElementById('ai-quiz-count-jodoh')?.value) || 0;
            const esai = Number(document.getElementById('ai-quiz-count-esai')?.value) || 0;
            const sumCount = pg + pgk + bs + singkat + jodoh + esai;
            if (sumCount <= 0) {
                showCustomModal("Silakan masukkan minimal 1 butir soal pada rincian komposisi kustom!");
                return;
            }
            customComposition = { pg, pgk, bs, singkat, jodoh, esai };
            totalSoal = sumCount;
        } else {
            const quizCustomBox = document.getElementById('ai-quiz-total-custom-box');
            const quizCustomInput = document.getElementById('ai-quiz-total-soal-custom');
            const quizSelect = document.getElementById('ai-quiz-total-soal');

            if (quizCustomBox && !quizCustomBox.classList.contains('hidden') && quizCustomInput && quizCustomInput.value.trim() !== '') {
                totalSoal = parseInt(quizCustomInput.value.trim(), 10);
            } else if (quizSelect && quizSelect.value === 'custom' && quizCustomInput && quizCustomInput.value.trim() !== '') {
                totalSoal = parseInt(quizCustomInput.value.trim(), 10);
            } else if (quizSelect && quizSelect.value !== 'custom') {
                totalSoal = parseInt(quizSelect.value, 10) || 5;
            }
        }

        if (isNaN(totalSoal) || totalSoal < 1) {
            showCustomModal("Jumlah butir soal minimal 1 butir.");
            return;
        }
        if (totalSoal > 50) {
            showCustomModal("Jumlah butir soal maksimal 50 butir per pembuatan ujian.");
            return;
        }

        const durasi = parseInt(document.getElementById('ai-quiz-durasi').value, 10) || 45;

        if (!judul || !topik) {
            showCustomModal("Judul ujian dan materi pokok wajib diisi!");
            return;
        }

        const btn = document.getElementById('btn-run-ai-quiz');
        btn.disabled = true;
        btn.innerText = "Menyusun Bank Soal dengan AI...";

        showAiLoadingModal({
            badge: 'GENERATOR BANK SOAL AI',
            title: 'Menyusun Naskah Bank Soal & Ujian...',
            steps: [
                'Menghubungkan ke Google Gemini AI...',
                `Menganalisis materi pokok "${topik}" untuk kelas ${kelas}...`,
                'Merumuskan butir soal AKM, PG, dan Esai berkualitas...',
                'Menyusun stimulus kasus kontekstual dan kunci jawaban...',
                'Memvalidasi struktur instrumen soal ke database...'
            ]
        });

        try {
            const result = await aiGenerateQuestions({
                mapel,
                topik,
                kelas,
                taksonomi,
                kesulitan,
                stimulus,
                ragam,
                totalSoal,
                durasi,
                customComposition
            });

            const rawQuestions = Array.isArray(result) ? result : (result?.soal || result?.questions || []);
            const questions = (Array.isArray(rawQuestions) ? rawQuestions : [])
                .filter(q => q && q.pertanyaan && String(q.pertanyaan).trim());

            if (questions.length === 0) {
                throw new Error("AI tidak berhasil menghasilkan butir soal. Silakan coba kembali dengan materi pokok yang lebih spesifik.");
            }

            const basePetunjuk = result.petunjuk || `Ujian ${topik}. Kerjakan dengan teliti dan jujur!`;
            const autoToken = window.generateRandomQuizToken();
            const antiCheatConfig = { violation_limit: 3, fullscreen: true, token: autoToken, token_required: true };
            const fullPetunjuk = `${basePetunjuk}\n[CONFIG:${JSON.stringify(antiCheatConfig)}]`;

            let quizData = null;
            try {
                const { data: qd, error: qErr } = await supabase.from('quizzes').insert([{
                    teacher_id: currentSession?.user?.id,
                    guru_id: currentTeacher?.id || currentSession?.user?.id,
                    mapel,
                    kelas,
                    judul_kuis: judul,
                    petunjuk: fullPetunjuk,
                    durasi_menit: durasi,
                    status: 'aktif',
                    token: autoToken,
                    token_required: true
                }]).select().single();
                if (qErr) throw qErr;
                quizData = qd;
            } catch (_) {
                const { data: qd2, error: qErr2 } = await supabase.from('quizzes').insert([{
                    teacher_id: currentSession?.user?.id,
                    guru_id: currentTeacher?.id || currentSession?.user?.id,
                    mapel,
                    kelas,
                    judul_kuis: judul,
                    petunjuk: fullPetunjuk,
                    durasi_menit: durasi,
                    status: 'aktif'
                }]).select().single();
                if (qErr2) throw qErr2;
                quizData = qd2;
            }

            if (!quizData || !quizData.id) {
                throw new Error("Gagal menyimpan data kuis ke database.");
            }

            const questionsPayload = questions.map((q, idx) => {
                let rubrik = q.rubrik_esai || '';
                if (q.tipe === 'menjodohkan') {
                    rubrik = JSON.stringify(q.pasangan || []);
                }
                return {
                    quiz_id: quizData.id,
                    nomor: idx + 1,
                    tipe: q.tipe || 'pg',
                    pertanyaan: q.pertanyaan,
                    opsi_a: q.opsi_a || '',
                    opsi_b: q.opsi_b || '',
                    opsi_c: q.opsi_c || '',
                    opsi_d: q.opsi_d || '',
                    kunci_pg: q.kunci_pg || '',
                    rubrik_esai: rubrik,
                    bobot: q.bobot || (q.tipe === 'esai' || q.tipe === 'menjodohkan' || q.tipe === 'upload_foto' ? 20 : 10)
                };
            });

            const { error: qError } = await supabase.from('quiz_questions').insert(questionsPayload);
            if (qError) throw qError;

            closeAiQuizModal();
            loadQuizzes();
            const typesSummary = [...new Set(questions.map(q => q.tipe || 'pg'))].join(', ');
            showCustomModal(`Berhasil! Kuis "${judul}" berisi ${questions.length} butir soal (${typesSummary}) telah dipublikasikan ke ${kelas}!`);
        } catch (e) {
            showCustomModal("Gagal generate bank soal AI: " + e.message);
        } finally {
            hideAiLoadingModal();
            btn.disabled = false;
            btn.innerText = "GENERATE BANK SOAL SEKARANG";
        }
    };

    // =========================================================
    // BUILDER KUIS INPUT MANUAL (MANDIRI TANPA AI)
    // =========================================================
    let manualQuizQuestions = [];
    let editingQuizId = null;

    // Helper Unggah & Pasang Gambar Soal (Form Tugas & Kuis)
    window.handleQuestionImageUpload = async (event, idx, context = 'form') => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showCustomModal("Berkas yang dipilih harus berupa gambar (JPG, PNG, GIF, WebP)!");
            return;
        }

        try {
            const fileExt = file.name.split('.').pop() || 'png';
            const safeName = `${Date.now()}_stimulus_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `soal_stimulus/${safeName}`;

            const { error: uploadErr } = await supabase.storage.from('uploads').upload(filePath, file);
            if (uploadErr) throw uploadErr;

            const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
            const publicUrl = publicUrlData.publicUrl;

            if (context === 'form') {
                if (formBuilderQuestions[idx]) {
                    formBuilderQuestions[idx].gambar_url = publicUrl;
                    renderFormBuilderQuestions();
                }
            } else {
                if (manualQuizQuestions[idx]) {
                    manualQuizQuestions[idx].gambar_url = publicUrl;
                    renderManualQuizQuestions();
                }
            }
        } catch (err) {
            showCustomModal("Gagal mengunggah gambar: " + err.message);
        }
    };

    window.updateQuestionImage = (idx, value, context = 'form') => {
        const trimmed = (value || '').trim();
        if (context === 'form') {
            if (formBuilderQuestions[idx]) {
                formBuilderQuestions[idx].gambar_url = trimmed;
            }
        } else {
            if (manualQuizQuestions[idx]) {
                manualQuizQuestions[idx].gambar_url = trimmed;
            }
        }
    };

    window.removeQuestionImage = (idx, context = 'form') => {
        if (context === 'form') {
            if (formBuilderQuestions[idx]) {
                delete formBuilderQuestions[idx].gambar_url;
                renderFormBuilderQuestions();
            }
        } else {
            if (manualQuizQuestions[idx]) {
                delete manualQuizQuestions[idx].gambar_url;
                renderManualQuizQuestions();
            }
        }
    };

    window.openManualQuizModal = () => {
        editingQuizId = null;
        const modalTitle = document.getElementById('manual-quiz-modal-title');
        const modalSub = document.getElementById('manual-quiz-modal-subtitle');
        const btnSave = document.getElementById('btn-save-manual-quiz');
        if (modalTitle) modalTitle.textContent = "Buat Kuis Baru (Input Manual)";
        if (modalSub) modalSub.textContent = "Susun naskah butir soal secara mandiri untuk siswa";
        if (btnSave) btnSave.innerText = "SIMPAN & TERBITKAN KUIS";

        const kelasSelect = document.getElementById('manual-quiz-kelas');
        populateTargetClassSelect(kelasSelect, 'Semua Kelas');
        const mapelSelect = document.getElementById('manual-quiz-mapel');
        if (mapelSelect && currentTeacher?.mapel) {
            mapelSelect.value = currentTeacher.mapel;
        }
        document.getElementById('manual-quiz-judul').value = '';
        document.getElementById('manual-quiz-petunjuk').value = 'Kerjakan dengan teliti, jujur, dan mandiri.';
        document.getElementById('manual-quiz-durasi').value = '45';
        const limitSelect = document.getElementById('manual-quiz-violation-limit');
        if (limitSelect) limitSelect.value = '3';
        const fsLock = document.getElementById('manual-quiz-fullscreen-lock');
        if (fsLock) fsLock.checked = true;

        // Auto-generate token ujian aktif untuk kuis baru
        window.generateRandomQuizToken();
        const tokenEnabled = document.getElementById('manual-quiz-token-enabled');
        if (tokenEnabled) tokenEnabled.checked = true;

        manualQuizQuestions = [
            {
                id: Date.now(),
                tipe: 'pg',
                pertanyaan: '',
                gambar_url: '',
                opsi_a: '',
                opsi_b: '',
                opsi_c: '',
                opsi_d: '',
                kunci_pg: 'A',
                rubrik_esai: '',
                bobot: 10
            }
        ];

        renderManualQuizQuestions();
        document.getElementById('manual-quiz-modal').classList.remove('hidden');
    };

    window.openEditQuizModal = async (quizId) => {
        let quiz = quizzesList.find(q => String(q.id) === String(quizId));
        if (!quiz) {
            showCustomModal("Data kuis tidak ditemukan!");
            return;
        }

        try {
            const { data: freshQuestions } = await supabase
                .from('quiz_questions')
                .select('*')
                .eq('quiz_id', quiz.id)
                .order('nomor', { ascending: true });
            if (freshQuestions && freshQuestions.length > 0) {
                quiz = { ...quiz, quiz_questions: freshQuestions };
            }
        } catch (_) {}

        editingQuizId = quiz.id;

        const modalTitle = document.getElementById('manual-quiz-modal-title');
        const modalSub = document.getElementById('manual-quiz-modal-subtitle');
        const btnSave = document.getElementById('btn-save-manual-quiz');
        if (modalTitle) modalTitle.textContent = "Edit Kuis & Butir Soal";
        if (modalSub) modalSub.textContent = "Perbarui naskah butir soal, kunci jawaban, dan stimulus gambar";
        if (btnSave) btnSave.innerText = "SIMPAN PERUBAHAN KUIS";

        const kelasSelect = document.getElementById('manual-quiz-kelas');
        populateTargetClassSelect(kelasSelect, quiz.kelas || 'Semua Kelas');
        const mapelSelect = document.getElementById('manual-quiz-mapel');
        if (mapelSelect) mapelSelect.value = quiz.mapel || 'Informatika';

        const { cleanPetunjuk, config: quizCfg } = parseQuizConfig(quiz.petunjuk || '', quiz);
        document.getElementById('manual-quiz-judul').value = quiz.judul_kuis || '';
        document.getElementById('manual-quiz-durasi').value = quiz.durasi_menit || '45';
        document.getElementById('manual-quiz-petunjuk').value = cleanPetunjuk || 'Kerjakan dengan teliti, jujur, dan mandiri.';

        const editLimitSelect = document.getElementById('manual-quiz-violation-limit');
        if (editLimitSelect) editLimitSelect.value = String(quizCfg.violation_limit !== undefined ? quizCfg.violation_limit : '3');
        const editFsLock = document.getElementById('manual-quiz-fullscreen-lock');
        if (editFsLock) editFsLock.checked = quizCfg.fullscreen !== undefined ? !!quizCfg.fullscreen : true;

        const editTokenInput = document.getElementById('manual-quiz-token');
        if (editTokenInput) editTokenInput.value = quizCfg.token || (quiz.token || '').toUpperCase();
        const editTokenEnabled = document.getElementById('manual-quiz-token-enabled');
        if (editTokenEnabled) editTokenEnabled.checked = quizCfg.token_required !== false;
        if (editFsLock) editFsLock.checked = quizCfg.fullscreen !== undefined ? !!quizCfg.fullscreen : true;

        const rawQuestions = Array.isArray(quiz.quiz_questions) ? [...quiz.quiz_questions] : [];
        rawQuestions.sort((a, b) => (a.nomor || 0) - (b.nomor || 0));

        if (rawQuestions.length > 0) {
            manualQuizQuestions = rawQuestions.map(item => {
                const { text: cleanPertanyaan, gambar_url } = splitQuestionImage(item.pertanyaan || '');
                let pasangan = [];
                if (item.tipe === 'menjodohkan') {
                    try {
                        pasangan = JSON.parse(item.rubrik_esai);
                    } catch (_) {
                        pasangan = [
                            { kiri: '', kanan: '' },
                            { kiri: '', kanan: '' }
                        ];
                    }
                }
                return {
                    id: item.id || Date.now() + Math.random(),
                    tipe: item.tipe || 'pg',
                    pertanyaan: cleanPertanyaan,
                    gambar_url: item.gambar_url || gambar_url,
                    opsi_a: item.opsi_a || '',
                    opsi_b: item.opsi_b || '',
                    opsi_c: item.opsi_c || '',
                    opsi_d: item.opsi_d || '',
                    kunci_pg: item.kunci_pg || (item.tipe === 'benar_salah' ? 'Benar' : 'A'),
                    rubrik_esai: item.tipe === 'menjodohkan' ? '' : (item.rubrik_esai || ''),
                    pasangan: pasangan,
                    bobot: item.bobot || 10
                };
            });
        } else {
            manualQuizQuestions = [
                {
                    id: Date.now(),
                    tipe: 'pg',
                    pertanyaan: '',
                    gambar_url: '',
                    opsi_a: '',
                    opsi_b: '',
                    opsi_c: '',
                    opsi_d: '',
                    kunci_pg: 'A',
                    rubrik_esai: '',
                    bobot: 10
                }
            ];
        }

        renderManualQuizQuestions();
        document.getElementById('manual-quiz-modal').classList.remove('hidden');
    };

    window.addQuestionToExistingQuiz = async (quizId) => {
        await window.openEditQuizModal(quizId);
        window.addManualQuestionItem('pg');
        setTimeout(() => {
            const list = document.getElementById('manual-quiz-questions-list');
            if (list && list.lastElementChild) {
                list.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const input = list.lastElementChild.querySelector('textarea, input');
                if (input) input.focus();
            }
        }, 200);
    };

    window.closeManualQuizModal = () => {
        editingQuizId = null;
        document.getElementById('manual-quiz-modal').classList.add('hidden');
    };

    window.addManualQuestionItem = (type = 'pg') => {
        const defaultBobot = (type === 'esai' || type === 'upload_foto' || type === 'menjodohkan') ? 20 : 10;
        let defaultPasangan = [];
        let defaultKunci = '';
        if (type === 'pg' || type === 'pg_kompleks') defaultKunci = 'A';
        else if (type === 'benar_salah') defaultKunci = 'Benar';
        else if (type === 'menjodohkan') {
            defaultPasangan = [
                { kiri: '', kanan: '' },
                { kiri: '', kanan: '' }
            ];
        }

        manualQuizQuestions.push({
            id: Date.now() + Math.random(),
            tipe: type,
            pertanyaan: '',
            gambar_url: '',
            opsi_a: '',
            opsi_b: '',
            opsi_c: '',
            opsi_d: '',
            kunci_pg: defaultKunci,
            rubrik_esai: type === 'upload_foto' ? 'Unggah foto lembar pekerjaan / hitungan dengan jelas.' : '',
            pasangan: defaultPasangan,
            bobot: defaultBobot
        });
        renderManualQuizQuestions();

        setTimeout(() => {
            const list = document.getElementById('manual-quiz-questions-list');
            if (list && list.lastElementChild) {
                list.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 50);
    };

    window.toggleManualQuizComplexKey = (idx, opt) => {
        if (!manualQuizQuestions[idx]) return;
        const currentVal = manualQuizQuestions[idx].kunci_pg || '';
        const currentKeys = currentVal.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
        const keySet = new Set(currentKeys);
        if (keySet.has(opt)) {
            keySet.delete(opt);
        } else {
            keySet.add(opt);
        }
        manualQuizQuestions[idx].kunci_pg = Array.from(keySet).sort().join(',');
        renderManualQuizQuestions();
    };

    window.addManualQuizPair = (qIdx) => {
        if (manualQuizQuestions[qIdx]) {
            if (!Array.isArray(manualQuizQuestions[qIdx].pasangan)) {
                manualQuizQuestions[qIdx].pasangan = [];
            }
            manualQuizQuestions[qIdx].pasangan.push({ kiri: '', kanan: '' });
            renderManualQuizQuestions();
        }
    };

    window.removeManualQuizPair = (qIdx, pIdx) => {
        if (manualQuizQuestions[qIdx] && Array.isArray(manualQuizQuestions[qIdx].pasangan)) {
            if (manualQuizQuestions[qIdx].pasangan.length <= 1) {
                showCustomModal("Minimal harus ada 1 pasangan soal menjodohkan!");
                return;
            }
            manualQuizQuestions[qIdx].pasangan.splice(pIdx, 1);
            renderManualQuizQuestions();
        }
    };

    window.updateManualQuizPair = (qIdx, pIdx, side, value) => {
        if (manualQuizQuestions[qIdx] && Array.isArray(manualQuizQuestions[qIdx].pasangan) && manualQuizQuestions[qIdx].pasangan[pIdx]) {
            manualQuizQuestions[qIdx].pasangan[pIdx][side] = value;
        }
    };

    window.deleteManualQuestionItem = (idx) => {
        if (manualQuizQuestions.length <= 1) {
            showCustomModal("Minimal kuis harus memiliki 1 butir soal!");
            return;
        }
        manualQuizQuestions.splice(idx, 1);
        renderManualQuizQuestions();
    };

    window.updateManualQuestionField = (idx, field, value) => {
        if (manualQuizQuestions[idx]) {
            manualQuizQuestions[idx][field] = value;
            if (field === 'bobot') {
                updateManualQuizTotalBobotDisplay();
            }
        }
    };

    function updateManualQuizTotalBobotDisplay() {
        const totalBobot = manualQuizQuestions.reduce((sum, q) => sum + (parseInt(q.bobot, 10) || 0), 0);
        const bobotBadge = document.getElementById('manual-quiz-total-bobot-badge');
        if (bobotBadge) {
            bobotBadge.textContent = `Total Bobot: ${totalBobot} / 100 Poin`;
            bobotBadge.className = totalBobot === 100
                ? "px-2 py-0.5 rounded-lg border font-black text-[10px] uppercase bg-emerald-100 text-emerald-950 border-emerald-400"
                : "px-2 py-0.5 rounded-lg border font-black text-[10px] uppercase bg-amber-100 text-amber-950 border-amber-400";
        }
    }

    window.balanceManualQuizBobot = () => {
        if (!manualQuizQuestions || manualQuizQuestions.length === 0) {
            showCustomModal("Belum ada butir soal untuk diseimbangkan bobotnya.", "alert", "Pemberitahuan", "");
            return;
        }
        balanceExamWeights(manualQuizQuestions, 100);
        renderManualQuizQuestions();
        showCustomModal("Berhasil! Seluruh butir soal telah diseimbangkan secara cerdas dan proporsional sehingga akumulasi bobot tepat 100 poin.", "alert", "Bobot 100 Poin Sempurna", "");
    };

    window.changeManualQuestionType = (idx, newType) => {
        if (manualQuizQuestions[idx]) {
            manualQuizQuestions[idx].tipe = newType;
            manualQuizQuestions[idx].bobot = (newType === 'esai' || newType === 'upload_foto' || newType === 'menjodohkan') ? 20 : 10;
            if (newType === 'pg' && !['A', 'B', 'C', 'D'].includes(manualQuizQuestions[idx].kunci_pg)) {
                manualQuizQuestions[idx].kunci_pg = 'A';
            } else if (newType === 'pg_kompleks' && !manualQuizQuestions[idx].kunci_pg) {
                manualQuizQuestions[idx].kunci_pg = 'A';
            } else if (newType === 'benar_salah') {
                manualQuizQuestions[idx].kunci_pg = 'Benar';
            } else if (newType === 'menjodohkan' && (!Array.isArray(manualQuizQuestions[idx].pasangan) || manualQuizQuestions[idx].pasangan.length === 0)) {
                manualQuizQuestions[idx].pasangan = [
                    { kiri: '', kanan: '' },
                    { kiri: '', kanan: '' }
                ];
            } else if (newType === 'upload_foto' && !manualQuizQuestions[idx].rubrik_esai) {
                manualQuizQuestions[idx].rubrik_esai = 'Unggah foto lembar pekerjaan / hitungan dengan jelas.';
            }
            renderManualQuizQuestions();
        }
    };

    window.renderManualQuizQuestions = () => {
        const countEl = document.getElementById('manual-quiz-total-count');
        if (countEl) countEl.innerText = manualQuizQuestions.length;

        updateManualQuizTotalBobotDisplay();

        const container = document.getElementById('manual-quiz-questions-list');
        if (!container) return;

        if (manualQuizQuestions.length === 0) {
            container.innerHTML = '<div class="p-6 text-center text-xs font-bold text-slate-500 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl">Belum ada soal. Klik salah satu tombol tambah soal di atas.</div>';
            return;
        }

        const typeColors = {
            pg: 'bg-indigo-100 text-indigo-900 border-indigo-400',
            pg_kompleks: 'bg-cyan-100 text-cyan-900 border-cyan-400',
            benar_salah: 'bg-amber-100 text-amber-900 border-amber-400',
            singkat: 'bg-blue-100 text-blue-900 border-blue-400',
            menjodohkan: 'bg-teal-100 text-teal-900 border-teal-400',
            upload_foto: 'bg-pink-100 text-pink-900 border-pink-400',
            esai: 'bg-purple-100 text-purple-900 border-purple-400'
        };

        container.innerHTML = manualQuizQuestions.map((q, idx) => {
            const { text: cleanPertanyaan, gambar_url: parsedImg } = splitQuestionImage(q.pertanyaan || '');
            if (!q.gambar_url && parsedImg) {
                q.gambar_url = parsedImg;
                q.pertanyaan = cleanPertanyaan;
            }
            const currentType = q.tipe || 'pg';
            let specificContent = '';

            if (currentType === 'pg') {
                specificContent = `
                    <div class="space-y-2 pt-1">
                        <div class="flex justify-between items-center">
                            <label class="block text-xs font-black uppercase text-black">Pilihan Jawaban (A, B, C, D)</label>
                            <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">Pilih radio untuk Kunci Jawaban Benar</span>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            ${['A', 'B', 'C', 'D'].map(opt => {
                                const key = `opsi_${opt.toLowerCase()}`;
                                const val = q[key] || '';
                                const isChecked = q.kunci_pg === opt;
                                return `
                                    <div class="flex items-center gap-2.5 border-2 border-black rounded-xl px-3 py-2.5 ${isChecked ? 'bg-emerald-100 border-emerald-600 ring-2 ring-emerald-500' : 'bg-slate-50'}">
                                        <input type="radio" name="manual_quiz_kunci_${idx}" value="${opt}" ${isChecked ? 'checked' : ''} onchange="window.updateManualQuestionField(${idx}, 'kunci_pg', '${opt}'); window.renderManualQuizQuestions();" class="cursor-pointer accent-emerald-600 w-4 h-4 shrink-0">
                                        <span class="font-black text-sm shrink-0">${opt}.</span>
                                        <input type="text" placeholder="Pilihan ${opt}..." value="${escapeHtml(val)}" oninput="window.updateManualQuestionField(${idx}, '${key}', this.value)" class="w-full bg-transparent font-medium text-sm text-slate-900 outline-none">
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            } else if (currentType === 'pg_kompleks') {
                const activeKeys = (q.kunci_pg || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
                specificContent = `
                    <div class="space-y-2 pt-1">
                        <div class="flex justify-between items-center">
                            <label class="block text-xs font-black uppercase text-black">Pilihan Ganda Kompleks (Bisa >1 Kunci Benar)</label>
                            <span class="text-[10px] font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded border border-cyan-300">Centang kotak untuk memilih KUNCI BENAR</span>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            ${['A', 'B', 'C', 'D'].map(opt => {
                                const key = `opsi_${opt.toLowerCase()}`;
                                const val = q[key] || '';
                                const isChecked = activeKeys.includes(opt);
                                return `
                                    <div class="flex items-center gap-2.5 border-2 border-black rounded-xl px-3 py-2.5 ${isChecked ? 'bg-cyan-100 border-cyan-600 ring-2 ring-cyan-500' : 'bg-slate-50'}">
                                        <input type="checkbox" value="${opt}" ${isChecked ? 'checked' : ''} onchange="window.toggleManualQuizComplexKey(${idx}, '${opt}')" class="cursor-pointer accent-cyan-700 w-4 h-4 rounded shrink-0">
                                        <span class="font-black text-sm shrink-0">${opt}.</span>
                                        <input type="text" placeholder="Pilihan ${opt}..." value="${escapeHtml(val)}" oninput="window.updateManualQuestionField(${idx}, '${key}', this.value)" class="w-full bg-transparent font-medium text-sm text-slate-900 outline-none">
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <div class="text-[10px] font-bold text-slate-500">Kunci Jawaban Terpilih: <strong class="text-cyan-900">${activeKeys.join(', ') || '(Belum dipilih)'}</strong></div>
                    </div>
                `;
            } else if (currentType === 'benar_salah') {
                const isBenar = q.kunci_pg === 'Benar';
                specificContent = `
                    <div class="space-y-2 pt-1">
                        <label class="block text-xs font-black uppercase text-black">Tentukan Kunci Kebenaran Pernyataan</label>
                        <div class="grid grid-cols-2 gap-3">
                            <label class="flex items-center gap-2.5 p-3.5 rounded-xl border-2 border-black cursor-pointer ${isBenar ? 'bg-emerald-200 border-black ring-2 ring-emerald-500 font-black' : 'bg-slate-50 font-bold'}">
                                <input type="radio" name="manual_quiz_bs_${idx}" value="Benar" ${isBenar ? 'checked' : ''} onchange="window.updateManualQuestionField(${idx}, 'kunci_pg', 'Benar'); window.renderManualQuizQuestions();" class="accent-emerald-700 w-4 h-4">
                                <span class="text-sm text-black">PERNYATAAN BENAR</span>
                            </label>
                            <label class="flex items-center gap-2.5 p-3.5 rounded-xl border-2 border-black cursor-pointer ${!isBenar ? 'bg-red-200 border-black ring-2 ring-red-500 font-black' : 'bg-slate-50 font-bold'}">
                                <input type="radio" name="manual_quiz_bs_${idx}" value="Salah" ${!isBenar ? 'checked' : ''} onchange="window.updateManualQuestionField(${idx}, 'kunci_pg', 'Salah'); window.renderManualQuizQuestions();" class="accent-red-700 w-4 h-4">
                                <span class="text-sm text-black">PERNYATAAN SALAH</span>
                            </label>
                        </div>
                    </div>
                `;
            } else if (currentType === 'singkat') {
                specificContent = `
                    <div class="pt-1">
                        <label class="block text-xs font-black uppercase text-black mb-1.5">Kunci Jawaban Singkat (Kata Kunci Jawaban Benar)</label>
                        <input type="text" placeholder="Contoh: RAM, CPU, Fotosintesis, atau angka pasti..." value="${escapeHtml(q.kunci_pg || '')}" oninput="window.updateManualQuestionField(${idx}, 'kunci_pg', this.value)" class="w-full h-11 px-3.5 border-2 border-black rounded-xl font-bold text-sm bg-slate-50 focus:bg-white text-slate-900">
                        <p class="text-[10px] text-slate-500 font-bold mt-1">Jawaban siswa akan dicocokkan otomatis (tidak membedakan huruf besar/kecil).</p>
                    </div>
                `;
            } else if (currentType === 'menjodohkan') {
                const pairs = Array.isArray(q.pasangan) ? q.pasangan : [];
                specificContent = `
                    <div class="space-y-2 pt-1">
                        <div class="flex justify-between items-center">
                            <label class="block text-xs font-black uppercase text-black">Pasangan Soal Menjodohkan</label>
                            <button type="button" onclick="window.addManualQuizPair(${idx})" class="text-xs bg-teal-600 hover:bg-black text-white font-black px-3 py-1.5 rounded-lg border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition">
                                Tambah Pasangan
                            </button>
                        </div>
                        <div class="space-y-2">
                            ${pairs.map((p, pIdx) => `
                                <div class="flex items-center gap-2 bg-teal-50/60 p-2.5 rounded-xl border border-teal-300">
                                    <span class="w-6 h-6 rounded-full bg-teal-700 text-white font-black text-xs flex items-center justify-center shrink-0">${pIdx + 1}</span>
                                    <input type="text" placeholder="Pernyataan Kiri (Premis)..." value="${escapeHtml(p.kiri || '')}" oninput="window.updateManualQuizPair(${idx}, ${pIdx}, 'kiri', this.value)" class="flex-1 h-10 px-3 border-2 border-black rounded-lg font-medium text-sm bg-white text-slate-900">
                                    <span class="font-black text-sm text-slate-400">&rarr;</span>
                                    <input type="text" placeholder="Jawaban Cocok Kanan..." value="${escapeHtml(p.kanan || '')}" oninput="window.updateManualQuizPair(${idx}, ${pIdx}, 'kanan', this.value)" class="flex-1 h-10 px-3 border-2 border-black rounded-lg font-medium text-sm bg-white text-slate-900">
                                    <button type="button" onclick="window.removeManualQuizPair(${idx}, ${pIdx})" class="w-8 h-8 rounded-lg border border-red-400 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center font-black transition text-sm shrink-0">
                                        &times;
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else if (currentType === 'upload_foto') {
                specificContent = `
                    <div class="pt-1 space-y-1.5">
                        <div class="p-2.5 bg-pink-50 border border-pink-300 rounded-xl text-xs font-bold text-pink-900 flex items-center gap-2">
                            <span></span> Siswa akan mengunggah berkas/foto lembar jawaban fisik langsung ke server melalui kamera/galeri.
                        </div>
                        <label class="block text-xs font-black uppercase text-black mb-1.5">Rubrik Penilaian & Ketentuan Lembar Foto</label>
                        <textarea rows="4" placeholder="Contoh: Foto hitungan rumus step-by-step dengan tulisan tangan rapi dan jelas..." oninput="window.updateManualQuestionField(${idx}, 'rubrik_esai', this.value)" class="w-full min-h-[95px] p-3 border-2 border-black rounded-xl font-medium text-sm text-slate-900 bg-slate-50 focus:bg-white leading-relaxed resize-y">${escapeHtml(q.rubrik_esai || '')}</textarea>
                    </div>
                `;
            } else {
                specificContent = `
                    <div class="pt-1">
                        <label class="block text-xs font-black uppercase text-black mb-1.5">Rubrik / Kunci Penilaian Jawaban Esai (Panduan Koreksi Guru & AI)</label>
                        <textarea rows="4" placeholder="Tuliskan kriteria penilaian atau poin-poin yang wajib dijawab siswa..." oninput="window.updateManualQuestionField(${idx}, 'rubrik_esai', this.value)" class="w-full min-h-[95px] p-3 border-2 border-black rounded-xl font-medium text-sm text-slate-900 bg-slate-50 focus:bg-white leading-relaxed resize-y">${escapeHtml(q.rubrik_esai || '')}</textarea>
                    </div>
                `;
            }

            return `
                <div class="border-2 border-black rounded-2xl p-4 md:p-5 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3.5">
                    <div class="flex items-center justify-between border-b-2 border-slate-200 pb-2.5 flex-wrap gap-2">
                        <div class="flex items-center gap-2">
                            <span class="w-7 h-7 rounded-lg bg-black text-white font-black text-xs flex items-center justify-center">
                                ${idx + 1}
                            </span>
                            <select onchange="window.changeManualQuestionType(${idx}, this.value)" class="h-8 px-2 border-2 border-black rounded-lg font-black text-xs ${typeColors[currentType] || 'bg-slate-100'} cursor-pointer">
                                <option value="pg" ${currentType === 'pg' ? 'selected' : ''}>Pilihan Ganda (PG)</option>
                                <option value="pg_kompleks" ${currentType === 'pg_kompleks' ? 'selected' : ''}>PG Kompleks (Multi Kunci)</option>
                                <option value="benar_salah" ${currentType === 'benar_salah' ? 'selected' : ''}>Benar / Salah</option>
                                <option value="singkat" ${currentType === 'singkat' ? 'selected' : ''}>Isian Singkat</option>
                                <option value="menjodohkan" ${currentType === 'menjodohkan' ? 'selected' : ''}>Menjodohkan</option>
                                <option value="upload_foto" ${currentType === 'upload_foto' ? 'selected' : ''}>Upload Foto / Berkas</option>
                                <option value="esai" ${currentType === 'esai' ? 'selected' : ''}>Esai / Uraian</option>
                            </select>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="flex items-center gap-1.5">
                                <label class="text-[11px] font-black uppercase text-slate-600">Bobot:</label>
                                <input type="number" min="1" max="100" value="${q.bobot || 10}" oninput="window.updateManualQuestionField(${idx}, 'bobot', this.value)" class="w-14 h-8 px-1.5 border-2 border-black rounded-lg font-black text-xs text-center bg-slate-50">
                            </div>
                            <button type="button" onclick="window.deleteManualQuestionItem(${idx})" title="Hapus Soal" class="w-8 h-8 rounded-lg border-2 border-red-500 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center font-black transition">
                                &times;
                            </button>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-black uppercase text-black mb-1.5">Pertanyaan Soal #${idx + 1}</label>
                        <textarea rows="5" placeholder="Tuliskan butir soal di sini..." oninput="window.updateManualQuestionField(${idx}, 'pertanyaan', this.value)" class="w-full min-h-[125px] p-3.5 border-2 border-black rounded-xl font-medium text-sm text-slate-900 bg-slate-50 focus:bg-white leading-relaxed resize-y shadow-inner">${escapeHtml(cleanPertanyaan)}</textarea>
                    </div>

                    <!-- Lampiran Stimulus Gambar Soal -->
                    <div class="p-2.5 rounded-xl border border-dashed border-slate-400 bg-slate-50/80 space-y-2">
                        <div class="flex items-center justify-between flex-wrap gap-2">
                            <span class="text-[11px] font-black uppercase text-slate-700 flex items-center gap-1.5">
                                <span></span> Lampiran Gambar Soal (Stimulus / Ilustrasi / Diagram)
                            </span>
                            ${q.gambar_url ? `
                                <button type="button" onclick="window.removeQuestionImage(${idx}, 'quiz')" class="text-[10px] font-black uppercase text-red-600 bg-red-100 hover:bg-red-200 px-2 py-0.5 rounded border border-red-300 transition">
                                    Hapus Gambar
                                </button>
                            ` : ''}
                        </div>

                        ${q.gambar_url ? `
                            <div class="flex items-center gap-3 bg-white p-2 rounded-lg border border-black">
                                <img src="${escapeHtml(q.gambar_url)}" alt="Preview Gambar Soal" class="h-16 w-20 object-contain rounded border border-slate-300 bg-slate-50 shrink-0" />
                                <div class="flex-1 min-w-0">
                                    <a href="${escapeHtml(q.gambar_url)}" target="_blank" class="text-xs font-bold text-indigo-700 hover:underline truncate block">
                                        ${escapeHtml(q.gambar_url)}
                                    </a>
                                    <span class="text-[10px] text-emerald-700 font-bold">Gambar aktif terpasang pada butir soal ini</span>
                                </div>
                            </div>
                        ` : `
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                                <div>
                                    <input type="file" id="quiz_img_file_${idx}" accept="image/*" class="hidden" onchange="window.handleQuestionImageUpload(event, ${idx}, 'quiz')">
                                    <button type="button" onclick="document.getElementById('quiz_img_file_${idx}').click()" class="w-full h-8 px-2.5 bg-white hover:bg-slate-100 border border-black rounded-lg text-xs font-black text-slate-800 flex items-center justify-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition">
                                        Pilih Gambar dari Komputer
                                    </button>
                                </div>
                                <div class="flex items-center gap-1.5">
                                    <input type="url" placeholder="Atau tempel URL gambar (https://...)" value="${escapeHtml(q.gambar_url || '')}" oninput="window.updateQuestionImage(${idx}, this.value, 'quiz')" class="w-full h-8 px-2.5 border border-black rounded-lg text-xs font-medium bg-white">
                                </div>
                            </div>
                        `}
                    </div>

                    ${specificContent}
                </div>
            `;
        }).join('');
    };

    window.saveManualQuiz = async () => {
        const mapel = document.getElementById('manual-quiz-mapel').value;
        const kelas = document.getElementById('manual-quiz-kelas').value || stateKelas[0] || 'Semua Kelas';
        const judul = document.getElementById('manual-quiz-judul').value.trim();
        const durasi = parseInt(document.getElementById('manual-quiz-durasi').value, 10) || 45;
        const petunjuk = document.getElementById('manual-quiz-petunjuk').value.trim() || 'Kerjakan dengan teliti, jujur, dan mandiri.';
        const violationLimit = parseInt(document.getElementById('manual-quiz-violation-limit')?.value || '3', 10);
        const fullscreenLock = document.getElementById('manual-quiz-fullscreen-lock')?.checked ?? true;
        const tokenVal = (document.getElementById('manual-quiz-token')?.value || '').trim().toUpperCase();
        const tokenEnabled = document.getElementById('manual-quiz-token-enabled')?.checked ?? true;
        const configObj = { 
            violation_limit: violationLimit, 
            fullscreen: fullscreenLock,
            token: tokenVal,
            token_required: tokenEnabled
        };
        const fullPetunjuk = `${petunjuk}\n[CONFIG:${JSON.stringify(configObj)}]`;

        if (!judul) {
            showCustomModal("Judul ujian / kuis wajib diisi!");
            return;
        }

        if (!manualQuizQuestions || manualQuizQuestions.length === 0) {
            showCustomModal("Tambahkan minimal 1 butir soal!");
            return;
        }

        for (let i = 0; i < manualQuizQuestions.length; i++) {
            const q = manualQuizQuestions[i];
            if (!q.pertanyaan || !q.pertanyaan.trim()) {
                showCustomModal(`Pertanyaan pada soal nomor ${i + 1} belum diisi!`);
                return;
            }
            if (q.tipe === 'pg' || q.tipe === 'pg_kompleks') {
                if (!q.opsi_a.trim() || !q.opsi_b.trim() || !q.opsi_c.trim() || !q.opsi_d.trim()) {
                    showCustomModal(`Pilihan jawaban (A, B, C, D) pada soal nomor ${i + 1} harus diisi lengkap!`);
                    return;
                }
                if (q.tipe === 'pg_kompleks' && (!q.kunci_pg || !q.kunci_pg.trim())) {
                    showCustomModal(`Pilih minimal 1 kunci jawaban benar untuk soal PG Kompleks nomor ${i + 1}!`);
                    return;
                }
            } else if (q.tipe === 'menjodohkan') {
                const pairs = q.pasangan || [];
                const validPairs = pairs.filter(p => p.kiri && p.kiri.trim() && p.kanan && p.kanan.trim());
                if (validPairs.length === 0) {
                    showCustomModal(`Pasangan pada soal nomor ${i + 1} harus diisi minimal 1 pasangan lengkap!`);
                    return;
                }
            }
        }

        const btn = document.getElementById('btn-save-manual-quiz');
        if (btn) {
            btn.disabled = true;
            btn.innerText = editingQuizId ? "Menyimpan Perubahan Kuis..." : "Menyimpan & Menerbitkan Kuis...";
        }

        try {
            if (editingQuizId) {
                let quizError = null;
                try {
                    const { error: err1 } = await supabase.from('quizzes').update({
                        mapel,
                        kelas,
                        judul_kuis: judul,
                        petunjuk: fullPetunjuk,
                        durasi_menit: durasi,
                        token: tokenVal,
                        token_required: tokenEnabled
                    }).eq('id', editingQuizId);
                    if (err1) throw err1;
                } catch (_) {
                    const { error: err2 } = await supabase.from('quizzes').update({
                        mapel,
                        kelas,
                        judul_kuis: judul,
                        petunjuk: fullPetunjuk,
                        durasi_menit: durasi
                    }).eq('id', editingQuizId);
                    quizError = err2;
                }

                if (quizError) throw quizError;

                const { error: delError } = await supabase.from('quiz_questions').delete().eq('quiz_id', editingQuizId);
                if (delError) throw delError;

                const questionsPayload = manualQuizQuestions.map((q, idx) => {
                    let rubrik = q.rubrik_esai ? q.rubrik_esai.trim() : '';
                    if (q.tipe === 'menjodohkan') {
                        rubrik = JSON.stringify(q.pasangan || []);
                    }
                    let kunci = q.kunci_pg || '';
                    if (q.tipe === 'benar_salah' && !kunci) kunci = 'Benar';
                    if ((q.tipe === 'pg' || q.tipe === 'pg_kompleks') && !kunci) kunci = 'A';

                    let cleanText = splitQuestionImage(q.pertanyaan || '').text.trim();
                    if (q.gambar_url && q.gambar_url.trim()) {
                        cleanText += `\n[GAMBAR: ${q.gambar_url.trim()}]`;
                    }

                    return {
                        quiz_id: editingQuizId,
                        nomor: idx + 1,
                        tipe: q.tipe || 'pg',
                        pertanyaan: cleanText,
                        opsi_a: q.opsi_a ? q.opsi_a.trim() : '',
                        opsi_b: q.opsi_b ? q.opsi_b.trim() : '',
                        opsi_c: q.opsi_c ? q.opsi_c.trim() : '',
                        opsi_d: q.opsi_d ? q.opsi_d.trim() : '',
                        kunci_pg: kunci,
                        rubrik_esai: rubrik,
                        bobot: parseInt(q.bobot, 10) || 10
                    };
                });

                const { error: qError } = await supabase.from('quiz_questions').insert(questionsPayload);
                if (qError) throw qError;

                editingQuizId = null;
                closeManualQuizModal();
                loadQuizzes();
                const typesSummary = [...new Set(manualQuizQuestions.map(q => q.tipe || 'pg'))].join(', ');
                showCustomModal(`Berhasil! Perubahan kuis "${judul}" (${manualQuizQuestions.length} butir soal: ${typesSummary}) telah disimpan!`);
            } else {
                let quizData = null;
                let quizError = null;
                try {
                    const { data: qd, error: qErr } = await supabase.from('quizzes').insert([{
                        teacher_id: currentSession?.user?.id,
                        guru_id: currentTeacher?.id || currentSession?.user?.id,
                        mapel,
                        kelas,
                        judul_kuis: judul,
                        petunjuk: fullPetunjuk,
                        durasi_menit: durasi,
                        status: 'aktif',
                        token: tokenVal,
                        token_required: tokenEnabled
                    }]).select().single();
                    if (qErr) throw qErr;
                    quizData = qd;
                } catch (_) {
                    const { data: qd2, error: qErr2 } = await supabase.from('quizzes').insert([{
                        teacher_id: currentSession?.user?.id,
                        guru_id: currentTeacher?.id || currentSession?.user?.id,
                        mapel,
                        kelas,
                        judul_kuis: judul,
                        petunjuk: fullPetunjuk,
                        durasi_menit: durasi,
                        status: 'aktif'
                    }]).select().single();
                    if (qErr2) throw qErr2;
                    quizData = qd2;
                }

                if (!quizData || !quizData.id) {
                    throw new Error("Gagal menyimpan data kuis ke database.");
                }

                const questionsPayload = manualQuizQuestions.map((q, idx) => {
                    let rubrik = q.rubrik_esai ? q.rubrik_esai.trim() : '';
                    if (q.tipe === 'menjodohkan') {
                        rubrik = JSON.stringify(q.pasangan || []);
                    }
                    let kunci = q.kunci_pg || '';
                    if (q.tipe === 'benar_salah' && !kunci) kunci = 'Benar';
                    if (q.tipe === 'pg' && !kunci) kunci = 'A';

                    let cleanText = splitQuestionImage(q.pertanyaan || '').text.trim();
                    if (q.gambar_url && q.gambar_url.trim()) {
                        cleanText += `\n[GAMBAR: ${q.gambar_url.trim()}]`;
                    }

                    return {
                        quiz_id: quizData.id,
                        nomor: idx + 1,
                        tipe: q.tipe || 'pg',
                        pertanyaan: cleanText,
                        opsi_a: q.opsi_a ? q.opsi_a.trim() : '',
                        opsi_b: q.opsi_b ? q.opsi_b.trim() : '',
                        opsi_c: q.opsi_c ? q.opsi_c.trim() : '',
                        opsi_d: q.opsi_d ? q.opsi_d.trim() : '',
                        kunci_pg: kunci,
                        rubrik_esai: rubrik,
                        bobot: parseInt(q.bobot, 10) || 10
                    };
                });

                const { error: qError } = await supabase.from('quiz_questions').insert(questionsPayload);
                if (qError) throw qError;

                closeManualQuizModal();
                loadQuizzes();
                const typesSummary = [...new Set(manualQuizQuestions.map(q => q.tipe || 'pg'))].join(', ');
                showCustomModal(`Berhasil! Kuis manual "${judul}" (${manualQuizQuestions.length} butir soal: ${typesSummary}) telah berhasil diterbitkan untuk ${kelas}!`);
            }
        } catch (e) {
            showCustomModal("Gagal menyimpan kuis manual: " + e.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = editingQuizId ? "SIMPAN PERUBAHAN KUIS" : "SIMPAN & TERBITKAN KUIS";
            }
        }
    };

    window.openQuizModal = () => {
        openManualQuizModal();
    };

    window.deleteQuiz = async (id) => {
        const conf = await showCustomModal("Hapus kuis ini beserta semua butir soalnya?", "confirm");
        if (!conf) return;
        try {
            const { error } = await supabase.from('quizzes').delete().eq('id', id);
            if (error) throw error;
            loadQuizzes();
        } catch (e) {
            showCustomModal("Gagal menghapus kuis: " + e.message);
        }
    };

    // ========================================================
    // CBT EXAM RESULTS & LIVE ANTI-CHEAT MONITORING
    // ========================================================
    let activeQuizForResults = null;
    let activeQuizSubmissions = [];
    let resultsLiveRefreshInterval = null;
    let resultsRealtimeChannel = null;

    window.openQuizResultsModal = async (quizId) => {
        const quiz = quizzesList.find(q => String(q.id) === String(quizId));
        if (!quiz) return;
        activeQuizForResults = quiz;

        document.getElementById('quiz-results-title').textContent = `${quiz.judul_kuis} (${quiz.mapel})`;
        const tbody = document.getElementById('quiz-submissions-tbody');
        tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center font-bold text-slate-500 uppercase animate-pulse">Memuat hasil dan sesi live ujian siswa...</td></tr>';
        
        // Reset search & filters
        const searchInput = document.getElementById('search-results-student');
        if (searchInput) searchInput.value = '';
        const statusSelect = document.getElementById('filter-results-status');
        if (statusSelect) statusSelect.value = 'all';

        document.getElementById('quiz-results-modal').classList.remove('hidden');

        // Fetch submissions
        await fetchAndRenderQuizSubmissions(quizId);

        // Berlangganan event Realtime Supabase untuk monitoring seketika (0 delay)
        if (resultsRealtimeChannel) {
            try { supabase.removeChannel(resultsRealtimeChannel); } catch (_) {}
            resultsRealtimeChannel = null;
        }
        try {
            resultsRealtimeChannel = supabase.channel(`admin_quiz_${quizId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'quiz_submissions',
                        filter: `quiz_id=eq.${quizId}`
                    },
                    () => {
                        refreshQuizSubmissionsDataSilently();
                    }
                )
                .subscribe();
        } catch (_) {}

        // Tetap pasang interval refresh berkala sebagai fallback cadangan
        if (resultsLiveRefreshInterval) clearInterval(resultsLiveRefreshInterval);
        resultsLiveRefreshInterval = setInterval(() => {
            refreshQuizSubmissionsDataSilently();
        }, 3000);
    };

    async function fetchAndRenderQuizSubmissions(quizId) {
        try {
            const { data, error } = await supabase
                .from('quiz_submissions')
                .select('*')
                .eq('quiz_id', quizId)
                .order('total_nilai', { ascending: false });

            if (error) throw error;
            activeQuizSubmissions = data || [];

            // Populate filter-results-kelas dynamically
            const kelasSelect = document.getElementById('filter-results-kelas');
            if (kelasSelect) {
                const currentVal = kelasSelect.value || 'all';
                const submissionClasses = activeQuizSubmissions.map(s => String(s.kelas || '').trim()).filter(Boolean);
                
                // Ambil daftar kelas nyata dari roster siswa
                const rosterClasses = (stateStudents || []).map(r => String(r.kelas || '').trim()).filter(Boolean);
                const allRealClasses = [...new Set([...submissionClasses, ...rosterClasses])].sort();

                // Deteksi kelas nyata yang relevan dengan tingkat ujian ini
                const targetK = String(activeQuizForResults?.kelas || '').trim();
                let applicableClasses = allRealClasses;
                if (targetK && targetK !== 'Semua Kelas') {
                    if (targetK.includes('9') || targetK.toUpperCase().includes('IX')) {
                        applicableClasses = allRealClasses.filter(c => c.startsWith('9.') || c.startsWith('9') || c.toUpperCase().includes('IX'));
                    } else if (targetK.includes('8') || targetK.toUpperCase().includes('VIII')) {
                        applicableClasses = allRealClasses.filter(c => c.startsWith('8.') || c.startsWith('8') || c.toUpperCase().includes('VIII'));
                    } else if (targetK.includes('7') || targetK.toUpperCase().includes('VII')) {
                        applicableClasses = allRealClasses.filter(c => c.startsWith('7.') || c.startsWith('7') || c.toUpperCase().includes('VII'));
                    } else if (allRealClasses.includes(targetK)) {
                        applicableClasses = [targetK];
                    }
                }

                // Masukkan juga kelas nyata yang sudah ada submission-nya dan bersihkan label non-kelas
                const distinctClasses = [...new Set([...applicableClasses, ...submissionClasses])].filter(c => {
                    return c && !c.toLowerCase().includes('semua kelas');
                }).sort();

                kelasSelect.innerHTML = '<option value="all">Semua Kelas Peserta Ujian</option>' +
                    distinctClasses.map(k => `<option value="${escapeHtml(k)}" ${k === currentVal ? 'selected' : ''}>Kelas ${escapeHtml(k)}</option>`).join('');
                
                // Pertahankan pilihan filter guru jika valid, atau default 'all' agar semua siswa langsung tampil
                if (currentVal !== 'all' && distinctClasses.includes(currentVal)) {
                    kelasSelect.value = currentVal;
                } else {
                    kelasSelect.value = 'all';
                }
            }

            applyQuizResultsFilters();

        } catch (e) {
            const tbody = document.getElementById('quiz-submissions-tbody');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-red-600 font-bold uppercase">Gagal memuat: ${escapeHtml(e.message)}</td></tr>`;
            }
        }
    }

    async function refreshQuizSubmissionsDataSilently() {
        if (!activeQuizForResults) return;
        try {
            const { data, error } = await supabase
                .from('quiz_submissions')
                .select('*')
                .eq('quiz_id', activeQuizForResults.id)
                .order('total_nilai', { ascending: false });

            if (error) return;
            activeQuizSubmissions = data || [];
            applyQuizResultsFilters(true);
        } catch (_) {}
    }

    window.applyQuizResultsFilters = (isSilent = false) => {
        if (!activeQuizForResults) return;

        const selectedKelas = document.getElementById('filter-results-kelas')?.value || 'all';
        const selectedStatus = document.getElementById('filter-results-status')?.value || 'all';
        const searchQuery = (document.getElementById('search-results-student')?.value || '').trim().toLowerCase();

        const totalQ = (activeQuizForResults.quiz_questions || []).length || 1;

        // Categorize each submission
        const enriched = activeQuizSubmissions.map(sub => {
            let cheatAttempts = 0;
            let cheatLogs = [];
            let isFocus = true;
            let isOnline = true;
            let lastActiveAt = sub.updated_at || sub.created_at;
            let progress = 0;

            if (sub.jawaban_siswa && typeof sub.jawaban_siswa === 'object') {
                cheatAttempts = sub.jawaban_siswa.cheatAttempts || 0;
                cheatLogs = sub.jawaban_siswa.cheatLogs || [];
                isFocus = sub.jawaban_siswa.isFocus !== false;
                isOnline = sub.jawaban_siswa.isOnline !== false;
                lastActiveAt = sub.jawaban_siswa.lastActiveAt || lastActiveAt;
                progress = Object.keys(sub.jawaban_siswa.answers || {}).length;
            } else if (typeof sub.jawaban_siswa === 'string') {
                try {
                    const parsed = JSON.parse(sub.jawaban_siswa);
                    cheatAttempts = parsed.cheatAttempts || 0;
                    cheatLogs = parsed.cheatLogs || [];
                    isFocus = parsed.isFocus !== false;
                    isOnline = parsed.isOnline !== false;
                    lastActiveAt = parsed.lastActiveAt || lastActiveAt;
                    progress = Object.keys(parsed.answers || {}).length;
                } catch (_) {}
            }

            const isLocked = sub.status_koreksi === 'terkunci_curang';
            const isOngoing = sub.status_koreksi === 'sedang_ujian';

            // Check if active or inactive
            const lastActiveTime = lastActiveAt ? new Date(lastActiveAt).getTime() : 0;
            const isOffline = (Date.now() - lastActiveTime) > 30000; // > 30 detik tanpa heartbeat

            let liveState = 'done';
            if (isLocked) {
                liveState = 'locked';
            } else if (isOngoing) {
                if (!isFocus || !isOnline || isOffline) {
                    liveState = 'unfocus';
                } else {
                    liveState = 'focus';
                }
            } else if (sub.status_koreksi === 'belum_dikoreksi' || sub.status_koreksi === 'perlu_dinilai') {
                liveState = 'review';
            }

            return {
                ...sub,
                cheatAttempts,
                cheatLogs,
                isLocked,
                isOngoing,
                isFocus,
                isOnline,
                isOffline,
                liveState,
                progress,
                totalQ
            };
        });

        // 1. Calculate statistics for the selected class
        const classFiltered = selectedKelas === 'all'
            ? enriched
            : enriched.filter(s => {
                const sk = String(s.kelas || '').trim();
                return sk === selectedKelas || (selectedKelas.length === 1 && sk.startsWith(selectedKelas));
            });

        const statTotal = classFiltered.length;
        const statFocus = classFiltered.filter(s => s.liveState === 'focus').length;
        const statUnfocus = classFiltered.filter(s => s.liveState === 'unfocus').length;
        const statLocked = classFiltered.filter(s => s.liveState === 'locked').length;
        const statDone = classFiltered.filter(s => s.liveState === 'done' || s.liveState === 'review').length;

        const completedList = classFiltered.filter(s => s.status_koreksi === 'selesai');
        const statAvg = completedList.length > 0
            ? Math.round(completedList.reduce((acc, s) => acc + Number(s.total_nilai || 0), 0) / completedList.length)
            : 0;

        const totalEl = document.getElementById('stat-results-total');
        const focusEl = document.getElementById('stat-results-focus');
        const unfocusEl = document.getElementById('stat-results-unfocus');
        const lockedEl = document.getElementById('stat-results-locked');
        const doneEl = document.getElementById('stat-results-done');
        const avgEl = document.getElementById('stat-results-avg');

        if (totalEl) totalEl.textContent = statTotal;
        if (focusEl) focusEl.textContent = statFocus;
        if (unfocusEl) unfocusEl.textContent = statUnfocus;
        if (lockedEl) lockedEl.textContent = statLocked;
        if (doneEl) doneEl.textContent = statDone;
        if (avgEl) avgEl.textContent = completedList.length > 0 ? statAvg : '-';

        // 2. Filter displayed rows by Class, Status, and Search Query
        const finalFiltered = classFiltered.filter(sub => {
            const matchStatus = selectedStatus === 'all' || sub.liveState === selectedStatus;
            const studentName = String(sub.nama_siswa || '').toLowerCase();
            const studentNisn = String(sub.student_id || '').toLowerCase();
            const matchSearch = !searchQuery || studentName.includes(searchQuery) || studentNisn.includes(searchQuery);
            return matchStatus && matchSearch;
        });

        const tbody = document.getElementById('quiz-submissions-tbody');
        if (!tbody) return;

        if (finalFiltered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center font-bold text-slate-500 uppercase">Tidak ada peserta ujian yang cocok dengan kriteria filter saat ini.</td></tr>`;
            return;
        }

        tbody.innerHTML = finalFiltered.map((sub, idx) => {
            // Live Status & Anti-Cheat Badge
            let antiCheatBadge = '';
            let rowHighlight = '';

            if (sub.isLocked) {
                rowHighlight = 'bg-red-50/60';
                antiCheatBadge = `
                    <div class="inline-flex flex-col items-center gap-0.5">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-900 border-2 border-red-500 rounded-xl font-black text-[11px] uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            <span class="w-2 h-2 rounded-full bg-red-600"></span>
                            Terkunci Curang
                        </span>
                        <span class="text-[10px] font-bold text-red-700">(${sub.cheatAttempts}x Pelanggaran)</span>
                    </div>
                `;
            } else if (sub.isOngoing) {
                if (!sub.isFocus) {
                    rowHighlight = 'bg-amber-50/70';
                    antiCheatBadge = `
                        <div class="inline-flex flex-col items-center gap-0.5">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-300 text-yellow-950 border-2 border-black rounded-xl font-black text-[11px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-pulse">
                                <span class="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                                Di Luar Ujian / Tidak Fokus
                            </span>
                            ${sub.cheatAttempts > 0 ? `<span class="text-[10px] font-bold text-red-600">(${sub.cheatAttempts}x Pelanggaran)</span>` : `<span class="text-[10px] font-bold text-amber-800">(Pindah Tab / Jendela)</span>`}
                        </div>
                    `;
                } else if (sub.isOffline || !sub.isOnline) {
                    rowHighlight = 'bg-slate-50';
                    antiCheatBadge = `
                        <div class="inline-flex flex-col items-center gap-0.5">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-200 text-slate-800 border-2 border-slate-500 rounded-xl font-bold text-[11px] uppercase">
                                <span class="w-2 h-2 rounded-full bg-slate-500"></span>
                                Terputus / Menutup Tab
                            </span>
                            ${sub.cheatAttempts > 0 ? `<span class="text-[10px] font-bold text-red-600">(${sub.cheatAttempts}x Pelanggaran)</span>` : ''}
                        </div>
                    `;
                } else {
                    antiCheatBadge = `
                        <div class="inline-flex flex-col items-center gap-0.5">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-950 border-2 border-emerald-500 rounded-xl font-black text-[11px] uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                Fokus Mengerjakan
                            </span>
                            ${sub.cheatAttempts > 0 ? `<span class="text-[10px] font-bold text-amber-700">(${sub.cheatAttempts}x Peringatan)</span>` : ''}
                        </div>
                    `;
                }
            } else {
                const isReview = sub.status_koreksi === 'belum_dikoreksi' || sub.status_koreksi === 'perlu_dinilai';
                antiCheatBadge = `
                    <div class="inline-flex flex-col items-center gap-0.5">
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 ${isReview ? 'bg-amber-100 text-amber-900 border-2 border-amber-500' : 'bg-slate-100 text-slate-800 border border-slate-400'} rounded-xl font-bold text-[11px] uppercase">
                            ${isReview ? 'Perlu Dinilai Esai' : 'Selesai Ujian'}
                        </span>
                        ${sub.cheatAttempts > 0 ? `<span class="text-[10px] font-bold text-amber-700">(${sub.cheatAttempts}x Peringatan)</span>` : ''}
                    </div>
                `;
            }

            // Progress bar
            const pct = Math.min(100, Math.round((sub.progress / totalQ) * 100));
            const progressHtml = `
                <div class="flex flex-col items-center justify-center gap-1.5 whitespace-nowrap">
                    <span class="font-black text-xs text-black leading-none">${sub.progress} / ${totalQ} Soal</span>
                    <div class="w-24 bg-slate-200 rounded-full h-2 border border-black overflow-hidden shrink-0">
                        <div class="${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-600'} h-full transition-all duration-300" style="width: ${pct}%"></div>
                    </div>
                    <span class="text-[10px] font-mono font-bold text-slate-600 leading-none">${pct}% Terjawab</span>
                </div>
            `;

            // Score badge (Clean, single-line, bold neobrutalism badge)
            let scoreBadge = '';
            if (sub.isOngoing) {
                scoreBadge = `<span class="inline-flex items-center justify-center px-3 py-1 bg-yellow-200 text-yellow-950 border-2 border-black rounded-xl font-black text-xs uppercase whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Sedang Ujian</span>`;
            } else if (sub.isLocked) {
                scoreBadge = `<span class="inline-flex items-center justify-center px-3 py-1 bg-red-100 text-red-900 border-2 border-red-500 rounded-xl font-black text-sm uppercase whitespace-nowrap shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">${sub.total_nilai || 0}</span>`;
            } else {
                scoreBadge = `<span class="inline-flex items-center justify-center px-3 py-1 bg-emerald-400 text-black border-2 border-black rounded-xl font-black text-sm uppercase whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">${sub.total_nilai || 0}</span>`;
            }

            // Clean action buttons: strictly mutually exclusive based on student state
            let contextActionButtons = '';
            if (sub.isLocked) {
                // 1. Siswa Terkunci Anti-Cheat -> Hanya tampilkan Buka Kunci
                contextActionButtons = `
                    <button type="button" onclick="unlockStudentExam('${sub.id}')" title="Buka kunci akun agar siswa dapat melanjutkan pengerjaan" class="h-8 px-3 bg-amber-400 hover:bg-amber-500 text-black border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition inline-flex items-center gap-1">
                        Buka Kunci
                    </button>
                `;
            } else if (sub.isOngoing) {
                // 2. Siswa Sedang Ujian -> Jika ada pelanggaran tampilkan Reset Curang, dan tombol Paksa Selesai
                contextActionButtons = `
                    ${sub.cheatAttempts > 0 ? `
                        <button type="button" onclick="unlockStudentExam('${sub.id}')" title="Reset jumlah pelanggaran anti-kecurangan kembali ke 0" class="h-8 px-3 bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition inline-flex items-center gap-1">
                            Reset Curang (0)
                        </button>
                    ` : ''}
                    <button type="button" onclick="forceFinishStudentExam('${sub.id}')" title="Paksa selesai dan kumpulkan ujian siswa sekarang" class="h-8 px-3 bg-orange-400 hover:bg-orange-500 text-black border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition inline-flex items-center gap-1">
                        Paksa Selesai
                    </button>
                `;
            } else {
                // 3. Siswa Sudah Selesai / Dinilai -> Hanya tampilkan Buka Kembali jika ingin ujian dilanjutkan
                contextActionButtons = `
                    <button type="button" onclick="reopenStudentExamSession('${sub.id}')" title="Buka kembali ujian yang sudah selesai agar siswa bisa melanjutkan pengerjaan" class="h-8 px-3 bg-blue-300 hover:bg-blue-400 text-black border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition inline-flex items-center gap-1">
                        Buka Kembali
                    </button>
                `;
            }

            const actionButtons = `
                <div class="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                    <button type="button" onclick="openExamReviewModal('${sub.id}')" title="Periksa lembar jawaban & rincian soal" class="h-8 px-3 bg-black hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition inline-flex items-center gap-1">
                        Periksa
                    </button>
                    ${contextActionButtons}
                    <button type="button" onclick="resetStudentExamSession('${sub.id}')" title="Hapus bersih sesi agar siswa bisa ujian dari awal nomor 1" class="h-8 px-3 bg-red-100 hover:bg-red-200 text-red-700 border-2 border-red-400 rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition inline-flex items-center gap-1">
                        Reset
                    </button>
                </div>
            `;

            return `
                <tr class="hover:bg-slate-50 transition ${rowHighlight}">
                    <td class="px-3 py-3 text-center font-black text-slate-700 border-b-2 border-black border-r-2">${idx + 1}</td>
                    <td class="px-4 py-3 font-black text-black border-b-2 border-black border-r-2">
                        <div>${escapeHtml(sub.nama_siswa)}</div>
                        ${sub.student_id ? `<div class="text-[10px] font-mono font-bold text-slate-500">NISN: ${escapeHtml(sub.student_id)}</div>` : ''}
                    </td>
                    <td class="px-3 py-3 text-center font-black text-black border-b-2 border-black border-r-2">${escapeHtml(sub.kelas || '-')}</td>
                    <td class="px-4 py-3 text-center border-b-2 border-black border-r-2 whitespace-nowrap">${antiCheatBadge}</td>
                    <td class="px-4 py-3 text-center border-b-2 border-black border-r-2 whitespace-nowrap">${progressHtml}</td>
                    <td class="px-4 py-3 text-center border-b-2 border-black border-r-2 whitespace-nowrap">${scoreBadge}</td>
                    <td class="px-4 py-3 text-center border-b-2 border-black whitespace-nowrap">${actionButtons}</td>
                </tr>
            `;
        }).join('');
    };

    window.unlockStudentExam = async (subId) => {
        const subRef = activeQuizSubmissions.find(s => String(s.id) === String(subId));
        const studentName = subRef?.nama_siswa || 'siswa ini';
        const isLocked = subRef?.status_koreksi === 'terkunci_curang';
        const modalTitle = isLocked ? 'Buka Kunci Akun Siswa' : 'Reset Pelanggaran Anti-Cheat';
        const modalMsg = isLocked
            ? `Buka kunci akun siswa "${studentName}"?\n\nSiswa akan diizinkan login kembali menggunakan token aktif dan melanjutkan pengerjaan soal. Jumlah pelanggaran anti-kecurangan akan di-reset ke 0, dan seluruh jawaban yang sudah diisi sebelumnya tetap tersimpan utuh.`
            : `Reset pelanggaran anti-kecurangan untuk "${studentName}" kembali menjadi 0?\n\nJumlah pelanggaran akan kembali aman (0 Pelanggaran) dan status siswa menjadi fokus. Seluruh jawaban yang sudah diisi siswa tetap tersimpan utuh.`;

        const conf = await showCustomModal(modalMsg, 'confirm', modalTitle, '');
        if (!conf) return;

        try {
            const { data: cur, error: getErr } = await supabase.from('quiz_submissions').select('*').eq('id', subId).single();
            if (getErr) throw getErr;

            let curJawaban = cur?.jawaban_siswa || {};
            if (typeof curJawaban === 'string') {
                try { curJawaban = JSON.parse(curJawaban); } catch (_) { curJawaban = {}; }
            }
            curJawaban.cheatAttempts = 0;
            curJawaban.cheatLogs = [];
            curJawaban.lockedDueToCheating = false;
            curJawaban.isFocus = true;
            curJawaban.isOnline = true;
            curJawaban.unlockedAt = new Date().toISOString();

            const { error: updErr } = await supabase.from('quiz_submissions').update({
                status_koreksi: 'sedang_ujian',
                jawaban_siswa: curJawaban
            }).eq('id', subId);

            if (updErr) throw updErr;

            // Segera sinkronkan state lokal admin
            const localSub = activeQuizSubmissions.find(s => String(s.id) === String(subId));
            if (localSub) {
                localSub.status_koreksi = 'sedang_ujian';
                localSub.jawaban_siswa = curJawaban;
                localSub.cheatAttempts = 0;
                localSub.isLocked = false;
                localSub.isFocus = true;
                localSub.isOnline = true;
            }
            if (typeof applyQuizResultsFilters === 'function') {
                applyQuizResultsFilters(true);
            }

            await showCustomModal(`Berhasil! Pelanggaran anti-cheat siswa "${studentName}" telah di-reset ke 0 dan status ujian aktif kembali. Siswa dapat melanjutkan pengerjaan.`, 'alert', 'Pelanggaran Direset', '');
            if (activeQuizForResults) {
                openQuizResultsModal(activeQuizForResults.id);
            }
            const unlockBtn = document.getElementById('btn-review-unlock-student');
            if (unlockBtn) unlockBtn.classList.add('hidden');
        } catch (err) {
            showCustomModal("Gagal mereset pelanggaran akun: " + err.message);
        }
    };

    window.reopenStudentExamSession = async (subId) => {
        const subRef = activeQuizSubmissions.find(s => String(s.id) === String(subId));
        const studentName = subRef?.nama_siswa || 'siswa ini';
        const conf = await showCustomModal(
            `Buka kembali ujian untuk siswa "${studentName}"?\n\nStatus ujian siswa akan diubah dari "Selesai" menjadi "Sedang Ujian". Pelanggaran anti-kecurangan di-reset ke 0, dan seluruh jawaban siswa yang tersimpan tetap utuh sehingga siswa dapat memasukkan token ujian dan langsung melanjutkan pengerjaan.`,
            'confirm',
            'Buka Kembali Sesi Ujian',
            ''
        );
        if (!conf) return;

        try {
            const { data: cur, error: getErr } = await supabase.from('quiz_submissions').select('*').eq('id', subId).single();
            if (getErr) throw getErr;

            let curJawaban = cur?.jawaban_siswa || {};
            if (typeof curJawaban === 'string') {
                try { curJawaban = JSON.parse(curJawaban); } catch (_) { curJawaban = {}; }
            }
            curJawaban.cheatAttempts = 0;
            curJawaban.cheatLogs = [];
            curJawaban.lockedDueToCheating = false;
            curJawaban.isFocus = true;
            curJawaban.isOnline = true;
            curJawaban.unlockedAt = new Date().toISOString();

            const { error: updErr } = await supabase.from('quiz_submissions').update({
                status_koreksi: 'sedang_ujian',
                jawaban_siswa: curJawaban
            }).eq('id', subId);

            if (updErr) throw updErr;

            // Segera sinkronkan state lokal admin
            const localSub = activeQuizSubmissions.find(s => String(s.id) === String(subId));
            if (localSub) {
                localSub.status_koreksi = 'sedang_ujian';
                localSub.jawaban_siswa = curJawaban;
                localSub.cheatAttempts = 0;
                localSub.isLocked = false;
                localSub.isFocus = true;
                localSub.isOnline = true;
            }
            if (typeof applyQuizResultsFilters === 'function') {
                applyQuizResultsFilters(true);
            }

            await showCustomModal(`Sesi ujian siswa "${studentName}" berhasil dibuka kembali! Siswa dapat membuka lembar ujian dengan token dan melanjutkan.`, 'alert', 'Ujian Berhasil Dibuka Kembali', '');
            if (activeQuizForResults) {
                openQuizResultsModal(activeQuizForResults.id);
            }
        } catch (err) {
            showCustomModal("Gagal membuka kembali sesi ujian: " + err.message);
        }
    };

    window.resetStudentExamSession = async (subId) => {
        const subRef = activeQuizSubmissions.find(s => String(s.id) === String(subId));
        const studentName = subRef?.nama_siswa || '';
        const studentId = subRef?.student_id || '';
        const quizId = activeQuizForResults?.id || subRef?.quiz_id;

        const conf = await showCustomModal(
            `PERINGATAN: Reset sesi ujian siswa "${studentName || 'ini'}"?\n\nSemua jawaban dan status siswa pada ujian ini akan DIHAPUS BERSIH dari sistem. Siswa akan dapat login kembali dari awal nomor 1 seperti peserta baru.`,
            'confirm',
            'Reset Bersih Sesi Ujian',
            ''
        );
        if (!conf) return;

        try {
            // Hapus berdasarkan ID baris ini
            const { error: delErr1 } = await supabase.from('quiz_submissions').delete().eq('id', subId);
            if (delErr1) throw delErr1;

            // Hapus juga riwayat lain siswa ini di kuis ini jika ada data duplikat/lama agar tidak bentrok status 'selesai'
            if (quizId && studentName) {
                await supabase.from('quiz_submissions')
                    .delete()
                    .eq('quiz_id', quizId)
                    .ilike('nama_siswa', studentName);
            }
            if (quizId && studentId) {
                await supabase.from('quiz_submissions')
                    .delete()
                    .eq('quiz_id', quizId)
                    .eq('student_id', studentId);
            }

            await showCustomModal(`Sesi ujian siswa "${studentName}" berhasil direset bersih. Siswa dapat login kembali dari awal.`, 'alert', 'Sesi Direset', '');
            if (activeQuizForResults) {
                openQuizResultsModal(activeQuizForResults.id);
            }
        } catch (err) {
            showCustomModal("Gagal reset sesi: " + err.message);
        }
    };

    window.unlockCurrentReviewStudent = async () => {
        if (!activeReviewSubmission) return;
        await window.unlockStudentExam(activeReviewSubmission.id);
        closeExamReviewModal();
    };

    window.forceFinishStudentExam = async (subId) => {
        const subRef = activeQuizSubmissions.find(s => String(s.id) === String(subId));
        const studentName = subRef?.nama_siswa || 'siswa ini';
        const conf = await showCustomModal(
            `Paksa selesai sesi ujian untuk siswa "${studentName}"?\n\nJawaban yang sudah tersimpan akan dinilai otomatis, lalu sesi ujian ditutup.`,
            'confirm',
            'Paksa Selesai Ujian',
            ''
        );
        if (!conf) return;

        try {
            const { data: cur, error: getErr } = await supabase.from('quiz_submissions').select('*').eq('id', subId).single();
            if (getErr) throw getErr;

            const questions = activeQuizForResults?.quiz_questions || [];
            const answers = getSubmissionAnswers(cur);
            const { autoScoreTotal, autoSubjectiveScore, hasSubjective } = calculateExamScore(questions, answers);
            const finalStatus = hasSubjective ? 'belum_dikoreksi' : 'selesai';
            const finalScore = toPercent(autoScoreTotal + autoSubjectiveScore, getMaxScore(questions));

            const { data: updatedRows, error } = await supabase.from('quiz_submissions').update({
                skor_pg: autoScoreTotal,
                skor_esai: autoSubjectiveScore,
                total_nilai: finalScore,
                status_koreksi: finalStatus
            }).eq('id', subId).eq('status_koreksi', 'sedang_ujian').select('id');
            if (error) throw error;
            if (!updatedRows || updatedRows.length === 0) {
                throw new Error('Sesi sudah dikumpulkan oleh siswa. Muat ulang daftar hasil.');
            }
            await showCustomModal(`Sesi ujian siswa "${studentName}" telah diselesaikan oleh pengawas.`, 'alert', 'Ujian Ditutup', '');
            if (activeQuizForResults) {
                openQuizResultsModal(activeQuizForResults.id);
            }
        } catch (err) {
            showCustomModal("Gagal menyelesaikan ujian: " + err.message);
        }
    };

    window.closeQuizResultsModal = () => {
        if (resultsLiveRefreshInterval) {
            clearInterval(resultsLiveRefreshInterval);
            resultsLiveRefreshInterval = null;
        }
        if (resultsRealtimeChannel) {
            try { supabase.removeChannel(resultsRealtimeChannel); } catch (_) {}
            resultsRealtimeChannel = null;
        }
        document.getElementById('quiz-results-modal').classList.add('hidden');
        activeQuizForResults = null;
    };

    window.exportQuizCSV = () => {
        if (!activeQuizSubmissions || activeQuizSubmissions.length === 0) {
            showCustomModal("Tidak ada data hasil ujian untuk diekspor.");
            return;
        }

        const selectedKelas = document.getElementById('filter-results-kelas')?.value || 'all';
        const filtered = selectedKelas === 'all'
            ? activeQuizSubmissions
            : activeQuizSubmissions.filter(s => String(s.kelas || '').trim() === selectedKelas);

        if (filtered.length === 0) {
            showCustomModal("Tidak ada data siswa pada kelas yang dipilih untuk diekspor.");
            return;
        }

        let csv = "\uFEFF";
        csv += "No,Nama Siswa,NISN,Kelas,Status Ujian,Progres Soal,Skor PG,Skor Esai,Nilai Akhir,Status Ketuntasan,Pelanggaran Anti-Cheat,Waktu Selesai\n";

        const totalQ = (activeQuizForResults?.quiz_questions || []).length || 0;

        filtered.forEach((s, idx) => {
            const dateStr = s.updated_at || s.created_at ? new Date(s.updated_at || s.created_at).toLocaleString('id-ID') : '';
            let statusStr = 'Menunggu Koreksi';
            if (s.status_koreksi === 'selesai') statusStr = (s.total_nilai || 0) >= 75 ? 'Tuntas' : 'Remedial';
            else if (s.status_koreksi === 'terkunci_curang') statusStr = 'Didiskualifikasi';
            else if (s.status_koreksi === 'sedang_ujian') statusStr = 'Sedang Ujian';

            let cheatAttempts = 0;
            let answeredCount = 0;
            if (s.jawaban_siswa && typeof s.jawaban_siswa === 'object') {
                cheatAttempts = s.jawaban_siswa.cheatAttempts || 0;
                answeredCount = Object.keys(s.jawaban_siswa.answers || {}).length;
            } else if (typeof s.jawaban_siswa === 'string') {
                try {
                    const parsed = JSON.parse(s.jawaban_siswa);
                    cheatAttempts = parsed.cheatAttempts || 0;
                    answeredCount = Object.keys(parsed.answers || {}).length;
                } catch (_) {}
            }

            let statusUjian = 'Selesai';
            if (s.status_koreksi === 'terkunci_curang') statusUjian = 'Terkunci Curang';
            else if (s.status_koreksi === 'sedang_ujian') statusUjian = 'Sedang Mengerjakan';
            else if (s.status_koreksi === 'belum_dikoreksi' || s.status_koreksi === 'perlu_dinilai') statusUjian = 'Perlu Dinilai';

            const progressStr = `${answeredCount}/${totalQ}`;

            csv += `${idx + 1},"${s.nama_siswa || ''}","${s.student_id || ''}","${s.kelas || ''}","${statusUjian}","${progressStr}",${s.skor_pg || 0},${s.skor_esai || 0},${s.total_nilai || 0},"${statusStr}",${cheatAttempts},"${dateStr}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const kelasLabel = selectedKelas === 'all' ? 'Semua_Kelas' : `Kelas_${selectedKelas}`;
        link.setAttribute("download", `Rekap_Ujian_${(activeQuizForResults?.judul_kuis || 'Kuis').replace(/[^a-zA-Z0-9]/g, '_')}_${kelasLabel}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    window.printQuizResults = () => {
        if (!activeQuizSubmissions || activeQuizSubmissions.length === 0 || !activeQuizForResults) {
            showCustomModal("Tidak ada data hasil ujian untuk dicetak.");
            return;
        }

        const selectedKelas = document.getElementById('filter-results-kelas')?.value || 'all';
        const filtered = selectedKelas === 'all'
            ? activeQuizSubmissions
            : activeQuizSubmissions.filter(s => String(s.kelas || '').trim() === selectedKelas);

        if (filtered.length === 0) {
            showCustomModal("Tidak ada data siswa pada kelas yang dipilih untuk dicetak.");
            return;
        }

        const quiz = activeQuizForResults;
        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const teacherName = currentTeacher?.name || currentSession?.user?.email || 'Guru Pengampu';

        let rowsHtml = '';
        let totalAll = 0;
        let highest = 0;
        let lowest = 100;
        let completedCount = 0;

        filtered.forEach((s, idx) => {
            const score = s.total_nilai || 0;
            if (s.status_koreksi === 'selesai' || s.status_koreksi === 'perlu_dinilai') {
                totalAll += score;
                if (score > highest) highest = score;
                if (score < lowest) lowest = score;
                completedCount++;
            }

            let statusKetuntasan = '-';
            if (s.status_koreksi === 'selesai' || s.status_koreksi === 'perlu_dinilai') {
                statusKetuntasan = score >= 75 ? 'Tuntas' : 'Remedial';
            } else if (s.status_koreksi === 'terkunci_curang') {
                statusKetuntasan = 'Didiskualifikasi (Curang)';
            } else if (s.status_koreksi === 'sedang_ujian') {
                statusKetuntasan = 'Sedang Ujian';
            } else if (s.status_koreksi === 'belum_dikoreksi') {
                statusKetuntasan = 'Menunggu Koreksi';
            }

            rowsHtml += `
                <tr>
                    <td style="border: 1px solid black; padding: 6px; text-align: center;">${idx + 1}</td>
                    <td style="border: 1px solid black; padding: 6px; font-weight: bold;">${escapeHtml(s.nama_siswa || '')}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: center;">${escapeHtml(s.student_id || '-')}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: center; font-weight: bold;">${escapeHtml(s.kelas || '')}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: center; font-weight: bold; font-size: 13px;">${s.status_koreksi === 'sedang_ujian' ? '-' : score}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: center;">${statusKetuntasan}</td>
                </tr>
            `;
        });

        const avg = completedCount > 0 ? (totalAll / completedCount).toFixed(1) : '-';
        if (completedCount === 0) {
            lowest = '-';
            highest = '-';
        }

        const kelasPrint = selectedKelas === 'all' ? (quiz.kelas || 'Semua Kelas') : selectedKelas;

        const printWin = window.open('', '_blank');
        printWin.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Hasil Ujian Siswa - ${escapeHtml(quiz.judul_kuis)}</title>
                <style>
                    body { font-family: 'Times New Roman', Times, serif; padding: 25px; color: #000; }
                    .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 16px; }
                    .kop h2 { margin: 0; font-size: 17px; text-transform: uppercase; font-weight: bold; }
                    .kop h1 { margin: 3px 0; font-size: 21px; text-transform: uppercase; font-weight: 900; }
                    .kop p { margin: 1px 0; font-size: 12px; }
                    .title { text-align: center; font-size: 15px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; }
                    .meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th { border: 1px solid black; padding: 6px; background-color: #f2f2f2; text-transform: uppercase; }
                    .stats { margin-top: 12px; font-size: 12px; line-height: 1.6; }
                    .footer-sig { margin-top: 35px; display: flex; justify-content: flex-end; text-align: center; font-size: 12px; }
                    .sig-box { width: 220px; }
                    @media print {
                        @page { size: portrait; margin: 12mm; }
                    }
                </style>
            </head>
            <body>
                <div class="kop">
                    <h2>Pemerintah Kota Palembang &bull; Dinas Pendidikan</h2>
                    <h1>SMP NEGERI 58 PALEMBANG</h1>
                    <p>Jl. Macan Lindungan, Kec. Ilir Barat I, Kota Palembang, Sumatera Selatan</p>
                    <p>Portal Belajar & Ujian Online Berstandar AKM</p>
                </div>
                <div class="title">LEMBAR REKAPITULASI HASIL UJIAN SISWA</div>
                <div class="meta">
                    <div>
                        <strong>Judul Ujian:</strong> ${escapeHtml(quiz.judul_kuis)}<br>
                        <strong>Mata Pelajaran:</strong> ${escapeHtml(quiz.mapel)} &bull; <strong>Kelas:</strong> ${escapeHtml(kelasPrint)}
                    </div>
                    <div style="text-align: right;">
                        <strong>Tanggal Cetak:</strong> ${dateStr}<br>
                        <strong>Jumlah Peserta:</strong> ${filtered.length} Siswa
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 30px;">No</th>
                            <th>Nama Lengkap Siswa</th>
                            <th style="width: 100px;">NISN</th>
                            <th style="width: 60px;">Kelas</th>
                            <th style="width: 70px;">Nilai Akhir</th>
                            <th style="width: 120px;">Ketuntasan / Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
                <div class="stats">
                    <strong>Statistik Hasil Ujian:</strong><br>
                    &bull; Rata-Rata Nilai: <strong>${avg}</strong> / 100<br>
                    &bull; Nilai Tertinggi: <strong>${highest}</strong> &bull; Nilai Terendah: <strong>${lowest}</strong>
                </div>
                <div class="footer-sig">
                    <div class="sig-box">
                        <p>Palembang, ${dateStr}<br>Guru Pengampu,</p>
                        <br><br><br>
                        <p style="font-weight: bold; text-decoration: underline;">${escapeHtml(teacherName)}</p>
                        <p style="margin-top: -6px; font-size: 10px;">Guru Mata Pelajaran</p>
                    </div>
                </div>
                <script>
                    window.onload = function() { window.print(); };
                <\/script>
            </body>
            </html>
        `);
        printWin.document.close();
    };

    // Periksa Lembar Jawaban Siswa & Koreksi Esai
    window.openExamReviewModal = (submissionId) => {
        const sub = activeQuizSubmissions.find(s => String(s.id) === String(submissionId));
        if (!sub || !activeQuizForResults) return;
        activeReviewSubmission = sub;

        document.getElementById('exam-review-student-name').textContent = sub.nama_siswa;
        document.getElementById('exam-review-meta').textContent = `Kelas: ${sub.kelas} • Skor Objektif: ${sub.skor_pg} • Total Nilai Saat Ini: ${sub.total_nilai}/100`;

        const container = document.getElementById('exam-review-questions-container');
        container.innerHTML = '';

        const questions = activeQuizForResults.quiz_questions || [];
        let answers = {};
        let cheatAttempts = 0;
        let cheatLogs = [];
        if (sub.jawaban_siswa && typeof sub.jawaban_siswa === 'object') {
            if (sub.jawaban_siswa.answers && typeof sub.jawaban_siswa.answers === 'object') {
                answers = sub.jawaban_siswa.answers;
                cheatAttempts = sub.jawaban_siswa.cheatAttempts || 0;
                cheatLogs = sub.jawaban_siswa.cheatLogs || [];
            } else {
                answers = sub.jawaban_siswa;
            }
        } else if (typeof sub.jawaban_siswa === 'string') {
            try {
                const parsed = JSON.parse(sub.jawaban_siswa);
                if (parsed.answers && typeof parsed.answers === 'object') {
                    answers = parsed.answers;
                    cheatAttempts = parsed.cheatAttempts || 0;
                    cheatLogs = parsed.cheatLogs || [];
                } else {
                    answers = parsed;
                }
            } catch (_) {}
        }
        const aiFeedback = sub.ai_feedback || {};

        if (sub.status_koreksi === 'terkunci_curang' || cheatAttempts > 0) {
            const cheatBanner = document.createElement('div');
            cheatBanner.className = `p-3 rounded-xl border-2 font-bold text-xs mb-3 ${sub.status_koreksi === 'terkunci_curang' ? 'bg-red-100 border-red-500 text-red-950' : 'bg-amber-50 border-amber-400 text-amber-950'}`;
            cheatBanner.innerHTML = `
                <div class="flex items-center justify-between">
                    <span>${sub.status_koreksi === 'terkunci_curang' ? 'Ujian Dibekukan Sistem (Batas Pelanggaran Terlampaui)' : 'Catatan Pengawas Anti-Kecurangan'}</span>
                    <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white/70 border border-current">${cheatAttempts} Kali Pelanggaran</span>
                </div>
                ${cheatLogs.length > 0 ? `
                    <div class="mt-2 pt-2 border-t border-black/10 text-[10px] space-y-1 font-mono">
                        ${cheatLogs.map(l => `<div>• [${l.time ? new Date(l.time).toLocaleTimeString('id-ID') : '-'}] ${escapeHtml(l.reason || 'Pelanggaran')}</div>`).join('')}
                    </div>
                ` : ''}
            `;
            container.appendChild(cheatBanner);
        }

        questions.forEach((q, idx) => {
            const card = document.createElement('div');
            card.className = "bg-slate-50 border-2 border-black rounded-xl p-4 space-y-2";

            const { text: cleanPertanyaan, gambar_url: qImg } = splitQuestionImage(q.pertanyaan || '');
            const imgUrl = q.gambar_url || qImg;
            const imgStimulusHtml = imgUrl ? `
                <div class="my-1.5 p-1.5 border-2 border-black rounded-xl bg-white max-w-xs shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    <a href="${escapeHtml(imgUrl)}" target="_blank" title="Buka gambar stimulus">
                        <img src="${escapeHtml(imgUrl)}" alt="Gambar Soal" class="max-h-36 rounded-lg border border-slate-300 object-contain mx-auto" />
                    </a>
                    <div class="text-[9px] text-slate-500 font-bold text-center mt-0.5">Stimulus Soal (Klik untuk perbesar)</div>
                </div>
            ` : '';

            const qBobot = Number(q.bobot) || (q.tipe === 'esai' || q.tipe === 'upload_foto' || q.tipe === 'menjodohkan' ? 20 : 10);

            if (q.tipe === 'pg') {
                const studentAns = answers[q.id] || '(Tidak dijawab)';
                const isCorrect = String(studentAns).toUpperCase() === (q.kunci_pg || '').toUpperCase();
                card.innerHTML = `
                    <div class="flex items-center justify-between flex-wrap gap-1.5">
                        <div class="flex items-center gap-2">
                            <span class="font-black text-xs text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-300 uppercase">No. ${idx + 1} (Pilihan Ganda)</span>
                            <span class="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">Bobot: ${qBobot} Poin</span>
                        </div>
                        <span class="${isCorrect ? 'bg-emerald-100 text-emerald-900 border-emerald-400' : 'bg-red-100 text-red-900 border-red-400'} border text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            ${isCorrect ? `Benar (${qBobot}/${qBobot})` : `Salah (0/${qBobot})`}
                        </span>
                    </div>
                    <p class="font-bold text-xs text-slate-800">${escapeHtml(cleanPertanyaan)}</p>
                    ${imgStimulusHtml}
                    <div class="text-[11px] font-bold text-slate-600 flex gap-4">
                        <span>Jawaban Siswa: <strong class="${isCorrect ? 'text-emerald-700' : 'text-red-700'}">${escapeHtml(studentAns)}</strong></span>
                        <span>Kunci: <strong class="text-black">${escapeHtml(q.kunci_pg)}</strong></span>
                    </div>
                `;
            } else if (q.tipe === 'pg_kompleks') {
                const studentAns = answers[q.id] || [];
                const studentKeys = (Array.isArray(studentAns) ? studentAns : String(studentAns).split(',')).map(s => s.trim().toUpperCase()).filter(Boolean).sort();
                const correctKeys = (q.kunci_pg || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean).sort();
                const isCorrect = studentKeys.length > 0 && studentKeys.join(',') === correctKeys.join(',');
                card.innerHTML = `
                    <div class="flex items-center justify-between flex-wrap gap-1.5">
                        <div class="flex items-center gap-2">
                            <span class="font-black text-xs text-cyan-900 bg-cyan-100 px-2 py-0.5 rounded border border-cyan-300 uppercase">No. ${idx + 1} (PG Kompleks)</span>
                            <span class="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">Bobot: ${qBobot} Poin</span>
                        </div>
                        <span class="${isCorrect ? 'bg-emerald-100 text-emerald-900 border-emerald-400' : 'bg-red-100 text-red-900 border-red-400'} border text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            ${isCorrect ? `Benar (${qBobot}/${qBobot})` : `Kurang Tepat (0/${qBobot})`}
                        </span>
                    </div>
                    <p class="font-bold text-xs text-slate-800">${escapeHtml(cleanPertanyaan)}</p>
                    ${imgStimulusHtml}
                    <div class="text-[11px] font-bold text-slate-600 flex gap-4">
                        <span>Pilihan Siswa: <strong class="${isCorrect ? 'text-emerald-700' : 'text-red-700'}">${escapeHtml(studentKeys.join(', ') || '(Tidak dijawab)')}</strong></span>
                        <span>Kunci Benar: <strong class="text-black">${escapeHtml(correctKeys.join(', '))}</strong></span>
                    </div>
                `;
            } else if (q.tipe === 'benar_salah') {
                const studentAns = answers[q.id] || '(Tidak dijawab)';
                const isCorrect = String(studentAns).trim().toLowerCase() === String(q.kunci_pg || '').trim().toLowerCase();
                card.innerHTML = `
                    <div class="flex items-center justify-between flex-wrap gap-1.5">
                        <div class="flex items-center gap-2">
                            <span class="font-black text-xs text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 uppercase">No. ${idx + 1} (Benar/Salah)</span>
                            <span class="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">Bobot: ${qBobot} Poin</span>
                        </div>
                        <span class="${isCorrect ? 'bg-emerald-100 text-emerald-900 border-emerald-400' : 'bg-red-100 text-red-900 border-red-400'} border text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            ${isCorrect ? `Benar (${qBobot}/${qBobot})` : `Salah (0/${qBobot})`}
                        </span>
                    </div>
                    <p class="font-bold text-xs text-slate-800">${escapeHtml(cleanPertanyaan)}</p>
                    ${imgStimulusHtml}
                    <div class="text-[11px] font-bold text-slate-600 flex gap-4">
                        <span>Jawaban Siswa: <strong class="${isCorrect ? 'text-emerald-700' : 'text-red-700'}">${escapeHtml(studentAns)}</strong></span>
                        <span>Kunci Kebenaran: <strong class="text-black">${escapeHtml(q.kunci_pg)}</strong></span>
                    </div>
                `;
            } else if (q.tipe === 'singkat') {
                const studentAns = answers[q.id] || '(Kosong)';
                const isCorrect = String(studentAns).trim().toLowerCase() === String(q.kunci_pg || '').trim().toLowerCase();
                const currentFeedback = aiFeedback[q.id] || {};
                const defaultScore = isCorrect ? qBobot : 0;
                card.innerHTML = `
                    <div class="flex items-center justify-between flex-wrap gap-1.5">
                        <div class="flex items-center gap-2">
                            <span class="font-black text-xs text-blue-900 bg-blue-100 px-2 py-0.5 rounded border border-blue-300 uppercase">No. ${idx + 1} (Isian Singkat)</span>
                            <span class="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">Bobot Maks: ${qBobot} Poin</span>
                        </div>
                        <span class="${isCorrect ? 'bg-emerald-100 text-emerald-900 border-emerald-400' : 'bg-amber-100 text-amber-900 border-amber-400'} border text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            ${isCorrect ? `Cocok Otomatis (${qBobot}/${qBobot})` : 'Perlu Evaluasi Guru/AI'}
                        </span>
                    </div>
                    <p class="font-bold text-xs text-black">${escapeHtml(cleanPertanyaan)}</p>
                    ${imgStimulusHtml}
                    <div class="bg-white p-2.5 rounded-lg border border-slate-300 text-xs">
                        <div class="font-bold text-slate-600">Jawaban Siswa: <strong class="text-black text-sm">${escapeHtml(studentAns)}</strong></div>
                        <div class="text-[11px] font-bold text-emerald-700 mt-0.5">Kunci Kata Jawaban: ${escapeHtml(q.kunci_pg || '-')}</div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 items-center">
                        <div class="sm:col-span-1">
                            <label class="block text-[10px] font-black uppercase text-black mb-0.5">Skor (0-${qBobot})</label>
                            <input type="number" id="essay-score-${q.id}" value="${currentFeedback.skor !== undefined ? currentFeedback.skor : defaultScore}" min="0" max="${qBobot}" class="w-full h-9 px-2 border-2 border-black rounded-lg font-black text-sm bg-white">
                        </div>
                        <div class="sm:col-span-3">
                            <label class="block text-[10px] font-black uppercase text-black mb-0.5">Catatan / Evaluasi</label>
                            <input type="text" id="essay-feedback-${q.id}" value="${escapeHtml(currentFeedback.feedback || '')}" placeholder="Catatan evaluasi guru..." class="w-full h-9 px-3 border-2 border-black rounded-lg font-bold text-xs bg-white">
                        </div>
                    </div>
                `;
            } else if (q.tipe === 'menjodohkan') {
                let pairs = [];
                try { pairs = JSON.parse(q.rubrik_esai); } catch (_) { pairs = q.pasangan || []; }
                const studentPairs = answers[q.id] || {};
                const currentFeedback = aiFeedback[q.id] || {};

                let correctMatches = 0;
                const rows = (Array.isArray(pairs) ? pairs : []).map((p, pIdx) => {
                    const stAns = studentPairs[pIdx] || '(Kosong)';
                    const isMatch = String(stAns).trim().toLowerCase() === String(p.kanan || '').trim().toLowerCase();
                    if (isMatch) correctMatches++;
                    return `
                        <tr class="border-b border-slate-200">
                            <td class="p-2 font-bold text-xs text-black">${escapeHtml(p.kiri)}</td>
                            <td class="p-2 font-bold text-xs ${isMatch ? 'text-emerald-700' : 'text-red-700'}">${escapeHtml(stAns)}</td>
                            <td class="p-2 font-bold text-xs text-slate-600">${escapeHtml(p.kanan)}</td>
                            <td class="p-2 text-center text-xs">${isMatch ? '✅' : '❌'}</td>
                        </tr>
                    `;
                }).join('');

                const autoScore = pairs.length > 0 ? Math.round(qBobot * (correctMatches / pairs.length)) : 0;

                card.innerHTML = `
                    <div class="flex items-center justify-between flex-wrap gap-1.5">
                        <div class="flex items-center gap-2">
                            <span class="font-black text-xs text-teal-900 bg-teal-100 px-2 py-0.5 rounded border border-teal-300 uppercase">No. ${idx + 1} (Menjodohkan)</span>
                            <span class="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">Bobot Maks: ${qBobot} Poin</span>
                        </div>
                        <span class="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">Cocok: ${correctMatches}/${pairs.length} (${autoScore}/${qBobot})</span>
                    </div>
                    <p class="font-bold text-xs text-black">${escapeHtml(cleanPertanyaan)}</p>
                    ${imgStimulusHtml}
                    <div class="overflow-x-auto bg-white rounded-xl border border-slate-300">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-slate-100 border-b border-slate-300 font-black text-slate-700 uppercase text-[10px]">
                                <tr>
                                    <th class="p-2">Premis (Kiri)</th>
                                    <th class="p-2">Pilihan Siswa</th>
                                    <th class="p-2">Kunci Sebenarnya</th>
                                    <th class="p-2 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 items-center">
                        <div class="sm:col-span-1">
                            <label class="block text-[10px] font-black uppercase text-black mb-0.5">Skor (0-${qBobot})</label>
                            <input type="number" id="essay-score-${q.id}" value="${currentFeedback.skor !== undefined ? currentFeedback.skor : autoScore}" min="0" max="${qBobot}" class="w-full h-9 px-2 border-2 border-black rounded-lg font-black text-sm bg-white">
                        </div>
                        <div class="sm:col-span-3">
                            <label class="block text-[10px] font-black uppercase text-black mb-0.5">Masukan / Feedback Guru</label>
                            <input type="text" id="essay-feedback-${q.id}" value="${escapeHtml(currentFeedback.feedback || '')}" placeholder="Catatan evaluasi menjodohkan..." class="w-full h-9 px-3 border-2 border-black rounded-lg font-bold text-xs bg-white">
                        </div>
                    </div>
                `;
            } else if (q.tipe === 'upload_foto') {
                const fileUrl = answers[q.id] || '';
                const currentFeedback = aiFeedback[q.id] || {};
                const safeFileUrl = /^https?:\/\//i.test(String(fileUrl)) ? String(fileUrl) : '';
                const isImage = safeFileUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i);

                card.innerHTML = `
                    <div class="flex items-center justify-between flex-wrap gap-1.5">
                        <div class="flex items-center gap-2">
                            <span class="font-black text-xs text-pink-900 bg-pink-100 px-2 py-0.5 rounded border border-pink-300 uppercase">No. ${idx + 1} (Upload Foto / Berkas)</span>
                            <span class="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">Bobot Maks: ${qBobot} Poin</span>
                        </div>
                    </div>
                    <p class="font-bold text-xs text-black">${escapeHtml(cleanPertanyaan)}</p>
                    ${imgStimulusHtml}
                    ${q.rubrik_esai ? `<div class="bg-yellow-50 p-2 rounded border border-yellow-200 text-[11px] font-bold text-yellow-900"><strong>Rubrik Kunci Guru:</strong> ${escapeHtml(q.rubrik_esai)}</div>` : ''}
                    <div class="bg-white p-3 rounded-xl border border-slate-300 space-y-2">
                        <span class="text-[10px] font-black text-slate-400 block uppercase">Berkas Lampiran Hasil Pengerjaan Siswa:</span>
                        ${safeFileUrl ? `
                            <div class="flex items-center gap-3">
                                ${isImage ? `<a href="${escapeHtml(safeFileUrl)}" target="_blank" title="Klik untuk memperbesar foto"><img src="${escapeHtml(safeFileUrl)}" class="w-24 h-24 object-cover rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform cursor-pointer"></a>` : ''}
                                <div>
                                    <a href="${escapeHtml(safeFileUrl)}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-black text-white rounded-lg font-black text-xs transition">
                                        <span></span> Buka Berkas Penuh ↗
                                    </a>
                                </div>
                            </div>
                        ` : `<p class="text-xs font-bold text-red-500 italic">Siswa tidak mengunggah berkas pada soal ini.</p>`}
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 items-center">
                        <div class="sm:col-span-1">
                            <label class="block text-[10px] font-black uppercase text-black mb-0.5">Skor (0-${qBobot})</label>
                            <input type="number" id="essay-score-${q.id}" value="${currentFeedback.skor !== undefined ? currentFeedback.skor : ''}" min="0" max="${qBobot}" class="w-full h-9 px-2 border-2 border-black rounded-lg font-black text-sm bg-white">
                        </div>
                        <div class="sm:col-span-3">
                            <label class="block text-[10px] font-black uppercase text-black mb-0.5">Masukan / Feedback Guru</label>
                            <input type="text" id="essay-feedback-${q.id}" value="${escapeHtml(currentFeedback.feedback || '')}" placeholder="Catatan evaluasi lembar kerja..." class="w-full h-9 px-3 border-2 border-black rounded-lg font-bold text-xs bg-white">
                        </div>
                    </div>
                `;
            } else {
                const studentEssay = answers[q.id] || '(Kosong)';
                const currentFeedback = aiFeedback[q.id] || {};
                card.innerHTML = `
                    <div class="flex items-center justify-between flex-wrap gap-1.5">
                        <div class="flex items-center gap-2">
                            <span class="font-black text-xs text-purple-900 bg-purple-100 px-2 py-0.5 rounded border border-purple-300 uppercase">No. ${idx + 1} (Soal Esai)</span>
                            <span class="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">Bobot Maks: ${qBobot} Poin</span>
                        </div>
                    </div>
                    <p class="font-bold text-xs text-black">${escapeHtml(cleanPertanyaan)}</p>
                    ${imgStimulusHtml}
                    ${q.rubrik_esai ? `<div class="bg-yellow-50 p-2 rounded border border-yellow-200 text-[11px] font-bold text-yellow-900"><strong>Rubrik Kunci Guru:</strong> ${escapeHtml(q.rubrik_esai)}</div>` : ''}
                    <div class="bg-white p-2.5 rounded-lg border border-slate-300">
                        <span class="text-[10px] font-black text-slate-400 block uppercase mb-1">Jawaban Siswa:</span>
                        <p class="text-xs font-medium text-slate-800 whitespace-pre-line">${escapeHtml(studentEssay)}</p>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 items-center">
                        <div class="sm:col-span-1">
                            <label class="block text-[10px] font-black uppercase text-black mb-0.5">Skor Esai (0-${qBobot})</label>
                            <input type="number" id="essay-score-${q.id}" value="${currentFeedback.skor !== undefined ? currentFeedback.skor : ''}" min="0" max="${qBobot}" class="w-full h-9 px-2 border-2 border-black rounded-lg font-black text-sm bg-white">
                        </div>
                        <div class="sm:col-span-3">
                            <label class="block text-[10px] font-black uppercase text-black mb-0.5">Masukan / Feedback Esai</label>
                            <input type="text" id="essay-feedback-${q.id}" value="${escapeHtml(currentFeedback.feedback || '')}" placeholder="Catatan evaluasi esai..." class="w-full h-9 px-3 border-2 border-black rounded-lg font-bold text-xs bg-white">
                        </div>
                    </div>
                `;
            }
            container.appendChild(card);
        });

        const unlockBtn = document.getElementById('btn-review-unlock-student');
        if (unlockBtn) {
            if (sub.status_koreksi === 'terkunci_curang' || sub.cheatAttempts > 0) {
                unlockBtn.classList.remove('hidden');
                unlockBtn.innerText = sub.status_koreksi === 'terkunci_curang' ? 'Buka Kunci Akun' : 'Reset Pelanggaran Anti-Cheat (0)';
            } else {
                unlockBtn.classList.add('hidden');
            }
        }

        document.getElementById('student-exam-review-modal').classList.remove('hidden');
    };

    window.closeExamReviewModal = () => {
        document.getElementById('student-exam-review-modal').classList.add('hidden');
        activeReviewSubmission = null;
    };

    window.runAiGradeAllEssays = async () => {
        if (!activeReviewSubmission || !activeQuizForResults) return;
        const btn = document.getElementById('btn-ai-grade-all-essays');
        if (btn) {
            btn.disabled = true;
            btn.innerText = "Menganalisis Jawaban...";
        }

        showAiLoadingModal({
            badge: 'KOREKSI ESAI UJIAN AI',
            title: 'Mengevaluasi Lembar Jawaban Ujian...',
            steps: [
                'Membaca teks lembar jawaban siswa...',
                'Mencocokkan rubrik penilaian dan indikator kunci...',
                'Mengalkulasi estimasi perolehan skor objektif...',
                'Menyusun feedback konstruktif untuk siswa...'
            ]
        });

        const questions = activeQuizForResults.quiz_questions || [];
        const answers = getSubmissionAnswers(activeReviewSubmission);

        try {
            for (const q of questions) {
                if (q.tipe === 'esai' || q.tipe === 'upload_foto' || q.tipe === 'singkat') {
                    const studentAns = answers[q.id] || '';
                    const result = await aiGradeQuizEssay(q.pertanyaan, q.rubrik_esai || q.kunci_pg || 'Kesesuaian dan kelengkapan materi.', String(studentAns), q.bobot || 20);
                    
                    const scoreInput = document.getElementById(`essay-score-${q.id}`);
                    const fbInput = document.getElementById(`essay-feedback-${q.id}`);
                    if (scoreInput && result.skor !== undefined) scoreInput.value = result.skor;
                    if (fbInput && result.feedback) fbInput.value = result.feedback;
                }
            }
            showCustomModal("Seluruh butir soal non-PG berhasil dianalisis oleh AI! Anda dapat menyesuaikan skor sebelum disimpan.");
        } catch (e) {
            showCustomModal("Gagal koreksi AI: " + e.message);
        } finally {
            hideAiLoadingModal();
            if (btn) {
                btn.disabled = false;
                btn.innerText = "Koreksi Semua Jawaban dengan AI";
            }
        }
    };

    window.saveExamReviewGrades = async () => {
        if (!activeReviewSubmission || !activeQuizForResults) return;

        const questions = activeQuizForResults.quiz_questions || [];
        const answers = getSubmissionAnswers(activeReviewSubmission);
        const { autoScoreTotal } = calculateExamScore(questions, answers);
        let totalManualScore = 0;
        let aiFeedbackObj = {};

        questions.forEach(q => {
            const scoreInput = document.getElementById(`essay-score-${q.id}`);
            if (scoreInput) {
                const maxScore = Number(q.bobot) || 20;
                const scoreVal = Math.min(maxScore, Math.max(0, parseInt(scoreInput.value || '0', 10) || 0));
                const fbVal = document.getElementById(`essay-feedback-${q.id}`)?.value || '';
                totalManualScore += scoreVal;
                aiFeedbackObj[q.id] = { skor: scoreVal, feedback: fbVal };
            }
        });

        const totalFinalScore = toPercent(autoScoreTotal + totalManualScore, getMaxScore(questions));

        try {
            const { error } = await supabase.from('quiz_submissions').update({
                skor_pg: autoScoreTotal,
                skor_esai: totalManualScore,
                total_nilai: totalFinalScore,
                ai_feedback: aiFeedbackObj,
                status_koreksi: 'selesai'
            }).eq('id', activeReviewSubmission.id);

            if (error) throw error;

            closeExamReviewModal();
            openQuizResultsModal(activeQuizForResults.id);
            showCustomModal(`Nilai akhir ujian berhasil disimpan! Total Nilai Siswa: ${totalFinalScore}`);
        } catch (e) {
            showCustomModal("Gagal menyimpan nilai ujian: " + e.message);
        }
    };

    // ==========================================
    // 6. Pengaturan AI & Pilihan Model Kustom
    // ==========================================
    function loadModelSettingsUI() {
        const apiKey = getGeminiApiKey();
        const currentModel = getGeminiModel();

        const keyInput = document.getElementById('gemini-api-key-input');
        const presetSelect = document.getElementById('gemini-model-preset');
        const customWrapper = document.getElementById('custom-model-wrapper');
        const customInput = document.getElementById('gemini-custom-model-input');
        const statusEl = document.getElementById('gemini-status-text');

        if (keyInput) keyInput.value = apiKey;

        const standardPresets = ['gemini-3.7-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3-flash-preview', 'gemini-2.5-pro'];
        if (standardPresets.includes(currentModel)) {
            if (presetSelect) presetSelect.value = currentModel;
            if (customWrapper) customWrapper.classList.add('hidden');
        } else {
            if (presetSelect) presetSelect.value = 'custom';
            if (customWrapper) customWrapper.classList.remove('hidden');
            if (customInput) customInput.value = currentModel;
        }

        if (statusEl) {
            if (apiKey) {
                statusEl.textContent = `Model Aktif: ${currentModel} (Siap digunakan)`;
            } else {
                statusEl.textContent = `Kunci AI belum terpasang. Dapatkan gratis di aistudio.google.com.`;
            }
        }
    }

    window.onModelPresetChange = () => {
        const presetSelect = document.getElementById('gemini-model-preset');
        const customWrapper = document.getElementById('custom-model-wrapper');
        if (presetSelect.value === 'custom') {
            customWrapper.classList.remove('hidden');
        } else {
            customWrapper.classList.add('hidden');
        }
    };

    window.saveGeminiSettings = () => {
        const key = document.getElementById('gemini-api-key-input').value.trim();
        const preset = document.getElementById('gemini-model-preset').value;
        const customModel = document.getElementById('gemini-custom-model-input').value.trim();

        const modelToSave = preset === 'custom' ? (customModel || 'gemini-3.5-flash-lite') : preset;

        setGeminiApiKey(key);
        setGeminiModel(modelToSave);
        loadModelSettingsUI();
        showCustomModal(`Pengaturan AI tersimpan! Model: ${modelToSave}`);
    };

    window.testAiConnection = async () => {
        const key = document.getElementById('gemini-api-key-input').value.trim();
        const preset = document.getElementById('gemini-model-preset').value;
        const customModel = document.getElementById('gemini-custom-model-input').value.trim();
        const modelToTest = preset === 'custom' ? (customModel || 'gemini-3.5-flash-lite') : preset;

        if (!key) {
            showCustomModal("Masukkan API Key terlebih dahulu sebelum menguji koneksi.");
            return;
        }

        const btn = document.getElementById('btn-test-ai');
        btn.disabled = true;
        btn.innerText = "Menguji...";

        try {
            const res = await testGeminiConnection(key, modelToTest);
            const extraNote = res.note ? `\n(${res.note})` : '';
            showCustomModal(`SUKSES! Model "${modelToTest}" berhasil merespons dalam ${res.duration} detik.${extraNote}`);
        } catch (e) {
            showCustomModal(`Gagal terhubung ke model "${modelToTest}": ${e.message}`);
        } finally {
            btn.disabled = false;
            btn.innerText = "UJI KONEKSI";
        }
    };

    // ==========================================
    // 7. Pengaturan Kelas SMPN 58
    // ==========================================
    async function loadOptionsSettings() {
        const { data, error } = await supabase.from('options').select('*');
        if (!error && data) {
            stateKelas = data.filter(d => d.type === 'kelas').map(d => d.name);
            renderOptions();
            
            const classSelectIds = [
                'assign-kelas',
                'ai-assign-kelas',
                'mat-kelas',
                'ai-mat-kelas',
                'manual-quiz-kelas',
                'ai-quiz-kelas'
            ];
            classSelectIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) populateTargetClassSelect(el, el.value || 'Semua Kelas');
            });

            if (filterKelasSelect) {
                populateTargetClassSelect(filterKelasSelect, '', true);
            }

            if (filterAssignmentSelect) {
                filterAssignmentSelect.innerHTML = '<option value="">Semua Penugasan</option>';
                assignmentsList.forEach(a => {
                    const opt = document.createElement('option');
                    opt.value = a.id;
                    opt.textContent = `${a.judul_tugas} — Kelas ${a.kelas}`;
                    filterAssignmentSelect.appendChild(opt);
                });
            }
        }
    }

    window.addKelas = () => {
        const input = document.getElementById('input-kelas');
        const val = input.value.trim();
        if (val && !stateKelas.includes(val)) {
            stateKelas.push(val);
            input.value = '';
            renderOptions();
        }
    };

    window.removeOption = (type, val) => {
        if (type === 'kelas') {
            stateKelas = stateKelas.filter(k => k !== val);
        }
        renderOptions();
    };

    function renderOptions() {
        const kelasList = document.getElementById('kelas-list');
        const badge = document.getElementById('kelas-count-badge');
        if (!kelasList) return;
        kelasList.innerHTML = '';
        if (badge) badge.textContent = `${stateKelas.length} Kelas`;

        if (stateKelas.length === 0) {
            kelasList.innerHTML = '<div class="col-span-2 sm:col-span-3 text-center py-6 text-slate-400 font-bold text-xs uppercase">Belum ada kelas ditambahkan.</div>';
            return;
        }

        stateKelas.forEach(k => {
            const div = document.createElement('div');
            div.className = "flex justify-between items-center bg-slate-50 hover:bg-yellow-50 px-3 py-1.5 rounded-xl border-2 border-black font-black text-slate-900 text-xs shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors";
            div.innerHTML = `<span class="truncate mr-1">${k}</span><button type="button" onclick="removeOption('kelas', '${k}')" class="text-red-500 hover:text-red-700 font-black text-base leading-none shrink-0">&times;</button>`;
            kelasList.appendChild(div);
        });
    }

    window.saveOptionsSettings = async () => {
        const btn = document.getElementById('save-options-btn');
        const status = document.getElementById('options-status');
        btn.disabled = true;
        btn.innerText = "MENYIMPAN...";
        status.innerText = "";
        
        try {
            await supabase.from('options').delete().eq('type', 'kelas');
            const insertData = stateKelas.map(k => ({ type: 'kelas', name: k }));
            if (insertData.length > 0) {
                const { error } = await supabase.from('options').insert(insertData);
                if (error) throw error;
            }
            status.innerHTML = `<span class="text-emerald-700 font-bold uppercase">Kelas tersimpan!</span>`;
            loadOptionsSettings();
        } catch (e) {
            status.innerHTML = `<span class="text-red-600 font-bold uppercase">Gagal: ${e.message}</span>`;
        }
        btn.disabled = false;
        btn.innerText = "SIMPAN PILIHAN KELAS";
    };

    // ==========================================
    // 8. Persetujuan Akun Guru (Superadmin Only)
    // ==========================================
    window.loadAllTeachers = async () => {
        if (currentTeacher?.role !== 'superadmin') {
            console.warn("Akses ditolak: loadAllTeachers hanya untuk Superadmin.");
            const tbody = document.getElementById('teachers-approval-tbody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-6 text-center font-bold text-red-500 uppercase">Akses Ditolak: Fitur hanya untuk Superadmin.</td></tr>';
            return;
        }
        const tbody = document.getElementById('teachers-approval-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-6 text-center font-bold text-slate-500 uppercase animate-pulse">Memuat daftar akun guru...</td></tr>';
        
        try {
            const { data, error } = await supabase.from('teachers').select('*').order('created_at', { ascending: false });
            if (error) throw error;

            tbody.innerHTML = '';
            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-6 text-center font-bold text-slate-500 uppercase">Belum ada akun guru lain.</td></tr>';
                return;
            }

            data.forEach(t => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50 transition";
                
                const isSuper = t.role === 'superadmin';
                let statusBadge = '';
                if (t.status === 'approved') {
                    statusBadge = '<span class="bg-emerald-100 text-emerald-900 border border-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Disetujui</span>';
                } else if (t.status === 'rejected') {
                    statusBadge = '<span class="bg-red-100 text-red-900 border border-red-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Ditolak</span>';
                } else {
                    statusBadge = '<span class="bg-amber-100 text-amber-900 border border-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">Menunggu</span>';
                }

                let actionButtons = '';
                if (isSuper) {
                    actionButtons = '<span class="text-xs font-black text-purple-800">Superadmin (Akun Utama)</span>';
                } else if (t.status === 'pending') {
                    actionButtons = `
                        <button onclick="setTeacherStatus('${t.id}', 'approved')" class="bg-emerald-400 hover:bg-emerald-500 text-black border border-black font-black px-3 py-1.5 rounded-lg text-xs uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] mr-1 active:translate-y-0.5">
                            Setujui
                        </button>
                        <button onclick="setTeacherStatus('${t.id}', 'rejected')" class="bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 font-black px-3 py-1.5 rounded-lg text-xs uppercase active:translate-y-0.5">
                            Tolak
                        </button>
                    `;
                } else if (t.status === 'approved') {
                    actionButtons = `
                        <button onclick="setTeacherStatus('${t.id}', 'pending')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs uppercase active:translate-y-0.5">
                            Tangguhkan
                        </button>
                    `;
                } else {
                    actionButtons = `
                        <button onclick="setTeacherStatus('${t.id}', 'approved')" class="bg-emerald-400 hover:bg-emerald-500 text-black border border-black font-black px-3 py-1.5 rounded-lg text-xs uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5">
                            Aktifkan Kembali
                        </button>
                    `;
                }

                tr.innerHTML = `
                    <td class="px-4 py-3 font-black text-black border-b-2 border-black border-r-2 text-xs">
                        ${t.nama_guru} ${isSuper ? '<span class="text-[9px] bg-purple-100 text-purple-900 font-black px-1.5 py-0.5 rounded ml-1 border border-purple-300">ADMIN</span>' : ''}
                    </td>
                    <td class="px-4 py-3 font-bold text-black border-b-2 border-black border-r-2 text-xs">${t.mapel}</td>
                    <td class="px-4 py-3 font-medium text-slate-600 border-b-2 border-black border-r-2 text-xs">${t.email}</td>
                    <td class="px-4 py-3 text-center border-b-2 border-black border-r-2">${statusBadge}</td>
                    <td class="px-4 py-3 text-center border-b-2 border-black">${actionButtons}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-6 text-center text-red-600 font-bold text-xs uppercase">Gagal memuat guru: ${e.message}</td></tr>`;
        }
    };

    window.setTeacherStatus = async (teacherId, newStatus) => {
        if (currentTeacher?.role !== 'superadmin') {
            showCustomModal("Akses Ditolak: Hanya Superadmin yang berwenang mengubah status persetujuan guru.");
            return;
        }
        try {
            const { error } = await supabase.from('teachers').update({ status: newStatus }).eq('id', teacherId);
            if (error) throw error;
            showCustomModal(newStatus === 'approved' ? "Akun guru berhasil disetujui! Guru tersebut sekarang dapat masuk ke LMS." : "Status akun guru berhasil diperbarui.");
            loadAllTeachers();
        } catch (e) {
            showCustomModal("Gagal memperbarui status guru: " + e.message);
        }
    };

    // ==========================================
    // 7. Modul Master Data Siswa & Roster Ujian
    // ==========================================
    async function loadStudentsRoster() {
        const tbody = document.getElementById('student-roster-tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Memuat data siswa dari database...</td></tr>';
        }

        stateStudents = await fetchStudentsFromDB();

        // Populate kelas filter
        const kelasFilter = document.getElementById('filter-roster-kelas');
        if (kelasFilter) {
            const currentVal = kelasFilter.value;
            const uniqueClasses = [...new Set(stateStudents.map(s => String(s.kelas).trim()))].sort();
            kelasFilter.innerHTML = '<option value="semua">Semua Kelas</option>' + 
                uniqueClasses.map(k => `<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`).join('');
            if (currentVal && uniqueClasses.includes(currentVal)) {
                kelasFilter.value = currentVal;
            }
        }

        renderStudentsRosterTable();
    }

    window.renderStudentsRosterTable = () => {
        const tbody = document.getElementById('student-roster-tbody');
        const badge = document.getElementById('student-roster-count-badge');
        if (!tbody) return;

        const filterKelas = (document.getElementById('filter-roster-kelas')?.value || 'semua').trim();
        const searchKeyword = (document.getElementById('search-roster-siswa')?.value || '').trim().toLowerCase();

        let filtered = stateStudents;

        if (filterKelas && filterKelas !== 'semua') {
            filtered = filtered.filter(s => String(s.kelas).trim() === filterKelas);
        }

        if (searchKeyword) {
            filtered = filtered.filter(s => 
                String(s.nama || '').toLowerCase().includes(searchKeyword) ||
                String(s.nisn || '').toLowerCase().includes(searchKeyword) ||
                String(s.id || '').toLowerCase().includes(searchKeyword)
            );
        }

        if (badge) {
            badge.textContent = `${filtered.length} Siswa Terdaftar (Total: ${stateStudents.length})`;
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500 font-bold uppercase tracking-wider">Tidak ada data siswa yang cocok dengan filter.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map((s, idx) => {
            const isPerempuan = String(s.jenis_kelamin || '').toLowerCase().startsWith('p');
            const jkBadge = isPerempuan
                ? `<span class="bg-pink-100 text-pink-800 border border-pink-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">P</span>`
                : `<span class="bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">L</span>`;

            return `
                <tr class="hover:bg-slate-50 transition border-b-2 border-black">
                    <td class="px-3 py-3 text-center border-r-2 border-black text-slate-700">${idx + 1}</td>
                    <td class="px-3 py-3 border-r-2 border-black font-mono font-bold text-xs text-indigo-950">${escapeHtml(s.nisn || s.id)}</td>
                    <td class="px-4 py-3 border-r-2 border-black font-black text-black uppercase">${escapeHtml(s.nama)}</td>
                    <td class="px-3 py-3 text-center border-r-2 border-black">${jkBadge}</td>
                    <td class="px-3 py-3 text-center border-r-2 border-black font-black text-xs text-purple-900 bg-purple-50/50">${escapeHtml(s.kelas)}</td>
                    <td class="px-3 py-3 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                            <button onclick="openStudentReportModal('${escapeHtml(s.id)}')" title="Lihat Rapor Portofolio Siswa" class="px-2.5 py-1 bg-emerald-300 hover:bg-emerald-400 text-black border border-black rounded-lg text-[11px] font-black uppercase active:translate-y-0.5 transition cursor-pointer">
                                Rapor
                            </button>
                            <button onclick="openEditStudentModal('${escapeHtml(s.id)}')" title="Ubah Data Siswa" class="px-2.5 py-1 bg-yellow-300 hover:bg-yellow-400 text-black border border-black rounded-lg text-[11px] font-black uppercase active:translate-y-0.5 transition cursor-pointer">
                                Edit
                            </button>
                            <button onclick="deleteStudentAction('${escapeHtml(s.id)}')" title="Hapus Siswa" class="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-lg text-[11px] font-black uppercase active:translate-y-0.5 transition cursor-pointer">
                                Hapus
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    };

    window.openAddStudentModal = () => {
        document.getElementById('student-input-id').value = '';
        document.getElementById('student-input-nisn').value = '';
        document.getElementById('student-input-nama').value = '';
        document.getElementById('student-input-jk').value = 'Laki-Laki';
        document.getElementById('student-modal-title').textContent = 'Tambah Siswa Baru';

        const kelasSelect = document.getElementById('student-input-kelas');
        if (kelasSelect) {
            populateTargetClassSelect(kelasSelect, stateKelas[0] || 'VII.1');
        }
        document.getElementById('student-modal').classList.remove('hidden');
    };

    window.openEditStudentModal = (studentId) => {
        const student = stateStudents.find(s => String(s.id) === String(studentId));
        if (!student) return;

        document.getElementById('student-input-id').value = student.id;
        document.getElementById('student-input-nisn').value = student.nisn || '';
        document.getElementById('student-input-nama').value = student.nama || '';
        document.getElementById('student-input-jk').value = student.jenis_kelamin || 'Laki-Laki';
        document.getElementById('student-modal-title').textContent = 'Edit Data Siswa';

        const kelasSelect = document.getElementById('student-input-kelas');
        if (kelasSelect) {
            populateTargetClassSelect(kelasSelect, student.kelas || 'VII.1');
        }
        document.getElementById('student-modal').classList.remove('hidden');
    };

    window.closeStudentModal = () => {
        document.getElementById('student-modal').classList.add('hidden');
    };

    window.openStudentReportModal = async (studentIdOrName, studentKelas = '', studentNisn = '') => {
        const student = (stateStudents || []).find(s => String(s.id) === String(studentIdOrName));
        let studentName = studentIdOrName;
        if (student) {
            studentName = student.nama;
            studentKelas = student.kelas;
            studentNisn = student.nisn || '';
        }

        const modal = document.getElementById('student-report-modal');
        const nameEl = document.getElementById('admin-report-student-name');
        const metaEl = document.getElementById('admin-report-student-meta');
        const bodyEl = document.getElementById('admin-report-body');
        if (!modal) return;

        if (nameEl) nameEl.textContent = studentName;
        if (metaEl) metaEl.textContent = `Kelas ${studentKelas} • NISN: ${studentNisn || '-'} • SMP Negeri 58 Palembang`;
        if (bodyEl) bodyEl.innerHTML = '<div class="text-center py-10 text-slate-500 font-bold text-xs uppercase animate-pulse">Memuat riwayat portofolio tugas dan ujian siswa...</div>';
        
        modal.classList.remove('hidden');

        try {
            // Ambil pengumpulan tugas
            const { data: rawFileGrades, error: fErr } = await supabase
                .from('files')
                .select('*')
                .ilike('nama', studentName.trim())
                .order('created_at', { ascending: false });
            if (fErr) throw fErr;

            // Saring agar hanya tugas di kelas siswa ini (mencegah bentrok nama kembar beda jenjang/kelas)
            const fileGrades = (rawFileGrades || []).filter(f => {
                const matchName = (f.nama || '').toLowerCase().trim() === studentName.toLowerCase().trim();
                if (!matchName) return false;
                if (studentKelas && studentKelas !== '-' && f.kelas) {
                    return isClassMatch(f.kelas, studentKelas);
                }
                return true;
            });

            // Ambil hasil kuis
            const { data: quizGradeRows, error: qErr } = await supabase
                .rpc('get_student_exam_grades', { p_name: studentName.trim() });
            if (qErr) throw qErr;

            // Saring agar hanya ujian di kelas siswa ini (mencegah nama sama beda kelas tertukar)
            const quizGrades = (quizGradeRows || []).filter(q => {
                if (!['selesai', 'belum_dikoreksi', 'perlu_dinilai'].includes(q.status_koreksi)) return false;
                if (studentKelas && studentKelas !== '-') {
                    if (q.kelas && !isClassMatch(q.kelas, studentKelas)) return false;
                    const matchedQuiz = quizzesList.find(item => String(item.id) === String(q.quiz_id));
                    if (matchedQuiz && !isClassMatch(matchedQuiz.kelas, studentKelas)) return false;
                }
                return true;
            });

            // Tugas kelas
            const classAssignments = assignmentsList.filter(a => isClassMatch(a.kelas, studentKelas));
            const submittedAssignIds = new Set((fileGrades || []).map(f => String(f.assignment_id || '')));
            const submittedAssignTitles = new Set((fileGrades || []).map(f => (f.materi || '').toLowerCase().trim()));

            const completedTasks = fileGrades || [];
            const pendingTasks = classAssignments.filter(a =>
                !submittedAssignIds.has(String(a.id)) &&
                !submittedAssignTitles.has((a.judul_tugas || '').toLowerCase().trim())
            );

            // Ujian kelas
            const classQuizzes = quizzesList.filter(q => isClassMatch(q.kelas, studentKelas));
            const submittedQuizIds = new Set((quizGrades || []).map(q => String(q.quiz_id || q.quizzes?.id || '')));
            const submittedQuizTitles = new Set((quizGrades || []).map(q => (q.judul_kuis || q.quizzes?.judul_kuis || '').toLowerCase().trim()));

            const completedExams = quizGrades || [];
            const pendingExams = classQuizzes.filter(q =>
                !submittedQuizIds.has(String(q.id)) &&
                !submittedQuizTitles.has((q.judul_kuis || '').toLowerCase().trim())
            );

            // Hitung rata-rata
            const gradedFiles = completedTasks.filter(f => f.nilai !== null && f.nilai !== undefined && f.nilai !== '');
            const avgTugas = gradedFiles.length > 0 
                ? Math.round(gradedFiles.reduce((acc, f) => acc + Number(f.nilai), 0) / gradedFiles.length)
                : 0;

            const gradedQuizzes = completedExams.filter(q => q.status_koreksi === 'selesai' && q.total_nilai !== null && q.total_nilai !== undefined);
            const avgUjian = gradedQuizzes.length > 0
                ? Math.round(gradedQuizzes.reduce((acc, q) => acc + Number(q.total_nilai || 0), 0) / gradedQuizzes.length)
                : 0;

            bodyEl.innerHTML = `
                <!-- Bento Summary Cards -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div class="bg-indigo-50 border-2 border-black rounded-2xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
                        <span class="text-[10px] font-black uppercase text-indigo-700 block">Rata-Rata Tugas</span>
                        <span class="text-xl font-black text-indigo-950 mt-1 block">${gradedFiles.length > 0 ? avgTugas : '-'}</span>
                    </div>
                    <div class="bg-purple-50 border-2 border-black rounded-2xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
                        <span class="text-[10px] font-black uppercase text-purple-700 block">Rata-Rata CBT</span>
                        <span class="text-xl font-black text-purple-950 mt-1 block">${gradedQuizzes.length > 0 ? avgUjian : '-'}</span>
                    </div>
                    <div class="bg-emerald-50 border-2 border-black rounded-2xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
                        <span class="text-[10px] font-black uppercase text-emerald-700 block">Tugas Selesai</span>
                        <span class="text-sm sm:text-base font-black text-emerald-950 mt-1 block">${completedTasks.length} / ${classAssignments.length || completedTasks.length}</span>
                    </div>
                    <div class="bg-amber-50 border-2 border-black rounded-2xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
                        <span class="text-[10px] font-black uppercase text-amber-700 block">Ujian Diikuti</span>
                        <span class="text-sm sm:text-base font-black text-amber-950 mt-1 block">${completedExams.length} / ${classQuizzes.length || completedExams.length}</span>
                    </div>
                </div>

                <!-- Bagian 1: Tugas & PR -->
                <div class="space-y-3 pt-2">
                    <div class="flex justify-between items-center border-b-2 border-black pb-1.5">
                        <h4 class="font-black text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
                            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black"></span>
                            Daftar Tugas & PR (${completedTasks.length} Selesai, ${pendingTasks.length} Belum)
                        </h4>
                    </div>

                    <div class="space-y-2">
                        ${completedTasks.length === 0 ? `
                            <div class="p-4 bg-slate-50 border-2 border-black rounded-xl text-center text-xs font-bold text-slate-500 uppercase">
                                Belum ada riwayat tugas yang dikumpulkan siswa ini.
                            </div>
                        ` : completedTasks.map(g => `
                            <div class="bg-slate-50 border-2 border-black rounded-xl p-3 flex justify-between items-center gap-3">
                                <div>
                                    <div class="flex items-center gap-2">
                                        <span class="bg-emerald-100 text-emerald-900 text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-300 uppercase">SUDAH DIKUMPULKAN</span>
                                        <span class="text-[10px] font-bold text-slate-500">${new Date(g.created_at).toLocaleDateString('id-ID')}</span>
                                    </div>
                                    <h5 class="font-black text-sm text-black mt-0.5">${escapeHtml(g.materi)}</h5>
                                    ${g.catatan_guru ? `<p class="text-xs text-slate-600 italic mt-0.5">"${escapeHtml(g.catatan_guru)}"</p>` : ''}
                                </div>
                                <div class="text-right shrink-0">
                                    <span class="bg-emerald-300 text-black font-black text-base px-2.5 py-1 rounded-lg border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] inline-block">
                                        ${g.nilai !== null && g.nilai !== undefined && g.nilai !== '' ? g.nilai : '-'}
                                    </span>
                                </div>
                            </div>
                        `).join('')}

                        ${pendingTasks.map(t => `
                            <div class="bg-red-50 border-2 border-red-300 rounded-xl p-2.5 flex justify-between items-center gap-2">
                                <div>
                                    <span class="bg-red-200 text-red-900 text-[9px] font-black px-1.5 py-0.5 rounded border border-red-400 uppercase">BELUM MENGUMPULKAN</span>
                                    <h5 class="font-black text-xs text-red-950 mt-0.5">${escapeHtml(t.judul_tugas)}</h5>
                                </div>
                                <button type="button" onclick="closeStudentReportModal(); switchTab('tugas');" class="px-2.5 py-1 bg-white hover:bg-slate-100 text-red-700 border border-red-300 rounded-lg text-[10px] font-black uppercase transition shrink-0 cursor-pointer">
                                    Buka Tab Tugas
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Bagian 2: Ujian Online -->
                <div class="space-y-3 pt-3">
                    <div class="flex justify-between items-center border-b-2 border-black pb-1.5">
                        <h4 class="font-black text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
                            <span class="w-2.5 h-2.5 rounded-full bg-purple-500 border border-black"></span>
                            Daftar Ujian Online CBT (${completedExams.length} Diikuti, ${pendingExams.length} Belum)
                        </h4>
                    </div>

                    <div class="space-y-2">
                        ${completedExams.length === 0 ? `
                            <div class="p-4 bg-slate-50 border-2 border-black rounded-xl text-center text-xs font-bold text-slate-500 uppercase">
                                Belum ada riwayat ujian CBT yang diselesaikan siswa ini.
                            </div>
                        ` : completedExams.map(q => `
                            <div class="bg-slate-50 border-2 border-black rounded-xl p-3 flex justify-between items-center gap-3">
                                <div>
                                    <div class="flex items-center gap-2">
                                        <span class="bg-purple-100 text-purple-900 text-[9px] font-black px-1.5 py-0.5 rounded border border-purple-300 uppercase">UJIAN SELESAI</span>
                                        <span class="text-[10px] font-bold text-slate-500">${new Date(q.created_at).toLocaleDateString('id-ID')}</span>
                                    </div>
                                    <h5 class="font-black text-sm text-black mt-0.5">${escapeHtml(q.judul_kuis || q.quizzes?.judul_kuis || 'Ujian')}</h5>
                                    <div class="text-[10px] font-bold text-slate-600 mt-0.5">PG: ${q.skor_pg || 0} | Esai: ${q.skor_esai || 0}</div>
                                </div>
                                <div class="text-right shrink-0">
                                    <span class="bg-yellow-300 text-black font-black text-base px-2.5 py-1 rounded-lg border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] inline-block">
                                        ${q.total_nilai}
                                    </span>
                                </div>
                            </div>
                        `).join('')}

                        ${pendingExams.map(u => `
                            <div class="bg-red-50 border-2 border-red-300 rounded-xl p-2.5 flex justify-between items-center gap-2">
                                <div>
                                    <span class="bg-red-200 text-red-900 text-[9px] font-black px-1.5 py-0.5 rounded border border-red-400 uppercase">BELUM MENGIKUTI UJIAN</span>
                                    <h5 class="font-black text-xs text-red-950 mt-0.5">${escapeHtml(u.judul_kuis)}</h5>
                                    <span class="text-[10px] font-bold text-red-600 block mt-0.5">Durasi: ${escapeHtml(String(u.durasi_menit || 60))} Menit</span>
                                </div>
                                <button type="button" onclick="closeStudentReportModal(); switchTab('ujian');" class="px-2.5 py-1 bg-white hover:bg-slate-100 text-purple-700 border border-purple-300 rounded-lg text-[10px] font-black uppercase transition shrink-0 cursor-pointer">
                                    Buka Tab Ujian
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } catch (err) {
            bodyEl.innerHTML = `<div class="p-4 bg-red-50 border-2 border-red-300 text-red-800 font-bold text-xs">Gagal memuat rapor: ${escapeHtml(err.message)}</div>`;
        }
    };

    window.closeStudentReportModal = () => {
        const modal = document.getElementById('student-report-modal');
        if (modal) modal.classList.add('hidden');
    };

    window.printAdminStudentReportCard = () => {
        const name = document.getElementById('admin-report-student-name')?.textContent || 'Siswa';
        const bodyHtml = document.getElementById('admin-report-body')?.innerHTML || '';
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
                <title>Rapor Portofolio Nilai Siswa - ${escapeHtml(name)}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>body { font-family: sans-serif; padding: 24px; color: black; }</style>
            </head>
            <body class="bg-white">
                <div class="max-w-4xl mx-auto space-y-6">
                    <div class="border-b-4 border-double border-black pb-4 text-center">
                        <h2 class="text-xs font-black uppercase tracking-widest text-slate-700">Pemerintah Kota Palembang &bull; Dinas Pendidikan</h2>
                        <h1 class="text-xl sm:text-2xl font-black uppercase text-black tracking-tight mt-0.5">SMP NEGERI 58 PALEMBANG</h1>
                        <p class="text-xs text-slate-600 font-bold mt-1">Laporan Portofolio Belajar & Buku Nilai Siswa Terpadu</p>
                    </div>
                    <div class="border-2 border-black p-4 rounded-xl bg-slate-50 font-black text-lg uppercase">${escapeHtml(name)}</div>
                    ${bodyHtml}
                </div>
                <script>
                    window.onload = function() { setTimeout(() => window.print(), 500); };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    window.handleSaveStudent = async (e) => {
        e.preventDefault();
        const id = document.getElementById('student-input-id').value.trim();
        const nisn = document.getElementById('student-input-nisn').value.trim();
        const nama = document.getElementById('student-input-nama').value.trim();
        const kelas = document.getElementById('student-input-kelas').value.trim();
        const jk = document.getElementById('student-input-jk').value;

        if (!nama || !kelas) {
            showCustomModal("Nama siswa dan kelas wajib diisi!");
            return;
        }

        const btn = document.getElementById('btn-save-student');
        if (btn) {
            btn.disabled = true;
            btn.textContent = "Menyimpan...";
        }

        try {
            if (id) {
                await updateStudentInDB(id, { nisn, nama, kelas, jenis_kelamin: jk });
                showCustomModal(`Data siswa "${nama}" berhasil diperbarui!`);
            } else {
                await addStudentToDB({ nisn, nama, kelas, jenis_kelamin: jk });
                showCustomModal(`Siswa "${nama}" berhasil ditambahkan ke kelas ${kelas}!`);
            }
            closeStudentModal();
            await loadStudentsRoster();
        } catch (err) {
            showCustomModal("Gagal menyimpan data siswa: " + err.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = "Simpan Data Siswa";
            }
        }
    };

    window.deleteStudentAction = async (studentId, fallbackName = '') => {
        const student = (stateStudents || []).find(s => String(s.id) === String(studentId));
        const studentName = student?.nama || fallbackName || 'Siswa ini';
        const confirmed = await showCustomModal(
            `Apakah Anda yakin ingin menghapus siswa "${studentName}" dari master data sekolah?\n\nPerhatian: Siswa yang dihapus tidak akan dapat login ke ujian CBT.`,
            'confirm',
            'Konfirmasi Hapus Siswa',
            ''
        );
        if (!confirmed) return;

        try {
            await deleteStudentFromDB(studentId);
            await showCustomModal(`Siswa "${studentName}" berhasil dihapus.`, 'alert', 'Siswa Dihapus', '');
            await loadStudentsRoster();
        } catch (err) {
            await showCustomModal("Gagal menghapus siswa: " + err.message, 'alert', 'Gagal Menghapus', '');
        }
    };

    window.syncDefaultRosterBtn = async () => {
        const btn = document.getElementById('btn-sync-roster-csv');
        if (btn) {
            btn.disabled = true;
            btn.textContent = "Menyinkronkan...";
        }
        try {
            const res = await syncRosterToDB(initialStudents);
            showCustomModal(`Berhasil menyinkronkan ${res.count || initialStudents.length} siswa resmi SMPN 58 Palembang ke database Supabase!`);
            await loadStudentsRoster();
        } catch (err) {
            showCustomModal("Gagal sinkronisasi roster: " + err.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = "Sinkronkan Roster CSV";
            }
        }
    };

    // Unduh Kerangka / Template CSV Siswa
    window.downloadStudentTemplateCsv = () => {
        const headers = ['No', 'NISN', 'Nama Siswa', 'Jenis Kelamin', 'Kelas'];
        const sampleRows = [
            ['1', '0123456781', 'AHMAD FAUZI', 'Laki-Laki', 'VII.1'],
            ['2', '0123456782', 'SITI AMINAH', 'Perempuan', 'VII.1'],
            ['3', '0123456783', 'BUDI SANTOSO', 'Laki-Laki', 'VII.2'],
            ['4', '0123456784', 'DEWI SARTIKA', 'Perempuan', 'VII.2'],
            ['5', '0123456785', 'MUHAMMAD RIZKY', 'Laki-Laki', 'VIII.1']
        ];

        const csvContent = '\uFEFF' + [
            headers.join(','),
            ...sampleRows.map(r => r.join(','))
        ].join('\r\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Template_Roster_Siswa_SMPN58.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Ekspor Data Siswa ke CSV Excel
    window.exportStudentsRosterCSV = () => {
        if (!stateStudents || stateStudents.length === 0) {
            showCustomModal("Belum ada data siswa untuk diekspor.");
            return;
        }

        const filterKelas = (document.getElementById('filter-roster-kelas')?.value || 'semua').trim();
        let exportData = stateStudents;
        if (filterKelas && filterKelas !== 'semua') {
            exportData = exportData.filter(s => String(s.kelas).trim() === filterKelas);
        }

        if (exportData.length === 0) {
            showCustomModal("Tidak ada data siswa pada filter kelas yang dipilih.");
            return;
        }

        // Urutkan berdasarkan kelas lalu nama
        exportData = [...exportData].sort((a, b) => {
            const cmpKelas = String(a.kelas || '').localeCompare(String(b.kelas || ''));
            if (cmpKelas !== 0) return cmpKelas;
            return String(a.nama || '').localeCompare(String(b.nama || ''));
        });

        const headers = ['No', 'NISN', 'Nama Siswa', 'Jenis Kelamin', 'Kelas'];
        const rows = exportData.map((s, idx) => {
            const nisn = s.nisn || s.id || '';
            const nama = `"${String(s.nama || '').replace(/"/g, '""')}"`;
            const jk = s.jenis_kelamin || 'Laki-Laki';
            const kelas = `"${String(s.kelas || '').replace(/"/g, '""')}"`;
            return `${idx + 1},${nisn},${nama},${jk},${kelas}`;
        });

        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const dateStr = new Date().toISOString().split('T')[0];
        const suffix = filterKelas && filterKelas !== 'semua' ? `_${filterKelas.replace(/\./g, '-')}` : '_Semua_Kelas';
        link.href = url;
        link.setAttribute('download', `Roster_Siswa_SMPN58${suffix}_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Modal Impor Siswa dengan Pratinjau
    let pendingImportStudents = [];

    window.openImportStudentModal = () => {
        pendingImportStudents = [];
        const fileInput = document.getElementById('import-student-csv-file');
        if (fileInput) fileInput.value = '';

        const nameDisplay = document.getElementById('import-file-name-display');
        if (nameDisplay) {
            nameDisplay.textContent = '';
            nameDisplay.classList.add('hidden');
        }

        const previewSection = document.getElementById('import-preview-section');
        if (previewSection) previewSection.classList.add('hidden');

        const btnImport = document.getElementById('btn-execute-import');
        if (btnImport) {
            btnImport.disabled = true;
            btnImport.innerHTML = '<span>Mulai Impor Siswa</span>';
        }

        const modal = document.getElementById('import-student-modal');
        if (modal) modal.classList.remove('hidden');
    };

    window.closeImportStudentModal = () => {
        pendingImportStudents = [];
        const modal = document.getElementById('import-student-modal');
        if (modal) modal.classList.add('hidden');
    };

    window.previewImportCsvFile = (input) => {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];

        const nameDisplay = document.getElementById('import-file-name-display');
        if (nameDisplay) {
            const kbSize = (file.size / 1024).toFixed(1);
            nameDisplay.textContent = `${file.name} (${kbSize} KB)`;
            nameDisplay.classList.remove('hidden');
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const parsed = parseRosterCsvText(text);

            if (parsed.length === 0) {
                showCustomModal("Format berkas CSV tidak valid atau data kosong. Pastikan baris header memuat kolom Nama, Kelas, dan NISN.");
                input.value = '';
                if (nameDisplay) nameDisplay.classList.add('hidden');
                return;
            }

            pendingImportStudents = parsed;

            const previewSection = document.getElementById('import-preview-section');
            const previewCount = document.getElementById('import-preview-count');
            const previewTbody = document.getElementById('import-preview-tbody');
            const btnImport = document.getElementById('btn-execute-import');

            if (previewCount) {
                previewCount.textContent = `${parsed.length} Siswa Terdeteksi`;
            }

            if (previewTbody) {
                const sampleRows = parsed.slice(0, 5);
                previewTbody.innerHTML = sampleRows.map((s, idx) => {
                    const isPerempuan = String(s.jenis_kelamin || '').toLowerCase().startsWith('p');
                    const jkBadge = isPerempuan
                        ? `<span class="bg-pink-100 text-pink-800 text-[10px] font-black px-1.5 py-0.5 rounded">P</span>`
                        : `<span class="bg-blue-100 text-blue-800 text-[10px] font-black px-1.5 py-0.5 rounded">L</span>`;

                    return `
                        <tr class="hover:bg-slate-50">
                            <td class="px-2.5 py-1.5 text-center text-slate-500">${idx + 1}</td>
                            <td class="px-2.5 py-1.5 font-mono font-bold text-indigo-900">${escapeHtml(s.nisn || s.id)}</td>
                            <td class="px-3 py-1.5 font-black uppercase text-black">${escapeHtml(s.nama)}</td>
                            <td class="px-2 py-1.5 text-center">${jkBadge}</td>
                            <td class="px-2.5 py-1.5 text-center font-black text-purple-900">${escapeHtml(s.kelas)}</td>
                        </tr>
                    `;
                }).join('');
            }

            if (previewSection) previewSection.classList.remove('hidden');
            if (btnImport) {
                btnImport.disabled = false;
                btnImport.innerHTML = `<span>Impor ${parsed.length} Siswa ke Database</span>`;
            }
        };
        reader.readAsText(file);
    };

    window.executeImportStudents = async () => {
        if (!pendingImportStudents || pendingImportStudents.length === 0) {
            showCustomModal("Silakan pilih file CSV terlebih dahulu.");
            return;
        }

        const btnImport = document.getElementById('btn-execute-import');
        if (btnImport) {
            btnImport.disabled = true;
            btnImport.innerHTML = '<span>Menyimpan ke Database...</span>';
        }

        try {
            const res = await syncRosterToDB(pendingImportStudents);
            showCustomModal(`Berhasil mengimpor ${res.count || pendingImportStudents.length} data siswa ke database Supabase!`);
            closeImportStudentModal();
            await loadStudentsRoster();
        } catch (err) {
            showCustomModal("Gagal mengimpor data siswa: " + err.message);
        } finally {
            if (btnImport) {
                btnImport.disabled = false;
                btnImport.innerHTML = '<span>Mulai Impor Siswa</span>';
            }
        }
    };

    // Kompatibilitas unggah file CSV langsung jika dipanggil
    window.handleRosterCsvFileUpload = async (input) => {
        window.openImportStudentModal();
        if (input.files && input.files[0]) {
            const importInput = document.getElementById('import-student-csv-file');
            if (importInput) {
                const dt = new DataTransfer();
                dt.items.add(input.files[0]);
                importInput.files = dt.files;
                window.previewImportCsvFile(importInput);
            }
        }
    };

});
