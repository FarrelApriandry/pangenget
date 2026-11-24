import { useState, useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { UserButton } from "./UserButton";
import { Flame, CheckCircle2, Clock, FolderKanban, Archive, Calendar } from "lucide-react";
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
    { label: "Kalender", href: "/kalender", icon: Calendar },
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
      <header className="sticky top-0 z-40 w-full border-b border-[#d5dcce]/80 dark:border-[#333d29]/80 bg-[#f7f8f4]/85 dark:bg-[#161a12]/85 backdrop-blur-md">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 lg:h-18 flex items-center justify-between">
          {/* Brand Identity */}
          <a href="/" className="flex items-center gap-2.5 group shrink-0">
            <img
              src="/logo-64.png"
              alt="Logo Pangenget"
              width="36"
              height="36"
              className="w-8 h-8 lg:w-9 lg:h-9 object-contain shadow-xs transition-transform group-hover:scale-105"
            />
            <div>
              <span className="font-extrabold text-base lg:text-lg tracking-tight text-[#333d29] dark:text-[#f5f7f1] block leading-none">
                {siteName}
              </span>
              <span className="text-[10px] lg:text-xs text-[#656d4a] dark:text-[#a4ac86] font-semibold tracking-wide uppercase">
                Task Manager
              </span>
            </div>
          </a>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden sm:flex items-center gap-1 p-1 lg:p-1.5 rounded-xl bg-[#e8ecde]/70 dark:bg-[#20261b]/90 border border-[#d3dbc3]/70 dark:border-[#333d29] text-xs lg:text-sm font-semibold">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              const Icon = link.icon;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 lg:px-3.5 py-1.5 lg:py-2 rounded-lg transition-all press-scale ${
                    active
                      ? "bg-white dark:bg-[#293121] text-[#333d29] dark:text-[#f5f7f1] shadow-xs font-bold"
                      : "text-[#656d4a] dark:text-[#bcc7a6] hover:text-[#333d29] dark:hover:text-white"
                  }`}
                >
                  <Icon size={15} className={`shrink-0 ${active ? "text-[#656d4a] dark:text-[#a4ac86]" : ""}`} />
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
                className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#e8ecde] text-[#414833] dark:text-[#d3dbc3] dark:bg-[#20261b] border border-[#d3dbc3] dark:border-[#333d29] hover:bg-[#d3dbc3]/60 transition-colors"
                title={`Streak aktif: ${streak} hari berturut-turut menyelesaikan tugas!`}
              >
                <Flame size={13} className="text-[#656d4a] dark:text-[#a4ac86] fill-[#656d4a] dark:fill-[#a4ac86] animate-pulse" />
                <span>{streak} Hari</span>
              </a>
            )}

            <ThemeToggle />
            <div className="h-4 w-px bg-[#d5dcce] dark:bg-[#333d29] mx-0.5" />
            <UserButton />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (iOS / Human Interface Guidelines style) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#f7f8f4]/92 dark:bg-[#161a12]/92 backdrop-blur-md border-t border-[#d5dcce]/80 dark:border-[#333d29]/80 flex items-center justify-around py-2 px-1 text-[11px] font-medium shadow-lg">
        {navLinks.map((link) => {
          const active = isLinkActive(link.href);
          const Icon = link.icon;
          return (
            <a
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all press-scale ${
                active
                  ? "text-[#333d29] dark:text-[#a4ac86] font-bold"
                  : "text-[#656d4a] dark:text-[#bcc7a6] hover:text-[#333d29] dark:hover:text-white"
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
