# Dealism Clone — AI Sales Agent SaaS

A **100% functional** clone of [dealism.ai](https://dealism.ai). AI sales agent platform that auto-replies to WhatsApp, Instagram, and web-chat customers 24/7. Built with Next.js 14, Prisma, OpenAI, and Baileys (QR-scan WhatsApp — same method Dealism uses).

## ✨ Features

### Public site
- Landing page (hero, features, pricing, testimonials, FAQ)
- Pricing page (dynamic from DB)
- Guides index
- Sign-up / sign-in (welcome email via Resend when configured)

### User Dashboard
- Agents builder (no-code, prompt-based)
- Knowledge base (text + URL scraping + auto embeddings)
- Channels — **WhatsApp** (Baileys QR scan) and **Telegram** (BotFather token)
- Live conversations view (polling, send reply, auto-reply toggle)
- Account settings, plan & usage tracking (auto email warning at 80%/100%)

### Admin Panel (accessible to role=admin)
- **Multi-LLM provider switcher** — OpenAI, DeepSeek, xAI Grok, Groq, Mistral, OpenRouter, Together, Fireworks, Gemini, Cerebras, or any custom OpenAI-compatible endpoint (Ollama / vLLM / LocalAI)
- Separate **embeddings** config (use a cheap chat provider + OpenAI text-embedding-3-small for cost optimisation)
- Razorpay (Key + Secret + Webhook Secret)
- Telegram default bot token
- Email (Resend API key + From address)
- S3-compatible backups (Wasabi / B2 / R2 / MinIO / AWS)
- Sentry DSN
- Branding (name, tagline)
- Users management (promote/demote admin, delete, view usage)
- Plans editor (edit pricing tiers shown on public /price)

### AI Engine
- Retrieval-augmented generation (RAG) with OpenAI embeddings
- In-memory cosine similarity search over knowledge base
- Conversation memory (last 20 messages)
- Multi-language (English / Hindi / Spanish / Portuguese)
- Auto self-learning (stores successful interactions back to KB)

### WhatsApp
- QR-code scan via [Baileys](https://github.com/WhiskeySockets/Baileys)
- Auto-reply with AI
- Live reply from dashboard (sends back out through WhatsApp)
- Auth persistence per channel

### Telegram
- Bot token from [@BotFather](https://t.me/BotFather)
- Long-poll based — no webhook server / public URL required
- Auto-reply with AI, same RAG + KB pipeline as WhatsApp
- Per-channel offset tracking so a restart doesn't replay old messages

### Operational
- **Background-job queue** (BullMQ + Redis, falls back to inline execution without Redis) — used for follow-up reminders & deferred work
- **Daily backups** — SQL dump + Baileys auth state → S3-compatible bucket (`npm run backup`, cron-friendly)
- **Error monitoring** — Sentry SDK initialised on the Node runtime when DSN is set

## 🚀 Quick start (local)

```bash
cd dealism-clone
npm install
cp .env.example .env         # edit admin credentials if desired
npx prisma migrate dev       # creates SQLite DB
npm run db:seed              # creates admin user + default plans + settings
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Login as admin:** email/password from your `.env` (default `admin@dealism.local` / `admin123`). Then:

1. Go to **Admin → API Keys** and enter your **OpenAI API key**. Click "Test connection".
2. Back on **Dashboard → Agents**, a default agent was auto-created for your admin user. Edit its prompt.
3. Go to **Dashboard → Channels → Connect WhatsApp**, scan the QR with your phone's WhatsApp (Settings → Linked Devices → Link a device).
4. Send a WhatsApp message to yourself — the AI will reply.

## 🔑 API Keys Needed

Only one is required to have a working AI: **OpenAI**. All others are optional.

| Key | Where to configure | Notes |
|---|---|---|
| `OPENAI_API_KEY` | **Admin → Settings** (or `.env`) | Required. Get at [platform.openai.com](https://platform.openai.com/api-keys). |
| `OPENAI_MODEL` | Admin → Settings | Default `gpt-4o-mini` (cheapest). |
| `RAZORPAY_KEY_ID` / `SECRET` | Admin → Settings | Optional, for subscriptions. |
| `NEXTAUTH_SECRET` | `.env` | Required for session encryption. |

WhatsApp does NOT need an API key — it uses Baileys' QR-scan (WhatsApp Linked Devices).

## 🏗️ Tech stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Prisma** ORM + SQLite (easy swap to Postgres — change `DATABASE_URL` and `provider` in schema)
- **NextAuth v4** for auth (credentials provider)
- **OpenAI SDK** for chat & embeddings
- **@whiskeysockets/baileys** for WhatsApp
- **shadcn/ui**-style components + **framer-motion** for animations

## 📁 Structure

```
dealism-clone/
├── prisma/
│   ├── schema.prisma          # DB models (User, Agent, Channel, Conversation, Message, KnowledgeItem, Setting, Plan)
│   └── seed.ts                # Seeds admin user + default plans
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing
│   │   ├── price/             # Public pricing
│   │   ├── guides/            # Guides
│   │   ├── login, register/   # Auth pages
│   │   ├── dashboard/         # User-facing app (agents, knowledge, channels, conversations, settings)
│   │   ├── admin/             # Admin panel (settings, users, plans)
│   │   └── api/               # All API routes
│   ├── components/
│   │   ├── ui/                # Button, Card, Input, Label, Textarea
│   │   ├── landing/           # Nav, hero, features, footer, etc.
│   │   └── dashboard/         # Sidebar
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── auth.ts            # NextAuth config + helpers
│   │   ├── openai.ts          # OpenAI client (uses admin-configured key)
│   │   ├── chat-engine.ts     # RAG + chat completion
│   │   ├── whatsapp.ts        # Baileys socket manager
│   │   └── settings.ts        # Dynamic DB-backed settings
│   └── types/
│       └── next-auth.d.ts
└── baileys-auth/              # WhatsApp session storage (git-ignored)
```

## 🌐 Deploying to production

### Switch to PostgreSQL
```bash
npm run db:use-postgres            # rewrites prisma/schema.prisma in place
DATABASE_URL="postgresql://..." npx prisma migrate dev --name init_postgres
npm run db:seed
```
To move existing SQLite data into Postgres after the switch:
```bash
SQLITE_URL="file:./dev.db" POSTGRES_URL="postgresql://..." \
  npm run db:migrate-data
```

### Daily backups
```bash
export BACKUP_S3_ENDPOINT=https://s3.eu-central-1.wasabisys.com
export BACKUP_S3_BUCKET=dealism-backups
export BACKUP_S3_ACCESS_KEY=...
export BACKUP_S3_SECRET_KEY=...

npm run backup
# Cron daily at 3 AM:
# 0 3 * * * cd /opt/dealism-clone && /usr/bin/npm run backup >> /var/log/dealism-backup.log 2>&1
```

### Background-job worker (Redis)
Set `REDIS_URL=redis://localhost:6379` in `.env`. The worker runs in the same Node process by default; for horizontal scaling, run additional Node instances pointing at the same Redis.

### Deploy on a VPS (Hostinger / Contabo / DigitalOcean)
```bash
# On your VPS
git clone <this-repo>
cd dealism-clone
npm install
npm run build
# Use pm2 or systemd to keep it running
pm2 start npm --name dealism -- run start
```

Set `.env`:
- `DATABASE_URL`
- `NEXTAUTH_URL=https://yourdomain.com`
- `NEXTAUTH_SECRET=<openssl rand -base64 32>`

### Baileys caveat
Because Baileys holds persistent WhatsApp sockets in-memory, you should run with a single Node process (don't scale horizontally unless you also move session state to a shared store like Redis).

## 🔒 Security notes

- Change the default admin password immediately after first login.
- Generate a strong `NEXTAUTH_SECRET` (32+ random bytes).
- API keys stored in the `Setting` table are in plain text in SQLite — for production, encrypt at rest (enable encryption on your DB, or wrap `getSetting`/`setSetting` with a KMS).
- WhatsApp QR-scan (Baileys) is **unofficial** — Meta may flag/ban numbers. For production, also integrate the official WhatsApp Cloud API.

## 📜 License

MIT (this clone — the original Dealism.ai is a separate product).
