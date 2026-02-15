<?php
require_once 'includes/config.php';

$conn = getDBConnection();
$message = '';
$success = false;
$categories = getCustomerCategories();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $mobile = sanitize($_POST['mobile']);
    $items = sanitize($_POST['items']);
    
    // Check if customer exists
    $stmt = $conn->prepare("SELECT * FROM masons WHERE mobile = ?");
    $stmt->bind_param("s", $mobile);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        // Existing customer
        $customer = $result->fetch_assoc();
        $mason_id = $customer['id'];
    } else {
                // New customer - create account
                $name = sanitize($_POST['name']);
                $address = sanitize($_POST['address']);
                $category_id = (int)$_POST['category_id'];
        
                // Get email - use default if not provided
                $default_email = getSetting('default_customer_email', 'jptiles13@gmail.com');
                $email = !empty($_POST['email']) ? sanitize($_POST['email']) : $default_email;
        
                // Handle photo upload (base64 compressed data)
                $photo = null;
                if (!empty($_POST['photo_data'])) {
                    $uploadDir = 'uploads/customers/';
                    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
            
                    // Decode base64 image
                    $imageData = $_POST['photo_data'];
                    $imageData = str_replace('data:image/jpeg;base64,', '', $imageData);
                    $imageData = str_replace('data:image/png;base64,', '', $imageData);
                    $imageData = str_replace(' ', '+', $imageData);
                    $decodedImage = base64_decode($imageData);
            
                    if ($decodedImage !== false) {
                        $photo = 'customer_' . time() . '_' . rand(1000, 9999) . '.jpg';
                        file_put_contents($uploadDir . $photo, $decodedImage);
                    }
                }
        
        $password = isset($_POST['password']) && !empty($_POST['password']) ? $_POST['password'] : '12345';
        
        if (empty($name)) {
            $message = 'Please enter your name';
        } else if (empty($_POST['password'])) {
            $message = 'Please set a password for login';
        } else {
                        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                        $stmt = $conn->prepare("INSERT INTO users (name, mobile, email, password, role, address) VALUES (?, ?, ?, ?, 'mason', ?)");
                        $stmt->bind_param("sssss", $name, $mobile, $email, $hashedPassword, $address);
                        $stmt->execute();
                        $userId = $conn->insert_id;
            
                        $stmt = $conn->prepare("INSERT INTO masons (user_id, name, mobile, email, address, photo, category_id, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, 0)");
                        $stmt->bind_param("isssssi", $userId, $name, $mobile, $email, $address, $photo, $category_id);
                        $stmt->execute();
                        $mason_id = $conn->insert_id;
        }
    }
    
    if (empty($message) && isset($mason_id)) {
        // Create pending visit
        $visit_date = date('Y-m-d');
        $visit_time = date('H:i:s');
        
        $stmt = $conn->prepare("INSERT INTO pending_visits (customer_id, customer_mobile, visit_date, visit_time, items_description) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("issss", $mason_id, $mobile, $visit_date, $visit_time, $items);
        
        if ($stmt->execute()) {
            $success = true;
            $message = 'Visit registered successfully! Admin will verify and add your rewards.';
        } else {
            $message = 'Error registering visit. Please try again.';
        }
    }
}

