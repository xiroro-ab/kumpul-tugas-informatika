import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Info, Gamepad2, RefreshCw, Beaker, FlaskConical, Droplet, Zap } from 'lucide-react';
import Swal from 'sweetalert2';

interface TIK8Meeting2Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const TIK8Meeting2: React.FC<TIK8Meeting2Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  const [step, setStep] = useState(0); 
  // 0 = empty, 1 = red added, 2 = blue added (success)
  const [animating, setAnimating] = useState(false);

  const resetGame = () => {
    setStep(0);
    setAnimating(false);
  };

  const addChemical = (color: 'red' | 'blue') => {
    if (animating) return;

    if (step === 0 && color === 'red') {
      setAnimating(true);
      setTimeout(() => {
        setStep(1);
        setAnimating(false);
      }, 800);
    } else if (step === 1 && color === 'blue') {
      setAnimating(true);
      setTimeout(() => {
        setStep(2);
        setAnimating(false);
        if (!isCompleted) {
          setTimeout(() => {
            Swal.fire({
              icon: 'success',
              title: 'Reaksi Berhasil!',
              text: 'Kamu telah berhasil melakukan simulasi eksperimen di Laboratorium Maya!',
              background: '#0f172a',
              color: '#fff',
              confirmButtonColor: '#0ea5e9'
            });
            onCompleteMeeting();
          }, 1000);
        }
      }, 800);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Urutan Salah!',
        text: step === 0 ? 'Masukkan Zat Asam (Merah) terlebih dahulu.' : 'Zat Asam sudah dimasukkan, sekarang masukkan Zat Basa (Biru).',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#0ea5e9'
      });
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
              <span><strong className="text-white">Laboratorium Maya</strong>: Perangkat lunak simulasi yang mereplikasi lingkungan lab sungguhan.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Keuntungan</strong>: Aman dari bahaya kimia, tidak butuh biaya bahan nyata, dan bisa diulang kapan saja.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <span>Sering digunakan untuk pelajaran Fisika, Kimia, dan Biologi oleh sekolah di seluruh dunia.</span>
            </li>
          </ul>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Beaker className="w-5 h-5 text-pink-400" />
            Dalam Kehidupan Sehari-hari
          </h3>
          <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4 text-slate-300">
            <p className="mb-2">
              Laboratorium maya seperti halnya <strong>Simulator Penerbangan</strong> (Flight Simulator) yang dipakai pilot.
            </p>
            <p>
              Pilot berlatih dalam program komputer agar jika terjadi kesalahan, tidak ada pesawat asli yang rusak. Hal yang sama berlaku untuk eksperimen kimia berbahaya.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2">
              <Gamepad2 className="w-7 h-7 text-indigo-400" />
              Eksperimen Laboratorium Maya
            </h2>
            <p className="text-slate-400">Ikuti instruksi eksperimen: Campurkan Zat Asam (Merah) lalu Zat Basa (Biru) untuk melihat reaksi Netral (Ungu).</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowGame(!showGame)}
              className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl transition-all shadow-lg"
            >
              {showGame ? 'Tutup Lab' : 'Buka Lab Maya'}
            </button>
            {showGame && (
              <button onClick={resetGame} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/10">
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {showGame && (
          <div className="border-t border-white/10 pt-8 max-w-3xl mx-auto text-center">
            
            <div className="bg-slate-900 border-4 border-slate-700 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
              {/* Background Grid Pattern */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
              
              <div className="flex justify-between items-start mb-12 relative z-10">
                {/* Ingredients */}
                <div className="space-y-4">
                  <button 
                    onClick={() => addChemical('red')}
                    disabled={animating || step === 2}
                    className="group flex flex-col items-center p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-red-500/30"
                  >
                    <div className="w-12 h-12 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                      <Droplet className="w-6 h-6 text-red-500 fill-red-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-300">Zat Asam</span>
                  </button>
                  
                  <button 
                    onClick={() => addChemical('blue')}
                    disabled={animating || step === 2}
                    className="group flex flex-col items-center p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-blue-500/30"
                  >
                    <div className="w-12 h-12 bg-blue-500/20 border-2 border-blue-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                      <Droplet className="w-6 h-6 text-blue-500 fill-blue-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-300">Zat Basa</span>
                  </button>
                </div>

                {/* Main Beaker */}
                <div className="flex flex-col items-center relative mt-10">
                  <AnimatePresence>
                    {animating && step === 0 && (
                      <motion.div 
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-10 text-red-500"
                      >
                        <Droplet className="w-8 h-8 fill-current" />
                      </motion.div>
                    )}
                    {animating && step === 1 && (
                      <motion.div 
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-10 text-blue-500"
                      >
                        <Droplet className="w-8 h-8 fill-current" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="relative">
                    <FlaskConical className="w-40 h-40 text-white/20" strokeWidth={1} />
                    
                    {/* Liquid Level */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[70px] flex flex-col justify-end overflow-hidden" style={{ height: '70px', borderRadius: '0 0 20px 20px' }}>
                      <motion.div 
                        className="w-full"
                        initial={{ height: 0 }}
                        animate={{ 
                          height: step === 0 ? '0%' : step === 1 ? '50%' : '100%',
                          backgroundColor: step === 1 ? '#ef4444' : step === 2 ? '#a855f7' : 'transparent'
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                  
                  <div className="w-48 h-2 bg-slate-700 rounded-full mt-2 shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>
                  
                  {step === 2 && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-4 -right-8 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full border border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.8)] flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3 fill-current" /> REAKSI NETRAL
                    </motion.div>
                  )}
                </div>

                <div className="w-20"></div> {/* Spacer for symmetry */}
              </div>

              {step === 2 ? (
                <div className="bg-purple-900/40 border border-purple-500/50 p-4 rounded-xl">
                  <h4 className="text-purple-300 font-bold mb-1">Eksperimen Selesai</h4>
                  <p className="text-sm text-purple-200/70">Zat Asam dan Basa telah tercampur menjadi Netral. Tanpa risiko ledakan nyata!</p>
                </div>
              ) : (
                <div className="bg-slate-800 border border-slate-600 p-4 rounded-xl">
                  <p className="text-sm text-slate-400">Status: {step === 0 ? 'Menunggu Zat Asam (Merah)' : 'Menunggu Zat Basa (Biru)'}</p>
                </div>
              )}
            </div>

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
export default TIK8Meeting2;
