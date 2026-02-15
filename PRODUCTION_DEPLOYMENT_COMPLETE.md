# ✅ PRODUCTION DEPLOYMENT - COMPLETE GUIDE

## 📦 What You Have

**File**: `evercold-production-complete.zip` (24 MB)

This ZIP contains:
- ✅ Complete Next.js 16 production build (`.next/`)
- ✅ Source code (`src/`)
- ✅ PDFKit for invoice generation (no Puppeteer!)
- ✅ Auto-customer creation feature
- ✅ Deployment instructions

**Key Fix**: PDFKit font files will be installed on the server when you run `npm install --production`

---

## 🚀 DEPLOYMENT (4 Simple Steps)

### 1️⃣ Upload to Plesk

1. Open **Plesk Control Panel**
2. **Websites & Domains** → **evercold.uz** → **File Manager**
3. Navigate to: `/var/www/vhosts/evercold.uz/app.evercold.uz/`
4. Upload the ZIP file: `evercold-production-complete.zip`
5. Right-click → **Extract**

### 2️⃣ Install Dependencies (CRITICAL!)

**SSH into your server:**

```bash
ssh root@135.181.84.232
cd /var/www/vhosts/evercold.uz/app.evercold.uz/deploy-package

npm install --production
```

**⚠️ This step MUST happen!** It installs PDFKit with font files needed for invoices.

### 3️⃣ Deploy the New Version

**SSH command:**
```bash
cd /var/www/vhosts/evercold.uz/app.evercold.uz

# Backup old version (safety)
mv app app.backup-$(date +%s)

# Move new version into place
mv deploy-package app
```

### 4️⃣ Restart in Plesk

1. **Websites & Domains** → **evercold.uz**
2. Click **Node.js** tab
3. Click **Restart App**
4. Wait 10-15 seconds ⏳

---

## ✅ VERIFY DEPLOYMENT

### Test 1: App Loads
```bash
curl -I https://app.evercold.uz/ru/orders
# Should return: HTTP/2 200
```

### Test 2: Auto-Customer Works
1. Go to: `https://app.evercold.uz/ru/orders`
2. Upload Excel with **NEW customer** (not in database)
3. Should work ✅ (customer auto-created with AUTO-{timestamp} code)

### Test 3: Invoices Generate ✨
1. Find an order
2. Click to generate invoice
3. Should download as PDF ✅
4. **No more "Helvetica.afm" error!**

---

## 🔄 ROLLBACK (If Needed)

```bash
cd /var/www/vhosts/evercold.uz/app.evercold.uz

rm -rf app
mv app.backup-* app

# Restart in Plesk
```

---

## 📝 Important Notes

1. **Environment Variables**:
   - Use your existing `.env.production` file
   - Don't replace with the one in ZIP
   - Just keep your current secrets intact

2. **Database**:
   - No schema changes needed
   - Auto-customer creation uses existing schema

3. **PDFKit Fonts**:
   - Installed when you run `npm install --production`
   - Fonts located at: `node_modules/pdfkit/js/data/`
   - Helvetica.afm and others will be there

4. **Build Time**:
   - `npm install --production` takes ~2-3 minutes
   - First app start may take ~30 seconds
   - Subsequent starts are instant

---

## 🎯 What Was Fixed

| Issue | Old | New |
|-------|-----|-----|
| **Customer not found** | ❌ Error | ✅ Auto-create |
| **Invoice generation** | ❌ Puppeteer fails (no Chrome) | ✅ PDFKit (pure JS) |
| **Font files** | ❌ Missing on server | ✅ Installed with npm |
| **System dependencies** | ❌ Needs libnspr4.so | ✅ None needed |

---

## 🆘 Troubleshooting

**"Cannot find pdfkit"**
```bash
cd /var/www/vhosts/evercold.uz/app.evercold.uz/app
npm install --production
```

**"Helvetica.afm not found"**
- Same as above - run `npm install --production`

**App won't start**
```bash
# Check logs
tail -100 /var/www/vhosts/evercold.uz/app.evercold.uz/app/.next/dev/logs/next-development.log

# Or check in Plesk → Logs
```

**Invoices still failing**
1. Verify fonts exist: `ls node_modules/pdfkit/js/data/ | grep Helvetica`
2. Restart app in Plesk
3. Try generating invoice again

---

## ✨ Summary

✅ **Auto-customer creation**: Customers are created automatically if missing
✅ **Invoice generation**: Fixed - no more Puppeteer/Chromium issues
✅ **Font files**: Installed with npm - Helvetica.afm error gone
✅ **Production ready**: Complete build, just extract and install

---

**Ready?** Follow the 4 deployment steps above and you're done! 🎉

**Questions?** See `DEPLOYMENT_GUIDE.md` inside the ZIP for detailed instructions.

