-- ==========================================================================
-- Jai Collection - Full Database Schema
-- Single-vendor e-commerce + admin panel + agent commission/wallet/payout
-- ==========================================================================

CREATE DATABASE IF NOT EXISTS jaicollection_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jaicollection_db;

-- --------------------------------------------------------------------------
-- Settings (RogerPay keys, site info, shipping, tax, logo, etc.)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------------
-- Admins (site owners + staff)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','staff') DEFAULT 'admin',
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------------
-- Customers (end buyers)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    mobile VARCHAR(15) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer saved addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    line1 VARCHAR(200) NOT NULL,
    line2 VARCHAR(200),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    landmark VARCHAR(150),
    is_default TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------------
-- Agents (referral partners who earn commission on attributed orders)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    mobile VARCHAR(15) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    referral_code VARCHAR(20) NOT NULL UNIQUE,
    commission_percent DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    wallet_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    lifetime_earned DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    lifetime_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    -- Bank details for payouts
    bank_account_holder VARCHAR(100),
    bank_account_number VARCHAR(30),
    bank_ifsc VARCHAR(15),
    bank_name VARCHAR(100),
    upi_id VARCHAR(100),
    status ENUM('active','inactive') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------------
-- Categories (tree: parent_id supports 2-level nesting)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT DEFAULT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    image VARCHAR(255),
    sort_order INT DEFAULT 0,
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- --------------------------------------------------------------------------
-- Products
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    sku VARCHAR(50),
    barcode VARCHAR(64) NULL,
    short_description VARCHAR(500),
    description TEXT,
    image VARCHAR(255),              -- primary image (relative path under /uploads/products/)
    price DECIMAL(10,2) NOT NULL DEFAULT 0,        -- base/listed price
    compare_price DECIMAL(10,2) DEFAULT NULL,      -- MRP / original price for strikethrough
    cost_price DECIMAL(10,2) DEFAULT NULL,         -- internal cost (optional)
    stock INT NOT NULL DEFAULT 0,                  -- fallback stock if no variants
    has_variants TINYINT(1) DEFAULT 0,
    is_featured TINYINT(1) DEFAULT 0,
    is_hot TINYINT(1) DEFAULT 0,
    sort_order INT DEFAULT 0,
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_products_category (category_id),
    INDEX idx_products_status (status)
);

-- Gallery (multiple images per product)
CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Variants (size, color)
CREATE TABLE IF NOT EXISTS product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    size VARCHAR(30),
    color VARCHAR(50),
    sku VARCHAR(50),
    price DECIMAL(10,2),             -- NULL = inherit from product.price
    stock INT NOT NULL DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_variants_product (product_id)
);

-- --------------------------------------------------------------------------
-- Orders
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(30) NOT NULL UNIQUE,
    customer_id INT,
    agent_id INT,                                   -- attributed agent (for commission)
    agent_commission_percent DECIMAL(5,2) DEFAULT 0,
    agent_commission_amount DECIMAL(12,2) DEFAULT 0,
    -- Shipping snapshot
    ship_name VARCHAR(100) NOT NULL,
    ship_mobile VARCHAR(15) NOT NULL,
    ship_email VARCHAR(150),
    ship_line1 VARCHAR(200) NOT NULL,
    ship_line2 VARCHAR(200),
    ship_city VARCHAR(100) NOT NULL,
    ship_state VARCHAR(100) NOT NULL,
    ship_pincode VARCHAR(10) NOT NULL,
    ship_landmark VARCHAR(150),
    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    coupon_code VARCHAR(30) NULL,
    coupon_id INT NULL,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    -- Payment
    payment_method ENUM('cod','rogerpay') NOT NULL DEFAULT 'cod',
    payment_status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
    payment_ref VARCHAR(100),                       -- gateway txn id / utr
    payment_raw TEXT,                               -- full gateway response
    -- Fulfilment
    status ENUM('pending','confirmed','packed','shipped','delivered','cancelled','returned') NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL,
    INDEX idx_orders_status (status),
    INDEX idx_orders_payment (payment_status),
    INDEX idx_orders_agent (agent_id),
    INDEX idx_orders_customer (customer_id)
);

