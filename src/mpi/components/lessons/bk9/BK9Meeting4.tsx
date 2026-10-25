import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Brain, Target, Video, ChevronDown, ChevronUp } from 'lucide-react';
import Swal from 'sweetalert2';

interface Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function BK9Meeting4({ onCompleteMeeting, isCompleted }: Props) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(true);
  
  const [position, setPosition] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [color, setColor] = useState('#fb923c'); // orange-400
  
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);

  const checkLevel = () => {
    if (level === 1 && position >= 60) {
      Swal.fire('Bagus!', 'Sprite berhasil maju!', 'success').then(() => { setLevel(2); setScore(100); resetSprite(); });
    } else if (level === 2 && rotation >= 90) {
      Swal.fire('Hebat!', 'Sprite berhasil berputar!', 'success').then(() => { setLevel(3); setScore(200); resetSprite(); });
    } else if (level === 3 && scale >= 1.5 && color !== '#fb923c') {
      Swal.fire('Luar Biasa!', 'Sprite berhasil membesar dan berubah warna!', 'success').then(() => { setScore(300); resetSprite(); });
    }
  };

  const resetSprite = () => {
    setPosition(0);
    setRotation(0);
    setScale(1);
    setColor('#fb923c');
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -z-10" />
        
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Brain className="w-8 h-8 text-cyan-400" />
          Materi 4: Pemrograman Visual (Pictoblox)
        </h2>

        <div className="prose prose-invert max-w-none text-slate-300">
          <p className="text-lg leading-relaxed mb-6">
            Selamat datang di pembelajaran Materi 4: Pemrograman Visual menggunakan Pictoblox.
          </p>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
            <h4 className="text-cyan-400 font-bold mb-2">Intisari Materi:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Pictoblox:</strong> Software pemrograman berbasis blok visual yang mirip Scratch, namun dengan fitur AI.</li>
              <li><strong>Sprite & Stage:</strong> Karakter disebut Sprite, tempat mereka bergerak disebut Stage.</li>
              <li><strong>Kategori Blok:</strong> Motion (Gerakan), Looks (Tampilan), Events (Kejadian awal program), Control (Perulangan/Kondisi).</li>
            </ul>
            <h4 className="text-cyan-400 font-bold mt-4 mb-2">Contoh dalam Kehidupan Sehari-hari:</h4>
            <p>Memprogram sprite sama seperti memberikan instruksi kepada aktor di panggung teater, "Kapan harus bicara, kemana harus jalan."</p>
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
                    <iframe width="100%" height="100%" src="https://www.youtube.com/embed/n3E1J5sE1_o?list=PLDheW52FZRUnqarW2koDXNy4Z2HoHBoPP" title="YouTube video" frameBorder="0" allowFullScreen></iframe>
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
              <Target className="w-6 h-6 text-orange-400" />
              <span className="font-bold text-lg text-white">Mini Game Interaktif: Master Blok Pictoblox</span>
            </div>
            {isGameOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          <AnimatePresence>
            {isGameOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="p-6 border-t border-white/10 flex flex-col gap-6 relative">
                  
                  <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-white/10">
                    <div className="text-orange-400 font-bold text-lg">Level: {level}/3</div>
                    <div className="text-green-400 font-bold text-lg">Skor: {score}</div>
                  </div>

                  <p className="text-slate-300 text-sm text-center font-bold">
                     {level === 1 && "Misi: Buat Sprite bergerak maju (move steps) minimal 60 langkah!"}
                     {level === 2 && "Misi: Buat Sprite berputar (turn degrees) minimal 90 derajat!"}
                     {level === 3 && "Misi: Buat Sprite membesar (change size) dan berganti warna (change color)!"}
                     {score >= 300 && "Selamat! Kamu telah menguasai Blok Motion dan Looks!"}
                  </p>
                  
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Blok Palette */}
                    <div className="w-full md:w-1/3 flex flex-col gap-3">
                      <h4 className="text-white font-bold mb-2">Block Palette</h4>
                      
                      <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-2 mb-1">Motion</div>
                      <button onClick={() => { setPosition(p => p + 30); setTimeout(checkLevel, 500); }} className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg text-white text-sm font-bold text-left shadow border-l-4 border-blue-700">
                         move 30 steps
                      </button>
                      <button onClick={() => { setRotation(r => r + 45); setTimeout(checkLevel, 500); }} className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg text-white text-sm font-bold text-left shadow border-l-4 border-blue-700">
                         turn ↻ 45 degrees
                      </button>
                      <button onClick={() => { setPosition(p => p - 30); setTimeout(checkLevel, 500); }} className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg text-white text-sm font-bold text-left shadow border-l-4 border-blue-700">
                         move -30 steps
                      </button>

                      <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mt-4 mb-1">Looks</div>
                      <button onClick={() => { setScale(s => s + 0.5); setTimeout(checkLevel, 500); }} className="px-4 py-2 bg-purple-500 hover:bg-purple-400 rounded-lg text-white text-sm font-bold text-left shadow border-l-4 border-purple-700">
                         change size by 50
                      </button>
                      <button onClick={() => { setColor('#ec4899'); setTimeout(checkLevel, 500); }} className="px-4 py-2 bg-purple-500 hover:bg-purple-400 rounded-lg text-white text-sm font-bold text-left shadow border-l-4 border-purple-700">
                         change color effect
                      </button>

                      <button onClick={() => { resetSprite(); }} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 rounded-lg text-white text-sm font-bold text-left shadow border-t-4 border-l-4 border-yellow-700 rounded-tl-full mt-4">
                         When 🚩 clicked (Reset)
                      </button>
                    </div>
                    {/* Stage */}
                    <div className="w-full md:w-2/3 bg-white rounded-xl p-4 flex items-center overflow-hidden min-h-[300px] relative border-4 border-slate-700">
                       <span className="absolute top-2 left-2 text-slate-400 font-bold text-xs uppercase tracking-widest">Stage</span>
                       <motion.div 
                         animate={{ x: position, rotate: rotation, scale: scale, backgroundColor: color }}
                         transition={{ type: "spring", stiffness: 300, damping: 20 }}
                         className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl shadow-lg border-2 border-slate-800 absolute"
                         style={{ left: '50px' }}
                       >
                         🐱
                       </motion.div>
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
                if (score < 300) {
                  Swal.fire('Belum Selesai', 'Selesaikan 3 level misi terlebih dahulu.', 'warning');
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
