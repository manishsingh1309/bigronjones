# Deployment guide — Vercel (frontend) + Render (backend)

This project ships as **two services on two providers**:

| Layer    | Where  | What                                                 |
| -------- | ------ | ---------------------------------------------------- |
| Frontend | Vercel | Static SPA built from `frontend/` (Vite)             |
| Backend  | Render | Long-running Node HTTP server (`backend/server.ts`)  |
| Cron     | Render | Daily curl that hits the trial email scheduler       |

The Vercel project does **no API routing of its own** — it proxies every
`/api/*` request to the Render backend via a `vercel.json` rewrite. That
keeps the frontend code identical to local dev (still calls relative
`/api/*` URLs) and avoids CORS for normal user traffic.

---

## How requests flow in production

```
Browser ─► Vercel (SPA + /api proxy) ─► Render (Node server) ─► Supabase / Stripe / Resend
                                              ▲
                Stripe / Calendly webhooks ───┘  (direct, NOT through Vercel)
                Render Cron Job  ─────────────┘  (daily 06:00 UTC)
```

- Browser API calls → Vercel rewrites `/api/*` → Render.
- Webhook providers (Stripe, Calendly) → **direct to Render** (configure
  the webhook URLs as `https://<render-app>.onrender.com/api/webhooks/...`).
- The Render Cron Job hits `/api/cron/email-scheduler?secret=$CRON_SECRET`
  every day at 06:00 UTC.

---

## Step 1 — Deploy the backend on Render

### 1a. Create the services

You have two options. Either works:

**Option A — Blueprint (one click, recommended).** The repo includes
[`render.yaml`](render.yaml) which declares both the web service and the
cron job in one shot.

1. Push your latest `main` to GitHub (already done if you followed the
   admin-restructure commit).
2. Render Dashboard → **New +** → **Blueprint** → connect your GitHub
   repo → pick `bigronjones`.
3. Render reads `render.yaml` and creates:
   - `bigronjones-api` (Web Service, Free plan)
   - `bigronjones-email-scheduler` (Cron Job, Starter plan — Render cron
     jobs are not free)

**Option B — Manual.** Render Dashboard → **New +** → **Web Service** →
connect repo with these settings:

| Setting             | Value                |
| ------------------- | -------------------- |
| Runtime             | Node                 |
| Build Command       | `npm install`        |
| Start Command       | `npm start`          |
| Health Check Path   | `/healthz`           |
| Node Version        | `22`                 |
| Branch              | `main`               |

### 1b. Fill in the environment variables

Open the web service → **Environment** → add the keys below. They must all
be set or the corresponding feature will fail at runtime.

| Key                          | Where to find it                                                 |
| ---------------------------- | ---------------------------------------------------------------- |
| `FRONTEND_ORIGIN`            | Your Vercel URL (e.g. `https://bigronjones.vercel.app`)          |
| `SITE_URL`                   | Same as above (used in emails, OAuth, etc.)                      |
| `VITE_SITE_URL`              | Same as above (Stripe success/cancel URLs use this)              |
| `SUPABASE_URL`               | Supabase → Settings → API                                        |
| `SUPABASE_SERVICE_ROLE_KEY`  | Supabase → Settings → API (**service role**, not anon)           |
| `STRIPE_SECRET_KEY`          | Stripe → Developers → API Keys (use `sk_live_…` in prod)         |
| `STRIPE_WEBHOOK_SECRET`      | Set in step 3 after you create the webhook endpoint              |
| `STRIPE_CHECKOUT_LINK`       | Stripe → Payment Links (trial-to-paid upgrade URL)               |
| `RESEND_API_KEY`             | Resend → API Keys                                                |
| `RESEND_FROM_EMAIL`          | e.g. `Big Ron Jones <ron@bigronjones.com>`                       |
| `RESEND_AUDIENCE_ID`         | Resend → Audiences (optional)                                    |
| `CONTACT_INBOX_EMAIL`        | Where the contact form should email                              |
| `CALENDLY_WEBHOOK_SECRET`    | Set in step 4 after you create the Calendly webhook              |
| `GOOGLE_API_KEY`             | Google AI Studio                                                 |
| `ANTHROPIC_API_KEY`          | Anthropic Console (optional, only if you use Claude in handlers) |
| `CRON_SECRET`                | Generate locally: `openssl rand -hex 32`                         |

Click **Save Changes** — Render redeploys automatically.

### 1c. Verify the backend is alive

Once Render shows the service as "Live":

```bash
curl https://<your-render-app>.onrender.com/healthz
# → {"status":"ok"}

curl https://<your-render-app>.onrender.com/api/blogs
# → list of published blogs
```

If `/healthz` works but `/api/blogs` 500s, check the Render logs — almost
always a missing env var.

---

## Step 2 — Deploy the frontend on Vercel

### 2a. Update `vercel.json` with your Render URL

Edit [`vercel.json`](vercel.json) and replace `REPLACE-ME-RENDER-APP`
with the real Render host. Example:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://bigronjones-api.onrender.com/api/:path*" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

Commit and push.

### 2b. Create / connect the Vercel project

If the project already exists, just push — Vercel auto-deploys. If not:

