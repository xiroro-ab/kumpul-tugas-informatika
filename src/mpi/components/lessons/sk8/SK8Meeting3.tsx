import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, CheckCircle, RefreshCcw, Gamepad2 } from 'lucide-react';
import Swal from 'sweetalert2';

interface SK8Meeting3Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const BRAINWARE_ROLES = [
  { role: 'Programmer', desc: 'Saya menulis instruksi kode program untuk membuat aplikasi atau game komputer.', options: ['Programmer', 'Operator'] },
  { role: 'Administrator', desc: 'Saya memastikan jaringan komputer sekolah dan server berjalan lancar serta aman.', options: ['Administrator', 'System Analyst'] },
  { role: 'End User', desc: 'Saya menggunakan komputer sehari-hari untuk mengetik tugas dan mencari informasi di internet.', options: ['End User', 'Programmer'] },
  { role: 'System Analyst', desc: 'Saya bertugas merancang alur dan solusi sistem informasi perpustakaan sebelum dibuat oleh programmer.', options: ['System Analyst', 'Administrator'] }
];

const SK8Meeting3: React.FC<SK8Meeting3Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<{message: string, isCorrect: boolean} | null>(null);

  const currentItem = BRAINWARE_ROLES[currentIndex];

  const handleChoice = (selectedRole: string) => {
    if (feedback) return;

    const isCorrect = currentItem.role === selectedRole;
    
    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback({ message: 'Tepat Sekali!', isCorrect: true });
    } else {
      setFeedback({ message: `Kurang Tepat. Jawaban yang benar adalah ${currentItem.role}.`, isCorrect: false });
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentIndex + 1 < BRAINWARE_ROLES.length) {
        setCurrentIndex(i => i + 1);
      } else {
        setGameOver(true);
      }
    }, 2000);
  };

  const resetGame = () => {
    setCurrentIndex(0);
    setScore(0);
    setGameOver(false);
    setFeedback(null);
  };

  const handleComplete = () => {
    if (score === BRAINWARE_ROLES.length) {
      Swal.fire({
        icon: 'success',
        title: 'Sempurna!',
        text: 'Kamu berhasil menebak semua peran Brainware dengan benar.',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      }).then(() => {
        onCompleteMeeting();
      });
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Skor Belum Sempurna',
        text: 'Kamu harus menjawab semua pertanyaan dengan benar untuk melanjutkan. Silakan coba lagi.',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-orange-400" />
          Pengguna Komputer (Brainware)
        </h3>
        <p className="text-slate-300 leading-relaxed">
          <strong>Brainware</strong> adalah istilah untuk manusia yang menggunakan, mengoperasikan, atau mengelola sistem komputer. Secanggih apapun hardware dan software, tanpa brainware, komputer tidak akan bisa berfungsi.
          Peran brainware sangat beragam, mulai dari pengguna biasa hingga para ahli yang merancang sistem yang kompleks.
        </p>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-yellow-500"></div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2">
              <Gamepad2 className="w-7 h-7 text-orange-400" />
              Game: Siapakah Aku?
            </h2>
            <p className="text-slate-400">Baca deskripsi tugas di bawah ini dan tebak peran Brainware yang dimaksud!</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowGame(!showGame)}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-lg"
            >
              {showGame ? 'Tutup Game' : 'Mulai Game'}
            </button>
            {showGame && (
              <button onClick={resetGame} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/10">
                <RefreshCcw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {showGame && (
          <div className="border-t border-white/10 pt-8">
            {!gameOver ? (
              <div className="max-w-2xl mx-auto">
                <div className="mb-4 flex justify-between items-center text-sm font-bold text-slate-400">
                  <span>Pertanyaan: {currentIndex + 1} / {BRAINWARE_ROLES.length}</span>
                  <span className="text-yellow-400">Skor: {score}</span>
                </div>

                <div className="bg-slate-800/80 rounded-2xl p-8 border border-slate-700 text-center relative shadow-2xl">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="w-full flex flex-col items-center min-h-[150px] justify-center"
                    >
                      <p className="text-2xl font-bold text-white italic leading-relaxed">
                        "{currentItem.desc}"
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  {/* Feedback Overlay */}
                  <AnimatePresence>
                    {feedback && (
                      <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`mt-6 p-4 rounded-xl font-bold text-lg shadow-lg ${feedback.isCorrect ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}
                      >
                        {feedback.message}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!feedback && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-8">
                      {currentItem.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleChoice(opt)}
                          className="bg-slate-700 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-xl shadow-md border border-slate-600 hover:border-orange-500 transition-all active:scale-95 text-lg"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-3xl font-bold text-white mb-4">Game Selesai!</h3>
                <p className="text-xl text-slate-300 mb-8">
                  Skor Akhir: <span className="text-yellow-400 font-bold">{score} / {BRAINWARE_ROLES.length}</span>
                </p>
                
                {score === BRAINWARE_ROLES.length ? (
                  <div className="flex justify-center">
                    <button
                      onClick={handleComplete}
                      disabled={isCompleted}
                      className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl ${
                        isCompleted 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-white transform hover:scale-105 animate-pulse'
                      }`}
                    >
                      <CheckCircle className="w-6 h-6" />
                      {isCompleted ? 'Materi Selesai' : 'Lanjutkan Belajar'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={resetGame}
                    className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl bg-slate-700 hover:bg-slate-600 text-white mx-auto"
                  >
                    <RefreshCcw className="w-6 h-6" />
                    Coba Lagi
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SK8Meeting3;
