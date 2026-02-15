#!/bin/bash
echo "════════════════════════════════════════════════════════════════════"
echo "🔍 VERIFYING PLESK CONFIGURATION"
echo "════════════════════════════════════════════════════════════════════"
echo ""

echo "1. Checking if Node.js process is running..."
echo "────────────────────────────────────────────────────────────────────"
if ps aux | grep -v grep | grep "node.*server.js" > /dev/null; then
    echo "✅ Node.js process is RUNNING"
    ps aux | grep -v grep | grep "node.*server.js"
else
    echo "❌ Node.js process is NOT running"
    echo "   This means Plesk hasn't started the app yet."
fi
echo ""

echo "2. Checking server.js file..."
echo "────────────────────────────────────────────────────────────────────"
if [ -f "/var/www/vhosts/evercold.uz/app.evercold.uz/server.js" ]; then
    ls -lh /var/www/vhosts/evercold.uz/app.evercold.uz/server.js
    echo "✅ server.js exists"
else
    echo "❌ server.js not found!"
fi
echo ""

echo "3. Checking .env.production file..."
echo "────────────────────────────────────────────────────────────────────"
if [ -f "/var/www/vhosts/evercold.uz/app.evercold.uz/.env.production" ]; then
    echo "✅ .env.production exists"
    echo "Contents (secrets masked):"
    cat /var/www/vhosts/evercold.uz/app.evercold.uz/.env.production | sed 's/:[^@]*@/:***@/g'
else
    echo "⚠️  .env.production not found (will use Plesk environment variables)"
fi
echo ""

echo "4. Testing health endpoint..."
echo "────────────────────────────────────────────────────────────────────"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://app.evercold.uz/api/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API is responding! HTTP $HTTP_CODE"
    echo "   Your app is WORKING!"
else
    echo "❌ API returned HTTP $HTTP_CODE"
    if [ "$HTTP_CODE" = "500" ]; then
        echo "   This means Node.js is not running."
    elif [ "$HTTP_CODE" = "502" ]; then
        echo "   This means proxy cannot connect to Node.js."
    fi
fi
echo ""

echo "5. Checking recent error logs..."
echo "────────────────────────────────────────────────────────────────────"
if [ -f "/var/www/vhosts/evercold.uz/logs/error_log" ]; then
    echo "Last 10 lines of error_log:"
    tail -10 /var/www/vhosts/evercold.uz/logs/error_log
else
    echo "No error log found"
fi
echo ""

echo "════════════════════════════════════════════════════════════════════"
echo "📊 SUMMARY"
echo "════════════════════════════════════════════════════════════════════"
if [ "$HTTP_CODE" = "200" ]; then
    echo "🎉 SUCCESS! Your app is running and responding to requests."
    echo ""
    echo "Next steps:"
    echo "  1. Open https://app.evercold.uz in browser"
    echo "  2. Test auto-customer creation (upload Excel)"
    echo "  3. Test invoice generation"
else
    echo "⚠️  App is not running yet. Try these steps:"
    echo ""
    echo "  1. In Plesk, disable Node.js → Apply → enable Node.js → Apply"
    echo "  2. Click 'Restart App' button"
    echo "  3. Wait 30 seconds and run this script again"
    echo ""
    echo "  OR use PM2 instead (more reliable):"
    echo "  bash START_WITH_PM2.sh"
fi
echo "════════════════════════════════════════════════════════════════════"
