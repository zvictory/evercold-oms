# Evercold CRM - Complete Transfer Guide for New Mac

This guide provides comprehensive instructions for transferring the entire Evercold CRM project to a new Mac, including the database, source code, and all configurations.

## Overview

This project is a Next.js-based CRM system with:
- **Frontend**: Next.js 16 with React 19
- **Database**: PostgreSQL 16 (evercold_crm)
- **ORM**: Prisma
- **Maps**: Yandex Maps and Google Maps integration
- **Notifications**: Telegram Bot integration

## Quick Start (Automated)

For a fast automated transfer:

```bash
# On your current Mac:
cd /Users/user/Documents/evercold-crm
./backup_for_transfer.sh

# This creates:
# - evercold-crm-transfer-backup/evercold-crm-backup-YYYYMMDD_HHMMSS/
# - evercold-crm-transfer-backup/evercold-crm-backup-YYYYMMDD_HHMMSS.tar.gz

# Transfer the .tar.gz file to your new Mac

# On your new Mac:
tar -xzf evercold-crm-backup-YYYYMMDD_HHMMSS.tar.gz
cd evercold-crm-backup-YYYYMMDD_HHMMSS
./restore.sh
```

## Detailed Manual Transfer Process

### Step 1: Prepare Your Current Mac

#### 1.1 Run the Backup Script

```bash
cd /Users/user/Documents/evercold-crm
./backup_for_transfer.sh
```

This script will:
- Export the PostgreSQL database to SQL
- Copy all project files (excluding node_modules, .next, etc.)
- Back up environment variables
- Record installed package versions
- Create restore scripts and documentation
- Generate checksums for verification
- Create a compressed archive

#### 1.2 Locate the Backup

The backup will be created at:
```
/Users/user/Documents/evercold-crm-transfer-backup/evercold-crm-backup-TIMESTAMP/
```

And compressed as:
```
/Users/user/Documents/evercold-crm-transfer-backup/evercold-crm-backup-TIMESTAMP.tar.gz
```

### Step 2: Transfer Files to New Mac

Choose one of these methods:

**Option A: External Drive**
1. Copy the `.tar.gz` file to an external USB drive or SSD
2. Connect the drive to your new Mac
3. Copy the file to your new Mac's Documents folder

**Option B: AirDrop**
1. Ensure both Macs are on the same WiFi network
2. Open Finder on both Macs
3. Use AirDrop to send the `.tar.gz` file

**Option C: Cloud Storage**
1. Upload the `.tar.gz` to Dropbox, Google Drive, or iCloud
2. Download on your new Mac

**Option D: Network Transfer**
```bash
# On new Mac, get IP address:
ifconfig | grep "inet "

# On current Mac:
scp evercold-crm-backup-TIMESTAMP.tar.gz username@new-mac-ip:~/Documents/
```

### Step 3: Set Up New Mac

#### 3.1 Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the post-installation instructions to add Homebrew to your PATH.

#### 3.2 Install PostgreSQL 16

```bash
brew install postgresql@16
brew services start postgresql@16

# Add to PATH (add to ~/.zshrc)
echo 'export PATH="/usr/local/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

#### 3.3 Install Node.js

```bash
brew install node
```

Verify installation:
```bash
node --version  # Should be v20.x or higher
npm --version
```

### Step 4: Restore the Project

#### 4.1 Extract the Backup

```bash
cd ~/Documents
tar -xzf evercold-crm-backup-TIMESTAMP.tar.gz
cd evercold-crm-backup-TIMESTAMP
```

#### 4.2 Verify Backup Integrity (Optional)

```bash
shasum -a 256 -c checksums.txt
```

#### 4.3 Run Automated Restore

```bash
./restore.sh
```

This will:
- Create the PostgreSQL database
- Restore all database data
- Copy project files to ~/Documents/evercold-crm
- Set up environment variables
- Install npm dependencies
- Generate Prisma client

### Step 5: Manual Restore (Alternative to Step 4.3)

If you prefer manual control:

#### 5.1 Create PostgreSQL User and Database

```bash
# Create user (if needed)
createuser -s user

# Create database
createdb -U user evercold_crm
```

#### 5.2 Restore Database

```bash
psql -U user -h localhost evercold_crm < evercold_crm_database.sql
```

#### 5.3 Set Up Project

```bash
# Copy project files
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

### Step 6: Verify Installation

#### 6.1 Check Database Connection

```bash
cd ~/Documents/evercold-crm
npx prisma db pull
```

#### 6.2 Start Development Server

```bash
npm run dev
```

The application should start at `http://localhost:3000`

#### 6.3 Test the Application

