import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Brain, Target, Video, ChevronDown, ChevronUp } from 'lucide-react';
import Swal from 'sweetalert2';

interface Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function BK9Meeting3({ onCompleteMeeting, isCompleted }: Props) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(true);
  
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [robotPos, setRobotPos] = useState({ x: 0, y: 0 });

  const runCode = () => {
    // Determine target based on level
    let targetX = 0;
    let targetY = 0;
    
    if (level === 1) { targetX = 2; targetY = 0; }
    if (level === 2) { targetX = 2; targetY = -1; }
    if (level === 3) { targetX = 1; targetY = -2; }

    let currX = 0;
    let currY = 0;
    
    for (let instr of instructions) {
      if (instr === 'MAJU') currX += 1;
      if (instr === 'MUNDUR') currX -= 1;
      if (instr === 'NAIK') currY -= 1;
      if (instr === 'TURUN') currY += 1;
    }

    setRobotPos({ x: currX, y: currY });

    setTimeout(() => {
      if (currX === targetX && currY === targetY) {
        if (instructions[instructions.length - 1] !== 'AMBIL BATERAI') {
          Swal.fire('Hampir!', 'Robot sampai di tujuan, tapi kamu lupa perintah AMBIL BATERAI di akhir!', 'warning');
          return;
        }

        Swal.fire('Berhasil!', `Robot mengambil baterai untuk Level ${level}!`, 'success').then(() => {
           if (level < 3) {
             setLevel(level + 1);
             setScore(score + 100);
             setInstructions([]);
             setRobotPos({x: 0, y: 0});
           } else {
             if (score < 300) setScore(300);
             Swal.fire('Luar Biasa!', 'Kamu telah memprogram robot dengan algoritma sekuensial!', 'success');
           }
        });
      } else {
        Swal.fire('Gagal!', 'Posisi robot belum tepat atau algoritma salah urutan.', 'error').then(() => {
           setInstructions([]);
           setRobotPos({x: 0, y: 0});
        });
      }
    }, 600);
  };

  const addInstr = (i: string) => {
    if (instructions.length < 6) {
      setInstructions([...instructions, i]);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -z-10" />
        
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Brain className="w-8 h-8 text-cyan-400" />
          Materi 3: Algoritma
        </h2>

        <div className="prose prose-invert max-w-none text-slate-300">
          <p className="text-lg leading-relaxed mb-6">
            Selamat datang di pembelajaran Materi 3: Algoritma.
          </p>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
            <h4 className="text-cyan-400 font-bold mb-2">Intisari Materi:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Definisi:</strong> Algoritma adalah urutan langkah logis untuk menyelesaikan suatu masalah.</li>
              <li><strong>Sekuensial:</strong> Algoritma dijalankan secara berurutan dari atas ke bawah.</li>
              <li><strong>Flowchart:</strong> Diagram alir untuk merepresentasikan algoritma (menggunakan simbol).</li>
              <li><strong>Pseudocode:</strong> Teks algoritma yang menyerupai bahasa pemrograman.</li>
            </ul>
            <h4 className="text-cyan-400 font-bold mt-4 mb-2">Contoh dalam Kehidupan Sehari-hari:</h4>
            <p>Resep memasak mie instan: Buka bungkus -{'>'} Rebus air -{'>'} Masukkan mie -{'>'} Tiriskan -{'>'} Campur bumbu. (Urutan tidak boleh ditukar).</p>
          </div>
        </div>

        {/* Video Accordion */}
        <div className="mt-8 border border-white/10 bg-white/5 rounded-xl overflow-hidden">
          <button 
            onClick={() => setIsVideoOpen(!isVideoOpen)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Video className="w-6 h-6 text-cyan-400" />
              <span className="font-bold text-lg text-white">Video Pembelajaran</span>
            </div>
            {isVideoOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          <AnimatePresence>
            {isVideoOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="p-6 border-t border-white/10 flex flex-col gap-6">
                  <div className="aspect-video rounded-xl overflow-hidden shadow-2xl">
                    <iframe width="100%" height="100%" src="https://www.youtube.com/embed/N09N6KxG-0k?list=PLDheW52FZRUnqarW2koDXNy4Z2HoHBoPP" title="YouTube video" frameBorder="0" allowFullScreen></iframe>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Game Accordion */}
        <div className="mt-4 border border-white/10 bg-white/5 rounded-xl overflow-hidden">
          <button 
            onClick={() => setIsGameOpen(!isGameOpen)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-yellow-400" />
              <span className="font-bold text-lg text-white">Mini Game Interaktif: Master Robot Algoritma</span>
            </div>
            {isGameOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          <AnimatePresence>
            {isGameOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="p-6 border-t border-white/10 flex flex-col gap-6 relative">
                  <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-white/10">
                    <div className="text-yellow-400 font-bold text-lg">Level: {level}/3</div>
                    <div className="text-green-400 font-bold text-lg">Skor: {score}</div>
                  </div>
                  
                  <p className="text-slate-300 mb-2 text-sm text-center">Susun algoritma (maks 6 blok) dengan urutan yang BENAR untuk mengambil baterai, lalu klik JALANKAN PROGRAM.</p>
                  
                  <div className="bg-slate-800/50 p-6 rounded-xl w-full flex flex-col md:flex-row gap-6">
                    
                    <div className="w-full md:w-1/2 flex flex-col gap-4">
                       <h4 className="text-white font-bold text-sm">Pilih Instruksi:</h4>
                       <div className="grid grid-cols-2 gap-2">
                         <button onClick={() => addInstr('MAJU')} className="px-2 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold text-xs shadow">MAJU →</button>
                         <button onClick={() => addInstr('MUNDUR')} className="px-2 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold text-xs shadow">MUNDUR ←</button>
                         <button onClick={() => addInstr('NAIK')} className="px-2 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold text-xs shadow">NAIK ↑</button>
                         <button onClick={() => addInstr('TURUN')} className="px-2 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold text-xs shadow">TURUN ↓</button>
                         <button onClick={() => addInstr('AMBIL BATERAI')} className="col-span-2 px-2 py-2 bg-green-600 hover:bg-green-500 rounded text-white font-bold text-xs shadow">AMBIL BATERAI 🔋</button>
                       </div>
                       
                       <div className="bg-slate-900 p-4 rounded-lg min-h-[150px] border border-white/10">
                         <h4 className="text-slate-400 font-bold text-xs mb-2">Program Kamu:</h4>
                         <div className="flex flex-col gap-1">
                            {instructions.map((ins, idx) => (
                               <div key={idx} className="bg-slate-700 text-white text-xs px-2 py-1 rounded">{idx+1}. {ins}</div>
                            ))}
                         </div>
                       </div>
                       
                       <div className="flex gap-2">
                         <button onClick={() => setInstructions([])} className="flex-1 py-2 bg-red-500/20 text-red-400 rounded text-sm font-bold border border-red-500/50 hover:bg-red-500/40">Hapus Semua</button>
                         <button onClick={runCode} className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 rounded text-white text-sm font-bold shadow-lg">JALANKAN 🚀</button>
                       </div>
                    </div>
                    
                    <div className="w-full md:w-1/2 bg-slate-900 rounded-xl relative overflow-hidden min-h-[250px] border-4 border-slate-700 flex items-center justify-center p-4">
                       <div className="w-full h-full relative" style={{ width: '240px', height: '240px' }}>
                          {/* Grid Background */}
                          <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-0 border border-white/10">
                             {Array.from({length: 16}).map((_, i) => <div key={i} className="border border-white/5"></div>)}
                          </div>
                          
                          {/* Battery Target based on level */}
                          {level === 1 && <div className="absolute w-[60px] h-[60px] flex items-center justify-center text-3xl" style={{ left: '120px', top: '120px' }}>🔋</div>}
                          {level === 2 && <div className="absolute w-[60px] h-[60px] flex items-center justify-center text-3xl" style={{ left: '120px', top: '60px' }}>🔋</div>}
                          {level === 3 && <div className="absolute w-[60px] h-[60px] flex items-center justify-center text-3xl" style={{ left: '60px', top: '0px' }}>🔋</div>}
                          
                          {/* Robot */}
                          <motion.div 
                             animate={{ x: robotPos.x * 60, y: robotPos.y * 60 }} 
                             transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                             className="absolute w-[60px] h-[60px] flex items-center justify-center text-3xl z-10"
                             style={{ left: '0px', top: '120px' }}
                          >
                             🤖
                          </motion.div>
                       </div>
                    </div>
                    
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isCompleted && (
          <div className="mt-10 flex justify-end">
            <button
              onClick={() => {
                if(score < 300) {
                  Swal.fire('Selesaikan Game!', 'Mainkan mini game sampai Level 3 terlebih dahulu ya.', 'warning');
                  return;
                }
                Swal.fire({ title: 'Materi Selesai!', text: 'Anda telah menyelesaikan materi ini. Silakan lanjut ke evaluasi game.', icon: 'success', confirmButtonColor: '#0ea5e9' }).then(() => onCompleteMeeting());
              }}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/30"
            >
              <CheckCircle className="w-5 h-5" />
              Tandai Selesai
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
