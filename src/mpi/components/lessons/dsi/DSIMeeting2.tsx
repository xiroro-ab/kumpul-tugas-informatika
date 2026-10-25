import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Info, Gamepad2, AlertTriangle, RefreshCw, MessageSquare, ShieldCheck, ThumbsUp, UserX } from 'lucide-react';
import Swal from 'sweetalert2';

interface DSIMeeting2Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const SCENARIOS = [
  {
    id: 1,
    situation: "Ada pesan DM dari orang tak dikenal: 'Selamat! Kamu memenangkan hadiah undian Rp 50 Juta. Klik link ini untuk klaim.'",
    choices: [
      { text: "Klik link untuk memastikan", isCorrect: false },
      { text: "Abaikan, laporkan akun, dan blokir", isCorrect: true }
    ],
    explanation: "Itu adalah modus phishing/penipuan untuk mencuri data."
  },
  {
    id: 2,
    situation: "Temanmu memposting pendapat yang tidak kamu setujui di kolom komentar media sosial.",
    choices: [
      { text: "Membalas dengan kata kasar karena dia salah", isCorrect: false },
      { text: "Menghargai pendapatnya dan berdiskusi dengan sopan", isCorrect: true }
    ],
    explanation: "Kita harus menerapkan etika berkomunikasi (netiket) di dunia maya seperti di dunia nyata."
  },
  {
    id: 3,
    situation: "Kamu ingin memposting foto liburan ke luar kota di Instagram secara real-time.",
    choices: [
      { text: "Tunda postingan setelah pulang ke rumah", isCorrect: true },
      { text: "Posting saat itu juga dengan lokasi akurat", isCorrect: false }
    ],
    explanation: "Memposting lokasi akurat secara real-time dapat membahayakan keamanan dirimu dan memberitahu pencuri bahwa rumahmu kosong."
  },
  {
    id: 4,
    situation: "Kamu menerima file dari email yang pengirimnya tidak dikenal dan berakhiran .exe",
    choices: [
      { text: "Langsung buka karena penasaran", isCorrect: false },
      { text: "Hapus email tersebut", isCorrect: true }
    ],
    explanation: "File mencurigakan bisa berisi malware atau virus."
  }
];

