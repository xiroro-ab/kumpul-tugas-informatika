import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, CheckCircle, Wifi, Signal, Satellite, Link } from 'lucide-react';
import Swal from 'sweetalert2';

interface JKIMeeting1Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function JKIMeeting1({ onCompleteMeeting, isCompleted }: JKIMeeting1Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [items, setItems] = useState([
    { id: 1, name: "Sinyal paling cepat, biasa ditanam di bawah tanah/laut.", type: "Fiber Optik" },
    { id: 2, name: "Koneksi tanpa kabel di rumah atau cafe untuk banyak perangkat.", type: "Wi-Fi" },
    { id: 3, name: "Menggunakan kuota data dari provider HP saat bepergian.", type: "Seluler" },
    { id: 4, name: "Koneksi di daerah terpencil atau pegunungan tanpa sinyal HP.", type: "Satelit" },
    { id: 5, name: "Jaringan 4G atau 5G di smartphone.", type: "Seluler" }
  ].sort(() => Math.random() - 0.5));
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setCurrentIndex(0);
    setIsGameOver(false);
  };

  const handleDrop = (selectedType: string) => {
    const currentItem = items[currentIndex];
    const isCorrect = currentItem.type === selectedType;

    if (isCorrect) {
      setScore(s => s + 20);
      Swal.fire({
        icon: 'success',
        title: 'Tepat Sekali!',
        text: `Itu adalah karakteristik dari ${selectedType}.`,
        timer: 1500,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff'
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Kurang Tepat',
        text: `Karakteristik tersebut lebih cocok untuk ${currentItem.type}.`,
        timer: 2000,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff'
      });
    }

    if (currentIndex < items.length - 1) {
      setTimeout(() => setCurrentIndex(c => c + 1), 1500);
    } else {
      setTimeout(() => {
        setIsGameOver(true);
        if (score + (isCorrect ? 20 : 0) >= 80) {
          Swal.fire({
            title: "Luar Biasa!",
            text: "Kamu sudah menguasai teknologi jaringan internet!",
            icon: "success",
            confirmButtonText: "Selesai",
            confirmButtonColor: "#14b8a6",
            background: '#0f172a',
            color: '#fff'
          }).then(() => {
            onCompleteMeeting();
          });
        }
      }, 1500);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Macam-macam Jaringan Internet</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Setiap teknologi internet memiliki keunggulan dan skenario penggunaan yang berbeda-beda.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-xl flex gap-6 items-center flex-col sm:flex-row">
        <div className="p-4 bg-blue-500/20 text-blue-400 rounded-2xl shrink-0">
          <Globe className="w-12 h-12" />
        </div>
        <div className="space-y-3 text-center sm:text-left">
          <h3 className="text-xl font-bold text-white">Inti Materi</h3>
          <p className="text-slate-300 leading-relaxed">
            Internet dapat diakses melalui berbagai teknologi:
            <br />• <strong className="text-white">Fiber Optik:</strong> Kabel kaca yang mentransfer data secepat cahaya, andal dan sangat cepat.
            <br />• <strong className="text-white">Wi-Fi:</strong> Jaringan nirkabel lokal, biasa dipakai di rumah, sekolah, atau kafe.
            <br />• <strong className="text-white">Jaringan Seluler:</strong> Mengandalkan menara BTS (4G/5G) untuk perangkat bergerak.
            <br />• <strong className="text-white">Satelit:</strong> Menggunakan sinyal dari luar angkasa, cocok untuk daerah terpencil.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full" />
        
        {!isPlaying && !isGameOver && (
          <div className="text-center space-y-6 relative z-10">
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
              <Link className="w-10 h-10 text-blue-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Game: Match the Connection!</h3>
              <p className="text-slate-400">Cocokkan deskripsi atau skenario dengan teknologi internet yang paling tepat.</p>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25"
            >
              Mulai Bermain
            </button>
          </div>
        )}

        {isPlaying && !isGameOver && (
          <div className="space-y-8 relative z-10">
            <div className="flex justify-between items-center bg-slate-800 p-4 rounded-2xl border border-white/5">
              <span className="text-slate-400 font-medium">Soal {currentIndex + 1} dari {items.length}</span>
              <span className="text-blue-400 font-bold text-xl">Skor: {score}</span>
            </div>

            <div className="text-center py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-xl mx-auto shadow-lg"
                >
                  <p className="text-2xl text-white font-medium">"{items[currentIndex].name}"</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button onClick={() => handleDrop("Fiber Optik")} className="flex flex-col items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all cursor-pointer">
                <Link className="w-8 h-8 text-blue-400" />
                <span className="font-bold text-white text-sm text-center">Fiber Optik</span>
              </button>
              <button onClick={() => handleDrop("Wi-Fi")} className="flex flex-col items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer">
                <Wifi className="w-8 h-8 text-emerald-400" />
                <span className="font-bold text-white text-sm text-center">Wi-Fi</span>
              </button>
              <button onClick={() => handleDrop("Seluler")} className="flex flex-col items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all cursor-pointer">
                <Signal className="w-8 h-8 text-purple-400" />
                <span className="font-bold text-white text-sm text-center">Seluler</span>
              </button>
              <button onClick={() => handleDrop("Satelit")} className="flex flex-col items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-orange-500/20 hover:border-orange-500/50 transition-all cursor-pointer">
                <Satellite className="w-8 h-8 text-orange-400" />
                <span className="font-bold text-white text-sm text-center">Satelit</span>
              </button>
            </div>
          </div>
        )}

        {isGameOver && (
          <div className="text-center space-y-6 relative z-10">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Game Selesai!</h3>
              <p className="text-slate-400">Skor Akhir: <span className="text-blue-400 font-bold text-xl">{score}</span> / 100</p>
            </div>
            {score < 80 ? (
              <button onClick={startGame} className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all">
                Coba Lagi
              </button>
            ) : (
              !isCompleted && (
                <button onClick={onCompleteMeeting} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/25">
                  Tandai Selesai
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
