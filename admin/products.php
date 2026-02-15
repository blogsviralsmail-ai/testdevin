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
        $slug = strtolower(str_replace(' ', '-', preg_replace('/[^a-zA-Z0-9\s]/', '', $name)));
        $category_id = (int)$_POST['category_id'];
        $description = sanitize($_POST['description']);
        $short_description = sanitize($_POST['short_description']);
        $image = sanitize($_POST['image']);
        $price = !empty($_POST['price']) ? (float)$_POST['price'] : null;
        $size = sanitize($_POST['size']);
        $material = sanitize($_POST['material']);
        $is_featured = isset($_POST['is_featured']) ? 1 : 0;
        
        $stmt = $conn->prepare("INSERT INTO products (name, slug, category_id, description, short_description, image, price, size, material, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssisssdssi", $name, $slug, $category_id, $description, $short_description, $image, $price, $size, $material, $is_featured);
        
        if ($stmt->execute()) {
            setMessage('success', 'Product added successfully');
        } else {
            setMessage('danger', 'Error adding product');
        }
        redirect('products.php');
    }
    
    if ($action === 'edit') {
        $id = (int)$_POST['id'];
        $name = sanitize($_POST['name']);
        $slug = strtolower(str_replace(' ', '-', preg_replace('/[^a-zA-Z0-9\s]/', '', $name)));
        $category_id = (int)$_POST['category_id'];
        $description = sanitize($_POST['description']);
        $short_description = sanitize($_POST['short_description']);
        $image = sanitize($_POST['image']);
        $price = !empty($_POST['price']) ? (float)$_POST['price'] : null;
        $size = sanitize($_POST['size']);
        $material = sanitize($_POST['material']);
        $is_featured = isset($_POST['is_featured']) ? 1 : 0;
        $status = sanitize($_POST['status']);
        
        $stmt = $conn->prepare("UPDATE products SET name = ?, slug = ?, category_id = ?, description = ?, short_description = ?, image = ?, price = ?, size = ?, material = ?, is_featured = ?, status = ? WHERE id = ?");
        $stmt->bind_param("ssisssdssssi", $name, $slug, $category_id, $description, $short_description, $image, $price, $size, $material, $is_featured, $status, $id);
        
        if ($stmt->execute()) {
            setMessage('success', 'Product updated successfully');
        } else {
            setMessage('danger', 'Error updating product');
        }
        redirect('products.php');
    }
    
    if ($action === 'delete') {
        $id = (int)$_POST['id'];
        $conn->query("DELETE FROM products WHERE id = $id");
        setMessage('success', 'Product deleted');
        redirect('products.php');
    }
}

// Get categories for dropdown
$categories = $conn->query("SELECT c.*, p.name as parent_name FROM categories c LEFT JOIN categories p ON c.parent_id = p.id ORDER BY c.parent_id IS NULL DESC, c.name");

// Get products with category info
$search = sanitize($_GET['search'] ?? '');
$cat_filter = isset($_GET['category']) ? (int)$_GET['category'] : 0;

$where = "1=1";
if ($search) {
    $where .= " AND (p.name LIKE '%$search%' OR p.description LIKE '%$search%')";
}
if ($cat_filter) {
    $where .= " AND p.category_id = $cat_filter";
}

