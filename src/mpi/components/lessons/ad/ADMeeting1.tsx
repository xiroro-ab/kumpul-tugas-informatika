import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle, Lightbulb, Search } from 'lucide-react';
import Swal from 'sweetalert2';

interface ADMeeting1Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const ADMeeting1: React.FC<ADMeeting1Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  const [completedWords, setCompletedWords] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<{r: number, c: number}[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

  const wordsToFind = ['DATA', 'ANGKA', 'TEKS', 'FAKTA', 'TABEL'];
  const grid = [
    ['D', 'A', 'T', 'A', 'X', 'B', 'M', 'Q'],
    ['P', 'O', 'Y', 'N', 'F', 'A', 'K', 'S'],
    ['T', 'A', 'B', 'E', 'L', 'Z', 'W', 'V'],
    ['C', 'D', 'E', 'G', 'F', 'A', 'K', 'T'],
    ['U', 'F', 'A', 'K', 'T', 'A', 'O', 'E'],
    ['L', 'H', 'J', 'K', 'I', 'N', 'P', 'K'],
    ['A', 'N', 'G', 'K', 'A', 'M', 'S', 'S'],
    ['V', 'C', 'X', 'Z', 'L', 'K', 'J', 'H'],
  ];

  // Map each word to its coordinate paths to check selection
  const wordPaths = [
    { word: 'DATA', path: [{r:0,c:0}, {r:0,c:1}, {r:0,c:2}, {r:0,c:3}] },
    { word: 'TABEL', path: [{r:2,c:0}, {r:2,c:1}, {r:2,c:2}, {r:2,c:3}, {r:2,c:4}] },
    { word: 'FAKTA', path: [{r:4,c:1}, {r:4,c:2}, {r:4,c:3}, {r:4,c:4}, {r:4,c:5}] },
    { word: 'ANGKA', path: [{r:6,c:0}, {r:6,c:1}, {r:6,c:2}, {r:6,c:3}, {r:6,c:4}] },
    { word: 'TEKS', path: [{r:3,c:7}, {r:4,c:7}, {r:5,c:7}, {r:6,c:7}] }
  ];

  const handleMouseDown = (r: number, c: number) => {
    setIsSelecting(true);
    setSelectedCells([{r, c}]);
  };

  const handleMouseEnter = (r: number, c: number) => {
    if (isSelecting) {
      // Prevent duplicates and allow drawing straight lines (simplified just push)
      if (!selectedCells.find(cell => cell.r === r && cell.c === c)) {
        setSelectedCells(prev => [...prev, {r, c}]);
      }
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    checkSelection();
  };

  const checkSelection = () => {
    // Check if selected cells match any word path exactly
    const selectedSorted = [...selectedCells].sort((a,b) => (a.r !== b.r) ? a.r - b.r : a.c - b.c);
    
    for (const wp of wordPaths) {
      if (completedWords.includes(wp.word)) continue;

      const pathSorted = [...wp.path].sort((a,b) => (a.r !== b.r) ? a.r - b.r : a.c - b.c);
      
      if (selectedSorted.length === pathSorted.length) {
        let match = true;
        for(let i=0; i<selectedSorted.length; i++){
          if (selectedSorted[i].r !== pathSorted[i].r || selectedSorted[i].c !== pathSorted[i].c) {
            match = false;
            break;
          }
        }
        if (match) {
          const newWords = [...completedWords, wp.word];
          setCompletedWords(newWords);
          setSelectedCells([]);
          
          if (newWords.length === wordsToFind.length && !isCompleted) {
            Swal.fire({
              icon: 'success',
              title: 'Hebat!',
              text: 'Kamu berhasil menemukan semua kata rahasia Analisis Data!',
              background: '#0f172a',
              color: '#fff',
              confirmButtonColor: '#0ea5e9'
            }).then(() => {
              onCompleteMeeting();
            });
          }
          return;
        }
      }
    }
    // No match
    setSelectedCells([]);
  };

  const isCellSelected = (r: number, c: number) => {
    return selectedCells.some(cell => cell.r === r && cell.c === c);
  };

  const isCellCompleted = (r: number, c: number) => {
    return wordPaths.some(wp => 
      completedWords.includes(wp.word) && wp.path.some(cell => cell.r === r && cell.c === c)
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" onMouseUp={handleMouseUp}>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
        <h2 className="text-2xl font-bold text-white mb-4">Pertemuan 1: Mengenal Data</h2>
        
        <div className="space-y-6 text-gray-300">
          <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-xl">
            <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5" /> Intisari Materi
            </h3>
            <p>
              <strong>Data</strong> adalah sekumpulan fakta mentah, angka, kata-kata, atau hasil observasi yang belum diolah dan belum memiliki makna. 
              Data terbagi menjadi dua jenis utama:
              <br/><br/>
              1. <strong>Data Kuantitatif</strong>: Data berbentuk angka yang dapat dihitung (contoh: berat badan 50kg, tinggi 160cm).
              <br/>
              2. <strong>Data Kualitatif</strong>: Data berbentuk teks atau kategori (contoh: warna favorit biru, rasa manis).
            </p>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl">
            <h3 className="text-lg font-bold text-emerald-400 mb-2">Contoh dalam Kehidupan Sehari-hari</h3>
            <p>
              Saat kamu memesan makanan melalui aplikasi, sistem akan mencatat nama makanan (Kualitatif), harga (Kuantitatif), dan jarak tempuh (Kuantitatif). Semua data ini disimpan dalam <strong>Tabel</strong> dan dapat diolah untuk menampilkan promosi yang sesuai dengan kebiasaanmu!
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
          <Search className="w-6 h-6" />
          Mulai Misi Mencari Kata (Word Search)
        </motion.button>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-4">Temukan Kata Tersembunyi</h3>
              <p className="text-gray-400 mb-6 text-sm">
                Klik, tahan, dan seret kursor/jarimu untuk memilih huruf yang membentuk kata-kata di bawah ini! (Vertikal/Horizontal).
              </p>

              <div className="inline-block bg-black/40 p-4 rounded-xl border border-white/10 select-none">
                {grid.map((row, r) => (
                  <div key={r} className="flex">
                    {row.map((char, c) => {
                      const selected = isCellSelected(r, c);
                      const completed = isCellCompleted(r, c);
                      return (
                        <div
                          key={`${r}-${c}`}
                          onMouseDown={() => handleMouseDown(r, c)}
                          onMouseEnter={() => handleMouseEnter(r, c)}
                          onTouchStart={() => handleMouseDown(r, c)}
                          className={`w-10 h-10 flex items-center justify-center m-1 text-lg font-bold rounded cursor-pointer transition-colors ${
                            completed ? 'bg-emerald-500 text-white' :
                            selected ? 'bg-blue-500 text-white' :
                            'bg-white/5 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          {char}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-64 bg-black/20 rounded-xl p-5 border border-white/5 h-fit">
              <h4 className="font-bold text-white mb-4">Kata Kunci</h4>
              <ul className="space-y-3">
                {wordsToFind.map((word) => (
                  <li key={word} className={`flex items-center gap-3 p-2 rounded-lg ${completedWords.includes(word) ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                    <CheckCircle className={`w-5 h-5 ${completedWords.includes(word) ? 'text-emerald-400' : 'text-gray-500'}`} />
                    <span className={`font-semibold tracking-wider ${completedWords.includes(word) ? 'text-emerald-400 line-through' : 'text-gray-300'}`}>
                      {word}
                    </span>
                  </li>
                ))}
              </ul>

              {isCompleted && (
                <div className="mt-6 p-4 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-emerald-400 font-bold">Misi Selesai!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ADMeeting1;
