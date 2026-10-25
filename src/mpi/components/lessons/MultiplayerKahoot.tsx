import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Zap, Target, Trophy, Award, Crown, CheckCircle, XCircle, ArrowRight, PlayCircle, Loader2, Home } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface MultiplayerKahootProps {
  questions: { q: string; options: string[]; a: string }[];
  onComplete: () => void;
  isHost: boolean;
  subject: string;
}

export default function MultiplayerKahoot({ questions, onComplete, isHost, subject }: MultiplayerKahootProps) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 p-6 rounded-2xl text-center text-white">
        Fitur Multiplayer membutuhkan konfigurasi Supabase (VITE_SUPABASE_URL dan KEY).
      </div>
    );
  }

  if (isHost) {
    return <HostScreen questions={questions} subject={subject} />;
  } else {
    return <PlayerScreen onComplete={onComplete} subject={subject} />;
  }
}

// ==============================
// HOST SCREEN
// ==============================
function HostScreen({ questions, subject }: { questions: any[]; subject: string }) {
  const [roomCode, setRoomCode] = useState('');
  const [gameState, setGameState] = useState<'lobby' | 'question' | 'reveal' | 'leaderboard' | 'podium'>('lobby');
  const [players, setPlayers] = useState<Record<string, { score: number; streak: number; totalCorrect: number; lastCorrect: boolean }>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [answersThisRound, setAnswersThisRound] = useState<Record<string, string>>({});
  
  const channelRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const playersRef = useRef(players);
  const answersRef = useRef(answersThisRound);
  const currentQRef = useRef(currentQ);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    playersRef.current = players;
    answersRef.current = answersThisRound;
    currentQRef.current = currentQ;
    gameStateRef.current = gameState;
  }, [players, answersThisRound, currentQ, gameState]);

  useEffect(() => {
    // Generate Room Code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);

    const channel = supabase.channel(`room:${code}`);
    
    channel
      .on('broadcast', { event: 'join' }, ({ payload }) => {
        const name = payload.name;
        setPlayers((prev) => {
          if (prev[name]) return prev;
          return { ...prev, [name]: { score: 0, streak: 0, totalCorrect: 0, lastCorrect: false } };
        });
        // Send state back immediately
        channel.send({
          type: 'broadcast',
          event: 'state_update',
          payload: buildStatePayload(gameStateRef.current)
        });
      })
      .on('broadcast', { event: 'answer' }, ({ payload }) => {
        const { name, answer, timeElapsed } = payload;
        if (gameStateRef.current !== 'question') return;
        
        setAnswersThisRound((prev) => ({ ...prev, [name]: answer }));
      })
      .on('broadcast', { event: 'request_state' }, () => {
        channel.send({
          type: 'broadcast',
          event: 'state_update',
          payload: buildStatePayload(gameStateRef.current)
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Host connected to room:', code);
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timerRef.current);
    };
  }, []);

  // When everyone answers, stop early
  useEffect(() => {
    if (gameState === 'question') {
      const activePlayerCount = Object.keys(players).length;
      const answerCount = Object.keys(answersThisRound).length;
      if (activePlayerCount > 0 && answerCount === activePlayerCount) {
        handleReveal();
      }
    }
  }, [answersThisRound, gameState, players]);

  const buildStatePayload = (state: string, extra?: any) => {
    const sortedPlayers = Object.entries(playersRef.current)
      .map(([name, data]) => ({ name, ...(data as any) }))
      .sort((a, b) => b.score - a.score);

    return {
      state,
      qIndex: currentQRef.current,
      question: questions[currentQRef.current],
      leaderboard: sortedPlayers,
      totalQuestions: questions.length,
      ...extra
    };
  };

  const broadcastState = (state: string, extra?: any) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'state_update',
        payload: buildStatePayload(state, extra)
      });
    }
  };

  const startGame = () => {
    if (Object.keys(players).length === 0) {
      Swal.fire('Tunggu!', 'Belum ada pemain yang bergabung.', 'warning');
      return;
    }
    setCurrentQ(0);
    startQuestion(0);
  };

  const startQuestion = (index: number) => {
    setGameState('question');
    setAnswersThisRound({});
    setTimeLeft(15);

    broadcastState('question', { endTime: Date.now() + 15000 });

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleReveal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleReveal = () => {
    if (gameStateRef.current === 'reveal') return; // Prevent double trigger
    clearInterval(timerRef.current);
    setGameState('reveal');
    
    const correctAns = questions[currentQRef.current].a;
    const newPlayers = { ...playersRef.current };
    
    // Process answers
    Object.entries(newPlayers).forEach(([name, data]) => {
      const ans = answersRef.current[name];
      if (ans === correctAns) {
        newPlayers[name].score += 1000 + (timeLeft * 20); // Time bonus
        newPlayers[name].streak += 1;
        newPlayers[name].totalCorrect += 1;
        newPlayers[name].lastCorrect = true;
      } else {
        newPlayers[name].streak = 0;
        newPlayers[name].lastCorrect = false;
      }
    });

    setPlayers(newPlayers);

    // Give state time to update locally before broadcasting reveal
    setTimeout(() => {
      broadcastState('reveal', { correctAns });
    }, 100);
  };

  const nextAction = () => {
    if (gameState === 'reveal') {
      setGameState('leaderboard');
      broadcastState('leaderboard');
    } else if (gameState === 'leaderboard') {
      if (currentQ + 1 < questions.length) {
        const next = currentQ + 1;
        setCurrentQ(next);
        startQuestion(next);
      } else {
        setGameState('podium');
        broadcastState('podium');
      }
    }
  };

  // UI Renders for Host
  const renderLobby = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] space-y-8">
      <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl text-center shadow-2xl max-w-lg w-full">
        <h2 className="text-xl text-slate-400 font-bold mb-2">Kode Akses Ruangan (PIN)</h2>
        <div className="text-6xl font-black text-cyan-400 tracking-widest font-mono mb-8">{roomCode}</div>
        
        <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-white/5 mb-8">
          <span className="text-slate-400 font-bold flex items-center gap-2"><Users className="w-5 h-5"/> Pemain Terhubung</span>
          <span className="text-2xl font-bold text-white">{Object.keys(players).length}</span>
        </div>

        <button 
          onClick={startGame}
          className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold rounded-xl text-xl shadow-lg transition-all"
        >
          Mulai Permainan
        </button>
      </div>

      <div className="flex flex-wrap gap-3 justify-center max-w-3xl">
        <AnimatePresence>
          {Object.keys(players).map(p => (
            <motion.div 
              key={p}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white font-bold"
            >
              {p}
            </motion.div>
          ))}
        </AnimatePresence>
        {Object.keys(players).length === 0 && (
          <div className="text-slate-500 italic">Menunggu pemain bergabung...</div>
        )}
      </div>
    </div>
  );

  const renderQuestion = () => (
    <div className="flex flex-col min-h-[500px]">
      <div className="flex justify-between items-center mb-8">
        <div className="bg-white/10 px-4 py-2 rounded-xl text-white font-bold border border-white/20">
          Soal {currentQ + 1} / {questions.length}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-bold">{Object.keys(answersThisRound).length} / {Object.keys(players).length} Menjawab</span>
          <div className={`flex items-center justify-center w-16 h-16 rounded-full border-4 ${timeLeft <= 5 ? 'border-red-500 text-red-500 animate-pulse' : 'border-cyan-400 text-cyan-400'}`}>
            <span className="text-2xl font-black">{timeLeft}</span>
          </div>
        </div>
      </div>
      <div className="bg-slate-900 border border-white/10 p-10 rounded-3xl shadow-2xl flex-1 flex flex-col justify-center items-center text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-12">
          {questions[currentQ]?.q}
        </h2>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
          {questions[currentQ]?.options?.map((opt: string, i: number) => {
            const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-emerald-500'];
            return (
              <div key={i} className={`${colors[i % 4]} text-white p-6 rounded-2xl font-bold text-xl md:text-2xl shadow-lg`}>
                {opt}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderReveal = () => {
    const correctAns = questions[currentQ]?.a;
    return (
      <div className="flex flex-col min-h-[500px]">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Waktu Habis!</h2>
          <p className="text-slate-400">Jawaban yang benar adalah:</p>
        </div>
        
        <div className="bg-slate-900 border border-white/10 p-10 rounded-3xl shadow-2xl flex-1 flex flex-col justify-center items-center text-center">
          <div className="bg-emerald-500/20 border-2 border-emerald-500 p-8 rounded-3xl mb-8 w-full max-w-2xl">
            <h3 className="text-3xl font-extrabold text-emerald-400">
              {correctAns}
            </h3>
          </div>
          
          <button 
            onClick={nextAction}
            className="px-8 py-4 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xl hover:bg-cyan-400 transition-all flex items-center gap-2 shadow-lg"
          >
            Lanjut <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  };

  const renderLeaderboard = () => {
    const sorted = Object.entries(players)
      .map(([name, data]) => ({ name, ...(data as any) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5

    return (
      <div className="flex flex-col min-h-[500px] items-center">
        <h2 className="text-4xl font-extrabold text-white mb-8 flex items-center gap-3">
          <Trophy className="w-10 h-10 text-yellow-400" /> Papan Peringkat Sementara
        </h2>
        
        <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-2xl mb-8 space-y-4">
          {sorted.map((p, i) => (
            <motion.div 
              key={p.name}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-white/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 font-bold text-slate-500 text-xl">{i + 1}.</div>
                <div className="font-bold text-white text-xl">{p.name}</div>
                {p.streak >= 3 && <div className="text-orange-400 flex items-center text-sm font-bold bg-orange-400/10 px-2 py-1 rounded-lg"><Zap className="w-4 h-4 fill-orange-400 mr-1"/> Streak</div>}
              </div>
              <div className="font-black text-cyan-400 text-2xl">{p.score}</div>
            </motion.div>
          ))}
        </div>
        
        <button 
          onClick={nextAction}
          className="px-8 py-4 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xl hover:bg-cyan-400 transition-all flex items-center gap-2 shadow-lg"
        >
          {currentQ + 1 < questions.length ? 'Pertanyaan Berikutnya' : 'Lihat Hasil Akhir'} <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    );
  };

  const renderPodium = () => {
    const sorted = Object.entries(players)
      .map(([name, data]) => ({ name, ...(data as any) }))
      .sort((a, b) => b.score - a.score);

    const top3 = sorted.slice(0, 3);

    return (
      <div className="flex flex-col min-h-[500px] items-center justify-center text-center">
        <Crown className="w-20 h-20 text-yellow-400 mb-6 animate-bounce" />
        <h2 className="text-5xl font-extrabold text-white mb-12">Podium Juara</h2>
        
        <div className="flex items-end justify-center gap-4 md:gap-8 h-64 mb-12">
          {/* Rank 2 */}
          {top3[1] && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-col items-center">
              <div className="text-white font-bold mb-2 text-xl line-clamp-3 w-24 md:w-32">{top3[1].name}</div>
              <div className="text-cyan-400 font-black mb-2">{top3[1].score}</div>
              <div className="w-24 md:w-32 h-32 bg-gradient-to-t from-slate-700 to-slate-600 rounded-t-lg flex justify-center pt-4 border-t-4 border-slate-300">
                <span className="text-3xl font-black text-slate-400">2</span>
              </div>
            </motion.div>
          )}
          {/* Rank 1 */}
          {top3[0] && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }} className="flex flex-col items-center">
              <div className="text-white font-bold mb-2 text-2xl line-clamp-3 w-28 md:w-40">{top3[0].name}</div>
              <div className="text-yellow-400 font-black mb-2 text-xl">{top3[0].score}</div>
              <div className="w-28 md:w-40 h-48 bg-gradient-to-t from-yellow-700 to-yellow-500 rounded-t-lg flex justify-center pt-4 border-t-4 border-yellow-300">
                <span className="text-4xl font-black text-yellow-200">1</span>
              </div>
            </motion.div>
          )}
          {/* Rank 3 */}
          {top3[2] && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col items-center">
              <div className="text-white font-bold mb-2 text-xl line-clamp-3 w-24 md:w-32">{top3[2].name}</div>
              <div className="text-orange-400 font-black mb-2">{top3[2].score}</div>
              <div className="w-24 md:w-32 h-24 bg-gradient-to-t from-orange-900 to-orange-700 rounded-t-lg flex justify-center pt-4 border-t-4 border-orange-500">
                <span className="text-3xl font-black text-orange-400">3</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {gameState === 'lobby' && renderLobby()}
      {gameState === 'question' && renderQuestion()}
      {gameState === 'reveal' && renderReveal()}
      {gameState === 'leaderboard' && renderLeaderboard()}
      {gameState === 'podium' && renderPodium()}
    </div>
  );
}

// ==============================
// PLAYER SCREEN
// ==============================
function PlayerScreen({ onComplete, subject }: { onComplete: () => void; subject: string }) {
  const [roomCode, setRoomCode] = useState('');
  const [name, setName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [serverState, setServerState] = useState<any>(null);
  const [myAnswer, setMyAnswer] = useState<string | null>(null);
  const [channelRef, setChannelRef] = useState<any>(null);
  
  const joinTimeoutRef = useRef<any>(null);
  const hasJoinedRef = useRef(hasJoined);

  useEffect(() => {
    hasJoinedRef.current = hasJoined;
  }, [hasJoined]);

  useEffect(() => {
    return () => {
      if (joinTimeoutRef.current) clearTimeout(joinTimeoutRef.current);
      if (channelRef) supabase.removeChannel(channelRef);
    };
  }, [channelRef]);

  const handleJoin = async () => {
    if (!name.trim() || !roomCode.trim()) {
      Swal.fire('Tunggu', 'Masukkan Nama dan PIN Ruangan.', 'warning');
      return;
    }

    setIsConnecting(true);
    const code = roomCode.toUpperCase();
    const channel = supabase.channel(`room:${code}`);

    channel
      .on('broadcast', { event: 'state_update' }, ({ payload }) => {
        if (!hasJoinedRef.current) {
          clearTimeout(joinTimeoutRef.current);
          setHasJoined(true);
          setIsConnecting(false);
          setChannelRef(channel);
        }
        setServerState(payload);
        if (payload.state === 'question') {
          setMyAnswer(null); // Reset for new question
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Send join request
          channel.send({
            type: 'broadcast',
            event: 'join',
            payload: { name }
          });
          
          // Set a timeout: if host doesn't reply with state_update in 3 seconds, assume room is invalid
          joinTimeoutRef.current = setTimeout(() => {
            if (!hasJoinedRef.current) {
              supabase.removeChannel(channel);
              setIsConnecting(false);
              Swal.fire('Gagal!', 'PIN Ruangan tidak ditemukan atau Guru belum memulai permainan.', 'error');
            }
          }, 3000);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnecting(false);
          Swal.fire('Error', 'Gagal terhubung ke jaringan server.', 'error');
        }
      });
  };

  const handleAnswer = (opt: string) => {
    if (myAnswer || !channelRef || serverState?.state !== 'question') return;
    
    setMyAnswer(opt);
    channelRef.send({
      type: 'broadcast',
      event: 'answer',
      payload: { name, answer: opt, timeElapsed: 0 }
    });
  };

  if (!hasJoined) {
    return (
      <div className="max-w-md mx-auto bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl">
        <h2 className="text-3xl font-extrabold text-white mb-2 text-center">Gabung Mode Live</h2>
        <p className="text-slate-400 text-center mb-8">Masukkan PIN yang ditampilkan di layar gurumu.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">PIN Ruangan</label>
            <input 
              type="text"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value)}
              placeholder="Cth: A1B2C3"
              className="w-full px-4 py-4 rounded-xl bg-slate-950 border border-white/20 text-white focus:outline-none focus:border-cyan-400 font-mono tracking-widest text-center text-2xl uppercase"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Nama Pemain</label>
            <input 
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Namamu..."
              className="w-full px-4 py-4 rounded-xl bg-slate-950 border border-white/20 text-white focus:outline-none focus:border-cyan-400 font-bold text-center text-xl"
            />
          </div>
          <button 
            onClick={handleJoin}
            disabled={isConnecting}
            className="w-full py-4 mt-4 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xl hover:bg-cyan-400 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isConnecting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Masuk Sekarang'}
          </button>
        </div>
      </div>
    );
  }

  if (!serverState || serverState.state === 'lobby') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-cyan-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Kamu sudah masuk!</h2>
        <div className="text-xl text-slate-400 font-bold mb-8">Nama: {name}</div>
        <div className="flex items-center gap-3 text-slate-500 animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin" /> Menunggu guru memulai permainan...
        </div>
      </div>
    );
  }

  if (serverState.state === 'question') {
    if (myAnswer) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <div className="text-2xl font-bold text-white mb-4">Jawaban Terkunci!</div>
          <p className="text-slate-400 animate-pulse">Menunggu pemain lain...</p>
        </div>
      );
    }

    const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-emerald-500'];
    return (
      <div className="flex flex-col min-h-[400px]">
        <div className="text-center mb-6">
          <div className="inline-block bg-white/10 px-4 py-2 rounded-xl text-white font-bold border border-white/20">
            Pertanyaan {serverState.qIndex + 1}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 flex-1">
          {serverState.question?.options?.map((opt: string, i: number) => (
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              className={`${colors[i % 4]} text-white p-4 rounded-2xl font-bold text-lg md:text-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center text-center`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (serverState.state === 'reveal') {
    const myData = serverState.leaderboard?.find((p: any) => p.name === name);
    const isCorrect = myData?.lastCorrect;

    return (
      <div className={`flex flex-col items-center justify-center min-h-[400px] text-center p-8 rounded-3xl transition-colors ${isCorrect ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-red-500/20 border-red-500/50'} border-2`}>
        {isCorrect ? (
          <CheckCircle className="w-24 h-24 text-emerald-400 mb-6" />
        ) : (
          <XCircle className="w-24 h-24 text-red-400 mb-6" />
        )}
        <h2 className={`text-4xl font-extrabold mb-4 ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
          {isCorrect ? 'BENAR!' : 'SALAH!'}
        </h2>
        {isCorrect && myData?.streak > 1 && (
          <div className="flex items-center gap-2 bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full font-bold mb-6">
            <Zap className="w-5 h-5 fill-orange-400" /> {myData.streak} Jawaban Benar Beruntun!
          </div>
        )}
        <div className="text-slate-300 font-bold text-xl bg-slate-900/50 px-6 py-3 rounded-xl">
          Skor Kamu: {myData?.score || 0}
        </div>
      </div>
    );
  }

  if (serverState.state === 'leaderboard') {
    const myData = serverState.leaderboard?.find((p: any) => p.name === name);
    const myRank = serverState.leaderboard?.findIndex((p: any) => p.name === name) + 1;

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <h2 className="text-3xl font-bold text-white mb-2">Papan Peringkat</h2>
        <div className="text-slate-400 mb-8">Lihat layar utama guru!</div>
        
        <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm">
          <div className="text-sm text-slate-500 font-bold uppercase mb-1">Posisi Kamu</div>
          <div className="text-4xl font-black text-cyan-400 mb-4">#{myRank}</div>
          <div className="text-sm text-slate-500 font-bold uppercase mb-1">Total Skor</div>
          <div className="text-2xl font-bold text-white">{myData?.score || 0}</div>
        </div>
      </div>
    );
  }

  if (serverState.state === 'podium') {
    const myRank = serverState.leaderboard?.findIndex((p: any) => p.name === name) + 1;
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <Crown className={`w-24 h-24 mb-6 ${myRank === 1 ? 'text-yellow-400' : myRank === 2 ? 'text-slate-300' : myRank === 3 ? 'text-orange-400' : 'text-slate-600'}`} />
        <h2 className="text-4xl font-extrabold text-white mb-4">
          {myRank <= 3 ? 'Selamat!' : 'Permainan Selesai!'}
        </h2>
        <div className="text-xl text-slate-300 mb-8">
          Kamu meraih peringkat <span className="font-black text-cyan-400">#{myRank}</span>
        </div>
        <button 
          onClick={onComplete}
          className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
        >
          Selesai & Keluar
        </button>
      </div>
    );
  }

  return null;
}
