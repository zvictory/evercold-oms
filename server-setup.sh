#!/bin/bash
# Evercold CRM Server Setup Script
# Run this once on the production server to initialize the environment
# Usage: sudo bash server-setup.sh

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Evercold CRM Server Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ This script must be run as root (use: sudo bash server-setup.sh)"
  exit 1
fi

echo "📦 Step 1: Updating system packages..."
apt-get update
apt-get upgrade -y
echo "✅ System packages updated"

echo ""
echo "📦 Step 2: Installing Node.js 20.x (LTS)..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  echo "✅ Node.js installed: $(node --version)"
else
  echo "✅ Node.js already installed: $(node --version)"
fi

echo ""
echo "📦 Step 3: Installing PM2 globally..."
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
  pm2 startup systemd -u root --hp /root
  echo "✅ PM2 installed and configured for startup"
else
  echo "✅ PM2 already installed"
fi

echo ""
echo "📦 Step 4: Installing Nginx..."
if ! command -v nginx &> /dev/null; then
  apt-get install -y nginx
  systemctl enable nginx
  systemctl start nginx
  echo "✅ Nginx installed and enabled"
else
  echo "✅ Nginx already installed"
fi

echo ""
echo "📦 Step 5: Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
  apt-get install -y postgresql postgresql-contrib
  systemctl enable postgresql
  systemctl start postgresql
  echo "✅ PostgreSQL installed and enabled"
else
  echo "✅ PostgreSQL already installed"
fi

echo ""
echo "📦 Step 6: Installing SSL utilities..."
apt-get install -y certbot python3-certbot-nginx curl wget git
echo "✅ SSL utilities installed"

echo ""
echo "📦 Step 7: Creating deployment directory..."
mkdir -p /var/www/evercold
chmod 755 /var/www/evercold
echo "✅ Directory created: /var/www/evercold"

echo ""
echo "📦 Step 8: Setting up PostgreSQL database..."
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE IF NOT EXISTS evercold_production;

-- Create user
DO \$\$ BEGIN
  CREATE USER evercold_user WITH ENCRYPTED PASSWORD 'GeuibPRKiASR0pbSSFTcshA5aoBNNNYGuyAvt9lChZ8=';
EXCEPTION WHEN DUPLICATE_OBJECT THEN
  ALTER USER evercold_user WITH ENCRYPTED PASSWORD 'GeuibPRKiASR0pbSSFTcshA5aoBNNNYGuyAvt9lChZ8=';
END \$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE evercold_production TO evercold_user;
ALTER DATABASE evercold_production OWNER TO evercold_user;

-- Allow evercold_user to create extensions if needed
ALTER USER evercold_user CREATEDB;
EOF
echo "✅ Database and user created"

echo ""
echo "📦 Step 9: Setting up firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "✅ Firewall configured"

echo ""
echo "📦 Step 10: Creating log directories..."
mkdir -p /var/log/pm2
mkdir -p /var/log/nginx
mkdir -p /backups
chmod 755 /var/log/pm2 /var/log/nginx /backups
echo "✅ Log directories created"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Server setup completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo "  1. Run: ssh ice-production 'bash /var/www/evercold/deploy.sh'"
echo "  2. Configure Nginx: Create /etc/nginx/sites-available/evercold"
echo "  3. Obtain SSL certificate: sudo certbot --nginx -d ice.erpstable.com"
echo ""
echo "✨ Your server is ready for deployment!"
