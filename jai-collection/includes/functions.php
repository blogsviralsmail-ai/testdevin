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
    if (!empty($opts['is_hot'])) { $where[] = "p.is_hot = 1"; }
    if (isset($opts['low_stock'])) { $where[] = "p.stock <= ?"; $args[] = (int)$opts['low_stock']; }
    if (!empty($opts['search'])) { $where[] = "(p.name LIKE ? OR p.short_description LIKE ? OR p.sku LIKE ?)"; $args[] = '%' . $opts['search'] . '%'; $args[] = '%' . $opts['search'] . '%'; $args[] = '%' . $opts['search'] . '%'; }
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

// uploadImageFile($_FILES['image'], 'products', 'prod') -> filename|false
// Validates extension, generates unique filename, ensures target dir exists,
// runs move_uploaded_file() and **checks the return value**. Previously call
// sites ignored the return value and wrote the filename to the DB regardless
// of whether the file was actually saved (e.g. when /uploads/ was not writable
// by the php-fpm user — which was the root cause of "image upload hoti hai
// par dikhai nahi deti" reports). On failure a generic $error is appended to
// setFlash('error', …) so the admin sees something went wrong.
function uploadImageFile($fileArr, $subdir = 'products', $prefix = 'prod',
                         $allowedExt = ['jpg','jpeg','png','webp','gif']) {
    if (empty($fileArr) || empty($fileArr['tmp_name']) || !is_uploaded_file($fileArr['tmp_name'])) {
        return false;
    }
    if (($fileArr['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        error_log('[upload] PHP upload error code ' . $fileArr['error'] . ' for ' . ($fileArr['name'] ?? '?'));
        setFlash('error', 'Image upload failed (PHP error ' . (int)$fileArr['error'] . '). Please try again.');
        return false;
    }
    $ext = strtolower(pathinfo($fileArr['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $allowedExt, true)) {
        setFlash('error', 'Image type not allowed. Use: ' . implode(', ', $allowedExt));
        return false;
    }
    $fn   = $prefix . '_' . time() . '_' . generateRandomString(6) . '.' . $ext;
    $dest = UPLOAD_DIR . '/' . $subdir . '/' . $fn;
    if (!is_dir(dirname($dest))) {
        @mkdir(dirname($dest), 0755, true);
    }
    if (!is_writable(dirname($dest))) {
        error_log('[upload] target dir not writable: ' . dirname($dest));
        setFlash('error', 'Server upload folder not writable — contact admin.');
        return false;
    }
    if (!@move_uploaded_file($fileArr['tmp_name'], $dest)) {
        error_log('[upload] move_uploaded_file failed: ' . $fileArr['tmp_name'] . ' -> ' . $dest);
        setFlash('error', 'Could not save uploaded file. Please try again.');
        return false;
    }
    @chmod($dest, 0644);
    return $fn;
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
        // Cap line quantity at the currently-available stock so a customer
        // can't oversell a product by placing a huge qty in the cart and
        // waiting for other orders to deplete stock. Per-variant stock is
        // authoritative when the product has variants; otherwise fall back
        // to products.stock. A qty of 0 drops the line entirely.
        $available = (int)(($v !== null ? $v['stock'] : ($p['stock'] ?? 0)));
        if ($available < 0) $available = 0;
        $qty = min((int)$it['qty'], $available);
        if ($qty <= 0) continue;
        $price = productEffectivePrice($p, $v);
        $line = $price * $qty;
        $resolved[] = [
            'key' => $key,
            'product' => $p,
            'variant' => $v,
            'qty' => $qty,
            'price' => $price,
            'line_total' => $line,
            'available' => $available,
            'capped' => $qty < (int)$it['qty'],
        ];
        $subtotal += $line;
        $count += $qty;
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

// walletCredit / walletDebit accept optional counter deltas so callers that are
// NOT a real earn/payout (e.g. payout refunds, commission reversals) can adjust
// lifetime_earned / lifetime_paid in the same transaction as the wallet move.
// Previously the caller ran a separate UPDATE after walletCredit/walletDebit,
// which meant a DB error between the two would leave wallet_balance correct
// but lifetime_* counters permanently drifted.
//
// Defaults preserve the original behavior:
//   walletCredit: lifetime_earned += amount, lifetime_paid unchanged
//   walletDebit:  lifetime_paid   += amount, lifetime_earned unchanged
// Pass explicit deltas (can be negative) to override, e.g. for a refund:
//   walletCredit($aid, $amt, 'payout_refund', $id, $desc, 0, -$amt);
function walletCredit($agentId, $amount, $refType, $refId, $description, $lifetimeEarnedDelta = null, $lifetimePaidDelta = 0) {
    if ($lifetimeEarnedDelta === null) $lifetimeEarnedDelta = $amount;
    $pdo = getPDO();
    // Guard against nested transactions: PDO without savepoint emulation will
    // throw "There is already an active transaction" if the caller already has
    // one open. We join the caller's transaction when one exists (no commit /
    // rollback here — the caller is responsible) and start our own otherwise.
    $ownsTx = !$pdo->inTransaction();
    if ($ownsTx) $pdo->beginTransaction();
    try {
        $pdo->prepare("UPDATE agents SET wallet_balance = wallet_balance + ?, lifetime_earned = GREATEST(lifetime_earned + ?, 0), lifetime_paid = GREATEST(lifetime_paid + ?, 0) WHERE id = ?")
            ->execute([$amount, $lifetimeEarnedDelta, $lifetimePaidDelta, $agentId]);
        $balStmt = $pdo->prepare("SELECT wallet_balance FROM agents WHERE id = ?");
        $balStmt->execute([$agentId]);
        $bal = (float)$balStmt->fetchColumn();
        $pdo->prepare("INSERT INTO agent_wallet_transactions (agent_id, type, amount, balance_after, ref_type, ref_id, description) VALUES (?, 'credit', ?, ?, ?, ?, ?)")
            ->execute([$agentId, $amount, $bal, $refType, $refId, $description]);
        if ($ownsTx) $pdo->commit();
        return true;
    } catch (Exception $e) {
        if ($ownsTx && $pdo->inTransaction()) $pdo->rollBack();
        error_log('[walletCredit] ' . $e->getMessage());
        return false;
    }
}

function walletDebit($agentId, $amount, $refType, $refId, $description, $lifetimeEarnedDelta = 0, $lifetimePaidDelta = null) {
    if ($lifetimePaidDelta === null) $lifetimePaidDelta = $amount;
    $pdo = getPDO();
    $ownsTx = !$pdo->inTransaction();
    if ($ownsTx) $pdo->beginTransaction();
    try {
        $upd = $pdo->prepare("UPDATE agents SET wallet_balance = wallet_balance - ?, lifetime_earned = GREATEST(lifetime_earned + ?, 0), lifetime_paid = GREATEST(lifetime_paid + ?, 0) WHERE id = ? AND wallet_balance >= ?");
        $upd->execute([$amount, $lifetimeEarnedDelta, $lifetimePaidDelta, $agentId, $amount]);
        if ($upd->rowCount() === 0) {
            throw new Exception('Insufficient wallet balance or agent not found');
        }
        $balStmt = $pdo->prepare("SELECT wallet_balance FROM agents WHERE id = ?");
        $balStmt->execute([$agentId]);
        $bal = (float)$balStmt->fetchColumn();
        $pdo->prepare("INSERT INTO agent_wallet_transactions (agent_id, type, amount, balance_after, ref_type, ref_id, description) VALUES (?, 'debit', ?, ?, ?, ?, ?)")
            ->execute([$agentId, $amount, $bal, $refType, $refId, $description]);
        if ($ownsTx) $pdo->commit();
        return true;
    } catch (Exception $e) {
        if ($ownsTx && $pdo->inTransaction()) $pdo->rollBack();
        error_log('[walletDebit] ' . $e->getMessage());
        return false;
    }
}

// ==========================================================================
// Coupons
// ==========================================================================
// validateCoupon(code, subtotal) -> ['ok'=>bool, 'error'=>msg, 'coupon'=>row, 'discount'=>float]
// Applies: status=active, valid_from/valid_to window, min_order, usage_limit.
// Returns a clamped discount (percent with max_discount cap, or flat not
// exceeding the subtotal so total can't go below 0).
function validateCoupon($code, $subtotal) {
    $code = strtoupper(trim((string)$code));
    if ($code === '') return ['ok' => false, 'error' => ''];
    $stmt = getPDO()->prepare("SELECT * FROM coupons WHERE code = ? AND status = 'active' LIMIT 1");
    $stmt->execute([$code]);
    $c = $stmt->fetch();
    if (!$c) return ['ok' => false, 'error' => 'Invalid coupon code.'];
    $today = date('Y-m-d');
    if (!empty($c['valid_from']) && $today < $c['valid_from']) {
        return ['ok' => false, 'error' => 'This coupon is not yet active.'];
    }
    if (!empty($c['valid_to']) && $today > $c['valid_to']) {
        return ['ok' => false, 'error' => 'This coupon has expired.'];
    }
    if ($c['usage_limit'] !== null && (int)$c['used_count'] >= (int)$c['usage_limit']) {
        return ['ok' => false, 'error' => 'This coupon has reached its usage limit.'];
    }
    if ((float)$c['min_order'] > 0 && $subtotal < (float)$c['min_order']) {
        return ['ok' => false, 'error' => 'Minimum order of ' . money($c['min_order']) . ' required for this coupon.'];
    }
    if ($c['type'] === 'flat') {
        $discount = (float)$c['value'];
    } else {
        $discount = $subtotal * ((float)$c['value'] / 100);
        if ($c['max_discount'] !== null && $discount > (float)$c['max_discount']) {
            $discount = (float)$c['max_discount'];
        }
    }
    // Never discount more than the subtotal so total can't go negative.
    if ($discount > $subtotal) $discount = $subtotal;
    $discount = round($discount, 2);
    return ['ok' => true, 'coupon' => $c, 'discount' => $discount];
}

// Reverse already-credited commission (e.g. when a delivered order is returned/cancelled).
// Debits the wallet and marks the commission row cancelled. Safe to call for
// orders with no agent or no credited commission (no-op).
function reverseCommissionForOrder($orderId) {
    $pdo = getPDO();
    $order = $pdo->prepare("SELECT agent_id, order_number FROM orders WHERE id = ?");
    $order->execute([$orderId]);
    $o = $order->fetch();
    if (!$o || empty($o['agent_id'])) return false;
    $stmt = $pdo->prepare("SELECT * FROM agent_commissions WHERE order_id = ? AND agent_id = ? AND status = 'credited'");
    $stmt->execute([$orderId, $o['agent_id']]);
    $reversed = false;
    while ($row = $stmt->fetch()) {
        $amt = (float)$row['amount'];
        if ($amt > 0) {
            // Commission reversal is not a payout, so pass explicit deltas to
            // walletDebit: subtract from lifetime_earned (the credit is being
            // invalidated) and do NOT bump lifetime_paid. All three counters
            // change in one transaction — if the DB fails, nothing drifts.
            $debited = walletDebit($o['agent_id'], $amt, 'commission_reversal', (int)$row['id'], 'Reversal: order ' . $o['order_number'], -$amt, 0);
            if (!$debited) {
                // Insufficient wallet balance (agent already withdrew). Leave the
                // commission in 'credited' state so admin can see the outstanding
                // reversal and chase the recovery manually.
                error_log('[commission-reversal] walletDebit failed for commission #' . $row['id'] . ' (order ' . $o['order_number'] . ', amount ' . $amt . ')');
                continue;
            }
        }
        $pdo->prepare("UPDATE agent_commissions SET status = 'cancelled' WHERE id = ?")->execute([$row['id']]);
        $reversed = true;
    }
    return $reversed;
}

// Credit commission when order is confirmed/delivered (per setting).
// Calls walletCredit() FIRST and only marks the commission row 'credited' after
// the wallet credit succeeds. Earlier versions marked the row 'credited' before
// the wallet credit, so if walletCredit() failed, the commission was stuck
// 'credited' forever (the idempotency check at the top short-circuited every
// retry) but the agent's wallet was never updated.
function creditCommissionForOrder($orderId) {
    $pdo = getPDO();
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();
    if (!$order || empty($order['agent_id'])) return false;
    $check = $pdo->prepare("SELECT * FROM agent_commissions WHERE order_id = ? AND agent_id = ?");
    $check->execute([$orderId, $order['agent_id']]);
    $existing = $check->fetch();
    if ($existing && $existing['status'] === 'credited') return true;
    // If the commission was previously credited and then reversed (e.g. order
    // was delivered -> returned/cancelled, which flips the row to 'cancelled'
    // and debits the wallet), do NOT re-credit if the admin later toggles the
    // status back to 'delivered'. Without this guard, re-delivery would pass
    // the check above (status is 'cancelled', not 'credited'), reuse the same
    // row, call walletCredit() again, and flip the row back to 'credited' —
    // giving the agent the commission twice while only one reversal happened.
    if ($existing && $existing['status'] === 'cancelled') return false;
    $amount = (float)$order['agent_commission_amount'];
    if ($amount <= 0) return false;
    // Ensure a commission row exists in 'pending' state so walletCredit() has
    // a ref_id to point to, but do NOT flip it to 'credited' yet.
    if ($existing) {
        $commId = (int)$existing['id'];
    } else {
        $pdo->prepare("INSERT INTO agent_commissions (agent_id, order_id, commission_percent, order_subtotal, amount, status) VALUES (?, ?, ?, ?, ?, 'pending')")
            ->execute([$order['agent_id'], $orderId, $order['agent_commission_percent'], $order['subtotal'], $amount]);
        $commId = (int)$pdo->lastInsertId();
    }
    // Reconcile a prior half-completed run: if walletCredit() already
    // succeeded in an earlier attempt but the mark-credited UPDATE below
    // never ran (DB disconnect between the two), there will be a wallet
    // transaction row with ref_type='commission' and ref_id=commId. Do NOT
    // call walletCredit() again (that would double-credit); just flip the
    // commission row to 'credited'.
    $already = $pdo->prepare("SELECT id FROM agent_wallet_transactions WHERE agent_id = ? AND ref_type = 'commission' AND ref_id = ? AND type = 'credit' LIMIT 1");
    $already->execute([$order['agent_id'], $commId]);
    if ($already->fetchColumn()) {
        $pdo->prepare("UPDATE agent_commissions SET status = 'credited', credited_at = NOW() WHERE id = ? AND status <> 'credited'")
            ->execute([$commId]);
        return true;
    }
    $credited = walletCredit($order['agent_id'], $amount, 'commission', $commId, 'Commission for order ' . $order['order_number']);
    if (!$credited) return false;
    $pdo->prepare("UPDATE agent_commissions SET status = 'credited', credited_at = NOW() WHERE id = ?")
        ->execute([$commId]);
    return true;
}

// Whitelist an order number so /order-success.php will render its details
// within this session. Capped at 20 entries (rolling window) so the session
// array can't grow without bound across many checkouts / bot-triggered
// callbacks. Initialises the slot as an array so order-success.php doesn't
// have to defensively coerce a scalar.
function jcPushOrderConfirm($orderNumber) {
    if (!$orderNumber) return;
    if (!isset($_SESSION['jc_order_confirm']) || !is_array($_SESSION['jc_order_confirm'])) {
        $_SESSION['jc_order_confirm'] = [];
    }
    // Remove duplicates so repeated callbacks for the same order don't fill
    // the cap.
    $_SESSION['jc_order_confirm'] = array_values(array_filter(
        $_SESSION['jc_order_confirm'],
        function ($n) use ($orderNumber) { return $n !== $orderNumber; }
    ));
    $_SESSION['jc_order_confirm'][] = $orderNumber;
    if (count($_SESSION['jc_order_confirm']) > 20) {
        $_SESSION['jc_order_confirm'] = array_slice($_SESSION['jc_order_confirm'], -20);
    }
}
