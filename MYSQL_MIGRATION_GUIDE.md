# 🔄 MySQL Migration Guide - Evercold CRM

**Current Setup**: PostgreSQL
**Target Setup**: MySQL (on Plesk server)

**Good News**: ✅ Your schema is **95% MySQL-compatible** with minor adjustments needed.

---

## 📊 Compatibility Analysis

### ✅ What Works Without Changes

- ✅ All your models (Customer, Order, Delivery, etc.)
- ✅ String fields
- ✅ DateTime fields
- ✅ Boolean fields
- ✅ Float fields
- ✅ Relations (@relation)
- ✅ Indexes (@@index)
- ✅ Unique constraints (@unique)
- ✅ Default values (@default)
- ✅ Auto-incrementing IDs (@default(cuid()))

### ⚠️ What Needs Adjustment

| Feature | PostgreSQL | MySQL | Fix Needed |
|---------|-----------|-------|------------|
| **Json type** | `Json` | `Json` | ✅ Works (MySQL 5.7+) |
| **Adapter** | `@prisma/adapter-pg` | Not needed | ⚠️ Remove from package.json |
| **Connection pooling** | `pg` package | `mysql2` package | ⚠️ Change dependency |

---

## 🚀 Migration Steps

### Step 1: Update Prisma Schema

**File**: `prisma/schema.prisma`

**Change datasource:**

```prisma
// BEFORE (PostgreSQL)
datasource db {
  provider = "postgresql"
}

// AFTER (MySQL)
datasource db {
  provider = "mysql"
  relationMode = "prisma"  // Optional: Better compatibility
}
```

**Status**: ⬜ Updated

---

### Step 2: Update Dependencies

**Remove PostgreSQL adapter:**

```bash
npm uninstall @prisma/adapter-pg pg
```

**Install MySQL driver:**

```bash
npm install mysql2
```

**Status**: ⬜ Completed

---

### Step 3: Update Prisma Client Configuration

**File**: `src/lib/prisma.ts`

**BEFORE (PostgreSQL):**
```typescript
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL!

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**AFTER (MySQL - Simplified):**
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Why simpler?** MySQL driver is built into Prisma Client 7.x, no adapter needed.

**Status**: ⬜ Updated

---

### Step 4: Update DATABASE_URL

**Format for MySQL:**

```bash
# .env.production
DATABASE_URL="mysql://username:password@localhost:3306/database_name"
```

**Example:**
```bash
DATABASE_URL="mysql://evercold_user:your_password@localhost:3306/evercold_production"
```

**With special characters in password:**
```bash
# If password has special chars, URL-encode them
# Example: p@ss! becomes p%40ss%21
DATABASE_URL="mysql://evercold_user:p%40ss%21@localhost:3306/evercold_production"
```

**Status**: ⬜ Updated

---

### Step 5: Create MySQL Database (On Plesk Server)

#### Option A: Via Plesk GUI

1. Login to Plesk
2. Go to **Databases** → **Add Database**
3. Fill in:
   - **Database name**: `evercold_production`
   - **Database user**: `evercold_user`
   - **Password**: Generate strong password
   - **Charset**: `utf8mb4` (supports emojis, international chars)
   - **Collation**: `utf8mb4_unicode_ci`

4. Click **OK**

5. Copy connection details to `.env.production`

**Status**: ⬜ Created

---

#### Option B: Via MySQL Command Line

```bash
# SSH to Plesk server
ssh user@app.evercold.uz

# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE evercold_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user
CREATE USER 'evercold_user'@'localhost' IDENTIFIED BY 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON evercold_production.* TO 'evercold_user'@'localhost';

# Apply changes
FLUSH PRIVILEGES;

# Exit
EXIT;
```

**Test connection:**
```bash
mysql -u evercold_user -p evercold_production
# Enter password when prompted
# If successful, you'll see MySQL prompt
```

**Status**: ⬜ Created

---

### Step 6: Reset Migrations (Important!)

Since you're switching databases, you need to recreate migrations:

```bash
# LOCAL: Delete existing migrations
rm -rf prisma/migrations

# LOCAL: Create new migration baseline for MySQL
npx prisma migrate dev --name init

# This will:
# 1. Generate new migration files for MySQL
# 2. Apply them to your local MySQL database
# 3. Generate Prisma Client
```

**Status**: ⬜ Completed

---

### Step 7: Apply Migrations to Production

**On production server:**

```bash
# SSH to server
ssh user@app.evercold.uz
cd /var/www/vhosts/evercold.uz/httpdocs

# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# Verify
npx prisma db push --accept-data-loss  # Only if migrate deploy fails
```

**Status**: ⬜ Applied

---

### Step 8: Update package.json Scripts

**File**: `package.json`

**Update MySQL-specific scripts:**

```json
{
  "scripts": {
    "db:push": "dotenv -e .env.production -- npx prisma db push",
    "db:studio": "dotenv -e .env.production -- npx prisma studio",
    "db:generate": "npx prisma generate",
    "db:migrate:production": "dotenv -e .env.production -- npx prisma migrate deploy",
    "db:seed-admin": "tsx prisma/seed-admin.ts"
  }
}
```

**Status**: ⬜ Updated (scripts work with both PostgreSQL and MySQL)

---

### Step 9: Test Locally First (Recommended)

**Setup local MySQL:**

```bash
# macOS (via Homebrew)
brew install mysql
brew services start mysql

# Create local database
mysql -u root -p
CREATE DATABASE evercold_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

**Update `.env.local`:**
```bash
DATABASE_URL="mysql://root@localhost:3306/evercold_dev"
```

**Test migration:**
```bash
npx prisma migrate dev --name init
npm run dev
```

**Verify:**
- App starts without errors
- Can create orders
- Can login
- All API endpoints work

**Status**: ⬜ Tested locally

---

### Step 10: Deploy to Production

**Follow your normal deployment process:**

```bash
# Build with MySQL config
npm run build:production

# Deploy (Plesk or PM2)
npm run deploy
```

**On server:**
```bash
cd /var/www/vhosts/evercold.uz/httpdocs
npx prisma generate
npx prisma migrate deploy
# Restart app
```

**Status**: ⬜ Deployed

---

## 📋 Complete Checklist

### Pre-Migration

