DROP DATABASE IF EXISTS fixbit;
CREATE DATABASE fixbit;
USE fixbit;

-- USERS TABLE
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120),
  email VARCHAR(150) UNIQUE,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user','shop') NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- REQUESTS TABLE (FINAL FIXED)
CREATE TABLE requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  brand VARCHAR(100),
  model VARCHAR(100),
  issue_type VARCHAR(100),   -- matches backend
  description TEXT,          -- matches backend
  image VARCHAR(255),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  radius INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- RESPONSES TABLE (FINAL FIXED)
CREATE TABLE responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT,
  shop_id INT,
  message TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_quote (request_id, shop_id),
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
  FOREIGN KEY (shop_id) REFERENCES users(id) ON DELETE CASCADE
);