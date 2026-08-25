import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { NavBar } from "./nav-bar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mentors Club",
  description: "Тренажёр вопросов с собеседований",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0b0b12] text-white">
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#1a1030] via-[#0b0b12] to-[#0b1a2a]" />
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(139,92,246,0.18),transparent_45%),radial-gradient(circle_at_80%_100%,rgba(56,189,248,0.14),transparent_45%)]" />
        <Providers>
          <NavBar />
          <main className="flex-1 flex flex-col">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
