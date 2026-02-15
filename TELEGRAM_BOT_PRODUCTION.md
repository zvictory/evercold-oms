# 📱 Telegram Bot Production Setup - Complete Guide

**Bot Name**: EverCold Orders Bot
**Domain**: app.evercold.uz
**Webhook**: https://app.evercold.uz/api/telegram/webhook

---

## ⚡ Quick Setup (After App Deployment)

### 1️⃣ Get Bot Token (if you don't have it)

```
1. Open Telegram → Search @BotFather
2. Send: /newbot
3. Name: EverCold Orders
4. Username: evercold_orders_bot (or your choice)
5. Copy token: 1234567890:ABCdefGHI...
```

---

### 2️⃣ Add Token to Environment

**Server: `/var/www/vhosts/evercold.uz/httpdocs/.env`**

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
```

**Restart app:**
```bash
# Via Plesk Node.js panel (click Restart)
# OR via PM2:
pm2 restart evercold-crm
```

---

### 3️⃣ Set Webhook

**After app is running:**

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://app.evercold.uz/api/telegram/webhook"
```

**Expected response:**
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

---

### 4️⃣ Verify Webhook

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

**Expected:**
```json
{
  "ok": true,
  "result": {
    "url": "https://app.evercold.uz/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40
  }
}
```

---

### 5️⃣ Test Bot

1. Open Telegram
2. Search for your bot username
3. Send: `/start`
4. Expected: Welcome message
5. Send: `/order`
6. Expected: Order creation flow starts

---

## 🔧 Troubleshooting

### Problem: Bot doesn't respond

**Check 1: Webhook set correctly?**
```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

If `url` is wrong or empty:
```bash
# Reset webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://app.evercold.uz/api/telegram/webhook"
```

---

**Check 2: Webhook endpoint accessible?**
```bash
curl -X POST https://app.evercold.uz/api/telegram/webhook
```

Expected: `405 Method Not Allowed` (this is CORRECT - means endpoint exists)

If you get `404 Not Found`:
- App is not running
- Route not configured
- Check logs

---

**Check 3: App has bot token?**
```bash
# SSH to server
ssh user@app.evercold.uz
cd /var/www/vhosts/evercold.uz/httpdocs
cat .env | grep TELEGRAM_BOT_TOKEN
```

Should show: `TELEGRAM_BOT_TOKEN=123456789:ABC...`

If missing:
```bash
echo "TELEGRAM_BOT_TOKEN=your_token_here" >> .env
# Restart app
```

---

**Check 4: SSL certificate valid?**
```bash
curl -I https://app.evercold.uz
```

Should return: `200 OK` with HTTPS

If SSL error:
- Telegram requires valid HTTPS for webhooks
- Enable SSL via Plesk (Let's Encrypt)
- Self-signed certificates won't work

---

### Problem: Bot responds but orders fail

**Check database connection:**
```bash
ssh user@app.evercold.uz
cd /var/www/vhosts/evercold.uz/httpdocs
npx prisma studio
```

Should open Prisma Studio (Ctrl+C to exit)

**Check database has data:**
```bash
psql -U evercold_user -d evercold_production -c "SELECT COUNT(*) FROM \"Customer\";"
```

Should return count > 0

If no customers:
- Create customers via web interface first
- Bot needs existing customers to create orders

---

### Problem: Webhook suddenly stopped working

**Common causes:**
1. **SSL certificate expired** → Renew via Plesk
2. **App crashed** → Check logs, restart
3. **Telegram rate limiting** → Wait 1 hour
4. **Webhook URL changed** → Reset webhook

**Quick fix:**
```bash
# Delete webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

# Wait 30 seconds

# Set webhook again
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://app.evercold.uz/api/telegram/webhook"
```

---

## 📊 Testing Checklist

| Test | Command | Expected Result | Status |
|------|---------|-----------------|--------|
| **Bot responds** | Send `/start` in Telegram | Welcome message | ⬜ |
| **Order flow starts** | Send `/order` | Phone number request | ⬜ |
| **Customer found** | Send contact | Customer list appears | ⬜ |
| **Branch selection** | Select customer | Branch list appears | ⬜ |
| **Product list** | Select branch | Product buttons appear | ⬜ |
| **Quantity input** | Select product | Quantity prompt | ⬜ |
| **Order creation** | Confirm order | Order created in DB | ⬜ |
| **Cancel works** | Send `/cancel` | Order cancelled | ⬜ |

---

## 🔐 Security Notes

### Bot Token Security

**✅ DO:**
- Store token in `.env` file (server-side only)
- Never commit `.env` to git
- Use environment variables

**❌ DON'T:**
- Hardcode token in source code
- Share token publicly
- Commit to GitHub/GitLab

---

### Webhook Security (Optional Enhancement)

Add webhook secret validation:

**1. Generate secret:**
```bash
openssl rand -hex 32
```

**2. Add to .env:**
```bash
TELEGRAM_WEBHOOK_SECRET=your_generated_secret
```

**3. Set webhook with secret:**
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://app.evercold.uz/api/telegram/webhook&secret_token=your_generated_secret"
```

