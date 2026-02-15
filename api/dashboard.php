<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../includes/config.php';
require_once 'auth.php';

$user = authenticateRequest();

// Get dashboard stats
$stats = [];

// Total customers (masons)
$stmt = $pdo->query("SELECT COUNT(*) as count FROM masons WHERE status = 'active'");
$stats['total_customers'] = $stmt->fetch()['count'];

// Total visits
$stmt = $pdo->query("SELECT COUNT(*) as count FROM mason_visits");
$stats['total_visits'] = $stmt->fetch()['count'];

// Total rewards
$stmt = $pdo->query("SELECT COALESCE(SUM(rewards), 0) as total FROM mason_visits");
$stats['total_rewards'] = $stmt->fetch()['total'];

// Pending visits
$stmt = $pdo->query("SELECT COUNT(*) as count FROM pending_visits WHERE status = 'pending'");
$stats['pending_visits'] = $stmt->fetch()['count'];

// Recent visits
$stmt = $pdo->query("SELECT v.*, m.name as customer_name, m.mobile as customer_mobile 
                     FROM mason_visits v 
                     JOIN masons m ON v.mason_id = m.id 
                     ORDER BY v.visit_date DESC, v.created_at DESC 
                     LIMIT 10");
$stats['recent_visits'] = $stmt->fetchAll();

// Top performers
$stmt = $pdo->query("SELECT m.id, m.name, m.mobile, COALESCE(SUM(v.rewards), 0) as total_rewards 
                     FROM masons m 
                     LEFT JOIN mason_visits v ON m.id = v.mason_id
                     WHERE m.status = 'active'
                     GROUP BY m.id 
                     ORDER BY total_rewards DESC 
                     LIMIT 5");
$stats['top_performers'] = $stmt->fetchAll();

echo json_encode(['success' => true, 'data' => $stats]);
