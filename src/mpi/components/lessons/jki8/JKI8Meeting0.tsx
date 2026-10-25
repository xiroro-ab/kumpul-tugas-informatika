import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, PlayCircle, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface JKI8Meeting0Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const JKI8Meeting0: React.FC<JKI8Meeting0Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [materialsWatched, setMaterialsWatched] = useState([false, false, false, false]);
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);

  const handleMaterialWatch = (index: number) => {
    const newWatched = [...materialsWatched];
    newWatched[index] = true;
    setMaterialsWatched(newWatched);
  };

  const allWatched = materialsWatched.every(v => v);

  const toggleAccordion = (index: number) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  const materials = [
    {
      title: "Materi 1: Jaringan Komputer dan Internet",
      icon: <PlayCircle className="w-6 h-6 text-cyan-400" />,
      color: "from-blue-500 to-cyan-500",
      btnColor: "bg-cyan-600 hover:bg-cyan-500",
      content: (
        <iframe 
          className="w-full h-full"
          src="https://www.youtube.com/embed/u_OfRibVQug" 
          title="Jenis-jenis Jaringan Komputer" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowFullScreen
        ></iframe>
      )
    },
    {
      title: "Materi 2: Konfigurasi & Routing Jaringan",
      icon: <PlayCircle className="w-6 h-6 text-indigo-400" />,
      color: "from-indigo-500 to-purple-500",
      btnColor: "bg-indigo-600 hover:bg-indigo-500",
      content: (
        <iframe 
          className="w-full h-full"
          src="https://www.youtube.com/embed/NSTqaqAEqnI" 
          title="Routing Jaringan" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowFullScreen
        ></iframe>
      )
    },
    {
      title: "Materi 3: Komunikasi Data pada Ponsel",
      icon: <PlayCircle className="w-6 h-6 text-emerald-400" />,
      color: "from-emerald-500 to-teal-500",
      btnColor: "bg-emerald-600 hover:bg-emerald-500",
      content: (
        <iframe 
          className="w-full h-full"
          src="https://www.youtube.com/embed/IkkbZjqKosg" 
          title="Jenis Sinyal" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowFullScreen
        ></iframe>
      )
    },
    {
      title: "Materi 4: Koneksi Perangkat Secara Aman",
      icon: <PlayCircle className="w-6 h-6 text-pink-400" />,
      color: "from-pink-500 to-rose-500",
      btnColor: "bg-pink-600 hover:bg-pink-500",
      content: (
        <iframe 
          className="w-full h-full"
          src="https://www.youtube.com/embed/2qp-fXKpDoA" 
          title="Koneksi Aman" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowFullScreen
        ></iframe>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          Pengantar Jaringan Komputer & Internet
        </h3>
        <p className="text-slate-300 leading-relaxed">
          Pada bab ini, kita akan mempelajari konsep jaringan komputer, alamat IP (Internet Protocol), jenis sinyal, serta cara mengkoneksikan perangkat ke internet secara aman. Silakan pelajari video berikut sebelum melanjutkan ke tahap interaktif. Klik pada setiap judul untuk membuka materi.
        </p>
      </div>

      <div className="space-y-4">
        {materials.map((mat, index) => (
          <div key={index} className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${mat.color}`}></div>
            
            <button 
              onClick={() => toggleAccordion(index)}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                {mat.icon}
                <h2 className="text-xl font-bold text-white text-left">{mat.title}</h2>
              </div>
              <div className="flex items-center gap-4">
                {materialsWatched[index] && <CheckCircle className="w-6 h-6 text-green-400" />}
                {activeAccordion === index ? <ChevronUp className="w-6 h-6 text-slate-400" /> : <ChevronDown className="w-6 h-6 text-slate-400" />}
              </div>
            </button>

            <AnimatePresence>
              {activeAccordion === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-6"
                >
                  <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative mb-6">
                    {mat.content}
                  </div>
                  <button 
                    onClick={() => handleMaterialWatch(index)}
                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      materialsWatched[index] ? 'bg-green-500/20 text-green-400 border border-green-500/30' : `${mat.btnColor} text-white shadow-lg`
                    }`}
                  >
                    {materialsWatched[index] ? <><CheckCircle className="w-5 h-5" /> Sudah Dipelajari</> : 'Tandai Selesai Dipelajari'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-4 border-t border-white/10">
        <button
          onClick={onCompleteMeeting}
          disabled={!allWatched || isCompleted}
          className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl ${
            isCompleted 
              ? 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-not-allowed' 
              : allWatched 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white transform hover:scale-105'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          <CheckCircle className="w-6 h-6" />
          {isCompleted ? 'Materi Selesai' : 'Selesaikan Materi Pokok'}
        </button>
      </div>
    </div>
  );
};

export default JKI8Meeting0;
