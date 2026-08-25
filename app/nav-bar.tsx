"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Доска" },
  { href: "/study", label: "Тренировка" },
];

export function NavBar() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500" />
        <span className="font-semibold tracking-tight">Mentors Club</span>
      </div>
      <nav className="flex gap-1 rounded-full bg-white/5 border border-white/10 p-1">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-4 py-1.5 rounded-full text-sm transition ${
                active ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
