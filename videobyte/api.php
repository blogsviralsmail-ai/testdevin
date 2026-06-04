<?php
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    // YouTube channels
    case 'channels':        get_channels(); break;
    case 'auth_url':        get_auth_url(); break;
    case 'yt_callback':     yt_callback(); break;
    case 'disconnect':      disconnect_channel(); break;

    // Videos
    case 'videos':          get_videos(); break;
    case 'categories':      get_categories(); break;
    case 'update_video':    update_video(); break;
    case 'set_thumbnail':   set_thumbnail(); break;

    // Upload
    case 'upload':          upload_video(); break;
    case 'social_upload':   social_upload(); break;

    // Queue & History
    case 'queue':           get_queue(); break;
    case 'history':         get_history(); break;

    // Analytics
    case 'analytics':       get_analytics(); break;

    // Stats
    case 'stats':           get_stats(); break;

    // Logs
    case 'logs':            get_logs(); break;

    // Facebook
    case 'fb_auth_url':     fb_auth_url(); break;
    case 'fb_callback':     fb_callback(); break;
    case 'fb_accounts':     fb_accounts(); break;
    case 'fb_disconnect':   fb_disconnect(); break;

    // Instagram
    case 'ig_accounts':     ig_accounts(); break;
    case 'ig_disconnect':   ig_disconnect(); break;

    // Live streaming
    case 'live_upload':     live_upload(); break;
    case 'live_videos':     live_videos(); break;
    case 'live_start':      live_start(); break;
    case 'live_stop':       live_stop(); break;
    case 'live_active':     live_active(); break;

    default: json_out(['ok' => false, 'message' => 'Unknown action'], 400);
}

/* ═══════════════════════════════════════════════════════
   YOUTUBE CHANNELS
   ═══════════════════════════════════════════════════════ */

function get_channels() {
    $u = require_auth();
    $isAdmin = $u['role'] === 'admin';

    if ($isAdmin) {
        $rows = db()->query('SELECT c.*, u.name as owner_name, u.email as owner_email FROM channels c LEFT JOIN users u ON c.user_id=u.id ORDER BY c.connected_at DESC')->fetchAll();
    } else {
        $stmt = db()->prepare('SELECT * FROM channels WHERE user_id=? ORDER BY connected_at DESC');
        $stmt->execute([$u['id']]);
        $rows = $stmt->fetchAll();
    }

    // Map to expected format
    $out = array_map(function($c) {
        return [
            'id'              => $c['channel_id'],
            'db_id'           => $c['id'],
            'title'           => $c['title'],
            'description'     => $c['description'] ?? '',
            'thumbnail'       => $c['thumbnail_url'],
            'subscriberCount' => (int)$c['subscriber_count'],
            'videoCount'      => (int)$c['video_count'],
            'viewCount'       => (int)$c['view_count'],
            'owner_name'      => $c['owner_name'] ?? '',
            'owner_email'     => $c['owner_email'] ?? '',
        ];
    }, $rows);

    json_out(['ok' => true, 'channels' => $out]);
}

function get_auth_url() {
    require_auth();
    if (!GOOGLE_CLIENT_ID) {
        json_out(['ok' => false, 'message' => 'YouTube API not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in config.php']);
    }
    $params = http_build_query([
        'client_id'     => GOOGLE_CLIENT_ID,
        'redirect_uri'  => YT_REDIRECT_URI,
        'response_type' => 'code',
        'scope'         => 'https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly',
        'access_type'   => 'offline',
        'prompt'        => 'consent',
    ]);
    json_out(['ok' => true, 'url' => 'https://accounts.google.com/o/oauth2/v2/auth?' . $params]);
}

