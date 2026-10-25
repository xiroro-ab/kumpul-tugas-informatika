import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Wifi, WifiOff, Smartphone, CheckCircle, RefreshCcw, Gamepad2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import Swal from 'sweetalert2';

interface JKI8Meeting3Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const SCENARIOS = [
  { 
    id: 1, 
    desc: 'Kamu sedang di kafe dan ingin membuka m-banking. Koneksi mana yang kamu pilih?', 
    options: [
      { text: 'Wi-Fi Gratis Kafe tanpa Password', isSafe: false, feedback: 'Bahaya! Wi-Fi publik tanpa password sangat rentan disadap hacker (Man-in-the-Middle attack).' },
      { text: 'Tethering Hotspot dari HP sendiri', isSafe: true, feedback: 'Tepat! Tethering dari paket data seluler sendiri jauh lebih aman untuk transaksi finansial.' }
    ]
  },
  { 
    id: 2, 
    desc: 'Kamu ingin menghubungkan laptop ke router di rumah untuk main game online agar tidak lag.', 
    options: [
      { text: 'Menggunakan Kabel LAN (Ethernet)', isSafe: true, feedback: 'Benar! Koneksi kabel LAN lebih stabil, minim latensi, dan lebih aman dari penyadapan sinyal.' },
      { text: 'Menggunakan Wi-Fi', isSafe: false, feedback: 'Kurang tepat. Wi-Fi rentan terhadap gangguan sinyal dan latensi yang lebih tinggi untuk game kompetitif.' }
    ]
  },
  { 
    id: 3, 
    desc: 'Kamu memasang Wi-Fi baru di rumah. Apa pengaturan keamanan pertama yang kamu ubah?', 
    options: [
      { text: 'Mengubah password default admin dan Wi-Fi', isSafe: true, feedback: 'Bagus! Password bawaan pabrik sangat mudah ditebak.' },
      { text: 'Membiarkannya saja karena merepotkan', isSafe: false, feedback: 'Salah! Tetangga atau peretas bisa dengan mudah masuk ke jaringanmu.' }
    ]
  }
];

const JKI8Meeting3: React.FC<JKI8Meeting3Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  const [showTheory, setShowTheory] = useState(true);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{message: string, isSafe: boolean} | null>(null);

  const currentScenario = SCENARIOS[currentIndex];

  const handleChoice = (isSafe: boolean, feedback: string) => {
    if (feedbackMsg) return;

    if (isSafe) {
      setScore(s => s + 1);
    }
    
    setFeedbackMsg({ message: feedback, isSafe });

    setTimeout(() => {
      setFeedbackMsg(null);
      if (currentIndex + 1 < SCENARIOS.length) {
        setCurrentIndex(i => i + 1);
      } else {
        setGameOver(true);
      }
    }, 4000);
  };

  const resetGame = () => {
    setCurrentIndex(0);
    setScore(0);
    setGameOver(false);
    setFeedbackMsg(null);
  };

  const handleComplete = () => {
    if (score === SCENARIOS.length) {
      Swal.fire({
        icon: 'success',
        title: 'Cyber Security Expert!',
        text: 'Kamu berhasil memilih koneksi yang paling aman untuk semua skenario.',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      }).then(() => {
        onCompleteMeeting();
      });
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Masih Ada Celah Keamanan',
        text: 'Kamu harus menjawab semua skenario dengan aman untuk melanjutkan.',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-rose-500"></div>
        <button 
          onClick={() => setShowTheory(!showTheory)}
          className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <BookOpen className="w-6 h-6 text-pink-400" />
            <h2 className="text-xl font-bold text-white text-left">Intisari Materi: Komunikasi Data pada Ponsel</h2>
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
              <p>Komunikasi data pada ponsel merupakan proses pertukaran data (suara, teks, gambar, video) antara ponsel dengan ponsel lain atau internet melalui jaringan nirkabel seluler. Cara kerjanya melibatkan:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Sinyal Radio:</strong> Ponsel mengubah data menjadi gelombang radio dan memancarkannya.</li>
                <li><strong>BTS (Base Transceiver Station):</strong> Menara pemancar yang menangkap sinyal dari ponsel dan meneruskannya ke jaringan pusat.</li>
                <li><strong>Generasi Seluler (G):</strong> Kecepatan data terus berkembang dari 2G (Edge), 3G, 4G (LTE), hingga 5G yang sangat cepat.</li>
              </ul>
              <div className="bg-pink-500/10 border border-pink-500/20 p-4 rounded-xl mt-4">
                <strong>💡 Contoh Kehidupan Sehari-hari:</strong> Saat kamu mengirim pesan WhatsApp, ponselmu memancarkan sinyal ke tower BTS terdekat, yang kemudian merutekannya melalui internet hingga sampai ke ponsel temanmu di kota lain dalam hitungan detik.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-rose-500"></div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2">
              <Shield className="w-7 h-7 text-pink-400" />
              Game: Analisis Keamanan
            </h2>
            <p className="text-slate-400">Pilih tindakan yang paling aman untuk setiap situasi!</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowGame(!showGame)}
              className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl transition-all shadow-lg"
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
              <div className="max-w-3xl mx-auto">
                <div className="mb-4 flex justify-between items-center text-sm font-bold text-slate-400">
                  <span>Skenario: {currentIndex + 1} / {SCENARIOS.length}</span>
                  <span className="text-yellow-400">Skor Aman: {score}</span>
                </div>

                <div className="bg-slate-800/80 rounded-2xl p-8 border border-slate-700 text-center relative shadow-2xl">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="w-full flex flex-col items-center mb-8"
                    >
                      <Smartphone className="w-16 h-16 text-pink-400 mb-6 opacity-80" />
                      <h3 className="text-xl font-bold text-white leading-relaxed">
                        {currentScenario.desc}
                      </h3>
                    </motion.div>
                  </AnimatePresence>

                  {/* Feedback Overlay */}
                  <AnimatePresence>
                    {feedbackMsg && (
                      <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`mb-6 p-4 rounded-xl font-bold text-lg shadow-lg ${feedbackMsg.isSafe ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}
                      >
                        {feedbackMsg.message}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!feedbackMsg && (
                    <div className="flex flex-col gap-4 w-full">
                      {currentScenario.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleChoice(opt.isSafe, opt.feedback)}
                          className="bg-slate-700 hover:bg-pink-600 text-left text-white font-bold py-4 px-6 rounded-xl shadow-md border border-slate-600 hover:border-pink-500 transition-all active:scale-95 text-lg"
                        >
                          {opt.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-3xl font-bold text-white mb-4">Selesai!</h3>
                <p className="text-xl text-slate-300 mb-8">
                  Skenario Aman: <span className="text-yellow-400 font-bold">{score} / {SCENARIOS.length}</span>
                </p>
                
                {score === SCENARIOS.length ? (
                  <div className="flex justify-center">
                    <button
                      onClick={handleComplete}
                      disabled={isCompleted}
                      className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl ${
                        isCompleted 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white transform hover:scale-105 animate-pulse'
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

export default JKI8Meeting3;
