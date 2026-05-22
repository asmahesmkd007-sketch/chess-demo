"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[var(--sidebar-w)]">
        <header className="h-[var(--topbar-h)] border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] sticky top-0 z-40 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="font-space text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Dashboard
            </h1>
            <div className="flex items-center gap-2 bg-[var(--error-bg)] border border-[var(--error)]/20 px-3 py-1 rounded-full text-[10px] text-[var(--error)] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--error)] animate-pulse" />
              LIVE RADAR
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-[var(--gold-dim)] border border-[var(--gold)]/20 px-4 py-1.5 rounded-full text-[11px] font-bold text-[var(--gold)]">
              PX-000001
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--gold)] font-bold">
              P
            </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
