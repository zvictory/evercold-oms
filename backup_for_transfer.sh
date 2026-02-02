#!/bin/bash

# Evercold CRM - Complete Project Backup Script
# This script creates a full backup including database, code, and configurations
# for transferring to a new Mac

set -e  # Exit on any error

echo "=========================================="
echo "Evercold CRM - Full Project Backup"
echo "=========================================="
echo ""

# Define variables
PROJECT_DIR="/Users/user/Documents/evercold-crm"
BACKUP_DIR="/Users/user/Documents/evercold-crm-transfer-backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="evercold-crm-backup-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Create backup directory
echo "Creating backup directory..."
mkdir -p "${BACKUP_PATH}"

# 1. Export the database
echo ""
echo "Step 1: Exporting PostgreSQL database..."
/usr/local/opt/postgresql@16/bin/pg_dump -U user -h localhost evercold_crm > "${BACKUP_PATH}/evercold_crm_database.sql"
echo "✓ Database exported successfully ($(du -h "${BACKUP_PATH}/evercold_crm_database.sql" | cut -f1))"

# 2. Copy project files (excluding node_modules and other build artifacts)
echo ""
echo "Step 2: Copying project files..."
rsync -av \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  "${PROJECT_DIR}/" "${BACKUP_PATH}/project/"

echo "✓ Project files copied successfully"

# 3. Save environment variables
echo ""
echo "Step 3: Backing up environment configuration..."
cp "${PROJECT_DIR}/.env" "${BACKUP_PATH}/env-backup.txt"
echo "✓ Environment variables backed up"

# 4. Export package information
echo ""
echo "Step 4: Creating package information..."
cd "${PROJECT_DIR}"
npm list --depth=0 > "${BACKUP_PATH}/npm-packages.txt" 2>&1 || true
echo "✓ Package information saved"

# 5. Get PostgreSQL version
echo ""
echo "Step 5: Recording PostgreSQL version..."
psql --version > "${BACKUP_PATH}/postgresql-version.txt"
echo "✓ PostgreSQL version recorded"

# 6. Get Node and NPM versions
echo ""
echo "Step 6: Recording Node.js and npm versions..."
node --version > "${BACKUP_PATH}/node-version.txt"
npm --version >> "${BACKUP_PATH}/node-version.txt"
echo "✓ Node.js and npm versions recorded"

# 7. Create restore instructions
echo ""
echo "Step 7: Creating restore instructions..."
cat > "${BACKUP_PATH}/RESTORE_INSTRUCTIONS.md" << 'INSTRUCTIONS'
# Evercold CRM - Restore Instructions for New Mac

## Prerequisites

Before restoring, ensure you have the following installed on your new Mac:

1. **Homebrew** - Package manager for macOS
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **PostgreSQL 16**
   ```bash
   brew install postgresql@16
   brew services start postgresql@16
   ```

3. **Node.js** (version from node-version.txt)
   ```bash
   brew install node
   ```

## Restore Steps

### 1. Copy the backup to your new Mac

Transfer the entire backup folder to your new Mac using:
- External drive
- AirDrop
- Cloud storage (Dropbox, Google Drive, etc.)
- Network transfer

### 2. Create the database

```bash
# Create the PostgreSQL user (if it doesn't exist)
createuser -s user

# Create the database
createdb -U user evercold_crm
```

### 3. Restore the database

```bash
# Navigate to the backup directory
cd /path/to/backup/folder

# Restore the database
psql -U user -h localhost evercold_crm < evercold_crm_database.sql
```

### 4. Set up the project

```bash
# Copy the project to your desired location
mkdir -p ~/Documents
cp -r project ~/Documents/evercold-crm
cd ~/Documents/evercold-crm

# Restore environment variables
cp ../env-backup.txt .env

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate
```

### 5. Verify the setup

```bash
# Check database connection
npx prisma db pull

# Run the development server
npm run dev
```

The application should now be running at http://localhost:3000

## Troubleshooting

### Database Connection Issues

If you encounter "database does not exist" errors:
```bash
createdb -U user evercold_crm
psql -U user -h localhost evercold_crm < evercold_crm_database.sql
```

### PostgreSQL Version Mismatch

If you have a different PostgreSQL version, you may need to:
```bash
brew uninstall postgresql
brew install postgresql@16
brew link postgresql@16
```

### Port Already in Use

If port 3000 is already in use:
```bash
# Run on a different port
PORT=3001 npm run dev
```

### Prisma Client Issues

If Prisma client is not generating correctly:
```bash
npx prisma generate --force
```

