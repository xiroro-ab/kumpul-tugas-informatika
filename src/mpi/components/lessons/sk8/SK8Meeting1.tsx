import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, CheckCircle, GripVertical, Gamepad2, RefreshCcw } from 'lucide-react';
import Swal from 'sweetalert2';

interface SK8Meeting1Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const HARDWARE_ITEMS = [
  { name: 'Mouse', embed: 'ed74385debca426f83545edc41ad0eb9', icon: '🖱️', type: 'Input' },
  { name: 'Keyboard', embed: '26f060f2b0f142d8b602afc461dc2c53', icon: '⌨️', type: 'Input' },
  { name: 'CPU', embed: 'a872fc9e704248969064fe79dbf82917', icon: '🧠', type: 'Process' },
  { name: 'RAM', embed: '6f37195ac2b84b21a901471485351b37', icon: '💾', type: 'Process' },
  { name: 'Monitor', embed: 'f84d24b6df3648d884fd9be9c8007dd4', icon: '🖥️', type: 'Output' },
  { name: 'Speaker', embed: 'f3209a6a45b844df92560099f982a508', icon: '🔊', type: 'Output' },
];

const SK8Meeting1: React.FC<SK8Meeting1Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [activeItem, setActiveItem] = useState(0);
  const [showGame, setShowGame] = useState(false);
  
  // Drag & drop game state
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const resetGame = () => {
    setMatches({});
    setDraggedItem(null);
  };

  const handleDragStart = (e: React.DragEvent, name: string) => {
    e.dataTransfer.setData('text/plain', name);
    setDraggedItem(name);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetName: string) => {
    e.preventDefault();
    const sourceName = e.dataTransfer.getData('text/plain');
    setDraggedItem(null);
    
    if (sourceName === targetName) {
      setMatches(prev => ({ ...prev, [targetName]: sourceName }));
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Kurang Tepat',
        text: `Itu bukan gambar untuk ${targetName}. Coba lagi!`,
        background: '#1e293b',
        color: '#fff'
      });
    }
  };

  const allMatched = HARDWARE_ITEMS.every(item => matches[item.name]);

  const handleComplete = () => {
    if (allMatched) {
      Swal.fire({
        icon: 'success',
        title: 'Luar Biasa!',
        text: 'Kamu telah berhasil memasangkan semua perangkat keras.',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      }).then(() => {
        onCompleteMeeting();
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Cpu className="w-6 h-6 text-cyan-400" />
          Eksplorasi Perangkat Keras (Hardware)
        </h3>
        <p className="text-slate-300 leading-relaxed mb-6">
          <strong>Hardware</strong> adalah komponen fisik pada komputer yang dapat disentuh dan dilihat. Hardware terbagi menjadi perangkat Input (Masukan), Proses, dan Output (Keluaran).
          Silakan eksplorasi model 3D di bawah ini untuk melihat detail setiap komponen.
        </p>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-2">
            {HARDWARE_ITEMS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setActiveItem(idx)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all font-semibold flex items-center gap-3 ${
                  activeItem === idx 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' 
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-transparent'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <div className="text-white">{item.name}</div>
                  <div className="text-xs text-slate-500">Perangkat {item.type}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="lg:col-span-2">
            <div className="bg-black/50 rounded-2xl border border-white/10 overflow-hidden h-[400px] relative">
              <iframe 
                title={HARDWARE_ITEMS[activeItem].name}
                className="w-full h-full"
                src={`https://sketchfab.com/models/${HARDWARE_ITEMS[activeItem].embed}/embed?autostart=1&transparent=1&ui_theme=dark`}
                frameBorder="0"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2">
              <Gamepad2 className="w-7 h-7 text-indigo-400" />
              Simulasi: Rakit Hardware
            </h2>
            <p className="text-slate-400">Tarik nama perangkat di bawah ini dan pasangkan pada ikon/bayangan yang sesuai!</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowGame(!showGame)}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all shadow-lg"
            >
              {showGame ? 'Tutup Simulasi' : 'Mulai Simulasi'}
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
            <div className="flex flex-wrap gap-4 justify-center mb-12 min-h-[60px]">
              {HARDWARE_ITEMS.map((item) => (
                !matches[item.name] && (
                  <div
                    key={`drag-${item.name}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.name)}
                    onDragEnd={() => setDraggedItem(null)}
                    className={`px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-grab active:cursor-grabbing shadow-lg border border-indigo-400 transition-transform ${draggedItem === item.name ? 'opacity-50 scale-95' : 'hover:-translate-y-1'}`}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 opacity-50" />
                      {item.name}
                    </div>
                  </div>
                )
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {HARDWARE_ITEMS.map((item) => {
                const isMatched = !!matches[item.name];
                return (
                  <div
                    key={`drop-${item.name}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, item.name)}
                    className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all h-40 ${
                      isMatched 
                        ? 'bg-green-500/20 border-green-500/50' 
                        : 'bg-slate-800/50 border-slate-600 hover:border-cyan-500/50'
                    }`}
                  >
                    <div className="text-5xl mb-2">{item.icon}</div>
                    {isMatched ? (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-green-400 font-bold mt-2"
                      >
                        {item.name} ✓
                      </motion.div>
                    ) : (
                      <div className="text-slate-500 text-sm mt-2 font-medium">???</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center pt-10">
              <button
                onClick={handleComplete}
                disabled={!allMatched || isCompleted}
                className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl ${
                  isCompleted 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-not-allowed' 
                    : allMatched 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white transform hover:scale-105 animate-pulse'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <CheckCircle className="w-6 h-6" />
                {isCompleted ? 'Selesai' : 'Selesaikan Simulasi'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SK8Meeting1;
