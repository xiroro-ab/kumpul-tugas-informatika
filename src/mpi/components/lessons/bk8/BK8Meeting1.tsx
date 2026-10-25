import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Info, Gamepad2, RefreshCw, Zap, Play, Box } from 'lucide-react';
import Swal from 'sweetalert2';

interface BK8Meeting1Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const LEVELS = [
  { input: 2, target: 4, func: 'x2', name: 'Kali 2' },
  { input: 5, target: 8, func: '+3', name: 'Tambah 3' },
  { input: 10, target: 5, func: '/2', name: 'Bagi 2' },
  { input: 3, target: 9, func: 'x3', name: 'Kali 3' },
  { input: 7, target: 6, func: '-1', name: 'Kurang 1' }
];

const BK8Meeting1: React.FC<BK8Meeting1Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  const [level, setLevel] = useState(0);
  const [activeFunc, setActiveFunc] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const [output, setOutput] = useState<number | null>(null);
  const [gameFinished, setGameFinished] = useState(false);

  const currentLevel = LEVELS[level];

  const resetGame = () => {
    setLevel(0);
    setActiveFunc(null);
    setOutput(null);
    setGameFinished(false);
    setAnimating(false);
  };

  const handleProcess = () => {
    if (!activeFunc || animating) return;
    setAnimating(true);
    
    setTimeout(() => {
      let res = currentLevel.input;
      if (activeFunc === 'x2') res *= 2;
      else if (activeFunc === '+3') res += 3;
      else if (activeFunc === '/2') res /= 2;
      else if (activeFunc === 'x3') res *= 3;
      else if (activeFunc === '-1') res -= 1;
      
      setOutput(res);

      setTimeout(() => {
        if (res === currentLevel.target) {
          if (level < LEVELS.length - 1) {
            Swal.fire({
              icon: 'success',
              title: 'Tepat!',
              text: 'Fungsi berhasil mengubah input menjadi output yang sesuai!',
              timer: 1500,
              showConfirmButton: false,
              background: '#0f172a',
              color: '#fff'
            });
            setLevel(l => l + 1);
            setActiveFunc(null);
            setOutput(null);
          } else {
            setGameFinished(true);
            if (!isCompleted) {
              Swal.fire({
                icon: 'success',
                title: 'Luar Biasa!',
                text: 'Kamu berhasil merancang mesin fungsi dengan sempurna!',
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#0ea5e9'
              });
              onCompleteMeeting();
            }
          }
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Gagal!',
            text: `Output yang dihasilkan adalah ${res}, namun targetnya adalah ${currentLevel.target}. Coba fungsi lain!`,
            background: '#0f172a',
            color: '#fff',
            confirmButtonColor: '#0ea5e9'
          });
          setOutput(null);
          setActiveFunc(null);
        }
        setAnimating(false);
      }, 1000);
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-cyan-400" />
            Intisari Materi
          </h3>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Pilar BK</strong>: Meliputi Dekomposisi, Pengenalan Pola, Abstraksi, dan Algoritma.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Fungsi</strong>: Sub-program (blok instruksi) yang menerima input dan menghasilkan output tertentu.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Struktur Data</strong>: Cara mengatur data di komputer agar efisien (contoh: antrian FIFO atau tumpukan LIFO).</span>
            </li>
          </ul>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Box className="w-5 h-5 text-purple-400" />
            Dalam Kehidupan Sehari-hari
          </h3>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-slate-300">
            <p className="mb-2">
              <strong>Fungsi</strong> bekerja seperti mesin pembuat sosis: Daging (Input) masuk ke mesin pencetak (Fungsi), lalu keluar menjadi sosis (Output).
            </p>
            <p>
              <strong>Struktur Data</strong> seperti menumpuk piring. Piring terakhir yang ditaruh adalah piring pertama yang diambil (Stack).
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2">
              <Gamepad2 className="w-7 h-7 text-indigo-400" />
              Simulasi Mesin Fungsi
            </h2>
            <p className="text-slate-400">Pilih modul fungsi yang tepat agar input berubah menjadi target output!</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowGame(!showGame)}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25"
            >
              {showGame ? 'Tutup Game' : 'Mulai Simulasi'}
            </button>
            {showGame && (
              <button onClick={resetGame} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/10">
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {showGame && (
          <div className="border-t border-white/10 pt-8 max-w-4xl mx-auto text-center">
            {!gameFinished ? (
              <>
                <div className="flex justify-between text-slate-400 font-bold mb-6">
                  <span>Level: {level + 1} / {LEVELS.length}</span>
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12">
                  <div className="flex flex-col items-center">
                    <span className="text-slate-400 mb-2 font-medium">Input Data</span>
                    <motion.div 
                      className="w-24 h-24 bg-blue-500/20 border-2 border-blue-400 rounded-2xl flex items-center justify-center text-4xl font-extrabold text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                      animate={animating ? { x: 100, opacity: 0 } : { x: 0, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      {currentLevel.input}
                    </motion.div>
                  </div>

                  <div className="flex flex-col items-center relative z-10">
                    <span className="text-slate-400 mb-2 font-medium">Mesin Fungsi</span>
                    <div className="w-48 h-32 bg-slate-800 border-2 border-slate-600 rounded-3xl flex flex-col items-center justify-center overflow-hidden relative shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>
                      {activeFunc ? (
                        <div className="text-3xl font-extrabold text-yellow-400 bg-yellow-500/10 px-4 py-2 rounded-xl border border-yellow-500/30">
                          f(x) = {activeFunc}
                        </div>
                      ) : (
                        <div className="text-slate-500 font-medium border-2 border-dashed border-slate-600 px-4 py-2 rounded-xl">
                          Masukkan Modul
                        </div>
                      )}
                      
                      {animating && (
                        <motion.div 
                          className="absolute inset-0 bg-cyan-500/20"
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ repeat: Infinity, duration: 0.3 }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-slate-400 mb-2 font-medium">Target Output</span>
                    <motion.div 
                      className={`w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-extrabold shadow-lg transition-all ${output === currentLevel.target ? 'bg-green-500/20 border-2 border-green-400 text-green-400' : 'bg-slate-800 border-2 border-slate-700 text-white'}`}
                    >
                      {output !== null ? output : '?'}
                    </motion.div>
                    <div className="mt-2 text-sm text-cyan-400 font-bold border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 rounded-full">
                      Target: {currentLevel.target}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                  <h4 className="text-white font-medium mb-4">Pilih Modul Fungsi:</h4>
                  <div className="flex flex-wrap justify-center gap-4 mb-6">
                    {['x2', '+3', '/2', 'x3', '-1'].map(fn => (
                      <button
                        key={fn}
                        onClick={() => setActiveFunc(fn)}
                        disabled={animating}
                        className={`px-6 py-3 rounded-xl font-bold text-lg border-2 transition-all ${
                          activeFunc === fn 
                            ? 'bg-yellow-500 text-slate-900 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' 
                            : 'bg-slate-800 text-white border-slate-600 hover:border-slate-400'
                        }`}
                      >
                        {fn}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleProcess}
                    disabled={!activeFunc || animating}
                    className="px-8 py-3 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-slate-900 font-extrabold rounded-xl transition-all shadow-lg flex items-center gap-2 mx-auto"
                  >
                    <Play className="w-5 h-5 fill-current" /> EKSEKUSI FUNGSI
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-slate-900 border border-white/10 p-10 rounded-3xl text-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Simulasi Berhasil!</h3>
                <p className="text-slate-400 mb-6">Kamu telah memahami bagaimana Fungsi (Function) memproses input menjadi output.</p>
              </div>
            )}
          </div>
        )}
      </div>
      {isCompleted && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-green-400 mb-1">Pertemuan 1 Selesai!</h3>
        </motion.div>
      )}
    </div>
  );
};
export default BK8Meeting1;
