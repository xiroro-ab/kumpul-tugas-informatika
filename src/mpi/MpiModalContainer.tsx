import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  CheckCircle,
  Home,
  Compass,
  Trophy,
  User,
  Zap,
  ChevronUp,
  ChevronDown,
  X
} from "lucide-react";

import Navigation from "./components/Navigation";
import LandingPage from "./app/page";
import ChapterPage from "./app/[grade]/[chapter]/page";
import ContentRenderer from "./components/lessons/ContentRenderer";
import Leaderboard from "./components/Leaderboard";
import Portfolio from "./components/Portfolio";
import { curriculumData, Chapter, Meeting } from "./data/curriculum";

export interface MpiViewerOptions {
  mode?: "explorer" | "chapter" | "lesson" | "leaderboard" | "portfolio";
  grade?: number;
  chapterId?: string;
  meetingId?: string;
  lmsMaterialId?: string | number;
}

interface MpiModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  options?: MpiViewerOptions;
}

export function findMeetingInCurriculum(meetingId: string): { grade: number; chapter: Chapter; meeting: Meeting } | null {
  if (!meetingId) return null;
  const cleanId = String(meetingId).trim().replace(/^mpi_native_/, '').toLowerCase();
  const normalizedId = cleanId.replace(/[-_]/g, '');
  for (const g of (curriculumData || [])) {
    if (!g || !Array.isArray(g.chapters)) continue;
    for (const c of g.chapters) {
      if (!c || !Array.isArray(c.meetings)) continue;
      const m = c.meetings.find(x => {
        if (!x || !x.id) return false;
        const xId = String(x.id).toLowerCase();
        return xId === cleanId || xId.replace(/[-_]/g, '') === normalizedId;
      });
      if (m) return { grade: g.grade, chapter: c, meeting: m };
    }
  }
  return null;
}

export function findChapterInCurriculum(chapterIdOrCode: string, gradeHint?: number): { grade: number; chapter: Chapter } | null {
  if (!chapterIdOrCode) return null;
  const query = String(chapterIdOrCode).trim().toLowerCase();
  for (const g of (curriculumData || [])) {
    if (!g || !Array.isArray(g.chapters)) continue;
    if (gradeHint && g.grade !== Number(gradeHint)) continue;
    const c = g.chapters.find(x => x && (String(x.id).toLowerCase() === query || String(x.code).toLowerCase() === query));
    if (c) return { grade: g.grade, chapter: c };
  }
  // If not found with grade hint, search without grade hint
  for (const g of (curriculumData || [])) {
    if (!g || !Array.isArray(g.chapters)) continue;
    const c = g.chapters.find(x => x && (String(x.id).toLowerCase() === query || String(x.code).toLowerCase() === query));
    if (c) return { grade: g.grade, chapter: c };
  }
  return null;
}