**4. Update webhook handler** to verify `X-Telegram-Bot-Api-Secret-Token` header.

---

## 📈 Monitoring

### View Bot Activity

**Method 1: App logs**
```bash
ssh user@app.evercold.uz
tail -f /var/www/vhosts/evercold.uz/logs/node_app_output.log | grep telegram
```

**Method 2: Database queries**
```bash
psql -U evercold_user -d evercold_production

-- Orders created via Telegram (today)
SELECT COUNT(*) FROM "Order"
WHERE "sourceType" = 'TELEGRAM'
AND "createdAt"::date = CURRENT_DATE;

-- All Telegram orders
SELECT COUNT(*) FROM "Order" WHERE "sourceType" = 'TELEGRAM';
```

**Method 3: Telegram API**
```bash
# Get bot info
curl "https://api.telegram.org/bot<TOKEN>/getMe"

# Get updates (last 24 hours)
curl "https://api.telegram.org/bot<TOKEN>/getUpdates"
```

---

## 🎯 Production Best Practices

### 1. Error Notifications

**Setup admin notifications:**

Update `src/lib/telegram/bot.ts` to send errors to admin chat:

```typescript
// In catch blocks:
catch (error) {
  console.error('Bot error:', error);

  // Notify admin
  await bot.telegram.sendMessage(
    ADMIN_CHAT_ID, // Your Telegram chat ID
    `🚨 Bot Error: ${error.message}`
  );
}
```

Get your chat ID:
```bash
# Send message to your bot, then:
curl "https://api.telegram.org/bot<TOKEN>/getUpdates"
# Look for "chat":{"id":123456789}
```

---

### 2. Rate Limiting

Telegram limits:
- **30 messages/second** to same chat
- **20 API calls/second** globally

Your app handles this automatically via `telegraf` library.

---

### 3. Session Storage

**Current**: In-memory (lost on restart)

**Production upgrade** (optional):

Use Redis for persistent sessions:

```bash
# Install Redis
apt-get install redis-server

# Install Redis client
npm install ioredis

# Update bot.ts to use Redis sessions
```

This allows:
- Sessions survive app restarts
- Better for multiple app instances (if you scale)

**For single server**: In-memory is fine.

---

## 🔄 Deployment Flow with Bot

### Initial Deployment

```
1. Deploy app → Plesk/PM2
2. Verify app is running (health check)
3. Set Telegram webhook
4. Test bot
```

### Subsequent Deployments

```
1. Deploy app update
2. App restarts automatically
3. Webhook remains active
4. No bot configuration needed
```

**Note**: Webhook survives app restarts. Only set once.

---

## 📞 Support Commands

```bash
# Get bot info
curl "https://api.telegram.org/bot<TOKEN>/getMe"

# Check webhook status
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Delete webhook (if switching to polling)
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

# Set webhook (production)
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://app.evercold.uz/api/telegram/webhook"

# Test webhook endpoint
curl -X POST https://app.evercold.uz/api/telegram/webhook

# View app logs
tail -f /var/www/vhosts/evercold.uz/logs/node_app_output.log
```

---

## ✅ Final Verification

Before going live:

- [ ] Bot token in `.env`
- [ ] App deployed and running
- [ ] SSL certificate valid
- [ ] Webhook set correctly
- [ ] `/start` command works
- [ ] `/order` creates orders
- [ ] Orders appear in database
- [ ] Web interface shows Telegram orders
- [ ] Admin can see orders with `sourceType: TELEGRAM`

---

## 🎉 Success Indicators

**Bot is working correctly when:**

1. ✅ `/start` → Welcome message appears
2. ✅ `/order` → Phone number request
3. ✅ Customers list appears
4. ✅ Products show correct prices
5. ✅ Orders save to database
6. ✅ Orders visible in web admin panel
7. ✅ Order numbers start with "TG-"

**Check database:**
```sql
SELECT "orderNumber", "totalAmount", "createdAt"
FROM "Order"
WHERE "sourceType" = 'TELEGRAM'
ORDER BY "createdAt" DESC
LIMIT 5;
```

---

## 🚨 Emergency: Bot Down

**Quick recovery:**

```bash
# 1. Check app is running
curl https://app.evercold.uz/api/health

# 2. Restart app
pm2 restart evercold-crm
# or via Plesk Node.js panel

# 3. Reset webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://app.evercold.uz/api/telegram/webhook"

# 4. Test
# Send /start to bot
```

**If still broken:**
1. Check logs: `tail -f /var/www/vhosts/evercold.uz/logs/node_app_error.log`
2. Verify database connection
3. Check SSL certificate validity
4. Contact Telegram support (rare)

---

**Questions? See troubleshooting section or check webhook status first.**

Last Updated: 2026-02-14
