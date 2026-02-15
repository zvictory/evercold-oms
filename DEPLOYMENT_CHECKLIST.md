# ✅ DEPLOYMENT CHECKLIST

## 📦 Files You Have

- ✅ `evercold-production-complete.zip` (24 MB) - Main deployment package
- ✅ `DEPLOYMENT_QUICK_START.txt` - Quick reference guide
- ✅ `PRODUCTION_DEPLOYMENT_COMPLETE.md` - Detailed guide
- ✅ `TECHNICAL_FIXES_SUMMARY.md` - What was fixed and why

Inside ZIP:
- ✅ `.next/` - Built Next.js app
- ✅ `src/` - Source code
- ✅ `package.json` - Dependencies list
- ✅ `package-lock.json` - Locked versions
- ✅ `DEPLOYMENT_GUIDE.md` - Step-by-step inside ZIP
- ✅ `server.js` - Server startup script

## 🚀 Before You Deploy

- [ ] Download `evercold-production-complete.zip`
- [ ] Have your Plesk credentials ready
- [ ] Have SSH access to server (root@135.181.84.232)
- [ ] Have your current `.env.production` file ready

## 📋 Deployment Steps

### Step 1: Upload (Plesk File Manager)
- [ ] Open Plesk Control Panel
- [ ] Navigate to Websites & Domains → evercold.uz → File Manager
- [ ] Go to: `/var/www/vhosts/evercold.uz/app.evercold.uz/`
- [ ] Upload `evercold-production-complete.zip`
- [ ] Right-click → Extract files

### Step 2: Install Dependencies (SSH - CRITICAL!)
- [ ] SSH into server: `ssh root@135.181.84.232`
- [ ] Navigate: `cd /var/www/vhosts/evercold.uz/app.evercold.uz/deploy-package`
- [ ] Install: `npm install --production`
- [ ] Wait for completion (2-3 minutes)
- [ ] Verify: `ls -la node_modules/pdfkit/js/data/ | grep Helvetica`

### Step 3: Deploy (SSH)
- [ ] Go to: `cd /var/www/vhosts/evercold.uz/app.evercold.uz`
- [ ] Backup old: `mv app app.backup-$(date +%s)`
- [ ] Deploy new: `mv deploy-package app`
- [ ] Verify: `ls -la app/` (should show: .next, src, node_modules, package.json)

### Step 4: Restart (Plesk)
- [ ] In Plesk: Websites & Domains → evercold.uz
- [ ] Click **Node.js** tab
- [ ] Click **Restart App** button
- [ ] Wait 10-15 seconds

## 🧪 Verification Steps

### Test 1: App Loads
- [ ] Run: `curl -I https://app.evercold.uz/ru/orders`
- [ ] Should see: `HTTP/2 200`

### Test 2: Auto-Customer Creation
- [ ] Go to: `https://app.evercold.uz/ru/orders`
- [ ] Upload Excel with NEW customer name (test-customer-xyz)
- [ ] Should succeed ✅
- [ ] Check database - customer should exist with AUTO-{timestamp} code

### Test 3: Invoice Generation
- [ ] Find/create an order in the app
- [ ] Click to generate invoice
- [ ] PDF should download ✅
- [ ] Open PDF - should have:
  - [ ] "СЧЁТ-ФАКТУРА" header
  - [ ] Customer name
  - [ ] Items with prices
  - [ ] Total amount
  - [ ] Helvetica font (not broken)

## 🔄 Rollback (If Needed)

- [ ] SSH: `cd /var/www/vhosts/evercold.uz/app.evercold.uz`
- [ ] Remove new: `rm -rf app`
- [ ] Restore old: `mv app.backup-* app`
- [ ] Restart app in Plesk

## 📝 Post-Deployment

- [ ] Update `.env.production` if needed (secrets in ZIP are examples)
- [ ] Test all critical flows:
  - [ ] User login
  - [ ] Order creation
  - [ ] Customer import from Excel
  - [ ] Invoice generation
  - [ ] Driver app features
- [ ] Monitor logs for 24 hours
- [ ] Inform users about new features (auto-customer, fixed invoices)

## ⚠️ Important Notes

1. **npm install --production** MUST complete successfully
   - If it fails, run it again
   - It takes 2-3 minutes

2. **Font files** are critical for invoices
   - Verify they exist: `ls node_modules/pdfkit/js/data/`
   - Should show: Helvetica.afm, Helvetica-Bold.afm, etc.

3. **Environment variables**
   - Don't use .env files from ZIP
   - Use your current .env.production
   - Just copy it to: `app/.env.production`

4. **First app start**
   - May take 30-60 seconds
   - Subsequent starts are instant
   - Don't restart if it's already starting

## 🎯 Success Criteria

✅ All deployment steps completed
✅ App loads without 500 errors
✅ Auto-customer creation works
✅ Invoice generation works (downloads PDF)
✅ No "Helvetica.afm" errors in logs
✅ All critical features tested

## 🆘 Emergency Contacts

If something breaks:
1. Check logs: `tail -100 app/.next/dev/logs/next-development.log`
2. Rollback to backup version (see above)
3. Verify npm install completed: `ls node_modules/ | wc -l` (should be 100+)

---

**Status**: Ready for Deployment ✅
**Version**: 1.0.0
**Date**: 2026-02-15
