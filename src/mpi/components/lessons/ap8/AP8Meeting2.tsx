import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, BookOpen, Presentation, Gamepad2, AlertCircle, RefreshCw, Play } from 'lucide-react';
import Swal from 'sweetalert2';

interface AP8Meeting2Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const BLOCKS = [
  { id: 'A', text: "move 10 steps", color: "bg-blue-500" },
  { id: 'B', text: "When green flag clicked", color: "bg-yellow-500" },
  { id: 'C', text: "play sound Meow until done", color: "bg-fuchsia-500" },
  { id: 'D', text: "hide", color: "bg-purple-500" },
];

const CORRECT_SEQUENCE = ['B', 'A', 'C']; // or B, C, A, but let's stick to this one

const AP8Meeting2: React.FC<AP8Meeting2Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  const [slots, setSlots] = useState<string[]>(['', '', '']);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  const handleBlockSelect = (blockId: string) => {
    if (selectedSlotIndex === null) {
      Swal.fire({
        icon: 'info',
        title: 'Pilih Slot Dulu',
        text: 'Klik salah satu slot kosong terlebih dahulu, baru pilih blok kode yang ingin dimasukkan.',
        background: '#1e293b',
        color: '#fff',
      });
      return;
    }

    const newSlots = [...slots];
    newSlots[selectedSlotIndex] = blockId;
    setSlots(newSlots);
    setSelectedSlotIndex(null);
  };

  const clearSlot = (index: number) => {
    const newSlots = [...slots];
    newSlots[index] = '';
    setSlots(newSlots);
  };

  const checkAnswer = () => {
    if (slots.includes('')) {
      Swal.fire({
        icon: 'warning',
        title: 'Belum Selesai',
        text: 'Isi semua slot terlebih dahulu sebelum mengecek jawaban!',
        background: '#1e293b',
        color: '#fff',
      });
      return;
    }

    const isCorrect = slots[0] === CORRECT_SEQUENCE[0] && 
                      slots[1] === CORRECT_SEQUENCE[1] && 
                      slots[2] === CORRECT_SEQUENCE[2];

    const isAlternateCorrect = slots[0] === CORRECT_SEQUENCE[0] && 
                               slots[1] === CORRECT_SEQUENCE[2] && 
                               slots[2] === CORRECT_SEQUENCE[1];

    if (isCorrect || isAlternateCorrect) {
      Swal.fire({
        icon: 'success',
        title: 'Script Sempurna!',
        text: 'Luar biasa! Kamu berhasil menyusun blok kode dengan benar. Sprite siap dijalankan!',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#22c55e'
      }).then(() => {
        if (!isCompleted) onCompleteMeeting();
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Ada yang salah',
        text: 'Susunan blok kode masih belum tepat. Ingat, program selalu dimulai dengan event (kejadian).',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  const resetGame = () => {
    setSlots(['', '', '']);
    setSelectedSlotIndex(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
        <div className="p-6 sm:p-8 border-b border-white/10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 flex items-center gap-3">
            <Presentation className="w-8 h-8 text-fuchsia-400" />
            Materi 2: Pengenalan Scratch & Membuat Game Sederhana
          </h2>
          <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg shadow-black/50 border border-white/10 bg-black mb-8">
            <iframe 
              width="100%" 
              height="100%" 
              src="https://www.youtube.com/embed/-MahZIgAxhM" 
              title="Pemrograman dengan Scratch" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-fuchsia-400" />
          Teori: Pemrograman Visual
        </h2>
        
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
            <h3 className="text-xl font-bold text-fuchsia-400 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Intisari Materi
            </h3>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink mt-0.5" />
                <span><strong className="text-white">Scratch</strong> adalah platform bahasa pemrograman visual yang menggunakan drag-and-drop blok kode bergambar.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink mt-0.5" />
                <span><strong className="text-white">Sprite</strong>: Objek atau karakter yang diprogram (misalnya ikon Kucing).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink mt-0.5" />
                <span><strong className="text-white">Script</strong>: Kumpulan blok kode yang digabungkan untuk memberikan instruksi kepada Sprite.</span>
              </li>
            </ul>
          </div>
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
            <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Kategori Blok Utama
            </h3>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 bg-yellow-500 rounded shrink mt-0.5"></div>
                <span><strong>Events (Kuning)</strong>: Pemicu untuk memulai skrip, seperti "When green flag clicked".</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 bg-blue-500 rounded shrink mt-0.5"></div>
                <span><strong>Motion (Biru)</strong>: Mengontrol pergerakan Sprite (maju, putar, pindah posisi).</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 bg-fuchsia-500 rounded shrink mt-0.5"></div>
                <span><strong>Sound & Looks (Ungu/Pink)</strong>: Mengatur suara yang dimainkan dan tampilan sprite (berkata sesuatu, ganti kostum).</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2">
              <Gamepad2 className="w-7 h-7 text-fuchsia-400" />
              Game Interaktif: Susun Script Scratch
            </h2>
            <p className="text-slate-400">Susunlah script agar Sprite dapat bergerak maju dan berbunyi Meow saat program dijalankan!</p>
          </div>
          <button 
            onClick={() => setShowGame(!showGame)}
            className="px-4 sm:px-6 py-3 w-full sm:w-auto bg-fuchsia-500 text-sm sm:text-base hover:bg-fuchsia-400 text-white font-bold rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-fuchsia-500/25 shrink"
          >
            {showGame ? 'Sembunyikan Game' : 'Mulai Game Interaktif'}
          </button>
        </div>

        {showGame && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-white/10 pt-8"
          >
            <div className="grid md:grid-cols-2 gap-8">
              {/* Workspace / Slots */}
              <div className="bg-slate-900 rounded-2xl p-6 border border-white/5">
                <h3 className="text-white font-bold mb-4 text-center">Workspace (Susun disini)</h3>
                <p className="text-slate-400 text-sm text-center mb-6">Klik sebuah slot kosong, lalu pilih balok kode di sebelah kanan untuk mengisinya.</p>
                <div className="flex flex-col items-center gap-2">
                  {slots.map((slotBlockId, index) => {
                    const block = BLOCKS.find(b => b.id === slotBlockId);
                    const isSelected = selectedSlotIndex === index;
                    
                    return (
                      <div 
                        key={index}
                        onClick={() => {
                          if (!block) setSelectedSlotIndex(index);
                        }}
                        className={`w-full max-w-sm h-14 rounded-lg flex items-center justify-center cursor-pointer transition-all border-2
                          ${isSelected ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)] bg-slate-800' : 'border-dashed border-slate-600 bg-slate-800/50 hover:bg-slate-700/50'}
                          ${block ? 'border-solid border-transparent !bg-transparent p-0' : ''}
                        `}
                      >
                        {block ? (
                          <div className={`w-full h-full rounded-lg flex items-center justify-between px-4 ${block.color} text-white font-bold shadow-md`}>
                            <span>{block.text}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); clearSlot(index); }}
                              className="text-white/60 hover:text-white"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">{isSelected ? 'Pilih balok di sebelah kanan' : `Klik untuk memilih Slot ${index + 1}`}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Toolbox */}
              <div className="bg-slate-900 rounded-2xl p-6 border border-white/5">
                <h3 className="text-white font-bold mb-4 text-center">Pilihan Blok Kode</h3>
                <div className="flex flex-col gap-3">
                  {BLOCKS.map((block) => (
                    <button
                      key={block.id}
                      onClick={() => handleBlockSelect(block.id)}
                      className={`w-full text-left rounded-lg p-3 text-white font-bold shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] ${block.color}`}
                    >
                      {block.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-8 max-w-2xl mx-auto">
              <button 
                onClick={checkAnswer}
                className="flex-1 bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" /> Cek Program
              </button>
              <button 
                onClick={resetGame}
                className="bg-slate-800 hover:bg-slate-700 text-white py-3 px-6 rounded-xl transition-colors border border-white/10 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
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
          <p className="text-slate-300">Kamu telah memahami dasar-dasar pemrograman visual dengan Scratch.</p>
        </motion.div>
      )}
    </div>
  );
};

export default AP8Meeting2;
