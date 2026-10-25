import React, { useState } from 'react';
import { HelpCircle, CheckCircle, Search } from 'lucide-react';
import Swal from 'sweetalert2';

interface Meeting2Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const patterns = [
  { sequence: ['🍎', '🍎', '🍌', '🍌'], options: ['🍎', '🍌', '🍊'], answer: '🍎' },
  { sequence: ['🟥', '🟨', '🟦', '🟥', '🟨'], options: ['🟥', '🟨', '🟦'], answer: '🟦' },
  { sequence: ['⬆️', '➡️', '⬇️', '⬅️', '⬆️'], options: ['⬆️', '➡️', '⬇️'], answer: '➡️' },
  { sequence: ['A', 'B', 'C', 'A', 'B'], options: ['A', 'B', 'C'], answer: 'C'}
];

export default function Meeting2({ onCompleteMeeting, isCompleted }: Meeting2Props) {
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [hasWon, setHasWon] = useState(false);
  const pattern = patterns[currentPatternIndex];

  const checkPattern = (opt: string) => {
    if (opt === pattern.answer) {
      if (currentPatternIndex < patterns.length - 1) {
        Swal.fire({
          title: "Benar!",
          text: "Pola selanjutnya tepat. Lanjut ke pola berikutnya!",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          setCurrentPatternIndex(prev => prev + 1);
        });
      } else {
        setHasWon(true);
        Swal.fire({
          title: "Luar Biasa!",
          text: "Kamu berhasil menyelesaikan semua tantangan pengenalan pola!",
          icon: "success",
          confirmButtonColor: "#f59e0b"
        }).then(() => {
          onCompleteMeeting();
        });
      }
    } else {
      Swal.fire({
        title: "Kurang Tepat",
        text: "Pola yang kamu pilih belum tepat. Coba perhatikan lagi polanya!",
        icon: "error",
        confirmButtonColor: "#ef4444"
      });
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Pilar 2: Pengenalan Pola</h2>
        <p className="mt-2 text-slate-400 font-medium">
          Pengenalan Pola adalah mencari kemiripan atau tren di dalam sebuah masalah agar kita bisa menggunakan solusi yang sudah ada.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-xl flex gap-6 items-center flex-col sm:flex-row">
        <div className="p-4 bg-amber-500/20 text-amber-400 rounded-2xl shrink-0">
          <Search className="w-12 h-12" />
        </div>
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="text-xl font-bold text-white">Analogi: Lampu Lalu Lintas</h3>
          <p className="text-slate-300">
            Setelah warna Merah, pasti Hijau. Setelah Hijau, pasti Kuning. Karena kamu tahu polanya, kamu bisa menebak apa yang akan terjadi selanjutnya dan bersiap-siap!
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Game: Tebak Pola</h3>
        </div>

        <p className="text-slate-400 mb-6 relative z-10">
          Perhatikan pola di bawah ini dan tentukan gambar selanjutnya!
        </p>

        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">
            Tantangan {currentPatternIndex + 1} / {patterns.length}
          </div>
          <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/20">
            Pola {currentPatternIndex + 1}
          </div>
        </div>

        <div className="flex justify-center items-center gap-2 sm:gap-4 mb-10 text-4xl sm:text-6xl relative z-10">
          {pattern.sequence.map((item, idx) => (
            <span key={idx} className="bg-white/5 p-3 sm:p-4 rounded-2xl shadow-inner border border-white/5">
              {item}
            </span>
          ))}
          <span className="bg-white/10 p-3 sm:p-4 rounded-2xl border border-dashed border-amber-500/50 text-amber-500 flex items-center justify-center w-[72px] h-[72px] sm:w-[104px] sm:h-[104px] animate-pulse">
            <HelpCircle className="w-8 h-8 sm:w-12 sm:h-12 opacity-50" />
          </span>
        </div>

        <h3 className="text-xl font-bold text-white mb-6 relative z-10">Pilih Jawaban:</h3>
        
        <div className="flex justify-center gap-4 sm:gap-6 relative z-10">
          {pattern.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => checkPattern(opt)}
              disabled={hasWon}
              className="text-4xl sm:text-6xl p-4 sm:p-6 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-white/10 hover:border-amber-400 transition-all shadow-lg hover:shadow-amber-500/20 hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="mt-8 flex justify-center gap-4 relative z-10">
          {(hasWon || isCompleted) && (
            <div className="flex items-center gap-2 px-8 py-3 rounded-xl bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
              <CheckCircle className="w-5 h-5" /> Misi Selesai
            </div>
          )}
          {hasWon && (
            <button 
              onClick={() => {
                setHasWon(false);
                setCurrentPatternIndex(0);
              }}
              className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold transition-colors shadow-lg shadow-amber-500/25"
            >
              Main Lagi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
