import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, PlayCircle, BookOpen } from 'lucide-react';

interface TIK8Meeting0Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const TIK8Meeting0: React.FC<TIK8Meeting0Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [videoWatched, setVideoWatched] = useState([false, false, false]);

  const handleVideoWatch = (index: number) => {
    const newWatched = [...videoWatched];
    newWatched[index] = true;
    setVideoWatched(newWatched);
  };

  const allWatched = videoWatched.every(v => v);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          Pengantar Teknologi Informasi & Komunikasi
        </h3>
        <p className="text-slate-300 leading-relaxed">
          Pada bab ini, kita akan mempelajari berbagai perangkat lunak aplikasi, memahami objek dan fiturnya, serta mengeksplorasi penggunaan Laboratorium Maya untuk simulasi eksperimen. Silakan pelajari video-video berikut sebelum melanjutkan ke tahap interaktif.
        </p>
      </div>

      <div className="space-y-8">
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-6">
            <PlayCircle className="w-7 h-7 text-blue-400" />
            Video 1: Memahami Objek pada Aplikasi
          </h2>
          <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative mb-6">
            <iframe 
              className="w-full h-full"
              src="https://www.youtube.com/embed/7fzCyA3b3fc" 
              title="Memahami Objek Aplikasi" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
            ></iframe>
          </div>
          <button 
            onClick={() => handleVideoWatch(0)}
            className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              videoWatched[0] ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
            }`}
          >
            {videoWatched[0] ? <><CheckCircle className="w-5 h-5" /> Sudah Dipelajari</> : 'Tandai Selesai Dipelajari'}
          </button>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-6">
            <PlayCircle className="w-7 h-7 text-indigo-400" />
            Video 2: Memahami Fitur pada Aplikasi
          </h2>
          <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative mb-6">
            <iframe 
              className="w-full h-full"
              src="https://www.youtube.com/embed/rq30ZQphWA4" 
              title="Memahami Fitur Aplikasi" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
            ></iframe>
          </div>
          <button 
            onClick={() => handleVideoWatch(1)}
            className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              videoWatched[1] ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
            }`}
          >
            {videoWatched[1] ? <><CheckCircle className="w-5 h-5" /> Sudah Dipelajari</> : 'Tandai Selesai Dipelajari'}
          </button>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-6">
            <PlayCircle className="w-7 h-7 text-purple-400" />
            Video 3: Laboratorium Maya
          </h2>
          <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative mb-6">
            <iframe 
              className="w-full h-full"
              src="https://www.youtube.com/embed/a75JMOXIxnI" 
              title="Laboratorium Maya" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
            ></iframe>
          </div>
          <button 
            onClick={() => handleVideoWatch(2)}
            className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              videoWatched[2] ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg'
            }`}
          >
            {videoWatched[2] ? <><CheckCircle className="w-5 h-5" /> Sudah Dipelajari</> : 'Tandai Selesai Dipelajari'}
          </button>
        </div>
      </div>

      <div className="flex justify-center pt-8 border-t border-white/10">
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

export default TIK8Meeting0;
