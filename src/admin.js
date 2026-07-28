import { supabase } from './supabase.js';

let currentAccessToken = null;
let stateKelas = [];
let stateMateri = [];
let pendingFiles = [];

document.addEventListener('DOMContentLoaded', () => {

window.showCustomModal = (message, type = 'alert') => {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        const msgEl = document.getElementById('custom-modal-message');
        const actionsEl = document.getElementById('custom-modal-actions');
        
        msgEl.innerText = message;
        actionsEl.innerHTML = '';
        
        if (type === 'alert') {
            const okBtn = document.createElement('button');
            okBtn.className = "bg-black text-white font-black py-3 px-6 rounded-xl hover:bg-slate-800 transition active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] active:shadow-none uppercase tracking-widest";
            okBtn.innerText = "OK";
            okBtn.onclick = () => {
                modal.classList.add('hidden');
                resolve(true);
            };
            actionsEl.appendChild(okBtn);
        } else if (type === 'confirm') {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = "bg-white border-[3px] border-black text-black font-black py-3 px-6 rounded-xl hover:bg-slate-100 transition active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none uppercase tracking-widest";
            cancelBtn.innerText = "Batal";
            cancelBtn.onclick = () => {
                modal.classList.add('hidden');
                resolve(false);
            };
            
            const confirmBtn = document.createElement('button');
            confirmBtn.className = "bg-red-500 text-white border-[3px] border-black font-black py-3 px-6 rounded-xl hover:bg-red-600 transition active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none uppercase tracking-widest";
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

    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
        handleSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
        handleSession(session);
    });

    // Options UI logic
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
        
        kelasList.innerHTML = '';
        materiList.innerHTML = '';
        
        stateKelas.forEach(k => {
            const div = document.createElement('div');
            div.className = "flex justify-between items-center bg-slate-100 px-4 py-2 rounded-xl font-bold text-slate-800 text-sm";
            div.innerHTML = `<span>${k}</span><button onclick="removeOption('kelas', '${k}')" class="text-red-500 hover:text-red-700 font-black">&times;</button>`;
            kelasList.appendChild(div);
        });
        
        stateMateri.forEach(m => {
            const div = document.createElement('div');
            div.className = "flex justify-between items-center bg-slate-100 px-4 py-2 rounded-xl font-bold text-slate-800 text-sm";
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
            // Delete all options first
            await supabase.from('options').delete().neq('id', 0); // Delete all
            
            const insertData = [];
            stateKelas.forEach(k => insertData.push({ type: 'kelas', name: k }));
            stateMateri.forEach(m => insertData.push({ type: 'materi', name: m }));
            
            if (insertData.length > 0) {
                const { error } = await supabase.from('options').insert(insertData);
                if (error) throw error;
            }
            
            status.innerHTML = `<span class="text-emerald-700 font-bold uppercase">Berhasil disimpan!</span>`;
        } catch (e) {
            console.error(e);
            status.innerHTML = `<span class="text-red-600 font-bold uppercase">Gagal: ${e.message}</span>`;
        }
        btn.disabled = false;
        btn.innerText = "SIMPAN PENGATURAN";
    };

    window.loginWithGoogle = async () => {
        try {
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    scopes: 'https://www.googleapis.com/auth/drive.file',
                    redirectTo: window.location.origin + '/admin.html',
                    queryParams: {
                        prompt: 'consent',
                        access_type: 'offline'
                    }
                }
            });
        } catch (error) {
            console.error("Login failed", error);
            showCustomModal("Login gagal: " + error.message);
        }
    };

    window.logout = async () => {
        await supabase.auth.signOut();
    };

    async function handleSession(session) {
        if (session) {
            document.getElementById('login-section').classList.add('hidden');
            document.getElementById('dashboard-section').classList.remove('hidden');
            document.getElementById('user-email').innerText = session.user.email;
            
            // Supabase puts provider_token in session if we used OAuth
            if (session.provider_token) {
                currentAccessToken = session.provider_token;
            }
            
            loadOptionsSettings();
            loadFilesTable();
        } else {
            document.getElementById('login-section').classList.remove('hidden');
            document.getElementById('dashboard-section').classList.add('hidden');
        }
    }

    async function loadOptionsSettings() {
        const { data, error } = await supabase.from('options').select('*');
        if (!error && data) {
            stateKelas = data.filter(d => d.type === 'kelas').map(d => d.name);
            stateMateri = data.filter(d => d.type === 'materi').map(d => d.name);
            renderOptions();
            
            let filterKelasSelect = document.getElementById('filter-kelas-tugas');
            let filterMateriSelect = document.getElementById('filter-materi-tugas');
            if (filterKelasSelect) {
                filterKelasSelect.innerHTML = '<option value="">Semua Kelas</option>';
                stateKelas.forEach(k => {
                    const opt = document.createElement('option');
                    opt.value = k; opt.textContent = k;
                    filterKelasSelect.appendChild(opt);
                });
            }
            if (filterMateriSelect) {
                filterMateriSelect.innerHTML = '<option value="">Semua Materi</option>';
                stateMateri.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m; opt.textContent = m;
                    filterMateriSelect.appendChild(opt);
                });
            }
        }
    }

    
    
    let searchInput = document.getElementById('search-tugas');
    let filterKelasSelect = document.getElementById('filter-kelas-tugas');
    let filterMateriSelect = document.getElementById('filter-materi-tugas');

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
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-6 text-center text-slate-500 font-bold uppercase tracking-widest border-b-2 border-black">Tidak ada file.</td></tr>';
            return;
        }
        filesToRender.forEach(f => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-100 transition-colors";
            
            // Get public URL for preview
            const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(f.storage_path);
            
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap font-bold text-black border-b-2 border-black border-r-2">${f.kelas}</td>
                <td class="px-6 py-4 whitespace-nowrap font-bold text-black border-b-2 border-black border-r-2">${f.materi}</td>
                <td class="px-6 py-4 whitespace-nowrap font-bold text-black border-b-2 border-black border-r-2">${f.nama}</td>
                <td class="px-6 py-4 whitespace-nowrap font-medium text-black border-b-2 border-black border-r-2">${f.filename}</td>
                <td class="px-6 py-4 whitespace-nowrap font-black text-sm border-b-2 border-black">
                    <div class="flex gap-2">
                        <a href="${publicUrlData.publicUrl}" target="_blank" class="inline-block bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1 rounded-lg uppercase tracking-wider transition-colors border-2 border-transparent hover:border-indigo-400">Preview</a>
                        <button onclick="deleteFile('${f.id}', '${f.storage_path}')" class="inline-block bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-lg uppercase tracking-wider transition-colors border-2 border-transparent hover:border-red-400">Hapus</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.deleteFile = async (id, path) => {
        const confirmed = await showCustomModal('Apakah Anda yakin ingin menghapus tugas ini secara permanen?', 'confirm');
        if (!confirmed) return;
        
        try {
            const { error: storageError } = await supabase.storage.from('uploads').remove([path]);
            if (storageError) throw storageError;

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
            await showCustomModal('Tidak ada data untuk diekspor.');
            return;
        }
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Kelas,Materi,Nama Siswa,Nama File,Waktu Dibuat\n";
        
        pendingFiles.forEach(f => {
            const dateStr = f.created_at ? new Date(f.created_at).toLocaleString('id-ID') : '';
            const row = [
                `"${f.kelas}"`,
                `"${f.materi}"`,
                `"${f.nama}"`,
                `"${f.filename}"`,
                `"${dateStr}"`
            ].join(",");
            csvContent += row + "\n";
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Rekap_Tugas_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    async function loadFilesTable() {

        const tbody = document.getElementById('files-tbody');
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-6 text-center text-slate-500 font-bold uppercase tracking-widest border-b-2 border-black animate-pulse">Memuat data...</td></tr>';
        
        try {
            const { data, error } = await supabase.from('files').select('*');
            if (error) throw error;
            
            pendingFiles = data || [];
            if (searchInput) searchInput.value = ''; // Reset search on load
            renderFilesTable(pendingFiles);
        } catch (e) {
            console.error(e);
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-6 text-center text-red-500 font-bold uppercase tracking-widest border-b-2 border-black">Gagal memuat file.</td></tr>`;
        }
    }

    // Google Drive functions// Google Drive functions
    
    async function getOrCreateFolder(folderName, parentId = null) {
        // Search if folder exists
        let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        if (parentId) {
            query += ` and '${parentId}' in parents`;
        } else {
            query += ` and 'root' in parents`;
        }
        
        const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name)`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentAccessToken}`
            }
        });
        
        if (searchRes.ok) {
            const data = await searchRes.json();
            if (data.files && data.files.length > 0) {
                return data.files[0].id; // Return existing folder ID
            }
        }
        
        // If not exists, create it
        const metadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentId ? [parentId] : []
        };
        const res = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metadata)
        });
        if (!res.ok) {
             const errData = await res.json();
             console.error("Drive Error:", errData);
             const errorMsg = errData.error && errData.error.message ? errData.error.message : "Token tidak valid, silakan login ulang.";
             throw new Error("Drive API Error: " + errorMsg);
        }
        const data = await res.json();
        return data.id;
    }


    async function uploadFileToDrive(fileBlob, filename, mimeType, parentId) {
        const metadata = {
            name: filename,
            parents: [parentId]
        };
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', fileBlob);

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentAccessToken}`
            },
            body: form
        });
        if (!res.ok) throw new Error("Gagal mengunggah file ke Drive");
        return await res.json();
    }

    
    const delay = ms => new Promise(res => setTimeout(res, ms));

    window.syncToDrive = async () => {
        if (!currentAccessToken) {
            await showCustomModal("Token Google Drive tidak tersedia. Silakan klik logout dan login ulang.");
            return;
        }

        const btn = document.getElementById('sync-btn');
        const status = document.getElementById('sync-status');
        btn.disabled = true;
        btn.innerText = "Menyinkronkan...";
        status.innerHTML = "Memulai sinkronisasi...";

        try {
            if (pendingFiles.length === 0) {
                status.innerHTML = "<span class='text-emerald-700 font-bold'>Tidak ada file baru.</span>";
                btn.disabled = false;
                btn.innerText = "SINKRONISASI KE GOOGLE DRIVE";
                return;
            }

            // Batasi jumlah sinkronisasi per tahap agar browser/jaringan tidak crash
            const BATCH_SIZE = 10;
            const filesToSync = pendingFiles.slice(0, BATCH_SIZE);
            const remainingFiles = pendingFiles.length - filesToSync.length;

            btn.innerText = "MENYINKRONKAN...";
            status.innerHTML = `Memulai sinkronisasi ${filesToSync.length} tugas...`;

            status.innerHTML = "Memeriksa folder 'Tugas Siswa' di Google Drive...";
            const rootFolderId = await getOrCreateFolder("Tugas Siswa");
            await delay(1000);
            
            let successCount = 0;
            let folderCache = {};

            for (let i = 0; i < filesToSync.length; i++) {
                const f = filesToSync[i];
                status.innerHTML = `Mengunggah ${i + 1}/${filesToSync.length}: ${f.filename}...`;
                
                if (!folderCache[f.kelas]) {
                    folderCache[f.kelas] = await getOrCreateFolder(f.kelas, rootFolderId);
                    await delay(500); // Jeda hindari rate limit API
                }
                const kelasFolderId = folderCache[f.kelas];

                const materiKey = f.kelas + "_" + f.materi;
                if (!folderCache[materiKey]) {
                    folderCache[materiKey] = await getOrCreateFolder(f.materi, kelasFolderId);
                    await delay(500);
                }
                const materiFolderId = folderCache[materiKey];

                const namaKey = f.kelas + "_" + f.materi + "_" + f.nama;
                if (!folderCache[namaKey]) {
                    folderCache[namaKey] = await getOrCreateFolder(f.nama, materiFolderId);
                    await delay(500);
                }
                const namaFolderId = folderCache[namaKey];

                // Download from Supabase Storage
                const { data: fileBlob, error: downloadError } = await supabase.storage.from('uploads').download(f.storage_path);
                if (downloadError) throw downloadError;
                
                await uploadFileToDrive(fileBlob, f.filename, fileBlob.type, namaFolderId);
                
                // Delete from Supabase Storage
                await supabase.storage.from('uploads').remove([f.storage_path]);
                
                // Delete from DB
                await supabase.from('files').delete().eq('id', f.id);
                
                successCount++;
                await delay(1000); // Jeda sebelum file berikutnya
            }

            let finishMsg = `<span class="text-emerald-700 font-bold">Berhasil menyinkronkan ${successCount} tugas!</span>`;
            if (remainingFiles > 0) {
                finishMsg += `<br><span class="text-amber-600 font-bold">Masih ada ${remainingFiles} tugas tersisa. Silakan klik sinkronisasi lagi.</span>`;
            }
            status.innerHTML = finishMsg;
            
            await loadFilesTable(); // Reload data

            btn.disabled = false;
            btn.innerText = remainingFiles > 0 ? "SINKRONKAN SELANJUTNYA" : "SINKRONISASI KE GOOGLE DRIVE";
         } catch (err) {
            console.error(err);
            status.innerHTML = `<span class="text-red-600 font-bold uppercase">Gagal: ${err.message}</span>`;
            btn.disabled = false;
            btn.innerText = "COBA LAGI";
        }
    };

});

