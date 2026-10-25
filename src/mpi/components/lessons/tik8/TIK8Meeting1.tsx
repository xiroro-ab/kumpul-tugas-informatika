import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Info, Gamepad2, RefreshCw, LayoutTemplate, MousePointer2, Settings, Type, AlignLeft, Save } from 'lucide-react';
import Swal from 'sweetalert2';

interface TIK8Meeting1Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const MODULES = [
  { id: 'menu', name: 'Menu Bar', icon: Settings, desc: 'Kumpulan perintah utama (File, Edit, View).' },
  { id: 'toolbar', name: 'Toolbar / Ribbon', icon: Save, desc: 'Tombol fungsi cepat (Save, Bold, Align).' },
  { id: 'workspace', name: 'Workspace / Kanvas', icon: Type, desc: 'Area kerja utama untuk mengetik / desain.' },
  { id: 'status', name: 'Status Bar', icon: AlignLeft, desc: 'Informasi jumlah kata atau halaman di bawah layar.' }
];

const TIK8Meeting1: React.FC<TIK8Meeting1Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [placedModules, setPlacedModules] = useState<{ [key: string]: string }>({});
  const [gameFinished, setGameFinished] = useState(false);

  const resetGame = () => {
    setSelectedModule(null);
    setPlacedModules({});
    setGameFinished(false);
  };

  const handleZoneClick = (zoneId: string) => {
    if (!selectedModule) {
      Swal.fire({
        icon: 'warning',
        title: 'Pilih Modul Dulu!',
        text: 'Silakan klik salah satu modul di sebelah kiri sebelum menempatkannya ke area aplikasi.',
        background: '#0f172a',
        color: '#fff'
      });
      return;
    }

    if (selectedModule === zoneId) {
      const newPlaced = { ...placedModules, [zoneId]: selectedModule };
      setPlacedModules(newPlaced);
      setSelectedModule(null);

      if (Object.keys(newPlaced).length === MODULES.length) {
        setGameFinished(true);
        if (!isCompleted) {
          setTimeout(() => {
            Swal.fire({
              icon: 'success',
              title: 'Aplikasi Berhasil Dirakit!',
              text: 'Kamu berhasil memahami letak objek dan fitur utama pada perangkat lunak aplikasi!',
              background: '#0f172a',
              color: '#fff',
              confirmButtonColor: '#0ea5e9'
            });
            onCompleteMeeting();
          }, 800);
        }
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Posisi Salah!',
        text: 'Modul ini tidak cocok diletakkan di area tersebut. Coba perhatikan lagi fungsinya!',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#0ea5e9'
      });
      setSelectedModule(null);
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
              <span><strong className="text-white">Objek Aplikasi</strong>: Elemen visual pembentuk UI (tombol, teks, gambar).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Fitur Aplikasi</strong>: Kemampuan/fungsi dari objek tersebut (misal fungsi menyimpan dokumen).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <span>Setiap aplikasi pengolah kata/angka memiliki struktur dasar seperti Menu Bar, Toolbar, Workspace, dan Status Bar.</span>
            </li>
          </ul>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-purple-400" />
            Dalam Kehidupan Sehari-hari
          </h3>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-slate-300">
            <p className="mb-2">
              Memahami fitur aplikasi sama seperti <strong>mengenali dashboard mobil</strong>.
            </p>
            <p>
              Setir untuk membelokkan (fitur kontrol), spidometer untuk melihat kecepatan (status bar), dan tuas lampu untuk penerangan (toolbar cepat).
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2">
              <Gamepad2 className="w-7 h-7 text-indigo-400" />
              Simulasi Rakit UI Aplikasi
            </h2>
            <p className="text-slate-400">Pilih modul di sebelah kiri, lalu klik area kerangka aplikasi yang tepat di sebelah kanan!</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowGame(!showGame)}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all shadow-lg"
            >
              {showGame ? 'Tutup Simulasi' : 'Mulai Merakit'}
            </button>
            {showGame && (
              <button onClick={resetGame} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/10">
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {showGame && (
          <div className="border-t border-white/10 pt-8 max-w-5xl mx-auto flex flex-col lg:flex-row gap-8">
            {/* Parts Sidebar */}
            <div className="w-full lg:w-1/3 space-y-4">
              <h4 className="text-slate-400 font-bold mb-4 flex items-center gap-2">
                <MousePointer2 className="w-4 h-4" /> 1. Pilih Modul
              </h4>
              {MODULES.map((mod) => {
                const isPlaced = !!placedModules[mod.id];
                const isSelected = selectedModule === mod.id;
                
                return (
                  <button
                    key={mod.id}
                    onClick={() => !isPlaced && setSelectedModule(mod.id)}
                    disabled={isPlaced}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isPlaced 
                        ? 'bg-slate-800/50 border-slate-700 opacity-30 cursor-not-allowed grayscale' 
                        : isSelected
                          ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-105'
                          : 'bg-slate-800 border-slate-600 hover:border-indigo-400 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <mod.icon className={`w-5 h-5 ${isPlaced ? 'text-slate-500' : isSelected ? 'text-white' : 'text-indigo-400'}`} />
                      <span className={`font-bold ${isPlaced ? 'text-slate-500' : 'text-white'}`}>{mod.name}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{mod.desc}</p>
                  </button>
                )
              })}
            </div>

            {/* Wireframe Canvas */}
            <div className="w-full lg:w-2/3">
              <h4 className="text-slate-400 font-bold mb-4 flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4" /> 2. Tempatkan ke Kerangka
              </h4>
              <div className="bg-slate-900 border-4 border-slate-700 rounded-xl overflow-hidden shadow-2xl h-[450px] flex flex-col p-2 gap-2 relative">
                
                {/* Menu Zone */}
                <button 
                  onClick={() => handleZoneClick('menu')}
                  className={`w-full h-10 border-2 border-dashed rounded-lg flex items-center justify-center transition-all ${placedModules['menu'] ? 'border-solid border-indigo-500 bg-indigo-900/40 cursor-default' : selectedModule ? 'border-indigo-400 bg-indigo-500/10 cursor-pointer animate-pulse' : 'border-slate-600 bg-slate-800 cursor-pointer hover:bg-slate-700'}`}
                >
                  {placedModules['menu'] ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex gap-4 text-xs font-medium text-slate-300">
                      <span>File</span><span>Edit</span><span>View</span><span>Insert</span>
                    </motion.div>
                  ) : (
                    <span className="text-slate-500 text-sm font-bold tracking-widest uppercase">Area Menu Bar</span>
                  )}
                </button>

                {/* Toolbar Zone */}
                <button 
                  onClick={() => handleZoneClick('toolbar')}
                  className={`w-full h-16 border-2 border-dashed rounded-lg flex items-center justify-center transition-all ${placedModules['toolbar'] ? 'border-solid border-indigo-500 bg-indigo-900/40 cursor-default' : selectedModule ? 'border-indigo-400 bg-indigo-500/10 cursor-pointer animate-pulse' : 'border-slate-600 bg-slate-800 cursor-pointer hover:bg-slate-700'}`}
                >
                  {placedModules['toolbar'] ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex gap-2">
                      <div className="w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center"><Save className="w-4 h-4 text-slate-300" /></div>
                      <div className="w-1 h-8 border-l border-slate-700 mx-1"></div>
                      <div className="w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center font-bold text-slate-300">B</div>
                      <div className="w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center italic text-slate-300 font-serif">I</div>
                      <div className="w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center underline text-slate-300">U</div>
                    </motion.div>
                  ) : (
                    <span className="text-slate-500 text-sm font-bold tracking-widest uppercase">Area Toolbar</span>
                  )}
                </button>

                {/* Workspace Zone */}
                <button 
                  onClick={() => handleZoneClick('workspace')}
                  className={`w-full flex-1 border-2 border-dashed rounded-lg flex items-center justify-center transition-all overflow-hidden relative ${placedModules['workspace'] ? 'border-solid border-indigo-500 bg-white cursor-default' : selectedModule ? 'border-indigo-400 bg-indigo-500/10 cursor-pointer animate-pulse' : 'border-slate-600 bg-slate-800 cursor-pointer hover:bg-slate-700'}`}
                >
                  {placedModules['workspace'] ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-4 bg-white flex flex-col gap-2">
                      <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                      <div className="h-4 w-full bg-slate-200 rounded"></div>
                      <div className="h-4 w-5/6 bg-slate-200 rounded"></div>
                      <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                    </motion.div>
                  ) : (
                    <span className="text-slate-500 text-sm font-bold tracking-widest uppercase">Area Workspace / Kanvas</span>
                  )}
                </button>

                {/* Status Zone */}
                <button 
                  onClick={() => handleZoneClick('status')}
                  className={`w-full h-8 border-2 border-dashed rounded-lg flex items-center justify-between px-4 transition-all ${placedModules['status'] ? 'border-solid border-indigo-500 bg-indigo-900/40 cursor-default' : selectedModule ? 'border-indigo-400 bg-indigo-500/10 cursor-pointer animate-pulse' : 'border-slate-600 bg-slate-800 cursor-pointer hover:bg-slate-700'}`}
                >
                  {placedModules['status'] ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-between w-full text-xs text-slate-400">
                      <span>Page 1 of 1 | 340 words</span>
                      <span>100% Zoom</span>
                    </motion.div>
                  ) : (
                    <span className="text-slate-500 text-sm font-bold tracking-widest uppercase mx-auto">Area Status Bar</span>
                  )}
                </button>

                {/* Overlay Success */}
                <AnimatePresence>
                  {gameFinished && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-green-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center"
                    >
                      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                        <CheckCircle className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Software Aktif!</h3>
                      <p className="text-green-200 font-medium max-w-sm">Semua modul fitur telah diletakkan dengan sempurna. UI aplikasi kini siap digunakan oleh pengguna.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
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
export default TIK8Meeting1;
