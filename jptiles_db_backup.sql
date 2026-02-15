-- MySQL dump 10.13  Distrib 8.0.44, for Linux (x86_64)
--
-- Host: localhost    Database: jptiles_db
-- ------------------------------------------------------
-- Server version	8.0.44-0ubuntu0.24.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `api_tokens`
--

DROP TABLE IF EXISTS `api_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `user_type` enum('admin','employee','customer') NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_token` (`token`),
  KEY `idx_expires` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_tokens`
--

LOCK TABLES `api_tokens` WRITE;
/*!40000 ALTER TABLE `api_tokens` DISABLE KEYS */;
INSERT INTO `api_tokens` VALUES (1,1,'admin','338220e67a43dc3c023bf2f91e922e7ab49042ffece43b2eafd63972d3e78aab','2026-02-11 18:04:57','2026-01-12 18:04:57'),(2,1,'admin','180da6610f983a05820891be122eadda01633a3762c32cae8f76c84b198495a6','2026-02-11 18:16:06','2026-01-12 18:16:06'),(3,1,'admin','2403fd3b994702619c29e5b8533c5ac742f2890378fe8740ce4964fd25e19af2','2026-02-11 18:26:36','2026-01-12 18:26:36'),(4,1,'admin','6c56f612ab8e068919345591e5dabb5fea9e5cc377cea7bcaabf6dda82fab52f','2026-02-11 18:29:50','2026-01-12 18:29:50'),(5,1,'admin','4388566e60b033bf500340cecc2540852b301e539788245737287a543423db80','2026-02-11 18:50:11','2026-01-12 18:50:11'),(6,1,'admin','e44f597b96d1b14ce4f938216e3999d02d50b5e4563a7205e938a32f0772e2ce','2026-02-12 06:56:55','2026-01-13 06:56:55'),(7,1,'admin','14585b0b111d7b827109cfbed8264b1583cfc847ae19336986f23eec02068b85','2026-02-12 06:59:44','2026-01-13 06:59:44'),(8,1,'admin','1ea5b4d31e28539fe50b21fab45008f43e13d28dc8aaf3e89dda1a9ee93d7381','2026-02-14 08:20:56','2026-01-15 08:20:56'),(9,23,'employee','dd09705c0720cb8479b10242f67ef5b0931f04490b5c7fea1a9393f21afbbff8','2026-02-14 08:28:21','2026-01-15 08:28:21'),(10,1,'customer','4ec6cb6e31295591eeac796c1ac5d3049ee65e5e454471c93ba10509813e71a9','2026-02-14 09:18:44','2026-01-15 09:18:44'),(11,1,'customer','d7a7ebf3ae43acd3c1a2cdf4b85ab16a615d51b63ef46da932087554c6734050','2026-02-14 09:18:53','2026-01-15 09:18:53'),(12,1,'customer','3bb153a46b20ec2a5e640d8abf58a0bd2c89b28a73de9bbcb3ff1d789d3b9639','2026-02-14 09:20:24','2026-01-15 09:20:24'),(13,11,'customer','da0f19c5c9b8e889ce4bdc81f073452776e1140474eb4030d709b845c8c43619','2026-02-14 12:03:58','2026-01-15 12:03:58'),(14,1,'admin','6b7ccad05e162e1e56fe4ab531c0ff7e1ed7186f819be3cc623941b8bcfef81a','2026-02-14 12:05:44','2026-01-15 12:05:44'),(15,1,'customer','827ac3dd8a6d9e1ad1a8f10ea0bafcfcf1c131c524876d1e90699c856491c8e0','2026-02-14 12:21:23','2026-01-15 12:21:23'),(16,1,'customer','b46a0f39bf133ae8a8e508e4a67a83a1a4af4f65b5c2aeabefbf3ba79aea51cf','2026-02-14 12:26:33','2026-01-15 12:26:33'),(17,11,'customer','a326e62c333ee12de212d504433614fda9a38e88380a8f63d2739ce81c3f95f1','2026-02-14 12:27:10','2026-01-15 12:27:10'),(18,11,'customer','0a2efc20d1c5858887ce0cb2461d069f8acbe1bb386559883880bcf91daf1cbb','2026-02-14 12:28:18','2026-01-15 12:28:18'),(19,1,'customer','5d9ada2b9301f3432d1ef83672da6e99edfd784c0a747d0022dcf17d5e8cb186','2026-02-14 12:38:20','2026-01-15 12:38:20'),(20,11,'customer','71f7d0fdfa7c7955a86eb2757c1714e9b7ce520ae36d0448068f2a6a4d38204c','2026-02-14 12:38:53','2026-01-15 12:38:53'),(21,23,'customer','488852297467b6d69ef3301ab0554bb059dec196bca990913b54193e31d49c86','2026-02-14 12:48:32','2026-01-15 12:48:32'),(22,23,'customer','7ae8ded857bc6dfabfdc5fa5d5be27c90ce32188893039048a7668388cda92e7','2026-02-14 12:56:52','2026-01-15 12:56:52');
/*!40000 ALTER TABLE `api_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `catalogs`
--

DROP TABLE IF EXISTS `catalogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `catalogs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `pdf_file` varchar(255) NOT NULL,
  `thumbnail` varchar(255) DEFAULT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `catalogs`
--

