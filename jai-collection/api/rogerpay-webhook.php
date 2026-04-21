<?php
// Server-to-server webhook from RogerPay. Always responds 200.
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/rogerpay.php';

header('Content-Type: application/json');

$body = file_get_contents('php://input');
$json = json_decode($body, true);
$params = is_array($json) ? $json : $_POST;

$orderNumber = $params['order_id'] ?? $params['order_number'] ?? '';
$status = strtolower($params['status'] ?? $params['payment_status'] ?? '');
$signature = $params['signature'] ?? ($_SERVER['HTTP_X_ROGERPAY_SIGNATURE'] ?? '');

if ($orderNumber && rogerpayVerifySignature($params, $signature)) {
    if (in_array($status, ['success', 'paid', 'captured', 'completed'])) {
        rogerpayMarkOrderPaid($orderNumber, $params['txn_id'] ?? $params['transaction_id'] ?? null, $params);
    } elseif (in_array($status, ['failed', 'cancelled', 'declined'])) {
        rogerpayMarkOrderFailed($orderNumber, $params);
    }
}

echo json_encode(['received' => true]);
