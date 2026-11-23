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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-[#d5dcce]/70 dark:border-[#333d29]/70">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e8ecde] dark:bg-[#20261b] text-[#656d4a] dark:text-[#d3dbc3] border border-[#d3dbc3] dark:border-[#333d29] mb-2">
            <FolderKanban size={13} className="text-[#656d4a] dark:text-[#a4ac86]" />
            <span>Pengorganisasian Tugas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#333d29] dark:text-[#f5f7f1] tracking-tight">
            Kategori &amp; Proyek
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#414833]/80 dark:text-[#d3dbc3]/80 max-w-md">
          Kelola tugas berdasarkan domain kerja Anda. Pisahkan antara pekerjaan, proyek pribadi, dan rutinitas harian.
        </p>
      </div>

      {/* Category Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`p-4 rounded-2xl border text-left transition-all press-scale cursor-pointer ${
            selectedCategory === "all"
              ? "bg-[#333d29] text-[#f5f7f1] dark:bg-[#f5f7f1] dark:text-[#333d29] border-[#333d29] dark:border-white shadow-md font-bold"
              : "bg-white dark:bg-[#20261b] border-[#d5dcce] dark:border-[#333d29] text-[#333d29] dark:text-[#f5f7f1] hover:border-[#a4ac86]"
          }`}
        >
          <div className="text-xs text-[#656d4a] dark:text-[#a4ac86] mb-1">Semua Domain</div>
          <div className="text-lg font-black">Semua Tugas</div>
          <div className="text-xs mt-2 opacity-80">{tasks.length} tugas total</div>
        </button>

        {categoryStats.map((cat) => (
          <button
            key={cat.name}
            type="button"
            onClick={() => setSelectedCategory(cat.name)}
            className={`p-4 rounded-2xl border text-left transition-all press-scale cursor-pointer ${
              selectedCategory === cat.name
                ? "bg-[#333d29] text-[#f5f7f1] dark:bg-[#f5f7f1] dark:text-[#333d29] border-[#333d29] dark:border-white shadow-md font-bold"
                : "bg-white dark:bg-[#20261b] border-[#d5dcce] dark:border-[#333d29] text-[#333d29] dark:text-[#f5f7f1] hover:border-[#a4ac86]"
            }`}
          >
            <div className="text-xs text-[#656d4a] dark:text-[#a4ac86] mb-1">Kategori</div>
            <div className="text-lg font-black truncate">{cat.name}</div>
            <div className="text-xs mt-2 opacity-80">
              {cat.completed}/{cat.total} beres ({cat.percentage}%)
            </div>
          </button>
        ))}
      </div>

      {/* Quick Add Input inside Active Category */}
      <form onSubmit={handleQuickAdd} className="flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-[#20261b] border border-[#d5dcce] dark:border-[#333d29] shadow-xs">
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder={`Tambah tugas langsung ke ${selectedCategory === "all" ? "Umum" : `#${selectedCategory}`}...`}
          className="flex-1 px-3 py-2 text-sm bg-transparent text-[#333d29] dark:text-[#f5f7f1] placeholder-[#414833]/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!quickTitle.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#333d29] hover:bg-[#414833] text-[#f5f7f1] disabled:opacity-40 transition-colors press-scale cursor-pointer"
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
