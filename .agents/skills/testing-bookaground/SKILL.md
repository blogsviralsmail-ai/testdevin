# Testing BookAGround Live Site

## Overview
BookAGround is a sports ground booking platform deployed at https://bookaground.com. The frontend is a React/Vite SPA and the backend is a FastAPI Python app with SQLite.

## Devin Secrets Needed
- VPS_SSH_HOST: VPS IP address for deployment and database inspection
- No additional secrets needed for testing - DEMO_MODE is enabled on the live server

## Authentication
- The app uses phone + OTP login
- DEMO_MODE=1 is enabled on the live server, which means OTP "1234" works for ALL users
- Demo password: password123
- Quick demo login buttons are available on the /login page (User, Owner, Admin)

### Test Accounts
- **Admin**: phone 9782005500 (user_id=1)
- **Owner (Rajesh Kumar)**: phone 9876543210 (user_id=2)
- **User (Amit Patel)**: phone 9898989898 (user_id=3)

## Key Test Pages

### Owner Dashboard
- URL: https://bookaground.com/owner
- Tabs accessible via sidebar: Dashboard, Bookings, My Grounds, Add Ground, Bulk Slots, Wallet, Ledger, Coupons, CRM, etc.
- **Ledger tab** (`/owner#ledger`): Click "Load Transactions" to fetch transaction history. Shows mixed bookings, settlements (green badge), and withdrawals (orange badge).
- **Wallet tab** (`/owner#wallet`): Shows balance and withdrawal request form.

### Admin Dashboard
- URL: https://bookaground.com/admin
- Tabs: Dashboard, Bookings, Grounds, Users, Settlements, Withdrawals, etc.
- **Withdrawals** (`/admin#withdrawals` or `/admin/withdrawals`): Shows withdrawal requests with Method column (Manual/Razorpay). Filter by Pending/Approved/Rejected. Pending items show "-" in Method column.
- **Settlements** (`/admin#settlements`): Shows settlement records with RazorpayX payout details.

## Deployment Architecture
- **Frontend**: Built with `npm run build` in bookmyground-web/, deployed to `/opt/bookmyground/frontend/dist/` on VPS
- **Backend**: FastAPI app at `/opt/bookmyground/backend/`, runs as systemd service `bookmyground.service` on port 8010
- **Database**: SQLite at `/data/app.db` on VPS
- **Deploy steps**:
  1. Build frontend: `npm run build` in bookmyground-web/
  2. SCP dist to VPS: `scp -r dist/* root@$VPS_SSH_HOST:/opt/bookmyground/frontend/dist/`
  3. SCP backend files: `scp <files> root@$VPS_SSH_HOST:/opt/bookmyground/backend/app/routers/`
  4. Restart service: `ssh root@$VPS_SSH_HOST systemctl restart bookmyground.service`

## Common Testing Patterns
- Always start recording before navigating to test pages
- Use annotate_recording at major test milestones
- The site may already be logged in from a previous session - check the header for username
- Navigation between Owner and Admin requires logging out first (Logout button in sidebar)
- Some tables require clicking a "Load" button before data appears (e.g., Ledger tab)
- The sidebar nav on Owner/Admin pages uses hash-based routing (#ledger, #wallet, etc.) but also supports direct URL paths

## Troubleshooting
- If the site shows a blank page after deployment, check that frontend was deployed to the correct path (`/opt/bookmyground/frontend/dist/`), NOT `/var/www/html/`
- If backend changes aren't reflected, make sure to restart the systemd service after deploying
- If OTP login fails, verify DEMO_MODE=1 is set in the service environment
- Database can be inspected via SSH: `ssh root@$VPS_SSH_HOST sqlite3 /data/app.db`
