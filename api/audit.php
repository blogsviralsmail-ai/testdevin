<?php
header('Content-Type: text/plain');
require_once '/home/jptilesi/public_html/includes/config.php';

$conn = getDBConnection();
$issues = [];

echo "=== JP TILES PROJECT AUDIT ===\n";
echo "Date: " . date('Y-m-d H:i:s') . "\n\n";

// 1. Database integrity checks
echo "=== 1. DATABASE INTEGRITY ===\n";

// Check masons table
$total_masons = $conn->query("SELECT COUNT(*) as c FROM masons")->fetch_assoc()['c'];
$active_masons = $conn->query("SELECT COUNT(*) as c FROM masons WHERE status = 'active'")->fetch_assoc()['c'];
$masons_with_user = $conn->query("SELECT COUNT(*) as c FROM masons WHERE user_id IS NOT NULL")->fetch_assoc()['c'];
echo "Total masons: $total_masons\n";
echo "Active masons: $active_masons\n";
echo "Masons with user account: $masons_with_user\n";

// Check for masons without user_id (active only)
$no_user = $conn->query("SELECT COUNT(*) as c FROM masons WHERE user_id IS NULL AND status = 'active'")->fetch_assoc()['c'];
if ($no_user > 0) {
    $issues[] = "BUG: $no_user active masons without user account (can't login)";
    echo "WARNING: $no_user active masons without user account\n";
}

// Check visits
$total_visits = $conn->query("SELECT COUNT(*) as c FROM mason_visits")->fetch_assoc()['c'];
$orphan_visits = $conn->query("SELECT COUNT(*) as c FROM mason_visits v LEFT JOIN masons m ON v.mason_id = m.id WHERE m.id IS NULL")->fetch_assoc()['c'];
echo "\nTotal visits: $total_visits\n";
if ($orphan_visits > 0) {
    $issues[] = "BUG: $orphan_visits orphan visits (mason deleted but visits remain)";
    echo "WARNING: $orphan_visits orphan visits\n";
}

// Check pending visits
$pending = $conn->query("SELECT COUNT(*) as c FROM pending_visits")->fetch_assoc()['c'];
echo "Pending visits: $pending\n";

// Check for duplicate mobiles
$dupes = $conn->query("SELECT mobile, COUNT(*) as c FROM masons GROUP BY mobile HAVING c > 1")->num_rows;
if ($dupes > 0) {
    $issues[] = "BUG: $dupes duplicate mobile numbers in masons";
    echo "WARNING: $dupes duplicate mobile numbers\n";
}

// 2. Check products and categories
echo "\n=== 2. PRODUCTS & CATEGORIES ===\n";
$products = $conn->query("SELECT COUNT(*) as c FROM products")->fetch_assoc()['c'];
$categories = $conn->query("SELECT COUNT(*) as c FROM categories")->fetch_assoc()['c'];
$products_no_cat = $conn->query("SELECT COUNT(*) as c FROM products WHERE category_id IS NULL OR category_id NOT IN (SELECT id FROM categories)")->fetch_assoc()['c'];
echo "Products: $products\n";
echo "Categories: $categories\n";
if ($products_no_cat > 0) {
    $issues[] = "WARNING: $products_no_cat products without valid category";
    echo "WARNING: $products_no_cat products without valid category\n";
}

// 3. Check enquiries
echo "\n=== 3. ENQUIRIES ===\n";
$enquiries = $conn->query("SELECT COUNT(*) as c FROM enquiries")->fetch_assoc()['c'];
$new_enquiries = $conn->query("SELECT COUNT(*) as c FROM enquiries WHERE status = 'new'")->fetch_assoc()['c'];
echo "Total enquiries: $enquiries\n";
echo "New enquiries: $new_enquiries\n";

// 4. Check meetings
echo "\n=== 4. MEETINGS ===\n";
$meetings = $conn->query("SELECT COUNT(*) as c FROM meetings")->fetch_assoc()['c'];
echo "Total meetings: $meetings\n";

// 5. Check gifts
echo "\n=== 5. GIFTS ===\n";
$gifts = $conn->query("SELECT COUNT(*) as c FROM gifts")->fetch_assoc()['c'];
echo "Total gifts: $gifts\n";

// 6. Check offers and winners
echo "\n=== 6. OFFERS & WINNERS ===\n";
$offers = $conn->query("SELECT COUNT(*) as c FROM offers")->fetch_assoc()['c'];
$winners = $conn->query("SELECT COUNT(*) as c FROM winners")->fetch_assoc()['c'];
echo "Offers: $offers\n";
echo "Winners: $winners\n";

// 7. Check employees/admins
echo "\n=== 7. EMPLOYEES/ADMINS ===\n";
$admins = $conn->query("SELECT COUNT(*) as c FROM users WHERE role = 'admin'")->fetch_assoc()['c'];
$employees = $conn->query("SELECT COUNT(*) as c FROM users WHERE role = 'employee'")->fetch_assoc()['c'];
echo "Admins: $admins\n";
echo "Employees: $employees\n";

// 8. Check customer categories
echo "\n=== 8. CUSTOMER CATEGORIES ===\n";
$cust_cats = $conn->query("SELECT COUNT(*) as c FROM customer_categories")->fetch_assoc()['c'];
echo "Customer categories: $cust_cats\n";

// 9. Check sliders
echo "\n=== 9. SLIDERS ===\n";
$sliders = $conn->query("SELECT COUNT(*) as c FROM sliders")->fetch_assoc()['c'];
echo "Sliders: $sliders\n";

// 10. Check gallery
echo "\n=== 10. GALLERY ===\n";
$gallery = $conn->query("SELECT COUNT(*) as c FROM gallery")->fetch_assoc()['c'];
echo "Gallery items: $gallery\n";

// 11. Check settings
echo "\n=== 11. SETTINGS ===\n";
$settings = $conn->query("SELECT COUNT(*) as c FROM settings")->fetch_assoc()['c'];
echo "Settings: $settings\n";

// Summary
echo "\n\n=== ISSUES FOUND ===\n";
if (count($issues) == 0) {
    echo "No critical issues found!\n";
} else {
    foreach ($issues as $issue) {
        echo "- $issue\n";
    }
}

$conn->close();