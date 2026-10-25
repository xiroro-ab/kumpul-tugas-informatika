import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Brain, Target, Video, ChevronDown, ChevronUp, Lightbulb, LightbulbOff } from 'lucide-react';
import Swal from 'sweetalert2';

interface Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function BK9Meeting2({ onCompleteMeeting, isCompleted }: Props) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(true);
  
  const [inputA, setInputA] = useState(false);
  const [inputB, setInputB] = useState(false);
  const [inputC, setInputC] = useState(false);

  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  
  // Game logic operations
  const opAND = inputA && inputB;
  const opOR = inputA || inputB;
  const opXOR = inputA !== inputB;
  const opNAND = !(inputA && inputB);
  const opNOR = !(inputA || inputB);
  const opComplex = (inputA && inputB) || inputC;

  const targetLevels = [
    { 
      targetValue: opAND,
      desc: 'Nyalakan lampu dengan menggunakan gerbang AND (Input A & B)',
      logic: () => inputA && inputB 
    },
    { 
      targetValue: opNAND,
      desc: 'Matikan lampu yang terhubung dengan gerbang NAND (Input A & B)',
      logic: () => !(inputA && inputB) === false
    },
    { 
      targetValue: opXOR,
      desc: 'Nyalakan lampu dengan menggunakan gerbang XOR (Input A & B)',
      logic: () => inputA !== inputB
    },
    { 
      targetValue: opComplex,
      desc: 'Nyalakan lampu pada rangkaian (A AND B) OR C, pastikan hanya C yang aktif!',
      logic: () => (!inputA && !inputB && inputC)
    }
  ];
  
  useEffect(() => {
    if(level <= 4) {
      const currentTarget = targetLevels[level-1];
      if (currentTarget.logic()) {
        Swal.fire('Berhasil!', `Kamu menyelesaikan level ${level}!`, 'success').then(() => {
          if (level < 4) {
            setLevel(level + 1);
            setScore(score + 100);
            setInputA(false);
            setInputB(false);
            setInputC(false);
          } else if (level === 4 && score < 400) {
             setScore(400);
             Swal.fire('Luar Biasa!', 'Kamu sudah menguasai Gerbang Logika dan Rangkaian Kompleks!', 'success');
          }
        });
      }
    }
  }, [inputA, inputB, inputC, level, score]);

  return (
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -z-10" />
        
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Brain className="w-8 h-8 text-cyan-400" />
          Materi 2: Ekspresi dan Operasi Logika
        </h2>

        <div className="prose prose-invert max-w-none text-slate-300">
          <p className="text-lg leading-relaxed mb-6">
            Selamat datang di pembelajaran Materi 2: Ekspresi dan Operasi Logika.
          </p>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
            <h4 className="text-cyan-400 font-bold mb-2">Intisari Materi:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Ekspresi Logika:</strong> Pernyataan yang menghasilkan nilai kebenaran, yaitu TRUE (Benar / 1) atau FALSE (Salah / 0).</li>
              <li><strong>AND:</strong> Menghasilkan TRUE hanya jika SEMUA inputnya TRUE.</li>
              <li><strong>OR:</strong> Menghasilkan TRUE jika MINIMAL SATU inputnya TRUE.</li>
              <li><strong>NOT:</strong> Membalikkan nilai input (TRUE menjadi FALSE, dan sebaliknya).</li>
              <li><strong>NAND (Not AND):</strong> Kebalikan dari AND. Menghasilkan FALSE hanya jika kedua input TRUE.</li>
              <li><strong>NOR (Not OR):</strong> Kebalikan dari OR. Menghasilkan TRUE hanya jika kedua input FALSE.</li>
              <li><strong>XOR (Exclusive OR):</strong> Menghasilkan TRUE jika inputnya BERBEDA.</li>
            </ul>
            <h4 className="text-cyan-400 font-bold mt-4 mb-2">Contoh dalam Kehidupan Sehari-hari:</h4>
            <p>Sistem keamanan bank: Pintu brankas hanya terbuka jika Kunci A (Manager) <strong>AND</strong> Kunci B (Kasir) diputar secara bersamaan.</p>
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
              <span className="font-bold text-lg text-white">Video Pembelajaran (3 Bagian)</span>
            </div>
            {isVideoOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          <AnimatePresence>
            {isVideoOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="p-6 border-t border-white/10 flex flex-col gap-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-cyan-400 font-bold mb-2 text-sm">Bagian 1: Ekspresi Logika</h4>
                      <div className="aspect-video rounded-xl overflow-hidden shadow-2xl">
                        <iframe width="100%" height="100%" src="https://www.youtube.com/embed/Uhp4YBgKEf4?list=PLDheW52FZRUnqarW2koDXNy4Z2HoHBoPP" title="YouTube video 1" frameBorder="0" allowFullScreen></iframe>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-cyan-400 font-bold mb-2 text-sm">Bagian 2: Pemahaman Gerbang Logika 1</h4>
                      <div className="aspect-video rounded-xl overflow-hidden shadow-2xl">
                        <iframe width="100%" height="100%" src="https://www.youtube.com/embed/yYMFttmZQOw" title="YouTube video 2" frameBorder="0" allowFullScreen></iframe>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-cyan-400 font-bold mb-2 text-sm">Bagian 3: Pemahaman Gerbang Logika 2</h4>
                      <div className="aspect-video rounded-xl overflow-hidden shadow-2xl md:w-1/2 mx-auto">
                        <iframe width="100%" height="100%" src="https://www.youtube.com/embed/V_vbulWwXtQ?start=67" title="YouTube video 3" frameBorder="0" allowFullScreen></iframe>
                      </div>
                    </div>
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
              <Target className="w-6 h-6 text-purple-400" />
              <span className="font-bold text-lg text-white">Mini Game Interaktif: Simulator Sirkuit Logika</span>
            </div>
            {isGameOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          <AnimatePresence>
            {isGameOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="p-6 border-t border-white/10 flex flex-col gap-6 relative">
                  
                  <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-white/10">
                    <div className="text-purple-400 font-bold text-lg">Level: {level}/4</div>
                    <div className="text-green-400 font-bold text-lg">Skor: {score}</div>
                  </div>
                  
                  <p className="text-cyan-300 mb-2 font-bold text-center bg-cyan-900/40 py-3 rounded-lg border border-cyan-500/20 px-4">
                     MISI: {level <= 4 ? targetLevels[level-1].desc : 'SELESAI!'}
                  </p>
                  
                  <div className="bg-slate-800/50 p-6 rounded-xl space-y-8 max-w-2xl mx-auto w-full mt-4">
                    
                    {/* INPUTS */}
                    <div className="flex justify-center gap-8 relative">
                      <div className="text-center space-y-2">
                        <div className="text-slate-400 font-bold">Input A</div>
                        <button 
                          onClick={() => setInputA(!inputA)} 
                          className={`px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all ${inputA ? 'bg-green-500' : 'bg-slate-700'}`}
                        >
                          {inputA ? '1 (ON)' : '0 (OFF)'}
                        </button>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="text-slate-400 font-bold">Input B</div>
                        <button 
                          onClick={() => setInputB(!inputB)} 
                          className={`px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all ${inputB ? 'bg-green-500' : 'bg-slate-700'}`}
                        >
                          {inputB ? '1 (ON)' : '0 (OFF)'}
                        </button>
                      </div>
                      
                      {level === 4 && (
                        <div className="text-center space-y-2">
                          <div className="text-slate-400 font-bold">Input C</div>
                          <button 
                            onClick={() => setInputC(!inputC)} 
                            className={`px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all ${inputC ? 'bg-green-500' : 'bg-slate-700'}`}
                          >
                            {inputC ? '1 (ON)' : '0 (OFF)'}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* GATES DISPLAY */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10 relative">
                      
                      <div className={`p-4 rounded-xl border text-center shadow-inner relative z-10 transition-colors ${level === 1 ? 'bg-cyan-900/50 border-cyan-500' : 'bg-slate-800 border-white/5'}`}>
                        <div className="text-xs text-slate-400 mb-1 font-bold">Gerbang AND</div>
                        <div className={`text-xl font-bold ${opAND ? 'text-green-400' : 'text-slate-500'}`}>{opAND ? '1' : '0'}</div>
                      </div>

                      <div className={`p-4 rounded-xl border text-center shadow-inner relative z-10 transition-colors ${level === 2 ? 'bg-cyan-900/50 border-cyan-500' : 'bg-slate-800 border-white/5'}`}>
                        <div className="text-xs text-slate-400 mb-1 font-bold">Gerbang NAND</div>
                        <div className={`text-xl font-bold ${opNAND ? 'text-green-400' : 'text-slate-500'}`}>{opNAND ? '1' : '0'}</div>
                      </div>
                      
                      <div className={`p-4 rounded-xl border text-center shadow-inner relative z-10 transition-colors ${level === 3 ? 'bg-cyan-900/50 border-cyan-500' : 'bg-slate-800 border-white/5'}`}>
                        <div className="text-xs text-slate-400 mb-1 font-bold">Gerbang XOR</div>
                        <div className={`text-xl font-bold ${opXOR ? 'text-green-400' : 'text-slate-500'}`}>{opXOR ? '1' : '0'}</div>
                      </div>
                      
                      <div className={`p-4 rounded-xl border text-center shadow-inner relative z-10 transition-colors ${level === 4 ? 'bg-cyan-900/50 border-cyan-500' : 'bg-slate-800 border-white/5'}`}>
                        <div className="text-xs text-slate-400 mb-1 font-bold">(A AND B) OR C</div>
                        <div className={`text-xl font-bold ${opComplex ? 'text-green-400' : 'text-slate-500'}`}>{opComplex ? '1' : '0'}</div>
                      </div>

                    </div>
                    
                    {/* BULB OUTPUT */}
                    <div className="flex flex-col items-center justify-center pt-8 border-t border-white/10">
                       <h4 className="text-slate-400 font-bold mb-4">Lampu Output Target</h4>
                       <div className="relative">
                          <motion.div animate={{ scale: targetLevels[Math.min(level-1, 3)].targetValue ? 1.2 : 1 }}>
                             {targetLevels[Math.min(level-1, 3)].targetValue ? 
                                <Lightbulb className="w-24 h-24 text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)]" /> : 
                                <LightbulbOff className="w-24 h-24 text-slate-600" />
                             }
                          </motion.div>
                       </div>
                       <div className="mt-4 font-bold text-xl">
                          {targetLevels[Math.min(level-1, 3)].targetValue ? <span className="text-yellow-400">MENYALA (TRUE)</span> : <span className="text-slate-500">MATI (FALSE)</span>}
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
                if(score < 400) {
                  Swal.fire('Selesaikan Game!', 'Mainkan mini game sampai Level 4 terlebih dahulu ya.', 'warning');
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