1. Open browser: `http://localhost:3000`
2. Verify the dashboard loads
3. Check that data appears correctly
4. Test map functionality (Yandex Maps)
5. Verify database queries work

### Step 7: Configuration Review

#### 7.1 Review Environment Variables

Check `.env` file and update if necessary:

```bash
cd ~/Documents/evercold-crm
nano .env  # or use your preferred editor
```

**Variables to review:**
- `DATABASE_URL` - Should be `postgresql://user@localhost:5432/evercold_crm`
- `YANDEX_MAPS_API_KEY` - Verify it's valid
- `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` - Verify it's valid
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Verify it's valid
- `TELEGRAM_BOT_TOKEN` - Update if needed
- Telegram chat IDs - Add if you want notifications

#### 7.2 Update Git Configuration (if using)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Troubleshooting

### PostgreSQL Issues

**Database connection failed:**
```bash
# Check if PostgreSQL is running
brew services list

# Restart if needed
brew services restart postgresql@16

# Check logs
tail -f /usr/local/var/postgresql@16/server.log
```

**Wrong PostgreSQL version:**
```bash
# Check version
psql --version

# If wrong version, reinstall
brew uninstall postgresql
brew install postgresql@16
brew link postgresql@16 --force
```

**Database already exists error:**
```bash
# Drop and recreate
dropdb -U user evercold_crm
createdb -U user evercold_crm
psql -U user -h localhost evercold_crm < evercold_crm_database.sql
```

### Node.js Issues

**Module not found errors:**
```bash
cd ~/Documents/evercold-crm
rm -rf node_modules package-lock.json
npm install
```

**Prisma client errors:**
```bash
npx prisma generate --force
```

**Port 3000 already in use:**
```bash
# Run on different port
PORT=3001 npm run dev

# Or kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Build Issues

**Next.js build fails:**
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

### Map Integration Issues

**Maps not loading:**
1. Check API keys in `.env`
2. Verify keys are not expired
3. Check browser console for errors
4. Ensure network connectivity

## Project Structure

```
evercold-crm/
├── src/
│   ├── app/              # Next.js app directory
│   └── components/       # React components
├── prisma/
│   └── schema.prisma     # Database schema
├── public/               # Static files
├── scripts/              # Utility scripts
├── .env                  # Environment variables
├── package.json          # Dependencies
├── next.config.ts        # Next.js configuration
└── tsconfig.json         # TypeScript configuration
```

## Database Schema

The database includes tables for:
- Customers and customer management
- Service tickets and issue tracking
- Technician assignments
- Route optimization data
- Payment tracking
- And more...

## Important Files

- **prisma/schema.prisma** - Database schema definition
- **.env** - Environment configuration (sensitive!)
- **package.json** - Project dependencies
- **next.config.ts** - Next.js configuration

## Post-Transfer Checklist

- [ ] PostgreSQL 16 installed and running
- [ ] Node.js installed (v20+)
- [ ] Database created and restored
- [ ] Project files copied to ~/Documents/evercold-crm
- [ ] Environment variables configured
- [ ] Dependencies installed (node_modules exists)
- [ ] Prisma client generated
- [ ] Development server starts successfully
- [ ] Application loads in browser
- [ ] Database queries work correctly
- [ ] Maps load correctly
- [ ] All features tested

## Security Notes

⚠️ **Important Security Considerations:**

1. **Environment Variables**: The `.env` file contains sensitive information including API keys. Keep this file secure and never commit to version control.

2. **Database Credentials**: The backup includes full database contents. Ensure the backup files are stored securely.

3. **API Keys**: Review all API keys after transfer and regenerate if necessary, especially:
   - Yandex Maps API key
   - Google Maps API key
   - Telegram Bot token

4. **Backup Cleanup**: After successful transfer, securely delete backup files from cloud storage or external drives.

## Additional Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Yandex Maps API**: https://yandex.com/dev/maps/

## Support

If you encounter issues during transfer:

1. Check the BACKUP_SUMMARY.txt file in the backup for version information
2. Verify all prerequisites are installed correctly
3. Check the troubleshooting section above
4. Review application logs and PostgreSQL logs

## Success Indicators

You've successfully transferred when:
- ✅ Development server starts without errors
- ✅ Application loads at http://localhost:3000
- ✅ Dashboard shows your data
- ✅ Database queries execute successfully
- ✅ Maps render correctly
- ✅ No console errors in browser
- ✅ All features work as expected

---

**Transfer Date**: January 6, 2026
**Database Size**: ~92KB
**PostgreSQL Version**: 16.10
**Node Version**: Check node-version.txt in backup
**Project Type**: Next.js 16 + React 19 + PostgreSQL + Prisma
