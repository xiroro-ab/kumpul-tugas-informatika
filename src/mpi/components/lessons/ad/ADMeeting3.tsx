import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Lightbulb, CheckCircle, TrendingUp } from 'lucide-react';
import Swal from 'sweetalert2';

interface ADMeeting3Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const ADMeeting3: React.FC<ADMeeting3Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  const [step, setStep] = useState(0);

  const questions = [
    {
      id: 1,
      text: "Bulan apakah penjualan Es Krim paling tinggi?",
      options: ["Januari", "Februari", "Maret", "April"],
      correct: "Maret"
    },
    {
      id: 2,
      text: "Dari pola grafik, apakah penjualan Es Krim cenderung naik atau turun dari Januari ke Maret?",
      options: ["Cenderung Naik", "Cenderung Turun", "Tetap Sama"],
      correct: "Cenderung Naik"
    },
    {
      id: 3,
      text: "Jika pola kenaikan ini berlanjut, kira-kira bagaimana prediksi penjualan di bulan Mei?",
      options: ["Lebih rendah dari April", "Akan meningkat lagi", "Berhenti berjualan"],
      correct: "Akan meningkat lagi"
    }
  ];

  const handleAnswer = (answer: string) => {
    if (answer === questions[step].correct) {
      if (step < questions.length - 1) {
        setStep(step + 1);
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Analisis Cerdas!',
          text: 'Kamu berhasil menginterpretasi dan memprediksi data dengan baik.',
          background: '#0f172a',
          color: '#fff',
          confirmButtonColor: '#0ea5e9'
        });
        if (!isCompleted) {
          onCompleteMeeting();
        }
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Kurang Tepat',
        text: 'Coba perhatikan lagi grafik barnya!',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#0ea5e9'
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
        <h2 className="text-2xl font-bold text-white mb-4">Pertemuan 3: Menginterpretasi dan Memprediksi Data</h2>
        
        <div className="space-y-6 text-gray-300">
          <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-xl">
            <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5" /> Intisari Materi
            </h3>
            <p>
              <strong>Interpretasi Data</strong> adalah proses menarik kesimpulan dari sekumpulan data yang telah diolah, biasanya disajikan dalam bentuk visualisasi (seperti Grafik Bar, Pie Chart, atau Line Chart). Dengan membaca pola atau tren dari visualisasi tersebut, kita bisa membuat <strong>Prediksi</strong> tentang apa yang mungkin terjadi di masa depan.
            </p>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl">
            <h3 className="text-lg font-bold text-emerald-400 mb-2">Contoh dalam Kehidupan Sehari-hari</h3>
            <p>
              Aplikasi ramalan cuaca mengumpulkan data suhu, kelembaban, dan angin dari hari-hari sebelumnya. Dengan menginterpretasi pola data tersebut, aplikasi dapat memprediksi apakah besok akan hujan atau cerah.
            </p>
          </div>
        </div>
      </div>

      {!showGame ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowGame(true)}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
        >
          <BarChart3 className="w-6 h-6" />
          Mulai Simulasi Prediksi Data
        </motion.button>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/2 flex items-end justify-center h-64 bg-black/40 rounded-xl border border-white/10 p-6 pb-12 relative gap-4">
              <div className="absolute top-4 left-4 text-gray-400 font-bold">Total Penjualan</div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-400 font-bold text-sm">Bulan</div>
              
              {/* Dummy Bar Chart */}
              <div className="relative w-12 h-16 bg-blue-500/50 rounded-t-sm flex items-end justify-center group">
                <span className="absolute -top-6 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">50</span>
                <span className="absolute -bottom-6 text-gray-400 text-xs">Jan</span>
              </div>
              <div className="relative w-12 h-24 bg-blue-500/70 rounded-t-sm flex items-end justify-center group">
                <span className="absolute -top-6 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">75</span>
                <span className="absolute -bottom-6 text-gray-400 text-xs">Feb</span>
              </div>
              <div className="relative w-12 h-40 bg-blue-500 rounded-t-sm flex items-end justify-center group">
                <span className="absolute -top-6 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">120</span>
                <span className="absolute -bottom-6 text-gray-400 text-xs">Mar</span>
              </div>
              <div className="relative w-12 h-32 bg-blue-500/80 rounded-t-sm flex items-end justify-center group">
                <span className="absolute -top-6 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">100</span>
                <span className="absolute -bottom-6 text-gray-400 text-xs">Apr</span>
              </div>
            </div>

            <div className="w-full lg:w-1/2 space-y-6">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                Misi Analisis
              </h3>
              
              <div className="bg-black/20 p-5 rounded-xl border border-white/5">
                <p className="text-lg text-white mb-6">
                  {step < questions.length ? questions[step].text : "Misi Selesai!"}
                </p>

                {step < questions.length && (
                  <div className="space-y-3">
                    {questions[step].options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(opt)}
                        className="w-full p-4 bg-white/5 border border-white/10 hover:bg-blue-500/20 hover:border-blue-500/50 rounded-xl text-left text-gray-200 transition-all font-medium"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {step >= questions.length && (
                  <div className="text-center py-4">
                    <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                    <p className="text-emerald-400 font-bold">Kamu sudah hebat dalam membaca dan memprediksi data!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ADMeeting3;
