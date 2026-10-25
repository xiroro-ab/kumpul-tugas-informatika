import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, Image as ImageIcon, FileText, Music, CheckCircle, Clock } from 'lucide-react';
import Swal from 'sweetalert2';

interface TIKMeeting1Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

type FileType = 'gambar' | 'dokumen' | 'musik';

interface GameFile {
  id: string;
  name: string;
  type: FileType;
}

const INITIAL_FILES: GameFile[] = [
  { id: '1', name: 'liburan.jpg', type: 'gambar' },
  { id: '2', name: 'tugas_ipa.docx', type: 'dokumen' },
  { id: '3', name: 'lagu_hits.mp3', type: 'musik' },
  { id: '4', name: 'keluarga.png', type: 'gambar' },
  { id: '5', name: 'laporan.pdf', type: 'dokumen' },
  { id: '6', name: 'rekaman.wav', type: 'musik' },
  { id: '7', name: 'pemandangan.jpeg', type: 'gambar' },
  { id: '8', name: 'surat_izin.doc', type: 'dokumen' },
];

export default function TIKMeeting1({ onCompleteMeeting, isCompleted }: TIKMeeting1Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [files, setFiles] = useState<GameFile[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0 && files.length > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (isPlaying && (timeLeft === 0 || files.length === 0)) {
      setIsGameOver(true);
      setIsPlaying(false);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, files]);

  const startGame = () => {
    setFiles([...INITIAL_FILES].sort(() => Math.random() - 0.5));
    setScore(0);
    setTimeLeft(60);
    setIsGameOver(false);
    setIsPlaying(true);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = (e: React.DragEvent, folderType: FileType) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const draggedFile = files.find(f => f.id === id);
    
    if (draggedFile) {
      if (draggedFile.type === folderType) {
        setFiles(prev => prev.filter(f => f.id !== id));
        setScore(prev => prev + 10);
      } else {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Salah Folder!',
          showConfirmButton: false,
          timer: 1500
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.match(/\.(jpg|jpeg|png)$/i)) return <ImageIcon className="w-8 h-8 text-blue-400" />;
    if (fileName.match(/\.(pdf|doc|docx)$/i)) return <FileText className="w-8 h-8 text-emerald-400" />;
    if (fileName.match(/\.(mp3|wav)$/i)) return <Music className="w-8 h-8 text-purple-400" />;
    return <FileText className="w-8 h-8" />;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Antarmuka & Pengelolaan File</h2>
        <p className="mt-2 text-slate-400 font-medium">
          Sortir file ke folder yang tepat! Tarik dan lepaskan file ke folder berdasarkan jenisnya.
        </p>
      </div>

      
      {/* Penjelasan Inti */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-xl mb-8 flex flex-col gap-4">
        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="p-2 bg-blue-500/20 text-blue-400 rounded-xl"><ImageIcon className="w-6 h-6" /></span>
          Apa itu Antarmuka dan Pengelolaan File?
        </h3>
        <p className="text-slate-300 leading-relaxed">
          <strong>Antarmuka Pengguna (GUI)</strong> adalah cara kita berinteraksi dengan komputer menggunakan elemen visual seperti ikon, tombol, dan jendela (window), alih-alih mengetikkan perintah teks. 
        </p>
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mt-2">
          <p className="text-sm text-slate-400 italic">
            <strong>Contoh dalam kehidupan sehari-hari:</strong> Bayangkan komputer adalah sebuah restoran. Antarmuka (GUI) adalah buku menu bergambar yang kamu gunakan untuk memesan makanan dengan menunjuk gambar. Tanpa GUI, kamu harus pergi ke dapur dan memberikan instruksi rinci kepada koki menggunakan bahasa khusus (seperti CLI/Command Line).
          </p>
        </div>
        <p className="text-slate-300 leading-relaxed mt-2">
          <strong>Pengelolaan File (Manajemen File)</strong> adalah proses mengatur, menyimpan, dan mencari data di dalam komputer agar rapi dan mudah ditemukan kembali. Data berupa gambar (.jpg), dokumen (.doc), atau musik (.mp3) disimpan dalam wadah yang disebut folder.
        </p>
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mt-2">
          <p className="text-sm text-slate-400 italic">
            <strong>Contoh dalam kehidupan sehari-hari:</strong> Pengelolaan file sama seperti merapikan lemari pakaianmu. Kemeja di satu laci, celana di laci lain, dan kaos kaki di keranjang khusus. Jika kamu mencampur semuanya, kamu akan kesulitan mencari pakaian saat sedang terburu-buru. Di komputer, kita membuat folder "Gambar", "Dokumen", dan "Musik" agar file tidak berantakan.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 z-10 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Game: Sortir Cepat 📂</h3>
            <p className="text-slate-300 mb-8 max-w-md">Seret setiap file ke folder yang benar sebelum waktu habis! Waktumu 60 detik.</p>
            <button
              onClick={startGame}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-8 py-4 text-lg font-bold text-slate-950 hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
            >
              <PlayCircle className="h-6 w-6" />
              Mulai Bermain
            </button>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 z-10 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-bold text-white mb-4">
              {files.length === 0 ? "Hebat! Semua Terurut" : "Waktu Habis!"}
            </h3>
            <p className="text-xl text-cyan-400 font-mono font-bold mb-8">Skor Akhir: {score}</p>
            
            <div className="flex gap-4">
              <button
                onClick={onCompleteMeeting}
                className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3 font-bold text-white hover:brightness-110 transition-all shadow-lg"
              >
                Lanjut Materi
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-white/5 mb-8">
          <div className="flex items-center gap-2 font-mono text-xl font-bold text-slate-300">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span className={timeLeft <= 10 ? 'text-red-400 animate-pulse' : ''}>00:{timeLeft.toString().padStart(2, '0')}</span>
          </div>
          <div className="font-mono text-xl font-bold text-cyan-400">
            Skor: {score}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 min-h-[400px]">
          {/* File Area */}
          <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 flex flex-wrap gap-4 items-start content-start">
            <AnimatePresence>
              {files.map(file => (
                <motion.div
                  key={file.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  draggable
                  onDragStart={(e: any) => handleDragStart(e, file.id)}
                  className="bg-slate-800 border border-slate-700 p-3 rounded-xl cursor-grab active:cursor-grabbing flex flex-col items-center justify-center w-[100px] hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-colors"
                >
                  {getFileIcon(file.name)}
                  <span className="text-[10px] text-center mt-2 text-slate-300 truncate w-full font-medium" title={file.name}>
                    {file.name}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {files.length === 0 && (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                Tidak ada file tersisa
              </div>
            )}
          </div>

          {/* Folder Area */}
          <div className="grid gap-4">
            <div 
              onDrop={(e) => handleDrop(e, 'gambar')}
              onDragOver={handleDragOver}
              className="bg-blue-900/20 border-2 border-dashed border-blue-500/30 rounded-2xl flex flex-col items-center justify-center h-32 hover:bg-blue-900/40 hover:border-blue-500 transition-all"
            >
              <ImageIcon className="w-8 h-8 text-blue-400 mb-2" />
              <span className="text-blue-200 font-bold text-sm">Folder Gambar</span>
            </div>
            <div 
              onDrop={(e) => handleDrop(e, 'dokumen')}
              onDragOver={handleDragOver}
              className="bg-emerald-900/20 border-2 border-dashed border-emerald-500/30 rounded-2xl flex flex-col items-center justify-center h-32 hover:bg-emerald-900/40 hover:border-emerald-500 transition-all"
            >
              <FileText className="w-8 h-8 text-emerald-400 mb-2" />
              <span className="text-emerald-200 font-bold text-sm">Folder Dokumen</span>
            </div>
            <div 
              onDrop={(e) => handleDrop(e, 'musik')}
              onDragOver={handleDragOver}
              className="bg-purple-900/20 border-2 border-dashed border-purple-500/30 rounded-2xl flex flex-col items-center justify-center h-32 hover:bg-purple-900/40 hover:border-purple-500 transition-all"
            >
              <Music className="w-8 h-8 text-purple-400 mb-2" />
              <span className="text-purple-200 font-bold text-sm">Folder Musik</span>
            </div>
          </div>
        </div>
      </div>
      
      {isCompleted && (
        <div className="flex justify-center mt-6">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold">
            <CheckCircle className="w-5 h-5" />
            Selesai
          </div>
        </div>
      )}
    </div>
  );
}
