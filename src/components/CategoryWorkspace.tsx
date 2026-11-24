import { useState, useEffect, useMemo } from "react";
import type { Task } from "../db/schema";
import { authFetch } from "../lib/auth";
import { TaskItem } from "./TaskItem";
import { FolderKanban, Plus, CheckCircle2, Trash2, Loader2, FolderPlus } from "lucide-react";
import { playPopSound } from "../utils/audio";

interface CategoryWorkspaceProps {
  initialTasks: Task[];
  initialCategories?: string[];
}

export function CategoryWorkspace({ initialTasks, initialCategories = [] }: CategoryWorkspaceProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [customCategories, setCustomCategories] = useState<string[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [quickTitle, setQuickTitle] = useState("");

  // New category creation state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Load categories from API
  const loadCategories = async () => {
    try {
      const res = await authFetch("/api/categories");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCustomCategories(json.data);
      }
    } catch (e) {
      console.error("Gagal memuat kategori:", e);
    }
  };

  useEffect(() => {
    loadCategories();
    window.addEventListener("pangenget:category_change", loadCategories);
    return () => window.removeEventListener("pangenget:category_change", loadCategories);
  }, []);

  // Auth reload listener
  useEffect(() => {
    const handleAuthChange = async () => {
      try {
        const res = await authFetch("/api/tasks");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setTasks(data.data);
        }
        await loadCategories();
      } catch (e) {
        console.error("Auth reload tasks error:", e);
      }
    };

    window.addEventListener("pangenget:auth_change", handleAuthChange);
    return () => window.removeEventListener("pangenget:auth_change", handleAuthChange);
  }, []);

  // Combined unique category list (excluding 'all', 'Semua Tugas', 'Umum')
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    customCategories.forEach((c) => {
      if (c && c !== "Semua Tugas" && c !== "Umum" && c !== "all") {
        set.add(c.trim());
      }
    });
    tasks.forEach((t) => {
      if (t.category && t.category.trim() && t.category.trim() !== "Semua Tugas" && t.category.trim() !== "Umum" && t.category.trim() !== "all") {
        set.add(t.category.trim());
      }
    });
    return Array.from(set);
  }, [customCategories, tasks]);

  // Tasks filtered by selected category
  const displayedTasks = useMemo(() => {
    if (selectedCategory === "all") {
      return tasks;
    }
    return tasks.filter((t) => {
      const cat = t.category?.trim();
      if (selectedCategory === "Semua Tugas") {
        return cat === "Semua Tugas" || cat === "Umum" || !cat;
      }
      return cat === selectedCategory;
    });
  }, [tasks, selectedCategory]);

  // Group stats by category
  const categoryStats = useMemo(() => {
    return allCategories.map((cat) => {
      const catTasks = tasks.filter((t) => t.category?.trim() === cat);
      const completed = catTasks.filter((t) => t.isCompleted).length;
      const total = catTasks.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { name: cat, total, completed, percentage };
    });
  }, [allCategories, tasks]);


  // Create new category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || isCreatingCategory) return;

    const clean = newCategoryName.trim();
    if (clean.toLowerCase() === "semua tugas" || clean.toLowerCase() === "all" || clean.toLowerCase() === "semua") {
      setCategoryError("'Semua Tugas' adalah kategori default sistem.");
      return;
    }

    setIsCreatingCategory(true);
    setCategoryError(null);

    try {
      const res = await authFetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clean }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat kategori.");

      setCustomCategories((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
      setSelectedCategory(clean);
      setNewCategoryName("");
      playPopSound(true);
      window.dispatchEvent(new CustomEvent("pangenget:category_change"));
    } catch (err: any) {
      setCategoryError(err.message || "Gagal menambahkan kategori baru.");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async (catName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Hapus kategori "${catName}"? Tugas yang ada di dalamnya akan otomatis dialihkan ke "Semua Tugas".`)) {
      return;
    }

    setCustomCategories((prev) => prev.filter((c) => c !== catName));
    if (selectedCategory === catName) {
      setSelectedCategory("all");
    }

    // Optimistically update tasks that had this category
    setTasks((prev) =>
      prev.map((t) => (t.category === catName ? { ...t, category: "Semua Tugas" } : t))
    );

    try {
      await authFetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName }),
      });
      window.dispatchEvent(new CustomEvent("pangenget:category_change"));
    } catch (e) {
      console.error("Gagal menghapus kategori:", e);
    }
  };

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

  // Quick add task into active category
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const targetCategory = selectedCategory === "all" ? "Semua Tugas" : selectedCategory;
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
      repeatType: "none",
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 sm:pb-6 border-b border-[#d5dcce]/70 dark:border-[#333d29]/70">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs lg:text-sm font-semibold bg-[#e8ecde] dark:bg-[#20261b] text-[#656d4a] dark:text-[#d3dbc3] border border-[#d3dbc3] dark:border-[#333d29] mb-2">
            <FolderKanban size={14} className="text-[#656d4a] dark:text-[#a4ac86]" />
            <span>Manajemen Kategori &amp; Proyek</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#333d29] dark:text-[#f5f7f1] tracking-tight">
            Kategori &amp; Proyek
          </h1>
        </div>
        <p className="text-xs sm:text-sm lg:text-base text-[#414833]/80 dark:text-[#d3dbc3]/80 max-w-lg">
          Buat dan kelola kategori baru di sini. Saat menambah tugas di halaman utama, Anda cukup memilih kategori dari dropdown (atau otomatis menjadi Semua Tugas jika tidak dipilih).
        </p>
      </div>

      {/* Form Buat Kategori Baru */}
      <div className="p-4 sm:p-5 rounded-2xl border border-[#d5dcce] dark:border-[#333d29] bg-white dark:bg-[#20261b] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FolderPlus size={16} className="text-[#656d4a] dark:text-[#a4ac86]" />
            <h3 className="text-sm font-bold text-[#333d29] dark:text-[#f5f7f1]">
              Buat Kategori Baru
            </h3>
          </div>
          <span className="text-[11px] text-[#656d4a] dark:text-[#a4ac86]">
            Kategori yang dibuat di sini otomatis tersedia di pilihan dropdown form tambah tugas
          </span>
        </div>

        <form onSubmit={handleCreateCategory} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => {
              setNewCategoryName(e.target.value);
              if (categoryError) setCategoryError(null);
            }}
            placeholder="Ketik nama kategori baru... Contoh: Kuliah, Desain, Riset, Pribadi"
            className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-[#d5dcce] dark:border-[#333d29] bg-transparent text-[#333d29] dark:text-[#f5f7f1] placeholder-[#414833]/50 focus:outline-none focus:ring-2 focus:ring-[#656d4a]"
          />
          <button
            type="submit"
            disabled={!newCategoryName.trim() || isCreatingCategory}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#333d29] hover:bg-[#414833] text-[#f5f7f1] disabled:opacity-40 transition-colors press-scale cursor-pointer shrink-0"
          >
            {isCreatingCategory ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Plus size={15} />
            )}
            <span>Tambah Kategori</span>
          </button>
        </form>

        {categoryError && (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium animate-fade-in">
            {categoryError}
          </p>
        )}
      </div>

      {/* Category Overview Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#656d4a] dark:text-[#a4ac86]">
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            Daftar Domain ({allCategories.length + 1})
          </span>
          <span className="text-[11px]">Klik card untuk memfilter tugas</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {/* Card: Semua Tugas */}
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`p-4 rounded-2xl border text-left transition-all press-scale cursor-pointer relative ${
              selectedCategory === "all"
                ? "bg-[#333d29] text-[#f5f7f1] dark:bg-[#f5f7f1] dark:text-[#333d29] border-[#333d29] dark:border-white shadow-md font-bold"
                : "bg-white dark:bg-[#20261b] border-[#d5dcce] dark:border-[#333d29] text-[#333d29] dark:text-[#f5f7f1] hover:border-[#a4ac86]"
            }`}
          >
            <div className="text-[11px] opacity-70 mb-1">Semua Domain</div>
            <div className="text-base sm:text-lg font-black truncate">Semua Tugas</div>
            <div className="text-xs mt-2 opacity-80">{tasks.length} tugas total</div>
          </button>

          {/* Cards: Custom Categories */}
          {categoryStats.map((cat) => (
            <div
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`group p-4 rounded-2xl border text-left transition-all press-scale cursor-pointer relative flex flex-col justify-between ${
                selectedCategory === cat.name
                  ? "bg-[#333d29] text-[#f5f7f1] dark:bg-[#f5f7f1] dark:text-[#333d29] border-[#333d29] dark:border-white shadow-md font-bold"
                  : "bg-white dark:bg-[#20261b] border-[#d5dcce] dark:border-[#333d29] text-[#333d29] dark:text-[#f5f7f1] hover:border-[#a4ac86]"
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-[11px] opacity-70 truncate">Kategori</span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteCategory(cat.name, e)}
                  title={`Hapus kategori ${cat.name}`}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-rose-500 hover:bg-rose-100/30 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <div>
                <div className="text-base sm:text-lg font-black truncate">{cat.name}</div>
                <div className="text-xs mt-2 opacity-80">
                  {cat.completed}/{cat.total} beres ({cat.percentage}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Add Input inside Active Category */}
      <form onSubmit={handleQuickAdd} className="flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-[#20261b] border border-[#d5dcce] dark:border-[#333d29] shadow-xs">
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder={`Tambah tugas langsung ke ${selectedCategory === "all" ? "Semua Tugas" : `#${selectedCategory}`}...`}
          className="flex-1 px-3 py-2 text-sm bg-transparent text-[#333d29] dark:text-[#f5f7f1] placeholder-[#414833]/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!quickTitle.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#333d29] hover:bg-[#414833] text-[#f5f7f1] disabled:opacity-40 transition-colors press-scale cursor-pointer shrink-0"
        >
          <Plus size={14} />
          <span>Tambah Tugas</span>
        </button>
      </form>

      {/* Tasks List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-[#656d4a] dark:text-[#a4ac86]">
          <span>
            Menampilkan tugas di kategori:{" "}
            <strong className="text-[#333d29] dark:text-[#f5f7f1]">
              {selectedCategory === "all" ? "Semua Tugas" : selectedCategory}
            </strong>
          </span>
          <span>{displayedTasks.length} tugas</span>
        </div>

        {displayedTasks.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-[#d5dcce] dark:border-[#333d29] rounded-2xl bg-white/40 dark:bg-[#20261b]/30">
            <CheckCircle2 size={24} className="text-[#656d4a] dark:text-[#a4ac86] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#333d29] dark:text-[#f5f7f1]">
              Belum ada tugas di kategori ini
            </p>
            <p className="text-xs text-[#414833]/70 dark:text-[#d3dbc3]/70 mt-1">
              Gunakan formulir di atas untuk menambahkan tugas baru langsung ke kategori ini.
            </p>
          </div>
        ) : (
          displayedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              availableCategories={allCategories}
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