const DSIMeeting2: React.FC<DSIMeeting2Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);

  const resetGame = () => {
    setCurrentIndex(0);
    setScore(0);
    setGameFinished(false);
    setShowFeedback(false);
  };

  const handleChoice = (isCorrect: boolean) => {
    if (showFeedback) return;
    
    setLastAnswerCorrect(isCorrect);
    setShowFeedback(true);
    
    if (isCorrect) {
      setScore(s => s + 1);
    }
    
    setTimeout(() => {
      setShowFeedback(false);
      if (currentIndex < SCENARIOS.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        setGameFinished(true);
        const finalScore = isCorrect ? score + 1 : score;
        if (finalScore === SCENARIOS.length && !isCompleted) {
          Swal.fire({
            icon: 'success',
            title: 'Luar Biasa!',
            text: 'Kamu adalah warga digital (netizen) yang bijak!',
            background: '#0f172a',
            color: '#fff',
            confirmButtonColor: '#0ea5e9'
          });
          onCompleteMeeting();
        } else if (finalScore !== SCENARIOS.length) {
          Swal.fire({
            icon: 'warning',
            title: 'Oops!',
            text: 'Masih ada tindakan yang kurang tepat. Mari berlatih lagi!',
            background: '#0f172a',
            color: '#fff',
            confirmButtonColor: '#0ea5e9'
          });
        }
      }
    }, 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Intisari Materi */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-cyan-400" />
            Intisari Materi
          </h3>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Netiket</strong>: Tata krama atau etika berkomunikasi di internet. Perlakukan orang di internet seperti di dunia nyata.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Cyberbullying</strong>: Perundungan di dunia maya. Jangan pernah menjadi pelaku, dan laporkan jika menjadi korban.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Phishing</strong>: Upaya penipuan online untuk mencuri data pribadi, biasanya melalui link palsu.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Dalam Kehidupan Sehari-hari
          </h3>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-slate-300">
            <p className="mb-2">
              Sebelum memposting sesuatu atau berkomentar, ingat prinsip <strong>T.H.I.N.K</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>T</strong>rue (Apakah itu benar?)</li>
              <li><strong>H</strong>elpful (Apakah itu bermanfaat?)</li>
              <li><strong>I</strong>nspiring (Apakah menginspirasi?)</li>
              <li><strong>N</strong>ecessary (Apakah penting?)</li>
              <li><strong>K</strong>ind (Apakah kata-katanya baik?)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Interaktif Game */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2">
              <Gamepad2 className="w-7 h-7 text-indigo-400" />
              Misi: Simulasi Netizen Bijak
            </h2>
            <p className="text-slate-400">Pilih tindakan yang paling tepat untuk setiap situasi di internet!</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto mt-4 sm:mt-0">
            <button 
              onClick={() => setShowGame(!showGame)}
              className="px-4 sm:px-6 py-3 w-full sm:w-auto bg-indigo-500 text-sm sm:text-base hover:bg-indigo-400 text-white font-bold rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/25 shrink"
            >
              {showGame ? 'Sembunyikan Game' : 'Mulai Game Interaktif'}
            </button>
            {showGame && (
              <button 
                onClick={resetGame}
                className="px-6 py-3 w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors border border-white/10 flex justify-center items-center gap-2"
                title="Ulangi"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="sm:hidden">Ulangi Game</span>
              </button>
            )}
          </div>
        </div>

        {showGame && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-white/10 pt-8"
          >
            <div className="max-w-3xl mx-auto">
              {!gameFinished ? (
                <>
                  <div className="mb-6 flex justify-between items-center text-sm font-bold text-slate-400">
                    <span>Kasus: {currentIndex + 1} / {SCENARIOS.length}</span>
                    <span className="text-emerald-400">Skor Netiket: {score}</span>
                  </div>
                  
                  <div className="relative">
                    <AnimatePresence mode="wait">
                      {!showFeedback ? (
                        <motion.div
                          key="question"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="bg-slate-800 border border-slate-700 rounded-3xl p-6 md:p-8"
                        >
                          <div className="flex gap-4 mb-6">
                            <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex justify-center items-center shrink-0">
                              <MessageSquare className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-xl md:text-2xl font-bold text-white leading-tight">
                                {SCENARIOS[currentIndex].situation}
                              </h3>
                            </div>
                          </div>
                          
                          <div className="space-y-3 mt-8">
                            {SCENARIOS[currentIndex].choices.map((choice, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleChoice(choice.isCorrect)}
                                className="w-full text-left p-4 bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/50 rounded-xl transition-all text-slate-200 font-medium"
                              >
                                {choice.text}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="feedback"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`rounded-3xl p-8 text-center border ${
                            lastAnswerCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                          }`}
                        >
                          {lastAnswerCorrect ? (
                            <ThumbsUp className="w-16 h-16 text-green-400 mx-auto mb-4" />
                          ) : (
                            <UserX className="w-16 h-16 text-red-400 mx-auto mb-4" />
                          )}
                          <h3 className={`text-2xl font-bold mb-2 ${lastAnswerCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {lastAnswerCorrect ? 'Tindakan Tepat!' : 'Tindakan Kurang Tepat!'}
                          </h3>
                          <p className="text-slate-300 text-lg">{SCENARIOS[currentIndex].explanation}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="bg-slate-900 border border-white/10 p-10 rounded-3xl text-center">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Simulasi Selesai!</h3>
                  <p className="text-slate-400 mb-6">Skor Kebijaksanaan: {score} dari {SCENARIOS.length}</p>
                  
                  {score === SCENARIOS.length ? (
                    <div className="bg-emerald-500/20 text-emerald-400 p-4 rounded-xl border border-emerald-500/30 font-bold">
                      Sempurna! Kamu pantas menjadi pelopor etika digital di sekolah.
                    </div>
                  ) : (
                    <div className="bg-orange-500/20 text-orange-400 p-4 rounded-xl border border-orange-500/30 font-bold">
                      Masih ada keputusan yang berisiko. Selalu berhati-hati sebelum bertindak di internet ya!
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {isCompleted && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl text-center"
        >
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-green-400 mb-1">Pertemuan 2 Selesai!</h3>
          <p className="text-green-400/80">Kamu telah menguasai etika dan keamanan dunia maya.</p>
        </motion.div>
      )}

    </div>
  );
};

export default DSIMeeting2;
