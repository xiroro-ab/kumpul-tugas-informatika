import React from "react";
import { motion } from "motion/react";
import { ArrowLeft, BookOpen, Clock, PlayCircle, CheckCircle, Award } from "lucide-react";
import { Chapter, Meeting } from "../../../data/curriculum";

interface ChapterPageProps {
  grade: number;
  chapter: Chapter;
  completedMeetings: string[]; // list of completed meeting IDs
  onSelectMeeting: (meeting: Meeting) => void;
  onBackToHome: () => void;
}

export default function ChapterPage({
  grade,
  chapter,
  completedMeetings,
  onSelectMeeting,
  onBackToHome,
}: ChapterPageProps) {
  // Stagger animation variants for meetings list
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <div className="min-h-screen px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        
        {/* Back Button */}
        <button
          id="back-to-home-btn"
          onClick={onBackToHome}
          className="group mb-8 flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Kembali ke Beranda</span>
        </button>

        {/* Chapter Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-10 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl"
        >
          {/* Subtle Accent Glow */}
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl -z-10" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-cyan-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-cyan-300 border border-cyan-500/20">
                  KELAS {grade}
                </span>
                <span className="rounded bg-purple-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-purple-300 border border-purple-500/20">
                  BAB {chapter.code}
                </span>
              </div>
              
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {chapter.title}
              </h1>
              
              <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
                {chapter.description}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <Award className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-xs font-mono text-slate-500 font-bold">KEMAJUAN BELAJAR</p>
                <p className="text-sm font-extrabold text-slate-200">
                  {completedMeetings.filter(id => chapter.meetings.some(m => m.id === id)).length} / {chapter.meetings.length} Selesai
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Meetings Timeline */}
        <div className="space-y-6">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-300">
            Daftar Pertemuan Pembelajaran
          </h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="relative border-l border-white/10 pl-6 space-y-8"
          >
            {chapter.meetings.map((meeting: Meeting, index: number) => {
              const isCompleted = completedMeetings.includes(meeting.id);
              return (
                <motion.div
                  key={meeting.id}
                  id={`meeting-card-${meeting.id}`}
                  variants={itemVariants}
                  onClick={() => onSelectMeeting(meeting)}
                  className="group relative cursor-pointer"
                >
                  {/* Timeline bullet */}
                  <span className={`absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isCompleted 
                      ? "border-cyan-400 bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]" 
                      : "border-slate-700 bg-slate-900 group-hover:border-cyan-400"
                  }`} />

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:bg-white/10 hover:border-white/20">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                            {!meeting.id.includes('evaluasi') ? `PERTEMUAN 0${meeting.number}` : 'EVALUASI'}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                            <Clock className="h-3 w-3" />
                            {meeting.duration}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-100 transition-colors group-hover:text-cyan-400">
                          {meeting.title}
                        </h3>

                        <p className="text-sm text-slate-400 leading-relaxed">
                          {meeting.description}
                        </p>

                        <div className="mt-4 border-l-2 border-cyan-500/40 pl-3">
                          <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Tujuan Belajar:</p>
                          <p className="text-xs text-slate-300 italic mt-0.5 font-medium">{meeting.objective}</p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center justify-end">
                        {isCompleted ? (
                          <div className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3.5 py-1 text-xs font-bold text-cyan-400 border border-cyan-500/20">
                            <CheckCircle className="h-4 w-4" />
                            <span>Selesai</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-white border border-white/10 transition-colors group-hover:bg-white/20">
                            <PlayCircle className="h-4 w-4 text-cyan-400" />
                            <span>Mulai Belajar</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Keywords tags */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {meeting.keywords.map((word) => (
                        <span
                          key={word}
                          className="rounded-lg bg-slate-950/60 border border-white/5 px-2.5 py-0.5 text-[10px] font-mono text-slate-500 font-semibold"
                        >
                          #{word}
                        </span>
                      ))}
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

      </div>
    </div>
  );
}
