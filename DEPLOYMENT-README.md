# 🚀 Evercold CRM Deployment to ice.erpstable.com

Complete deployment infrastructure for Evercold CRM to **173.212.195.32** (ice.erpstable.com).

---

## ⚡ Quick Start (3 steps)

### Step 1: Setup Server (First Time Only - ~5-10 minutes)

```bash
# Copy setup script and initialize server
scp server-setup.sh ice-production:/tmp/
ssh ice-production 'sudo bash /tmp/server-setup.sh'
```

This installs:
- Node.js 20 LTS
- PM2 process manager
- Nginx web server
- PostgreSQL database
- SSL tools (Certbot)
- Firewall (UFW)

---

### Step 2: Configure Web Server (~5 minutes)

```bash
# Deploy Nginx configuration
scp nginx-evercold.conf ice-production:/tmp/evercold.conf
ssh ice-production << 'EOF'
  sudo cp /tmp/evercold.conf /etc/nginx/sites-available/evercold
  sudo ln -sf /etc/nginx/sites-available/evercold /etc/nginx/sites-enabled/evercold
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t && sudo systemctl reload nginx
EOF

# Obtain SSL certificate
ssh ice-production << 'EOF'
  sudo certbot certonly --standalone \
    -d ice.erpstable.com \
    --email admin@erpstable.com \
    --agree-tos --non-interactive
  sudo systemctl reload nginx
EOF
```

Verify SSL works:
```bash
curl -I https://ice.erpstable.com
# Should show: HTTP/2 200 OK
```

---

### Step 3: Deploy Application (~3-5 minutes)

```bash
# One-command deployment
npm run deploy
```

That's it! ✨

Verify at: **https://ice.erpstable.com**

---

## 📁 Deployment Files

All files have been created for you:

| File | Purpose | Location |
|------|---------|----------|
| `deploy.sh` | Main deployment script | `/Users/zafar/Documents/evercold/` |
| `server-setup.sh` | Server initialization (run once) | `/Users/zafar/Documents/evercold/` |
| `ecosystem.config.js` | PM2 process configuration | `/Users/zafar/Documents/evercold/` |
| `nginx-evercold.conf` | Nginx reverse proxy config | `/Users/zafar/Documents/evercold/` |
| `.env.production` | Production environment variables | `/Users/zafar/Documents/evercold/` |
| `~/.ssh/config` | SSH configuration | `/Users/zafar/.ssh/` |

---

## 🔑 SSH Configuration

Your SSH config is already setup:

```
Host ice-production
    HostName 173.212.195.32
    User root
    IdentityFile ~/.ssh/id_ed25519
```

Test connection:
```bash
ssh ice-production 'echo "✅ Connected"'
```

---

## 📊 Architecture

```
ice.erpstable.com
       ↓
   [Nginx 443/SSL]
       ↓
   [PM2 Manager]
       ↓
[Next.js App:3000]
       ↓
[PostgreSQL:5432]
```

---

## 🔄 Standard Deployment Workflow

### First Deployment
```bash
# 1. Setup server
scp server-setup.sh ice-production:/tmp/
ssh ice-production 'sudo bash /tmp/server-setup.sh'

# 2. Configure web server
scp nginx-evercold.conf ice-production:/tmp/evercold.conf
ssh ice-production << 'EOF'
  sudo cp /tmp/evercold.conf /etc/nginx/sites-available/evercold
  sudo ln -sf /etc/nginx/sites-available/evercold /etc/nginx/sites-enabled/evercold
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t && sudo systemctl reload nginx
  sudo certbot certonly --standalone -d ice.erpstable.com \
    --email admin@erpstable.com --agree-tos --non-interactive
EOF

# 3. Deploy application
npm run deploy

# 4. Verify
curl https://ice.erpstable.com
```

### Subsequent Deployments
```bash
# One command
npm run deploy

# Or with npm
npm run deploy
```

---

## 📈 Monitoring

### Check Application Status
```bash
ssh ice-production 'pm2 status'
```

### View Logs
```bash
# Application logs
ssh ice-production 'pm2 logs evercold-crm --lines 50'

# Error logs
ssh ice-production 'pm2 logs evercold-crm --err'

# Nginx logs
ssh ice-production 'sudo tail -f /var/log/nginx/evercold-error.log'
```

### Real-Time Monitoring
```bash
ssh ice-production 'pm2 monit'
```

---

## 🔄 Useful Commands

### PM2 Commands
```bash
pm2 status                  # Show all processes
pm2 logs evercold-crm       # Show application logs
pm2 restart evercold-crm    # Restart application
pm2 stop evercold-crm       # Stop application
pm2 start ecosystem.config.js  # Start from config
pm2 monit                   # Monitor in real-time
```

### Server Commands
```bash
ssh ice-production << 'EOF'
# Check status
sudo systemctl status nginx postgresql

# View Nginx logs
sudo tail -f /var/log/nginx/evercold-error.log

# View Postgres
sudo -u postgres psql evercold_production

# Check resources
free -h && df -h
EOF
```

