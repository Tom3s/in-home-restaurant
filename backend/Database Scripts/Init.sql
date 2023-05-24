CREATE DATABASE in_home_restaurant WITH CONNECTION LIMIT = 128;
GO;

USE in_home_restaurant;
GO;

CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	name VARCHAR(64) NOT NULL UNIQUE,
	email VARCHAR(128) NOT NULL UNIQUE,
	passwordhash VARCHAR(255) NOT NULL,
	role VARCHAR(32) NOT NULL
);
GO;