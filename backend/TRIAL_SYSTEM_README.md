# 7-Day Trial System Documentation

## Overview

This is a production-ready email funnel system for a 7-day coaching trial. It orchestrates:

- Calendly webhook integration for trial activation
- 5 strategic emails sent on specific days
- Recovery metrics tracking with personalization
- Conversion to paid program via Stripe

## Architecture

```
Calendly Event
       ↓
/api/webhooks/calendly (validate + start trial)
       ↓
Create user + set trial_start_date & trial_end_date
       ↓
Send DAY_1_WELCOME immediately
       ↓
Daily cron job checks active trials
       ↓
/api/cron/email-scheduler
       ↓
Send emails on days 2, 4, 6, 7
       ↓
User converts to paid (Stripe checkout)
```

## Files & Their Purpose

### Database Schema

- **backend/sql/03_trial_system.sql**: Creates users, recovery_metrics, training_modules, email_logs tables

### Backend Services

#### Webhook Utilities (backend/lib/webhookUtils.ts)

- `validateCalendlySignature()`: HMAC SHA256 signature validation
- `parseCalendlyPayload()`: Safe payload extraction

#### Email Service (backend/lib/emailService.ts)

- `sendEmail()`: Sends emails via Resend
- 5 email templates: DAY_1_WELCOME, DAY_2_EDUCATION, DAY_4_REINFORCEMENT, DAY_6_PUSH, DAY_7_CONVERSION
- Each template is personalized based on recovery metrics

#### Handlers

**POST /api/webhooks/calendly**

- Validates Calendly webhook signature
- Creates or finds user by email
- Sets trial start/end dates
- Sends welcome email immediately
- Response: 200 OK or 400 Bad Request

**POST /api/cron/email-scheduler?secret=CRON_SECRET**

- Runs daily (configured in vercel.json)
- Queries active trials
- Sends scheduled emails if conditions met
- Prevents duplicates
- Response: Statistics (emails sent, skipped, errors)

**POST /api/test/webhook-calendly** (dev/testing only)

- Simulates Calendly webhook without signature
- Helps test email sending in development
- Body:
  ```json
  {
    "email": "user@example.com",
    "name": "John Doe",
    "eventStartTime": "2025-05-10T10:00:00Z",
    "testEmailType": "DAY_1_WELCOME"
  }
  ```

## Setup Instructions

### 1. Database Setup

Run the schema migration in Supabase:

```bash
# Go to Supabase → SQL Editor
# Copy/paste backend/sql/03_trial_system.sql
# Click "Run"
```

Creates:

- `public.users` - trial users
- `public.recovery_metrics` - daily metrics
- `public.training_modules` - coaching content
- `public.email_logs` - email history + duplicate prevention

### 2. Environment Variables

Add these to `.env` (local) and Vercel Project Settings:

```env
CALENDLY_WEBHOOK_SECRET=your_calendly_secret_here
CRON_SECRET=openssl rand -hex 32
STRIPE_CHECKOUT_LINK=https://buy.stripe.com/3cIbJ0djw9QUbzn3HMdUY0p
SITE_URL=https://bigronjones.com
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Big Ron Jones <ron@bigronjones.com>
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 3. Calendly Integration

1. Go to Calendly → Settings → Integrations → Webhooks
2. Create new webhook:
   - URL: `https://YOUR-DOMAIN.com/api/webhooks/calendly`
   - Event: `invitee.created`
   - Signing key: Copy and paste to `CALENDLY_WEBHOOK_SECRET`

### 4. Cron Job Setup

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/email-scheduler",
      "schedule": "0 6 * * *"
    }
  ]
}
```

This runs daily at 6 AM UTC.

### 5. Testing

**Test the Calendly webhook:**

```bash
curl -X POST http://localhost:3000/api/test/webhook-calendly \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "name": "Test User",
    "eventStartTime": "2025-05-10T10:00:00Z"
  }'
```

**Test the email scheduler:**

```bash
curl -X POST "http://localhost:3000/api/cron/email-scheduler?secret=YOUR_CRON_SECRET"
```

## Email Schedule

| Day | Email Type          | Subject                     | CTA                     |
| --- | ------------------- | --------------------------- | ----------------------- |
| 1   | DAY_1_WELCOME       | Welcome to Your 7-Day Trial | Go to Dashboard         |
| 2   | DAY_2_EDUCATION     | The Recovery Formula        | View Your Insight       |
| 4   | DAY_4_REINFORCEMENT | Halfway There               | View Your Analysis      |
| 6   | DAY_6_PUSH          | Two Days Left               | Complete Your Trial     |
| 7   | DAY_7_CONVERSION    | Trial Complete—Next Steps   | Upgrade to Full Program |

## Email Personalization

Emails are personalized using recovery metrics:

```typescript
// If soreness > 6
"Your soreness is elevated. Dial back intensity and prioritize sleep.";

