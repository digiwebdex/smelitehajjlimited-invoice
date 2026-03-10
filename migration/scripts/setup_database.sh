#!/bin/bash
# ============================================
# Database Setup Script
# Run this on your VPS to create and initialize the database
# ============================================

set -e

DB_NAME="${DB_NAME:-sm_elite_hajj}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo "=== SM Elite Hajj - Database Setup ==="
echo ""

# Create database
echo "Creating database: $DB_NAME"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database already exists"

# Run schema
echo "Applying schema..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f ../database/schema.sql

# Run functions and triggers
echo "Applying functions and triggers..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f ../database/functions.sql

# Run indexes
echo "Creating indexes..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f ../database/indexes.sql

# Run seed data
echo "Inserting seed data..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f ../database/seed.sql

echo ""
echo "=== Database setup complete ==="
echo ""
echo "Next steps:"
echo "1. Export data from your current database (see README_DEPLOYMENT.md)"
echo "2. Import the data using: psql -d $DB_NAME -f data.sql"
echo "3. Create your first admin user (see README_DEPLOYMENT.md)"
