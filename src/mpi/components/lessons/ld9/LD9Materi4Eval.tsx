import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Trophy, Users, PlayCircle, ArrowRight, Lock, Trash2, Plus, Key, Clock, Heart, Zap } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import MultiplayerKahoot from '../MultiplayerKahoot';

interface LD9Materi4EvalProps {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}




const QUESTIONS = [
  { q: "Apa itu hoaks?", options: ["Berita lucu","Informasi palsu yang direkayasa","Berita gosip","Berita luar negeri"], a: "Informasi palsu yang direkayasa" },
  { q: "Ciri utama berita hoaks adalah...", options: ["Judul provokatif dan sensasional","Disertai referensi yang jelas","Diterbitkan oleh media resmi","Isinya netral"], a: "Judul provokatif dan sensasional" },
  { q: "Apa yang harus dilakukan sebelum membagikan informasi?", options: ["Saring sebelum sharing","Langsung forward","Edit sedikit lalu bagikan","Abaikan saja"], a: "Saring sebelum sharing" },
  { q: "Cara memvalidasi informasi bisa dengan...", options: ["Tanya teman sebelah","Cross-check ke sumber terpercaya/media kredibel","Tebak-tebakan","Melihat jumlah like"], a: "Cross-check ke sumber terpercaya/media kredibel" },
  { q: "Situs web penyebar hoaks biasanya...", options: ["Tidak memiliki redaksi yang jelas","Berdomain resmi pemerintah (.go.id)","Mengutip ahli ternama","Berbayar"], a: "Tidak memiliki redaksi yang jelas" },
  { q: "Gambar yang dibagikan bisa divalidasi keasliannya menggunakan...", options: ["Google Reverse Image Search","Microsoft Word","Kalkulator","Antivirus"], a: "Google Reverse Image Search" },
  { q: "Dampak penyebaran hoaks adalah...", options: ["Meningkatkan persatuan","Memicu kepanikan dan perpecahan","Membuat masyarakat cerdas","Menambah wawasan"], a: "Memicu kepanikan dan perpecahan" },
  { q: "Clickbait adalah...", options: ["Alat pancing","Judul yang dibuat untuk memancing klik meski isi tidak sesuai","Tikus komputer","Tombol like"], a: "Judul yang dibuat untuk memancing klik meski isi tidak sesuai" },
  { q: "Jika menerima pesan hoaks di grup, sebaiknya...", options: ["Ikut menyebarkan","Klarifikasi dengan informasi yang benar secara sopan","Keluar grup","Marah-marah"], a: "Klarifikasi dengan informasi yang benar secara sopan" },
  { q: "Institusi yang sering mengklarifikasi hoaks di Indonesia adalah...", options: ["Kominfo","Kemenpora","Kemenag","Kemenkeu"], a: "Kominfo" }
];

const TIME_PER_QUESTION = 15; // seconds
const BASE_SCORE = 100;
const MAX_TIME_BONUS = 50;

