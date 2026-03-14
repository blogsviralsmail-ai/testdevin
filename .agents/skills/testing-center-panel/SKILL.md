# Testing Education Hub Center Panel

## Overview
This skill covers how to test the center panel pages (Students, Documents, Fees) locally. The center panel is designed to be an exact copy of the admin panel with center-scoped data.

## Devin Secrets Needed
- `ADMIN_PASSWORD` - Admin login password
- `CENTER_PASSWORD` - Center login password (created during setup)
- Admin username is typically `admin`
- Center login uses a mobile number created during setup

## Environment Setup

### Backend (FastAPI + SQLite)
```bash
cd education-hub-backend

# Install dependencies
pip install -r requirements.txt

# Start backend with local paths (avoid /data permission errors)
DB_PATH=/tmp/data/app.db BASE_DATA_DIR=/tmp/data UPLOAD_DIR=/tmp/uploads \
  python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Important**: The backend defaults to `/data/app.db` which requires root permissions. Always override with environment variables:
- `DB_PATH=/tmp/data/app.db`
- `BASE_DATA_DIR=/tmp/data`
- `UPLOAD_DIR=/tmp/uploads`

### Frontend (Vite + React)
```bash
cd education-hub-frontend

# Backup production .env and point to local backend
cp .env .env.bak
echo 'VITE_API_URL=http://localhost:8000' > .env
echo 'VITE_BASE_DOMAIN=localhost' >> .env

# Install and start
npm install
npm run dev
```

**Important**: Always restore `.env` from `.env.bak` after testing to avoid accidentally pointing to localhost in production.

### Create Test Center Account
Use admin credentials to create a center via the API:
```bash
# Get admin token using ADMIN_PASSWORD secret
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"<ADMIN_PASSWORD>"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Create center with CENTER_PASSWORD secret
curl -X POST http://localhost:8000/api/centers/ \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test Center","owner_name":"Test Owner","mobile":"9876543210","password":"<CENTER_PASSWORD>","email":"test@center.com","address":"Test Address","city":"Test City","state":"UP"}'
```

Center login uses the mobile number and CENTER_PASSWORD.

## Testing Flow

### 1. Students Page (`/center/students`)
- Verify table headers: Student (Mobile = ID), University, Course, Fees, Deposit, Status, Actions
- Verify filters: Search input, University dropdown, Course dropdown, Status dropdown (9 statuses)
- Verify CSV export button and CSV Date Filter
- Test 5-step Add Student form:
  - Step 1 (Basic): Password, Full Name, Mobile, Email, University, Course, Total Fees, Session, Admission Type
  - Step 2 (Personal): DOB, Gender, Category, Nationality, Aadhar, Marital Status, Blood Group, Disability
  - Step 3 (Family): Father's Name, Mother's Name, Guardian Name, Father's Occupation, Parent Phone, Parent Email
  - Step 4 (Address): Current Address, City, State (dropdown with Indian states), Pincode, Permanent Address fields
  - Step 5 (Education): 10th/12th/Graduation details, Hostel Required, Transport Required
- Submit and verify student appears in table
- Verify action buttons: View, Change Password, Edit, Delete

### 2. Documents Page (`/center/documents`)
- Verify bulk select checkbox column in table header
- Verify filters: Search by mobile, Document Type (11 types), Status (9 statuses)
- Test Add Document modal:
  - Student Mobile Number search
  - Document Type dropdown
  - Notes textarea
  - **Fee Access Control** radio buttons: "Without Fees (Free Access)" and "After Fees"
  - When "After Fees" selected, verify percentage input appears
  - File upload (PDF/Image)

### 3. Fees Page (`/center/fees`)
- Verify 4 summary cards: Total Fees, Total Received, Total Pending, Collection %
- Test all 4 tabs:
  - **Student Fees**: Table with Student, Phone, University, Total Fees, Paid, Balance, Actions (Pay, History)
  - **Transactions**: Table with CSV/PDF export buttons, columns: Student, Amount, Type, UTR, Mode, Proof, Date, Receipt
  - **Online Payments**: CSV/PDF export, Pending count badge
  - **Student Statement**: Phone search input with Search button
- Verify Add Transaction button

## Common Issues

1. **Backend /data permission error**: Always use env vars to override paths (see Environment Setup)
2. **Frontend connecting to production**: Always check `.env` points to `localhost:8000` before testing
3. **Empty dropdowns**: Universities/courses may need to be created via admin panel first, or they may be seeded automatically
4. **Modal close button may not have a devinid**: Use coordinates or press Escape to close modals
5. **Form submission may fail silently**: Check browser console for API errors if form doesn't submit

## Architecture Notes
- Admin pages are the SOURCE OF TRUTH for center pages
- Center pages use center-scoped API endpoints (`/api/centers/...`)
- Center pages should be exact copies of admin pages in terms of UI/UX
- Key admin reference files:
  - `src/pages/admin/Students.tsx` -> copied to `src/pages/center/Students.tsx`
  - `src/pages/admin/Documents.tsx` -> copied to `src/pages/center/Documents.tsx`
  - `src/pages/admin/Accounts.tsx` -> copied to `src/pages/center/Fees.tsx`
