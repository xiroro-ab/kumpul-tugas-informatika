import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Info, Gamepad2, RefreshCw, Lightbulb, Zap, Hammer, Layers, LayoutTemplate, Activity } from 'lucide-react';
import Swal from 'sweetalert2';

interface BK8Meeting3Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const PILLARS = [
  { id: 'dekomposisi', name: 'Dekomposisi', icon: Layers, desc: 'Memecah masalah menjadi bagian kecil.' },
  { id: 'pola', name: 'Pengenalan Pola', icon: Activity, desc: 'Mencari kesamaan/pola dalam masalah.' },
  { id: 'abstraksi', name: 'Abstraksi', icon: LayoutTemplate, desc: 'Mengabaikan detail yang tidak penting.' },
  { id: 'algoritma', name: 'Algoritma', icon: Hammer, desc: 'Menyusun langkah penyelesaian.' }
];

const CORRECT_ORDER = ['dekomposisi', 'pola', 'abstraksi', 'algoritma'];

const BK8Meeting3: React.FC<BK8Meeting3Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  const [selectedPillars, setSelectedPillars] = useState<string[]>([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [error, setError] = useState(false);

  const resetGame = () => {
    setSelectedPillars([]);
    setGameFinished(false);
    setError(false);
  };

  const handleSelect = (id: string) => {
    if (gameFinished || selectedPillars.includes(id)) return;

    const nextIndex = selectedPillars.length;
    if (CORRECT_ORDER[nextIndex] === id) {
      const newSelection = [...selectedPillars, id];
      setSelectedPillars(newSelection);
      setError(false);

      if (newSelection.length === CORRECT_ORDER.length) {
        setGameFinished(true);
        if (!isCompleted) {
          setTimeout(() => {
            Swal.fire({
              icon: 'success',
              title: 'Konstruksi Berhasil!',
              text: 'Kamu berhasil menyusun keempat pilar BK dalam urutan yang tepat untuk menyelesaikan masalah numerasi!',
              background: '#0f172a',
              color: '#fff',
              confirmButtonColor: '#0ea5e9'
            });
            onCompleteMeeting();
          }, 500);
        }
      }
    } else {
      setError(true);
      Swal.fire({
        icon: 'error',
        title: 'Konstruksi Runtuh!',
        text: 'Urutan pilar salah. Kamu tidak bisa menyusun algoritma sebelum memecah masalah (Dekomposisi). Coba lagi dari awal!',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#0ea5e9'
      });
      setTimeout(() => setSelectedPillars([]), 1000);
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
              <span><strong className="text-white">Implementasi Numerasi</strong>: Memecahkan masalah matematika menggunakan logika sistematis komputer.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <span>Dekomposisi dan Pengenalan Pola membantu kita memecah perhitungan kompleks dan mencari rumus berulang.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <span>Abstraksi dan Algoritma membantu menyederhanakan variabel dan membuat urutan perhitungan secara otomatis.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Dalam Kehidupan Sehari-hari
          </h3>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-slate-300">
            <p className="mb-2">
              Saat menghitung total belanja bulanan, urutan berpikirmu pasti:
              1. <strong>Pisahkan</strong> belanjaan per kategori (Dekomposisi).
              2. <strong>Cari</strong> diskon yang sama/berlaku (Pola).
            </p>
            <p>
              3. <strong>Abaikan</strong> warna/merk barang, fokus pada harga (Abstraksi).
              4. <strong>Jumlahkan</strong> semuanya berurutan dari atas ke bawah (Algoritma).
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2">
              <Gamepad2 className="w-7 h-7 text-indigo-400" />
              Simulasi Konstruksi Solusi
            </h2>
            <p className="text-slate-400">Susun 4 Pilar Berpikir Komputasional secara berurutan untuk membangun jembatan solusi masalah numerasi!</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setShowGame(!showGame)}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl transition-all shadow-lg"
            >
              {showGame ? 'Tutup Simulasi' : 'Mulai Konstruksi'}
            </button>
            {showGame && (
              <button onClick={resetGame} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/10">
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {showGame && (
          <div className="border-t border-white/10 pt-8 max-w-4xl mx-auto">
            {!gameFinished ? (
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Available Pillars (Randomized roughly in UI) */}
                <div className="w-full lg:w-1/3 space-y-4">
                  <h4 className="text-slate-400 font-bold mb-4 text-center lg:text-left">Pilih Pilar (Sesuai Urutan):</h4>
                  {PILLARS.map((pillar) => {
                    const isSelected = selectedPillars.includes(pillar.id);
                    return (
                      <button
                        key={pillar.id}
                        onClick={() => handleSelect(pillar.id)}
                        disabled={isSelected}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected 
                            ? 'bg-slate-800/50 border-slate-700 opacity-50 grayscale'
                            : 'bg-slate-800 border-slate-600 hover:border-yellow-400 hover:bg-slate-700 shadow-md'
                        }`}
                      >
                        <pillar.icon className={`w-8 h-8 ${isSelected ? 'text-slate-500' : 'text-yellow-400'}`} />
                        <div>
                          <div className={`font-bold ${isSelected ? 'text-slate-500' : 'text-white'}`}>{pillar.name}</div>
                          <div className="text-xs text-slate-400">{pillar.desc}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Construction Site */}
                <div className="w-full lg:w-2/3 bg-slate-900 border-4 border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-end min-h-[300px]">
                  <div className="text-center absolute top-6 left-0 right-0">
                    <h4 className="text-slate-500 font-bold tracking-widest uppercase">Area Konstruksi Solusi</h4>
                  </div>
                  
                  <div className="flex justify-between items-end gap-2 z-10 mt-12">
                    {[0, 1, 2, 3].map((index) => {
                      const pillarId = selectedPillars[index];
                      const pillarData = PILLARS.find(p => p.id === pillarId);
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                          <AnimatePresence>
                            {pillarData && (
                              <motion.div
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className={`w-full max-w-[120px] aspect-square rounded-t-xl border-2 border-b-0 flex flex-col items-center justify-center p-2 text-center shadow-[0_-5px_15px_rgba(0,0,0,0.5)] ${error && index === selectedPillars.length - 1 ? 'bg-red-900/80 border-red-500' : 'bg-yellow-600 border-yellow-400'}`}
                              >
                                <pillarData.icon className="w-8 h-8 text-white mb-2" />
                                <span className="text-xs font-bold text-white hidden sm:block">{pillarData.name}</span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <div className="w-full h-4 bg-slate-700 rounded-t-sm border-t border-slate-500 relative">
                            <div className="absolute inset-x-0 bottom-0 h-2 bg-slate-900/50"></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-slate-900 border border-white/10 p-10 rounded-3xl text-center">
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-10 h-10 text-yellow-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Konstruksi Selesai!</h3>
                <p className="text-slate-400 mb-6">Kamu berhasil menyusun urutan Berpikir Komputasional yang benar. Ini adalah fondasi dari semua pemecahan masalah di dunia informatika!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isCompleted && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-green-400 mb-1">Pertemuan 3 Selesai!</h3>
        </motion.div>
      )}
    </div>
  );
};

export default BK8Meeting3;