export default function LD9Materi4Eval({ onCompleteMeeting, isCompleted }: LD9Materi4EvalProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("7.1");
  const [accessCode, setAccessCode] = useState("");
  
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [overrideCompleted, setOverrideCompleted] = useState(false);
  const [gameMode, setGameMode] = useState<'solo' | 'multi_host' | 'multi_player'>('solo');

  // Teacher Portal State
  const [showTeacherPortal, setShowTeacherPortal] = useState(false);
  const [teacherPassInput, setTeacherPassInput] = useState("");
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(false);
  const [activeCodes, setActiveCodes] = useState<{code: string}[]>([]);

  // Gamification State
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | "timeout" | null>(null);

  useEffect(() => {
    if (showTeacherPortal && isTeacherAuthenticated) {
      loadAccessCodes();
    }
  }, [showTeacherPortal, isTeacherAuthenticated]);

  // Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (hasStarted && !isFinished && !feedback && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !feedback && hasStarted && !isFinished) {
      handleTimeout();
    }
    return () => clearInterval(timer);
  }, [hasStarted, isFinished, timeLeft, feedback]);

  const loadAccessCodes = () => {
    const codes = JSON.parse(localStorage.getItem("mpi_access_codes_ld9_game") || "[]");
    setActiveCodes(codes);
  };

  const generateAccessCode = () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const codes = JSON.parse(localStorage.getItem("mpi_access_codes_ld9_game") || "[]");
    codes.push({ code: newCode });
    localStorage.setItem("mpi_access_codes_ld9_game", JSON.stringify(codes));
    loadAccessCodes();
  };

  const deleteAccessCode = (codeToDelete: string) => {
    const codes = JSON.parse(localStorage.getItem("mpi_access_codes_ld9_game") || "[]");
    const newCodes = codes.filter((c: any) => c.code !== codeToDelete);
    localStorage.setItem("mpi_access_codes_ld9_game", JSON.stringify(newCodes));
    loadAccessCodes();
  };

  const handleTeacherLogin = () => {
    if (teacherPassInput === "guru") {
      setIsTeacherAuthenticated(true);
      setTeacherPassInput("");
    } else {
      Swal.fire("Akses Ditolak", "Password guru salah.", "error");
    }
  };

  const validateAccessCode = (code: string) => {
    const codes = JSON.parse(localStorage.getItem("mpi_access_codes_ld9_game") || "[]");
    return codes.some((c: any) => c.code === code.toUpperCase());
  };

  const startQuiz = () => {
    if (!studentName.trim() || !accessCode.trim()) {
      Swal.fire("Tunggu!", "Silakan masukkan nama dan kode akses terlebih dahulu.", "warning");
      return;
    }
    
    if (!validateAccessCode(accessCode)) {
      Swal.fire("Akses Ditolak", "Kode Akses tidak valid atau sudah tidak aktif.", "error");
      return;
    }

    setHasStarted(true);
    setTimeLeft(TIME_PER_QUESTION);
    setScore(0);
    setLives(3);
    setStreak(0);
    setMultiplier(1);
    setCurrentQ(0);
  };

  const calculateScore = () => {
    const timeBonus = Math.floor((timeLeft / TIME_PER_QUESTION) * MAX_TIME_BONUS);
    const pointsGained = Math.floor((BASE_SCORE + timeBonus) * multiplier);
    return pointsGained;
  };

  const updateMultiplier = (newStreak: number) => {
    if (newStreak >= 5) return 2.0;
    if (newStreak >= 3) return 1.5;
    if (newStreak >= 1) return 1.2;
    return 1.0;
  };

  const handleAnswer = (ans: string) => {
    if (feedback) return; // Prevent multiple clicks

    const isCorrect = ans === QUESTIONS[currentQ].a;
    
    if (isCorrect) {
      const points = calculateScore();
      setScore(prev => prev + points);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMultiplier(updateMultiplier(newStreak));
      setFeedback("correct");
    } else {
      setStreak(0);
      setMultiplier(1.0);
      setLives(prev => prev - 1);
      setFeedback("wrong");
    }

    setTimeout(() => {
      advanceQuestion(isCorrect);
    }, 1500);
  };

  const handleTimeout = () => {
    setStreak(0);
    setMultiplier(1.0);
    setLives(prev => prev - 1);
    setFeedback("timeout");

    setTimeout(() => {
      advanceQuestion(false);
    }, 1500);
  };

  const advanceQuestion = (wasCorrect: boolean) => {
    setFeedback(null);
    // If lives reached 0 after this question (meaning they were 1 and they got it wrong/timeout)
    if (!wasCorrect && lives <= 1) {
      setIsFinished(true);
      return;
    }

    if (currentQ === QUESTIONS.length - 1) {
      setIsFinished(true);
    } else {
      setCurrentQ(prev => prev + 1);
      setTimeLeft(TIME_PER_QUESTION);
    }
  };

  const submitScore = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('leaderboard').insert([
          { nama: studentName, kelas: studentClass, skor: score }
        ]);
        if (error) throw error;
      } else {
        console.warn("Supabase is not configured. Score will not be saved to Leaderboard.");
      }
      
      Swal.fire({
        title: "Berhasil Disimpan!",
        text: `Skormu ${score} telah tercatat. Cek menu Leaderboard Global!`,
        icon: "success",
        confirmButtonColor: "#0ea5e9"
      }).then(() => {
        setOverrideCompleted(false);
        onCompleteMeeting();
      });
    } catch (err) {
      console.error("Supabase Error:", err);
      Swal.fire("Terjadi Kesalahan", "Gagal menyimpan skor ke database.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  
  if (gameMode === 'multi_host') {
    return <MultiplayerKahoot questions={QUESTIONS} onComplete={onCompleteMeeting} isHost={true} subject="LD9" />;
  }
  if (gameMode === 'multi_player') {
    return <MultiplayerKahoot questions={QUESTIONS} onComplete={onCompleteMeeting} isHost={false} subject="LD9" />;
  }

  if (isCompleted && !overrideCompleted) {
    return (
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-900/40 to-blue-900/40 p-10 text-center space-y-6 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-400/20 blur-3xl rounded-full" />
        <div className="mx-auto h-24 w-24 bg-gradient-to-br from-yellow-400 to-amber-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-yellow-500/20 border-4 border-yellow-300/30">
          <Award className="w-12 h-12" />
        </div>
        <div>
          <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">Sertifikat Kelulusan Mengenali Hoaks</h3>
          <p className="text-slate-300 mt-3 font-medium max-w-md mx-auto">
            Kamu telah membuktikan dirimu sebagai Master Literasi Digital! Teruslah berlatih memecahkan masalah.
          </p>
          <button 
            onClick={() => {
               setOverrideCompleted(true);
               setHasStarted(false);
               setIsFinished(false);
               setCurrentQ(0);
               setScore(0);
               setStudentName("");
               setAccessCode("");
            }}
            className="mt-6 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium inline-flex items-center gap-2"
          >
            Mulai Sesi Baru (Siswa Lain)
          </button>
        </div>
      </div>
    );
  }

  if (showTeacherPortal) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-3">
            <Key className="w-8 h-8 text-cyan-400" /> Portal Guru
          </h2>
          <p className="mt-2 text-slate-400 font-medium">Manajemen kode akses ujian.</p>
        </div>
        
        <div className="rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
          {!isTeacherAuthenticated ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Password Guru</label>
                <input 
                  type="password"
                  value={teacherPassInput}
                  onChange={(e) => setTeacherPassInput(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/20 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <button
                onClick={handleTeacherLogin}
                className="w-full px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Key className="w-5 h-5" /> Masuk
              </button>
              <button
                onClick={() => setShowTeacherPortal(false)}
                className="w-full px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
              >
                Kembali ke Siswa
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Kode Akses Aktif</h3>
                <button
                  onClick={generateAccessCode}
                  className="p-2 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
                >
                  <Plus className="w-4 h-4" /> Buat Baru
                </button>
              </div>
              
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {activeCodes.length === 0 ? (
                  <div className="text-slate-500 text-center py-4">Belum ada kode aktif.</div>
                ) : (
                  activeCodes.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-white/5">
                      <span className="font-mono text-cyan-400 font-bold tracking-widest text-lg">{c.code}</span>
                      <button 
                        onClick={() => deleteAccessCode(c.code)}
                        className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                        title="Hapus Kode"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              <button
                onClick={() => setGameMode('multi_host')}
                className="w-full px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 mb-4 shadow-lg shadow-indigo-500/20"
              >
                <PlayCircle className="w-5 h-5" /> Mulai Host Multiplayer
              </button>
              <button
                onClick={() => {
                  setShowTeacherPortal(false);
                  setIsTeacherAuthenticated(false);
                }}
                className="w-full px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
              >
                Tutup Portal
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-3xl border border-yellow-500/30 bg-slate-900 p-8 text-center shadow-2xl shadow-yellow-500/10 max-w-xl mx-auto"
      >
        <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6 animate-bounce" />
        <h2 className="text-3xl font-extrabold text-white mb-2">
          {lives <= 0 ? "Game Over!" : "Kuis Selesai!"}
        </h2>
        <p className="text-slate-400 mb-8">
          {lives <= 0 ? "Nyawamu habis, tapi perjuanganmu telah dicatat!" : "Skor akhirmu telah dikalkulasi dengan luar biasa."}
        </p>
        
        <div className="text-7xl font-extrabold text-cyan-400 mb-8 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
          {score}
        </div>
        
        <button
          onClick={submitScore}
          disabled={isSubmitting}
          className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:brightness-110 shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? 'Menyimpan...' : 'Kirim Skor ke Leaderboard Global'}
        </button>
      </motion.div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center relative">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Game Kuis Evaluasi Mengenali Hoaks</h2>
          <p className="mt-2 text-slate-400 font-medium">Masukkan data dirimu sebelum memulai.</p>
        </div>
        
        <div className="rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl relative">
          <button 
            onClick={() => setShowTeacherPortal(true)}
            className="absolute top-4 right-4 text-slate-300 hover:text-cyan-400 bg-white/5 rounded-full transition-colors p-2"
            title="Portal Guru"
          >
            <Lock className="w-5 h-5" />
          </button>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Nama Lengkap</label>
              <input 
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Cth: Budi Santoso"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/20 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Kelas</label>
              <select 
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/20 text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="7.1">7.1</option>
                <option value="7.2">7.2</option>
                <option value="7.3">7.3</option>
                <option value="7.4">7.4</option>
                <option value="8.1">8.1</option>
                <option value="8.2">8.2</option>
                <option value="8.3">8.3</option>
                <option value="9.1">9.1</option>
                <option value="9.2">9.2</option>
                <option value="9.3">9.3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Kode Akses Ujian</label>
              <input 
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="Minta pada guru"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/20 text-white focus:outline-none focus:border-cyan-400 font-mono tracking-widest uppercase"
              />
            </div>
            <button
              onClick={startQuiz}
              className="w-full mt-6 flex items-center justify-center gap-2 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-colors"
            >
              Mulai Kuis Solo <ArrowRight className="w-5 h-5" />
            </button>
            <div className="pt-4 border-t border-white/10 mt-4 text-center">
              <p className="text-slate-400 text-sm mb-3">Atau bermain bersama teman sekelas?</p>
              <button
                onClick={() => setGameMode('multi_player')}
                className="w-full flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
              >
                <Users className="w-5 h-5" /> Gabung Mode Multiplayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Game Header: Score, Multiplier, Lives */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Skor</span>
            <span className="text-2xl font-black text-cyan-400 tabular-nums">{score}</span>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Combo</span>
            <div className="flex items-center gap-1">
              <Zap className={`w-5 h-5 ${multiplier > 1 ? 'text-yellow-400 fill-yellow-400 animate-pulse' : 'text-slate-600'}`} />
              <span className={`text-xl font-bold tabular-nums ${multiplier > 1 ? 'text-yellow-400' : 'text-slate-400'}`}>x{multiplier}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {[...Array(3)].map((_, i) => (
            <Heart 
              key={i} 
              className={`w-6 h-6 ${i < lives ? 'text-red-500 fill-red-500 animate-pulse' : 'text-slate-700 fill-slate-800'}`} 
            />
          ))}
        </div>
      </div>

      {/* Timer Bar */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-lg flex items-center gap-4">
        <Clock className={`w-6 h-6 ${timeLeft <= 5 ? 'text-red-400 animate-bounce' : 'text-cyan-400'}`} />
        <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full ${timeLeft <= 5 ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
            initial={{ width: "100%" }}
            animate={{ width: `${(timeLeft / TIME_PER_QUESTION) * 100}%` }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </div>
        <span className={`font-mono font-bold text-xl tabular-nums ${timeLeft <= 5 ? 'text-red-400' : 'text-slate-300'}`}>
          {timeLeft}s
        </span>
      </div>

      {/* Question Card */}
      <motion.div
        key={currentQ}
        initial={{ x: 50, opacity: 0 }}
        animate={{ 
          x: feedback === "wrong" || feedback === "timeout" ? [-10, 10, -10, 10, 0] : 0, 
          opacity: 1 
        }}
        transition={{ duration: feedback === "wrong" || feedback === "timeout" ? 0.4 : 0.3 }}
        className={`bg-slate-900 border ${feedback === 'correct' ? 'border-green-500 shadow-green-500/20' : feedback === 'wrong' || feedback === 'timeout' ? 'border-red-500 shadow-red-500/20' : 'border-white/10 shadow-2xl'} rounded-3xl p-8 relative overflow-hidden transition-colors duration-300`}
      >
        <div className="flex justify-between items-center mb-6">
          <span className="px-3 py-1 bg-white/5 rounded-lg text-sm font-bold text-slate-400">
            Level {currentQ + 1}
          </span>
          <span className="text-sm font-bold text-slate-500">
            {currentQ + 1} / {QUESTIONS.length}
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white mb-8 text-center leading-relaxed">
          "{QUESTIONS[currentQ].q}"
        </h3>

        <div className="grid gap-3">
          {QUESTIONS[currentQ].options.map((opt, i) => {
            let btnClass = "w-full p-4 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-bold hover:bg-white/10 hover:border-cyan-400 transition-all text-left flex items-center justify-between group";
            let indicatorClass = "w-6 h-6 rounded-full border border-slate-600 group-hover:border-cyan-400 flex items-center justify-center";
            let innerClass = "w-2 h-2 rounded-full bg-transparent group-hover:bg-cyan-400 transition-all";

            if (feedback) {
              const isCorrectOpt = opt === QUESTIONS[currentQ].a;
              if (isCorrectOpt) {
                btnClass = "w-full p-4 rounded-xl border border-green-500 bg-green-500/20 text-white font-bold text-left flex items-center justify-between";
                indicatorClass = "w-6 h-6 rounded-full border border-green-400 bg-green-400 flex items-center justify-center";
                innerClass = "w-3 h-3 text-white"; // Just colored dot
              } else {
                btnClass = "w-full p-4 rounded-xl border border-white/5 bg-white/5 text-slate-500 font-bold text-left flex items-center justify-between opacity-50";
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                disabled={feedback !== null}
                className={btnClass}
              >
                <span>{opt}</span>
                <div className={indicatorClass}>
                  <div className={innerClass} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback Overlay Message */}
        <AnimatePresence>
          {feedback && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`absolute inset-x-0 bottom-8 flex justify-center pointer-events-none`}
            >
              <div className={`px-6 py-3 rounded-full font-black text-xl shadow-2xl ${feedback === 'correct' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {feedback === 'correct' ? '+ Poin!' : feedback === 'timeout' ? 'Waktu Habis!' : 'Salah!'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