-- Order items (snapshot of product + variant + price at purchase time)
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    variant_id INT,
    product_name VARCHAR(200) NOT NULL,
    variant_label VARCHAR(100),        -- e.g. "Size: XL, Color: Red"
    sku VARCHAR(50),
    image VARCHAR(255),
    price DECIMAL(10,2) NOT NULL,
    qty INT NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

-- --------------------------------------------------------------------------
-- Agent commissions (ledger of earnings per order)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_commissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL,
    order_id INT NOT NULL,
    commission_percent DECIMAL(5,2) NOT NULL,
    order_subtotal DECIMAL(12,2) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status ENUM('pending','credited','cancelled') NOT NULL DEFAULT 'pending',
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    credited_at TIMESTAMP NULL,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_agent_order (agent_id, order_id)
);

-- Agent wallet transactions (credit on commission, debit on payout)
CREATE TABLE IF NOT EXISTS agent_wallet_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL,
    type ENUM('credit','debit','adjustment') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    ref_type VARCHAR(30),              -- 'commission' | 'payout' | 'manual'
    ref_id INT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    INDEX idx_wallet_agent (agent_id)
);

-- Payout requests (agent -> admin approves -> manual bank transfer -> screenshot)
CREATE TABLE IF NOT EXISTS payouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    method ENUM('bank','upi') NOT NULL DEFAULT 'bank',
    -- Snapshot of agent bank details at time of request
    bank_account_holder VARCHAR(100),
    bank_account_number VARCHAR(30),
    bank_ifsc VARCHAR(15),
    bank_name VARCHAR(100),
    upi_id VARCHAR(100),
    status ENUM('pending','approved','paid','rejected') NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    agent_note TEXT,
    screenshot VARCHAR(255),           -- admin-uploaded payment proof
    utr_number VARCHAR(50),
    processed_by INT,                  -- admin id
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_payouts_status (status)
);

-- --------------------------------------------------------------------------
-- Shipping zones (simple flat-rate per pincode prefix range)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipping_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    pincode_prefix VARCHAR(10),        -- NULL = default/fallback
    min_order DECIMAL(10,2) DEFAULT 0,
    rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    free_above DECIMAL(10,2) DEFAULT NULL,
    status ENUM('active','inactive') DEFAULT 'active'
);

-- --------------------------------------------------------------------------
-- Coupons
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    type ENUM('flat','percent') NOT NULL DEFAULT 'percent',
    value DECIMAL(10,2) NOT NULL,
    min_order DECIMAL(10,2) DEFAULT 0,
    max_discount DECIMAL(10,2) DEFAULT NULL,
    usage_limit INT DEFAULT NULL,
    used_count INT DEFAULT 0,
    valid_from DATE,
    valid_to DATE,
    status ENUM('active','inactive') DEFAULT 'active'
);

-- --------------------------------------------------------------------------
-- Banners / Sliders
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS banners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150),
    subtitle VARCHAR(250),
    image VARCHAR(255) NOT NULL,
    link VARCHAR(255),
    sort_order INT DEFAULT 0,
    status ENUM('active','inactive') DEFAULT 'active'
);

-- --------------------------------------------------------------------------
-- Default settings
-- --------------------------------------------------------------------------
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
('site_name', 'Jai Collection'),
('site_tagline', 'Fashion. Home. Daily Essentials.'),
('site_email', 'support@jaicollection.in'),
('site_phone', '+91 00000 00000'),
('site_address', 'India'),
('logo_url', '/uploads/logo/jai-collection-logo.png'),
('default_commission_percent', '5'),
('default_shipping_fee', '60'),
('free_shipping_above', '999'),
('min_payout_amount', '200'),
('cod_enabled', '1'),
('rogerpay_enabled', '0'),
('rogerpay_api_key', ''),
('rogerpay_secret_key', ''),
('rogerpay_base_url', 'https://api.rogerpay.in'),
('rogerpay_mode', 'live'),
('facebook_url', ''),
('instagram_url', ''),
('whatsapp_number', ''),
('youtube_url', '');
