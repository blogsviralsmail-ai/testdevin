<?php
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':       do_login(); break;
    case 'register':    do_register(); break;
    case 'verify':      do_verify(); break;
    case 'resend':      do_resend(); break;
    case 'forgot':      do_forgot(); break;
    case 'reset':       do_reset(); break;
    case 'me':          do_me(); break;
    case 'logout':      do_logout(); break;
    // Admin
    case 'admin_users':         admin_users(); break;
    case 'admin_create_user':   admin_create_user(); break;
    case 'admin_user_update':   admin_update_user(); break;
    case 'admin_user_delete':   admin_delete_user(); break;
    default: json_out(['ok' => false, 'message' => 'Unknown action'], 400);
}

/* ── Login ─────────────────────────────────────────── */
function do_login() {
    $d = json_body();
    $email = strtolower(trim($d['email'] ?? ''));
    $pass  = $d['password'] ?? '';
    if (!$email || !$pass) json_out(['ok' => false, 'message' => 'Email and password required.'], 400);

    $stmt = db()->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($pass, $user['password'])) {
        log_action('warn', 'Failed login', "email=$email", null);
        json_out(['ok' => false, 'message' => 'Invalid email or password.'], 401);
    }

    if ($user['status'] === 'unverified') {
        json_out(['ok' => false, 'error' => 'unverified', 'message' => 'Please verify your email first.']);
    }
    if ($user['status'] === 'suspended') {
        json_out(['ok' => false, 'message' => 'Account suspended. Contact support.'], 403);
    }

    // Session
    $_SESSION['user'] = ['id' => $user['id'], 'email' => $user['email'], 'name' => $user['name'], 'role' => $user['role']];
    $token = jwt_encode(['uid' => $user['id'], 'role' => $user['role']]);

    log_action('info', 'Login', "user={$user['email']}", $user['id']);
    json_out(['ok' => true, 'token' => $token, 'user' => ['email' => $user['email'], 'name' => $user['name'], 'role' => $user['role']]]);
}

