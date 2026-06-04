<?php
require_once __DIR__ . '/config.php';

$u = require_auth();
$code = $_GET['code'] ?? '';
if (!$code) { header('Location: admin.html?err=No+auth+code'); exit; }

// Exchange code for token
$resp = http_post('https://graph.facebook.com/v18.0/oauth/access_token', [
    'client_id'     => FB_APP_ID,
    'client_secret' => FB_APP_SECRET,
    'redirect_uri'  => APP_URL . '/ig_callback.php',
    'code'          => $code,
]);
$tokens = json_decode($resp, true);
$at = $tokens['access_token'] ?? '';
if (!$at) { header('Location: admin.html?err=OAuth+failed'); exit; }

// Get Instagram accounts via Facebook pages
$pages = json_decode(http_get('https://graph.facebook.com/v18.0/me/accounts?fields=id,name,instagram_business_account{id,username,profile_picture_url}', $at), true);

foreach (($pages['data'] ?? []) as $page) {
    $ig = $page['instagram_business_account'] ?? null;
    if ($ig) {
        $stmt = db()->prepare('INSERT INTO ig_accounts (user_id, ig_user_id, username, access_token, fb_page_id) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE access_token=?, username=?');
        $stmt->execute([
            $u['id'], $ig['id'], $ig['username'] ?? '', $at, $page['id'],
            $at, $ig['username'] ?? ''
        ]);
    }
}

log_action('info', 'Instagram connected', '', $u['id']);
header('Location: admin.html');
exit;
