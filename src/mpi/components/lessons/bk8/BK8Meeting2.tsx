import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Info, Gamepad2, RefreshCw, Hash, Lock, Unlock } from 'lucide-react';
import Swal from 'sweetalert2';

interface BK8Meeting2Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const STAGES = [
  { code: '1010', type: 'Biner (Basis 2)', answer: 10, options: [8, 10, 12, 1010] },
  { code: 'F', type: 'Heksadesimal (Basis 16)', answer: 15, options: [10, 15, 16, 25] },
  { code: '1100', type: 'Biner (Basis 2)', answer: 12, options: [10, 11, 12, 14] },
  { code: '14', type: 'Oktal (Basis 8)', answer: 12, options: [14, 12, 10, 8] }
];

const BK8Meeting2: React.FC<BK8Meeting2Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  const [stage, setStage] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [shake, setShake] = useState(false);

  const currentStage = STAGES[stage];

  const resetGame = () => {
    setStage(0);
    setUnlocked(false);
    setAnimating(false);
    setShake(false);
  };

  const handleDial = (val: number) => {
    if (animating) return;
    
    if (val === currentStage.answer) {
      setAnimating(true);
      Swal.fire({
        title: 'Akses Diterima!',
        icon: 'success',
        timer: 1000,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff'
      });
      
      setTimeout(() => {
        if (stage < STAGES.length - 1) {
          setStage(s => s + 1);
        } else {
          setUnlocked(true);
          if (!isCompleted) {
            Swal.fire({
              title: 'Brankas Terbuka!',
              text: 'Kamu berhasil meretas brankas dengan ilmu konversi sistem bilangan!',
              icon: 'success',
              background: '#0f172a',
              color: '#fff',
              confirmButtonColor: '#0ea5e9'
            });
            onCompleteMeeting();
          }
        }
        setAnimating(false);
      }, 1000);
    } else {
      setShake(true);
      Swal.fire({
        title: 'Akses Ditolak!',
        text: 'Konversi bilangan salah. Coba hitung lagi!',
        icon: 'error',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#0ea5e9'
      });
      setTimeout(() => setShake(false), 500);
    }
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
              <span><strong className="text-white">Numerasi & Himpunan</strong>: Kemampuan memproses data angka dan mengelompokkan data ke dalam himpunan tertentu.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Biner</strong>: Sistem bilangan basis 2 (hanya angka 0 dan 1), bahasa asli mesin komputer.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Desimal & Heksadesimal</strong>: Basis 10 (0-9) yang kita pakai sehari-hari, dan Basis 16 (0-9, A-F) yang sering dipakai dalam kode warna/memori.</span>
            </li>
          </ul>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Hash className="w-5 h-5 text-emerald-400" />
            Dalam Kehidupan Sehari-hari
          </h3>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-slate-300">
            <p className="mb-2">
              <strong>Himpunan</strong> kita gunakan saat memisahkan pakaian (misal himpunan kaos vs kemeja).
            </p>
            <p>
              <strong>Sistem Bilangan</strong> ada dimana-mana. Komputer menyimpan datamu sebagai Biner, desainer grafis mewarnai dengan Heksadesimal (#FF0000), dan kamu berbelanja dengan Desimal.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2">
              <Gamepad2 className="w-7 h-7 text-indigo-400" />
              Simulasi Retas Brankas
            </h2>
            <p className="text-slate-400">Konversi kode keamanan dari berbagai sistem bilangan ke bentuk Desimal untuk membuka brankas!</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowGame(!showGame)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg"
            >
              {showGame ? 'Tutup Simulasi' : 'Mulai Simulasi'}
            </button>
            {showGame && (
              <button onClick={resetGame} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/10">
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {showGame && (
          <div className="border-t border-white/10 pt-8 max-w-2xl mx-auto text-center">
            {!unlocked ? (
              <motion.div 
                className={`bg-slate-800 border-4 border-slate-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                
                <div className="flex justify-between items-center mb-6 text-slate-400 font-bold border-b border-slate-700 pb-4">
                  <span className="flex items-center gap-2"><Lock className="w-5 h-5 text-red-400" /> Security Level: {stage + 1}/{STAGES.length}</span>
                  <span className="text-xs bg-slate-700 px-2 py-1 rounded">SYSTEM.LOCKED</span>
                </div>

                <div className="mb-8">
                  <p className="text-cyan-400 font-mono text-sm mb-2">ENCRYPTED_CODE [{currentStage.type}]</p>
                  <div className="text-5xl font-mono font-bold text-white tracking-widest bg-black/50 py-6 rounded-xl border border-white/10">
                    {currentStage.code}
                  </div>
                </div>

                <div>
                  <p className="text-slate-400 mb-4 font-medium">Masukkan Nilai Desimal:</p>
                  <div className="grid grid-cols-2 gap-4">
                    {currentStage.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleDial(opt)}
                        disabled={animating}
                        className="bg-slate-700 hover:bg-cyan-600 text-white font-mono text-2xl font-bold py-4 rounded-xl border border-slate-500 hover:border-cyan-400 transition-all shadow-[0_4px_0_rgb(51,65,85)] hover:shadow-[0_0_0_rgb(51,65,85)] hover:translate-y-1"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-900 border border-white/10 p-10 rounded-3xl text-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-500/50">
                  <Unlock className="w-12 h-12 text-green-400" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">Akses Terbuka!</h3>
                <p className="text-slate-400 mb-6">Kemampuan numerasimu telah berhasil mengkonversi semua kode rahasia.</p>
              </div>
            )}
          </div>
        )}
      </div>
      {isCompleted && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-green-400 mb-1">Pertemuan 2 Selesai!</h3>
        </motion.div>
      )}
    </div>
  );
};
export default BK8Meeting2;
