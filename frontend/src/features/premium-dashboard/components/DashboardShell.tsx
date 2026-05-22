import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Menu,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Overview", href: "#overview", icon: LayoutDashboard },
  { label: "Modules", href: "#modules", icon: CalendarDays },
  { label: "Feedback", href: "#feedback", icon: MessageSquare },
  { label: "Analytics", href: "#analytics", icon: BarChart3 },
];

export default function DashboardShell({
  userName,
  role,
  children,
}: {
  userName: string;
  role: string;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#040404] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(245,215,123,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(232,185,74,0.08),transparent_28%)]" />
      <header className="sticky top-0 z-50 border-b border-[#2a2417] bg-[#040404]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#f5d77b]/25 bg-[#f5d77b]/10 text-[#f5d77b] shadow-[0_0_24px_rgba(245,215,123,0.2)]">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="font-['Bebas_Neue'] text-2xl leading-none tracking-[0.14em]">
                BIGRONJONES
              </p>
              <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.32em] text-[#f5d77b]/75">
                Premium Oversight
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-white/60 transition-colors hover:text-[#f5d77b]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-[#f5d77b]/20 bg-[#f5d77b]/10 px-4 py-2 text-right lg:block">
              <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.28em] text-[#f5d77b]/70">
                {role}
              </p>
              <p className="text-sm text-white">{userName}</p>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#2a2417] bg-white/5 lg:hidden"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-[#2a2417] px-4 py-4 lg:hidden">
            <div className="grid gap-2">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl border border-[#2a2417] bg-white/5 px-4 py-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-white/70"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-8">
        <aside className="hidden rounded-3xl border border-[#2a2417] bg-[#080808]/90 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.25)] lg:block">
          <div className="mb-5 rounded-2xl border border-[#f5d77b]/15 bg-[#f5d77b]/8 px-4 py-4">
            <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.28em] text-[#f5d77b]/70">
              Member access
            </p>
            <p className="mt-1 text-sm text-white/85">
              Trial dashboard unlocked
            </p>
          </div>
          <div className="space-y-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-white/65 transition-colors hover:border-[#f5d77b]/20 hover:bg-white/5 hover:text-white"
              >
                <item.icon size={16} className="text-[#f5d77b]" />
                <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.22em]">
                  {item.label}
                </span>
              </a>
            ))}
          </div>
        </aside>

        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