/* ── Register ──────────────────────────────────────── */
function do_register() {
    $d = json_body();
    $name  = trim($d['name'] ?? '');
    $email = strtolower(trim($d['email'] ?? ''));
    $pass  = $d['password'] ?? '';

    if (!$name || !$email || !$pass) json_out(['ok' => false, 'message' => 'All fields are required.'], 400);
    if (strlen($pass) < 8) json_out(['ok' => false, 'message' => 'Password must be at least 8 characters.'], 400);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_out(['ok' => false, 'message' => 'Invalid email.'], 400);

    $stmt = db()->prepare('SELECT id, status FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $existing = $stmt->fetch();

    if ($existing && $existing['status'] !== 'unverified') {
        json_out(['ok' => false, 'message' => 'Email already registered.'], 409);
    }

    $hash = password_hash($pass, PASSWORD_DEFAULT);

    if ($existing) {
        db()->prepare('UPDATE users SET name=?, password=?, updated_at=NOW() WHERE id=?')->execute([$name, $hash, $existing['id']]);
    } else {
        db()->prepare('INSERT INTO users (name, email, password, status) VALUES (?,?,?,?)')
             ->execute([$name, $email, $hash, 'unverified']);
    }

    // Send OTP
    $otp = generate_otp();
    db()->prepare('DELETE FROM otp_codes WHERE email=? AND purpose="verify"')->execute([$email]);
    db()->prepare('INSERT INTO otp_codes (email, code, purpose, expires_at) VALUES (?,?,?,DATE_ADD(NOW(), INTERVAL 10 MINUTE))')
         ->execute([$email, $otp, 'verify']);

    send_otp_email($email, $otp);
    log_action('info', 'Register', "email=$email", null);
    json_out(['ok' => true, 'message' => 'Verification code sent.']);
}

/* ── Verify OTP ────────────────────────────────────── */
function do_verify() {
    $d = json_body();
    $email = strtolower(trim($d['email'] ?? ''));
    $otp   = trim($d['otp'] ?? '');
    if (!$email || !$otp) json_out(['ok' => false, 'message' => 'Email and code required.'], 400);

    $stmt = db()->prepare('SELECT * FROM otp_codes WHERE email=? AND code=? AND purpose="verify" AND used=0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1');
    $stmt->execute([$email, $otp]);
    $row = $stmt->fetch();
    if (!$row) json_out(['ok' => false, 'message' => 'Invalid or expired code.'], 400);

    db()->prepare('UPDATE otp_codes SET used=1 WHERE id=?')->execute([$row['id']]);
    db()->prepare('UPDATE users SET status="active" WHERE email=?')->execute([$email]);

    $stmt = db()->prepare('SELECT * FROM users WHERE email=?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    $_SESSION['user'] = ['id' => $user['id'], 'email' => $user['email'], 'name' => $user['name'], 'role' => $user['role']];
    $token = jwt_encode(['uid' => $user['id'], 'role' => $user['role']]);

    log_action('info', 'Email verified', "email=$email", $user['id']);
    json_out(['ok' => true, 'token' => $token, 'user' => ['email' => $user['email'], 'name' => $user['name'], 'role' => $user['role']]]);
}

/* ── Resend OTP ────────────────────────────────────── */
function do_resend() {
    $d = json_body();
    $email = strtolower(trim($d['email'] ?? ''));
    if (!$email) json_out(['ok' => false, 'message' => 'Email required.'], 400);

    $otp = generate_otp();
    db()->prepare('DELETE FROM otp_codes WHERE email=? AND purpose="verify"')->execute([$email]);
    db()->prepare('INSERT INTO otp_codes (email, code, purpose, expires_at) VALUES (?,?,?,DATE_ADD(NOW(), INTERVAL 10 MINUTE))')
         ->execute([$email, $otp, 'verify']);
    send_otp_email($email, $otp);
    json_out(['ok' => true, 'message' => 'New code sent.']);
}

/* ── Forgot password ───────────────────────────────── */
function do_forgot() {
    $d = json_body();
    $email = strtolower(trim($d['email'] ?? ''));
    if (!$email) json_out(['ok' => false, 'message' => 'Email required.'], 400);

    $stmt = db()->prepare('SELECT id FROM users WHERE email=?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        $otp = generate_otp();
        db()->prepare('DELETE FROM otp_codes WHERE email=? AND purpose="reset"')->execute([$email]);
        db()->prepare('INSERT INTO otp_codes (email, code, purpose, expires_at) VALUES (?,?,?,DATE_ADD(NOW(), INTERVAL 10 MINUTE))')
             ->execute([$email, $otp, 'reset']);
        send_otp_email($email, $otp);
    }
    json_out(['ok' => true, 'message' => 'If registered, a code was sent.']);
}

/* ── Reset password ────────────────────────────────── */
function do_reset() {
    $d = json_body();
    $email = strtolower(trim($d['email'] ?? ''));
    $otp   = trim($d['otp'] ?? '');
    $pass  = $d['password'] ?? '';
    if (!$email || !$otp || !$pass) json_out(['ok' => false, 'message' => 'All fields required.'], 400);
    if (strlen($pass) < 8) json_out(['ok' => false, 'message' => 'Password must be at least 8 characters.'], 400);

    $stmt = db()->prepare('SELECT * FROM otp_codes WHERE email=? AND code=? AND purpose="reset" AND used=0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1');
    $stmt->execute([$email, $otp]);
    $row = $stmt->fetch();
    if (!$row) json_out(['ok' => false, 'message' => 'Invalid or expired code.'], 400);

    $hash = password_hash($pass, PASSWORD_DEFAULT);
    db()->prepare('UPDATE otp_codes SET used=1 WHERE id=?')->execute([$row['id']]);
    db()->prepare('UPDATE users SET password=? WHERE email=?')->execute([$hash, $email]);

    log_action('info', 'Password reset', "email=$email", null);
    json_out(['ok' => true, 'message' => 'Password reset successfully.']);
}

/* ── Session check ─────────────────────────────────── */
function do_me() {
    $u = current_user();
    if (!$u) json_out(['ok' => false], 401);
    json_out(['ok' => true, 'user' => $u]);
}

/* ── Logout ────────────────────────────────────────── */
function do_logout() {
    session_destroy();
    json_out(['ok' => true]);
}

/* ═══ Admin Functions ═══════════════════════════════ */

function admin_users() {
    require_admin();
    $rows = db()->query('SELECT id, name, email, role, status, created_at FROM users ORDER BY id DESC')->fetchAll();
    // Attach channel counts
    foreach ($rows as &$r) {
        $stmt = db()->prepare('SELECT COUNT(*) FROM channels WHERE user_id = ?');
        $stmt->execute([$r['id']]);
        $r['channels'] = (int)$stmt->fetchColumn();
        $r['connections'] = $r['channels'];
    }
    json_out(['ok' => true, 'users' => $rows]);
}

function admin_create_user() {
    require_admin();
    $d = json_body();
    $name  = trim($d['name'] ?? '');
    $email = strtolower(trim($d['email'] ?? ''));
    $pass  = $d['password'] ?? '';
    $role  = ($d['role'] ?? 'user') === 'admin' ? 'admin' : 'user';

    if (!$name || !$email || !$pass) json_out(['ok' => false, 'message' => 'All fields required.'], 400);

    $hash = password_hash($pass, PASSWORD_DEFAULT);
    try {
        db()->prepare('INSERT INTO users (name, email, password, role, status) VALUES (?,?,?,?,?)')
             ->execute([$name, $email, $hash, $role, 'active']);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) json_out(['ok' => false, 'message' => 'Email already exists.'], 409);
        throw $e;
    }

    log_action('info', 'Admin created user', "email=$email, role=$role", current_user()['id']);
    json_out(['ok' => true]);
}

function admin_update_user() {
    require_admin();
    $d = json_body();
    $id     = (int)($d['id'] ?? 0);
    $role   = ($d['role'] ?? '') === 'admin' ? 'admin' : 'user';
    $status = in_array($d['status'] ?? '', ['active','suspended']) ? $d['status'] : 'active';

    if (!$id) json_out(['ok' => false, 'message' => 'User ID required.'], 400);
    db()->prepare('UPDATE users SET role=?, status=? WHERE id=?')->execute([$role, $status, $id]);
    log_action('info', 'Admin updated user', "id=$id role=$role status=$status", current_user()['id']);
    json_out(['ok' => true]);
}

function admin_delete_user() {
    require_admin();
    $d = json_body();
    $id = (int)($d['id'] ?? 0);
    if (!$id) json_out(['ok' => false, 'message' => 'User ID required.'], 400);
    db()->prepare('DELETE FROM users WHERE id=?')->execute([$id]);
    log_action('warn', 'Admin deleted user', "id=$id", current_user()['id']);
    json_out(['ok' => true]);
}

/* ── Logging helper ────────────────────────────────── */
function log_action($level, $action, $details = '', $user_id = null) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    db()->prepare('INSERT INTO system_logs (level, action, details, user_id, ip_address) VALUES (?,?,?,?,?)')
         ->execute([$level, $action, $details, $user_id, $ip]);
}
