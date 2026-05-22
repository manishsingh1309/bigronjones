# Google OAuth Setup Guide for Supabase

## ✅ Status Check

Your environment variables are now configured:

```env
VITE_SITE_URL=http://localhost:3000              # Frontend URL for redirects
VITE_SUPABASE_URL=https://atwdzfchknvsdldhkug... # Supabase project
VITE_SUPABASE_ANON_KEY=eyJ...                    # Supabase anon key
```

## Step 1: Enable Google OAuth in Supabase

1. Go to **Supabase Dashboard** → Your Project
2. Click **Authentication** (left sidebar)
3. Click **Providers** tab
4. Find **Google** and click it
5. Click the toggle to **Enable Google provider**

**Don't worry about Google OAuth credentials yet** — we'll do that next.

---

## Step 2: Get Google OAuth Credentials

### Create a Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Create a new project:
   - Click the project dropdown at the top
   - Click **NEW PROJECT**
   - Enter name: `bigronjones-oauth`
   - Click **CREATE**

### Enable Google+ API

1. In the new project, go to **APIs & Services** → **Library**
2. Search for **Google+ API**
3. Click it → Click **ENABLE**

### Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. If prompted, click **Configure Consent Screen** first:
   - Select **External** user type
   - Click **CREATE**
   - Fill out the form:
     - **App name:** Big Ron Jones
     - **User support email:** hello@bigronjones.com
     - **Developer contact:** hello@bigronjones.com
   - Click **SAVE AND CONTINUE** through all screens
   - Click **BACK TO DASHBOARD**

4. Now create the OAuth credential:
   - Go to **Credentials** tab
   - Click **Create Credentials** → **OAuth 2.0 Client ID**
   - Choose **Web application**
   - Fill out:
     - **Name:** Big Ron Jones Web
     - **Authorized JavaScript origins:**
       ```
       http://localhost:3000
       https://www.bigronjones.com
       https://atwdzfchknvsdldhkug.supabase.co
       ```
     - **Authorized redirect URIs:**
       ```
       http://localhost:3000/auth/callback
       https://www.bigronjones.com/auth/callback
       https://atwdzfchknvsdldhkug.supabase.co/auth/v1/callback?provider=google
       ```
   - Click **CREATE**

5. Copy the credentials:
   - You'll see **Client ID** and **Client Secret**
   - Copy both!

---

## Step 3: Add Google Credentials to Supabase

1. Go back to **Supabase Dashboard**
2. **Authentication** → **Providers** → **Google**
3. Paste:
   - **Client ID:** (from Google Cloud)
   - **Client Secret:** (from Google Cloud)
4. Click **Save**

---

## Step 4: Set Redirect URLs in Supabase

1. In **Authentication**, click **URL Configuration**
2. Under **Redirect URLs**, add:
   ```
   http://localhost:3000/auth/callback
   https://www.bigronjones.com/auth/callback
   ```
3. Click **Save**

---

## Step 5: Test Locally

1. Start your dev server:

   ```bash
   npm run dev
   ```

2. Go to http://localhost:3000

3. Click **Sign In** or **Sign Up**

4. Click **Continue with Google**

5. Open **Browser Console** (F12 → Console tab)

6. You should see logs:

   ```javascript
   [useAuth] Google OAuth: {
     supabaseUrl: "https://atwdzfchknvsdldhkug.supabase.co",
     siteOrigin: "http://localhost:3000",
     redirectTo: "http://localhost:3000/auth/callback"
   }
   ```

7. You'll be redirected to Google login, then back to your app

---

## Troubleshooting

### Issue: DNS_PROBE_FINISHED_NXDOMAIN

**Cause:** Supabase URL is malformed or not set

**Fix:**

- Check `VITE_SUPABASE_URL` in .env
- Verify it matches your Supabase project URL
- Format should be: `https://XXXXX.supabase.co`

### Issue: OAuth Redirect URL Mismatch

**Error:** "The redirect_uri MUST match the registered URI"

**Fix:**

- Check browser console logs (see Step 5)
- Verify `redirectTo` URL matches one in Supabase URL Configuration
- Common mismatch: `http://localhost:3001` vs `http://localhost:3000`

### Issue: Google OAuth Popup Blocked

**Cause:** Browser is blocking the popup window

**Fix:**

- Check if popup blocker is active
- Allow popups for your domain
- Some browsers block new windows in incognito mode

### Issue: "Invalid Credential" or "Client ID not recognized"

**Cause:** Wrong Client ID in Supabase

**Fix:**

- Go back to Google Cloud Console
- Verify you're in the right project
- Copy Client ID again (sometimes there are spaces)
- Make sure Client Secret is also correct

---

## Production Deployment

### For Vercel/Production

1. Update environment variables in Vercel:

   ```env
   VITE_SITE_URL=https://www.bigronjones.com
   VITE_SUPABASE_URL=https://atwdzfchknvsdldhkug.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

2. Ensure Google OAuth authorized origins include:
   - `https://www.bigronjones.com`
   - `https://atwdzfchknvsdldhkug.supabase.co`

3. Ensure Supabase redirect URLs include:
   - `https://www.bigronjones.com/auth/callback`

---

## Security Checklist

- ✅ Never commit `.env` file (already in .gitignore)
- ✅ VITE_SUPABASE_ANON_KEY is safe to expose (it's the public key)
- ✅ Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend
- ✅ Google Client Secret is set in Supabase (not exposed to frontend)
- ✅ OAuth redirect URLs are whitelisted in both Google Cloud and Supabase

---

## Debugging Commands

### Check if environment variables are loaded

```javascript
// In browser console
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SITE_URL);
```

### Check Supabase auth state

```javascript
// In browser console
import { supabase } from "@/auth/supabase";
const {
  data: { session },
} = await supabase.auth.getSession();
console.log(session);
```

### View Supabase logs

1. Go to **Supabase Dashboard**
2. Click **Logs** (bottom left)
3. Filter by "auth" to see OAuth attempts

---

## Next Steps

1. ✅ Add Google credentials to Supabase (Step 3)
2. ✅ Set redirect URLs (Step 4)
3. ✅ Test locally (Step 5)
4. ✅ Monitor browser console for logs
5. 🚀 Deploy to production

Once you complete steps 1-4, Google OAuth will work!

---

## Support

If you're stuck:

1. Check browser console logs (they're detailed now)
2. Check Supabase dashboard logs
3. Verify Google Cloud credentials are correct
4. Make sure redirect URLs don't have trailing slashes
5. Try incognito mode (to clear cookies)
