import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

interface Meeting1Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const correctOrder = [
  "Siapkan bahan-bahan (nasi, bumbu, telur, dll)",
  "Haluskan bumbu (bawang, cabai, garam)",
  "Tumis bumbu hingga harum",
  "Masukkan nasi dan telur, aduk rata",
  "Sajikan nasi goreng di piring"
];

export default function Meeting1({ onCompleteMeeting, isCompleted }: Meeting1Props) {
  const [steps, setSteps] = useState<string[]>([]);
  const [hasWon, setHasWon] = useState(false);

  useEffect(() => {
    // Shuffle on mount
    const shuffled = [...correctOrder].sort(() => Math.random() - 0.5);
    setSteps(shuffled);
  }, []);

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    if (direction === 'up' && index > 0) {
      [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    } else if (direction === 'down' && index < newSteps.length - 1) {
      [newSteps[index + 1], newSteps[index]] = [newSteps[index], newSteps[index + 1]];
    }
    setSteps(newSteps);
    setHasWon(false); // Reset win state on move
  };

  const checkAnswer = () => {
    if (JSON.stringify(steps) === JSON.stringify(correctOrder)) {
      setHasWon(true);
      Swal.fire({
        title: "Tepat Sekali!",
        text: "Kamu berhasil menyusun langkah-langkah dekomposisi membuat nasi goreng!",
        icon: "success",
        confirmButtonColor: "#14b8a6",
      }).then(() => {
        onCompleteMeeting();
      });
    } else {
      Swal.fire({
        title: "Kurang Tepat",
        text: "Urutan langkahnya belum benar. Coba periksa lagi ya!",
        icon: "error",
        confirmButtonColor: "#ef4444"
      });
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Pilar 1: Dekomposisi</h2>
        <p className="mt-2 text-slate-400 font-medium">
          Dekomposisi adalah memecah masalah besar dan rumit menjadi bagian-bagian kecil yang lebih mudah dikelola.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-xl flex gap-6 items-center flex-col sm:flex-row">
        <div className="p-4 bg-blue-500/20 text-blue-400 rounded-2xl shrink-0">
          <Layers className="w-12 h-12" />
        </div>
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="text-xl font-bold text-white">Analogi: Bongkar Pasang LEGO</h3>
          <p className="text-slate-300">
            Bayangkan kamu ingin membuat robot LEGO raksasa. Tentu sangat sulit jika langsung dibuat sekaligus! Kamu harus membaginya menjadi bagian kecil: buat kepalanya dulu, lalu badannya, baru tangan dan kakinya.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Game: Urutkan Langkah-langkah</h3>
        </div>

        <p className="text-slate-400 mb-6 relative z-10">
          Susunlah langkah-langkah membuat nasi goreng di bawah ini agar urutannya benar!
        </p>

        <div className="space-y-3 relative z-10">
          {steps.map((step, idx) => (
            <motion.div 
              layout
              key={step} 
              className={`flex items-center gap-4 p-4 rounded-xl border ${hasWon ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/10 bg-slate-950/60'}`}
            >
              <div className={`font-bold ${hasWon ? 'text-emerald-400' : 'text-slate-500'}`}>
                {idx + 1}.
              </div>
              <div className={`flex-1 font-medium ${hasWon ? 'text-emerald-300' : 'text-slate-300'}`}>
                {step}
              </div>
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => handleMove(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleMove(idx, 'down')}
                  disabled={idx === steps.length - 1}
                  className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 relative z-10">
          <button
            onClick={checkAnswer}
            className="px-8 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold transition-colors shadow-lg shadow-blue-500/25"
          >
            Periksa Urutan
          </button>
          
          {(hasWon || isCompleted) && (
            <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              <CheckCircle className="w-5 h-5" /> Misi Selesai
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