// If energy < 5
"Your energy is low. This might indicate insufficient recovery or overtraining.";

// Average metrics shown
"Avg Energy: 7.2/10";
"Avg Soreness: 4.1/10";
```

## Duplicate Prevention

The `email_logs` table ensures each user gets each email only once per trial day:

```typescript
// Before sending
const alreadySent = await hasEmailBeenSent(db, userId, emailType, trialDay);
if (alreadySent) {
  // Skip
}

// Record sent
await db.from("email_logs").insert({
  user_id: userId,
  email_type: emailType,
  trial_day: trialDay,
  sent_at: NOW,
  unique(user_id, email_type, trial_day)
});
```

## Error Handling

**Edge Cases Handled:**

1. ✓ Invalid webhook signature → 400 Bad Request
2. ✓ Missing required fields → 400 Bad Request
3. ✓ User not found → Create new user
4. ✓ Trial already started → Skip (log warning)
5. ✓ Email send failure → Logged, retry next day
6. ✓ Trial expired → Mark `trial_completed_at`
7. ✓ Duplicate email attempt → Skip (duplicate prevention)
8. ✓ Invalid recovery metrics → Use defaults
9. ✓ Missing Resend config → Return 500 error

## Monitoring & Debugging

**Check email logs:**

```sql
-- All emails sent to a user
SELECT * FROM email_logs
WHERE user_id = 'user-id'
ORDER BY sent_at DESC;

-- Emails with errors
SELECT * FROM email_logs
WHERE error_message IS NOT NULL;

-- Daily summary
SELECT
  DATE(sent_at) as date,
  email_type,
  COUNT(*) as count
FROM email_logs
GROUP BY DATE(sent_at), email_type
ORDER BY date DESC;
```

**View active trials:**

```sql
SELECT
  email,
  EXTRACT(DAY FROM (NOW() - trial_start_date))::int as days_into_trial,
  trial_end_date
FROM users
WHERE trial_completed_at IS NULL
  AND trial_start_date IS NOT NULL;
```

## Production Checklist

- [ ] Database schema deployed (03_trial_system.sql)
- [ ] Environment variables set in Vercel
- [ ] Calendly webhook configured with correct secret
- [ ] Cron job added to vercel.json
- [ ] Test webhook endpoint works
- [ ] Test email sending works
- [ ] Email templates reviewed for brand voice
- [ ] Stripe checkout link updated in templates
- [ ] Recovery metrics collection implemented in frontend
- [ ] Dashboard analytics/insights page built

## Conversion Tracking

### User Journey Metrics

```sql
-- Trial start to paid conversion rate
SELECT
  COUNT(CASE WHEN trial_start_date IS NOT NULL THEN 1 END) as trials_started,
  COUNT(CASE WHEN converted_to_paid = true THEN 1 END) as converted,
  ROUND(
    100.0 * COUNT(CASE WHEN converted_to_paid = true THEN 1 END) /
    COUNT(CASE WHEN trial_start_date IS NOT NULL THEN 1 END),
    2
  ) as conversion_rate_pct
FROM users;

-- Average trial days before conversion
SELECT
  AVG(EXTRACT(DAY FROM (paid_start_date - trial_start_date)))::int as avg_days_to_convert
FROM users
WHERE converted_to_paid = true;

-- Email engagement
SELECT
  email_type,
  COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opens,
  COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) as clicks,
  ROUND(
    100.0 * COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) / COUNT(*),
    2
  ) as ctr_pct
FROM email_logs
GROUP BY email_type;
```

## Future Enhancements

1. **Advanced Personalization**
   - Segment users by fitness level, age, goals
   - Adjust email content dynamically

2. **A/B Testing**
   - Test email subject lines
   - Test CTA copy variations

3. **SMS Integration**
   - Send SMS on days 1, 4, 7 for higher engagement
   - Use Twilio for SMS delivery

4. **Slack Notifications**
   - Alert when user converts
   - Daily summary to coaching team

5. **Lead Scoring**
   - Track engagement metrics
   - Predict conversion probability

6. **Email Unsubscribe Handling**
   - Respect unsubscribe preferences
   - Suppress from future sends

## Support

For issues or questions, check:

1. `/api/test/webhook-calendly` - verify webhook flow
2. `email_logs` table - check for send errors
3. Supabase logs - database errors
4. Resend dashboard - email delivery status
