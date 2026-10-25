import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, CheckCircle, Brain, Target, Info, Lightbulb, Video, ChevronDown, ChevronUp } from 'lucide-react';
import Swal from 'sweetalert2';

interface Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function BK9Meeting1({ onCompleteMeeting, isCompleted }: Props) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(true);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);

  const checkNode = (nodeName: string, isCorrect: boolean, explanation: string) => {
    if (isCorrect) {
      Swal.fire('Benar!', explanation, 'success').then(() => {
        if (level < 3) {
          setLevel(level + 1);
          setScore(score + 100);
        } else {
          setScore(score + 100);
          Swal.fire('Luar Biasa!', 'Kamu berhasil menyelesaikan semua level struktur Tree!', 'success');
        }
      });
    } else {
      Swal.fire('Salah', explanation, 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -z-10" />
        
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Brain className="w-8 h-8 text-cyan-400" />
          Materi 1: Struktur Data Tree dan Graph
        </h2>

        <div className="prose prose-invert max-w-none text-slate-300">
          <p className="text-lg leading-relaxed mb-6">
            Selamat datang di pembelajaran Materi 1: Struktur Data Tree dan Graph.
          </p>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
            <h4 className="text-cyan-400 font-bold mb-2">Intisari Materi:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Tree:</strong> Struktur data hierarkis (seperti pohon terbalik) yang memiliki Root, Node, dan Leaf.</li>
              <li><strong>Graph:</strong> Struktur jaringan bebas yang terdiri dari Vertex (Titik) dan Edge (Garis).</li>
            </ul>
            <h4 className="text-cyan-400 font-bold mt-4 mb-2">Contoh dalam Kehidupan Sehari-hari:</h4>
            <p>Tree digunakan pada struktur folder di komputer atau silsilah keluarga. Graph digunakan pada Google Maps untuk mencari rute terpendek.</p>
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
                    <iframe width="100%" height="100%" src="https://www.youtube.com/embed/itbhYn175Aw" title="YouTube video" frameBorder="0" allowFullScreen></iframe>
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
              <Target className="w-6 h-6 text-green-400" />
              <span className="font-bold text-lg text-white">Mini Game Interaktif: Master Struktur Data</span>
            </div>
            {isGameOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          <AnimatePresence>
            {isGameOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="p-6 border-t border-white/10 flex flex-col gap-6 relative">
                  <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-white/10">
                    <div className="text-cyan-400 font-bold text-lg">Level: {level}/3</div>
                    <div className="text-green-400 font-bold text-lg">Skor: {score}</div>
                  </div>
                  
                  {level === 1 && <p className="text-slate-300 mb-2 text-sm">Level 1: Klik node yang merupakan <strong>Root</strong> (Akar) dari struktur Tree di bawah ini!</p>}
                  {level === 2 && <p className="text-slate-300 mb-2 text-sm">Level 2: Klik salah satu node yang merupakan <strong>Leaf</strong> (Daun/Ujung) dari struktur Tree!</p>}
                  {level === 3 && <p className="text-slate-300 mb-2 text-sm">Level 3: Klik node yang memiliki <strong>Child</strong> (Anak) tetapi BUKAN Root!</p>}

                  <div className="flex flex-col items-center gap-4 py-8 bg-slate-800/50 rounded-xl mt-4">
                     {/* Root A */}
                     <button onClick={() => checkNode('A', level === 1, level === 1 ? 'Tepat! A adalah Root karena berada paling atas hierarki.' : 'Salah, A adalah Root, bukan jawaban untuk level ini.')} className="w-16 h-16 bg-slate-700 rounded-full border-4 border-cyan-500 flex items-center justify-center font-bold text-xl hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-500/20">A</button>
                     
                     <div className="flex gap-16 relative">
                       {/* Connection lines */}
                       <div className="absolute top-[-16px] left-[50%] w-[2px] h-[32px] bg-slate-500 origin-bottom transform rotate-[45deg] translate-x-[-16px]"></div>
                       <div className="absolute top-[-16px] left-[50%] w-[2px] h-[32px] bg-slate-500 origin-bottom transform -rotate-[45deg] translate-x-[16px]"></div>
                       
                       <div className="flex flex-col items-center pt-8">
                         {/* Node B */}
                         <button onClick={() => checkNode('B', level === 3, level === 3 ? 'Benar! B memiliki anak (D & E) tetapi bukan Root.' : 'Salah, B adalah Child/Node dengan anak, bukan jawaban level ini.')} className="w-16 h-16 bg-slate-700 rounded-full border-4 border-purple-500 flex items-center justify-center font-bold text-xl hover:bg-purple-600 transition-colors z-10 shadow-lg shadow-purple-500/20">B</button>
                         
                         <div className="flex gap-8 relative mt-4">
                           <div className="absolute top-[-16px] left-[50%] w-[2px] h-[32px] bg-slate-500 origin-bottom transform rotate-[30deg] translate-x-[-8px]"></div>
                           <div className="absolute top-[-16px] left-[50%] w-[2px] h-[32px] bg-slate-500 origin-bottom transform -rotate-[30deg] translate-x-[8px]"></div>
                           
                           <div className="flex flex-col items-center pt-8">
                             {/* Node D */}
                             <button onClick={() => checkNode('D', level === 2, level === 2 ? 'Benar! D adalah Leaf karena tidak memiliki anak.' : 'Salah, D adalah Leaf, bukan jawaban level ini.')} className="w-14 h-14 bg-slate-700 rounded-full border-4 border-slate-500 flex items-center justify-center font-bold text-lg hover:bg-slate-600 transition-colors z-10">D</button>
                           </div>
                           <div className="flex flex-col items-center pt-8">
                             {/* Node E */}
                             <button onClick={() => checkNode('E', level === 2, level === 2 ? 'Benar! E adalah Leaf karena tidak memiliki anak.' : 'Salah, E adalah Leaf, bukan jawaban level ini.')} className="w-14 h-14 bg-slate-700 rounded-full border-4 border-slate-500 flex items-center justify-center font-bold text-lg hover:bg-slate-600 transition-colors z-10">E</button>
                           </div>
                         </div>
                       </div>

                       <div className="flex flex-col items-center pt-8">
                         {/* Node C */}
                         <button onClick={() => checkNode('C', level === 2, level === 2 ? 'Benar! C adalah Leaf karena tidak memiliki anak.' : 'Salah, C adalah Leaf, bukan jawaban level ini.')} className="w-16 h-16 bg-slate-700 rounded-full border-4 border-orange-500 flex items-center justify-center font-bold text-xl hover:bg-orange-600 transition-colors z-10 shadow-lg shadow-orange-500/20">C</button>
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
