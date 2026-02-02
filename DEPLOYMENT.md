# Evercold CRM Deployment Guide

## 🚀 Quick Start (5 minutes)

```bash
# 1. One-command deployment
npm run deploy

# 2. Wait for deployment to complete
# 3. Visit https://ice.erpstable.com
```

---

## 📋 Prerequisites

- ✅ SSH access to 173.212.195.32 (ice-production host configured)
- ✅ Server running Ubuntu/Debian with sudo access
- ✅ Node.js 18+ installed (or will be installed by setup script)

---

## 🔄 Full Deployment Workflow

### Step 1: Initial Server Setup (First Time Only)

This step prepares the production server with all required software.

```bash
# On your local machine
scp server-setup.sh ice-production:/tmp/
ssh ice-production 'sudo bash /tmp/server-setup.sh'
```

**What this does:**
- Updates system packages
- Installs Node.js 20 (LTS)
- Installs PM2, Nginx, PostgreSQL
- Creates PostgreSQL database and user
- Configures UFW firewall
- Creates required directories

**Time:** ~5-10 minutes

**Status Check:**
```bash
ssh ice-production << 'EOF'
  node --version
  npm --version
  pm2 --version
  nginx -v
  psql --version
EOF
```

---

### Step 2: Configure Nginx Reverse Proxy

Deploy the Nginx configuration to the server:

```bash
# Copy Nginx configuration to server
scp nginx-evercold.conf ice-production:/tmp/evercold.conf

# Apply configuration
ssh ice-production << 'EOF'
  sudo cp /tmp/evercold.conf /etc/nginx/sites-available/evercold
  sudo ln -sf /etc/nginx/sites-available/evercold /etc/nginx/sites-enabled/evercold
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t && sudo systemctl reload nginx
  echo "✅ Nginx configured"
EOF
```

---

### Step 3: Obtain SSL Certificate

Get a Let's Encrypt SSL certificate for ice.erpstable.com:

```bash
ssh ice-production << 'EOF'
  sudo certbot certonly --standalone \
    --preferred-challenges http \
    -d ice.erpstable.com \
    --email admin@erpstable.com \
    --agree-tos \
    --non-interactive

  # Reload Nginx with SSL enabled
  sudo systemctl reload nginx

  echo "✅ SSL certificate obtained"
EOF
```

**Verify SSL:**
```bash
curl -I https://ice.erpstable.com
# Should return: HTTP/2 200 OK
```

---

### Step 4: Deploy Application

The main deployment script handles all application deployment:

```bash
npm run deploy
```

**What this script does:**
1. Builds Next.js application locally
2. Creates deployment package
3. Uploads to server
4. Extracts files
5. Installs dependencies
6. Runs database migrations
7. Starts/restarts PM2 process
8. Verifies application is running

**Time:** ~3-5 minutes

---

### Step 5: Verify Deployment

Check that everything is working:

```bash
# 1. Check application status
ssh ice-production 'pm2 status'

# 2. Check application logs
ssh ice-production 'pm2 logs evercold-crm --lines 50'

# 3. Test application URL
curl -I https://ice.erpstable.com

# 4. Check database connectivity
ssh ice-production << 'EOF'
  cd /var/www/evercold
  npx prisma db execute --stdin <<SQL
  SELECT COUNT(*) FROM "Order";
SQL
EOF
```

---

## 🔧 Deployment Scripts Overview

### deploy.sh - Main Deployment Script

**Usage:**
```bash
npm run deploy
```

**What it does:**
- Builds Next.js application
- Creates compressed deployment package
- Uploads to server via SCP
- Extracts and installs on server
- Runs database migrations
- Restarts PM2 process
- Verifies success

**Key Features:**
- One-command deployment
- Automatic backups before deployment
- Colored output and progress indicators
- Deployment logging to `deployment-YYYYMMDD-HHMMSS.log`
- Automatic cleanup of temporary files

---

### server-setup.sh - Server Initialization (One-Time)

**Usage:**
```bash
ssh ice-production 'sudo bash /tmp/server-setup.sh'
```

**What it installs:**
1. Node.js 20.x LTS
2. PM2 (process manager)
3. Nginx (web server)
4. PostgreSQL (database)
5. Certbot (SSL certificates)
6. UFW Firewall
7. Development tools (git, curl, wget)

