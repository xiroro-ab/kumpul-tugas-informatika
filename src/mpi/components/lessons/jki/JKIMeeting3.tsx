import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, CheckCircle, Smartphone, Monitor, Plug, Plane } from 'lucide-react';
import Swal from 'sweetalert2';

interface JKIMeeting3Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function JKIMeeting3({ onCompleteMeeting, isCompleted }: JKIMeeting3Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [items, setItems] = useState([
    { 
      id: 1, 
      name: "Listrik rumah mati, Wi-Fi ikut mati. Kamu harus segera mengirim tugas sekolah dari laptopmu.", 
      type: "Tethering",
      explanation: "Kamu bisa menyalakan Personal Hotspot di HP-mu menggunakan kuota seluler untuk menyambungkan laptop ke internet."
    },
    { 
      id: 2, 
      name: "Kamu sedang menggunakan PC/Desktop di Lab Komputer sekolah yang tidak memiliki adapter Wi-Fi.", 
      type: "Kabel LAN",
      explanation: "PC Lab biasanya dihubungkan ke internet menggunakan kabel LAN (kabel UTP) dari router/switch."
    },
    { 
      id: 3, 
      name: "Kamu baru saja mendarat di bandara dan ingin menghemat kuota internet HP-mu.", 
      type: "Wi-Fi Publik",
      explanation: "Kamu bisa menyambungkan HP ke jaringan Wi-Fi publik bandara."
    }
  ]);
  
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
      setScore(s => s + 33);
      Swal.fire({
        icon: 'success',
        title: 'Solusi Tepat!',
        text: currentItem.explanation,
        timer: 3000,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff'
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Solusi Kurang Tepat',
        text: `Coba pikirkan lagi. ${currentItem.name}`,
        timer: 3000,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff'
      });
    }

    if (currentIndex < items.length - 1) {
      setTimeout(() => setCurrentIndex(c => c + 1), 3000);
    } else {
      setTimeout(() => {
        setIsGameOver(true);
        if (score + (isCorrect ? 33 : 0) >= 90) {
          Swal.fire({
            title: "Luar Biasa!",
            text: "Kamu tahu persis cara menghubungkan perangkat ke internet dalam berbagai situasi!",
            icon: "success",
            confirmButtonText: "Selesai",
            confirmButtonColor: "#14b8a6",
            background: '#0f172a',
            color: '#fff'
          }).then(() => {
            onCompleteMeeting();
          });
        }
      }, 3000);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Koneksi Perangkat ke Internet</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Praktik memilih media dan fitur yang tepat untuk menyambungkan perangkat ke jaringan internet.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-xl flex gap-6 items-center flex-col sm:flex-row">
        <div className="p-4 bg-sky-500/20 text-sky-400 rounded-2xl shrink-0">
          <Wifi className="w-12 h-12" />
        </div>
        <div className="space-y-3 text-center sm:text-left">
          <h3 className="text-xl font-bold text-white">Inti Materi</h3>
          <p className="text-slate-300 leading-relaxed">
            Perangkat dapat terhubung ke internet menggunakan:
            <br />• <strong className="text-white">Kabel (Wired):</strong> Contohnya menggunakan kabel LAN (UTP/Ethernet), biasanya untuk PC Desktop.
            <br />• <strong className="text-white">Nirkabel (Wireless):</strong> Menggunakan Wi-Fi atau jaringan seluler.
            <br />• <strong className="text-white">Tethering (Personal Hotspot):</strong> Fitur membagikan koneksi internet ponsel pintar ke perangkat lain (laptop/tablet) via Wi-Fi, Bluetooth, atau kabel USB.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 blur-3xl rounded-full" />
        
        {!isPlaying && !isGameOver && (
          <div className="text-center space-y-6 relative z-10">
            <div className="w-20 h-20 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto">
              <Plug className="w-10 h-10 text-sky-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Game: Connection Resolver!</h3>
              <p className="text-slate-400">Pilih solusi koneksi (tindakan) yang paling tepat untuk masalah/skenario yang diberikan.</p>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-sky-500/25"
            >
              Mulai Bermain
            </button>
          </div>
        )}

        {isPlaying && !isGameOver && (
          <div className="space-y-8 relative z-10">
            <div className="flex justify-between items-center bg-slate-800 p-4 rounded-2xl border border-white/5">
              <span className="text-slate-400 font-medium">Skenario {currentIndex + 1} dari {items.length}</span>
              <span className="text-sky-400 font-bold text-xl">Skor: {score}</span>
            </div>

            <div className="text-center py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-xl mx-auto shadow-lg"
                >
                  <p className="text-2xl text-white font-medium">"{items[currentIndex].name}"</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleDrop("Tethering")} className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-sky-500/20 hover:border-sky-500/50 transition-all cursor-pointer">
                <Smartphone className="w-10 h-10 text-sky-400" />
                <span className="font-bold text-white text-lg text-center">Nyalakan Tethering (Hotspot)</span>
              </button>
              <button onClick={() => handleDrop("Kabel LAN")} className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all cursor-pointer">
                <Plug className="w-10 h-10 text-blue-400" />
                <span className="font-bold text-white text-lg text-center">Colokkan Kabel LAN</span>
              </button>
              <button onClick={() => handleDrop("Wi-Fi Publik")} className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer">
                <Wifi className="w-10 h-10 text-emerald-400" />
                <span className="font-bold text-white text-lg text-center">Sambungkan ke Wi-Fi Publik</span>
              </button>
              <button onClick={() => handleDrop("Mode Pesawat")} className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all cursor-pointer">
                <Plane className="w-10 h-10 text-rose-400" />
                <span className="font-bold text-white text-lg text-center">Nyalakan Mode Pesawat</span>
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
              <p className="text-slate-400">Skor Akhir: <span className="text-sky-400 font-bold text-xl">{score}</span> / 99</p>
            </div>
            {score < 90 ? (
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
