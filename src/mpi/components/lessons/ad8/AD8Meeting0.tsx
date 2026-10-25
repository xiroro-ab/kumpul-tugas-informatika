import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Video, Target, Sparkles, Youtube } from 'lucide-react';

interface AD8Meeting0Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const AD8Meeting0: React.FC<AD8Meeting0Props> = ({ onCompleteMeeting, isCompleted }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/30">
              <BookOpen className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Pendahuluan Analisis Data</h2>
              <p className="text-slate-400 mt-1">Microsoft Excel untuk Pengolahan Data</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-slate-300">
            <p className="text-lg leading-relaxed">
              Selamat datang di Bab Analisis Data Kelas 8! Pada bab ini, kita akan memperdalam kemampuan menggunakan aplikasi pengolah angka (seperti Microsoft Excel) untuk melakukan analisis data, pencarian data (Lookup & Reference), memvisualisasikan data ke dalam bentuk grafik, serta mengelola data menggunakan fitur Tabel.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white m-0">Tujuan Pembelajaran</h3>
                </div>
                <ul className="list-disc list-inside space-y-2 text-slate-300">
                  <li>Memahami fungsi VLOOKUP dan HLOOKUP.</li>
                  <li>Menggunakan Reference (Absolute & Relative) di Excel.</li>
                  <li>Membuat dan membaca berbagai jenis grafik.</li>
                  <li>Memanfaatkan fitur Table untuk Filter dan Sort.</li>
                </ul>
              </div>

              <div className="bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-lg font-bold text-emerald-300 m-0">Mengapa Ini Penting?</h3>
                </div>
                <p className="text-slate-300 leading-relaxed m-0">
                  Di era digital, data adalah kunci. Kemampuan mengolah dan menganalisis data dengan cepat menggunakan Excel sangat dibutuhkan dalam berbagai profesi, dari dunia pendidikan, bisnis, hingga teknologi informasi.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={onCompleteMeeting}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2"
            >
              {isCompleted ? 'Selesai & Lanjut' : 'Tandai Selesai & Lanjut'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AD8Meeting0;
