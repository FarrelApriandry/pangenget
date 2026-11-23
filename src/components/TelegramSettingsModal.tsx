import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { authFetch, type AuthUser } from "../lib/auth";
import {
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Bell,
  Clock,
  ShieldCheck,
} from "lucide-react";

interface TelegramSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
}

export function TelegramSettingsModal({ isOpen, onClose, user }: TelegramSettingsModalProps) {
  const [chatId, setChatId] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [remind24h, setRemind24h] = useState(true);
  const [remind1h, setRemind1h] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch current user settings when modal opens
  useEffect(() => {
    if (!isOpen || !user) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setTestResult(null);

    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const res = await authFetch("/api/user/settings");
        const json = await res.json();
        if (json.success && json.data) {
          setChatId(json.data.telegramChatId || "");
          setTelegramUsername(json.data.telegramUsername || "");
          setTelegramEnabled(json.data.telegramEnabled !== false);
          setRemind24h(json.data.remind24h !== false);
          setRemind1h(json.data.remind1h !== false);
        }
      } catch (err: any) {
        console.error("Gagal memuat pengaturan Telegram:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [isOpen, user]);

  // Lock body scroll and handle Escape key
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
    setTimeout(() => inputRef.current?.focus(), 100);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleTestConnection = async () => {
    if (!chatId.trim()) {
      setTestResult({
        success: false,
        message: "Silakan masukkan Telegram Chat ID Anda terlebih dahulu.",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: chatId.trim(),
          userName: user?.name || "Sahabat",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: "Pesan tes berhasil dikirim! Silakan periksa aplikasi Telegram Anda.",
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || "Gagal mengirim pesan pengujian.",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Terjadi kesalahan saat menguji koneksi bot.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await authFetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramChatId: chatId.trim(),
          telegramUsername: telegramUsername.trim(),
          telegramEnabled,
          remind24h,
          remind1h,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Gagal menyimpan pengaturan.");
      }

      setSuccessMessage("Pengaturan notifikasi Telegram berhasil disimpan!");
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menyimpan pengaturan.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !isMounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="telegram-modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden transition-all text-neutral-900 dark:text-neutral-100 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#d5dcce]/60 dark:border-[#333d29]/60 bg-[#e8ecde]/30 dark:bg-[#20261b]/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#333d29] text-white flex items-center justify-center shadow-xs">
              <Send size={16} className="translate-x-[-1px] translate-y-[1px]" />
            </div>
            <div>
              <h2 id="telegram-modal-title" className="text-base font-bold leading-tight text-[#333d29] dark:text-[#f5f7f1]">
                Notifikasi Bot Telegram
              </h2>
              <p className="text-xs text-[#414833]/80 dark:text-[#d3dbc3]/80">
                Pengingat tenggat tugas otomatis ke akun Telegram Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Tutup dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Quick Guide Card */}
          <div className="p-4 rounded-xl bg-[#e8ecde]/60 dark:bg-[#20261b] border border-[#d3dbc3] dark:border-[#333d29] text-xs text-[#333d29] dark:text-[#f5f7f1] space-y-2">
            <div className="flex items-center justify-between font-bold">
              <span>Langkah Menghubungkan:</span>
              <a
                href="https://t.me/pangenget_bot"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#656d4a] dark:text-[#a4ac86] hover:underline font-semibold"
              >
                <span>Buka @pangenget_bot</span>
                <ExternalLink size={12} />
              </a>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[#414833] dark:text-[#d3dbc3] leading-relaxed">
              <li>
                Buka bot Telegram <strong className="text-[#333d29] dark:text-[#f5f7f1]">@pangenget_bot</strong> lalu tekan tombol <strong className="text-[#333d29] dark:text-[#f5f7f1]">Start</strong>.
              </li>
              <li>
                Dapatkan ID Telegram Anda (misal via bot <code>@userinfobot</code>) lalu masukkan nomor ID tersebut di bawah.
              </li>
            </ol>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveSettings} className="space-y-4">
            {/* Telegram Chat ID */}
            <div>
              <label htmlFor="telegramChatId" className="block text-xs font-semibold text-[#333d29] dark:text-[#d3dbc3] mb-1.5">
                Telegram Chat ID <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  id="telegramChatId"
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="Contoh: 5391048527"
                  className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-[#d5dcce] dark:border-[#333d29] bg-white dark:bg-[#20261b] text-[#333d29] dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#656d4a]/20 focus:border-[#656d4a] transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !chatId.trim()}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#e8ecde] dark:bg-[#293121] text-[#333d29] dark:text-[#f5f7f1] border border-[#d3dbc3] dark:border-[#333d29] hover:bg-[#d3dbc3] dark:hover:bg-[#333d29] transition-all press-scale disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {isTesting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Menguji...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Tes Pesan</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                Pesan pengingat tugas akan dikirimkan langsung ke nomor ID ini.
              </p>
            </div>

            {/* Test Result Message Box */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  testResult.success
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                    : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Notification Toggles */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
                Pilihan Pengingat Tenggat
              </span>

              {/* Master Enable */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Bell size={16} className="text-sky-500" />
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">
                      Aktifkan Notifikasi Telegram
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Izinkan bot mengirim pengingat ke akun Anda
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={telegramEnabled}
                  onChange={(e) => setTelegramEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 accent-sky-500 cursor-pointer"
                />
              </label>

              {/* Sub-toggles */}
              <div className="pl-3 space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remind24h}
                    disabled={!telegramEnabled}
                    onChange={(e) => setRemind24h(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 accent-sky-500 cursor-pointer disabled:opacity-40"
                  />
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-neutral-400" />
                    <span><strong>Pengingat H-24 Jam</strong> (1 hari sebelum tenggat)</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remind1h}
                    disabled={!telegramEnabled}
                    onChange={(e) => setRemind1h(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-500 cursor-pointer disabled:opacity-40"
                  />
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-rose-500" />
                    <span><strong>Peringatan Mendesak H-1 Jam</strong> (1 jam sebelum tenggat)</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Error or Success Notice */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#333d29] hover:bg-[#414833] text-[#f5f7f1] transition-all press-scale disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Pengaturan</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="px-6 py-2.5 bg-neutral-50 dark:bg-neutral-900/80 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span>Chat ID disimpan aman di Neon Cloud DB</span>
          </div>
          <span className="font-mono text-[10px]">pangenget_bot v1.0</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
