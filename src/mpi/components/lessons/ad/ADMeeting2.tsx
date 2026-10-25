import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Lightbulb, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

interface ADMeeting2Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const ADMeeting2: React.FC<ADMeeting2Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  const [answers, setAnswers] = useState<{[key: number]: string}>({});
  
  const formulas = [
    { id: 'sum', label: '=SUM(...)' },
    { id: 'avg', label: '=AVERAGE(...)' },
    { id: 'max', label: '=MAX(...)' },
    { id: 'min', label: '=MIN(...)' }
  ];

  const questions = [
    { id: 1, text: "Menghitung total seluruh penjualan buku bulan ini.", correct: "sum" },
    { id: 2, text: "Mencari nilai rata-rata ulangan harian siswa di kelas.", correct: "avg" },
    { id: 3, text: "Mencari suhu paling panas dalam satu minggu terakhir.", correct: "max" },
    { id: 4, text: "Menemukan harga barang yang paling murah di toko.", correct: "min" }
  ];

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('formulaId', id);
  };

  const handleDrop = (e: React.DragEvent, questionId: number) => {
    e.preventDefault();
    const formulaId = e.dataTransfer.getData('formulaId');
    if (formulaId) {
      setAnswers(prev => ({ ...prev, [questionId]: formulaId }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const checkAnswers = () => {
    if (Object.keys(answers).length < questions.length) {
      Swal.fire({
        icon: 'warning',
        title: 'Belum Selesai',
        text: 'Lengkapi semua jawaban terlebih dahulu!',
        background: '#0f172a',
        color: '#fff'
      });
      return;
    }

    const allCorrect = questions.every(q => answers[q.id] === q.correct);
    if (allCorrect) {
      Swal.fire({
        icon: 'success',
        title: 'Sempurna!',
        text: 'Kamu berhasil menggunakan fungsi Spreadsheet dengan tepat!',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#0ea5e9'
      });
      if (!isCompleted) {
        onCompleteMeeting();
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Ada beberapa formula yang belum tepat posisinya. Coba lagi ya!',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#0ea5e9'
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
        <h2 className="text-2xl font-bold text-white mb-4">Pertemuan 2: Mengelola dan Mengolah Data</h2>
        
        <div className="space-y-6 text-gray-300">
          <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-xl">
            <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5" /> Intisari Materi
            </h3>
            <p>
              Mengolah data dapat dilakukan secara sistematis menggunakan perangkat lunak pengolah angka (Spreadsheet) seperti Microsoft Excel atau Google Sheets. Beberapa fungsi dasarnya antara lain:
              <br/><br/>
              - <strong>SUM</strong>: Menjumlahkan data angka.<br/>
              - <strong>AVERAGE</strong>: Mencari nilai rata-rata dari sekumpulan data.<br/>
              - <strong>MAX</strong>: Mencari nilai terbesar (maksimum).<br/>
              - <strong>MIN</strong>: Mencari nilai terkecil (minimum).<br/>
              - <strong>SORT & FILTER</strong>: Mengurutkan data (A-Z) dan menyaring data berdasarkan kondisi tertentu.
            </p>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl">
            <h3 className="text-lg font-bold text-emerald-400 mb-2">Contoh dalam Kehidupan Sehari-hari</h3>
            <p>
              Guru walikelas menggunakan rumus <strong>AVERAGE</strong> untuk mencari rata-rata nilai rapot kelas, atau seorang kasir menggunakan fungsi <strong>SUM</strong> untuk menjumlahkan total belanjaan pelanggan secara otomatis.
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
          <Calculator className="w-6 h-6" />
          Mulai Simulasi Blok Formula
        </motion.button>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-xl font-bold text-white mb-2">Simulasi Blok Formula Spreadsheet</h3>
          <p className="text-gray-400 mb-6">Drag & Drop blok rumus di sebelah kiri ke dalam kotak yang sesuai dengan kasus di sebelah kanan!</p>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/3 space-y-4">
              <h4 className="text-white font-medium mb-2">Blok Formula</h4>
              <div className="grid grid-cols-2 gap-3">
                {formulas.map(f => (
                  <div
                    key={f.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, f.id)}
                    className="bg-indigo-500/20 border border-indigo-500/50 p-3 rounded-lg text-center cursor-move text-indigo-300 font-mono font-bold hover:bg-indigo-500/30 transition-colors"
                  >
                    {f.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {questions.map((q) => (
                <div key={q.id} className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row items-center gap-4 justify-between">
                  <p className="text-gray-300 flex-1">{q.text}</p>
                  
                  <div 
                    onDrop={(e) => handleDrop(e, q.id)}
                    onDragOver={handleDragOver}
                    className={`w-40 h-12 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors ${
                      answers[q.id] 
                        ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300 font-mono font-bold' 
                        : 'border-white/20 bg-black/40 text-gray-500'
                    }`}
                  >
                    {answers[q.id] ? formulas.find(f => f.id === answers[q.id])?.label : 'Drop di sini'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={checkAnswers}
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Cek Jawaban
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ADMeeting2;
