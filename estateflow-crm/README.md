# EstateFlow CRM

A production-ready, mobile-first Real Estate CRM built with Next.js 15, Supabase, Tailwind CSS, and shadcn/ui.

## Features

- **Lead Management** — Create, filter, search, and track leads from multiple sources
- **Instant Call Bridge** — Twilio-powered auto-call system: new lead → call agent → bridge to lead
- **Property Inventory** — Full property management with images, documents, and sharing
- **One-Click Follow-ups** — WhatsApp, SMS, Email follow-ups with templates
- **Attendance Tracking** — GPS-based check-in/check-out with selfie support
- **Social Media Calendar** — Plan, draft, schedule, and publish social posts
- **Team Management** — Role-based access for Admin, Sales Manager, Agent, Field Executive, Social Media Manager
- **Dashboard & Reports** — Real-time metrics, charts, and activity feeds
- **Webhook API** — Accept leads from 36 Acre, MagicBricks, Facebook Ads, Zapier, etc.
- **Notifications** — In-app notifications for new leads, missed calls, follow-ups, and more

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes / Server Actions |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Voice Calls | Twilio Voice (with dry-run mode) |
| Messaging | Twilio WhatsApp/SMS (with dry-run mode) |
| Email | Resend (with dry-run mode) |
| AI | OpenAI-compatible API (with dry-run mode) |
| Charts | Recharts |

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase account (free tier works)

### 1. Clone & Install

```bash
cd estateflow-crm
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration file: `supabase/migrations/001_initial_schema.sql`
3. Copy your project URL and API keys from **Settings → API**

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Seed Data (Optional)

```bash
npm install --save-dev tsx dotenv
npx tsx scripts/seed.ts
```

Demo credentials after seeding:
- **Admin:** admin@estateflow.demo / demo123456
- **Agent 1:** agent1@estateflow.demo / demo123456
- **Agent 2:** agent2@estateflow.demo / demo123456

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Twilio Setup (Optional)

1. Create a Twilio account at [twilio.com](https://twilio.com)
2. Get a phone number with Voice capabilities
3. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` in environment
4. Set `DRY_RUN=false` to enable live calls
5. Configure webhook URLs in Twilio console to point to your deployed app

### Webhook Testing

```bash
# Test lead intake webhook
curl -X POST http://localhost:3000/api/webhooks/leads \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-secret" \
  -d '{
    "fullName": "Test Lead",
    "phone": "+919999999999",
    "email": "test@example.com",
    "source": "36 Acre",
    "propertyType": "Apartment",
    "budgetMin": 7500000,
    "budgetMax": 12000000,
    "preferredLocation": "Gurgaon",
    "notes": "Looking for 3BHK near Golf Course Road"
  }'
```

## Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Auth pages (login, signup)
│   ├── (dashboard)/        # Dashboard layout with bottom nav
│   │   ├── dashboard/      # Dashboard page
│   │   ├── leads/          # Lead management
│   │   ├── properties/     # Property inventory
│   │   ├── followups/      # Follow-up system
│   │   ├── attendance/     # Employee attendance
│   │   ├── social/         # Social media calendar
│   │   ├── team/           # Team management
│   │   ├── reports/        # Reports & analytics
│   │   ├── settings/       # Integrations settings
│   │   └── notifications/  # Notifications
│   └── api/                # API routes
│       ├── webhooks/leads/ # Lead intake webhook
│       └── calls/          # Twilio call handlers
├── actions/                # Server Actions
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Layout components
│   ├── dashboard/          # Dashboard components
│   ├── leads/              # Lead components
│   ├── properties/         # Property components
│   ├── followups/          # Follow-up components
│   ├── attendance/         # Attendance components
│   ├── social/             # Social media components
│   └── shared/             # Shared components
├── lib/                    # Utilities & config
│   ├── supabase/           # Supabase client setup
│   ├── constants.ts        # App constants
│   └── utils.ts            # Utility functions
├── services/               # Service adapters (dry-run support)
│   ├── call-service.ts     # Twilio Voice
│   ├── message-service.ts  # WhatsApp/SMS
│   ├── email-service.ts    # Resend/SMTP
│   ├── lead-assignment-service.ts
│   ├── property-share-service.ts
│   ├── attendance-service.ts
│   └── social-post-service.ts
└── types/                  # TypeScript types
```

## Service Adapters

All external integrations use service adapters with **dry-run mode**. When API keys are not configured or `DRY_RUN=true`, services simulate calls/messages and log to console instead of making real API calls.

| Service | Production | Dry Run |
|---------|-----------|---------|
| Call Bridge | Twilio Voice API | Console log + fake SIDs |
| WhatsApp | Twilio WhatsApp | Console log + fake message ID |
| SMS | Twilio SMS | Console log + fake message ID |
| Email | Resend API | Console log + fake message ID |
| AI Captions | OpenAI API | Template-based fallback |

## User Roles

| Role | Permissions |
|------|------------|
| Admin | Full access: manage team, leads, properties, settings, reports |
| Sales Manager | View/assign leads, track agents, manage follow-ups |
| Sales Agent | View assigned leads, call, message, share properties |
| Field Executive | Attendance, site visits, visit notes |
| Social Media Manager | Content calendar, post management |

## License

Private — for internal use.
