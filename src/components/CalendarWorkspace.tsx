import { useState, useEffect, useMemo } from "react";
import type { Task } from "../db/schema";
import { authFetch } from "../lib/auth";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Trash2,
  Star,
  Loader2,
} from "lucide-react";
import { playCompletionSound, playPopSound } from "../utils/audio";

interface CalendarWorkspaceProps {
  initialTasks: Task[];
  initialCategories?: string[];
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function CalendarWorkspace({
  initialTasks = [],
  initialCategories = [],
}: CalendarWorkspaceProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("all");

  // Quick Add Task Form in Selected Date
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [newCategory, setNewCategory] = useState("Semua Tugas");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync tasks on auth change
  useEffect(() => {
    const handleAuthChange = async () => {
      try {
        const res = await authFetch("/api/tasks");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTasks(json.data);
        }

        const resCat = await authFetch("/api/categories");
        const jsonCat = await resCat.json();
        if (jsonCat.success && Array.isArray(jsonCat.data)) {
          setCategories(jsonCat.data.map((c: any) => c.name));
        }
      } catch (err) {
        console.error("Auth sync error:", err);
      }
    };

    const handleCategoryChange = async () => {
      try {
        const resCat = await authFetch("/api/categories");
        const jsonCat = await resCat.json();
        if (jsonCat.success && Array.isArray(jsonCat.data)) {
          setCategories(jsonCat.data.map((c: any) => c.name));
        }
      } catch (err) {
        console.error("Category sync error:", err);
      }
    };

    window.addEventListener("pangenget:auth_change", handleAuthChange);
    window.addEventListener("pangenget:category_change", handleCategoryChange);
    return () => {
      window.removeEventListener("pangenget:auth_change", handleAuthChange);
      window.removeEventListener("pangenget:category_change", handleCategoryChange);
    };
  }, []);

