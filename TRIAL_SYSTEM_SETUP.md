# 7-Day Trial System - Complete Setup Guide

## Quick Start (5 minutes)

### 1. Run the Database Migration

```bash
# In Supabase console → SQL Editor, paste:
```

[Contents of backend/sql/03_trial_system.sql]

```
# Then click "Run"
```

### 2. Set Environment Variables

**Local (.env):**

```bash
CALENDLY_WEBHOOK_SECRET=abc123...
CRON_SECRET=$(openssl rand -hex 32)
STRIPE_CHECKOUT_LINK=https://buy.stripe.com/3cIbJ0djw9QUbzn3HMdUY0p
```

**Vercel Project Settings:**

- Go to Settings → Environment Variables
- Add all env vars from .env.example

### 3. Configure Calendly Webhook

1. Log into Calendly
2. Settings → Integrations → Webhooks
3. Create New Webhook:
   - **URL:** `https://YOUR-DOMAIN.com/api/webhooks/calendly`
   - **Event:** `invitee.created`
   - **Signing Secret:** Copy → `CALENDLY_WEBHOOK_SECRET`

### 4. Test Everything

```bash
# Test webhook locally
curl -X POST http://localhost:3000/api/test/webhook-calendly \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "eventStartTime": "2025-05-10T10:00:00Z"
  }'

# Expected response:
# {
#   "success": true,
#   "data": {
#     "userId": "...",
#     "email": "test@example.com",
#     "emailSent": true
#   }
# }
```

```bash
# Test email scheduler
curl -X POST "http://localhost:3000/api/cron/email-scheduler?secret=YOUR_CRON_SECRET"

# Expected response:
# {
#   "emailsSent": 0,
#   "skipped": 0,
#   "errors": 0,
#   "details": []
# }
```

---

## Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ CALENDLY BOOKING                                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
        ┌───────────────────────────────────┐
        │ POST /api/webhooks/calendly       │
        │ Validate HMAC SHA256 signature    │
        │ Parse invitee + event data        │
        └───────────────┬─────────────────────┘
                        │
        ┌───────────────↓─────────────────────┐
        │ DATABASE UPDATES:                 │
        │ - Create/find user                │
        │ - Set trial_start_date (NOW)      │
        │ - Set trial_end_date (NOW + 7d)   │
        │ - Mark has_booked_calendly=true   │
        └───────────────┬─────────────────────┘
                        │
        ┌───────────────↓─────────────────────┐
        │ SEND DAY_1_WELCOME EMAIL           │
        │ Via Resend API                    │
        │ Record in email_logs table        │
        └───────────────┬─────────────────────┘
                        │
                        ↓
        ┌───────────────────────────────────┐
        │ DAILY CRON JOB (6 AM UTC)         │
        │ /api/cron/email-scheduler         │
        └───────────────┬─────────────────────┘
                        │
        ┌───────────────↓─────────────────────┐
        │ For each active trial:            │
        │ - Calculate trial_day (1-7)       │
        │ - Check EMAIL_SCHEDULE[day]       │
        │ - Check duplicate prevention      │
        │ - Get recovery metrics            │
        │ - Send personalized email         │
        └───────────────┬─────────────────────┘
                        │
                        ↓
        ┌───────────────────────────────────┐
        │ DAY 7: DAY_7_CONVERSION EMAIL     │
        │ Includes Stripe checkout link     │
        └───────────────┬─────────────────────┘
                        │
                        ↓
        ┌───────────────────────────────────┐
        │ USER CLICKS UPGRADE LINK          │
        │ Stripe checkout → Payment         │
        └───────────────┬─────────────────────┘
                        │
                        ↓
        ┌───────────────────────────────────┐
        │ YOUR STRIPE WEBHOOK               │
        │ Call trialIntegration.ts:         │
        │ convertToPaidProgram(userId)      │
        └───────────────────────────────────┘
```

### Database Schema

```
users
├─ id (PK)
├─ email (unique)
├─ name
├─ has_booked_calendly
├─ trial_start_date
├─ trial_end_date
├─ trial_completed_at (NULL until 7 days or conversion)
├─ converted_to_paid
└─ paid_start_date

