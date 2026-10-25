import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, BookOpen, Presentation, Gamepad2, AlertCircle, RefreshCw, ChevronUp, ChevronDown, Play } from 'lucide-react';
import Swal from 'sweetalert2';

interface AP8Meeting1Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const INITIAL_STEPS = [
  { id: 1, text: "Tuangkan air panas ke dalam gelas.", correctIndex: 2 },
  { id: 2, text: "Teh manis siap dinikmati.", correctIndex: 4 },
  { id: 3, text: "Siapkan gelas, teh celup, gula, dan air panas.", correctIndex: 0 },
  { id: 4, text: "Aduk hingga gula larut dan warna teh merata.", correctIndex: 3 },
  { id: 5, text: "Masukkan teh celup dan gula ke dalam gelas.", correctIndex: 1 },
];

const AP8Meeting1: React.FC<AP8Meeting1Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  const [steps, setSteps] = useState([...INITIAL_STEPS]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[index - 1];
    newSteps[index - 1] = temp;
    setSteps(newSteps);
  };

  const moveDown = (index: number) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[index + 1];
    newSteps[index + 1] = temp;
    setSteps(newSteps);
  };

  const checkOrder = () => {
    let isCorrect = true;
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].correctIndex !== i) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      Swal.fire({
        icon: 'success',
        title: 'Algoritma Benar!',
        text: 'Kamu berhasil menyusun algoritma yang logis dan berurutan!',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#22c55e'
      }).then(() => {
        if (!isCompleted) onCompleteMeeting();
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Masih Keliru',
        text: 'Urutan algoritmanya belum tepat. Coba periksa lagi logika langkah-langkahnya!',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  const resetGame = () => {
    setSteps([...INITIAL_STEPS]);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-500"></div>
        <div className="p-6 sm:p-8 border-b border-white/10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 flex items-center gap-3">
            <Presentation className="w-8 h-8 text-cyan-400" />
            Materi 1: Algoritma & Blockly Games
          </h2>
          <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg shadow-black/50 border border-white/10 bg-black mb-8">
            <iframe 
              width="100%" 
              height="100%" 
              src="https://www.youtube.com/embed/FGzDhCgmzUU" 
              title="Blockly Games" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-cyan-400" />
          Teori: Logika & Algoritma
        </h2>
        
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
            <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Intisari Materi
            </h3>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink mt-0.5" />
                <span><strong className="text-white">Algoritma</strong> adalah urutan langkah logis untuk memecahkan suatu masalah atau mencapai tujuan.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink mt-0.5" />
                <span>Urutan sangat penting! Jika urutan tertukar, hasil akhir bisa salah atau bahkan program tidak bisa berjalan (error).</span>
              </li>
            </ul>
          </div>
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
            <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Konsep Utama
            </h3>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-amber-400 shrink mt-0.5" />
                <span>Algoritma harus dapat dijalankan secara berurutan dan memiliki batas (tidak berulang tanpa henti, kecuali diminta).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-amber-400 shrink mt-0.5" />
                <span>Pada Blockly Games, menyusun balok kode harus mengikuti urutan logika seperti memecahkan puzzle di dunia nyata.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2">
              <Gamepad2 className="w-7 h-7 text-indigo-400" />
              Game Interaktif: Urutkan Algoritma
            </h2>
            <p className="text-slate-400">Susunlah urutan langkah-langkah membuat teh manis agar menjadi algoritma yang benar dan logis!</p>
          </div>
          <button 
            onClick={() => setShowGame(!showGame)}
            className="px-4 sm:px-6 py-3 w-full sm:w-auto bg-indigo-500 text-sm sm:text-base hover:bg-indigo-400 text-white font-bold rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/25 shrink"
          >
            {showGame ? 'Sembunyikan Game' : 'Mulai Game Interaktif'}
          </button>
        </div>

        {showGame && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-white/10 pt-8"
          >
            <div className="max-w-2xl mx-auto space-y-4">
              <h3 className="text-white font-bold text-center mb-6 text-xl">Langkah-Langkah:</h3>
              
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <motion.div 
                    layout
                    key={step.id}
                    className="flex items-center gap-3 bg-slate-800 p-4 rounded-xl border border-white/10 hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="p-1 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-slate-700 text-white transition-colors"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => moveDown(idx)}
                        disabled={idx === steps.length - 1}
                        className="p-1 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-slate-700 text-white transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <span className="text-cyan-400 font-bold mr-3">{idx + 1}.</span>
                      <span className="text-slate-200">{step.text}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  onClick={checkOrder}
                  className="flex-1 bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" /> Cek Urutan Algoritma
                </button>
                <button 
                  onClick={resetGame}
                  className="bg-slate-800 hover:bg-slate-700 text-white py-3 px-6 rounded-xl transition-colors border border-white/10 flex items-center justify-center gap-2"
                  title="Acak Kembali"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span className="hidden sm:inline">Acak Kembali</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {isCompleted && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-500/10 border border-green-500/30 rounded-3xl p-6 text-center"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 text-green-400 mb-4">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Materi Selesai!</h3>
          <p className="text-slate-300">Kamu telah memahami pentingnya urutan logis dalam sebuah algoritma.</p>
        </motion.div>
      )}
    </div>
  );
};

export default AP8Meeting1;
