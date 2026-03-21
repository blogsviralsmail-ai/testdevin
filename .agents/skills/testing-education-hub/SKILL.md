# Testing Education Hub Application

## Overview
Education Hub is a multi-tenant education CRM with Admin, Center, Sub-center, Counselor, and Student roles. The frontend is React (Vite) and the backend is FastAPI with SQLite.

## Devin Secrets Needed
- `CPANEL_SSH_PASSWORD` - cPanel SSH password for production server deployment

## Live URLs
- Production: https://asffeducationhub.com/
- Test/Development: https://eduhub.kkhsmedia.com/

## Login Credentials
- Admin: username `admin`, password `Admin@123`
- Auth tokens are stored in localStorage as `admin_token`, `center_token`
- User data stored as `admin_user`, `center_user`

## Key Navigation Paths (Admin Panel)
- Dashboard: `/admin` (shows Total Revenue, This Month stats from overview API)
- Analytics: `/admin/analytics` (revenue trends chart from revenue_trends API)
- Counselor Leads: `/admin/counselor-leads` (lead management with Convert to Admission)
- Students: `/admin/students`
- Accounts: `/admin/accounts`
- Centers: `/admin/centers`
- Settings: `/admin/settings`

## Testing Counselor Leads / Convert to Admission
1. Login as admin at `/login`
2. Navigate to `/admin/counselor-leads`
3. Leads with status other than 'Converted' show a green 'Convert to Admission' button
4. Clicking the button opens a modal with lead data pre-filled (name, mobile, father name)
5. The modal uses `useRef` to persist lead data across re-renders - verify all leads remain visible in background table
6. Already converted leads show 'Admitted' badge instead of the button

## Testing Dashboard / Analytics
1. Navigate to `/admin` - verify summary cards show non-zero values for Total Revenue, This Month
2. Navigate to `/admin/analytics` - verify revenue trends chart shows data
3. Backend uses SQLite `strftime('%Y-%m', created_at)` for monthly grouping - if values show 0, check for double-percent `%%Y-%%m` bugs in analytics.py

## Testing API Security (WhatsApp Credentials)
- The `_get_branding()` function in accounts.py should NOT include `whatsapp_api_url` or `whatsapp_api_key`
- These are sensitive server-side credentials used only in `_send_receipt_notifications()`
- To verify: check browser console for any `/api/accounts/receipt-data/{id}` responses - branding object should not contain whatsapp fields

## Production Deployment
- Backend is at `/home/asffeduc/app/app/` on the production server (note: double `app/app/`)
- SSH: `sshpass -p '<CPANEL_SSH_PASSWORD>' ssh -p 11208 asffeduc@192.154.231.174`
- SCP files: `sshpass -p '<CPANEL_SSH_PASSWORD>' scp -P 11208 <local_file> asffeduc@192.154.231.174:<remote_path>`
- Restart backend: `bash /home/asffeduc/app/restart.sh`
- Database: `/home/asffeduc/data/app.db`
- Uploads: `/home/asffeduc/public_html/uploads`

## Common Gotchas
- SQLite strftime in Python: Use single `%` (e.g., `strftime('%Y-%m', ...)`) not double `%%` in plain strings. Double `%%` is only needed inside f-strings
- The frontend stores auth differently than expected: `admin_token` not `user.token`
- Production backend path has double `app/` directory: `/home/asffeduc/app/app/routers/`
- When testing via browser console, use `localStorage.getItem('admin_token')` for the auth token
