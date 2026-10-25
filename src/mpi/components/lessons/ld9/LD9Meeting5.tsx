import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ShieldCheck, Target, Video, ChevronDown, ChevronUp, Key } from 'lucide-react';
import Swal from 'sweetalert2';

interface Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

export default function LD9Meeting5({ onCompleteMeeting, isCompleted }: Props) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(true);
  
  
  const [password, setPassword] = useState("");
  
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const isLongEnough = password.length >= 8;
  
  const strength = [hasUpper, hasLower, hasNumber, hasSymbol, isLongEnough].filter(Boolean).length; // 0-5

  
  const resetPass = () => {
     setPassword("");
  };

  const addChar = (type: string) => {
    if (type === 'upper') setPassword(p => p + 'A');
    if (type === 'lower') setPassword(p => p + 'a');
    if (type === 'number') setPassword(p => p + '1');
    if (type === 'symbol') setPassword(p => p + '@');
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] -z-10" />
        
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-teal-400" />
          Materi 5: Autentikasi Digital & Kata Sandi Kuat
        </h2>

        <div className="prose prose-invert max-w-none text-slate-300">
          <p className="text-lg leading-relaxed mb-6">
            Selamat datang di pembelajaran Materi 5: Rahasia Keamanan Online.
          </p>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
            <h4 className="text-teal-400 font-bold mb-2">Intisari Materi:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Autentikasi Digital:</strong> Proses verifikasi identitas pengguna untuk mengakses suatu sistem atau data. Contohnya menggunakan PIN, Kata Sandi, OTP, atau biometrik (sidik jari/wajah).</li>
              <li><strong>2FA (Two-Factor Authentication):</strong> Perlindungan ganda. Selain memasukkan password, pengguna harus memasukkan kode unik (OTP) yang dikirim ke HP.</li>
              <li><strong>Kata Sandi Kuat:</strong> Harus terdiri dari kombinasi huruf besar, huruf kecil, angka, dan simbol. Jangan gunakan tanggal lahir atau nama. Jangan gunakan satu sandi untuk semua akun.</li>
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
                    <iframe width="100%" height="100%" src="https://www.youtube.com/embed/-ltmAOVEyR8" title="YouTube video" frameBorder="0" allowFullScreen></iframe>
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
              <Target className="w-6 h-6 text-purple-400" />
              <span className="font-bold text-lg text-white">Mini Game Interaktif: Perakit Kata Sandi Kuat</span>
            </div>
            {isGameOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          <AnimatePresence>
            {isGameOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="p-6 border-t border-white/10 flex flex-col gap-6 relative items-center">
                  
                  <p className="text-slate-300 text-sm text-center font-bold">
                     Buat kata sandi yang mencapai tingkat kekuatan "SANGAT KUAT"! (Kombinasi 4 elemen berbeda)
                  </p>
                  
                  <div className="bg-slate-800 p-6 rounded-xl w-full max-w-md border border-white/10 space-y-6">
                     <div className="bg-slate-900 p-4 rounded-lg flex items-center justify-between border-2 border-slate-700 min-h-[60px]">
                        <span className="text-xl font-mono tracking-widest">{password || "********"}</span>
                        <Key className="w-6 h-6 text-slate-500" />
                     </div>
                     
                     <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                           <span className={strength === 0 ? "text-red-500" : strength < 3 ? "text-yellow-500" : strength === 5 ? "text-green-500" : "text-blue-500"}>
                              Kekuatan: {strength === 0 ? "Lemah" : strength < 3 ? "Sedang" : strength === 3 ? "Kuat" : "SANGAT KUAT!"}
                           </span>
                           <span className="text-slate-400">{strength}/4 Elemen</span>
                        </div>
                        <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                           <motion.div 
                             className={`h-full ${strength === 0 ? 'bg-red-500' : strength < 3 ? 'bg-yellow-500' : strength === 5 ? 'bg-green-500' : 'bg-blue-500'}`} 
                             animate={{ width: `${(strength / 4) * 100}%` }}
                           />
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => addChar('upper')} disabled={hasUpper} className="p-3 bg-slate-700 rounded-lg text-sm font-bold text-white hover:bg-slate-600 disabled:opacity-50 disabled:bg-green-800 border border-white/5">+ Huruf Besar</button>
                        <button onClick={() => addChar('lower')} disabled={hasLower} className="p-3 bg-slate-700 rounded-lg text-sm font-bold text-white hover:bg-slate-600 disabled:opacity-50 disabled:bg-green-800 border border-white/5">+ Huruf Kecil</button>
                        <button onClick={() => addChar('number')} disabled={hasNumber} className="p-3 bg-slate-700 rounded-lg text-sm font-bold text-white hover:bg-slate-600 disabled:opacity-50 disabled:bg-green-800 border border-white/5">+ Angka</button>
                        <button onClick={() => addChar('symbol')} disabled={hasSymbol} className="p-3 bg-slate-700 rounded-lg text-sm font-bold text-white hover:bg-slate-600 disabled:opacity-50 disabled:bg-green-800 border border-white/5">+ Simbol</button>
                     </div>
                     
                     <button onClick={resetPass} className="w-full py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-bold border border-red-500/30 hover:bg-red-500/40">Reset Ulang</button>
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
                if (strength < 5) {
                  Swal.fire('Belum Selesai', 'Buatlah kata sandi hingga mencapai level "SANGAT KUAT" terlebih dahulu.', 'warning');
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
