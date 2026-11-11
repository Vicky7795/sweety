-- Sweety Database Schema for PostgreSQL

-- Drop tables if needed for fresh migrations (cascade to handle FKs)
DROP TABLE IF EXISTS readings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Readings Table
CREATE TABLE readings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    glucose_value INTEGER NOT NULL CHECK (glucose_value >= 40 AND glucose_value <= 600),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_date_slot UNIQUE (user_id, reading_date, time_slot),
    CONSTRAINT valid_time_slot CHECK (time_slot IN (
        'Morning (fasting)',
        'After breakfast',
        'After lunch',
        'After dinner'
    ))
);

-- Indexes for optimal performance and query isolation
CREATE INDEX idx_readings_user_id ON readings(user_id);
CREATE INDEX idx_readings_user_date ON readings(user_id, reading_date);
CREATE INDEX idx_readings_user_date_slot ON readings(user_id, reading_date, time_slot);
