import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, BookOpen, Presentation, Gamepad2, AlertCircle, RefreshCw, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import Swal from 'sweetalert2';

interface DSI8Meeting3Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const SCENARIOS = [
  {
    id: 1,
    situation: "Teman sekelasmu, Budi, foto liburannya dijadikan bahan editan lucu-lucuan (meme) yang merendahkan di grup kelas. Banyak yang tertawa, tapi Budi terlihat sedih di sekolah.",
    options: [
      { text: "Ikut tertawa dan membagikan meme tersebut.", isCorrect: false, feedback: "Ini berarti kamu ikut menjadi pelaku (bystander yang mendukung). Budi bisa semakin terluka." },
      { text: "Mengingatkan pembuat meme untuk menghapusnya dan menghibur Budi.", isCorrect: true, feedback: "Tindakan yang tepat! Sebagai teman yang baik, kita harus berani menghentikan perundungan (upstander)." }
    ]
  },
  {
    id: 2,
    situation: "Kamu menerima komentar kasar dan ancaman dari akun anonim di postingan media sosialmu.",
    options: [
      { text: "Membalas dengan kata-kata yang lebih kasar agar dia takut.", isCorrect: false, feedback: "Membalas dengan emosi hanya memperburuk situasi dan membuatmu ikut berbuat buruk." },
      { text: "Capture buktinya, blokir akun tersebut, dan lapor ke orang dewasa yang dipercaya.", isCorrect: true, feedback: "Sangat bijak! Bukti perlu disimpan untuk pelaporan, dan memblokir memutus akses pelaku." }
    ]
  }
];

const DSI8Meeting3: React.FC<DSI8Meeting3Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  const [showVideo, setShowVideo] = useState(true);

  // Game state
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  const handleChoice = (isCorrect: boolean, feedback: string) => {
    if (isCorrect) {
      Swal.fire({
        icon: 'success',
        title: 'Tindakan Tepat!',
        text: feedback,
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#22c55e'
      }).then(() => {
        nextScenario();
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Tindakan Berbahaya',
        text: feedback,
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  const nextScenario = () => {
    if (currentScenarioIndex < SCENARIOS.length - 1) {
      setCurrentScenarioIndex(prev => prev + 1);
    } else {
      setGameFinished(true);
      if (!isCompleted) onCompleteMeeting();
    }
  };

  const resetGame = () => {
    setCurrentScenarioIndex(0);
    setGameFinished(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-500"></div>
        <div className="p-6 sm:p-8 border-b border-white/10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 flex items-center gap-3">
            <Presentation className="w-8 h-8 text-rose-400" />
            Materi 3: Cyberbullying
          </h2>
          
          <div className="border border-white/10 rounded-2xl overflow-hidden mb-8">
            <button 
              onClick={() => setShowVideo(!showVideo)}
              className="w-full bg-slate-800 p-4 flex items-center justify-between hover:bg-slate-700 transition-colors"
            >
              <span className="font-bold text-white">Video: Memahami Cyberbullying</span>
              {showVideo ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            <AnimatePresence>
              {showVideo && (
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
                      src="https://www.youtube.com/embed/G6wm9RITPA0" 
                      title="Cyberbullying" 
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

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-rose-400" />
          Teori: Etika Digital & Keamanan
        </h2>
        
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
            <h3 className="text-xl font-bold text-rose-400 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Apa itu Cyberbullying?
            </h3>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink mt-0.5" />
                <span><strong className="text-white">Cyberbullying</strong> (Perundungan Siber) adalah perilaku agresif dan disengaja oleh individu atau kelompok menggunakan media elektronik.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink mt-0.5" />
                <span><strong>Bentuknya:</strong> Mengirim pesan ancaman, menyebarkan foto memalukan, mengejek di kolom komentar, membuat akun palsu untuk meneror.</span>
              </li>
            </ul>
          </div>
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
            <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Cara Mengatasi
            </h3>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 flex items-center justify-center bg-green-500/20 text-green-400 rounded shrink mt-0.5">1</div>
                <span><strong>Jangan direspons:</strong> Pelaku suka jika korbannya marah atau sedih.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 flex items-center justify-center bg-green-500/20 text-green-400 rounded shrink mt-0.5">2</div>
                <span><strong>Simpan Bukti & Blokir:</strong> Screenshot pesan jahat, lalu blokir akunnya (Report/Block).</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 flex items-center justify-center bg-green-500/20 text-green-400 rounded shrink mt-0.5">3</div>
                <span><strong>Lapor (Speak Up):</strong> Ceritakan pada orang tua, guru, atau orang dewasa terpercaya.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2">
              <Gamepad2 className="w-7 h-7 text-rose-400" />
              Game Interaktif: Simulasi Keputusan
            </h2>
            <p className="text-slate-400">Pilih tindakan terbaik untuk setiap situasi perundungan siber di bawah ini.</p>
          </div>
          <button 
            onClick={() => setShowGame(!showGame)}
            className="px-4 sm:px-6 py-3 w-full sm:w-auto bg-rose-600 text-sm sm:text-base hover:bg-rose-500 text-white font-bold rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-rose-500/25 shrink"
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
            {!gameFinished ? (
              <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-4 text-slate-400">
                  <span>Skenario {currentScenarioIndex + 1} dari {SCENARIOS.length}</span>
                </div>
                
                <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl border border-white/10 shadow-xl mb-8 relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-pink-500"></div>
                  <h3 className="text-xl font-bold text-white mb-4">Situasi:</h3>
                  <p className="text-slate-200 text-lg leading-relaxed">
                    {SCENARIOS[currentScenarioIndex].situation}
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  {SCENARIOS[currentScenarioIndex].options.map((option, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleChoice(option.isCorrect, option.feedback)}
                      className="bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white font-medium py-4 px-6 rounded-xl transition-colors shadow-md text-left flex items-start gap-4"
                    >
                      <span className="bg-slate-800 text-rose-400 font-bold rounded-lg w-8 h-8 flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center bg-slate-900 p-8 rounded-2xl border border-white/10 max-w-lg mx-auto">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Simulasi Selesai!</h3>
                <p className="text-slate-300 mb-8">Kamu telah membuktikan bahwa kamu siap menjadi pahlawan digital yang bijak.</p>

                <button 
                  onClick={resetGame}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" /> Main Lagi
                </button>
              </div>
            )}
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
          <p className="text-slate-300">Mari bersama ciptakan ruang digital yang aman dan positif.</p>
        </motion.div>
      )}
    </div>
  );
};

export default DSI8Meeting3;
