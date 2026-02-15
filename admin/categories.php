<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isAdmin()) {
    redirect('login.php');
}

$conn = getDBConnection();
$message = getMessage();

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'add') {
        $name = sanitize($_POST['name']);
        $slug = strtolower(str_replace(' ', '-', $name));
        $description = sanitize($_POST['description']);
        $image = sanitize($_POST['image']);
        $parent_id = !empty($_POST['parent_id']) ? (int)$_POST['parent_id'] : null;
        $sort_order = (int)$_POST['sort_order'];
        
        $stmt = $conn->prepare("INSERT INTO categories (name, slug, description, image, parent_id, sort_order) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssii", $name, $slug, $description, $image, $parent_id, $sort_order);
        
        if ($stmt->execute()) {
            setMessage('success', 'Category added successfully');
        } else {
            setMessage('danger', 'Error adding category');
        }
        redirect('categories.php');
    }
    
    if ($action === 'edit') {
        $id = (int)$_POST['id'];
        $name = sanitize($_POST['name']);
        $slug = strtolower(str_replace(' ', '-', $name));
        $description = sanitize($_POST['description']);
        $image = sanitize($_POST['image']);
        $parent_id = !empty($_POST['parent_id']) ? (int)$_POST['parent_id'] : null;
        $sort_order = (int)$_POST['sort_order'];
        $status = sanitize($_POST['status']);
        
        $stmt = $conn->prepare("UPDATE categories SET name = ?, slug = ?, description = ?, image = ?, parent_id = ?, sort_order = ?, status = ? WHERE id = ?");
        $stmt->bind_param("ssssiisi", $name, $slug, $description, $image, $parent_id, $sort_order, $status, $id);
        
        if ($stmt->execute()) {
            setMessage('success', 'Category updated successfully');
        } else {
            setMessage('danger', 'Error updating category');
        }
        redirect('categories.php');
    }
    
    if ($action === 'delete') {
        $id = (int)$_POST['id'];
        $conn->query("DELETE FROM categories WHERE id = $id");
        setMessage('success', 'Category deleted');
        redirect('categories.php');
    }
}

// Get parent categories
$parentCategories = $conn->query("SELECT * FROM categories WHERE parent_id IS NULL ORDER BY sort_order");

// Get all categories with parent info
$categories = $conn->query("SELECT c.*, p.name as parent_name 
                            FROM categories c 
                            LEFT JOIN categories p ON c.parent_id = p.id 
                            ORDER BY c.parent_id IS NULL DESC, c.parent_id, c.sort_order");

$logo = getSetting('logo', '');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Categories - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>

        <main class="admin-content">
            <div class="admin-header">
                <h1>Categories</h1>
                <button onclick="document.getElementById('addModal').classList.add('active')" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Add Category
                </button>
            </div>

            <?php if ($message): ?>
            <div class="alert alert-<?php echo $message['type']; ?>">
                <?php echo $message['text']; ?>
            </div>
            <?php endif; ?>

            <!-- Categories List -->
            <div class="admin-card">
                <h3>All Categories</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Parent</th>
                            <th>Order</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($cat = $categories->fetch_assoc()): ?>
                        <tr>
                            <td>
                                <?php if ($cat['image']): ?>
                                <img src="<?php echo $cat['image']; ?>" alt="" style="width: 60px; height: 40px; object-fit: cover; border-radius: 5px;">
                                <?php else: ?>
                                <span style="color: #999;">No image</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <strong><?php echo $cat['name']; ?></strong><br>
                                <small style="color: #666;"><?php echo $cat['slug']; ?></small>
                            </td>
                            <td><?php echo $cat['parent_name'] ?: 'Main Category'; ?></td>
                            <td><?php echo $cat['sort_order']; ?></td>
                            <td>
                                <span class="badge badge-<?php echo $cat['status'] === 'active' ? 'success' : 'danger'; ?>">
                                    <?php echo ucfirst($cat['status']); ?>
                                </span>
                            </td>
                            <td>
                                <div class="action-btns">
                                    <button onclick="editCategory(<?php echo htmlspecialchars(json_encode($cat)); ?>)" class="action-btn edit" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <form method="POST" style="display: inline;" onsubmit="return confirm('Are you sure?')">
                                        <input type="hidden" name="action" value="delete">
                                        <input type="hidden" name="id" value="<?php echo $cat['id']; ?>">
                                        <button type="submit" class="action-btn delete" title="Delete">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
        </main>
    </div>

    <!-- Add Modal -->
    <div id="addModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Add Category</h3>
                <button class="close-modal" onclick="document.getElementById('addModal').classList.remove('active')">&times;</button>
            </div>
            <form method="POST">
                <div class="modal-body">
                    <input type="hidden" name="action" value="add">
                    <div class="form-group">
                        <label>Name *</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-group">
                        <label>Parent Category</label>
                        <select name="parent_id">
                            <option value="">None (Main Category)</option>
                            <?php 
                            $parentCategories->data_seek(0);
                            while($p = $parentCategories->fetch_assoc()): 
                            ?>
                            <option value="<?php echo $p['id']; ?>"><?php echo $p['name']; ?></option>
                            <?php endwhile; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Image URL</label>
                        <input type="text" name="image">
                    </div>
                    <div class="form-group">
                        <label>Sort Order</label>
                        <input type="number" name="sort_order" value="0">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('addModal').classList.remove('active')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Category</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Modal -->
    <div id="editModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit Category</h3>
                <button class="close-modal" onclick="document.getElementById('editModal').classList.remove('active')">&times;</button>
            </div>
            <form method="POST">
                <div class="modal-body">
                    <input type="hidden" name="action" value="edit">
                    <input type="hidden" name="id" id="edit_id">
                    <div class="form-group">
                        <label>Name *</label>
                        <input type="text" name="name" id="edit_name" required>
                    </div>
                    <div class="form-group">
                        <label>Parent Category</label>
                        <select name="parent_id" id="edit_parent_id">
                            <option value="">None (Main Category)</option>
                            <?php 
                            $parentCategories->data_seek(0);
                            while($p = $parentCategories->fetch_assoc()): 
                            ?>
                            <option value="<?php echo $p['id']; ?>"><?php echo $p['name']; ?></option>
                            <?php endwhile; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" id="edit_description" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Image URL</label>
                        <input type="text" name="image" id="edit_image">
                    </div>
                    <div class="form-group">
                        <label>Sort Order</label>
                        <input type="number" name="sort_order" id="edit_sort_order">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select name="status" id="edit_status">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('editModal').classList.remove('active')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Category</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        function editCategory(cat) {
            document.getElementById('edit_id').value = cat.id;
            document.getElementById('edit_name').value = cat.name;
            document.getElementById('edit_parent_id').value = cat.parent_id || '';
            document.getElementById('edit_description').value = cat.description;
            document.getElementById('edit_image').value = cat.image;
            document.getElementById('edit_sort_order').value = cat.sort_order;
            document.getElementById('edit_status').value = cat.status;
            document.getElementById('editModal').classList.add('active');
        }
    </script>
</body>
</html>
<?php $conn->close(); ?>
