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

// Only mutate the order when the signature is valid — otherwise an unauthenticated
// attacker could mark any order as payment-failed by guessing its number. On a
// bad signature we just display an error and redirect without touching the DB.
// Whitelist this order for anonymous view on /order-success.php within the
// current session. Without this flag, the success page requires a customer
// login or shipping-mobile match (see order-success.php access rules).
$_SESSION['jc_order_confirm'][] = $orderNumber;

if (!$sigOk) {
    setFlash('error', 'Payment verification failed. Please contact support if you were charged.');
    redirect(SITE_URL . '/order-success.php?order=' . urlencode($orderNumber));
} elseif (in_array($status, ['success', 'paid', 'captured', 'completed'], true)) {
    rogerpayMarkOrderPaid($orderNumber, $params['txn_id'] ?? $params['transaction_id'] ?? null, $params);
    redirect(SITE_URL . '/order-success.php?order=' . urlencode($orderNumber));
} else {
    rogerpayMarkOrderFailed($orderNumber, $params);
    setFlash('error', 'Payment was not successful. Please try again or choose COD.');
    redirect(SITE_URL . '/order-success.php?order=' . urlencode($orderNumber));
}
