#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 DEPLOY EVERCOLD CRM TO ice.erpstable.com
# ═══════════════════════════════════════════════════════════════════════════════

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════════════"
echo "🚀 Deploying Evercold CRM to ice.erpstable.com"
echo "════════════════════════════════════════════════════════════════════"

# Configuration
DOMAIN="ice.erpstable.com"
APP_DIR="/opt/evercold"
SSH_HOST="ice-production"

echo ""
echo "📋 Configuration:"
echo "  Domain: $DOMAIN"
echo "  App Directory: $APP_DIR"
echo "  SSH Host: $SSH_HOST"
echo ""

# Step 1: Create directory structure on server
echo "════════════════════════════════════════════════════════════════════"
echo "📁 Step 1: Creating directory structure..."
echo "════════════════════════════════════════════════════════════════════"

ssh $SSH_HOST << 'ENDSSH'
# Create app directory
mkdir -p /opt/evercold
mkdir -p /var/log/evercold

# Set permissions
chmod 755 /opt/evercold
chmod 755 /var/log/evercold

echo "✅ Directories created"
ENDSSH

# Step 2: Upload deployment package
echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "📤 Step 2: Uploading deployment package..."
echo "════════════════════════════════════════════════════════════════════"

if [ ! -f "evercold-production-ready.zip" ]; then
    echo "❌ Error: evercold-production-ready.zip not found!"
    echo "   Please run this script from the project directory"
    exit 1
fi

echo "Uploading evercold-production-ready.zip..."
scp evercold-production-ready.zip $SSH_HOST:/opt/evercold/

echo "✅ Upload complete"

# Step 3: Extract and install dependencies
echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "📦 Step 3: Extracting and installing dependencies..."
echo "════════════════════════════════════════════════════════════════════"

ssh $SSH_HOST << 'ENDSSH'
cd /opt/evercold

# Extract ZIP
echo "Extracting files..."
unzip -o evercold-production-ready.zip
rm evercold-production-ready.zip

# Install dependencies
echo ""
echo "Installing npm dependencies (this takes 2-3 minutes)..."
npm install --production --legacy-peer-deps

echo "✅ Dependencies installed"

# Verify critical files
echo ""
echo "Verifying installation..."
ls -lh server.js
ls -lh package.json
ls -ld .next/
echo "✅ All files verified"
ENDSSH

# Step 4: Create .env.production
echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "🔧 Step 4: Creating .env.production..."
echo "════════════════════════════════════════════════════════════════════"

# Ask for database credentials
echo ""
echo "Please provide database credentials for ice.erpstable.com:"
read -p "Database host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database name: " DB_NAME
read -p "Database user: " DB_USER
read -sp "Database password: " DB_PASS
echo ""

# URL encode the password
DB_PASS_ENCODED=$(echo -n "$DB_PASS" | jq -sRr @uri)

ssh $SSH_HOST << ENDSSH
cat > /opt/evercold/.env.production << 'ENVEOF'
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Database
DATABASE_URL=mysql://${DB_USER}:${DB_PASS_ENCODED}@${DB_HOST}:3306/${DB_NAME}

# App URL
NEXTAUTH_URL=https://${DOMAIN}
NEXT_PUBLIC_APP_URL=https://${DOMAIN}
ENVEOF

echo "✅ .env.production created"
ENDSSH

# Step 5: Set up PM2
echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "🔄 Step 5: Setting up PM2..."
echo "════════════════════════════════════════════════════════════════════"

ssh $SSH_HOST << 'ENDSSH'
# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Stop any existing process
pm2 stop evercold-crm 2>/dev/null || true
pm2 delete evercold-crm 2>/dev/null || true

# Create PM2 ecosystem config
cat > /opt/evercold/ecosystem.config.js << 'ECOEOF'
module.exports = {
  apps: [{
    name: 'evercold-crm',
    script: './server.js',
    cwd: '/opt/evercold',
    instances: 1,
    exec_mode: 'fork',
    env_file: '.env.production',
    error_file: '/var/log/evercold/error.log',
    out_file: '/var/log/evercold/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '500M',
    restart_delay: 4000,
    watch: false,
    autorestart: true
  }]
}
ECOEOF

