import { CheckCircle2, Clock, Star, Sparkles, Trash2, Copy, Check, Flame } from "lucide-react";
import { useState } from "react";
import type { Task } from "../db/schema";
import type { StreakData } from "../utils/streak";

interface TaskStatsProps {
  total: number;
  active: number;
  completed: number;
  starred: number;
  tasks?: Task[] | undefined;
  streakData?: StreakData | undefined;
  onClearCompleted?: (() => void) | undefined;
  isClearing?: boolean | undefined;
}

export function TaskStats({
  total,
  active,
  completed,
  starred,
  tasks = [],
  streakData,
  onClearCompleted,
  isClearing = false,
}: TaskStatsProps) {
  const [copied, setCopied] = useState(false);
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Feature 4: Copy Daily Standup / WhatsApp Export
  const handleCopySummary = async () => {
    const today = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const completedList = tasks
      .filter((t) => t.isCompleted)
      .map((t) => `• ${t.title}${t.category !== "Umum" ? ` #${t.category}` : ""}`)
      .join("\n");

    const activeList = tasks
      .filter((t) => !t.isCompleted)
      .map((t) => {
        const p = t.priority === "urgent" ? "[🔴 Urgent] " : t.priority === "high" ? "[🟠 Tinggi] " : "";
        return `• ${p}${t.title}${t.category !== "Umum" ? ` #${t.category}` : ""}`;
      })
      .join("\n");

    const summary = `📋 *Pangenget — Ringkasan Tugas* (${today})\n` +
      `🔥 *Status:* ${completed} dari ${total} tugas selesai (${percentage}%)\n\n` +
      `✅ *Selesai:*\n${completedList || "• (Belum ada yang selesai)"}\n\n` +
      `⏳ *Masih Berjalan:*\n${activeList || "• (Semua tugas sudah beres! 🎉)"}\n\n` +
      `💡 _Dicatat via Pangenget (Fokus, Kerjakan, Bereskan)_`;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-neutral-800/90 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow-xs space-y-4">
      {/* Top summary row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
            {percentage}%
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {percentage === 100 && total > 0
                  ? "Semua tugas beres! Kerja luar biasa 🎉"
                  : `${completed} dari ${total} tugas selesai`}
              </h4>
              {streakData && streakData.currentStreak > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Flame size={12} className="text-amber-500 fill-amber-500" />
                  <span>{streakData.currentStreak} Hari Beruntun</span>
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {active > 0 ? `${active} tugas masih menunggu dieksekusi` : "Belum ada tugas aktif"}
            </p>
          </div>
        </div>

        {/* Action Buttons: Copy Standup & Clear Completed */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {total > 0 && (
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100/80 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors press-scale"
              title="Salin rekap tugas hari ini untuk WhatsApp / Standup"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-500 stroke-[2.5]" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Salin Ringkasan</span>
                </>
              )}
            </button>
          )}

          {completed > 0 && onClearCompleted && (
            <button
              type="button"
              onClick={onClearCompleted}
              disabled={isClearing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-neutral-200 dark:border-neutral-800 transition-colors disabled:opacity-50 press-scale"
            >
              <Trash2 size={13} />
              <span>{isClearing ? "Membersihkan..." : "Bersihkan Selesai"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-neutral-100 dark:bg-neutral-800/90 h-2 rounded-full overflow-hidden">
        <div
          className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Quick stats pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
          <Sparkles size={14} className="text-neutral-400" />
          <span className="text-neutral-500 dark:text-neutral-400">Total:</span>
          <span className="font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{total}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
          <Clock size={14} className="text-sky-500" />
          <span className="text-neutral-500 dark:text-neutral-400">Aktif:</span>
          <span className="font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{active}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span className="text-neutral-500 dark:text-neutral-400">Selesai:</span>
          <span className="font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{completed}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
          <Star size={14} className="text-amber-500 fill-amber-500/20" />
          <span className="text-neutral-500 dark:text-neutral-400">Penting:</span>
          <span className="font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{starred}</span>
        </div>
      </div>
    </div>
  );
}
