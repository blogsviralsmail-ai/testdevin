# Testing Education Hub Application

## Overview
The Education Hub application is deployed on a cPanel shared hosting server. The backend is a FastAPI app served via Passenger WSGI, and the frontend is a React SPA served from the same domain.

## Devin Secrets Needed
- `CPANEL_SSH_PASSWORD` - SSH password for the cPanel server
- Server connection details: Check the cPanel account settings for host, port, and username

## Application Architecture
- **Frontend**: React SPA built with Vite, served from `~/public_html/` on the server
- **Backend**: FastAPI with SQLite, deployed to `~/app/` on the server
- **Database**: SQLite at `~/data/app.db` on the server
- **Backend Process**: Uvicorn on internal port, proxied by Passenger WSGI
- **Domain**: Configured domain (behind Cloudflare)

## Login Credentials
- **Admin**: username `admin`, password stored in Devin secrets -> redirects to `/admin`
- **Centers**: username is the phone number set during creation, password convention `Center@123` -> redirects to `/center`
- **Students**: username is phone/email, redirects to `/student`

## Key Testing Paths

### Admin Commission Management
1. Login as admin at `/login`
2. Scroll down in sidebar to "Centers" group
3. Click "Commission Slabs" -> `/admin/commission-slabs`
4. Two tabs available:
   - **Commission Slabs**: Shows slab configurations per university with min/max ranges and amounts
   - **Commission Hierarchy & Ledger**: Shows summary cards (total earnings, from centers, from sub-centers, pending), center hierarchy table, and full commission ledger

### Center Commission View
1. Login as center at `/login` using phone number + center password
2. Navigate to "Commission Report" in sidebar -> `/center/commission`
3. Three tabs: Overview, Commission Ledger, Sub-center Commission
4. Centers only see their own commission entries (role-based filtering)

### Path Traversal Security
- The frontend serving endpoint has `os.path.realpath()` protection
- Cloudflare also blocks encoded path traversal attempts (returns 400)
- Test by navigating to URLs with `..%2F` patterns

## Server Deployment
- Use SCP to upload files to the server
- SSH commands for remote operations
- Backend restart: Kill existing uvicorn process and restart
- The server uses jailshell (restricted shell) - some commands may not be available
- Python path on server: `/opt/alt/python311/bin/python3`
- Virtual env: `~/app/venv/`

## Common Issues
- **Popup notifications**: The app may show popup notifications on center login. Dismiss them before testing.
- **Logo loading**: The logo image src may reference `http://localhost:8000` in the Login page if `VITE_API_URL` env var has a fallback. The fix is to use same-origin relative paths.
- **Cloudflare caching**: After deployment, Cloudflare may cache old frontend assets. Clear cache or wait for TTL.
- **SSH locale warnings**: Ignore `perl: warning: Setting locale failed` messages when SSH-ing to the server.

## Database Queries
To inspect data on the server, SSH in and use sqlite3 against the database file.

Useful queries:
- Centers: `SELECT id, name, username FROM users WHERE role='center'`
- Commission slabs: `SELECT * FROM commission_slabs`
- Commission ledger: `SELECT * FROM commission_ledger`
