<?php
// Jai Collection - Idempotent schema migrations.
// Safe to run multiple times. Applies new columns / tables on top of the
// original db.sql schema without losing data.

require_once __DIR__ . '/config.php';

function jcMigrate() {
    $pdo = getPDO();
    $log = [];
    $addCol = function($table, $col, $def) use ($pdo, &$log) {
        $has = $pdo->prepare("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?");
        $has->execute([$table, $col]);
        if ((int)$has->fetchColumn() === 0) {
            $pdo->exec("ALTER TABLE `$table` ADD COLUMN $col $def");
            $log[] = "+ $table.$col";
        }
    };
    $modifyCol = function($table, $col, $def) use ($pdo, &$log) {
        $pdo->exec("ALTER TABLE `$table` MODIFY COLUMN `$col` $def");
        $log[] = "~ $table.$col";
    };

    // Products: is_hot
    $addCol('products', 'is_hot', "TINYINT(1) DEFAULT 0 AFTER is_featured");

    // Customers: status widen to include suspended, add role-ish fields, reset fields
    $modifyCol('customers', 'status', "ENUM('active','inactive','suspended') DEFAULT 'active'");
    $addCol('customers', 'email_verified_at', 'TIMESTAMP NULL');
    $addCol('customers', 'reset_token', 'VARCHAR(64) NULL');
    $addCol('customers', 'reset_expires_at', 'TIMESTAMP NULL');

    // Agents: status widen, reset fields
    $modifyCol('agents', 'status', "ENUM('active','inactive','suspended') DEFAULT 'active'");
    $addCol('agents', 'reset_token', 'VARCHAR(64) NULL');
    $addCol('agents', 'reset_expires_at', 'TIMESTAMP NULL');

    // Banners: add subtitle_color/button text (for hero slides)
    $addCol('banners', 'button_text', 'VARCHAR(50) NULL');

    // Settings: new keys (insert-ignore)
    $defaults = [
        'telegram_bot_token' => '',
        'telegram_chat_id' => '',
        'smtp_host' => '',
        'smtp_port' => '587',
        'smtp_user' => '',
        'smtp_pass' => '',
        'smtp_secure' => 'tls',
        'smtp_from_email' => '',
        'smtp_from_name' => '',
        'favicon_url' => '/uploads/logo/jai-collection-logo.png',
        'homepage_heading' => 'Welcome to Jai Collection',
        'homepage_subheading' => 'Fashion. Home. Daily Essentials.',
        'footer_about' => 'Jai Collection brings you quality garments, home essentials and daily goods at honest prices, delivered across India.',
        'footer_copyright' => '© ' . date('Y') . ' Jai Collection. All rights reserved.',
        'enable_registration' => '1',
        'enable_hot_blink' => '1',
    ];
    $ins = $pdo->prepare("INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)");
    foreach ($defaults as $k => $v) { $ins->execute([$k, $v]); }

    // Stock adjustment log
    $pdo->exec("CREATE TABLE IF NOT EXISTS stock_adjustments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        variant_id INT NULL,
        delta INT NOT NULL,
        new_stock INT NOT NULL,
        reason VARCHAR(255),
        admin_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_stock_product (product_id),
        INDEX idx_stock_variant (variant_id)
    )");

    return $log;
}
