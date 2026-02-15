<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isAdmin()) {
    redirect('login.php');
}

$siteUrl = 'https://jptiles.in';
$qrUrl = $siteUrl . '/qr-register.php';
$logo = getSetting('logo', '');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QR Code - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
    <style>
        .qr-container { text-align: center; padding: 40px; }
        .qr-box { display: inline-block; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .qr-box h2 { color: #1a1a1a; margin-bottom: 20px; }
        #qrcode { margin: 20px auto; }
        #qrcode img { border: 10px solid #1a1a1a; border-radius: 10px; }
        .qr-url { background: #f5f5f5; padding: 10px 20px; border-radius: 5px; margin: 20px 0; word-break: break-all; font-size: 14px; }
        .download-btns { display: flex; gap: 10px; justify-content: center; margin-top: 20px; }
        .print-area { display: none; }
        @media print {
            .admin-wrapper, .admin-sidebar, .admin-header, .download-btns, .qr-url { display: none !important; }
            .print-area { display: block !important; text-align: center; padding: 50px; }
            .print-area img { max-width: 300px; }
        }
    </style>
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>
        <main class="admin-content">
            <div class="admin-header">
                <h1><i class="fas fa-qrcode"></i> QR Code for Customer Registration</h1>
            </div>

            <div class="admin-card">
                <div class="qr-container">
                    <div class="qr-box">
                        <img src="<?php echo $logo; ?>" alt="JP Tiles" style="height: 50px; margin-bottom: 20px;">
                        <h2>Scan to Register Your Visit</h2>
                        <div id="qrcode"></div>
                        <div class="qr-url"><?php echo $qrUrl; ?></div>
                        <div class="download-btns">
                            <button onclick="downloadQR()" class="btn btn-primary"><i class="fas fa-download"></i> Download QR</button>
                            <button onclick="window.print()" class="btn btn-outline"><i class="fas fa-print"></i> Print</button>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 10px;">
                    <h3><i class="fas fa-info-circle"></i> How it works</h3>
                    <ol style="margin-left: 20px; line-height: 2;">
                        <li>Print this QR code and display it at your shop counter</li>
                        <li>When a customer visits, they scan the QR code with their phone</li>
                        <li>If they're already registered, their details auto-fill after entering mobile number</li>
                        <li>If new, they fill in their name, address, and category</li>
                        <li>They enter what items they purchased and submit</li>
                        <li>You'll see their visit in "Pending Visits" to approve and add rewards</li>
                    </ol>
                </div>
            </div>
        </main>
    </div>

    <div class="print-area">
        <img src="<?php echo $logo; ?>" alt="JP Tiles" style="height: 60px; margin-bottom: 20px;"><br>
        <div id="qrcode-print"></div>
        <h2 style="margin-top: 20px;">Scan to Register Your Visit</h2>
        <p>JP Tiles - Premium Tiles & Sanitary</p>
    </div>

    <script>
        var qr = qrcode(0, 'M');
        qr.addData('<?php echo $qrUrl; ?>');
        qr.make();
        document.getElementById('qrcode').innerHTML = qr.createImgTag(8, 10);
        document.getElementById('qrcode-print').innerHTML = qr.createImgTag(8, 10);
        
        function downloadQR() {
            var img = document.querySelector('#qrcode img');
            var link = document.createElement('a');
            link.download = 'jptiles-qr-code.png';
            link.href = img.src;
            link.click();
        }
    </script>
</body>
</html>
