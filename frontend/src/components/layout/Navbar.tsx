
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User as UserIcon,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { cn } from "@/lib/cn";

const navLinks = [
  { label: "HOME", href: "/" },
  { label: "ABOUT", href: "/about" },
  { label: "PROGRAMS", href: "/programs" },
  { label: "CONSULT", href: "/consult" },
  { label: "SHOP", href: "/shop" },
  { label: "TEAM", href: "/team" },
  { label: "BLOG", href: "/blog" },
];

export default function Navbar() {
  const pathname = useLocation().pathname;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const cartCount = useCart((s) => s.cartCount);
  const hydrated = useCart((s) => s.hydrated);
  const { isAuthenticated, user, signOut } = useAuth();
  const trial = useTrialStatus();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!accountOpen) return;
    // Use `click` (not `mousedown`) so React's own onClick handlers on items
    // inside the dropdown fire FIRST. With mousedown we were closing the
    // dropdown before the Sign Out button's onClick could execute — the
    // unmount cancelled the click event entirely.
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountOpen(false);
    };
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onEsc);
    };
  }, [accountOpen]);

  useEffect(() => {
    setAccountOpen(false);
  }, [pathname]);

  const userInitial = (
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email ||
    "U"
  )
    .trim()
    .charAt(0)
    .toUpperCase();
  const userDisplayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Account";

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

  // Context-aware primary CTA. New visitors see "Start 7-Day Trial"; active
  // members go straight to their dashboard; users in the post-trial window
  // are nudged to continue. Trial state hasn't loaded yet → keep the default.
  const primaryCta = !trial.loading && trial.hasTrial
    ? trial.trialIsComplete
      ? { href: "/continue", label: "VIEW CONTINUATION", short: "CONTINUE" }
      : { href: "/dashboard", label: "MY DASHBOARD", short: "DASHBOARD" }
    : { href: "/programs/trial", label: "START 7-DAY TRIAL", short: "TRY FREE" };

  return (
    <>
      {/* Top tagline bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-[#E8192C] py-1.5">
        <p className="text-center font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-white">
          &ldquo;Practical Advice For Your Real World Goals&rdquo;
        </p>
      </div>

      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed top-[28px] left-0 right-0 z-50 transition-colors duration-300",
          scrolled
            ? "bg-[#050505]/92 backdrop-blur-md border-b border-[#1a1a1a]"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 md:h-20 md:px-10">
          <Link to="/" className="flex items-center" aria-label="BigRonJones home">
            <img
              src="/assets/bigronjones-logo.png"
              alt="BIGRONJONES®"
              className="h-7 sm:h-8 md:h-10 w-auto select-none mix-blend-screen"
              draggable={false}
            />
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            {navLinks.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "relative font-['DM_Mono'] text-[10px] tracking-[0.25em] uppercase transition-colors",
                    active ? "text-white" : "text-white/50 hover:text-white"
                  )}
                >
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      className="absolute -bottom-2 left-0 right-0 h-[1px] bg-[#E8192C]"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/checkout"
              aria-label="View cart"
              className="relative p-2 text-white/70 transition-colors hover:text-white"
            >
              <ShoppingBag size={18} />
              {hydrated && cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#E8192C] font-['DM_Mono'] text-[9px] text-white"
                >
                  {cartCount}
                </motion.span>
              )}
            </Link>

            {isAuthenticated ? (
              <div ref={accountRef} className="relative hidden lg:block">
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8192C]/40 bg-[#E8192C]/15 transition-colors hover:bg-[#E8192C]/25"
                >
                  <span className="font-['Bebas_Neue'] text-sm leading-none text-white">
                    {userInitial}
                  </span>
                </button>
                <AnimatePresence>
                  {accountOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-3 w-72 border border-[#1a1a1a] bg-[#0a0a0a] py-2 shadow-2xl"
                    >
                      {/* Header — name + email + program badge */}
                      <div className="border-b border-[#1a1a1a] px-4 py-3">
                        <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/35">
                          Signed in as
                        </p>
                        <p className="mt-1 truncate font-['DM_Sans'] text-sm text-white">
                          {userDisplayName}
                        </p>
                        {trial.hasTrial && trial.programType && (
                          <span className="mt-2 inline-flex items-center gap-1 border border-[#E8192C]/40 bg-[#E8192C]/[0.10] px-2 py-1 font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-[#E8192C]">
                            <Sparkles size={10} />
                            {trial.programType === "mens"
                              ? "Men's Program"
                              : trial.programType === "womens"
                                ? "Women's Program"
                                : "Oversight Member"}
                          </span>
                        )}
                      </div>

                      {/* Admin section — visible only when the signed-in user
                          has role=admin or role=super_admin (read from /api/me
                          via useTrialStatus). Placed above member content so
                          the workspace is one click away. */}
                      {trial.isAdmin && (
                        <div className="border-b border-[#1a1a1a] py-2">
                          <Link
                            to="/admin"
                            onClick={() => setAccountOpen(false)}
                            className="mx-2 my-1 flex items-center justify-between gap-3 border border-[#E8192C]/40 bg-[#E8192C]/10 px-3 py-3 transition-colors hover:bg-[#E8192C]/20"
                          >
                            <span className="flex items-center gap-2 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white">
                              <ShieldCheck size={14} />
                              Admin Dashboard
                            </span>
                            <span className="font-['DM_Mono'] text-[9px] tracking-wider text-[#E8192C]">
                              {trial.role === "super_admin" ? "SUPER" : "ADMIN"}
                            </span>
                          </Link>
                          <Link
                            to="/admin/content"
                            onClick={() => setAccountOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/60 transition-colors hover:bg-[#111] hover:text-white"
                          >
                            <LayoutDashboard size={12} />
                            Manage Content
                          </Link>
                          <Link
                            to="/admin/leads"
                            onClick={() => setAccountOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/60 transition-colors hover:bg-[#111] hover:text-white"
                          >
                            <UserIcon size={12} />
                            View Leads
                          </Link>
                        </div>
                      )}

                      {/* Members-only section — paid users see a prominent
                          dashboard CTA as the first item. Hidden entirely for
                          non-purchasers, so the only path to enrollment for
                          them is the "Start 7-Day Trial" link below. */}
                      {trial.hasTrial && (
                        <div className="border-b border-[#1a1a1a] py-2">
                          <Link
                            to="/dashboard"
                            onClick={() => setAccountOpen(false)}
                            className="mx-2 my-1 flex items-center justify-between gap-3 border border-[#E8192C]/40 bg-[#E8192C]/10 px-3 py-3 transition-colors hover:bg-[#E8192C]/20"
                          >
                            <span className="flex items-center gap-2 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white">
                              <LayoutDashboard size={14} />
                              Open Dashboard
                            </span>
                            {trial.trialDay && !trial.trialIsComplete && (
                              <span className="font-['DM_Mono'] text-[9px] tracking-wider text-[#E8192C]">
                                Day {trial.trialDay}/7
                              </span>
                            )}
                          </Link>
                          {!trial.hasBookedCalendly && (
                            <a
                              href="https://calendly.com/bigronjonesllc/discovery-call"
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => setAccountOpen(false)}
                              className="flex items-center gap-2 px-4 py-2.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/60 transition-colors hover:bg-[#111] hover:text-white"
                            >
                              <Calendar size={12} />
                              Book Activation Call
                            </a>
                          )}
                          {trial.trialIsComplete && (
                            <Link
                              to="/continue"
                              onClick={() => setAccountOpen(false)}
                              className="flex items-center gap-2 px-4 py-2.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-[#E8192C] transition-colors hover:bg-[#111]"
                            >
                              <CheckCircle2 size={12} />
                              View Continuation
                            </Link>
                          )}
                        </div>
                      )}

                      {/* Account section */}
                      <Link
                        to="/checkout"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/60 transition-colors hover:bg-[#111] hover:text-white"
                      >
                        <ShoppingBag size={12} />
                        Cart & Orders
                      </Link>
                      {!trial.hasTrial && (
                        <Link
                          to="/programs/trial"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-[#E8192C] transition-colors hover:bg-[#111]"
                        >
                          <UserIcon size={12} />
                          Start 7-Day Trial · $149
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Synchronously nuke any cached session so the
                          // user is signed out from the browser's POV
                          // before we navigate — even if supabase's network
                          // call hangs. The async signOut() below revokes
                          // the refresh token server-side in the background.
                          try {
                            const stale: string[] = [];
                            for (let i = 0; i < localStorage.length; i++) {
                              const k = localStorage.key(i);
                              if (
                                k &&
                                (k.startsWith("sb-") || k.startsWith("brj."))
                              ) {
                                stale.push(k);
                              }
                            }
                            stale.forEach((k) => localStorage.removeItem(k));
                          } catch {
                            // localStorage can be disabled — non-fatal
                          }
                          signOut().catch((err) =>
                            console.error("[signOut] failed:", err),
                          );
                          // Hard navigation guarantees every hook + cached
                          // protected-route state resets cleanly.
                          window.location.assign("/");
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/60 transition-colors hover:bg-[#111] hover:text-[#E8192C]"
                      >
                        <LogOut size={12} />
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/auth/login"
                className="hidden items-center border border-[#1c1c1c] px-4 py-2.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/60 transition-colors hover:border-[#E8192C] hover:text-white lg:inline-flex"
              >
                SIGN IN
              </Link>
            )}

            <Link
              to={primaryCta.href}
              className="hidden items-center bg-[#E8192C] px-5 py-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#b50f1f] lg:inline-flex"
            >
              {primaryCta.label}
            </Link>

            {/* Mobile-only compact CTA so the primary action never disappears */}
            <Link
              to={primaryCta.href}
              className="hidden items-center bg-[#E8192C] px-3 py-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#b50f1f] sm:inline-flex lg:hidden"
            >
              {primaryCta.short}
            </Link>

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center border border-[#1a1a1a] text-white lg:hidden"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#050505]"
          >
            <div className="flex h-16 items-center justify-between border-b border-[#1a1a1a] px-6">
              <Link to="/" onClick={() => setOpen(false)} className="flex items-center" aria-label="BigRonJones home">
                <img
                  src="/assets/bigronjones-logo.png"
                  alt="BIGRONJONES®"
                  className="h-8 w-auto select-none mix-blend-screen"
                  draggable={false}
                />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center border border-[#1a1a1a] text-white"
              >
                <X size={18} />
              </button>
            </div>

            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
              className="flex flex-col gap-3 px-6 py-10"
            >
              {navLinks.map((item) => {
                const active = isActive(item.href);
                return (
                  <motion.li
                    key={item.href}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                      },
                    }}
                  >
                    <Link
                      to={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block font-['Bebas_Neue'] text-5xl tracking-wide transition-colors",
                        active ? "text-[#E8192C]" : "text-white hover:text-[#E8192C]"
                      )}
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                );
              })}
              <motion.li
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
                className="mt-6 flex flex-col gap-3"
              >
                <Link
                  to={primaryCta.href}
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center bg-[#E8192C] px-6 py-4 font-['DM_Mono'] text-xs uppercase tracking-[0.15em] text-white"
                >
                  {primaryCta.label}
                </Link>
                {/* Admin-only — quick path into the admin workspace on mobile. */}
                {isAuthenticated && trial.isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-between gap-3 self-start border border-[#E8192C]/40 bg-[#E8192C]/10 px-6 py-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck size={14} />
                      Admin Dashboard
                    </span>
                    <span className="text-[#E8192C]">
                      {trial.role === "super_admin" ? "SUPER" : "ADMIN"}
                    </span>
                  </Link>
                )}
                {/* Members-only — a second clear path to the trial dashboard
                    on mobile, so paid users don't have to hunt for it. */}
                {isAuthenticated && trial.hasTrial && (
                  <Link
                    to="/dashboard"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-between gap-3 self-start border border-[#E8192C]/40 bg-[#E8192C]/10 px-6 py-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white"
                  >
                    <span className="flex items-center gap-2">
                      <LayoutDashboard size={14} />
                      My Dashboard
                    </span>
                    {trial.trialDay && !trial.trialIsComplete && (
                      <span className="text-[#E8192C]">
                        Day {trial.trialDay}/7
                      </span>
                    )}
                  </Link>
                )}
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      try {
                        const stale: string[] = [];
                        for (let i = 0; i < localStorage.length; i++) {
                          const k = localStorage.key(i);
                          if (
                            k &&
                            (k.startsWith("sb-") || k.startsWith("brj."))
                          ) {
                            stale.push(k);
                          }
                        }
                        stale.forEach((k) => localStorage.removeItem(k));
                      } catch {
                        // ignore
                      }
                      signOut().catch((err) =>
                        console.error("[signOut] failed:", err),
                      );
                      window.location.assign("/");
                    }}
                    className="inline-flex items-center self-start border border-[#1c1c1c] px-6 py-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/70 transition-colors hover:border-[#E8192C] hover:text-white"
                  >
                    Sign out
                  </button>
                ) : (
                  <Link
                    to="/auth/login"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center self-start border border-[#1c1c1c] px-6 py-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/70 transition-colors hover:border-[#E8192C] hover:text-white"
                  >
                    Sign in
                  </Link>
                )}
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
