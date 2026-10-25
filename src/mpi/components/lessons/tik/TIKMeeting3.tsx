import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, Mail, CheckCircle, Paperclip, Send, FileText } from 'lucide-react';
import Swal from 'sweetalert2';

interface TIKMeeting3Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

type PartTarget = 'penerima' | 'subjek' | 'isi' | 'lampiran';

interface EmailPart {
  id: string;
  content: string;
  target: PartTarget;
}

const INITIAL_PARTS: EmailPart[] = [
  { id: '1', content: 'guru.informatika@sekolah.id', target: 'penerima' },
  { id: '2', content: 'Tugas Laporan TIK', target: 'subjek' },
  { id: '3', content: 'Selamat pagi, Pak. Berikut saya lampirkan tugas laporan TIK. Terima kasih.', target: 'isi' },
  { id: '4', content: 'laporan_siswa.docx', target: 'lampiran' },
];

export default function TIKMeeting3({ onCompleteMeeting, isCompleted }: TIKMeeting3Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [parts, setParts] = useState<EmailPart[]>([]);
  const [slots, setSlots] = useState<{ [key in PartTarget]: EmailPart | null }>({
    penerima: null,
    subjek: null,
    isi: null,
    lampiran: null,
  });
  const [isGameOver, setIsGameOver] = useState(false);

  const startGame = () => {
    setParts([...INITIAL_PARTS].sort(() => Math.random() - 0.5));
    setSlots({
      penerima: null,
      subjek: null,
      isi: null,
      lampiran: null,
    });
    setIsGameOver(false);
    setIsPlaying(true);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = (e: React.DragEvent, targetSlot: PartTarget) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const draggedPart = parts.find(p => p.id === id);

    if (draggedPart && !slots[targetSlot]) {
      if (draggedPart.target === targetSlot) {
        setSlots(prev => ({ ...prev, [targetSlot]: draggedPart }));
        setParts(prev => prev.filter(p => p.id !== id));
        
        // Check win condition
        const newSlots = { ...slots, [targetSlot]: draggedPart };
        if (Object.values(newSlots).every(v => v !== null)) {
          setTimeout(() => {
            setIsGameOver(true);
            setIsPlaying(false);
          }, 500);
        }
      } else {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Bagian tidak sesuai!',
          showConfirmButton: false,
          timer: 1000
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Komunikasi Surel</h2>
        <p className="mt-2 text-slate-400 font-medium">
          Susun komponen-komponen surel dengan benar sebelum dikirimkan.
        </p>
      </div>

      
      {/* Penjelasan Inti */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-xl mb-8 flex flex-col gap-4">
        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl"><Mail className="w-6 h-6" /></span>
          Apa itu Surel (Email)?
        </h3>
        <p className="text-slate-300 leading-relaxed">
          <strong>Surel (Surat Elektronik / Email)</strong> adalah sarana untuk mengirim dan menerima pesan digital melalui jaringan internet. Tidak hanya teks, surel juga bisa melampirkan file dokumen, foto, atau video.
        </p>
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mt-2">
          <p className="text-sm text-slate-400 italic">
            <strong>Contoh dalam kehidupan sehari-hari:</strong> Surel adalah versi modern dari layanan pos surat tradisional. 
            <br/><br/>
            • <strong>Kepada (To)</strong> adalah alamat rumah temanmu (contoh: andi@sekolah.id).<br/>
            • <strong>Subjek (Subject)</strong> adalah judul surat agar penerima tahu apa isi surat tersebut sebelum membukanya (contoh: Tugas Laporan).<br/>
            • <strong>Isi Pesan</strong> adalah kertas tempat kamu menulis pesannya.<br/>
            • <strong>Lampiran (Attachment)</strong> seperti penjepit kertas tempat kamu menyisipkan foto atau dokumen cetak ke dalam amplop tersebut sebelum dikirim.
            <br/><br/>
            Bedanya, tukang pos (internet) mengirimkannya dalam hitungan detik ke belahan dunia mana pun!
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative min-h-[550px]">
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 z-10 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Game: Penyusun Surel 📧</h3>
            <p className="text-slate-300 mb-8 max-w-md">Seret setiap bagian ke kolom surel yang tepat (Kepada, Subjek, Isi, Lampiran).</p>
            <button
              onClick={startGame}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-8 py-4 text-lg font-bold text-slate-950 hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
            >
              <PlayCircle className="h-6 w-6" />
              Mulai Menyusun
            </button>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 z-10 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
              <Send className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Surel Berhasil Disusun!</h3>
            <p className="text-slate-400 mb-8 max-w-md">Kamu telah berhasil meletakkan semua bagian pada tempatnya.</p>
            
            <div className="flex gap-4">
              <button
                onClick={startGame}
                className="rounded-2xl bg-white/10 border border-white/20 px-6 py-3 font-bold text-white hover:bg-white/20 transition-all"
              >
                Ulangi
              </button>
              <button
                onClick={onCompleteMeeting}
                className="rounded-2xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-400 transition-all"
              >
                Selesai & Lanjut
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Draggable Parts */}
          <div className="w-full lg:w-1/3 bg-slate-950/50 p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
            <h4 className="text-slate-300 font-bold mb-2 flex items-center gap-2">
              <Paperclip className="w-4 h-4" /> Komponen
            </h4>
            <AnimatePresence>
              {parts.map((part) => (
                <motion.div
                  key={part.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  draggable
                  onDragStart={(e: any) => handleDragStart(e, part.id)}
                  className="bg-slate-800 border border-slate-700 p-4 rounded-xl cursor-grab active:cursor-grabbing hover:border-cyan-500/50 transition-colors shadow-md text-sm text-slate-200"
                >
                  {part.content}
                </motion.div>
              ))}
            </AnimatePresence>
            {parts.length === 0 && (
              <div className="text-center text-slate-500 text-sm py-8 border-2 border-dashed border-slate-800 rounded-xl">
                Semua komponen telah diletakkan
              </div>
            )}
          </div>

          {/* Email Template */}
          <div className="w-full lg:w-2/3 bg-white p-6 rounded-2xl shadow-inner text-slate-800 flex flex-col">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-4">
              <Mail className="w-6 h-6 text-slate-400" />
              <h3 className="text-lg font-bold">Pesan Baru</h3>
            </div>

            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center gap-4">
                <span className="font-bold text-sm text-slate-500 w-20">Kepada:</span>
                <div 
                  onDrop={(e) => handleDrop(e, 'penerima')}
                  onDragOver={handleDragOver}
                  className={`flex-1 min-h-[40px] rounded-lg p-2 transition-all ${slots.penerima ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border-2 border-dashed border-slate-300'}`}
                >
                  {slots.penerima ? <span className="text-sm font-medium">{slots.penerima.content}</span> : null}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-bold text-sm text-slate-500 w-20">Subjek:</span>
                <div 
                  onDrop={(e) => handleDrop(e, 'subjek')}
                  onDragOver={handleDragOver}
                  className={`flex-1 min-h-[40px] rounded-lg p-2 transition-all ${slots.subjek ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border-2 border-dashed border-slate-300'}`}
                >
                  {slots.subjek ? <span className="text-sm font-medium font-bold">{slots.subjek.content}</span> : null}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2 mt-4">
                <span className="font-bold text-sm text-slate-500">Isi Pesan:</span>
                <div 
                  onDrop={(e) => handleDrop(e, 'isi')}
                  onDragOver={handleDragOver}
                  className={`flex-1 min-h-[150px] rounded-lg p-4 transition-all ${slots.isi ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border-2 border-dashed border-slate-300'}`}
                >
                  {slots.isi ? <span className="text-sm whitespace-pre-wrap leading-relaxed">{slots.isi.content}</span> : null}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-200 mt-4">
                <span className="font-bold text-sm text-slate-500 w-20 flex items-center gap-1"><Paperclip className="w-4 h-4" /> Lampiran:</span>
                <div 
                  onDrop={(e) => handleDrop(e, 'lampiran')}
                  onDragOver={handleDragOver}
                  className={`flex-1 min-h-[40px] rounded-lg p-2 transition-all flex items-center gap-2 ${slots.lampiran ? 'bg-emerald-50 border border-emerald-200 text-blue-600' : 'bg-slate-50 border-2 border-dashed border-slate-300'}`}
                >
                  {slots.lampiran ? <><FileText className="w-4 h-4" /><span className="text-sm font-medium underline">{slots.lampiran.content}</span></> : null}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button disabled className="bg-blue-600 opacity-50 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 text-sm">
                <Send className="w-4 h-4" /> Kirim
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {isCompleted && (
        <div className="flex justify-center mt-6">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold">
            <CheckCircle className="w-5 h-5" />
            Selesai
          </div>
        </div>
      )}
    </div>
  );
}
// Temporary import fix for lucide-react above
