<?php
require_once __DIR__ . '/config.php';

$code = $_GET['code'] ?? '';
if (!$code) { header('Location: login.html?err=No+auth+code'); exit; }

// Exchange code for tokens
$resp = http_post('https://oauth2.googleapis.com/token', [
    'code'          => $code,
    'client_id'     => GOOGLE_CLIENT_ID,
    'client_secret' => GOOGLE_CLIENT_SECRET,
    'redirect_uri'  => APP_URL . '/google_callback.php',
    'grant_type'    => 'authorization_code',
]);
$tokens = json_decode($resp, true);
if (!($tokens['access_token'] ?? '')) { header('Location: login.html?err=OAuth+failed'); exit; }

// Get user info
$info = json_decode(http_get('https://www.googleapis.com/oauth2/v2/userinfo', $tokens['access_token']), true);
$email = $info['email'] ?? '';
$name  = $info['name'] ?? '';
if (!$email) { header('Location: login.html?err=No+email+returned'); exit; }

$pdo = db();

// Check if user exists
$stmt = $pdo->prepare('SELECT * FROM users WHERE email=?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    // Auto-create user
    $stmt = $pdo->prepare('INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$name, $email, password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT), 'user', 'active']);
    $userId = $pdo->lastInsertId();
    $role = 'user';
    log_action('info', 'Google signup', "email=$email", $userId);
} else {
    $userId = $user['id'];
    $role = $user['role'];
    $name = $user['name'];
    log_action('info', 'Google login', "email=$email", $userId);
}

// Create JWT
$token = jwt_encode(['sub' => $userId, 'email' => $email, 'role' => $role, 'iat' => time(), 'exp' => time() + 86400 * 7]);

// Set session
session_start();
$_SESSION['user_id'] = $userId;

// Redirect with token
$redirect = $role === 'admin' ? 'admin.html' : 'user.html';
echo '<!DOCTYPE html><html><head><script>
localStorage.setItem("vb_auth",JSON.stringify({email:"' . addslashes($email) . '",name:"' . addslashes($name) . '",role:"' . $role . '",token:"' . $token . '"}));
window.location.href="' . $redirect . '";
</script></head><body>Redirecting...</body></html>';
