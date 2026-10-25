import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Binary, CheckCircle, RefreshCcw, Gamepad2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import Swal from 'sweetalert2';

interface JKI8Meeting2Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const ITEMS = [
  { id: '1', text: 'Suara manusia saat berbicara langsung', type: 'analog' },
  { id: '2', text: 'File musik MP3 di HP', type: 'digital' },
  { id: '3', text: 'Siaran Radio FM', type: 'analog' },
  { id: '4', text: 'Koneksi Wi-Fi / Jaringan Komputer', type: 'digital' },
  { id: '5', text: 'Piringan Hitam (Vinyl)', type: 'analog' },
  { id: '6', text: 'Data dari Flashdisk', type: 'digital' }
];

const JKI8Meeting2: React.FC<JKI8Meeting2Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  const [showTheory, setShowTheory] = useState(true);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<{message: string, isCorrect: boolean} | null>(null);

  const currentItem = ITEMS[currentIndex];

  const handleChoice = (selectedType: string) => {
    if (feedback) return;

    const isCorrect = currentItem.type === selectedType;
    
    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback({ message: 'Tepat Sekali!', isCorrect: true });
    } else {
      setFeedback({ message: `Kurang Tepat. Itu adalah contoh sinyal ${currentItem.type}.`, isCorrect: false });
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentIndex + 1 < ITEMS.length) {
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
    if (score === ITEMS.length) {
      Swal.fire({
        icon: 'success',
        title: 'Luar Biasa!',
        text: 'Kamu berhasil membedakan sinyal analog dan digital dengan sempurna.',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      }).then(() => {
        onCompleteMeeting();
      });
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Ayo Coba Lagi',
        text: 'Kamu harus menjawab semua dengan benar untuk melanjutkan.',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        <button 
          onClick={() => setShowTheory(!showTheory)}
          className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white text-left">Intisari Materi: Sinyal Analog & Digital</h2>
          </div>
          <div className="flex items-center gap-4">
            {showTheory ? <ChevronUp className="w-6 h-6 text-slate-400" /> : <ChevronDown className="w-6 h-6 text-slate-400" />}
          </div>
        </button>

        <AnimatePresence>
          {showTheory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-6 text-slate-300 leading-relaxed space-y-4"
            >
              <p>Sinyal dalam telekomunikasi dibedakan menjadi dua jenis:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Sinyal Analog:</strong> Gelombang yang terus menerus (kontinu) tanpa terputus. Rentan terhadap gangguan/noise. Contoh: Gelombang suara asli, TV tabung lawas.</li>
                <li><strong>Sinyal Digital:</strong> Diskrit, menggunakan nilai biner (0 dan 1). Jauh lebih tahan gangguan dan mudah dimodifikasi komputer. Contoh: Data internet, file MP3/MP4, DVD.</li>
              </ul>
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mt-4">
                <strong>💡 Contoh Kehidupan Sehari-hari:</strong> Kaset pita jadul sering kresek-kresek karena itu analog dan rentan rusak. Sementara lagu MP3 di Spotify adalah digital; suaranya jernih dan sama persis walau disalin ribuan kali.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2">
              <Gamepad2 className="w-7 h-7 text-emerald-400" />
              Game: Pemilah Sinyal
            </h2>
            <p className="text-slate-400">Tentukan apakah benda atau teknologi ini menggunakan sinyal Analog atau Digital!</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowGame(!showGame)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg"
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
                  <span>Pertanyaan: {currentIndex + 1} / {ITEMS.length}</span>
                  <span className="text-yellow-400">Skor: {score}</span>
                </div>

                <div className="bg-slate-800/80 rounded-2xl p-8 border border-slate-700 text-center relative shadow-2xl">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="w-full flex flex-col items-center min-h-[150px] justify-center"
                    >
                      <h3 className="text-2xl font-bold text-white leading-relaxed mb-8">
                        "{currentItem.text}"
                      </h3>
                    </motion.div>
                  </AnimatePresence>

                  {/* Feedback Overlay */}
                  <AnimatePresence>
                    {feedback && (
                      <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`mt-4 p-4 rounded-xl font-bold text-lg shadow-lg ${feedback.isCorrect ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}
                      >
                        {feedback.message}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!feedback && (
                    <div className="grid grid-cols-2 gap-4 w-full mt-8">
                      <button
                        onClick={() => handleChoice('analog')}
                        className="bg-slate-700 hover:bg-emerald-600 text-white font-bold py-6 px-6 rounded-xl shadow-md border border-slate-600 hover:border-emerald-500 transition-all active:scale-95 flex flex-col items-center gap-3"
                      >
                        <Radio className="w-8 h-8 text-emerald-400" />
                        <span className="text-xl">Analog</span>
                      </button>
                      <button
                        onClick={() => handleChoice('digital')}
                        className="bg-slate-700 hover:bg-blue-600 text-white font-bold py-6 px-6 rounded-xl shadow-md border border-slate-600 hover:border-blue-500 transition-all active:scale-95 flex flex-col items-center gap-3"
                      >
                        <Binary className="w-8 h-8 text-blue-400" />
                        <span className="text-xl">Digital</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-3xl font-bold text-white mb-4">Pemilahan Selesai!</h3>
                <p className="text-xl text-slate-300 mb-8">
                  Skor Akhir: <span className="text-yellow-400 font-bold">{score} / {ITEMS.length}</span>
                </p>
                
                {score === ITEMS.length ? (
                  <div className="flex justify-center">
                    <button
                      onClick={handleComplete}
                      disabled={isCompleted}
                      className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl ${
                        isCompleted 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white transform hover:scale-105 animate-pulse'
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

export default JKI8Meeting2;
