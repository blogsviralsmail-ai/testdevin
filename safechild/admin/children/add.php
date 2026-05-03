<?php
$pageTitle = 'Add Child';
require_once __DIR__ . '/../includes/header.php';

$db = getDB();
$parentId = (int) $parent['id'];
$error = '';
$success = '';

// Get family
$familyResult = $db->query("SELECT id FROM families WHERE parent_id = $parentId LIMIT 1");
$family = $familyResult ? $familyResult->fetch_assoc() : null;

if (!$family) {
    // Create family if doesn't exist
    $db->query("INSERT INTO families (parent_id, family_name) VALUES ($parentId, 'My Family')");
    $familyId = $db->insert_id;
} else {
    $familyId = (int) $family['id'];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = sanitize($_POST['name'] ?? '');
    $age = !empty($_POST['age']) ? (int) $_POST['age'] : null;
    $dob = sanitize($_POST['date_of_birth'] ?? '');
    
    if (empty($name)) {
        $error = 'Child name is required';
    } else {
        $ageVal = $age !== null ? $age : 'NULL';
        $dobVal = !empty($dob) ? "'$dob'" : 'NULL';
        
        $db->query("
            INSERT INTO children (family_id, name, age, date_of_birth)
            VALUES ($familyId, '$name', $ageVal, $dobVal)
        ");
        
        if ($db->affected_rows > 0) {
            $childId = $db->insert_id;
            logAudit($parentId, 'child_added', 'children', $childId, "Added child: $name");
            
            header("Location: /safechild/admin/children/pair.php?child_id=$childId&new=1");
            exit;
        } else {
            $error = 'Failed to add child. Please try again.';
        }
    }
}
?>

<div class="card" style="max-width:600px;">
    <div class="card-header">
        <h3><i class="fas fa-child"></i> Add New Child</h3>
    </div>
    
    <?php if ($error): ?>
        <div class="error-message"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
    
    <form method="POST">
        <div class="form-group">
            <label for="name">Child's Name *</label>
            <input type="text" id="name" name="name" class="form-control" placeholder="Enter child's name" required value="<?= htmlspecialchars($_POST['name'] ?? '') ?>">
        </div>
        
        <div class="form-group">
            <label for="age">Age</label>
            <input type="number" id="age" name="age" class="form-control" placeholder="Age" min="1" max="18" value="<?= htmlspecialchars($_POST['age'] ?? '') ?>">
        </div>
        
        <div class="form-group">
            <label for="date_of_birth">Date of Birth</label>
            <input type="date" id="date_of_birth" name="date_of_birth" class="form-control" value="<?= htmlspecialchars($_POST['date_of_birth'] ?? '') ?>">
        </div>
        
        <div style="display:flex; gap:12px;">
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-plus"></i> Add Child & Pair Device
            </button>
            <a href="/safechild/admin/children/list.php" class="btn btn-outline">Cancel</a>
        </div>
    </form>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
