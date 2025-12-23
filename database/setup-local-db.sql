-- Run this in PostgreSQL command line (psql) or pgAdmin

-- Create database
CREATE DATABASE indoorloop;

-- Connect to the database
\c indoorloop

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
