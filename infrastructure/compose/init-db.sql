-- Initial database setup
-- This runs automatically when PostgreSQL container starts for the first time

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Create indexes for full-text search (will be used by Prisma)
-- Note: Prisma migrations will create the actual tables
