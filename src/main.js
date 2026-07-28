import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const dropzone = document.getElementById('dropzone');
    const fileInfo = document.getElementById('file-info');
    const fileSelected = document.getElementById('file-selected');
    const filenameDisplay = document.getElementById('filename-display');
    const clearFileBtn = document.getElementById('clearFileBtn');
    const fileInput = document.getElementById('file');
    const form = document.getElementById('uploadForm');
    const submitBtn = document.getElementById('submitBtn');
    
    // Status Card Elements
    const statusIcon = document.getElementById('statusIcon');
    const statusTitle = document.getElementById('statusTitle');
    const statusInfo = document.getElementById('statusInfo');
    const statusCard = document.getElementById('statusCard');
    
    let lastUploadName = localStorage.getItem('lastUpload');

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

    // Drag and Drop Logic
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
                    alert('Ukuran salah satu file melebihi maksimal 10MB.');
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

    // Load Options from Supabase
    async function loadOptions() {
        try {
            const { data, error } = await supabase.from('options').select('*');
            if (error) throw error;
            
            const kelasSelect = document.getElementById('kelas');
            const materiSelect = document.getElementById('materi');
            
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
        } catch (e) {
            console.error('Failed to load options from Supabase', e);
        }
    }
    
    loadOptions();

    // Form submission via Supabase
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (fileInput.files.length === 0) return;
        
        const nama = document.getElementById('nama').value.trim();
        const kelas = document.getElementById('kelas').value;
        const materi = document.getElementById('materi').value;

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
            for (let i = 0; i < fileInput.files.length; i++) {
                const file = fileInput.files[i];
                // Upload to Supabase Storage
                const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const filePath = `${Date.now()}_${safeFilename}`;
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('uploads')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // Save metadata to Supabase DB
                const { error: dbError } = await supabase.from('files').insert([{
                    nama,
                    kelas,
                    materi,
                    filename: file.name,
                    storage_path: uploadData.path
                }]);

                if (dbError) throw dbError;
            }

            const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            localStorage.setItem('lastUpload', `${fileInput.files.length} file (${timestamp})`);
            document.body.innerHTML = `
                <div class="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
                    <div class="bg-white border-[3px] border-black rounded-[40px] p-10 max-w-md w-full text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div class="w-20 h-20 bg-emerald-400 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg class="w-10 h-10 text-emerald-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h2 class="text-3xl font-black uppercase tracking-tight text-slate-900 mb-2">Tugas Terkirim!</h2>
                        <p class="text-slate-500 font-medium mb-8">Tugas Anda telah berhasil disimpan.</p>
                        <a href="/" class="inline-block w-full h-14 leading-[3.5rem] bg-indigo-600 hover:bg-black text-white rounded-2xl font-black text-lg uppercase tracking-widest transition-all shadow-[0px_6px_0px_0px_rgba(49,46,129,1)] active:shadow-none active:translate-y-1">
                            Kirim Tugas Lain
                        </a>
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
