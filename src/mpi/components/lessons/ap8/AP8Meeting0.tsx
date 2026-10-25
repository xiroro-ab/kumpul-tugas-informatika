import React from 'react';
import { BookOpen, Target, Sparkles } from 'lucide-react';

interface AP8Meeting0Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const AP8Meeting0: React.FC<AP8Meeting0Props> = ({ onCompleteMeeting, isCompleted }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-blue-500/20 p-3 rounded-xl border border-blue-500/30">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Pendahuluan Algoritma dan Pemrograman</h2>
              <p className="text-slate-400 mt-1">Pemrograman Visual (Blockly & Scratch)</p>
            </div>
          </div>
          <div className="prose prose-invert max-w-none text-slate-300">
            <p className="text-lg leading-relaxed">
              Selamat datang di Bab Algoritma dan Pemrograman Kelas 8! Pada bab ini, kita akan memperdalam pemahaman logika algoritma dan implementasinya melalui bahasa pemrograman visual seperti Blockly dan Scratch.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-blue-400" />
                  <h3 className="text-lg font-bold text-white m-0">Tujuan Pembelajaran</h3>
                </div>
                <ul className="list-disc list-inside space-y-2 text-slate-300">
                  <li>Memahami konsep dasar algoritma.</li>
                  <li>Menyusun logika dengan game Blockly.</li>
                  <li>Memahami struktur blok pada Scratch.</li>
                  <li>Membuat game interaktif sederhana di Scratch.</li>
                </ul>
              </div>
              <div className="bg-blue-500/10 p-6 rounded-2xl border border-blue-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                  <h3 className="text-lg font-bold text-blue-300 m-0">Mengapa Ini Penting?</h3>
                </div>
                <p className="text-slate-300 leading-relaxed m-0">
                  Kemampuan berpikir komputasional dan menyusun algoritma adalah fondasi utama dalam menciptakan berbagai teknologi masa kini.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button
              onClick={onCompleteMeeting}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-400 hover:to-indigo-400 transition-all shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
            >
              {isCompleted ? 'Selesai & Lanjut' : 'Tandai Selesai & Lanjut'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AP8Meeting0;
