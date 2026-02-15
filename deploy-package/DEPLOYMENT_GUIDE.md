# 🚀 COMPLETE DEPLOYMENT GUIDE - Evercold CRM

## ⚠️ CRITICAL: PDFKit Font Files Issue

**Problem**: The previous deployment failed because `node_modules/pdfkit/` font files were missing.
**Solution**: The production server MUST install dependencies.

---

## 📋 DEPLOYMENT STEPS (3 Steps)

### ✅ STEP 1: Upload Files via Plesk File Manager

1. Navigate to: **Plesk → Websites & Domains → evercold.uz → File Manager**
2. Go to: `/var/www/vhosts/evercold.uz/app.evercold.uz/`
3. Create a folder called `new-deployment` (to avoid conflicts)
4. Upload all files from this package into `new-deployment/`

Files to upload:
- `.next/` (entire directory)
- `src/` (entire directory)
- `package.json`
- `package-lock.json`
- `schema.prisma`
- `.env.production` (copy your existing one - NOT provided for security)
- `server.js`

---

### ✅ STEP 2: Install Dependencies (CRITICAL!)

**SSH into your server and run:**

```bash
cd /var/www/vhosts/evercold.uz/app.evercold.uz/new-deployment

# Install ONLY production dependencies (not dev tools)
npm install --production

# This installs pdfkit with ALL font files including Helvetica.afm
```

**Why this matters**:
- `npm install --production` installs dependencies listed in `dependencies` section of package.json
- PDFKit's font files (Helvetica.afm, etc.) will be in: `node_modules/pdfkit/js/data/`
- Without this step, invoices cannot be generated

---

### ✅ STEP 3: Replace Old Deployment

**Option A: Using SSH (Recommended)**
```bash
cd /var/www/vhosts/evercold.uz/app.evercold.uz

# Backup the old deployment
mv app app.backup.$(date +%s)

# Move new deployment into place
mv new-deployment app

# Verify structure
ls -la app/
# Should show: .next/ src/ node_modules/ package.json .env.production etc.
```

**Option B: Using Plesk File Manager**
1. Rename current `app` folder to `app.backup`
2. Rename `new-deployment` to `app`

---

### ✅ STEP 4: Restart Application

In Plesk:
1. **Websites & Domains** → **evercold.uz**
2. **Node.js** tab
3. Click **Restart App**

Wait 10-15 seconds for app to start.

---

## 🧪 VERIFY IT WORKS

### Test 1: App Loads
```bash
curl -I https://app.evercold.uz/ru/orders
# Should return: HTTP/2 200
```

### Test 2: Auto-Customer Creation Works
1. Go to: `https://app.evercold.uz/ru/orders`
2. Upload Excel file with a **NEW customer name** (e.g., "Test Customer XYZ")
3. Should succeed ✅
4. Check database: Customer should exist with code `AUTO-{timestamp}`

### Test 3: Invoice Generation Works (This is the fix!)
1. Create/find an order
2. Click "Generate Invoice" or similar
3. PDF should download successfully ✅
4. No "Helvetica.afm not found" error

---

## 🔄 ROLLBACK (If Something Goes Wrong)

```bash
cd /var/www/vhosts/evercold.uz/app.evercold.uz

# Stop app
rm -rf app
mv app.backup app

# Restart in Plesk
# Websites & Domains → Node.js → Restart App
```

---

## 📊 What's Included

✅ **Complete Next.js Build** (`.next/`)
- All TypeScript compiled to JavaScript
- All assets bundled and optimized
- Ready to run, no build needed on server

✅ **PDF Generation** (PDFKit)
- Uses pure JavaScript, no Chromium/system libraries
- Generates professional invoices with Helvetica font
- Font files included in node_modules installation

✅ **Auto-Customer Creation**
- Automatically creates customers if not found
- Uses AUTO-{timestamp} customer codes
- Partial name matching supported

✅ **Database Migrations**
- Prisma schema included
- Run Prisma migrations separately if needed

---

## ⚠️ Important Notes

1. **Environment Variables**:
   - Copy `.env.production` from your existing deployment
   - The `.env.example` is just a template

2. **Database**:
   - No database changes needed
   - If schema changed, run: `npx prisma db push`

3. **Dependencies**:
   - `npm install --production` takes ~2-3 minutes
   - This is required for PDFKit fonts to work

4. **File Permissions**:
   - Plesk usually handles this automatically
   - If issues occur, SSH and set: `chmod -R 755 app/`

---

## 🆘 Troubleshooting

### Error: "Cannot find module 'pdfkit'"
```bash
# On production server:
cd /var/www/vhosts/evercold.uz/app.evercold.uz/app
npm install --production
```

### Error: "Helvetica.afm not found"
```bash
# Font files missing, run npm install:
cd /var/www/vhosts/evercold.uz/app.evercold.uz/app
npm install --production

# Verify fonts exist:
ls -la node_modules/pdfkit/js/data/ | grep -i helvetica
# Should show: Helvetica.afm Helvetica-Bold.afm etc.
```

### Invoice generation still fails
```bash
# Check server logs:
tail -f /var/www/vhosts/evercold.uz/app.evercold.uz/app/.next/dev/logs/next-development.log

# Or in Plesk → Logs
```

### App won't restart
1. Check Node.js version: `node --version` (should be v18+)
2. Check PM2 status: `pm2 list`
3. Check file permissions: `ls -la /var/www/vhosts/evercold.uz/app.evercold.uz/`

---

## 📱 Contact Support

If you encounter issues:

1. **Check logs first**:
   - Plesk → Logs
   - `.next/dev/logs/next-development.log`

2. **Verify structure**:
   ```bash
   ls -la /var/www/vhosts/evercold.uz/app.evercold.uz/app/
   # Must include: .next node_modules src .env.production package.json
   ```

3. **Test locally** on your machine before production

---

**Package Version**: 1.0.0
**Created**: 2026-02-15
**Next.js**: 16.0.10
**Node**: v18+ required

