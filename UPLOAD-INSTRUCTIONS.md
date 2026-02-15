# 🚀 PRODUCTION BUILD UPLOAD INSTRUCTIONS

## 📦 Files Ready

- **evercold-production-build.zip** (22 MB)
  - Complete built application with auto-customer creation
  - Ready to extract and run
  - NO npm build needed on server!

---

## ⚡ FASTEST DEPLOYMENT (3 Steps)

### Step 1: Upload via Plesk File Manager
1. Open **Plesk Control Panel**
2. **Websites & Domains** → **evercold.uz** → **File Manager**
3. Navigate to: `/var/www/vhosts/evercold.uz/app.evercold.uz/`
4. **Upload** the `evercold-production-build.zip` file

### Step 2: Extract
1. Right-click `evercold-production-build.zip`
2. Select **Extract**
3. Files extract to current directory

### Step 3: Restart App
1. Go to **Websites & Domains** → **Node.js**
2. Click **Restart App**

✅ **DONE! The new build is live!**

---

## 🧪 TEST IT

1. Go to: `https://app.evercold.uz/ru/orders`
2. Upload Excel with **new customer name**
3. **Should work!** ✅
4. New customer auto-created with `AUTO-{timestamp}` code

---

## 🔙 ROLLBACK (if needed)

If something goes wrong:
```bash
# SSH into server
cd /var/www/vhosts/evercold.uz/app.evercold.uz

# Restore from backup
rm -rf .next
git checkout .next

# Restart app in Plesk
```

---

## ✨ WHAT'S INCLUDED

✅ **Auto-Customer Creation**
- Customers are created automatically if missing
- No more "Customer not found" errors
- Exact match → Partial match → Auto-create logic

✅ **All Source Files**
- Updated upload route with new functionality
- Ready to run immediately

✅ **Complete Build**
- All Next.js compilation done
- Zero build time on server
- Just restart and go!

---

## 📝 NOTES

- Package: **22 MB** (compressed)
- Extraction: Takes ~30 seconds
- No additional setup needed
- No `npm run build` required

---

**Questions?** Check the logs at:
`.next/dev/logs/next-development.log`
