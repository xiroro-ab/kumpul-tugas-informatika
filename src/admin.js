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
    aiGradeQuizEssay
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

document.addEventListener('DOMContentLoaded', () => {

    // Helper Modal Alert/Confirm Neobrutalisme
    window.showCustomModal = (message, type = 'alert') => {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-modal');
            const msgEl = document.getElementById('custom-modal-message');
            const actionsEl = document.getElementById('custom-modal-actions');
            
            msgEl.innerText = message;
            actionsEl.innerHTML = '';
            
            if (type === 'alert') {
                const okBtn = document.createElement('button');
                okBtn.className = "bg-black text-white font-black py-2.5 px-6 rounded-xl hover:bg-slate-800 transition active:translate-y-0.5 uppercase tracking-wider text-xs";
                okBtn.innerText = "OK";
                okBtn.onclick = () => {
                    modal.classList.add('hidden');
                    resolve(true);
                };
                actionsEl.appendChild(okBtn);
            } else if (type === 'confirm') {
                const cancelBtn = document.createElement('button');
                cancelBtn.className = "bg-white border-2 border-black text-black font-black py-2.5 px-5 rounded-xl hover:bg-slate-100 transition text-xs uppercase tracking-wider";
                cancelBtn.innerText = "Batal";
                cancelBtn.onclick = () => {
                    modal.classList.add('hidden');
                    resolve(false);
                };
                
                const confirmBtn = document.createElement('button');
                confirmBtn.className = "bg-red-500 text-white border-2 border-black font-black py-2.5 px-5 rounded-xl hover:bg-red-600 transition text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
                confirmBtn.innerText = "Hapus";
                confirmBtn.onclick = () => {
                    modal.classList.add('hidden');
                    resolve(true);
                };
                
                actionsEl.appendChild(cancelBtn);
                actionsEl.appendChild(confirmBtn);
            }
            
            modal.classList.remove('hidden');
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
    function isLinkSubmission(f) {
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
            const matchKelas = kelasVal === '' || f.kelas === kelasVal;
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
            
            const isLink = isLinkSubmission(f);
            let detailCell = '';
            let targetUrl = '';

            if (isLink) {
                targetUrl = getLinkUrl(f);
                detailCell = `
                    <div class="flex flex-col gap-1 py-0.5 w-full pr-2">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="inline-flex items-center shrink-0 bg-purple-100 text-purple-900 text-[10px] font-black px-1.5 py-0.5 rounded border border-purple-300 uppercase">
                                🔗 LINK
                            </span>
                            <span class="font-bold text-xs text-slate-800 break-all">${f.filename || 'Tautan Tugas'}</span>
                        </div>
                        <a href="${targetUrl}" target="_blank" class="text-indigo-600 hover:text-indigo-900 font-semibold text-xs break-all hover:underline" title="${targetUrl}">
                            ${targetUrl} ↗
                        </a>
                    </div>
                `;
            } else {
                const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(f.storage_path);
                targetUrl = publicUrlData.publicUrl;
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
                        <button onclick="deleteFile('${f.id}', '${f.storage_path}', ${isLink})" class="inline-flex items-center bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1.5 rounded-lg uppercase tracking-wider text-xs font-black transition-colors border border-red-300">
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
        
        const previewBox = document.getElementById('grade-modal-preview-box');
        const isLink = isLinkSubmission(item);
        if (isLink) {
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
                    <span class="font-bold text-slate-800 truncate">${item.filename}</span>
                    <a href="${publicUrlData.publicUrl}" target="_blank" class="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-lg border border-indigo-300 shrink-0">Buka Berkas ↗</a>
                </div>
            `;
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
        btn.innerText = "Menganalisis...";

        try {
            const studentContent = isLinkSubmission(activeGradeItem) 
                ? getLinkUrl(activeGradeItem) 
                : activeGradeItem.filename;

            const result = await aiEvaluateSubmission(
                currentTeacher?.mapel || 'Informatika',
                activeGradeItem.materi,
                activeGradeItem.materi,
                'Kesesuaian tugas dengan instruksi, kelengkapan, dan kerapian pengerjaan.',
                studentContent
            );

            if (result.nilai !== undefined) {
                document.getElementById('grade-input-score').value = result.nilai;
            }
            if (result.catatan) {
                document.getElementById('grade-input-feedback').value = result.catatan;
            }
        } catch (e) {
            showCustomModal("Gagal menjalankan AI Koreksi: " + e.message);
        }
        btn.disabled = false;
        btn.innerText = "Koreksi AI";
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
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Kelas,Materi/Tugas,Nama Siswa,Tipe,Rincian/Tautan/File,Nilai,Catatan Guru,Waktu Pengumpulan\n";
        
        pendingFiles.forEach(f => {
            const isLink = isLinkSubmission(f);
            const tipeStr = isLink ? "Tautan / Link" : "File";
            const detailStr = isLink ? getLinkUrl(f) : f.filename;
            const nilaiStr = f.nilai !== null && f.nilai !== undefined ? f.nilai : "";
            const catatanStr = (f.catatan_guru || "").replace(/"/g, '""');
            const dateStr = f.created_at ? new Date(f.created_at).toLocaleString('id-ID') : '';
            const row = [
                `"${f.kelas}"`,
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
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Rekap_Nilai_Tugas_SMPN58_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

            container.innerHTML = '';
            if (assignmentsList.length === 0) {
                container.innerHTML = '<div class="col-span-2 bg-white border-2 border-black rounded-2xl p-8 text-center text-slate-500 font-bold uppercase">Belum ada tugas/PR yang dibuat guru.</div>';
                return;
            }

            assignmentsList.forEach(a => {
                const card = document.createElement('div');
                card.className = "bg-white border-[3px] border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between";
                const deadlineText = a.deadline ? new Date(a.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Tidak ada batas waktu';

                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start gap-2 mb-2 flex-wrap">
                            <span class="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                Kelas ${a.kelas} &bull; ${a.mapel}
                            </span>
                            <span class="bg-red-100 text-red-800 border border-red-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                Batas: ${deadlineText}
                            </span>
                        </div>
                        <h4 class="font-black text-lg text-black mb-1">${a.judul_tugas}</h4>
                        <p class="text-xs text-slate-700 font-medium leading-relaxed mb-3 whitespace-pre-line line-clamp-3">${a.deskripsi}</p>
                        ${a.rubrik_ai ? `<div class="bg-purple-50 border border-purple-200 rounded-lg p-2 text-[11px] font-bold text-purple-900 mb-3">🎯 <strong>Rubrik AI:</strong> ${a.rubrik_ai}</div>` : ''}
                    </div>
                    <div class="flex justify-end pt-2 border-t border-slate-200">
                        <button onclick="deleteAssignment('${a.id}')" class="text-red-500 hover:text-red-700 font-black text-xs uppercase">Hapus Tugas</button>
                    </div>
                `;
                container.appendChild(card);
            });
        } catch (e) {
            container.innerHTML = `<div class="col-span-2 text-center text-red-600 font-bold">Gagal memuat tugas: ${e.message}</div>`;
        }
    }

    window.openAssignmentModal = () => {
        const kelasSelect = document.getElementById('assign-kelas');
        kelasSelect.innerHTML = '';
        stateKelas.forEach(k => {
            const opt = document.createElement('option');
            opt.value = k; opt.textContent = k;
            kelasSelect.appendChild(opt);
        });
        document.getElementById('assign-judul').value = '';
        document.getElementById('assign-deskripsi').value = '';
        document.getElementById('assign-rubrik').value = '';
        document.getElementById('assign-deadline').value = '';
        document.getElementById('assignment-modal').classList.remove('hidden');
    };

    window.closeAssignmentModal = () => {
        document.getElementById('assignment-modal').classList.add('hidden');
    };

    window.saveAssignment = async () => {
        const kelas = document.getElementById('assign-kelas').value;
        const judul = document.getElementById('assign-judul').value.trim();
        const deskripsi = document.getElementById('assign-deskripsi').value.trim();
        const rubrik = document.getElementById('assign-rubrik').value.trim();
        const deadline = document.getElementById('assign-deadline').value;

        if (!judul || !deskripsi) {
            showCustomModal("Judul dan instruksi penugasan wajib diisi!");
            return;
        }

        try {
            const { error } = await supabase.from('assignments').insert([{
                teacher_id: currentSession?.user?.id,
                mapel: currentTeacher?.mapel || 'Informatika',
                kelas,
                judul_tugas: judul,
                deskripsi,
                rubrik_ai: rubrik,
                deadline: deadline || null
            }]);

            if (error) throw error;

            // Tambahkan juga ke tabel options materi jika belum ada
            await supabase.from('options').insert([{ type: 'materi', name: judul }]).catch(() => {});

            closeAssignmentModal();
            loadAssignments();
            loadOptionsSettings();
            showCustomModal("Penugasan baru berhasil diterbitkan untuk siswa!");
        } catch (e) {
            showCustomModal("Gagal menyimpan penugasan: " + e.message);
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
        if (kelasSelect) {
            kelasSelect.innerHTML = '';
            stateKelas.forEach(k => {
                const opt = document.createElement('option');
                opt.value = k; opt.textContent = k;
                kelasSelect.appendChild(opt);
            });
        }
        document.getElementById('ai-assign-topik').value = '';
        document.getElementById('ai-assignment-modal').classList.remove('hidden');
    };

    window.closeAiAssignmentModal = () => {
        document.getElementById('ai-assignment-modal').classList.add('hidden');
    };

    window.runAiGenerateAssignment = async () => {
        const topik = document.getElementById('ai-assign-topik').value.trim();
        const kelas = document.getElementById('ai-assign-kelas').value || stateKelas[0] || 'VII.1';
        const jenisTugas = document.getElementById('ai-assign-jenis').value;
        const tingkatKognitif = document.getElementById('ai-assign-kognitif').value;

        if (!topik) {
            showCustomModal("Masukkan materi pokok / capaian pembelajaran terlebih dahulu!");
            return;
        }

        const btn = document.getElementById('btn-run-ai-assign');
        btn.disabled = true;
        btn.innerText = "Merumuskan Tugas & Rubrik...";

        try {
            const res = await aiGenerateAssignment({
                mapel: currentTeacher?.mapel || 'Informatika',
                topik,
                kelas,
                jenisTugas,
                tingkatKognitif
            });

            closeAiAssignmentModal();
            openAssignmentModal();
            if (document.getElementById('assign-kelas')) document.getElementById('assign-kelas').value = kelas;
            if (res.judul) document.getElementById('assign-judul').value = res.judul;
            if (res.deskripsi) document.getElementById('assign-deskripsi').value = res.deskripsi;
            if (res.rubrik) document.getElementById('assign-rubrik').value = res.rubrik;
        } catch (e) {
            showCustomModal("Gagal generate tugas AI: " + e.message);
        }
        btn.disabled = false;
        btn.innerText = "🚀 GENERATE TUGAS & RUBRIK";
    };

    // ==========================================
    // 4. Modul Materi Pembelajaran
    // ==========================================
    async function loadMaterials() {
        const container = document.getElementById('materials-container');
        container.innerHTML = '<div class="col-span-2 text-center py-6 font-bold text-black uppercase">Memuat materi pembelajaran...</div>';

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
        matKelasSelect.innerHTML = '';
        stateKelas.forEach(k => {
            const opt = document.createElement('option');
            opt.value = k; opt.textContent = k;
            matKelasSelect.appendChild(opt);
        });
        document.getElementById('mat-judul').value = '';
        document.getElementById('mat-konten').value = '';
        document.getElementById('mat-video').value = '';
        document.getElementById('material-modal').classList.remove('hidden');
    };

    window.closeMaterialModal = () => {
        document.getElementById('material-modal').classList.add('hidden');
    };

    window.saveMaterial = async () => {
        const kelas = document.getElementById('mat-kelas').value;
        const judul = document.getElementById('mat-judul').value.trim();
        const konten = document.getElementById('mat-konten').value.trim();
        const video = document.getElementById('mat-video').value.trim();

        if (!judul || !konten) {
            showCustomModal("Judul dan konten materi wajib diisi!");
            return;
        }

        try {
            const { error } = await supabase.from('materials').insert([{
                teacher_id: currentSession?.user?.id,
                mapel: currentTeacher?.mapel || 'Informatika',
                kelas,
                judul,
                konten,
                link_video: video
            }]);

            if (error) throw error;
            closeMaterialModal();
            loadMaterials();
            showCustomModal("Materi pembelajaran berhasil disimpan dan dapat dibaca siswa!");
        } catch (e) {
            showCustomModal("Gagal menyimpan materi: " + e.message);
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
        document.getElementById('ai-mat-topik').value = '';
        document.getElementById('ai-material-modal').classList.remove('hidden');
    };

    window.closeAiMaterialModal = () => {
        document.getElementById('ai-material-modal').classList.add('hidden');
    };

    window.runAiGenerateMaterial = async () => {
        const topik = document.getElementById('ai-mat-topik').value.trim();
        if (!topik) {
            showCustomModal("Masukkan topik materi terlebih dahulu!");
            return;
        }

        const btn = document.getElementById('btn-run-ai-mat');
        btn.disabled = true;
        btn.innerText = "Sedang Membuatkan Materi...";

        try {
            const generatedText = await aiGenerateMaterial(
                currentTeacher?.mapel || 'Informatika',
                topik,
                'SMP Kelas 7-9'
            );

            closeAiMaterialModal();
            openMaterialModal();
            document.getElementById('mat-judul').value = topik;
            document.getElementById('mat-konten').value = generatedText;
        } catch (e) {
            showCustomModal("Gagal generate materi: " + e.message);
        }
        btn.disabled = false;
        btn.innerText = "🚀 GENERATE MATERI SEKARANG";
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
        if (kelasSelect) {
            kelasSelect.innerHTML = '<option value="Semua Kelas">Semua Kelas</option>';
            stateKelas.forEach(k => {
                const opt = document.createElement('option');
                opt.value = k; opt.textContent = `Kelas ${k}`;
                kelasSelect.appendChild(opt);
            });
        }
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
        const countPG = parseInt(document.getElementById('ai-quiz-count-pg').value, 10) || 5;
        const countEsai = parseInt(document.getElementById('ai-quiz-count-esai').value, 10) || 0;
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
                jmlPg: countPG,
                jmlEsai: countEsai,
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

            const questionsPayload = questions.map((q, idx) => ({
                quiz_id: quizData.id,
                nomor: idx + 1,
                tipe: q.tipe || 'pg',
                pertanyaan: q.pertanyaan,
                opsi_a: q.opsi_a || '',
                opsi_b: q.opsi_b || '',
                opsi_c: q.opsi_c || '',
                opsi_d: q.opsi_d || '',
                kunci_pg: q.kunci_pg || '',
                rubrik_esai: q.rubrik_esai || '',
                bobot: q.bobot || (q.tipe === 'esai' ? 25 : 10)
            }));

            const { error: qError } = await supabase.from('quiz_questions').insert(questionsPayload);
            if (qError) throw qError;

            closeAiQuizModal();
            loadQuizzes();
            showCustomModal(`✅ Berhasil! Kuis "${judul}" berisi ${questions.length} butir soal (${countPG} PG & ${countEsai} Esai) telah dipublikasikan ke ${kelas}!`);
        } catch (e) {
            showCustomModal("Gagal generate bank soal AI: " + e.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "🚀 GENERATE BANK SOAL SEKARANG";
        }
    };

    window.openQuizModal = () => {
        openAiQuizModal();
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

        let csv = "data:text/csv;charset=utf-8,";
        csv += "Nama Siswa,Kelas,Skor Pilihan Ganda,Skor Esai,Total Nilai,Waktu Selesai\n";

        activeQuizSubmissions.forEach(s => {
            const dateStr = s.created_at ? new Date(s.created_at).toLocaleString('id-ID') : '';
            csv += `"${s.nama_siswa}","${s.kelas}",${s.skor_pg},${s.skor_esai},${s.total_nilai},"${dateStr}"\n`;
        });

        const encodedUri = encodeURI(csv);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Rekap_Hasil_Ujian_${activeQuizForResults?.judul_kuis || 'Kuis'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

            if (q.tipe === 'pg') {
                const studentAns = answers[q.id] || '(Tidak dijawab)';
                const isCorrect = studentAns.toUpperCase() === (q.kunci_pg || '').toUpperCase();
                card.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="font-black text-xs text-black">No. ${idx + 1} (Pilihan Ganda)</span>
                        <span class="${isCorrect ? 'bg-emerald-100 text-emerald-900 border-emerald-400' : 'bg-red-100 text-red-900 border-red-400'} border text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            ${isCorrect ? '✅ Benar (+10)' : '❌ Salah (0)'}
                        </span>
                    </div>
                    <p class="font-bold text-xs text-slate-800">${q.pertanyaan}</p>
                    <div class="text-[11px] font-bold text-slate-600 flex gap-4">
                        <span>Jawaban Siswa: <strong class="${isCorrect ? 'text-emerald-700' : 'text-red-700'}">${studentAns}</strong></span>
                        <span>Kunci: <strong class="text-black">${q.kunci_pg}</strong></span>
                    </div>
                `;
            } else {
                const studentEssay = answers[q.id] || '(Kosong)';
                const currentFeedback = aiFeedback[q.id] || {};
                card.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="font-black text-xs text-purple-900 bg-purple-100 px-2 py-0.5 rounded border border-purple-300 uppercase">No. ${idx + 1} (Soal Esai)</span>
                        <span class="text-xs font-bold text-slate-500">Bobot Maks: ${q.bobot || 20}</span>
                    </div>
                    <p class="font-bold text-xs text-black">${q.pertanyaan}</p>
                    ${q.rubrik_esai ? `<div class="bg-yellow-50 p-2 rounded border border-yellow-200 text-[11px] font-bold text-yellow-900"><strong>Rubrik Kunci Guru:</strong> ${q.rubrik_esai}</div>` : ''}
                    <div class="bg-white p-2.5 rounded-lg border border-slate-300">
                        <span class="text-[10px] font-black text-slate-400 block uppercase mb-1">Jawaban Siswa:</span>
                        <p class="text-xs font-medium text-slate-800 whitespace-pre-line">${studentEssay}</p>
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
        btn.innerText = "Menganalisis Esai...";

        const questions = activeQuizForResults.quiz_questions || [];
        const answers = activeReviewSubmission.jawaban_siswa || {};

        try {
            for (const q of questions) {
                if (q.tipe === 'esai') {
                    const studentAns = answers[q.id] || '';
                    const result = await aiGradeQuizEssay(q.pertanyaan, q.rubrik_esai || 'Kesesuaian dan kelengkapan materi.', studentAns, q.bobot || 20);
                    
                    const scoreInput = document.getElementById(`essay-score-${q.id}`);
                    const fbInput = document.getElementById(`essay-feedback-${q.id}`);
                    if (scoreInput && result.skor !== undefined) scoreInput.value = result.skor;
                    if (fbInput && result.feedback) fbInput.value = result.feedback;
                }
            }
            showCustomModal("Seluruh jawaban esai berhasil dikoreksi oleh AI! Anda dapat menyesuaikan skor sebelum disimpan.");
        } catch (e) {
            showCustomModal("Gagal koreksi esai AI: " + e.message);
        }
        btn.disabled = false;
        btn.innerText = "✨ Koreksi Semua Esai dengan AI";
    };

    window.saveExamReviewGrades = async () => {
        if (!activeReviewSubmission || !activeQuizForResults) return;

        const questions = activeQuizForResults.quiz_questions || [];
        let totalEssayScore = 0;
        let aiFeedbackObj = {};

        questions.forEach(q => {
            if (q.tipe === 'esai') {
                const scoreVal = parseInt(document.getElementById(`essay-score-${q.id}`)?.value || '0', 10);
                const fbVal = document.getElementById(`essay-feedback-${q.id}`)?.value || '';
                totalEssayScore += isNaN(scoreVal) ? 0 : scoreVal;
                aiFeedbackObj[q.id] = { skor: scoreVal, feedback: fbVal };
            }
        });

        const totalFinalScore = (activeReviewSubmission.skor_pg || 0) + totalEssayScore;

        try {
            const { error } = await supabase.from('quiz_submissions').update({
                skor_esai: totalEssayScore,
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
            
            if (filterKelasSelect) {
                filterKelasSelect.innerHTML = '<option value="">Semua Kelas</option>';
                stateKelas.forEach(k => {
                    const opt = document.createElement('option');
                    opt.value = k; opt.textContent = k;
                    filterKelasSelect.appendChild(opt);
                });
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
