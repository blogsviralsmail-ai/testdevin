<?php
// User-facing redirect handler after payment completion
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/rogerpay.php';

$params = array_merge($_GET, $_POST);
$orderNumber = $params['order_id'] ?? $params['order_number'] ?? '';
$status = strtolower($params['status'] ?? $params['payment_status'] ?? '');
$signature = $params['signature'] ?? '';

if (!$orderNumber) {
    setFlash('error', 'Invalid payment response.');
    redirect(SITE_URL . '/');
}

$sigOk = rogerpayVerifySignature($params, $signature);

// Only mutate the order or whitelist it for anonymous view when the signature
// is valid. Without this check, an attacker who knows/guesses an order number
// could hit this endpoint with no signature, get the order whitelisted in their
// session, and then view the full order details on /order-success.php.
if (!$sigOk) {
    setFlash('error', 'Payment verification failed. Please contact support if you were charged.');
    // Do NOT whitelist — redirect to /order-success.php will fall back to
    // the mobile-verification form for anyone without a valid session.
    redirect(SITE_URL . '/order-success.php?order=' . urlencode($orderNumber));
}

jcPushOrderConfirm($orderNumber);

if (in_array($status, ['success', 'paid', 'captured', 'completed'], true)) {
    rogerpayMarkOrderPaid($orderNumber, $params['txn_id'] ?? $params['transaction_id'] ?? null, $params);
    redirect(SITE_URL . '/order-success.php?order=' . urlencode($orderNumber));
} else {
    rogerpayMarkOrderFailed($orderNumber, $params);
    setFlash('error', 'Payment was not successful. Please try again or choose COD.');
    redirect(SITE_URL . '/order-success.php?order=' . urlencode($orderNumber));
}
