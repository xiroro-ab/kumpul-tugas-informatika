import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Brain, Target, Video, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import Swal from 'sweetalert2';

interface Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function BK9Meeting5({ onCompleteMeeting, isCompleted }: Props) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(true);
  
  const [dialogStep, setDialogStep] = useState(0);
  const [score, setScore] = useState(0);

  const handleDialogChoice = (choice: string) => {
    if (choice === 'baik') {
       setDialogStep(1);
       if (score === 0) setScore(100);
    }
    if (choice === 'jahat') {
       setDialogStep(2);
    }
    if (choice === 'bingung') {
       setDialogStep(3);
    }
    
    // Level 2 choices
    if (choice === 'bantu_cari') {
       setDialogStep(4);
       if (score === 100) { setScore(200); Swal.fire('Tamat!', 'Kamu mendapatkan akhir yang bahagia!', 'success'); }
    }
    if (choice === 'lari') {
       setDialogStep(5);
       Swal.fire('Tamat!', 'Kamu mendapatkan akhir yang buruk.', 'error');
    }
    
    if (choice === 'reset') {
       setDialogStep(0);
       setScore(0);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -z-10" />
        
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Brain className="w-8 h-8 text-cyan-400" />
          Materi 5: Storytelling & Dialog
        </h2>

        <div className="prose prose-invert max-w-none text-slate-300">
          <p className="text-lg leading-relaxed mb-6">
            Selamat datang di pembelajaran Materi 5: Membuat cerita sederhana, dialog, dan storytelling menggunakan pemrograman visual.
          </p>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
            <h4 className="text-cyan-400 font-bold mb-2">Intisari Materi:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Blok Say & Think:</strong> Digunakan untuk memunculkan balon percakapan pada karakter (Sprite).</li>
              <li><strong>Broadcast & Receive:</strong> Teknik mengirim dan menerima pesan rahasia antar sprite agar dialog bisa bergantian tanpa bertabrakan.</li>
              <li><strong>Wait:</strong> Memberikan jeda waktu agar penonton bisa membaca teks dialog sebelum dialog berikutnya muncul.</li>
            </ul>
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
              <span className="font-bold text-lg text-white">Video Pembelajaran Storytelling</span>
            </div>
            {isVideoOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          <AnimatePresence>
            {isVideoOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="p-6 border-t border-white/10 flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-cyan-400 font-bold mb-2">Part 1: Cerita Sederhana & Dialog</h4>
                      <div className="aspect-video rounded-xl overflow-hidden shadow-2xl">
                        <iframe width="100%" height="100%" src="https://www.youtube.com/embed/IFIS_bNUje0" title="YouTube video" frameBorder="0" allowFullScreen></iframe>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-cyan-400 font-bold mb-2">Part 2: Storytelling Lanjutan</h4>
                      <div className="aspect-video rounded-xl overflow-hidden shadow-2xl">
                        <iframe width="100%" height="100%" src="https://www.youtube.com/embed/IFKEhRXf35g" title="YouTube video" frameBorder="0" allowFullScreen></iframe>
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
              <Target className="w-6 h-6 text-pink-400" />
              <span className="font-bold text-lg text-white">Mini Game Interaktif: Master Storytelling</span>
            </div>
            {isGameOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          <AnimatePresence>
            {isGameOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="p-6 border-t border-white/10 flex flex-col gap-6 relative">
                  <p className="text-slate-300 mb-2 text-sm text-center">Pilih alur dialog yang mengarah ke akhir cerita yang bahagia (Happy Ending)!</p>
                  
                  <div className="bg-slate-800 p-6 rounded-xl relative min-h-[400px]">
                    <div className="flex gap-4">
                      {/* Character 1 */}
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center text-3xl shadow-lg border-2 border-pink-700">🐱</div>
                        <span className="text-xs font-bold text-slate-400 mt-1">Kucing</span>
                      </div>
                      
                      {/* Chat bubble 1 */}
                      <div className="bg-white text-slate-800 p-4 rounded-2xl rounded-tl-none font-bold shadow-lg max-w-xs self-start border-l-4 border-pink-500">
                        {dialogStep === 0 && "Halo kawan! Maukah kamu membantuku mencari ikan yang hilang?"}
                        {dialogStep === 1 && "Terima kasih! Ikan itu terakhir kali kulihat di dekat sungai."}
                        {dialogStep === 2 && "Ya ampun... kamu jahat sekali. Aku pergi saja. 😭"}
                        {dialogStep === 3 && "Ikan ajaib! Warnanya emas. Tolong bantu aku..."}
                        {dialogStep === 4 && "Hore! Kita menemukan ikannya! Terima kasih banyak! 🎉"}
                        {dialogStep === 5 && "Yah... dia lari. Aku sendirian lagi. 😢"}
                      </div>
                    </div>

                    <div className="mt-8 flex gap-4 justify-end">
                      {/* Chat bubble 2 (User choices) */}
                      {dialogStep === 0 && (
                        <div className="flex flex-col gap-2">
                           <button onClick={() => handleDialogChoice('baik')} className="bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded-2xl rounded-tr-none font-bold transition-colors">Tentu saja! Ayo kita cari!</button>
                           <button onClick={() => handleDialogChoice('bingung')} className="bg-slate-500 hover:bg-slate-400 text-white px-4 py-2 rounded-2xl rounded-tr-none font-bold transition-colors">Ikan apa yang kamu maksud?</button>
                           <button onClick={() => handleDialogChoice('jahat')} className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-2xl rounded-tr-none font-bold transition-colors">Tidak mau, cari saja sendiri!</button>
                        </div>
                      )}
                      
                      {dialogStep === 1 && (
                        <div className="flex flex-col gap-2">
                           <button onClick={() => handleDialogChoice('bantu_cari')} className="bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded-2xl rounded-tr-none font-bold transition-colors">Ayo kita ke sungai sekarang!</button>
                           <button onClick={() => handleDialogChoice('lari')} className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-2xl rounded-tr-none font-bold transition-colors">(Lari meninggalkan si kucing)</button>
                        </div>
                      )}
                      
                      {dialogStep === 3 && (
                        <div className="flex flex-col gap-2">
                           <button onClick={() => handleDialogChoice('baik')} className="bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded-2xl rounded-tr-none font-bold transition-colors">Wah, keren! Ayo kita cari!</button>
                        </div>
                      )}
                      
                      {[2,4,5].includes(dialogStep) && (
                        <div className="bg-cyan-500 text-white p-4 rounded-2xl rounded-tr-none font-bold shadow-lg max-w-xs self-end">
                          {dialogStep === 2 && "Tidak mau, cari saja sendiri!"}
                          {dialogStep === 4 && "Ayo kita ke sungai sekarang!"}
                          {dialogStep === 5 && "(Lari meninggalkan si kucing)"}
                        </div>
                      )}

                      {/* Character 2 */}
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-cyan-600 rounded-full flex items-center justify-center text-3xl shadow-lg border-2 border-cyan-800">🐶</div>
                        <span className="text-xs font-bold text-slate-400 mt-1">Anjing (Kamu)</span>
                      </div>
                    </div>

                    {dialogStep !== 0 && (
                       <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                         <button onClick={() => handleDialogChoice('reset')} className="px-4 py-2 bg-slate-700 rounded-lg text-sm font-bold text-white hover:bg-slate-600">Mulai Ulang Cerita</button>
                       </div>
                    )}
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
                if (score < 200) {
                  Swal.fire('Belum Selesai', 'Selesaikan cerita ini hingga mendapatkan Happy Ending!', 'warning');
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
