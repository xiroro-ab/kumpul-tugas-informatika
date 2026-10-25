import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Info, Gamepad2, Play, RefreshCw, Smartphone, Shield, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';

interface DSIMeeting1Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const INFO_ITEMS = [
  { id: 1, text: "Nama Panggilan", isPublic: true },
  { id: 2, text: "Password Akun", isPublic: false },
  { id: 3, text: "Hobi dan Minat", isPublic: true },
  { id: 4, text: "Alamat Rumah Lengkap", isPublic: false },
  { id: 5, text: "Karya Seni Buatan Sendiri", isPublic: true },
  { id: 6, text: "Nomor Induk Kependudukan (NIK)", isPublic: false },
  { id: 7, text: "Prestasi Sekolah", isPublic: true },
  { id: 8, text: "Nama Gadis Ibu Kandung", isPublic: false },
];

const DSIMeeting1: React.FC<DSIMeeting1Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  const [items, setItems] = useState([...INFO_ITEMS].sort(() => Math.random() - 0.5));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [animating, setAnimating] = useState(false);

  const resetGame = () => {
    setItems([...INFO_ITEMS].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setScore(0);
    setGameFinished(false);
    setAnimating(false);
  };

  const handleChoice = (isPublicChoice: boolean) => {
    if (animating || gameFinished) return;
    setAnimating(true);
    
    const currentItem = items[currentIndex];
    const isCorrect = currentItem.isPublic === isPublicChoice;
    
    if (isCorrect) {
      setScore(s => s + 1);
    }
    
    setTimeout(() => {
      setAnimating(false);
      if (currentIndex < items.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        setGameFinished(true);
        const finalScore = isCorrect ? score + 1 : score;
        if (finalScore === items.length && !isCompleted) {
          Swal.fire({
            icon: 'success',
            title: 'Luar Biasa!',
            text: 'Kamu berhasil membedakan semua informasi publik dan privat dengan benar.',
            background: '#0f172a',
            color: '#fff',
            confirmButtonColor: '#0ea5e9'
          });
          onCompleteMeeting();
        } else if (finalScore !== items.length) {
          Swal.fire({
            icon: 'warning',
            title: 'Oops!',
            text: 'Masih ada yang salah. Ingat, data pribadi seperti password dan alamat rumah jangan disebar!',
            background: '#0f172a',
            color: '#fff',
            confirmButtonColor: '#0ea5e9'
          });
        }
      }
    }, 500);
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
              <span><strong className="text-white">Jejak Digital</strong> adalah rekam jejak aktivitas kita di internet yang sulit dihapus sepenuhnya.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Informasi Publik</strong> aman untuk dibagikan (misal: hobi, karya, nama panggilan).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Informasi Privat</strong> harus dijaga kerahasiaannya (misal: password, PIN, NIK, alamat lengkap).</span>
            </li>
          </ul>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-purple-400" />
            Dalam Kehidupan Sehari-hari
          </h3>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-slate-300">
            <p className="mb-2">
              Saat kamu mendaftar akun media sosial, aplikasi sering meminta akses data. Jangan asal menekan "Allow" atau "Izinkan".
            </p>
            <p>
              Berbagi foto tiket pesawat, kartu pelajar, atau KTP di media sosial sangat berbahaya karena mengandung informasi sensitif yang bisa disalahgunakan oleh pihak tak bertanggung jawab.
            </p>
          </div>
        </div>
      </div>

      {/* Interaktif Game */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2">
              <Gamepad2 className="w-7 h-7 text-indigo-400" />
              Misi: Pisahkan Informasi
            </h2>
            <p className="text-slate-400">Tentukan apakah informasi di bawah ini boleh dibagikan ke Publik atau harus Privat!</p>
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
            <div className="max-w-2xl mx-auto text-center">
              {!gameFinished ? (
                <>
                  <div className="mb-6 flex justify-between items-center text-sm font-bold text-slate-400">
                    <span>Soal: {currentIndex + 1} / {items.length}</span>
                    <span className="text-cyan-400">Skor: {score}</span>
                  </div>
                  
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    className="bg-slate-800 border border-slate-600 rounded-3xl p-8 mb-8 shadow-2xl"
                  >
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{items[currentIndex].text}</h3>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleChoice(true)}
                      disabled={animating}
                      className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 font-bold py-4 sm:py-6 rounded-2xl flex flex-col items-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Shield className="w-8 h-8" />
                      <span>Publik</span>
                    </button>
                    <button
                      onClick={() => handleChoice(false)}
                      disabled={animating}
                      className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 font-bold py-4 sm:py-6 rounded-2xl flex flex-col items-center gap-2 transition-all disabled:opacity-50"
                    >
                      <AlertTriangle className="w-8 h-8" />
                      <span>Privat</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-slate-900 border border-white/10 p-10 rounded-3xl">
                  <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Gamepad2 className="w-10 h-10 text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Permainan Selesai!</h3>
                  <p className="text-slate-400 mb-6">Skor kamu: {score} dari {items.length}</p>
                  
                  {score === items.length ? (
                    <div className="bg-green-500/20 text-green-400 p-4 rounded-xl border border-green-500/30 font-bold">
                      Hebat! Kamu sudah pandai menjaga privasi data.
                    </div>
                  ) : (
                    <div className="bg-red-500/20 text-red-400 p-4 rounded-xl border border-red-500/30 font-bold">
                      Masih ada yang salah. Coba lagi untuk mendapat skor sempurna!
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
          <h3 className="text-xl font-bold text-green-400 mb-1">Pertemuan 1 Selesai!</h3>
          <p className="text-green-400/80">Kamu telah memahami informasi publik dan privat.</p>
        </motion.div>
      )}

    </div>
  );
};

export default DSIMeeting1;
