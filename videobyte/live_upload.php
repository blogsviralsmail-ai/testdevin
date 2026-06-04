<?php
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'init':     upload_init(); break;
    case 'chunk':    upload_chunk(); break;
    case 'complete': upload_complete(); break;
    default: json_out(['ok' => false, 'message' => 'Unknown action'], 400);
}

function upload_init() {
    $u = require_auth();
    $d = json_body();

    $name    = $d['name'] ?? 'video.mp4';
    $size    = (int)($d['size'] ?? 0);
    $quality = $d['quality'] ?? '720p';

    if ($size <= 0) json_out(['ok' => false, 'message' => 'Invalid file size'], 400);

    // Create upload directory
    $uploadDir = __DIR__ . '/uploads/live/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

    // Create record
    $pdo = db();
    $ext = pathinfo($name, PATHINFO_EXTENSION) ?: 'mp4';
    $storedName = uniqid('live_') . '.' . $ext;
    $filePath = $uploadDir . $storedName;

    $stmt = $pdo->prepare("INSERT INTO live_videos (user_id, filename, file_path, file_size, quality, status, created_at) VALUES (?, ?, ?, ?, ?, 'uploading', NOW())");
    $stmt->execute([$u['id'], $name, $filePath, $size, $quality]);
    $uploadId = $pdo->lastInsertId();

    json_out(['ok' => true, 'upload_id' => $uploadId]);
}

function upload_chunk() {
    $u = require_auth();

    $uploadId = $_GET['upload_id'] ?? '';
    $offset   = (int)($_GET['offset'] ?? 0);

    if (!$uploadId) json_out(['ok' => false, 'message' => 'upload_id required'], 400);

    // Get upload record
    $pdo = db();
    $stmt = $pdo->prepare('SELECT * FROM live_videos WHERE id=? AND user_id=?');
    $stmt->execute([$uploadId, $u['id']]);
    $upload = $stmt->fetch();

    if (!$upload) json_out(['ok' => false, 'message' => 'Upload not found'], 404);

    // Read raw body
    $chunk = file_get_contents('php://input');
    if (strlen($chunk) === 0) json_out(['ok' => false, 'message' => 'Empty chunk'], 400);

    // Append to file
    $fp = fopen($upload['file_path'], $offset === 0 ? 'wb' : 'ab');
    if (!$fp) json_out(['ok' => false, 'message' => 'Cannot write file'], 500);
    fwrite($fp, $chunk);
    fclose($fp);

    $written = filesize($upload['file_path']);
    json_out(['ok' => true, 'written' => $written]);
}

function upload_complete() {
    $u = require_auth();

    $uploadId = $_GET['upload_id'] ?? '';
    if (!$uploadId) json_out(['ok' => false, 'message' => 'upload_id required'], 400);

    $pdo = db();
    $stmt = $pdo->prepare('SELECT * FROM live_videos WHERE id=? AND user_id=?');
    $stmt->execute([$uploadId, $u['id']]);
    $upload = $stmt->fetch();

    if (!$upload) json_out(['ok' => false, 'message' => 'Upload not found'], 404);

    // Mark as ready
    $pdo->prepare("UPDATE live_videos SET status='ready' WHERE id=?")->execute([$uploadId]);

    log_action('info', 'Live video uploaded', "id=$uploadId file={$upload['filename']}", $u['id']);

    json_out(['ok' => true, 'video' => [
        'id'       => $upload['id'],
        'filename' => $upload['filename'],
        'size'     => $upload['file_size'],
        'quality'  => $upload['quality'],
        'status'   => 'ready',
    ]]);
}
