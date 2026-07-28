import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const targetStorage = `  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Create a folder for the specific class and materi
      const kelas = req.body.kelas ? req.body.kelas.replace(/[^a-zA-Z0-9 ]/g, '_').trim() : 'TanpaKelas';
      const materi = req.body.materi ? req.body.materi.replace(/[^a-zA-Z0-9 ]/g, '_').trim() : 'TanpaMateri';
      const classFolder = path.join(UPLOAD_FOLDER, kelas, materi);
      
      if (!fs.existsSync(classFolder)) {
        fs.mkdirSync(classFolder, { recursive: true });
      }
      cb(null, classFolder);
    },
    filename: (req, file, cb) => {
      const nama = req.body.nama ? req.body.nama.replace(/[^a-zA-Z0-9 ]/g, '_').trim() : 'TanpaNama';
      const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, \`\${nama}_\${safeFilename}\`);
    }
  });`;

const replacementStorage = `  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Create a folder for the specific class, materi, and nama
      const kelas = req.body.kelas ? req.body.kelas.replace(/[^a-zA-Z0-9 ]/g, '_').trim() : 'TanpaKelas';
      const materi = req.body.materi ? req.body.materi.replace(/[^a-zA-Z0-9 ]/g, '_').trim() : 'TanpaMateri';
      const nama = req.body.nama ? req.body.nama.replace(/[^a-zA-Z0-9 ]/g, '_').trim() : 'TanpaNama';
      
      const classFolder = path.join(UPLOAD_FOLDER, kelas, materi, nama);
      
      if (!fs.existsSync(classFolder)) {
        fs.mkdirSync(classFolder, { recursive: true });
      }
      cb(null, classFolder);
    },
    filename: (req, file, cb) => {
      const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, safeFilename);
    }
  });`;

content = content.replace(targetStorage, replacementStorage);

const targetGetFiles = `  app.get('/api/files', (req, res) => {
    const fileList: any[] = [];
    try {
      if (fs.existsSync(UPLOAD_FOLDER)) {
        const classes = fs.readdirSync(UPLOAD_FOLDER);
        for (const cls of classes) {
          const clsPath = path.join(UPLOAD_FOLDER, cls);
          if (fs.statSync(clsPath).isDirectory()) {
            const materials = fs.readdirSync(clsPath);
            for (const materi of materials) {
              const materiPath = path.join(clsPath, materi);
              if (fs.statSync(materiPath).isDirectory()) {
                const files = fs.readdirSync(materiPath);
                for (const file of files) {
                  const filePath = path.join(materiPath, file);
                  if (fs.statSync(filePath).isFile()) {
                    fileList.push({
                      kelas: cls,
                      materi: materi,
                      filename: file,
                      path: filePath,
                      url: \`/downloads/\${encodeURIComponent(cls)}/\${encodeURIComponent(materi)}/\${encodeURIComponent(file)}\`
                    });
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    res.json({ files: fileList });
  });`;

const replacementGetFiles = `  app.get('/api/files', (req, res) => {
    const fileList: any[] = [];
    try {
      if (fs.existsSync(UPLOAD_FOLDER)) {
        const classes = fs.readdirSync(UPLOAD_FOLDER);
        for (const cls of classes) {
          const clsPath = path.join(UPLOAD_FOLDER, cls);
          if (fs.statSync(clsPath).isDirectory()) {
            const materials = fs.readdirSync(clsPath);
            for (const materi of materials) {
              const materiPath = path.join(clsPath, materi);
              if (fs.statSync(materiPath).isDirectory()) {
                const namas = fs.readdirSync(materiPath);
                for (const nama of namas) {
                  const namaPath = path.join(materiPath, nama);
                  if (fs.statSync(namaPath).isDirectory()) {
                    const files = fs.readdirSync(namaPath);
                    for (const file of files) {
                      const filePath = path.join(namaPath, file);
                      if (fs.statSync(filePath).isFile()) {
                        fileList.push({
                          kelas: cls,
                          materi: materi,
                          nama: nama,
                          filename: file,
                          path: filePath,
                          url: \`/downloads/\${encodeURIComponent(cls)}/\${encodeURIComponent(materi)}/\${encodeURIComponent(nama)}/\${encodeURIComponent(file)}\`
                        });
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    res.json({ files: fileList });
  });`;

content = content.replace(targetGetFiles, replacementGetFiles);

const targetDownloads = `  app.get('/downloads/:kelas/:materi/:filename', (req, res) => {
    const { kelas, materi, filename } = req.params;
    const filePath = path.join(UPLOAD_FOLDER, kelas, materi, filename);
    
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).send('File tidak ditemukan');
    }
  });`;

const replacementDownloads = `  app.get('/downloads/:kelas/:materi/:nama/:filename', (req, res) => {
    const { kelas, materi, nama, filename } = req.params;
    const filePath = path.join(UPLOAD_FOLDER, kelas, materi, nama, filename);
    
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).send('File tidak ditemukan');
    }
  });`;

content = content.replace(targetDownloads, replacementDownloads);

fs.writeFileSync('server.ts', content);
