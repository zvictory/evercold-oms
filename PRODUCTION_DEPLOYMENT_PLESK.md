# 🚀 Production Deployment Checklist for app.evercold.uz (Plesk)

**Target Domain**: `app.evercold.uz`
**Server Platform**: Plesk Control Panel
**Current Setup**: PM2 deployment (ice.erpstable.com) → migrating to Plesk

---

## ⚠️ Plesk Compatibility Assessment

### ✅ YES - Plesk Can Run This Stack

Plesk supports:
- ✅ Node.js applications (via Node.js extension)
- ✅ PostgreSQL databases
- ✅ SSL certificates (Let's Encrypt)
- ✅ PM2 process manager
- ✅ Reverse proxy (Nginx - built-in)
- ✅ Environment variables
- ✅ Custom domains

### 🔄 Deployment Strategy Options

**Option 1: Native Plesk Node.js (Recommended)**
- Uses Plesk's Node.js manager
- Built-in process management
- Easier through GUI

**Option 2: PM2 via SSH (Your Current Setup)**
- Keep existing `deploy.sh` script
- Requires SSH access to Plesk server
- More control but less integrated

**This guide covers BOTH options.**

---

## 📋 Pre-Deployment Checklist

### 1️⃣ Local Environment Verification

```bash
# Ensure clean build works
npm run build:production

# Verify no TypeScript errors
npm run type-check

# Test database migrations
npm run db:push

# Ensure all dependencies resolve
npm ci
```

**Status**: ⬜ Completed

---

### 2️⃣ Production Environment Variables

Create/verify `.env.production` with these variables:

```bash
# Database (Plesk PostgreSQL)
DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/evercold_production?schema=public

# Application
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1

# API Keys
YANDEX_MAPS_API_KEY=your_yandex_key
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=your_yandex_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather

# Security
CRON_SECRET=generate_random_32_char_string
JWT_SECRET=generate_random_64_char_string

# File Uploads
UPLOAD_DIR=/var/www/vhosts/evercold.uz/httpdocs/uploads
NEXT_PUBLIC_UPLOAD_URL=https://app.evercold.uz/uploads
```

**Status**: ⬜ Completed

---

### 3️⃣ Telegram Bot Configuration

#### Current Bot Token Location
Check your existing `.env.production` for `TELEGRAM_BOT_TOKEN`

#### Set Webhook for Production

**After deployment**, run this command:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://app.evercold.uz/api/telegram/webhook"
```

Expected response:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

**Verify webhook:**
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

**Status**: ⬜ Completed

---

## 🔧 OPTION 1: Deploy with Plesk Node.js Manager (Recommended)

### Step 1: Access Plesk

1. Login to Plesk panel
2. Navigate to **Domains** → `evercold.uz`
3. Click **Node.js**

**Status**: ⬜ Completed

---

### Step 2: Configure Node.js Application

| Setting | Value |
|---------|-------|
| **Node.js Version** | 20.x LTS (latest stable) |
| **Application Mode** | Production |
| **Application Root** | `/httpdocs` or `/app` |
| **Application Startup File** | `server.js` (see below) |
| **Custom Environment Variables** | Import from `.env.production` |

**Status**: ⬜ Completed

---

### Step 3: Create Plesk-Compatible Server Entry Point

Plesk expects a standalone Node.js server. Create `server.js`:

```javascript
// server.js - Plesk entry point for Next.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false; // Always production in Plesk
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
```

**Status**: ⬜ Created `server.js`

---

### Step 4: Upload Files to Plesk

**Via File Manager or FTP:**

Upload these directories/files:
```
/httpdocs/
├── .next/              (built production assets)
├── public/             (static files)
├── prisma/             (database schema)
├── node_modules/       (or install via npm)
├── package.json
├── package-lock.json
├── server.js           (NEW - Plesk entry point)
├── next.config.ts
├── .env.production     (rename to .env)
└── ecosystem.config.js (optional - for PM2 fallback)
```

**Commands (if using SSH):**

```bash
# Build locally first
npm run build:production

# Upload via rsync (example)
rsync -avz --exclude 'node_modules' \
  .next public prisma package*.json server.js next.config.ts .env.production \
  user@app.evercold.uz:/var/www/vhosts/evercold.uz/httpdocs/
```

**Status**: ⬜ Files uploaded

---

### Step 5: Install Dependencies via Plesk

1. In Plesk Node.js panel, click **NPM Install**
2. Or via SSH:
   ```bash
   cd /var/www/vhosts/evercold.uz/httpdocs
   npm ci --omit=dev --legacy-peer-deps
   ```

**Status**: ⬜ Dependencies installed

---

### Step 6: Setup PostgreSQL Database

#### Via Plesk GUI:

1. **Databases** → **Add Database**
   - Database name: `evercold_production`
   - User: `evercold_user`
   - Password: Generate strong password
   - Charset: UTF-8

2. Copy connection string:
   ```
   postgresql://evercold_user:PASSWORD@localhost:5432/evercold_production
   ```

3. Update `.env` with `DATABASE_URL`

#### Via SSH (Alternative):

```bash
# Login as postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE evercold_production;
CREATE USER evercold_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE evercold_production TO evercold_user;
ALTER DATABASE evercold_production OWNER TO evercold_user;
\q
```

**Status**: ⬜ Database created

---

### Step 7: Run Database Migrations

```bash
cd /var/www/vhosts/evercold.uz/httpdocs
npx prisma generate
npx prisma migrate deploy
```

**Verify migration:**
```bash
npx prisma studio
# Access at http://localhost:5555
```

**Status**: ⬜ Migrations applied

---

### Step 8: Configure Reverse Proxy (Plesk does this automatically)

Plesk's Node.js extension automatically:
- Sets up Nginx reverse proxy
- Maps `app.evercold.uz` → `localhost:3000`
- Handles SSL termination

**Manual verification (optional):**
```bash
cat /etc/nginx/plesk.conf.d/vhosts/evercold.uz.conf
```

**Status**: ⬜ Proxy configured

---

### Step 9: Enable SSL (Let's Encrypt)

1. In Plesk, go to **SSL/TLS Certificates**
2. Click **Install** (Let's Encrypt)
3. Select domain: `app.evercold.uz`
4. Check "Secure the domain with Let's Encrypt"
5. Click **Get It Free**

**Verify SSL:**
```bash
curl -I https://app.evercold.uz
# Should return 200 OK with HTTPS
```

**Status**: ⬜ SSL enabled

---

### Step 10: Start Application via Plesk

1. In Node.js panel, click **Enable Node.js**
2. Click **Restart App**

**Verify it's running:**
```bash
curl http://localhost:3000/api/health
# Should return {"status":"ok"}
```

**Status**: ⬜ Application started

---

### Step 11: Configure Telegram Bot Webhook

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://app.evercold.uz/api/telegram/webhook"
```

**Test bot:**
1. Open Telegram
2. Search for your bot
3. Send `/start` → should get welcome message
4. Send `/order` → should start order flow

**Status**: ⬜ Bot webhook configured

---

### Step 12: Setup File Upload Directory

```bash
# Create uploads directory
mkdir -p /var/www/vhosts/evercold.uz/httpdocs/public/uploads
chmod 755 /var/www/vhosts/evercold.uz/httpdocs/public/uploads

# Set ownership to Plesk web user
chown -R <plesk-user>:psacln /var/www/vhosts/evercold.uz/httpdocs/public/uploads
```

**Verify write permissions:**
```bash
# Test upload via API
curl -X POST https://app.evercold.uz/api/photos/upload \
  -F "file=@test.jpg"
```

**Status**: ⬜ Uploads configured

---

### Step 13: Monitoring & Logs

**View application logs:**
```bash
# Plesk logs location
tail -f /var/www/vhosts/evercold.uz/logs/node_app_output.log
tail -f /var/www/vhosts/evercold.uz/logs/node_app_error.log
```

**Setup log rotation (optional):**
```bash
cat > /etc/logrotate.d/evercold <<EOF
/var/www/vhosts/evercold.uz/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
}
EOF
```

**Status**: ⬜ Logging configured

---

## 🔧 OPTION 2: Deploy with PM2 via SSH (Alternative)

If Plesk Node.js manager doesn't work, fall back to PM2:

### Step 1: Access Plesk Server via SSH

```bash
ssh root@app.evercold.uz
# or
ssh your-plesk-user@app.evercold.uz
```

**Status**: ⬜ SSH access confirmed

---

### Step 2: Install Node.js & PM2

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Setup PM2 to start on boot
pm2 startup systemd
pm2 save
```

**Status**: ⬜ PM2 installed

---

### Step 3: Use Existing Deploy Script

Update `deploy.sh` to point to new server:

```bash
# In deploy.sh, change:
SERVER="app-evercold-plesk"  # Add to ~/.ssh/config
REMOTE_DIR="/var/www/vhosts/evercold.uz/httpdocs"
```

**SSH Config (~/.ssh/config):**
```
Host app-evercold-plesk
  HostName app.evercold.uz
  User root
  IdentityFile ~/.ssh/id_rsa
  StrictHostKeyChecking no
```

**Run deployment:**
```bash
npm run deploy
```

**Status**: ⬜ PM2 deployment working

---

### Step 4: Configure Nginx Reverse Proxy (Manual)

Create Plesk custom Nginx config:

```bash
# File: /var/www/vhosts/system/evercold.uz/conf/vhost_nginx.conf
server {
    listen 443 ssl http2;
    server_name app.evercold.uz;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Restart Nginx:**
```bash
systemctl restart nginx
# or
/usr/local/psa/admin/bin/nginxmng -e
```

**Status**: ⬜ Nginx configured

---

## ✅ Post-Deployment Verification

### Critical Checks

| Check | Command | Expected Result | Status |
|-------|---------|-----------------|--------|
| **App Health** | `curl https://app.evercold.uz/api/health` | `{"status":"ok"}` | ⬜ |
| **SSL Valid** | `curl -I https://app.evercold.uz` | `200 OK` (HTTPS) | ⬜ |
| **Login Works** | Visit `https://app.evercold.uz/login` | Login page loads | ⬜ |
| **Database Connected** | `psql -U evercold_user -d evercold_production -c "SELECT COUNT(*) FROM \"User\";"` | Returns count | ⬜ |
| **Telegram Bot** | Send `/start` to bot in Telegram | Bot responds | ⬜ |
| **File Uploads** | Test photo upload in app | Image saves to `/uploads` | ⬜ |
| **Routes API** | `curl https://app.evercold.uz/api/routes` | Returns JSON | ⬜ |
| **Driver App** | Visit `https://app.evercold.uz/driver` | Driver dashboard loads | ⬜ |

**Status**: ⬜ All checks passed

---

## 🐛 Troubleshooting

### App Not Starting

**Symptoms:** Application shows 502 Bad Gateway

**Solutions:**
```bash
# Check if Node.js process is running
ps aux | grep node

# Check logs
tail -f /var/www/vhosts/evercold.uz/logs/node_app_error.log

# Restart via Plesk Node.js panel or PM2
pm2 restart evercold-crm
```

---

### Database Connection Fails

**Symptoms:** Prisma errors about connection refused

**Solutions:**
```bash
# Verify PostgreSQL is running
systemctl status postgresql

# Test connection manually
psql -U evercold_user -d evercold_production

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Verify user permissions
sudo -u postgres psql -c "\du evercold_user"
```

---

### Telegram Bot Not Responding

**Symptoms:** Bot doesn't reply to messages

**Solutions:**
```bash
# Check webhook status
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Expected: "url": "https://app.evercold.uz/api/telegram/webhook"
# If wrong, reset webhook:
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://app.evercold.uz/api/telegram/webhook"

# Check webhook endpoint is accessible
curl https://app.evercold.uz/api/telegram/webhook
# Should return 405 Method Not Allowed (correct - it only accepts POST)

# Check bot logs
grep -r "telegram" /var/www/vhosts/evercold.uz/logs/
```

---

### SSL Certificate Issues

**Symptoms:** Certificate warnings or HTTPS not working

**Solutions:**
```bash
# Renew Let's Encrypt certificate via Plesk
# OR manually:
certbot renew --nginx

# Verify certificate
openssl s_client -connect app.evercold.uz:443 -servername app.evercold.uz

# Force HTTPS redirect in Plesk:
# Hosting Settings → Redirect from non-SSL to SSL
```

---

### File Upload Failures

**Symptoms:** Photo upload returns 500 error

**Solutions:**
```bash
# Check directory exists and has correct permissions
ls -la /var/www/vhosts/evercold.uz/httpdocs/public/uploads
# Should show drwxr-xr-x

# Fix permissions
chmod 755 /var/www/vhosts/evercold.uz/httpdocs/public/uploads
chown -R <plesk-user>:psacln /var/www/vhosts/evercold.uz/httpdocs/public

# Check disk space
df -h
```

---

## 🔐 Security Hardening (Optional but Recommended)

### 1. Firewall Configuration

```bash
# Allow only necessary ports
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

### 2. Rate Limiting (Nginx)

Add to Nginx config:
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
}
```

### 3. Database Backups

```bash
# Create daily backup cron job
crontab -e

# Add:
0 2 * * * pg_dump -U evercold_user evercold_production | gzip > /backups/evercold-$(date +\%Y\%m\%d).sql.gz
```

**Status**: ⬜ Security hardened

---

## 📊 Monitoring Setup (Recommended)

### Option A: Plesk Built-in Monitoring

1. Go to **Tools & Settings** → **Monitoring**
2. Enable:
   - CPU usage alerts
   - Memory usage alerts
   - Disk space alerts

### Option B: PM2 Plus (Free Tier)

```bash
pm2 plus
# Follow instructions to link account
# Get real-time metrics at https://app.pm2.io
```

### Option C: Simple Health Check Cron

```bash
# Add to crontab
*/5 * * * * curl -s https://app.evercold.uz/api/health || echo "App down at $(date)" >> /var/log/evercold-health.log
```

**Status**: ⬜ Monitoring configured

---

## 🚀 Go-Live Checklist

**Before switching DNS:**

- [ ] All verification checks passed
- [ ] Telegram bot responding
- [ ] Database fully migrated
- [ ] SSL certificate valid
- [ ] Uploads directory working
- [ ] Admin login successful
- [ ] Driver app accessible
- [ ] Backup system in place
- [ ] Monitoring enabled
- [ ] `.env.production` secure (no secrets in repo)

**Final step:**

Update DNS for `app.evercold.uz` to point to Plesk server IP.

**Status**: ⬜ Ready for production

---

## 📞 Emergency Rollback Procedure

If production fails:

### Quick Rollback

```bash
# Restore database from backup
gunzip < /backups/evercold-YYYYMMDD.sql.gz | psql -U evercold_user evercold_production

# Restore previous .next build
cd /var/www/vhosts/evercold.uz/httpdocs/backups
tar -xzf backup-YYYYMMDD-HHMMSS.tar.gz -C ../

# Restart app
pm2 restart evercold-crm
# or via Plesk Node.js panel
```

**Status**: ⬜ Rollback tested

---

## 📝 Deployment Commands Summary

```bash
# LOCAL: Build and deploy
npm run build:production
npm run deploy

# SERVER: Database migrations
npx prisma migrate deploy
npx prisma generate

# SERVER: Start/restart app
pm2 restart evercold-crm
# OR via Plesk Node.js panel

# SERVER: Check status
pm2 status
pm2 logs evercold-crm

# TELEGRAM: Set webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://app.evercold.uz/api/telegram/webhook"

# HEALTH CHECK
curl https://app.evercold.uz/api/health
```

---

## 🎯 Final Notes

**Plesk Compatibility**: ✅ **YES** - Your app is fully compatible with Plesk.

**Recommended Approach**: Use **Plesk Node.js Manager** (Option 1) for easier management through GUI.

**Fallback**: PM2 via SSH (Option 2) works if Plesk Node.js has issues.

**Critical Requirements**:
1. PostgreSQL database configured
2. Node.js 20.x installed
3. Environment variables set correctly
4. Telegram webhook configured AFTER deployment
5. SSL certificate installed

**Estimated Deployment Time**: 1-2 hours (first time), 15 minutes (subsequent deploys)

---

**Questions or issues? Check the troubleshooting section or verify each checklist item systematically.**

Last Updated: 2026-02-14
