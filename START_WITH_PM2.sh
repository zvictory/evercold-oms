#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 EVERCOLD CRM - START WITH PM2 (Recommended)
# ═══════════════════════════════════════════════════════════════════════════════
#
# Run this script on your production server to start the app with PM2
# PM2 is more reliable than Plesk's built-in Node.js manager
#
# Usage:
#   ssh root@135.181.84.232
#   cd /var/www/vhosts/evercold.uz/app.evercold.uz
#   bash START_WITH_PM2.sh
#

set -e  # Exit on error

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "🚀 Starting Evercold CRM with PM2"
echo "═══════════════════════════════════════════════════════════════════════════════"

# 1. Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
    echo "✅ PM2 installed"
else
    echo "✅ PM2 already installed"
fi

# 2. Stop any existing process
echo ""
echo "🛑 Stopping any existing Evercold process..."
pm2 stop evercold-crm 2>/dev/null || echo "   (No existing process found)"
pm2 delete evercold-crm 2>/dev/null || echo "   (Nothing to delete)"

# 3. Start the app with PM2
echo ""
echo "🚀 Starting Evercold CRM..."
cd /var/www/vhosts/evercold.uz/app.evercold.uz

pm2 start server.js \
  --name evercold-crm \
  --env production \
  --max-memory-restart 500M \
  --log /var/www/vhosts/evercold.uz/logs/evercold-pm2.log \
  --error /var/www/vhosts/evercold.uz/logs/evercold-pm2-error.log

# 4. Save PM2 process list
echo ""
echo "💾 Saving PM2 process list..."
pm2 save

# 5. Set PM2 to start on boot
echo ""
echo "🔄 Configuring PM2 to start on system boot..."
pm2 startup systemd -u root --hp /root

# 6. Show status
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "✅ EVERCOLD CRM IS NOW RUNNING WITH PM2"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
pm2 status
echo ""
pm2 info evercold-crm
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "📊 Useful PM2 Commands:"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "  pm2 status             # View all processes"
echo "  pm2 logs evercold-crm  # View live logs"
echo "  pm2 restart evercold-crm  # Restart the app"
echo "  pm2 stop evercold-crm  # Stop the app"
echo "  pm2 monit              # Real-time monitoring dashboard"
echo ""
echo "🌍 Your app should now be accessible at: https://app.evercold.uz"
echo ""
echo "🧪 Test it:"
echo "  curl -I https://app.evercold.uz/api/health"
echo "  Should return: HTTP/2 200"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
