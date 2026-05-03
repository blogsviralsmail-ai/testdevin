<?php
/**
 * SafeChild - Database Configuration
 * Legal Parental Control App
 */

// Database credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'safechild');
define('DB_USER', 'safechild_user');
define('DB_PASS', 'SafeChild@2025');
define('DB_CHARSET', 'utf8mb4');

// App settings
define('APP_NAME', 'SafeChild');
define('APP_VERSION', '1.0.0');
define('APP_URL', '');  // Set your domain
define('API_URL', '');  // Set your API URL

// Security
define('JWT_SECRET', 'CHANGE_THIS_TO_RANDOM_STRING_IN_PRODUCTION');
define('BCRYPT_COST', 12);
define('SESSION_LIFETIME', 86400); // 24 hours
define('API_TOKEN_LIFETIME', 2592000); // 30 days for device tokens

// Location settings
define('LOCATION_INTERVAL_MINUTES', 15);
define('LOCATION_HISTORY_DAYS', 90);

// Timezone
date_default_timezone_set('Asia/Kolkata');

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Start session for admin panel
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