### Deployment Commands (Local)
```bash
npm run deploy                    # Deploy to production
npm run build:production          # Build for production
npm run db:migrate:production     # Run migrations
npm run server:setup              # Setup server (from remote)
```

---

## 🔙 Rollback

If deployment has issues:

```bash
ssh ice-production << 'EOF'
  cd /var/www/evercold

  # List backups
  ls -lh backups/

  # Restore from backup
  tar -xzf backups/backup-TIMESTAMP.tar.gz
  npm ci --omit=dev
  npx prisma generate
  pm2 restart evercold-crm
EOF
```

---

## 🔐 Security Notes

✅ **Already Configured:**
- SSH key authentication (no password login)
- Firewall (UFW) with restricted ports
- SSL/TLS encryption (Let's Encrypt)
- Secure database password (PostgreSQL)
- Environment variables (not in code)
- Nginx security headers

**Database Password:**
```
Username: evercold_user
Password: GeuibPRKiASR0pbSSFTcshA5aoBNNNYGuyAvt9lChZ8=
```

---

## 🚨 Troubleshooting

### "502 Bad Gateway"
```bash
ssh ice-production 'pm2 restart evercold-crm && sleep 3 && pm2 status'
```

### "Database Connection Failed"
```bash
ssh ice-production << 'EOF'
  sudo systemctl status postgresql
  sudo -u postgres psql -l | grep evercold
  cat /var/www/evercold/.env | grep DATABASE_URL
EOF
```

### "SSL Certificate Error"
```bash
ssh ice-production 'sudo certbot renew --force-renewal && sudo systemctl reload nginx'
```

### "Port Already in Use"
```bash
ssh ice-production << 'EOF'
  sudo lsof -i :3000
  sudo kill -9 <PID>
  pm2 restart evercold-crm
EOF
```

See `DEPLOYMENT.md` for detailed troubleshooting guide.

---

## 📋 Verification Checklist

After deployment, verify:

```bash
# 1. SSH works
ssh ice-production 'echo ✅'

# 2. Application running
ssh ice-production 'pm2 status'

# 3. Website loads
curl -I https://ice.erpstable.com
# Response: HTTP/2 200

# 4. Database connected
ssh ice-production << 'EOF'
  cd /var/www/evercold
  npx prisma db execute --stdin << 'SQL'
  SELECT COUNT(*) FROM "Order";
SQL
EOF

# 5. No errors in logs
ssh ice-production 'pm2 logs evercold-crm --lines 20' | grep -i error
```

---

## 📚 Documentation Files

| Document | Purpose |
|----------|---------|
| `DEPLOYMENT.md` | Complete deployment guide (12KB) |
| `DEPLOYMENT-CHECKLIST.md` | Step-by-step checklist (8KB) |
| `DEPLOYMENT-README.md` | This file - quick reference |

---

## 🎯 Project Info

- **Server:** ice.erpstable.com (173.212.195.32)
- **Domain:** ice.erpstable.com
- **Application:** Evercold CRM (Next.js 16)
- **Database:** PostgreSQL (evercold_production)
- **Process Manager:** PM2
- **Web Server:** Nginx
- **SSL:** Let's Encrypt

---

## ✨ Environment

The following environment variables are configured in `.env.production`:

```env
DATABASE_URL=postgresql://evercold_user:***@localhost:5432/evercold_production
NODE_ENV=production
PORT=3000
YANDEX_MAPS_API_KEY=675d48f0-5676-4486-bfe3-ff30747999ae
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=675d48f0-5676-4486-bfe3-ff30747999ae
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=658456965614-qrm60dhkkrasj1ilq5kjmd59je31nqke.apps.googleusercontent.com
TELEGRAM_BOT_TOKEN=8278817835:AAHAMW7BIYBmpPJagODSuwZovZjMgGb_EN8
CRON_SECRET=evercold-ticket-escalation-secret-key-2024
NEXT_TELEMETRY_DISABLED=1
```

---

## 📞 Need Help?

1. **Check logs first:** `npm run deploy` shows colored output
2. **View application logs:** `ssh ice-production 'pm2 logs evercold-crm'`
3. **Check database:** Verify PostgreSQL is running
4. **Read full guide:** See `DEPLOYMENT.md` for detailed troubleshooting
5. **Rollback:** Use backup procedure if deployment fails

---

## ✅ Status

- ✅ SSH configuration created
- ✅ Production environment file created
- ✅ Deployment scripts written
- ✅ Nginx configuration ready
- ✅ PM2 ecosystem config ready
- ✅ Server initialization script ready
- ✅ SSH connection verified

**Ready to deploy! Run: `npm run deploy`**

---

**Last Updated:** 2026-01-31
**Deployment Version:** 1.0.0
**Status:** Ready for Production
