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
    $conn->query("DELETE FROM features WHERE id = $id");
    setMessage('success', 'Feature deleted successfully');
    redirect('features.php');
}

// Handle add/edit
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    $icon = sanitize($_POST['icon']);
    $title = sanitize($_POST['title']);
    $description = sanitize($_POST['description']);
    $sort_order = (int)$_POST['sort_order'];
    $is_active = isset($_POST['is_active']) ? 1 : 0;
    
    if ($id > 0) {
        $stmt = $conn->prepare("UPDATE features SET icon=?, title=?, description=?, sort_order=?, is_active=? WHERE id=?");
        $stmt->bind_param("sssiii", $icon, $title, $description, $sort_order, $is_active, $id);
        $stmt->execute();
        setMessage('success', 'Feature updated successfully');
    } else {
        $stmt = $conn->prepare("INSERT INTO features (icon, title, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssii", $icon, $title, $description, $sort_order, $is_active);
        $stmt->execute();
        setMessage('success', 'Feature added successfully');
    }
    redirect('features.php');
}

// Get feature for editing
$editFeature = null;
if (isset($_GET['edit'])) {
    $id = (int)$_GET['edit'];
    $result = $conn->query("SELECT * FROM features WHERE id = $id");
    $editFeature = $result->fetch_assoc();
}

// Get all features
$features = $conn->query("SELECT * FROM features ORDER BY sort_order ASC, id ASC");

// Common Font Awesome icons
$commonIcons = ['fa-th-large', 'fa-truck', 'fa-tags', 'fa-headset', 'fa-star', 'fa-shield-alt', 'fa-check-circle', 'fa-award', 'fa-gem', 'fa-heart', 'fa-thumbs-up', 'fa-clock', 'fa-bolt', 'fa-cog', 'fa-tools'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Features Management - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
    <style>
        .icon-preview { font-size: 24px; color: #c9a227; margin-right: 10px; }
        .icon-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-top: 10px; }
        .icon-option { padding: 10px; text-align: center; background: #2d2d2d; border-radius: 5px; cursor: pointer; }
        .icon-option:hover, .icon-option.selected { background: #c9a227; }
        .icon-option i { font-size: 20px; }
    </style>
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>

        <main class="admin-content">
            <div class="admin-header">
                <h1><i class="fas fa-star"></i> Features/USP Management</h1>
            </div>

            <?php if ($message): ?>
            <div class="alert alert-<?php echo $message['type']; ?>">
                <?php echo $message['text']; ?>
            </div>
            <?php endif; ?>

            <!-- Add/Edit Form -->
            <div class="admin-card">
                <h3><?php echo $editFeature ? 'Edit Feature' : 'Add New Feature'; ?></h3>
                <form method="POST">
                    <?php if ($editFeature): ?>
                    <input type="hidden" name="id" value="<?php echo $editFeature['id']; ?>">
                    <?php endif; ?>
                    
                    <div class="form-group">
                        <label>Icon (Font Awesome class)</label>
                        <div style="display: flex; align-items: center;">
                            <span class="icon-preview"><i class="fas <?php echo $editFeature ? htmlspecialchars($editFeature['icon']) : 'fa-star'; ?>" id="iconPreview"></i></span>
                            <input type="text" name="icon" id="iconInput" value="<?php echo $editFeature ? htmlspecialchars($editFeature['icon']) : ''; ?>" placeholder="fa-star" required>
                        </div>
                        <div class="icon-grid">
                            <?php foreach ($commonIcons as $icon): ?>
                            <div class="icon-option" onclick="selectIcon('<?php echo $icon; ?>')">
                                <i class="fas <?php echo $icon; ?>"></i>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" name="title" value="<?php echo $editFeature ? htmlspecialchars($editFeature['title']) : ''; ?>" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" rows="3"><?php echo $editFeature ? htmlspecialchars($editFeature['description']) : ''; ?></textarea>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="form-group">
                            <label>Sort Order</label>
                            <input type="number" name="sort_order" value="<?php echo $editFeature ? $editFeature['sort_order'] : 0; ?>">
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <div style="margin-top: 10px;">
                                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                    <input type="checkbox" name="is_active" <?php echo (!$editFeature || $editFeature['is_active']) ? 'checked' : ''; ?>>
                                    <span>Active</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> <?php echo $editFeature ? 'Update Feature' : 'Add Feature'; ?>
                        </button>
                        <?php if ($editFeature): ?>
                        <a href="features.php" class="btn btn-secondary">Cancel</a>
                        <?php endif; ?>
                    </div>
                </form>
            </div>

            <!-- Features List -->
            <div class="admin-card">
                <h3>All Features</h3>
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Icon</th>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php while ($feature = $features->fetch_assoc()): ?>
                            <tr>
                                <td><?php echo $feature['sort_order']; ?></td>
                                <td><i class="fas <?php echo htmlspecialchars($feature['icon']); ?>" style="font-size: 20px; color: #c9a227;"></i></td>
                                <td><?php echo htmlspecialchars($feature['title']); ?></td>
                                <td>
                                    <span class="badge <?php echo $feature['is_active'] ? 'badge-success' : 'badge-danger'; ?>">
                                        <?php echo $feature['is_active'] ? 'Active' : 'Inactive'; ?>
                                    </span>
                                </td>
                                <td>
                                    <a href="?edit=<?php echo $feature['id']; ?>" class="btn btn-sm btn-primary"><i class="fas fa-edit"></i></a>
                                    <a href="?delete=<?php echo $feature['id']; ?>" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure?')"><i class="fas fa-trash"></i></a>
                                </td>
                            </tr>
                            <?php endwhile; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

    <script>
    function selectIcon(icon) {
        document.getElementById('iconInput').value = icon;
        document.getElementById('iconPreview').className = 'fas ' + icon;
        document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
        event.target.closest('.icon-option').classList.add('selected');
    }
    
    document.getElementById('iconInput').addEventListener('input', function() {
        document.getElementById('iconPreview').className = 'fas ' + this.value;
    });
    </script>
</body>
</html>
<?php $conn->close(); ?>
