import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, ArrowRight, Lock, Key, Plus, Trash2, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

interface LD9Materi4UjianProps {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}


const quizQuestions = [
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


export default function LD9Materi4Ujian({ onCompleteMeeting, isCompleted }: LD9Materi4UjianProps) {
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("7.1");
  const [accessCode, setAccessCode] = useState("");
  
  const [hasStarted, setHasStarted] = useState(false);
  const [overrideCompleted, setOverrideCompleted] = useState(false);

  // Teacher Portal State
  const [showTeacherPortal, setShowTeacherPortal] = useState(false);
  const [teacherPassInput, setTeacherPassInput] = useState("");
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(false);
  const [activeCodes, setActiveCodes] = useState<{code: string}[]>([]);

  React.useEffect(() => {
    if (showTeacherPortal && isTeacherAuthenticated) {
      loadAccessCodes();
    }
  }, [showTeacherPortal, isTeacherAuthenticated]);

  const loadAccessCodes = () => {
    const codes = JSON.parse(localStorage.getItem("mpi_access_codes_ld9_ujian") || "[]");
    setActiveCodes(codes);
  };

  const generateAccessCode = () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const codes = JSON.parse(localStorage.getItem("mpi_access_codes_ld9_ujian") || "[]");
    codes.push({ code: newCode });
    localStorage.setItem("mpi_access_codes_ld9_ujian", JSON.stringify(codes));
    loadAccessCodes();
  };

  const deleteAccessCode = (codeToDelete: string) => {
    const codes = JSON.parse(localStorage.getItem("mpi_access_codes_ld9_ujian") || "[]");
    const newCodes = codes.filter((c: any) => c.code !== codeToDelete);
    localStorage.setItem("mpi_access_codes_ld9_ujian", JSON.stringify(newCodes));
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
    const codes = JSON.parse(localStorage.getItem("mpi_access_codes_ld9_ujian") || "[]");
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
    
    Swal.fire({
      title: "Ujian Dimulai",
      text: "Silakan siapkan kertas lembar dan alat tulis. Tuliskan jawaban yang benar untuk setiap soal.",
      icon: "info",
      confirmButtonColor: "#0ea5e9"
    });
  };

  const submitScore = async () => {
    Swal.fire({
      title: "Ujian Selesai!",
      text: "Silakan kumpulkan kertas jawabanmu ke meja guru.",
      icon: "success",
      confirmButtonColor: "#0ea5e9"
    }).then(() => {
      onCompleteMeeting();
    });
  };

  if (isCompleted && !overrideCompleted) {
    return (
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-900/40 to-blue-900/40 p-10 text-center space-y-6 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-400/20 blur-3xl rounded-full" />
        <div className="mx-auto h-24 w-24 bg-gradient-to-br from-yellow-400 to-amber-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-yellow-500/20 border-4 border-yellow-300/30">
          <Award className="w-12 h-12" />
        </div>
        <div>
          <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">Selesai Ujian!</h3>
          <p className="text-slate-300 mt-3 font-medium max-w-md mx-auto">
            Kamu telah menyelesaikan sesi ujian. Jangan lupa kumpulkan lembar jawabanmu.
          </p>
          <button 
            onClick={() => {
               setOverrideCompleted(true);
               setHasStarted(false);
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
          <p className="mt-2 text-slate-400 font-medium">Manajemen kode akses ujian tertulis.</p>
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

  if (!hasStarted) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center relative">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Evaluasi Akhir Bab LD9</h2>
          <p className="mt-2 text-slate-400 font-medium">Ujian formal (tulis kertas) untuk mengukur pemahaman teori Materi ini.</p>
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
              Mulai Ujian Tulis <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex flex-col items-center mb-6 text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Lembar Soal Ujian Mengenali Hoaks</h2>
        <p className="mt-2 text-slate-400 font-medium">Tuliskan jawaban yang benar pada kertas jawabanmu (A/B/C/D atau jawaban penuh).</p>
      </div>

      <div className="space-y-6">
        {quizQuestions.map((q, idx) => (
          <div key={idx} className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {idx + 1}. {q.q}
            </h3>
            <ul className="space-y-2 pl-4">
              {q.options.map((opt, optIdx) => (
                <li key={optIdx} className="text-slate-300 text-sm">
                  <span className="font-bold text-cyan-400 mr-2">{String.fromCharCode(65 + optIdx)}.</span> 
                  {opt}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="pt-8 text-center border-t border-white/10 mt-8">
        <button
          onClick={submitScore}
          className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:brightness-110 shadow-lg inline-flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5" /> Saya Sudah Selesai Mengerjakan
        </button>
      </div>
    </div>
  );
}
