import React from 'react';
import { Youtube, CheckCircle } from 'lucide-react';

interface TIKMeeting0Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function TIKMeeting0({ onCompleteMeeting, isCompleted }: TIKMeeting0Props) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Materi Pokok: Teknologi Informasi dan Komunikasi</h2>
        <p className="mt-2 text-slate-400 max-w-xl mx-auto font-medium">
          Pelajari konsep dasar TIK dari antarmuka, peramban, hingga surel melalui video pembelajaran berikut!
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 overflow-hidden shadow-2xl p-6 sm:p-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 justify-center sm:justify-start">
          <Youtube className="w-6 h-6 text-red-400" />
          Materi 1: Antarmuka & Pengelolaan File
        </h3>
        <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 shadow-lg border border-white/5" style={{ paddingTop: '56.25%' }}>
          <iframe 
            className="absolute top-0 left-0 w-full h-full"
            src="https://www.youtube.com/embed/0CwN73Iwz8I?si=IzJDqv8XGC-uiF0Y" 
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen={true}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 overflow-hidden shadow-2xl p-6 sm:p-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 justify-center sm:justify-start">
          <Youtube className="w-6 h-6 text-red-400" />
          Materi 2: Peramban & Aplikasi Perkantoran
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 shadow-lg border border-white/5" style={{ paddingTop: '56.25%' }}>
            <iframe 
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/xA2ZFOu9L7g?si=1YDzyVaF94jPAw6A" 
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen={true}
            />
          </div>
          <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 shadow-lg border border-white/5" style={{ paddingTop: '56.25%' }}>
            <iframe 
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/0IPFGbHPor4?si=G0UKE7gytNVwRCCX" 
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen={true}
            />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 overflow-hidden shadow-2xl p-6 sm:p-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 justify-center sm:justify-start">
          <Youtube className="w-6 h-6 text-red-400" />
          Materi 3: Komunikasi Surel
        </h3>
        <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 shadow-lg border border-white/5" style={{ paddingTop: '56.25%' }}>
          <iframe 
            className="absolute top-0 left-0 w-full h-full"
            src="https://www.youtube.com/embed/LsQLlnBKkZU?si=D45bUWVadsq0x1fE" 
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen={true}
          />
        </div>
      </div>

      <div className="flex justify-center pt-4">
        {isCompleted ? (
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold">
            <CheckCircle className="w-5 h-5" />
            Materi Telah Dipelajari
          </div>
        ) : (
          <button 
            onClick={onCompleteMeeting}
            className="px-8 py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-lg transition-colors shadow-lg shadow-cyan-500/20"
          >
            Saya Sudah Mempelajari Materi Ini
          </button>
        )}
      </div>
    </div>
  );
}
