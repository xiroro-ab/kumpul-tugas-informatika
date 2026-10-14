import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Mode Switcher Elements
    const tabModeFile = document.getElementById('tabModeFile');
    const tabModeLink = document.getElementById('tabModeLink');
    const sectionFile = document.getElementById('sectionFile');
    const sectionLink = document.getElementById('sectionLink');
    let currentMode = 'file'; // 'file' or 'link'

    // Form Elements
    const form = document.getElementById('uploadForm');
    const namaInput = document.getElementById('nama');
    const kelasSelect = document.getElementById('kelas');
    const materiSelect = document.getElementById('materi');
    const rememberBadge = document.getElementById('rememberBadge');
    const submitBtn = document.getElementById('submitBtn');

    // File UI Elements
    const dropzone = document.getElementById('dropzone');
    const fileInfo = document.getElementById('file-info');
    const fileSelected = document.getElementById('file-selected');
    const filenameDisplay = document.getElementById('filename-display');
    const clearFileBtn = document.getElementById('clearFileBtn');
    const fileInput = document.getElementById('file');

    // Link UI Elements
    const linkUrlInput = document.getElementById('linkUrl');
    const linkNoteInput = document.getElementById('linkNote');
    const platformBadge = document.getElementById('platformBadge');
    const linkAlertText = document.getElementById('linkAlertText');

    // Status Card Elements
    const statusIcon = document.getElementById('statusIcon');
    const statusTitle = document.getElementById('statusTitle');
    const statusInfo = document.getElementById('statusInfo');
    const statusCard = document.getElementById('statusCard');

    let lastUploadName = localStorage.getItem('lastUpload');

    // ==========================================
    // 1. Auto-Remember Data Diri (Local Storage)
    // ==========================================
    const savedNama = localStorage.getItem('student_nama');
    const savedKelas = localStorage.getItem('student_kelas');

    if (savedNama) {
        namaInput.value = savedNama;
        if (rememberBadge) rememberBadge.classList.remove('hidden');
    }

    namaInput.addEventListener('input', () => {
        if (namaInput.value.trim() !== '') {
            if (rememberBadge) rememberBadge.classList.remove('hidden');
        } else {
            if (rememberBadge) rememberBadge.classList.add('hidden');
        }
    });

    // ==========================================
    // 2. Status Card Handler
    // ==========================================
    function setStatus(state, text) {
        if (state === 'waiting') {
            statusCard.className = "md:col-span-5 md:row-span-2 bg-slate-200 border-[3px] border-black rounded-[40px] p-6 lg:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center relative transition-colors duration-300";
            statusTitle.textContent = "Status";
            statusIcon.innerHTML = `<svg class="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
            statusInfo.textContent = text;
        } else if (state === 'ready') {
            statusCard.className = "md:col-span-5 md:row-span-2 bg-amber-400 border-[3px] border-black rounded-[40px] p-6 lg:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center relative transition-colors duration-300";
            statusTitle.textContent = "Siap Kirim";
            statusIcon.innerHTML = `<svg class="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-amber-900 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>`;
            statusInfo.textContent = text;
        } else if (state === 'last') {
            statusCard.className = "md:col-span-5 md:row-span-2 bg-emerald-400 border-[3px] border-black rounded-[40px] p-6 lg:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center relative transition-colors duration-300";
            statusTitle.textContent = "Terakhir Dikirim";
            statusIcon.innerHTML = `<svg class="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-emerald-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>`;
            statusInfo.innerHTML = `<strong>${text}</strong>`;
        }
    }

    if (lastUploadName) {
        setStatus('last', lastUploadName);
    } else {
        setStatus('waiting', 'Menunggu Input...');
    }

    // ==========================================
    // 3. Switcher Mode Pengumpulan (File vs Link)
    // ==========================================
    function switchMode(mode) {
        currentMode = mode;
        if (mode === 'file') {
            tabModeFile.className = "py-3 px-3 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
            tabModeLink.className = "py-3 px-3 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-slate-500 hover:text-black";
            sectionFile.classList.remove('hidden');
            sectionLink.classList.add('hidden');
            fileInput.required = true;
            linkUrlInput.required = false;

            if (fileInput.files.length > 0) {
                setStatus('ready', `${fileInput.files.length} file dipilih`);
            } else {
                setStatus('waiting', 'Pilih file tugas...');
            }
        } else {
            tabModeLink.className = "py-3 px-3 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
            tabModeFile.className = "py-3 px-3 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-slate-500 hover:text-black";
            sectionLink.classList.remove('hidden');
            sectionFile.classList.add('hidden');
            fileInput.required = false;
            linkUrlInput.required = true;

            if (linkUrlInput.value.trim().length > 5) {
                setStatus('ready', 'Tautan siap dikirim');
            } else {
                setStatus('waiting', 'Masukkan URL tugas...');
            }
        }
    }

    tabModeFile.addEventListener('click', () => switchMode('file'));
    tabModeLink.addEventListener('click', () => switchMode('link'));

    // ==========================================
    // 4. Deteksi Pintar Platform Tautan / Link
    // ==========================================
    function detectPlatform(url) {
        const u = url.toLowerCase();
        if (u.includes('canva.com')) {
            return {
                name: 'Canva',
                color: 'bg-cyan-100 text-cyan-800 border-cyan-400',
                tip: '🎨 <strong>Canva:</strong> Pastikan Anda klik <u>Bagikan &gt; Siapa saja yang memiliki tautan dapat melihat</u>.'
            };
        } else if (u.includes('docs.google.com') || u.includes('drive.google.com')) {
            return {
                name: 'Google Docs / Drive',
                color: 'bg-blue-100 text-blue-800 border-blue-400',
                tip: '📂 <strong>Google:</strong> Ubah akses dari <u>Dibatasi</u> menjadi <u>Siapa saja yang memiliki tautan dapat melihat</u>.'
            };
        } else if (u.includes('scratch.mit.edu')) {
            return {
                name: 'Scratch',
                color: 'bg-amber-100 text-amber-800 border-amber-400',
                tip: '🐱 <strong>Scratch:</strong> Pastikan tombol oranye <u>Bagikan / Share</u> di proyek Scratch sudah ditekan.'
            };
        } else if (u.includes('figma.com')) {
            return {
                name: 'Figma',
                color: 'bg-pink-100 text-pink-800 border-pink-400',
                tip: '🎨 <strong>Figma:</strong> Pastikan link share diatur ke <u>Anyone with the link can view</u>.'
            };
        } else if (u.includes('youtube.com') || u.includes('youtu.be')) {
            return {
                name: 'YouTube',
                color: 'bg-red-100 text-red-800 border-red-400',
                tip: '▶️ <strong>YouTube:</strong> Pastikan video disetel ke <u>Publik</u> atau <u>Tidak Publik (Unlisted)</u>.'
            };
        } else if (u.includes('instagram.com') || u.includes('ig.me')) {
            return {
                name: 'Instagram Video',
                color: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-400',
                tip: '📸 <strong>Instagram:</strong> Pastikan akun Instagram kamu <u>TIDAK DI-PRIVATE (harus akun Publik)</u> agar video Reels/Postingan bisa ditonton dan dinilai oleh guru!'
            };
        } else if (u.includes('tiktok.com')) {
            return {
                name: 'TikTok Video',
                color: 'bg-slate-900 text-white border-black',
                tip: '🎵 <strong>TikTok:</strong> Pastikan video disetel ke <u>Publik</u> dan akun tidak dikunci/private agar guru bisa menonton.'
            };
        } else if (u.includes('capcut.com')) {
            return {
                name: 'CapCut',
                color: 'bg-cyan-100 text-cyan-900 border-cyan-400',
                tip: '🎬 <strong>CapCut:</strong> Pastikan link proyek / video CapCut dibagikan secara publik.'
            };
        } else if (u.includes('github.com')) {
            return {
                name: 'GitHub',
                color: 'bg-slate-200 text-slate-800 border-slate-400',
                tip: '🐙 <strong>GitHub:</strong> Pastikan repository tugas sudah disetel <u>Public</u>.'
            };
        }
        return {
            name: 'Tautan Web',
            color: 'bg-indigo-100 text-indigo-800 border-indigo-400',
            tip: '💡 Pastikan tautan web ini bisa dibuka oleh guru tanpa perlu login khusus.'
        };
    }

    linkUrlInput.addEventListener('input', () => {
        const val = linkUrlInput.value.trim();
        if (val.length > 5) {
            const detected = detectPlatform(val);
            platformBadge.textContent = detected.name;
            platformBadge.className = `inline-flex text-[11px] font-black px-2.5 py-0.5 rounded-full border ${detected.color}`;
            platformBadge.classList.remove('hidden');
            linkAlertText.innerHTML = detected.tip;
            setStatus('ready', `Tautan ${detected.name} siap`);
        } else {
            platformBadge.classList.add('hidden');
            linkAlertText.innerHTML = 'Pastikan link tugas Anda sudah diatur ke <strong>"Siapa saja yang memiliki tautan dapat melihat"</strong> agar guru bisa membuka dan menilai tugas Anda.';
            setStatus('waiting', 'Masukkan URL tugas...');
        }
    });

    // ==========================================
    // 5. Drag & Drop File Handling
    // ==========================================
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => {
            dropzone.classList.add('border-indigo-400', 'bg-indigo-50');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => {
            dropzone.classList.remove('border-indigo-400', 'bg-indigo-50');
        }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            fileInput.files = files;
            handleFileSelect();
        }
    });

    fileInput.addEventListener('change', handleFileSelect);

    function handleFileSelect() {
        if (fileInput.files.length > 0) {
            let names = [];
            for (let i = 0; i < fileInput.files.length; i++) {
                const file = fileInput.files[i];
                if (file.size > 10 * 1024 * 1024) {
                    alert('Ukuran salah satu file melebihi batas maksimal 10MB.');
                    resetFileInput();
                    return;
                }
                names.push(file.name);
            }
            let displayNames = names.join(', ');
            setStatus('ready', `${fileInput.files.length} file dipilih`);
            fileInfo.classList.add('hidden');
            fileInfo.classList.remove('flex');
            fileSelected.classList.remove('hidden');
            fileSelected.classList.add('flex');
            filenameDisplay.textContent = `${fileInput.files.length} File Dipilih: ${displayNames}`;
        } else {
            resetFileInput();
        }
    }

    function resetFileInput() {
        fileInput.value = '';
        fileInfo.classList.remove('hidden');
        fileInfo.classList.add('flex');
        fileSelected.classList.add('hidden');
        fileSelected.classList.remove('flex');
        if (lastUploadName) {
            setStatus('last', lastUploadName);
        } else {
            setStatus('waiting', 'Menunggu Input...');
        }
    }

    clearFileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        resetFileInput();
    });

    // ==========================================
    // 6. Memuat Opsi Kelas & Materi dari Supabase
    // ==========================================
    async function loadOptions() {
        try {
            const { data, error } = await supabase.from('options').select('*');
            if (error) throw error;
            
            kelasSelect.innerHTML = '<option value="" disabled selected>Pilih Kelas</option>';
            materiSelect.innerHTML = '<option value="" disabled selected>Pilih Materi / Tugas</option>';
            
            data.forEach(opt => {
                const el = document.createElement('option');
                el.value = opt.name;
                el.innerText = opt.name;
                if (opt.type === 'kelas') {
                    kelasSelect.appendChild(el);
                } else if (opt.type === 'materi') {
                    materiSelect.appendChild(el);
                }
            });

            // Set auto-remembered kelas jika ada
            if (savedKelas) {
                kelasSelect.value = savedKelas;
            }
        } catch (e) {
            console.error('Failed to load options from Supabase', e);
        }
    }
    
    loadOptions();

    // ==========================================
    // 7. Pengiriman Form & Bukti Resi Pengumpulan
    // ==========================================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nama = namaInput.value.trim();
        const kelas = kelasSelect.value;
        const materi = materiSelect.value;

        if (!nama || !kelas || !materi) {
            alert('Silakan lengkapi Nama, Kelas, dan Tugas!');
            return;
        }

        // Simpan nama & kelas ke LocalStorage agar siswa tidak perlu ngetik ulang
        localStorage.setItem('student_nama', nama);
        localStorage.setItem('student_kelas', kelas);

        if (currentMode === 'file') {
            if (!fileInput.files || fileInput.files.length === 0) {
                alert('Silakan pilih setidaknya 1 file tugas.');
                return;
            }
        } else {
            const linkUrl = linkUrlInput.value.trim();
            if (!linkUrl) {
                alert('Silakan masukkan tautan / link tugas.');
                return;
            }
            if (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
                alert('Format tautan tidak valid! Tautan harus diawali dengan http:// atau https://');
                return;
            }
        }

        submitBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Mengirim...
        `;
        submitBtn.style.pointerEvents = 'none';
        submitBtn.classList.add('opacity-80');
        
        const loadingPopup = document.getElementById('loadingPopup');
        if (loadingPopup) {
            loadingPopup.classList.remove('hidden');
            loadingPopup.classList.add('flex');
        }

        try {
            let submittedDetail = '';

            if (currentMode === 'file') {
                // Upload File Mode
                let fileNames = [];
                for (let i = 0; i < fileInput.files.length; i++) {
                    const file = fileInput.files[i];
                    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                    const filePath = `${Date.now()}_${safeFilename}`;
                    
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('uploads')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    // Simpan metadata ke Supabase DB
                    let basePayload = {
                        nama,
                        kelas,
                        materi,
                        filename: file.name,
                        storage_path: uploadData.path
                    };

                    // Coba insert dengan tipe 'file' jika skema mendukung
                    let { error: dbError } = await supabase.from('files').insert([{
                        ...basePayload,
                        tipe: 'file'
                    }]);

                    if (dbError && (dbError.message.includes('tipe') || dbError.code === 'PGRST204')) {
                        const fallback = await supabase.from('files').insert([basePayload]);
                        dbError = fallback.error;
                    }

                    if (dbError) throw dbError;
                    fileNames.push(file.name);
                }

                submittedDetail = fileNames.join(', ');
                const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                localStorage.setItem('lastUpload', `${fileInput.files.length} file (${timestamp})`);

            } else {
                // Upload Link Mode
                const linkUrl = linkUrlInput.value.trim();
                const linkNote = linkNoteInput.value.trim();
                const platform = detectPlatform(linkUrl);
                const displayFilename = linkNote ? `[${platform.name}] ${linkNote}` : `[${platform.name}] Tautan Tugas`;

                let basePayload = {
                    nama,
                    kelas,
                    materi,
                    filename: displayFilename,
                    storage_path: `LINK:${linkUrl}`
                };

                let { error: dbError } = await supabase.from('files').insert([{
                    ...basePayload,
                    tipe: 'link',
                    link_url: linkUrl
                }]);

                if (dbError && (dbError.message.includes('tipe') || dbError.message.includes('link_url') || dbError.code === 'PGRST204')) {
                    const fallback = await supabase.from('files').insert([basePayload]);
                    dbError = fallback.error;
                }

                if (dbError) throw dbError;

                submittedDetail = linkUrl;
                const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                localStorage.setItem('lastUpload', `Tautan ${platform.name} (${timestamp})`);
            }

            // Tampilkan Bukti Resi Pengumpulan Digital
            const receiptId = 'TGS-' + Math.floor(100000 + Math.random() * 900000);
            const now = new Date();
            const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

            document.body.innerHTML = `
                <div class="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
                    <div class="bg-white border-[3px] border-black rounded-[40px] p-6 md:p-10 max-w-lg w-full text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                        
                        <div class="w-16 h-16 bg-emerald-400 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                            <svg class="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>

                        <h2 class="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-1">TUGAS BERHASIL TERKIRIM!</h2>
                        <p class="text-slate-500 font-bold text-xs uppercase tracking-widest mb-6">Tanda Bukti Pengumpulan Tugas Siswa</p>

                        <!-- Kotak Resi Bukti Pengumpulan -->
                        <div class="bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl p-5 text-left space-y-2.5 mb-6 shadow-inner font-mono text-xs">
                            <div class="flex justify-between border-b border-slate-200 pb-2">
                                <span class="text-slate-500 font-medium">NO. RESI</span>
                                <span class="font-black text-black">${receiptId}</span>
                            </div>
                            <div class="flex justify-between border-b border-slate-200 pb-2">
                                <span class="text-slate-500 font-medium">WAKTU</span>
                                <span class="font-bold text-black">${dateStr}, ${timeStr}</span>
                            </div>
                            <div class="flex justify-between border-b border-slate-200 pb-2">
                                <span class="text-slate-500 font-medium">NAMA LENGKAP</span>
                                <span class="font-black text-black uppercase">${nama}</span>
                            </div>
                            <div class="flex justify-between border-b border-slate-200 pb-2">
                                <span class="text-slate-500 font-medium">KELAS</span>
                                <span class="font-black text-black">${kelas}</span>
                            </div>
                            <div class="flex justify-between border-b border-slate-200 pb-2">
                                <span class="text-slate-500 font-medium">TUGAS / MATERI</span>
                                <span class="font-black text-black">${materi}</span>
                            </div>
                            <div class="flex justify-between border-b border-slate-200 pb-2">
                                <span class="text-slate-500 font-medium">METODE</span>
                                <span class="font-black ${currentMode === 'link' ? 'text-purple-700' : 'text-blue-700'} uppercase">
                                    ${currentMode === 'link' ? '🔗 Tautan / Link' : '📁 File Unggahan'}
                                </span>
                            </div>
                            <div class="pt-1">
                                <span class="text-slate-500 font-medium block mb-1">DETAIL TUGAS:</span>
                                <div class="font-bold text-slate-800 break-all bg-white p-2.5 rounded-xl border border-slate-200">
                                    ${submittedDetail}
                                </div>
                            </div>
                        </div>

                        <div class="bg-yellow-100 border border-yellow-300 rounded-2xl p-3 text-xs text-yellow-900 font-bold mb-6 text-center">
                            📸 <span>Screenshot (tangkap layar) halaman ini sebagai bukti Anda sudah mengumpulkan tugas ke guru.</span>
                        </div>

                        <div class="flex flex-col gap-3">
                            <button onclick="window.print()" class="w-full h-14 bg-emerald-400 hover:bg-emerald-500 text-black border-2 border-black rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1">
                                Cetak / Simpan Resi
                            </button>
                            <a href="/" class="w-full h-14 leading-[3.5rem] bg-indigo-600 hover:bg-black text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-[4px_4px_0px_0px_rgba(49,46,129,1)] active:shadow-none active:translate-y-1">
                                Kirim Tugas Lain
                            </a>
                        </div>
                    </div>
                </div>
            `;
        } catch (e) {
            console.error(e);
            if (loadingPopup) {
                loadingPopup.classList.add('hidden');
                loadingPopup.classList.remove('flex');
            }
            alert('Gagal mengirim tugas: ' + e.message);
            submitBtn.innerHTML = 'Kirim Tugas';
            submitBtn.style.pointerEvents = 'auto';
            submitBtn.classList.remove('opacity-80');
        }
    });
});
