import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

interface ADMeeting0Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const ADMeeting0: React.FC<ADMeeting0Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [activeVideo, setActiveVideo] = useState<number>(0);
  const [completedVideos, setCompletedVideos] = useState<number[]>([]);

  const videos = [
    {
      id: 0,
      title: "Mengenal Data dan Mengelola Data",
      url: "https://www.youtube.com/embed/4JvAZJYu9XM",
      description: "Mari kita pahami konsep dasar data, jenis-jenisnya, serta cara mengelolanya secara efisien."
    },
    {
      id: 1,
      title: "Menginterpretasi dan Memprediksi Data",
      url: "https://www.youtube.com/embed/BYHq067JVfc",
      description: "Mempelajari cara membaca sekumpulan data untuk menarik kesimpulan dan memprediksi masa depan."
    }
  ];

  const handleVideoComplete = (id: number) => {
    if (!completedVideos.includes(id)) {
      const newCompleted = [...completedVideos, id];
      setCompletedVideos(newCompleted);
      if (newCompleted.length === videos.length && !isCompleted) {
        Swal.fire({
          icon: 'success',
          title: 'Luar Biasa!',
          text: 'Kamu telah menyelesaikan semua video materi landasan teori Analisis Data.',
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
        <h2 className="text-2xl font-bold text-white mb-2">Landasan Teori: Analisis Data</h2>
        <p className="text-gray-400">
          Sebelum kita bermain dan memecahkan teka-teki, mari kita pelajari terlebih dahulu
          konsep dasar tentang data dan cara menganalisisnya lewat video di bawah ini.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden aspect-video relative">
            <iframe
              src={videos[activeVideo].url}
              title={videos[activeVideo].title}
              className="absolute top-0 left-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-2">{videos[activeVideo].title}</h3>
            <p className="text-gray-400">{videos[activeVideo].description}</p>
            
            {!completedVideos.includes(activeVideo) && (
              <button
                onClick={() => handleVideoComplete(activeVideo)}
                className="mt-4 px-6 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition-all flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Tandai Selesai Ditonton</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Daftar Video</h3>
          {videos.map((video) => (
            <button
              key={video.id}
              onClick={() => setActiveVideo(video.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                activeVideo === video.id
                  ? 'bg-blue-500/20 border-blue-500/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start gap-3">
                {completedVideos.includes(video.id) ? (
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                ) : (
                  <PlayCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
                    activeVideo === video.id ? 'text-blue-400' : 'text-gray-400'
                  }`} />
                )}
                <div>
                  <h4 className={`font-medium ${
                    activeVideo === video.id ? 'text-blue-400' : 'text-gray-200'
                  }`}>
                    {video.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {video.description}
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

export default ADMeeting0;
