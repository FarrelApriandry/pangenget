import { useState, useEffect, useRef, useMemo } from "react";
import type { Task } from "../db/schema";
import { authFetch } from "../lib/auth";
import { TaskItem } from "./TaskItem";
import { TaskFilter, type FilterStatus } from "./TaskFilter";
import { TaskStats } from "./TaskStats";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { playCompletionSound, playPopSound } from "../utils/audio";
import { parseNaturalLanguageTask, type ParsedTaskInput } from "../utils/nlpParser";
import { fireTaskCompletionConfetti } from "../utils/confetti";
import { getStreakData, recordTaskCompletionForStreak, type StreakData } from "../utils/streak";
import {
  Plus,
  Loader2,
  Sparkles,
  Volume2,
  VolumeX,
  Keyboard,
  RotateCcw,
  CheckCircle2,
  ListOrdered,
  AlertTriangle,
  Mic,
  MicOff,
  Zap,
} from "lucide-react";

interface TaskManagerProps {
  initialTasks?: Task[];
}

export function TaskManager({ initialTasks = [] }: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"default" | "priority" | "dueDate" | "title">("default");

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [newCategory, setNewCategory] = useState("Umum");
  const [newDueDate, setNewDueDate] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Feature 6: Voice Input State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Settings & Utilities
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [undoTask, setUndoTask] = useState<Task | null>(null);
  const [streakData, setStreakData] = useState<StreakData | undefined>(undefined);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load sound setting & streak preference from localStorage
  useEffect(() => {
    const savedSound = localStorage.getItem("pangenget_sound");
    if (savedSound !== null) {
      setSoundEnabled(savedSound === "true");
    }
    setStreakData(getStreakData());

    // Check Speech Recognition support
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
      }
    }
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("pangenget_sound", String(next));
    if (next) playPopSound(true);
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement;

      if (e.key === "Escape") {
        if (showShortcuts) {
          setShowShortcuts(false);
        } else if (isInput) {
          (activeEl as HTMLElement).blur();
        } else if (isExpanded) {
          setIsExpanded(false);
        }
        return;
      }

      if (isInput) return;

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        titleInputRef.current?.focus();
      } else if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "1") {
        e.preventDefault();
        setFilterStatus("all");
      } else if (e.key === "2") {
        e.preventDefault();
        setFilterStatus("active");
      } else if (e.key === "3") {
        e.preventDefault();
        setFilterStatus("completed");
      } else if (e.key === "4") {
        e.preventDefault();
        setFilterStatus("starred");
      } else if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showShortcuts, isExpanded]);

  // Multi-tenant Auth Listener: reload tasks whenever user logs in or out
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

  // Feature 1: Realtime NLP Parser
  const parsedNLP: ParsedTaskInput = useMemo(() => {
    return parseNaturalLanguageTask(newTitle);
  }, [newTitle]);

  // Feature 6: Voice Input Handler
  const toggleVoiceInput = () => {
    if (!speechSupported) {
      alert("Browser Anda belum mendukung Web Speech API.");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "id-ID";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        playPopSound(soundEnabled);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setNewTitle(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.category && t.category.trim()) {
        set.add(t.category.trim());
      }
    });
    return ["all", ...Array.from(set)];
  }, [tasks]);

  // Compute counts
  const counts = useMemo(() => {
    return {
      all: tasks.length,
      active: tasks.filter((t) => !t.isCompleted).length,
      completed: tasks.filter((t) => t.isCompleted).length,
      starred: tasks.filter((t) => t.isPinned).length,
    };
  }, [tasks]);

  // Filtered and Sorted Tasks
  const displayedTasks = useMemo(() => {
    let result = [...tasks];

    // Status Filter
    if (filterStatus === "active") {
      result = result.filter((t) => !t.isCompleted);
    } else if (filterStatus === "completed") {
      result = result.filter((t) => t.isCompleted);
    } else if (filterStatus === "starred") {
      result = result.filter((t) => t.isPinned);
    }

    // Category Filter
    if (selectedCategory !== "all") {
      result = result.filter((t) => t.category === selectedCategory);
    }

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q))
      );
    }

    // Sorting
    const priorityWeight: Record<string, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    result.sort((a, b) => {
      if (sortBy === "default") {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        const prioDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        if (prioDiff !== 0) return prioDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      if (sortBy === "priority") {
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      }

      if (sortBy === "dueDate") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }

      return 0;
    });

    return result;
  }, [tasks, filterStatus, selectedCategory, searchQuery, sortBy]);

  // Create Task with NLP extraction
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    // Apply NLP overrides if detected
    const finalTitle = parsedNLP.cleanTitle || newTitle.trim();
    const finalPriority = parsedNLP.priority || newPriority;
    const finalCategory = parsedNLP.category || newCategory.trim() || "Umum";
    const finalDueDate = parsedNLP.dueDate || (newDueDate ? new Date(newDueDate) : null);

    const payload = {
      title: finalTitle,
      description: newDescription.trim() || null,
      priority: finalPriority,
      category: finalCategory,
      dueDate: finalDueDate,
      isPinned: false,
      subtasks: [],
    };

    // Optimistic item
    const tempId = "temp-" + Date.now();
    const optimisticTask: Task = {
      id: tempId,
      userId: null,
      ...payload,
      isCompleted: false,
      completedAt: null,
      telegramReminded24h: false,
      telegramReminded1h: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTasks((prev) => [optimisticTask, ...prev]);
    setNewTitle("");
    setNewDescription("");
    setNewDueDate("");
    setIsExpanded(false);

    try {
      const res = await authFetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat tugas.");
      }

      setTasks((prev) => prev.map((t) => (t.id === tempId ? data.data : t)));
      playPopSound(soundEnabled);
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat menambahkan tugas.");
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Completion (Optimistic with Streak & Confetti)
  const handleToggleComplete = async (id: string, current: boolean) => {
    const next = !current;
    if (next) {
      playCompletionSound(soundEnabled);

      // Feature 5: Update streak
      const updatedStreak = recordTaskCompletionForStreak();
      setStreakData(updatedStreak);

      // Feature 5: Check if all tasks are now done -> fire Confetti!
      const remainingActive = tasks.filter((t) => t.id !== id && !t.isCompleted).length;
      if (remainingActive === 0 && tasks.length > 0) {
        fireTaskCompletionConfetti();
      }
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, isCompleted: next, completedAt: next ? new Date() : null }
          : t
      )
    );

    try {
      const res = await authFetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: next }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui status tugas.");
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, isCompleted: current } : t
        )
      );
    }
  };

  // Toggle Pin (Optimistic)
  const handleTogglePin = async (id: string, current: boolean) => {
    const next = !current;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPinned: next } : t))
    );

    try {
      const res = await authFetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: next }),
      });
      if (!res.ok) throw new Error("Gagal menyematkan tugas.");
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isPinned: current } : t))
      );
    }
  };

  // Delete Task with Undo Option
  const handleDeleteTask = async (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    setUndoTask(target);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setUndoTask(null);
    }, 5000);

    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      const res = await authFetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus tugas.");
    } catch (err) {
      setTasks((prev) => [target, ...prev]);
      setUndoTask(null);
    }
  };

  // Undo Delete
  const handleUndoDelete = async () => {
    if (!undoTask) return;
    const taskToRestore = undoTask;
    setUndoTask(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    setTasks((prev) => [taskToRestore, ...prev]);

    try {
      await authFetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskToRestore.title,
          description: taskToRestore.description,
          priority: taskToRestore.priority,
          category: taskToRestore.category,
          dueDate: taskToRestore.dueDate,
          isPinned: taskToRestore.isPinned,
          subtasks: taskToRestore.subtasks || [],
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Update Task (including subtasks)
  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );

    try {
      const res = await authFetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Gagal memperbarui data tugas.");
      const data = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? data.data : t)));
    } catch (err) {
      console.error(err);
    }
  };

  // Clear Completed Tasks
  const handleClearCompleted = async () => {
    if (counts.completed === 0) return;
    if (!window.confirm(`Hapus semua ${counts.completed} tugas yang sudah selesai?`)) return;

    setIsClearing(true);
    const prevTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => !t.isCompleted));

    try {
      const res = await authFetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_completed" }),
      });
      if (!res.ok) throw new Error("Gagal membersihkan tugas selesai.");
    } catch (err) {
      setTasks(prevTasks);
      alert("Gagal membersihkan tugas selesai.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar: Quick Utilities, Sound Toggle, Manual Celebration */}
      <div className="flex items-center justify-between text-xs text-[#656d4a] dark:text-[#a4ac86]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#e8ecde] dark:bg-[#20261b] text-[#333d29] dark:text-[#f5f7f1] font-medium border border-[#d3dbc3] dark:border-[#333d29]">
            <Sparkles size={12} className="text-[#656d4a] dark:text-[#a4ac86]" />
            <span>Pangenget List</span>
          </span>
          <span className="hidden sm:inline text-[#414833]/70 dark:text-[#d3dbc3]/70">
            Ketik <kbd className="font-mono bg-[#e8ecde]/60 dark:bg-[#20261b] px-1 py-0.5 rounded border border-[#d3dbc3] dark:border-[#333d29]">!urgent</kbd> atau <kbd className="font-mono bg-[#e8ecde]/60 dark:bg-[#20261b] px-1 py-0.5 rounded border border-[#d3dbc3] dark:border-[#333d29]">#proyek</kbd>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundEnabled ? "Nonaktifkan suara" : "Aktifkan suara"}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#d5dcce] dark:border-[#333d29] hover:bg-[#e8ecde]/50 dark:hover:bg-[#20261b] text-[#333d29] dark:text-[#f5f7f1] transition-colors press-scale"
            title={soundEnabled ? "Suara aktif (klik untuk membisukan)" : "Suara nonaktif"}
          >
            {soundEnabled ? (
              <>
                <Volume2 size={13} className="text-[#656d4a] dark:text-[#a4ac86]" />
                <span className="hidden sm:inline">Suara: Nyala</span>
              </>
            ) : (
              <>
                <VolumeX size={13} className="text-[#414833]/60 dark:text-[#a4ac86]/60" />
                <span className="hidden sm:inline">Suara: Bisu</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowShortcuts(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#d5dcce] dark:border-[#333d29] hover:bg-[#e8ecde]/50 dark:hover:bg-[#20261b] text-[#333d29] dark:text-[#f5f7f1] transition-colors press-scale"
            title="Daftar Pintasan Keyboard (?)"
          >
            <Keyboard size={13} />
            <span className="hidden sm:inline">Shortcut</span>
          </button>
        </div>
      </div>

      {/* Progress, Stats Card & Daily Standup Export */}
      <TaskStats
        total={counts.all}
        active={counts.active}
        completed={counts.completed}
        starred={counts.starred}
        tasks={tasks}
        streakData={streakData}
        onClearCompleted={handleClearCompleted}
        isClearing={isClearing}
      />

      {/* Quick Add Task Input Card with NLP & Voice Input */}
      <div className="p-4 sm:p-5 rounded-2xl border border-[#d5dcce] dark:border-[#333d29] bg-white dark:bg-[#20261b] shadow-xs transition-all focus-within:border-[#656d4a] dark:focus-within:border-[#a4ac86]">
        {errorMessage && (
          <div className="mb-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleCreateTask} className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              ref={titleInputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder="Tambahkan tugas... Contoh: Rapat tim besok jam 10 !urgent #kerja"
              className="flex-1 text-sm sm:text-base bg-transparent text-[#333d29] dark:text-[#f5f7f1] placeholder-[#414833]/50 dark:placeholder-[#a4ac86]/50 focus:outline-none"
            />

            {/* Feature 6: Voice Input Button */}
            {speechSupported && (
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2 rounded-xl transition-all press-scale ${
                  isListening
                    ? "bg-rose-500 text-white animate-pulse shadow-md"
                    : "text-[#656d4a] hover:text-[#333d29] dark:text-[#a4ac86] dark:hover:text-white hover:bg-[#e8ecde]/60 dark:hover:bg-[#293121]"
                }`}
                title={isListening ? "Sedang mendengarkan... (klik untuk berhenti)" : "Bicara untuk mendikte tugas"}
              >
                {isListening ? <Mic size={16} /> : <MicOff size={16} />}
              </button>
            )}

            <button
              type="submit"
              disabled={!newTitle.trim() || isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#333d29] hover:bg-[#414833] active:bg-[#293121] text-[#f5f7f1] disabled:opacity-40 disabled:pointer-events-none transition-all shadow-xs press-scale shrink-0 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Plus size={15} />
              )}
              <span>Tambah</span>
            </button>
          </div>

          {/* Feature 6: Listening banner */}
          {isListening && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-300 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span>Mendengarkan ucapan Anda dalam Bahasa Indonesia...</span>
            </div>
          )}

          {/* Feature 1: Live NLP Token Chips */}
          {parsedNLP.detectedTokens.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs animate-fade-in">
              <span className="text-[11px] text-[#414833]/70 dark:text-[#a4ac86] flex items-center gap-1">
                <Zap size={11} className="text-amber-500" />
                Terdeteksi:
              </span>
              {parsedNLP.detectedTokens.map((tok, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                    tok.type === "priority"
                      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900"
                      : tok.type === "category"
                      ? "bg-[#e8ecde] text-[#656d4a] dark:bg-[#293121] dark:text-[#d3dbc3] border-[#d3dbc3] dark:border-[#333d29]"
                      : "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-900"
                  }`}
                >
                  {tok.label}
                </span>
              ))}
            </div>
          )}

          {/* Expandable Options (Priority, Category, Due Date, Notes) */}
          {isExpanded && (
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3 animate-fade-in text-xs">
              <div>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Tambahkan catatan atau rincian tugas (opsional)..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800/40 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Priority Selection */}
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                    Prioritas {parsedNLP.priority && "(ditimpa oleh teks)"}
                  </label>
                  <select
                    value={parsedNLP.priority || newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  >
                    <option value="urgent">🔴 Urgent (!urgent)</option>
                    <option value="high">🟠 Tinggi (!tinggi)</option>
                    <option value="medium">🔵 Sedang (!sedang)</option>
                    <option value="low">⚪ Rendah (!rendah)</option>
                  </select>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                    Kategori {parsedNLP.category && "(ditimpa oleh teks)"}
                  </label>
                  <input
                    type="text"
                    value={parsedNLP.category || newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Contoh: Kerja (#kerja)"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                    Tenggat Waktu {parsedNLP.dueDate && "(ditimpa oleh teks)"}
                  </label>
                  <input
                    type="date"
                    value={
                      parsedNLP.dueDate
                        ? parsedNLP.dueDate.toISOString().slice(0, 10)
                        : newDueDate
                    }
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 text-[11px] text-neutral-400">
                <span>Tekan <kbd className="font-mono px-1 py-0.5 rounded border border-neutral-300 dark:border-neutral-700">Enter ↵</kbd> untuk simpan</span>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="hover:underline text-neutral-500"
                >
                  Sembunyikan opsi
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Filter and Search Bar */}
      <TaskFilter
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        counts={counts}
        searchInputRef={searchInputRef}
      />

      {/* Sort selection bar */}
      <div className="flex items-center justify-between px-1 text-xs text-neutral-500 dark:text-neutral-400">
        <span>Menampilkan {displayedTasks.length} tugas</span>
        <div className="flex items-center gap-1.5">
          <ListOrdered size={13} />
          <span>Urutkan:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent border-0 text-neutral-800 dark:text-neutral-200 font-medium focus:outline-none cursor-pointer"
          >
            <option value="default">Default (Penting &amp; Status)</option>
            <option value="priority">Prioritas Tertinggi</option>
            <option value="dueDate">Tenggat Terdekat</option>
            <option value="title">Alfabetis (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Task List Items */}
      <div className="space-y-2.5">
        {displayedTasks.length === 0 ? (
          <div className="py-16 px-4 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl bg-white/40 dark:bg-neutral-900/30">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm sm:text-base">
              {searchQuery
                ? "Tidak ada tugas yang cocok dengan pencarian."
                : filterStatus === "completed"
                ? "Belum ada tugas yang selesai."
                : filterStatus === "starred"
                ? "Belum ada tugas berbintang."
                : "Semua tugas beres atau daftar masih kosong!"}
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? "Coba gunakan kata kunci lain atau bersihkan kotak pencarian."
                : "Mulai hari ini dengan menambahkan tugas pertama di atas atau tekan tombol 'N'."}
            </p>
          </div>
        ) : (
          displayedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={handleToggleComplete}
              onTogglePin={handleTogglePin}
              onDelete={handleDeleteTask}
              onUpdate={handleUpdateTask}
            />
          ))
        )}
      </div>

      {/* Undo Toast Notification (Floats at bottom center) */}
      {undoTask && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xl border border-neutral-700 dark:border-neutral-200 text-xs sm:text-sm animate-entrance">
          <span>Tugas "{undoTask.title.slice(0, 24)}..." dihapus.</span>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="inline-flex items-center gap-1 font-bold text-emerald-400 dark:text-emerald-600 hover:underline press-scale"
          >
            <RotateCcw size={13} />
            <span>Batalkan (Undo)</span>
          </button>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}
