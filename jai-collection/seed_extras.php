<?php
// Jai Collection — Seed extras (demo customers, dummy photos, hero slides).
// Safe to run multiple times (idempotent via INSERT IGNORE / UPDATE IGNORE).
// Browse once to /seed_extras.php then delete.

require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/migrate.php';

// Gate seeding behind an admin session — this script creates demo accounts
// with well-known passwords (customer@123) and writes to products/banners.
// Public access would give anyone who hits the URL login-ready customer
// accounts and the ability to mutate catalog data.
requireAdmin();

header('Content-Type: text/plain; charset=UTF-8');
$pdo = getPDO();
$log = [];

// Run schema migrations first
try { jcMigrate(); $log[] = 'schema migrations ok'; } catch (Exception $e) { $log[] = 'migrate err: ' . $e->getMessage(); }

// ---- Demo customers ----
$demoCustomers = [
    ['Rahul Sharma', '7777777771', 'rahul@demo.test', 'customer@123'],
    ['Priya Verma',  '7777777772', 'priya@demo.test', 'customer@123'],
    ['Amit Kumar',   '7777777773', 'amit@demo.test',  'customer@123'],
];
foreach ($demoCustomers as [$name, $mobile, $email, $pw]) {
    $ex = $pdo->prepare("SELECT id FROM customers WHERE mobile = ? OR email = ? LIMIT 1");
    $ex->execute([$mobile, $email]);
    if ($ex->fetchColumn()) { $log[] = "customer exists: $mobile"; continue; }
    $pdo->prepare("INSERT INTO customers (name, mobile, email, password, status) VALUES (?,?,?,?,'active')")
        ->execute([$name, $mobile, $email, password_hash($pw, PASSWORD_DEFAULT)]);
    $log[] = "+ customer $name ($mobile / $pw)";
}

// ---- Dummy product images via picsum (deterministic seed per product) ----
$placeholderSaved = [];
$uploadsDir = UPLOAD_DIR . '/products';
if (!is_dir($uploadsDir)) mkdir($uploadsDir, 0755, true);

$products = $pdo->query("SELECT id, name, image FROM products ORDER BY id")->fetchAll();
$updated = 0;
foreach ($products as $p) {
    if (!empty($p['image'])) continue;
    $seed = 'jc' . $p['id'];
    $url = "https://picsum.photos/seed/$seed/600/600";
    $fname = 'demo_' . $p['id'] . '.jpg';
    $dest = $uploadsDir . '/' . $fname;
    if (!file_exists($dest)) {
        $ctx = stream_context_create(['http' => ['timeout' => 8], 'https' => ['timeout' => 8]]);
        $bin = @file_get_contents($url, false, $ctx);
        if ($bin) { file_put_contents($dest, $bin); }
    }
    if (file_exists($dest) && filesize($dest) > 1000) {
        $pdo->prepare("UPDATE products SET image = ? WHERE id = ?")->execute([$fname, $p['id']]);
        $updated++;
    }
}
$log[] = "+ dummy images set on $updated product(s)";

// ---- Dummy hero slides (banners) ----
$slides = [
    ['Fashion. Home. Daily Essentials.', 'Curated styles at honest prices.', '/categories.php', 'Shop Now'],
    ['Saree Festival',            'New arrivals in party wear.',       '/category.php?slug=sadi-party-wear', 'Explore'],
    ['Daily Essentials',          'Soaps, oils, shampoos and more.',   '/categories.php', 'Browse'],
    ['Ladies Inner Wear',         'Premium comfort every day.',        '/categories.php', 'Shop'],
];
$ct = (int)$pdo->query("SELECT COUNT(*) FROM banners WHERE status='active'")->fetchColumn();
if ($ct < 2) {
    foreach ($slides as $i => [$title, $sub, $link, $btn]) {
        // Reuse a product image if none downloaded yet for the banner
        $seed = 'slide' . ($i + 1);
        $url = "https://picsum.photos/seed/$seed/1600/600";
        $fname = 'banner_demo_' . ($i + 1) . '.jpg';
        $dest = $uploadsDir . '/' . $fname;
        if (!file_exists($dest)) {
            $ctx = stream_context_create(['http' => ['timeout' => 10], 'https' => ['timeout' => 10]]);
            $bin = @file_get_contents($url, false, $ctx);
            if ($bin) { file_put_contents($dest, $bin); }
        }
        if (file_exists($dest)) {
            $pdo->prepare("INSERT INTO banners (title, subtitle, image, link, button_text, sort_order, status) VALUES (?,?,?,?,?,?, 'active')")
                ->execute([$title, $sub, $fname, $link, $btn, $i]);
            $log[] = "+ banner slide: $title";
        }
    }
} else {
    $log[] = "banners already present ($ct) — skipping slide seed";
}

// ---- Ensure a few products are marked featured/hot ----
$pdo->exec("UPDATE products SET is_featured = 1 WHERE id IN (SELECT id FROM (SELECT id FROM products ORDER BY id LIMIT 8) t)");
$pdo->exec("UPDATE products SET is_hot = 1 WHERE id IN (SELECT id FROM (SELECT id FROM products ORDER BY RAND() LIMIT 6) t)");
$log[] = 'marked featured + hot sample products';

echo "Seed extras complete.\n\n" . implode("\n", $log) . "\n\nDemo customer logins:\n";
foreach ($demoCustomers as [$name, $mobile, , $pw]) echo " - $name: $mobile / $pw\n";
echo "\nDelete this file after running.\n";
