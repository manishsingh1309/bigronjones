# Checkout Flow Debugging Guide

## Summary of Changes

### 1. ✅ Backend Endpoint: `/api/checkout` (backend/api/checkout.ts)

**Status:** Production-ready and implemented

**Functionality:**

- Accepts POST requests with cart items
- Validates items (non-empty, valid prices)
- Calculates total
- Returns different responses based on configuration:
  - **Has Stripe + Paid**: Returns `{ ok: true, url: session.url }` (redirect to Stripe checkout)
  - **Zero Total (Trial)**: Returns `{ ok: true, mode: "lead", message: "..." }` (lead capture)
  - **No Stripe**: Returns `{ ok: true, mode: "lead", message: "..." }` (fallback)
- Error handling: Returns JSON with `{ error: string }` on failures

**Request Body:**

```json
{
  "items": [
    {
      "id": "prod-1",
      "slug": "workout-program",
      "name": "12-Week Transformation",
      "price": 297,
      "quantity": 1,
      "image": "https://..."
    }
  ]
}
```

**Response (Stripe Available):**

```json
{
  "ok": true,
  "url": "https://checkout.stripe.com/pay/cs_..."
}
```

**Response (Lead Capture/Trial):**

```json
{
  "ok": true,
  "mode": "lead",
  "message": "Trial confirmed. Check your email..."
}
```

---

### 2. ✅ Frontend Fix: CheckoutClient.tsx

**Improvements Made:**

**Before:**

```typescript
const data = await res.json();
if (res.ok && data.url) { ... }
```

❌ Problem: If res is not ok, `res.json()` might fail on HTML error pages, causing "Unexpected end of JSON input"

**After:**

```typescript
if (!res.ok) {
  // Check content-type first
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const errorData = await res.json();
    errorMessage = errorData.error || errorMessage;
  }
  throw new Error(errorMessage);
}

let data;
try {
  data = await res.json();
} catch {
  throw new Error("Invalid server response - unable to parse JSON");
}
```

✅ Solution: Check response status FIRST, handle JSON parsing errors gracefully

---

## Running Locally (for Testing)

### Option 1: Using Vercel CLI (RECOMMENDED)

**1. Install Vercel CLI:**

```bash
npm i -g vercel@latest
```

**2. Link project to Vercel (one-time):**

```bash
vercel link
```

**3. Run dev server with API support:**

```bash
vercel dev
```

**Output:**

```
> Ready! Available at http://localhost:3000
> API: http://localhost:3001
> Frontend: http://localhost:3000
```

**4. Test checkout in browser:**

- Go to http://localhost:3000
- Add items to cart
- Click checkout → Should work!

---

### Option 2: Mock API Server (Alternative)

If you don't want to install Vercel CLI, create a simple mock server:

**Create `scripts/mock-api.mjs`:**

```javascript
import express from "express";

const app = express();
app.use(express.json());

// Mock checkout endpoint
app.post("/api/checkout", (req, res) => {
  const { items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Mock free trial (zero total)
  if (total === 0) {
    return res.json({
      ok: true,
      mode: "lead",
      message: "Trial confirmed. Check your email within 24 hours.",
    });
  }

  // Mock paid checkout (if Stripe configured)
  if (process.env.STRIPE_SECRET_KEY) {
    return res.json({
      ok: true,
      url: "https://checkout.stripe.com/mock",
    });
  }

  // Fallback to lead capture
  return res.json({
    ok: true,
    mode: "lead",
    message: "Order received. We'll email you a payment link within 24 hours.",
  });
});

app.listen(3001, () => {
  console.log("Mock API server running on http://localhost:3001");
});
```

**Add to package.json scripts:**

```json
{
  "scripts": {
    "dev": "vite --config frontend/vite.config.ts",
    "dev:with-api": "concurrently \"vite --config frontend/vite.config.ts\" \"node scripts/mock-api.mjs\""
  }
}
```

**Install concurrently:**

```bash
npm install -D concurrently
```

**Run both dev servers:**

```bash
npm run dev:with-api
```

**Add Vite proxy config:**

```typescript
// frontend/vite.config.ts
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true
    }
  }
}
```

---

## Troubleshooting

### Error: "Unexpected end of JSON input"

**Cause:** Server returned HTML (404 page) instead of JSON  
**Solution:**

