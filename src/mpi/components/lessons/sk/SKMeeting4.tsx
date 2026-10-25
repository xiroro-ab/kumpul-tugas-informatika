import React, { useState } from 'react';
import { Binary, BookOpen, Check } from 'lucide-react';
import Swal from 'sweetalert2';

interface SKMeeting4Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function SKMeeting4({ onCompleteMeeting, isCompleted }: SKMeeting4Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  
  // Array of target decimal numbers
  const targets = [5, 9, 14];
  const [currentRound, setCurrentRound] = useState(0);
  const [bits, setBits] = useState([0, 0, 0, 0]); // Represents [8, 4, 2, 1]

  const startGame = () => {
    setIsPlaying(true);
    setCurrentRound(0);
    setBits([0, 0, 0, 0]);
    setIsGameOver(false);
  };

  const currentDecimal = bits[0] * 8 + bits[1] * 4 + bits[2] * 2 + bits[3] * 1;

  const toggleBit = (index: number) => {
    const newBits = [...bits];
    newBits[index] = newBits[index] === 0 ? 1 : 0;
    setBits(newBits);
  };

  const checkAnswer = () => {
    if (currentDecimal === targets[currentRound]) {
      Swal.fire({
        icon: 'success',
        title: 'Konversi Sukses!',
        text: `Biner ${bits.join('')} = Desimal ${targets[currentRound]}`,
        timer: 1500,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff'
      });
      
      setTimeout(() => {
        if (currentRound + 1 < targets.length) {
          setCurrentRound(r => r + 1);
          setBits([0, 0, 0, 0]);
        } else {
          setIsGameOver(true);
        }
      }, 1500);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Belum Tepat',
        text: 'Coba kombinasikan saklar biner dengan benar.',
        timer: 1500,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff'
      });
    }
  };

  if (isGameOver) {
    return (
      <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl text-center">
        <h3 className="text-3xl font-bold text-white mb-4">Kamu Kini Mengerti Bahasa Mesin!</h3>
        <p className="text-xl text-cyan-400 font-bold mb-8">Pelajaran Bilangan Biner Selesai.</p>
        <button
          onClick={onCompleteMeeting}
          className="rounded-2xl bg-cyan-500 px-8 py-4 font-bold text-slate-950 hover:bg-cyan-400 transition-all shadow-lg"
        >
          Lanjut Evaluasi
        </button>
      </div>
    );
  }

  if (isPlaying) {
    return (
      <div className="space-y-8 text-center">
        <div className="bg-slate-900 p-8 rounded-3xl border border-white/10 shadow-xl max-w-lg mx-auto">
          <h3 className="text-xl font-bold text-slate-400 mb-2">Target Desimal:</h3>
          <div className="text-6xl font-black text-cyan-400 mb-8">{targets[currentRound]}</div>
          
          <div className="flex justify-center gap-4 mb-8">
            {[8, 4, 2, 1].map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className="text-slate-500 font-bold text-sm">Nilai: {val}</div>
                <button
                  onClick={() => toggleBit(idx)}
                  className={`w-16 h-20 rounded-xl font-black text-3xl transition-all ${
                    bits[idx] === 1 
                      ? 'bg-emerald-500 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.5)] border-2 border-emerald-400' 
                      : 'bg-slate-800 text-slate-500 border-2 border-slate-700'
                  }`}
                >
                  {bits[idx]}
                </button>
              </div>
            ))}
          </div>

          <div className="text-slate-300 font-bold text-lg mb-8 bg-slate-950 py-3 rounded-xl border border-white/5">
            Total Saat Ini: <span className="text-emerald-400 text-2xl">{currentDecimal}</span>
          </div>

          <button
            onClick={checkAnswer}
            className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg flex justify-center items-center gap-2"
          >
            <Check className="w-5 h-5" /> Periksa Jawaban
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-orange-500/20 rounded-xl text-orange-400">
            <Binary className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-white">Bilangan Biner (Bahasa Mesin)</h3>
        </div>
        <p className="text-slate-400 leading-relaxed mb-6">
          Komputer hanyalah sebuah mesin elektronik yang beroperasi menggunakan listrik. Komputer tidak mengerti huruf A, B, C, atau angka desimal 9 seperti manusia. Komputer hanya tahu dua keadaan:
        </p>
        <div className="flex gap-4 mb-6">
          <div className="flex-1 bg-slate-800 p-4 rounded-xl border border-white/5 text-center">
            <div className="text-3xl font-black text-red-500 mb-2">0</div>
            <div className="text-slate-300 font-bold">Mati (Off)</div>
          </div>
          <div className="flex-1 bg-slate-800 p-4 rounded-xl border border-white/5 text-center">
            <div className="text-3xl font-black text-emerald-400 mb-2">1</div>
            <div className="text-slate-300 font-bold">Hidup (On)</div>
          </div>
        </div>
        <p className="text-slate-400 leading-relaxed mb-8">
          Kombinasi angka 0 dan 1 (Biner) inilah yang membentuk semua data (teks, gambar, video) yang ada di komputermu! Mari kita berlatih mengonversi angka desimal biasa menjadi bahasa mesin (biner) 4-bit.
        </p>
        
        <button
          onClick={startGame}
          className="w-full py-4 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl transition-all shadow-lg"
        >
          Mulai Latihan Konversi Biner
        </button>
      </div>
    </div>
  );
}
