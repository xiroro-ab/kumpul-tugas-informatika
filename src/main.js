import { supabase } from './supabase.js';

let allMaterials = [];
let activeQuizData = null;
let quizTimerInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Portal View Switcher
    window.switchStudentPortal = (viewName) => {
        const views = ['kumpul', 'materi', 'ujian', 'nilai'];
        views.forEach(v => {
            const btn = document.getElementById(`nav-btn-${v}`);
            const content = document.getElementById(`view-${v}`);
            if (v === viewName) {
                btn.className = "portal-tab-btn py-3 px-3 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-black text-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
                if (content) content.classList.remove('hidden');
            } else {
                btn.className = "portal-tab-btn py-3 px-3 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-white text-black border-[3px] border-black hover:bg-slate-100";
                if (content) content.classList.add('hidden');
            }
        });

        if (viewName === 'materi') loadStudentMaterials();
        if (viewName === 'ujian') loadStudentQuizzes();
    };

    // ==========================================
    // 1. KUMPUL TUGAS (FILE / LINK)
    // ==========================================
    const tabModeFile = document.getElementById('tabModeFile');
    const tabModeLink = document.getElementById('tabModeLink');
    const sectionFile = document.getElementById('sectionFile');
    const sectionLink = document.getElementById('sectionLink');
    let currentMode = 'file';

    const form = document.getElementById('uploadForm');
    const namaInput = document.getElementById('nama');
    const kelasSelect = document.getElementById('kelas');
    const mapelSelect = document.getElementById('mapel');
    const materiSelect = document.getElementById('materi');
    const rememberBadge = document.getElementById('rememberBadge');
    const submitBtn = document.getElementById('submitBtn');

    const dropzone = document.getElementById('dropzone');
    const fileInfo = document.getElementById('file-info');
    const fileSelected = document.getElementById('file-selected');
    const filenameDisplay = document.getElementById('filename-display');
    const clearFileBtn = document.getElementById('clearFileBtn');
    const fileInput = document.getElementById('file');

    const linkUrlInput = document.getElementById('linkUrl');
    const linkNoteInput = document.getElementById('linkNote');
    const platformBadge = document.getElementById('platformBadge');
    const linkAlertText = document.getElementById('linkAlertText');

    const statusIcon = document.getElementById('statusIcon');
    const statusTitle = document.getElementById('statusTitle');
    const statusInfo = document.getElementById('statusInfo');
    const statusCard = document.getElementById('statusCard');

    let lastUploadName = localStorage.getItem('lastUpload');

    // Auto-Remember Data Diri
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

    function setStatus(state, text) {
        if (!statusCard) return;
        if (state === 'waiting') {
            statusCard.className = "bg-slate-200 border-[3px] border-black rounded-[36px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 transition-colors";
            statusTitle.textContent = "Status:";
            statusIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>`;
            statusIcon.className = "w-6 h-6 text-slate-500";
            statusInfo.textContent = text;
        } else if (state === 'ready') {
            statusCard.className = "bg-amber-300 border-[3px] border-black rounded-[36px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 transition-colors";
            statusTitle.textContent = "Siap Kirim:";
            statusIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z"></path>`;
            statusIcon.className = "w-6 h-6 text-amber-900 animate-pulse";
            statusInfo.textContent = text;
        } else if (state === 'last') {
            statusCard.className = "bg-emerald-300 border-[3px] border-black rounded-[36px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 transition-colors";
            statusTitle.textContent = "Terakhir Dikirim:";
            statusIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>`;
            statusIcon.className = "w-6 h-6 text-emerald-950";
            statusInfo.textContent = text;
        }
    }

    if (lastUploadName) {
        setStatus('last', lastUploadName);
    } else {
        setStatus('waiting', 'Menunggu Input...');
    }

    // Switcher Mode File vs Link
    function switchMode(mode) {
        currentMode = mode;
        if (mode === 'file') {
            tabModeFile.className = "py-2.5 px-3 rounded-lg font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
            tabModeLink.className = "py-2.5 px-3 rounded-lg font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 text-slate-500 hover:text-black";
            sectionFile.classList.remove('hidden');
            sectionLink.classList.add('hidden');
            fileInput.required = true;
            linkUrlInput.required = false;

            if (fileInput.files.length > 0) {
                setStatus('ready', `${fileInput.files.length} berkas dipilih`);
            } else {
                setStatus('waiting', 'Pilih berkas tugas...');
            }
        } else {
            tabModeLink.className = "py-2.5 px-3 rounded-lg font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
            tabModeFile.className = "py-2.5 px-3 rounded-lg font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 text-slate-500 hover:text-black";
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

    if (tabModeFile) tabModeFile.addEventListener('click', () => switchMode('file'));
    if (tabModeLink) tabModeLink.addEventListener('click', () => switchMode('link'));

    // Deteksi Platform Link
    function detectPlatform(url) {
        const u = url.toLowerCase();
        if (u.includes('canva.com')) return { name: 'Canva', bg: 'bg-teal-100 text-teal-800 border-teal-300' };
        if (u.includes('docs.google.com') || u.includes('drive.google.com')) return { name: 'Google Docs/Drive', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
        if (u.includes('instagram.com')) return { name: 'Instagram', bg: 'bg-pink-100 text-pink-800 border-pink-300' };
        if (u.includes('tiktok.com')) return { name: 'TikTok', bg: 'bg-stone-200 text-stone-900 border-stone-400' };
        if (u.includes('scratch.mit.edu')) return { name: 'Scratch', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
        if (u.includes('youtube.com') || u.includes('youtu.be')) return { name: 'YouTube', bg: 'bg-red-100 text-red-800 border-red-300' };
        return { name: 'Web Link', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
    }

    if (linkUrlInput) {
        linkUrlInput.addEventListener('input', () => {
            const val = linkUrlInput.value.trim();
            if (val.length > 5) {
                const detected = detectPlatform(val);
                platformBadge.textContent = detected.name;
                platformBadge.className = `text-[10px] font-black px-2 py-0.5 rounded-full border ${detected.bg}`;
                platformBadge.classList.remove('hidden');
                setStatus('ready', `Tautan ${detected.name} siap`);
            } else {
                platformBadge.classList.add('hidden');
                setStatus('waiting', 'Masukkan URL tugas...');
            }
        });
    }

    // Drag and drop berkas
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
                    alert('Ukuran berkas melebihi batas 10MB.');
                    resetFileInput();
                    return;
                }
                names.push(file.name);
            }
            setStatus('ready', `${fileInput.files.length} berkas dipilih`);
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
        setStatus('waiting', 'Pilih berkas tugas...');
    }

    if (clearFileBtn) clearFileBtn.addEventListener('click', resetFileInput);

    // Muat Opsi Kelas & Judul Tugas dari Supabase
    async function loadOptions() {
        try {
            const { data, error } = await supabase.from('options').select('*');
            if (error) throw error;
            
            kelasSelect.innerHTML = '<option value="" disabled selected>Pilih Kelas</option>';
            materiSelect.innerHTML = '<option value="" disabled selected>Pilih Tugas</option>';
            
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

            if (savedKelas) {
                kelasSelect.value = savedKelas;
            }
        } catch (e) {
            console.error('Failed to load options from Supabase', e);
        }
    }
    loadOptions();

    // Submit Pengumpulan Tugas
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nama = namaInput.value.trim();
        const kelas = kelasSelect.value;
        const mapel = mapelSelect.value;
        const materi = materiSelect.value;

        if (!nama || !kelas || !materi) {
            alert('Silakan lengkapi Nama Lengkap, Kelas, dan Judul Tugas!');
            return;
        }

        localStorage.setItem('student_nama', nama);
        localStorage.setItem('student_kelas', kelas);

        if (currentMode === 'file') {
            if (!fileInput.files || fileInput.files.length === 0) {
                alert('Silakan pilih setidaknya 1 berkas tugas.');
                return;
            }
        } else {
            const linkUrl = linkUrlInput.value.trim();
            if (!linkUrl || (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://'))) {
                alert('Tautan tidak valid! Awali dengan http:// atau https://');
                return;
            }
        }

        submitBtn.innerText = 'Mengirim ke LMS...';
        submitBtn.style.pointerEvents = 'none';

        const loadingPopup = document.getElementById('loadingPopup');
        if (loadingPopup) {
            loadingPopup.classList.remove('hidden');
            loadingPopup.classList.add('flex');
        }

        try {
            let submittedDetail = '';

            if (currentMode === 'file') {
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
                const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                localStorage.setItem('lastUpload', `${fileInput.files.length} berkas (${timestamp})`);

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
                    filename: displayFilename,
                    storage_path: `LINK:${linkUrl}`,
                    link_url: linkUrl,
                    tipe: 'link',
                    status_koreksi: 'belum_dikoreksi'
                };

                const { error: dbError } = await supabase.from('files').insert([payload]);
                if (dbError) throw dbError;

                submittedDetail = linkUrl;
                const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                localStorage.setItem('lastUpload', `Tautan ${platform.name} (${timestamp})`);
            }

            // Tampilkan Bukti Resi Pengumpulan Digital Neobrutalisme
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
                        <p class="text-slate-500 font-bold text-xs uppercase tracking-widest mb-6">Bukti Resmi Pengumpulan LMS SMPN 58</p>

                        <div class="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 text-left space-y-2 mb-6 font-mono text-xs">
                            <div class="flex justify-between border-b border-slate-200 pb-1.5">
                                <span class="text-slate-500">NO. RESI</span>
                                <span class="font-black text-black">${receiptId}</span>
                            </div>
                            <div class="flex justify-between border-b border-slate-200 pb-1.5">
                                <span class="text-slate-500">WAKTU</span>
                                <span class="font-bold text-black">${dateStr}, ${timeStr}</span>
                            </div>
                            <div class="flex justify-between border-b border-slate-200 pb-1.5">
                                <span class="text-slate-500">NAMA SISWA</span>
                                <span class="font-black text-black uppercase">${nama}</span>
                            </div>
                            <div class="flex justify-between border-b border-slate-200 pb-1.5">
                                <span class="text-slate-500">KELAS & MAPEL</span>
                                <span class="font-black text-black">${kelas} &bull; ${mapel}</span>
                            </div>
                            <div class="flex justify-between border-b border-slate-200 pb-1.5">
                                <span class="text-slate-500">TUGAS</span>
                                <span class="font-black text-black">${materi}</span>
                            </div>
                            <div class="pt-1">
                                <span class="text-slate-500 block mb-1">DETAIL PENGUMPULAN:</span>
                                <div class="font-bold text-slate-800 break-all bg-white p-2 rounded border border-slate-200">
                                    ${submittedDetail}
                                </div>
                            </div>
                        </div>

                        <div class="bg-yellow-100 border border-yellow-300 rounded-xl p-2.5 text-xs text-yellow-900 font-bold mb-6 text-center">
                            📸 <span>Screenshot layar ini sebagai bukti Anda sudah mengumpulkan tugas.</span>
                        </div>

                        <div class="flex flex-col gap-2.5">
                            <button onclick="window.print()" class="w-full h-12 bg-emerald-400 hover:bg-emerald-500 text-black border-2 border-black rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                Cetak / Simpan Resi
                            </button>
                            <a href="/" class="w-full h-12 leading-[3rem] bg-indigo-600 hover:bg-black text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                Kembali ke Portal Belajar
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
            submitBtn.innerText = 'KIRIM TUGAS SEKARANG';
            submitBtn.style.pointerEvents = 'auto';
        }
    });

    // ==========================================
    // 2. MATERI BELAJAR SISWA
    // ==========================================
    async function loadStudentMaterials() {
        const container = document.getElementById('student-materials-list');
        const filterSelect = document.getElementById('filter-materi-mapel');
        container.innerHTML = '<div class="col-span-2 text-center py-8 font-bold text-slate-400 uppercase">Memuat materi belajar...</div>';

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

            renderStudentMaterials(allMaterials);
        } catch (e) {
            container.innerHTML = `<div class="col-span-2 text-center text-red-500 font-bold">Gagal memuat materi: ${e.message}</div>`;
        }
    }

    function renderStudentMaterials(list) {
        const container = document.getElementById('student-materials-list');
        container.innerHTML = '';

        if (list.length === 0) {
            container.innerHTML = '<div class="col-span-2 text-center py-8 text-slate-500 font-bold uppercase">Belum ada materi untuk mata pelajaran ini.</div>';
            return;
        }

        list.forEach(m => {
            const card = document.createElement('div');
            card.className = "bg-white border-[3px] border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between";
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
                ${m.link_video ? `<a href="${m.link_video}" target="_blank" class="text-xs font-bold text-indigo-600 underline">Tonton Video Pembelajaran ↗</a>` : ''}
            `;
            container.appendChild(card);
        });
    }

    window.filterStudentMaterials = () => {
        const filterVal = document.getElementById('filter-materi-mapel').value;
        const filtered = filterVal ? allMaterials.filter(m => m.mapel === filterVal) : allMaterials;
        renderStudentMaterials(filtered);
    };

    // ==========================================
    // 3. UJIAN & KUIS ONLINE SISWA
    // ==========================================
    async function loadStudentQuizzes() {
        const container = document.getElementById('student-quizzes-list');
        container.innerHTML = '<div class="bg-white border-2 border-black rounded-2xl p-6 text-center font-bold text-slate-500 uppercase">Memuat daftar ujian aktif...</div>';

        try {
            const { data, error } = await supabase.from('quizzes').select('*, quiz_questions(*)').eq('status', 'aktif').order('created_at', { ascending: false });
            if (error) throw error;

            container.innerHTML = '';
            if (!data || data.length === 0) {
                container.innerHTML = '<div class="bg-white border-2 border-black rounded-2xl p-6 text-center font-bold text-slate-500 uppercase">Saat ini tidak ada ujian aktif.</div>';
                return;
            }

            data.forEach(q => {
                const questions = q.quiz_questions || [];
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
                        <p class="text-xs text-slate-600 font-bold mt-0.5">${q.petunjuk || 'Kerjakan dengan teliti.'}</p>
                    </div>
                    <button onclick="startExam('${q.id}')" class="px-5 py-2.5 bg-black hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5">
                        Mulai Ujian ✍️
                    </button>
                `;
                container.appendChild(card);
            });
        } catch (e) {
            container.innerHTML = `<div class="bg-white border-2 border-black rounded-2xl p-6 text-center text-red-600 font-bold">Gagal memuat ujian: ${e.message}</div>`;
        }
    }

    window.startExam = async (quizId) => {
        const studentName = namaInput.value.trim() || prompt("Masukkan nama lengkap Anda untuk memulai ujian:");
        if (!studentName) {
            alert("Nama lengkap wajib diisi sebelum ujian.");
            return;
        }

        try {
            const { data, error } = await supabase.from('quizzes').select('*, quiz_questions(*)').eq('id', quizId).single();
            if (error) throw error;
            activeQuizData = { ...data, studentName };

            // Render ke Quiz Room
            document.getElementById('view-ujian').querySelector('.bg-amber-300').classList.add('hidden');
            const room = document.getElementById('quiz-room-container');
            room.classList.remove('hidden');

            document.getElementById('quiz-room-mapel').textContent = `${data.mapel} • Kelas ${data.kelas}`;
            document.getElementById('quiz-room-title').textContent = data.judul_kuis;

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
                                    <label class="flex items-center gap-2.5 p-2 bg-white border border-slate-300 rounded-xl cursor-pointer hover:bg-indigo-50 transition text-xs font-bold text-slate-800">
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
                    alert("Waktu ujian telah habis! Jawaban Anda akan dikirim secara otomatis.");
                    submitExamAnswers();
                }
            }, 1000);

            window.scrollTo({ top: room.offsetTop - 50, behavior: 'smooth' });

        } catch (e) {
            alert("Gagal memulai ujian: " + e.message);
        }
    };

    window.submitExamAnswers = async () => {
        if (!activeQuizData) return;
        const confirmSubmit = confirm("Apakah Anda yakin ingin menyelesaikan dan mengirim jawaban ujian ini?");
        if (!confirmSubmit) return;

        if (quizTimerInterval) clearInterval(quizTimerInterval);

        const btn = document.getElementById('btn-submit-exam');
        btn.disabled = true;
        btn.innerText = "Mengirim Jawaban...";

        try {
            const questions = activeQuizData.quiz_questions || [];
            let answers = {};
            let pgScoreTotal = 0;
            let pgMaxScore = 0;

            questions.forEach(q => {
                if (q.tipe === 'pg') {
                    const selected = document.querySelector(`input[name="question_${q.id}"]:checked`);
                    const val = selected ? selected.value : '';
                    answers[q.id] = val;
                    pgMaxScore += (q.bobot || 10);
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

            alert(`Ujian berhasil dikumpulkan! Nilai Pilihan Ganda Anda: ${pgScoreTotal} poin.`);
            window.location.reload();
        } catch (e) {
            alert("Gagal mengirim jawaban: " + e.message);
            btn.disabled = false;
            btn.innerText = "SELESAI & KIRIM JAWABAN";
        }
    };

    // ==========================================
    // 4. CEK NILAI TUGAS & UJIAN SISWA
    // ==========================================
    window.checkStudentGrades = async () => {
        const nameVal = document.getElementById('check-name-input').value.trim();
        const resultContainer = document.getElementById('student-grades-result');

        if (!nameVal) {
            alert("Silakan masukkan nama Anda!");
            return;
        }

        resultContainer.innerHTML = '<div class="text-center py-6 text-slate-500 font-bold text-xs uppercase animate-pulse">Mencari riwayat nilai...</div>';

        try {
            const { data: fileGrades, error } = await supabase
                .from('files')
                .select('*')
                .ilike('nama', `%${nameVal}%`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            resultContainer.innerHTML = '';
            if (!fileGrades || fileGrades.length === 0) {
                resultContainer.innerHTML = '<div class="bg-slate-50 border-2 border-black rounded-xl p-6 text-center text-slate-500 font-bold uppercase text-xs">Belum ada data tugas yang ditemukan atas nama tersebut.</div>';
                return;
            }

            fileGrades.forEach(g => {
                const card = document.createElement('div');
                card.className = "bg-slate-50 border-2 border-black rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3";
                
                const hasGrade = g.nilai !== null && g.nilai !== undefined && g.nilai !== '';
                const gradeBadge = hasGrade 
                    ? `<span class="bg-emerald-400 text-black font-black text-xl px-3 py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">${g.nilai}</span>`
                    : `<span class="bg-amber-200 text-amber-900 font-bold text-xs px-2.5 py-1 rounded-lg border border-amber-400">Sedang Dikoreksi</span>`;

                card.innerHTML = `
                    <div>
                        <span class="text-[10px] bg-indigo-100 text-indigo-900 font-black px-2 py-0.5 rounded border border-indigo-300 uppercase">
                            ${g.mapel || 'Informatika'} &bull; ${g.kelas}
                        </span>
                        <h4 class="font-black text-base text-black mt-1">${g.materi}</h4>
                        <p class="text-xs text-slate-600 font-bold mt-0.5">Nama: ${g.nama} &bull; ${new Date(g.created_at).toLocaleDateString('id-ID')}</p>
                        ${g.catatan_guru ? `<p class="mt-2 text-xs bg-white p-2 rounded-lg border border-slate-300 font-medium text-slate-800">💬 <strong>Catatan Guru:</strong> ${g.catatan_guru}</p>` : ''}
                    </div>
                    <div class="flex items-center gap-2 self-end md:self-center">
                        ${gradeBadge}
                    </div>
                `;
                resultContainer.appendChild(card);
            });
        } catch (e) {
            resultContainer.innerHTML = `<div class="text-center text-red-600 font-bold text-xs">Gagal mencari nilai: ${e.message}</div>`;
        }
    };

});
