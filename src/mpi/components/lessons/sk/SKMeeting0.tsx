import React, { useState, useEffect } from 'react';
import { PlayCircle, CheckCircle, Monitor, Cpu, Settings, Binary, BookOpen } from 'lucide-react';

interface SKMeeting0Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function SKMeeting0({ onCompleteMeeting, isCompleted }: SKMeeting0Props) {
  const [canComplete, setCanComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanComplete(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const videos = [
    {
      title: "Jenis-Jenis Komputer",
      desc: "Menjelaskan berbagai jenis komputer seperti superkomputer, mainframe, PC, dan mikrokomputer.",
      url: "https://www.youtube.com/embed/kh-24TUq6_s",
      icon: <Monitor className="w-6 h-6" />
    },
    {
      title: "Manfaat Komputer",
      desc: "Apa saja manfaat komputer dalam kehidupan kita sehari-hari?",
      url: "https://www.youtube.com/embed/3twgEo7CW80",
      icon: <BookOpen className="w-6 h-6" />
    },
    {
      title: "Komponen Sistem Komputer",
      desc: "Membahas 3 komponen utama: Hardware, Software, dan Brainware.",
      url: "https://www.youtube.com/embed/YvoBKDMmLFU",
      icon: <Cpu className="w-6 h-6" />
    },
    {
      title: "Cara Kerja Komputer",
      desc: "Bagaimana komputer memproses data (Input, Process, Storage, Output).",
      url: "https://www.youtube.com/embed/OUnDeczITHc",
      icon: <Settings className="w-6 h-6" />
    },
    {
      title: "Bilangan Biner & Konversi",
      desc: "Pengenalan bahasa mesin yang menggunakan angka 0 dan 1.",
      url: "https://www.youtube.com/embed/7H-PrrfDw8w",
      icon: <Binary className="w-6 h-6" />
    }
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="text-center space-y-4 mb-8">
        <h2 className="text-3xl font-extrabold text-white">Materi Pokok: Sistem Komputer</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Tonton seluruh video pembelajaran di bawah ini untuk memahami fondasi Sistem Komputer sebelum lanjut ke permainan interaktif.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {videos.map((vid, idx) => (
          <div key={idx} className={`bg-slate-900 border border-white/10 p-6 rounded-3xl shadow-xl ${idx === 4 ? 'md:col-span-2 md:w-1/2 md:mx-auto' : ''}`}>
            <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-4">
              <div className="p-3 bg-cyan-500/20 rounded-xl text-cyan-400">
                {vid.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{vid.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{vid.desc}</p>
              </div>
            </div>
            
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/5 relative group">
              <iframe 
                src={vid.url} 
                title={vid.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-8 border-t border-white/10 mt-8">
        <button
          onClick={onCompleteMeeting}
          disabled={!canComplete && !isCompleted}
          className={`flex items-center gap-2 px-8 py-4 font-bold rounded-xl transition-all ${
            isCompleted 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : canComplete
              ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20'
              : 'bg-white/5 text-slate-500 cursor-not-allowed'
          }`}
        >
          <CheckCircle className="w-5 h-5" />
          {isCompleted ? 'Materi Selesai Dipelajari' : 'Tandai Selesai & Lanjut'}
        </button>
      </div>
    </div>
  );
}
