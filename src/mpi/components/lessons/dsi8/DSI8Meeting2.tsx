import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, BookOpen, Presentation, Gamepad2, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import Swal from 'sweetalert2';

interface DSI8Meeting2Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const CASES = [
  {
    id: 1,
    title: 'Pesan Berantai Obat Mujarab',
    text: 'Beredar pesan di grup chat bahwa minum air perasan jeruk lemon dicampur kecap dapat menyembuhkan segala penyakit virus secara instan. Pesan tersebut tidak menyertakan sumber medis.',
    type: 'hoaks',
    reason: 'Tidak ada sumber medis resmi dan menjanjikan penyembuhan instan (ciri khas hoaks).'
  },
  {
    id: 2,
    title: 'Berita dari Portal Resmi',
    text: 'Sebuah artikel dari situs berita nasional bereputasi (seperti Kompas atau Detik) melaporkan adanya gerhana matahari sebagian pada tanggal tertentu, mengutip lembaga antariksa.',
    type: 'fakta',
    reason: 'Berasal dari sumber berita resmi dan mengutip lembaga berwenang.'
  },
  {
    id: 3,
    title: 'Undian Hadiah Menggiurkan',
    text: 'Seseorang membagikan link di Facebook yang mengklaim kamu memenangkan mobil sport. URL link tersebut terlihat aneh (misal: www.undian-mobil-gratis123.blogspot.com).',
    type: 'hoaks',
    reason: 'Domain mencurigakan dan menggunakan trik hadiah (phishing/penipuan).'
  },
];

const DSI8Meeting2: React.FC<DSI8Meeting2Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  const [showVideo, setShowVideo] = useState(true);

  // Game state
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  const handleAnswer = (answer: 'fakta' | 'hoaks') => {
    const currentCase = CASES[currentCaseIndex];
    
    if (answer === currentCase.type) {
      Swal.fire({
        icon: 'success',
        title: 'Benar!',
        text: currentCase.reason,
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#22c55e'
      }).then(() => {
        nextStep(true);
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Kurang Tepat',
        text: `Ini adalah ${currentCase.type.toUpperCase()}. ${currentCase.reason}`,
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      }).then(() => {
        nextStep(false);
      });
    }
  };

  const nextStep = (wasCorrect: boolean) => {
    if (wasCorrect) setScore(prev => prev + 1);

    if (currentCaseIndex < CASES.length - 1) {
      setCurrentCaseIndex(prev => prev + 1);
    } else {
      setGameFinished(true);
      if (score + (wasCorrect ? 1 : 0) === CASES.length) {
        if (!isCompleted) onCompleteMeeting();
      }
    }
  };

  const resetGame = () => {
    setCurrentCaseIndex(0);
    setScore(0);
    setGameFinished(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
        <div className="p-6 sm:p-8 border-b border-white/10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 flex items-center gap-3">
            <Presentation className="w-8 h-8 text-cyan-400" />
            Materi 2: Mengkaji Kritis Informasi
          </h2>
          
          <div className="border border-white/10 rounded-2xl overflow-hidden mb-8">
            <button 
              onClick={() => setShowVideo(!showVideo)}
              className="w-full bg-slate-800 p-4 flex items-center justify-between hover:bg-slate-700 transition-colors"
            >
              <span className="font-bold text-white">Video: Mengkaji Kritis Informasi Media Sosial</span>
              {showVideo ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            <AnimatePresence>
              {showVideo && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden bg-black"
                >
                  <div className="aspect-video w-full">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      src="https://www.youtube.com/embed/lwN-I8ikF8I" 
                      title="Mengkaji Kritis Informasi" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-cyan-400" />
          Teori: Mencegah Hoaks
        </h2>
        
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
            <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Intisari Materi
            </h3>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink mt-0.5" />
                <span><strong className="text-white">Berpikir Kritis</strong> adalah kunci agar tidak mudah tertipu informasi palsu (hoaks).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink mt-0.5" />
                <span>Selalu periksa sumber, tanggal, dan bandingkan dengan portal berita resmi sebelum mempercayai atau membagikan berita.</span>
              </li>
            </ul>
          </div>
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
            <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Ciri-ciri Hoaks
            </h3>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 flex items-center justify-center bg-red-500/20 text-red-400 rounded shrink mt-0.5">!</div>
                <span>Judul provokatif atau berlebihan (Clickbait).</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 flex items-center justify-center bg-red-500/20 text-red-400 rounded shrink mt-0.5">!</div>
                <span>Meminta disebarkan secara masif (pesan berantai).</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 flex items-center justify-center bg-red-500/20 text-red-400 rounded shrink mt-0.5">!</div>
                <span>Sumber tidak jelas (bukan dari institusi/media resmi).</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2">
              <Gamepad2 className="w-7 h-7 text-cyan-400" />
              Game Interaktif: Detektif Hoaks
            </h2>
            <p className="text-slate-400">Analisis kasus informasi di bawah ini, apakah itu Fakta atau Hoaks?</p>
          </div>
          <button 
            onClick={() => setShowGame(!showGame)}
            className="px-4 sm:px-6 py-3 w-full sm:w-auto bg-cyan-600 text-sm sm:text-base hover:bg-cyan-500 text-white font-bold rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-cyan-500/25 shrink"
          >
            {showGame ? 'Sembunyikan Game' : 'Mulai Game Interaktif'}
          </button>
        </div>

        {showGame && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-white/10 pt-8"
          >
            {!gameFinished ? (
              <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-4 text-slate-400">
                  <span>Kasus {currentCaseIndex + 1} dari {CASES.length}</span>
                  <span>Skor: {score}</span>
                </div>
                
                <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl border border-white/10 shadow-xl mb-8 relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-500 to-slate-400"></div>
                  <h3 className="text-xl font-bold text-white mb-4">Kasus: {CASES[currentCaseIndex].title}</h3>
                  <p className="text-slate-300 text-lg leading-relaxed bg-slate-900 p-4 rounded-xl border border-white/5">
                    "{CASES[currentCaseIndex].text}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleAnswer('fakta')}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 text-lg"
                  >
                    <CheckCircle className="w-6 h-6" /> INI FAKTA
                  </button>
                  <button 
                    onClick={() => handleAnswer('hoaks')}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 text-lg"
                  >
                    <AlertCircle className="w-6 h-6" /> INI HOAKS
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center bg-slate-900 p-8 rounded-2xl border border-white/10 max-w-lg mx-auto">
                <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Permainan Selesai!</h3>
                <p className="text-slate-300 mb-6">Skor kamu: <strong className="text-cyan-400 text-xl">{score}</strong> dari {CASES.length}</p>
                
                {score === CASES.length ? (
                  <p className="text-green-400 font-bold mb-8">Luar biasa! Kamu adalah Detektif Anti-Hoaks yang handal.</p>
                ) : (
                  <p className="text-amber-400 font-bold mb-8">Bagus! Namun tetaplah berlatih untuk mengkaji informasi lebih teliti.</p>
                )}

                <button 
                  onClick={resetGame}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" /> Main Lagi
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {isCompleted && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-500/10 border border-green-500/30 rounded-3xl p-6 text-center"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 text-green-400 mb-4">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Materi Selesai!</h3>
          <p className="text-slate-300">Kamu telah menguasai cara mengkaji kritis informasi.</p>
        </motion.div>
      )}
    </div>
  );
};

export default DSI8Meeting2;
