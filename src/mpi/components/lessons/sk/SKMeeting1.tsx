import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Server, BookOpen, CheckCircle, Smartphone } from 'lucide-react';
import Swal from 'sweetalert2';

interface SKMeeting1Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function SKMeeting1({ onCompleteMeeting, isCompleted }: SKMeeting1Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const computers = [
    { name: "Superkomputer", desc: "Digunakan oleh NASA untuk prediksi cuaca dan simulasi alam semesta.", icon: <Server className="w-12 h-12 text-purple-400" /> },
    { name: "Mainframe", desc: "Digunakan bank besar untuk memproses jutaan transaksi nasabah secara bersamaan.", icon: <Server className="w-12 h-12 text-blue-400" /> },
    { name: "Personal Computer (PC)", desc: "Digunakan sehari-hari di rumah atau kantor untuk mengetik, main game, dan browsing.", icon: <Monitor className="w-12 h-12 text-cyan-400" /> },
    { name: "Mikrokomputer (Smartphone)", desc: "Komputer kecil yang bisa dibawa ke mana-mana, digunakan untuk komunikasi dan media sosial.", icon: <Smartphone className="w-12 h-12 text-emerald-400" /> }
  ];

  const questions = [
    { q: "Komputer jenis apa yang biasa digunakan Bank BCA untuk memproses jutaan transfer uang setiap detik?", a: "Mainframe" },
    { q: "Untuk memprediksi jalur badai atau simulasi roket luar angkasa, ilmuwan menggunakan...", a: "Superkomputer" },
    { q: "Kamu ingin bermain game Valorant dan mengerjakan tugas sekolah di rumah. Kamu butuh...", a: "Personal Computer (PC)" },
    { q: "Ayahmu sedang membalas email sambil menunggu kereta menggunakan benda di genggamannya. Itu adalah...", a: "Mikrokomputer (Smartphone)" }
  ];

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setCurrentIndex(0);
    setIsGameOver(false);
  };

  const handleAnswer = (answer: string) => {
    const isCorrect = answer === questions[currentIndex].a;
    
    if (isCorrect) {
      setScore(s => s + 25);
      Swal.fire({
        icon: 'success',
        title: 'Tepat Sekali!',
        text: 'Kamu berhasil mengenali jenis komputernya.',
        timer: 1500,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff'
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Kurang Tepat',
        text: `Jawaban yang benar adalah ${questions[currentIndex].a}`,
        timer: 2000,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff'
      });
    }

    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(i => i + 1);
      } else {
        setIsGameOver(true);
      }
    }, 2000);
  };

  if (isGameOver) {
    return (
      <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl text-center">
        <h3 className="text-3xl font-bold text-white mb-4">Misi Selesai!</h3>
        <p className="text-xl text-cyan-400 font-bold mb-8">Skor Kamu: {score}/100</p>
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
      <div className="space-y-6">
        <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl text-center">
          <p className="text-slate-400 font-bold mb-2">Soal {currentIndex + 1} / {questions.length}</p>
          <h3 className="text-2xl font-bold text-white mb-8">{questions[currentIndex].q}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {computers.map((comp) => (
              <button
                key={comp.name}
                onClick={() => handleAnswer(comp.name)}
                className="bg-white/5 border border-white/10 hover:border-cyan-400 hover:bg-white/10 p-6 rounded-2xl flex flex-col items-center gap-4 transition-all"
              >
                {comp.icon}
                <span className="font-bold text-white text-lg">{comp.name}</span>
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
          <div className="p-3 bg-cyan-500/20 rounded-xl text-cyan-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-white">Jenis & Fungsi Komputer</h3>
        </div>
        <p className="text-slate-400 leading-relaxed mb-6">
          Komputer tidak selalu berbentuk kotak layar di atas meja. Di era modern, komputer memiliki berbagai ukuran dan fungsi, mulai dari yang digenggam hingga sebesar ruangan. 
          Contoh dalam kehidupan sehari-hari:
        </p>
        <ul className="space-y-4 text-slate-300 mb-8">
          <li className="flex gap-3">
            <span className="text-cyan-400 font-bold">1.</span>
            <span><strong>Mikrokomputer (Smartphone/Tablet):</strong> Digunakan untuk main sosmed, memotret, navigasi maps.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-cyan-400 font-bold">2.</span>
            <span><strong>Personal Computer (Laptop/Desktop):</strong> Digunakan siswa untuk mengetik PR, atau desainer membuat animasi.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-cyan-400 font-bold">3.</span>
            <span><strong>Mainframe:</strong> Digunakan oleh Bank Mandiri/BCA untuk menangani jutaan nasabah yang transfer bersamaan.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-cyan-400 font-bold">4.</span>
            <span><strong>Superkomputer:</strong> Digunakan BMKG untuk memprediksi badai, atau NASA untuk perhitungan luar angkasa.</span>
          </li>
        </ul>
        <button
          onClick={startGame}
          className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg"
        >
          Mulai Misi Pengenalan Komputer
        </button>
      </div>
    </div>
  );
}
