-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS chat_backend;
USE chat_backend;

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create the messages table
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  text TEXT NOT NULL,
  time BIGINT NOT NULL,
  parent_message_id INT DEFAULT NULL,
  forwarded TINYINT(1) DEFAULT 0,
  image_url TEXT DEFAULT NULL,
  file_url TEXT DEFAULT NULL,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id),
  FOREIGN KEY (parent_message_id) REFERENCES messages(id)
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  creator_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create group_messages table
CREATE TABLE IF NOT EXISTS group_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  sender_id INT NOT NULL,
  text TEXT,
  time BIGINT NOT NULL,
  parent_message_id INT DEFAULT NULL,
  forwarded TINYINT(1) DEFAULT 0,
  image_url TEXT DEFAULT NULL,
  file_url TEXT DEFAULT NULL,
  FOREIGN KEY (group_id) REFERENCES groups(id),
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (parent_message_id) REFERENCES group_messages(id)
);