import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Video, ChevronDown, ChevronUp, Gamepad2, Filter, CheckCircle, RefreshCcw } from 'lucide-react';
import Swal from 'sweetalert2';

interface AD8Meeting3Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const MATCH_PAIRS = [
  { id: 'filter', term: 'Filter Data', desc: 'Menampilkan data tertentu dan menyembunyikan sisanya' },
  { id: 'sort', term: 'Sort Data (A-Z)', desc: 'Mengurutkan data sesuai urutan abjad atau nilai' },
  { id: 'table', term: 'Format as Table', desc: 'Membuat tabel otomatis dengan desain dan fitur lengkap' },
];

const shuffleArray = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

const AD8Meeting3: React.FC<AD8Meeting3Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showTheory, setShowTheory] = useState(true);
  const [showGame, setShowGame] = useState(false);
  
  const [terms, setTerms] = useState<any[]>([]);
  const [descs, setDescs] = useState<any[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedDesc, setSelectedDesc] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    setTerms(shuffleArray(MATCH_PAIRS.map(p => ({ id: p.id, text: p.term }))));
    setDescs(shuffleArray(MATCH_PAIRS.map(p => ({ id: p.id, text: p.desc }))));
    setSelectedTerm(null);
    setSelectedDesc(null);
    setMatchedPairs([]);
    setGameFinished(false);
  };

  const handleSelectTerm = (id: string) => {
    if (matchedPairs.includes(id)) return;
    setSelectedTerm(id);
    checkMatch(id, selectedDesc);
  };

  const handleSelectDesc = (id: string) => {
    if (matchedPairs.includes(id)) return;
    setSelectedDesc(id);
    checkMatch(selectedTerm, id);
  };

  const checkMatch = (termId: string | null, descId: string | null) => {
    if (termId && descId) {
      if (termId === descId) {
        const newMatched = [...matchedPairs, termId];
        setMatchedPairs(newMatched);
        setSelectedTerm(null);
        setSelectedDesc(null);
        
        if (newMatched.length === MATCH_PAIRS.length) {
          setTimeout(() => {
            setGameFinished(true);
            Swal.fire({
              icon: 'success',
              title: 'Sempurna!',
              text: 'Kamu berhasil memasangkan semua fitur dengan tepat!',
              background: '#1e293b',
              color: '#fff',
              confirmButtonColor: '#3b82f6'
            });
          }, 500);
        }
      } else {
        setTimeout(() => {
          setSelectedTerm(null);
          setSelectedDesc(null);
        }, 500);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
        <button 
          onClick={() => setShowTheory(!showTheory)}
          className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <BookOpen className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white text-left">Pengelolaan Data Tabel (Sort & Filter)</h2>
          </div>
          <div className="flex items-center gap-4">
            {showTheory ? <ChevronUp className="w-6 h-6 text-slate-400" /> : <ChevronDown className="w-6 h-6 text-slate-400" />}
          </div>
        </button>

        <AnimatePresence>
          {showTheory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-6 text-slate-300 leading-relaxed space-y-6"
            >
              <div className="space-y-4">
                <p>Ketika kamu memiliki banyak data di Excel, kamu perlu alat untuk merapikan dan memilah informasi tersebut. Di sinilah <strong>Sort</strong>, <strong>Filter</strong>, dan <strong>Table</strong> sangat membantu.</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Sort (Mengurutkan):</strong> Digunakan untuk menyusun data dari terkecil ke terbesar (A-Z) atau sebaliknya (Z-A).</li>
                  <li><strong>Filter (Menyaring):</strong> Fitur untuk menyembunyikan data yang tidak ingin dilihat, sehingga hanya menampilkan data yang sesuai kriteria (misal: hanya melihat siswa kelas 8A).</li>
                  <li><strong>Format as Table:</strong> Mengubah sekumpulan data menjadi tabel resmi Excel yang secara otomatis memiliki fitur Sort & Filter, serta warna yang rapi.</li>
                </ul>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                <strong>💡 Contoh Kehidupan Sehari-hari:</strong> Saat kamu berbelanja di toko online (misal: Tokopedia/Shopee), kamu sering mengklik "Urutkan dari Harga Termurah" (Sort) atau "Hanya tampilkan produk Diskon" (Filter).
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
        <button 
          onClick={() => setShowGame(!showGame)}
          className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <Gamepad2 className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white text-left">Mini Game: Pasangkan Fitur Excel</h2>
          </div>
          <div className="flex items-center gap-4">
            {showGame ? <ChevronUp className="w-6 h-6 text-slate-400" /> : <ChevronDown className="w-6 h-6 text-slate-400" />}
          </div>
        </button>

        <AnimatePresence>
          {showGame && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-6"
            >
              <div className="bg-slate-800 rounded-2xl p-6 border border-white/5">
                {!gameFinished ? (
                  <div className="space-y-6">
                    <p className="text-slate-300 text-center mb-6">
                      Klik fitur di sebelah kiri dan pasangkan dengan kegunaannya di sebelah kanan!
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left Column (Terms) */}
                      <div className="space-y-3">
                        <h3 className="text-slate-400 font-bold text-center mb-2">Fitur</h3>
                        {terms.map((t) => {
                          const isMatched = matchedPairs.includes(t.id);
                          const isSelected = selectedTerm === t.id;
                          return (
                            <button
                              key={`term-${t.id}`}
                              onClick={() => handleSelectTerm(t.id)}
                              disabled={isMatched}
                              className={`w-full p-4 rounded-xl font-bold text-left transition-all flex items-center gap-3 ${
                                isMatched 
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/50 opacity-50 cursor-not-allowed"
                                  : isSelected
                                    ? "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-105"
                                    : "bg-slate-700 hover:bg-slate-600 text-slate-200 border border-white/10"
                              }`}
                            >
                              <Filter className="w-5 h-5 shrink-0" />
                              {t.text}
                            </button>
                          );
                        })}
                      </div>

                      {/* Right Column (Descriptions) */}
                      <div className="space-y-3">
                        <h3 className="text-slate-400 font-bold text-center mb-2">Fungsi</h3>
                        {descs.map((d) => {
                          const isMatched = matchedPairs.includes(d.id);
                          const isSelected = selectedDesc === d.id;
                          return (
                            <button
                              key={`desc-${d.id}`}
                              onClick={() => handleSelectDesc(d.id)}
                              disabled={isMatched}
                              className={`w-full p-4 rounded-xl font-medium text-sm text-left transition-all ${
                                isMatched 
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/50 opacity-50 cursor-not-allowed"
                                  : isSelected
                                    ? "bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)] scale-105"
                                    : "bg-slate-700 hover:bg-slate-600 text-slate-200 border border-white/10"
                              }`}
                            >
                              {d.text}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-6">
                    <CheckCircle className="w-16 h-16 text-blue-400 mx-auto" />
                    <h3 className="text-2xl font-bold text-white">Luar Biasa!</h3>
                    <p className="text-slate-300">
                      Kamu telah berhasil memasangkan semua fitur dengan benar.
                    </p>
                    <div className="flex justify-center gap-4 mt-6">
                      <button
                        onClick={resetGame}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors"
                      >
                        <RefreshCcw className="w-5 h-5" /> Ulangi
                      </button>
                      <button
                        onClick={onCompleteMeeting}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/25"
                      >
                        {isCompleted ? 'Selesai & Lanjut' : 'Tandai Selesai & Lanjut'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AD8Meeting3;
