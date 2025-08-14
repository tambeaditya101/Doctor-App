-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Specializations
CREATE TABLE specializations (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- 2. Users (patients)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    public_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

-- 3. Doctors
CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    public_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    name TEXT NOT NULL,
    specialization_id INT NOT NULL REFERENCES specializations(id),
    mode TEXT CHECK (mode IN ('online', 'in-person')) NOT NULL,
    bio TEXT
);

-- 4. Availability
CREATE TABLE availability (
    id SERIAL PRIMARY KEY,
    doctor_id INT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE
);

-- 5. Appointments
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    public_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    availability_id INT NOT NULL REFERENCES availability(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('booked', 'completed', 'cancelled')) DEFAULT 'booked'
);

-- 6. Admins
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    public_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

