-- KKHS Media Database Schema
-- Run: mysql -u root < schema.sql

CREATE DATABASE IF NOT EXISTS videobyte_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE videobyte_db;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('user','admin') DEFAULT 'user',
    status      ENUM('active','suspended','unverified') DEFAULT 'unverified',
    avatar_url  VARCHAR(500) DEFAULT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- OTP codes
CREATE TABLE IF NOT EXISTS otp_codes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    code        VARCHAR(10) NOT NULL,
    purpose     ENUM('verify','reset') DEFAULT 'verify',
    expires_at  DATETIME NOT NULL,
    used        TINYINT(1) DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_purpose (email, purpose)
) ENGINE=InnoDB;

-- Connected YouTube channels
CREATE TABLE IF NOT EXISTS channels (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    channel_id      VARCHAR(100) NOT NULL,
    title           VARCHAR(255) DEFAULT '',
    description     TEXT,
    thumbnail_url   VARCHAR(500) DEFAULT '',
    subscriber_count BIGINT DEFAULT 0,
    video_count     BIGINT DEFAULT 0,
    view_count      BIGINT DEFAULT 0,
    access_token    TEXT,
    refresh_token   TEXT,
    token_expires   DATETIME DEFAULT NULL,
    connected_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_channel (channel_id),
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Facebook pages
CREATE TABLE IF NOT EXISTS fb_pages (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    page_id         VARCHAR(100) NOT NULL,
    page_name       VARCHAR(255) DEFAULT '',
    access_token    TEXT,
    connected_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_page (page_id),
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Instagram accounts
CREATE TABLE IF NOT EXISTS ig_accounts (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    ig_user_id      VARCHAR(100) NOT NULL,
    username        VARCHAR(255) DEFAULT '',
    access_token    TEXT,
    fb_page_id      INT DEFAULT NULL,
    connected_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_ig (ig_user_id),
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- TikTok accounts
CREATE TABLE IF NOT EXISTS tt_accounts (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    open_id         VARCHAR(100) NOT NULL,
    display_name    VARCHAR(255) DEFAULT '',
    access_token    TEXT,
    refresh_token   TEXT,
    connected_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tt (open_id),
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Videos (YouTube video metadata cache)
CREATE TABLE IF NOT EXISTS videos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    channel_id      INT NOT NULL,
    video_id        VARCHAR(50) NOT NULL,
    title           VARCHAR(500) DEFAULT '',
    description     TEXT,
    tags            TEXT,
    category_id     VARCHAR(10) DEFAULT '',
    privacy         VARCHAR(20) DEFAULT 'public',
    thumbnail_url   VARCHAR(500) DEFAULT '',
    duration        VARCHAR(20) DEFAULT '',
    view_count      BIGINT DEFAULT 0,
    like_count      BIGINT DEFAULT 0,
    comment_count   BIGINT DEFAULT 0,
    published_at    DATETIME DEFAULT NULL,
    synced_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_video (video_id),
    INDEX idx_channel (channel_id),
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Upload queue / history
CREATE TABLE IF NOT EXISTS uploads (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    channel_id      INT DEFAULT NULL,
    platform        ENUM('youtube','shorts','instagram','tiktok','facebook') DEFAULT 'youtube',
    filename        VARCHAR(500) DEFAULT '',
    file_path       VARCHAR(500) DEFAULT '',
    file_size       BIGINT DEFAULT 0,
    title           VARCHAR(500) DEFAULT '',
    description     TEXT,
    tags            TEXT,
    category_id     VARCHAR(10) DEFAULT '',
    privacy         VARCHAR(20) DEFAULT 'public',
    thumbnail_path  VARCHAR(500) DEFAULT '',
    scheduled_at    DATETIME DEFAULT NULL,
    status          ENUM('queued','uploading','processing','completed','failed') DEFAULT 'queued',
    error_message   TEXT,
    platform_video_id VARCHAR(100) DEFAULT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at    DATETIME DEFAULT NULL,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Live streams
CREATE TABLE IF NOT EXISTS live_streams (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    video_id        INT DEFAULT NULL,
    platform        VARCHAR(20) DEFAULT 'youtube',
    channel_id      VARCHAR(100) DEFAULT '',
    stream_key      VARCHAR(500) DEFAULT '',
    quality         VARCHAR(10) DEFAULT '720p',
    loop_mode       TINYINT(1) DEFAULT 0,
    status          ENUM('active','stopped','error') DEFAULT 'active',
    started_at      DATETIME DEFAULT NULL,
    stopped_at      DATETIME DEFAULT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Live video files (uploaded for streaming)
CREATE TABLE IF NOT EXISTS live_videos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    filename        VARCHAR(500) DEFAULT '',
    file_path       VARCHAR(500) DEFAULT '',
    file_size       BIGINT DEFAULT 0,
    quality         VARCHAR(10) DEFAULT '720p',
    duration        VARCHAR(20) DEFAULT '',
    status          ENUM('uploading','uploaded','encoding','ready','failed') DEFAULT 'uploading',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- System logs
CREATE TABLE IF NOT EXISTS system_logs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    level       ENUM('info','warn','error') DEFAULT 'info',
    action      VARCHAR(255) DEFAULT '',
    details     TEXT,
    user_id     INT DEFAULT NULL,
    ip_address  VARCHAR(45) DEFAULT '',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- Settings (key-value store)
CREATE TABLE IF NOT EXISTS settings (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    skey        VARCHAR(100) NOT NULL UNIQUE,
    svalue      TEXT,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Default admin user (password: Admin@123)
INSERT IGNORE INTO users (name, email, password, role, status) VALUES
('Admin', 'admin@kkhsmedia.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active');

-- Default settings
INSERT IGNORE INTO settings (skey, svalue) VALUES
('site_name', 'KKHS Media'),
('youtube_api_quota_limit', '10000'),
('youtube_api_quota_used', '0'),
('anti_spam_delay_min', '30'),
('anti_spam_delay_max', '90'),
('max_upload_size_gb', '2'),
('maintenance_mode', '0');
