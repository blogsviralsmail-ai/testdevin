<?php
require_once __DIR__ . '/config.php';

// Google OAuth redirect
if (!GOOGLE_CLIENT_ID) {
    header('Location: login.html?err=Google+login+not+configured');
    exit;
}

$params = http_build_query([
    'client_id'     => GOOGLE_CLIENT_ID,
    'redirect_uri'  => APP_URL . '/google_callback.php',
    'response_type' => 'code',
    'scope'         => 'openid email profile',
    'access_type'   => 'offline',
    'prompt'        => 'consent',
]);

header('Location: https://accounts.google.com/o/oauth2/v2/auth?' . $params);
exit;
