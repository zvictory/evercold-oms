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

