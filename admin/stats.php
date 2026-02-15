<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isAdmin()) {
    redirect('login.php');
}

$conn = getDBConnection();
$message = getMessage();

// Handle delete
if (isset($_GET['delete'])) {
    $id = (int)$_GET['delete'];
    $conn->query("DELETE FROM stats WHERE id = $id");
    setMessage('success', 'Stat deleted successfully');
    redirect('stats.php');
}

// Handle add/edit
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    $number = sanitize($_POST['number']);
    $label = sanitize($_POST['label']);
    $sort_order = (int)$_POST['sort_order'];
    $is_active = isset($_POST['is_active']) ? 1 : 0;
    
    if ($id > 0) {
        $stmt = $conn->prepare("UPDATE stats SET number=?, label=?, sort_order=?, is_active=? WHERE id=?");
        $stmt->bind_param("ssiii", $number, $label, $sort_order, $is_active, $id);
        $stmt->execute();
        setMessage('success', 'Stat updated successfully');
    } else {
        $stmt = $conn->prepare("INSERT INTO stats (number, label, sort_order, is_active) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssii", $number, $label, $sort_order, $is_active);
        $stmt->execute();
        setMessage('success', 'Stat added successfully');
    }
    redirect('stats.php');
}

// Get stat for editing
$editStat = null;
if (isset($_GET['edit'])) {
    $id = (int)$_GET['edit'];
    $result = $conn->query("SELECT * FROM stats WHERE id = $id");
    $editStat = $result->fetch_assoc();
}

// Get all stats
$stats = $conn->query("SELECT * FROM stats ORDER BY sort_order ASC, id ASC");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stats Management - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>

        <main class="admin-content">
            <div class="admin-header">
                <h1><i class="fas fa-chart-bar"></i> Stats Management</h1>
            </div>

            <?php if ($message): ?>
            <div class="alert alert-<?php echo $message['type']; ?>">
                <?php echo $message['text']; ?>
            </div>
            <?php endif; ?>

            <!-- Add/Edit Form -->
            <div class="admin-card">
                <h3><?php echo $editStat ? 'Edit Stat' : 'Add New Stat'; ?></h3>
                <form method="POST">
                    <?php if ($editStat): ?>
                    <input type="hidden" name="id" value="<?php echo $editStat['id']; ?>">
                    <?php endif; ?>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="form-group">
                            <label>Number/Value (e.g., "12+", "10,000+")</label>
                            <input type="text" name="number" value="<?php echo $editStat ? htmlspecialchars($editStat['number']) : ''; ?>" required>
                        </div>
                        <div class="form-group">
                            <label>Label (e.g., "Years Experience")</label>
                            <input type="text" name="label" value="<?php echo $editStat ? htmlspecialchars($editStat['label']) : ''; ?>" required>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="form-group">
                            <label>Sort Order</label>
                            <input type="number" name="sort_order" value="<?php echo $editStat ? $editStat['sort_order'] : 0; ?>">
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <div style="margin-top: 10px;">
                                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                    <input type="checkbox" name="is_active" <?php echo (!$editStat || $editStat['is_active']) ? 'checked' : ''; ?>>
                                    <span>Active</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> <?php echo $editStat ? 'Update Stat' : 'Add Stat'; ?>
                        </button>
                        <?php if ($editStat): ?>
                        <a href="stats.php" class="btn btn-secondary">Cancel</a>
                        <?php endif; ?>
                    </div>
                </form>
            </div>

            <!-- Stats List -->
            <div class="admin-card">
                <h3>All Stats</h3>
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Number</th>
                                <th>Label</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php while ($stat = $stats->fetch_assoc()): ?>
                            <tr>
                                <td><?php echo $stat['sort_order']; ?></td>
                                <td><strong style="color: #c9a227; font-size: 18px;"><?php echo htmlspecialchars($stat['number']); ?></strong></td>
                                <td><?php echo htmlspecialchars($stat['label']); ?></td>
                                <td>
                                    <span class="badge <?php echo $stat['is_active'] ? 'badge-success' : 'badge-danger'; ?>">
                                        <?php echo $stat['is_active'] ? 'Active' : 'Inactive'; ?>
                                    </span>
                                </td>
                                <td>
                                    <a href="?edit=<?php echo $stat['id']; ?>" class="btn btn-sm btn-primary"><i class="fas fa-edit"></i></a>
                                    <a href="?delete=<?php echo $stat['id']; ?>" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure?')"><i class="fas fa-trash"></i></a>
                                </td>
                            </tr>
                            <?php endwhile; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>
</body>
</html>
<?php $conn->close(); ?>
