-- JP Tiles Database Schema
-- Complete database for website and Mason CRM

CREATE DATABASE IF NOT EXISTS jptiles_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jptiles_db;

-- Users Table (Admin and Mason)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'mason') NOT NULL DEFAULT 'mason',
    address TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image VARCHAR(255),
    parent_id INT DEFAULT NULL,
    sort_order INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    image VARCHAR(255),
    gallery TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    sort_order INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Mason List Table
CREATE TABLE IF NOT EXISTS masons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    address TEXT,
    total_visits INT DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    total_rewards DECIMAL(10,2) DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Mason Visits/Entries Table
CREATE TABLE IF NOT EXISTS mason_visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mason_id INT NOT NULL,
    visit_date DATE NOT NULL,
    visit_time TIME NOT NULL,
    items_description TEXT,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    rewards DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mason_id) REFERENCES masons(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Offers Table
CREATE TABLE IF NOT EXISTS offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    image VARCHAR(255),
    min_rewards DECIMAL(10,2) DEFAULT 0,
    prize_description TEXT,
    start_date DATE,
    end_date DATE,
    is_visible TINYINT(1) DEFAULT 1,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Reward Winners Table
CREATE TABLE IF NOT EXISTS reward_winners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mason_id INT NOT NULL,
    offer_id INT,
    prize_given VARCHAR(200),
    prize_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mason_id) REFERENCES masons(id) ON DELETE CASCADE,
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL
);

-- Winner Photos Table
CREATE TABLE IF NOT EXISTS winner_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    winner_id INT NOT NULL,
    photo_path VARCHAR(255) NOT NULL,
    caption VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (winner_id) REFERENCES reward_winners(id) ON DELETE CASCADE
);

-- Slider/Banner Table
CREATE TABLE IF NOT EXISTS sliders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200),
    subtitle TEXT,
    image VARCHAR(255) NOT NULL,
    link VARCHAR(255),
    sort_order INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gallery Table
CREATE TABLE IF NOT EXISTS gallery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200),
    image VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    sort_order INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact Enquiries Table
CREATE TABLE IF NOT EXISTS enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100),
    message TEXT,
    enquiry_type VARCHAR(50),
    status ENUM('new', 'read', 'replied') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Admin User