  // Filter tasks based on selected category & status
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedCategory !== "all" && t.category !== selectedCategory) {
        return false;
      }
      if (filterStatus === "active" && t.isCompleted) {
        return false;
      }
      if (filterStatus === "completed" && !t.isCompleted) {
        return false;
      }
      return true;
    });
  }, [tasks, selectedCategory, filterStatus]);

  // Map tasks by DateKey (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    filteredTasks.forEach((task) => {
      if (task.dueDate) {
        const key = toDateKey(new Date(task.dueDate));
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(task);
      }
    });
    return map;
  }, [filteredTasks]);

  // Tasks for the selected date
  const selectedDateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);
  const tasksForSelectedDate = useMemo(() => {
    return tasksByDate.get(selectedDateKey) || [];
  }, [tasksByDate, selectedDateKey]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const handleGoToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Generate Month Grid Days (Monday start)
  const calendarCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // In JS: 0=Sun, 1=Mon, ..., 6=Sat.
    // Convert to Monday start: 0=Mon, ..., 6=Sun
    let startDayOffset = firstDayOfMonth.getDay() - 1;
    if (startDayOffset < 0) startDayOffset = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const cells: {
      date: Date;
      isCurrentMonth: boolean;
      dateKey: string;
    }[] = [];

    // Prepend trailing days from previous month
    for (let i = startDayOffset - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      cells.push({
        date: d,
        isCurrentMonth: false,
        dateKey: toDateKey(d),
      });
    }

    // Days in current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      cells.push({
        date: d,
        isCurrentMonth: true,
        dateKey: toDateKey(d),
      });
    }

    // Append leading days for next month to complete rows of 7
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      cells.push({
        date: d,
        isCurrentMonth: false,
        dateKey: toDateKey(d),
      });
    }

    return cells;
  }, [currentDate]);

  // Week View Days (Monday - Sunday of selectedDate)
  const weekDays = useMemo(() => {
    const base = new Date(selectedDate);
    let day = base.getDay() - 1;
    if (day < 0) day = 6;

    const startOfWeek = new Date(base);
    startOfWeek.setDate(base.getDate() - day);

    const days: { date: Date; dateKey: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push({
        date: d,
        dateKey: toDateKey(d),
      });
    }
    return days;
  }, [selectedDate]);

  // Toggle Task Completion
  const handleToggleComplete = async (id: string, current: boolean) => {
    const next = !current;
    if (next) playCompletionSound(true);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, isCompleted: next, completedAt: next ? new Date() : null }
          : t
      )
    );

    try {
      await authFetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: next }),
      });
    } catch (err) {
      console.error("Gagal toggle status:", err);
    }
  };

  // Toggle Pin Task
  const handleTogglePin = async (id: string, current: boolean) => {
    const next = !current;
    playPopSound(true);

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPinned: next } : t))
    );

    try {
      await authFetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: next }),
      });
    } catch (err) {
      console.error("Gagal toggle pin:", err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: string) => {
    if (!confirm("Hapus tugas ini?")) return;
    playPopSound(true);

    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await authFetch(`/api/tasks/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Gagal menghapus tugas:", err);
    }
  };

  // Quick Add Task for the Selected Date
  const handleCreateTaskForDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    // Set due date to 23:59:59 of selectedDate
    const due = new Date(selectedDate);
    due.setHours(23, 59, 59, 999);

    const payload = {
      title: newTitle.trim(),
      description: null,
      priority: newPriority,
      category: newCategory && newCategory !== "Semua Tugas" ? newCategory : "Semua Tugas",
      dueDate: due,
      isPinned: false,
      subtasks: [],
    };

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
      playPopSound(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menambahkan tugas.");
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayKey = toDateKey(new Date());

  // Priority color helper
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-900";
      case "high":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-900";
      case "low":
        return "bg-[#e8ecde] text-[#414833] dark:bg-[#20261b] dark:text-[#a4ac86] border-[#d3dbc3] dark:border-[#333d29]";
      default:
        return "bg-[#d5dcce] text-[#333d29] dark:bg-[#293121] dark:text-[#d3dbc3] border-[#bcc7a6] dark:border-[#414833]";
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top Header Hero */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#d5dcce]/70 dark:border-[#333d29]/70">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#d3dbc3] dark:border-[#333d29] bg-[#e8ecde] dark:bg-[#20261b] text-[#656d4a] dark:text-[#d3dbc3] text-xs font-semibold mb-2">
            <CalendarIcon size={13} className="text-[#656d4a] dark:text-[#a4ac86]" />
            <span>Workspace Kalender &amp; Linimasa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#333d29] dark:text-[#f5f7f1] tracking-tight">
            Jadwal &amp; Tenggat Tugas
          </h1>
        </div>
        <p className="text-[#414833]/80 dark:text-[#d3dbc3]/80 text-xs sm:text-sm max-w-md">
          Pantau distribusi beban harian dan tenggat tugas Anda secara visual untuk mencegah penumpukan pekerjaan.
        </p>
      </div>

      {/* Control Bar: Month Navigation, View Switcher & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#20261b] border border-[#d5dcce] dark:border-[#333d29] shadow-xs">
        {/* Navigation & Month Selector */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl border border-[#d3dbc3] dark:border-[#333d29] hover:bg-[#e8ecde] dark:hover:bg-[#293121] text-[#333d29] dark:text-[#f5f7f1] transition-all press-scale cursor-pointer"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-sm sm:text-base font-bold text-[#333d29] dark:text-[#f5f7f1] min-w-[150px] text-center">
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl border border-[#d3dbc3] dark:border-[#333d29] hover:bg-[#e8ecde] dark:hover:bg-[#293121] text-[#333d29] dark:text-[#f5f7f1] transition-all press-scale cursor-pointer"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight size={16} />
          </button>

          <button
            type="button"
            onClick={handleGoToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#e8ecde] dark:bg-[#293121] text-[#333d29] dark:text-[#f5f7f1] border border-[#d3dbc3] dark:border-[#333d29] hover:bg-[#d3dbc3] transition-all press-scale cursor-pointer"
          >
            Hari Ini
          </button>
        </div>

        {/* View Mode Toggle & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-[#e8ecde]/70 dark:bg-[#161a12] border border-[#d3dbc3] dark:border-[#333d29] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === "month"
                  ? "bg-white dark:bg-[#20261b] text-[#333d29] dark:text-white shadow-xs font-bold"
                  : "text-[#656d4a] dark:text-[#bcc7a6]"
              }`}
            >
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === "week"
                  ? "bg-white dark:bg-[#20261b] text-[#333d29] dark:text-white shadow-xs font-bold"
                  : "text-[#656d4a] dark:text-[#bcc7a6]"
              }`}
            >
              Pekan
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-[#d3dbc3] dark:border-[#333d29] bg-white dark:bg-[#20261b] text-[#333d29] dark:text-[#f5f7f1] focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-[#d3dbc3] dark:border-[#333d29] bg-white dark:bg-[#20261b] text-[#333d29] dark:text-[#f5f7f1] focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="active">Belum Selesai</option>
              <option value="completed">Sudah Selesai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Grid Kalender (Kiri) + Panel Detail Tanggal (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Calendar View (Bulanan atau Pekan) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#20261b] border border-[#d5dcce] dark:border-[#333d29] rounded-2xl p-4 sm:p-5 shadow-xs overflow-hidden">
          {viewMode === "month" ? (
            /* Month Grid */
            <div>
              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-bold text-[#656d4a] dark:text-[#a4ac86]">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {calendarCells.map((cell, idx) => {
                  const isSelected = cell.dateKey === selectedDateKey;
                  const isToday = cell.dateKey === todayKey;
                  const cellTasks = tasksByDate.get(cell.dateKey) || [];

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(cell.date)}
                      className={`min-h-[78px] sm:min-h-[96px] p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-[#e8ecde] dark:bg-[#293121] border-[#656d4a] dark:border-[#a4ac86] shadow-xs"
                          : isToday
                          ? "bg-[#f7f8f4] dark:bg-[#161a12] border-[#656d4a]/50 dark:border-[#a4ac86]/40"
                          : cell.isCurrentMonth
                          ? "bg-white dark:bg-[#20261b] border-[#e8ecde] dark:border-[#2d3626] hover:bg-[#f7f8f4] dark:hover:bg-[#242b1f]"
                          : "bg-neutral-50/50 dark:bg-[#161a12]/30 border-transparent opacity-40 hover:opacity-75"
                      }`}
                    >
                      {/* Date Header */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                            isToday
                              ? "bg-[#333d29] text-white dark:bg-[#a4ac86] dark:text-[#161a12]"
                              : isSelected
                              ? "text-[#333d29] dark:text-white"
                              : "text-neutral-700 dark:text-neutral-300"
                          }`}
                        >
                          {cell.date.getDate()}
                        </span>

                        {cellTasks.length > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#d5dcce] dark:bg-[#333d29] text-[#333d29] dark:text-[#d3dbc3]">
                            {cellTasks.length}
                          </span>
                        )}
                      </div>

                      {/* Task Pills */}
                      <div className="space-y-1 mt-1 overflow-hidden">
                        {cellTasks.slice(0, 2).map((t) => (
                          <div
                            key={t.id}
                            className={`text-[10px] px-1.5 py-0.5 rounded truncate border leading-tight ${getPriorityBadge(
                              t.priority
                            )} ${t.isCompleted ? "line-through opacity-50" : ""}`}
                            title={t.title}
                          >
                            {t.title}
                          </div>
                        ))}
                        {cellTasks.length > 2 && (
                          <div className="text-[9px] font-semibold text-[#656d4a] dark:text-[#a4ac86] pl-1">
                            +{cellTasks.length - 2} lagi
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Week Timeline View */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                {weekDays.map((w, idx) => {
                  const isSelected = w.dateKey === selectedDateKey;
                  const isToday = w.dateKey === todayKey;
                  const dayTasks = tasksByDate.get(w.dateKey) || [];

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(w.date)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-h-[140px] ${
                        isSelected
                          ? "bg-[#e8ecde] dark:bg-[#293121] border-[#656d4a] dark:border-[#a4ac86] shadow-xs"
                          : isToday
                          ? "bg-[#f7f8f4] dark:bg-[#161a12] border-[#656d4a]/50"
                          : "bg-white dark:bg-[#20261b] border-[#e8ecde] dark:border-[#2d3626] hover:bg-[#f7f8f4]"
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[#d5dcce]/60 dark:border-[#333d29]/60">
                        <span className="text-xs font-bold text-[#656d4a] dark:text-[#a4ac86]">
                          {DAY_NAMES[idx]}
                        </span>
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                            isToday
                              ? "bg-[#333d29] text-white dark:bg-[#a4ac86] dark:text-[#161a12]"
                              : "text-[#333d29] dark:text-neutral-200"
                          }`}
                        >
                          {w.date.getDate()}
                        </span>
                      </div>

                      <div className="space-y-1.5 mt-2 flex-1 overflow-y-auto max-h-[160px]">
                        {dayTasks.map((t) => (
                          <div
                            key={t.id}
                            className={`text-[10px] p-1.5 rounded-lg border ${getPriorityBadge(
                              t.priority
                            )} ${t.isCompleted ? "line-through opacity-50" : ""}`}
                          >
                            <p className="font-semibold truncate">{t.title}</p>
                          </div>
                        ))}
                        {dayTasks.length === 0 && (
                          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 italic text-center pt-4">
                            Kosong
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Selected Date Tasks & Quick Add */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Date Card */}
          <div className="bg-white dark:bg-[#20261b] border border-[#d5dcce] dark:border-[#333d29] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            {/* Header */}
            <div className="pb-3 border-b border-[#d5dcce]/70 dark:border-[#333d29]/70 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#656d4a] dark:text-[#a4ac86] tracking-wider block">
                  Tanggal Terpilih
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#333d29] dark:text-[#f5f7f1]">
                  {selectedDate.toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#e8ecde] dark:bg-[#293121] text-[#333d29] dark:text-[#d3dbc3]">
                {tasksForSelectedDate.length} Tugas
              </span>
            </div>

            {/* Quick Add Form on this Date */}
            <form onSubmit={handleCreateTaskForDate} className="space-y-2.5">
              <span className="text-xs font-bold text-[#333d29] dark:text-[#d3dbc3] block">
                + Tambah Tugas di Tanggal Ini
              </span>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Judul tugas baru..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#d5dcce] dark:border-[#333d29] bg-white dark:bg-[#161a12] text-[#333d29] dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#656d4a]/20"
                required
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="px-2 py-1.5 text-xs rounded-lg border border-[#d5dcce] dark:border-[#333d29] bg-white dark:bg-[#161a12] text-[#333d29] dark:text-white focus:outline-none"
                >
                  <option value="urgent">🔴 Urgent</option>
                  <option value="high">🟠 Tinggi</option>
                  <option value="medium">🔵 Sedang</option>
                  <option value="low">⚪ Rendah</option>
                </select>

                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="px-2 py-1.5 text-xs rounded-lg border border-[#d5dcce] dark:border-[#333d29] bg-white dark:bg-[#161a12] text-[#333d29] dark:text-white focus:outline-none"
                >
                  <option value="Semua Tugas">Semua Tugas</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {errorMessage && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !newTitle.trim()}
                className="w-full py-2 rounded-xl text-xs font-bold bg-[#333d29] hover:bg-[#414833] text-[#f5f7f1] transition-all press-scale disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isSubmitting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <>
                    <Plus size={14} />
                    <span>Jadwalkan Tugas</span>
                  </>
                )}
              </button>
            </form>

            {/* Task Items List for Selected Date */}
            <div className="pt-2 border-t border-[#d5dcce]/70 dark:border-[#333d29]/70 space-y-2">
              <span className="text-xs font-bold text-[#656d4a] dark:text-[#a4ac86] block">
                Daftar Tugas Hari Ini ({tasksForSelectedDate.length}):
              </span>

              {tasksForSelectedDate.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500 italic border border-dashed border-[#d5dcce] dark:border-[#333d29] rounded-xl p-4">
                  Tidak ada tugas yang dijadwalkan pada tanggal ini.
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {tasksForSelectedDate.map((t) => (
                    <div
                      key={t.id}
                      className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-2.5 ${
                        t.isCompleted
                          ? "bg-neutral-50/60 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-60"
                          : "bg-white dark:bg-[#161a12] border-[#d5dcce] dark:border-[#333d29]"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(t.id, t.isCompleted)}
                          className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                            t.isCompleted
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-neutral-400 dark:border-neutral-600 hover:border-emerald-600"
                          }`}
                        >
                          {t.isCompleted && <CheckCircle2 size={12} className="stroke-[3]" />}
                        </button>

                        <div className="min-w-0">
                          <p
                            className={`text-xs font-semibold leading-tight break-words text-[#333d29] dark:text-[#f5f7f1] ${
                              t.isCompleted ? "line-through text-neutral-400 dark:text-neutral-500" : ""
                            }`}
                          >
                            {t.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getPriorityBadge(
                                t.priority
                              )}`}
                            >
                              {t.priority.toUpperCase()}
                            </span>
                            {t.category && t.category !== "Semua Tugas" && (
                              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[#e8ecde] text-[#414833] dark:bg-[#20261b] dark:text-[#a4ac86]">
                                #{t.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(t.id, t.isPinned)}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            t.isPinned
                              ? "text-amber-500 fill-amber-500"
                              : "text-neutral-400 hover:text-amber-500"
                          }`}
                          title={t.isPinned ? "Lepas pin" : "Sematkan tugas"}
                        >
                          <Star size={13} className={t.isPinned ? "fill-amber-500" : ""} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1 rounded-md text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Hapus tugas"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
