import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, CheckCircle, ArrowRight, BookOpen, Presentation, Gamepad2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import Swal from 'sweetalert2';

interface APMeeting2Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

interface Block {
  id: string;
  name: string;
  category: 'Event' | 'Motion' | 'Looks' | 'Control';
  color: string;
}

interface Function {
  id: string;
  desc: string;
  matchId: string;
}

const APMeeting2: React.FC<APMeeting2Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  
  const blocks: Block[] = [
    { id: 'b1', name: 'When green flag clicked', category: 'Event', color: 'bg-yellow-500' },
    { id: 'b2', name: 'Move 10 steps', category: 'Motion', color: 'bg-blue-500' },
    { id: 'b3', name: 'Say "Hello!"', category: 'Looks', color: 'bg-purple-500' },
    { id: 'b4', name: 'Forever', category: 'Control', color: 'bg-orange-500' }
  ];

  const functions: Function[] = [
    { id: 'f1', desc: 'Memicu berjalannya program', matchId: 'b1' },
    { id: 'f2', desc: 'Menggerakkan karakter', matchId: 'b2' },
    { id: 'f3', desc: 'Menampilkan teks dialog', matchId: 'b3' },
    { id: 'f4', desc: 'Mengulang instruksi tanpa henti', matchId: 'b4' }
  ];

  const [shuffledFuncs, setShuffledFuncs] = useState<Function[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<{blockId: string, funcId: string}[]>([]);

  useEffect(() => {
    setShuffledFuncs([...functions].sort(() => Math.random() - 0.5));
  }, []);

  const handleBlockClick = (id: string) => {
    if (matchedPairs.some(p => p.blockId === id)) return;
    setSelectedBlock(id);
  };

  const handleFuncClick = (funcId: string, matchId: string) => {
    if (!selectedBlock) return;
    if (matchedPairs.some(p => p.funcId === funcId)) return;

    if (selectedBlock === matchId) {
      const newMatched = [...matchedPairs, { blockId: selectedBlock, funcId }];
      setMatchedPairs(newMatched);
      setSelectedBlock(null);

      if (newMatched.length === blocks.length) {
        Swal.fire({
          icon: 'success',
          title: 'Brilian!',
          text: 'Kamu berhasil memasangkan semua blok dengan fungsinya!',
          background: '#0f172a',
          color: '#fff',
          confirmButtonColor: '#22c55e'
        }).then(() => {
          if (!isCompleted) onCompleteMeeting();
        });
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Kurang Tepat',
        text: 'Coba periksa lagi fungsi dari blok tersebut!',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#0ea5e9',
        timer: 1500,
        showConfirmButton: false
      });
      setSelectedBlock(null);
    }
  };

  const resetGame = () => {
    setMatchedPairs([]);
    setSelectedBlock(null);
    setShuffledFuncs([...functions].sort(() => Math.random() - 0.5));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 flex items-center gap-3">
          <Presentation className="w-8 h-8 text-cyan-400" />
          Materi: Pemrograman Visual (Scratch)
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
                <span><strong className="text-white">Scratch</strong> adalah bahasa pemrograman visual interaktif yang menggunakan blok-blok (drag and drop).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink mt-0.5" />
                <span><strong className="text-white">Sprite</strong>: Karakter atau objek yang kita program.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink mt-0.5" />
                <span><strong className="text-white">Script</strong>: Kumpulan blok kode yang digabungkan untuk memberikan instruksi pada Sprite.</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
            <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Kategori Blok Utama
            </h3>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500 shrink mt-1" />
                <span><strong className="text-white">Motion (Biru):</strong> Untuk pergerakan karakter.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500 shrink mt-1" />
                <span><strong className="text-white">Events (Kuning):</strong> Pemicu berjalannya kode (contoh: bendera hijau).</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500 shrink mt-1" />
                <span><strong className="text-white">Control (Oranye):</strong> Pengaturan struktur (contoh: ulangi, tunggu).</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2">
              <Gamepad2 className="w-7 h-7 text-indigo-400" />
              Misi: Pasangkan Blok Scratch
            </h2>
            <p className="text-slate-400">Pilih satu Blok di kiri, lalu klik Fungsi yang sesuai di sebelah kanan!</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0">
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
            <div className="grid md:grid-cols-2 gap-8">
              {/* Blocks */}
              <div className="space-y-4">
                <h3 className="text-white font-bold text-center mb-4">Blok Kode</h3>
                {blocks.map(b => {
                  const isMatched = matchedPairs.some(p => p.blockId === b.id);
                  const isSelected = selectedBlock === b.id;
                  
                  return (
                    <div 
                      key={b.id}
                      onClick={() => handleBlockClick(b.id)}
                      className={`
                        p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between
                        ${isMatched ? 'opacity-50 grayscale border-slate-700 bg-slate-800' : 
                          isSelected ? `border-white ${b.color} shadow-lg scale-105` : 
                          `border-transparent ${b.color} hover:brightness-110 opacity-90`}
                      `}
                    >
                      <span className="text-white font-bold">{b.name}</span>
                      {isMatched && <CheckCircle className="w-5 h-5 text-green-400" />}
                    </div>
                  );
                })}
              </div>

              {/* Functions */}
              <div className="space-y-4">
                <h3 className="text-white font-bold text-center mb-4">Fungsi</h3>
                {shuffledFuncs.map(f => {
                  const isMatched = matchedPairs.some(p => p.funcId === f.id);
                  
                  return (
                    <div 
                      key={f.id}
                      onClick={() => handleFuncClick(f.id, f.matchId)}
                      className={`
                        p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between
                        ${isMatched ? 'bg-green-500/20 border-green-500/50 text-slate-400' : 
                          'bg-slate-800 border-white/10 text-white hover:border-cyan-400 hover:bg-slate-700'}
                      `}
                    >
                      <span className="text-sm font-medium">{f.desc}</span>
                      {isMatched && <CheckCircle className="w-5 h-5 text-green-400 shrink ml-2" />}
                    </div>
                  );
                })}
              </div>
            </div>
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
          <p className="text-slate-300">Kamu telah mengenal lingkungan dan blok instruksi visual.</p>
        </motion.div>
      )}
    </div>
  );
};

export default APMeeting2;
