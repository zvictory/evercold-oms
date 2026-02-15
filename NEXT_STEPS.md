# 🎯 NEXT STEPS - Get Your App Running Automatically

## Current Status ✅

Your app is **100% deployed correctly**:
- ✅ All files in place (server.js, dependencies, fonts)
- ✅ Permissions set correctly (755 for directories, 644 for files)
- ✅ 808 npm packages installed successfully
- ✅ Manual start works: `NODE_ENV=production PORT=3000 node server.js` → App runs perfectly

## The Only Issue ⚠️

**Plesk is not automatically starting the Node.js process.**

When you access the website, there's no Node.js process running, so:
- Frontend loads (static files served by Apache)
- API calls fail with 500 errors (no backend to handle them)

---

## Solution: Choose One Approach

### 🥇 RECOMMENDED: Use PM2 (Most Reliable)

PM2 is a production-grade process manager that keeps your Node.js app running 24/7.

#### Upload the script to your server:

1. Upload `START_WITH_PM2.sh` to your server via Plesk File Manager
2. SSH into your server:
   ```bash
   ssh root@135.181.84.232
   cd /var/www/vhosts/evercold.uz/app.evercold.uz
   ```

3. Run the script:
   ```bash
   bash START_WITH_PM2.sh
   ```

4. Verify it's running:
   ```bash
   pm2 status
   # Should show: evercold-crm | online | 0 | 0s | ...
   ```

5. Test the app:
   ```bash
   curl -I https://app.evercold.uz/api/health
   # Should return: HTTP/2 200
   ```

✅ **Done!** Your app will now:
- Start automatically when the server reboots
- Restart automatically if it crashes
- Run persistently in the background

---

### 🥈 ALTERNATIVE: Fix Plesk Configuration

If you prefer to use Plesk's built-in Node.js manager:

#### In Plesk Control Panel:

1. Go to: **Websites & Domains → evercold.uz → Node.js**

2. Verify these settings:
   - ✅ **Node.js Support:** ENABLED (toggle ON)
   - ✅ **Node.js Version:** 20.x or later
   - ✅ **Application Mode:** Production
   - ✅ **Application Root:** `/var/www/vhosts/evercold.uz/app.evercold.uz`
   - ✅ **Application Startup File:** `server.js`
   - ✅ **Application URL:** Leave blank or set to `https://app.evercold.uz`

3. Add these **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=mysql://ever_cold:2%4019Tashkent@localhost:3306/ever_cold
   ```

4. Click **"Apply"** then **"Restart App"**

5. Wait 15-30 seconds, then test:
   ```bash
   curl -I https://app.evercold.uz/api/health
   ```

#### If it still doesn't work:

Try **disable → re-enable**:
1. Toggle **"Node.js Support"** to **OFF**
2. Click **"Apply"**
3. Toggle **"Node.js Support"** back to **ON**
4. Click **"Apply"**
5. Click **"Restart App"**

---

## How to Verify Success

Once you've started the app (with either PM2 or Plesk), test these:

### 1. Check Process is Running
```bash
# If using PM2:
pm2 status

# If using Plesk:
ps aux | grep node
# Should show: node server.js
```

### 2. Test Health Endpoint
```bash
curl -I https://app.evercold.uz/api/health
# Should return: HTTP/2 200
```

### 3. Test Frontend
Open in browser: https://app.evercold.uz
- Should load without 500 errors in console
- Dashboard should display data

### 4. Test Auto-Customer Creation ✨
1. Go to: https://app.evercold.uz/ru/orders
2. Upload Excel with **NEW customer name** (not in database)
3. Should succeed ✅
4. Customer auto-created with code: `AUTO-{timestamp}`

### 5. Test Invoice Generation ✨
1. Find any order in the app
2. Click to generate invoice
3. PDF should download ✅
4. **NO "Helvetica.afm not found" error** 🎉

---

## Troubleshooting

### PM2 Commands (if using PM2)
```bash
pm2 status                  # View all processes
pm2 logs evercold-crm       # View live logs
pm2 restart evercold-crm    # Restart the app
pm2 stop evercold-crm       # Stop the app
pm2 monit                   # Real-time monitoring
```

### Check Logs
```bash
# PM2 logs (if using PM2):
pm2 logs evercold-crm

# Plesk logs (if using Plesk):
tail -100 /var/www/vhosts/evercold.uz/logs/error_log
tail -100 /var/www/vhosts/evercold.uz/logs/proxy_access_ssl_log
```

### If API still returns 500:
1. Verify Node.js process is running: `ps aux | grep node`
2. Check logs for errors
3. Verify .env.production exists and has correct DATABASE_URL
4. Test database connection: `mysql -u ever_cold -p ever_cold` (password: 2@019Tashkent)

---

## Summary

**You're 99% there!** The app is deployed correctly and works perfectly when started manually.

**Choose one:**
- 🥇 **PM2** (recommended) - Run `START_WITH_PM2.sh` on your server
- 🥈 **Plesk** - Fix Plesk Node.js configuration

Either way, once the process is running, your app will be **100% operational** with:
- ✅ Auto-customer creation working
- ✅ Invoice generation working
- ✅ All API endpoints responding
- ✅ No more 500 errors

Good luck! 🚀
