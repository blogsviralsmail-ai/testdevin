<?php
// Jai Collection - Migration runner. Browse to /migrate.php once after pulling
// new code. Idempotent: safe to run repeatedly. Delete after running if desired.
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/migrate.php';

header('Content-Type: text/plain; charset=UTF-8');
try {
    $log = jcMigrate();
    echo "Migration complete.\n";
    if ($log) {
        echo "Changes:\n - " . implode("\n - ", $log) . "\n";
    } else {
        echo "No new changes (database already up to date).\n";
    }
} catch (Exception $e) {
    http_response_code(500);
    echo "Migration failed: " . $e->getMessage() . "\n";
}
