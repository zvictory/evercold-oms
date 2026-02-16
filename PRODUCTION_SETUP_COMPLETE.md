# ✅ Production Setup Complete

## 🌍 Live Application
**URL:** https://ice.erpstable.com
**Server:** 173.212.195.32 (ice-production)
**Status:** ✅ Online
**PM2 Process:** evercold-crm (PORT 3000)

---

## 📦 Deployed Features

### PDF Invoice System
- ✅ 2 copies per A4 sheet (supplier + customer)
- ✅ Cutting guide with scissors icon
- ✅ Dynamic supplier/buyer alignment
- ✅ 0.5pt table borders
- ✅ Compact header layout (8pt/7pt fonts)
- ✅ Cyrillic-to-Latin filename transliteration
- ✅ English filenames: `Invoice_18_16022026_Customer_Name.pdf`

### Core Features
- ✅ Order management
- ✅ Customer auto-creation from Excel imports
- ✅ Prices functionality
- ✅ Drivers & vehicles management
- ✅ Branch management
- ✅ Product catalog

### Telegram Bot
- ✅ Webhook mode (production)
- ✅ Connected to: https://ice.erpstable.com/api/telegram/webhook
- ✅ Commands: /start, /order, /help, /cancel
- ✅ Order creation with guided flow

---

## 🚫 Local Development - STOPPED

**What's NOT running locally:**
- ❌ No local Next.js dev server
- ❌ No local Telegram bot (polling mode)
- ❌ No local processes on ports 3000/3001

**Why:** All services now run on production server using webhook mode.

---

## 🎯 How to Use

### Access the Application
1. Open: https://ice.erpstable.com
2. Login with your credentials
3. All features available online

### Use Telegram Bot
1. Find your bot on Telegram (@YourBotName from BotFather)
2. Send `/start` to begin
3. Send `/order` to create orders
4. Bot creates orders directly in production database

---

## 🔧 Server Management

### SSH Access
```bash
ssh ice-production
```

### PM2 Commands
```bash
pm2 status                  # Check app status
pm2 logs evercold-crm       # View live logs
pm2 restart evercold-crm    # Restart application
pm2 monit                   # Real-time monitoring
```

### Check Bot Logs
```bash
ssh ice-production "pm2 logs evercold-crm | grep -i telegram"
```

---

## 📊 Monitoring

### Application Health
```bash
curl https://ice.erpstable.com/api/health
```

### Telegram Webhook Status
```bash
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

### Database Connection
- Location: localhost:3306
- Database: ever_cold
- Status: Connected via Prisma

---

## 🔄 Future Deployments

### Deploy New Changes
1. Make changes locally
2. Commit to git: `git commit -am "description"`
3. Build: `npm run build:production`
4. Deploy: `bash deploy.sh` (or tar over SSH as we did)
5. Server auto-restarts with PM2

### Quick Deploy Script
```bash
# Build and deploy
npm run build:production && \
tar -czf - .next public prisma package.json package-lock.json next.config.ts .env.production prisma.config.ts ecosystem.config.js | \
ssh ice-production "cd /var/www/evercold && tar -xzf - && npm ci --omit=dev && pm2 restart evercold-crm"
```

---

## 📝 Important Files on Server

```
/var/www/evercold/
├── .next/                  # Built Next.js app
├── public/                 # Static assets
├── prisma/                 # Database schema
├── node_modules/           # Dependencies
├── .env                    # Production environment
├── ecosystem.config.js     # PM2 configuration
└── package.json           # Dependencies list
```

---

## 🎉 What's Working

✅ Next.js application (SSR + API routes)
✅ PostgreSQL database via Prisma
✅ PM2 process management
✅ PDF generation with PDFKit
✅ Excel file parsing
✅ Telegram bot webhooks
✅ Customer auto-creation
✅ Invoice generation (2 per sheet)
✅ Drivers & vehicles management
✅ All CRUD operations

---

## 📞 Need Help?

### View Logs
```bash
ssh ice-production "pm2 logs evercold-crm --lines 100"
```

### Restart Application
```bash
ssh ice-production "pm2 restart evercold-crm"
```

### Check Environment
```bash
ssh ice-production "cd /var/www/evercold && cat .env"
```

---

**Last Updated:** 2026-02-16
**Deployment:** Successful
**Local Services:** Stopped (using production only)