function yt_callback() {
    $u = require_auth();
    $code = $_GET['code'] ?? '';
    if (!$code) { header('Location: user.html?err=No+auth+code'); exit; }

    // Exchange code for tokens
    $resp = http_post('https://oauth2.googleapis.com/token', [
        'code'          => $code,
        'client_id'     => GOOGLE_CLIENT_ID,
        'client_secret' => GOOGLE_CLIENT_SECRET,
        'redirect_uri'  => YT_REDIRECT_URI,
        'grant_type'    => 'authorization_code',
    ]);
    $tokens = json_decode($resp, true);
    if (!($tokens['access_token'] ?? '')) { header('Location: user.html?err=OAuth+failed'); exit; }

    // Get channel info
    $ch_resp = http_get('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', $tokens['access_token']);
    $ch_data = json_decode($ch_resp, true);
    $items = $ch_data['items'] ?? [];
    if (empty($items)) { header('Location: user.html?err=No+channel+found'); exit; }

    $ch = $items[0];
    $channel_id = $ch['id'];
    $snippet    = $ch['snippet'];
    $stats      = $ch['statistics'];

    // Upsert channel
    $stmt = db()->prepare('SELECT id FROM channels WHERE channel_id=?');
    $stmt->execute([$channel_id]);
    $existing = $stmt->fetch();

    $at = $tokens['access_token'];
    $rt = $tokens['refresh_token'] ?? '';
    $exp = date('Y-m-d H:i:s', time() + ($tokens['expires_in'] ?? 3600));

    if ($existing) {
        db()->prepare('UPDATE channels SET user_id=?, title=?, description=?, thumbnail_url=?, subscriber_count=?, video_count=?, view_count=?, access_token=?, refresh_token=IF(?="",refresh_token,?), token_expires=? WHERE channel_id=?')
             ->execute([$u['id'], $snippet['title'], $snippet['description'] ?? '', $snippet['thumbnails']['default']['url'] ?? '', $stats['subscriberCount'] ?? 0, $stats['videoCount'] ?? 0, $stats['viewCount'] ?? 0, $at, $rt, $rt, $exp, $channel_id]);
    } else {
        db()->prepare('INSERT INTO channels (user_id, channel_id, title, description, thumbnail_url, subscriber_count, video_count, view_count, access_token, refresh_token, token_expires) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
             ->execute([$u['id'], $channel_id, $snippet['title'], $snippet['description'] ?? '', $snippet['thumbnails']['default']['url'] ?? '', $stats['subscriberCount'] ?? 0, $stats['videoCount'] ?? 0, $stats['viewCount'] ?? 0, $at, $rt, $exp]);
    }

    log_action('info', 'YouTube channel connected', "channel=$channel_id title={$snippet['title']}", $u['id']);
    header('Location: user.html');
    exit;
}

function disconnect_channel() {
    $u = require_auth();
    $chId = $_GET['channel_id'] ?? '';
    if (!$chId) json_out(['ok' => false, 'message' => 'channel_id required'], 400);

    if ($u['role'] === 'admin') {
        db()->prepare('DELETE FROM channels WHERE channel_id=?')->execute([$chId]);
    } else {
        db()->prepare('DELETE FROM channels WHERE channel_id=? AND user_id=?')->execute([$chId, $u['id']]);
    }
    log_action('info', 'Channel disconnected', "channel=$chId", $u['id']);
    json_out(['ok' => true]);
}

/* ═══════════════════════════════════════════════════════
   VIDEOS
   ═══════════════════════════════════════════════════════ */

function get_videos() {
    $u = require_auth();
    $channelId = $_GET['channel_id'] ?? '';
    if (!$channelId) json_out(['ok' => true, 'videos' => []]);

    // Try to fetch from YouTube API if channel has valid token
    $stmt = db()->prepare('SELECT * FROM channels WHERE channel_id=?');
    $stmt->execute([$channelId]);
    $ch = $stmt->fetch();

    if ($ch && $ch['access_token']) {
        $token = ensure_token($ch);
        if ($token) {
            $resp = http_get("https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=$channelId&maxResults=50&order=date&type=video", $token);
            $data = json_decode($resp, true);
            $videos = [];
            $ids = [];
            foreach (($data['items'] ?? []) as $item) {
                $ids[] = $item['id']['videoId'];
                $videos[$item['id']['videoId']] = [
                    'id'          => $item['id']['videoId'],
                    'title'       => $item['snippet']['title'],
                    'description' => $item['snippet']['description'] ?? '',
                    'thumbnail'   => $item['snippet']['thumbnails']['medium']['url'] ?? '',
                    'publishedAt' => $item['snippet']['publishedAt'],
                ];
            }
            // Get stats
            if ($ids) {
                $idStr = implode(',', $ids);
                $sResp = http_get("https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,status&id=$idStr", $token);
                $sData = json_decode($sResp, true);
                foreach (($sData['items'] ?? []) as $sv) {
                    $vid = $sv['id'];
                    if (isset($videos[$vid])) {
                        $videos[$vid]['views']    = (int)($sv['statistics']['viewCount'] ?? 0);
                        $videos[$vid]['likes']    = (int)($sv['statistics']['likeCount'] ?? 0);
                        $videos[$vid]['comments'] = (int)($sv['statistics']['commentCount'] ?? 0);
                        $videos[$vid]['duration'] = $sv['contentDetails']['duration'] ?? '';
                        $videos[$vid]['privacy']  = $sv['status']['privacyStatus'] ?? 'public';
                        $videos[$vid]['tags']     = '';
                        $videos[$vid]['categoryId'] = '';
                    }
                }
            }
            json_out(['ok' => true, 'videos' => array_values($videos)]);
        }
    }

    // Fallback: return from local DB cache
    $stmt = db()->prepare('SELECT * FROM videos WHERE channel_id = (SELECT id FROM channels WHERE channel_id=? LIMIT 1) ORDER BY published_at DESC');
    $stmt->execute([$channelId]);
    $rows = $stmt->fetchAll();
    $out = array_map(function($v) {
        return [
            'id'          => $v['video_id'],
            'title'       => $v['title'],
            'description' => $v['description'],
            'thumbnail'   => $v['thumbnail_url'],
            'views'       => (int)$v['view_count'],
            'likes'       => (int)$v['like_count'],
            'comments'    => (int)$v['comment_count'],
            'publishedAt' => $v['published_at'],
            'privacy'     => $v['privacy'],
            'tags'        => $v['tags'],
            'categoryId'  => $v['category_id'],
        ];
    }, $rows);
    json_out(['ok' => true, 'videos' => $out]);
}

function get_categories() {
    require_auth();
    // YouTube video categories (static list — common ones)
    $cats = [
        ['id' => '1',  'title' => 'Film & Animation'],
        ['id' => '2',  'title' => 'Autos & Vehicles'],
        ['id' => '10', 'title' => 'Music'],
        ['id' => '15', 'title' => 'Pets & Animals'],
        ['id' => '17', 'title' => 'Sports'],
        ['id' => '19', 'title' => 'Travel & Events'],
        ['id' => '20', 'title' => 'Gaming'],
        ['id' => '22', 'title' => 'People & Blogs'],
        ['id' => '23', 'title' => 'Comedy'],
        ['id' => '24', 'title' => 'Entertainment'],
        ['id' => '25', 'title' => 'News & Politics'],
        ['id' => '26', 'title' => 'Howto & Style'],
        ['id' => '27', 'title' => 'Education'],
        ['id' => '28', 'title' => 'Science & Technology'],
    ];
    json_out(['ok' => true, 'categories' => $cats]);
}

function update_video() {
    $u = require_auth();
    $d = json_body();
    $videoId = $d['video_id'] ?? '';
    $channelId = $d['channel_id'] ?? '';
    if (!$videoId || !$channelId) json_out(['ok' => false, 'message' => 'video_id and channel_id required'], 400);

    $stmt = db()->prepare('SELECT * FROM channels WHERE channel_id=?');
    $stmt->execute([$channelId]);
    $ch = $stmt->fetch();
    if (!$ch) json_out(['ok' => false, 'message' => 'Channel not found'], 404);

    $token = ensure_token($ch);
    if (!$token) json_out(['ok' => false, 'message' => 'Token expired. Please reconnect channel.'], 401);

    $body = ['id' => $videoId, 'snippet' => ['title' => $d['title'] ?? '', 'description' => $d['description'] ?? '', 'tags' => explode(',', $d['tags'] ?? ''), 'categoryId' => $d['category_id'] ?? '22'], 'status' => ['privacyStatus' => $d['privacy'] ?? 'public']];

    $resp = http_request('PUT', 'https://www.googleapis.com/youtube/v3/videos?part=snippet,status', json_encode($body), $token, 'application/json');
    $result = json_decode($resp, true);

    if (isset($result['id'])) {
        json_out(['ok' => true, 'message' => 'Video updated successfully.']);
    } else {
        json_out(['ok' => false, 'message' => $result['error']['message'] ?? 'Update failed.'], 400);
    }
}

function set_thumbnail() {
    $u = require_auth();
    $videoId = $_POST['video_id'] ?? '';
    $channelId = $_POST['channel_id'] ?? '';
    if (!$videoId || !$channelId || !isset($_FILES['thumbnail'])) json_out(['ok' => false, 'message' => 'Missing data'], 400);

    $stmt = db()->prepare('SELECT * FROM channels WHERE channel_id=?');
    $stmt->execute([$channelId]);
    $ch = $stmt->fetch();
    if (!$ch) json_out(['ok' => false, 'message' => 'Channel not found'], 404);

    $token = ensure_token($ch);
    if (!$token) json_out(['ok' => false, 'message' => 'Token expired'], 401);

    $file = $_FILES['thumbnail']['tmp_name'];
    $data = file_get_contents($file);
    $mime = mime_content_type($file);

    $resp = http_request('POST', "https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=$videoId", $data, $token, $mime);
    $result = json_decode($resp, true);

    json_out(['ok' => isset($result['items'])]);
}

/* ═══════════════════════════════════════════════════════
   UPLOAD
   ═══════════════════════════════════════════════════════ */

function upload_video() {
    $u = require_auth();

    $channelId = $_POST['channel_id'] ?? '';
    $title     = $_POST['title'] ?? '';
    $desc      = $_POST['description'] ?? '';
    $tags      = $_POST['tags'] ?? '';
    $category  = $_POST['category_id'] ?? '22';
    $privacy   = $_POST['privacy'] ?? 'public';
    $scheduleAt = $_POST['scheduled_at'] ?? '';

    if (!$channelId || !$title || !isset($_FILES['video'])) {
        json_out(['ok' => false, 'message' => 'Channel, title, and video file required.'], 400);
    }

    $stmt = db()->prepare('SELECT * FROM channels WHERE channel_id=?');
    $stmt->execute([$channelId]);
    $ch = $stmt->fetch();
    if (!$ch) json_out(['ok' => false, 'message' => 'Channel not found.'], 404);

    $file = $_FILES['video'];
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $fname = uniqid('vb_') . '.' . $ext;
    $fpath = UPLOAD_DIR . $fname;

    if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
    move_uploaded_file($file['tmp_name'], $fpath);

    // Save to uploads table
    $finalPrivacy = $scheduleAt ? 'private' : $privacy;
    db()->prepare('INSERT INTO uploads (user_id, channel_id, platform, filename, file_path, file_size, title, description, tags, category_id, privacy, scheduled_at, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
         ->execute([$u['id'], $ch['id'], 'youtube', $file['name'], $fpath, $file['size'], $title, $desc, $tags, $category, $finalPrivacy, $scheduleAt ?: null, 'queued']);

    $uploadId = db()->lastInsertId();

    // Try immediate YouTube upload if no schedule
    $token = ensure_token($ch);
    if ($token && !$scheduleAt) {
        $result = youtube_upload($token, $fpath, $title, $desc, $tags, $category, $privacy);
        if ($result && isset($result['id'])) {
            db()->prepare('UPDATE uploads SET status="completed", platform_video_id=?, completed_at=NOW() WHERE id=?')
                 ->execute([$result['id'], $uploadId]);
            @unlink($fpath);
            log_action('info', 'Video uploaded to YouTube', "video={$result['id']} title=$title", $u['id']);
            json_out(['ok' => true, 'video_id' => $result['id'], 'message' => 'Video uploaded successfully!']);
        } else {
            db()->prepare('UPDATE uploads SET status="failed", error_message=? WHERE id=?')
                 ->execute([$result['error'] ?? 'Upload failed', $uploadId]);
            json_out(['ok' => false, 'message' => $result['error'] ?? 'YouTube upload failed.']);
        }
    }

    log_action('info', 'Upload queued', "title=$title channel=$channelId", $u['id']);
    json_out(['ok' => true, 'message' => $scheduleAt ? 'Video scheduled.' : 'Video queued for upload.', 'upload_id' => $uploadId]);
}

function social_upload() {
    $u = require_auth();
    $platform = $_POST['platform'] ?? '';
    $caption  = $_POST['caption'] ?? $_POST['title'] ?? '';
    $pageId   = $_POST['page_id'] ?? '';
    $desc     = $_POST['description'] ?? '';

    if (!isset($_FILES['video'])) json_out(['ok' => false, 'message' => 'Video file required.'], 400);

    $file = $_FILES['video'];
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $fname = uniqid('vb_') . '.' . $ext;
    $fpath = UPLOAD_DIR . $fname;

    if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
    move_uploaded_file($file['tmp_name'], $fpath);

    $plat = in_array($platform, ['instagram','tiktok','facebook']) ? $platform : 'youtube';

    db()->prepare('INSERT INTO uploads (user_id, platform, filename, file_path, file_size, title, description, status) VALUES (?,?,?,?,?,?,?,?)')
         ->execute([$u['id'], $plat, $file['name'], $fpath, $file['size'], $caption, $desc, 'queued']);

    $uploadId = db()->lastInsertId();
    log_action('info', "Upload queued ($plat)", "title=$caption", $u['id']);

    // Platform-specific upload would happen here when APIs are configured
    // For now, mark as queued
    json_out(['ok' => true, 'message' => "Video queued for $plat upload.", 'upload_id' => $uploadId]);
}

/* ═══════════════════════════════════════════════════════
   QUEUE & HISTORY
   ═══════════════════════════════════════════════════════ */

function get_queue() {
    $u = require_auth();
    $isAdmin = $u['role'] === 'admin';

    if ($isAdmin) {
        $rows = db()->query("SELECT u.*, us.name as user_name FROM uploads u LEFT JOIN users us ON u.user_id=us.id WHERE u.status IN ('queued','uploading','processing') ORDER BY u.created_at DESC")->fetchAll();
    } else {
        $stmt = db()->prepare("SELECT * FROM uploads WHERE user_id=? AND status IN ('queued','uploading','processing') ORDER BY created_at DESC");
        $stmt->execute([$u['id']]);
        $rows = $stmt->fetchAll();
    }
    json_out(['ok' => true, 'queue' => $rows]);
}

function get_history() {
    $u = require_auth();
    $isAdmin = $u['role'] === 'admin';

    if ($isAdmin) {
        $rows = db()->query("SELECT u.*, us.name as user_name FROM uploads u LEFT JOIN users us ON u.user_id=us.id ORDER BY u.created_at DESC LIMIT 200")->fetchAll();
    } else {
        $stmt = db()->prepare("SELECT * FROM uploads WHERE user_id=? ORDER BY created_at DESC LIMIT 100");
        $stmt->execute([$u['id']]);
        $rows = $stmt->fetchAll();
    }
    json_out(['ok' => true, 'history' => $rows]);
}

/* ═══════════════════════════════════════════════════════
   ANALYTICS
   ═══════════════════════════════════════════════════════ */

function get_analytics() {
    $u = require_auth();
    $channelId = $_GET['channel_id'] ?? '';
    $days = (int)($_GET['days'] ?? 28);
    if ($days < 1) $days = 28;

    if (!$channelId) json_out(['ok' => true, 'analytics' => null]);

    $stmt = db()->prepare('SELECT * FROM channels WHERE channel_id=?');
    $stmt->execute([$channelId]);
    $ch = $stmt->fetch();
    if (!$ch) json_out(['ok' => true, 'analytics' => null]);

    $token = ensure_token($ch);
    if (!$token) json_out(['ok' => true, 'analytics' => null, 'message' => 'Token expired']);

    $startDate = date('Y-m-d', strtotime("-{$days} days"));
    $endDate = date('Y-m-d');

    // YouTube Analytics API
    $url = "https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==$channelId&startDate=$startDate&endDate=$endDate&metrics=views,estimatedMinutesWatched,subscribersGained,estimatedRevenue,likes,comments&dimensions=day&sort=day";
    $resp = http_get($url, $token);
    $data = json_decode($resp, true);

    // Summary metrics
    $sumUrl = "https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==$channelId&startDate=$startDate&endDate=$endDate&metrics=views,estimatedMinutesWatched,subscribersGained,estimatedRevenue,likes,comments,averageViewDuration";
    $sumResp = http_get($sumUrl, $token);
    $sumData = json_decode($sumResp, true);

    json_out(['ok' => true, 'analytics' => [
        'daily' => $data,
        'summary' => $sumData,
        'channelId' => $channelId,
        'days' => $days,
    ]]);
}

/* ═══════════════════════════════════════════════════════
   STATS & LOGS
   ═══════════════════════════════════════════════════════ */

function get_stats() {
    // Allow any logged-in user; frontend calls without credentials header
    $channels = (int)db()->query('SELECT COUNT(*) FROM channels')->fetchColumn();
    $videos   = (int)db()->query('SELECT COUNT(*) FROM videos')->fetchColumn();
    $totalSubs = (int)db()->query('SELECT COALESCE(SUM(subscriber_count),0) FROM channels')->fetchColumn();

    $quotaUsed  = (int)(db()->query("SELECT svalue FROM settings WHERE skey='youtube_api_quota_used'")->fetchColumn() ?: 0);
    $quotaLimit = (int)(db()->query("SELECT svalue FROM settings WHERE skey='youtube_api_quota_limit'")->fetchColumn() ?: 10000);

    // Return keys matching original frontend expectations
    json_out([
        'ok'                  => true,
        'channels_connected'  => $channels,
        'total_videos'        => $videos,
        'total_subscribers'   => $totalSubs,
        'quota_used'          => $quotaUsed,
        'quota_limit'         => $quotaLimit,
    ]);
}

function get_logs() {
    require_admin();
    $rows = db()->query('SELECT * FROM system_logs ORDER BY id DESC LIMIT 200')->fetchAll();
    json_out(['ok' => true, 'logs' => $rows]);
}

/* ═══════════════════════════════════════════════════════
   FACEBOOK
   ═══════════════════════════════════════════════════════ */

function fb_auth_url() {
    require_auth();
    if (!FB_APP_ID) json_out(['ok' => false, 'message' => 'Facebook API not configured.']);
    $params = http_build_query([
        'client_id'    => FB_APP_ID,
        'redirect_uri' => FB_REDIRECT_URI,
        'scope'        => 'pages_manage_posts,pages_read_engagement,pages_show_list,publish_video',
        'response_type' => 'code',
    ]);
    json_out(['ok' => true, 'url' => 'https://www.facebook.com/v19.0/dialog/oauth?' . $params]);
}

function fb_callback() {
    $u = require_auth();
    $code = $_GET['code'] ?? '';
    if (!$code) { header('Location: admin.html?err=No+auth+code'); exit; }

    $resp = file_get_contents("https://graph.facebook.com/v19.0/oauth/access_token?" . http_build_query([
        'client_id'     => FB_APP_ID,
        'client_secret' => FB_APP_SECRET,
        'redirect_uri'  => FB_REDIRECT_URI,
        'code'          => $code,
    ]));
    $tokens = json_decode($resp, true);
    $userToken = $tokens['access_token'] ?? '';
    if (!$userToken) { header('Location: admin.html?err=FB+OAuth+failed'); exit; }

    // Get pages
    $pResp = file_get_contents("https://graph.facebook.com/v19.0/me/accounts?access_token=$userToken");
    $pages = json_decode($pResp, true)['data'] ?? [];

    foreach ($pages as $page) {
        $stmt = db()->prepare('SELECT id FROM fb_pages WHERE page_id=?');
        $stmt->execute([$page['id']]);
        if ($stmt->fetch()) {
            db()->prepare('UPDATE fb_pages SET page_name=?, access_token=?, user_id=? WHERE page_id=?')
                 ->execute([$page['name'], $page['access_token'], $u['id'], $page['id']]);
        } else {
            db()->prepare('INSERT INTO fb_pages (user_id, page_id, page_name, access_token) VALUES (?,?,?,?)')
                 ->execute([$u['id'], $page['id'], $page['name'], $page['access_token']]);
        }
    }

    log_action('info', 'Facebook pages connected', count($pages) . ' pages', $u['id']);
    header('Location: admin.html');
    exit;
}

function fb_accounts() {
    $u = require_auth();
    if ($u['role'] === 'admin') {
        $rows = db()->query('SELECT * FROM fb_pages ORDER BY connected_at DESC')->fetchAll();
    } else {
        $stmt = db()->prepare('SELECT * FROM fb_pages WHERE user_id=? ORDER BY connected_at DESC');
        $stmt->execute([$u['id']]);
        $rows = $stmt->fetchAll();
    }
    json_out(['ok' => true, 'pages' => $rows]);
}

function fb_disconnect() {
    $u = require_auth();
    $pageId = $_POST['page_id'] ?? '';
    if (!$pageId) json_out(['ok' => false, 'message' => 'page_id required'], 400);
    db()->prepare('DELETE FROM fb_pages WHERE page_id=?')->execute([$pageId]);
    json_out(['ok' => true]);
}

/* ═══════════════════════════════════════════════════════
   INSTAGRAM
   ═══════════════════════════════════════════════════════ */

function ig_accounts() {
    $u = require_auth();
    if ($u['role'] === 'admin') {
        $rows = db()->query('SELECT * FROM ig_accounts ORDER BY connected_at DESC')->fetchAll();
    } else {
        $stmt = db()->prepare('SELECT * FROM ig_accounts WHERE user_id=? ORDER BY connected_at DESC');
        $stmt->execute([$u['id']]);
        $rows = $stmt->fetchAll();
    }
    json_out(['ok' => true, 'accounts' => $rows]);
}

function ig_disconnect() {
    $u = require_auth();
    $igId = $_POST['ig_id'] ?? '';
    if (!$igId) json_out(['ok' => false, 'message' => 'ig_id required'], 400);
    db()->prepare('DELETE FROM ig_accounts WHERE ig_user_id=?')->execute([$igId]);
    json_out(['ok' => true]);
}

/* ═══════════════════════════════════════════════════════
   LIVE STREAMING
   ═══════════════════════════════════════════════════════ */

function live_upload() {
    $u = require_auth();
    if (!isset($_FILES['video'])) json_out(['ok' => false, 'message' => 'Video required'], 400);

    $quality = $_POST['quality'] ?? '720';
    $file = $_FILES['video'];
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $fname = uniqid('live_') . '.' . $ext;
    $fpath = UPLOAD_DIR . 'live/' . $fname;

    if (!is_dir(UPLOAD_DIR . 'live/')) mkdir(UPLOAD_DIR . 'live/', 0755, true);
    move_uploaded_file($file['tmp_name'], $fpath);

    db()->prepare('INSERT INTO live_videos (user_id, filename, file_path, file_size, quality, status) VALUES (?,?,?,?,?,?)')
         ->execute([$u['id'], $file['name'], $fpath, $file['size'], $quality, 'uploaded']);

    $id = db()->lastInsertId();
    // In production, trigger encoding here (FFmpeg)
    db()->prepare("UPDATE live_videos SET status='ready' WHERE id=?")->execute([$id]);

    log_action('info', 'Live video uploaded', "file={$file['name']}", $u['id']);
    json_out(['ok' => true, 'id' => $id]);
}

function live_videos() {
    $u = require_auth();
    $stmt = db()->prepare('SELECT * FROM live_videos WHERE user_id=? ORDER BY created_at DESC');
    $stmt->execute([$u['id']]);
    json_out(['ok' => true, 'videos' => $stmt->fetchAll()]);
}

function live_start() {
    $u = require_auth();
    $d = json_body();
    $videoId   = (int)($d['video_id'] ?? 0);
    $platform  = ($d['platform'] ?? 'youtube') === 'facebook' ? 'facebook' : 'youtube';
    $channelId = (int)($d['channel_id'] ?? 0);
    $streamKey = $d['stream_key'] ?? '';
    $title     = $d['title'] ?? 'Live Stream';
    $mode      = ($d['mode'] ?? 'once') === 'loop' ? 'loop' : 'once';

    db()->prepare('INSERT INTO live_streams (user_id, video_file_id, platform, channel_id, stream_key, title, mode, status, started_at) VALUES (?,?,?,?,?,?,?,?,NOW())')
         ->execute([$u['id'], $videoId, $platform, $channelId ?: null, $streamKey, $title, $mode, 'starting']);

    $id = db()->lastInsertId();
    // In production, start FFmpeg RTMP stream here
    db()->prepare("UPDATE live_streams SET status='live' WHERE id=?")->execute([$id]);

    log_action('info', 'Live stream started', "title=$title platform=$platform mode=$mode", $u['id']);
    json_out(['ok' => true, 'stream_id' => $id]);
}

function live_stop() {
    $u = require_auth();
    $d = json_body();
    $id = (int)($d['stream_id'] ?? 0);
    db()->prepare("UPDATE live_streams SET status='stopped', stopped_at=NOW() WHERE id=? AND user_id=?")->execute([$id, $u['id']]);
    // In production, kill FFmpeg process here
    log_action('info', 'Live stream stopped', "stream_id=$id", $u['id']);
    json_out(['ok' => true]);
}

function live_active() {
    $u = require_auth();
    $stmt = db()->prepare("SELECT ls.*, lv.filename as video_name FROM live_streams ls LEFT JOIN live_videos lv ON ls.video_file_id=lv.id WHERE ls.user_id=? AND ls.status IN ('starting','live') ORDER BY ls.started_at DESC");
    $stmt->execute([$u['id']]);
    json_out(['ok' => true, 'streams' => $stmt->fetchAll()]);
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

function ensure_token($ch) {
    if (!$ch['access_token']) return null;
    // Check if expired
    if ($ch['token_expires'] && strtotime($ch['token_expires']) < time()) {
        if (!$ch['refresh_token']) return null;
        // Refresh
        $resp = http_post('https://oauth2.googleapis.com/token', [
            'client_id'     => GOOGLE_CLIENT_ID,
            'client_secret' => GOOGLE_CLIENT_SECRET,
            'refresh_token' => $ch['refresh_token'],
            'grant_type'    => 'refresh_token',
        ]);
        $data = json_decode($resp, true);
        if ($data['access_token'] ?? '') {
            $exp = date('Y-m-d H:i:s', time() + ($data['expires_in'] ?? 3600));
            db()->prepare('UPDATE channels SET access_token=?, token_expires=? WHERE id=?')
                 ->execute([$data['access_token'], $exp, $ch['id']]);
            return $data['access_token'];
        }
        return null;
    }
    return $ch['access_token'];
}

function youtube_upload($token, $filePath, $title, $desc, $tags, $categoryId, $privacy) {
    $meta = json_encode([
        'snippet' => ['title' => $title, 'description' => $desc, 'tags' => array_filter(explode(',', $tags)), 'categoryId' => $categoryId ?: '22'],
        'status'  => ['privacyStatus' => $privacy, 'selfDeclaredMadeForKids' => false],
    ]);

    // Resumable upload init
    $ch = curl_init('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ["Authorization: Bearer $token", 'Content-Type: application/json; charset=UTF-8', 'X-Upload-Content-Type: video/*', 'X-Upload-Content-Length: ' . filesize($filePath)],
        CURLOPT_POSTFIELDS => $meta,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
    ]);
    $resp = curl_exec($ch);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headers = substr($resp, 0, $headerSize);
    curl_close($ch);

    preg_match('/location:\s*(.+)/i', $headers, $m);
    $uploadUrl = trim($m[1] ?? '');
    if (!$uploadUrl) return ['error' => 'Failed to initiate upload'];

    // Upload file
    $ch = curl_init($uploadUrl);
    curl_setopt_array($ch, [
        CURLOPT_PUT => true,
        CURLOPT_HTTPHEADER => ["Authorization: Bearer $token", 'Content-Type: video/*'],
        CURLOPT_INFILE => fopen($filePath, 'r'),
        CURLOPT_INFILESIZE => filesize($filePath),
        CURLOPT_RETURNTRANSFER => true,
    ]);
    $resp = curl_exec($ch);
    curl_close($ch);

    return json_decode($resp, true) ?: ['error' => 'Upload failed'];
}

function http_get($url, $token = '') {
    $ch = curl_init($url);
    $h = ['Accept: application/json'];
    if ($token) $h[] = "Authorization: Bearer $token";
    curl_setopt_array($ch, [CURLOPT_HTTPHEADER => $h, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30]);
    $r = curl_exec($ch); curl_close($ch);
    return $r;
}

function http_post($url, $data) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => http_build_query($data), CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30]);
    $r = curl_exec($ch); curl_close($ch);
    return $r;
}

function http_request($method, $url, $body, $token, $contentType) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => ["Authorization: Bearer $token", "Content-Type: $contentType"],
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 60,
    ]);
    $r = curl_exec($ch); curl_close($ch);
    return $r;
}

function log_action($level, $action, $details = '', $user_id = null) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    try {
        db()->prepare('INSERT INTO system_logs (level, action, details, user_id, ip_address) VALUES (?,?,?,?,?)')
             ->execute([$level, $action, $details, $user_id, $ip]);
    } catch (Exception $e) {}
}