- Use `vercel dev` instead of `npm run dev`
- Or set up mock API server

### Error: "Cart is empty"

**Cause:** POST body items array is empty  
**Fix:** Add items to cart before checkout

### Error: "404 Not Found"

**Cause:** Serverless functions don't run with `npm run dev`  
**Solution:** Use `vercel dev` or mock API

### Stripe Redirect Not Working

**Cause:**

- `STRIPE_SECRET_KEY` not set in .env
- Stripe session creation failed
  **Fix:**
- Set valid Stripe key in .env
- Check Stripe dashboard for errors

### No Response from Server

**Cause:** Server crashed or not responding  
**Debug:**

```bash
# Check if server is running
curl -X GET http://localhost:3000/api/checkout

# Look at server logs
# If using vercel dev, check terminal output
```

---

## Testing Scenarios

### Test 1: Free Trial (Zero Total)

```javascript
// Cart with $0 item
const items = [
  {
    id: "trial",
    slug: "free-trial",
    name: "7-Day Trial",
    price: 0,
    quantity: 1,
  },
];

// Expected response:
// { ok: true, mode: 'lead', message: '...' }
```

### Test 2: Paid Purchase (Stripe Available)

```javascript
// Cart with $297 item
const items = [
  {
    id: "prog-1",
    slug: "12-week-program",
    name: "12-Week Transformation",
    price: 297,
    quantity: 1,
  },
];

// Expected response:
// { ok: true, url: 'https://checkout.stripe.com/...' }
// → Browser redirects to Stripe
```

### Test 3: Multiple Items

```javascript
const items = [
  { name: 'Program', price: 297, quantity: 1, ... },
  { name: 'Supplement Pack', price: 99, quantity: 2, ... }
];

// Total: 297 + (99 × 2) = 495

// Expected response:
// { ok: true, url: 'https://checkout.stripe.com/...' }
```

### Test 4: Invalid Cart (Empty)

```javascript
const items = [];

// Expected response:
// { error: 'Cart is empty' } (400 status)
```

---

## Environment Variables

### Required for Checkout

```env
# Site configuration
SITE_URL=https://www.bigronjones.com

# Stripe (for paid checkouts)
STRIPE_SECRET_KEY=sk_live_...

# Email notifications
RESEND_API_KEY=re_...
CONTACT_INBOX_EMAIL=hello@bigronjones.com
```

### Optional

```env
# Custom success/cancel URLs (defaults to site home/checkout)
CHECKOUT_SUCCESS_URL=https://www.bigronjones.com/checkout/success
CHECKOUT_CANCEL_URL=https://www.bigronjones.com/checkout
```

---

## Production Deployment

### Vercel Deployment Steps

1. **Push code to GitHub**

```bash
git push origin main
```

2. **Vercel automatically deploys**
   - Builds frontend with `npm run build`
   - Deploys serverless functions from `backend/api/`
   - Routes `/api/*` to functions

3. **Verify deployment**

```bash
curl -X POST https://your-site.vercel.app/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"items": [{"id":"1","slug":"test","name":"Test","price":100,"quantity":1}]}'
```

### Check Logs

```bash
# View deployment logs
vercel logs

# View function execution logs
vercel logs /api/checkout
```

---

## Code Quality Checklist

✅ **Backend (checkout.ts):**

- [x] Validates input (items exist, prices valid)
- [x] Calculates total correctly
- [x] Handles Stripe configured/not configured
- [x] Returns proper JSON on errors
- [x] Has fallback to lead capture
- [x] Logs errors for debugging
- [x] Uses environment variables safely

✅ **Frontend (CheckoutClient.tsx):**

- [x] Checks response.ok before parsing JSON
- [x] Handles JSON parsing errors
- [x] Checks content-type header
- [x] Provides clear error messages to user
- [x] Submitting state prevents double-click
- [x] Success state clears cart and shows confirmation
- [x] Console logs for debugging

---

## Next Steps

1. **Test locally** using `vercel dev`
2. **Test in Vercel Preview** deployment
3. **Monitor Stripe webhooks** for payment status
4. **Set up email notifications** for new orders
5. **Add analytics tracking** for checkout flow

---

## Support

For issues:

1. Check browser console for errors
2. Check server logs: `vercel logs /api/checkout`
3. Verify environment variables are set
4. Test with mock API if needed
