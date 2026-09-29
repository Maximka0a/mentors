"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

const tabs = [
  { href: "/", label: "Темы", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/study", label: "Тренировка", icon: "M4 5h16v14H4zM8 9h8M8 13h5" },
  { href: "/mock", label: "Собес", icon: "M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4" },
  { href: "/stats", label: "Статистика", icon: "M5 20V10M12 20V4M19 20v-7" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export function NavBar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 px-4 h-14">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-accent-fg text-sm">M</span>
            Mentors Club
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  isActive(t.href) ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      {/* Bottom tab bar on phones: reachable with the thumb */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t border-line bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${
                isActive(t.href) ? "text-accent" : "text-faint"
              }`}
            >
              <Icon d={t.icon} />
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