recovery_metrics
├─ id (PK)
├─ user_id (FK)
├─ metric_date (unique per user)
├─ energy_level (1-10)
├─ soreness_level (0-10)
├─ sleep_hours
├─ sleep_quality
├─ resting_heart_rate
├─ heart_rate_variability
├─ steps
├─ water_intake_liters
└─ notes

email_logs (duplicate prevention)
├─ id (PK)
├─ user_id (FK)
├─ email_type (DAY_1_WELCOME, DAY_2_EDUCATION, etc.)
├─ trial_day (1-7)
├─ sent_at (timestamp)
├─ opened_at
├─ clicked_at
└─ unique(user_id, email_type, trial_day)

training_modules
├─ id (PK)
├─ slug
├─ title
├─ content_html
├─ key_takeaways
├─ video_url
├─ trial_day (1-7)
├─ program_type
└─ duration_minutes
```

---

## Files Created

| File                                   | Purpose                               |
| -------------------------------------- | ------------------------------------- |
| `backend/sql/03_trial_system.sql`      | Database schema                       |
| `backend/lib/webhookUtils.ts`          | Signature validation, payload parsing |
| `backend/lib/emailService.ts`          | Email templates, sending logic        |
| `backend/api/webhooks-calendly.ts`     | Calendly webhook handler              |
| `backend/api/cron-email-scheduler.ts`  | Daily email scheduler                 |
| `backend/api/test-webhook-calendly.ts` | Test endpoint for dev                 |
| `backend/lib/trialIntegration.ts`      | Helper functions for your code        |
| `vercel.json`                          | Cron job configuration (added)        |
| `.env.example`                         | Environment variables (updated)       |

---

## Integration Checklist

### Phase 1: Infrastructure (Hour 1)

- [ ] Run `03_trial_system.sql` in Supabase
- [ ] Add environment variables to Vercel
- [ ] Test: `POST /api/test/webhook-calendly`

### Phase 2: Calendly Integration (Hour 2)

- [ ] Configure webhook in Calendly dashboard
- [ ] Test: Use Calendly webhook tester
- [ ] Verify user created in database
- [ ] Verify welcome email sent

### Phase 3: Frontend (Hour 3-4)

- [ ] Build recovery metrics form
- [ ] Call `/api/dashboard/recovery-metric` (create this)
- [ ] Display trial status
- [ ] Show recovery chart

### Phase 4: Testing (Hour 5)

- [ ] Simulate full 7-day trial locally
- [ ] Test email personalization
- [ ] Test duplicate prevention
- [ ] Test conversion flow

### Phase 5: Deployment (Hour 6)

- [ ] Deploy to Vercel
- [ ] Enable cron job in Vercel UI
- [ ] Monitor first day of cron runs
- [ ] Check email logs for errors

---

## Email Send Times

Cron job runs at **6 AM UTC** daily.

| Trial Day | Email Sent     | Time            | Hours Since Booking |
| --------- | -------------- | --------------- | ------------------- |
| 1         | Immediately    | When user books | 0                   |
| 2         | Next day @6 AM | ~6-30 hours     | 6-30                |
| 4         | Day 4 @6 AM    | ~78-102 hours   | 78-102              |
| 6         | Day 6 @6 AM    | ~126-150 hours  | 126-150             |
| 7         | Day 7 @6 AM    | ~150-174 hours  | 150-174             |

**Note:** Actual times depend on when user books. Emails won't be duplicated even if scheduler runs multiple times.

---

## Monitoring & Troubleshooting

### Check if trials are active:

```sql
SELECT
  email,
  trial_start_date,
  trial_end_date,
  EXTRACT(DAY FROM (NOW() - trial_start_date))::int + 1 as current_trial_day
FROM users
WHERE trial_completed_at IS NULL
  AND trial_start_date IS NOT NULL
ORDER BY trial_start_date DESC;
```

### Check email failures:

```sql
SELECT
  email_type,
  COUNT(*),
  array_agg(error_message) as errors
FROM email_logs
WHERE error_message IS NOT NULL
GROUP BY email_type;
```

### Check conversion rate:

```sql
SELECT
  COUNT(*) as total_trials,
  COUNT(CASE WHEN converted_to_paid THEN 1 END) as conversions,
  ROUND(100.0 * COUNT(CASE WHEN converted_to_paid THEN 1 END) / COUNT(*), 2) as rate_pct
