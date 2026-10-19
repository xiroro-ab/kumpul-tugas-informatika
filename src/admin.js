import { supabase } from './supabase.js';
import { 
    getGeminiApiKey, 
    setGeminiApiKey, 
    aiGenerateMaterial, 
    aiGenerateQuestions, 
    aiEvaluateSubmission 
} from './gemini.js';

let currentSession = null;
let currentTeacher = null;
let stateKelas = [];
let stateMateri = [];
let pendingFiles = [];
let materialsList = [];
let quizzesList = [];
let activeGradeItem = null;

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
        const tabs = ['tugas', 'materi', 'kuis', 'setting'];
        tabs.forEach(t => {
            const btn = document.getElementById(`tab-btn-${t}`);
            const content = document.getElementById(`tab-content-${t}`);
            if (t === tabName) {
                btn.className = "lms-tab-btn py-3 px-3 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-black text-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
                if (content) content.classList.remove('hidden');
            } else {
                btn.className = "lms-tab-btn py-3 px-3 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-white text-black border-[3px] border-black hover:bg-slate-100";
                if (content) content.classList.add('hidden');
            }
        });

        if (tabName === 'materi') loadMaterials();
        if (tabName === 'kuis') loadQuizzes();
        if (tabName === 'tugas') loadFilesTable();
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
            const { data, error } = await supabase.auth.signInWithPassword({
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
                await supabase.from('teachers').upsert([{
                    id: data.user.id,
                    email: data.user.email,
                    nama_guru: nama,
                    mapel: mapel
                }]);
                showCustomModal("Pendaftaran berhasil! Selamat datang di LMS SMPN 58.");
            } else {
                showCustomModal("Akun berhasil didaftarkan! Jika fitur konfirmasi email aktif di Supabase, silakan periksa inbox email Anda, atau matikan 'Confirm email' di menu Auth Supabase agar bisa langsung login.");
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
            document.getElementById('dashboard-section').classList.remove('hidden');
            document.getElementById('user-email').innerText = session.user.email;

            await loadOrCreateTeacherProfile(session.user);
            loadOptionsSettings();
            loadFilesTable();
            checkGeminiKeyStatus();
        } else {
            document.getElementById('login-section').classList.remove('hidden');
            document.getElementById('dashboard-section').classList.add('hidden');
        }
    }

    // ==========================================
    // 1. Profil Guru & Mata Pelajaran (30 Guru)
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
            } else {
                // Buat profil default dari metadata Google
                const defaultName = user.user_metadata?.full_name || user.email.split('@')[0];
                const newTeacher = {
                    id: user.id,
                    email: user.email,
                    nama_guru: defaultName,
                    mapel: 'Informatika'
                };

                const { data: inserted, error: insErr } = await supabase
                    .from('teachers')
                    .upsert([newTeacher])
                    .select()
                    .single();

                if (!insErr && inserted) {
                    currentTeacher = inserted;
                    updateTeacherDisplay(inserted.nama_guru, inserted.mapel);
                } else {
                    currentTeacher = newTeacher;
                    updateTeacherDisplay(defaultName, 'Informatika');
                }
            }
        } catch (e) {
            console.error("Teacher profile error", e);
            updateTeacherDisplay('Bpk/Ibu Guru', 'Informatika');
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
            const { error } = await supabase.from('teachers').upsert([{
                id: currentSession.user.id,
                email: currentSession.user.email,
                nama_guru: nameInput,
                mapel: mapelInput
            }]);

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
    // 2. Koreksi Tugas Siswa (Tanpa Google Drive)
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

            // Status Nilai
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
                'Ketepatan materi, kelengkapan pengerjaan, dan orisinalitas.',
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

            // Update state lokal
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
        link.setAttribute("download", `Rekap_Nilai_LMS_SMPN58_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ==========================================
    // 3. Modul Materi Pembelajaran
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
    // 4. Modul Bank Soal & Ujian Online
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
                        <h4 class="font-black text-lg text-black">${q.judul_kuis}</h4>
                        <p class="text-xs text-slate-600 font-bold mt-1">
                            Total: ${questions.length} Soal (${pgCount} Pilihan Ganda &bull; ${esaiCount} Esai)
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="deleteQuiz('${q.id}')" class="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 rounded-lg text-xs font-black uppercase">
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
        document.getElementById('ai-quiz-judul').value = '';
        document.getElementById('ai-quiz-topik').value = '';
        document.getElementById('ai-quiz-modal').classList.remove('hidden');
    };

    window.closeAiQuizModal = () => {
        document.getElementById('ai-quiz-modal').classList.add('hidden');
    };

    window.runAiGenerateQuiz = async () => {
        const judul = document.getElementById('ai-quiz-judul').value.trim();
        const topik = document.getElementById('ai-quiz-topik').value.trim();
        const countPG = parseInt(document.getElementById('ai-quiz-count-pg').value, 10) || 5;
        const countEsai = parseInt(document.getElementById('ai-quiz-count-esai').value, 10) || 2;

        if (!judul || !topik) {
            showCustomModal("Judul dan topik ujian wajib diisi!");
            return;
        }

        const btn = document.getElementById('btn-run-ai-quiz');
        btn.disabled = true;
        btn.innerText = "Menyusun Bank Soal dengan AI...";

        try {
            const questions = await aiGenerateQuestions(
                currentTeacher?.mapel || 'Informatika',
                topik,
                'SMP Kelas 7-9',
                countPG,
                countEsai
            );

            if (!Array.isArray(questions) || questions.length === 0) {
                throw new Error("Format soal AI tidak terduga.");
            }

            // Simpan kuis ke Supabase
            const { data: quizData, error: quizError } = await supabase.from('quizzes').insert([{
                teacher_id: currentSession?.user?.id,
                mapel: currentTeacher?.mapel || 'Informatika',
                kelas: stateKelas[0] || 'Semua Kelas',
                judul_kuis: judul,
                petunjuk: `Ujian ${topik}. Kerjakan dengan teliti dan jujur!`,
                durasi_menit: 45,
                status: 'aktif'
            }]).select().single();

            if (quizError) throw quizError;

            // Masukkan butir soal
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
                bobot: q.bobot || 10
            }));

            const { error: qError } = await supabase.from('quiz_questions').insert(questionsPayload);
            if (qError) throw qError;

            closeAiQuizModal();
            loadQuizzes();
            showCustomModal(`Berhasil membuat kuis "${judul}" berisi ${questions.length} butir soal!`);
        } catch (e) {
            showCustomModal("Gagal generate soal kuis: " + e.message);
        }
        btn.disabled = false;
        btn.innerText = "🚀 GENERATE BANK SOAL";
    };

    window.openQuizModal = () => {
        openAiQuizModal(); // Arahkan guru ke generator soal AI untuk kemudahan instan
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

    // ==========================================
    // 5. Pengaturan Kunci AI Gemini & Form
    // ==========================================
    function checkGeminiKeyStatus() {
        const key = getGeminiApiKey();
        const input = document.getElementById('gemini-api-key-input');
        const statusEl = document.getElementById('gemini-status-text');
        if (input && key) {
            input.value = key;
            if (statusEl) statusEl.textContent = "✅ Kunci AI Gemini aktif dan siap digunakan untuk auto-koreksi!";
        } else if (statusEl) {
            statusEl.textContent = "⚠️ Kunci AI belum terpasang. Dapatkan gratis di aistudio.google.com.";
        }
    }

    window.saveGeminiKey = () => {
        const key = document.getElementById('gemini-api-key-input').value.trim();
        setGeminiApiKey(key);
        checkGeminiKeyStatus();
        showCustomModal("Kunci API Gemini berhasil disimpan!");
    };

    async function loadOptionsSettings() {
        const { data, error } = await supabase.from('options').select('*');
        if (!error && data) {
            stateKelas = data.filter(d => d.type === 'kelas').map(d => d.name);
            stateMateri = data.filter(d => d.type === 'materi').map(d => d.name);
            renderOptions();
            
            if (filterKelasSelect) {
                filterKelasSelect.innerHTML = '<option value="">Semua Kelas</option>';
                stateKelas.forEach(k => {
                    const opt = document.createElement('option');
                    opt.value = k; opt.textContent = k;
                    filterKelasSelect.appendChild(opt);
                });
            }
            if (filterMateriSelect) {
                filterMateriSelect.innerHTML = '<option value="">Semua Materi / Tugas</option>';
                stateMateri.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m; opt.textContent = m;
                    filterMateriSelect.appendChild(opt);
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

    window.addMateri = () => {
        const input = document.getElementById('input-materi');
        const val = input.value.trim();
        if (val && !stateMateri.includes(val)) {
            stateMateri.push(val);
            input.value = '';
            renderOptions();
        }
    };

    window.removeOption = (type, val) => {
        if (type === 'kelas') {
            stateKelas = stateKelas.filter(k => k !== val);
        } else {
            stateMateri = stateMateri.filter(m => m !== val);
        }
        renderOptions();
    };

    function renderOptions() {
        const kelasList = document.getElementById('kelas-list');
        const materiList = document.getElementById('materi-list');
        if (!kelasList || !materiList) return;
        
        kelasList.innerHTML = '';
        materiList.innerHTML = '';
        
        stateKelas.forEach(k => {
            const div = document.createElement('div');
            div.className = "flex justify-between items-center bg-white px-3 py-1.5 rounded-lg border border-black font-bold text-slate-800 text-xs";
            div.innerHTML = `<span>${k}</span><button onclick="removeOption('kelas', '${k}')" class="text-red-500 hover:text-red-700 font-black">&times;</button>`;
            kelasList.appendChild(div);
        });
        
        stateMateri.forEach(m => {
            const div = document.createElement('div');
            div.className = "flex justify-between items-center bg-white px-3 py-1.5 rounded-lg border border-black font-bold text-slate-800 text-xs";
            div.innerHTML = `<span>${m}</span><button onclick="removeOption('materi', '${m}')" class="text-red-500 hover:text-red-700 font-black">&times;</button>`;
            materiList.appendChild(div);
        });
    }

    window.saveOptionsSettings = async () => {
        const btn = document.getElementById('save-options-btn');
        const status = document.getElementById('options-status');
        btn.disabled = true;
        btn.innerText = "MENYIMPAN...";
        status.innerText = "";
        
        try {
            await supabase.from('options').delete().neq('id', 0);
            
            const insertData = [];
            stateKelas.forEach(k => insertData.push({ type: 'kelas', name: k }));
            stateMateri.forEach(m => insertData.push({ type: 'materi', name: m }));
            
            if (insertData.length > 0) {
                const { error } = await supabase.from('options').insert(insertData);
                if (error) throw error;
            }
            
            status.innerHTML = `<span class="text-emerald-700 font-bold uppercase">Berhasil disimpan!</span>`;
            loadOptionsSettings();
        } catch (e) {
            console.error(e);
            status.innerHTML = `<span class="text-red-600 font-bold uppercase">Gagal: ${e.message}</span>`;
        }
        btn.disabled = false;
        btn.innerText = "SIMPAN PILIHAN KELAS & TUGAS";
    };

});
