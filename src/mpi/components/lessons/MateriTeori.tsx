import React from 'react';
import { BookOpen, Youtube, CheckCircle } from 'lucide-react';

interface MateriTeoriProps {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function MateriTeori({ onCompleteMeeting, isCompleted }: MateriTeoriProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Materi Pokok: Berpikir Komputasional</h2>
        <p className="mt-2 text-slate-400 max-w-xl mx-auto font-medium">
          Pelajari konsep dasar dan implementasi Berpikir Komputasional sebelum kamu mulai bermain game!
        </p>
      </div>

      {/* Slide Presentasi */}
      <div className="rounded-3xl border border-white/10 bg-slate-900 overflow-hidden shadow-2xl p-6 sm:p-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 justify-center sm:justify-start">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          Materi 1: Konsep & Teknik Berpikir Komputasional
        </h3>
        <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 shadow-lg border border-white/5" style={{ paddingTop: '56.25%' }}>
          <iframe 
            className="absolute top-0 left-0 w-full h-full" 
            src="https://docs.google.com/presentation/d/e/2PACX-1vSvI9YzJi9eslwBxoK_jQOViRHovxeDCfEY098e4XjJnLzFCKYEi6foWFXm7YsygDUxDs8TVApXd2RM/embed?start=false&loop=true&delayms=3000" 
            frameBorder="0" 
            allowFullScreen={true} 
          />
        </div>
      </div>

      {/* Video YouTube */}
      <div className="rounded-3xl border border-white/10 bg-slate-900 overflow-hidden shadow-2xl p-6 sm:p-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 justify-center sm:justify-start">
          <Youtube className="w-6 h-6 text-red-400" />
          Materi 2: Implementasi Metode Berpikir Komputasional
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 shadow-lg border border-white/5" style={{ paddingTop: '56.25%' }}>
            <iframe 
              className="absolute top-0 left-0 w-full h-full" 
              src="https://www.youtube.com/embed/umfcvkLdUgg?si=ZyrdzAcD4GtTNcxP" 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen={true} 
            />
          </div>
          <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 shadow-lg border border-white/5" style={{ paddingTop: '56.25%' }}>
            <iframe 
              className="absolute top-0 left-0 w-full h-full" 
              src="https://www.youtube.com/embed/W7QHzuucy2A?si=KDPGtkpd9Q4D5HgC" 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen={true} 
            />
          </div>
        </div>
      </div>

      {/* Selesaikan Button */}
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
