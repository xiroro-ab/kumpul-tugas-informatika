import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ShieldCheck, Target, Video, ChevronDown, ChevronUp, Lock, Unlock } from 'lucide-react';
import Swal from 'sweetalert2';

interface Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function LD9Meeting3({ onCompleteMeeting, isCompleted }: Props) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(true);
  
  const [score, setScore] = useState(0);
  const [items, setItems] = useState([

    { id: 1, text: "Nomor Induk Kependudukan (NIK)", type: "pribadi" },
    { id: 2, text: "Review buku yang baru dibaca", type: "publik" },
    { id: 3, text: "Password email", type: "pribadi" },
    { id: 4, text: "Karya desain grafis buatanmu", type: "publik" },
    { id: 5, text: "Alamat rumah lengkap dan jam rumah kosong", type: "pribadi" },
    { id: 6, text: "Nama lengkap ibu kandung", type: "pribadi" },
    { id: 7, text: "Pendapat tentang film terbaru di bioskop", type: "publik" },
    { id: 8, text: "Nomor rekening bank beserta PIN", type: "pribadi" },
    { id: 9, text: "Foto pemandangan gunung saat liburan", type: "publik" },
    { id: 10, text: "Foto KTP dan Kartu Keluarga", type: "pribadi" }

  ]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const handleChoice = (choice: string) => {
    if (currentIndex >= items.length) return;
    
    const currentItem = items[currentIndex];
    if (currentItem.type === choice) {
      setScore(score + 20);
      Swal.fire('Benar!', 'Pilihan yang aman!', 'success');
    } else {
      Swal.fire('Salah!', 'Hati-hati! Informasi ini sebaiknya tidak dibagikan / harus dibagikan secara tepat.', 'error');
    }
    
    setCurrentIndex(currentIndex + 1);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] -z-10" />
        
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-teal-400" />
          Materi 3: Informasi Publik & Pribadi
        </h2>

        <div className="prose prose-invert max-w-none text-slate-300">
          <p className="text-lg leading-relaxed mb-6">
            Selamat datang di pembelajaran Materi 3: Memilih Informasi Publik dan Pribadi.
          </p>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
            <h4 className="text-teal-400 font-bold mb-2">Intisari Materi:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Informasi Publik:</strong> Data yang aman untuk dibagikan ke khalayak umum (misal: hobi, karya, pendapat umum).</li>
              <li><strong>Informasi Pribadi/Sensitif:</strong> Data rahasia yang dapat disalahgunakan jika diketahui orang lain (misal: NIK, password, alamat lengkap, nama ibu kandung).</li>
              <li><strong>Oversharing:</strong> Terlalu banyak membagikan informasi pribadi di internet yang berpotensi membahayakan keamanan diri (pencurian identitas).</li>
            </ul>
          </div>
        </div>

        {/* Video Accordion */}
        <div className="mt-8 border border-white/10 bg-white/5 rounded-xl overflow-hidden">
          <button 
            onClick={() => setIsVideoOpen(!isVideoOpen)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Video className="w-6 h-6 text-teal-400" />
              <span className="font-bold text-lg text-white">Video Pembelajaran</span>
            </div>
            {isVideoOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          <AnimatePresence>
            {isVideoOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="p-6 border-t border-white/10 flex flex-col gap-6">
                  <div className="aspect-video rounded-xl overflow-hidden shadow-2xl md:w-2/3 mx-auto">
                    <iframe width="100%" height="100%" src="https://www.youtube.com/embed/ZJtW4NNH9z8" title="YouTube video" frameBorder="0" allowFullScreen></iframe>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Game Accordion */}
        <div className="mt-4 border border-white/10 bg-white/5 rounded-xl overflow-hidden">
          <button 
            onClick={() => setIsGameOpen(!isGameOpen)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-pink-400" />
              <span className="font-bold text-lg text-white">Mini Game Interaktif: Jaga Privasimu!</span>
            </div>
            {isGameOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          <AnimatePresence>
            {isGameOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="p-6 border-t border-white/10 flex flex-col gap-6 relative items-center">
                  
                  <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-white/10 w-full max-w-lg">
                    <div className="text-pink-400 font-bold text-lg">Skor: {score}</div>
                    <div className="text-slate-400 font-bold text-sm">Sisa: {items.length - currentIndex}</div>
                  </div>
                  
                  {currentIndex < items.length ? (
                    <div className="bg-slate-800/80 border-2 border-slate-600 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
                       <h3 className="text-xl font-bold text-white mb-8">
                         "{items[currentIndex].text}"
                       </h3>
                       <div className="flex gap-4 justify-center">
                         <button 
                           onClick={() => handleChoice('publik')}
                           className="flex flex-col items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl font-bold shadow-lg flex-1"
                         >
                           <Unlock className="w-8 h-8" />
                           Publik (Aman)
                         </button>
                         <button 
                           onClick={() => handleChoice('pribadi')}
                           className="flex flex-col items-center gap-2 bg-red-600 hover:bg-red-500 text-white p-4 rounded-xl font-bold shadow-lg flex-1"
                         >
                           <Lock className="w-8 h-8" />
                           Pribadi (Rahasia)
                         </button>
                       </div>
                    </div>
                  ) : (
                    <div className="bg-green-900/40 border border-green-500 p-8 rounded-2xl max-w-md w-full text-center">
                       <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                       <h3 className="text-xl font-bold text-green-300">Selesai!</h3>
                       <p className="text-slate-300 mt-2">Skor Akhir: {score} / 100</p>
                       <button onClick={() => { setCurrentIndex(0); setScore(0); }} className="mt-6 px-4 py-2 bg-green-600 text-white rounded-lg font-bold">Main Lagi</button>
                    </div>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isCompleted && (
          <div className="mt-10 flex justify-end">
            <button
              onClick={() => {
                if(currentIndex < items.length) {
                  Swal.fire('Belum Selesai', 'Selesaikan mini game privasi terlebih dahulu.', 'warning');
                  return;
                }
                Swal.fire({ title: 'Materi Selesai!', text: 'Anda telah menyelesaikan materi ini. Silakan lanjut ke evaluasi game.', icon: 'success', confirmButtonColor: '#0ea5e9' }).then(() => onCompleteMeeting());
              }}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/30"
            >
              <CheckCircle className="w-5 h-5" />
              Tandai Selesai
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
