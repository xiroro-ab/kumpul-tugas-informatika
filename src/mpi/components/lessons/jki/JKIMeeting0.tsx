import React, { useState, useEffect } from 'react';
import { PlayCircle, CheckCircle, Wifi, Globe, Shield, Smartphone } from 'lucide-react';

interface JKIMeeting0Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function JKIMeeting0({ onCompleteMeeting, isCompleted }: JKIMeeting0Props) {
  const [canComplete, setCanComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanComplete(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const videos = [
    {
      title: "Macam-macam Jaringan Internet",
      desc: "Menjelaskan berbagai teknologi untuk terhubung ke internet seperti Fiber Optik, Wi-Fi, dan Seluler.",
      url: "https://www.youtube.com/embed/9ulvZMzljqs",
      icon: <Globe className="w-6 h-6" />
    },
    {
      title: "Macam-macam Jaringan Komputer",
      desc: "Mempelajari pengelompokan jaringan berdasarkan skala (LAN, MAN, WAN, PAN).",
      url: "https://www.youtube.com/embed/9ulvZMzljqs",
      icon: <Wifi className="w-6 h-6" />
    },
    {
      title: "Menghubungkan Perangkat ke Internet",
      desc: "Praktik cara menghubungkan ponsel dan komputer ke jaringan dengan kabel atau nirkabel.",
      url: "https://www.youtube.com/embed/pp4SSw_0uXA",
      icon: <Smartphone className="w-6 h-6" />
    },
    {
      title: "Praktik Enkripsi Sederhana",
      desc: "Memahami konsep keamanan data dengan menyandikan pesan di dunia digital.",
      url: "https://www.youtube.com/embed/U6mG5sceQ7k",
      icon: <Shield className="w-6 h-6" />
    }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Materi Pokok: Jaringan Komputer dan Internet (JKI)</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Pelajari video-video di bawah ini untuk memahami konsep jaringan lokal, global, serta praktik keamanan data.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {videos.map((video, idx) => (
          <div key={idx} className="rounded-3xl border border-white/10 bg-slate-900 overflow-hidden shadow-xl hover:shadow-cyan-500/10 transition-all duration-300">
            <div className="aspect-video w-full bg-slate-800 relative">
              <iframe
                width="100%"
                height="100%"
                src={video.url}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0"
              ></iframe>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-cyan-400">
                {video.icon}
                <h3 className="text-xl font-bold text-white">{video.title}</h3>
              </div>
              <p className="text-slate-400 text-sm">{video.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-8 border-t border-white/10">
        <button
          onClick={onCompleteMeeting}
          disabled={!canComplete && !isCompleted}
          className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all duration-300 ${
            isCompleted 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : canComplete 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25 hover:scale-105'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
          }`}
        >
          {isCompleted ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Materi Selesai Dipelajari</span>
            </>
          ) : canComplete ? (
            <>
              <PlayCircle className="w-5 h-5" />
              <span>Tandai Selesai & Lanjut</span>
            </>
          ) : (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-slate-500 border-t-transparent animate-spin" />
              <span>Mempelajari Materi...</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