export default function MpiModalContainer({ isOpen, onClose, options }: MpiModalContainerProps) {
  const initialMeeting = options?.meetingId ? findMeetingInCurriculum(options.meetingId) : null;
  const initialChapter = options?.chapterId ? findChapterInCurriculum(options.chapterId, options?.grade) : null;

  const [view, setView] = useState<"home" | "chapter" | "lesson" | "leaderboard" | "portfolio">(() => {
    if (initialMeeting) return "lesson";
    if (initialChapter) return "chapter";
    if (options?.mode === "leaderboard") return "leaderboard";
    if (options?.mode === "portfolio") return "portfolio";
    return "home";
  });
  const [isMateriOpen, setIsMateriOpen] = useState(false);
  const [openGrade, setOpenGrade] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(() => {
    if (initialMeeting) return initialMeeting.grade;
    if (initialChapter) return initialChapter.grade;
    return options?.grade ? Number(options.grade) : null;
  });
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(() => {
    if (initialMeeting) return initialMeeting.chapter;
    if (initialChapter) return initialChapter.chapter;
    return null;
  });
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(() => {
    if (initialMeeting) return initialMeeting.meeting;
    return null;
  });
  const [activeLmsMaterialId, setActiveLmsMaterialId] = useState<string | number | null>(() => options?.lmsMaterialId || null);

  const [completedMeetings, setCompletedMeetings] = useState<string[]>([]);
  const [completedChapters, setCompletedChapters] = useState<string[]>([]);

  // Load completion states from localStorage
  useEffect(() => {
    try {
      const savedMeetings = localStorage.getItem("mpi_completed_meetings");
      if (savedMeetings) setCompletedMeetings(JSON.parse(savedMeetings));

      const savedChapters = localStorage.getItem("mpi_completed_chapters");
      if (savedChapters) setCompletedChapters(JSON.parse(savedChapters));
    } catch (e) {
      console.error("Error reading MPI completed states:", e);
    }
  }, []);

  // Lock body scroll while modal is active
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Handle initialization based on incoming options
  useEffect(() => {
    if (!isOpen) return;

    const opt = options || {};
    setActiveLmsMaterialId(opt.lmsMaterialId || null);

    if (opt.meetingId) {
      const found = findMeetingInCurriculum(opt.meetingId);
      if (found) {
        setSelectedGrade(found.grade);
        setSelectedChapter(found.chapter);
        setSelectedMeeting(found.meeting);
        setView("lesson");
        return;
      }
    }

    if (opt.chapterId) {
      const found = findChapterInCurriculum(opt.chapterId, opt.grade);
      if (found) {
        setSelectedGrade(found.grade);
        setSelectedChapter(found.chapter);
        setSelectedMeeting(null);
        setView("chapter");
        return;
      }
    }

    if (opt.mode === "leaderboard") {
      setView("leaderboard");
      return;
    }

    if (opt.mode === "portfolio") {
      setView("portfolio");
      return;
    }

    // Default to explorer / home
    setView("home");
    setSelectedMeeting(null);
  }, [isOpen, options]);

  // ESC key support to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleCompleteMeeting = useCallback((meetingId: string) => {
    let nextMeetings = completedMeetings;
    if (!completedMeetings.includes(meetingId)) {
      nextMeetings = [...completedMeetings, meetingId];
      setCompletedMeetings(nextMeetings);
      try {
        localStorage.setItem("mpi_completed_meetings", JSON.stringify(nextMeetings));
        // If linked to an LMS material, mark LMS material complete as well
        if (activeLmsMaterialId) {
          localStorage.setItem(`lms_material_completed_${activeLmsMaterialId}`, "true");
        }
      } catch (e) {
        console.error("Failed to save completed meeting:", e);
      }

      // Notify parent LMS environment
      try {
        window.dispatchEvent(
          new CustomEvent("mpi_progress_updated", {
            detail: { meetingId, lmsMaterialId: activeLmsMaterialId }
          })
        );
      } catch (_) {}

      // Confirmation dialog
      Swal.fire({
        title: "Selamat! 🏆",
        text: `Kamu telah berhasil menyelesaikan "${selectedMeeting?.title || "Materi Belajar"}"! Tetap semangat belajar!`,
        icon: "success",
        confirmButtonColor: "#06b6d4",
        confirmButtonText: "Kembali ke Daftar Pertemuan",
      }).then(() => {
        if (selectedChapter) {
          const allMeetingIds = (selectedChapter?.meetings || []).map(m => m.id);
          const isChapterFinished = allMeetingIds.every(id => nextMeetings.includes(id));

          if (isChapterFinished && !completedChapters.includes(selectedChapter.id)) {
            const nextChapters = [...completedChapters, selectedChapter.id];
            setCompletedChapters(nextChapters);
            try {
              localStorage.setItem("mpi_completed_chapters", JSON.stringify(nextChapters));
            } catch (e) {
              console.error(e);
            }

            Swal.fire({
              title: "Luar Biasa! 🎓🏆",
              text: `Selamat! Kamu telah merampungkan seluruh materi di Bab: "${selectedChapter.title}". Petualanganmu semakin hebat!`,
              icon: "success",
              confirmButtonColor: "#8b5cf6",
              confirmButtonText: "Mantap!",
            });
          }
        }
        setView("chapter");
        setSelectedMeeting(null);
      });
    } else {
      setView("chapter");
      setSelectedMeeting(null);
    }
  }, [completedMeetings, completedChapters, activeLmsMaterialId, selectedMeeting, selectedChapter]);

  const handleSelectGradeChapter = (grade: number, chapter: Chapter) => {
    setIsMobileMenuOpen(false);
    setSelectedGrade(grade);
    setSelectedChapter(chapter);
    setView("chapter");
  };

  const handleSelectMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setView("lesson");
  };

  const handleNavigateHome = () => {
    setIsMobileMenuOpen(false);
    setView("home");
    setSelectedGrade(null);
    setSelectedChapter(null);
    setSelectedMeeting(null);
  };

  const handleNavigateBackToChapter = () => {
    setView("chapter");
    setSelectedMeeting(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#0f172a] text-slate-100 font-sans overflow-hidden">
      {/* Background Decorative Blur Spheres */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] bg-blue-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-[35%] -right-[10%] w-[35%] h-[35%] bg-purple-600/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[55%] h-[45%] bg-cyan-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="flex h-full w-full overflow-hidden relative z-10">
        {/* Mobile Menu Backdrop */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
            />
          )}
        </AnimatePresence>

        {/* SIDEBAR NAVIGATION */}
        <aside
          className={`h-full bg-[#0f172a]/95 backdrop-blur-xl border-r border-white/10 flex flex-col py-6 z-50 shrink-0 fixed lg:relative transition-all duration-300 ${
            isMobileMenuOpen
              ? "translate-x-0 w-72 px-5 opacity-100 shadow-2xl"
              : "-translate-x-full lg:translate-x-0 lg:w-72 lg:px-5 lg:opacity-100"
          }`}
        >
          {/* Brand Header */}
          <div
            onClick={handleNavigateHome}
            className="flex items-center gap-3 mb-8 cursor-pointer group px-1"
          >
            <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform border border-white/15">
              <Zap className="h-5 w-5 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300 block">
                MPI Informatika
              </span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase tracking-wider">
                SMP Negeri 58
              </span>
            </div>
          </div>

          {/* Sidebar Menu Items */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
            <div className="px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Menu Utama
            </div>

            <button
              type="button"
              onClick={handleNavigateHome}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all text-left ${
                view === "home"
                  ? "bg-white/10 border-white/20 text-cyan-400 shadow-md"
                  : "bg-transparent border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Home className="h-4 w-4 shrink-0" />
              <span className="font-bold text-xs">Beranda Wahana</span>
            </button>

            {/* Expandable Materi Saya */}
            <div>
              <button
                type="button"
                onClick={() => setIsMateriOpen(!isMateriOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all text-left ${
                  isMateriOpen
                    ? "bg-white/5 border-white/10 text-slate-200"
                    : "bg-transparent border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Compass className="h-4 w-4 shrink-0" />
                  <span className="font-bold text-xs">Katalog Materi</span>
                </div>
                {isMateriOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              <AnimatePresence>
                {isMateriOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-1 pl-3 border-l border-white/10 ml-3 space-y-1"
                  >
                    {curriculumData.map((gradeData) => (
                      <div key={gradeData.grade}>
                        <button
                          type="button"
                          onClick={() => setOpenGrade(openGrade === gradeData.grade ? null : gradeData.grade)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all text-left text-xs ${
                            openGrade === gradeData.grade
                              ? "text-cyan-400 font-bold"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <span>Kelas {gradeData.grade}</span>
                          {openGrade === gradeData.grade ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>

                        <AnimatePresence>
                          {openGrade === gradeData.grade && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden pl-2 border-l border-white/5 ml-2 space-y-1 my-1"
                            >
                              {gradeData.chapters.map((chapter) => {
                                const isActive =
                                  view === "chapter" &&
                                  selectedGrade === gradeData.grade &&
                                  selectedChapter?.id === chapter.id;
                                return (
                                  <button
                                    key={chapter.id}
                                    type="button"
                                    onClick={() => handleSelectGradeChapter(gradeData.grade, chapter)}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] transition-colors truncate block ${
                                      isActive
                                        ? "bg-cyan-500/20 text-cyan-300 font-bold"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                    }`}
                                  >
                                    {chapter.code} - {chapter.title}
                                  </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Leaderboard Button */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setView("leaderboard");
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all text-left ${
                view === "leaderboard"
                  ? "bg-white/10 border-white/20 text-amber-400 shadow-md"
                  : "bg-transparent border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Trophy className="h-4 w-4 shrink-0 text-amber-400" />
              <span className="font-bold text-xs">Leaderboard Global</span>
            </button>

            {/* Portfolio Button */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setView("portfolio");
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all text-left ${
                view === "portfolio"
                  ? "bg-white/10 border-white/20 text-pink-400 shadow-md"
                  : "bg-transparent border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <User className="h-4 w-4 shrink-0 text-pink-400" />
              <span className="font-bold text-xs">Tentang Pembuat</span>
            </button>
          </nav>

          {/* Bottom Close Button in Sidebar */}
          <div className="pt-4 border-t border-white/10 mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-bold transition cursor-pointer"
            >
              <X className="h-4 w-4" />
              <span>Tutup ke LMS</span>
            </button>
          </div>
        </aside>

        {/* MAIN DISPLAY AREA */}
        <div className="flex-1 h-full flex flex-col z-10 overflow-y-auto relative bg-transparent">
          {/* Header Navigation */}
          <Navigation
            currentGrade={selectedGrade || undefined}
            currentChapter={
              selectedChapter
                ? { id: selectedChapter.id, title: selectedChapter.title, code: selectedChapter.code }
                : undefined
            }
            currentMeeting={
              selectedMeeting
                ? { id: selectedMeeting.id, title: selectedMeeting.title, number: selectedMeeting.number }
                : undefined
            }
            onNavigateHome={handleNavigateHome}
            onNavigateBackToChapter={handleNavigateBackToChapter}
            onOpenLeaderboard={() => setView("leaderboard")}
            onCloseLms={onClose}
            onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />

          {/* Main Body */}
          <main className="relative pb-16 flex-1">
            <AnimatePresence mode="wait">
              {view === "home" && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <LandingPage
                    onSelectGradeChapter={handleSelectGradeChapter}
                    completedChapters={completedChapters}
                  />
                </motion.div>
              )}

              {view === "chapter" && selectedGrade && selectedChapter && (
                <motion.div
                  key="chapter"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChapterPage
                    grade={selectedGrade}
                    chapter={selectedChapter}
                    completedMeetings={completedMeetings}
                    onSelectMeeting={handleSelectMeeting}
                    onBackToHome={handleNavigateHome}
                  />
                </motion.div>
              )}

              {view === "lesson" && selectedGrade && selectedChapter && selectedMeeting && (
                <motion.div
                  key="lesson"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"
                >
                  {/* Top Bar for Lesson */}
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <button
                      id="back-to-chapter-btn"
                      type="button"
                      onClick={handleNavigateBackToChapter}
                      className="group flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                      <span>Kembali ke Bab {selectedChapter.code}</span>
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 text-xs font-bold transition"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Tutup ke LMS</span>
                    </button>
                  </div>

                  {/* Lesson Banner */}
                  <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-7 backdrop-blur-xl">
                    <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl -z-10" />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative">
                      <div className="space-y-1">
                        <div className="text-xs font-mono font-bold text-cyan-400 tracking-wider">
                          KELAS {selectedGrade} • BAB {selectedChapter.code} • PERTEMUAN 0{selectedMeeting.number}
                        </div>
                        <h1 className="text-xl font-extrabold text-white sm:text-2xl tracking-tight">
                          {selectedMeeting.title}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                          {selectedMeeting.description}
                        </p>
                      </div>

                      {completedMeetings.includes(selectedMeeting.id) && (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-400 border border-cyan-500/20 shadow-md">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Selesai Dipelajari</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Interactive Lesson Renderer */}
                  <ContentRenderer
                    selectedMeeting={selectedMeeting}
                    completedMeetings={completedMeetings}
                    handleCompleteMeeting={handleCompleteMeeting}
                  />
                </motion.div>
              )}

              {view === "leaderboard" && (
                <motion.div
                  key="leaderboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <Leaderboard onBack={handleNavigateHome} />
                </motion.div>
              )}

              {view === "portfolio" && (
                <motion.div
                  key="portfolio"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <Portfolio onBack={handleNavigateHome} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Footer */}
          <footer className="w-full py-5 text-center border-t border-white/10 mt-auto bg-slate-950/40 backdrop-blur-sm">
            <p className="text-xs font-medium text-slate-400">MPI Informatika Terintegrasi LMS SMPN 58</p>
            <p className="text-[11px] text-slate-500 mt-0.5">© 2026 A. Bermansyah. Hak Cipta Dilindungi.</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
