# Production Deployment - Multi-Tiered Pricing System

**Date**: 2026-02-16
**Package**: `evercold-production-ready.zip` (29MB)
**Sprint**: Complete implementation of Sprints 1-4

---

## ✅ What's Included

### Sprint 1: Database & Foundation
- ✅ New `TaxStatus` enum (`VAT_PAYER` | `EXEMPT`)
- ✅ `CustomerGroup` model for pricing tiers
- ✅ `PriceListEntry` model for group-level pricing
- ✅ Extended `Customer` model with `taxStatus` and `customerGroupId`
- ✅ Extended `Product` model with `nationalCatalogCode` and `nationalCatalogName`
- ✅ Unified number formatting utilities (`formatPrice`, `formatNumber`, `formatCurrency`, `formatQuantity`)
- ✅ 3-tier price resolver: Individual Override > Group Price > Base Price

### Sprint 2: API Layer
- ✅ `/api/customer-groups` - CRUD for customer groups
- ✅ `/api/price-lists` - CRUD for price list entries
- ✅ `/api/price-lists/matrix` - Price matrix endpoint
- ✅ `/api/products/resolve-price` - Price resolution with VAT exemption
- ✅ Modified existing APIs to support `taxStatus`, `customerGroupId`, `nationalCatalogCode`

### Sprint 3: UI Layer
- ✅ Replaced ~40 `toLocaleString()` calls with `formatPrice()` across 10 files
- ✅ Customer forms: `taxStatus` select + `customerGroupId` dropdown
- ✅ Product forms: National catalog code fields (Didox compliance)
- ✅ New **Price Matrix** component (products × groups, inline editable)
- ✅ Order detail page: VAT exemption logic with `taxStatus`
- ✅ Telegram bot: Updated for `taxStatus` and `formatPrice()`
- ✅ i18n: ~30 new keys across 4 locale files (ru, en, uz-Latn, uz-Cyrl)

### Sprint 4: Invoice Templates
- ✅ Schet-faktura routes use `product.nationalCatalogCode` with fallback
- ✅ Template formatters dynamically use catalog codes
- ✅ PDF generator uses per-product catalog codes

---

## 🚀 Pre-Deployment Checklist

### 1. Database Migration
**CRITICAL**: Run the migration script before deploying code.

```bash
# On production server
cd evercold-production-ready
npm install
npx tsx prisma/migrate-pricing.ts
```

**What it does:**
- Creates "Standard" customer group
- Migrates all customers to Standard group
- Sets `taxStatus` based on `hasVat` (keeps `hasVat` for backward compatibility)
- Sets all products' `nationalCatalogCode` to default `02105001002000000`
- Seeds `PriceListEntry` from `Product.unitPrice` for Standard group

### 2. Database Schema Push
```bash
npm run db:push
```

### 3. Verify Environment Variables
Ensure `.env` has:
```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_API_URL="https://yourdomain.com"
```

### 4. Build & Deploy
```bash
npm run build
npm start
# Or use PM2
pm2 restart evercold
```

---

## 📊 Testing After Deployment

### 1. Customer Groups
- Navigate to Products → Price Matrix tab
- Should see "Standard" group created by migration
- Test creating new customer groups via API

### 2. Tax Status
- Edit existing customer → should see "Tax Status" select (not toggle)
- Create new customer → should have VAT Payer / Exempt options
- Verify customer group dropdown works

### 3. Price Resolution
- Create order for VAT_PAYER customer → verify 12% VAT applied
- Create order for EXEMPT customer → verify vatAmount = 0
- Set custom price for a customer → verify it overrides group price

### 4. Number Formatting
- Check all price displays use space as thousand separator (e.g., "14 513.40")
- Verify `tabular-nums` alignment in tables

### 5. National Catalog Codes
- Edit product → should see "Regulatory Codes" section
- Generate schet-faktura → verify catalog code appears (not hardcoded)

### 6. Price Matrix
- Products → Price Matrix tab
- Set group-level prices
- Save → verify persisted in database
- Create order → verify group price used when no individual override

---

## 🔄 Rollback Plan

If issues arise:

1. **Database schema** is backward compatible (keeps `hasVat`)
2. **Code** checks both `taxStatus === 'VAT_PAYER'` AND `hasVat` for compatibility
3. To rollback:
   ```bash
   git checkout <previous-commit>
   npm run build
   pm2 restart evercold
   ```
4. Migration is non-destructive — no data loss

---

## 📝 Known Limitations

1. **Customer group creation**: Currently via API only. Admin UI for group management coming in future release.

2. **Price matrix UI**: Loads all products at once. For catalogs >1000 products, consider pagination.

3. **Backward compatibility**: `hasVat` field kept on Customer model for 1-2 releases. Will be removed after full migration confirmed.

4. **Test files**: Pre-existing test errors in `deploy-package/` directory are unrelated to this release.

---

## 🆘 Troubleshooting

### "No customer groups found" in Price Matrix
- Run migration script: `npx tsx prisma/migrate-pricing.ts`
- Verify with: `npx prisma studio` → Check `CustomerGroup` table

### Orders still showing old VAT behavior
- Check customer's `taxStatus` field in database
- Migration sets: `taxStatus = hasVat ? 'VAT_PAYER' : 'EXEMPT'`
- Manually update if needed:
  ```sql
  UPDATE "Customer" SET "taxStatus" = 'EXEMPT' WHERE "inn" = '...';
  ```

### TypeScript errors after deployment
- Regenerate Prisma client: `npx prisma generate`
- Clear Next.js cache: `rm -rf .next`
- Rebuild: `npm run build`

### Price resolution not working
- Verify API routes are accessible: `curl https://yourdomain.com/api/customer-groups`
- Check logs for price resolver errors
- Verify `PriceListEntry` table has data

---

## 📞 Support

For issues or questions about this deployment:
- Check logs: `pm2 logs evercold`
- Database inspection: `npx prisma studio`
- API testing: Use Postman collection or curl commands

---

**Deployment Package**: `evercold-production-ready.zip`
**Total Files Changed**: 47
**Database Migration**: Required ✅
**Backward Compatible**: Yes ✅
**Production Ready**: Yes ✅