# Start with PM2
cd /opt/evercold
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Set up PM2 to start on boot (if not already done)
pm2 startup systemd -u root --hp /root 2>&1 | grep -v "systemctl enable" || true

echo "✅ PM2 configured and started"
pm2 status
ENDSSH

# Step 6: Create Nginx configuration
echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "🌐 Step 6: Configuring Nginx..."
echo "════════════════════════════════════════════════════════════════════"

ssh $SSH_HOST << 'ENDSSH'
cat > /etc/nginx/sites-available/ice.erpstable.com << 'NGINXEOF'
# Nginx configuration for Evercold CRM (Next.js)
# Domain: ice.erpstable.com

upstream evercold_app {
    server localhost:3000 fail_timeout=0;
    keepalive 32;
}

server {
    listen 80;
    server_name ice.erpstable.com;

    client_max_body_size 50M;

    # Logging
    access_log /var/log/nginx/ice.erpstable.com_access.log;
    error_log /var/log/nginx/ice.erpstable.com_error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Next.js app
    location / {
        proxy_pass http://evercold_app;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Next.js static files
    location /_next/static {
        proxy_cache STATIC;
        proxy_pass http://evercold_app;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Public files
    location /public {
        proxy_pass http://evercold_app;
        add_header Cache-Control "public, max-age=3600";
    }

    # Favicon
    location = /favicon.ico {
        proxy_pass http://evercold_app;
        access_log off;
        log_not_found off;
    }
}
NGINXEOF

# Enable site
ln -sf /etc/nginx/sites-available/ice.erpstable.com /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

echo "✅ Nginx configured and reloaded"
ENDSSH

# Step 7: Set up SSL with Certbot
echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "🔒 Step 7: Setting up SSL certificate..."
echo "════════════════════════════════════════════════════════════════════"

ssh $SSH_HOST << 'ENDSSH'
# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Obtain SSL certificate
echo ""
echo "Obtaining SSL certificate for ice.erpstable.com..."
certbot --nginx -d ice.erpstable.com --non-interactive --agree-tos --email admin@erpstable.com --redirect

echo "✅ SSL certificate installed"
ENDSSH

# Step 8: Verify deployment
echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "🧪 Step 8: Verifying deployment..."
echo "════════════════════════════════════════════════════════════════════"

ssh $SSH_HOST << 'ENDSSH'
# Check PM2 status
echo "PM2 Status:"
pm2 status

# Test local connection
echo ""
echo "Testing localhost:3000..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ]; then
    echo "✅ App responding on localhost:3000 (HTTP $HTTP_CODE)"
else
    echo "⚠️  App returned HTTP $HTTP_CODE"
fi

# Test external connection
echo ""
echo "Testing https://ice.erpstable.com..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://ice.erpstable.com 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ]; then
    echo "✅ Site accessible at https://ice.erpstable.com (HTTP $HTTP_CODE)"
else
    echo "⚠️  Site returned HTTP $HTTP_CODE"
fi
ENDSSH

# Final summary
echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE!"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "🌍 Your application is now live at:"
echo "   https://ice.erpstable.com"
echo ""
echo "📊 Useful commands (run on server via SSH):"
echo "   pm2 status                # View app status"
echo "   pm2 logs evercold-crm     # View logs"
echo "   pm2 restart evercold-crm  # Restart app"
echo "   pm2 monit                 # Real-time monitoring"
echo ""
echo "🧪 Test your deployment:"
echo "   1. Open https://ice.erpstable.com in browser"
echo "   2. Test login"
echo "   3. Upload Excel file (test auto-customer creation)"
echo "   4. Generate invoice (test PDFKit)"
echo ""
echo "════════════════════════════════════════════════════════════════════"
