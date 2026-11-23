import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: "N", description: "Fokus ke input tugas baru" },
  { key: "/", description: "Fokus ke pencarian tugas" },
  { key: "1", description: "Beralih ke tab 'Semua Tugas'" },
  { key: "2", description: "Beralih ke tab 'Tugas Aktif'" },
  { key: "3", description: "Beralih ke tab 'Tugas Selesai'" },
  { key: "4", description: "Beralih ke tab 'Tugas Penting / Starred'" },
  { key: "Esc", description: "Batalkan input atau tutup modal ini" },
  { key: "?", description: "Buka / tutup panduan shortcut ini" },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !isMounted) return null;

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-neutral-950/70 backdrop-blur-sm animate-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-md my-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl p-6 text-neutral-900 dark:text-neutral-100 overflow-hidden animate-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/60">
              <Keyboard size={18} />
            </div>
            <div>
              <h3 id="shortcuts-title" className="font-bold text-base leading-tight">Pintasan Keyboard</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Navigasi cepat tanpa mouse</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                {s.description}
              </span>
              <kbd className="px-2 py-1 text-xs font-mono font-bold bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-700 dark:text-neutral-300 shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-center">
          <p className="text-[11px] text-neutral-400">
            Tekan <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono">Esc</kbd> kapan saja untuk menutup panduan ini
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
