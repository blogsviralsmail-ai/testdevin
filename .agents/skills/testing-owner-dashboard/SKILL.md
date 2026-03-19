# Testing BookAGround Owner Dashboard

## Devin Secrets Needed
- Owner login credentials are displayed on the login page as demo credentials (Quick Demo Login buttons)

## Local Setup

### Backend (FastAPI)
```bash
cd /home/ubuntu/bookmyground/bookmyground-api
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend (Vite + React)
```bash
cd /home/ubuntu/bookmyground/bookmyground-web
npm run dev
# Runs on http://localhost:5173
```

The frontend `.env` should have `VITE_API_URL=http://localhost:8001`.

## Login
- Navigate to `http://localhost:5173/login`
- Use the "Owner" quick demo button to auto-fill credentials, then click "Login"
- Demo credentials are visible on the login page itself

## Owner Dashboard Navigation
- After login, you land on `http://localhost:5173/owner#dashboard`
- Sidebar tabs navigate via URL hash: `#wallet`, `#coupons`, `#bookings`, etc.
- Click sidebar buttons or navigate directly via URL hash

## Key Testing Paths

### Wallet Tab (`#wallet`)
- Unified tab combining Settlement + Payout
- Has two sub-sections: "Overview" and "KYC & Bank" (toggle buttons)
- Overview shows: settlement summary cards, transaction ledger with CSV/PDF export
- KYC & Bank shows: KYC status, bank details form, file upload
- Withdraw button opens bottom-sheet modal (requires KYC to be verified first)

### Coupons Tab (`#coupons`)
- First input is a ground selection dropdown
- Creating a coupon without selecting a ground shows a warning toast
- Created coupons display with a green ground name badge

## Toast Notifications
- The app uses a custom toast system (`showOwnerToast`) rendered globally (fixed position top-center)
- Toast auto-dismisses after 4.5 seconds
- Types: success (green), error (red), warning (amber), info (blue)
- When testing toasts, take screenshots quickly after triggering them or they may auto-dismiss

## Common Issues
- Toast rendering must be outside any tab conditional block to be visible on all tabs
- The backend SQLite database is at `bookmyground-api/bookaground.db`
- If backend isn't running, frontend will show empty data but won't crash
- TypeScript build: `npx tsc --noEmit` for type checking, `npm run build` for full build
