import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ShieldCheck, Target, Video, ChevronDown, ChevronUp, Lock, MonitorUp, Shield, Smartphone } from 'lucide-react';
import Swal from 'sweetalert2';

interface Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function LD9Meeting6({ onCompleteMeeting, isCompleted }: Props) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(true);
  
  
  const [currentScenario, setCurrentScenario] = useState(0);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [screenLock, setScreenLock] = useState(false);
  const [osUpdated, setOsUpdated] = useState(false);
  const [firewall, setFirewall] = useState(false);

  const scenarios = [
    { text: "Peringatan! HP Anda terkena 100 virus. Klik di sini untuk membersihkan!", isSafe: false, reason: "Ini adalah iklan scareware/hoaks. Tidak ada web yang bisa scan HP Anda secara instan." },
    { text: "Pembaruan Sistem (OS Update) v15.2 tersedia. Perbaikan celah keamanan.", isSafe: true, reason: "Pembaruan resmi OS sangat penting untuk menutup celah keamanan (patch)." },
    { text: "Selamat! Anda terpilih mendapat kuota 100GB. Masukkan Password FB untuk klaim!", isSafe: false, reason: "Ini adalah serangan Phishing! Jangan pernah memberikan password." },
    { text: "Sambungkan ke WiFi 'Kopi_Gratis_No_Password'?", isSafe: false, reason: "WiFi publik tanpa password sangat rentan disadap (Man-in-the-Middle attack)." },
    { text: "Notifikasi Google Drive: Backup mingguan data Anda telah selesai.", isSafe: true, reason: "Backup data secara berkala sangat direkomendasikan agar data tidak hilang." }
  ];

  const handleChoice = (choiceIsSafe: boolean) => {
    const isCorrect = choiceIsSafe === scenarios[currentScenario].isSafe;
    if (isCorrect) setScore(s => s + 1);
    
    setFeedback(scenarios[currentScenario].reason);
    
    setTimeout(() => {
      setFeedback("");
      if (currentScenario + 1 < scenarios.length) {
        setCurrentScenario(s => s + 1);
      } else {
        setGameFinished(true);
      }
    }, 4000);
  };

  const resetGame = () => {
    setCurrentScenario(0);
    setScore(0);
    setGameFinished(false);
    setFeedback("");
  };


  return (
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] -z-10" />
        
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-teal-400" />
          Materi 6: Pengamanan Perangkat
        </h2>

        <div className="prose prose-invert max-w-none text-slate-300">
          <p className="text-lg leading-relaxed mb-6">
            Selamat datang di pembelajaran Materi 6: Pengamanan Perangkat Keras dan Lunak.
          </p>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
            <h4 className="text-teal-400 font-bold mb-2">Intisari Materi:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Malware (Perangkat Lunak Jahat):</strong> Termasuk Virus, Trojan, dan Ransomware. Dapat merusak data, mencuri informasi, atau mengunci perangkat.</li>
              <li><strong>Screen Lock (Kunci Layar):</strong> Pengamanan dasar secara fisik agar orang tak dikenal tidak bisa mengutak-atik perangkat secara langsung.</li>
              <li><strong>Update OS (Pembaruan Sistem):</strong> Sangat penting dilakukan untuk menutup celah (bug) keamanan yang baru ditemukan.</li>
              <li><strong>Firewall & Antivirus:</strong> Dinding pertahanan yang menyaring lalu lintas internet dan mendeteksi/membersihkan file berbahaya.</li>
            </ul>
          </div>
        </div>

        {/* Video Accordion */}
        <div className="mt-8 border border-white/10 bg-white/5 rounded-xl overflow-hidden">
          <button 
            onClick={() => setIsVideoOpen(!isVideoOpen)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Video className="w-6 h-6 text-teal-400" />
              <span className="font-bold text-lg text-white">Video Pembelajaran</span>
            </div>
            {isVideoOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          <AnimatePresence>
            {isVideoOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="p-6 border-t border-white/10 flex flex-col gap-6">
                  <div className="aspect-video rounded-xl overflow-hidden shadow-2xl md:w-2/3 mx-auto">
                    <iframe width="100%" height="100%" src="https://www.youtube.com/embed/fhngSLcOTFg" title="YouTube video" frameBorder="0" allowFullScreen></iframe>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Game Accordion */}
        <div className="mt-4 border border-white/10 bg-white/5 rounded-xl overflow-hidden">
          <button 
            onClick={() => setIsGameOpen(!isGameOpen)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-red-400" />
              <span className="font-bold text-lg text-white">Mini Game Interaktif: Amankan Perangkatmu!</span>
            </div>
            {isGameOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          <AnimatePresence>
            {isGameOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="p-6 border-t border-white/10 flex flex-col gap-6 relative items-center">
                  
                  <p className="text-slate-300 text-sm text-center font-bold">
                     Perangkat ini sedang dalam status <span className="text-red-500">RENTAN</span>. Aktifkan 3 lapisan keamanan untuk melindunginya!
                  </p>
                  
                  <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-lg border-4 border-slate-700 space-y-8 shadow-2xl relative">
                     
                     <div className="flex justify-center mb-4 relative">
                        <Smartphone className={`w-32 h-32 transition-colors duration-1000 ${(screenLock && osUpdated && firewall) ? 'text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]' : 'text-slate-500'}`} />
                        <AnimatePresence>
                           {gameFinished && score === scenarios.length && (
                              <motion.div 
                                 initial={{ scale: 0, opacity: 0 }}
                                 animate={{ scale: 1, opacity: 1 }}
                                 className="absolute -right-4 -top-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-slate-800 shadow"
                              >
                                 100% AMAN
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>

                     <div className="space-y-3">
                        <button 
                          onClick={() => setScreenLock(!screenLock)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${screenLock ? 'bg-green-900/40 border-green-500 text-green-400' : 'bg-slate-900 border-slate-600 text-slate-400 hover:border-slate-400'}`}
                        >
                           <div className="flex items-center gap-3">
                             <Lock className="w-5 h-5" />
                             <span className="font-bold">Kunci Layar (Screen Lock)</span>
                           </div>
                           <span className="text-xs font-bold">{screenLock ? 'AKTIF' : 'MATI'}</span>
                        </button>
                        
                        <button 
                          onClick={() => setOsUpdated(!osUpdated)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${osUpdated ? 'bg-green-900/40 border-green-500 text-green-400' : 'bg-slate-900 border-slate-600 text-slate-400 hover:border-slate-400'}`}
                        >
                           <div className="flex items-center gap-3">
                             <MonitorUp className="w-5 h-5" />
                             <span className="font-bold">Pembaruan Sistem (OS Update)</span>
                           </div>
                           <span className="text-xs font-bold">{osUpdated ? 'UP-TO-DATE' : 'USANG'}</span>
                        </button>
                        
                        <button 
                          onClick={() => setFirewall(!firewall)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${firewall ? 'bg-green-900/40 border-green-500 text-green-400' : 'bg-slate-900 border-slate-600 text-slate-400 hover:border-slate-400'}`}
                        >
                           <div className="flex items-center gap-3">
                             <Shield className="w-5 h-5" />
                             <span className="font-bold">Firewall & Antivirus</span>
                           </div>
                           <span className="text-xs font-bold">{firewall ? 'MELINDUNGI' : 'MATI'}</span>
                        </button>
                     </div>

                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isCompleted && (
          <div className="mt-10 flex justify-end">
            <button
              onClick={() => {
                if (!(screenLock && osUpdated && firewall)) {
                  Swal.fire('Belum Aman!', 'Aktifkan semua lapisan keamanan terlebih dahulu.', 'warning');
                  return;
                }
                Swal.fire({ title: 'Materi Selesai!', text: 'Anda telah menyelesaikan materi ini. Silakan lanjut ke evaluasi game.', icon: 'success', confirmButtonColor: '#0ea5e9' }).then(() => onCompleteMeeting());
              }}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/30"
            >
              <CheckCircle className="w-5 h-5" />
              Tandai Selesai
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
