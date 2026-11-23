import { useState, useEffect, useRef } from "react";
import { getStoredUser, logOut, type AuthUser } from "../lib/auth";
import { AuthModal } from "./AuthModal";
import { TelegramSettingsModal } from "./TelegramSettingsModal";
import { LogIn, LogOut, Sparkles, ChevronDown, CheckCircle2, Mail, Send } from "lucide-react";

export function UserButton() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"signin" | "contact">("signin");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial check
    setUser(getStoredUser());

    // Listen for auth change events
    const handleAuthChange = (e: any) => {
      setUser(e.detail || null);
    };

    window.addEventListener("pangenget:auth_change", handleAuthChange);

    // Close dropdown on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("pangenget:auth_change", handleAuthChange);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOpenAuth = (mode: "signin" | "contact") => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logOut();
  };

  const getInitial = (name?: string) => {
    if (!name) return "U";
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <>
      {user ? (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700/70 transition-all press-scale shadow-2xs"
            aria-expanded={isDropdownOpen}
            aria-label="Menu akun pengguna"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-400/30">
              {getInitial(user.name)}
            </div>
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 max-w-[90px] truncate hidden sm:inline-block">
              {user.name.split(" ")[0]}
            </span>
            <ChevronDown size={13} className="text-neutral-400" />
          </button>

          {/* User Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* User details header */}
              <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                  {user.email}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  <Sparkles size={11} className="text-emerald-500" />
                  <span>Sahabat Pro (0-Payment)</span>
                </div>
              </div>

              {/* Status info */}
              <div className="px-4 py-2.5 text-[11px] text-neutral-500 dark:text-neutral-400 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center justify-between py-0.5">
                  <span>Penyimpanan:</span>
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Neon Cloud DB</span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span>Isolasi Data:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Terlindungi
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsTelegramModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                >
                  <Send size={14} className="text-sky-500" />
                  <span>Notifikasi Telegram</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut size={14} />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenAuth("signin")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors press-scale"
          >
            <LogIn size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAuth("contact")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-2xs press-scale cursor-pointer"
          >
            <Mail size={13} />
            <span>Minta Akses</span>
          </button>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultMode={modalMode}
      />

      {/* Telegram Notification Settings Modal */}
      <TelegramSettingsModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        user={user}
      />
    </>
  );
}
