<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/rogerpay.php';
require_once __DIR__ . '/includes/notify.php';

$cart = cartResolved();
if (!$cart['items']) { redirect(SITE_URL . '/cart.php'); }

$customer = currentCustomer();
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    // Re-resolve the cart with fresh DB state. Without this, the $cart read
    // above (at request start, before validation) would be used to compute
    // line totals and stock — so a product price / stock change between the
    // GET render and this POST submit would create an order with stale numbers
    // (classic TOCTOU). cartResolved() also re-applies stock caps per line.
    $cart = cartResolved();
    if (!$cart['items']) { redirect(SITE_URL . '/cart.php'); }
    $name = sanitize($_POST['name'] ?? '');
    $mobile = sanitize($_POST['mobile'] ?? '');
    $email = sanitize($_POST['email'] ?? '');
    $line1 = sanitize($_POST['line1'] ?? '');
    $line2 = sanitize($_POST['line2'] ?? '');
    $city = sanitize($_POST['city'] ?? '');
    $state = sanitize($_POST['state'] ?? '');
    $pincode = sanitize($_POST['pincode'] ?? '');
    $landmark = sanitize($_POST['landmark'] ?? '');
    $payment = $_POST['payment_method'] ?? 'cod';
    $notes = sanitize($_POST['notes'] ?? '');

    $shipping = calcShipping($cart['subtotal'], $pincode);
    $subtotal = $cart['subtotal'];
    $total = $subtotal + $shipping;

    if (!$name || !$mobile || !$line1 || !$city || !$state || !$pincode) {
        $error = 'Please fill all required fields.';
    } elseif ($payment === 'rogerpay' && getSetting('rogerpay_enabled', '0') !== '1') {
        $error = 'Online payment is currently disabled. Please choose Cash on Delivery.';
    } elseif ($payment === 'cod' && getSetting('cod_enabled', '1') !== '1') {
        $error = 'Cash on Delivery is currently disabled. Please choose online payment.';
    } elseif (!in_array($payment, ['cod', 'rogerpay'], true)) {
        $error = 'Invalid payment method.';
    } else {
        $pdo = getPDO();
        $pdo->beginTransaction();
        try {
            $orderNumber = generateOrderNumber();
            $agentId = currentAgentRefId();
            $agentCommissionPercent = 0;
            $agentCommissionAmount = 0;
            if ($agentId) {
                $a = getAgentById($agentId);
                if ($a) {
                    $agentCommissionPercent = (float)$a['commission_percent'];
                    $agentCommissionAmount = round($subtotal * $agentCommissionPercent / 100, 2);
                }
            }

            $stmt = $pdo->prepare("INSERT INTO orders (
                order_number, customer_id, agent_id, agent_commission_percent, agent_commission_amount,
                ship_name, ship_mobile, ship_email, ship_line1, ship_line2, ship_city, ship_state, ship_pincode, ship_landmark,
                subtotal, shipping_fee, total, payment_method, payment_status, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?)");
            $stmt->execute([
                $orderNumber,
                $customer['id'] ?? null,
                $agentId,
                $agentCommissionPercent,
                $agentCommissionAmount,
                $name, $mobile, $email, $line1, $line2, $city, $state, $pincode, $landmark,
                $subtotal, $shipping, $total, $payment, $notes
            ]);
            $orderId = (int)$pdo->lastInsertId();

            // Items
            $stmtItem = $pdo->prepare("INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_label, sku, image, price, qty, line_total) VALUES (?,?,?,?,?,?,?,?,?,?)");
            foreach ($cart['items'] as $ci) {
                $stmtItem->execute([
                    $orderId,
                    $ci['product']['id'],
                    $ci['variant']['id'] ?? null,
                    $ci['product']['name'],
                    $ci['variant'] ? variantLabel($ci['variant']) : null,
                    $ci['variant']['sku'] ?? $ci['product']['sku'] ?? null,
                    $ci['product']['image'],
                    $ci['price'],
                    $ci['qty'],
                    $ci['line_total'],
                ]);
                // Decrement stock. For variant products we also resync the
                // aggregated products.stock from the sum of variant stocks,
                // mirroring admin/stock.php so the low-stock dashboards and
                // listing pages (admin/index.php, admin/stock.php) don't show
                // stale values for variant products after customer purchases.
                if ($ci['variant']) {
                    $pdo->prepare("UPDATE product_variants SET stock = GREATEST(0, stock - ?) WHERE id = ?")
                        ->execute([$ci['qty'], $ci['variant']['id']]);
                    $sumStmt = $pdo->prepare("SELECT COALESCE(SUM(stock), 0) FROM product_variants WHERE product_id = ?");
                    $sumStmt->execute([$ci['product']['id']]);
                    $pdo->prepare("UPDATE products SET stock = ? WHERE id = ?")
                        ->execute([(int)$sumStmt->fetchColumn(), $ci['product']['id']]);
                } else {
                    $pdo->prepare("UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?")
                        ->execute([$ci['qty'], $ci['product']['id']]);
                }
            }

            // Commission placeholder (status=pending; credited on delivery)
            if ($agentId && $agentCommissionAmount > 0) {
                $pdo->prepare("INSERT INTO agent_commissions (agent_id, order_id, commission_percent, order_subtotal, amount, status) VALUES (?, ?, ?, ?, ?, 'pending')")
                    ->execute([$agentId, $orderId, $agentCommissionPercent, $subtotal, $agentCommissionAmount]);
            }

            $pdo->commit();
            cartClear();

            // Email (customer) + Telegram (admin) notifications
            notifyOrderPlaced($orderId);

            if ($payment === 'rogerpay') {
                $res = rogerpayCreateOrder($orderId, $total, $name, $email, $mobile);
                if (!empty($res['success']) && !empty($res['redirect_url'])) {
                    header('Location: ' . $res['redirect_url']);
                    exit;
                }
                // Order is already committed and cart is already cleared at this point,
                // so redirecting back to /checkout.php would bounce to an empty /cart.php
                // and the user would lose sight of their order. Send them to the order
                // success page instead so they can see the order number, contact support,
                // or retry payment.
                setFlash('error', 'Payment gateway unavailable. Your order has been placed — please contact support or retry payment from your orders page.');
                // Whitelist this order for anonymous view on /order-success.php
                // within the current session (see order-success.php access rules).
                jcPushOrderConfirm($orderNumber);
                redirect(SITE_URL . '/order-success.php?order=' . urlencode($orderNumber));
            }

            jcPushOrderConfirm($orderNumber);
            redirect(SITE_URL . '/order-success.php?order=' . urlencode($orderNumber));
        } catch (Exception $e) {
            $pdo->rollBack();
            // Never expose the raw PDO/exception message to the end user — it
            // can leak table/column names, constraint details, and SQL fragments
            // that help an attacker reconnoitre the schema. Log it server-side
            // for debugging and show a generic message to the customer.
            error_log('[checkout] Order transaction failed: ' . $e->getMessage());
            $error = 'Order failed. Please try again or contact support if this keeps happening.';
        }
    }
}

