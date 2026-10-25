import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle, Lock, Unlock, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';

interface JKIMeeting4Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function JKIMeeting4({ onCompleteMeeting, isCompleted }: JKIMeeting4Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  
  const levels = [
    {
      word: "BACA",
      shift: 1,
      rule: "Geser +1 (A → B, B → C, dst)",
      answer: "CBDB"
    },
    {
      word: "KODE",
      shift: 2,
      rule: "Geser +2 (A → C, B → D, dst)",
      answer: "MQFG"
    },
    {
      word: "AMAN",
      shift: 1,
      rule: "Geser +1 (A → B, B → C, dst)",
      answer: "BNBO"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setCurrentIndex(0);
    setIsGameOver(false);
    setInputValue("");
  };

  const handleCheck = () => {
    const currentLevel = levels[currentIndex];
    const isCorrect = inputValue.toUpperCase() === currentLevel.answer;

    if (isCorrect) {
      setScore(s => s + 33);
      Swal.fire({
        icon: 'success',
        title: 'Pesan Terenkripsi!',
        text: `Bagus! Pesan "${currentLevel.word}" berhasil disandikan menjadi "${currentLevel.answer}".`,
        timer: 3000,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff'
      });

      if (currentIndex < levels.length - 1) {
        setTimeout(() => {
          setCurrentIndex(c => c + 1);
          setInputValue("");
        }, 3000);
      } else {
        setTimeout(() => {
          setIsGameOver(true);
          if (score + 33 >= 90) {
            Swal.fire({
              title: "Agen Rahasia!",
              text: "Kamu berhasil menguasai teknik enkripsi Caesar Cipher!",
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
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Kode Salah',
        text: `Coba perhatikan aturan pergeserannya. ${currentLevel.rule}`,
        timer: 3000,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff'
      });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Melindungi Data dengan Enkripsi</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Mempelajari konsep keamanan data dengan menyandikan pesan asli (plaintext) menjadi pesan rahasia (ciphertext).
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-xl flex gap-6 items-center flex-col sm:flex-row">
        <div className="p-4 bg-orange-500/20 text-orange-400 rounded-2xl shrink-0">
          <Shield className="w-12 h-12" />
        </div>
        <div className="space-y-3 text-center sm:text-left">
          <h3 className="text-xl font-bold text-white">Inti Materi</h3>
          <p className="text-slate-300 leading-relaxed">
            <strong className="text-white">Enkripsi</strong> adalah proses mengubah data asli (plaintext) menjadi kode rahasia (ciphertext) agar tidak bisa dibaca oleh pihak yang tidak berwenang.<br/>
            Salah satu metode enkripsi sederhana di masa lampau adalah <strong className="text-white">Caesar Cipher</strong>, yaitu menyandikan pesan dengan menggeser huruf di dalam alfabet (misalnya menggeser 1 huruf ke kanan: A menjadi B, B menjadi C).
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-3xl rounded-full" />
        
        {!isPlaying && !isGameOver && (
          <div className="text-center space-y-6 relative z-10">
            <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-10 h-10 text-orange-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Game: Caesar's Code!</h3>
              <p className="text-slate-400">Jadilah agen rahasia! Enkripsi (sandikan) kata-kata di bawah ini sesuai aturan pergeseran (shift) yang diminta.</p>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-500/25"
            >
              Mulai Bermain
            </button>
          </div>
        )}

        {isPlaying && !isGameOver && (
          <div className="space-y-8 relative z-10">
            <div className="flex justify-between items-center bg-slate-800 p-4 rounded-2xl border border-white/5">
              <span className="text-slate-400 font-medium">Level {currentIndex + 1} dari {levels.length}</span>
              <span className="text-orange-400 font-bold text-xl">Skor: {score}</span>
            </div>

            <div className="py-8 space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="space-y-6 text-center"
                >
                  <div className="inline-block bg-orange-500/20 text-orange-400 px-6 py-2 rounded-full font-bold border border-orange-500/30">
                    Aturan: {levels[currentIndex].rule}
                  </div>

                  <div className="flex justify-center items-center gap-8">
                    <div className="space-y-2">
                      <span className="text-sm text-slate-400">Pesan Asli</span>
                      <div className="w-32 h-16 bg-slate-800 border border-slate-600 rounded-xl flex items-center justify-center">
                        <span className="text-2xl font-bold tracking-widest text-white">{levels[currentIndex].word}</span>
                      </div>
                    </div>
                    
                    <ArrowRight className="w-8 h-8 text-slate-500" />

                    <div className="space-y-2">
                      <span className="text-sm text-slate-400">Pesan Rahasia</span>
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                        maxLength={levels[currentIndex].word.length}
                        className="w-32 h-16 bg-slate-800 border-2 border-orange-500/50 rounded-xl text-center text-2xl font-bold tracking-widest text-orange-400 outline-none focus:border-orange-500 transition-all placeholder:text-slate-600"
                        placeholder="????"
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCheck}
                    disabled={inputValue.length !== levels[currentIndex].word.length}
                    className="px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-500/25"
                  >
                    Enkripsi Sekarang
                  </button>
                </motion.div>
              </AnimatePresence>
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
              <p className="text-slate-400">Skor Akhir: <span className="text-orange-400 font-bold text-xl">{score}</span> / 99</p>
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
