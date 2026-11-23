import { useState, useEffect } from "react";
import type { Task } from "../db/schema";
import { authFetch } from "../lib/auth";
import { TaskItem } from "./TaskItem";
import { Archive, Trash2, Copy, Check, Flame, Sparkles } from "lucide-react";
import { getStreakData } from "../utils/streak";

interface HistoryWorkspaceProps {
  initialTasks: Task[];
}

export function HistoryWorkspace({ initialTasks }: HistoryWorkspaceProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [copied, setCopied] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

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

  const completedTasks = tasks.filter((t) => t.isCompleted);
  const streak = getStreakData();

  // Copy Standup Summary
  const handleCopyStandup = async () => {
    const today = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const completedList = completedTasks
      .map((t) => `• ${t.title}${t.category !== "Umum" ? ` #${t.category}` : ""}`)
      .join("\n");

    const activeList = tasks
      .filter((t) => !t.isCompleted)
      .map((t) => `• ${t.title}${t.category !== "Umum" ? ` #${t.category}` : ""}`)
      .join("\n");

    const text =
      `📋 *Pangenget — Ringkasan Harian* (${today})\n` +
      `🔥 *Streak Produktif:* ${streak.currentStreak} Hari Beruntun\n\n` +
      `✅ *Selesai Dikerjakan:*\n${completedList || "• (Belum ada tugas selesai)"}\n\n` +
      `⏳ *Tugas Masih Berjalan:*\n${activeList || "• (Semua tugas sudah beres! 🎉)"}\n\n` +
      `💡 _Dicatat via Pangenget (Fokus, Kerjakan, Bereskan)_`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Ignore
    }
  };

  // Clear all completed tasks
  const handleClearCompleted = async () => {
    if (completedTasks.length === 0) return;
    if (!window.confirm(`Hapus permanen ${completedTasks.length} tugas yang sudah selesai?`)) return;

    setIsClearing(true);
    setTasks((prev) => prev.filter((t) => !t.isCompleted));

    try {
      await authFetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_completed" }),
      });
    } catch {
      // Revert if error
      setTasks(initialTasks);
    } finally {
      setIsClearing(false);
    }
  };

  // Restore/uncheck task
  const handleRestoreTask = async (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isCompleted: false, completedAt: null } : t))
    );

    await authFetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: false }),
    });
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await authFetch(`/api/tasks/${id}`, { method: "DELETE" });
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    await authFetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
            <Archive size={13} className="text-emerald-500" />
            <span>Log Pencapaian &amp; Arsip</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            Riwayat Tugas Selesai
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
          Arsip tugas yang telah tuntas. Tinjau apa saja yang sudah Anda capai atau ekspor ringkasan untuk tim.
        </p>
      </div>

      {/* Summary Action Card */}
      <div className="p-5 rounded-2xl border border-neutral-200/90 dark:border-neutral-800/90 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold border border-amber-500/20">
            <Flame size={20} className="fill-amber-500" />
          </div>
          <div>
            <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {streak.currentStreak} Hari Beruntun Produktif!
            </div>
            <div className="text-xs text-neutral-500">
              Total {completedTasks.length} tugas telah berhasil diselesaikan.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCopyStandup}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white transition-colors press-scale"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-500 stroke-[3]" />
                <span className="text-emerald-600 dark:text-emerald-400">Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Salin Standup</span>
              </>
            )}
          </button>

          {completedTasks.length > 0 && (
            <button
              type="button"
              onClick={handleClearCompleted}
              disabled={isClearing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-300 transition-colors press-scale disabled:opacity-50"
            >
              <Trash2 size={14} />
              <span>{isClearing ? "Membersihkan..." : "Bersihkan Semua"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Completed Tasks List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
          <span>Daftar Arsip ({completedTasks.length})</span>
          <span className="text-[11px] text-neutral-400">Klik centang untuk mengembalikan ke Hari Ini</span>
        </div>

        {completedTasks.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl bg-white/40 dark:bg-neutral-900/40">
            <Sparkles size={28} className="text-neutral-400 mx-auto mb-2" />
            <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Belum Ada Tugas yang Diarsipkan
            </h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Selesaikan tugas di halaman Hari Ini untuk melihat catatan pencapaian Anda di sini!
            </p>
          </div>
        ) : (
          completedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={() => handleRestoreTask(task.id)}
              onTogglePin={() => {}}
              onDelete={handleDeleteTask}
              onUpdate={handleUpdateTask}
            />
          ))
        )}
      </div>
    </div>
  );
}
