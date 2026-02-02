# Evercold CRM Deployment Checklist

## Pre-Deployment Verification

- [ ] All files are committed to git
- [ ] `.env.production` contains all required API keys
- [ ] SSH access to ice-production is working
- [ ] Local build completes without errors
- [ ] Database migrations are up to date

**Verify:**
```bash
# Test SSH connection
ssh ice-production 'echo "✅ SSH working"'

# Build locally
npm run build:production
```

---

## Deployment Steps

### 1. Initial Server Setup (First Time Only)
- [ ] Copy server setup script to production
- [ ] Run server setup script with sudo
- [ ] Verify Node.js, PostgreSQL, Nginx installed
- [ ] Confirm database created: `evercold_production`
- [ ] Confirm database user created: `evercold_user`

**Commands:**
```bash
scp server-setup.sh ice-production:/tmp/
ssh ice-production 'sudo bash /tmp/server-setup.sh'
```

**Verify:**
```bash
ssh ice-production << 'EOF'
  node --version
  npm --version
  sudo systemctl status postgresql | grep active
  sudo systemctl status nginx | grep active
EOF
```

---

### 2. Configure Nginx
- [ ] Copy Nginx configuration to server
- [ ] Enable Nginx site configuration
- [ ] Test Nginx configuration
- [ ] Reload Nginx

**Commands:**
```bash
scp nginx-evercold.conf ice-production:/tmp/evercold.conf
ssh ice-production << 'EOF'
  sudo cp /tmp/evercold.conf /etc/nginx/sites-available/evercold
  sudo ln -sf /etc/nginx/sites-available/evercold /etc/nginx/sites-enabled/evercold
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t
  sudo systemctl reload nginx
EOF
```

**Verify:**
```bash
ssh ice-production 'sudo systemctl status nginx'
```

---

### 3. Obtain SSL Certificate
- [ ] Verify DNS A record points to 173.212.195.32
- [ ] Run certbot to obtain certificate
- [ ] Verify certificate files created
- [ ] Reload Nginx with SSL enabled

**Commands:**
```bash
# Verify DNS
dig ice.erpstable.com +short

# Get certificate
ssh ice-production << 'EOF'
  sudo certbot certonly --standalone \
    --preferred-challenges http \
    -d ice.erpstable.com \
    --email admin@erpstable.com \
    --agree-tos \
    --non-interactive
  sudo systemctl reload nginx
EOF
```

**Verify:**
```bash
curl -I https://ice.erpstable.com
# Should show: HTTP/2 200 (with valid SSL certificate)
```

---

### 4. Deploy Application
- [ ] Local build completed successfully
- [ ] Application package created
- [ ] Package uploaded to server
- [ ] Files extracted on server
- [ ] Dependencies installed
- [ ] Database migrations run
- [ ] PM2 process started/restarted

**Command:**
```bash
npm run deploy
```

**Expected Output:**
```
✅ Deployment completed successfully!
🌐 Visit: https://ice.erpstable.com
```

---

## Post-Deployment Verification

### 1. Application Status
- [ ] PM2 shows process is `online`
- [ ] Application logs show no errors
- [ ] Database connection successful

**Verify:**
```bash
ssh ice-production 'pm2 status'
ssh ice-production 'pm2 logs evercold-crm --lines 20'
```

---

### 2. Website Functionality
- [ ] `https://ice.erpstable.com` loads
- [ ] Login page displays correctly
- [ ] Translations switch properly (en, ru, uz-Latn, uz-Cyrl)
- [ ] No JavaScript errors in browser console
- [ ] No "502 Bad Gateway" errors
- [ ] Page load time < 3 seconds

**Manual Testing:**
1. Open https://ice.erpstable.com in browser
2. Check browser console (F12) for errors
3. Click language switcher to test translations
4. Verify all UI elements load correctly
5. Check network tab for failed requests

---

### 3. Database Connectivity
- [ ] Database migrations completed
- [ ] Can query orders: `SELECT COUNT(*) FROM "Order"`
- [ ] Can query customers: `SELECT COUNT(*) FROM "Customer"`
- [ ] No database connection errors in logs

**Verify:**
```bash
ssh ice-production << 'EOF'
  cd /var/www/evercold
  npx prisma db execute --stdin << 'SQL'
  SELECT COUNT(*) as order_count FROM "Order";
  SELECT COUNT(*) as customer_count FROM "Customer";
SQL
EOF
```

---

### 4. API Endpoints
- [ ] `/api/orders` responds with data
- [ ] `/api/drivers` responds with data
- [ ] `/api/health` returns 200 OK
- [ ] Error endpoints return proper status codes

**Verify:**
```bash
# Test API endpoints
curl -I https://ice.erpstable.com/api/orders
curl -I https://ice.erpstable.com/api/drivers
curl -I https://ice.erpstable.com/

# Check response (should be 200)
```