## Environment Variables to Update

Review the `.env` file and update any environment-specific values:

- `DATABASE_URL` - Update if your PostgreSQL port or credentials differ
- `YANDEX_MAPS_API_KEY` - Ensure this is valid
- `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` - Ensure this is valid
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Ensure this is valid
- `TELEGRAM_BOT_TOKEN` - Update if needed
- Telegram chat IDs - Add if needed

## Verification Checklist

- [ ] PostgreSQL is running
- [ ] Database is created and restored
- [ ] Dependencies are installed (node_modules exists)
- [ ] Prisma client is generated
- [ ] Development server starts without errors
- [ ] Application loads in browser
- [ ] Database queries work (check dashboard, etc.)

## Support

If you encounter any issues, check:
1. PostgreSQL logs: `brew services list`
2. Application logs: Check terminal output when running `npm run dev`
3. Browser console: Check for any JavaScript errors

INSTRUCTIONS

echo "✓ Restore instructions created"

# 8. Create a quick restore script
echo ""
echo "Step 8: Creating automated restore script..."
cat > "${BACKUP_PATH}/restore.sh" << 'RESTORE_SCRIPT'
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

RESTORE_SCRIPT

chmod +x "${BACKUP_PATH}/restore.sh"
echo "✓ Automated restore script created"

# 9. Create a checksum file
echo ""
echo "Step 9: Creating checksums..."
cd "${BACKUP_PATH}"
find . -type f -not -name "checksums.txt" -exec shasum -a 256 {} \; > checksums.txt
echo "✓ Checksums created"

# 10. Create summary file
echo ""
echo "Step 10: Creating backup summary..."
cat > "${BACKUP_PATH}/BACKUP_SUMMARY.txt" << SUMMARY
Evercold CRM - Backup Summary
Created: ${TIMESTAMP}

Database:
  - Name: evercold_crm
  - Size: $(du -h "${BACKUP_PATH}/evercold_crm_database.sql" | cut -f1)
  - Tables: $(grep -c "CREATE TABLE" "${BACKUP_PATH}/evercold_crm_database.sql" || echo "N/A")

Project:
  - Source: ${PROJECT_DIR}
  - Files: $(find "${BACKUP_PATH}/project" -type f | wc -l | xargs)
  - Size: $(du -sh "${BACKUP_PATH}/project" | cut -f1)

Versions:
  - PostgreSQL: $(cat "${BACKUP_PATH}/postgresql-version.txt")
  - Node.js: $(cat "${BACKUP_PATH}/node-version.txt" | head -n1)
  - npm: $(cat "${BACKUP_PATH}/node-version.txt" | tail -n1)

Files Included:
  - evercold_crm_database.sql  (PostgreSQL database dump)
  - project/                    (Full project source code)
  - env-backup.txt              (Environment variables)
  - npm-packages.txt            (Package list)
  - node-version.txt            (Node.js and npm versions)
  - postgresql-version.txt      (PostgreSQL version)
  - RESTORE_INSTRUCTIONS.md     (Manual restore guide)
  - restore.sh                  (Automated restore script)
  - checksums.txt               (File integrity checksums)

Total Backup Size: $(du -sh "${BACKUP_PATH}" | cut -f1)

Next Steps:
1. Transfer this entire folder to your new Mac
2. Read RESTORE_INSTRUCTIONS.md for manual setup
3. Or run ./restore.sh for automated setup

SUMMARY

echo "✓ Backup summary created"

# 11. Create a compressed archive
echo ""
echo "Step 11: Creating compressed archive..."
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
ARCHIVE_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
echo "✓ Archive created: ${BACKUP_NAME}.tar.gz (${ARCHIVE_SIZE})"

# Print final summary
echo ""
echo "=========================================="
echo "✓ Backup completed successfully!"
echo "=========================================="
echo ""
echo "Backup location:"
echo "  Directory: ${BACKUP_PATH}"
echo "  Archive:   ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo ""
echo "Files created:"
echo "  - Database dump (SQL)"
echo "  - Project source code"
echo "  - Environment configuration"
echo "  - Restore scripts and instructions"
echo ""
echo "To transfer to new Mac:"
echo "  1. Copy ${BACKUP_NAME}.tar.gz to your new Mac"
echo "  2. Extract: tar -xzf ${BACKUP_NAME}.tar.gz"
echo "  3. Follow instructions in RESTORE_INSTRUCTIONS.md"
echo "  4. Or run: ./restore.sh for automated setup"
echo ""
