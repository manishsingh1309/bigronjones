<div align="center">

<img src="assets/bigronjones/Ron.PNG" alt="Big Ron Jones" width="240" />

# BIGRONJONES®

**Practical Advice For Your Real World Goals**

A full-stack coaching platform — lead capture, 7-day oversight trial, premium dashboard, and admin operations. Built for adults 35+ ready to build real structure.

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Serverless-000?logo=vercel&logoColor=white)](https://vercel.com/)

</div>

---

## What this is

BigRonJones runs a coaching business for adults rebuilding their fitness after 35. This repo is the website and operations stack behind it:

- **Public marketing site** — home, about, programs, blog, team, shop, testimonials
- **Lead-magnet funnel** — Ron pastes a Google Drive / Dropbox / YouTube link in the admin, gets a unique `/free/<slug>` URL, shares it on Instagram. Users fill name + email, the content is emailed instantly.
- **7-Day Oversight Trial** — $149 Stripe checkout, Calendly activation call, daily check-ins, recovery metrics, Ron's per-day video lessons, manual + automatic day unlock.
- **Premium dashboard** — post-trial coaching dashboard with progress tracking, charts, and direct messaging.
- **Admin workspace** — content management (lead magnets), lead viewer with CSV export, trial-user monitoring, feedback inbox, coach notes, super-admin analytics.
- **Email automation** — transactional emails via Gmail SMTP (Resend fallback), one-click unsubscribe, RFC-8058 compliant, day-1 nurture sequence with cron scheduler.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                            BROWSER                                   │
│  Vite + React 19 SPA  ·  TypeScript  ·  Tailwind v4  ·  Framer       │
│  React Router v7 (data router)  ·  Zustand  ·  React Hook Form + Zod │
└───────────────┬──────────────────────────────────────┬───────────────┘
                │ Supabase Auth (Google OAuth + email) │
                │                                       │
                │ /api/*                                │ /assets/*
                ▼                                       │
┌──────────────────────────────────────────────────────────────────────┐
│                      VERCEL SERVERLESS API                           │
│  backend/api/*.ts (one file per endpoint)                            │
│  Lead capture · Checkout · Webhook handlers · Admin · Cron           │
│  Runs in Node 20 (@vercel/node 5)                                    │
└─────┬──────────────────┬─────────────────┬─────────────────┬─────────┘
      │                  │                 │                 │
      ▼                  ▼                 ▼                 ▼
┌──────────┐      ┌──────────────┐    ┌──────────┐    ┌──────────────┐
│ Supabase │      │ Gmail SMTP   │    │ Stripe   │    │ Calendly     │
│ Postgres │      │ + Resend     │    │ Checkout │    │ Webhooks     │
│ + Auth   │      │ (fallback)   │    │ Sessions │    │ (HMAC verify)│
│ + Storage│      │              │    │ + Cron   │    │              │
└──────────┘      └──────────────┘    └──────────┘    └──────────────┘
```

### Request lifecycle (lead capture)

```
Instagram link  ──►  /free/<slug>  ──►  GET  /api/lead-magnet?slug=…
                                          │     (Supabase read, view++)
                                          ▼
                                       Render LeadCaptureForm
                                          │
                       User submits ──►  POST /api/capture-lead
                                          │
                                          ├─►  Validate (Zod, shared schema)
                                          ├─►  Upsert into public.leads
                                          ├─►  Build email (contentDeliveryEmail)
                                          ├─►  Send via Gmail SMTP / Resend
                                          ├─►  Mark pdf_sent = true on success
                                          └─►  Increment lead_magnets.download_count
                                                ▼
                                          Success screen
```

---

## Project structure

```
.
├── frontend/                          ← Vite SPA root
│   ├── index.html                     ← viewport meta, font preconnect
│   ├── public/
│   │   └── assets/                    ← static images, PDFs, OG covers
│   ├── src/
│   │   ├── main.tsx                   ← app entry, mounts Router
│   │   ├── App.tsx                    ← route map (public + admin + auth)
│   │   ├── auth/                      ← Supabase client + admin API client
│   │   ├── components/
│   │   │   ├── admin/                 ← AdminLayout (mobile drawer), AdminGuard
│   │   │   ├── auth/                  ← ProtectedRoute
│   │   │   ├── layout/                ← Navbar, Footer, CustomCursor
│   │   │   ├── leads/                 ← LeadCaptureForm
│   │   │   ├── sections/              ← Home page hero + sections
│   │   │   ├── shop/   blog/   trial/ checkout/
│   │   │   └── ui/                    ← shared primitives (Toaster, etc.)
│   │   ├── features/
│   │   │   └── premium-dashboard/     ← post-trial dashboard
│   │   ├── hooks/                     ← useAuth, useTrialStatus, useCart…
│   │   ├── pages/
│   │   │   ├── Home, About, Programs, Shop, Blog, Team, Consult, Contact
│   │   │   ├── SignIn / SignUp / ForgotPassword
│   │   │   ├── FreeLeadMagnet.tsx     ← public /free/:slug landing
│   │   │   ├── ProgramsTrial.tsx      ← $149 trial pitch
│   │   │   ├── TrialSuccess.tsx       ← post-checkout
│   │   │   ├── Dashboard.tsx          ← unlocked trial workspace
│   │   │   ├── TrialDashboard.tsx     ← Phase-1 view + day cards
│   │   │   ├── Continue.tsx           ← post-trial enrollment
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.tsx        ← Quick Access + analytics
│   │   │       ├── AdminContentList.tsx      ← lead-magnet CRUD
│   │   │       ├── AdminContentForm.tsx
│   │   │       ├── AdminLeads.tsx            ← captured leads + CSV
│   │   │       ├── AdminTrialUsers.tsx       ← trial monitoring
│   │   │       ├── AdminTrialFeedback.tsx    ← reply to check-ins
│   │   │       └── AdminTrialOverview.tsx
│   │   └── styles/
│   │       └── globals.css            ← Tailwind v4 + design tokens
│   ├── tsconfig.app.json
│   └── vite.config.ts
│
├── backend/                           ← Vercel serverless functions
│   ├── api/
│   │   ├── lead-magnet.ts             ← GET single magnet by slug
│   │   ├── capture-lead.ts            ← POST lead form → DB + email
│   │   ├── checkout.ts                ← Stripe checkout session
│   │   ├── verify-trial-payment.ts
│   │   ├── link-trial.ts              ← email → auth user binding
│   │   ├── me.ts                      ← auth identity + role
│   │   ├── dashboard.ts / metrics.ts / day-complete.ts / trial-feedback.ts
│   │   ├── newsletter.ts / contact.ts / apply.ts
│   │   ├── unsubscribe.ts             ← RFC-8058 one-click
│   │   ├── send-sequence.ts / cron-email-scheduler.ts
│   │   ├── webhooks-calendly.ts       ← HMAC-verified webhook
│   │   ├── admin/                     ← protected endpoints
│   │   │   ├── content.ts / leads.ts / stats.ts
│   │   │   ├── upload-url.ts          ← signed Supabase Storage URLs
│   │   │   ├── trial-users.ts / trial-feedback.ts / trial-reply.ts
│   │   │   └── coach-notes.ts / super-dashboard.ts
│   │   └── webhooks/   test/
│   ├── lib/
│   │   ├── supabase.ts                ← service-role client (server only!)
│   │   ├── auth.ts                    ← Bearer token → user + role
│   │   ├── adminAuth.ts               ← requireAdmin / requireSuperAdmin
│   │   ├── mailer.ts                  ← Gmail SMTP (nodemailer)
│   │   ├── emailTemplates.ts          ← HTML email builders
│   │   ├── dashboardAccess.ts         ← unlock logic
│   │   └── webhookUtils.ts            ← Calendly HMAC verify
│   ├── sql/
│   │   ├── MIGRATE.sql                ← consolidated, idempotent
│   │   ├── 01_schema.sql              ← leads + lead_magnets + RLS
│   │   ├── 02_seed_lead_magnets.sql
│   │   ├── 03_trial_system.sql
│   │   ├── 04…08_*.sql                ← incremental migrations
│   │   └── 09_fix_broken_seed_magnets.sql
│   └── dev-server.ts                  ← local file-based router (mirrors Vercel)
│
├── shared/
│   └── lib/
│       └── leadSchemas.ts             ← Zod schemas used on both ends
│
├── scripts/
│   ├── setup-admin.ts                 ← reconcile admin allowlist with Supabase
│   ├── create-admin-user.ts           ← seed an admin auth user
│   ├── resend-pending-leads.mjs       ← retry failed email deliveries
│   └── generate-sitemap.mjs
│
├── assets/                            ← original brand assets (not served)
├── .env.example                       ← copy → .env, fill in secrets
├── vercel.json                        ← rewrites + cron + function runtime
├── package.json                       ← npm scripts (dev / build / typecheck)
└── README.md
```

---

## Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 · TypeScript 5 · Vite 6 · Tailwind CSS v4 · Framer Motion 12 · React Router v7 · Zustand · React Hook Form + Zod |
| **Backend** | Vercel Serverless Functions (Node 20) · TypeScript · Standalone `Request → Response` handlers |
| **Database** | Supabase (Postgres) — row-level security on every table, service-role-only writes for leads |
| **Auth** | Supabase Auth — Google OAuth (primary) + email/password. Role-gated admin via email allowlist + `users.role` column |
| **Email** | Gmail SMTP via Nodemailer (primary), Resend (fallback). One-click unsubscribe (RFC 8058) |
| **Payments** | Stripe Checkout Sessions — trial $149, Phase-2 plans (full / 6-pay / 36-pay) |
| **Storage** | Supabase Storage — `content-files` bucket, signed uploads, public read |
| **External** | Calendly webhooks (HMAC verified) for activation calls |
| **Hosting** | Vercel — frontend as static SPA, `backend/api/**` as serverless functions, daily cron via `vercel.json` |
| **Analytics** | First-party event logging in `user_activity_log` + Google Analytics |

---

## Quick start

### 1. Clone + install

```bash
git clone https://github.com/manishsingh1309/bigronjones.git
cd bigronjones
npm install
```

### 2. Configure environment

Copy the template and fill in secrets:

```bash
cp .env.example .env
```

Required values:

| Variable | Where to get it |
|---|---|
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project settings → API |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Same page, "anon public" key |
| `SMTP_USER` / `SMTP_PASS` | A Gmail account with 2FA on → [App passwords](https://myaccount.google.com/apppasswords) |
| `STRIPE_SECRET_KEY` / `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys |
| `ADMIN_EMAILS` / `SUPER_ADMIN_EMAILS` | Comma-separated allowlist of admin emails |
| `CALENDLY_WEBHOOK_SECRET` | Calendly → Integrations → Webhooks |
| `CRON_SECRET` | `openssl rand -hex 32` |
| `SITE_URL` / `VITE_SITE_URL` | `http://localhost:3000` in dev |

### 3. Provision the database

Open the Supabase SQL editor and run each file in `backend/sql/` in numeric order, starting with `MIGRATE.sql`. All migrations are idempotent — safe to re-run.

If you have an existing database with the legacy broken seed magnets, run `09_fix_broken_seed_magnets.sql` to deactivate them.

### 4. Seed your admin user

```bash
npx tsx scripts/setup-admin.ts
```

Reads `ADMIN_EMAILS` / `SUPER_ADMIN_EMAILS` from `.env`, demotes any stale admins, and pre-mirrors the new admin into `public.users` with the right role. After this, sign in with that Google account at `http://localhost:3000/auth/login`.

### 5. Run dev

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8081 (proxied as `/api/*`)

---

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Backend (tsx) + frontend (Vite) in parallel via concurrently |
| `npm run build` | Vite production build + sitemap generation |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | `tsc --noEmit` against the frontend app |
| `npm run lint` | ESLint with TypeScript rules |

### One-off operational scripts

| Script | Purpose |
|---|---|
| `npx tsx scripts/setup-admin.ts` | Reconcile admin state with `.env` allowlist |
| `npx tsx scripts/create-admin-user.ts` | Create a single admin auth user with password (legacy path) |
| `node scripts/resend-pending-leads.mjs` | Retry email delivery for every lead where `pdf_sent = false` |

---

## Responsive design

Every page is responsive across mobile (375px) → tablet (768px) → desktop (1024px+):

- **Mobile-first inputs** — all form fields use `text-base sm:text-sm` so iOS Safari doesn't auto-zoom on focus
- **Admin drawer** — the admin sidebar is a slide-in drawer with hamburger menu on `<lg`, native rail on `lg+`
- **Grid stacking** — every multi-column layout uses explicit `grid-cols-1` defaults then progressive `sm:` / `md:` / `lg:` columns
- **Table overflow** — admin tables wrapped in `overflow-x-auto` containers with a `min-w-*` floor so they scroll horizontally rather than crush on phones
- **Native cursor** — the decorative custom cursor coexists with the native pointer; native is never hidden so links/buttons always read as clickable

---

## Security & secrets

- **`.env` is gitignored.** All sensitive keys (Supabase service role, Stripe secret, SMTP password, Calendly webhook secret) live there.
- **Service-role key is server-only.** `backend/lib/supabase.ts` reads it. Never imported from `frontend/`.
- **RLS on every public table.** `leads` has NO public policies — every read/write goes through the service-role server. `lead_magnets` allows public read for active rows only.
- **Admin endpoints gated server-side.** Every `backend/api/admin/*.ts` calls `requireAdmin()` which verifies the Supabase bearer token and the `users.role` column. The UI guard (`AdminGuard.tsx`) is convenience only.
- **Stripe webhook signature.** All Stripe webhooks verify the signing secret. Calendly webhooks verify HMAC-SHA256.
- **CSRF posture:** API endpoints accept JSON only, no cookie-state mutations, bearer-token auth.

---

## Deployment

Deploys to Vercel. `vercel.json` defines:

- **Rewrites** — `/api/*` → `backend/api/*`, everything else → `/index.html` (SPA fallback)
- **Functions** — `backend/api/**/*.ts` run on `@vercel/node@5.1.0` (Node 20)
- **Cron** — `/api/cron/email-scheduler` daily at 06:00 UTC

Env vars must be set in Vercel project settings (Production + Preview). Use the same names as `.env.example`.

---

## Conventions

- **No CSS modules / styled-components.** Tailwind utility classes only. Brand tokens in `frontend/src/styles/globals.css`.
- **Brand colors:** Red `#E8192C` · Black `#050505` · Card `#0d0d0d` · Border `#1c1c1c`.
- **Fonts:** Bebas Neue (display) · DM Sans (body) · DM Mono (labels). Loaded from Google Fonts.
- **Validation.** Every form payload is validated on both ends with the same Zod schema in `shared/lib/leadSchemas.ts`.
- **Email delivery contract.** Save lead → THEN send email. If email fails, lead is still in DB and can be retried via `resend-pending-leads.mjs`.

---

## License

Proprietary. © BigRonJones® LLC. All rights reserved.