**Output:**
- Check `/var/www/evercold` directory exists
- Database `evercold_production` created
- User `evercold_user` with secure password

---

## 📁 Files Created/Modified

### Created Files

1. **`~/.ssh/config`** - SSH configuration for ice-production host
2. **`.env.production`** - Production environment variables with secure database password
3. **`deploy.sh`** - Main deployment script
4. **`ecosystem.config.js`** - PM2 process configuration
5. **`server-setup.sh`** - Server initialization script
6. **`nginx-evercold.conf`** - Nginx reverse proxy configuration

### Modified Files

1. **`package.json`** - Added deployment scripts:
   - `npm run deploy` - Deploy application
   - `npm run build:production` - Build for production
   - `npm run db:migrate:production` - Run migrations
   - `npm run server:setup` - Initialize server

---

## 🗂️ Server Directory Structure

```
/var/www/evercold/
├── .env                      # Production environment (copied from .env.production)
├── .next/                    # Next.js build output
├── public/                   # Static assets
├── prisma/                   # Database schema
├── node_modules/             # Dependencies
├── package.json
├── ecosystem.config.js       # PM2 configuration
└── backups/                  # Deployment backups
    ├── backup-20260131-120000.tar.gz
    └── ...
```

---

## 🔍 Monitoring & Logs

### Check Application Status

```bash
# SSH into server
ssh ice-production

# View all PM2 processes
pm2 status

# Monitor in real-time
pm2 monit

# View application logs
pm2 logs evercold-crm

# View error logs only
pm2 logs evercold-crm --err
```

### View Nginx Logs

```bash
ssh ice-production << 'EOF'
  # Access logs
  sudo tail -f /var/log/nginx/evercold-access.log

  # Error logs
  sudo tail -f /var/log/nginx/evercold-error.log
EOF
```

### View Database Logs

```bash
ssh ice-production 'sudo tail -f /var/log/postgresql/postgresql.log'
```

---

## 🔄 Redeployment

### Deploy Application Updates

```bash
# Make changes locally
git commit -m "Update feature"

# Deploy to production
npm run deploy

# Verify
ssh ice-production 'pm2 logs evercold-crm --lines 20'
```

### Restart Without Redeploying

```bash
ssh ice-production 'pm2 restart evercold-crm'
```

### View Previous Deployments

```bash
ssh ice-production 'ls -lh /var/www/evercold/backups/'
```

---

## 🔙 Rollback Procedure

If deployment fails or you need to rollback:

```bash
ssh ice-production << 'EOF'
  cd /var/www/evercold

  # List available backups
  ls -lh backups/

  # Restore from specific backup
  tar -xzf backups/backup-20260131-120000.tar.gz

  # Reinstall dependencies
  npm ci --omit=dev

  # Restart application
  pm2 restart evercold-crm

  echo "✅ Rollback completed"
EOF
```

---

## 🚨 Troubleshooting

### Issue: "502 Bad Gateway" Error

**Cause:** PM2 application not running

**Fix:**
```bash
ssh ice-production << 'EOF'
  pm2 status
  pm2 restart evercold-crm
  sleep 3
  pm2 status
EOF
```

---

### Issue: "Cannot connect to database"

**Cause:** Wrong DATABASE_URL or PostgreSQL not accessible

**Fix:**
```bash
ssh ice-production << 'EOF'
  # Check PostgreSQL is running
  sudo systemctl status postgresql

  # Check database exists
  sudo -u postgres psql -l | grep evercold

  # Verify .env file
  cat /var/www/evercold/.env | grep DATABASE_URL
EOF
```

---

### Issue: "SSL Certificate Error"

**Cause:** Certificate not obtained or expired

**Fix:**
```bash
ssh ice-production << 'EOF'
  # Renew certificate
  sudo certbot renew --force-renewal

  # Reload Nginx
  sudo systemctl reload nginx

  # Verify
  curl -I https://ice.erpstable.com
EOF
```

---

### Issue: "Port 3000 already in use"

**Cause:** Another process running on port 3000

**Fix:**
```bash
ssh ice-production << 'EOF'
  # Find process using port 3000
  sudo lsof -i :3000

  # Kill the process (replace PID with actual process ID)
  sudo kill -9 <PID>

  # Restart PM2
  pm2 restart evercold-crm
EOF
```

---

## 📊 Performance Optimization

### Enable Gzip Compression

