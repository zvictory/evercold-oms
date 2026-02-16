#!/bin/bash
# Telegram Bot Webhook Setup for Production

BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-8278817835:AAHAMW7BIYBmpPJagODSuwZovZjMgGb_EN8}"
WEBHOOK_URL="https://ice.erpstable.com/api/telegram/webhook"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🤖 Telegram Bot Webhook Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Bot Token: ${BOT_TOKEN:0:20}..."
echo "Webhook URL: $WEBHOOK_URL"
echo ""

# 1. Get current webhook info
echo "→ Checking current webhook status..."
CURRENT_WEBHOOK=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")
echo "$CURRENT_WEBHOOK" | jq '.' 2>/dev/null || echo "$CURRENT_WEBHOOK"

# 2. Set webhook
echo ""
echo "→ Setting webhook..."
RESULT=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"${WEBHOOK_URL}\"}")

echo "$RESULT" | jq '.' 2>/dev/null || echo "$RESULT"

# 3. Verify webhook was set
echo ""
echo "→ Verifying webhook..."
VERIFY=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")
echo "$VERIFY" | jq '.' 2>/dev/null || echo "$VERIFY"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Webhook setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🧪 Test your bot:"
echo "  1. Open Telegram and search for your bot"
echo "  2. Send /start command"
echo "  3. Try creating an order with /order"
echo ""