INSERT INTO users (name, mobile, password, role) VALUES 
('Admin', '9828290049', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert Default Settings
INSERT INTO settings (setting_key, setting_value) VALUES
('site_name', 'JP Tiles'),
('site_tagline', '#1 Trusted Brand Since 2013'),
('site_description', 'Your Destination for luxury sanitary ware & accessories. Discover premium sanitaryware solutions with J.P. Tiles Sanitaryware — where quality meets elegance for your dream spaces.'),
('phone_1', '+91 9828290049'),
('phone_2', '+91 9828290055'),
('email', 'jptiles13@gmail.com'),
('address', 'Shop No. 40, Ravan Gate, Opp. Power House Kalwar Road, Jhotwara, Jaipur- 302012'),
('facebook', 'https://www.facebook.com/share/1BYJpMbwKp/'),
('instagram', 'https://www.instagram.com/jptilesjaipur/'),
('whatsapp', '919828290049'),
('logo', 'https://jptiles.in/wp-content/uploads/2025/01/Untitled-design-2025-01-31T170820.186.png'),
('rewards_rate', '1'),
('offer_visible', '1');

-- Insert Default Categories
INSERT INTO categories (name, slug, description, image, sort_order) VALUES
('Tiles', 'tiles', 'At J.P. Tiles Sanitaryware, we offer a wide range of high-quality tiles crafted for both beauty and durability.', 'https://jptiles.in/wp-content/uploads/2025/02/1-1.png', 1),
('Bath', 'bath', 'At J.P. Tiles Sanitaryware, we offer a comprehensive range of high-quality bath products designed for both style and functionality.', 'https://jptiles.in/wp-content/uploads/2025/02/2-2.png', 2),
('Kitchen', 'kitchen', 'At J.P. Tiles Sanitaryware, we offer a wide range of high-quality kitchen solutions designed for both style and functionality.', 'https://jptiles.in/wp-content/uploads/2025/02/1-1.png', 3),
('Tile Chemical', 'tile-chemical', 'At J.P. Tiles Sanitaryware, we offer a wide range of high-quality tile chemicals designed for durability and superior performance.', 'https://jptiles.in/wp-content/uploads/2025/02/2-2.png', 4);

-- Insert Subcategories
INSERT INTO categories (name, slug, description, parent_id, sort_order) VALUES
('Ceramic Tiles', 'ceramic-tiles', 'Premium ceramic tiles for walls and floors', 1, 1),
('Floor Tiles', 'floor-tiles', 'Durable floor tiles for every space', 1, 2),
('Parking Tiles', 'parking-tiles', 'Heavy-duty parking tiles', 1, 3),
('Elevation Tiles', 'elevation-tiles', 'Beautiful elevation tiles for exteriors', 1, 4),
('Bath Vanity', 'bath-vanity', 'Elegant bath vanities', 2, 1),
('Bath Mirror', 'bath-mirror', 'Stylish bath mirrors', 2, 2),
('Bath Accessories', 'bath-accessories', 'Complete bath accessories', 2, 3),
('Wash Basin', 'wash-basin', 'Premium wash basins', 2, 4),
('Water Closet', 'water-closet', 'Modern water closets', 2, 5),
('Faucets', 'faucets', 'Quality faucets and taps', 2, 6),
('Shower', 'shower', 'Luxury shower systems', 2, 7),
('Kitchen Sink', 'kitchen-sink', 'Durable kitchen sinks', 3, 1),
('Kitchen Faucet', 'kitchen-faucet', 'Kitchen faucets and taps', 3, 2),
('Kitchen Accessories', 'kitchen-accessories', 'Kitchen accessories', 3, 3),
('Tile Adhesive', 'tile-adhesive', 'Strong tile adhesives', 4, 1),
('Tile Grout', 'tile-grout', 'Quality tile grouts', 4, 2),
('Waterproofing', 'waterproofing', 'Waterproofing solutions', 4, 3);

-- Insert Sample Products
INSERT INTO products (category_id, name, slug, description, image, sort_order) VALUES
(5, 'Designer Ceramic Wall Tile', 'designer-ceramic-wall-tile', 'Beautiful designer ceramic wall tile with modern patterns', 'https://jptiles.in/wp-content/uploads/2025/03/1-1.jpg', 1),
(5, 'Classic Ceramic Floor Tile', 'classic-ceramic-floor-tile', 'Classic ceramic floor tile with elegant finish', 'https://jptiles.in/wp-content/uploads/2025/03/2-1.jpg', 2),
(5, 'Modern Ceramic Tile', 'modern-ceramic-tile', 'Modern ceramic tile for contemporary spaces', 'https://jptiles.in/wp-content/uploads/2025/03/3-1.jpg', 3),
(5, 'Premium Ceramic Tile', 'premium-ceramic-tile', 'Premium quality ceramic tile', 'https://jptiles.in/wp-content/uploads/2025/03/4-1.jpg', 4),
(6, 'Wooden Finish Floor Tile', 'wooden-finish-floor-tile', 'Floor tile with wooden finish', 'https://jptiles.in/wp-content/uploads/2025/03/1-2.jpg', 1),
(6, 'Marble Look Floor Tile', 'marble-look-floor-tile', 'Floor tile with marble look', 'https://jptiles.in/wp-content/uploads/2025/03/2-2.jpg', 2),
(9, 'Modern Bath Vanity', 'modern-bath-vanity', 'Modern bath vanity with storage', 'https://jptiles.in/wp-content/uploads/2025/02/Wooden-Vanity-1.png', 1),
(10, 'LED Bath Mirror', 'led-bath-mirror', 'LED illuminated bath mirror', 'https://jptiles.in/wp-content/uploads/2025/03/Untitled-design-2025-03-11T151012.707.png', 1),
(12, 'Premium Wash Basin', 'premium-wash-basin', 'Premium quality wash basin', 'https://jptiles.in/wp-content/uploads/2025/03/Untitled-design-2025-03-11T152358.155.png', 1),
(16, 'Stainless Steel Kitchen Sink', 'stainless-steel-kitchen-sink', 'Durable stainless steel kitchen sink', 'https://jptiles.in/wp-content/uploads/2025/03/Untitled-design-2025-03-11T154058.171.png', 1);

-- Insert Sample Sliders
INSERT INTO sliders (title, subtitle, image, sort_order) VALUES
('Bath Accessories', 'Enhance your bathroom elegance with our stylish and functional bath accessories.', 'https://jptiles.in/wp-content/uploads/2025/02/2-2.png', 1),
('Bath Vanity', 'Enhance your bathroom elegance with our stylish and functional bath vanities.', 'https://jptiles.in/wp-content/uploads/2025/02/1-1.png', 2),
('Kitchen Solutions', 'Upgrade your kitchen with our high-performance solutions.', 'https://jptiles.in/wp-content/uploads/2025/02/2-2.png', 3),
('Ceramic Tiles', 'Add a touch of sophistication to your home with our ceramic tiles.', 'https://jptiles.in/wp-content/uploads/2025/02/1-1.png', 4);

-- Insert 10 Sample Masons
INSERT INTO masons (name, mobile, address, total_visits, total_amount, total_rewards) VALUES
('Ramesh Kumar', '9876543210', '123, Sector 5, Jhotwara, Jaipur', 5, 25000.00, 250.00),
('Suresh Sharma', '9876543211', '456, Kalwar Road, Jaipur', 8, 42000.00, 420.00),
('Mahesh Verma', '9876543212', '789, Ravan Gate, Jaipur', 3, 15000.00, 150.00),
('Dinesh Yadav', '9876543213', '321, Power House Road, Jaipur', 12, 68000.00, 680.00),
('Rajesh Meena', '9876543214', '654, Jhotwara Main Road, Jaipur', 6, 32000.00, 320.00),
('Mukesh Singh', '9876543215', '987, Near Bus Stand, Jaipur', 4, 18000.00, 180.00),
('Lokesh Gupta', '9876543216', '147, Industrial Area, Jaipur', 9, 55000.00, 550.00),
('Naresh Jain', '9876543217', '258, Civil Lines, Jaipur', 7, 38000.00, 380.00),
('Ganesh Patel', '9876543218', '369, Vaishali Nagar, Jaipur', 2, 12000.00, 120.00),
('Hitesh Agarwal', '9876543219', '741, Mansarovar, Jaipur', 10, 62000.00, 620.00);

-- Create user accounts for masons with default password '12345'
INSERT INTO users (name, mobile, password, role, address) VALUES
('Ramesh Kumar', '9876543210', '$2y$10$jg7dvjbDfNXwO4cnOXd7Eei/AOQnEDXaBsV0uPuy32fsJ1HsttP8m', 'mason', '123, Sector 5, Jhotwara, Jaipur'),
('Suresh Sharma', '9876543211', '$2y$10$jg7dvjbDfNXwO4cnOXd7Eei/AOQnEDXaBsV0uPuy32fsJ1HsttP8m', 'mason', '456, Kalwar Road, Jaipur'),
('Mahesh Verma', '9876543212', '$2y$10$jg7dvjbDfNXwO4cnOXd7Eei/AOQnEDXaBsV0uPuy32fsJ1HsttP8m', 'mason', '789, Ravan Gate, Jaipur'),
('Dinesh Yadav', '9876543213', '$2y$10$jg7dvjbDfNXwO4cnOXd7Eei/AOQnEDXaBsV0uPuy32fsJ1HsttP8m', 'mason', '321, Power House Road, Jaipur'),
('Rajesh Meena', '9876543214', '$2y$10$jg7dvjbDfNXwO4cnOXd7Eei/AOQnEDXaBsV0uPuy32fsJ1HsttP8m', 'mason', '654, Jhotwara Main Road, Jaipur'),
('Mukesh Singh', '9876543215', '$2y$10$jg7dvjbDfNXwO4cnOXd7Eei/AOQnEDXaBsV0uPuy32fsJ1HsttP8m', 'mason', '987, Near Bus Stand, Jaipur'),
('Lokesh Gupta', '9876543216', '$2y$10$jg7dvjbDfNXwO4cnOXd7Eei/AOQnEDXaBsV0uPuy32fsJ1HsttP8m', 'mason', '147, Industrial Area, Jaipur'),
('Naresh Jain', '9876543217', '$2y$10$jg7dvjbDfNXwO4cnOXd7Eei/AOQnEDXaBsV0uPuy32fsJ1HsttP8m', 'mason', '258, Civil Lines, Jaipur'),
('Ganesh Patel', '9876543218', '$2y$10$jg7dvjbDfNXwO4cnOXd7Eei/AOQnEDXaBsV0uPuy32fsJ1HsttP8m', 'mason', '369, Vaishali Nagar, Jaipur'),
('Hitesh Agarwal', '9876543219', '$2y$10$jg7dvjbDfNXwO4cnOXd7Eei/AOQnEDXaBsV0uPuy32fsJ1HsttP8m', 'mason', '741, Mansarovar, Jaipur');

-- Update masons with user_id
UPDATE masons SET user_id = 2 WHERE mobile = '9876543210';
UPDATE masons SET user_id = 3 WHERE mobile = '9876543211';
UPDATE masons SET user_id = 4 WHERE mobile = '9876543212';
UPDATE masons SET user_id = 5 WHERE mobile = '9876543213';
UPDATE masons SET user_id = 6 WHERE mobile = '9876543214';
UPDATE masons SET user_id = 7 WHERE mobile = '9876543215';
UPDATE masons SET user_id = 8 WHERE mobile = '9876543216';
UPDATE masons SET user_id = 9 WHERE mobile = '9876543217';
UPDATE masons SET user_id = 10 WHERE mobile = '9876543218';
UPDATE masons SET user_id = 11 WHERE mobile = '9876543219';

-- Insert Sample Visits for Masons
INSERT INTO mason_visits (mason_id, visit_date, visit_time, items_description, amount, rewards, created_by) VALUES
(1, '2025-01-05', '10:30:00', 'Ceramic Tiles 50 boxes, Tile Adhesive 10 bags', 8000.00, 80.00, 1),
(1, '2025-01-08', '14:15:00', 'Floor Tiles 30 boxes', 5000.00, 50.00, 1),
(1, '2025-01-10', '11:00:00', 'Bath Accessories Set, Wash Basin', 12000.00, 120.00, 1),
(2, '2025-01-03', '09:45:00', 'Kitchen Sink, Kitchen Faucet', 15000.00, 150.00, 1),
(2, '2025-01-06', '16:30:00', 'Parking Tiles 100 boxes', 20000.00, 200.00, 1),
(2, '2025-01-09', '12:00:00', 'Tile Grout 20 bags', 7000.00, 70.00, 1),
(3, '2025-01-07', '10:00:00', 'Elevation Tiles 40 boxes', 15000.00, 150.00, 1),
(4, '2025-01-02', '11:30:00', 'Complete Bath Set', 25000.00, 250.00, 1),
(4, '2025-01-04', '15:00:00', 'Water Closet, Bidet', 18000.00, 180.00, 1),
(4, '2025-01-11', '09:00:00', 'Shower System, Faucets', 25000.00, 250.00, 1),
(5, '2025-01-05', '13:45:00', 'Ceramic Tiles 60 boxes', 10000.00, 100.00, 1),
(5, '2025-01-08', '10:30:00', 'Bath Vanity, Mirror', 22000.00, 220.00, 1),
(6, '2025-01-06', '14:00:00', 'Floor Tiles 40 boxes, Adhesive', 18000.00, 180.00, 1),
(7, '2025-01-03', '11:15:00', 'Kitchen Complete Set', 30000.00, 300.00, 1),
(7, '2025-01-07', '16:00:00', 'Waterproofing Materials', 25000.00, 250.00, 1),
(8, '2025-01-04', '10:00:00', 'Bath Accessories, Tiles', 20000.00, 200.00, 1),
(8, '2025-01-09', '14:30:00', 'Wash Basin Set', 18000.00, 180.00, 1),
(9, '2025-01-08', '11:00:00', 'Ceramic Tiles 25 boxes', 12000.00, 120.00, 1),
(10, '2025-01-02', '09:30:00', 'Complete Bathroom Renovation Set', 35000.00, 350.00, 1),
(10, '2025-01-06', '15:45:00', 'Kitchen Sink, Tiles', 27000.00, 270.00, 1);

-- Insert Sample Offer
INSERT INTO offers (title, description, min_rewards, prize_description, start_date, end_date, is_visible) VALUES
('Top Performer Reward - January 2025', 'Mason with highest rewards points this month wins exciting prizes!', 500, 'Winner gets a brand new smartphone and certificate of appreciation', '2025-01-01', '2025-01-31', 1);
