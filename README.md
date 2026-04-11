# ResellerOS — The Reseller's Operating System

A full-stack SaaS application for resellers to track inventory, calculate profit, manage orders, generate receipts, and price items intelligently.

---

## Quick Start (Demo Mode — No setup needed)

```bash
# 1. Extract the archive and enter the folder
cd reseller-os

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev

# 4. Open in browser
# http://localhost:3000
```

In demo mode all data is stored in your browser's localStorage. No accounts, no database, no payments required. Everything works immediately.

---

## Folder Structure

```
reseller-os/
├── src/
│   ├── app/
│   │   ├── page.tsx                  ← Landing page (marketing site)
│   │   ├── login/page.tsx            ← Login with Supabase + demo fallback
│   │   ├── signup/page.tsx           ← Signup with plan selection
│   │   ├── dashboard/page.tsx        ← Main dashboard with charts
│   │   ├── inventory/page.tsx        ← Full inventory manager
│   │   ├── orders/page.tsx           ← Order pipeline (Pro+)
│   │   ├── customers/page.tsx        ← Customer manager (Pro+)
│   │   ├── receipts/page.tsx         ← Receipt generator + PDF
│   │   ├── receipts/verify/page.tsx  ← Public receipt verification
│   │   ├── calculator/page.tsx       ← Profit calculator
│   │   ├── pricing/page.tsx          ← Auto pricing engine (Premium)
│   │   ├── restock/page.tsx          ← Restock alerts (coming V3)
│   │   ├── billing/page.tsx          ← Plan management + Stripe
│   │   ├── billing/success/page.tsx  ← Post-checkout confirmation
│   │   ├── settings/page.tsx         ← Profile + account settings
│   │   └── api/
│   │       └── stripe/
│   │           ├── create-checkout/route.ts  ← Start Stripe checkout
│   │           ├── portal/route.ts           ← Open Stripe portal
│   │           └── webhook/route.ts          ← Handle subscription events
│   │
│   ├── components/
│   │   ├── layout/AppLayout.tsx      ← Sidebar nav, topbar, user pill
│   │   └── ui/
│   │       ├── index.tsx             ← Button, Card, Input, Modal, etc.
│   │       └── UpgradeGate.tsx       ← Plan-gating wrapper + banner
│   │
│   ├── lib/
│   │   ├── auth-context.tsx          ← useAuth(), usePlanLimits() hooks
│   │   ├── store.ts                  ← localStorage CRUD (swap for Supabase)
│   │   ├── utils.ts                  ← formatCurrency, calcProfit, cn(), etc.
│   │   ├── pdf.ts                    ← jsPDF receipt generation
│   │   └── supabase/
│   │       ├── client.ts             ← Browser Supabase client
│   │       └── server.ts             ← Server-side Supabase client
│   │
│   ├── middleware.ts                 ← Route protection (when Supabase is live)
│   └── types/index.ts                ← TypeScript interfaces for all models
│
├── supabase-schema.sql               ← Paste into Supabase SQL editor
├── .env.local.example                ← Copy to .env.local and fill in keys
└── package.json
```

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_PREMIUM=price_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Setting Up Supabase (for real accounts)

### 1. Create a project
- Go to https://supabase.com → New Project
- Save your database password somewhere safe

### 2. Get your API keys
- Project Settings → API
- Copy: **Project URL**, **anon public key**, **service_role key**
- Paste into `.env.local`

### 3. Run the schema
- Supabase Dashboard → SQL Editor → New Query
- Paste the entire contents of `supabase-schema.sql`
- Click Run

This creates 5 tables: `user_plans`, `inventory`, `customers`, `orders`, `receipts` — all with Row Level Security so users can only access their own data.

### 4. Enable Email Auth
- Authentication → Providers → Email → Enable

### 5. (Optional) Disable email confirmation for local dev
- Authentication → Email Templates → Confirm signup → uncheck "Enable email confirmations"

---

## Setting Up Stripe (for payments)

### 1. Create a Stripe account
- https://dashboard.stripe.com/register

### 2. Create products
- Stripe Dashboard → Products → Add product
  - **Pro plan**: $10/month recurring → copy the **Price ID** (starts with `price_`)
  - **Premium plan**: $20/month recurring → copy the **Price ID**
- Paste both Price IDs into `.env.local`

### 3. Get API keys
- Stripe Dashboard → Developers → API Keys
- Copy the **Secret key** → paste as `STRIPE_SECRET_KEY`

### 4. Set up webhook (for subscription events)
- Stripe Dashboard → Developers → Webhooks → Add endpoint
- URL: `https://yourdomain.com/api/stripe/webhook`
  - For local testing use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Events to listen for:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Copy the **Signing secret** → paste as `STRIPE_WEBHOOK_SECRET`

### 5. Configure customer portal
- Stripe Dashboard → Settings → Billing → Customer portal
- Enable: Allow customers to cancel subscriptions, update payment methods

---

## Plan Feature Gates

| Feature | Free | Pro ($10/mo) | Premium ($20/mo) |
|---|---|---|---|
| Inventory items | 10 max | Unlimited | Unlimited |
| Profit calculator | ✅ | ✅ | ✅ |
| Receipts | 5/month | Unlimited | Unlimited |
| Orders & Customers | ❌ | ✅ | ✅ |
| CSV Export | ❌ | ✅ | ✅ |
| Auto Pricing | ❌ | ❌ | ✅ |
| Restock Alerts | ❌ | ❌ | ✅ (V3) |

Gates are enforced in `src/components/ui/UpgradeGate.tsx` and `src/lib/auth-context.tsx`. In demo mode all gates are disabled.

---

## Deploying to Production

### Vercel (recommended)
```bash
npm install -g vercel
vercel

# Set all env vars in Vercel dashboard → Project → Settings → Environment Variables
# Update NEXT_PUBLIC_APP_URL to your production domain
# Update Stripe webhook URL to your production domain
```

### Self-hosted
```bash
npm run build
npm start
```

---

## Migrating from localStorage to Supabase

The app currently uses `src/lib/store.ts` (localStorage) for all data. To fully migrate to Supabase:

1. For each function in `store.ts`, replace with a Supabase query using the schemas in `supabase-schema.sql`
2. Add `user_id: user.id` to all insert/update calls
3. All RLS policies are already in place — queries automatically filter by the authenticated user
4. The data models are identical between localStorage and Supabase (same field names, just snake_case in SQL)

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| Payments | Stripe |
| Charts | Recharts |
| PDF | jsPDF |
| Icons | Lucide React |
| Toast | react-hot-toast |
| Data (demo) | Browser localStorage |
