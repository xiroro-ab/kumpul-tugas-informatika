import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, CheckCircle, Home, Building, Globe2, Smartphone } from 'lucide-react';
import Swal from 'sweetalert2';

interface JKIMeeting2Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function JKIMeeting2({ onCompleteMeeting, isCompleted }: JKIMeeting2Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [items, setItems] = useState([
    { id: 1, name: "Menghubungkan TWS/Earphone bluetooth ke HP.", type: "PAN" },
    { id: 2, name: "Jaringan komputer di dalam lab sekolah.", type: "LAN" },
    { id: 3, name: "Jaringan antar kantor cabang bank di seluruh kota Jakarta.", type: "MAN" },
    { id: 4, name: "Jaringan internet yang menghubungkan server di Amerika dengan Indonesia.", type: "WAN" },
    { id: 5, name: "Mengirim foto via AirDrop / Bluetooth ke teman di sebelahmu.", type: "PAN" }
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
        text: `Itu adalah contoh dari jaringan ${selectedType}.`,
        timer: 1500,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff'
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Kurang Tepat',
        text: `Skenario tersebut masuk ke dalam skala ${currentItem.type}.`,
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
            text: "Kamu berhasil mengklasifikasikan skala jaringan!",
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
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Skala Jaringan Komputer</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Mempelajari pengelompokan jaringan komputer berdasarkan luas wilayah cakupannya.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-xl flex gap-6 items-center flex-col sm:flex-row">
        <div className="p-4 bg-purple-500/20 text-purple-400 rounded-2xl shrink-0">
          <Network className="w-12 h-12" />
        </div>
        <div className="space-y-3 text-center sm:text-left">
          <h3 className="text-xl font-bold text-white">Inti Materi</h3>
          <p className="text-slate-300 leading-relaxed">
            <strong className="text-white">PAN (Personal Area Network):</strong> Jarak sangat dekat (Bluetooth, hotspot HP).<br/>
            <strong className="text-white">LAN (Local Area Network):</strong> Jarak lokal (satu gedung, rumah, sekolah).<br/>
            <strong className="text-white">MAN (Metropolitan Area Network):</strong> Antar gedung dalam satu kota (misal: jaringan Bank se-kota).<br/>
            <strong className="text-white">WAN (Wide Area Network):</strong> Mencakup wilayah sangat luas, lintas negara atau benua (Internet global).
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full" />
        
        {!isPlaying && !isGameOver && (
          <div className="text-center space-y-6 relative z-10">
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
              <Network className="w-10 h-10 text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Game: Scale Master!</h3>
              <p className="text-slate-400">Tentukan klasifikasi jaringan yang tepat (PAN, LAN, MAN, WAN) berdasarkan skenario yang muncul.</p>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/25"
            >
              Mulai Bermain
            </button>
          </div>
        )}

        {isPlaying && !isGameOver && (
          <div className="space-y-8 relative z-10">
            <div className="flex justify-between items-center bg-slate-800 p-4 rounded-2xl border border-white/5">
              <span className="text-slate-400 font-medium">Skenario {currentIndex + 1} dari {items.length}</span>
              <span className="text-purple-400 font-bold text-xl">Skor: {score}</span>
            </div>

            <div className="text-center py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-xl mx-auto shadow-lg"
                >
                  <p className="text-2xl text-white font-medium">"{items[currentIndex].name}"</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button onClick={() => handleDrop("PAN")} className="flex flex-col items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all cursor-pointer">
                <Smartphone className="w-8 h-8 text-rose-400" />
                <span className="font-bold text-white text-sm text-center">PAN<br/><span className="text-xs font-normal text-slate-400">Personal</span></span>
              </button>
              <button onClick={() => handleDrop("LAN")} className="flex flex-col items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all cursor-pointer">
                <Home className="w-8 h-8 text-blue-400" />
                <span className="font-bold text-white text-sm text-center">LAN<br/><span className="text-xs font-normal text-slate-400">Local</span></span>
              </button>
              <button onClick={() => handleDrop("MAN")} className="flex flex-col items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer">
                <Building className="w-8 h-8 text-emerald-400" />
                <span className="font-bold text-white text-sm text-center">MAN<br/><span className="text-xs font-normal text-slate-400">Metropolitan</span></span>
              </button>
              <button onClick={() => handleDrop("WAN")} className="flex flex-col items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-orange-500/20 hover:border-orange-500/50 transition-all cursor-pointer">
                <Globe2 className="w-8 h-8 text-orange-400" />
                <span className="font-bold text-white text-sm text-center">WAN<br/><span className="text-xs font-normal text-slate-400">Wide Area</span></span>
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
              <p className="text-slate-400">Skor Akhir: <span className="text-purple-400 font-bold text-xl">{score}</span> / 100</p>
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
