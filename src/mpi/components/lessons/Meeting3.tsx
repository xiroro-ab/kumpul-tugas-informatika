import React, { useState } from 'react';
import { Filter, CheckCircle, Map } from 'lucide-react';
import Swal from 'sweetalert2';

interface Meeting3Props {
  onCompleteMeeting: () => void;
  isCompleted: boolean;
}

const allItems = [
  { id: 1, name: "Tenda", isImportant: true, emoji: "⛺" },
  { id: 2, name: "Air Minum", isImportant: true, emoji: "💧" },
  { id: 3, name: "P3K (Obat)", isImportant: true, emoji: "🩹" },
  { id: 4, name: "Senter", isImportant: true, emoji: "🔦" },
  { id: 5, name: "Konsol Game", isImportant: false, emoji: "🎮" },
  { id: 6, name: "Buku Komik", isImportant: false, emoji: "📚" },
  { id: 7, name: "Boneka Beruang", isImportant: false, emoji: "🧸" },
  { id: 8, name: "Sepatu Hak Tinggi", isImportant: false, emoji: "👠" },
];

export default function Meeting3({ onCompleteMeeting, isCompleted }: Meeting3Props) {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [hasWon, setHasWon] = useState(false);

  const toggleItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
    setHasWon(false);
  };

  const checkAnswer = () => {
    const importantItemIds = allItems.filter(item => item.isImportant).map(item => item.id);
    
    const isCorrect = 
      selectedItems.length === importantItemIds.length &&
      selectedItems.every(id => importantItemIds.includes(id));

    if (isCorrect) {
      setHasWon(true);
      Swal.fire({
        title: "Tepat Sekali!",
        text: "Kamu berhasil mengabstraksi! Hanya memilih barang-barang yang sangat penting untuk bertahan hidup saat kemah, dan membuang yang tidak perlu.",
        icon: "success",
        confirmButtonColor: "#8b5cf6"
      }).then(() => {
        onCompleteMeeting();
      });
    } else {
      Swal.fire({
        title: "Kurang Tepat",
        text: "Pastikan kamu HANYA memilih barang-barang yang sangat krusial (penting) untuk berkemah. Ada barang penting yang belum dipilih, atau barang tidak penting yang malah terpilih!",
        icon: "error",
        confirmButtonColor: "#ef4444"
      });
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Pilar 3: Abstraksi</h2>
        <p className="mt-2 text-slate-400 font-medium">
          Abstraksi adalah menyaring informasi yang tidak penting dan hanya fokus pada detail utama yang dibutuhkan untuk menyelesaikan masalah.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-xl flex gap-6 items-center flex-col sm:flex-row">
        <div className="p-4 bg-purple-500/20 text-purple-400 rounded-2xl shrink-0">
          <Map className="w-12 h-12" />
        </div>
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="text-xl font-bold text-white">Analogi: Melihat Peta Rute Kereta</h3>
          <p className="text-slate-300">
            Saat kamu melihat peta rute kereta, kamu hanya butuh melihat nama stasiun dan garis jalurnya. Kamu TIDAK PERLU melihat gambar pohon, gedung, atau rumah di sekitar stasiun itu. Fokus saja pada apa yang penting!
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Game: Persiapan Berkemah (Abstraksi)</h3>
        </div>

        <p className="text-slate-400 mb-6 relative z-10">
          Kita akan pergi berkemah ke hutan selama 3 hari. Tas ransel kita ukurannya terbatas. 
          Pilihlah <strong>hanya barang-barang yang PALING PENTING</strong> untuk bertahan hidup, dan abaikan barang yang tidak penting!
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
          {allItems.map(item => {
            const isSelected = selectedItems.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  isSelected 
                    ? 'border-purple-500 bg-purple-500/20 shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <span className="text-4xl mb-2">{item.emoji}</span>
                <span className={`font-bold text-sm ${isSelected ? 'text-purple-300' : 'text-slate-400'}`}>
                  {item.name}
                </span>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-2 ${
                  isSelected ? 'border-purple-400 bg-purple-400 text-slate-900' : 'border-slate-600'
                }`}>
                  {isSelected && <CheckCircle className="w-4 h-4" />}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 relative z-10">
          <button
            onClick={checkAnswer}
            className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors shadow-lg shadow-purple-500/25"
          >
            Cek Barang Bawaan
          </button>
          
          {(hasWon || isCompleted) && (
            <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30">
              <CheckCircle className="w-5 h-5" /> Misi Selesai
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
