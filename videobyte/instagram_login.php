<?php
require_once __DIR__ . '/config.php';

// Instagram OAuth redirect (via Facebook)
if (!defined('FB_APP_ID') || !FB_APP_ID) {
    header('Location: admin.html?err=Instagram+not+configured');
    exit;
}

$params = http_build_query([
    'client_id'     => FB_APP_ID,
    'redirect_uri'  => APP_URL . '/ig_callback.php',
    'scope'         => 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement',
    'response_type' => 'code',
]);

header('Location: https://www.facebook.com/v18.0/dialog/oauth?' . $params);
exit;
