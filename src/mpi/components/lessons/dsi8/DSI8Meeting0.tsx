import React from 'react';
import { BookOpen, Target, Sparkles } from 'lucide-react';

interface DSI8Meeting0Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const DSI8Meeting0: React.FC<DSI8Meeting0Props> = ({ onCompleteMeeting, isCompleted }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500"></div>
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-orange-500/20 p-3 rounded-xl border border-orange-500/30">
              <BookOpen className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Pendahuluan Dampak Sosial Informatika</h2>
              <p className="text-slate-400 mt-1">Media Sosial, Informasi Kritis & Cyberbullying</p>
            </div>
          </div>
          <div className="prose prose-invert max-w-none text-slate-300">
            <p className="text-lg leading-relaxed">
              Selamat datang di Bab Dampak Sosial Informatika Kelas 8! Pada bab ini, kita akan mempelajari lebih jauh tentang apa itu media sosial, dampak penggunaannya, bagaimana mengkaji informasi secara kritis untuk menghindari hoaks, serta memahami bahaya cyberbullying.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-orange-400" />
                  <h3 className="text-lg font-bold text-white m-0">Tujuan Pembelajaran</h3>
                </div>
                <ul className="list-disc list-inside space-y-2 text-slate-300">
                  <li>Memahami karakteristik dan klasifikasi media sosial.</li>
                  <li>Menganalisis dampak positif dan negatif media sosial.</li>
                  <li>Mengkaji kritis informasi untuk mencegah penyebaran hoaks.</li>
                  <li>Memahami dan mencegah tindakan cyberbullying.</li>
                </ul>
              </div>
              <div className="bg-orange-500/10 p-6 rounded-2xl border border-orange-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-orange-400" />
                  <h3 className="text-lg font-bold text-orange-300 m-0">Mengapa Ini Penting?</h3>
                </div>
                <p className="text-slate-300 leading-relaxed m-0">
                  Di era digital, kita semua adalah warga digital. Memahami dampak sosial teknologi sangat penting untuk menjaga etika, keamanan, dan kesehatan mental saat berselancar di dunia maya.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button
              onClick={onCompleteMeeting}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-orange-400 hover:to-amber-400 transition-all shadow-lg hover:shadow-orange-500/25 flex items-center gap-2"
            >
              {isCompleted ? 'Selesai & Lanjut' : 'Tandai Selesai & Lanjut'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DSI8Meeting0;
