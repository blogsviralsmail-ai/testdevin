<?php
// ==========================================================================
// RogerPay Integration
// ==========================================================================
// This wrapper is built defensively because RogerPay's public API docs change
// from time to time. It follows the common pattern used by most Indian payment
// gateways (PayU / Cashfree / Razorpay style): POST to a create-order endpoint
// with a signed payload, receive a redirect/checkout URL, then verify the
// signature on the callback.
//
// To activate the gateway, admin goes to Settings and fills:
//   - rogerpay_api_key
//   - rogerpay_secret_key
//   - rogerpay_base_url   (default: https://api.rogerpay.in)
//   - rogerpay_enabled    (0/1)
//
// If RogerPay publishes a different request/response shape, only this file
// needs to be updated - no other code references the gateway.

require_once __DIR__ . '/config.php';

function rogerpayCreateOrder($orderId, $amount, $name, $email, $mobile) {
    $pdo = getPDO();
    $order = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $order->execute([$orderId]);
    $order = $order->fetch();
    if (!$order) return ['success' => false, 'message' => 'Order not found'];

    $apiKey = getSetting('rogerpay_api_key', '');
    $secret = getSetting('rogerpay_secret_key', '');
    $base = rtrim(getSetting('rogerpay_base_url', 'https://api.rogerpay.in'), '/');

    if (!$apiKey || !$secret) {
        return ['success' => false, 'message' => 'RogerPay not configured'];
    }

    $payload = [
        'api_key' => $apiKey,
        'order_id' => $order['order_number'],
        'amount' => number_format((float)$amount, 2, '.', ''),
        'currency' => SITE_CURRENCY,
        'customer_name' => $name,
        'customer_email' => $email ?: 'noreply@' . (parse_url(SITE_URL, PHP_URL_HOST) ?: 'jaicollection.in'),
        'customer_phone' => $mobile,
        'description' => 'Order ' . $order['order_number'] . ' - ' . SITE_NAME,
        'callback_url' => SITE_URL . '/api/rogerpay-callback.php',
        'webhook_url' => SITE_URL . '/api/rogerpay-webhook.php',
        'redirect_url' => SITE_URL . '/api/rogerpay-callback.php',
    ];
    // Standard signature: sorted params + secret
    ksort($payload);
    $signBase = '';
    foreach ($payload as $k => $v) { $signBase .= $k . '=' . $v . '&'; }
    $signBase = rtrim($signBase, '&');
    $payload['signature'] = hash_hmac('sha256', $signBase, $secret);

    $endpoint = $base . '/v1/orders/create';
    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json',
            'X-API-KEY: ' . $apiKey,
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
    ]);
    $res = curl_exec($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    // Log gateway response for debugging
    $pdo->prepare("UPDATE orders SET payment_raw = ? WHERE id = ?")
        ->execute([json_encode(['request' => $payload, 'response' => $res, 'http' => $http, 'err' => $err]), $orderId]);

    if ($res === false || $http >= 500) {
        return ['success' => false, 'message' => 'Gateway unreachable'];
    }
    $data = json_decode($res, true);
    if (!is_array($data)) {
        return ['success' => false, 'message' => 'Invalid gateway response'];
    }

    // Try common redirect URL fields
    $redirect = $data['redirect_url']
        ?? $data['payment_url']
        ?? $data['checkout_url']
        ?? ($data['data']['redirect_url'] ?? null)
        ?? ($data['data']['payment_url'] ?? null);

    if (!$redirect) {
        return ['success' => false, 'message' => $data['message'] ?? 'Failed to create payment'];
    }

    $txnId = $data['txn_id'] ?? $data['transaction_id'] ?? ($data['data']['txn_id'] ?? null);
    if ($txnId) {
        $pdo->prepare("UPDATE orders SET payment_ref = ? WHERE id = ?")->execute([$txnId, $orderId]);
    }

    return ['success' => true, 'redirect_url' => $redirect, 'data' => $data];
}

function rogerpayVerifySignature($params, $providedSignature) {
    $secret = getSetting('rogerpay_secret_key', '');
    if (!$secret || !$providedSignature) return false;
    $data = $params;
    unset($data['signature']);
    ksort($data);
    $signBase = '';
    foreach ($data as $k => $v) { $signBase .= $k . '=' . $v . '&'; }
    $signBase = rtrim($signBase, '&');
    $expected = hash_hmac('sha256', $signBase, $secret);
    return hash_equals($expected, $providedSignature);
}

function rogerpayMarkOrderPaid($orderNumber, $paymentRef, $raw = null) {
    $pdo = getPDO();
    $stmt = $pdo->prepare("SELECT id FROM orders WHERE order_number = ?");
    $stmt->execute([$orderNumber]);
    $row = $stmt->fetch();
    if (!$row) return false;
    $orderId = (int)$row['id'];
    // Always record the paid payment_status + latest ref/raw (idempotent on retries).
    $pdo->prepare("UPDATE orders SET payment_status = 'paid', payment_ref = ?, payment_raw = ?, updated_at = NOW() WHERE id = ?")
        ->execute([$paymentRef, $raw ? json_encode($raw) : null, $orderId]);
    // Only advance fulfillment status to 'confirmed' if the order is still pending.
    // Otherwise a duplicate webhook/callback would regress a packed/shipped/delivered
    // order back to 'confirmed', or resurrect a cancelled/returned one.
    $pdo->prepare("UPDATE orders SET status = 'confirmed' WHERE id = ? AND status = 'pending'")
        ->execute([$orderId]);
    return $orderId;
}

function rogerpayMarkOrderFailed($orderNumber, $raw = null) {
    $pdo = getPDO();
    $stmt = $pdo->prepare("UPDATE orders SET payment_status = 'failed', payment_raw = ?, updated_at = NOW() WHERE order_number = ?");
    $stmt->execute([$raw ? json_encode($raw) : null, $orderNumber]);
    return true;
}
