import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Terminal, User, BookOpen } from 'lucide-react';
import Swal from 'sweetalert2';

interface SKMeeting2Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function SKMeeting2({ onCompleteMeeting, isCompleted }: SKMeeting2Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [items, setItems] = useState([
    { id: 1, name: "Keyboard & Mouse", type: "Hardware" },
    { id: 2, name: "Microsoft Word", type: "Software" },
    { id: 3, name: "Gamer (Pemain E-Sports)", type: "Brainware" },
    { id: 4, name: "Motherboard & RAM", type: "Hardware" },
    { id: 5, name: "Sistem Operasi Android", type: "Software" },
    { id: 6, name: "Programmer Aplikasi", type: "Brainware" }
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
        title: 'Benar!',
        text: `${currentItem.name} adalah ${selectedType}.`,
        timer: 1000,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff'
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Salah Kamar!',
        text: `${currentItem.name} seharusnya masuk ke ${currentItem.type}.`,
        timer: 1500,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff'
      });
    }

    if (currentIndex + 1 < items.length) {
      setCurrentIndex(i => i + 1);
    } else {
      setTimeout(() => setIsGameOver(true), 1500);
    }
  };

  if (isGameOver) {
    return (
      <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl text-center">
        <h3 className="text-3xl font-bold text-white mb-4">Penyortiran Selesai!</h3>
        <p className="text-xl text-cyan-400 font-bold mb-8">Skor Akhir: {score}/120</p>
        <button
          onClick={onCompleteMeeting}
          className="rounded-2xl bg-cyan-500 px-8 py-4 font-bold text-slate-950 hover:bg-cyan-400 transition-all shadow-lg"
        >
          Lanjut Materi
        </button>
      </div>
    );
  }

  if (isPlaying) {
    return (
      <div className="space-y-8 text-center">
        <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-xl">
          <p className="text-slate-400 font-bold mb-2">Item {currentIndex + 1} / {items.length}</p>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              className="py-12 px-6 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl mb-8"
            >
              <h2 className="text-3xl font-extrabold text-white">{items[currentIndex].name}</h2>
            </motion.div>
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => handleDrop('Hardware')} className="bg-slate-800 hover:bg-slate-700 border border-white/10 p-6 rounded-2xl flex flex-col items-center gap-3 transition-colors">
              <Cpu className="w-10 h-10 text-cyan-400" />
              <span className="font-bold text-white">Hardware (Perangkat Keras)</span>
            </button>
            <button onClick={() => handleDrop('Software')} className="bg-slate-800 hover:bg-slate-700 border border-white/10 p-6 rounded-2xl flex flex-col items-center gap-3 transition-colors">
              <Terminal className="w-10 h-10 text-emerald-400" />
              <span className="font-bold text-white">Software (Perangkat Lunak)</span>
            </button>
            <button onClick={() => handleDrop('Brainware')} className="bg-slate-800 hover:bg-slate-700 border border-white/10 p-6 rounded-2xl flex flex-col items-center gap-3 transition-colors">
              <User className="w-10 h-10 text-purple-400" />
              <span className="font-bold text-white">Brainware (Pengguna)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-white">Tiga Pilar Sistem Komputer</h3>
        </div>
        <p className="text-slate-400 leading-relaxed mb-6">
          Sebuah komputer secanggih apapun hanyalah rongsokan besi jika tidak ada perangkat lunak (software) dan pengguna (brainware) yang mengendalikannya. 
          Berikut adalah 3 komponen utama:
        </p>
        <ul className="space-y-4 text-slate-300 mb-8">
          <li className="flex gap-3">
            <span className="text-emerald-400 font-bold">1.</span>
            <span><strong>Hardware (Perangkat Keras):</strong> Bagian komputer yang bisa dipegang fisiknya. Contoh: Monitor, Keyboard, Processor, Harddisk.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-emerald-400 font-bold">2.</span>
            <span><strong>Software (Perangkat Lunak):</strong> Program atau aplikasi tidak berwujud yang memberi perintah pada hardware. Contoh: Windows, WhatsApp, Game Mobile Legends.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-emerald-400 font-bold">3.</span>
            <span><strong>Brainware (Pengguna):</strong> Manusia yang mengoperasikan atau membuat program komputer. Contoh: Programmer, Desainer Grafis, kamu yang sedang main game.</span>
          </li>
        </ul>
        <button
          onClick={startGame}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg"
        >
          Mulai Sortir Komponen
        </button>
      </div>
    </div>
  );
}
