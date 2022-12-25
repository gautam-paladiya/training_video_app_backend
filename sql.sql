-- create database training
CREATE DATABASE training;

-- select database
\c training;
DROP table videos;
DROP table users;
-- create user table
CREATE TABLE users(
    id BIGSERIAL NOT NULL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(50),
    can_download BOOLEAN DEFAULT false
);

-- create video table
CREATE TABLE videos(
    id BIGSERIAL NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    original_name VARCHAR(100) ,
    user_id int NOT NULL,
    size int NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
-- insert admin user and for all user passwords is 123
INSERT INTO users(name,email,password,role,can_download) VALUES('admin','admin@admin.com','$2b$05$K0fRkqLox3.fsDirqPPRVOsZf23uDx0MltIyvbbFb6vAMScjn8sum','admin',true);
INSERT INTO users(name,email,password,role,can_download) VALUES('admin1','admin1@admin.com','$2b$05$K0fRkqLox3.fsDirqPPRVOsZf23uDx0MltIyvbbFb6vAMScjn8sum','user',true);
INSERT INTO users(name,email,password,role,can_download) VALUES('admin2','admin2@admin.com','$2b$05$K0fRkqLox3.fsDirqPPRVOsZf23uDx0MltIyvbbFb6vAMScjn8sum','user',true);
INSERT INTO users(name,email,password,role,can_download) VALUES('admin3','admin3@admin.com','$2b$05$K0fRkqLox3.fsDirqPPRVOsZf23uDx0MltIyvbbFb6vAMScjn8sum','user',true);
INSERT INTO users(name,email,password,role,can_download) VALUES('admin4','admin4@admin.com','$2b$05$K0fRkqLox3.fsDirqPPRVOsZf23uDx0MltIyvbbFb6vAMScjn8sum','user',true);