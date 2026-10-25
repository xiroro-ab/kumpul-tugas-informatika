import React, { useEffect, useState, useMemo } from 'react';
import { Trophy, AlertTriangle, ArrowLeft, Filter } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface LeaderboardData {
  id: string;
  nama: string;
  kelas: string;
  skor: number;
}

export default function Leaderboard({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<LeaderboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>("Semua");

  useEffect(() => {
    async function fetchData() {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      try {
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data: rawData, error } = await supabase
          .from('leaderboard')
          .select('*')
          .order('skor', { ascending: false })
          .limit(100);

        if (error) throw error;
        setData(rawData || []);
      } catch (err) {
        // Silently catch to avoid triggering error overlay, show empty data or handle in UI
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    if (selectedClass === "Semua") return data;
    return data.filter(d => d.kelas === selectedClass);
  }, [data, selectedClass]);

  // Derive unique classes from data
  const availableClasses = useMemo(() => {
    const classes = new Set(data.map(d => d.kelas));
    return ["Semua", ...Array.from(classes).sort()];
  }, [data]);

  if (!isSupabaseConfigured()) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="rounded-3xl border border-yellow-500/30 bg-slate-900 p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <AlertTriangle className="w-16 h-16 text-yellow-500" />
            <h2 className="text-2xl font-bold text-white">Database Belum Dikonfigurasi</h2>
            <p className="text-slate-400 max-w-lg">
              Leaderboard membutuhkan konfigurasi database Supabase. Pengembang perlu memasukkan <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> di pengaturan environment.
            </p>
            <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-left text-sm font-mono text-slate-300 w-full overflow-x-auto">
              <p className="text-emerald-400 mb-2">// Instruksi Supabase Setup</p>
              <p>1. Buat proyek di Supabase</p>
              <p>2. Buat tabel bernama 'leaderboard'</p>
              <p>3. Tambahkan kolom: id (uuid), nama (text), kelas (text), skor (int4)</p>
              <p>4. Atur RLS (Row Level Security) agar bisa diakses publik (Insert & Select)</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const top3 = filteredData.slice(0, 3);
  const rest = filteredData.slice(3);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Kembali ke Beranda</span>
        </button>

        {!loading && availableClasses.length > 1 && (
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-white/20 text-white focus:outline-none focus:border-cyan-400 text-sm font-medium"
            >
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>{cls === "Semua" ? "Semua Kelas" : `Kelas ${cls}`}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 tracking-tight flex items-center justify-center gap-3">
          <Trophy className="w-10 h-10 text-yellow-400" /> Leaderboard Global
        </h2>
        <p className="mt-3 text-slate-400 font-medium">
          Peringkat siswa terbaik dalam menyelesaikan Ujian Akhir Master Mission.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-20 text-slate-500 font-medium">
          Belum ada data skor untuk kategori ini.
        </div>
      ) : (
        <div className="space-y-12">
          {/* Podium */}
          <div className="flex flex-col sm:flex-row justify-center items-end gap-4 px-4 h-[300px]">
            {/* Rank 2 */}
            {top3[1] && (
              <div className="w-full sm:w-1/3 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="text-xl font-bold text-slate-300 mb-2 text-center w-full truncate px-2">{top3[1].nama}</div>
                <div className="text-sm text-slate-400 mb-2">{top3[1].kelas}</div>
                <div className="w-full bg-gradient-to-t from-slate-400/20 to-slate-300/10 border-t-4 border-slate-300 rounded-t-2xl p-4 flex flex-col items-center justify-start h-[160px] shadow-[0_-10px_20px_rgba(203,213,225,0.1)]">
                  <div className="text-3xl mb-2">🥈</div>
                  <div className="font-mono font-bold text-2xl text-slate-200">{top3[1].skor}</div>
                </div>
              </div>
            )}
            
            {/* Rank 1 */}
            {top3[0] && (
              <div className="w-full sm:w-1/3 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0s' }}>
                <div className="text-2xl font-extrabold text-yellow-400 mb-2 text-center w-full truncate px-2">{top3[0].nama}</div>
                <div className="text-sm text-yellow-500/70 mb-2">{top3[0].kelas}</div>
                <div className="w-full bg-gradient-to-t from-yellow-500/20 to-yellow-400/10 border-t-4 border-yellow-400 rounded-t-2xl p-4 flex flex-col items-center justify-start h-[200px] shadow-[0_-10px_30px_rgba(250,204,21,0.2)]">
                  <div className="text-5xl mb-2">🥇</div>
                  <div className="font-mono font-bold text-4xl text-yellow-400">{top3[0].skor}</div>
                </div>
              </div>
            )}

            {/* Rank 3 */}
            {top3[2] && (
              <div className="w-full sm:w-1/3 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="text-lg font-bold text-amber-500 mb-2 text-center w-full truncate px-2">{top3[2].nama}</div>
                <div className="text-sm text-amber-600/70 mb-2">{top3[2].kelas}</div>
                <div className="w-full bg-gradient-to-t from-amber-600/20 to-amber-500/10 border-t-4 border-amber-600 rounded-t-2xl p-4 flex flex-col items-center justify-start h-[120px] shadow-[0_-10px_15px_rgba(217,119,6,0.1)]">
                  <div className="text-2xl mb-2">🥉</div>
                  <div className="font-mono font-bold text-xl text-amber-500">{top3[2].skor}</div>
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          {rest.length > 0 && (
            <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-black/40">
                  <tr>
                    <th className="p-4 text-slate-400 font-semibold text-sm w-16 text-center">Rank</th>
                    <th className="p-4 text-slate-400 font-semibold text-sm">Nama Lengkap</th>
                    <th className="p-4 text-slate-400 font-semibold text-sm text-center">Kelas</th>
                    <th className="p-4 text-slate-400 font-semibold text-sm text-right">Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rest.map((player, idx) => (
                    <tr key={player.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-center font-mono font-bold text-slate-500">{idx + 4}</td>
                      <td className="p-4 font-medium text-slate-200">{player.nama}</td>
                      <td className="p-4 text-center text-slate-400">{player.kelas}</td>
                      <td className="p-4 text-right font-mono font-bold text-cyan-400">{player.skor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