$pageTitle = 'Checkout';
require_once __DIR__ . '/includes/header.php';

$shippingEst = calcShipping($cart['subtotal']);
$total = $cart['subtotal'] + $shippingEst;
$codEnabled = getSetting('cod_enabled', '1') === '1';
$rpEnabled = getSetting('rogerpay_enabled', '0') === '1';
?>

<h1 style="font-size:22px;color:var(--jc-blue-dark);">Checkout</h1>

<?php if ($error): ?><div class="jc-alert jc-alert-error"><?php echo e($error); ?></div><?php endif; ?>

<form method="post" class="jc-checkout">
    <?php echo csrfField(); ?>
    <div class="jc-panel">
        <h3 style="margin-top:0;color:var(--jc-blue-dark);">Shipping Details</h3>
        <div class="jc-row">
            <div class="jc-form-group"><label>Full Name*</label><input class="jc-input" name="name" required value="<?php echo e($customer['name'] ?? ''); ?>"></div>
            <div class="jc-form-group"><label>Mobile*</label><input class="jc-input" name="mobile" required value="<?php echo e($customer['mobile'] ?? ''); ?>"></div>
        </div>
        <div class="jc-form-group"><label>Email</label><input class="jc-input" name="email" type="email" value="<?php echo e($customer['email'] ?? ''); ?>"></div>
        <div class="jc-form-group"><label>Address Line 1*</label><input class="jc-input" name="line1" required></div>
        <div class="jc-form-group"><label>Address Line 2</label><input class="jc-input" name="line2"></div>
        <div class="jc-row">
            <div class="jc-form-group"><label>City*</label><input class="jc-input" name="city" required></div>
            <div class="jc-form-group"><label>State*</label><input class="jc-input" name="state" required></div>
        </div>
        <div class="jc-row">
            <div class="jc-form-group"><label>Pincode*</label><input class="jc-input" name="pincode" required pattern="[0-9]{6}"></div>
            <div class="jc-form-group"><label>Landmark</label><input class="jc-input" name="landmark"></div>
        </div>
        <div class="jc-form-group"><label>Order Notes</label><textarea class="jc-textarea" name="notes"></textarea></div>

        <h3 style="margin-top:28px;color:var(--jc-blue-dark);">Payment Method</h3>
        <?php if ($codEnabled): ?>
        <label style="display:block;padding:12px;border:2px solid #eee;border-radius:6px;margin-bottom:10px;cursor:pointer;">
            <input type="radio" name="payment_method" value="cod" checked>
            <strong>Cash on Delivery (COD)</strong>
            <div style="font-size:12px;color:#888;margin-left:22px;">Pay in cash when your order is delivered.</div>
        </label>
        <?php endif; ?>
        <?php if ($rpEnabled): ?>
        <label style="display:block;padding:12px;border:2px solid #eee;border-radius:6px;cursor:pointer;">
            <input type="radio" name="payment_method" value="rogerpay" <?php echo !$codEnabled ? 'checked' : ''; ?>>
            <strong>Pay Online (RogerPay)</strong>
            <div style="font-size:12px;color:#888;margin-left:22px;">Secure online payment via UPI, cards, net banking.</div>
        </label>
        <?php endif; ?>
        <?php if (!$codEnabled && !$rpEnabled): ?>
            <div class="jc-alert jc-alert-warn">No payment methods enabled. Please contact support.</div>
        <?php endif; ?>
    </div>

    <aside class="jc-panel jc-order-summary">
        <h3 style="margin-top:0;color:var(--jc-blue-dark);">Order Summary</h3>
        <?php foreach ($cart['items'] as $it): ?>
            <div class="jc-summary-line"><span><?php echo e($it['product']['name']); ?> &times; <?php echo $it['qty']; ?></span><span><?php echo money($it['line_total']); ?></span></div>
        <?php endforeach; ?>
        <div class="jc-summary-line"><span>Subtotal</span><span><?php echo money($cart['subtotal']); ?></span></div>
        <div class="jc-summary-line"><span>Shipping (est.)</span><span><?php echo $shippingEst > 0 ? money($shippingEst) : 'FREE'; ?></span></div>
        <div class="jc-summary-line jc-summary-total"><span>Total</span><span><?php echo money($total); ?></span></div>
        <button type="submit" class="jc-btn jc-btn-primary jc-btn-block" style="margin-top:16px;">
            <i class="fas fa-check-circle"></i> Place Order
        </button>
    </aside>
</form>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
