import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BookOpen, Settings } from 'lucide-react';
import Swal from 'sweetalert2';

interface SKMeeting3Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function SKMeeting3({ onCompleteMeeting, isCompleted }: SKMeeting3Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [currentScenario, setCurrentScenario] = useState(0);
  
  // Scenarios where users have to map an action to Input, Process, Output, or Storage
  const scenarios = [
    { text: "Mengetik pesan WhatsApp menggunakan Keyboard HP", type: "Input" },
    { text: "Layar HP menampilkan balasan pesan dari teman", type: "Output" },
    { text: "Prosesor HP menerjemahkan ketikan huruf menjadi bahasa mesin", type: "Process" },
    { text: "Menyimpan foto dari WhatsApp ke dalam Galeri/Memori HP", type: "Storage" }
  ];

  const [score, setScore] = useState(0);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setCurrentScenario(0);
    setIsGameOver(false);
  };

  const handleSelect = (type: string) => {
    if (scenarios[currentScenario].type === type) {
      setScore(s => s + 25);
      Swal.fire({
        icon: 'success',
        title: 'Benar Sekali!',
        text: 'Kamu memahami siklus kerja komputer.',
        timer: 1000,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff'
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Salah Tahapan',
        text: `Tindakan tersebut termasuk ke dalam tahapan ${scenarios[currentScenario].type}.`,
        timer: 2000,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff'
      });
    }

    if (currentScenario + 1 < scenarios.length) {
      setCurrentScenario(c => c + 1);
    } else {
      setTimeout(() => setIsGameOver(true), 1500);
    }
  };

  if (isGameOver) {
    return (
      <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl text-center">
        <h3 className="text-3xl font-bold text-white mb-4">Siklus IPO Selesai!</h3>
        <p className="text-xl text-cyan-400 font-bold mb-8">Skor Akhir: {score}/100</p>
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
        <div className="bg-slate-900 p-8 rounded-3xl border border-white/10 shadow-xl">
          <p className="text-slate-400 font-bold mb-4">Tahapan {currentScenario + 1} / {scenarios.length}</p>
          <div className="py-10 px-6 bg-white/5 border border-white/10 rounded-2xl mb-8">
            <h2 className="text-2xl font-bold text-white leading-relaxed">{scenarios[currentScenario].text}</h2>
          </div>

          <h3 className="text-lg font-bold text-slate-400 mb-4">Tindakan di atas termasuk proses apa?</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Input', 'Process', 'Storage', 'Output'].map((type) => (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                className="bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 p-4 rounded-xl font-bold text-indigo-300 transition-colors"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
            <Settings className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-white">Cara Kerja Komputer (IPO)</h3>
        </div>
        <p className="text-slate-400 leading-relaxed mb-6">
          Komputer bekerja seperti pabrik. Mereka menerima bahan baku, memprosesnya (bisa menyimpannya sementara), lalu mengeluarkan barang jadi. Siklus ini disebut <strong>Input - Process - Output (IPO)</strong>.
        </p>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-slate-950 p-6 rounded-2xl border border-white/5">
          <div className="text-center">
            <div className="font-bold text-emerald-400 mb-1">INPUT</div>
            <div className="text-sm text-slate-400">Menerima Data<br/>(Keyboard/Mic)</div>
          </div>
          <ArrowRight className="text-slate-600 rotate-90 md:rotate-0" />
          <div className="text-center">
            <div className="font-bold text-cyan-400 mb-1">PROCESS</div>
            <div className="text-sm text-slate-400">Mengolah Data<br/>(CPU)</div>
          </div>
          <ArrowRight className="text-slate-600 rotate-90 md:rotate-0" />
          <div className="text-center">
            <div className="font-bold text-orange-400 mb-1">OUTPUT</div>
            <div className="text-sm text-slate-400">Menampilkan Hasil<br/>(Monitor/Speaker)</div>
          </div>
        </div>
        
        <p className="text-slate-400 leading-relaxed mb-8 italic">
          *Jangan lupa, komputer juga memiliki <strong>Storage (Penyimpanan)</strong> seperti Harddisk untuk menyimpan data agar tidak hilang.
        </p>

        <button
          onClick={startGame}
          className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all shadow-lg"
        >
          Mulai Misi Analisis IPO
        </button>
      </div>
    </div>
  );
}