LOCK TABLES `catalogs` WRITE;
/*!40000 ALTER TABLE `catalogs` DISABLE KEYS */;
INSERT INTO `catalogs` VALUES (1,'12X18 Strawberry Ceramic','Tiles','12X18_STRAWBERRY_CERAMIC.pdf',NULL,'Premium ceramic tiles collection',1,0,'2026-01-15 15:50:16','2026-01-15 15:50:16');
/*!40000 ALTER TABLE `catalogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text,
  `image` varchar(255) DEFAULT NULL,
  `parent_id` int DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Tiles','tiles','At J.P. Tiles Sanitaryware, we offer a wide range of high-quality tiles crafted for both beauty and durability.','assets/images/1-1.png',NULL,1,'active','2026-01-12 12:11:24','2026-01-15 13:24:32'),(2,'Bath','bath','At J.P. Tiles Sanitaryware, we offer a comprehensive range of high-quality bath products designed for both style and functionality.','assets/images/2-2.png',NULL,2,'active','2026-01-12 12:11:24','2026-01-15 13:24:32'),(3,'Kitchen','kitchen','At J.P. Tiles Sanitaryware, we offer a wide range of high-quality kitchen solutions designed for both style and functionality.','assets/images/1-1.png',NULL,3,'active','2026-01-12 12:11:24','2026-01-15 13:24:32'),(4,'Tile Chemical','tile-chemical','At J.P. Tiles Sanitaryware, we offer a wide range of high-quality tile chemicals designed for durability and superior performance.','assets/images/2-2.png',NULL,4,'active','2026-01-12 12:11:24','2026-01-15 13:24:32'),(5,'Ceramic Tiles','ceramic-tiles','Premium ceramic tiles for walls and floors',NULL,1,1,'active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(6,'Floor Tiles','floor-tiles','Durable floor tiles for every space',NULL,1,2,'active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(7,'Parking Tiles','parking-tiles','Heavy-duty parking tiles',NULL,1,3,'active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(8,'Elevation Tiles','elevation-tiles','Beautiful elevation tiles for exteriors',NULL,1,4,'active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(9,'Bath Vanity','bath-vanity','Elegant bath vanities',NULL,2,1,'active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(10,'Bath Mirror','bath-mirror','Stylish bath mirrors',NULL,2,2,'active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(11,'Bath Accessories','bath-accessories','Complete bath accessories',NULL,2,3,'active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(12,'Wash Basin','wash-basin','Premium wash basins',NULL,2,4,'active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(13,'Water Closet','water-closet','Modern water closets',NULL,2,5,'active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(14,'Faucets','faucets','Quality faucets and taps',NULL,2,6,'active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(15,'Shower','shower','Luxury shower systems',NULL,2,7,'active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(16,'Kitchen Sink','kitchen-sink','Durable kitchen sinks',NULL,3,1,'active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(17,'Kitchen Faucet','kitchen-faucet','Kitchen faucets and taps',NULL,3,2,'active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(18,'Kitchen Accessories','kitchen-accessories','Kitchen accessories',NULL,3,3,'active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(19,'Tile Adhesive','tile-adhesive','Strong tile adhesives',NULL,4,1,'active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(20,'Tile Grout','tile-grout','Quality tile grouts',NULL,4,2,'active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(21,'Waterproofing','waterproofing','Waterproofing solutions',NULL,4,3,'active','2026-01-12 12:11:24','2026-01-12 12:11:24');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_images`
--

DROP TABLE IF EXISTS `category_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_slug` varchar(100) NOT NULL,
  `category_name` varchar(255) NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_images`
--

LOCK TABLES `category_images` WRITE;
/*!40000 ALTER TABLE `category_images` DISABLE KEYS */;
INSERT INTO `category_images` VALUES (1,'tiles','Tiles','assets/images/categories/tiles.jpg',1,1,'2026-01-15 14:36:26'),(2,'bath','Bath','assets/images/categories/bath.jpg',2,1,'2026-01-15 14:36:26'),(3,'kitchen','Kitchen','assets/images/categories/kitchen.jpg',3,1,'2026-01-15 14:36:26'),(4,'tile-chemical','Tile Chemical','assets/images/categories/tile-chemical.jpg',4,1,'2026-01-15 14:36:26');
/*!40000 ALTER TABLE `category_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` text,
  `status` enum('new','contacted','closed') DEFAULT 'new',
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_messages`
--

LOCK TABLES `contact_messages` WRITE;
/*!40000 ALTER TABLE `contact_messages` DISABLE KEYS */;
INSERT INTO `contact_messages` VALUES (1,'Test User','9876543210','test@example.com','Test Subject','This is a test message to verify the contact form is working correctly.','new','2026-01-15 16:47:22');
/*!40000 ALTER TABLE `contact_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_categories`
--

DROP TABLE IF EXISTS `customer_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `sort_order` int DEFAULT '0',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_categories`
--

LOCK TABLES `customer_categories` WRITE;
/*!40000 ALTER TABLE `customer_categories` DISABLE KEYS */;
INSERT INTO `customer_categories` VALUES (1,'Architect',NULL,1,'active','2026-01-12 14:13:37'),(2,'Contractor',NULL,2,'active','2026-01-12 14:13:37'),(3,'Plumber',NULL,3,'active','2026-01-12 14:13:37'),(4,'Mason',NULL,4,'active','2026-01-12 14:13:37'),(5,'Builder',NULL,5,'active','2026-01-12 14:13:37'),(6,'Customer',NULL,6,'active','2026-01-12 14:13:37'),(14,'Dealers',NULL,7,'active','2026-01-15 08:18:32');
/*!40000 ALTER TABLE `customer_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enquiries`
--

DROP TABLE IF EXISTS `enquiries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enquiries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `product` varchar(255) DEFAULT NULL,
  `message` text,
  `enquiry_type` varchar(50) DEFAULT NULL,
  `status` enum('new','read','replied') DEFAULT 'new',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiries`
--

LOCK TABLES `enquiries` WRITE;
/*!40000 ALTER TABLE `enquiries` DISABLE KEYS */;
INSERT INTO `enquiries` VALUES (1,'Test Enquiry User','9988776655','enquiry@test.com','Tiles and Sanitaryware','This is a test enquiry.',NULL,'new','2026-01-15 16:50:40');
/*!40000 ALTER TABLE `enquiries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faqs`
--

DROP TABLE IF EXISTS `faqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faqs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question` varchar(500) NOT NULL,
  `answer` text NOT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faqs`
--

LOCK TABLES `faqs` WRITE;
/*!40000 ALTER TABLE `faqs` DISABLE KEYS */;
INSERT INTO `faqs` VALUES (1,'What types of sanitaryware products do you offer?','We offer a wide range of sanitaryware products, including washbasins, toilets, bidets, urinals, and premium bathroom accessories to meet various design and functional needs.',1,1,'2026-01-15 14:36:26'),(2,'Are your products durable and long-lasting?','Our products are crafted from high-quality materials with advanced manufacturing techniques, ensuring long-lasting durability, stain resistance, and easy maintenance.',2,1,'2026-01-15 14:36:26'),(3,'Can I visit your showroom to see the products?','Absolutely! We welcome you to visit our showroom, where you can explore our extensive collection of sanitaryware and get expert advice from our team.',3,1,'2026-01-15 14:36:26'),(4,'Do you provide warranty on your products?','Yes, all our sanitaryware products come with manufacturer warranties to ensure peace of mind and product satisfaction.',4,1,'2026-01-15 14:36:26');
/*!40000 ALTER TABLE `faqs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `features`
--

DROP TABLE IF EXISTS `features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `features` (
  `id` int NOT NULL AUTO_INCREMENT,
  `icon` varchar(100) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `features`
--

LOCK TABLES `features` WRITE;
/*!40000 ALTER TABLE `features` DISABLE KEYS */;
INSERT INTO `features` VALUES (1,'fa-th-large','Wide Range','Discover a wide range of high-quality products',1,1,'2026-01-15 14:36:26'),(2,'fa-truck','Fast Delivery','Experience fast and reliable product delivery',2,1,'2026-01-15 14:36:26'),(3,'fa-tags','Best Prices','Unlock the best deals with competitive pricing',3,1,'2026-01-15 14:36:26'),(4,'fa-headset','Expert Support','Our dedicated experts are ready to assist you',4,1,'2026-01-15 14:36:26');
/*!40000 ALTER TABLE `features` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gallery`
--

DROP TABLE IF EXISTS `gallery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gallery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) DEFAULT NULL,
  `image` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gallery`
--

LOCK TABLES `gallery` WRITE;
/*!40000 ALTER TABLE `gallery` DISABLE KEYS */;
INSERT INTO `gallery` VALUES (1,'Premium Showroom Interior','https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80','Showroom',1,'active','2026-01-15 15:09:19'),(2,'Tiles Display Area','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80','Showroom',2,'active','2026-01-15 15:09:19'),(3,'Bath Fittings Section','https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80','Bath',3,'active','2026-01-15 15:09:19'),(4,'Modern Bathroom Display','https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80','Bath',4,'active','2026-01-15 15:09:19'),(5,'Kitchen Accessories','https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80','Kitchen',5,'active','2026-01-15 15:09:19'),(6,'Ceramic Tiles Collection','https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=800&q=80','Tiles',6,'active','2026-01-15 15:09:19'),(7,'Floor Tiles Display','https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80','Tiles',7,'active','2026-01-15 15:09:19'),(8,'Wash Basin Collection','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80','Bath',8,'active','2026-01-15 15:09:19');
/*!40000 ALTER TABLE `gallery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gift_events`
--

DROP TABLE IF EXISTS `gift_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gift_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text,
  `event_date` date DEFAULT NULL,
  `status` enum('planning','active','completed') DEFAULT 'planning',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gift_events`
--

LOCK TABLES `gift_events` WRITE;
/*!40000 ALTER TABLE `gift_events` DISABLE KEYS */;
INSERT INTO `gift_events` VALUES (1,'diwali','asdjlad','2026-01-12','planning',1,'2026-01-12 15:22:26','2026-01-12 15:22:26'),(2,'26 jan gift','iphone','2026-01-26','planning',1,'2026-01-15 08:10:36','2026-01-15 08:10:36');
/*!40000 ALTER TABLE `gift_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gift_recipients`
--

DROP TABLE IF EXISTS `gift_recipients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gift_recipients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `gift_description` varchar(255) DEFAULT NULL,
  `is_delivered` tinyint(1) DEFAULT '0',
  `delivered_date` date DEFAULT NULL,
  `delivered_by` int DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_event_customer` (`event_id`,`customer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gift_recipients`
--

LOCK TABLES `gift_recipients` WRITE;
/*!40000 ALTER TABLE `gift_recipients` DISABLE KEYS */;
INSERT INTO `gift_recipients` VALUES (1,1,11,'iphone',1,'2026-01-12',NULL,NULL,'2026-01-12 15:23:13','2026-01-12 15:23:21'),(2,1,2,'q',0,NULL,NULL,NULL,'2026-01-12 15:57:23','2026-01-12 15:57:23'),(3,1,13,'q',0,NULL,NULL,NULL,'2026-01-12 15:57:23','2026-01-12 15:57:23'),(4,1,14,'q',0,NULL,NULL,NULL,'2026-01-12 15:57:23','2026-01-12 15:57:23'),(5,2,2,'iphone',0,NULL,NULL,NULL,'2026-01-15 08:10:56','2026-01-15 08:10:56'),(6,2,13,'iphone',0,NULL,NULL,NULL,'2026-01-15 08:10:56','2026-01-15 08:10:56'),(7,2,14,'iphone',0,NULL,NULL,NULL,'2026-01-15 08:10:56','2026-01-15 08:10:56'),(8,2,15,'iphone',0,NULL,NULL,NULL,'2026-01-15 08:10:56','2026-01-15 08:10:56'),(9,2,11,'iphone',0,NULL,NULL,NULL,'2026-01-15 08:10:56','2026-01-15 08:10:56'),(10,2,3,'iphone',0,NULL,NULL,NULL,'2026-01-15 08:10:56','2026-01-15 08:10:56'),(11,2,6,'iphone',0,NULL,NULL,NULL,'2026-01-15 08:10:56','2026-01-15 08:10:56'),(12,2,8,'iphone',0,NULL,NULL,NULL,'2026-01-15 08:10:56','2026-01-15 08:10:56'),(13,2,12,'iphone',0,NULL,NULL,NULL,'2026-01-15 08:10:56','2026-01-15 08:10:56'),(14,2,10,'iphone',0,NULL,NULL,NULL,'2026-01-15 08:10:56','2026-01-15 08:10:56'),(15,2,17,'iphone',0,NULL,NULL,NULL,'2026-01-15 08:10:56','2026-01-15 08:10:56'),(16,2,7,'iphone',0,NULL,NULL,NULL,'2026-01-15 08:10:56','2026-01-15 08:10:56'),(17,2,5,'iphone',0,NULL,NULL,NULL,'2026-01-15 08:10:56','2026-01-15 08:10:56'),(18,2,16,'iphone',0,NULL,NULL,NULL,'2026-01-15 08:10:56','2026-01-15 08:10:56'),(19,2,9,'iphone',1,'2026-01-15',NULL,NULL,'2026-01-15 08:10:56','2026-01-15 08:11:11'),(20,2,1,'iphone',0,NULL,NULL,NULL,'2026-01-15 08:10:56','2026-01-15 08:10:56'),(21,2,18,'iphone',0,NULL,NULL,NULL,'2026-01-15 08:10:56','2026-01-15 08:10:56'),(22,2,4,'iphone',1,'2026-01-15',NULL,NULL,'2026-01-15 08:10:56','2026-01-15 08:11:04');
/*!40000 ALTER TABLE `gift_recipients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mason_visits`
--

DROP TABLE IF EXISTS `mason_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mason_visits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mason_id` int NOT NULL,
  `visit_date` date NOT NULL,
  `visit_time` time NOT NULL,
  `items_description` text,
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `rewards` decimal(10,2) NOT NULL DEFAULT '0.00',
  `notes` text,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `mason_id` (`mason_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `mason_visits_ibfk_1` FOREIGN KEY (`mason_id`) REFERENCES `masons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `mason_visits_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mason_visits`
--

LOCK TABLES `mason_visits` WRITE;
/*!40000 ALTER TABLE `mason_visits` DISABLE KEYS */;
INSERT INTO `mason_visits` VALUES (1,1,'2025-01-05','10:30:00','Ceramic Tiles 50 boxes, Tile Adhesive 10 bags',8000.00,80.00,NULL,1,'2026-01-12 12:11:24','2026-01-12 12:11:24'),(2,1,'2025-01-08','14:15:00','Floor Tiles 30 boxes',5000.00,50.00,NULL,1,'2026-01-12 12:11:24','2026-01-12 12:11:24'),(3,1,'2025-01-10','11:00:00','Bath Accessories Set, Wash Basin',12000.00,120.00,NULL,1,'2026-01-12 12:11:24','2026-01-12 12:11:24'),(4,2,'2025-01-03','09:45:00','Kitchen Sink, Kitchen Faucet',15000.00,150.00,NULL,1,'2026-01-12 12:11:24','2026-01-12 12:11:24'),(5,2,'2025-01-06','16:30:00','Parking Tiles 100 boxes',20000.00,200.00,NULL,1,'2026-01-12 12:11:24','2026-01-12 12:11:24'),(6,2,'2025-01-09','12:00:00','Tile Grout 20 bags',7000.00,70.00,NULL,1,'2026-01-12 12:11:24','2026-01-12 12:11:24'),(7,3,'2025-01-07','10:00:00','Elevation Tiles 40 boxes',15000.00,150.00,NULL,1,'2026-01-12 12:11:24','2026-01-12 12:11:24'),(8,4,'2025-01-02','11:30:00','Complete Bath Set',25000.00,250.00,NULL,1,'2026-01-12 12:11:24','2026-01-12 12:11:24'),(9,4,'2025-01-04','15:00:00','Water Closet, Bidet',18000.00,180.00,NULL,1,'2026-01-12 12:11:24','2026-01-12 12:11:24'),(10,4,'2025-01-11','09:00:00','Shower System, Faucets',25000.00,250.00,NULL,1,'2026-01-12 12:11:24','2026-01-12 12:11:24'),(11,5,'2025-01-05','13:45:00','Ceramic Tiles 60 boxes',10000.00,100.00,NULL,1,'2026-01-12 12:11:24','2026-01-12 12:11:24'),(12,5,'2025-01-08','10:30:00','Bath Vanity, Mirror',22000.00,220.00,NULL,1,'2026-01-12 12:11:24','2026-01-12 12:11:24'),(13,6,'2025-01-06','14:00:00','Floor Tiles 40 boxes, Adhesive',18000.00,180.00,NULL,1,'2026-01-12 12:11:24','2026-01-12 12:11:24'),(14,7,'2025-01-03','11:15:00','Kitchen Complete Set',30000.00,300.00,NULL,1,'2026-01-12 12:11:24','2026-01-12 12:11:24'),(15,7,'2025-01-07','16:00:00','Waterproofing Materials',25000.00,250.00,NULL,1,'2026-01-12 12:11:24','2026-01-12 12:11:24'),(16,8,'2025-01-04','10:00:00','Bath Accessories, Tiles',20000.00,200.00,NULL,1,'2026-01-12 12:11:24','2026-01-12 12:11:24'),(17,8,'2025-01-09','14:30:00','Wash Basin Set',18000.00,180.00,NULL,1,'2026-01-12 12:11:24','2026-01-12 12:11:24'),(18,9,'2025-01-08','11:00:00','Ceramic Tiles 25 boxes',12000.00,120.00,NULL,1,'2026-01-12 12:11:24','2026-01-12 12:11:24'),(19,10,'2025-01-02','09:30:00','Complete Bathroom Renovation Set',35000.00,350.00,NULL,1,'2026-01-12 12:11:24','2026-01-12 12:11:24'),(20,10,'2025-01-06','15:45:00','Kitchen Sink, Tiles',27000.00,270.00,NULL,1,'2026-01-12 12:11:24','2026-01-12 12:11:24'),(21,11,'2026-01-12','12:20:00','tiles',100.00,10.00,'na',1,'2026-01-12 12:21:50','2026-01-12 12:21:50'),(22,12,'2026-01-12','13:31:00','tiles',500.00,50.00,'',1,'2026-01-12 13:32:40','2026-01-12 13:32:40'),(23,11,'2026-01-12','14:51:00','washpaction',0.00,20.00,'',1,'2026-01-12 14:52:22','2026-01-12 14:52:22'),(24,11,'2026-01-12','15:19:00','walking',0.00,10.00,'',1,'2026-01-12 15:19:42','2026-01-12 15:19:42'),(25,15,'2026-01-12','15:47:03','Bathroom tiles 3 boxes',0.00,11.00,NULL,1,'2026-01-12 15:57:37','2026-01-12 15:57:37'),(26,16,'2026-01-12','15:59:08','Tiles',0.00,1000.00,NULL,1,'2026-01-12 15:59:19','2026-01-12 15:59:19'),(27,11,'2026-01-12','15:58:16','Reward',0.00,500.00,NULL,1,'2026-01-12 15:59:23','2026-01-12 15:59:23'),(28,11,'2026-01-12','16:00:22','Wall tiles',0.00,33.00,NULL,NULL,'2026-01-12 16:00:41','2026-01-12 16:00:41'),(29,11,'2026-01-15','08:06:00','tiles',0.00,50.00,'',1,'2026-01-15 08:07:13','2026-01-15 08:07:13'),(30,11,'2026-01-15','08:12:40','Tiles',0.00,90.00,NULL,1,'2026-01-15 08:12:56','2026-01-15 08:12:56'),(31,20,'2026-01-15','08:17:07','Tiles',0.00,100.00,NULL,1,'2026-01-15 08:17:22','2026-01-15 08:17:22'),(32,19,'2026-01-15','08:16:47','Hhh',0.00,100.00,NULL,1,'2026-01-15 08:17:26','2026-01-15 08:17:26');
/*!40000 ALTER TABLE `mason_visits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `masons`
--

DROP TABLE IF EXISTS `masons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `masons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `mobile` varchar(15) NOT NULL,
  `address` text,
  `photo` varchar(255) DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `total_visits` int DEFAULT '0',
  `total_amount` decimal(12,2) DEFAULT '0.00',
  `total_rewards` decimal(10,2) DEFAULT '0.00',
  `status` enum('active','inactive') DEFAULT 'active',
  `is_verified` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mobile` (`mobile`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `masons_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `masons`
--

LOCK TABLES `masons` WRITE;
/*!40000 ALTER TABLE `masons` DISABLE KEYS */;
INSERT INTO `masons` VALUES (1,2,'Ramesh Kumar','9876543210','123, Sector 5, Jhotwara, Jaipur','customer_1768470253_9018.png',6,5,25000.00,250.00,'active',1,'2026-01-12 12:11:24','2026-01-15 09:44:13'),(2,3,'Suresh Sharma','9876543211','456, Kalwar Road, Jaipur','demo_customer_2.jpg',1,8,42000.00,420.00,'active',1,'2026-01-12 12:11:24','2026-01-12 16:22:26'),(3,4,'Mahesh Verma','9876543212','789, Ravan Gate, Jaipur','demo_customer_3.jpg',5,3,15000.00,150.00,'active',1,'2026-01-12 12:11:24','2026-01-12 16:22:26'),(4,5,'Dinesh Yadav','9876543213','321, Power House Road, Jaipur','demo_customer_4.jpg',4,12,68000.00,680.00,'active',1,'2026-01-12 12:11:24','2026-01-12 16:22:26'),(5,6,'Rajesh Meena','9876543214','654, Jhotwara Main Road, Jaipur','demo_customer_5.jpg',2,6,32000.00,320.00,'active',1,'2026-01-12 12:11:24','2026-01-12 16:22:26'),(6,7,'Mukesh Singh','9876543215','987, Near Bus Stand, Jaipur','demo_customer_6.jpg',5,4,18000.00,180.00,'active',1,'2026-01-12 12:11:24','2026-01-12 16:22:26'),(7,8,'Lokesh Gupta','9876543216','147, Industrial Area, Jaipur','demo_customer_7.jpg',2,9,55000.00,550.00,'active',1,'2026-01-12 12:11:24','2026-01-12 16:22:26'),(8,9,'Naresh Jain','9876543217','258, Civil Lines, Jaipur','demo_customer_8.jpg',5,7,38000.00,380.00,'active',1,'2026-01-12 12:11:24','2026-01-12 16:22:26'),(9,10,'Ganesh Patel','9876543218','369, Vaishali Nagar, Jaipur','demo_customer_9.jpg',6,2,12000.00,120.00,'active',1,'2026-01-12 12:11:24','2026-01-12 16:22:26'),(10,11,'Hitesh Agarwal','9876543219','741, Mansarovar, Jaipur','demo_customer_10.jpg',2,10,62000.00,620.00,'active',1,'2026-01-12 12:11:24','2026-01-12 16:22:26'),(11,12,'Hari Soni','9782005500','Krishna kunj',NULL,5,7,100.00,713.00,'active',1,'2026-01-12 12:19:49','2026-01-15 08:12:56'),(12,13,'shekhar','9950027920','kalwar road',NULL,5,1,500.00,50.00,'active',1,'2026-01-12 13:31:37','2026-01-12 14:13:37'),(13,15,'Test Customer','9999888877','Test Address, Jaipur',NULL,1,0,0.00,0.00,'active',0,'2026-01-12 15:32:00','2026-01-12 15:32:00'),(14,16,'Test Customer 2','9998887766','Test Address 2, Jaipur',NULL,1,0,0.00,0.00,'active',0,'2026-01-12 15:42:37','2026-01-12 15:42:37'),(15,17,'Test Customer 3','9997776655','Test Address 3, Jaipur',NULL,1,1,0.00,11.00,'active',1,'2026-01-12 15:47:03','2026-01-12 15:57:37'),(16,18,'Satya soni','7792000200','Kalwa road jaipur',NULL,2,1,0.00,1000.00,'active',1,'2026-01-12 15:59:08','2026-01-12 15:59:19'),(17,NULL,'kartik','97964643168','bababa',NULL,2,0,0.00,0.00,'active',1,'2026-01-12 18:27:13','2026-01-12 18:27:13'),(18,20,'XYZ','9878886868','na',NULL,6,0,0.00,0.00,'active',1,'2026-01-15 07:58:34','2026-01-15 07:58:34'),(19,21,'Rr','9950027921','9 dk',NULL,6,1,0.00,100.00,'active',1,'2026-01-15 08:16:47','2026-01-15 08:17:26'),(20,22,'Ramesh chand','7878787878','Kalwar road','customer_1768470333_6255.png',6,1,0.00,100.00,'active',1,'2026-01-15 08:17:07','2026-01-15 09:45:33'),(21,24,'Test1','7894577442','Testing','customer_1768470583_6199.jpg',3,0,0.00,0.00,'active',0,'2026-01-15 09:49:43','2026-01-15 09:49:43'),(22,25,'Hari soni','9481542155','190A Krishna kunj kalwar road jaipur','customer_1768471019_8280.jpg',1,0,0.00,0.00,'active',0,'2026-01-15 09:56:59','2026-01-15 09:56:59'),(23,26,'Test 83','8383838383','Testing','customer_1768480289_5386.jpg',5,0,0.00,0.00,'active',0,'2026-01-15 12:31:29','2026-01-15 12:31:29');
/*!40000 ALTER TABLE `masons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meeting_attendees`
--

DROP TABLE IF EXISTS `meeting_attendees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_attendees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `meeting_id` int NOT NULL,
  `mason_id` int NOT NULL,
  `attended_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_attendance` (`meeting_id`,`mason_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting_attendees`
--

LOCK TABLES `meeting_attendees` WRITE;
/*!40000 ALTER TABLE `meeting_attendees` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting_attendees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meeting_invites`
--

DROP TABLE IF EXISTS `meeting_invites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_invites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `meeting_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `invite_sent` tinyint(1) DEFAULT '0',
  `attended` tinyint(1) DEFAULT '0',
  `attendance_time` timestamp NULL DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_meeting_customer` (`meeting_id`,`customer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting_invites`
--

LOCK TABLES `meeting_invites` WRITE;
/*!40000 ALTER TABLE `meeting_invites` DISABLE KEYS */;
INSERT INTO `meeting_invites` VALUES (1,4,4,0,1,'2026-01-12 15:20:55',NULL,'2026-01-12 15:20:37'),(2,4,11,0,1,'2026-01-12 15:56:35',NULL,'2026-01-12 15:56:35'),(3,5,2,0,1,'2026-01-15 08:10:02',NULL,'2026-01-15 08:09:44'),(4,5,13,0,1,'2026-01-15 08:10:05',NULL,'2026-01-15 08:09:44'),(5,5,14,0,0,NULL,NULL,'2026-01-15 08:09:44'),(6,5,15,0,0,NULL,NULL,'2026-01-15 08:09:44');
/*!40000 ALTER TABLE `meeting_invites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meetings`
--

DROP TABLE IF EXISTS `meetings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meetings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text,
  `meeting_date` date NOT NULL,
  `meeting_time` time DEFAULT NULL,
  `venue` varchar(255) DEFAULT NULL,
  `status` enum('upcoming','ongoing','completed','cancelled') DEFAULT 'upcoming',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meetings`
--

LOCK TABLES `meetings` WRITE;
/*!40000 ALTER TABLE `meetings` DISABLE KEYS */;
INSERT INTO `meetings` VALUES (4,'test','test','2026-01-20','22:52:00','Kalwar road','upcoming',1,'2026-01-12 15:20:37','2026-01-12 15:20:37'),(5,'26 Jan metting','milne ke liye','2026-01-26','10:00:00','Kalwar road','upcoming',1,'2026-01-15 08:09:44','2026-01-15 08:09:44');
/*!40000 ALTER TABLE `meetings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offers`
--

DROP TABLE IF EXISTS `offers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text,
  `image` varchar(255) DEFAULT NULL,
  `min_rewards` decimal(10,2) DEFAULT '0.00',
  `prize_description` text,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_visible` tinyint(1) DEFAULT '1',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offers`
--

LOCK TABLES `offers` WRITE;
/*!40000 ALTER TABLE `offers` DISABLE KEYS */;
INSERT INTO `offers` VALUES (1,'Top Performer Reward - January 2025','Mason with highest rewards points this month wins exciting prizes!',NULL,500.00,'Winner gets a brand new smartphone and certificate of appreciation','2025-01-01','2025-01-31',1,'active','2026-01-12 12:11:24','2026-01-12 12:11:24');
/*!40000 ALTER TABLE `offers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `page_content`
--

DROP TABLE IF EXISTS `page_content`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `page_content` (
  `id` int NOT NULL AUTO_INCREMENT,
  `page_slug` varchar(50) NOT NULL,
  `page_title` varchar(255) DEFAULT NULL,
  `page_subtitle` varchar(500) DEFAULT NULL,
  `content` text,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` text,
  `meta_keywords` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `page_slug` (`page_slug`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `page_content`
--

LOCK TABLES `page_content` WRITE;
/*!40000 ALTER TABLE `page_content` DISABLE KEYS */;
INSERT INTO `page_content` VALUES (1,'about','About Us','Know more about JP Tiles - Your trusted partner for premium tiles','JP Tiles has been a leading name in the tiles and bathroom fittings industry for over a decade. We are committed to providing our customers with the highest quality products at competitive prices.\n\nOur extensive range includes floor tiles, wall tiles, bathroom fittings, kitchen accessories, and tile chemicals from top brands.',NULL,NULL,NULL,'2026-01-15 14:36:26','2026-01-15 14:36:26'),(2,'contact','Contact Us','Get in touch with us for any queries','We would love to hear from you. Visit our showroom or contact us through phone, email, or the form below.',NULL,NULL,NULL,'2026-01-15 14:36:26','2026-01-15 14:36:26'),(3,'enquiry','Business Enquiry','Partner with us for your business needs','Interested in becoming a dealer or bulk buyer? Fill out the form below and our team will get back to you.',NULL,NULL,NULL,'2026-01-15 14:36:26','2026-01-15 14:36:26');
/*!40000 ALTER TABLE `page_content` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pending_visits`
--

DROP TABLE IF EXISTS `pending_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pending_visits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `customer_name` varchar(100) DEFAULT NULL,
  `customer_mobile` varchar(15) NOT NULL,
  `customer_address` text,
  `category_id` int DEFAULT NULL,
  `items_description` text,
  `visit_date` date NOT NULL,
  `visit_time` time NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` int DEFAULT NULL,
  `rewards` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pending_visits`
--

LOCK TABLES `pending_visits` WRITE;
/*!40000 ALTER TABLE `pending_visits` DISABLE KEYS */;
INSERT INTO `pending_visits` VALUES (8,21,NULL,'7894577442',NULL,NULL,'Nanana','2026-01-15','09:49:43','pending',NULL,0.00,'2026-01-15 09:49:43','2026-01-15 09:49:43'),(9,22,NULL,'9481542155',NULL,NULL,'Hshabb','2026-01-15','09:56:59','pending',NULL,0.00,'2026-01-15 09:56:59','2026-01-15 09:56:59'),(10,23,NULL,'8383838383',NULL,NULL,'No','2026-01-15','12:31:29','pending',NULL,0.00,'2026-01-15 12:31:29','2026-01-15 12:31:29');
/*!40000 ALTER TABLE `pending_visits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `description` text,
  `image` varchar(255) DEFAULT NULL,
  `gallery` text,
  `price` decimal(10,2) DEFAULT '0.00',
  `sort_order` int DEFAULT '0',
  `status` enum('active','inactive') DEFAULT 'active',
  `is_featured` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,5,'Designer Ceramic Wall Tile','designer-ceramic-wall-tile','Beautiful designer ceramic wall tile with modern patterns','https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=400&h=400&fit=crop',NULL,0.00,1,'active',0,'2026-01-12 12:11:24','2026-01-12 12:28:46'),(2,5,'Classic Ceramic Floor Tile','classic-ceramic-floor-tile','Classic ceramic floor tile with elegant finish','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=400&fit=crop',NULL,0.00,2,'active',0,'2026-01-12 12:11:24','2026-01-12 12:28:46'),(3,5,'Modern Ceramic Tile','modern-ceramic-tile','Modern ceramic tile for contemporary spaces','https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400&h=400&fit=crop',NULL,0.00,3,'active',0,'2026-01-12 12:11:24','2026-01-12 12:28:46'),(4,5,'Premium Ceramic Tile','premium-ceramic-tile','Premium quality ceramic tile','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=400&fit=crop',NULL,0.00,4,'active',0,'2026-01-12 12:11:24','2026-01-12 12:28:46'),(5,6,'Wooden Finish Floor Tile','wooden-finish-floor-tile','Floor tile with wooden finish','https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=400&h=400&fit=crop',NULL,0.00,1,'active',0,'2026-01-12 12:11:24','2026-01-12 12:28:46'),(6,6,'Marble Look Floor Tile','marble-look-floor-tile','Floor tile with marble look','https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=400&fit=crop',NULL,0.00,2,'active',0,'2026-01-12 12:11:24','2026-01-12 12:28:46'),(7,9,'Modern Bath Vanity','modern-bath-vanity','Modern bath vanity with storage','https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=400&fit=crop',NULL,0.00,1,'active',0,'2026-01-12 12:11:24','2026-01-12 12:28:46'),(8,10,'LED Bath Mirror','led-bath-mirror','LED illuminated bath mirror','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=400&fit=crop',NULL,0.00,1,'active',0,'2026-01-12 12:11:24','2026-01-12 12:28:46'),(9,12,'Premium Wash Basin','premium-wash-basin','Premium quality wash basin','https://images.unsplash.com/photo-1620626011761-996317b8d101?w=400&h=400&fit=crop',NULL,0.00,1,'active',0,'2026-01-12 12:11:24','2026-01-12 12:28:46'),(10,16,'Stainless Steel Kitchen Sink','stainless-steel-kitchen-sink','Durable stainless steel kitchen sink','https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',NULL,0.00,1,'active',0,'2026-01-12 12:11:24','2026-01-12 12:28:46'),(11,9,'Modern White Bath Vanity','modern-white-bath-vanity','Elegant white bath vanity with marble countertop and ample storage space','https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600',NULL,25000.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(12,9,'Wooden Bath Vanity Set','wooden-bath-vanity-set','Premium wooden vanity with integrated sink and mirror','https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600',NULL,35000.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(13,9,'Wall Mounted Vanity Cabinet','wall-mounted-vanity-cabinet','Space-saving wall mounted vanity with soft-close drawers','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600',NULL,18000.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(14,9,'Double Sink Vanity Unit','double-sink-vanity-unit','Luxurious double sink vanity perfect for master bathrooms','https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600',NULL,45000.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(15,10,'LED Backlit Bath Mirror','led-backlit-bath-mirror','Modern LED mirror with touch sensor and anti-fog feature','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600',NULL,8500.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(16,10,'Round Decorative Mirror','round-decorative-mirror','Elegant round mirror with gold frame accent','https://images.unsplash.com/photo-1618220179428-22790b461013?w=600',NULL,5500.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(17,10,'Frameless Wall Mirror','frameless-wall-mirror','Sleek frameless mirror with beveled edges','https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600',NULL,4500.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(18,12,'Premium Ceramic Wash Basin','premium-ceramic-wash-basin','High-quality ceramic basin with smooth finish','https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600',NULL,6500.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(19,12,'Countertop Vessel Basin','countertop-vessel-basin','Modern vessel style basin for countertop installation','https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600',NULL,8000.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(20,12,'Wall Hung Wash Basin','wall-hung-wash-basin','Space-saving wall mounted wash basin','https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600',NULL,5500.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(21,12,'Pedestal Wash Basin','pedestal-wash-basin','Classic pedestal basin with elegant design','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600',NULL,7500.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(22,13,'One Piece Western Toilet','one-piece-western-toilet','Modern one-piece toilet with soft close seat','https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=600',NULL,15000.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(23,13,'Wall Hung Toilet','wall-hung-toilet','Contemporary wall hung toilet with concealed tank','https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?w=600',NULL,22000.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(24,13,'Smart Bidet Toilet','smart-bidet-toilet','Advanced smart toilet with bidet and heated seat','https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600',NULL,45000.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(25,14,'Single Lever Basin Mixer','single-lever-basin-mixer','Chrome finish single lever mixer tap','https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=600',NULL,3500.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(26,14,'Waterfall Basin Faucet','waterfall-basin-faucet','Elegant waterfall style faucet in matte black','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600',NULL,5500.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(27,14,'Sensor Automatic Faucet','sensor-automatic-faucet','Touchless sensor faucet for hygiene','https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600',NULL,8500.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(28,15,'Rain Shower Head Set','rain-shower-head-set','Luxury rain shower with handheld combo','https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600',NULL,12000.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(29,15,'Thermostatic Shower Panel','thermostatic-shower-panel','Full body shower panel with jets','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600',NULL,25000.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(30,15,'Hand Shower with Hose','hand-shower-with-hose','Multi-function hand shower set','https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600',NULL,3500.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(31,5,'Designer Ceramic Wall Tile','designer-ceramic-wall-tile-new','Premium ceramic tiles with modern patterns','https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=600',NULL,85.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(32,5,'Glossy White Ceramic Tile','glossy-white-ceramic-tile','Classic white glossy tiles for walls','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',NULL,65.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(33,5,'Patterned Ceramic Tile','patterned-ceramic-tile','Beautiful patterned tiles for accent walls','https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600',NULL,120.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(34,5,'Matt Finish Ceramic Tile','matt-finish-ceramic-tile','Elegant matt finish ceramic tiles','https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600',NULL,75.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(35,6,'Wooden Finish Floor Tile','wooden-finish-floor-tile-new','Wood look porcelain floor tiles','https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600',NULL,95.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(36,6,'Marble Look Floor Tile','marble-look-floor-tile-new','Luxurious marble effect floor tiles','https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600',NULL,150.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(37,6,'Anti-Skid Floor Tile','anti-skid-floor-tile','Safety anti-skid tiles for wet areas','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',NULL,110.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(38,6,'Large Format Floor Tile','large-format-floor-tile','60x120cm large format porcelain tiles','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600',NULL,180.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(39,7,'Heavy Duty Parking Tile','heavy-duty-parking-tile','Industrial grade parking tiles','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',NULL,55.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(40,7,'Checkered Parking Tile','checkered-parking-tile','Classic checkered pattern parking tiles','https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600',NULL,45.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(41,7,'Textured Parking Tile','textured-parking-tile','Non-slip textured parking tiles','https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600',NULL,50.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(42,8,'Stone Look Elevation Tile','stone-look-elevation-tile','Natural stone effect exterior tiles','https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600',NULL,130.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(43,8,'Brick Pattern Elevation Tile','brick-pattern-elevation-tile','Classic brick look elevation tiles','https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600',NULL,95.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(44,8,'3D Elevation Tile','3d-elevation-tile','Modern 3D textured elevation tiles','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600',NULL,160.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(45,16,'Stainless Steel Kitchen Sink','stainless-steel-kitchen-sink-new','Premium 304 grade stainless steel sink','https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',NULL,8500.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(46,16,'Double Bowl Kitchen Sink','double-bowl-kitchen-sink','Spacious double bowl sink with drainer','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',NULL,12000.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(47,16,'Granite Composite Sink','granite-composite-sink','Durable granite composite kitchen sink','https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600',NULL,15000.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(48,16,'Undermount Kitchen Sink','undermount-kitchen-sink','Sleek undermount installation sink','https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600',NULL,9500.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(49,17,'Pull Down Kitchen Faucet','pull-down-kitchen-faucet','Modern pull-down spray kitchen faucet','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600',NULL,6500.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(50,17,'Single Handle Kitchen Tap','single-handle-kitchen-tap','Classic single handle kitchen mixer','https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600',NULL,3500.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(51,17,'Wall Mount Kitchen Faucet','wall-mount-kitchen-faucet','Space-saving wall mounted kitchen tap','https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600',NULL,4500.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(52,18,'Kitchen Dish Drainer','kitchen-dish-drainer','Stainless steel dish drying rack','https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',NULL,2500.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(53,18,'Soap Dispenser','kitchen-soap-dispenser','Built-in soap dispenser for sink','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',NULL,1200.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(54,18,'Kitchen Waste Bin','kitchen-waste-bin','Under-counter waste bin system','https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600',NULL,3500.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(55,19,'Premium Tile Adhesive 20kg','premium-tile-adhesive-20kg','High-strength tile adhesive for all surfaces','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',NULL,650.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(56,19,'Flexible Tile Adhesive','flexible-tile-adhesive','Polymer modified flexible adhesive','https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600',NULL,850.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(57,19,'Rapid Set Adhesive','rapid-set-adhesive','Quick setting tile adhesive','https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600',NULL,750.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(58,20,'Epoxy Tile Grout','epoxy-tile-grout','Waterproof epoxy grout for wet areas','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600',NULL,1200.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(59,20,'Colored Tile Grout','colored-tile-grout','Available in multiple colors','https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600',NULL,450.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(60,20,'Anti-Fungal Grout','anti-fungal-grout','Mold resistant bathroom grout','https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600',NULL,550.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(61,21,'Liquid Waterproofing Membrane','liquid-waterproofing-membrane','Ready to use liquid waterproofing','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',NULL,2500.00,0,'active',1,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(62,21,'Waterproof Coating 20L','waterproof-coating-20l','Acrylic waterproof coating for terraces','https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600',NULL,3500.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30'),(63,21,'Crack Filler Compound','crack-filler-compound','Flexible crack filling solution','https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600',NULL,850.00,0,'active',0,'2026-01-15 16:20:30','2026-01-15 16:20:30');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reward_winners`
--

DROP TABLE IF EXISTS `reward_winners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reward_winners` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mason_id` int NOT NULL,
  `offer_id` int DEFAULT NULL,
  `prize_given` varchar(200) DEFAULT NULL,
  `prize_date` date DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `mason_id` (`mason_id`),
  KEY `offer_id` (`offer_id`),
  CONSTRAINT `reward_winners_ibfk_1` FOREIGN KEY (`mason_id`) REFERENCES `masons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reward_winners_ibfk_2` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reward_winners`
--

LOCK TABLES `reward_winners` WRITE;
/*!40000 ALTER TABLE `reward_winners` DISABLE KEYS */;
INSERT INTO `reward_winners` VALUES (1,11,1,'Iphone','2026-01-12','Iphone given','2026-01-12 12:25:06');
/*!40000 ALTER TABLE `reward_winners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'site_name','JP Tiles','2026-01-12 12:11:24','2026-01-12 12:11:24'),(2,'site_tagline','#1 Trusted Brand Since 2013','2026-01-12 12:11:24','2026-01-12 12:11:24'),(3,'site_description','Your Destination for luxury sanitary ware & accessories. Discover premium sanitaryware solutions with J.P. Tiles Sanitaryware — where quality meets elegance for your dream spaces.','2026-01-12 12:11:24','2026-01-12 12:11:24'),(4,'phone_1','+91 9828290049','2026-01-12 12:11:24','2026-01-12 12:11:24'),(5,'phone_2','+91 9828290055','2026-01-12 12:11:24','2026-01-12 12:11:24'),(6,'email','jptiles13@gmail.com','2026-01-12 12:11:24','2026-01-12 12:11:24'),(7,'address','Shop No. 40, Ravan Gate, Opp. Power House Kalwar Road, Jhotwara, Jaipur- 302012','2026-01-12 12:11:24','2026-01-12 12:11:24'),(8,'facebook','https://www.facebook.com/share/1BYJpMbwKp/','2026-01-12 12:11:24','2026-01-12 12:11:24'),(9,'instagram','https://www.instagram.com/jptilesjaipur/','2026-01-12 12:11:24','2026-01-12 12:11:24'),(10,'whatsapp','919828290049','2026-01-12 12:11:24','2026-01-12 12:11:24'),(11,'logo','https://jptiles.in/assets/images/logo.webp','2026-01-12 12:11:24','2026-01-12 12:42:04'),(12,'rewards_rate','1','2026-01-12 12:11:24','2026-01-12 12:11:24'),(13,'offer_visible','1','2026-01-12 12:11:24','2026-01-12 12:11:24'),(14,'sms_api_url','','2026-01-12 14:13:37','2026-01-12 14:13:37'),(15,'sms_api_key','','2026-01-12 14:13:37','2026-01-12 14:13:37'),(16,'sms_sender_id','','2026-01-12 14:13:37','2026-01-12 14:13:37'),(17,'sms_dlt_entity_id','','2026-01-12 14:13:37','2026-01-12 14:13:37'),(18,'sms_enabled','0','2026-01-12 14:13:37','2026-01-12 14:13:37'),(24,'youtube_url','','2026-01-15 14:36:42','2026-01-15 14:36:42'),(25,'twitter_url','','2026-01-15 14:36:42','2026-01-15 14:36:42'),(26,'linkedin_url','','2026-01-15 14:36:42','2026-01-15 14:36:42'),(27,'google_maps_embed','<iframe src=\"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3557.8876!2d75.7471!3d26.9124!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjbCsDU0JzQ0LjYiTiA3NcKwNDQnNDkuNiJF!5e0!3m2!1sen!2sin!4v1234567890\" width=\"100%\" height=\"450\" style=\"border:0;\" allowfullscreen=\"\" loading=\"lazy\"></iframe>','2026-01-15 14:36:42','2026-01-15 14:36:42'),(28,'copyright_text','© 2026 JP Tiles. All Rights Reserved.','2026-01-15 14:36:42','2026-01-15 14:36:42'),(29,'meta_title','JP Tiles - Premium Tiles & Sanitaryware in Jaipur','2026-01-15 14:36:42','2026-01-15 14:36:42'),(30,'meta_description','JP Tiles offers premium quality tiles, bathroom fittings, kitchen accessories and tile chemicals in Jaipur. Visit our showroom for the best deals.','2026-01-15 14:36:42','2026-01-15 14:36:42'),(31,'meta_keywords','tiles jaipur, bathroom fittings, sanitaryware, kitchen accessories, tile chemical, floor tiles, wall tiles','2026-01-15 14:36:42','2026-01-15 14:36:42'),(32,'admin_password','password','2026-01-15 14:36:42','2026-01-15 14:36:42'),(33,'footer_description','Discover premium sanitaryware solutions with J.P. Tiles Sanitaryware — where quality meets elegance for your dream spaces.','2026-01-15 14:36:42','2026-01-15 14:36:42');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sliders`
--

DROP TABLE IF EXISTS `sliders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sliders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) DEFAULT NULL,
  `subtitle` text,
  `image` varchar(255) NOT NULL,
  `link` varchar(255) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sliders`
--

LOCK TABLES `sliders` WRITE;
/*!40000 ALTER TABLE `sliders` DISABLE KEYS */;
INSERT INTO `sliders` VALUES (1,'Bath Accessories','Enhance your bathroom elegance with our stylish and functional bath accessories.','assets/images/slider-1.png',NULL,1,'active','2026-01-12 12:11:24'),(2,'Bath Vanity','Enhance your bathroom elegance with our stylish and functional bath vanities.','assets/images/slider-2.png',NULL,2,'active','2026-01-12 12:11:24'),(3,'Kitchen Solutions','Upgrade your kitchen with our high-performance solutions.','assets/images/slider-1.png',NULL,3,'active','2026-01-12 12:11:24'),(4,'Ceramic Tiles','Add a touch of sophistication to your home with our ceramic tiles.','assets/images/slider-2.png',NULL,4,'active','2026-01-12 12:11:24');
/*!40000 ALTER TABLE `sliders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_logs`
--

DROP TABLE IF EXISTS `sms_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `mobile` varchar(15) NOT NULL,
  `message` text NOT NULL,
  `template_id` varchar(100) DEFAULT NULL,
  `status` enum('sent','failed','pending') DEFAULT 'pending',
  `response` text,
  `sent_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_logs`
--

LOCK TABLES `sms_logs` WRITE;
/*!40000 ALTER TABLE `sms_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `sms_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_templates`
--

DROP TABLE IF EXISTS `sms_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `template_id` varchar(100) DEFAULT NULL,
  `content` text NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_templates`
--

LOCK TABLES `sms_templates` WRITE;
/*!40000 ALTER TABLE `sms_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `sms_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stats`
--

DROP TABLE IF EXISTS `stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `number` varchar(50) NOT NULL,
  `label` varchar(255) NOT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stats`
--

LOCK TABLES `stats` WRITE;
/*!40000 ALTER TABLE `stats` DISABLE KEYS */;
INSERT INTO `stats` VALUES (1,'12+','Years Experience',1,1,'2026-01-15 14:36:26'),(2,'10,000+','Happy Customers',2,1,'2026-01-15 14:36:26'),(3,'5,000+','Products',3,1,'2026-01-15 14:36:26'),(4,'500+','Partners',4,1,'2026-01-15 14:36:26');
/*!40000 ALTER TABLE `stats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `mobile` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','mason','employee') NOT NULL DEFAULT 'mason',
  `permissions` text,
  `address` text,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mobile` (`mobile`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin','9828290049','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin',NULL,NULL,'active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(2,'Ramesh Kumar','9876543210','$2y$10$jg7dvjbDfNXwO4cnOXd7Eei/AOQnEDXaBsV0uPuy32fsJ1HsttP8m','mason',NULL,'123, Sector 5, Jhotwara, Jaipur','active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(3,'Suresh Sharma','9876543211','$2y$10$jg7dvjbDfNXwO4cnOXd7Eei/AOQnEDXaBsV0uPuy32fsJ1HsttP8m','mason',NULL,'456, Kalwar Road, Jaipur','active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(4,'Mahesh Verma','9876543212','$2y$10$jg7dvjbDfNXwO4cnOXd7Eei/AOQnEDXaBsV0uPuy32fsJ1HsttP8m','mason',NULL,'789, Ravan Gate, Jaipur','active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(5,'Dinesh Yadav','9876543213','$2y$10$jg7dvjbDfNXwO4cnOXd7Eei/AOQnEDXaBsV0uPuy32fsJ1HsttP8m','mason',NULL,'321, Power House Road, Jaipur','active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(6,'Rajesh Meena','9876543214','$2y$10$jg7dvjbDfNXwO4cnOXd7Eei/AOQnEDXaBsV0uPuy32fsJ1HsttP8m','mason',NULL,'654, Jhotwara Main Road, Jaipur','active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(7,'Mukesh Singh','9876543215','$2y$10$jg7dvjbDfNXwO4cnOXd7Eei/AOQnEDXaBsV0uPuy32fsJ1HsttP8m','mason',NULL,'987, Near Bus Stand, Jaipur','active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(8,'Lokesh Gupta','9876543216','$2y$10$jg7dvjbDfNXwO4cnOXd7Eei/AOQnEDXaBsV0uPuy32fsJ1HsttP8m','mason',NULL,'147, Industrial Area, Jaipur','active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(9,'Naresh Jain','9876543217','$2y$10$jg7dvjbDfNXwO4cnOXd7Eei/AOQnEDXaBsV0uPuy32fsJ1HsttP8m','mason',NULL,'258, Civil Lines, Jaipur','active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(10,'Ganesh Patel','9876543218','$2y$10$jg7dvjbDfNXwO4cnOXd7Eei/AOQnEDXaBsV0uPuy32fsJ1HsttP8m','mason',NULL,'369, Vaishali Nagar, Jaipur','active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(11,'Hitesh Agarwal','9876543219','$2y$10$jg7dvjbDfNXwO4cnOXd7Eei/AOQnEDXaBsV0uPuy32fsJ1HsttP8m','mason',NULL,'741, Mansarovar, Jaipur','active','2026-01-12 12:11:24','2026-01-12 12:11:24'),(12,'Hari Soni','9782005500','$2y$10$UGP71oXrH4LgEjtSow9IxuMlLu3WGge475p5J3xswSwgDQGB8k7jS','mason',NULL,'Krishna kunj','active','2026-01-12 12:19:49','2026-01-12 12:19:55'),(13,'shekhar','9950027920','$2y$10$Zc437w.MHZCfK70TOCJS9OGBs2E9vRRcCJq7IWe6nDwGiXpSjmCaa','mason',NULL,'kalwar road','active','2026-01-12 13:31:37','2026-01-12 13:31:37'),(15,'Test Customer','9999888877','$2y$10$6p/f/M5FUf.HpTJFPl2wzOgC9md2NpVByxI78OTtyTu2X/Dyw5aNq','mason',NULL,'Test Address, Jaipur','active','2026-01-12 15:32:00','2026-01-12 15:32:00'),(16,'Test Customer 2','9998887766','$2y$10$uqcFvg9Oy4WIQjCLCoJtJuYCrlSX7q1DCQvrH08IzpOiU41HTCW.y','mason',NULL,'Test Address 2, Jaipur','active','2026-01-12 15:42:37','2026-01-12 15:42:37'),(17,'Test Customer 3','9997776655','$2y$10$FlYsknniZ1ZGkGrvTbCWI.rtDo6BCWFrB71ESnytEGmKxs2dXCJZi','mason',NULL,'Test Address 3, Jaipur','active','2026-01-12 15:47:03','2026-01-12 15:47:03'),(18,'Satya soni','7792000200','$2y$10$GMJc8JMy/D1GpblVqv0SDuo1IujFIVwHHYyASPKbblf0IZpvrVPaW','mason',NULL,'Kalwa road jaipur','active','2026-01-12 15:59:08','2026-01-12 15:59:08'),(19,'Employee 1','9999999999','$2y$10$2hUtLP7G/QboIpqGRh3ZIuEcCB2zxr47/GtsEavO67.BLF1rRE0b6','employee','[\"add_customer\",\"add_visit\",\"approve_visits\"]',NULL,'active','2026-01-12 16:05:13','2026-01-12 16:05:13'),(20,'XYZ','9878886868','$2y$10$JxB/nFHjaNVcsBgYDZ6jZeNbd1A/NMcDzGDQRLxOjMViB.aokUw2y','mason',NULL,'na','active','2026-01-15 07:58:34','2026-01-15 07:58:34'),(21,'Rr','9950027921','$2y$10$5RyXLdQoQGG.NKknUrxwQ.VNcSHCvPaB9kfih/8F/yuI/Ac4Az.tm','mason',NULL,'9 dk','active','2026-01-15 08:16:47','2026-01-15 08:16:47'),(22,'Ramesh chand','7878787878','$2y$10$ZJkSkfibAr37p3yEqDWGOOI8zmVbUi7RvEEMKjqZZAdWVn8sRtv5S','mason',NULL,'Kalwar road','active','2026-01-15 08:17:07','2026-01-15 08:17:07'),(23,'Hari','9799010040','$2y$10$U5rgfu5Z309jRtQkWOgnhuET8.K0obRG28ZuA7R0rIiHuAPHVYml2','employee','[\"add_customer\",\"add_visit\",\"approve_visits\",\"view_customers\",\"view_reports\"]',NULL,'active','2026-01-15 08:28:05','2026-01-15 08:29:40'),(24,'Test1','7894577442','$2y$10$q84SnYwjRO56i4Hg9DfXb.iwdh66cBAWWke7a378zg/56LNpD728K','mason',NULL,'Testing','active','2026-01-15 09:49:43','2026-01-15 09:49:43'),(25,'Hari soni','9481542155','$2y$10$4.MpNLqUaDRDx2LhCa4YPO8AAFT3U8CLfZ9A707XRRXBYoDIQReYK','mason',NULL,'190A Krishna kunj kalwar road jaipur','active','2026-01-15 09:56:59','2026-01-15 09:56:59'),(26,'Test 83','8383838383','$2y$10$Iumz/nOye5eg/PBWcqOvYO1SXkSjLRfwgsypAsb1jJI3n0x66Edhm','mason',NULL,'Testing','active','2026-01-15 12:31:29','2026-01-15 12:31:29');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `winner_photos`
--

DROP TABLE IF EXISTS `winner_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `winner_photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `winner_id` int NOT NULL,
  `photo_path` varchar(255) NOT NULL,
  `caption` varchar(200) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `winner_id` (`winner_id`),
  CONSTRAINT `winner_photos_ibfk_1` FOREIGN KEY (`winner_id`) REFERENCES `reward_winners` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `winner_photos`
--

LOCK TABLES `winner_photos` WRITE;
/*!40000 ALTER TABLE `winner_photos` DISABLE KEYS */;
/*!40000 ALTER TABLE `winner_photos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-15 17:14:29
