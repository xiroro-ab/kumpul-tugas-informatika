import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Video, ChevronDown, ChevronUp, Gamepad2, PieChart, CheckCircle, RefreshCcw } from 'lucide-react';
import Swal from 'sweetalert2';

interface AD8Meeting2Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const MATCH_PAIRS = [
  { id: 'pie', term: 'Pie Chart', desc: 'Menunjukkan persentase bagian dari keseluruhan' },
  { id: 'line', term: 'Line Chart', desc: 'Menampilkan tren data dari waktu ke waktu' },
  { id: 'bar', term: 'Column / Bar Chart', desc: 'Membandingkan jumlah data antar kategori' },
];

const shuffleArray = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

const AD8Meeting2: React.FC<AD8Meeting2Props> = ({ onCompleteMeeting, isCompleted }) => {
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
              title: 'Brilian!',
              text: 'Kamu berhasil memasangkan semua jenis grafik dengan fungsinya!',
              background: '#1e293b',
              color: '#fff',
              confirmButtonColor: '#f59e0b'
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
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
        <button 
          onClick={() => setShowTheory(!showTheory)}
          className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <BookOpen className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white text-left">Visualisasi Data (Chart)</h2>
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
                <p>Data berupa angka di tabel sering kali sulit untuk dipahami secara cepat. Oleh karena itu, kita menggunakan <strong>Visualisasi Data (Chart/Grafik)</strong> untuk membuatnya lebih mudah dibaca.</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Pie Chart (Diagram Lingkaran):</strong> Sangat cocok untuk menunjukkan persentase atau bagian dari keseluruhan (misal: persentase pemilih OSIS).</li>
                  <li><strong>Column / Bar Chart (Diagram Batang):</strong> Digunakan untuk membandingkan jumlah data antar kategori yang berbeda (misal: jumlah siswa tiap kelas).</li>
                  <li><strong>Line Chart (Diagram Garis):</strong> Paling tepat untuk menunjukkan tren atau perubahan data dari waktu ke waktu (misal: suhu rata-rata setiap bulan).</li>
                </ul>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                <strong>💡 Contoh Kehidupan Sehari-hari:</strong> Saat melihat berita tentang perkembangan virus, stasiun TV sering menampilkan "Line Chart" untuk menunjukkan apakah kasusnya naik atau turun dari hari ke hari.
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
            <h2 className="text-xl font-bold text-white text-left">Mini Game: Pasangkan Grafik</h2>
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
                      Klik nama grafik (Kiri) dan pasangkan dengan kegunaannya (Kanan)!
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left Column (Terms) */}
                      <div className="space-y-3">
                        <h3 className="text-slate-400 font-bold text-center mb-2">Jenis Grafik</h3>
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
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/50 opacity-50 cursor-not-allowed"
                                  : isSelected
                                    ? "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-105"
                                    : "bg-slate-700 hover:bg-slate-600 text-slate-200 border border-white/10"
                              }`}
                            >
                              <PieChart className="w-5 h-5 shrink-0" />
                              {t.text}
                            </button>
                          );
                        })}
                      </div>

                      {/* Right Column (Descriptions) */}
                      <div className="space-y-3">
                        <h3 className="text-slate-400 font-bold text-center mb-2">Kegunaan</h3>
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
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/50 opacity-50 cursor-not-allowed"
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
                    <CheckCircle className="w-16 h-16 text-amber-400 mx-auto" />
                    <h3 className="text-2xl font-bold text-white">Hebat!</h3>
                    <p className="text-slate-300">
                      Kamu sekarang paham kapan harus menggunakan berbagai jenis grafik.
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
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-amber-500/25"
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

export default AD8Meeting2;
