# ⚡ Quick Deployment Guide - app.evercold.uz

**For experienced users who want the TL;DR version.**

---

## 🎯 Prerequisites

- [ ] Plesk server with SSH access
- [ ] Domain `app.evercold.uz` pointed to server IP
- [ ] PostgreSQL installed
- [ ] Node.js 20.x installed
- [ ] Telegram bot token from @BotFather

---

## 🚀 5-Minute Deploy (Plesk Node.js)

### 1. Prepare Locally

```bash
# Build production bundle
npm run build:production

# Create deployment package
tar -czf evercold-deploy.tar.gz \
  .next public prisma package*.json \
  server.js next.config.ts .env.production
```

---

### 2. Upload to Plesk

**Via SCP:**
```bash
scp evercold-deploy.tar.gz user@app.evercold.uz:/var/www/vhosts/evercold.uz/httpdocs/
```

**Via Plesk File Manager:**
- Upload `evercold-deploy.tar.gz`
- Extract in `/httpdocs`

---

### 3. Server Setup (SSH)

```bash
ssh user@app.evercold.uz
cd /var/www/vhosts/evercold.uz/httpdocs

# Extract files
tar -xzf evercold-deploy.tar.gz

# Setup environment
mv .env.production .env
# EDIT .env with correct DATABASE_URL

# Install dependencies
npm ci --omit=dev --legacy-peer-deps

# Database setup
npx prisma generate
npx prisma migrate deploy
```

---

### 4. Configure Plesk

**Go to:** Domains → evercold.uz → Node.js

| Setting | Value |
|---------|-------|
| Node.js Version | 20.x |
| Application Mode | Production |
| Application Startup File | `server.js` |
| Application Root | `/httpdocs` |

Click **Enable Node.js** → **Restart App**

---

### 5. Setup Database (One-Time)

**Plesk GUI:** Databases → Add Database

```
Name: evercold_production
User: evercold_user
Password: [Generate Strong Password]
```

**Update `.env`:**
```bash
DATABASE_URL=postgresql://evercold_user:PASSWORD@localhost:5432/evercold_production
```

---

### 6. Enable SSL

**Plesk GUI:** SSL/TLS Certificates → Let's Encrypt

- Select `app.evercold.uz`
- Click **Get It Free**

---

### 7. Configure Telegram Bot

```bash
# Set webhook
curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://app.evercold.uz/api/telegram/webhook"

# Verify
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo"
```

---

## ✅ Verify

```bash
# Health check
curl https://app.evercold.uz/api/health
# Expected: {"status":"ok"}

# Test login
open https://app.evercold.uz/login

# Test Telegram bot
# Send /start to your bot in Telegram
```

---

## 🔄 Update Deployment (Subsequent Deploys)

```bash
# LOCAL: Build
npm run build:production

# LOCAL: Package & Upload
tar -czf evercold-deploy.tar.gz .next public
scp evercold-deploy.tar.gz user@app.evercold.uz:/var/www/vhosts/evercold.uz/httpdocs/

# SERVER: Extract & Restart
ssh user@app.evercold.uz
cd /var/www/vhosts/evercold.uz/httpdocs
tar -xzf evercold-deploy.tar.gz
# Restart via Plesk Node.js panel or:
pm2 restart evercold-crm
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| **App not starting** | Check logs: `/var/www/vhosts/evercold.uz/logs/node_app_error.log` |
| **Database error** | Verify `DATABASE_URL` in `.env` |
| **Telegram bot silent** | Reset webhook (see step 7 above) |
| **502 Bad Gateway** | Restart app via Plesk Node.js panel |
| **File upload fails** | `chmod 755 /var/www/vhosts/evercold.uz/httpdocs/public/uploads` |

---

## 📊 Essential Commands

```bash
# View logs
tail -f /var/www/vhosts/evercold.uz/logs/node_app_output.log

# Database backup
pg_dump -U evercold_user evercold_production > backup.sql

# Restart app
# Via Plesk Node.js panel or:
pm2 restart evercold-crm

# Check process
ps aux | grep node
```

---

## 🔐 Environment Variables Checklist

```bash
# .env (production)
DATABASE_URL=postgresql://evercold_user:PASSWORD@localhost:5432/evercold_production
NODE_ENV=production
PORT=3000
TELEGRAM_BOT_TOKEN=your_bot_token
YANDEX_MAPS_API_KEY=your_key
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=your_key
JWT_SECRET=generate_64_char_random_string
CRON_SECRET=generate_32_char_random_string
```

---

**For detailed step-by-step instructions, see: `PRODUCTION_DEPLOYMENT_PLESK.md`**
