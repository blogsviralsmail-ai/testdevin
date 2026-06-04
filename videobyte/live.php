<?php
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'accounts':    live_accounts(); break;
    case 'active':      live_active_streams(); break;
    case 'start':       live_start_stream(); break;
    case 'stop':        live_stop_stream(); break;
    case 'delete_video': live_delete_video(); break;
    default: json_out(['ok' => false, 'message' => 'Unknown action'], 400);
}

function live_accounts() {
    $u = require_auth();
    $pdo = db();

    $accounts = [];

    // YouTube channels
    if ($u['role'] === 'admin') {
        $rows = $pdo->query('SELECT channel_id as id, title, thumbnail_url as thumbnail, "youtube" as platform FROM channels ORDER BY title')->fetchAll();
    } else {
        $stmt = $pdo->prepare('SELECT channel_id as id, title, thumbnail_url as thumbnail, "youtube" as platform FROM channels WHERE user_id=? ORDER BY title');
        $stmt->execute([$u['id']]);
        $rows = $stmt->fetchAll();
    }
    foreach ($rows as $r) { $accounts[] = $r; }

    // Facebook pages
    if ($u['role'] === 'admin') {
        $fbRows = $pdo->query('SELECT page_id as id, page_name as title, "facebook" as platform FROM fb_pages ORDER BY page_name')->fetchAll();
    } else {
        $stmt = $pdo->prepare('SELECT page_id as id, page_name as title, "facebook" as platform FROM fb_pages WHERE user_id=? ORDER BY page_name');
        $stmt->execute([$u['id']]);
        $fbRows = $stmt->fetchAll();
    }
    foreach ($fbRows as $r) { $r['thumbnail'] = ''; $accounts[] = $r; }

    json_out(['ok' => true, 'accounts' => $accounts]);
}

function live_active_streams() {
    $u = require_auth();
    $pdo = db();

    if ($u['role'] === 'admin') {
        $rows = $pdo->query("SELECT ls.*, lv.filename, lv.file_path FROM live_streams ls LEFT JOIN live_videos lv ON ls.video_id=lv.id WHERE ls.status='active' ORDER BY ls.started_at DESC")->fetchAll();
    } else {
        $stmt = $pdo->prepare("SELECT ls.*, lv.filename, lv.file_path FROM live_streams ls LEFT JOIN live_videos lv ON ls.video_id=lv.id WHERE ls.user_id=? AND ls.status='active' ORDER BY ls.started_at DESC");
        $stmt->execute([$u['id']]);
        $rows = $stmt->fetchAll();
    }

    json_out(['ok' => true, 'streams' => $rows]);
}

function live_start_stream() {
    $u = require_auth();
    $d = json_body();

    $videoId   = $d['video_id'] ?? '';
    $platform  = $d['platform'] ?? 'youtube';
    $channelId = $d['channel_id'] ?? '';
    $streamKey = $d['stream_key'] ?? '';
    $method    = $d['method'] ?? 'channel';
    $quality   = $d['quality'] ?? '720p';
    $loop      = $d['loop'] ?? false;

    if (!$videoId) json_out(['ok' => false, 'message' => 'video_id required'], 400);

    $pdo = db();

    // Insert stream record
    $stmt = $pdo->prepare("INSERT INTO live_streams (user_id, video_id, platform, channel_id, stream_key, quality, loop_mode, status, started_at) VALUES (?,?,?,?,?,?,?,?,NOW())");
    $stmt->execute([$u['id'], $videoId, $platform, $channelId, $streamKey, $quality, $loop ? 1 : 0, 'active']);
    $streamId = $pdo->lastInsertId();

    log_action('info', 'Live stream started', "stream_id=$streamId video_id=$videoId platform=$platform", $u['id']);

    json_out(['ok' => true, 'stream_id' => $streamId, 'message' => 'Live stream started. Video is being encoded and will go live shortly.']);
}

function live_stop_stream() {
    $u = require_auth();
    $d = json_body();
    $streamId = $d['stream_id'] ?? '';
    if (!$streamId) json_out(['ok' => false, 'message' => 'stream_id required'], 400);

    $pdo = db();
    if ($u['role'] === 'admin') {
        $pdo->prepare("UPDATE live_streams SET status='stopped', stopped_at=NOW() WHERE id=?")->execute([$streamId]);
    } else {
        $pdo->prepare("UPDATE live_streams SET status='stopped', stopped_at=NOW() WHERE id=? AND user_id=?")->execute([$streamId, $u['id']]);
    }

    log_action('info', 'Live stream stopped', "stream_id=$streamId", $u['id']);
    json_out(['ok' => true]);
}

function live_delete_video() {
    $u = require_auth();
    $d = json_body();
    $videoId = $d['video_id'] ?? '';
    if (!$videoId) json_out(['ok' => false, 'message' => 'video_id required'], 400);

    $pdo = db();

    // Stop any active streams using this video
    $pdo->prepare("UPDATE live_streams SET status='stopped', stopped_at=NOW() WHERE video_id=? AND status='active'")->execute([$videoId]);

    // Delete the video record
    if ($u['role'] === 'admin') {
        $stmt = $pdo->prepare('SELECT file_path FROM live_videos WHERE id=?');
        $stmt->execute([$videoId]);
    } else {
        $stmt = $pdo->prepare('SELECT file_path FROM live_videos WHERE id=? AND user_id=?');
        $stmt->execute([$videoId, $u['id']]);
    }
    $video = $stmt->fetch();

    if ($video) {
        if ($video['file_path'] && file_exists($video['file_path'])) {
            @unlink($video['file_path']);
        }
        if ($u['role'] === 'admin') {
            $pdo->prepare('DELETE FROM live_videos WHERE id=?')->execute([$videoId]);
        } else {
            $pdo->prepare('DELETE FROM live_videos WHERE id=? AND user_id=?')->execute([$videoId, $u['id']]);
        }
    }

    log_action('info', 'Live video deleted', "video_id=$videoId", $u['id']);
    json_out(['ok' => true]);
}
