-- ================================================================
--  FixBit v2 — Database Schema
--  Upgrades: status lifecycle, accept system, reviews, messages,
--            indexes for performance
-- ================================================================

DROP DATABASE IF EXISTS fixbit;
CREATE DATABASE fixbit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fixbit;

-- ──────────────────────────────────────────────────────────────
--  USERS  (both customers and shops share this table via role)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120),
  email       VARCHAR(150),
  phone       VARCHAR(20)  NOT NULL,
  password    VARCHAR(255) NOT NULL,   -- bcrypt hash
  role        ENUM('user','shop') NOT NULL,
  latitude    DECIMAL(10,7),
  longitude   DECIMAL(10,7),
  avg_rating  DECIMAL(3,2) DEFAULT NULL,  -- cached average, updated on each review
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_phone (phone),
  UNIQUE KEY uniq_email (email)   -- NULL values are not considered duplicates in MySQL
);

-- ──────────────────────────────────────────────────────────────
--  REQUESTS  (repair jobs posted by users)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE requests (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  brand            VARCHAR(100),
  model            VARCHAR(100),
  issue_type       VARCHAR(100),
  description      TEXT,
  image            VARCHAR(255),
  latitude         DECIMAL(10,7),
  longitude        DECIMAL(10,7),
  radius           INT DEFAULT 10,
  -- lifecycle
  status           ENUM('pending','accepted','in_progress','completed','cancelled')
                   DEFAULT 'pending',
  accepted_shop_id INT DEFAULT NULL,   -- which shop the user accepted
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (accepted_shop_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id    (user_id),
  INDEX idx_status     (status),
  INDEX idx_location   (latitude, longitude)
);

-- ──────────────────────────────────────────────────────────────
--  RESPONSES  (quotes sent by shops)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE responses (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  request_id  INT NOT NULL,
  shop_id     INT NOT NULL,
  message     TEXT,
  price       DECIMAL(10,2) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_quote (request_id, shop_id),
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
  FOREIGN KEY (shop_id)    REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_request_id (request_id),
  INDEX idx_shop_id    (shop_id)
);

-- ──────────────────────────────────────────────────────────────
--  REVIEWS  (user rates shop after job completion)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  request_id  INT NOT NULL,
  user_id     INT NOT NULL,
  shop_id     INT NOT NULL,
  rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_review (request_id, user_id),  -- one review per request
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (shop_id)    REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_shop_id (shop_id)
);

-- ──────────────────────────────────────────────────────────────
--  MESSAGES  (basic in-app chat per request)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE messages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  request_id  INT NOT NULL,
  sender_id   INT NOT NULL,
  receiver_id INT NOT NULL,
  body        TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id)  REFERENCES requests(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id)   REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_request_id  (request_id),
  INDEX idx_sender_id   (sender_id),
  INDEX idx_receiver_id (receiver_id)
);
