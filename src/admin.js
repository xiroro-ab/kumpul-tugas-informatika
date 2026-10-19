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

let currentSession = null;
let currentTeacher = null;
let stateKelas = [];
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
        { value: 'Semua Kelas', label: '🌐 Semua Kelas (Seluruh Siswa)' }
    ];

    if (list.length === 0) {
        return options;
    }

    // Deteksi tingkat kelas yang benar-benar ada di daftar pengaturan
    const hasGrade7 = list.some(k => /\b7\b|vii/i.test(k));
    const hasGrade8 = list.some(k => /\b8\b|viii/i.test(k));
    const hasGrade9 = list.some(k => /\b9\b|ix/i.test(k));

    if (hasGrade7) {
        options.push({ value: 'Semua Kelas 7 (VII)', label: '📚 Khusus Semua Kelas 7 (VII)' });
    }
    if (hasGrade8) {
        options.push({ value: 'Semua Kelas 8 (VIII)', label: '📚 Khusus Semua Kelas 8 (VIII)' });
    }
    if (hasGrade9) {
        options.push({ value: 'Semua Kelas 9 (IX)', label: '📚 Khusus Semua Kelas 9 (IX)' });
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

export function parseAssignmentQuestions(assignment) {
    if (!assignment || !assignment.deskripsi) {
        return { petunjuk: '', questions: [] };
    }
    const raw = String(assignment.deskripsi).trim();
    if (raw.startsWith('{') || raw.startsWith('[')) {
        try {
            const parsed = JSON.parse(raw);
            let qList = [];
            let petunjuk = '';
            if (Array.isArray(parsed)) {
                qList = parsed;
            } else if (parsed.questions && Array.isArray(parsed.questions)) {
                petunjuk = parsed.petunjuk || '';
                qList = parsed.questions;
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
                return { petunjuk, questions: qList };
            }
        } catch (_) {}
    }
    const s = splitQuestionImage(raw);
    return {
        petunjuk: s.text,
        questions: [
            {
                id: 1,
                nomor: 1,
                tipe: 'esai',
                pertanyaan: s.text,
                gambar_url: s.gambar_url,
                kunci: assignment.rubrik_ai || '',
                bobot: 100
            }
        ]
    };
}

document.addEventListener('DOMContentLoaded', () => {

    // Helper Modal Alert/Confirm Neobrutalisme
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

    // Tab Navigation
    window.switchTab = (tabName) => {
        const tabs = ['tugas', 'penugasan', 'materi', 'kuis', 'setting', 'approval'];
        tabs.forEach(t => {
            const btn = document.getElementById(`tab-btn-${t}`);
            const content = document.getElementById(`tab-content-${t}`);
            if (t === tabName) {
                if (btn) btn.className = "lms-tab-btn py-3 px-2 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-black text-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
                if (content) content.classList.remove('hidden');
            } else {
                if (btn) {
                    if (t === 'approval') {
                        btn.className = "lms-tab-btn col-span-2 sm:col-span-5 py-3 px-3 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-purple-400 text-black border-[3px] border-black hover:bg-purple-300";
                    } else {
                        btn.className = "lms-tab-btn py-3 px-2 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-white text-black border-[3px] border-black hover:bg-slate-100";
                    }
                }
                if (content) content.classList.add('hidden');
            }
        });

        if (tabName === 'tugas') loadFilesTable();
        if (tabName === 'penugasan') loadAssignments();
        if (tabName === 'materi') loadMaterials();
        if (tabName === 'kuis') loadQuizzes();
        if (tabName === 'approval') loadAllTeachers();
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
                const { count } = await supabase.from('teachers').select('*', { count: 'exact', head: true });
                const isFirstTeacher = !count || count === 0;

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
            const roleBadge = document.getElementById('teacher-role-badge');
            if (teacher.role === 'superadmin') {
                if (approvalTabBtn) {
                    approvalTabBtn.classList.remove('hidden');
                    approvalTabBtn.classList.add('flex');
                }
                if (roleBadge) roleBadge.classList.remove('hidden');
            } else {
                if (approvalTabBtn) approvalTabBtn.classList.add('hidden');
                if (roleBadge) roleBadge.classList.add('hidden');
            }

            loadOptionsSettings();
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
                const { count } = await supabase.from('teachers').select('*', { count: 'exact', head: true });
                const isFirstTeacher = !count || count === 0;

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

    function isTextSubmission(f) {
        return f.tipe === 'text' || (f.storage_path && f.storage_path.startsWith('TEXT:'));
    }

    function getTextContent(f) {
        if (f.storage_path && f.storage_path.startsWith('TEXT:')) {
            return f.storage_path.replace('TEXT:', '');
        }
        return f.link_url || '';
    }

    function isLinkSubmission(f) {
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

    window.downloadSubmissionFile = async (url, filename) => {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename || 'berkas_tugas_siswa';
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
            const { data, error } = await supabase.from('files').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            
            pendingFiles = data || [];
            applyFilters();
        } catch (e) {
            console.error(e);
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-6 text-center text-red-500 font-bold uppercase tracking-widest border-b-2 border-black">Gagal memuat tugas: ${e.message}</td></tr>`;
        }
    }

    const searchInput = document.getElementById('search-tugas');
    const filterKelasSelect = document.getElementById('filter-kelas-tugas');
    const filterMateriSelect = document.getElementById('filter-materi-tugas');

    function applyFilters() {
        const term = searchInput ? searchInput.value.toLowerCase() : '';
        const kelasVal = filterKelasSelect ? filterKelasSelect.value : '';
        const materiVal = filterMateriSelect ? filterMateriSelect.value : '';

        const filtered = pendingFiles.filter(f => {
            const matchTerm = (f.nama && f.nama.toLowerCase().includes(term)) ||
                              (f.filename && f.filename.toLowerCase().includes(term));
            const matchKelas = kelasVal === '' || isClassMatch(kelasVal, f.kelas);
            const matchMateri = materiVal === '' || f.materi === materiVal;
            return matchTerm && matchKelas && matchMateri;
        });
        renderFilesTable(filtered);
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (filterKelasSelect) filterKelasSelect.addEventListener('change', applyFilters);
    if (filterMateriSelect) filterMateriSelect.addEventListener('change', applyFilters);

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
            
            const isText = isTextSubmission(f);
            const isLink = isLinkSubmission(f);
            let detailCell = '';
            let downloadBtnHtml = '';

            if (isText) {
                const textSnippet = getTextContent(f);
                detailCell = `
                    <div class="flex flex-col gap-1 py-0.5 w-full pr-2">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="inline-flex items-center shrink-0 bg-amber-100 text-amber-900 text-[10px] font-black px-1.5 py-0.5 rounded border border-amber-300 uppercase">
                                📝 FORM WEB
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
                                🔗 LINK
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
                            📁 FILE
                        </span>
                        <a href="${targetUrl}" target="_blank" class="font-bold text-xs text-indigo-700 hover:underline break-all leading-relaxed" title="${f.filename}">
                            ${f.filename} ↗
                        </a>
                    </div>
                `;
                downloadBtnHtml = `
                    <button onclick="downloadSubmissionFile('${targetUrl}', '${f.filename.replace(/'/g, "\\'")}')" title="Unduh Berkas Siswa ke Komputer" class="inline-flex items-center bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1.5 rounded-lg uppercase tracking-wider text-xs font-black transition-colors border border-slate-300">
                        ⬇️ Unduh
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
                <td class="px-3 py-3 whitespace-nowrap font-black text-black border-b-2 border-black border-r-2 text-xs">${f.kelas}</td>
                <td class="px-3 py-3 whitespace-nowrap font-bold text-black border-b-2 border-black border-r-2 text-xs">${f.materi}</td>
                <td class="px-3 py-3 whitespace-nowrap font-bold text-black border-b-2 border-black border-r-2 text-xs">${f.nama}</td>
                <td class="px-3 py-3 font-medium text-black border-b-2 border-black border-r-2 min-w-[200px]">${detailCell}</td>
                <td class="px-3 py-3 text-center border-b-2 border-black border-r-2">${gradeBadge}</td>
                <td class="px-3 py-3 whitespace-nowrap font-black text-xs border-b-2 border-black">
                    <div class="flex items-center gap-1.5">
                        <button onclick="openGradeModal('${f.id}')" class="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 rounded-lg uppercase tracking-wider text-xs font-black transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            Koreksi
                        </button>
                        ${downloadBtnHtml}
                        <button onclick="deleteFile('${f.id}', '${f.storage_path}', ${isLink || isText})" class="inline-flex items-center bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1.5 rounded-lg uppercase tracking-wider text-xs font-black transition-colors border border-red-300">
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
                    const isBs = tipe === 'benar_salah';
                    const isFoto = tipe === 'upload_foto';
                    const isMatch = tipe === 'menjodohkan';
                    const isSingkat = tipe === 'singkat' || tipe === 'isian_singkat';

                    let typeLabel = 'Esai / Uraian';
                    let typeBadgeClass = 'text-purple-700';
                    let keyBadge = '';

                    if (isPg) {
                        typeLabel = 'Pilihan Ganda';
                        typeBadgeClass = 'text-blue-700';
                        const isCorrect = String(q.jawaban_siswa).trim().toUpperCase() === String(q.kunci).trim().toUpperCase();
                        keyBadge = isCorrect
                            ? `<span class="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">✅ Benar (Kunci: ${escapeHtml(q.kunci)})</span>`
                            : `<span class="bg-red-100 text-red-900 border border-red-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">❌ Jawaban: ${escapeHtml(q.jawaban_siswa || 'Kosong')} (Kunci: ${escapeHtml(q.kunci)})</span>`;
                    } else if (isBs) {
                        typeLabel = 'Benar / Salah';
                        typeBadgeClass = 'text-teal-700';
                        const isCorrect = String(q.jawaban_siswa).trim().toUpperCase() === String(q.kunci).trim().toUpperCase();
                        keyBadge = isCorrect
                            ? `<span class="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">✅ Benar (Kunci: ${escapeHtml(q.kunci)})</span>`
                            : `<span class="bg-red-100 text-red-900 border border-red-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">❌ Jawaban: ${escapeHtml(q.jawaban_siswa || 'Kosong')} (Kunci: ${escapeHtml(q.kunci)})</span>`;
                    } else if (isFoto) {
                        typeLabel = 'Upload Foto / Bukti';
                        typeBadgeClass = 'text-orange-700';
                    } else if (isMatch) {
                        typeLabel = 'Menjodohkan';
                        typeBadgeClass = 'text-pink-700';
                    } else if (isSingkat) {
                        typeLabel = 'Isian Singkat';
                        typeBadgeClass = 'text-emerald-700';
                    }

                    let answerHtml = '';
                    if (isFoto) {
                        const fileUrl = q.jawaban_siswa;
                        if (fileUrl && (String(fileUrl).startsWith('http://') || String(fileUrl).startsWith('https://'))) {
                            answerHtml = `
                                <div class="space-y-2">
                                    <img src="${escapeHtml(fileUrl)}" alt="Unggahan Siswa" class="max-h-64 rounded-xl border-2 border-black object-contain bg-white" />
                                    <a href="${escapeHtml(fileUrl)}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black rounded-lg text-xs font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                        🔍 Buka Berkas / Foto Asli
                                    </a>
                                </div>
                            `;
                        } else {
                            answerHtml = `<span class="text-slate-500 italic font-semibold">(Siswa belum melampirkan berkas foto)</span>`;
                        }
                    } else if (isMatch) {
                        const studentMatches = (typeof q.jawaban_siswa === 'object' && q.jawaban_siswa !== null) ? q.jawaban_siswa : {};
                        const pairs = Array.isArray(q.pasangan) ? q.pasangan : [];
                        answerHtml = `
                            <div class="overflow-x-auto">
                                <table class="w-full text-xs text-left border-collapse border border-slate-300 rounded-lg">
                                    <thead>
                                        <tr class="bg-slate-100 text-slate-800 font-black">
                                            <th class="p-2 border border-slate-300">Premis / Istilah</th>
                                            <th class="p-2 border border-slate-300">Pilihan Siswa</th>
                                            <th class="p-2 border border-slate-300">Kunci Benar</th>
                                            <th class="p-2 border border-slate-300 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${pairs.map(p => {
                                            const stAns = studentMatches[p.kiri] || '(Belum dipilih)';
                                            const matchCorrect = String(stAns).trim().toLowerCase() === String(p.kanan).trim().toLowerCase();
                                            return `
                                                <tr class="${matchCorrect ? 'bg-emerald-50/50' : 'bg-red-50/50'}">
                                                    <td class="p-2 font-bold border border-slate-300">${escapeHtml(p.kiri)}</td>
                                                    <td class="p-2 font-semibold border border-slate-300">${escapeHtml(stAns)}</td>
                                                    <td class="p-2 font-semibold border border-slate-300 text-purple-900">${escapeHtml(p.kanan)}</td>
                                                    <td class="p-2 border border-slate-300 text-center font-black">${matchCorrect ? '✅ Cocok' : '❌ Salah'}</td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `;
                    } else {
                        answerHtml = `<div class="font-semibold text-black whitespace-pre-line">${escapeHtml(q.jawaban_siswa || '(Tidak dijawab / Kosong)')}</div>`;
                    }

                    const { text: cleanPertanyaan, gambar_url: qImg } = splitQuestionImage(q.pertanyaan || '');
                    const imgUrl = q.gambar_url || qImg;

                    return `
                        <div class="border-2 border-black rounded-2xl p-4 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-2.5">
                            <div class="flex items-center justify-between border-b border-slate-200 pb-1.5 flex-wrap gap-1">
                                <div class="flex items-center gap-2">
                                    <span class="w-6 h-6 rounded-lg bg-black text-white font-black text-xs flex items-center justify-center">
                                        ${idx + 1}
                                    </span>
                                    <span class="font-black text-xs uppercase ${typeBadgeClass}">
                                        ${typeLabel}
                                    </span>
                                    ${keyBadge}
                                </div>
                                <span class="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                                    Bobot: ${q.bobot || 25} Poin
                                </span>
                            </div>

                            <p class="font-bold text-xs md:text-sm text-slate-900 leading-relaxed">${escapeHtml(cleanPertanyaan)}</p>
                            ${imgUrl ? `
                                <div class="my-2 p-1.5 border-2 border-black rounded-xl bg-slate-50 max-w-sm">
                                    <a href="${escapeHtml(imgUrl)}" target="_blank" title="Buka gambar stimulus">
                                        <img src="${escapeHtml(imgUrl)}" alt="Gambar Soal" class="max-h-48 rounded-lg border border-slate-300 object-contain mx-auto" />
                                    </a>
                                    <div class="text-[10px] text-slate-500 font-bold text-center mt-1">📷 Stimulus Gambar Soal (Klik untuk perbesar)</div>
                                </div>
                            ` : ''}

                            <div class="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 text-xs leading-relaxed">
                                <span class="font-black uppercase text-amber-950 text-[10px] block mb-1">Jawaban Siswa:</span>
                                ${answerHtml}
                            </div>

                            ${q.kunci && !isMatch ? `
                                <div class="bg-purple-50 border border-purple-200 rounded-xl p-2.5 text-[11px] font-bold text-purple-900">
                                    🎯 <strong>Kunci / Panduan Guru:</strong> ${escapeHtml(q.kunci)}
                                </div>
                            ` : ''}

                            <div id="ai-item-eval-${idx}" class="hidden bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 text-xs text-emerald-950 font-medium"></div>
                        </div>
                    `;
                }).join('');
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
                                <button type="button" onclick="downloadSubmissionFile('${publicUrlData.publicUrl}', '${item.filename.replace(/'/g, "\\'")}')" class="bg-slate-100 text-slate-800 font-bold px-3 py-1 rounded-lg border border-slate-300">⬇️ Unduh</button>
                            </div>
                        </div>
                    `;
                }
            }
        }

        document.getElementById('grade-input-score').value = item.nilai !== null && item.nilai !== undefined ? item.nilai : '';
        document.getElementById('grade-input-feedback').value = item.catatan_guru || item.ai_feedback || '';
        document.getElementById('grade-modal').classList.remove('hidden');
    };

    window.closeGradeModal = () => {
        document.getElementById('grade-modal').classList.add('hidden');
        activeGradeItem = null;
    };

    window.runAiGrade = async () => {
        if (!activeGradeItem) return;
        const btn = document.getElementById('btn-run-ai-grade');
        btn.disabled = true;
        btn.innerText = "Menganalisis Jawaban...";

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
                // Gunakan AI Form Evaluator per butir soal
                const evalResult = await aiEvaluateFormSubmission(
                    currentTeacher?.mapel || 'Informatika',
                    activeGradeItem.materi,
                    formItems
                );

                if (evalResult.nilai_total !== undefined) {
                    document.getElementById('grade-input-score').value = evalResult.nilai_total;
                }
                if (evalResult.catatan_guru) {
                    document.getElementById('grade-input-feedback').value = evalResult.catatan_guru;
                }

                if (Array.isArray(evalResult.evaluasi_per_soal)) {
                    evalResult.evaluasi_per_soal.forEach(ev => {
                        const idx = (ev.nomor || 1) - 1;
                        const el = document.getElementById(`ai-item-eval-${idx}`);
                        if (el) {
                            el.innerHTML = `<strong>Koreksi AI:</strong> Nilai Butir Ini: ${ev.skor} Poin. ${escapeHtml(ev.catatan)}`;
                            el.classList.remove('hidden');
                        }
                    });
                }
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
            btn.disabled = false;
            btn.innerText = "✨ Koreksi Otomatis AI";
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
            const { error } = await supabase.from('files').update({
                nilai: scoreNum,
                catatan_guru: feedbackVal,
                status_koreksi: 'sudah_dikoreksi'
            }).eq('id', activeGradeItem.id);

            if (error) throw error;

            activeGradeItem.nilai = scoreNum;
            activeGradeItem.catatan_guru = feedbackVal;
            activeGradeItem.status_koreksi = 'sudah_dikoreksi';

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
        saveBtn.innerText = "Simpan Nilai";
    };

    window.deleteFile = async (id, path, isLink = false) => {
        const confirmed = await showCustomModal('Apakah Anda yakin ingin menghapus tugas ini secara permanen?', 'confirm');
        if (!confirmed) return;
        
        try {
            if (!isLink && path && !path.startsWith('LINK:')) {
                const { error: storageError } = await supabase.storage.from('uploads').remove([path]);
                if (storageError) console.warn("Storage removal warning:", storageError);
            }

            const { error: dbError } = await supabase.from('files').delete().eq('id', id);
            if (dbError) throw dbError;

            await showCustomModal('Tugas berhasil dihapus.');
            loadFilesTable();
        } catch (e) {
            console.error(e);
            await showCustomModal('Gagal menghapus tugas: ' + e.message);
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
            const { data, error } = await supabase.from('assignments').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            assignmentsList = data || [];

            // Pastikan data pengumpulan siswa termutakhir tersedia untuk penghitungan
            if (!pendingFiles || pendingFiles.length === 0) {
                try {
                    const { data: fileData } = await supabase.from('files').select('*').order('created_at', { ascending: false });
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
                const descText = parsed.petunjuk || 'Formulir tugas online interaktif';
                const qCount = parsed.questions ? parsed.questions.length : 1;

                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start gap-2 mb-2 flex-wrap">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                    Kelas ${escapeHtml(a.kelas)} &bull; ${escapeHtml(a.mapel)}
                                </span>
                                <span class="bg-indigo-100 text-indigo-900 border border-indigo-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                    📝 ${qCount} Butir Soal
                                </span>
                            </div>
                            <span class="bg-red-100 text-red-800 border border-red-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                Batas: ${deadlineText}
                            </span>
                        </div>
                        <h4 class="font-black text-lg text-black mb-1">${escapeHtml(a.judul_tugas)}</h4>
                        <p class="text-xs text-slate-700 font-medium leading-relaxed mb-3 whitespace-pre-line line-clamp-3">${escapeHtml(descText)}</p>
                        ${a.rubrik_ai ? `<div class="bg-purple-50 border border-purple-200 rounded-lg p-2 text-[11px] font-bold text-purple-900 mb-3">🎯 <strong>Rubrik AI:</strong> ${escapeHtml(a.rubrik_ai)}</div>` : ''}
                    </div>
                    <div class="pt-3 border-t-2 border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                        <span class="text-xs font-black text-slate-800 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-xl">
                            👥 ${matchingSubs.length} Siswa (${gradedCount} Dinilai)
                        </span>
                        <div class="flex items-center gap-2 flex-wrap">
                            <button onclick="editAssignment('${a.id}')" class="px-3 py-2 bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition flex items-center gap-1">
                                ✏️ Edit Soal
                            </button>
                            <button onclick="openAssignmentSubmissionsModal('${a.id}')" class="px-3.5 py-2 bg-emerald-400 hover:bg-emerald-500 text-black border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition flex items-center gap-1.5">
                                📋 Periksa & Koreksi (${matchingSubs.length})
                            </button>
                            <button onclick="deleteAssignment('${a.id}')" class="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 border-2 border-red-300 rounded-xl font-black text-xs uppercase transition">
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
        if (descEl) descEl.textContent = a.deskripsi || 'Tidak ada petunjuk khusus.';
        if (rubrikEl) {
            rubrikEl.innerHTML = a.rubrik_ai 
                ? `🎯 <strong>Rubrik Penilaian AI:</strong> ${escapeHtml(a.rubrik_ai)}` 
                : '🎯 <strong>Rubrik Penilaian:</strong> Kesesuaian tugas, kelengkapan pengerjaan, dan kerapian penyajian.';
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

            const isText = isTextSubmission(f);
            const isLink = isLinkSubmission(f);
            let detailHtml = '';

            if (isText) {
                const textSnippet = getTextContent(f);
                detailHtml = `
                    <div class="space-y-1 py-1 max-w-xs md:max-w-sm">
                        <span class="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded border border-amber-300 uppercase">
                            📝 Form Web
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
                            🔗 Link Online
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
                            📁 Berkas
                        </span>
                        <a href="${fileUrl}" target="_blank" class="text-indigo-700 font-bold text-xs underline truncate max-w-[180px]" title="${escapeHtml(f.filename)}">
                            ${escapeHtml(f.filename)} ↗
                        </a>
                    </div>
                `;
            }

            let statusHtml = '';
            if (f.nilai !== null && f.nilai !== undefined && f.nilai !== '') {
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
                            ⏳ Belum Dinilai
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
                        Koreksi & Nilai ✏️
                    </button>
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
    window.openAssignmentModal = (assignment = null) => {
        editingAssignmentId = assignment ? assignment.id : null;

        const titleEl = document.getElementById('assignment-modal-title');
        if (titleEl) {
            titleEl.innerText = assignment ? "✏️ Edit Formulir Tugas Interaktif" : "📝 Buat Formulir Tugas Baru (Google Form Style)";
        }
        const saveBtnText = document.getElementById('btn-save-assignment-text');
        if (saveBtnText) {
            saveBtnText.innerText = assignment ? "SIMPAN PERUBAHAN FORM TUGAS" : "PUBLIKASIKAN FORM TUGAS KE SISWA";
        }

        const kelasSelect = document.getElementById('assign-kelas');
        populateTargetClassSelect(kelasSelect, assignment ? assignment.kelas : 'Semua Kelas');

        const mapelSelect = document.getElementById('assign-mapel');
        if (mapelSelect) {
            mapelSelect.value = assignment ? (assignment.mapel || 'Informatika') : (currentTeacher?.mapel || 'Informatika');
        }

        if (assignment) {
            document.getElementById('assign-judul').value = assignment.judul_tugas || '';
            document.getElementById('assign-deadline').value = assignment.deadline ? assignment.deadline.slice(0, 16) : '';
            const parsed = parseAssignmentQuestions(assignment);
            document.getElementById('assign-deskripsi').value = parsed.petunjuk || '';
            formBuilderQuestions = parsed.questions && parsed.questions.length > 0 ? parsed.questions : [
                { id: 1, tipe: 'esai', pertanyaan: '', kunci: '', bobot: 25 }
            ];
        } else {
            document.getElementById('assign-judul').value = '';
            document.getElementById('assign-deskripsi').value = 'Jawablah setiap butir pertanyaan tugas berikut dengan teliti dan jujur.';
            document.getElementById('assign-deadline').value = '';
            formBuilderQuestions = [
                { id: 1, tipe: 'esai', pertanyaan: '', kunci: '', bobot: 25 },
                { id: 2, tipe: 'pg', pertanyaan: '', opsi_a: '', opsi_b: '', opsi_c: '', opsi_d: '', kunci: 'A', bobot: 25 }
            ];
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
            const isSingkat = tipe === 'singkat';
            const isBs = tipe === 'benar_salah';
            const isFoto = tipe === 'upload_foto';
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
                                <option value="singkat" ${isSingkat ? 'selected' : ''}>Isian Singkat</option>
                                <option value="benar_salah" ${isBs ? 'selected' : ''}>Benar / Salah</option>
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
                        <label class="block text-[11px] font-black uppercase text-black mb-1">Pertanyaan / Instruksi Soal #${idx + 1}</label>
                        <textarea rows="2" placeholder="Tuliskan pertanyaan atau instruksi soal di sini..." oninput="window.updateFormQuestionField(${idx}, 'pertanyaan', this.value)" class="w-full p-2.5 border-2 border-black rounded-xl font-medium text-xs bg-slate-50 focus:bg-white">${escapeHtml(cleanPertanyaan)}</textarea>
                    </div>

                    <!-- Lampiran Stimulus Gambar Soal -->
                    <div class="p-2.5 rounded-xl border border-dashed border-slate-400 bg-slate-50/80 space-y-2">
                        <div class="flex items-center justify-between flex-wrap gap-2">
                            <span class="text-[11px] font-black uppercase text-slate-700 flex items-center gap-1.5">
                                <span>📷</span> Lampiran Gambar Soal (Stimulus / Ilustrasi / Diagram)
                            </span>
                            ${q.gambar_url ? `
                                <button type="button" onclick="window.removeQuestionImage(${idx}, 'form')" class="text-[10px] font-black uppercase text-red-600 bg-red-100 hover:bg-red-200 px-2 py-0.5 rounded border border-red-300 transition">
                                    ❌ Hapus Gambar
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
                                    <span class="text-[10px] text-emerald-700 font-bold">✅ Gambar aktif terpasang pada butir soal ini</span>
                                </div>
                            </div>
                        ` : `
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                                <div>
                                    <input type="file" id="form_img_file_${idx}" accept="image/*" class="hidden" onchange="window.handleQuestionImageUpload(event, ${idx}, 'form')">
                                    <button type="button" onclick="document.getElementById('form_img_file_${idx}').click()" class="w-full h-8 px-2.5 bg-white hover:bg-slate-100 border border-black rounded-lg text-xs font-black text-slate-800 flex items-center justify-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition">
                                        📁 Pilih Gambar dari Komputer
                                    </button>
                                </div>
                                <div class="flex items-center gap-1.5">
                                    <input type="url" placeholder="Atau tempel URL gambar (https://...)" value="${escapeHtml(q.gambar_url || '')}" oninput="window.updateQuestionImage(${idx}, this.value, 'form')" class="w-full h-8 px-2.5 border border-black rounded-lg text-xs font-medium bg-white">
                                </div>
                            </div>
                        `}
                    </div>

                    ${isPg ? `
                        <div class="space-y-2 pt-1">
                            <label class="block text-[11px] font-black uppercase text-black">Opsi Pilihan Jawaban & Kunci</label>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div class="flex items-center gap-1.5">
                                    <span class="w-6 text-center font-black text-xs text-slate-700">A</span>
                                    <input type="text" placeholder="Teks opsi A..." value="${escapeHtml(q.opsi_a || '')}" oninput="window.updateFormQuestionField(${idx}, 'opsi_a', this.value)" class="flex-1 h-8 px-2.5 border-2 border-black rounded-lg font-bold text-xs bg-slate-50">
                                </div>
                                <div class="flex items-center gap-1.5">
                                    <span class="w-6 text-center font-black text-xs text-slate-700">B</span>
                                    <input type="text" placeholder="Teks opsi B..." value="${escapeHtml(q.opsi_b || '')}" oninput="window.updateFormQuestionField(${idx}, 'opsi_b', this.value)" class="flex-1 h-8 px-2.5 border-2 border-black rounded-lg font-bold text-xs bg-slate-50">
                                </div>
                                <div class="flex items-center gap-1.5">
                                    <span class="w-6 text-center font-black text-xs text-slate-700">C</span>
                                    <input type="text" placeholder="Teks opsi C..." value="${escapeHtml(q.opsi_c || '')}" oninput="window.updateFormQuestionField(${idx}, 'opsi_c', this.value)" class="flex-1 h-8 px-2.5 border-2 border-black rounded-lg font-bold text-xs bg-slate-50">
                                </div>
                                <div class="flex items-center gap-1.5">
                                    <span class="w-6 text-center font-black text-xs text-slate-700">D</span>
                                    <input type="text" placeholder="Teks opsi D..." value="${escapeHtml(q.opsi_d || '')}" oninput="window.updateFormQuestionField(${idx}, 'opsi_d', this.value)" class="flex-1 h-8 px-2.5 border-2 border-black rounded-lg font-bold text-xs bg-slate-50">
                                </div>
                            </div>
                            <div class="flex items-center gap-2 pt-1">
                                <label class="text-[11px] font-black uppercase text-black">Kunci Jawaban Benar:</label>
                                <select onchange="window.updateFormQuestionField(${idx}, 'kunci', this.value)" class="h-8 px-3 border-2 border-black rounded-lg font-black text-xs bg-yellow-200 text-black cursor-pointer">
                                    <option value="A" ${q.kunci === 'A' ? 'selected' : ''}>A</option>
                                    <option value="B" ${q.kunci === 'B' ? 'selected' : ''}>B</option>
                                    <option value="C" ${q.kunci === 'C' ? 'selected' : ''}>C</option>
                                    <option value="D" ${q.kunci === 'D' ? 'selected' : ''}>D</option>
                                </select>
                            </div>
                        </div>
                    ` : isBs ? `
                        <div class="space-y-2 pt-1">
                            <label class="block text-[11px] font-black uppercase text-black">Kunci Jawaban Benar / Salah:</label>
                            <div class="flex items-center gap-3">
                                <select onchange="window.updateFormQuestionField(${idx}, 'kunci', this.value)" class="h-9 px-3 border-2 border-black rounded-xl font-black text-xs bg-teal-100 text-teal-950 cursor-pointer">
                                    <option value="BENAR" ${String(q.kunci).toUpperCase() === 'BENAR' ? 'selected' : ''}>✅ BENAR (Pernyataan Sesuai)</option>
                                    <option value="SALAH" ${String(q.kunci).toUpperCase() === 'SALAH' ? 'selected' : ''}>❌ SALAH (Pernyataan Keliru)</option>
                                </select>
                            </div>
                        </div>
                    ` : isFoto ? `
                        <div class="space-y-2 pt-1">
                            <div class="bg-orange-50 border-2 border-orange-200 rounded-xl p-3 text-xs text-orange-950">
                                <span class="font-black uppercase text-[10px] block mb-1">📸 Format Soal Pengunggahan Berkas / Foto:</span>
                                <p class="text-[11px] font-medium leading-relaxed">Siswa akan diberikan area dropzone unggah foto/dokumen hasil pekerjaan langsung di formulir.</p>
                            </div>
                            <div>
                                <label class="block text-[11px] font-black uppercase text-purple-950 mb-1">🎯 Kriteria Foto yang Diharapkan (Acuan Penilaian AI & Guru)</label>
                                <input type="text" placeholder="Contoh: Foto catatan tulisan tangan yang rapi dan terbaca, atau screenshot praktik coding..." value="${escapeHtml(q.kunci || '')}" oninput="window.updateFormQuestionField(${idx}, 'kunci', this.value)" class="w-full h-9 px-3 border-2 border-purple-300 rounded-xl font-bold text-xs bg-purple-50 focus:bg-white text-purple-950">
                            </div>
                        </div>
                    ` : isMatch ? `
                        <div class="space-y-2 pt-1">
                            <div class="flex items-center justify-between">
                                <label class="text-[11px] font-black uppercase text-black">Pasangan Premis & Jodoh Jawaban:</label>
                                <button type="button" onclick="window.addMatchingPair(${idx})" class="px-2.5 py-1 bg-pink-200 hover:bg-pink-300 border-2 border-black rounded-lg font-black text-[10px] uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition">
                                    ➕ Tambah Pasangan
                                </button>
                            </div>
                            <div class="space-y-2">
                                ${(q.pasangan || []).map((p, pIdx) => `
                                    <div class="flex items-center gap-2">
                                        <span class="w-5 text-center font-black text-xs text-slate-700">${pIdx + 1}</span>
                                        <input type="text" placeholder="Istilah / Premis (Kiri)..." value="${escapeHtml(p.kiri || '')}" oninput="window.updateMatchingPair(${idx}, ${pIdx}, 'kiri', this.value)" class="flex-1 h-8 px-2.5 border-2 border-black rounded-lg font-bold text-xs bg-slate-50">
                                        <span class="font-black text-xs text-slate-500">➜</span>
                                        <input type="text" placeholder="Pasangan / Definisi (Kanan)..." value="${escapeHtml(p.kanan || '')}" oninput="window.updateMatchingPair(${idx}, ${pIdx}, 'kanan', this.value)" class="flex-1 h-8 px-2.5 border-2 border-black rounded-lg font-bold text-xs bg-slate-50">
                                        <button type="button" onclick="window.deleteMatchingPair(${idx}, ${pIdx})" title="Hapus Pasangan" class="w-7 h-7 rounded border border-red-400 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center font-black text-xs transition">
                                            &times;
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <div>
                            <label class="block text-[11px] font-black uppercase text-purple-950 mb-1">🎯 Kunci Jawaban / Panduan Evaluasi AI (Acuan Penilaian)</label>
                            <input type="text" placeholder="Tuliskan kata kunci jawaban yang diharapkan siswa..." value="${escapeHtml(q.kunci || '')}" oninput="window.updateFormQuestionField(${idx}, 'kunci', this.value)" class="w-full h-9 px-3 border-2 border-purple-300 rounded-xl font-bold text-xs bg-purple-50 focus:bg-white text-purple-950">
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
            if (newType === 'pg') {
                if (!formBuilderQuestions[idx].kunci || !['A', 'B', 'C', 'D'].includes(formBuilderQuestions[idx].kunci)) {
                    formBuilderQuestions[idx].kunci = 'A';
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

        if (!judul) {
            showCustomModal("Judul formulir tugas wajib diisi!");
            return;
        }

        if (formBuilderQuestions.length === 0) {
            showCustomModal("Form tugas harus memiliki minimal 1 butir pertanyaan!");
            return;
        }

        for (let i = 0; i < formBuilderQuestions.length; i++) {
            if (!formBuilderQuestions[i].pertanyaan.trim()) {
                showCustomModal(`Pertanyaan nomor ${i + 1} masih kosong. Mohon lengkapi teks pertanyaan.`);
                return;
            }
        }

        const btn = document.getElementById('btn-save-assignment');
        if (btn) {
            btn.disabled = true;
            btn.innerText = editingAssignmentId ? "Menyimpan Perubahan..." : "Menerbitkan Form Tugas...";
        }

        try {
            const payloadDeskripsi = JSON.stringify({
                petunjuk: petunjuk || 'Jawablah seluruh butir pertanyaan berikut dengan teliti.',
                questions: formBuilderQuestions
            });

            const rubrikSummary = formBuilderQuestions
                .filter(q => q.kunci)
                .map((q, idx) => `Soal #${idx + 1} (${q.tipe}): ${q.kunci}`)
                .join('; ');

            if (editingAssignmentId) {
                const { error } = await supabase.from('assignments').update({
                    mapel,
                    kelas,
                    judul_tugas: judul,
                    deskripsi: payloadDeskripsi,
                    rubrik_ai: rubrikSummary || 'Kesesuaian jawaban dengan konsep materi dan kelengkapan pembahasan.',
                    deadline: deadline || null
                }).eq('id', editingAssignmentId);

                if (error) throw error;
                editingAssignmentId = null;
                closeAssignmentModal();
                loadAssignments();
                showCustomModal(`✅ Formulir tugas "${judul}" berhasil diperbarui!`);
            } else {
                const { error } = await supabase.from('assignments').insert([{
                    teacher_id: currentSession?.user?.id,
                    mapel,
                    kelas,
                    judul_tugas: judul,
                    deskripsi: payloadDeskripsi,
                    rubrik_ai: rubrikSummary || 'Kesesuaian jawaban dengan konsep materi dan kelengkapan pembahasan.',
                    deadline: deadline || null
                }]);

                if (error) throw error;

                await supabase.from('options').insert([{ type: 'materi', name: judul }]).catch(() => {});

                closeAssignmentModal();
                loadAssignments();
                loadOptionsSettings();
                showCustomModal(`✅ Formulir tugas "${judul}" berisi ${formBuilderQuestions.length} butir soal berhasil dipublikasikan untuk ${kelas}!`);
            }
        } catch (e) {
            showCustomModal("Gagal menyimpan formulir tugas: " + e.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                const saveBtnText = document.getElementById('btn-save-assignment-text');
                if (saveBtnText) {
                    saveBtnText.innerText = editingAssignmentId ? "SIMPAN PERUBAHAN FORM TUGAS" : "PUBLIKASIKAN FORM TUGAS KE SISWA";
                }
            }
        }
    };

    window.deleteAssignment = async (id) => {
        const conf = await showCustomModal("Hapus penugasan ini?", "confirm");
        if (!conf) return;
        try {
            const { error } = await supabase.from('assignments').delete().eq('id', id);
            if (error) throw error;
            loadAssignments();
        } catch (e) {
            showCustomModal("Gagal menghapus: " + e.message);
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
        document.getElementById('ai-assignment-modal').classList.remove('hidden');
    };

    window.closeAiAssignmentModal = () => {
        document.getElementById('ai-assignment-modal').classList.add('hidden');
    };

    window.runAiGenerateAssignment = async () => {
        const mapel = document.getElementById('ai-assign-mapel')?.value || currentTeacher?.mapel || 'Informatika';
        const kelas = document.getElementById('ai-assign-kelas')?.value || stateKelas[0] || 'Semua Kelas';
        const jumlah = Number(document.getElementById('ai-assign-jumlah')?.value) || 4;
        const tipeSoal = document.getElementById('ai-assign-tipe')?.value || 'campuran';
        const tingkatKognitif = document.getElementById('ai-assign-kognitif')?.value || 'hots';
        const topik = document.getElementById('ai-assign-topik')?.value.trim();

        if (!topik) {
            showCustomModal("Silakan masukkan materi pokok / capaian pembelajaran terlebih dahulu!");
            return;
        }

        const btn = document.getElementById('btn-run-ai-assign');
        btn.disabled = true;
        btn.innerText = "Merumuskan Butir Soal Form...";

        try {
            const res = await aiGenerateFormQuestions({
                mapel,
                kelas,
                topik,
                jmlSoal: jumlah,
                tipeSoal,
                tingkatKognitif
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

            showCustomModal(`✨ AI berhasil menyusun ${formBuilderQuestions.length} butir soal formulir tugas! Silakan periksa, sesuaikan, atau langsung publikasikan ke siswa.`);
        } catch (e) {
            showCustomModal("Gagal generate soal form AI: " + e.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "🚀 BUATKAN SOAL KE FORM BUILDER";
        }
    };

    // ==========================================
    // 4. Modul Materi Pembelajaran
    // ==========================================
    async function loadMaterials() {
        const container = document.getElementById('materials-container');
        container.innerHTML = '<div class="col-span-2 text-center py-6 font-bold text-black uppercase animate-pulse">Memuat materi pembelajaran...</div>';

        try {
            const { data, error } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
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
            snippet = `\n\n🎯 Capaian & Tujuan Pembelajaran:\n1. Memahami konsep pokok dan fungsi utama materi ini.\n2. Mampu menerapkan konsep untuk memecahkan persoalan sehari-hari.`;
        } else if (section === 'kasus') {
            snippet = `\n\n💡 Contoh Kasus & Penerapan Sehari-Hari:\nBayangkan situasi berikut pada kehidupan remaja sehari-hari:\n[Tuliskan skenario studi kasus konkret di sini].`;
        } else if (section === 'rangkuman') {
            snippet = `\n\n📌 Rangkuman Intisari Materi:\n- Poin 1: [Prinsip penting yang harus diingat]\n- Poin 2: [Aturan atau langkah kunci]\n- Poin 3: [Hal yang perlu diperhatikan]`;
        } else if (section === 'glosarium') {
            snippet = `\n\n📖 Glosarium Istilah Penting:\n- Istilah 1: Penjelasan ringkas istilah 1.\n- Istilah 2: Penjelasan ringkas istilah 2.`;
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
                mapel,
                kelas,
                judul,
                konten,
                link_video: video
            }]);

            if (error) throw error;
            closeMaterialModal();
            loadMaterials();
            showCustomModal(`✅ Modul materi "${judul}" berhasil disimpan dan dapat diakses siswa ${kelas}!`);
        } catch (e) {
            showCustomModal("Gagal menyimpan materi: " + e.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = "💾 SIMPAN & TERBITKAN MATERI";
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
            btn.disabled = false;
            btn.innerText = "🚀 GENERATE MODUL AJAR SEKARANG";
        }
    };

    // ==========================================
    // 5. Modul Bank Soal, Ujian & Hasil Koreksi
    // ==========================================
    async function loadQuizzes() {
        const container = document.getElementById('quizzes-container');
        container.innerHTML = '<div class="text-center py-6 font-bold text-black uppercase">Memuat bank soal ujian...</div>';

        try {
            const { data, error } = await supabase.from('quizzes').select('*, quiz_questions(*)').order('created_at', { ascending: false });
            if (error) throw error;
            quizzesList = data || [];

            container.innerHTML = '';
            if (quizzesList.length === 0) {
                container.innerHTML = '<div class="bg-white border-2 border-black rounded-2xl p-8 text-center text-slate-500 font-bold uppercase">Belum ada ujian atau kuis online yang dibuat.</div>';
                return;
            }

            quizzesList.forEach(q => {
                const questions = q.quiz_questions || [];
                const pgCount = questions.filter(item => item.tipe === 'pg').length;
                const esaiCount = questions.filter(item => item.tipe === 'esai').length;

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
                        </div>
                        <h4 class="font-black text-xl text-black">${q.judul_kuis}</h4>
                        <p class="text-xs text-slate-600 font-bold mt-1">
                            ${questions.length} Soal (${pgCount} Pilihan Ganda &bull; ${esaiCount} Esai)
                        </p>
                    </div>
                    <div class="flex items-center gap-2 flex-wrap">
                        <button onclick="openQuizResultsModal('${q.id}')" class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5">
                            📊 Hasil & Koreksi Ujian
                        </button>
                        <button onclick="openEditQuizModal('${q.id}')" class="px-3.5 py-2 bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition">
                            ✏️ Edit Kuis & Soal
                        </button>
                        <button onclick="deleteQuiz('${q.id}')" class="px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 rounded-xl text-xs font-black uppercase">
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

    window.openAiQuizModal = () => {
        const kelasSelect = document.getElementById('ai-quiz-kelas');
        populateTargetClassSelect(kelasSelect, 'Semua Kelas');
        const mapelSelect = document.getElementById('ai-quiz-mapel');
        if (mapelSelect && currentTeacher?.mapel) {
            mapelSelect.value = currentTeacher.mapel;
        }
        document.getElementById('ai-quiz-judul').value = '';
        document.getElementById('ai-quiz-topik').value = '';
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
        const totalSoal = parseInt(document.getElementById('ai-quiz-total-soal')?.value, 10) || 5;
        const durasi = parseInt(document.getElementById('ai-quiz-durasi').value, 10) || 45;

        if (!judul || !topik) {
            showCustomModal("Judul ujian dan materi pokok wajib diisi!");
            return;
        }

        const btn = document.getElementById('btn-run-ai-quiz');
        btn.disabled = true;
        btn.innerText = "Menyusun Bank Soal dengan AI...";

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
                durasi
            });

            const questions = Array.isArray(result) ? result : (result?.soal || result?.questions || []);

            if (!Array.isArray(questions) || questions.length === 0) {
                throw new Error("AI tidak berhasil menghasilkan butir soal. Silakan coba kembali dengan materi pokok yang lebih spesifik.");
            }

            const { data: quizData, error: quizError } = await supabase.from('quizzes').insert([{
                teacher_id: currentSession?.user?.id,
                mapel,
                kelas,
                judul_kuis: judul,
                petunjuk: result.petunjuk || `Ujian ${topik}. Kerjakan dengan teliti dan jujur!`,
                durasi_menit: durasi,
                status: 'aktif'
            }]).select().single();

            if (quizError) throw quizError;

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
            showCustomModal(`✅ Berhasil! Kuis "${judul}" berisi ${questions.length} butir soal (${typesSummary}) telah dipublikasikan ke ${kelas}!`);
        } catch (e) {
            showCustomModal("Gagal generate bank soal AI: " + e.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "🚀 GENERATE BANK SOAL SEKARANG";
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
        if (btnSave) btnSave.innerText = "💾 SIMPAN & TERBITKAN KUIS";

        const kelasSelect = document.getElementById('manual-quiz-kelas');
        populateTargetClassSelect(kelasSelect, 'Semua Kelas');
        const mapelSelect = document.getElementById('manual-quiz-mapel');
        if (mapelSelect && currentTeacher?.mapel) {
            mapelSelect.value = currentTeacher.mapel;
        }
        document.getElementById('manual-quiz-judul').value = '';
        document.getElementById('manual-quiz-petunjuk').value = 'Kerjakan dengan teliti, jujur, dan mandiri.';
        document.getElementById('manual-quiz-durasi').value = '45';

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

    window.openEditQuizModal = (quizId) => {
        const quiz = quizzesList.find(q => String(q.id) === String(quizId));
        if (!quiz) {
            showCustomModal("Data kuis tidak ditemukan!");
            return;
        }

        editingQuizId = quiz.id;

        const modalTitle = document.getElementById('manual-quiz-modal-title');
        const modalSub = document.getElementById('manual-quiz-modal-subtitle');
        const btnSave = document.getElementById('btn-save-manual-quiz');
        if (modalTitle) modalTitle.textContent = "Edit Kuis & Butir Soal";
        if (modalSub) modalSub.textContent = "Perbarui naskah butir soal, kunci jawaban, dan stimulus gambar";
        if (btnSave) btnSave.innerText = "💾 SIMPAN PERUBAHAN KUIS";

        const kelasSelect = document.getElementById('manual-quiz-kelas');
        populateTargetClassSelect(kelasSelect, quiz.kelas || 'Semua Kelas');
        const mapelSelect = document.getElementById('manual-quiz-mapel');
        if (mapelSelect) mapelSelect.value = quiz.mapel || 'Informatika';

        document.getElementById('manual-quiz-judul').value = quiz.judul_kuis || '';
        document.getElementById('manual-quiz-durasi').value = quiz.durasi_menit || '45';
        document.getElementById('manual-quiz-petunjuk').value = quiz.petunjuk || 'Kerjakan dengan teliti, jujur, dan mandiri.';

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

    window.closeManualQuizModal = () => {
        editingQuizId = null;
        document.getElementById('manual-quiz-modal').classList.add('hidden');
    };

    window.addManualQuestionItem = (type = 'pg') => {
        const defaultBobot = (type === 'esai' || type === 'upload_foto' || type === 'menjodohkan') ? 20 : 10;
        let defaultPasangan = [];
        let defaultKunci = '';
        if (type === 'pg') defaultKunci = 'A';
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
        }
    };

    window.changeManualQuestionType = (idx, newType) => {
        if (manualQuizQuestions[idx]) {
            manualQuizQuestions[idx].tipe = newType;
            manualQuizQuestions[idx].bobot = (newType === 'esai' || newType === 'upload_foto' || newType === 'menjodohkan') ? 20 : 10;
            if (newType === 'pg' && !['A', 'B', 'C', 'D'].includes(manualQuizQuestions[idx].kunci_pg)) {
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

        const container = document.getElementById('manual-quiz-questions-list');
        if (!container) return;

        if (manualQuizQuestions.length === 0) {
            container.innerHTML = '<div class="p-6 text-center text-xs font-bold text-slate-500 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl">Belum ada soal. Klik salah satu tombol tambah soal di atas.</div>';
            return;
        }

        const typeColors = {
            pg: 'bg-indigo-100 text-indigo-900 border-indigo-400',
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
                            <label class="block text-[11px] font-black uppercase text-black">Pilihan Jawaban (A, B, C, D)</label>
                            <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">Pilih radio untuk Kunci Jawaban Benar</span>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            ${['A', 'B', 'C', 'D'].map(opt => {
                                const key = `opsi_${opt.toLowerCase()}`;
                                const val = q[key] || '';
                                const isChecked = q.kunci_pg === opt;
                                return `
                                    <div class="flex items-center gap-2 border-2 border-black rounded-xl px-2.5 py-1.5 ${isChecked ? 'bg-emerald-100 border-emerald-600 ring-2 ring-emerald-500' : 'bg-slate-50'}">
                                        <input type="radio" name="manual_quiz_kunci_${idx}" value="${opt}" ${isChecked ? 'checked' : ''} onchange="window.updateManualQuestionField(${idx}, 'kunci_pg', '${opt}'); window.renderManualQuizQuestions();" class="cursor-pointer accent-emerald-600">
                                        <span class="font-black text-xs">${opt}.</span>
                                        <input type="text" placeholder="Pilihan ${opt}..." value="${escapeHtml(val)}" oninput="window.updateManualQuestionField(${idx}, '${key}', this.value)" class="w-full bg-transparent font-medium text-xs outline-none">
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            } else if (currentType === 'benar_salah') {
                const isBenar = q.kunci_pg === 'Benar';
                specificContent = `
                    <div class="space-y-2 pt-1">
                        <label class="block text-[11px] font-black uppercase text-black">Tentukan Kunci Kebenaran Pernyataan</label>
                        <div class="grid grid-cols-2 gap-3">
                            <label class="flex items-center gap-2.5 p-3 rounded-xl border-2 border-black cursor-pointer ${isBenar ? 'bg-emerald-200 border-black ring-2 ring-emerald-500 font-black' : 'bg-slate-50 font-bold'}">
                                <input type="radio" name="manual_quiz_bs_${idx}" value="Benar" ${isBenar ? 'checked' : ''} onchange="window.updateManualQuestionField(${idx}, 'kunci_pg', 'Benar'); window.renderManualQuizQuestions();" class="accent-emerald-700">
                                <span class="text-xs text-black">✅ PERNYATAAN BENAR</span>
                            </label>
                            <label class="flex items-center gap-2.5 p-3 rounded-xl border-2 border-black cursor-pointer ${!isBenar ? 'bg-red-200 border-black ring-2 ring-red-500 font-black' : 'bg-slate-50 font-bold'}">
                                <input type="radio" name="manual_quiz_bs_${idx}" value="Salah" ${!isBenar ? 'checked' : ''} onchange="window.updateManualQuestionField(${idx}, 'kunci_pg', 'Salah'); window.renderManualQuizQuestions();" class="accent-red-700">
                                <span class="text-xs text-black">❌ PERNYATAAN SALAH</span>
                            </label>
                        </div>
                    </div>
                `;
            } else if (currentType === 'singkat') {
                specificContent = `
                    <div class="pt-1">
                        <label class="block text-[11px] font-black uppercase text-black mb-1">Kunci Jawaban Singkat (Kata Kunci Jawaban Benar)</label>
                        <input type="text" placeholder="Contoh: RAM, CPU, Fotosintesis, atau angka pasti..." value="${escapeHtml(q.kunci_pg || '')}" oninput="window.updateManualQuestionField(${idx}, 'kunci_pg', this.value)" class="w-full h-10 px-3 border-2 border-black rounded-xl font-bold text-xs bg-slate-50 focus:bg-white">
                        <p class="text-[10px] text-slate-500 font-bold mt-1">Jawaban siswa akan dicocokkan otomatis (tidak membedakan huruf besar/kecil).</p>
                    </div>
                `;
            } else if (currentType === 'menjodohkan') {
                const pairs = Array.isArray(q.pasangan) ? q.pasangan : [];
                specificContent = `
                    <div class="space-y-2 pt-1">
                        <div class="flex justify-between items-center">
                            <label class="block text-[11px] font-black uppercase text-black">Pasangan Soal Menjodohkan</label>
                            <button type="button" onclick="window.addManualQuizPair(${idx})" class="text-[11px] bg-teal-600 hover:bg-black text-white font-black px-2.5 py-1 rounded-lg border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition">
                                ➕ Tambah Pasangan
                            </button>
                        </div>
                        <div class="space-y-2">
                            ${pairs.map((p, pIdx) => `
                                <div class="flex items-center gap-2 bg-teal-50/60 p-2 rounded-xl border border-teal-300">
                                    <span class="w-6 h-6 rounded-full bg-teal-700 text-white font-black text-[10px] flex items-center justify-center shrink-0">${pIdx + 1}</span>
                                    <input type="text" placeholder="Pernyataan Kiri (Premis)..." value="${escapeHtml(p.kiri || '')}" oninput="window.updateManualQuizPair(${idx}, ${pIdx}, 'kiri', this.value)" class="flex-1 h-9 px-2.5 border-2 border-black rounded-lg font-medium text-xs bg-white">
                                    <span class="font-black text-xs text-slate-400">➔</span>
                                    <input type="text" placeholder="Jawaban Cocok Kanan..." value="${escapeHtml(p.kanan || '')}" oninput="window.updateManualQuizPair(${idx}, ${pIdx}, 'kanan', this.value)" class="flex-1 h-9 px-2.5 border-2 border-black rounded-lg font-medium text-xs bg-white">
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
                        <div class="p-2.5 bg-pink-50 border border-pink-300 rounded-xl text-[11px] font-bold text-pink-900 flex items-center gap-2">
                            <span>📷</span> Siswa akan mengunggah berkas/foto lembar jawaban fisik langsung ke server melalui kamera/galeri.
                        </div>
                        <label class="block text-[11px] font-black uppercase text-black">Rubrik Penilaian & Ketentuan Lembar Foto</label>
                        <textarea rows="2" placeholder="Contoh: Foto hitungan rumus step-by-step dengan tulisan tangan rapi dan jelas..." oninput="window.updateManualQuestionField(${idx}, 'rubrik_esai', this.value)" class="w-full p-2.5 border-2 border-black rounded-xl font-medium text-xs bg-slate-50 focus:bg-white">${escapeHtml(q.rubrik_esai || '')}</textarea>
                    </div>
                `;
            } else {
                specificContent = `
                    <div class="pt-1">
                        <label class="block text-[11px] font-black uppercase text-black mb-1">Rubrik / Kunci Penilaian Jawaban Esai (Panduan Koreksi Guru & AI)</label>
                        <textarea rows="2" placeholder="Tuliskan kriteria penilaian atau poin-poin yang wajib dijawab siswa..." oninput="window.updateManualQuestionField(${idx}, 'rubrik_esai', this.value)" class="w-full p-2.5 border-2 border-black rounded-xl font-medium text-xs bg-slate-50 focus:bg-white">${escapeHtml(q.rubrik_esai || '')}</textarea>
                    </div>
                `;
            }

            return `
                <div class="border-2 border-black rounded-2xl p-4 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
                    <div class="flex items-center justify-between border-b-2 border-slate-200 pb-2.5 flex-wrap gap-2">
                        <div class="flex items-center gap-2">
                            <span class="w-7 h-7 rounded-lg bg-black text-white font-black text-xs flex items-center justify-center">
                                ${idx + 1}
                            </span>
                            <select onchange="window.changeManualQuestionType(${idx}, this.value)" class="h-8 px-2 border-2 border-black rounded-lg font-black text-xs ${typeColors[currentType] || 'bg-slate-100'} cursor-pointer">
                                <option value="pg" ${currentType === 'pg' ? 'selected' : ''}>🔘 Pilihan Ganda (PG)</option>
                                <option value="benar_salah" ${currentType === 'benar_salah' ? 'selected' : ''}>⚖️ Benar / Salah</option>
                                <option value="singkat" ${currentType === 'singkat' ? 'selected' : ''}>✏️ Isian Singkat</option>
                                <option value="menjodohkan" ${currentType === 'menjodohkan' ? 'selected' : ''}>🔀 Menjodohkan</option>
                                <option value="upload_foto" ${currentType === 'upload_foto' ? 'selected' : ''}>📷 Upload Foto / Berkas</option>
                                <option value="esai" ${currentType === 'esai' ? 'selected' : ''}>📝 Esai / Uraian</option>
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
                        <label class="block text-[11px] font-black uppercase text-black mb-1">Pertanyaan Soal #${idx + 1}</label>
                        <textarea rows="2" placeholder="Tuliskan butir soal di sini..." oninput="window.updateManualQuestionField(${idx}, 'pertanyaan', this.value)" class="w-full p-2.5 border-2 border-black rounded-xl font-medium text-xs bg-slate-50 focus:bg-white">${escapeHtml(cleanPertanyaan)}</textarea>
                    </div>

                    <!-- Lampiran Stimulus Gambar Soal -->
                    <div class="p-2.5 rounded-xl border border-dashed border-slate-400 bg-slate-50/80 space-y-2">
                        <div class="flex items-center justify-between flex-wrap gap-2">
                            <span class="text-[11px] font-black uppercase text-slate-700 flex items-center gap-1.5">
                                <span>📷</span> Lampiran Gambar Soal (Stimulus / Ilustrasi / Diagram)
                            </span>
                            ${q.gambar_url ? `
                                <button type="button" onclick="window.removeQuestionImage(${idx}, 'quiz')" class="text-[10px] font-black uppercase text-red-600 bg-red-100 hover:bg-red-200 px-2 py-0.5 rounded border border-red-300 transition">
                                    ❌ Hapus Gambar
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
                                    <span class="text-[10px] text-emerald-700 font-bold">✅ Gambar aktif terpasang pada butir soal ini</span>
                                </div>
                            </div>
                        ` : `
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                                <div>
                                    <input type="file" id="quiz_img_file_${idx}" accept="image/*" class="hidden" onchange="window.handleQuestionImageUpload(event, ${idx}, 'quiz')">
                                    <button type="button" onclick="document.getElementById('quiz_img_file_${idx}').click()" class="w-full h-8 px-2.5 bg-white hover:bg-slate-100 border border-black rounded-lg text-xs font-black text-slate-800 flex items-center justify-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition">
                                        📁 Pilih Gambar dari Komputer
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
            if (q.tipe === 'pg') {
                if (!q.opsi_a.trim() || !q.opsi_b.trim() || !q.opsi_c.trim() || !q.opsi_d.trim()) {
                    showCustomModal(`Pilihan jawaban (A, B, C, D) pada soal nomor ${i + 1} harus diisi lengkap!`);
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
                const { error: quizError } = await supabase.from('quizzes').update({
                    mapel,
                    kelas,
                    judul_kuis: judul,
                    petunjuk,
                    durasi_menit: durasi
                }).eq('id', editingQuizId);

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
                    if (q.tipe === 'pg' && !kunci) kunci = 'A';

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
                showCustomModal(`✅ Berhasil! Perubahan kuis "${judul}" (${manualQuizQuestions.length} butir soal: ${typesSummary}) telah disimpan!`);
            } else {
                const { data: quizData, error: quizError } = await supabase.from('quizzes').insert([{
                    teacher_id: currentSession?.user?.id,
                    mapel,
                    kelas,
                    judul_kuis: judul,
                    petunjuk,
                    durasi_menit: durasi,
                    status: 'aktif'
                }]).select().single();

                if (quizError) throw quizError;

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
                showCustomModal(`✅ Berhasil! Kuis manual "${judul}" (${manualQuizQuestions.length} butir soal: ${typesSummary}) telah berhasil diterbitkan untuk ${kelas}!`);
            }
        } catch (e) {
            showCustomModal("Gagal menyimpan kuis manual: " + e.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = editingQuizId ? "💾 SIMPAN PERUBAHAN KUIS" : "💾 SIMPAN & TERBITKAN KUIS";
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

    // Suite Hasil Ujian & Koreksi Esai
    window.openQuizResultsModal = async (quizId) => {
        const quiz = quizzesList.find(q => String(q.id) === String(quizId));
        if (!quiz) return;
        activeQuizForResults = quiz;

        document.getElementById('quiz-results-title').textContent = `${quiz.judul_kuis} (${quiz.mapel})`;
        const tbody = document.getElementById('quiz-submissions-tbody');
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-6 text-center font-bold text-slate-500 uppercase animate-pulse">Memuat hasil ujian siswa...</td></tr>';
        document.getElementById('quiz-results-modal').classList.remove('hidden');

        try {
            const { data, error } = await supabase
                .from('quiz_submissions')
                .select('*')
                .eq('quiz_id', quizId)
                .order('total_nilai', { ascending: false });

            if (error) throw error;
            activeQuizSubmissions = data || [];

            tbody.innerHTML = '';
            if (activeQuizSubmissions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-6 text-center font-bold text-slate-500 uppercase">Belum ada siswa yang menyelesaikan ujian ini.</td></tr>';
                return;
            }

            activeQuizSubmissions.forEach(sub => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50 transition";
                tr.innerHTML = `
                    <td class="px-4 py-3 font-black text-black border-b-2 border-black border-r-2">${sub.nama_siswa}</td>
                    <td class="px-4 py-3 font-bold text-black border-b-2 border-black border-r-2">${sub.kelas}</td>
                    <td class="px-4 py-3 text-center font-bold border-b-2 border-black border-r-2 text-indigo-700">${sub.skor_pg}</td>
                    <td class="px-4 py-3 text-center font-bold border-b-2 border-black border-r-2 text-purple-700">${sub.skor_esai}</td>
                    <td class="px-4 py-3 text-center border-b-2 border-black border-r-2">
                        <span class="bg-emerald-100 text-emerald-900 border border-emerald-400 font-black px-2 py-0.5 rounded-lg text-sm">${sub.total_nilai}</span>
                    </td>
                    <td class="px-4 py-3 text-center border-b-2 border-black">
                        <button onclick="openExamReviewModal('${sub.id}')" class="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black text-xs uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            Periksa Jawaban
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-6 text-center text-red-600 font-bold uppercase">Gagal memuat: ${e.message}</td></tr>`;
        }
    };

    window.closeQuizResultsModal = () => {
        document.getElementById('quiz-results-modal').classList.add('hidden');
        activeQuizForResults = null;
    };

    window.exportQuizCSV = () => {
        if (!activeQuizSubmissions || activeQuizSubmissions.length === 0) {
            showCustomModal("Tidak ada data hasil ujian untuk diekspor.");
            return;
        }

        let csv = "\uFEFF";
        csv += "No,Nama Siswa,Kelas,Skor Pilihan Ganda,Skor Esai,Total Nilai,Status Ketuntasan,Waktu Selesai\n";

        activeQuizSubmissions.forEach((s, idx) => {
            const dateStr = s.created_at ? new Date(s.created_at).toLocaleString('id-ID') : '';
            const statusStr = (s.total_nilai || 0) >= 75 ? 'Tuntas' : 'Remedial';
            csv += `${idx + 1},"${s.nama_siswa}","${s.kelas}",${s.skor_pg || 0},${s.skor_esai || 0},${s.total_nilai || 0},"${statusStr}","${dateStr}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Rekap_Hasil_Ujian_${(activeQuizForResults?.judul_kuis || 'Kuis').replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
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

        const quiz = activeQuizForResults;
        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const teacherName = currentTeacher?.name || currentSession?.user?.email || 'Guru Pengampu';

        let rowsHtml = '';
        let totalAll = 0;
        let highest = 0;
        let lowest = 100;

        activeQuizSubmissions.forEach((s, idx) => {
            const score = s.total_nilai || 0;
            totalAll += score;
            if (score > highest) highest = score;
            if (score < lowest) lowest = score;

            rowsHtml += `
                <tr>
                    <td style="border: 1px solid black; padding: 6px; text-align: center;">${idx + 1}</td>
                    <td style="border: 1px solid black; padding: 6px; font-weight: bold;">${escapeHtml(s.nama_siswa)}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: center; font-weight: bold;">${escapeHtml(s.kelas)}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: center;">${s.skor_pg || 0}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: center;">${s.skor_esai || 0}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: center; font-weight: bold; font-size: 13px;">${score}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: center;">${score >= 75 ? 'Tuntas' : 'Remedial'}</td>
                </tr>
            `;
        });

        const avg = (totalAll / activeQuizSubmissions.length).toFixed(1);

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
                        <strong>Mata Pelajaran:</strong> ${escapeHtml(quiz.mapel)} &bull; <strong>Kelas:</strong> ${escapeHtml(quiz.kelas)}
                    </div>
                    <div style="text-align: right;">
                        <strong>Tanggal Cetak:</strong> ${dateStr}<br>
                        <strong>Jumlah Peserta:</strong> ${activeQuizSubmissions.length} Siswa
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 30px;">No</th>
                            <th>Nama Lengkap Siswa</th>
                            <th style="width: 60px;">Kelas</th>
                            <th style="width: 70px;">Skor PG</th>
                            <th style="width: 70px;">Skor Esai</th>
                            <th style="width: 70px;">Nilai Akhir</th>
                            <th style="width: 80px;">Ketuntasan</th>
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
        document.getElementById('exam-review-meta').textContent = `Kelas: ${sub.kelas} • Skor PG: ${sub.skor_pg} • Total Nilai Saat Ini: ${sub.total_nilai}`;

        const container = document.getElementById('exam-review-questions-container');
        container.innerHTML = '';

        const questions = activeQuizForResults.quiz_questions || [];
        const answers = sub.jawaban_siswa || {};
        const aiFeedback = sub.ai_feedback || {};

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
                    <div class="text-[9px] text-slate-500 font-bold text-center mt-0.5">📷 Stimulus Soal (Klik untuk perbesar)</div>
                </div>
            ` : '';

            if (q.tipe === 'pg') {
                const studentAns = answers[q.id] || '(Tidak dijawab)';
                const isCorrect = studentAns.toUpperCase() === (q.kunci_pg || '').toUpperCase();
                card.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="font-black text-xs text-black">No. ${idx + 1} (🔘 Pilihan Ganda)</span>
                        <span class="${isCorrect ? 'bg-emerald-100 text-emerald-900 border-emerald-400' : 'bg-red-100 text-red-900 border-red-400'} border text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            ${isCorrect ? `✅ Benar (+${q.bobot || 10})` : '❌ Salah (0)'}
                        </span>
                    </div>
                    <p class="font-bold text-xs text-slate-800">${escapeHtml(cleanPertanyaan)}</p>
                    ${imgStimulusHtml}
                    <div class="text-[11px] font-bold text-slate-600 flex gap-4">
                        <span>Jawaban Siswa: <strong class="${isCorrect ? 'text-emerald-700' : 'text-red-700'}">${escapeHtml(studentAns)}</strong></span>
                        <span>Kunci: <strong class="text-black">${escapeHtml(q.kunci_pg)}</strong></span>
                    </div>
                `;
            } else if (q.tipe === 'benar_salah') {
                const studentAns = answers[q.id] || '(Tidak dijawab)';
                const isCorrect = String(studentAns).trim().toLowerCase() === String(q.kunci_pg || '').trim().toLowerCase();
                card.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="font-black text-xs text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 uppercase">No. ${idx + 1} (⚖️ Benar/Salah)</span>
                        <span class="${isCorrect ? 'bg-emerald-100 text-emerald-900 border-emerald-400' : 'bg-red-100 text-red-900 border-red-400'} border text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            ${isCorrect ? `✅ Benar (+${q.bobot || 10})` : '❌ Salah (0)'}
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
                const defaultScore = isCorrect ? (q.bobot || 10) : 0;
                card.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="font-black text-xs text-blue-900 bg-blue-100 px-2 py-0.5 rounded border border-blue-300 uppercase">No. ${idx + 1} (✏️ Isian Singkat)</span>
                        <span class="${isCorrect ? 'bg-emerald-100 text-emerald-900 border-emerald-400' : 'bg-amber-100 text-amber-900 border-amber-400'} border text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            ${isCorrect ? `✅ Cocok Otomatis (+${q.bobot || 10})` : 'Perlu Evaluasi Guru/AI'}
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
                            <label class="block text-[10px] font-black uppercase text-black mb-0.5">Skor (0-${q.bobot || 10})</label>
                            <input type="number" id="essay-score-${q.id}" value="${currentFeedback.skor !== undefined ? currentFeedback.skor : defaultScore}" min="0" max="${q.bobot || 10}" class="w-full h-9 px-2 border-2 border-black rounded-lg font-black text-sm bg-white">
                        </div>
                        <div class="sm:col-span-3">
                            <label class="block text-[10px] font-black uppercase text-black mb-0.5">Catatan / Evaluasi</label>
                            <input type="text" id="essay-feedback-${q.id}" value="${currentFeedback.feedback || ''}" placeholder="Catatan evaluasi guru..." class="w-full h-9 px-3 border-2 border-black rounded-lg font-bold text-xs bg-white">
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

                const autoScore = pairs.length > 0 ? Math.round((q.bobot || 20) * (correctMatches / pairs.length)) : 0;

                card.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="font-black text-xs text-teal-900 bg-teal-100 px-2 py-0.5 rounded border border-teal-300 uppercase">No. ${idx + 1} (🔀 Menjodohkan)</span>
                        <span class="text-xs font-bold text-slate-500">Kesesuaian: ${correctMatches}/${pairs.length} Pasangan</span>
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
                            <label class="block text-[10px] font-black uppercase text-black mb-0.5">Skor (0-${q.bobot || 20})</label>
                            <input type="number" id="essay-score-${q.id}" value="${currentFeedback.skor !== undefined ? currentFeedback.skor : autoScore}" min="0" max="${q.bobot || 20}" class="w-full h-9 px-2 border-2 border-black rounded-lg font-black text-sm bg-white">
                        </div>
                        <div class="sm:col-span-3">
                            <label class="block text-[10px] font-black uppercase text-black mb-0.5">Masukan / Feedback Guru</label>
                            <input type="text" id="essay-feedback-${q.id}" value="${currentFeedback.feedback || ''}" placeholder="Catatan evaluasi menjodohkan..." class="w-full h-9 px-3 border-2 border-black rounded-lg font-bold text-xs bg-white">
                        </div>
                    </div>
                `;
            } else if (q.tipe === 'upload_foto') {
                const fileUrl = answers[q.id] || '';
                const currentFeedback = aiFeedback[q.id] || {};
                const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i);

                card.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="font-black text-xs text-pink-900 bg-pink-100 px-2 py-0.5 rounded border border-pink-300 uppercase">No. ${idx + 1} (📷 Upload Foto / Berkas)</span>
                        <span class="text-xs font-bold text-slate-500">Bobot Maks: ${q.bobot || 20}</span>
                    </div>
                    <p class="font-bold text-xs text-black">${escapeHtml(cleanPertanyaan)}</p>
                    ${imgStimulusHtml}
                    ${q.rubrik_esai ? `<div class="bg-yellow-50 p-2 rounded border border-yellow-200 text-[11px] font-bold text-yellow-900"><strong>Rubrik Kunci Guru:</strong> ${escapeHtml(q.rubrik_esai)}</div>` : ''}
                    <div class="bg-white p-3 rounded-xl border border-slate-300 space-y-2">
                        <span class="text-[10px] font-black text-slate-400 block uppercase">Berkas Lampiran Hasil Pengerjaan Siswa:</span>
                        ${fileUrl ? `
                            <div class="flex items-center gap-3">
                                ${isImage ? `<a href="${fileUrl}" target="_blank" title="Klik untuk memperbesar foto"><img src="${fileUrl}" class="w-24 h-24 object-cover rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform cursor-pointer"></a>` : ''}
                                <div>
                                    <a href="${fileUrl}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-black text-white rounded-lg font-black text-xs transition">
                                        <span>🔍</span> Buka Berkas Penuh ↗
                                    </a>
                                </div>
                            </div>
                        ` : `<p class="text-xs font-bold text-red-500 italic">Siswa tidak mengunggah berkas pada soal ini.</p>`}
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 items-center">
                        <div class="sm:col-span-1">
                            <label class="block text-[10px] font-black uppercase text-black mb-0.5">Skor (0-${q.bobot || 20})</label>
                            <input type="number" id="essay-score-${q.id}" value="${currentFeedback.skor !== undefined ? currentFeedback.skor : ''}" min="0" max="${q.bobot || 20}" class="w-full h-9 px-2 border-2 border-black rounded-lg font-black text-sm bg-white">
                        </div>
                        <div class="sm:col-span-3">
                            <label class="block text-[10px] font-black uppercase text-black mb-0.5">Masukan / Feedback Guru</label>
                            <input type="text" id="essay-feedback-${q.id}" value="${currentFeedback.feedback || ''}" placeholder="Catatan evaluasi lembar kerja..." class="w-full h-9 px-3 border-2 border-black rounded-lg font-bold text-xs bg-white">
                        </div>
                    </div>
                `;
            } else {
                const studentEssay = answers[q.id] || '(Kosong)';
                const currentFeedback = aiFeedback[q.id] || {};
                card.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="font-black text-xs text-purple-900 bg-purple-100 px-2 py-0.5 rounded border border-purple-300 uppercase">No. ${idx + 1} (📝 Soal Esai)</span>
                        <span class="text-xs font-bold text-slate-500">Bobot Maks: ${q.bobot || 20}</span>
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
                            <label class="block text-[10px] font-black uppercase text-black mb-0.5">Skor Esai (0-${q.bobot || 20})</label>
                            <input type="number" id="essay-score-${q.id}" value="${currentFeedback.skor !== undefined ? currentFeedback.skor : ''}" min="0" max="${q.bobot || 20}" class="w-full h-9 px-2 border-2 border-black rounded-lg font-black text-sm bg-white">
                        </div>
                        <div class="sm:col-span-3">
                            <label class="block text-[10px] font-black uppercase text-black mb-0.5">Masukan / Feedback Esai</label>
                            <input type="text" id="essay-feedback-${q.id}" value="${currentFeedback.feedback || ''}" placeholder="Catatan evaluasi esai..." class="w-full h-9 px-3 border-2 border-black rounded-lg font-bold text-xs bg-white">
                        </div>
                    </div>
                `;
            }
            container.appendChild(card);
        });

        document.getElementById('student-exam-review-modal').classList.remove('hidden');
    };

    window.closeExamReviewModal = () => {
        document.getElementById('student-exam-review-modal').classList.add('hidden');
        activeReviewSubmission = null;
    };

    window.runAiGradeAllEssays = async () => {
        if (!activeReviewSubmission || !activeQuizForResults) return;
        const btn = document.getElementById('btn-ai-grade-all-essays');
        btn.disabled = true;
        btn.innerText = "Menganalisis Jawaban...";

        const questions = activeQuizForResults.quiz_questions || [];
        const answers = activeReviewSubmission.jawaban_siswa || {};

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
        }
        btn.disabled = false;
        btn.innerText = "✨ Koreksi Semua Jawaban dengan AI";
    };

    window.saveExamReviewGrades = async () => {
        if (!activeReviewSubmission || !activeQuizForResults) return;

        const questions = activeQuizForResults.quiz_questions || [];
        let totalManualScore = 0;
        let aiFeedbackObj = {};

        questions.forEach(q => {
            const scoreInput = document.getElementById(`essay-score-${q.id}`);
            if (scoreInput) {
                const scoreVal = parseInt(scoreInput.value || '0', 10);
                const fbVal = document.getElementById(`essay-feedback-${q.id}`)?.value || '';
                totalManualScore += isNaN(scoreVal) ? 0 : scoreVal;
                aiFeedbackObj[q.id] = { skor: scoreVal, feedback: fbVal };
            }
        });

        const totalFinalScore = (activeReviewSubmission.skor_pg || 0) + totalManualScore;

        try {
            const { error } = await supabase.from('quiz_submissions').update({
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
                statusEl.textContent = `✅ Model Aktif: ${currentModel} (Siap digunakan)`;
            } else {
                statusEl.textContent = `⚠️ Kunci AI belum terpasang. Dapatkan gratis di aistudio.google.com.`;
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
            showCustomModal(`✅ SUKSES! Model "${modelToTest}" berhasil merespons dalam ${res.duration} detik.${extraNote}`);
        } catch (e) {
            showCustomModal(`❌ Gagal terhubung ke model "${modelToTest}": ${e.message}`);
        } finally {
            btn.disabled = false;
            btn.innerText = "⚡ UJI KONEKSI";
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

            const materiSet = new Set(pendingFiles.map(f => f.materi));
            if (filterMateriSelect) {
                filterMateriSelect.innerHTML = '<option value="">Semua Judul Tugas</option>';
                materiSet.forEach(m => {
                    if (m) {
                        const opt = document.createElement('option');
                        opt.value = m; opt.textContent = m;
                        filterMateriSelect.appendChild(opt);
                    }
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
                    statusBadge = '<span class="bg-emerald-100 text-emerald-900 border border-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">✅ Disetujui</span>';
                } else if (t.status === 'rejected') {
                    statusBadge = '<span class="bg-red-100 text-red-900 border border-red-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">❌ Ditolak</span>';
                } else {
                    statusBadge = '<span class="bg-amber-100 text-amber-900 border border-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">⏳ Menunggu</span>';
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
        try {
            const { error } = await supabase.from('teachers').update({ status: newStatus }).eq('id', teacherId);
            if (error) throw error;
            showCustomModal(newStatus === 'approved' ? "Akun guru berhasil disetujui! Guru tersebut sekarang dapat masuk ke LMS." : "Status akun guru berhasil diperbarui.");
            loadAllTeachers();
        } catch (e) {
            showCustomModal("Gagal memperbarui status guru: " + e.message);
        }
    };

});
