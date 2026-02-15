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
    $conn->query("DELETE FROM category_images WHERE id = $id");
    setMessage('success', 'Category image deleted successfully');
    redirect('category-images.php');
}

// Handle add/edit
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    $category_slug = sanitize($_POST['category_slug']);
    $category_name = sanitize($_POST['category_name']);
    $image_url = sanitize($_POST['image_url']);
    $sort_order = (int)$_POST['sort_order'];
    $is_active = isset($_POST['is_active']) ? 1 : 0;
    
    // Handle file upload
    if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../assets/images/categories/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        $fileName = time() . '_' . basename($_FILES['image_file']['name']);
        $targetPath = $uploadDir . $fileName;
        if (move_uploaded_file($_FILES['image_file']['tmp_name'], $targetPath)) {
            $image_url = 'assets/images/categories/' . $fileName;
        }
    }
    
    if ($id > 0) {
        $stmt = $conn->prepare("UPDATE category_images SET category_slug=?, category_name=?, image_url=?, sort_order=?, is_active=? WHERE id=?");
        $stmt->bind_param("sssiii", $category_slug, $category_name, $image_url, $sort_order, $is_active, $id);
        $stmt->execute();
        setMessage('success', 'Category image updated successfully');
    } else {
        $stmt = $conn->prepare("INSERT INTO category_images (category_slug, category_name, image_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssii", $category_slug, $category_name, $image_url, $sort_order, $is_active);
        $stmt->execute();
        setMessage('success', 'Category image added successfully');
    }
    redirect('category-images.php');
}

// Get category for editing
$editCategory = null;
if (isset($_GET['edit'])) {
    $id = (int)$_GET['edit'];
    $result = $conn->query("SELECT * FROM category_images WHERE id = $id");
    $editCategory = $result->fetch_assoc();
}

// Get all categories
$categories = $conn->query("SELECT * FROM category_images ORDER BY sort_order ASC, id ASC");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Category Images - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
    <style>
        .category-preview { width: 100px; height: 100px; object-fit: cover; border-radius: 10px; }
    </style>
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>

        <main class="admin-content">
            <div class="admin-header">
                <h1><i class="fas fa-images"></i> Homepage Category Images</h1>
            </div>

            <?php if ($message): ?>
            <div class="alert alert-<?php echo $message['type']; ?>">
                <?php echo $message['text']; ?>
            </div>
            <?php endif; ?>

            <!-- Add/Edit Form -->
            <div class="admin-card">
                <h3><?php echo $editCategory ? 'Edit Category' : 'Add New Category'; ?></h3>
                <form method="POST" enctype="multipart/form-data">
                    <?php if ($editCategory): ?>
                    <input type="hidden" name="id" value="<?php echo $editCategory['id']; ?>">
                    <?php endif; ?>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="form-group">
                            <label>Category Slug (e.g., "tiles", "bath")</label>
                            <input type="text" name="category_slug" value="<?php echo $editCategory ? htmlspecialchars($editCategory['category_slug']) : ''; ?>" required>
                        </div>
                        <div class="form-group">
                            <label>Category Name (Display Name)</label>
                            <input type="text" name="category_name" value="<?php echo $editCategory ? htmlspecialchars($editCategory['category_name']) : ''; ?>" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Image</label>
                        <?php if ($editCategory && $editCategory['image_url']): ?>
                        <div style="margin-bottom: 10px;">
                            <img src="../<?php echo htmlspecialchars($editCategory['image_url']); ?>" class="category-preview" alt="Current Image">
                        </div>
                        <?php endif; ?>
                        <input type="file" name="image_file" accept="image/*">
                        <small style="color: #666;">Or enter URL below</small>
                        <input type="text" name="image_url" value="<?php echo $editCategory ? htmlspecialchars($editCategory['image_url']) : ''; ?>" placeholder="assets/images/categories/tiles.jpg" style="margin-top: 10px;">
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="form-group">
                            <label>Sort Order</label>
                            <input type="number" name="sort_order" value="<?php echo $editCategory ? $editCategory['sort_order'] : 0; ?>">
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <div style="margin-top: 10px;">
                                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                    <input type="checkbox" name="is_active" <?php echo (!$editCategory || $editCategory['is_active']) ? 'checked' : ''; ?>>
                                    <span>Active</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> <?php echo $editCategory ? 'Update Category' : 'Add Category'; ?>
                        </button>
                        <?php if ($editCategory): ?>
                        <a href="category-images.php" class="btn btn-secondary">Cancel</a>
                        <?php endif; ?>
                    </div>
                </form>
            </div>

            <!-- Categories List -->
            <div class="admin-card">
                <h3>All Categories</h3>
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Slug</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php while ($cat = $categories->fetch_assoc()): ?>
                            <tr>
                                <td><?php echo $cat['sort_order']; ?></td>
                                <td>
                                    <?php if ($cat['image_url']): ?>
                                    <img src="../<?php echo htmlspecialchars($cat['image_url']); ?>" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;" alt="">
                                    <?php else: ?>
                                    <span style="color: #666;">No image</span>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo htmlspecialchars($cat['category_name']); ?></td>
                                <td><code><?php echo htmlspecialchars($cat['category_slug']); ?></code></td>
                                <td>
                                    <span class="badge <?php echo $cat['is_active'] ? 'badge-success' : 'badge-danger'; ?>">
                                        <?php echo $cat['is_active'] ? 'Active' : 'Inactive'; ?>
                                    </span>
                                </td>
                                <td>
                                    <a href="?edit=<?php echo $cat['id']; ?>" class="btn btn-sm btn-primary"><i class="fas fa-edit"></i></a>
                                    <a href="?delete=<?php echo $cat['id']; ?>" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure?')"><i class="fas fa-trash"></i></a>
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
