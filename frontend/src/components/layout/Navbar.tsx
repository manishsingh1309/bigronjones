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
import { track } from "@/lib/track";

const navLinks = [
  { label: "HOME", href: "/" },
  { label: "MEN'S COACHING", href: "/programs/mens" },
  { label: "WOMEN'S COACHING", href: "/programs/womens" },
  { label: "7-DAY TRIAL", href: "/programs/trial" },
  { label: "CONSULT", href: "/consult" },
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
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node)
      ) {
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
  const primaryCta =
    !trial.loading && trial.hasTrial
      ? trial.trialIsComplete
        ? { href: "/continue", label: "VIEW CONTINUATION", short: "CONTINUE" }
        : { href: "/dashboard", label: "MY DASHBOARD", short: "DASHBOARD" }
      : {
          href: "/programs/trial",
          label: "START NOW",
          short: "START MY 7 DAY TRIAL",
        };

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
            : "bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 md:h-20 md:px-10">
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 sm:gap-3"
            aria-label="BigRonJones home"
          >
            {/* Brand avatar — circular Ron headshot, LEFT of the wordmark */}
            <img
              src="/images/ron/bigronjones.jpg"
              alt="Big Ron Jones"
              className="h-8 w-8 select-none rounded-full border border-[#E8192C]/60 object-cover object-center sm:h-9 sm:w-9 md:h-10 md:w-10"
              draggable={false}
            />
            <img
              src="/assets/bigronjones-logo.png"
              alt="BIGRONJONES®"
              className="h-7 sm:h-8 md:h-10 w-auto select-none mix-blend-screen"
              draggable={false}
            />
          </Link>

          <div className="hidden items-center gap-7 xl:flex">
            {navLinks.map((item) => {
              const active = isActive(item.href);
              const external = /^https?:\/\//i.test(item.href);
              const linkClass = cn(
                "relative font-['DM_Mono'] text-[10px] tracking-[0.25em] uppercase transition-colors",
                active ? "text-white" : "text-white/50 hover:text-white",
              );
              const inner = (
                <>
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                      className="absolute -bottom-2 left-0 right-0 h-[1px] bg-[#E8192C]"
                    />
                  )}
                </>
              );
              // Any external nav target (absolute https URL) must use a real
              // anchor — react-router's <Link> would treat it as an in-app
              // path and dump the user on the 404 page.
              return external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className={linkClass}
                >
                  {inner}
                </a>
              ) : (
                <Link key={item.href} to={item.href} className={linkClass}>
                  {inner}
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
              <div ref={accountRef} className="relative hidden xl:block">
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
                className="hidden items-center border border-[#1c1c1c] px-4 py-2.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/60 transition-colors hover:border-[#E8192C] hover:text-white xl:inline-flex"
              >
                SIGN IN
              </Link>
            )}

            <Link
              to={primaryCta.href}
              onClick={() =>
                track("cta_click", {
                  event_label: "navbar_primary",
                  cta: primaryCta.label,
                })
              }
              className="hidden items-center bg-[#E8192C] px-5 py-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#b50f1f] xl:inline-flex"
            >
              {primaryCta.label}
            </Link>

            {/* Mobile-only compact CTA so the primary action never disappears */}
            <Link
              to={primaryCta.href}
              className="hidden items-center bg-[#E8192C] px-3 py-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#b50f1f] sm:inline-flex xl:hidden"
            >
              {primaryCta.short}
            </Link>

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center border border-[#1a1a1a] text-white xl:hidden"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Premium Full-Screen Mobile Navigation */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="fullscreen-mobile-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[60] flex flex-col bg-black xl:hidden"
            style={{
              background:
                "radial-gradient(ellipse 80% 80% at 50% 0%, rgba(232,25,44,0.08) 0%, transparent 60%), linear-gradient(180deg, rgba(10,10,10,1) 0%, rgba(5,5,5,1) 100%)",
            }}
          >
            {/* Header with Logo and Close */}
            <div className="flex h-20 items-center justify-between border-b border-white/5 px-6">
              <Link
                to="/"
                onClick={() => {
                  setOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex items-center gap-2.5"
                aria-label="BigRonJones home"
              >
                <img
                  src="/images/ron/bigronjones.jpg"
                  alt="Big Ron Jones"
                  className="h-9 w-9 select-none rounded-full border border-[#E8192C]/60 object-cover object-center"
                  draggable={false}
                />
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
                className="flex h-10 w-10 items-center justify-center text-white/70 transition-all duration-300 hover:text-white"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            {/* Main Navigation Content */}
            <div className="flex flex-1 flex-col overflow-y-auto">
              {/* Navigation Links - Hero Element */}
              <motion.nav
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.08,
                      delayChildren: 0.15,
                    },
                  },
                }}
                className="flex-1 px-6 py-8"
              >
                <ul className="flex flex-col gap-y-5">
                  {navLinks.map((item) => {
                    const active = isActive(item.href);
                    const external = /^https?:\/\//i.test(item.href);
                    const inner = (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span
                          className={cn(
                            "block font-['Bebas_Neue'] text-2xl font-bold leading-[1.05] tracking-tight transition-all duration-300",
                            active
                              ? "text-[#E8192C]"
                              : "text-white hover:text-white",
                          )}
                        >
                          {item.label}
                        </span>
                        {active && (
                          <motion.div
                            layoutId="mobile-menu-underline"
                            className="mt-1 h-[2px] w-12 bg-[#E8192C] rounded-full"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{
                              duration: 0.3,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                          />
                        )}
                      </motion.div>
                    );
                    return (
                      <motion.li
                        key={item.href}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: 0.5,
                              ease: [0.22, 1, 0.36, 1],
                            },
                          },
                        }}
                      >
                        {external ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setOpen(false)}
                            className="relative block"
                          >
                            {inner}
                          </a>
                        ) : (
                          <Link
                            to={item.href}
                            onClick={() => setOpen(false)}
                            className="relative block"
                          >
                            {inner}
                          </Link>
                        )}
                      </motion.li>
                    );
                  })}
                </ul>
              </motion.nav>

              {/* Premium CTA Card */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.6,
                    },
                  },
                }}
                className="mx-6 mb-12 rounded-2xl border border-[#E8192C]/30 bg-gradient-to-br from-[#E8192C]/8 via-[#050505] to-[#050505] p-8 backdrop-blur-sm"
                style={{
                  boxShadow:
                    "0 0 40px rgba(232,25,44,0.1), inset 0 0 60px rgba(232,25,44,0.05)",
                }}
              >
                <motion.h3
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.4 },
                    },
                  }}
                  className="mb-6 font-['Bebas_Neue'] text-2xl font-bold tracking-wide text-white"
                >
                  READY TO GET STARTED?
                </motion.h3>

                {/* Primary CTA */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.4 },
                    },
                  }}
                  className="mb-3"
                >
                  <Link
                    to={primaryCta.href}
                    onClick={() => {
                      setOpen(false);
                      track("cta_click", {
                        event_label: "mobile_menu_primary",
                        cta: "START MY 7-DAY TRIAL",
                      });
                    }}
                    className="flex h-14 items-center justify-center rounded-lg bg-[#E8192C] font-['Bebas_Neue'] text-sm font-semibold uppercase tracking-[0.1em] text-white transition-all duration-300 hover:brightness-125 active:scale-95"
                  >
                    START MY 7-DAY TRIAL
                  </Link>
                </motion.div>

                {/* Secondary CTA */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.4 },
                    },
                  }}
                >
                  <a
                    href="https://calendly.com/bigronjonesllc/discovery-call"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setOpen(false)}
                    className="flex h-14 items-center justify-center rounded-lg border border-white/20 font-['Bebas_Neue'] text-sm font-semibold uppercase tracking-[0.1em] text-white transition-all duration-300 hover:border-white/40 hover:bg-white/5 active:scale-95"
                  >
                    BOOK PRIVATE CONSULT
                  </a>
                </motion.div>

                {/* Member-Only Links */}
                {isAuthenticated && trial.isAdmin && (
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.4 },
                      },
                    }}
                    className="mt-4"
                  >
                    <Link
                      to="/admin"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-2 rounded-lg bg-[#E8192C]/10 px-4 py-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white transition-all hover:bg-[#E8192C]/15"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck size={12} />
                        Admin
                      </span>
                      <span className="text-[#E8192C]">
                        {trial.role === "super_admin" ? "SUPER" : "ADMIN"}
                      </span>
                    </Link>
                  </motion.div>
                )}

                {isAuthenticated && trial.hasTrial && (
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.4 },
                      },
                    }}
                    className="mt-2"
                  >
                    <Link
                      to="/dashboard"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-2 rounded-lg bg-[#E8192C]/10 px-4 py-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white transition-all hover:bg-[#E8192C]/15"
                    >
                      <span className="flex items-center gap-2">
                        <LayoutDashboard size={12} />
                        Dashboard
                      </span>
                      {trial.trialDay && !trial.trialIsComplete && (
                        <span className="text-[#E8192C]">
                          Day {trial.trialDay}/7
                        </span>
                      )}
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Premium Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="border-t border-white/5 px-6 py-6"
            >
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
                  className="flex items-center gap-2 font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white/70"
                >
                  <LogOut size={11} />
                  Sign out
                </button>
              ) : (
                <Link
                  to="/auth/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white/70"
                >
                  <UserIcon size={11} />
                  Sign in
                </Link>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile sticky CTA — full-width bar pinned to the bottom on phones.
          Appears once the user scrolls (so it never blocks the hero) and
          hides while the mobile menu is open. Desktop uses the navbar CTA. */}
      <AnimatePresence>
        {scrolled && !open && (
          <motion.div
            key="mobile-sticky-cta"
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-[55] xl:hidden"
          >
            <Link
              to={primaryCta.href}
              onClick={() =>
                track("cta_click", {
                  event_label: "mobile_sticky_cta",
                  cta: primaryCta.short,
                })
              }
              className="flex items-center justify-center bg-[#E8192C] py-4 font-['DM_Mono'] text-[12px] uppercase tracking-[0.15em] text-white shadow-[0_-6px_24px_rgba(0,0,0,0.5)]"
            >
              {primaryCta.short}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
