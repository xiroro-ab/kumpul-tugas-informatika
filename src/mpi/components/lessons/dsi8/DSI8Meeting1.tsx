import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, BookOpen, Presentation, Gamepad2, AlertCircle, RefreshCw, Play, ChevronDown, ChevronUp } from 'lucide-react';
import Swal from 'sweetalert2';

interface DSI8Meeting1Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const IMPACTS = [
  { id: '1', text: 'Memperluas jaringan pertemanan', type: 'positive' },
  { id: '2', text: 'Kecanduan dan lupa waktu', type: 'negative' },
  { id: '3', text: 'Mudah mendapatkan informasi terbaru', type: 'positive' },
  { id: '4', text: 'Terpapar konten hoaks atau tidak pantas', type: 'negative' },
  { id: '5', text: 'Mengurangi interaksi sosial secara langsung', type: 'negative' },
  { id: '6', text: 'Sarana promosi bisnis dan karya', type: 'positive' },
];

const DSI8Meeting1: React.FC<DSI8Meeting1Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  const [showVideo1, setShowVideo1] = useState(true);
  const [showVideo2, setShowVideo2] = useState(false);

  // Game state
  const [unassigned, setUnassigned] = useState(IMPACTS);
  const [positiveImpacts, setPositiveImpacts] = useState<typeof IMPACTS>([]);
  const [negativeImpacts, setNegativeImpacts] = useState<typeof IMPACTS>([]);
  const [selectedItem, setSelectedItem] = useState<(typeof IMPACTS)[0] | null>(null);

  const handleSelect = (item: (typeof IMPACTS)[0]) => {
    setSelectedItem(item);
  };

  const moveTo = (target: 'positive' | 'negative' | 'unassigned') => {
    if (!selectedItem) return;

    // Remove from current lists
    setUnassigned(prev => prev.filter(i => i.id !== selectedItem.id));
    setPositiveImpacts(prev => prev.filter(i => i.id !== selectedItem.id));
    setNegativeImpacts(prev => prev.filter(i => i.id !== selectedItem.id));

    // Add to new list
    if (target === 'positive') setPositiveImpacts(prev => [...prev, selectedItem]);
    if (target === 'negative') setNegativeImpacts(prev => [...prev, selectedItem]);
    if (target === 'unassigned') setUnassigned(prev => [...prev, selectedItem]);

    setSelectedItem(null);
  };

  const checkAnswer = () => {
    if (unassigned.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Belum Selesai',
        text: 'Kelompokkan semua dampak ke kategori yang tepat!',
        background: '#1e293b',
        color: '#fff',
      });
      return;
    }

    const isPositiveCorrect = positiveImpacts.every(item => item.type === 'positive');
    const isNegativeCorrect = negativeImpacts.every(item => item.type === 'negative');
    const allAssigned = positiveImpacts.length === 3 && negativeImpacts.length === 3;

    if (isPositiveCorrect && isNegativeCorrect && allAssigned) {
      Swal.fire({
        icon: 'success',
        title: 'Tepat Sekali!',
        text: 'Kamu berhasil mengklasifikasikan dampak positif dan negatif media sosial dengan benar.',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#22c55e'
      }).then(() => {
        if (!isCompleted) onCompleteMeeting();
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Ada yang keliru',
        text: 'Beberapa dampak masih belum sesuai dengan kategorinya. Coba periksa lagi!',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  const resetGame = () => {
    setUnassigned([...IMPACTS]);
    setPositiveImpacts([]);
    setNegativeImpacts([]);
    setSelectedItem(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500"></div>
        <div className="p-6 sm:p-8 border-b border-white/10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 flex items-center gap-3">
            <Presentation className="w-8 h-8 text-orange-400" />
            Materi 1: Media Sosial & Dampaknya
          </h2>
          
          <div className="space-y-4 mb-8">
            <div className="border border-white/10 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setShowVideo1(!showVideo1)}
                className="w-full bg-slate-800 p-4 flex items-center justify-between hover:bg-slate-700 transition-colors"
              >
                <span className="font-bold text-white">Video 1: Pengertian & Karakteristik Media Sosial</span>
                {showVideo1 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
              <AnimatePresence>
                {showVideo1 && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-black"
                  >
                    <div className="aspect-video w-full">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        src="https://www.youtube.com/embed/VY16yvietCI" 
                        title="Media Sosial" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      ></iframe>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border border-white/10 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setShowVideo2(!showVideo2)}
                className="w-full bg-slate-800 p-4 flex items-center justify-between hover:bg-slate-700 transition-colors"
              >
                <span className="font-bold text-white">Video 2: Dampak Penggunaan Media Sosial</span>
                {showVideo2 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
              <AnimatePresence>
                {showVideo2 && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-black"
                  >
                    <div className="aspect-video w-full">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        src="https://www.youtube.com/embed/ojuDMQoFVBs" 
                        title="Dampak Penggunaan Media Sosial" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      ></iframe>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-orange-400" />
          Teori: Media Sosial
        </h2>
        
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
            <h3 className="text-xl font-bold text-orange-400 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Intisari Materi
            </h3>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink mt-0.5" />
                <span><strong className="text-white">Media Sosial</strong> adalah media daring yang memfasilitasi interaksi sosial penggunanya secara virtual.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink mt-0.5" />
                <span><strong>Karakteristik Utama:</strong> Adanya partisipasi, keterbukaan, perbincangan, komunitas, dan konektivitas.</span>
              </li>
            </ul>
          </div>
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
            <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Dampak Penggunaan
            </h3>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink mt-0.5" />
                <span><strong className="text-white">Positif:</strong> Memudahkan komunikasi, mencari informasi, dan media pembelajaran/bisnis.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-red-400 shrink mt-0.5" />
                <span><strong className="text-white">Negatif:</strong> Risiko privasi, kecanduan, cyberbullying, dan terpapar hoaks.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2">
              <Gamepad2 className="w-7 h-7 text-orange-400" />
              Game Interaktif: Kelompokkan Dampak
            </h2>
            <p className="text-slate-400">Pilih sebuah pernyataan, lalu masukkan ke dalam kategori Dampak Positif atau Negatif.</p>
          </div>
          <button 
            onClick={() => setShowGame(!showGame)}
            className="px-4 sm:px-6 py-3 w-full sm:w-auto bg-orange-500 text-sm sm:text-base hover:bg-orange-400 text-white font-bold rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-orange-500/25 shrink"
          >
            {showGame ? 'Sembunyikan Game' : 'Mulai Game Interaktif'}
          </button>
        </div>

        {showGame && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-white/10 pt-8"
          >
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              {/* Unassigned Items */}
              <div className="flex-1 bg-slate-900 rounded-2xl p-4 border border-white/10">
                <h3 className="text-white font-bold text-center mb-4">Daftar Pernyataan</h3>
                <div className="flex flex-wrap gap-2 justify-center min-h-[100px]">
                  {unassigned.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${selectedItem?.id === item.id ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}
                    >
                      {item.text}
                    </button>
                  ))}
                  {unassigned.length === 0 && <span className="text-slate-500 text-sm italic my-auto">Semua sudah dikelompokkan</span>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex md:flex-col justify-center items-center gap-2">
                <button
                  onClick={() => moveTo('positive')}
                  disabled={!selectedItem || positiveImpacts.some(i => i.id === selectedItem.id)}
                  className="bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
                >
                  Ke Positif ➔
                </button>
                <button
                  onClick={() => moveTo('negative')}
                  disabled={!selectedItem || negativeImpacts.some(i => i.id === selectedItem.id)}
                  className="bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
                >
                  Ke Negatif ➔
                </button>
                <button
                  onClick={() => moveTo('unassigned')}
                  disabled={!selectedItem || unassigned.some(i => i.id === selectedItem.id)}
                  className="bg-slate-600 hover:bg-slate-500 disabled:opacity-30 disabled:hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
                >
                  Kembalikan
                </button>
              </div>

              {/* Categories */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="bg-green-900/30 rounded-2xl p-4 border border-green-500/30 min-h-[120px]">
                  <h3 className="text-green-400 font-bold text-center mb-3">Dampak Positif</h3>
                  <div className="flex flex-col gap-2">
                    {positiveImpacts.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={`text-left p-2 rounded-lg text-sm transition-all ${selectedItem?.id === item.id ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                      >
                        {item.text}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-red-900/30 rounded-2xl p-4 border border-red-500/30 min-h-[120px]">
                  <h3 className="text-red-400 font-bold text-center mb-3">Dampak Negatif</h3>
                  <div className="flex flex-col gap-2">
                    {negativeImpacts.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={`text-left p-2 rounded-lg text-sm transition-all ${selectedItem?.id === item.id ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                      >
                        {item.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 max-w-2xl mx-auto">
              <button 
                onClick={checkAnswer}
                className="flex-1 bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" /> Cek Jawaban
              </button>
              <button 
                onClick={resetGame}
                className="bg-slate-800 hover:bg-slate-700 text-white py-3 px-6 rounded-xl transition-colors border border-white/10 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {isCompleted && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-500/10 border border-green-500/30 rounded-3xl p-6 text-center"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 text-green-400 mb-4">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Materi Selesai!</h3>
          <p className="text-slate-300">Kamu telah mengenali berbagai dampak penggunaan media sosial.</p>
        </motion.div>
      )}
    </div>
  );
};

export default DSI8Meeting1;
