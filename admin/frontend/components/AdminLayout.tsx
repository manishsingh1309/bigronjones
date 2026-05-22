import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  PlusCircle,
  LogOut,
  Home as HomeIcon,
  Activity,
  Menu,
  MessageSquare,
  X,
} from "lucide-react";
import AdminGuard from "./AdminGuard";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", to: "/admin" },
  { icon: Activity, label: "Trial", to: "/admin/trial" },
  { icon: Users, label: "Trial Users", to: "/admin/trial/users" },
  { icon: MessageSquare, label: "Feedback", to: "/admin/trial/feedback" },
  { icon: FileText, label: "Content", to: "/admin/content" },
  { icon: Users, label: "Leads", to: "/admin/leads" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  // Mobile drawer: closed by default, opened via hamburger, auto-closed on
  // route change (so navigating between sections feels native on phones).
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);
  // Prevent body scroll when the drawer is open on mobile.
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [drawerOpen]);

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#050505] lg:flex">
        {/* Mobile top bar — only visible <lg. Includes hamburger + section
            shortcut. The sidebar slides in over this on tap. */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#1c1c1c] bg-[#050505]/95 backdrop-blur px-4 py-3 lg:hidden">
          <button
            type="button"
            aria-label="Open admin menu"
            onClick={() => setDrawerOpen(true)}
            className="-ml-2 p-2 text-white/70 hover:text-white"
          >
            <Menu size={20} />
          </button>
          <Link to="/admin" className="flex items-center gap-2">
            <span className="font-['Bebas_Neue'] text-white text-[16px] tracking-[0.15em]">
              BIGRONJONES
              <sup style={{ fontSize: "0.42em", verticalAlign: "super", lineHeight: 0 }}>®</sup>
            </span>
            <span className="font-['DM_Mono'] text-[8px] tracking-[0.2em] text-[#E8192C]">
              ADMIN
            </span>
          </Link>
          <Link
            to="/admin/content/new"
            aria-label="New content"
            className="-mr-2 p-2 text-[#E8192C] hover:text-white"
          >
            <PlusCircle size={20} />
          </Link>
        </header>

        {/* Backdrop — visible only when drawer is open on mobile */}
        {drawerOpen && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Sidebar — fixed drawer on mobile, static rail on lg+ */}
        <aside
          className={
            "fixed z-50 top-0 left-0 h-screen w-[260px] bg-[#0a0a0a] border-r border-[#1c1c1c] flex flex-col transform transition-transform duration-200 ease-out " +
            (drawerOpen ? "translate-x-0" : "-translate-x-full") +
            " lg:static lg:z-auto lg:h-auto lg:min-h-screen lg:w-[240px] lg:shrink-0 lg:translate-x-0"
          }
        >
          <div className="p-6 border-b border-[#1c1c1c] flex items-start justify-between gap-3">
            <Link to="/" className="block">
              <p className="font-['Bebas_Neue'] text-white text-[18px] tracking-[0.15em]">
                BIGRONJONES
                <sup
                  style={{
                    fontSize: "0.42em",
                    verticalAlign: "super",
                    lineHeight: 0,
                  }}
                >
                  ®
                </sup>
              </p>
              <p className="font-['DM_Mono'] text-[9px] tracking-[0.2em] text-[#E8192C] mt-1">
                ADMIN PORTAL
              </p>
            </Link>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="-mr-1 p-1 text-white/40 hover:text-white lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(({ icon: Icon, label, to }) => {
              const active =
                pathname === to ||
                (to !== "/admin" && pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={[
                    "flex items-center gap-3 px-4 py-3 font-['DM_Sans'] text-sm transition-all",
                    active
                      ? "bg-[#E8192C]/15 text-white border-l-2 border-[#E8192C]"
                      : "text-white/40 hover:text-white hover:bg-white/5 border-l-2 border-transparent",
                  ].join(" ")}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[#1c1c1c]">
            <Link
              to="/admin/content/new"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#E8192C] text-white font-['DM_Mono'] text-[10px] tracking-[0.15em] uppercase hover:bg-[#b50f1f] transition-colors"
            >
              <PlusCircle size={14} />
              New Content
            </Link>
          </div>

          <div className="px-4 pb-4 space-y-2">
            {user?.email && (
              <p
                className="font-['DM_Mono'] text-[9px] tracking-[0.15em] text-white/30 truncate"
                title={user.email}
              >
                {user.email}
              </p>
            )}
            <Link
              to="/"
              className="flex items-center gap-2 py-2 text-white/30 font-['DM_Mono'] text-[10px] tracking-[0.15em] uppercase hover:text-white/60 transition-colors"
            >
              <HomeIcon size={12} />
              Site Home
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-2 py-2 text-white/30 font-['DM_Mono'] text-[10px] tracking-[0.15em] uppercase hover:text-white/60 transition-colors"
            >
              <LogOut size={12} />
              Sign Out
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </AdminGuard>
  );
}
