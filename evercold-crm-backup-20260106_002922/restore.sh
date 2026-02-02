#!/bin/bash

# Evercold CRM - Automated Restore Script for New Mac
# This script automates the restore process

set -e

echo "=========================================="
echo "Evercold CRM - Automated Restore"
echo "=========================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_NAME="evercold-crm"
INSTALL_DIR="$HOME/Documents/${PROJECT_NAME}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed!"
    echo "Please install PostgreSQL 16:"
    echo "  brew install postgresql@16"
    echo "  brew services start postgresql@16"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js:"
    echo "  brew install node"
    exit 1
fi

echo "Step 1: Creating PostgreSQL database..."
if psql -U user -lqt | cut -d \| -f 1 | grep -qw evercold_crm; then
    echo "⚠️  Database 'evercold_crm' already exists. Skipping creation."
else
    createdb -U user evercold_crm
    echo "✓ Database created"
fi

echo ""
echo "Step 2: Restoring database..."
psql -U user -h localhost evercold_crm < "${SCRIPT_DIR}/evercold_crm_database.sql"
echo "✓ Database restored"

echo ""
echo "Step 3: Copying project files..."
mkdir -p "$INSTALL_DIR"
cp -r "${SCRIPT_DIR}/project/"* "$INSTALL_DIR/"
echo "✓ Project files copied to $INSTALL_DIR"

echo ""
echo "Step 4: Setting up environment variables..."
cp "${SCRIPT_DIR}/env-backup.txt" "$INSTALL_DIR/.env"
echo "✓ Environment variables configured"

echo ""
echo "Step 5: Installing dependencies..."
cd "$INSTALL_DIR"
npm install
echo "✓ Dependencies installed"

echo ""
echo "Step 6: Generating Prisma client..."
npx prisma generate
echo "✓ Prisma client generated"

echo ""
echo "=========================================="
echo "✓ Restore completed successfully!"
echo "=========================================="
echo ""
echo "To start the development server:"
echo "  cd $INSTALL_DIR"
echo "  npm run dev"
echo ""
echo "The application will be available at http://localhost:3000"

