import { useState, useEffect, useRef } from "react";
import type { Task, SubTask } from "../db/schema";
import { authFetch } from "../lib/auth";
import { playCompletionSound, playPopSound } from "../utils/audio";
import { fireTaskCompletionConfetti } from "../utils/confetti";
import { recordTaskCompletionForStreak } from "../utils/streak";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Clock,
  Tag,
  Check,
} from "lucide-react";

interface FocusWorkspaceProps {
  initialTasks: Task[];
  initialTaskId?: string | undefined;
}

export function FocusWorkspace({ initialTasks, initialTaskId }: FocusWorkspaceProps) {
  const activeTasks = initialTasks.filter((t) => !t.isCompleted);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    initialTaskId && activeTasks.some((t) => t.id === initialTaskId)
      ? initialTaskId
      : activeTasks[0]?.id || ""
  );

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const currentTask = tasks.find((t) => t.id === selectedTaskId);

  // Timer Modes: 25m (Pomodoro), 50m (Deep Work), Stopwatch
  const [timerMode, setTimerMode] = useState<"pomodoro" | "deep" | "stopwatch">("pomodoro");
  const defaultSeconds = timerMode === "pomodoro" ? 25 * 60 : timerMode === "deep" ? 50 * 60 : 0;
  const [timeLeft, setTimeLeft] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Switch Timer Mode
  const switchMode = (mode: "pomodoro" | "deep" | "stopwatch") => {
    setTimerMode(mode);
    setIsRunning(false);
    setHasFinished(false);
    setTimeLeft(mode === "pomodoro" ? 25 * 60 : mode === "deep" ? 50 * 60 : 0);
  };

  // Timer Tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (timerMode === "stopwatch") {
            return prev + 1;
          }
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            setHasFinished(true);
            playCompletionSound(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timerMode]);

  // Auth reload listener
  useEffect(() => {
    const handleAuthChange = async () => {
      try {
        const res = await authFetch("/api/tasks");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setTasks(data.data);
        }
      } catch (e) {
        console.error("Auth reload tasks error:", e);
      }
    };

    window.addEventListener("pangenget:auth_change", handleAuthChange);
    return () => window.removeEventListener("pangenget:auth_change", handleAuthChange);
  }, []);

  // Format Time string
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Handle Mark Task Completed
  const handleCompleteCurrentTask = async () => {
    if (!currentTask) return;

    playCompletionSound(true);
    fireTaskCompletionConfetti();
    recordTaskCompletionForStreak();

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === currentTask.id ? { ...t, isCompleted: true } : t))
    );

    try {
      await authFetch(`/api/tasks/${currentTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: true }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Subtask
  const handleToggleSubtask = async (subtaskId: string) => {
    if (!currentTask) return;
    const subtasks: SubTask[] = Array.isArray(currentTask.subtasks) ? currentTask.subtasks : [];
    const updated = subtasks.map((s) =>
      s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
    );

    setTasks((prev) =>
      prev.map((t) => (t.id === currentTask.id ? { ...t, subtasks: updated } : t))
    );

    try {
      await authFetch(`/api/tasks/${currentTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtasks: updated }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-fade-in">
      {/* Top Navigation Back link */}
      <div className="flex items-center justify-between">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors press-scale"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Hari Ini</span>
        </a>

        {/* Task Switcher Dropdown */}
        {activeTasks.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400">Pilih Tugas:</span>
            <select
              value={selectedTaskId}
              onChange={(e) => {
                setSelectedTaskId(e.target.value);
                playPopSound(true);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {activeTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title.slice(0, 32)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Focus Card */}
      <div className="p-8 sm:p-12 rounded-3xl border border-neutral-200/90 dark:border-neutral-800/90 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl shadow-xl text-center space-y-8 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {currentTask ? (
          <>
            {/* Task Meta & Heading */}
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Sparkles size={12} className="text-emerald-500" />
                  <span>Sedang Dikerjakan</span>
                </span>
                {currentTask.category && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    <Tag size={11} />
                    <span>{currentTask.category}</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-neutral-900 dark:text-white tracking-tight leading-snug">
                {currentTask.title}
              </h1>

              {currentTask.description && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto leading-relaxed">
                  {currentTask.description}
                </p>
              )}
            </div>

            {/* Timer Display */}
            <div className="space-y-4">
              {/* Timer Mode Pills */}
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => switchMode("pomodoro")}
                  className={`px-3 py-1.5 rounded-lg transition-all press-scale ${
                    timerMode === "pomodoro"
                      ? "bg-white dark:bg-neutral-900 font-bold shadow-xs text-neutral-900 dark:text-white"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  Pomodoro (25m)
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("deep")}
                  className={`px-3 py-1.5 rounded-lg transition-all press-scale ${
                    timerMode === "deep"
                      ? "bg-white dark:bg-neutral-900 font-bold shadow-xs text-neutral-900 dark:text-white"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  Deep Work (50m)
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("stopwatch")}
                  className={`px-3 py-1.5 rounded-lg transition-all press-scale ${
                    timerMode === "stopwatch"
                      ? "bg-white dark:bg-neutral-900 font-bold shadow-xs text-neutral-900 dark:text-white"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  Stopwatch
                </button>
              </div>

              {/* Big Timer Digits */}
              <div className="font-mono text-6xl sm:text-7xl md:text-8xl font-black text-neutral-900 dark:text-white tracking-tighter tabular-nums select-none">
                {formatTime(timeLeft)}
              </div>

              {/* Finished Celebration Banner */}
              {hasFinished && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold animate-pulse">
                  🎉 Waktu sesi fokus habis! Kerja hebat. Ambil istirahat sejenak atau tandai tugas telah selesai di bawah.
                </div>
              )}

              {/* Play / Pause / Reset Controls */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRunning(!isRunning)}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all press-scale ${
                    isRunning
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {isRunning ? <Pause size={18} /> : <Play size={18} className="fill-white" />}
                  <span>{isRunning ? "Jeda" : "Mulai Fokus"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsRunning(false);
                    setTimeLeft(defaultSeconds);
                    setHasFinished(false);
                  }}
                  className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors press-scale"
                  title="Reset Timer"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>

            {/* Subtasks checklist inside focus view */}
            {Array.isArray(currentTask.subtasks) && currentTask.subtasks.length > 0 && (
              <div className="max-w-md mx-auto pt-6 border-t border-neutral-100 dark:border-neutral-800 text-left space-y-2">
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Rincian Langkah Tugas
                </h4>
                <div className="space-y-1.5">
                  {currentTask.subtasks.map((sub) => (
                    <label
                      key={sub.id}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer text-xs sm:text-sm transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={sub.isCompleted}
                        onChange={() => handleToggleSubtask(sub.id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-neutral-300 dark:border-neutral-600"
                      />
                      <span
                        className={
                          sub.isCompleted
                            ? "line-through text-neutral-400 dark:text-neutral-500"
                            : "text-neutral-800 dark:text-neutral-200"
                        }
                      >
                        {sub.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Big Complete Button */}
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={handleCompleteCurrentTask}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-all press-scale shadow-sm"
              >
                <Check size={16} className="stroke-[3]" />
                <span>Tandai Tugas Ini Selesai ↵</span>
              </button>
            </div>
          </>
        ) : (
          <div className="py-12 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Tidak Ada Tugas Aktif untuk Difokuskan
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Semua tugas sudah beres! Silakan tambahkan tugas baru di halaman Hari Ini.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors press-scale"
            >
              <Clock size={14} />
              <span>Kembali ke Hari Ini</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
