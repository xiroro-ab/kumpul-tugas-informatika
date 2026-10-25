import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, CheckCircle, FileText } from 'lucide-react';
import Swal from 'sweetalert2';

interface APMeeting0Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const APMeeting0: React.FC<APMeeting0Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [activeMat, setActiveMat] = useState<number>(0);
  const [completedMats, setCompletedMats] = useState<number[]>([]);

  const materials = [
    {
      id: 0,
      title: "Konsep Algoritma dan Pemrograman",
      url: "https://drive.google.com/file/d/1eNqL4lmRd0GcRkIHpfyMobwBU4DPKLmO/preview",
      description: "Memahami konsep dasar algoritma dan pemrograman untuk memecahkan masalah dengan langkah-langkah logis.",
      type: "slide"
    },
    {
      id: 1,
      title: "Mengenal Objek dan Instruksi Visual (Scratch)",
      url: "https://www.youtube.com/embed/5QbzO5CSBG0?start=110",
      description: "Mengenali objek-objek dan memahami perintah atau instruksi dalam sebuah lingkungan pemrograman blok/visual.",
      type: "video"
    }
  ];

  const handleMatComplete = (id: number) => {
    if (!completedMats.includes(id)) {
      const newCompleted = [...completedMats, id];
      setCompletedMats(newCompleted);

      if (newCompleted.length === materials.length && !isCompleted) {
        Swal.fire({
          icon: 'success',
          title: 'Luar Biasa!',
          text: 'Kamu telah menyelesaikan semua materi landasan teori Algoritma dan Pemrograman.',
          background: '#0f172a',
          color: '#fff',
          confirmButtonColor: '#0ea5e9'
        });
        onCompleteMeeting();
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
        <h2 className="text-2xl font-bold text-white mb-2">Landasan Teori: Algoritma dan Pemrograman</h2>
        <p className="text-gray-400">
          Sebelum kita bermain dan memecahkan teka-teki, mari kita pelajari terlebih dahulu
          konsep dasar algoritma dan pemrograman visual lewat slide dan video di bawah ini.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden aspect-video relative">
            <iframe
              src={materials[activeMat].url}
              title={materials[activeMat].title}
              className="absolute top-0 left-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-2">{materials[activeMat].title}</h3>
            <p className="text-gray-400">{materials[activeMat].description}</p>
            
            {!completedMats.includes(activeMat) && (
              <button
                onClick={() => handleMatComplete(activeMat)}
                className="mt-4 px-6 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition-all flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Tandai Selesai Dipelajari</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Daftar Materi</h3>
          {materials.map((mat) => (
            <button
              key={mat.id}
              onClick={() => setActiveMat(mat.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                activeMat === mat.id
                  ? 'bg-blue-500/20 border-blue-500/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start gap-3">
                {completedMats.includes(mat.id) ? (
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                ) : mat.type === 'video' ? (
                  <PlayCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
                    activeMat === mat.id ? 'text-blue-400' : 'text-gray-400'
                  }`} />
                ) : (
                  <FileText className={`w-5 h-5 shrink-0 mt-0.5 ${
                    activeMat === mat.id ? 'text-blue-400' : 'text-gray-400'
                  }`} />
                )}
                <div>
                  <h4 className={`font-medium ${
                    activeMat === mat.id ? 'text-blue-400' : 'text-gray-200'
                  }`}>
                    {mat.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {mat.type === 'slide' ? 'Slide Presentasi' : 'Video Pembelajaran'}
                  </p>
                </div>
              </div>
            </button>
          ))}

          {isCompleted && (
            <div className="mt-8 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 font-medium">Semua Materi Selesai</p>
              <p className="text-sm text-green-400/70 mt-1">Lanjut ke Pertemuan 1!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default APMeeting0;
