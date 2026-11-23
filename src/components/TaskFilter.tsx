import React from "react";
import { Search, X, Star, CheckCircle, Clock, ListFilter } from "lucide-react";

export type FilterStatus = "all" | "active" | "completed" | "starred";

interface TaskFilterProps {
  filterStatus: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  counts: {
    all: number;
    active: number;
    completed: number;
    starred: number;
  };
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function TaskFilter({
  filterStatus,
  onFilterChange,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  counts,
  searchInputRef,
}: TaskFilterProps) {
  return (
    <div className="space-y-3">
      {/* Search Bar & Status Filter Tabs in responsive row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari tugas... (Tekan / untuk mencari)"
            className="w-full pl-9 pr-9 py-2 rounded-xl text-sm border border-[#d5dcce] dark:border-[#333d29] bg-white/80 dark:bg-[#20261b]/80 text-[#333d29] dark:text-[#f5f7f1] placeholder-[#414833]/50 focus:outline-none focus:ring-2 focus:ring-[#656d4a]/50 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              aria-label="Bersihkan pencarian"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Main Filter Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-200/50 dark:bg-neutral-800/60 overflow-x-auto text-xs font-medium shrink-0">
          <button
            type="button"
            onClick={() => onFilterChange("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all press-scale cursor-pointer ${
              filterStatus === "all"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <ListFilter size={13} />
            <span>Semua</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-100 dark:bg-neutral-800 tabular-nums">
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange("active")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all press-scale cursor-pointer ${
              filterStatus === "active"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Clock size={13} className="text-sky-500" />
            <span>Aktif</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-100 dark:bg-neutral-800 tabular-nums">
              {counts.active}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange("completed")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all press-scale cursor-pointer ${
              filterStatus === "completed"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <CheckCircle size={13} className="text-emerald-500" />
            <span>Selesai</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-100 dark:bg-neutral-800 tabular-nums">
              {counts.completed}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange("starred")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all press-scale cursor-pointer ${
              filterStatus === "starred"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Star size={13} className="text-amber-500 fill-amber-500/30" />
            <span>Penting</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-100 dark:bg-neutral-800 tabular-nums">
              {counts.starred}
            </span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills (if any categories present) */}
      {categories.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-neutral-400 dark:text-neutral-500 text-[11px] shrink-0 font-medium">Kategori:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-all press-scale ${
                selectedCategory === cat
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold shadow-xs"
                  : "bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {cat === "all" ? "Semua" : cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
