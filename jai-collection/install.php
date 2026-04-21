<?php
// Jai Collection - Installer
// Run once via browser or CLI. Creates DB, imports schema, seeds demo data.
// Delete / protect this file after install.

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/includes/config.php';

$step = $_GET['step'] ?? 'welcome';
$errors = [];
$log = [];

function jc_install_header($title) {
    echo '<!DOCTYPE html><html><head><title>' . htmlspecialchars($title) . ' - Jai Collection Install</title>';
    echo '<meta name="viewport" content="width=device-width,initial-scale=1">';
    echo '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">';
    echo '<style>
        body { font-family: "Poppins", sans-serif; background: linear-gradient(135deg,#f26722,#e53935); min-height:100vh; margin:0; padding:40px 20px; }
        .box { background: #fff; max-width: 700px; margin: 0 auto; padding: 40px; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        h1 { color: #0d2d66; margin-top:0; }
        h2 { color: #e53935; }
        .log { background: #f7f8fa; padding: 14px; border-radius: 6px; font-family: monospace; font-size: 13px; max-height: 300px; overflow-y: auto; }
        .log .ok { color: #2a9d2a; }
        .log .err { color: #c00; }
        .btn { display:inline-block; padding: 12px 24px; background: #e53935; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; border: 0; cursor: pointer; }
        .btn:hover { background: #c62828; }
        .btn-orange { background: #f26722; }
        .btn-orange:hover { background: #d2540e; }
        input, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-family: inherit; margin-bottom: 10px; }
        label { font-weight: 500; display: block; margin-bottom: 4px; }
        .alert { padding: 12px; border-radius: 6px; margin-bottom: 14px; }
        .alert-error { background: #fdecec; color: #8a1a1a; }
        .alert-success { background: #e6f4ea; color: #1a5a23; }
    </style></head><body><div class="box">';
}
function jc_install_footer() { echo '</div></body></html>'; }

// --- WELCOME ---
if ($step === 'welcome') {
    jc_install_header('Welcome');
    echo '<h1>Jai Collection - Installation</h1>';
    echo '<p>This installer will set up your database, create tables, and seed demo products for every category you listed.</p>';
    echo '<h2>Requirements</h2><ul>';
    echo '<li>PHP 7.4+ with PDO, mysqli, GD extensions</li>';
    echo '<li>MySQL 5.7+ / MariaDB 10+</li>';
    echo '<li>Writable <code>uploads/</code> directory</li>';
    echo '</ul>';
    echo '<h2>DB configured in <code>includes/config.php</code>:</h2>';
    echo '<ul><li>Host: <code>' . DB_HOST . '</code></li>';
    echo '<li>User: <code>' . DB_USER . '</code></li>';
    echo '<li>DB name: <code>' . DB_NAME . '</code></li></ul>';
    echo '<p>You can override these with environment variables <code>JC_DB_HOST</code>, <code>JC_DB_USER</code>, <code>JC_DB_PASS</code>, <code>JC_DB_NAME</code>.</p>';
    echo '<a href="?step=setup" class="btn">Begin Installation &rarr;</a>';
    jc_install_footer();
    exit;
}

// --- SETUP (create DB, schema, seed) ---
if ($step === 'setup') {
    jc_install_header('Setup');
    echo '<h1>Installing...</h1><div class="log">';

    // Create DB if not exists
    try {
        $pdoRoot = new PDO('mysql:host=' . DB_HOST . ';charset=utf8mb4', DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $pdoRoot->exec('CREATE DATABASE IF NOT EXISTS `' . DB_NAME . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        echo '<div class="ok">✓ Database ready: ' . DB_NAME . '</div>';
    } catch (Exception $ex) {
        echo '<div class="err">✗ ' . htmlspecialchars($ex->getMessage()) . '</div>';
        echo '</div><p>Fix the DB credentials in config.php and reload.</p>'; jc_install_footer(); exit;
    }

    // Run schema
    try {
        $pdo = getPDO();
        $sql = file_get_contents(__DIR__ . '/includes/db.sql');
        // strip line comments
        $sql = preg_replace('/^\s*--[^\n]*\n/m', '', $sql);
        // strip USE/CREATE DATABASE lines (we already handled)
        $sql = preg_replace('/^\s*(CREATE\s+DATABASE|USE)\b[^;]*;/im', '', $sql);
        // split on ; at end of line (naive but works for this schema)
        $statements = array_filter(array_map('trim', preg_split('/;\s*\n/', $sql)));
        foreach ($statements as $stmt) {
            if (!$stmt) continue;
            $pdo->exec($stmt);
        }
        echo '<div class="ok">✓ Schema and default settings installed</div>';
    } catch (Exception $ex) {
        echo '<div class="err">✗ Schema error: ' . htmlspecialchars($ex->getMessage()) . '</div>';
        echo '</div>'; jc_install_footer(); exit;
    }

    // Seed default admin
    try {
        $pdo = getPDO();
        $hasAdmin = (int)$pdo->query("SELECT COUNT(*) FROM admins")->fetchColumn();
        if (!$hasAdmin) {
            $hash = password_hash('admin@123', PASSWORD_DEFAULT);
            $pdo->prepare("INSERT INTO admins (name, email, mobile, password, role, status) VALUES ('Admin', 'admin@jaicollection.in', '9999999999', ?, 'admin', 'active')")->execute([$hash]);
            echo '<div class="ok">✓ Admin seeded (mobile <b>9999999999</b> / password <b>admin@123</b>)</div>';
        } else {
            echo '<div class="ok">✓ Admin already exists (skipped)</div>';
        }
    } catch (Exception $ex) {
        echo '<div class="err">✗ Admin seed: ' . htmlspecialchars($ex->getMessage()) . '</div>';
    }

    // Seed demo agent
    try {
        $pdo = getPDO();
        $hasAgent = (int)$pdo->query("SELECT COUNT(*) FROM agents")->fetchColumn();
        if (!$hasAgent) {
            $hash = password_hash('agent@123', PASSWORD_DEFAULT);
            $pdo->prepare("INSERT INTO agents (name, email, mobile, password, referral_code, commission_percent, status) VALUES ('Demo Agent', 'agent@jaicollection.in', '8888888888', ?, 'DEMOAGENT', 7.00, 'active')")->execute([$hash]);
            echo '<div class="ok">✓ Demo agent seeded (mobile <b>8888888888</b> / password <b>agent@123</b> / code <b>DEMOAGENT</b>, 7% commission)</div>';
        } else {
            echo '<div class="ok">✓ Agent already exists (skipped)</div>';
        }
    } catch (Exception $ex) {
        echo '<div class="err">✗ Agent seed: ' . htmlspecialchars($ex->getMessage()) . '</div>';
    }

    // Seed categories (verbatim list from user, deduped/normalised + Hindi items)
    $categoryGroups = [
        'Women Ethnic' => [
            ['Saree', 'saree', 'Traditional & party wear sarees'],
            ['Saree Party Wear', 'saree-party-wear', 'Heavy party wear sarees'],
            ['Blouse', 'blouse', 'Regular & ready-made blouses'],
            ['Blouse Fancy', 'blouse-fancy', 'Designer & fancy blouses'],
            ['Petticoat', 'petticoat', 'Cotton & satin petticoats'],
            ['Dupatta', 'dupatta', 'Dupattas for salwar suits'],
            ['Chunri', 'chunri', 'Festive chunris'],
            ['Stole / Stall', 'stole', 'Stoles and stalls'],
            ['Salwar Suit / Top Salwar', 'salwar-suit', 'Salwar kameez and suit sets'],
            ['Kurti', 'kurti', 'Everyday and party kurtis'],
            ['Maxi', 'maxi', 'Maxi dresses & gowns'],
            ['Gown', 'gown', 'Party wear gowns'],
            ['Leggings (Legi)', 'leggings', 'Cotton & ankle-length leggings'],
            ['Top', 'womens-top', 'Ladies tops'],
        ],
        'Innerwear' => [
            ['Bra', 'bra', 'All sizes'],
            ['Ladies Underwear', 'ladies-underwear', 'Cotton panties'],
            ['Ladies Boomar Underwear', 'ladies-boomar-underwear', 'Boomar / boxer style'],
            ['Gents Underwear', 'gents-underwear', 'Briefs & trunks'],
            ['Night Suit', 'night-suit', 'Comfortable night wear'],
        ],
        'Men Casual' => [
            ['T-Shirt', 'tshirt', 'Round-neck & polo t-shirts'],
            ['Jeans', 'jeans', 'Men jeans - all sizes'],
            ['Lower / Track Pant', 'lower', 'Lowers and track pants'],
        ],
        'Home & Bedding' => [
            ['Pillow Cover', 'pillow-cover', 'Soft pillow covers'],
            ['Bed Sheet', 'bed-sheet', 'Double & single bed sheets'],
        ],
        'Daily Essentials' => [
            ['Water Bottle', 'water-bottle', 'Drinking water bottles'],
            ['Santoor Soap 3-Pack', 'santoor-soap', 'Santoor combo'],
            ['Lux Soap', 'lux-soap', 'Lux bathing soap'],
            ['Jo Soap', 'jo-soap', 'Jo bathing soap'],
            ['Nihar Hair Oil', 'nihar-oil', 'Nihar naturals hair oil'],
            ['Shanti Mustard Oil', 'shanti-mustard-oil', 'Shanti sarson oil'],
            ['Shampoo Bottle', 'shampoo', 'Shampoo bottles'],
            ['Beeko Toothpaste', 'beeko-toothpaste', 'Beeko paste'],
            ['LED Bulb 1Y Warranty', 'led-bulb', 'LED bulbs with 1-year warranty'],
            ['Dishwash Gel', 'dishwash-gel', 'Bartan dhone wala gel'],
            ['Ponds Powder', 'ponds-powder', 'Ponds talc'],
        ],
    ];

    try {
        $pdo = getPDO();
        $hasCats = (int)$pdo->query("SELECT COUNT(*) FROM categories")->fetchColumn();
        if (!$hasCats) {
            $insCat = $pdo->prepare("INSERT INTO categories (parent_id, name, slug, description, sort_order, status) VALUES (?, ?, ?, ?, ?, 'active')");
            $sortGrp = 0;
            foreach ($categoryGroups as $parentName => $subs) {
                $parentSlug = \slugify($parentName);
                $insCat->execute([null, $parentName, $parentSlug, $parentName . ' category', ++$sortGrp]);
                $parentId = $pdo->lastInsertId();
                $sortSub = 0;
                foreach ($subs as $s) {
                    $insCat->execute([$parentId, $s[0], $s[1], $s[2], ++$sortSub]);
                }
            }
            echo '<div class="ok">✓ Categories seeded (' . ((int)$pdo->query("SELECT COUNT(*) FROM categories")->fetchColumn()) . ' total)</div>';
        } else {
            echo '<div class="ok">✓ Categories already exist (skipped)</div>';
        }
    } catch (Exception $ex) {
        echo '<div class="err">✗ Category seed: ' . htmlspecialchars($ex->getMessage()) . '</div>';
    }

    // Seed demo products (one per leaf category with size variants)
    try {
        $pdo = getPDO();
        $hasProducts = (int)$pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
        if (!$hasProducts) {
            // placeholder images: use a solid-colour data-URI-style asset shipped in /uploads/placeholders/
            $placeholderDir = UPLOAD_DIR . '/placeholders';
            if (!is_dir($placeholderDir)) @mkdir($placeholderDir, 0775, true);
            $placeholder = 'placeholder.svg';
            $placeholderPath = $placeholderDir . '/' . $placeholder;
            if (!file_exists($placeholderPath)) {
                file_put_contents($placeholderPath, '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f26722"/><stop offset="100%" stop-color="#e53935"/></linearGradient></defs><rect width="600" height="600" fill="url(#g)"/><text x="50%" y="50%" font-family="Poppins,sans-serif" font-size="44" fill="#fff" text-anchor="middle" dominant-baseline="middle" font-weight="600">Jai Collection</text></svg>');
            }

            // price templates by category slug (rough Indian market rates)
            $priceMap = [
                'saree' => [699, 1299], 'saree-party-wear' => [1499, 3499],
                'blouse' => [199, 499], 'blouse-fancy' => [399, 999],
                'petticoat' => [199, 449], 'dupatta' => [199, 599], 'chunri' => [149, 399], 'stole' => [199, 499],
                'salwar-suit' => [899, 2499], 'kurti' => [399, 999], 'maxi' => [499, 1299], 'gown' => [899, 2499],
                'leggings' => [249, 499], 'womens-top' => [349, 899],
                'bra' => [199, 599], 'ladies-underwear' => [99, 299], 'ladies-boomar-underwear' => [149, 349],
                'gents-underwear' => [149, 349], 'night-suit' => [499, 999],
                'tshirt' => [249, 699], 'jeans' => [699, 1499], 'lower' => [349, 799],
                'pillow-cover' => [199, 499], 'bed-sheet' => [499, 1499],
                'water-bottle' => [99, 299], 'santoor-soap' => [99, 149], 'lux-soap' => [45, 80],
                'jo-soap' => [30, 60], 'nihar-oil' => [90, 240], 'shanti-mustard-oil' => [180, 320],
                'shampoo' => [150, 450], 'beeko-toothpaste' => [60, 120], 'led-bulb' => [99, 299],
                'dishwash-gel' => [99, 199], 'ponds-powder' => [99, 249],
            ];

            $leafCats = $pdo->query("SELECT * FROM categories WHERE parent_id IS NOT NULL ORDER BY id")->fetchAll();
            $insP = $pdo->prepare("INSERT INTO products (category_id, name, slug, sku, short_description, description, image, price, compare_price, stock, has_variants, is_featured, sort_order, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')");
            $insV = $pdo->prepare("INSERT INTO product_variants (product_id, size, color, sku, price, stock) VALUES (?, ?, ?, ?, ?, ?)");

            $garmentCats = ['saree','saree-party-wear','blouse','blouse-fancy','petticoat','salwar-suit','kurti','maxi','gown','leggings','womens-top','bra','ladies-underwear','ladies-boomar-underwear','gents-underwear','night-suit','tshirt','jeans','lower','dupatta','chunri','stole'];
            $sizes = ['S','M','L','XL','XXL'];
            $colors = ['Red','Blue','Black','White','Maroon','Navy','Pink','Green'];

            $featuredCount = 0;
            foreach ($leafCats as $lc) {
                $range = $priceMap[$lc['slug']] ?? [199, 499];
                // 2 demo products per leaf category
                for ($n = 1; $n <= 2; $n++) {
                    $name = $lc['name'] . ' Demo ' . $n;
                    $slug = $lc['slug'] . '-demo-' . $n;
                    $sku = strtoupper(substr(str_replace('-','',$lc['slug']), 0, 4)) . 'D' . $n;
                    $price = rand($range[0], $range[1]);
                    $compare = $price + rand(50, 300);
                    $hasV = in_array($lc['slug'], $garmentCats) ? 1 : 0;
                    $featured = ($featuredCount < 10 && $n === 1) ? 1 : 0;
                    $stock = $hasV ? 0 : rand(10, 100);
                    $desc = 'Demo product for ' . $lc['name'] . '. Replace with real products via admin panel.';
                    $insP->execute([$lc['id'], $name, $slug, $sku, 'Demo: ' . $lc['name'], $desc, 'placeholders/' . $placeholder, $price, $compare, $stock, $hasV, $featured, $n]);
                    $pid = $pdo->lastInsertId();
                    if ($featured) $featuredCount++;
                    if ($hasV) {
                        $selectedSizes = ['S','M','L','XL'];
                        $selectedColors = array_slice($colors, 0, 2);
                        foreach ($selectedSizes as $sz) {
                            foreach ($selectedColors as $co) {
                                $insV->execute([$pid, $sz, $co, $sku . '-' . $sz . '-' . strtoupper(substr($co,0,2)), null, rand(5, 30)]);
                            }
                        }
                    }
                }
            }
            echo '<div class="ok">✓ Demo products seeded (' . ((int)$pdo->query("SELECT COUNT(*) FROM products")->fetchColumn()) . ' products, ' . ((int)$pdo->query("SELECT COUNT(*) FROM product_variants")->fetchColumn()) . ' variants)</div>';
        } else {
            echo '<div class="ok">✓ Products already exist (skipped)</div>';
        }
    } catch (Exception $ex) {
        echo '<div class="err">✗ Product seed: ' . htmlspecialchars($ex->getMessage()) . '</div>';
    }

    // Seed shipping rates
    try {
        $pdo = getPDO();
        $hasShip = (int)$pdo->query("SELECT COUNT(*) FROM shipping_rates")->fetchColumn();
        if (!$hasShip) {
            $pdo->exec("INSERT INTO shipping_rates (name, pincode_prefix, rate, free_above, status) VALUES
                ('Standard (All India)', NULL, 60, 999, 'active'),
                ('Metro Cities (4*)', '4', 40, 799, 'active'),
                ('Remote (7*)', '7', 99, 1499, 'active')");
            echo '<div class="ok">✓ Shipping rates seeded</div>';
        }
    } catch (Exception $ex) {
        echo '<div class="err">✗ Shipping seed: ' . htmlspecialchars($ex->getMessage()) . '</div>';
    }

    // Seed coupon
    try {
        $pdo = getPDO();
        $hasCoupon = (int)$pdo->query("SELECT COUNT(*) FROM coupons")->fetchColumn();
        if (!$hasCoupon) {
            $pdo->exec("INSERT INTO coupons (code, type, value, min_order, max_discount, usage_limit, valid_from, valid_to, status) VALUES
                ('WELCOME10', 'percent', 10, 499, 200, 500, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'active'),
                ('FLAT50', 'flat', 50, 299, NULL, NULL, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'active')");
            echo '<div class="ok">✓ Coupons seeded</div>';
        }
    } catch (Exception $ex) {
        echo '<div class="err">✗ Coupon seed: ' . htmlspecialchars($ex->getMessage()) . '</div>';
    }

    echo '</div>';
    echo '<div class="alert alert-success" style="margin-top:20px;"><b>Installation complete!</b></div>';
    echo '<h2>Next steps</h2>';
    echo '<ol>';
    echo '<li><b>Delete / rename this <code>install.php</code></b> file for security.</li>';
    echo '<li>Log in to admin at <a href="' . SITE_URL . '/admin/login.php">/admin/login.php</a> with <b>9999999999</b> / <b>admin@123</b> and change the password.</li>';
    echo '<li>Go to <b>Settings</b> and paste your RogerPay API Key + Secret when you get them, then enable "RogerPay".</li>';
    echo '<li>Delete the demo products and add your real catalog.</li>';
    echo '<li>Agent demo login: <a href="' . SITE_URL . '/agent/login.php">/agent/login.php</a> with <b>8888888888</b> / <b>agent@123</b> (referral code <code>DEMOAGENT</code>).</li>';
    echo '</ol>';
    echo '<a href="' . SITE_URL . '/" class="btn btn-orange">Open Storefront</a> ';
    echo '<a href="' . SITE_URL . '/admin/login.php" class="btn">Open Admin</a>';
    jc_install_footer();
    exit;
}
