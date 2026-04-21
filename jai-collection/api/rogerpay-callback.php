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

if ($sigOk && in_array($status, ['success', 'paid', 'captured', 'completed'])) {
    rogerpayMarkOrderPaid($orderNumber, $params['txn_id'] ?? $params['transaction_id'] ?? null, $params);
    redirect(SITE_URL . '/order-success.php?order=' . urlencode($orderNumber));
} else {
    rogerpayMarkOrderFailed($orderNumber, $params);
    setFlash('error', 'Payment was not successful. Please try again or choose COD.');
    redirect(SITE_URL . '/order-success.php?order=' . urlencode($orderNumber));
}
