CREATE DATABASE fixbit;
USE fixbit;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(100),
  role ENUM('user','shop'),
  latitude FLOAT,
  longitude FLOAT
);

CREATE TABLE requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  description TEXT,
  image VARCHAR(255),
  latitude FLOAT,
  longitude FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT,
  shop_id INT,
  price INT,
  message TEXT
);