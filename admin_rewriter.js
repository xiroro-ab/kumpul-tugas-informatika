import fs from 'fs';

let content = fs.readFileSync('templates/admin.html', 'utf8');

const targetSync = `                for (let i = 0; i < files.length; i++) {
                    const f = files[i];
                    status.innerHTML = \\\`Mengunggah \\\${i + 1}/\\\${files.length}: \\\${f.filename}...\\\`;
                    
                    if (!folderCache[f.kelas]) {
                        folderCache[f.kelas] = await createFolder(f.kelas, rootFolderId);
                    }
                    const kelasFolderId = folderCache[f.kelas];

                    const materiKey = f.kelas + "_" + f.materi;
                    if (!folderCache[materiKey]) {
                        folderCache[materiKey] = await createFolder(f.materi, kelasFolderId);
                    }
                    const materiFolderId = folderCache[materiKey];

                    const fileRes = await fetch(f.url);
                    const fileBlob = await fileRes.blob();

                    await uploadFileToDrive(fileBlob, f.filename, fileBlob.type, materiFolderId);
                    
                    await fetch('/api/delete-file', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filePath: f.path })
                    });
                    
                    successCount++;
                }`;

const replacementSync = `                for (let i = 0; i < files.length; i++) {
                    const f = files[i];
                    status.innerHTML = \\\`Mengunggah \\\${i + 1}/\\\${files.length}: \\\${f.filename}...\\\`;
                    
                    if (!folderCache[f.kelas]) {
                        folderCache[f.kelas] = await createFolder(f.kelas, rootFolderId);
                    }
                    const kelasFolderId = folderCache[f.kelas];

                    const materiKey = f.kelas + "_" + f.materi;
                    if (!folderCache[materiKey]) {
                        folderCache[materiKey] = await createFolder(f.materi, kelasFolderId);
                    }
                    const materiFolderId = folderCache[materiKey];

                    const namaKey = f.kelas + "_" + f.materi + "_" + f.nama;
                    if (!folderCache[namaKey]) {
                        folderCache[namaKey] = await createFolder(f.nama, materiFolderId);
                    }
                    const namaFolderId = folderCache[namaKey];

                    const fileRes = await fetch(f.url);
                    const fileBlob = await fileRes.blob();

                    await uploadFileToDrive(fileBlob, f.filename, fileBlob.type, namaFolderId);
                    
                    await fetch('/api/delete-file', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filePath: f.path })
                    });
                    
                    successCount++;
                }`;

content = content.replace(targetSync, replacementSync);

const targetTableHeaders = `<th class="px-6 py-4 text-left text-sm font-black text-black uppercase tracking-widest border-b-2 border-black border-r-2">Kelas</th>
                                <th class="px-6 py-4 text-left text-sm font-black text-black uppercase tracking-widest border-b-2 border-black border-r-2">Materi</th>
                                <th class="px-6 py-4 text-left text-sm font-black text-black uppercase tracking-widest border-b-2 border-black border-r-2">Nama File</th>
                                <th class="px-6 py-4 text-left text-sm font-black text-black uppercase tracking-widest border-b-2 border-black">Aksi</th>`;

const replacementTableHeaders = `<th class="px-6 py-4 text-left text-sm font-black text-black uppercase tracking-widest border-b-2 border-black border-r-2">Kelas</th>
                                <th class="px-6 py-4 text-left text-sm font-black text-black uppercase tracking-widest border-b-2 border-black border-r-2">Materi</th>
                                <th class="px-6 py-4 text-left text-sm font-black text-black uppercase tracking-widest border-b-2 border-black border-r-2">Siswa</th>
                                <th class="px-6 py-4 text-left text-sm font-black text-black uppercase tracking-widest border-b-2 border-black border-r-2">Nama File</th>
                                <th class="px-6 py-4 text-left text-sm font-black text-black uppercase tracking-widest border-b-2 border-black">Aksi</th>`;

content = content.replace(targetTableHeaders, replacementTableHeaders);

const targetTableBody = `            if (files.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-6 text-center text-slate-500 font-bold uppercase tracking-widest border-b-2 border-black">Tidak ada file di server.</td></tr>';
                return;
            }

            files.forEach(f => {
                const tr = document.createElement('tr');
                tr.innerHTML = \\\`
                    <td class="px-6 py-4 whitespace-nowrap font-bold text-black border-b-2 border-black border-r-2">\\\${f.kelas}</td>
                    <td class="px-6 py-4 whitespace-nowrap font-bold text-black border-b-2 border-black border-r-2">\\\${f.materi}</td>
                    <td class="px-6 py-4 whitespace-nowrap font-medium text-black border-b-2 border-black border-r-2">\\\${f.filename}</td>
                    <td class="px-6 py-4 whitespace-nowrap font-black text-sm border-b-2 border-black">
                        <a href="\\\${f.url}" target="_blank" class="text-indigo-600 hover:text-indigo-800 uppercase underline tracking-wider">Preview</a>
                    </td>
                \\\`;
                tbody.appendChild(tr);
            });`;

const replacementTableBody = `            if (files.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-6 text-center text-slate-500 font-bold uppercase tracking-widest border-b-2 border-black">Tidak ada file di server.</td></tr>';
                return;
            }

            files.forEach(f => {
                const tr = document.createElement('tr');
                tr.innerHTML = \\\`
                    <td class="px-6 py-4 whitespace-nowrap font-bold text-black border-b-2 border-black border-r-2">\\\${f.kelas}</td>
                    <td class="px-6 py-4 whitespace-nowrap font-bold text-black border-b-2 border-black border-r-2">\\\${f.materi}</td>
                    <td class="px-6 py-4 whitespace-nowrap font-bold text-black border-b-2 border-black border-r-2">\\\${f.nama}</td>
                    <td class="px-6 py-4 whitespace-nowrap font-medium text-black border-b-2 border-black border-r-2">\\\${f.filename}</td>
                    <td class="px-6 py-4 whitespace-nowrap font-black text-sm border-b-2 border-black">
                        <a href="\\\${f.url}" target="_blank" class="text-indigo-600 hover:text-indigo-800 uppercase underline tracking-wider">Preview</a>
                    </td>
                \\\`;
                tbody.appendChild(tr);
            });`;

content = content.replace(targetTableBody, replacementTableBody);

const targetLogoutBtn = `<button onclick="logout()" class="text-red-500 hover:text-red-700 font-black text-sm uppercase tracking-widest border-2 border-transparent hover:border-red-500 px-4 py-2 rounded-xl transition">LOGOUT</button>`;
const replacementLogoutBtn = `<button onclick="logout()" class="text-red-500 hover:text-red-700 font-black text-xs md:text-sm uppercase tracking-widest border-2 border-transparent hover:border-red-500 px-3 md:px-4 py-2 rounded-xl transition whitespace-nowrap">LOGOUT</button>`;

content = content.replace(targetLogoutBtn, replacementLogoutBtn);

fs.writeFileSync('templates/admin.html', content);
