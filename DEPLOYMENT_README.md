# 🚀 Evercold CRM - Production Deployment Documentation

**Welcome!** This directory contains everything you need to deploy Evercold CRM to production on **app.evercold.uz** with Plesk.

---

## 📚 Documentation Index

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **QUICK_DEPLOY_GUIDE.md** | ⚡ TL;DR version for experienced users | Quick reference, subsequent deploys |
| **PRODUCTION_DEPLOYMENT_PLESK.md** | 📖 Complete step-by-step guide (60+ pages) | First-time deployment, troubleshooting |
| **PLESK_VS_PM2_COMPARISON.md** | 🤔 Choosing deployment method | Before starting deployment |
| **TELEGRAM_BOT_PRODUCTION.md** | 📱 Telegram bot setup & troubleshooting | After app deployment |
| **THIS FILE** | 🗺️ Navigation & overview | Start here |

---

## 🎯 Quick Start Path

### First-Time Deployer

```
1. Read: PLESK_VS_PM2_COMPARISON.md (5 min)
   ↓
2. Follow: PRODUCTION_DEPLOYMENT_PLESK.md (1-2 hours)
   ↓
3. Configure: TELEGRAM_BOT_PRODUCTION.md (15 min)
   ↓
4. Save: QUICK_DEPLOY_GUIDE.md (for future updates)
```

---

### Experienced User / Subsequent Deploys

```
1. Use: QUICK_DEPLOY_GUIDE.md (5 min deploy)
   ↓
2. If issues: Troubleshooting in PRODUCTION_DEPLOYMENT_PLESK.md
```

---

## ✅ Deployment Compatibility

### Plesk Compatibility: ✅ **FULLY COMPATIBLE**

Your app is **100% compatible** with Plesk. Both deployment methods work:

| Method | Difficulty | Best For |
|--------|-----------|----------|
| **Plesk Node.js Manager** | ⭐⭐ Easy | GUI users, multi-app hosting |
| **PM2 via SSH** | ⭐⭐⭐⭐ Advanced | DevOps, automation fans |

See `PLESK_VS_PM2_COMPARISON.md` for decision guide.

---

## 🛠️ Pre-Deployment Checklist

Before you start, ensure you have:

