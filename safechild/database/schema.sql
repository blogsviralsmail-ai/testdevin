-- SafeChild - Legal Parental Control App
-- Database Schema (MySQL 8.0+)

CREATE DATABASE IF NOT EXISTS safechild CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE safechild;

-- ============================================
-- PARENT/FAMILY ACCOUNTS
-- ============================================

CREATE TABLE parents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    profile_photo VARCHAR(500),
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    language VARCHAR(10) DEFAULT 'hi',
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE families (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    family_name VARCHAR(100) DEFAULT 'My Family',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
);

CREATE TABLE children (
    id INT AUTO_INCREMENT PRIMARY KEY,
    family_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INT,
    date_of_birth DATE,
    profile_photo VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

-- ============================================
-- CHILD DEVICES
-- ============================================

CREATE TABLE child_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    device_id VARCHAR(64) UNIQUE NOT NULL,
    device_name VARCHAR(100),
    model VARCHAR(100),
    manufacturer VARCHAR(100),
    android_version VARCHAR(20),
    app_version VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    pairing_code VARCHAR(10),
    paired_at DATETIME,
    last_seen DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- ============================================
-- CONSENT TRACKING (LEGAL REQUIREMENT)
-- ============================================

CREATE TABLE consent_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    child_id INT NOT NULL,
    consent_type ENUM('monitoring', 'location', 'app_usage', 'screen_time', 'content_filter') NOT NULL,
    consented BOOLEAN DEFAULT TRUE,
    consent_text TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    consented_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at DATETIME DEFAULT NULL,
    FOREIGN KEY (parent_id) REFERENCES parents(id),
    FOREIGN KEY (child_id) REFERENCES children(id)
);

-- ============================================
-- LOCATION
-- ============================================

CREATE TABLE location_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    child_id INT NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    accuracy FLOAT,
    address_text VARCHAR(500),
    source ENUM('gps', 'network', 'fused') DEFAULT 'fused',
    battery_level INT,
    recorded_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device_time (device_id, recorded_at),
    INDEX idx_child (child_id)
);

CREATE TABLE geofences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    radius_meters INT DEFAULT 200,
    is_active BOOLEAN DEFAULT TRUE,
    notify_on_enter BOOLEAN DEFAULT TRUE,
    notify_on_exit BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

CREATE TABLE geofence_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    geofence_id INT NOT NULL,
    child_id INT NOT NULL,
    event_type ENUM('enter', 'exit') NOT NULL,
    latitude DOUBLE,
    longitude DOUBLE,
    occurred_at DATETIME NOT NULL,
    FOREIGN KEY (geofence_id) REFERENCES geofences(id),
    FOREIGN KEY (child_id) REFERENCES children(id)
);

-- ============================================
-- SCREEN TIME MANAGEMENT
-- ============================================

CREATE TABLE screen_time_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    day_of_week ENUM('mon','tue','wed','thu','fri','sat','sun') NOT NULL,
    daily_limit_minutes INT DEFAULT 120,
    bedtime_start TIME DEFAULT '21:00:00',
    bedtime_end TIME DEFAULT '07:00:00',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

CREATE TABLE screen_time_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    child_id INT NOT NULL,
    date DATE NOT NULL,
    total_minutes INT DEFAULT 0,
    unlocks INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_child_date (child_id, date)
);

-- ============================================
-- APP MANAGEMENT
-- ============================================

CREATE TABLE child_apps (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    child_id INT NOT NULL,
    package_name VARCHAR(255) NOT NULL,
    app_name VARCHAR(255),
    category VARCHAR(100),
    icon_url VARCHAR(500),
    is_blocked BOOLEAN DEFAULT FALSE,
    is_system_app BOOLEAN DEFAULT FALSE,
    installed_at DATETIME,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device (device_id),
    UNIQUE KEY uk_device_package (device_id, package_name)
);

CREATE TABLE app_usage_stats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    child_id INT NOT NULL,
    package_name VARCHAR(255) NOT NULL,
    app_name VARCHAR(255),
    date DATE NOT NULL,
    usage_minutes INT DEFAULT 0,
    open_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_child_date (child_id, date),
    UNIQUE KEY uk_device_package_date (device_id, package_name, date)
);

CREATE TABLE app_block_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    package_name VARCHAR(255),
    app_category VARCHAR(100),
    block_type ENUM('always', 'scheduled', 'time_limit') DEFAULT 'always',
    time_limit_minutes INT,
    schedule_start TIME,
    schedule_end TIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- ============================================
-- CONTENT FILTERING
-- ============================================

CREATE TABLE website_filters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    filter_type ENUM('blocklist', 'allowlist', 'category') NOT NULL,
    value VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

CREATE TABLE web_activity_summary (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    child_id INT NOT NULL,
    domain VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    visit_count INT DEFAULT 1,
    date DATE NOT NULL,
    was_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_child_date (child_id, date)
);

-- ============================================
-- CONTACT SAFETY (summary only)
-- ============================================

CREATE TABLE contact_summary (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    child_id INT NOT NULL,
    contact_name VARCHAR(200),
    phone_number VARCHAR(50),
    call_count INT DEFAULT 0,
    sms_count INT DEFAULT 0,
    last_contact_date DATE,
    is_flagged BOOLEAN DEFAULT FALSE,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_child (child_id)
);

-- ============================================
-- ALERTS & NOTIFICATIONS
-- ============================================

CREATE TABLE parent_alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    child_id INT NOT NULL,
    alert_type ENUM(
        'geofence_exit', 'geofence_enter',
        'screen_time_exceeded', 'bedtime_violation',
        'blocked_app_attempt', 'blocked_site_attempt',
        'new_app_installed', 'sos_triggered',
        'device_offline', 'low_battery',
        'location_permission_disabled', 'app_uninstalled'
    ) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_parent (parent_id),
    INDEX idx_child (child_id)
);

-- ============================================
-- EMERGENCY SOS
-- ============================================

CREATE TABLE sos_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    device_id VARCHAR(64) NOT NULL,
    latitude DOUBLE,
    longitude DOUBLE,
    address_text VARCHAR(500),
    battery_level INT,
    triggered_at DATETIME NOT NULL,
    acknowledged_by INT,
    acknowledged_at DATETIME,
    FOREIGN KEY (child_id) REFERENCES children(id)
);

-- ============================================
-- DEVICE STATUS
-- ============================================

CREATE TABLE device_heartbeats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    battery_level INT,
    is_charging BOOLEAN DEFAULT FALSE,
    network_type VARCHAR(20),
    is_screen_on BOOLEAN DEFAULT FALSE,
    app_version VARCHAR(20),
    recorded_at DATETIME NOT NULL,
    INDEX idx_device_time (device_id, recorded_at)
);

-- ============================================
-- DATA PRIVACY (GDPR/COPPA)
-- ============================================

CREATE TABLE data_deletion_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    child_id INT,
    request_type ENUM('child_data', 'all_data', 'specific_data') NOT NULL,
    specific_tables TEXT,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (parent_id) REFERENCES parents(id)
);

CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INT,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_parent (parent_id),
    INDEX idx_created (created_at)
);

-- ============================================
-- APP SETTINGS
-- ============================================

CREATE TABLE app_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default settings
INSERT INTO app_settings (setting_key, setting_value) VALUES
('app_name', 'SafeChild'),
('app_version', '1.0.0'),
('location_interval_minutes', '15'),
('heartbeat_interval_minutes', '5'),
('data_retention_days', '90'),
('max_children_free', '1'),
('max_children_premium', '5');