$products = $conn->query("SELECT p.*, c.name as category_name 
                          FROM products p 
                          LEFT JOIN categories c ON p.category_id = c.id 
                          WHERE $where
                          ORDER BY p.created_at DESC");

$logo = getSetting('logo', '');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Products - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>

        <main class="admin-content">
            <div class="admin-header">
                <h1>Products</h1>
                <button onclick="document.getElementById('addModal').classList.add('active')" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Add Product
                </button>
            </div>

            <?php if ($message): ?>
            <div class="alert alert-<?php echo $message['type']; ?>">
                <?php echo $message['text']; ?>
            </div>
            <?php endif; ?>

            <!-- Filters -->
            <div class="admin-card">
                <form method="GET" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <input type="text" name="search" placeholder="Search products..." value="<?php echo $search; ?>" style="flex: 1; min-width: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    <select name="category" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        <option value="">All Categories</option>
                        <?php 
                        $categories->data_seek(0);
                        while($c = $categories->fetch_assoc()): 
                        ?>
                        <option value="<?php echo $c['id']; ?>" <?php echo $cat_filter == $c['id'] ? 'selected' : ''; ?>>
                            <?php echo $c['parent_name'] ? $c['parent_name'] . ' > ' : ''; ?><?php echo $c['name']; ?>
                        </option>
                        <?php endwhile; ?>
                    </select>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-filter"></i> Filter</button>
                    <a href="products.php" class="btn btn-outline">Clear</a>
                </form>
            </div>

            <!-- Products List -->
            <div class="admin-card">
                <h3>All Products (<?php echo $products->num_rows; ?>)</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Size</th>
                            <th>Featured</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($prod = $products->fetch_assoc()): ?>
                        <tr>
                            <td>
                                <?php if ($prod['image']): ?>
                                <img src="<?php echo $prod['image']; ?>" alt="" style="width: 80px; height: 60px; object-fit: cover; border-radius: 5px;">
                                <?php else: ?>
                                <span style="color: #999;">No image</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <strong><?php echo $prod['name']; ?></strong><br>
                                <small style="color: #666;"><?php echo substr($prod['short_description'], 0, 50); ?>...</small>
                            </td>
                            <td><?php echo $prod['category_name'] ?: 'Uncategorized'; ?></td>
                            <td><?php echo $prod['size'] ?: '-'; ?></td>
                            <td>
                                <?php if ($prod['is_featured']): ?>
                                <span class="badge badge-success">Featured</span>
                                <?php else: ?>
                                <span class="badge badge-secondary">No</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <span class="badge badge-<?php echo $prod['status'] === 'active' ? 'success' : 'danger'; ?>">
                                    <?php echo ucfirst($prod['status']); ?>
                                </span>
                            </td>
                            <td>
                                <div class="action-btns">
                                    <button onclick="editProduct(<?php echo htmlspecialchars(json_encode($prod)); ?>)" class="action-btn edit" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <form method="POST" style="display: inline;" onsubmit="return confirm('Are you sure?')">
                                        <input type="hidden" name="action" value="delete">
                                        <input type="hidden" name="id" value="<?php echo $prod['id']; ?>">
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
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h3>Add Product</h3>
                <button class="close-modal" onclick="document.getElementById('addModal').classList.remove('active')">&times;</button>
            </div>
            <form method="POST">
                <div class="modal-body">
                    <input type="hidden" name="action" value="add">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label>Name *</label>
                            <input type="text" name="name" required>
                        </div>
                        <div class="form-group">
                            <label>Category *</label>
                            <select name="category_id" required>
                                <option value="">Select Category</option>
                                <?php 
                                $categories->data_seek(0);
                                while($c = $categories->fetch_assoc()): 
                                ?>
                                <option value="<?php echo $c['id']; ?>">
                                    <?php echo $c['parent_name'] ? $c['parent_name'] . ' > ' : ''; ?><?php echo $c['name']; ?>
                                </option>
                                <?php endwhile; ?>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Short Description</label>
                        <input type="text" name="short_description">
                    </div>
                    <div class="form-group">
                        <label>Full Description</label>
                        <textarea name="description" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Image (URL or Upload)</label>
                        <input type="text" name="image">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label>Price</label>
                            <input type="number" name="price" step="0.01">
                        </div>
                        <div class="form-group">
                            <label>Size</label>
                            <input type="text" name="size" placeholder="e.g., 600x600mm">
                        </div>
                        <div class="form-group">
                            <label>Material</label>
                            <input type="text" name="material" placeholder="e.g., Ceramic">
                        </div>
                    </div>
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" name="is_featured">
                            <span>Featured Product</span>
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('addModal').classList.remove('active')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Product</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Modal -->
    <div id="editModal" class="modal">
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h3>Edit Product</h3>
                <button class="close-modal" onclick="document.getElementById('editModal').classList.remove('active')">&times;</button>
            </div>
            <form method="POST">
                <div class="modal-body">
                    <input type="hidden" name="action" value="edit">
                    <input type="hidden" name="id" id="edit_id">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label>Name *</label>
                            <input type="text" name="name" id="edit_name" required>
                        </div>
                        <div class="form-group">
                            <label>Category *</label>
                            <select name="category_id" id="edit_category_id" required>
                                <option value="">Select Category</option>
                                <?php 
                                $categories->data_seek(0);
                                while($c = $categories->fetch_assoc()): 
                                ?>
                                <option value="<?php echo $c['id']; ?>">
                                    <?php echo $c['parent_name'] ? $c['parent_name'] . ' > ' : ''; ?><?php echo $c['name']; ?>
                                </option>
                                <?php endwhile; ?>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Short Description</label>
                        <input type="text" name="short_description" id="edit_short_description">
                    </div>
                    <div class="form-group">
                        <label>Full Description</label>
                        <textarea name="description" id="edit_description" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Image (URL or Upload)</label>
                        <input type="text" name="image" id="edit_image">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label>Price</label>
                            <input type="number" name="price" id="edit_price" step="0.01">
                        </div>
                        <div class="form-group">
                            <label>Size</label>
                            <input type="text" name="size" id="edit_size">
                        </div>
                        <div class="form-group">
                            <label>Material</label>
                            <input type="text" name="material" id="edit_material">
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" name="is_featured" id="edit_is_featured">
                                <span>Featured Product</span>
                            </label>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select name="status" id="edit_status">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('editModal').classList.remove('active')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Product</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        function editProduct(prod) {
            document.getElementById('edit_id').value = prod.id;
            document.getElementById('edit_name').value = prod.name;
            document.getElementById('edit_category_id').value = prod.category_id;
            document.getElementById('edit_short_description').value = prod.short_description || '';
            document.getElementById('edit_description').value = prod.description || '';
            document.getElementById('edit_image').value = prod.image || '';
            document.getElementById('edit_price').value = prod.price || '';
            document.getElementById('edit_size').value = prod.size || '';
            document.getElementById('edit_material').value = prod.material || '';
            document.getElementById('edit_is_featured').checked = prod.is_featured == 1;
            document.getElementById('edit_status').value = prod.status;
            document.getElementById('editModal').classList.add('active');
        }
    </script>
</body>
</html>
<?php $conn->close(); ?>
