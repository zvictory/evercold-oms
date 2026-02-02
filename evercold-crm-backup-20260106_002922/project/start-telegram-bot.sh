#!/bin/bash

# EverCold Telegram Bot Startup Script
# This script starts the Next.js server with localtunnel and configures the Telegram webhook

echo "🚀 Starting EverCold CRM with Telegram Bot..."

# Check if server is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Next.js server already running on port 3000"
else
    echo "📦 Starting Next.js server..."
    npm run dev > /tmp/nextjs-dev.log 2>&1 &
    sleep 5
    echo "✅ Next.js server started"
fi

# Stop any existing tunnels
pkill -f "lt --port" 2>/dev/null

# Start localtunnel
echo "🌐 Starting localtunnel..."
lt --port 3000 --print-requests > /tmp/localtunnel.log 2>&1 &
sleep 5

# Get tunnel URL
TUNNEL_URL=$(grep -o 'https://[^[:space:]]*\.loca\.lt' /tmp/localtunnel.log | head -1)

if [ -z "$TUNNEL_URL" ]; then
    echo "❌ Failed to start tunnel"
    exit 1
fi

echo "✅ Tunnel started: $TUNNEL_URL"

# Set webhook
WEBHOOK_URL="${TUNNEL_URL}/api/telegram/webhook"
BOT_TOKEN="${TELEGRAM_BOT_TOKEN}"

if [ -z "$BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN not set in environment"
    echo "💡 Set it in .env file or export it"
    exit 1
fi

echo "🔗 Setting webhook: $WEBHOOK_URL"
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"${WEBHOOK_URL}\"}")

if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Webhook configured successfully!"
else
    echo "❌ Failed to set webhook"
    echo "$RESPONSE"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ EverCold CRM is now running!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "🌐 Web Interface:  http://localhost:3000"
echo "🌍 Public URL:     $TUNNEL_URL"
echo "🤖 Telegram Bot:   @evercoldbot"
echo "📝 Webhook:        $WEBHOOK_URL"
echo ""
echo "💡 Send /start to @evercoldbot in Telegram to test!"
echo ""
echo "📊 Logs:"
echo "   - Next.js:  tail -f /tmp/nextjs-dev.log"
echo "   - Tunnel:   tail -f /tmp/localtunnel.log"
echo ""
echo "Press Ctrl+C to stop"
echo "═══════════════════════════════════════════════════════"

# Keep script running
tail -f /tmp/localtunnel.log
