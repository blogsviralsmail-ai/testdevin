# SafeChild - Legal Parental Control App

Transparent, consent-based parental control system. 100% legal and Google Play Policy compliant.

## Features

### Parent Dashboard (Web)
- **Live Location** - Real-time child location on map (Leaflet/OpenStreetMap)
- **Location History** - Timeline view with path on map
- **Safe Zones (Geofencing)** - Set safe zones, get alerts on enter/exit
- **Screen Time** - Set daily limits, bedtime rules, view usage charts
- **App Management** - View installed apps, block/unblock apps
- **App Usage Stats** - Pie charts showing which apps used most
- **Content Filtering** - Block websites by domain or category
- **Alerts Center** - All notifications (SOS, geofence, screen time, etc.)
- **Privacy & Data** - Consent records, data export/deletion (GDPR/COPPA)

### REST API (for Child App)
- `POST /api/pair.php` - Device pairing with 6-digit code
- `POST /api/location.php` - Send location updates
- `POST /api/heartbeat.php` - Device status + fetch rules
- `POST /api/sync.php` - Sync screen time, app usage, contacts
- `GET /api/rules.php` - Fetch active rules for device
- `POST /api/apps.php` - Sync installed apps list
- `POST /api/sos.php` - Emergency SOS trigger

## Tech Stack
- **Backend**: PHP 8.x + MySQL
- **Frontend**: Bootstrap-style CSS + Chart.js + Leaflet Maps
- **Maps**: OpenStreetMap via Leaflet (free, no API key needed)

## Setup

### 1. Database
```bash
mysql -u root -p < database/schema.sql
```

### 2. Create MySQL User
```sql
CREATE USER 'safechild_user'@'localhost' IDENTIFIED BY 'SafeChild@2025';
GRANT ALL ON safechild.* TO 'safechild_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configure
Edit `includes/config.php` and set your database credentials.

### 4. Deploy
Copy `safechild/` folder to your web server's document root.

## Legal Compliance

This app is designed to be **transparent and legal**:

- Child always sees a notification that monitoring is active
- App icon is always visible (never hidden)
- Only aggregate data collected (no SMS reading, no keylogging, no camera)
- Consent records maintained with timestamps
- Data export/deletion capability (GDPR/COPPA)
- No C2/Command-Control patterns

## Directory Structure
```
safechild/
├── database/schema.sql          # MySQL database schema
├── includes/
│   ├── config.php               # Database & app configuration
│   ├── db.php                   # Database connection
│   └── functions.php            # Helper functions
├── api/                         # REST API for child app
│   ├── pair.php                 # Device pairing
│   ├── location.php             # Location updates
│   ├── heartbeat.php            # Device heartbeat
│   ├── sync.php                 # Data sync
│   ├── rules.php                # Fetch rules
│   ├── apps.php                 # App management
│   └── sos.php                  # Emergency SOS
├── admin/                       # Parent dashboard
│   ├── index.php                # Login
│   ├── register.php             # Registration
│   ├── dashboard.php            # Main dashboard
│   ├── children/                # Child management
│   ├── location/                # Location tracking
│   ├── screentime/              # Screen time rules
│   ├── apps/                    # App management
│   ├── content/                 # Content filtering
│   ├── alerts/                  # Alerts center
│   ├── privacy/                 # Privacy & data management
│   └── assets/css/style.css     # Dashboard styles
└── README.md
```
