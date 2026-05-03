<?php
$pageTitle = 'App Usage';
require_once __DIR__ . '/../includes/header.php';

$db = getDB();
$parentId = (int) $parent['id'];

$familyResult = $db->query("SELECT id FROM families WHERE parent_id = $parentId LIMIT 1");
$familyId = ($familyResult && $row = $familyResult->fetch_assoc()) ? (int) $row['id'] : 0;

$selectedChildId = isset($_GET['child_id']) ? (int) $_GET['child_id'] : 0;
$selectedDate = sanitize($_GET['date'] ?? date('Y-m-d'));

$children = [];
$result = $db->query("SELECT c.id, c.name FROM children c WHERE c.family_id = $familyId ORDER BY c.name");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $children[] = $row;
        if ($selectedChildId === 0) $selectedChildId = (int) $row['id'];
    }
}

// Get app usage for date
$usageStats = [];
if ($selectedChildId > 0) {
    $uResult = $db->query("
        SELECT app_name, package_name, usage_minutes, open_count
        FROM app_usage_stats
        WHERE child_id = $selectedChildId AND date = '$selectedDate'
        ORDER BY usage_minutes DESC
    ");
    if ($uResult) {
        while ($row = $uResult->fetch_assoc()) {
            $usageStats[] = $row;
        }
    }
}

$totalMinutes = array_sum(array_column($usageStats, 'usage_minutes'));
$topAppsJson = json_encode(array_slice($usageStats, 0, 8));
?>

<div style="display:flex; gap:12px; margin-bottom:16px; align-items:center;">
    <select class="form-control" style="width:180px;" id="childSelect">
        <?php foreach ($children as $c): ?>
            <option value="<?= $c['id'] ?>" <?= $selectedChildId == $c['id'] ? 'selected' : '' ?>>
                <?= htmlspecialchars($c['name']) ?>
            </option>
        <?php endforeach; ?>
    </select>
    <input type="date" class="form-control" style="width:180px;" id="dateSelect" value="<?= $selectedDate ?>">
    <button class="btn btn-primary btn-sm" onclick="window.location.href='/safechild/admin/apps/usage.php?child_id='+document.getElementById('childSelect').value+'&date='+document.getElementById('dateSelect').value">
        <i class="fas fa-search"></i> View
    </button>
</div>

<div class="grid-2">
    <div class="card">
        <div class="card-header"><h3><i class="fas fa-chart-pie"></i> Usage Breakdown</h3></div>
        <?php if (empty($usageStats)): ?>
            <p style="color:var(--gray); text-align:center; padding:40px;">No data for this date</p>
        <?php else: ?>
            <canvas id="pieChart" height="200"></canvas>
            <p style="text-align:center; margin-top:12px; font-weight:600;">
                Total: <?= floor($totalMinutes / 60) ?>h <?= $totalMinutes % 60 ?>m
            </p>
        <?php endif; ?>
    </div>
    
    <div class="card">
        <div class="card-header"><h3><i class="fas fa-list-ol"></i> All Apps (<?= $selectedDate ?>)</h3></div>
        <?php if (empty($usageStats)): ?>
            <p style="color:var(--gray); text-align:center; padding:40px;">No data</p>
        <?php else: ?>
        <div class="table-responsive" style="max-height:400px; overflow-y:auto;">
            <table>
                <thead><tr><th>#</th><th>App</th><th>Time</th><th>Opens</th></tr></thead>
                <tbody>
                    <?php foreach ($usageStats as $i => $app): ?>
                    <tr>
                        <td><?= $i + 1 ?></td>
                        <td><strong><?= htmlspecialchars($app['app_name']) ?></strong></td>
                        <td><?= $app['usage_minutes'] ?> min</td>
                        <td><?= $app['open_count'] ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php endif; ?>
    </div>
</div>

<?php
$extraScripts = <<<SCRIPT
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script>
var topApps = $topAppsJson;
if (topApps.length > 0) {
    var colors = ['#4F46E5','#10B981','#F59E0B','#EF4444','#3B82F6','#8B5CF6','#EC4899','#14B8A6'];
    var ctx = document.getElementById('pieChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: topApps.map(function(a) { return a.app_name; }),
            datasets: [{
                data: topApps.map(function(a) { return a.usage_minutes; }),
                backgroundColor: colors.slice(0, topApps.length),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { font: { size: 12 } } } }
        }
    });
}
</script>
SCRIPT;
require_once __DIR__ . '/../includes/footer.php';
?>
