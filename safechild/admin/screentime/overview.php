<?php
$pageTitle = 'Screen Time';
require_once __DIR__ . '/../includes/header.php';

$db = getDB();
$parentId = (int) $parent['id'];

$familyResult = $db->query("SELECT id FROM families WHERE parent_id = $parentId LIMIT 1");
$familyId = ($familyResult && $row = $familyResult->fetch_assoc()) ? (int) $row['id'] : 0;

$selectedChildId = isset($_GET['child_id']) ? (int) $_GET['child_id'] : 0;

$children = [];
$result = $db->query("SELECT c.id, c.name FROM children c WHERE c.family_id = $familyId ORDER BY c.name");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $children[] = $row;
        if ($selectedChildId === 0) $selectedChildId = (int) $row['id'];
    }
}

$error = '';
$success = '';

// Handle rule save
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $cId = (int) ($_POST['child_id'] ?? $selectedChildId);
    
    if ($action === 'save_rules') {
        $days = ['mon','tue','wed','thu','fri','sat','sun'];
        foreach ($days as $day) {
            $limit = (int) ($_POST["limit_$day"] ?? 120);
            $bedStart = sanitize($_POST["bed_start_$day"] ?? '21:00');
            $bedEnd = sanitize($_POST["bed_end_$day"] ?? '07:00');
            
            $existing = $db->query("SELECT id FROM screen_time_rules WHERE child_id = $cId AND day_of_week = '$day'");
            if ($existing && $existing->num_rows > 0) {
                $ruleId = $existing->fetch_assoc()['id'];
                $db->query("UPDATE screen_time_rules SET daily_limit_minutes = $limit, bedtime_start = '$bedStart', bedtime_end = '$bedEnd' WHERE id = $ruleId");
            } else {
                $db->query("INSERT INTO screen_time_rules (child_id, day_of_week, daily_limit_minutes, bedtime_start, bedtime_end) VALUES ($cId, '$day', $limit, '$bedStart', '$bedEnd')");
            }
        }
        $success = 'Screen time rules saved!';
        logAudit($parentId, 'screen_time_rules_updated', 'children', $cId);
    }
}

// Get current rules
$rules = [];
if ($selectedChildId > 0) {
    $rResult = $db->query("SELECT * FROM screen_time_rules WHERE child_id = $selectedChildId ORDER BY FIELD(day_of_week, 'mon','tue','wed','thu','fri','sat','sun')");
    if ($rResult) {
        while ($row = $rResult->fetch_assoc()) {
            $rules[$row['day_of_week']] = $row;
        }
    }
}

// Get last 7 days usage
$usageData = [];
for ($i = 6; $i >= 0; $i--) {
    $date = date('Y-m-d', strtotime("-$i days"));
    $label = date('D, d M', strtotime($date));
    
    $uResult = $db->query("SELECT total_minutes, unlocks FROM screen_time_logs WHERE child_id = $selectedChildId AND date = '$date' LIMIT 1");
    $usage = ($uResult && $uResult->num_rows > 0) ? $uResult->fetch_assoc() : ['total_minutes' => 0, 'unlocks' => 0];
    
    $usageData[] = [
        'date' => $date,
        'label' => $label,
        'minutes' => (int) $usage['total_minutes'],
        'unlocks' => (int) $usage['unlocks']
    ];
}
$usageJson = json_encode($usageData);

$dayNames = ['mon' => 'Monday', 'tue' => 'Tuesday', 'wed' => 'Wednesday', 'thu' => 'Thursday', 'fri' => 'Friday', 'sat' => 'Saturday', 'sun' => 'Sunday'];
?>

<?php if ($error): ?><div class="error-message"><?= htmlspecialchars($error) ?></div><?php endif; ?>
<?php if ($success): ?><div class="success-message"><?= htmlspecialchars($success) ?></div><?php endif; ?>

<div style="margin-bottom:16px;">
    <select class="form-control" style="width:200px; display:inline-block;" onchange="window.location.href='/safechild/admin/screentime/overview.php?child_id='+this.value">
        <?php foreach ($children as $c): ?>
            <option value="<?= $c['id'] ?>" <?= $selectedChildId == $c['id'] ? 'selected' : '' ?>>
                <?= htmlspecialchars($c['name']) ?>
            </option>
        <?php endforeach; ?>
    </select>
</div>

<!-- Usage Chart -->
<div class="card">
    <div class="card-header">
        <h3><i class="fas fa-chart-bar"></i> Last 7 Days Usage</h3>
    </div>
    <canvas id="usageChart" height="80"></canvas>
</div>

<!-- Rules -->
<div class="card">
    <div class="card-header">
        <h3><i class="fas fa-cog"></i> Screen Time Rules</h3>
    </div>
    
    <form method="POST">
        <input type="hidden" name="action" value="save_rules">
        <input type="hidden" name="child_id" value="<?= $selectedChildId ?>">
        
        <div class="table-responsive">
            <table>
                <thead>
                    <tr><th>Day</th><th>Daily Limit (minutes)</th><th>Bedtime Start</th><th>Bedtime End</th></tr>
                </thead>
                <tbody>
                    <?php foreach ($dayNames as $key => $name): 
                        $rule = $rules[$key] ?? ['daily_limit_minutes' => 120, 'bedtime_start' => '21:00', 'bedtime_end' => '07:00'];
                    ?>
                    <tr>
                        <td><strong><?= $name ?></strong></td>
                        <td><input type="number" name="limit_<?= $key ?>" class="form-control" value="<?= $rule['daily_limit_minutes'] ?>" min="0" max="1440" style="width:120px;"></td>
                        <td><input type="time" name="bed_start_<?= $key ?>" class="form-control" value="<?= substr($rule['bedtime_start'], 0, 5) ?>" style="width:140px;"></td>
                        <td><input type="time" name="bed_end_<?= $key ?>" class="form-control" value="<?= substr($rule['bedtime_end'], 0, 5) ?>" style="width:140px;"></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        
        <div style="margin-top:16px;">
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Save Rules
            </button>
        </div>
    </form>
</div>

<?php
$extraScripts = <<<SCRIPT
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script>
var usageData = $usageJson;
var ctx = document.getElementById('usageChart').getContext('2d');
new Chart(ctx, {
    type: 'bar',
    data: {
        labels: usageData.map(function(d) { return d.label; }),
        datasets: [{
            label: 'Screen Time (min)',
            data: usageData.map(function(d) { return d.minutes; }),
            backgroundColor: '#818CF8',
            borderRadius: 6
        }]
    },
    options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Minutes' } }
        }
    }
});
</script>
SCRIPT;
require_once __DIR__ . '/../includes/footer.php';
?>
