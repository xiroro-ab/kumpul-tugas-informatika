import React from "react";
import { Home, ChevronRight, GraduationCap, BookOpen, Menu, Trophy, X } from "lucide-react";

interface NavigationProps {
  onToggleMenu?: () => void;
  currentGrade?: number;
  currentChapter?: { id: string; title: string; code: string };
  currentMeeting?: { id: string; title: string; number: number };
  onNavigateHome: () => void;
  onNavigateBackToChapter?: () => void;
  onOpenLeaderboard?: () => void;
  onCloseLms?: () => void;
}

export default function Navigation({
  currentGrade,
  currentChapter,
  currentMeeting,
  onNavigateHome,
  onNavigateBackToChapter,
  onOpenLeaderboard,
  onCloseLms,
  onToggleMenu
}: NavigationProps) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/85 backdrop-blur-md px-3 sm:px-6 py-2.5">
      <div className="mx-auto flex max-w-7xl flex-row items-center justify-between gap-3">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-300 font-medium flex-1 min-w-0">
          {onToggleMenu && (
            <button
              type="button"
              onClick={onToggleMenu}
              className="mr-1 p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 transition"
              title="Menu Navigasi"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <button
            id="nav-home-btn"
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-slate-300 transition-colors hover:bg-white/5 hover:text-cyan-400"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Beranda</span>
          </button>

          {currentGrade && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <button
                id="nav-grade-btn"
                type="button"
                onClick={onNavigateHome}
                className="flex items-center gap-1 rounded-md px-1.5 sm:px-2 py-1 transition-colors hover:bg-white/5 hover:text-cyan-400"
              >
                <GraduationCap className="h-4 w-4 text-cyan-400" />
                <span>Kelas {currentGrade}</span>
              </button>
            </>
          )}

          {currentGrade && currentChapter && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <button
                id="nav-chapter-btn"
                type="button"
                onClick={onNavigateBackToChapter || onNavigateHome}
                className="flex items-center gap-1 rounded-md px-1.5 sm:px-2 py-1 font-semibold text-purple-300 transition-colors hover:bg-white/5 hover:text-purple-200 truncate max-w-[140px] sm:max-w-none"
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span className="truncate">{currentChapter.code}</span>
              </button>
            </>
          )}

          {currentMeeting && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="flex items-center gap-1 rounded-md px-1.5 sm:px-2 py-1 text-slate-400 font-normal truncate max-w-[150px] sm:max-w-none">
                {!currentMeeting.id.includes('evaluasi') ? `Pertemuan ${currentMeeting.number}` : currentMeeting.title}
              </span>
            </>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenLeaderboard && (
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-400/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition"
              title="Lihat Peringkat & Skor Tertinggi"
            >
              <Trophy className="h-4 w-4 text-amber-400" />
              <span className="hidden md:inline">Leaderboard</span>
            </button>
          )}

          {onCloseLms && (
            <button
              type="button"
              onClick={onCloseLms}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 border border-rose-500 text-white text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-md shadow-rose-900/30"
              title="Tutup modul interaktif dan kembali ke Dashboard LMS"
            >
              <X className="h-4 w-4" />
              <span>Tutup ke LMS</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
