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
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full border border-[#d5dcce] dark:border-[#333d29] bg-white dark:bg-[#20261b] hover:bg-[#f5f7f1] dark:hover:bg-[#293121] transition-all press-scale shadow-2xs"
            aria-expanded={isDropdownOpen}
            aria-label="Menu akun pengguna"
          >
            <div className="w-6 h-6 rounded-full bg-[#333d29] text-[#f5f7f1] flex items-center justify-center font-bold text-xs ring-2 ring-[#a4ac86]/40">
              {getInitial(user.name)}
            </div>
            <span className="text-xs font-semibold text-[#333d29] dark:text-[#f5f7f1] max-w-[90px] truncate hidden sm:inline-block">
              {user.name.split(" ")[0]}
            </span>
            <ChevronDown size={13} className="text-[#656d4a] dark:text-[#a4ac86]" />
          </button>

          {/* User Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#20261b] border border-[#d5dcce] dark:border-[#333d29] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* User details header */}
              <div className="px-4 py-3 border-b border-[#e8ecde] dark:border-[#333d29]">
                <p className="text-xs font-bold text-[#333d29] dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-[11px] text-[#656d4a] dark:text-[#bcc7a6] truncate">
                  {user.email}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#e8ecde] dark:bg-[#293121] border border-[#d3dbc3] dark:border-[#333d29] text-[10px] font-bold text-[#333d29] dark:text-[#d3dbc3]">
                  <Sparkles size={11} className="text-[#656d4a] dark:text-[#a4ac86]" />
                  <span>Sahabat Pro (0-Payment)</span>
                </div>
              </div>

              {/* Status info */}
              <div className="px-4 py-2.5 text-[11px] text-[#656d4a] dark:text-[#bcc7a6] border-b border-[#e8ecde] dark:border-[#333d29]">
                <div className="flex items-center justify-between py-0.5">
                  <span>Penyimpanan:</span>
                  <span className="font-semibold text-[#333d29] dark:text-[#f5f7f1]">Neon Cloud DB</span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span>Isolasi Data:</span>
                  <span className="font-semibold text-[#656d4a] dark:text-[#a4ac86] flex items-center gap-1">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#333d29] dark:text-[#f5f7f1] hover:bg-[#e8ecde] dark:hover:bg-[#20261b] transition-colors press-scale"
          >
            <LogIn size={14} className="text-[#656d4a] dark:text-[#a4ac86]" />
            <span>Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAuth("contact")}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#333d29] hover:bg-[#414833] text-[#f5f7f1] transition-all shadow-xs press-scale cursor-pointer"
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
