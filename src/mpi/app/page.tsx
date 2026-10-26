import React, { useState } from "react";
import { motion } from "motion/react";
import { GraduationCap, Brain, Cpu, Network, BarChart3, ChevronRight, Terminal, Trophy, Sparkles, MonitorSmartphone, Code, Globe, Rocket, Bot } from "lucide-react";
import { curriculumData, GradeCurriculum, Chapter } from "../data/curriculum";

interface LandingPageProps {
  onSelectGradeChapter: (grade: number, chapter: Chapter) => void;
  completedChapters: string[]; // list of completed chapter IDs
}

export default function LandingPage({ onSelectGradeChapter, completedChapters }: LandingPageProps) {
  const [expandedGrade, setExpandedGrade] = useState<number | null>(null);
  // Map icons to components dynamically
    const dailyTips = [
    {
      title: "Tips Hari Ini: Jaringan Komputer 🌐",
      desc: "Gunakan kabel LAN untuk koneksi yang lebih stabil saat bermain game atau mengunduh file besar, karena tidak terpengaruh oleh halangan fisik seperti dinding atau sinyal yang bertabrakan.",
      tags: ["Jaringan", "Konektivitas"]
    },
    {
      title: "Tips Hari Ini: Keamanan Digital 🔒",
      desc: "Jangan gunakan kata sandi yang sama untuk semua akun. Gunakan pengelola kata sandi dan kombinasikan huruf besar, kecil, angka, serta simbol agar akunmu tak tertembus peretas.",
      tags: ["Keamanan", "Privasi"]
    },
    {
      title: "Tips Hari Ini: Berpikir Komputasional 🧠",
      desc: "Tahukah kamu? 'Dekomposisi' adalah jurus andalan memecah masalah besar menjadi bagian-bagian kecil agar lebih mudah dikelola dan diselesaikan secara logis dan sistematis.",
      tags: ["Logika", "Problem Solving"]
    },
    {
      title: "Tips Hari Ini: Analisis Data 📊",
      desc: "Visualisasikan datamu menggunakan grafik atau diagram warna-warni! Otak manusia lebih cepat menangkap tren dan pola dari gambar daripada membaca deretan angka yang membosankan.",
      tags: ["Data", "Visualisasi"]
    },
    {
      title: "Tips Hari Ini: Algoritma & Pemrograman 💻",
      desc: "Sebelum buru-buru menulis kode, buatlah flowchart atau pseudocode di atas kertas terlebih dahulu. Ini akan sangat menghemat waktumu saat melakukan proses debugging nantinya.",
      tags: ["Coding", "Algoritma"]
    },
    {
      title: "Tips Hari Ini: Perawatan Perangkat Keras ⚙️",
      desc: "Bersihkan debu pada kipas dan heatsink komputermu secara berkala. Debu yang menumpuk bisa menyebabkan overheating (panas berlebih) yang bikin performa ngelag (throttling).",
      tags: ["Hardware", "Maintenance"]
    },
    {
      title: "Tips Hari Ini: Literasi Digital & Medsos 📱",
      desc: "Saring sebelum sharing! Selalu cek ricek kebenaran suatu informasi dari sumber terpercaya sebelum membagikannya agar kita tidak menjadi bagian dari penyebar hoaks di internet.",
      tags: ["Literasi", "Anti Hoaks"]
    }
  ];
  const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
  const todayTip = dailyTips[todayIndex];

  const getIcon = (name: string) => {
    switch (name) {
      case "Brain":
        return <Brain className="h-6 w-6 text-pink-400" />;
      case "Cpu":
        return <Cpu className="h-6 w-6 text-amber-400" />;
      case "Network":
        return <Network className="h-6 w-6 text-cyan-400" />;
      case "BarChart3":
        return <BarChart3 className="h-6 w-6 text-emerald-400" />;
      case "Code":
        return <Code className="h-6 w-6 text-purple-400" />;
      case "MonitorSmartphone":
        return <MonitorSmartphone className="h-6 w-6 text-blue-400" />;
      case "Globe":
        return <Globe className="h-6 w-6 text-indigo-400" />;
      default:
        return <GraduationCap className="h-6 w-6 text-blue-400" />;
    }
  };

  const getGlowColor = (gradeNum: number) => {
    if (gradeNum === 7) return "from-cyan-500 to-blue-600";
    if (gradeNum === 8) return "from-purple-500 to-pink-600";
    return "from-emerald-500 to-teal-600";
  };

  const getNumberColor = (gradeNum: number) => {
    if (gradeNum === 7) return "text-cyan-400";
    if (gradeNum === 8) return "text-purple-400";
    return "text-emerald-400";
  };

  const getNumberBg = (gradeNum: number) => {
    if (gradeNum === 7) return "bg-cyan-500/10";
    if (gradeNum === 8) return "bg-purple-500/10";
    return "bg-emerald-500/10";
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 relative">
      <div className="mx-auto max-w-7xl">
        
        {/* Header Hero Section */}
        
        {/* Animated Hero Section */}
        <div className="mb-12 relative flex flex-col md:flex-row items-center gap-8 justify-between p-8 rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-r from-blue-900/40 to-purple-900/40 backdrop-blur-xl">
          {/* Animated Background Orbs inside Hero */}
          <motion.div 
            animate={{ 
               scale: [1, 1.2, 1],
               opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-10 w-64 h-64 bg-cyan-500/30 rounded-full blur-[80px]"
          />
          <motion.div 
            animate={{ 
               scale: [1, 1.5, 1],
               opacity: [0.2, 0.5, 0.2],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-0 left-10 w-48 h-48 bg-purple-500/30 rounded-full blur-[60px]"
          />

          <div className="flex-1 relative z-10 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-900/30 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-cyan-300 uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            >
              <Rocket className="h-4 w-4" />
              <span>Petualangan Digital Dimulai!</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-lg"
            >
              Halo, Sobat <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 animate-pulse">Informatika!</span> 👾
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-4 max-w-2xl text-lg text-slate-300 font-medium leading-relaxed"
            >
              Siap untuk menaklukkan misi-misi seru di dunia teknologi? Kumpulkan poin, pecahkan teka-teki, dan jadilah <strong>Master Digital</strong> sejati! Pilih misimu di bawah ini! 🔥
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.3 }}
            className="relative z-10 hidden md:flex items-center justify-center"
          >
            <motion.div
              animate={{ 
                y: [-15, 15, -15],
                rotate: [-5, 5, -5]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="w-40 h-40 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.5)] border-4 border-white/20 transform rotate-12"
            >
              <Bot className="w-24 h-24 text-white drop-shadow-xl" />
            </motion.div>
            
            <motion.div
               animate={{ y: [-10, 10, -10], scale: [1, 1.1, 1] }}
               transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
               className="absolute -top-6 -right-6 bg-yellow-400 text-yellow-900 font-black text-xl px-4 py-2 rounded-2xl transform rotate-12 shadow-lg border-2 border-yellow-200"
            >
               WOOHOO!
            </motion.div>
          </motion.div>
        </div>

        
        
        {/* Computer Quotes Section */}
        <div className="mb-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 backdrop-blur-md hover:border-cyan-500/50 transition-all shadow-lg"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-cyan-500/20 transition-all" />
            <div className="flex flex-col h-full justify-between relative z-10">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 border border-cyan-500/30 group-hover:scale-110 transition-transform">
                <Terminal className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-cyan-500 font-bold tracking-widest mb-2 uppercase">Developer Mindset</p>
                <p className="text-base font-bold text-slate-200 leading-snug italic">"Talk is cheap. Show me the code."</p>
                <p className="text-xs text-slate-500 mt-2 font-medium">— Linus Torvalds</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 backdrop-blur-md hover:border-purple-500/50 transition-all shadow-lg"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all" />
            <div className="flex flex-col h-full justify-between relative z-10">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4 border border-purple-500/30 group-hover:scale-110 transition-transform">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-purple-500 font-bold tracking-widest mb-2 uppercase">Computational Logic</p>
                <p className="text-base font-bold text-slate-200 leading-snug italic">"Everybody should learn to program a computer, because it teaches you how to think."</p>
                <p className="text-xs text-slate-500 mt-2 font-medium">— Steve Jobs</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 backdrop-blur-md hover:border-emerald-500/50 transition-all shadow-lg"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all" />
            <div className="flex flex-col h-full justify-between relative z-10">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                <Code className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-emerald-500 font-bold tracking-widest mb-2 uppercase">Innovation</p>
                <p className="text-base font-bold text-slate-200 leading-snug italic">"Any fool can write code that a computer can understand. Good programmers write code that humans can understand."</p>
                <p className="text-xs text-slate-500 mt-2 font-medium">— Martin Fowler</p>
              </div>
            </div>
          </motion.div>
        </div>


        
        {/* Grades Grid Section */}
        <div className="space-y-6">
          {expandedGrade === null ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {curriculumData.map((gradeData: GradeCurriculum, gradeIdx: number) => (
                <motion.div
                  key={gradeData.grade}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * gradeIdx }}
                  onClick={() => setExpandedGrade(gradeData.grade)}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all text-center flex flex-col items-center justify-center min-h-[250px]"
                >
                  <div className={`absolute inset-0 bg-gradient-to-b ${getGlowColor(gradeData.grade)} opacity-10 group-hover:opacity-20 transition-opacity -z-10`} />
                  <div className={`w-20 h-20 mb-6 ${getNumberBg(gradeData.grade)} rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform`}>
                    <span className={`text-4xl font-black ${getNumberColor(gradeData.grade)}`}>
                      {gradeData.grade}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white mb-2">{gradeData.title}</h2>
                  <p className="text-sm text-slate-400">Ketuk untuk melihat bab materi</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <button 
                onClick={() => setExpandedGrade(null)}
                className="mb-4 flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 font-bold bg-cyan-950/30 px-4 py-2 rounded-full border border-cyan-900/50 transition-colors"
              >
                <ChevronRight className="h-4 w-4 rotate-180" /> Kembali ke Pilih Kelas
              </button>
              
              {curriculumData.filter(g => g.grade === expandedGrade).map((gradeData: GradeCurriculum) => (
                <motion.div
                  key={gradeData.grade}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                >
                  <div className={`absolute inset-0 bg-gradient-to-b ${getGlowColor(gradeData.grade)} opacity-5 rounded-3xl -z-10`} />
                  <div className="mb-6 flex items-center gap-4 border-b border-white/10 pb-6">
                    <div className={`w-14 h-14 ${getNumberBg(gradeData.grade)} rounded-2xl flex items-center justify-center shrink-0 border border-white/10`}>
                      <span className={`text-2xl font-black ${getNumberColor(gradeData.grade)}`}>
                        0{gradeData.grade}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-white">{gradeData.title}</h2>
                      <p className="text-sm text-slate-400 mt-0.5">{gradeData.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {gradeData.chapters.map((chapter: Chapter) => {
                      const isCompleted = completedChapters.includes(chapter.id);
                      return (
                        <div
                          key={chapter.id}
                          id={`chapter-card-${chapter.id}`}
                          onClick={() => onSelectGradeChapter(gradeData.grade, chapter)}
                          className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-xl"
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${getGlowColor(gradeData.grade)} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity -z-10`} />
                          <div className="flex items-start gap-4">
                            <div className="rounded-xl bg-slate-950/60 p-3 transition-transform group-hover:scale-110 border border-white/5">
                              {getIcon(chapter.iconName)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider">KODE: {chapter.code}</span>
                                {isCompleted && (
                                  <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                                    Selesai
                                  </span>
                                )}
                              </div>
                              <h3 className="mt-1.5 text-lg font-bold text-slate-100 transition-colors group-hover:text-cyan-400">
                                {chapter.title}
                              </h3>
                              <p className="mt-2 text-xs leading-relaxed text-slate-400 line-clamp-2">
                                {chapter.description}
                              </p>
                            </div>
                          </div>
                          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                            <span className="text-xs text-slate-500 font-medium">
                              {chapter?.meetings?.length || 0} Pertemuan Belajar
                            </span>
                            <div className="flex items-center gap-1 text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
                              <span>Mulai Belajar</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        
        {/* Tip of the Day Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-6 md:p-8 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/20 rounded-3xl flex flex-col md:flex-row items-center gap-6 md:gap-8 backdrop-blur-xl relative overflow-hidden group hover:border-yellow-500/40 transition-colors shadow-2xl shadow-yellow-900/10"
        >
          {/* Animated glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-yellow-500/20 transition-all duration-700 pointer-events-none" />
          
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[0_0_30px_rgba(234,179,8,0.3)] border border-yellow-200/50 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 z-10">
            <Sparkles className="h-8 w-8 text-white drop-shadow-md" />
          </div>
          
          <div className="flex-1 text-center md:text-left z-10">
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300 font-extrabold text-xl md:text-2xl mb-2 drop-shadow-sm">
              {todayTip.title}
            </div>
            <div className="text-slate-300 text-sm md:text-base leading-relaxed font-medium">
              {todayTip.desc}
            </div>
          </div>
          
          <div className="flex gap-3 flex-shrink-0 z-10 flex-wrap justify-center">
            {todayTip.tags.map(tag => (
               <div key={tag} className="px-4 py-1.5 bg-yellow-500/10 rounded-full text-xs uppercase font-black text-yellow-400 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                 {tag}
               </div>
            ))}
          </div>
        </motion.div>


      </div>
    </div>
  );
}
