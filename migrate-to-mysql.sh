#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Migrating Evercold CRM from PostgreSQL to MySQL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Confirmation
read -p "⚠️  This will modify your schema and dependencies. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 1
fi

# Backup current schema
echo "📦 Step 1: Backing up current schema..."
cp prisma/schema.prisma prisma/schema.prisma.postgres.backup
echo "✅ Backup saved: prisma/schema.prisma.postgres.backup"

# Update schema provider
echo ""
echo "✏️  Step 2: Updating Prisma schema to MySQL..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' 's/provider = "postgresql"/provider = "mysql"/' prisma/schema.prisma
else
    # Linux
    sed -i 's/provider = "postgresql"/provider = "mysql"/' prisma/schema.prisma
fi
echo "✅ Schema provider updated to MySQL"

# Remove PostgreSQL dependencies
echo ""
echo "🗑️  Step 3: Removing PostgreSQL packages..."
npm uninstall @prisma/adapter-pg pg --silent
echo "✅ PostgreSQL packages removed"

# Install MySQL driver
echo ""
echo "📥 Step 4: Installing MySQL driver..."
npm install mysql2 --silent
echo "✅ MySQL driver installed (mysql2)"

# Update Prisma client file
echo ""
echo "✏️  Step 5: Updating Prisma client configuration..."
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
echo "✅ Prisma client updated (removed PostgreSQL adapter)"

# Reset migrations
echo ""
echo "🔄 Step 6: Resetting migration history..."
if [ -d "prisma/migrations" ]; then
    mv prisma/migrations prisma/migrations.postgres.backup
    echo "✅ Old migrations backed up to: prisma/migrations.postgres.backup"
else
    echo "ℹ️  No existing migrations found"
fi

# Prompt for DATABASE_URL
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️  IMPORTANT: Update DATABASE_URL in your .env files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Format: mysql://username:password@localhost:3306/database_name"
echo ""
echo "Example: DATABASE_URL=\"mysql://evercold_user:password@localhost:3306/evercold_production\""
echo ""
read -p "Press Enter when DATABASE_URL is updated in .env files..."

# Create new migration
echo ""
echo "🏗️  Step 7: Creating new MySQL migration..."
echo ""
npx prisma migrate dev --name init

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Migration to MySQL complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Backups created:"
echo "   • prisma/schema.prisma.postgres.backup"
echo "   • prisma/migrations.postgres.backup/"
echo ""
echo "📋 Next steps:"
echo "   1. Update .env.production with MySQL DATABASE_URL"
echo "   2. Test locally: npm run dev"
echo "   3. If working, deploy to production"
echo "   4. On server: npx prisma migrate deploy"
echo ""
echo "🔄 To rollback:"
echo "   • Restore: mv prisma/schema.prisma.postgres.backup prisma/schema.prisma"
echo "   • Reinstall: npm install @prisma/adapter-pg pg"
echo "   • Restore migrations: mv prisma/migrations.postgres.backup prisma/migrations"
echo ""