FROM users
WHERE trial_start_date IS NOT NULL;
```

### Common Issues & Fixes

**Issue: Calendly webhook returns 400**

```
Solution: Check CALENDLY_WEBHOOK_SECRET environment variable
- Verify it matches Calendly dashboard
- Ensure no extra spaces or quotes
```

**Issue: Emails not sending**

```
Solution: Check Resend configuration
- Verify RESEND_API_KEY is set
- Check Resend dashboard for failed deliveries
- Look for error logs: `SELECT * FROM email_logs WHERE error_message IS NOT NULL`
```

**Issue: Cron job not running**

```
Solution: Verify Vercel configuration
- Go to Vercel → Settings → Cron Jobs
- Confirm schedule: `0 6 * * *`
- Check cron logs in Vercel dashboard
- Run manually: /api/cron/email-scheduler?secret=YOUR_CRON_SECRET
```

**Issue: Duplicate emails being sent**

```
Solution: Email logs unique constraint is failing
- Check: SELECT COUNT(*) FROM email_logs GROUP BY user_id, email_type, trial_day HAVING COUNT(*) > 1
- Rebuild database if needed
```

---

## Frontend Integration Example

### Recovery Metrics Form

```tsx
import { useState } from "react";

export function RecoveryMetricsForm({ userId }: { userId: string }) {
  const [energyLevel, setEnergyLevel] = useState(5);
  const [sorenessLevel, setSorenessLevel] = useState(3);
  const [sleepHours, setSleepHours] = useState(7);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/dashboard/recovery-metric", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          energyLevel,
          sorenessLevel,
          sleepHours,
          notes,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      const data = await response.json();
      console.log("Metric saved:", data.trialStatus);
      // Show success message
    } catch (error) {
      console.error(error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Energy Level: {energyLevel}/10</label>
        <input
          type="range"
          min="1"
          max="10"
          value={energyLevel}
          onChange={(e) => setEnergyLevel(Number(e.target.value))}
        />
      </div>

      <div>
        <label>Soreness: {sorenessLevel}/10</label>
        <input
          type="range"
          min="0"
          max="10"
          value={sorenessLevel}
          onChange={(e) => setSorenessLevel(Number(e.target.value))}
        />
      </div>

      <div>
        <label>Sleep Hours: {sleepHours.toFixed(1)}</label>
        <input
          type="range"
          min="0"
          max="12"
          step="0.5"
          value={sleepHours}
          onChange={(e) => setSleepHours(Number(e.target.value))}
        />
      </div>

      <textarea
        placeholder="Any notes? (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Log Metrics"}
      </button>
    </form>
  );
}
```

---

## Performance & Scalability

### Expected Volume

- 1000s of concurrent trials
- 5-10 emails per user per trial
- ~500 emails/day with 100 active trials

### Optimization Tips

1. **Email Batch Size:** Process 50 users per cron invocation
2. **Database Indexes:** Already included in schema
3. **Caching:** Store email templates in memory
4. **Rate Limiting:** Use Resend's built-in rate limiting

### Monitoring

```sql
-- Check cron job duration
SELECT
  DATE(sent_at) as date,
  COUNT(*) as emails_sent
FROM email_logs
GROUP BY DATE(sent_at)
ORDER BY date DESC;

-- Identify slow queries
SELECT
  QUERY,
  mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## Next Steps

1. **Add Frontend Dashboard**
   - Trial countdown
   - Recovery metrics chart
   - Email history

2. **Add Analytics**
   - Email open/click tracking
   - Conversion tracking
   - User segmentation

3. **Add SMS Support**
   - Send SMS on days 1, 4, 7
   - Integrating Twilio

4. **Add Support Integration**
   - Help center articles
   - Support ticket creation
   - In-app chat

5. **Add Advanced Features**
   - A/B testing email subject lines
   - Dynamic content based on recovery
   - Predictive churn scoring

---

## Support & Questions

- **Webhook not working?** → Check `CALENDLY_WEBHOOK_SECRET`
- **Emails not sending?** → Check `RESEND_API_KEY` + Resend dashboard
- **Scheduler not running?** → Check Vercel cron configuration
- **SQL errors?** → Check schema file ran correctly in Supabase

For debugging, enable verbose logging in `/backend/api/cron-email-scheduler.ts` (already included).
