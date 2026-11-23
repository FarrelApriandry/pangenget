import { useState, useEffect } from "react";
import type { Task } from "../db/schema";
import { authFetch } from "../lib/auth";
import { TaskItem } from "./TaskItem";
import { FolderKanban, Plus, CheckCircle2 } from "lucide-react";
import { playPopSound } from "../utils/audio";

interface CategoryWorkspaceProps {
  initialTasks: Task[];
}

export function CategoryWorkspace({ initialTasks }: CategoryWorkspaceProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [quickTitle, setQuickTitle] = useState("");

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

  // Extract categories
  const categories = Array.from(
    new Set(tasks.map((t) => t.category?.trim() || "Umum"))
  );

  const displayedTasks =
    selectedCategory === "all"
      ? tasks
      : tasks.filter((t) => (t.category?.trim() || "Umum") === selectedCategory);

  // Group stats by category
  const categoryStats = categories.map((cat) => {
    const catTasks = tasks.filter((t) => (t.category?.trim() || "Umum") === cat);
    const completed = catTasks.filter((t) => t.isCompleted).length;
    const total = catTasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { name: cat, total, completed, percentage };
  });

  const handleToggleComplete = async (id: string, current: boolean) => {
    const next = !current;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isCompleted: next } : t))
    );
    await authFetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: next }),
    });
  };

  const handleTogglePin = async (id: string, current: boolean) => {
    const next = !current;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPinned: next } : t))
    );
    await authFetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: next }),
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

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const targetCategory = selectedCategory === "all" ? "Umum" : selectedCategory;
    const payload = {
      title: quickTitle.trim(),
      category: targetCategory,
      priority: "medium",
    };

    const tempId = "temp-" + Date.now();
    const optimistic: Task = {
      id: tempId,
      userId: null,
      ...payload,
      description: null,
      isCompleted: false,
      isPinned: false,
      subtasks: [],
      dueDate: null,
      completedAt: null,
      telegramReminded24h: false,
      telegramReminded1h: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      priority: "medium",
    };

    setTasks((prev) => [optimistic, ...prev]);
    setQuickTitle("");
    playPopSound(true);

    try {
      const res = await authFetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === tempId ? data.data : t)));
    } catch {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
            <FolderKanban size={13} className="text-emerald-500" />
            <span>Pengorganisasian Tugas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            Kategori &amp; Proyek
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
          Kelola tugas berdasarkan domain kerja Anda. Pisahkan antara pekerjaan, proyek pribadi, dan rutinitas harian.
        </p>
      </div>

      {/* Category Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`p-4 rounded-2xl border text-left transition-all press-scale ${
            selectedCategory === "all"
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-md font-bold"
              : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 hover:border-neutral-300"
          }`}
        >
          <div className="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Semua Domain</div>
          <div className="text-lg font-black">Semua Tugas</div>
          <div className="text-xs mt-2 opacity-80">{tasks.length} tugas total</div>
        </button>

        {categoryStats.map((cat) => (
          <button
            key={cat.name}
            type="button"
            onClick={() => setSelectedCategory(cat.name)}
            className={`p-4 rounded-2xl border text-left transition-all press-scale ${
              selectedCategory === cat.name
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-md font-bold"
                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 hover:border-neutral-300"
            }`}
          >
            <div className="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Kategori</div>
            <div className="text-lg font-black truncate">{cat.name}</div>
            <div className="text-xs mt-2 opacity-80">
              {cat.completed}/{cat.total} beres ({cat.percentage}%)
            </div>
          </button>
        ))}
      </div>

      {/* Quick Add Input inside Active Category */}
      <form onSubmit={handleQuickAdd} className="flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder={`Tambah tugas langsung ke ${selectedCategory === "all" ? "Umum" : `#${selectedCategory}`}...`}
          className="flex-1 px-3 py-2 text-sm bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!quickTitle.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-colors press-scale"
        >
          <Plus size={14} />
          <span>Tambah</span>
        </button>
      </form>

      {/* Tasks List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>
            Menampilkan tugas di kategori:{" "}
            <strong className="text-neutral-900 dark:text-neutral-100">
              {selectedCategory === "all" ? "Semua Kategori" : selectedCategory}
            </strong>
          </span>
          <span>{displayedTasks.length} tugas</span>
        </div>

        {displayedTasks.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl">
            <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Belum ada tugas di kategori ini
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
    </div>
  );
}