---

### 5. Performance
- [ ] Website loads in < 3 seconds
- [ ] Static assets are cached (check headers)
- [ ] Nginx gzip compression enabled
- [ ] Server CPU usage normal (< 50%)
- [ ] Server memory usage normal (< 70%)

**Verify:**
```bash
# Check resources
ssh ice-production << 'EOF'
  free -h
  df -h
  top -bn1 | head -10
EOF

# Test with curl
curl -w "\nTotal time: %{time_total}s\n" https://ice.erpstable.com
```

---

### 6. Security
- [ ] SSL certificate is valid (no warnings)
- [ ] HTTPS redirect working (HTTP → HTTPS)
- [ ] Security headers present (X-Frame-Options, etc.)
- [ ] Firewall allowing only necessary ports
- [ ] Database accessible only from localhost

**Verify:**
```bash
# Check SSL certificate
echo | openssl s_client -servername ice.erpstable.com \
  -connect ice.erpstable.com:443 2>/dev/null | \
  openssl x509 -text -noout | grep -A2 "Validity"

# Check security headers
curl -I https://ice.erpstable.com | grep -i "x-frame\|x-content\|strict"

# Check firewall
ssh ice-production 'sudo ufw status'
```

---

## Monitoring Setup

### PM2 Monitoring
- [ ] PM2 configured for auto-restart
- [ ] PM2 configured to start on boot
- [ ] Max memory limit set (1GB)
- [ ] Application respawns if it crashes

**Setup:**
```bash
ssh ice-production << 'EOF'
  pm2 startup systemd -u root --hp /root
  pm2 save
  sudo systemctl status pm2-root
EOF
```

---

### Log Monitoring
- [ ] Nginx logs configured and rotating
- [ ] Application logs configured and rotating
- [ ] PostgreSQL logs accessible

**Verify:**
```bash
ssh ice-production << 'EOF'
  ls -la /var/log/nginx/
  ls -la /var/log/pm2/
  ls -la /var/log/postgresql/
EOF
```

---

## Rollback Plan

If deployment fails:

```bash
# 1. Check what went wrong
ssh ice-production 'pm2 logs evercold-crm --err'

# 2. List available backups
ssh ice-production 'ls -lh /var/www/evercold/backups/'

# 3. Restore from backup
ssh ice-production << 'EOF'
  cd /var/www/evercold
  tar -xzf backups/backup-20260131-120000.tar.gz
  npm ci --omit=dev
  npx prisma generate
  pm2 restart evercold-crm
EOF

# 4. Verify
ssh ice-production 'pm2 status'
```

---

## Maintenance Tasks

### Weekly
- [ ] Check server disk space: `ssh ice-production 'df -h'`
- [ ] Review error logs: `ssh ice-production 'pm2 logs evercold-crm --err'`
- [ ] Monitor memory usage: `ssh ice-production 'free -h'`

### Monthly
- [ ] Review security updates: `ssh ice-production 'apt list --upgradable'`
- [ ] Test database backup: Verify backup files exist
- [ ] Check SSL certificate expiration: Check with `openssl s_client`

### Quarterly
- [ ] Performance audit (page load times, API response times)
- [ ] Security scan (check firewall rules, SSH config)
- [ ] Database optimization (check slow queries)

---

## Issue Resolution

### If Application Won't Start
1. Check logs: `ssh ice-production 'pm2 logs evercold-crm'`
2. Verify database: `ssh ice-production 'sudo systemctl status postgresql'`
3. Verify Node.js: `ssh ice-production 'node --version'`
4. Restart PM2: `ssh ice-production 'pm2 restart evercold-crm'`
5. Rollback: Use backup procedure above

### If Database Connection Fails
1. Check PostgreSQL: `ssh ice-production 'sudo systemctl status postgresql'`
2. Verify credentials: Check `.env` DATABASE_URL
3. Check network: `ssh ice-production 'psql -h localhost evercold_production'`
4. Run migrations: `ssh ice-production 'cd /var/www/evercold && npx prisma migrate deploy'`

### If SSL Certificate Issues
1. Check certificate: `sudo certbot certificates`
2. Renew manually: `sudo certbot renew --force-renewal`
3. Check Nginx: `sudo nginx -t && sudo systemctl reload nginx`
4. Verify with curl: `curl -I https://ice.erpstable.com`

---

## Sign-Off

- Deployed by: ___________________
- Date: ___________________
- Time: ___________________
- Status: ☐ Success ☐ Partial ☐ Failed
- Issues encountered: _________________________________
- Mitigation taken: _________________________________
- Follow-up required: ☐ Yes ☐ No

---

**Keep this checklist for audit purposes.**
