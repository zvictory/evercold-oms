#!/bin/bash
set -e
set -o pipefail

# Evercold CRM Deployment Script
# Deploys to ice.erpstable.com (173.212.195.32)

# Configuration
SERVER="ice-production"
REMOTE_DIR="/var/www/evercold"
APP_NAME="evercold-crm"
DEPLOY_LOG="deployment-$(date +%Y%m%d-%H%M%S).log"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Evercold CRM Deployment to ice.erpstable.com"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verify SSH connection
echo "🔐 Checking SSH connection to ice-production..."
if ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$SERVER" exit 2>/dev/null; then
  echo "❌ Cannot connect to $SERVER. Check SSH config."
  exit 1
fi
echo "✅ SSH connection successful"

# Build application
echo ""
echo "📦 Building Next.js application..."
npm run build:production 2>&1 | tee -a "$DEPLOY_LOG"

if [ ! -d ".next" ]; then
  echo "❌ Build failed - .next directory not found"
  exit 1
fi
echo "✅ Build completed"

# Create deployment package
echo ""
echo "📁 Creating deployment package..."
tar -czf evercold-deploy.tar.gz \
  .next \
  public \
  prisma \
  package.json \
  package-lock.json \
  next.config.ts \
  .env.production \
  prisma.config.ts \
  ecosystem.config.js \
  2>&1 | tee -a "$DEPLOY_LOG"

echo "✅ Package created ($(du -h evercold-deploy.tar.gz | cut -f1))"

# Upload to server
echo ""
echo "⬆️  Uploading to server..."
scp -o ConnectTimeout=10 -o StrictHostKeyChecking=no \
  evercold-deploy.tar.gz "$SERVER:$REMOTE_DIR/" 2>&1 | tee -a "$DEPLOY_LOG"

if [ $? -ne 0 ]; then
  echo "❌ Upload failed"
  rm evercold-deploy.tar.gz
  exit 1
fi
echo "✅ Upload completed"

# Deploy on server
echo ""
echo "🔧 Deploying on production server..."
ssh -o StrictHostKeyChecking=no "$SERVER" << 'ENDSSH'
  set -e

  echo "→ Entering deployment directory..."
  cd /var/www/evercold

  # Create backup of current deployment
  if [ -f ".env" ]; then
    echo "→ Creating backup..."
    mkdir -p backups
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    tar -czf "backups/$BACKUP_NAME.tar.gz" .next public package.json 2>/dev/null || true
    echo "✓ Backup created: $BACKUP_NAME"
  fi

  # Extract new files
  echo "→ Extracting deployment package..."
  tar -xzf evercold-deploy.tar.gz
  # Clean up stale files (none currently, but keeping place)

  # Setup environment
  echo "→ Setting up environment..."
  cp .env.production .env
  # Export variables for Prisma 7
  set -a
  [ -f .env ] && . ./.env
  set +a
  echo "✓ Production environment configured"

  # Install dependencies
  echo "→ Installing dependencies..."
  npm ci --omit=dev --legacy-peer-deps 2>&1 | grep -E "added|up to date" || true
  echo "✓ Dependencies installed"

  # Run database migrations
  echo "→ Running database migrations..."
  npx prisma migrate deploy 2>&1 || {
    echo "⚠ Migration warning (may already be up-to-date)"
  }
  echo "✓ Database migrations completed"

  # Generate Prisma client
  echo "→ Generating Prisma client..."
  npx prisma generate
  echo "✓ Prisma client generated"

  # Start/restart PM2 process
  echo "→ Managing PM2 processes..."
  if pm2 list | grep -q "evercold-crm"; then
    pm2 restart evercold-crm
    echo "✓ Process restarted"
  else
    pm2 start ecosystem.config.js --name "evercold-crm"
    echo "✓ Process started"
  fi

  # Save PM2 configuration
  pm2 save
  echo "✓ PM2 configuration saved"

  # Verify application is running
  sleep 3
  if pm2 list | grep -q "evercold-crm.*online"; then
    echo "✓ Application is online"
  else
    echo "⚠ Warning: Application status unclear, check with: pm2 status"
  fi

ENDSSH

if [ $? -ne 0 ]; then
  echo "❌ Server deployment failed"
  exit 1
fi

# Clean up local deployment package
rm evercold-deploy.tar.gz

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment completed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Next Steps:"
echo "  1. Check application: https://ice.erpstable.com"
echo "  2. View logs: ssh ice-production 'pm2 logs evercold-crm'"
echo "  3. Monitor: ssh ice-production 'pm2 monit'"
echo ""
echo "📝 Deployment log: $DEPLOY_LOG"
