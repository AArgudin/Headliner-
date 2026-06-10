# ROSTER — Agentic Operating System for Music Artists

> Your operator. Not your advisor.

ROSTER is a full-stack AI-powered platform that runs the back office of a music artist's career autonomously — bookings, content, invoices, PR, and weekly intelligence briefs.

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** — dark, minimal UI
- **Prisma + SQLite** — local dev (swap to Postgres for production)
- **Anthropic Claude** (claude-sonnet-4-6) — powers all 5 agents
- **NextAuth.js** — email-based authentication

## The 5 Agents

| Agent | What it does |
|---|---|
| 📅 Booking Agent | Reads inquiries, drafts responses, generates performance contracts |
| 📱 Content Agent | Writes weekly post batches and on-demand content in the artist's voice |
| 💰 Revenue Agent | Tracks invoices, sends automated overdue reminders, revenue analytics |
| 📣 PR Agent | Creates outreach campaigns, writes personalized pitch emails to blogs/curators |
| 🧠 Intel Agent | Synthesizes all data into a Monday morning brief |

## Quick Start

### 1. Clone and install
```bash
git clone <your-repo>
cd roster
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
```

Edit `.env` and add:
- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com)
- `NEXTAUTH_SECRET` — run `openssl rand -base64 32`

### 3. Set up database
```bash
npx prisma db push
npm run db:seed
```

### 4. Run locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo login:** `demo@roster.app` (or any email)

---

## Project Structure

```
src/
├── agents/          # The 5 AI agent modules
│   ├── booking.ts
│   ├── content.ts
│   ├── revenue.ts
│   ├── pr.ts
│   └── intel.ts
├── app/
│   ├── (auth)/login/    # Auth pages
│   ├── (dashboard)/     # All protected pages
│   │   ├── dashboard/
│   │   ├── bookings/
│   │   ├── content/
│   │   ├── revenue/
│   │   ├── pr/
│   │   └── settings/
│   └── api/             # API routes
├── lib/
│   ├── anthropic.ts     # Claude client
│   ├── auth.ts          # NextAuth config
│   └── prisma.ts        # DB client
prisma/
├── schema.prisma        # Full data model
└── seed.ts              # Demo data
```

---

## Deploying to Production

### Vercel (recommended)
```bash
npm install -g vercel
vercel
```

Set env vars in Vercel dashboard. Swap `DATABASE_URL` to a Postgres connection string (Neon, Supabase, or PlanetScale all work).

### Update schema for Postgres
In `prisma/schema.prisma`, change:
```prisma
datasource db {
  provider = "postgresql"  # was "sqlite"
  url      = env("DATABASE_URL")
}
```

---

## Pricing Tiers to Implement

| Tier | Price | Limit |
|---|---|---|
| Solo | $49/mo | 1 artist, 2 agents |
| Artist | $149/mo | 1 artist, all 5 agents |
| Agency | $349/mo | 10 artists, all agents |

---

## What to Build Next

1. **Email integration** — connect Gmail/IMAP for the Booking Agent to monitor real inquiries
2. **TikTok/Instagram API** — auto-post scheduled content
3. **Stripe** — subscription billing
4. **Cron jobs** — run agents on schedule (Vercel Cron or QStash)
5. **Artist onboarding flow** — guided setup wizard
6. **Mobile app** — React Native with same API

---

Built for 4FOUR Management and the electronic music community. Miami, FL.
