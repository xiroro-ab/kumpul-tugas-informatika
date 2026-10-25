import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, CheckCircle, ArrowRight, BookOpen, Presentation, Gamepad2, AlertCircle, RefreshCw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import Swal from 'sweetalert2';

interface APMeeting1Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

type Command = 'FORWARD' | 'TURN_LEFT' | 'TURN_RIGHT';
type Direction = 'N' | 'E' | 'S' | 'W';
interface Position {
  x: number;
  y: number;
}

const APMeeting1: React.FC<APMeeting1Props> = ({ onCompleteMeeting, isCompleted }) => {
  const [showGame, setShowGame] = useState(false);
  
  // Game State
  const [commands, setCommands] = useState<Command[]>([]);
  const [robotPos, setRobotPos] = useState<Position>({ x: 0, y: 0 });
  const [robotDir, setRobotDir] = useState<Direction>('E');
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  const gridSize = 4;
  const targetPos: Position = { x: 3, y: 3 };
  const obstacles: Position[] = [
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 1, y: 3 }
  ];

  const resetGame = () => {
    setRobotPos({ x: 0, y: 0 });
    setRobotDir('E');
    setCommands([]);
    setIsPlaying(false);
    setHasWon(false);
  };

  const addCommand = (cmd: Command) => {
    if (commands.length < 10) setCommands([...commands, cmd]);
  };

  const removeCommand = (index: number) => {
    setCommands(commands.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (isPlaying) {
      let currentPos = { ...robotPos };
      let currentDir = robotDir;
      let step = 0;

      const interval = setInterval(() => {
        if (step >= commands.length) {
          clearInterval(interval);
          setIsPlaying(false);
          if (currentPos.x === targetPos.x && currentPos.y === targetPos.y) {
            setHasWon(true);
            Swal.fire({
              icon: 'success',
              title: 'Misi Berhasil!',
              text: 'Algoritma yang kamu buat berhasil membawa robot ke tujuan!',
              background: '#1e293b',
              color: '#fff',
              confirmButtonColor: '#22c55e'
            }).then(() => {
              if (!isCompleted) onCompleteMeeting();
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Misi Gagal',
              text: 'Robot belum mencapai bendera. Periksa kembali algoritmamu!',
              background: '#1e293b',
              color: '#fff',
              confirmButtonColor: '#3b82f6'
            }).then(() => {
               setRobotPos({ x: 0, y: 0 });
               setRobotDir('E');
            });
          }
          return;
        }

        const cmd = commands[step];
        if (cmd === 'TURN_LEFT') {
          const dirs: Direction[] = ['N', 'W', 'S', 'E'];
          currentDir = dirs[(dirs.indexOf(currentDir) + 1) % 4];
        } else if (cmd === 'TURN_RIGHT') {
          const dirs: Direction[] = ['N', 'E', 'S', 'W'];
          currentDir = dirs[(dirs.indexOf(currentDir) + 1) % 4];
        } else if (cmd === 'FORWARD') {
          let newX = currentPos.x;
          let newY = currentPos.y;
          if (currentDir === 'N') newY -= 1;
          if (currentDir === 'S') newY += 1;
          if (currentDir === 'E') newX += 1;
          if (currentDir === 'W') newX -= 1;

          if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
            const isObstacle = obstacles.some(obs => obs.x === newX && obs.y === newY);
            if (!isObstacle) {
              currentPos = { x: newX, y: newY };
            } else {
              clearInterval(interval);
              setIsPlaying(false);
              Swal.fire({
                icon: 'error',
                title: 'Menabrak!',
                text: 'Robot menabrak rintangan.',
                background: '#1e293b',
                color: '#fff',
                confirmButtonColor: '#3b82f6'
              }).then(() => {
                 setRobotPos({ x: 0, y: 0 });
                 setRobotDir('E');
              });
              return;
            }
          }
        }

        setRobotPos(currentPos);
        setRobotDir(currentDir);
        step++;
      }, 500);

      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 flex items-center gap-3">
          <Presentation className="w-8 h-8 text-cyan-400" />
          Materi: Konsep Algoritma & Pemrograman
        </h2>
        
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
            <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Intisari Materi
            </h3>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink mt-0.5" />
                <span><strong className="text-white">Algoritma</strong> adalah urutan langkah-langkah logis untuk menyelesaikan masalah.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink mt-0.5" />
                <span><strong className="text-white">Program</strong> adalah instruksi yang ditulis dalam bahasa yang dimengerti komputer untuk menjalankan algoritma.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink mt-0.5" />
                <span>Algoritma yang baik harus jelas, berurutan, dan memiliki titik akhir.</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
            <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Contoh Kehidupan Sehari-hari
            </h3>
            <ul className="space-y-4 text-slate-300">
              <li className="flex items-start gap-2">
                <ArrowRight className="w-5 h-5 text-amber-400 shrink mt-0.5" />
                <span><strong className="text-white">Memasak Mie Instan:</strong> Langkah-langkah merebus air, memasukkan mie, dan menambahkan bumbu adalah sebuah algoritma.</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-5 h-5 text-amber-400 shrink mt-0.5" />
                <span><strong className="text-white">Merakit Mainan:</strong> Instruksi merakit lego atau gundam juga merupakan algoritma.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-2">
              <Gamepad2 className="w-7 h-7 text-indigo-400" />
              Misi: Susun Algoritma Robot
            </h2>
            <p className="text-slate-400">Susun perintah agar robot mencapai bendera hijau! Hindari rintangan merah.</p>
          </div>
          <button 
            onClick={() => setShowGame(!showGame)}
            className="px-4 sm:px-6 py-3 w-full sm:w-auto bg-indigo-500 text-sm sm:text-base hover:bg-indigo-400 text-white font-bold rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/25 shrink"
          >
            {showGame ? 'Sembunyikan Game' : 'Mulai Game Interaktif'}
          </button>
        </div>

        {showGame && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-white/10 pt-8"
          >
            <div className="grid md:grid-cols-2 gap-8">
              {/* Game Board */}
              <div>
                <div className="aspect-square bg-slate-950 rounded-xl border-4 border-slate-800 p-2 grid grid-cols-4 grid-rows-4 gap-1">
                  {Array.from({ length: 16 }).map((_, i) => {
                    const x = i % 4;
                    const y = Math.floor(i / 4);
                    const isRobot = robotPos.x === x && robotPos.y === y;
                    const isTarget = targetPos.x === x && targetPos.y === y;
                    const isObstacle = obstacles.some(obs => obs.x === x && obs.y === y);

                    return (
                      <div key={i} className={`rounded-lg relative flex items-center justify-center
                        ${isObstacle ? 'bg-red-500/20 border-2 border-red-500/50' : 'bg-slate-900 border border-slate-800'}
                      `}>
                        {isObstacle && <div className="w-1/2 h-1/2 bg-red-500 rounded-sm transform rotate-45" />}
                        {isTarget && !isRobot && <div className="w-3/4 h-3/4 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]" />}
                        
                        {isRobot && (
                          <motion.div 
                            layout
                            className="w-3/4 h-3/4 bg-cyan-400 rounded-full flex items-center justify-center text-slate-900 font-bold shadow-[0_0_15px_rgba(34,211,238,0.5)] z-10"
                            animate={{ rotate: robotDir === 'N' ? -90 : robotDir === 'E' ? 0 : robotDir === 'S' ? 90 : 180 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-white font-bold mb-3">Tumpukan Instruksi (Algoritma):</h4>
                  <div className="min-h-[120px] bg-slate-900 rounded-xl border border-white/10 p-3 flex flex-wrap gap-2 content-start">
                    {commands.length === 0 ? (
                      <span className="text-slate-500 italic text-sm">Tambahkan instruksi dari tombol di bawah...</span>
                    ) : (
                      commands.map((cmd, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => removeCommand(idx)}
                          className="bg-indigo-500/20 border border-indigo-500 text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer hover:bg-red-500/20 hover:border-red-500 hover:text-red-400 transition-colors flex items-center gap-1"
                          title="Klik untuk menghapus"
                        >
                          {cmd === 'FORWARD' ? 'Maju' : cmd === 'TURN_LEFT' ? 'Putar Kiri' : 'Putar Kanan'}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-bold mb-3">Pilih Instruksi:</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => addCommand('TURN_LEFT')}
                      disabled={isPlaying || hasWon}
                      className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl border border-white/10 disabled:opacity-50 flex flex-col items-center justify-center gap-2 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-amber-400" />
                      <span className="text-xs font-bold">Kiri</span>
                    </button>
                    <button 
                      onClick={() => addCommand('FORWARD')}
                      disabled={isPlaying || hasWon}
                      className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl border border-white/10 disabled:opacity-50 flex flex-col items-center justify-center gap-2 transition-colors"
                    >
                      <ChevronUp className="w-5 h-5 text-cyan-400" />
                      <span className="text-xs font-bold">Maju</span>
                    </button>
                    <button 
                      onClick={() => addCommand('TURN_RIGHT')}
                      disabled={isPlaying || hasWon}
                      className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl border border-white/10 disabled:opacity-50 flex flex-col items-center justify-center gap-2 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-amber-400" />
                      <span className="text-xs font-bold">Kanan</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsPlaying(true)}
                    disabled={commands.length === 0 || isPlaying || hasWon}
                    className="flex-1 bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-3 rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" /> Jalankan Program
                  </button>
                  <button 
                    onClick={resetGame}
                    disabled={isPlaying}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-xl disabled:opacity-50 transition-colors border border-white/10"
                    title="Reset"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {isCompleted && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-500/10 border border-green-500/30 rounded-3xl p-6 text-center"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 text-green-400 mb-4">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Materi Selesai!</h3>
          <p className="text-slate-300">Kamu telah memahami konsep dasar Algoritma dan Pemrograman.</p>
        </motion.div>
      )}
    </div>
  );
};

export default APMeeting1;