Nginx configuration already includes gzip compression for:
- Text files (CSS, HTML, JSON)
- Application JavaScript
- Images (SVG)

### Enable Static Asset Caching

Nginx configuration includes caching headers:
- `/_next/static` → 60 minutes
- `/public` → 30 days

### Monitor Performance

```bash
# Check server resources
ssh ice-production 'free -h && df -h'

# Check PM2 memory usage
ssh ice-production 'pm2 monit'

# Check Nginx status
ssh ice-production 'sudo systemctl status nginx'
```

---

## 🔐 Security Checklist

- ✅ SSH key-based authentication configured
- ✅ Firewall enabled (UFW) with only needed ports open
- ✅ SSL certificate from Let's Encrypt
- ✅ Nginx security headers configured
- ✅ Database password secured in `.env.production`
- ✅ Environment variables not exposed
- ✅ PostgreSQL accessible only from localhost
- ✅ Regular backups taken before each deployment

---

## 🔄 SSL Certificate Renewal

Let's Encrypt certificates are valid for 90 days. Renewal happens automatically via certbot:

```bash
# Check renewal status
ssh ice-production 'sudo certbot renew --dry-run'

# Force renewal if needed
ssh ice-production 'sudo certbot renew --force-renewal'

# Manual renewal
ssh ice-production 'sudo certbot certonly --nginx -d ice.erpstable.com'
```

---

## 📈 Database Backups

Set up automated daily database backups:

```bash
ssh ice-production << 'EOF'
  # Create backup script
  cat > /usr/local/bin/backup-db.sh << 'SCRIPT'
#!/bin/bash
pg_dump -U evercold_user evercold_production | gzip > /backups/db-$(date +\%Y\%m\%d-\%H\%M\%S).sql.gz
find /backups -name "db-*.sql.gz" -mtime +7 -delete
SCRIPT

  sudo chmod +x /usr/local/bin/backup-db.sh

  # Add to crontab for daily backups at 2 AM
  echo "0 2 * * * /usr/local/bin/backup-db.sh" | sudo crontab -
EOF
```

---

## 📚 Useful Commands

### SSH Quick Access

```bash
# SSH into server
ssh ice-production

# Execute single command
ssh ice-production 'pm2 status'

# Run remote script
ssh ice-production 'bash script.sh'
```

### PM2 Commands

```bash
# View all processes
pm2 status

# View logs
pm2 logs evercold-crm

# Restart process
pm2 restart evercold-crm

# Stop process
pm2 stop evercold-crm

# Start process
pm2 start ecosystem.config.js

# Delete process
pm2 delete evercold-crm

# Monitor resources
pm2 monit

# Save process list
pm2 save

# Resurrect saved process list
pm2 resurrect
```

---

## ✅ Deployment Verification Checklist

After deployment, verify:

- [ ] DNS resolves: `dig ice.erpstable.com`
- [ ] SSL works: `curl -I https://ice.erpstable.com`
- [ ] Application loads: Visit https://ice.erpstable.com in browser
- [ ] Login page displays: Check for Evercold CRM interface
- [ ] Database connected: Can navigate to orders/drivers without errors
- [ ] No console errors: Check browser DevTools console
- [ ] Translations work: Switch between en, ru, uz-Latn, uz-Cyrl
- [ ] API endpoints respond: Test with `curl https://ice.erpstable.com/api/orders`
- [ ] Logs clean: No errors in `pm2 logs evercold-crm`

---

## 🎯 Next Steps

1. ✅ Run `npm run deploy` for the first time
2. ✅ Verify application is running
3. ✅ Set up database backups
4. ✅ Configure SSL auto-renewal
5. ✅ Monitor logs regularly
6. ✅ Schedule maintenance windows

---

## 📞 Support

For issues:
1. Check deployment logs: `cat deployment-*.log`
2. View application logs: `ssh ice-production 'pm2 logs evercold-crm'`
3. Check Nginx logs: `ssh ice-production 'sudo tail /var/log/nginx/evercold-error.log'`
4. Verify database: `ssh ice-production 'sudo -u postgres psql evercold_production'`

---

**Last Updated:** 2026-01-31
**Deployment Server:** ice.erpstable.com (173.212.195.32)
**Database:** PostgreSQL (evercold_production)
**Process Manager:** PM2
**Web Server:** Nginx
