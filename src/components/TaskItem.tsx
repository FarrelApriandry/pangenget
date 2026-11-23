import { useState } from "react";
import type { Task, SubTask } from "../db/schema";
import {
  Check,
  Star,
  Trash2,
  Calendar,
  Tag,
  Edit3,
  AlertCircle,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string, current: boolean) => void;
  onTogglePin: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
}

export function TaskItem({
  task,
  onToggleComplete,
  onTogglePin,
  onDelete,
  onUpdate,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || "");
  const [editPriority, setEditPriority] = useState<string>(task.priority);
  const [editCategory, setEditCategory] = useState<string>(task.category);
  const [editDueDate, setEditDueDate] = useState<string>(
    task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""
  );

  const subtasks: SubTask[] = Array.isArray(task.subtasks) ? task.subtasks : [];
  const completedSubtasks = subtasks.filter((s) => s.isCompleted).length;
  const totalSubtasks = subtasks.length;
  const allSubtasksDone = totalSubtasks > 0 && completedSubtasks === totalSubtasks;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    onUpdate(task.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || null,
      priority: editPriority as any,
      category: editCategory.trim() || "Umum",
      dueDate: editDueDate ? new Date(editDueDate) : null,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditPriority(task.priority);
    setEditCategory(task.category);
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");
    setIsEditing(false);
  };

  // Subtask handlers
  const handleToggleSubtask = (subtaskId: string) => {
    const updated = subtasks.map((s) =>
      s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
    );
    onUpdate(task.id, { subtasks: updated });
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSub: SubTask = {
      id: "sub-" + Date.now(),
      title: newSubtaskTitle.trim(),
      isCompleted: false,
    };
    onUpdate(task.id, { subtasks: [...subtasks, newSub] });
    setNewSubtaskTitle("");
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updated = subtasks.filter((s) => s.id !== subtaskId);
    onUpdate(task.id, { subtasks: updated });
  };

  // Format due date relative to today
  const formatDueDate = (dateStr: Date | string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Terlewat (${Math.abs(diffDays)}h)`, isOverdue: true };
    }
    if (diffDays === 0) {
      return { label: "Hari ini", isToday: true };
    }
    if (diffDays === 1) {
      return { label: "Besok", isTomorrow: true };
    }
    return {
      label: date.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      isUpcoming: true,
    };
  };

  const dueInfo = formatDueDate(task.dueDate);

  const priorityMeta = {
    urgent: {
      label: "Urgent",
      badge: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/60",
      dot: "bg-rose-500",
    },
    high: {
      label: "Tinggi",
      badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
      dot: "bg-amber-500",
    },
    medium: {
      label: "Sedang",
      badge: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-900/60",
      dot: "bg-sky-500",
    },
    low: {
      label: "Rendah",
      badge: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800/80 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700",
      dot: "bg-neutral-400",
    },
  }[task.priority] || {
    label: "Sedang",
    badge: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-900/60",
    dot: "bg-sky-500",
  };

  if (isEditing) {
    return (
      <div className="p-4 rounded-xl border border-[#d3dbc3] dark:border-[#333d29] bg-white dark:bg-[#20261b] shadow-md">
        <form onSubmit={handleSaveEdit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#656d4a] dark:text-[#a4ac86] mb-1">
              Judul Tugas
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#d5dcce] dark:border-[#333d29] bg-transparent text-[#333d29] dark:text-[#f5f7f1] focus:outline-none focus:ring-2 focus:ring-[#656d4a]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#656d4a] dark:text-[#a4ac86] mb-1">
              Catatan / Detail Tambahan
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#d5dcce] dark:border-[#333d29] bg-transparent text-[#333d29] dark:text-[#f5f7f1] focus:outline-none focus:ring-2 focus:ring-[#656d4a]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#656d4a] dark:text-[#a4ac86] mb-1">
                Prioritas
              </label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#d5dcce] dark:border-[#333d29] bg-white dark:bg-[#293121] text-[#333d29] dark:text-[#f5f7f1] focus:outline-none focus:ring-2 focus:ring-[#656d4a]"
              >
                <option value="urgent">Urgent</option>
                <option value="high">Tinggi</option>
                <option value="medium">Sedang</option>
                <option value="low">Rendah</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#656d4a] dark:text-[#a4ac86] mb-1">
                Kategori
              </label>
              <input
                type="text"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                placeholder="Umum, Kerja, dll"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#d5dcce] dark:border-[#333d29] bg-transparent text-[#333d29] dark:text-[#f5f7f1] focus:outline-none focus:ring-2 focus:ring-[#656d4a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#656d4a] dark:text-[#a4ac86] mb-1">
                Batas Waktu (Due Date)
              </label>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#d5dcce] dark:border-[#333d29] bg-white dark:bg-[#293121] text-[#333d29] dark:text-[#f5f7f1] focus:outline-none focus:ring-2 focus:ring-[#656d4a]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#d5dcce]/60 dark:border-[#333d29]/60">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-3 py-1.5 text-xs font-medium text-[#414833] dark:text-[#d3dbc3] hover:bg-[#e8ecde]/60 dark:hover:bg-[#293121] rounded-lg transition-colors press-scale"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-medium bg-[#333d29] text-[#f5f7f1] hover:bg-[#414833] rounded-lg transition-colors shadow-xs press-scale cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div
      className={`group relative p-3.5 sm:p-4 rounded-xl border transition-all duration-200 animate-entrance ${
        task.isCompleted
          ? "bg-[#e8ecde]/30 dark:bg-[#20261b]/40 border-[#d5dcce]/60 dark:border-[#333d29]/60 opacity-80"
          : task.isPinned
          ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-300/70 dark:border-amber-800/50 shadow-xs"
          : "bg-white dark:bg-[#20261b] border-[#d5dcce] dark:border-[#333d29] hover:border-[#a4ac86] dark:hover:border-[#656d4a] shadow-xs"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Main Checkbox */}
        <button
          type="button"
          onClick={() => onToggleComplete(task.id, task.isCompleted)}
          aria-label={task.isCompleted ? "Tandai belum selesai" : "Tandai selesai"}
          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all press-scale shrink-0 cursor-pointer ${
            task.isCompleted
              ? "bg-[#656d4a] text-white border border-[#656d4a] shadow-xs"
              : "border-2 border-[#d5dcce] dark:border-[#414833] hover:border-[#656d4a] dark:hover:border-[#a4ac86] bg-transparent"
          }`}
        >
          {task.isCompleted && <Check size={14} className="stroke-[3]" />}
        </button>

        {/* Task Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm sm:text-base font-medium break-words leading-snug transition-all ${
                task.isCompleted
                  ? "line-through text-neutral-400 dark:text-neutral-500"
                  : "text-neutral-900 dark:text-neutral-100"
              }`}
            >
              {task.title}
            </span>

            {/* Priority Badge */}
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${priorityMeta.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta.dot}`} />
              <span>{priorityMeta.label}</span>
            </span>

            {/* Category Tag */}
            {task.category && task.category !== "Umum" && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/60">
                <Tag size={10} />
                <span>{task.category}</span>
              </span>
            )}

            {/* Due Date Badge */}
            {dueInfo && (
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                  dueInfo.isOverdue
                    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 font-semibold"
                    : dueInfo.isToday
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/60"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200/60 dark:border-neutral-700/60"
                }`}
              >
                {dueInfo.isOverdue ? <AlertCircle size={10} /> : <Calendar size={10} />}
                <span>{dueInfo.label}</span>
              </span>
            )}

            {/* Subtasks Progress Chip */}
            {totalSubtasks > 0 && (
              <button
                type="button"
                onClick={() => setShowSubtasks(!showSubtasks)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors press-scale ${
                  allSubtasksDone
                    ? "bg-[#e8ecde] dark:bg-[#20261b] text-[#656d4a] dark:text-[#d3dbc3] border-[#d3dbc3] dark:border-[#333d29]"
                    : "bg-[#e8ecde]/50 dark:bg-[#20261b]/60 text-[#414833] dark:text-[#d3dbc3] border-[#d5dcce] dark:border-[#333d29]"
                }`}
                title="Buka / tutup rincian langkah"
              >
                <CheckSquare size={11} className={allSubtasksDone ? "text-[#656d4a] dark:text-[#a4ac86]" : "text-[#414833]/60 dark:text-[#a4ac86]/60"} />
                <span>
                  {completedSubtasks}/{totalSubtasks} langkah
                </span>
                {showSubtasks ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
            )}
          </div>

          {/* Description if any */}
          {task.description && (
            <p
              className={`text-xs mt-1 text-[#414833] dark:text-[#d3dbc3] whitespace-pre-wrap leading-relaxed ${
                task.isCompleted ? "line-through opacity-60" : ""
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Subtasks Accordion / Section */}
          {(showSubtasks || totalSubtasks > 0) && (
            <div className="mt-3 pt-2.5 border-t border-[#d5dcce]/60 dark:border-[#333d29]/60 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#656d4a] dark:text-[#a4ac86]">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Rincian Langkah ({completedSubtasks}/{totalSubtasks})
                </span>
                <button
                  type="button"
                  onClick={() => setShowSubtasks(!showSubtasks)}
                  className="hover:underline flex items-center gap-0.5"
                >
                  <span>{showSubtasks ? "Sembunyikan" : "Tampilkan"}</span>
                  {showSubtasks ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>
              </div>

              {showSubtasks && (
                <div className="space-y-1.5 pl-1 animate-fade-in">
                  {subtasks.map((sub) => (
                    <div
                      key={sub.id}
                      className="group/sub flex items-center justify-between gap-2 py-1 px-2 rounded-lg hover:bg-[#e8ecde]/50 dark:hover:bg-[#20261b] text-xs transition-colors"
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={sub.isCompleted}
                          onChange={() => handleToggleSubtask(sub.id)}
                          className="w-3.5 h-3.5 rounded text-[#656d4a] focus:ring-[#656d4a] border-[#d5dcce] dark:border-[#414833] bg-transparent cursor-pointer"
                        />
                        <span
                          className={`break-words ${
                            sub.isCompleted
                              ? "line-through text-[#414833]/50 dark:text-[#d3dbc3]/40"
                              : "text-[#333d29] dark:text-[#f5f7f1]"
                          }`}
                        >
                          {sub.title}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(sub.id)}
                        className="text-neutral-300 hover:text-rose-500 dark:text-neutral-600 dark:hover:text-rose-400 opacity-0 group-hover/sub:opacity-100 transition-opacity p-0.5"
                        title="Hapus sub-tugas"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}

                  {/* Add subtask input */}
                  <form onSubmit={handleAddSubtask} className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder="+ Tambah langkah..."
                      className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={!newSubtaskTitle.trim()}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-emerald-500 hover:text-white disabled:opacity-40 transition-colors press-scale"
                    >
                      <Plus size={13} />
                    </button>
                  </form>

                  {/* Prompt to complete task if all subtasks are done */}
                  {allSubtasksDone && !task.isCompleted && (
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Sparkles size={13} className="text-emerald-500" />
                        Semua sub-langkah selesai!
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleComplete(task.id, false)}
                        className="font-bold underline hover:text-emerald-900 dark:hover:text-emerald-100 press-scale"
                      >
                        Tandai Selesai ↵
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick button to add subtasks if none exist */}
          {totalSubtasks === 0 && !task.isCompleted && (
            <button
              type="button"
              onClick={() => setShowSubtasks(true)}
              className="mt-2 text-[11px] text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <Plus size={11} />
              <span>Tambah sub-langkah</span>
            </button>
          )}

          {/* Completion timestamp */}
          {task.isCompleted && task.completedAt && (
            <div className="mt-2 text-[10px] text-neutral-400 dark:text-neutral-500">
              Selesai pada {new Date(task.completedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>

        {/* Actions cluster */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Quick Focus Button (for active tasks) */}
          {!task.isCompleted && (
            <a
              href={`/fokus?taskId=${task.id}`}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors press-scale opacity-80 group-hover:opacity-100"
              title="Fokus kerjakan tugas ini (Mode Zen / Timer)"
            >
              <Target size={15} />
            </a>
          )}

          {/* Star / Pin button */}
          <button
            type="button"
            onClick={() => onTogglePin(task.id, task.isPinned)}
            aria-label={task.isPinned ? "Lepas pin" : "Sematkan tugas"}
            className={`p-1.5 rounded-lg transition-colors press-scale ${
              task.isPinned
                ? "text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/30"
                : "text-neutral-300 dark:text-neutral-600 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <Star
              size={16}
              className={task.isPinned ? "fill-amber-500" : ""}
            />
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label="Edit tugas"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors press-scale opacity-80 group-hover:opacity-100"
          >
            <Edit3 size={15} />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            aria-label="Hapus tugas"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors press-scale opacity-80 group-hover:opacity-100"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
