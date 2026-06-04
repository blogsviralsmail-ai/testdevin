<?php
// YouTube OAuth callback — delegates to api.php?action=yt_callback
require_once __DIR__ . '/config.php';

// Forward the code parameter
$code = $_GET['code'] ?? '';
if (!$code) {
    header('Location: user.html?err=No+auth+code');
    exit;
}

// Start session so require_auth() works
session_start();

// Include and call the yt_callback handler
$_GET['action'] = 'yt_callback';
require __DIR__ . '/api.php';
