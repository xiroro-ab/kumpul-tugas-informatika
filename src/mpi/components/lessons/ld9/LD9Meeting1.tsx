import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ShieldCheck, Target, Video, ChevronDown, ChevronUp, Link as LinkIcon, FileCheck } from 'lucide-react';
import Swal from 'sweetalert2';

interface Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function LD9Meeting1({ onCompleteMeeting, isCompleted }: Props) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(true);
  
  const [matched, setMatched] = useState<{ [key: string]: string }>({});
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

    const concepts = [
    { id: 'ole', text: 'Object Linking and Embedding' },
    { id: 'linking', text: 'Data update otomatis dari sumber' },
    { id: 'embedding', text: 'Menyimpan objek utuh di file tujuan' },
    { id: 'app', text: 'Aplikasi perkantoran Microsoft' },
    { id: 'link_size', text: 'Ukuran file pada Linking' },
    { id: 'embed_size', text: 'Ukuran file pada Embedding' },
    { id: 'embed_edit', text: 'Mengedit data pada Embedding' }
  ];

    const definitions = [
    { id: 'def_app', text: 'Word, Excel, dan PowerPoint' },
    { id: 'def_linking', text: 'Butuh file sumber asli agar tidak error' },
    { id: 'def_ole', text: 'Teknologi dari Microsoft untuk integrasi' },
    { id: 'def_embedding', text: 'Tidak butuh file sumber, data berdiri sendiri' },
    { id: 'def_link_size', text: 'Cenderung lebih kecil karena hanya berupa referensi' },
    { id: 'def_embed_size', text: 'Menjadi lebih besar karena objek dimasukkan utuh' },
    { id: 'def_embed_edit', text: 'Harus membukanya dengan aplikasi asalnya, tetapi disave di file tujuan' }
  ];

  // Correct mappings mapping concept ID to definition ID
    const correctMatches: { [key: string]: string } = {
    'ole': 'def_ole',
    'linking': 'def_linking',
    'embedding': 'def_embedding',
    'app': 'def_app',
    'link_size': 'def_link_size',
    'embed_size': 'def_embed_size',
    'embed_edit': 'def_embed_edit'
  };

  const handleMatch = (defId: string) => {
    if (!selectedTerm) return;
    if (correctMatches[selectedTerm] === defId) {
      setMatched(prev => ({ ...prev, [selectedTerm]: defId }));
      setSelectedTerm(null);
      
      if (Object.keys(matched).length + 1 === concepts.length) {
        Swal.fire('Luar Biasa!', 'Kamu berhasil mencocokkan semua konsep OLE!', 'success');
      }
    } else {
      Swal.fire('Salah!', 'Konsep dan deskripsi tidak cocok, coba lagi!', 'error');
      setSelectedTerm(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] -z-10" />
        
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-teal-400" />
          Materi 1: Integrasi Aplikasi Perkantoran OLE
        </h2>

        <div className="prose prose-invert max-w-none text-slate-300">
          <p className="text-lg leading-relaxed mb-6">
            Selamat datang di pembelajaran Literasi Digital Materi 1: Integrasi Aplikasi Perkantoran menggunakan OLE.
          </p>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
            <h4 className="text-teal-400 font-bold mb-2">Intisari Materi:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>OLE (Object Linking and Embedding):</strong> Teknologi yang memungkinkan aplikasi Microsoft Office untuk saling berbagi data.</li>
              <li><strong>Linking:</strong> Objek yang disisipkan tetap terhubung dengan file sumber. Jika file sumber diubah, dokumen tujuan otomatis berubah. Ukuran file kecil.</li>
              <li><strong>Embedding:</strong> Objek disisipkan secara utuh ke dokumen tujuan. Perubahan di file sumber tidak mempengaruhi dokumen tujuan. Ukuran file menjadi besar.</li>
            </ul>
            <h4 className="text-teal-400 font-bold mt-4 mb-2">Contoh dalam Kehidupan Sehari-hari:</h4>
            <p>Memasukkan grafik (Chart) dari Excel ke dalam presentasi PowerPoint untuk laporan keuangan.</p>
          </div>
        </div>

        {/* Video Accordion */}
        <div className="mt-8 border border-white/10 bg-white/5 rounded-xl overflow-hidden">
          <button 
            onClick={() => setIsVideoOpen(!isVideoOpen)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Video className="w-6 h-6 text-teal-400" />
              <span className="font-bold text-lg text-white">Video Pembelajaran</span>
            </div>
            {isVideoOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          <AnimatePresence>
            {isVideoOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="p-6 border-t border-white/10 flex flex-col gap-6">
                  <div className="aspect-video rounded-xl overflow-hidden shadow-2xl md:w-2/3 mx-auto">
                    <iframe width="100%" height="100%" src="https://www.youtube.com/embed/JopvLS4w16s" title="YouTube video" frameBorder="0" allowFullScreen></iframe>
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
              <Target className="w-6 h-6 text-blue-400" />
              <span className="font-bold text-lg text-white">Mini Game Interaktif: Pencocokan Konsep OLE</span>
            </div>
            {isGameOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          <AnimatePresence>
            {isGameOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="p-6 border-t border-white/10 flex flex-col gap-6 relative">
                  
                  <p className="text-cyan-300 mb-2 font-bold text-center bg-cyan-900/40 py-2 rounded-lg border border-cyan-500/20">
                     Pilih satu konsep di sebelah kiri, lalu klik deskripsi yang tepat di sebelah kanan!
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <h4 className="text-white font-bold text-center mb-4">Konsep</h4>
                        {concepts.map(c => (
                           <button 
                              key={c.id}
                              onClick={() => !matched[c.id] && setSelectedTerm(c.id)}
                              className={`w-full p-4 rounded-xl font-bold text-sm transition-all border-2 ${matched[c.id] ? 'bg-green-900/50 border-green-500 text-green-300' : selectedTerm === c.id ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}`}
                              disabled={!!matched[c.id]}
                           >
                              {c.text}
                           </button>
                        ))}
                     </div>
                     <div className="space-y-3">
                        <h4 className="text-white font-bold text-center mb-4">Deskripsi / Efek</h4>
                        {definitions.map(d => {
                           const isMatched = Object.values(matched).includes(d.id);
                           return (
                             <button 
                                key={d.id}
                                onClick={() => handleMatch(d.id)}
                                className={`w-full p-4 rounded-xl font-bold text-sm transition-all border-2 ${isMatched ? 'bg-green-900/50 border-green-500 text-green-300' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}`}
                                disabled={isMatched}
                             >
                                {d.text}
                             </button>
                           )
                        })}
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
                if(Object.keys(matched).length < concepts.length) {
                  Swal.fire('Belum Selesai', 'Selesaikan mini game pencocokan terlebih dahulu ya.', 'warning');
                  return;
                }
                Swal.fire({ title: 'Materi Selesai!', text: 'Anda telah menyelesaikan materi ini. Silakan lanjut ke evaluasi game.', icon: 'success', confirmButtonColor: '#0ea5e9' }).then(() => onCompleteMeeting());
              }}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/30"
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
