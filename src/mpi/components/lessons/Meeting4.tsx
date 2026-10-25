import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, CheckCircle, TerminalSquare } from 'lucide-react';
import Swal from 'sweetalert2';

interface Meeting4Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const mazeLayoutOriginal = [
  'S', ' ', '🧱', ' ', ' ', ' ', ' ', ' ',
  ' ', ' ', '🧱', ' ', '🧱', ' ', '🧱', ' ',
  ' ', ' ', ' ', ' ', '🧱', ' ', '🧱', ' ',
  ' ', '🧱', '🧱', ' ', ' ', ' ', ' ', ' ',
  ' ', ' ', ' ', ' ', '🧱', ' ', '🧱', ' ',
  ' ', '🧱', ' ', ' ', '🧱', ' ', '🧱', ' ',
  ' ', '🧱', ' ', ' ', ' ', ' ', ' ', ' ',
  ' ', ' ', ' ', '🧱', '🧱', '🧱', ' ', '🏁',
];

export default function Meeting4({ onCompleteMeeting, isCompleted }: Meeting4Props) {
  const [commands, setCommands] = useState<string[]>([]);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  
  const drawMaze = () => {
    return mazeLayoutOriginal.map((cell, index) => {
      const x = index % 8;
      const y = Math.floor(index / 8);
      const isPlayer = playerPos.x === x && playerPos.y === y;
      
      let content = cell;
      if (cell === 'S') content = ' '; // Hide Start
      if (isPlayer) content = '🤖';
      
      return (
        <div key={index} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-xl sm:text-2xl bg-white/5 rounded-md border border-white/10 shadow-inner">
          {content}
        </div>
      );
    });
  };

  const addCommand = (cmd: string) => {
    if (isRunning || hasWon) return;
    setCommands([...commands, cmd]);
  };

  const clearCommands = () => {
    if (isRunning || hasWon) return;
    setCommands([]);
  };

  const runAlgorithm = async () => {
    if (commands.length === 0 || isRunning || hasWon) return;
    setIsRunning(true);
    
    let currentX = 0;
    let currentY = 0;
    
    setPlayerPos({ x: currentX, y: currentY }); // Reset to start
    await new Promise(resolve => setTimeout(resolve, 500));

    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      if (cmd === '⬆️') currentY--;
      if (cmd === '⬇️') currentY++;
      if (cmd === '⬅️') currentX--;
      if (cmd === '➡️') currentX++;

      // Check bounds and walls
      if (currentX >= 0 && currentX < 8 && currentY >= 0 && currentY < 8) {
        const cellIndex = currentY * 8 + currentX;
        if (mazeLayoutOriginal[cellIndex] !== '🧱') {
          setPlayerPos({ x: currentX, y: currentY });
          await new Promise(resolve => setTimeout(resolve, 300));
          
          if (mazeLayoutOriginal[cellIndex] === '🏁') {
            setHasWon(true);
            setIsRunning(false);
            Swal.fire({
              title: "Tujuan Tercapai!",
              text: "Algoritma instruksimu berhasil membawa robot ke garis finish!",
              icon: "success",
              confirmButtonColor: "#10b981"
            }).then(() => {
              onCompleteMeeting();
            });
            return;
          }
        } else {
          // Hit wall
          setIsRunning(false);
          Swal.fire({
            title: "Oh tidak, menabrak tembok!",
            text: "Coba periksa lagi algoritma perintahmu.",
            icon: "error",
            confirmButtonColor: "#ef4444"
          });
          setPlayerPos({ x: 0, y: 0 });
          return;
        }
      } else {
        // Out of bounds
        setIsRunning(false);
        Swal.fire({
          title: "Keluar dari jalur!",
          text: "Robot keluar dari area labirin. Periksa kembali algoritmamu.",
          icon: "error",
          confirmButtonColor: "#ef4444"
        });
        setPlayerPos({ x: 0, y: 0 });
        return;
      }
    }
    
    // Finished commands but didn't reach finish
    setIsRunning(false);
    Swal.fire({
      title: "Belum Sampai",
      text: "Instruksi sudah habis tapi belum sampai di bendera finish. Tambahkan lagi perintahnya!",
      icon: "warning",
      confirmButtonColor: "#f59e0b"
    });
    setPlayerPos({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Pilar 4: Algoritma</h2>
        <p className="mt-2 text-slate-400 font-medium">
          Algoritma adalah menyusun instruksi atau langkah-langkah yang logis dan berurutan untuk menyelesaikan masalah.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-xl flex gap-6 items-center flex-col sm:flex-row">
        <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-2xl shrink-0">
          <TerminalSquare className="w-12 h-12" />
        </div>
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="text-xl font-bold text-white">Analogi: Resep Memasak Kue</h3>
          <p className="text-slate-300">
            Jika kamu ingin membuat kue, kamu harus mengikuti langkah-langkah secara berurutan. (1) Siapkan bahan, (2) Campur adonan, (3) Panggang 30 menit. Jika urutannya salah, kuenya akan gagal!
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Labirin Container */}
        <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl relative w-full md:w-auto mx-auto md:mx-0">
          <div className="absolute top-0 left-0 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full" />
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <TerminalSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Game: Algoritma Labirin</h3>
          </div>

          <p className="text-slate-400 mb-6 relative z-10">
            Buat urutan perintah terstruktur (algoritma) untuk membantu robot 🤖 mencapai garis finish 🏁.<br/>Hindari tembok 🧱!
          </p>

          <div className="grid grid-cols-8 gap-1 mx-auto relative z-10 p-2 bg-black/40 rounded-xl border border-white/5 w-fit">
            {drawMaze()}
          </div>
        </div>

        {/* Panel Kontrol */}
        <div className="flex-1 w-full space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl relative">
            <h3 className="font-bold text-white mb-4">Algoritma (Urutan Perintah):</h3>
            
            <div className="bg-black/40 p-4 rounded-xl min-h-[80px] mb-6 flex flex-wrap gap-2 border border-white/5 shadow-inner content-start">
              {commands.length === 0 && <span className="text-slate-500 italic text-sm">Belum ada perintah. Tekan tombol arah di bawah.</span>}
              {commands.map((cmd, i) => (
                <span key={i} className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded shadow border border-white/10 text-lg">
                  {cmd}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <button disabled={isRunning || hasWon} onClick={() => addCommand('⬆️')} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-xl border border-white/10 transition-colors shadow flex items-center justify-center text-2xl disabled:opacity-50">⬆️</button>
              <button disabled={isRunning || hasWon} onClick={() => addCommand('⬇️')} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-xl border border-white/10 transition-colors shadow flex items-center justify-center text-2xl disabled:opacity-50">⬇️</button>
              <button disabled={isRunning || hasWon} onClick={() => addCommand('⬅️')} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-xl border border-white/10 transition-colors shadow flex items-center justify-center text-2xl disabled:opacity-50">⬅️</button>
              <button disabled={isRunning || hasWon} onClick={() => addCommand('➡️')} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-xl border border-white/10 transition-colors shadow flex items-center justify-center text-2xl disabled:opacity-50">➡️</button>
              <button disabled={isRunning || hasWon} onClick={clearCommands} className="col-span-2 p-4 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-xl border border-rose-500/20 transition-colors shadow flex items-center justify-center font-bold gap-2 disabled:opacity-50">
                <RotateCcw className="w-5 h-5" /> Hapus Semua
              </button>
            </div>

            {(hasWon || isCompleted) && (
               <div className="w-full flex flex-col items-center justify-center gap-4">
                 <div className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                   <CheckCircle className="w-5 h-5" /> Misi Selesai
                 </div>
                 {hasWon && (
                   <button 
                     onClick={() => {
                       setHasWon(false);
                       setCommands([]);
                       setPlayerPos({ x: 0, y: 0 });
                     }}
                     className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-lg transition-colors shadow-lg shadow-emerald-500/20"
                   >
                     Main Lagi
                   </button>
                 )}
               </div>
            )}
            
            {!(hasWon || isCompleted) && (
              <button 
                disabled={isRunning || commands.length === 0} 
                onClick={runAlgorithm} 
                className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-lg transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isRunning ? (
                  <span className="animate-pulse">Menjalankan...</span>
                ) : (
                  <>
                    <Play className="w-5 h-5" /> Jalankan Algoritma
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
