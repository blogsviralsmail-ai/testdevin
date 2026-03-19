# Testing BookAGround Admin Panel

## Overview
BookAGround is a ground booking platform with an admin panel at https://bookaground.com. The frontend is a React/Vite app deployed to a VPS at 155.254.22.197. The backend is a FastAPI app also running on the same VPS.

## Devin Secrets Needed
- VPS_SSH_KEY or VPS_PASSWORD: SSH access to 155.254.22.197 for deployment and service management
- Admin login credentials for https://bookaground.com (admin@bookmyground.com)

## Architecture
- **Frontend**: React + Vite, built with `npm run build`, deployed via SCP to VPS `/var/www/bookmyground-web/`
- **Backend**: FastAPI (Python), runs as systemd service `bookmyground.service` on port 8010
- **Proxy**: Nginx reverse proxy on VPS, Cloudflare DNS in front
- **Database**: SQLite on VPS
- **Git**: Only frontend is in GitHub repo. Backend has no git remote - deploy via SCP.

## Deployment
- **DO NOT use Fly.io** - the user explicitly does not want Fly.io deployments
- Build frontend: `npm run build` in bookmyground-web directory
- Deploy frontend: SCP the `dist/` folder to VPS `/var/www/bookmyground-web/`
- Deploy backend: SCP changed files to VPS, then restart service: `sudo systemctl restart bookmyground`
- If site returns 522 error, check nginx: `sudo systemctl restart nginx`. If port 80 is busy: `sudo fuser -k 80/tcp` then restart nginx.

## Admin Panel Navigation
- Login at https://bookaground.com/login with admin credentials
- Admin sidebar has 30+ menu items including: Dashboard, Bookings, Grounds, Users, Settlements, Withdrawals, KYC Docs, etc.
- Admin pages are at `/admin/*` routes (e.g., `/admin/grounds`, `/admin/users`, `/admin/kyc`, `/admin/withdrawals`)

## Testing Admin Bulk Operations

### Pages with Bulk Selection
1. **Grounds** (`/admin/grounds`) - Checkbox + "Delete Selected" (red bar)
2. **Users** (`/admin/users`) - Checkbox + "Delete Selected" (red bar) + filter tabs (All/Admins/Owners/Customers)
3. **KYC Docs** (`/admin/kyc`) - Checkbox + "Verify All" / "Reject All" (green bar) + filter tabs (All/Pending/Verified/Rejected)
4. **Withdrawals** (`/admin/withdrawals`) - Checkbox + "Approve All" / "Reject All" (blue bar) + filter tabs (All/Pending/Approved/Rejected)

### What to Test
- Individual checkbox selection highlights rows
- Select All checkbox selects all visible/filtered items
- Bulk action bar appears with correct count when items selected
- Cancel button clears all selections
- Switching filter tabs clears selections (prevents state leakage)
- Bulk operations call correct API endpoints and refresh data

### Safe vs Destructive Operations
- **Safe**: KYC bulk verify/reject (reversible via Re-KYC)
- **Destructive**: Bulk delete grounds/users (avoid on production data)
- **Caution**: Bulk approve/reject withdrawals (may affect user wallets)

### Handling confirm() Dialogs
The bulk action buttons use `window.confirm()` for confirmation. In Playwright/browser automation, override it before clicking:
```javascript
window.confirm = () => true;
```
Then click the action button.

## Common Issues
- After VPS restart, nginx may not start properly - check with `sudo systemctl status nginx`
- Port 80 conflicts: Use `sudo fuser -k 80/tcp` to kill stale processes
- Cloudflare 522 errors usually mean the origin server (nginx) is down
- Frontend `.env` file contains `VITE_API_URL` pointing to the backend API base URL
