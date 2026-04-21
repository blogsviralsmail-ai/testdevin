<?php
// Jai Collection - Business logic helpers
require_once __DIR__ . '/config.php';

// ==========================================================================
// Categories
// ==========================================================================
function getCategories($onlyActive = true, $parentId = null) {
    $sql = "SELECT * FROM categories";
    $where = [];
    $args = [];
    if ($onlyActive) { $where[] = "status = 'active'"; }
    if ($parentId === 0) { $where[] = "parent_id IS NULL"; }
    elseif ($parentId !== null) { $where[] = "parent_id = ?"; $args[] = $parentId; }
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= ' ORDER BY sort_order, name';
    $stmt = getPDO()->prepare($sql);
    $stmt->execute($args);
    return $stmt->fetchAll();
}

function getCategoryBySlug($slug) {
    $stmt = getPDO()->prepare("SELECT * FROM categories WHERE slug = ? LIMIT 1");
    $stmt->execute([$slug]);
    return $stmt->fetch();
}

function getCategoryById($id) {
    $stmt = getPDO()->prepare("SELECT * FROM categories WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    return $stmt->fetch();
}

// ==========================================================================
// Products
// ==========================================================================
function getProducts($opts = []) {
    $sql = "SELECT p.*, c.name AS category_name, c.slug AS category_slug
            FROM products p LEFT JOIN categories c ON p.category_id = c.id";
    $where = [];
    $args = [];
    if (!empty($opts['only_active'])) { $where[] = "p.status = 'active'"; }
    if (!empty($opts['category_id'])) { $where[] = "p.category_id = ?"; $args[] = (int)$opts['category_id']; }
    if (!empty($opts['is_featured'])) { $where[] = "p.is_featured = 1"; }
    if (!empty($opts['search'])) { $where[] = "(p.name LIKE ? OR p.short_description LIKE ?)"; $args[] = '%' . $opts['search'] . '%'; $args[] = '%' . $opts['search'] . '%'; }
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= ' ORDER BY p.sort_order, p.id DESC';
    if (!empty($opts['limit'])) {
        $sql .= ' LIMIT ' . (int)$opts['limit'];
        if (!empty($opts['offset'])) $sql .= ' OFFSET ' . (int)$opts['offset'];
    }
    $stmt = getPDO()->prepare($sql);
    $stmt->execute($args);
    return $stmt->fetchAll();
}

function countProducts($opts = []) {
    $sql = "SELECT COUNT(*) FROM products p";
    $where = [];
    $args = [];
    if (!empty($opts['only_active'])) { $where[] = "p.status = 'active'"; }
    if (!empty($opts['category_id'])) { $where[] = "p.category_id = ?"; $args[] = (int)$opts['category_id']; }
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
    $stmt = getPDO()->prepare($sql);
    $stmt->execute($args);
    return (int)$stmt->fetchColumn();
}

function getProductBySlug($slug) {
    $stmt = getPDO()->prepare("SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ? LIMIT 1");
    $stmt->execute([$slug]);
    return $stmt->fetch();
}

function getProductById($id) {
    $stmt = getPDO()->prepare("SELECT * FROM products WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function getProductVariants($productId) {
    $stmt = getPDO()->prepare("SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order, id");
    $stmt->execute([$productId]);
    return $stmt->fetchAll();
}

function getVariantById($id) {
    $stmt = getPDO()->prepare("SELECT * FROM product_variants WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function getProductImages($productId) {
    $stmt = getPDO()->prepare("SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id");
    $stmt->execute([$productId]);
    return $stmt->fetchAll();
}

function productImageUrl($imagePath) {
    if (!$imagePath) return SITE_URL . '/assets/images/placeholder.png';
    if (strpos($imagePath, 'http') === 0) return $imagePath;
    if (strpos($imagePath, '/') === 0) return SITE_URL . $imagePath;
    return UPLOAD_URL . '/products/' . $imagePath;
}

function productEffectivePrice($product, $variant = null) {
    if ($variant && $variant['price'] !== null && $variant['price'] !== '') {
        return (float)$variant['price'];
    }
    return (float)$product['price'];
}

function variantLabel($variant) {
    $parts = [];
    if (!empty($variant['size'])) $parts[] = 'Size: ' . $variant['size'];
    if (!empty($variant['color'])) $parts[] = 'Color: ' . $variant['color'];
    return implode(', ', $parts);
}

// ==========================================================================
// Cart computations (resolve DB data for items held in session)
// ==========================================================================
function cartResolved() {
    $items = cartItems();
    if (!$items) return ['items' => [], 'subtotal' => 0, 'count' => 0];
    $resolved = [];
    $subtotal = 0;
    $count = 0;
    foreach ($items as $key => $it) {
        $p = getProductById($it['product_id']);
        if (!$p || $p['status'] !== 'active') continue;
        $v = !empty($it['variant_id']) ? getVariantById($it['variant_id']) : null;
        $price = productEffectivePrice($p, $v);
        $line = $price * $it['qty'];
        $resolved[] = [
            'key' => $key,
            'product' => $p,
            'variant' => $v,
            'qty' => (int)$it['qty'],
            'price' => $price,
            'line_total' => $line,
        ];
        $subtotal += $line;
        $count += (int)$it['qty'];
    }
    return ['items' => $resolved, 'subtotal' => $subtotal, 'count' => $count];
}

function calcShipping($subtotal, $pincode = null) {
    $freeAbove = (float)getSetting('free_shipping_above', '999');
    $flat = (float)getSetting('default_shipping_fee', '60');
    if ($freeAbove > 0 && $subtotal >= $freeAbove) return 0;
    if ($pincode) {
        $stmt = getPDO()->prepare("SELECT * FROM shipping_rates WHERE status = 'active' AND pincode_prefix IS NOT NULL AND ? LIKE CONCAT(pincode_prefix, '%') ORDER BY LENGTH(pincode_prefix) DESC LIMIT 1");
        $stmt->execute([$pincode]);
        if ($row = $stmt->fetch()) {
            if ($row['free_above'] !== null && $subtotal >= (float)$row['free_above']) return 0;
            return (float)$row['rate'];
        }
    }
    return $flat;
}

// ==========================================================================
// Agent helpers
// ==========================================================================
function getAgentById($id) {
    $stmt = getPDO()->prepare("SELECT * FROM agents WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function generateReferralCode($name = '') {
    $base = preg_replace('/[^A-Z]/', '', strtoupper($name));
    $base = substr($base, 0, 3);
    if (strlen($base) < 3) $base = 'JC';
    for ($i = 0; $i < 10; $i++) {
        $code = $base . generateRandomString(5);
        $stmt = getPDO()->prepare("SELECT id FROM agents WHERE referral_code = ?");
        $stmt->execute([$code]);
        if (!$stmt->fetch()) return $code;
    }
    return 'JC' . generateRandomString(8);
}

function walletCredit($agentId, $amount, $refType, $refId, $description) {
    $pdo = getPDO();
    $pdo->beginTransaction();
    try {
        $pdo->prepare("UPDATE agents SET wallet_balance = wallet_balance + ?, lifetime_earned = lifetime_earned + ? WHERE id = ?")
            ->execute([$amount, $amount, $agentId]);
        $bal = (float)$pdo->query("SELECT wallet_balance FROM agents WHERE id = " . (int)$agentId)->fetchColumn();
        $pdo->prepare("INSERT INTO agent_wallet_transactions (agent_id, type, amount, balance_after, ref_type, ref_id, description) VALUES (?, 'credit', ?, ?, ?, ?, ?)")
            ->execute([$agentId, $amount, $bal, $refType, $refId, $description]);
        $pdo->commit();
        return true;
    } catch (Exception $e) {
        $pdo->rollBack();
        return false;
    }
}

function walletDebit($agentId, $amount, $refType, $refId, $description) {
    $pdo = getPDO();
    $pdo->beginTransaction();
    try {
        $pdo->prepare("UPDATE agents SET wallet_balance = wallet_balance - ?, lifetime_paid = lifetime_paid + ? WHERE id = ? AND wallet_balance >= ?")
            ->execute([$amount, $amount, $agentId, $amount]);
        $row = $pdo->query("SELECT wallet_balance FROM agents WHERE id = " . (int)$agentId)->fetch();
        if (!$row) throw new Exception('agent missing');
        $pdo->prepare("INSERT INTO agent_wallet_transactions (agent_id, type, amount, balance_after, ref_type, ref_id, description) VALUES (?, 'debit', ?, ?, ?, ?, ?)")
            ->execute([$agentId, $amount, $row['wallet_balance'], $refType, $refId, $description]);
        $pdo->commit();
        return true;
    } catch (Exception $e) {
        $pdo->rollBack();
        return false;
    }
}

// Credit commission when order is confirmed/delivered (per setting)
function creditCommissionForOrder($orderId) {
    $pdo = getPDO();
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();
    if (!$order || empty($order['agent_id'])) return false;
    // Check not already credited
    $check = $pdo->prepare("SELECT * FROM agent_commissions WHERE order_id = ? AND agent_id = ?");
    $check->execute([$orderId, $order['agent_id']]);
    $existing = $check->fetch();
    if ($existing && $existing['status'] === 'credited') return true;
    $amount = (float)$order['agent_commission_amount'];
    if ($amount <= 0) return false;
    if ($existing) {
        $pdo->prepare("UPDATE agent_commissions SET status = 'credited', credited_at = NOW() WHERE id = ?")
            ->execute([$existing['id']]);
        $commId = $existing['id'];
    } else {
        $pdo->prepare("INSERT INTO agent_commissions (agent_id, order_id, commission_percent, order_subtotal, amount, status, credited_at) VALUES (?, ?, ?, ?, ?, 'credited', NOW())")
            ->execute([$order['agent_id'], $orderId, $order['agent_commission_percent'], $order['subtotal'], $amount]);
        $commId = $pdo->lastInsertId();
    }
    return walletCredit($order['agent_id'], $amount, 'commission', $commId, 'Commission for order ' . $order['order_number']);
}