1. Vercel Dashboard → **Add New** → **Project** → import the GitHub repo.
2. Framework preset: **Other** (or Vite if offered).
3. Build command: `npm run build` (already in `vercel.json`).
4. Output directory: `dist` (already in `vercel.json`).
5. **Environment Variables** (only the `VITE_*` keys are needed on Vercel —
   the rest are backend-only and live on Render):

   | Key                          | Value                                   |
   | ---------------------------- | --------------------------------------- |
   | `VITE_SITE_URL`              | The Vercel production URL               |
   | `VITE_SUPABASE_URL`          | Supabase project URL                    |
   | `VITE_SUPABASE_ANON_KEY`     | Supabase **anon** key (safe in browser) |
   | `VITE_STRIPE_PUBLISHABLE_KEY`| Stripe → Publishable Key (`pk_live_…`)  |
   | `VITE_GA_ID`                 | Google Analytics ID (optional)          |

6. **Deploy**.

### 2c. Verify end-to-end

```bash
# Hits Vercel, which proxies to Render
curl https://<your-vercel-app>.vercel.app/api/blogs

# In a browser, visit:
#   https://<your-vercel-app>.vercel.app/             — homepage
#   https://<your-vercel-app>.vercel.app/admin        — admin login (requires admin role)
```

---

## Step 3 — Wire up Stripe webhooks (point at Render, not Vercel)

Stripe sends webhooks server-to-server. They must go **directly to
Render**, bypassing the Vercel rewrite, because the rewrite layer would
strip the raw body Stripe needs for signature verification.

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://<your-render-app>.onrender.com/api/webhooks/stripe`
3. Events to send:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
4. Save. Stripe shows the **Signing secret** (`whsec_…`) once. Copy it.
5. Render Dashboard → web service → Environment → set
   `STRIPE_WEBHOOK_SECRET=whsec_…` → Save Changes (triggers redeploy).
6. Stripe → your webhook → **Send test webhook** → confirm 200.

---

## Step 4 — Wire up Calendly webhook

Same pattern as Stripe — direct to Render.

1. Calendly → Integrations → Webhooks → Create.
2. URL: `https://<your-render-app>.onrender.com/api/webhooks/calendly`
3. Generate a secret, paste it into Render env as `CALENDLY_WEBHOOK_SECRET`.

---

## Step 5 — Verify the cron job

If you used `render.yaml`, the cron is already created. Edit it once:

1. Open the `bigronjones-email-scheduler` cron service → **Settings**.
2. In the Docker Command, replace `REPLACE-ME-RENDER-URL` with your real
   web service host. Save.
3. **Trigger Run** → confirm exit 0 and a successful `200` curl response
   in the logs.

If you skipped the blueprint, set it up manually:

1. Render Dashboard → **New +** → **Cron Job** → Starter plan.
2. Schedule: `0 6 * * *` (daily 06:00 UTC).
3. Command:
   ```sh
   curl --fail --silent --show-error \
     "https://<your-render-app>.onrender.com/api/cron/email-scheduler?secret=$CRON_SECRET"
   ```
4. Environment: set `CRON_SECRET` to the same value the web service uses.

---

## Free-tier caveats (read before going live)

The Render free web tier **sleeps after ~15 minutes of inactivity**. The
next request after sleep takes 30–60 s to wake the container. Practical
impact for this app:

- **Stripe webhooks**: Stripe retries failed webhooks with backoff, so a
  cold-start timeout is usually recoverable. But during a wake-up, the
  customer who just paid may not see "paid" status until the second event.
- **Calendly webhooks**: same retry behavior; usually fine.
- **Admin panel / checkout for a real user**: the wait is jarring. The
  user thinks the site is broken.
- **Render cron**: cron jobs are billed separately and don't share the
  free-tier sleep behavior — they run fine even if the web service is
  asleep, but they wake the web service when they hit it.

If this is going to a real audience, upgrade the web service to
**Starter ($7/mo)**: Render Dashboard → service → Settings → Plan.

A common cheap-keepalive trick is to set up an external pinger
(cron-job.org, UptimeRobot) hitting `/healthz` every 10 minutes. It works
but uses ~720 hours/month of compute, which is exactly Render's free
budget — so the service will hit its monthly cap and start cold-starting
again. Upgrading is the cleaner answer.

---

## Local dev (unchanged)

`npm run dev` still runs both layers locally:

- Frontend on `http://localhost:3000`
- Backend (dev server with hot reload + file router) on `http://localhost:8081`
- Vite proxies `/api/*` to `localhost:8081`

No production code path is involved; `backend/server.ts` is only used by
Render. `backend/dev-server.ts` continues to handle local dev with its
existing hot-reload semantics.

---

## Routine operations

| Task                                | Where                                                        |
| ----------------------------------- | ------------------------------------------------------------ |
| Push code update                    | `git push origin main` → Vercel + Render both auto-deploy    |
| Roll a leaked secret                | Render → Environment → update value → save (auto-redeploys)  |
| Check backend logs                  | Render service → **Logs** tab                                |
| Check Vercel build / runtime logs   | Vercel project → **Deployments** → click deployment → Logs   |
| Manually retry a Stripe event       | Stripe → Webhooks → click event → **Resend**                 |
| Manually trigger cron               | Render cron service → **Trigger Run**                        |
| Roll back deploy                    | Vercel / Render → previous deployment → **Promote**          |

---

## Rollback to single-Vercel deployment

If you ever need to revert to the original Vercel-only setup:

1. `git revert <this-deploy-commit>` to restore `api/[...path].ts`, the
   old `vercel.json`, and remove `backend/server.ts` + `render.yaml`.
2. Re-add the cron block to `vercel.json`.
3. Move backend env vars from Render back into Vercel → Settings → Env.
4. Pause/delete the Render services.

History is preserved — nothing is destructive.
