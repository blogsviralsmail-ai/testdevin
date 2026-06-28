# WabaPanel - WhatsApp Business API SaaS Platform

A comprehensive multi-tenant WhatsApp Business API management platform, converted from PHP Laravel to Node.js (NestJS) + React.

## Architecture

```
┌────────────────────┐     ┌────────────────────┐     ┌──────────────┐
│   React Frontend   │────▶│   NestJS Backend   │────▶│    MySQL     │
│   (Vite + TW)      │◀────│   (TypeScript)     │     │  (Prisma ORM)│
└────────────────────┘     └────────┬───────────┘     └──────────────┘
         │                          │
         │ Socket.io                │ BullMQ
         ▼                          ▼
┌────────────────────┐     ┌──────────────┐     ┌────────────────┐
│   Real-time Chat   │     │    Redis     │     │  WhatsApp API  │
│   Notifications    │     │   (Queues)   │     │  (Meta Graph)  │
└────────────────────┘     └──────────────┘     └────────────────┘
```

## Features (25 Modules)

| # | Module | Description |
|---|--------|-------------|
| 1 | Dashboard | Analytics overview with message charts |
| 2 | WhatsApp Chat | Real-time messaging via Socket.io |
| 3 | Contacts | Import/export, labels, groups |
| 4 | Campaigns | Bulk template messaging with BullMQ |
| 5 | Bot Reply | Keyword-based auto-replies |
| 6 | Bot Flow Builder | Visual conversation flow (React Flow) |
| 7 | Templates | Sync & manage Meta templates |
| 8 | Preset Messages | Quick-reply templates |
| 9 | WhatsApp Forms | Custom web forms |
| 10 | WhatsApp Flows | Meta interactive flows |
| 11 | AI Call Assistant | Automated call management |
| 12 | Vendors | Multi-tenant management |
| 13 | Subscription | Plans with 6 payment gateways |
| 14 | Invoices | Billing history & receipts |
| 15 | Shopify Integration | Order notification webhooks |
| 16 | WooCommerce | Order notification webhooks |
| 17 | Facebook Messenger | Cross-channel messaging |
| 18 | Instagram DM | Cross-channel messaging |
| 19 | Pages Builder | Landing page creator |
| 20 | Blog | Content management |
| 21 | Marketing | Drip, follow-up, birthday, feedback |
| 22 | Analytics | Detailed message & campaign stats |
| 23 | Payment Links | Shareable payment collection |
| 24 | Product Catalog | WhatsApp catalog management |
| 25 | Settings & Users | Platform configuration, roles |

## Payment Gateways

- Razorpay
- Stripe
- PayPal
- Paystack
- PhonePe
- YooMoney

## Tech Stack

**Backend:**
- Node.js 20+ with NestJS
- TypeScript (strict mode)
- Prisma ORM (MySQL)
- Socket.io (real-time)
- BullMQ + Redis (queues)
- Passport.js (JWT + sessions)
- Multer (file uploads)
- Swagger (API docs)

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- Zustand (state management)
- React Query (server state)
- React Router v6 (routing)
- Socket.io Client (real-time)
- Recharts (charts)
- React Flow (bot builder)
- Lucide Icons

## Quick Start

### Prerequisites
- Node.js 20+
- MySQL 8.0
- Redis 7+

### 1. Clone & Install

```bash
git clone <repository-url> wabapanel
cd wabapanel

# Install backend
cd backend
npm install
cp .env.example .env  # Edit with your database credentials
npx prisma generate

# Install frontend
cd ../frontend
npm install
```

### 2. Database Setup

```bash
# If connecting to existing WabaPanel MySQL database:
cd backend
npx prisma db pull    # Generate schema from existing DB
npx prisma generate   # Generate Prisma client

# If starting fresh:
npx prisma db push    # Create tables from schema
```

### 3. Run Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev    # Starts on http://localhost:3000

# Terminal 2 - Frontend
cd frontend
npm run dev    # Starts on http://localhost:5173
```

### 4. Docker (Production)

```bash
docker-compose up -d
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000/api
# API Docs: http://localhost:3000/api/docs
```

## Environment Variables

See `backend/.env.example` for all required variables.

Key variables:
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MySQL connection string |
| `REDIS_HOST` | Redis host for BullMQ |
| `JWT_SECRET` | JWT signing secret |
| `FRONTEND_URL` | Frontend URL for CORS |
| `STRIPE_SECRET_KEY` | Stripe payment gateway |
| `RAZORPAY_KEY_ID` | Razorpay payment gateway |

## API Documentation

Access Swagger docs at `http://localhost:3000/api/docs` when backend is running.

## Webhook Endpoints

These remain unchanged from the Laravel version:

| Endpoint | Purpose |
|----------|---------|
| `POST /webhook/whatsapp/:vendorUid` | WhatsApp message webhooks |
| `GET /webhook/whatsapp/:vendorUid` | WhatsApp webhook verification |
| `POST /api/payments/webhook/stripe` | Stripe payment webhooks |
| `POST /api/payments/webhook/razorpay` | Razorpay payment webhooks |
| `POST /api/integrations/shopify/webhook/:vendorId` | Shopify order webhooks |
| `POST /api/integrations/woocommerce/webhook/:vendorId` | WooCommerce order webhooks |

## Socket.io Events

### Server → Client
- `new_message` - New incoming WhatsApp message
- `message_status` - Delivery/read status update
- `new_contact` - New contact created
- `notification` - System notification
- `campaign_progress` - Campaign execution progress
- `typing_indicator` - User typing status
- `chat_assigned` - Chat assigned to agent

### Client → Server
- `subscribe_vendor` - Subscribe to vendor notifications
- `join_chat` - Join contact chat room
- `leave_chat` - Leave contact chat room
- `send_message` - Send WhatsApp message
- `mark_read` - Mark messages as read
- `typing` - Send typing indicator

## Project Structure

```
wabapanel/
├── backend/
│   ├── src/
│   │   ├── modules/          # 25+ feature modules
│   │   ├── common/           # Guards, filters, interceptors
│   │   ├── gateway/          # Socket.io gateway
│   │   ├── prisma/           # Database service
│   │   └── main.ts           # App bootstrap
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/            # Route pages
│   │   ├── components/       # Shared UI components
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API & socket services
│   │   ├── store/            # Zustand stores
│   │   └── App.tsx           # Root component
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## License

Private - All rights reserved.