- [ ] Plesk server with SSH access
- [ ] Domain `app.evercold.uz` DNS configured
- [ ] PostgreSQL installed on server
- [ ] Node.js 20.x installed
- [ ] Telegram bot token from @BotFather
- [ ] SSL certificate (Let's Encrypt via Plesk)
- [ ] `.env.production` file with correct values

**Missing something?** See `PRODUCTION_DEPLOYMENT_PLESK.md` → Server Setup section.

---

## 📦 What Gets Deployed

```
app.evercold.uz
├── Next.js App (Admin Dashboard, Driver App)
│   ├── Port: 3000
│   ├── Process: PM2 or Plesk Node.js
│   └── SSL: Handled by Nginx (Plesk)
│
├── PostgreSQL Database
│   ├── Name: evercold_production
│   └── User: evercold_user
│
├── Telegram Bot (Webhook Mode)
│   └── Webhook: /api/telegram/webhook
│
└── File Uploads
    └── Directory: /public/uploads
```

---

## 🔐 Critical Environment Variables

**These MUST be set in `.env.production`:**

```bash
# Database (replace with actual credentials)
DATABASE_URL=postgresql://evercold_user:PASSWORD@localhost:5432/evercold_production

# Application
NODE_ENV=production
PORT=3000

# Telegram Bot (from @BotFather)
TELEGRAM_BOT_TOKEN=1234567890:ABCdef...

# API Keys
YANDEX_MAPS_API_KEY=your_key
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=your_key

# Security (generate random strings)
JWT_SECRET=64_character_random_string
CRON_SECRET=32_character_random_string
```

**Generate secure secrets:**
```bash
# JWT_SECRET (64 chars)
openssl rand -base64 48

# CRON_SECRET (32 chars)
openssl rand -hex 32
```

---

## 🚀 Deployment Options

### Option 1: Plesk Node.js (Recommended)

**Pros:**
- ✅ GUI management
- ✅ One-click SSL
- ✅ Built-in process manager
- ✅ Easy for non-technical users

**Steps:**
1. Upload files via Plesk File Manager
2. Configure Node.js panel (set `server.js` as startup file)
3. Click "Enable Node.js"
4. Done!

**Guide:** `PRODUCTION_DEPLOYMENT_PLESK.md` → Option 1

---

### Option 2: PM2 via SSH

**Pros:**
- ✅ Full control
- ✅ Automated deployments via script
- ✅ Advanced monitoring
- ✅ Your existing setup works

**Steps:**
1. Update `deploy.sh` to point to new server
2. Run `npm run deploy`
3. Configure Nginx manually
4. Done!

**Guide:** `PRODUCTION_DEPLOYMENT_PLESK.md` → Option 2

---

## 📱 Telegram Bot Setup

**After app deployment:**

```bash
# 1. Verify bot token in .env
cat .env | grep TELEGRAM_BOT_TOKEN

# 2. Set webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://app.evercold.uz/api/telegram/webhook"

# 3. Test
# Send /start to your bot in Telegram
```

**Full guide:** `TELEGRAM_BOT_PRODUCTION.md`

---

## 🔍 Post-Deployment Verification

**Run these checks after deployment:**

```bash
# Health check
curl https://app.evercold.uz/api/health
# Expected: {"status":"ok"}

# SSL check
curl -I https://app.evercold.uz
# Expected: 200 OK (HTTPS)

# Database check
psql -U evercold_user -d evercold_production -c "SELECT COUNT(*) FROM \"User\";"
# Expected: Returns count

# Telegram webhook check
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
# Expected: url = https://app.evercold.uz/api/telegram/webhook
```

**All passing?** ✅ You're live!

**Something failing?** See troubleshooting in `PRODUCTION_DEPLOYMENT_PLESK.md`

---

## 🔄 Update Deployment Workflow

**For subsequent updates:**

```bash
# LOCAL: Build
npm run build:production

# LOCAL: Package
tar -czf evercold-deploy.tar.gz .next public

# LOCAL: Upload
scp evercold-deploy.tar.gz user@app.evercold.uz:/var/www/vhosts/evercold.uz/httpdocs/

# SERVER: Extract & Restart
ssh user@app.evercold.uz
cd /var/www/vhosts/evercold.uz/httpdocs
tar -xzf evercold-deploy.tar.gz

# Restart via Plesk GUI or:
pm2 restart evercold-crm
```

**Automated option:**
```bash
npm run deploy  # Uses your deploy.sh script
```

---

## 🐛 Common Issues & Quick Fixes

| Problem | Quick Fix | Full Guide |
|---------|-----------|------------|
| **App not starting** | Check logs: `/var/www/vhosts/evercold.uz/logs/node_app_error.log` | PRODUCTION_DEPLOYMENT_PLESK.md |
| **Database error** | Verify `DATABASE_URL` in `.env` | PRODUCTION_DEPLOYMENT_PLESK.md |
| **Telegram bot silent** | Reset webhook (see TELEGRAM_BOT_PRODUCTION.md) | TELEGRAM_BOT_PRODUCTION.md |
| **502 Bad Gateway** | Restart app via Plesk or `pm2 restart` | PRODUCTION_DEPLOYMENT_PLESK.md |
| **SSL issues** | Renew via Plesk SSL panel | PRODUCTION_DEPLOYMENT_PLESK.md |

---

## 📊 Monitoring Commands

```bash
# View app logs
tail -f /var/www/vhosts/evercold.uz/logs/node_app_output.log

# Check app status
ps aux | grep node
# or
pm2 status

# Database backup
pg_dump -U evercold_user evercold_production > backup-$(date +%Y%m%d).sql

# Check webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

---

## 🔐 Security Notes

### Critical Files (NEVER commit to Git)

```
.env
.env.production
.env.local
```

**These contain:**
- Database passwords
- Bot tokens
- API keys
- JWT secrets

**Already in `.gitignore`**: ✅

---

### SSL Certificate

**Plesk handles SSL automatically:**
- Let's Encrypt certificate (free)
- Auto-renewal every 90 days
- No manual intervention needed

**Verify SSL:**
```bash
openssl s_client -connect app.evercold.uz:443 -servername app.evercold.uz | grep "Verify return code"
# Expected: Verify return code: 0 (ok)
```

---

## 📈 Performance Optimization (Optional)

**After successful deployment**, consider:

### 1. Database Indexing
```sql
-- Add indexes for common queries
CREATE INDEX idx_order_date ON "Order"("orderDate");
CREATE INDEX idx_delivery_status ON "Delivery"("status");
```

### 2. PM2 Clustering (if using PM2)
```javascript
// ecosystem.config.js
instances: 2,  // Run 2 instances
exec_mode: 'cluster'
```

### 3. Nginx Caching
```nginx
# Cache static assets
location /_next/static {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**Full guide:** Create separate `PERFORMANCE.md` if needed.

---

## 🆘 Support & Troubleshooting

### Self-Service Troubleshooting

1. **Check logs first:**
   ```bash
   tail -100 /var/www/vhosts/evercold.uz/logs/node_app_error.log
   ```

2. **Verify environment:**
   ```bash
   cat .env | grep -E "(DATABASE_URL|TELEGRAM_BOT_TOKEN|NODE_ENV)"
   ```

3. **Test components individually:**
   - Health: `curl https://app.evercold.uz/api/health`
   - Database: `psql -U evercold_user evercold_production -c "SELECT 1"`
   - Bot: Send `/start` in Telegram

4. **Consult guides:**
   - App issues → `PRODUCTION_DEPLOYMENT_PLESK.md`
   - Bot issues → `TELEGRAM_BOT_PRODUCTION.md`

---

### Emergency Rollback

**If deployment fails catastrophically:**

```bash
# SSH to server
ssh user@app.evercold.uz
cd /var/www/vhosts/evercold.uz/httpdocs

# Restore from backup (Plesk creates these automatically)
cd backups
tar -xzf backup-YYYYMMDD-HHMMSS.tar.gz -C ../

# Restore database
gunzip < /backups/evercold-YYYYMMDD.sql.gz | psql -U evercold_user evercold_production

# Restart app
pm2 restart evercold-crm
```

**Full rollback guide:** `PRODUCTION_DEPLOYMENT_PLESK.md` → Emergency Rollback

---

## 📞 Contact & Resources

### Documentation Files

- `QUICK_DEPLOY_GUIDE.md` - Quick reference
- `PRODUCTION_DEPLOYMENT_PLESK.md` - Full guide
- `PLESK_VS_PM2_COMPARISON.md` - Method comparison
- `TELEGRAM_BOT_PRODUCTION.md` - Bot setup

### External Resources

- **Plesk Documentation**: https://docs.plesk.com/
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **PM2 Guide**: https://pm2.keymetrics.io/docs/usage/quick-start/
- **Telegram Bot API**: https://core.telegram.org/bots/api

---

## ✅ Final Checklist

**Before going live:**

- [ ] App deployed and accessible at https://app.evercold.uz
- [ ] SSL certificate valid and auto-renewing
- [ ] Database connected and migrations applied
- [ ] Admin can login at /login
- [ ] Telegram bot responds to /start
- [ ] File uploads working
- [ ] Logs being written
- [ ] Backups configured
- [ ] Monitoring in place
- [ ] Team knows how to restart app

**All checked?** 🎉 **You're production-ready!**

---

## 🎓 Learning Path

**New to deployment?**

```
Day 1: Read PLESK_VS_PM2_COMPARISON.md → Choose method
Day 2: Follow PRODUCTION_DEPLOYMENT_PLESK.md → Deploy to staging
Day 3: Test thoroughly → Fix issues
Day 4: Deploy to production → Monitor
Day 5: Configure bot → Go live
```

**Experienced?**

```
Hour 1: Use QUICK_DEPLOY_GUIDE.md → Deploy
Hour 2: Setup bot → Test
Hour 3: Monitor → Fix any issues
```

---

## 📋 Quick Command Reference

```bash
# Deploy (automated)
npm run deploy

# Health check
curl https://app.evercold.uz/api/health

# View logs
tail -f /var/www/vhosts/evercold.uz/logs/node_app_output.log

# Restart app (Plesk)
# Via GUI: Domains → Node.js → Restart

# Restart app (PM2)
pm2 restart evercold-crm

# Database backup
pg_dump -U evercold_user evercold_production > backup.sql

# Set bot webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://app.evercold.uz/api/telegram/webhook"

# Check bot webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

---

**Happy Deploying! 🚀**

*Remember: Start with one deployment method (preferably Plesk), get it working, then optimize later.*

---

Last Updated: 2026-02-14
