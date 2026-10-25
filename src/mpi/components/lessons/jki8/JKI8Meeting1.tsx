import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, CheckCircle, RefreshCcw, Gamepad2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import Swal from 'sweetalert2';

interface JKI8Meeting1Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const NETWORK_TYPES = [
  { id: 'LAN', name: 'Local Area Network (LAN)', desc: 'Jaringan komputer yang mencakup wilayah kecil, seperti dalam satu gedung kantor atau sekolah.' },
  { id: 'MAN', name: 'Metropolitan Area Network (MAN)', desc: 'Jaringan yang mencakup suatu kota dengan transfer data kecepatan tinggi.' },
  { id: 'WAN', name: 'Wide Area Network (WAN)', desc: 'Jaringan komputer yang mencakup area geografis yang sangat luas, antar negara atau benua.' },
  { id: 'PAN', name: 'Personal Area Network (PAN)', desc: 'Jaringan komunikasi antara perangkat yang berdekatan dalam jarak beberapa meter saja (misal: Bluetooth).' }
];

const JKI8Meeting1: React.FC<JKI8Meeting1Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  const [showTheory, setShowTheory] = useState(true);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<{message: string, isCorrect: boolean} | null>(null);

  // Scramble options for current question
  const currentItem = NETWORK_TYPES[currentIndex];
  
  // Game data: given a description, user must choose the correct type
  const options = ['LAN', 'MAN', 'WAN', 'PAN'];

  const handleChoice = (selectedId: string) => {
    if (feedback) return;

    const isCorrect = currentItem.id === selectedId;
    
    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback({ message: 'Tepat Sekali!', isCorrect: true });
    } else {
      setFeedback({ message: `Kurang Tepat. Jawaban yang benar adalah ${currentItem.id}.`, isCorrect: false });
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentIndex + 1 < NETWORK_TYPES.length) {
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
    if (score === NETWORK_TYPES.length) {
      Swal.fire({
        icon: 'success',
        title: 'Sempurna!',
        text: 'Kamu berhasil mengklasifikasikan semua jenis jaringan dengan benar.',
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
      
      {/* Intisari Materi Accordion */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
        <button 
          onClick={() => setShowTheory(!showTheory)}
          className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white text-left">Intisari Materi: Jaringan Komputer dan Internet</h2>
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
              <p>Jaringan komputer adalah sekumpulan perangkat yang saling terhubung untuk berbagi data dan sumber daya. Jaringan terbesar di dunia adalah Internet, yang cara kerjanya melibatkan:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Jaringan Lokal (LAN):</strong> Komputer yang terhubung dalam satu area kecil seperti rumah atau lab sekolah.</li>
                <li><strong>Internet:</strong> Kumpulan jutaan jaringan lokal dari seluruh dunia yang saling terhubung membentuk jaringan global (Wide Area Network / WAN).</li>
                <li><strong>ISP (Internet Service Provider):</strong> Perusahaan penyedia layanan internet (seperti Telkomsel, Indihome, dll) yang menjembatani kita ke jaringan internet global.</li>
                <li><strong>IP Address & Routing:</strong> Setiap perangkat memiliki alamat IP sebagai identitas. Data dikirim dalam bentuk paket dan dicari jalan tercepatnya (routing) hingga sampai ke tujuan.</li>
              </ul>
              <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-xl mt-4">
                <strong>💡 Contoh Kehidupan Sehari-hari:</strong> Ketika kamu membuka website sekolah, komputermu (lewat ISP) mengirimkan paket data meminta informasi ke server website tersebut berdasarkan IP Address-nya, lalu server mengirim balik halaman web ke layarmu.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2">
              <Gamepad2 className="w-7 h-7 text-cyan-400" />
              Game: Tebak Skala Jaringan
            </h2>
            <p className="text-slate-400">Pilih jenis jaringan (PAN, LAN, MAN, WAN) berdasarkan deskripsi yang diberikan!</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowGame(!showGame)}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg"
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
                  <span>Skala: {currentIndex + 1} / {NETWORK_TYPES.length}</span>
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
                      <Network className="w-16 h-16 text-cyan-400 mb-6 opacity-80" />
                      <p className="text-xl font-bold text-white italic leading-relaxed">
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
                    <div className="grid grid-cols-2 gap-4 w-full mt-8">
                      {options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleChoice(opt)}
                          className="bg-slate-700 hover:bg-cyan-600 text-white font-bold py-4 px-6 rounded-xl shadow-md border border-slate-600 hover:border-cyan-500 transition-all active:scale-95 text-lg"
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
                  Skor Akhir: <span className="text-yellow-400 font-bold">{score} / {NETWORK_TYPES.length}</span>
                </p>
                
                {score === NETWORK_TYPES.length ? (
                  <div className="flex justify-center">
                    <button
                      onClick={handleComplete}
                      disabled={isCompleted}
                      className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl ${
                        isCompleted 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white transform hover:scale-105 animate-pulse'
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

export default JKI8Meeting1;
