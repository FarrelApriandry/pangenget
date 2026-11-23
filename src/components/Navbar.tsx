import { useState, useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { UserButton } from "./UserButton";
import { CheckSquare, Flame, CheckCircle2, Clock, FolderKanban, Archive } from "lucide-react";
import { getStreakData } from "../utils/streak";

interface NavbarProps {
  siteName?: string;
  currentPath?: string;
}

export function Navbar({ siteName = "Pangenget", currentPath = "/" }: NavbarProps) {
  const [streak, setStreak] = useState(0);
  const [activePath, setActivePath] = useState(currentPath);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setActivePath(window.location.pathname);
    }
    const s = getStreakData();
    setStreak(s.currentStreak);
  }, []);

  const navLinks = [
    { label: "Hari Ini", href: "/", icon: Clock },
    { label: "Mode Fokus", href: "/fokus", icon: CheckCircle2 },
    { label: "Kategori", href: "/kategori", icon: FolderKanban },
    { label: "Riwayat", href: "/riwayat", icon: Archive },
  ];

  const isLinkActive = (href: string) => {
    if (href === "/") return activePath === "/" || activePath === "";
    return activePath.startsWith(href);
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/75 dark:bg-neutral-900/75 backdrop-blur-md">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Identity */}
          <a href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <CheckSquare size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-neutral-900 dark:text-white block leading-none">
                {siteName}
              </span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium tracking-wide uppercase">
                Task Manager
              </span>
            </div>
          </a>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200/60 dark:border-neutral-700/60 text-xs font-semibold">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              const Icon = link.icon;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all press-scale ${
                    active
                      ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  <Icon size={14} className={active ? "text-emerald-500" : ""} />
                  <span>{link.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Right Controls: Streak, Theme & User Account */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {streak > 0 && (
              <a
                href="/riwayat"
                className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                title={`Streak aktif: ${streak} hari berturut-turut menyelesaikan tugas!`}
              >
                <Flame size={13} className="text-amber-500 fill-amber-500 animate-pulse" />
                <span>{streak} Hari</span>
              </a>
            )}

            <ThemeToggle />
            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-0.5" />
            <UserButton />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (iOS / Human Interface Guidelines style) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-t border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-around py-2 px-1 text-[11px] font-medium shadow-lg">
        {navLinks.map((link) => {
          const active = isLinkActive(link.href);
          const Icon = link.icon;
          return (
            <a
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all press-scale ${
                active
                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <Icon size={18} className={active ? "stroke-[2.5]" : "stroke-[1.75]"} />
              <span>{link.label}</span>
            </a>
          );
        })}
      </div>
    </>
  );
}