$logo = getSetting('logo', '');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register Visit - JP Tiles</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Poppins', sans-serif; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); min-height: 100vh; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; }
        .card { background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
        .logo { text-align: center; margin-bottom: 20px; }
        .logo img { height: 50px; }
        h1 { text-align: center; color: #1a1a1a; margin-bottom: 10px; font-size: 24px; }
        .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: 500; color: #333; }
        input, select, textarea { width: 100%; padding: 12px 15px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; font-family: inherit; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #c9a227; }
        .btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #c9a227, #d4af37); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; }
        .btn:hover { background: linear-gradient(135deg, #b8922a, #c9a227); }
        .alert { padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .alert-success { background: #d4edda; color: #155724; }
        .alert-danger { background: #f8d7da; color: #721c24; }
        .customer-info { background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .customer-info h3 { color: #2e7d32; margin-bottom: 5px; }
        #new-customer-fields { display: none; }
        .success-icon { font-size: 60px; color: #4caf50; text-align: center; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="logo">
                <img src="<?php echo $logo; ?>" alt="JP Tiles">
            </div>
            
            <?php if ($success): ?>
            <div class="success-icon"><i class="fas fa-check-circle"></i></div>
            <h1>Thank You!</h1>
            <div class="alert alert-success"><?php echo $message; ?></div>
            <p style="text-align: center; color: #666;">Your visit has been recorded. You can check your rewards in the Customer Portal.</p>
            <br>
            <a href="mason/login.php" class="btn" style="display: block; text-decoration: none; text-align: center;">Go to Customer Portal</a>
            <?php else: ?>
            
            <h1>Register Your Visit</h1>
            <p class="subtitle">Enter your details to record your visit</p>
            
            <?php if ($message): ?>
            <div class="alert alert-danger"><?php echo $message; ?></div>
            <?php endif; ?>
            
            <form method="POST" id="visitForm" enctype="multipart/form-data">
                <div class="form-group">
                    <label><i class="fas fa-phone"></i> Mobile Number *</label>
                    <input type="tel" name="mobile" id="mobile" required pattern="[0-9]{10}" placeholder="Enter 10 digit mobile number" onblur="checkCustomer(this.value)">
                </div>
                
                <div id="customer-info" style="display: none;"></div>
                
                <div id="new-customer-fields">
                    <div class="form-group" style="text-align: center;">
                        <label style="display: block; margin-bottom: 10px;"><i class="fas fa-camera"></i> Your Photo</label>
                        <div id="photo-preview" onclick="document.getElementById('photo-input').click()" style="width: 100px; height: 100px; border-radius: 50%; border: 2px dashed #ccc; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: #f9f9f9; overflow: hidden;">
                            <i class="fas fa-camera" id="photo-icon" style="font-size: 30px; color: #999;"></i>
                            <img id="photo-img" style="display: none; width: 100%; height: 100%; object-fit: cover;">
                        </div>
                                                <input type="file" id="photo-input" accept="image/*" capture="environment" style="display: none;" onchange="compressAndPreview(this)">
                                                <input type="hidden" name="photo_data" id="photo_data">
                                                <small style="color: #666;">Tap to add your photo</small>
                                                <div id="upload-status" style="display: none; color: #c9a227; font-size: 12px; margin-top: 5px;"></div>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-user"></i> Your Name *</label>
                        <input type="text" name="name" id="name" placeholder="Enter your full name">
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-tags"></i> Category *</label>
                        <select name="category_id" id="category_id">
                            <?php foreach ($categories as $cat): ?>
                            <option value="<?php echo $cat['id']; ?>"><?php echo $cat['name']; ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                                        <div class="form-group">
                                            <label><i class="fas fa-map-marker-alt"></i> Address</label>
                                            <textarea name="address" id="address" rows="2" placeholder="Enter your address"></textarea>
                                        </div>
                                        <div class="form-group">
                                            <label><i class="fas fa-envelope"></i> Email (Optional)</label>
                                            <input type="email" name="email" id="email" placeholder="Enter your email for password recovery">
                                            <small style="color: #666;">Used for forgot password OTP. Leave blank to use default.</small>
                                        </div>
                                        <div class="form-group">
                                            <label><i class="fas fa-lock"></i> Set Password *</label>
                        <input type="password" name="password" id="password" placeholder="Enter password for login" minlength="4">
                        <small style="color: #666;">This password will be used to login to Customer Portal</small>
                    </div>
                </div>
                
                <div class="form-group">
                    <label><i class="fas fa-shopping-cart"></i> Items Purchased *</label>
                    <textarea name="items" required rows="3" placeholder="Enter what items you purchased today..."></textarea>
                </div>
                
                <button type="submit" class="btn"><i class="fas fa-check"></i> Submit Visit</button>
            </form>
            <?php endif; ?>
        </div>
    </div>
    
        <script>
            function checkCustomer(mobile) {
                if (mobile.length >= 10) {
                    fetch('ajax/check-customer.php?mobile=' + mobile)
                        .then(response => response.json())
                        .then(data => {
                            const infoDiv = document.getElementById('customer-info');
                            const newFields = document.getElementById('new-customer-fields');
                        
                            if (data.found) {
                                infoDiv.innerHTML = '<div class="customer-info"><h3><i class="fas fa-user-check"></i> Welcome back, ' + data.name + '!</h3><p>Category: ' + data.category + ' | Total Rewards: Rs.' + data.rewards + '</p></div>';
                                infoDiv.style.display = 'block';
                                newFields.style.display = 'none';
                                document.getElementById('name').removeAttribute('required');
                                document.getElementById('password').removeAttribute('required');
                            } else {
                                infoDiv.innerHTML = '<div class="customer-info" style="background: #fff3e0;"><h3><i class="fas fa-user-plus"></i> New Customer</h3><p>Please fill in your details below</p></div>';
                                infoDiv.style.display = 'block';
                                newFields.style.display = 'block';
                                document.getElementById('name').setAttribute('required', 'required');
                                document.getElementById('password').setAttribute('required', 'required');
                            }
                        });
                }
            }
        
            function compressAndPreview(input) {
                const preview = document.getElementById('photo-img');
                const icon = document.getElementById('photo-icon');
                const status = document.getElementById('upload-status');
                const photoData = document.getElementById('photo_data');
            
                if (input.files && input.files[0]) {
                    status.style.display = 'block';
                    status.textContent = 'Compressing photo...';
                
                    const file = input.files[0];
                    const reader = new FileReader();
                
                    reader.onload = function(e) {
                        const img = new Image();
                        img.onload = function() {
                            // Create canvas for compression
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                        
                            // Calculate new dimensions (max 800px)
                            let width = img.width;
                            let height = img.height;
                            const maxSize = 800;
                        
                            if (width > height) {
                                if (width > maxSize) {
                                    height = Math.round(height * maxSize / width);
                                    width = maxSize;
                                }
                            } else {
                                if (height > maxSize) {
                                    width = Math.round(width * maxSize / height);
                                    height = maxSize;
                                }
                            }
                        
                            canvas.width = width;
                            canvas.height = height;
                        
                            // Draw and compress
                            ctx.drawImage(img, 0, 0, width, height);
                        
                            // Get compressed base64 (quality 0.7 = 70%)
                            const compressedData = canvas.toDataURL('image/jpeg', 0.7);
                        
                            // Show preview
                            preview.src = compressedData;
                            preview.style.display = 'block';
                            icon.style.display = 'none';
                        
                            // Store compressed data for upload
                            photoData.value = compressedData;
                        
                            // Calculate size reduction
                            const originalSize = (file.size / 1024).toFixed(0);
                            const compressedSize = (compressedData.length * 0.75 / 1024).toFixed(0);
                            status.textContent = 'Photo ready! (' + originalSize + 'KB → ' + compressedSize + 'KB)';
                            status.style.color = '#4caf50';
                        };
                        img.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            }
        </script>
</body>
</html>
<?php $conn->close(); ?>
