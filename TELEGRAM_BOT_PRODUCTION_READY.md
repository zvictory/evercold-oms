# 🤖 Telegram Bot - Production Ready

## ✅ Status: ACTIVE & CONNECTED

The Telegram bot is now fully operational on the production server.

---

## 📱 Bot Information

**Webhook URL:** `https://ice.erpstable.com/api/telegram/webhook`
**Server IP:** 173.212.195.32
**Status:** Connected (40 max connections)
**Mode:** Webhook (production-ready, no polling needed)

---

## 🔍 How to Find Your Bot

1. **Get your bot username** from @BotFather on Telegram
2. **Search** for your bot in Telegram
3. **Start** a conversation with `/start`

**Or:** If you have the bot link from BotFather, use that directly.

---

## 🎯 Bot Features

### Available Commands:
- `/start` - Welcome message and command list
- `/help` - Show help information
- `/order` - Create a new order
- `/cancel` - Cancel current order

### Order Creation Flow:
1. Customer sends `/order`
2. Bot requests phone number (using contact share button)
3. Bot asks for company name
4. Bot shows available branches to select
5. Bot displays products (3kg ice, 1kg ice)
6. Customer enters quantities
7. Bot confirms order details
8. Order is created in the system

---

## 🔧 Technical Details

### Webhook Configuration:
```json
{
  "url": "https://ice.erpstable.com/api/telegram/webhook",
  "has_custom_certificate": false,
  "pending_update_count": 0,
  "max_connections": 40,
  "ip_address": "173.212.195.32"
}
```

### Environment Variables (already set):
```bash
TELEGRAM_BOT_TOKEN=8278817835:AAHAMW7BIYBmpPJagODSuwZovZjMgGb_EN8
```

### API Endpoint:
**POST** `/api/telegram/webhook`
- Receives updates from Telegram
- Processes commands and messages
- Creates orders in database via Prisma

---

## 🧪 Testing Your Bot

1. **Find your bot** in Telegram (search by username from @BotFather)
2. **Send** `/start` - Should receive welcome message
3. **Send** `/order` - Should start order creation flow
4. **Share contact** when prompted
5. **Enter company name** - Bot will search for customer
6. **Select branch** - Bot shows available branches
7. **Add products** - Bot shows 3kg and 1kg ice options
8. **Enter quantities** - Bot calculates totals
9. **Confirm** - Order created in system

---

## 📊 Monitoring Bot Activity

### View Telegram webhook logs:
```bash
ssh ice-production
pm2 logs evercold-crm | grep -i telegram
```

### Check webhook status:
```bash
curl "https://api.telegram.org/bot8278817835:AAHAMW7BIYBmpPJagODSuwZovZjMgGb_EN8/getWebhookInfo"
```

### Test webhook endpoint:
```bash
curl https://ice.erpstable.com/api/telegram/webhook
# Should return: Method Not Allowed (POST expected)
```

---

## 🔄 Webhook Management

### Re-register webhook (if needed):
```bash
bash setup-telegram-webhook.sh
```

### Delete webhook (switch to polling for development):
```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook"
```

### Check pending updates:
```bash
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates"
```

---

## ⚠️ Important Notes

1. **Webhook mode is automatic** - No need to run separate bot process
2. **Uses production database** - Orders created via bot appear in the main system
3. **Session storage** - Currently in-memory (resets on server restart)
   - For production, consider Redis for persistent sessions
4. **SSL required** - Telegram webhooks require HTTPS (already configured)

---

## 🛠 Troubleshooting

### Bot not responding?

1. **Check webhook status:**
   ```bash
   curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
   ```

2. **Check server logs:**
   ```bash
   ssh ice-production
   pm2 logs evercold-crm --lines 50 | grep telegram
   ```

3. **Verify environment variable:**
   ```bash
   ssh ice-production
   cd /var/www/evercold
   grep TELEGRAM_BOT_TOKEN .env
   ```

4. **Re-register webhook:**
   ```bash
   bash setup-telegram-webhook.sh
   ```

### Webhook errors?

Check application logs for errors:
```bash
ssh ice-production "pm2 logs evercold-crm --err --lines 100"
```

---

## 🚀 Next Steps

1. **Find your bot** on Telegram
2. **Test order creation** with `/order` command
3. **Verify orders** appear in the main application
4. **Monitor logs** for any errors

---

**Last Updated:** 2026-02-16
**Status:** ✅ Production Ready
