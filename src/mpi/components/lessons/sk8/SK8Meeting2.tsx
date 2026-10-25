import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, CheckCircle, RefreshCcw, Gamepad2 } from 'lucide-react';
import Swal from 'sweetalert2';

interface SK8Meeting2Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const SOFTWARE_LIST = [
  { name: 'Windows OS', image: 'https://images.unsplash.com/photo-1680128371866-da0e32829a03?q=80&w=1228&auto=format&fit=crop', type: 'os' },
  { name: 'Google Chrome', image: 'https://images.unsplash.com/photo-1649006865574-8d077cefec17?q=80&w=1161&auto=format&fit=crop', type: 'app' },
  { name: 'Microsoft Word', image: 'https://images.unsplash.com/photo-1658203897415-3cad6cfad5c0?q=80&w=2062&auto=format&fit=crop', type: 'app' },
  { name: 'Android OS', image: 'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?q=80&w=1170&auto=format&fit=crop', type: 'os' },
  { name: 'Adobe Photoshop', image: 'https://images.unsplash.com/photo-1740174459726-8c57d8366061?q=80&w=880&auto=format&fit=crop', type: 'app' },
  { name: 'Apple iOS', image: 'https://images.unsplash.com/photo-1618242556516-6858a8f34cb0?q=80&w=1974&auto=format&fit=crop', type: 'os', invert: false }
];

const SK8Meeting2: React.FC<SK8Meeting2Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<{message: string, isCorrect: boolean} | null>(null);

  const currentItem = SOFTWARE_LIST[currentIndex];

  const handleChoice = (type: string) => {
    if (feedback) return; // Prevent multiple clicks

    const isCorrect = currentItem.type === type;
    
    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback({ message: 'Tepat Sekali!', isCorrect: true });
    } else {
      const correctName = currentItem.type === 'os' ? 'Sistem Operasi' : 'Aplikasi';
      setFeedback({ message: `Kurang Tepat. Ini adalah ${correctName}.`, isCorrect: false });
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentIndex + 1 < SOFTWARE_LIST.length) {
        setCurrentIndex(i => i + 1);
      } else {
        setGameOver(true);
      }
    }, 1500);
  };

  const resetGame = () => {
    setCurrentIndex(0);
    setScore(0);
    setGameOver(false);
    setFeedback(null);
  };

  const handleComplete = () => {
    if (score === SOFTWARE_LIST.length) {
      Swal.fire({
        icon: 'success',
        title: 'Sempurna!',
        text: 'Kamu berhasil mengklasifikasikan semua perangkat lunak dengan benar.',
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
          <Layers className="w-6 h-6 text-purple-400" />
          Klasifikasi Perangkat Lunak (Software)
        </h3>
        <p className="text-slate-300 leading-relaxed">
          <strong>Software</strong> adalah kumpulan data elektronik yang disimpan dan diatur oleh komputer. Software terbagi menjadi dua kelompok utama:
          <br /><br />
          1. <strong>Sistem Operasi (OS)</strong>: Fondasi utama yang mengontrol perangkat keras dan perangkat lunak lain (contoh: Windows, Android).
          <br />
          2. <strong>Aplikasi</strong>: Program yang dirancang untuk kebutuhan spesifik pengguna seperti browsing, mengetik, atau mendesain.
        </p>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2">
              <Gamepad2 className="w-7 h-7 text-purple-400" />
              Game Klasifikasi Software
            </h2>
            <p className="text-slate-400">Tentukan apakah perangkat lunak ini termasuk Sistem Operasi atau Aplikasi.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowGame(!showGame)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg"
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
                  <span>Item: {currentIndex + 1} / {SOFTWARE_LIST.length}</span>
                  <span className="text-yellow-400">Skor: {score}</span>
                </div>

                <div className="bg-slate-800/80 rounded-2xl p-8 border border-slate-700 text-center relative min-h-[300px] flex flex-col items-center justify-center shadow-2xl">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="w-full flex flex-col items-center"
                    >
                      <div className="h-32 flex items-center justify-center mb-6">
                        <img 
                          src={currentItem.image} 
                          alt={currentItem.name} 
                          className={`max-h-full max-w-full object-contain ${currentItem.invert ? 'filter invert opacity-80' : ''}`}
                        />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{currentItem.name}</h3>
                    </motion.div>
                  </AnimatePresence>

                  {/* Feedback Overlay */}
                  <AnimatePresence>
                    {feedback && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`absolute inset-x-4 bottom-24 p-3 rounded-lg font-bold shadow-lg ${feedback.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                      >
                        {feedback.message}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-4 w-full mt-8">
                    <button
                      onClick={() => handleChoice('os')}
                      disabled={feedback !== null}
                      className="flex-1 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg border border-indigo-400 disabled:opacity-50 transition-transform active:scale-95"
                    >
                      Sistem Operasi
                    </button>
                    <button
                      onClick={() => handleChoice('app')}
                      disabled={feedback !== null}
                      className="flex-1 bg-gradient-to-b from-pink-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg border border-pink-400 disabled:opacity-50 transition-transform active:scale-95"
                    >
                      Aplikasi
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-3xl font-bold text-white mb-4">Game Selesai!</h3>
                <p className="text-xl text-slate-300 mb-8">
                  Skor Akhir: <span className="text-yellow-400 font-bold">{score} / {SOFTWARE_LIST.length}</span>
                </p>
                
                {score === SOFTWARE_LIST.length ? (
                  <div className="flex justify-center">
                    <button
                      onClick={handleComplete}
                      disabled={isCompleted}
                      className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl ${
                        isCompleted 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white transform hover:scale-105 animate-pulse'
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

export default SK8Meeting2;
