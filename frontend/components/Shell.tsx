"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import RightPanel from "./RightPanel";
import StatsBar from "./StatsBar";

const NAV = [
  { href: "/learn", label: "Learn", icon: "🏠" },
  { href: "/leaderboard", label: "Leaderboards", icon: "🏆" },
  { href: "/vault", label: "Mistakes Vault", icon: "🧠" },
  { href: "/profile", label: "Profile", icon: "👤" },
  { href: "/settings", label: "More", icon: "⚙️" },
];

// Lesson screens are full-screen (no sidebar), like the real app
const FULLSCREEN = ["/lesson", "/practice"];

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (FULLSCREEN.some((p) => pathname.startsWith(p))) return <>{children}</>;

  return (
    <>
      <aside className="sidebar">
        <Link href="/learn" className="logo">duolingo</Link>
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`nav-item ${pathname.startsWith(n.href) ? "active" : ""}`}
          >
            <span className="nav-icon">{n.icon}</span>
            <span className="nav-text">{n.label}</span>
          </Link>
        ))}
      </aside>
      <div className="content">
        <main className="main">
          <div className="mobile-stats"><StatsBar /></div>
          {children}
        </main>
        <aside className="right"><RightPanel /></aside>
      </div>
    </>
  );
}