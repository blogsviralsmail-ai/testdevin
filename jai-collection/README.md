# Jai Collection

Single-vendor e-commerce site for `jaicollection.in` — garments and daily essentials, built with **PHP 8 + MySQL + Bootstrap-style vanilla CSS**.

## Features

### Storefront (customers)
- Homepage with hero, category grid, featured / latest products
- Category + product detail pages (variants: size & colour, image gallery)
- Cart (session for guests, DB for customers), checkout, COD + RogerPay
- Order confirmation + order tracking by order number
- Product search, customer account (register / login / dashboard / orders)
- Referral-link attribution via `?ref=<AGENT_CODE>` (30-day cookie)

### Admin panel (`/admin/`)
- Dashboard stats (orders, revenue, agents, wallet outstanding)
- Full CRUD for: Categories, Products (with variants + image gallery), Banners, Coupons, Shipping rates
- Orders: list, detail, status update, payment status, auto-credit commission on delivery
- Customers list, lifetime spend
- **Agents**: onboard with commission %, bank / UPI details, referral code, active / inactive toggle
- **Commissions ledger** (read-only, per order)
- **Payouts**: approve → pay → upload screenshot + UTR proof → wallet debits on request, refunds on rejection
- Settings: site info, shipping, commission defaults, COD toggle, RogerPay (API key, secret, mode), socials, logo

### Agent panel (`/agent/`)
- Dashboard with referral link, WhatsApp share, wallet balance, commission %
- Referred orders list with per-order commission status
- Wallet transaction ledger (credits + debits with balance after each txn)
- Payout request form (bank or UPI) with minimum-payout enforcement
- Profile: editable bank / UPI details, password change

### Payment gateway (RogerPay)
- Defensive wrapper in `includes/rogerpay.php` — handles API variations
- Public callback + server webhook (`api/rogerpay-callback.php`, `api/rogerpay-webhook.php`)
- HMAC-SHA256 signature verification
- **Keys are not hard-coded** — admin pastes them in `Settings` page once available

## Installation

### 1. Prerequisites
- PHP 7.4+ (tested on 8.1) with `pdo_mysql`, `mysqli`, `mbstring`, `gd`, `curl`
- MySQL 5.7+ / MariaDB 10+

### 2. Database
The installer creates the DB automatically, but the DB user must already exist:
```sql
CREATE USER 'jaicollection_user'@'localhost' IDENTIFIED BY 'JaiCollection@2025';
GRANT ALL ON jaicollection_db.* TO 'jaicollection_user'@'localhost';
```
Override credentials with env vars if needed:
`JC_DB_HOST`, `JC_DB_USER`, `JC_DB_PASS`, `JC_DB_NAME`, `JC_SITE_URL`.

### 3. Run the installer
Open `https://jaicollection.in/install.php` in the browser, click **Begin Installation**.
It will:
- Create the DB
- Run the schema (`includes/db.sql`)
- Seed 40 categories (every one from the original list)
- Seed 70 demo products with size/colour variants (placeholder images)
- Create default admin (`9999999999` / `admin@123`)
- Create demo agent (`8888888888` / `agent@123`, 7 % commission, code `DEMOAGENT`)
- Seed default shipping zones and two sample coupons

**Delete `install.php` after setup.**

### 4. Admin login
`/admin/login.php` → mobile `9999999999`, password `admin@123` — change immediately.
Go to **Settings** to paste RogerPay keys when you receive them.

## Folder structure
```
jai-collection/
├── index.php, product.php, category.php, cart.php, checkout.php, ...
├── account/       (customer login, register, dashboard, orders)
├── admin/         (admin panel, ~20 pages)
├── agent/         (agent panel, ~7 pages)
├── api/           (RogerPay callback + webhook)
├── assets/        (css, js)
├── includes/      (config.php, functions.php, header.php, footer.php, rogerpay.php, db.sql)
├── uploads/       (logo, products, payouts, placeholders)
└── install.php
```

## Security notes
- All forms use CSRF tokens
- All DB queries use PDO prepared statements
- Passwords hashed with bcrypt (`password_hash`)
- RogerPay webhook verifies HMAC-SHA256 signature
- Roles separated in session (admin / agent / customer)
- Wallet debits are transactional — refunded on payout rejection
