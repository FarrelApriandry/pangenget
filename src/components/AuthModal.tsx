import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { authClient, setStoredUser, type AuthUser } from "../lib/auth";
import {
  X,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  HeartHandshake,
  Send,
  ExternalLink,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "signin" | "contact";
}

const TARGET_CREATOR_EMAIL = "fapriandry@gmail.com";

export function AuthModal({ isOpen, onClose, defaultMode = "signin" }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "contact">(defaultMode);

  // Sign In State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Contact / Request Access State (2 Inputs)
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastSentMailto, setLastSentMailto] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setMode(defaultMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setLastSentMailto(null);
  }, [defaultMode, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Lock body scroll while modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 80);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, mode]);

  if (!isOpen || !isMounted) return null;

  // Handle Login
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Format email tidak valid.");
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage("Kata sandi minimal 6 karakter.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authClient.signIn.email({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (res.error) {
        throw new Error(res.error.message || "Email atau kata sandi salah.");
      }

      const userObj: AuthUser = {
        id: res.data?.user?.id || (res.data as any)?.id || "user_" + Date.now(),
        email: res.data?.user?.email || cleanEmail,
        name: res.data?.user?.name || cleanEmail.split("@")[0] || "Pengguna",
      };

      setStoredUser(userObj);
      setSuccessMessage("Berhasil masuk! Memuat workspace Pangenget Anda...");
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan pada server autentikasi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Contact / Minta Akses (Kirim ke fapriandry@gmail.com)
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLastSentMailto(null);

    const cleanContactEmail = contactEmail.trim().toLowerCase();
    const cleanContactMessage = contactMessage.trim();

    if (!cleanContactEmail || !cleanContactEmail.includes("@")) {
      setErrorMessage("Silakan masukkan alamat email yang valid.");
      return;
    }

    if (!cleanContactMessage) {
      setErrorMessage("Detail pesan tidak boleh kosong.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanContactEmail,
          message: cleanContactMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirimkan pesan.");
      }

      // Generate mailto link as backup / immediate dispatch
      const mailtoSubject = encodeURIComponent(`[Pangenget] Permintaan Akses dari ${cleanContactEmail}`);
      const mailtoBody = encodeURIComponent(
        `Halo Fapri,\n\nSaya ingin meminta akses akun Pangenget:\n\nEmail Pengguna: ${cleanContactEmail}\n\nDetail Pesan:\n${cleanContactMessage}\n\nTerima kasih!`
      );
      const mailtoUrl = `mailto:${TARGET_CREATOR_EMAIL}?subject=${mailtoSubject}&body=${mailtoBody}`;
      setLastSentMailto(mailtoUrl);

      setSuccessMessage(`Pesan permintaan akses berhasil dikirimkan ke ${TARGET_CREATOR_EMAIL}!`);
      setContactMessage("");
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal mengirimkan pesan. Silakan coba kembali.");
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-neutral-950/70 backdrop-blur-sm animate-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md my-auto bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-modal-content text-neutral-900 dark:text-neutral-100"
      >
        {/* SaaS Friends 0-Payment Header */}
        <div className="bg-gradient-to-r from-[#333d29] via-[#414833] to-[#333d29] px-6 py-5 text-[#f5f7f1] relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center">
                <HeartHandshake size={20} className="text-[#f5f7f1]" />
              </span>
              <div>
                <h3 id="auth-modal-title" className="font-extrabold text-base tracking-tight text-[#f5f7f1] leading-tight">
                  Pangenget Sahabat Cloud
                </h3>
                <p className="text-xs text-[#d3dbc3] font-medium mt-0.5">
                  0-Payment SaaS • Akses Penuh Gratis untuk Sahabat
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label="Tutup jendela"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-[#e8ecde]/60 dark:bg-[#20261b] border border-[#d3dbc3] dark:border-[#333d29] p-1 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === "signin"
                  ? "bg-[#333d29] text-[#f5f7f1] dark:bg-[#f5f7f1] dark:text-[#333d29] shadow-xs"
                  : "text-[#656d4a] dark:text-[#a4ac86] hover:text-[#333d29] dark:hover:text-white"
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("contact");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === "contact"
                  ? "bg-[#333d29] text-[#f5f7f1] dark:bg-[#f5f7f1] dark:text-[#333d29] shadow-xs"
                  : "text-[#656d4a] dark:text-[#a4ac86] hover:text-[#333d29] dark:hover:text-white"
              }`}
            >
              Minta Akses (Kontak)
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2.5">
              <span className="font-bold shrink-0 text-sm leading-none mt-0.5">!</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold">{successMessage}</span>
              </div>
              {lastSentMailto && (
                <div className="pt-1">
                  <a
                    href={lastSentMailto}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors"
                  >
                    <span>Buka Aplikasi Email / Gmail</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Mode 1: Sign In (Masuk) */}
          {mode === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
                  />
                  <input
                    ref={firstInputRef}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#333d29] hover:bg-[#414833] active:bg-[#293121] text-[#f5f7f1] font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all press-scale disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Pangenget</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setMode("contact")}
                  className="text-[11px] text-[#656d4a] dark:text-[#a4ac86] hover:underline cursor-pointer"
                >
                  Belum punya akun? Hubungi pembuat untuk akses gratis
                </button>
              </div>
            </form>
          )}

          {/* Mode 2: Contact Creator (Minta Akses ke fapriandry@gmail.com) */}
          {mode === "contact" && (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#e8ecde]/60 dark:bg-[#20261b] border border-[#d3dbc3] dark:border-[#333d29] text-xs text-[#333d29] dark:text-[#d3dbc3]">
                <p className="font-semibold text-[#333d29] dark:text-[#f5f7f1] mb-0.5">
                  Hubungi Pembuat ({TARGET_CREATOR_EMAIL})
                </p>
                <p className="text-[11px] text-[#414833]/80 dark:text-[#a4ac86]/80">
                  Pangenget khusus untuk sahabat dan tim terdekat. Kirim pesan di bawah untuk mendapatkan akun akses penuh gratis.
                </p>
              </div>

              {/* Input 1: Email Pengguna */}
              <div>
                <label className="block text-xs font-bold text-[#333d29] dark:text-[#d3dbc3] mb-1.5">
                  Email Pengguna
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#656d4a] dark:text-[#a4ac86]"
                  />
                  <input
                    ref={firstInputRef}
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="nama.anda@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d5dcce] dark:border-[#333d29] bg-white dark:bg-[#20261b] text-sm text-[#333d29] dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-[#656d4a] transition-all"
                  />
                </div>
              </div>

              {/* Input 2: Detail Pesan */}
              <div>
                <label className="block text-xs font-bold text-[#333d29] dark:text-[#d3dbc3] mb-1.5">
                  Detail Pesan
                </label>
                <div className="relative">
                  <textarea
                    required
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Halo Fapri, ini [Nama Anda]. Boleh minta akses akun untuk mencoba Pangenget?"
                    className="w-full p-3 rounded-xl border border-[#d5dcce] dark:border-[#333d29] bg-white dark:bg-[#20261b] text-sm text-[#333d29] dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-[#656d4a] transition-all resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#333d29] hover:bg-[#414833] active:bg-[#293121] text-[#f5f7f1] font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all press-scale disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Mengirimkan Pesan...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Kirim ke {TARGET_CREATOR_EMAIL}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Guarantee */}
          <div className="mt-5 pt-4 border-t border-[#d5dcce]/60 dark:border-[#333d29]/60 text-[11px] text-[#656d4a] dark:text-[#a4ac86] flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck size={14} className="text-[#656d4a] dark:text-[#a4ac86]" />
              Kontak Langsung Pembuat
            </span>
            <span className="font-bold text-[#333d29] dark:text-[#f5f7f1]">
              100% Bebas Biaya
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