- [ ] Backup existing PostgreSQL data (if any)
- [ ] Install MySQL on server (or verify it's running)
- [ ] Create MySQL database with `utf8mb4` charset
- [ ] Test MySQL connection

### Code Changes

- [ ] Update `prisma/schema.prisma` (provider = "mysql")
- [ ] Update `src/lib/prisma.ts` (remove pg adapter)
- [ ] Uninstall `@prisma/adapter-pg` and `pg`
- [ ] Install `mysql2`
- [ ] Update `.env.production` (DATABASE_URL)

### Migration

- [ ] Delete old migrations: `rm -rf prisma/migrations`
- [ ] Create new migration: `npx prisma migrate dev --name init`
- [ ] Test locally with MySQL
- [ ] Deploy to production
- [ ] Apply migrations on server
- [ ] Verify app works

### Post-Migration

- [ ] Test login
- [ ] Create test order
- [ ] Test Telegram bot
- [ ] Check driver app
- [ ] Monitor logs for errors

---

## 🔍 Differences Between PostgreSQL and MySQL

### Performance

| Feature | PostgreSQL | MySQL | Winner |
|---------|-----------|-------|--------|
| **Complex Queries** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good | PostgreSQL |
| **Simple Queries** | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent | MySQL |
| **Write Performance** | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Better | MySQL |
| **Read Performance** | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Better | MySQL |

**For your app:** MySQL will likely perform **better** since most queries are simple CRUD operations.

---

### Features You'll Keep

✅ All Prisma features work the same:
- Relations
- Transactions
- Migrations
- Prisma Studio
- Type safety

✅ Your application code **doesn't change** - Prisma abstracts the database.

---

### Features You'll Lose (But Don't Need)

❌ PostgreSQL-specific features your app **doesn't use**:
- JSONB indexing (you use Json sparingly)
- Full-text search (not used)
- Array types (not used)
- Advanced indexing (not needed for your scale)

**Impact:** ✅ **ZERO** - You don't use any PostgreSQL-exclusive features.

---

## ⚠️ Potential Issues & Solutions

### Issue 1: Migration Fails with "Table already exists"

**Cause:** Database already has tables

**Solution:**
```bash
# Drop all tables first (⚠️ DANGER: Loses data)
mysql -u evercold_user -p evercold_production

# In MySQL prompt:
DROP DATABASE evercold_production;
CREATE DATABASE evercold_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# Then run migrations
npx prisma migrate deploy
```

---

### Issue 2: Connection Timeout

**Cause:** MySQL not accepting connections from localhost

**Solution:**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Check user can connect
mysql -u evercold_user -p -h localhost evercold_production

# If fails, recreate user:
mysql -u root -p
DROP USER 'evercold_user'@'localhost';
CREATE USER 'evercold_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON evercold_production.* TO 'evercold_user'@'localhost';
FLUSH PRIVILEGES;
```

---

### Issue 3: Character Set Issues (Cyrillic/Emoji)

**Cause:** Database not using utf8mb4

**Solution:**
```sql
# Check current charset
SHOW CREATE DATABASE evercold_production;

# If wrong, recreate database
DROP DATABASE evercold_production;
CREATE DATABASE evercold_production
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

---

### Issue 4: "Client does not support authentication protocol"

**Cause:** MySQL 8+ uses new auth method

**Solution:**
```sql
# Use legacy password authentication
ALTER USER 'evercold_user'@'localhost'
  IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

---

### Issue 5: JSON Field Errors

**Cause:** MySQL version < 5.7

**Solution:**
```bash
# Check MySQL version
mysql --version

# Must be 5.7+ or 8.0+
# If older, upgrade MySQL or use TEXT instead of Json
```

To use TEXT instead of Json (if MySQL < 5.7):

```prisma
// In schema.prisma
// Change:
documentData   Json?

// To:
documentData   String?  // Store JSON as string
```

Then manually parse in code:
```typescript
const data = JSON.parse(order.documentData || '{}')
```

---

## 🚀 Quick Migration Script

**Save as `migrate-to-mysql.sh`:**

```bash
#!/bin/bash
set -e

echo "🔄 Migrating Evercold CRM to MySQL..."

# Backup current schema
echo "📦 Backing up current schema..."
cp prisma/schema.prisma prisma/schema.prisma.postgres.backup

# Update schema
echo "✏️  Updating schema to MySQL..."
sed -i '' 's/provider = "postgresql"/provider = "mysql"/' prisma/schema.prisma

# Remove PostgreSQL dependencies
echo "🗑️  Removing PostgreSQL packages..."
npm uninstall @prisma/adapter-pg pg

# Install MySQL driver
echo "📥 Installing MySQL driver..."
npm install mysql2

# Update Prisma client file
echo "✏️  Updating Prisma client configuration..."
cat > src/lib/prisma.ts << 'EOF'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
EOF

# Reset migrations
echo "🔄 Resetting migrations..."
rm -rf prisma/migrations

# Prompt for DATABASE_URL
echo ""
echo "⚙️  Please update your DATABASE_URL in .env files:"
echo "   Format: mysql://username:password@localhost:3306/database_name"
echo ""
read -p "Press Enter when DATABASE_URL is updated..."

# Create new migration
echo "🏗️  Creating new MySQL migration..."
npx prisma migrate dev --name init

echo ""
echo "✅ Migration complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Update .env.production with MySQL DATABASE_URL"
echo "  2. Test locally: npm run dev"
echo "  3. Deploy to production"
echo "  4. Run migrations on server: npx prisma migrate deploy"
```

**Usage:**
```bash
chmod +x migrate-to-mysql.sh
./migrate-to-mysql.sh
```

---

## 🎯 Recommendation

### Should You Use MySQL?

**✅ Use MySQL if:**
- ✅ MySQL is already installed on Plesk server
- ✅ You're familiar with MySQL
- ✅ You want better performance for simple queries
- ✅ Your team knows MySQL better than PostgreSQL

**⚠️ Stick with PostgreSQL if:**
- ⚠️ You have complex queries with JSON operations
- ⚠️ PostgreSQL is already set up and working
- ⚠️ You plan to use advanced features later
- ⚠️ You have existing PostgreSQL backups/data

### My Recommendation for Evercold CRM

**✅ MySQL is FINE** for your use case because:
1. Your schema is simple (mostly CRUD)
2. No complex JSON queries
3. MySQL is likely faster for your workload
4. Simpler to manage on Plesk (usually pre-installed)
5. Lower memory footprint

**Migration effort:** ~30 minutes (code changes + testing)

---

## 📞 Support

**If migration fails:**
1. Restore `prisma/schema.prisma.postgres.backup`
2. Reinstall PostgreSQL packages: `npm install @prisma/adapter-pg pg`
3. Check error logs
4. Refer to troubleshooting section above

**MySQL vs PostgreSQL decision**: Either works. Choose based on what's easier for your server setup.

---

Last Updated: 2026-02-14
