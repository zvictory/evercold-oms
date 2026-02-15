# Invoice Format Update - Summary

## Changes Made (2026-02-15)

### 1. Created Number-to-Words Utility
**File**: `src/lib/utils/numberToWords.ts`

- Converts amounts to Russian words for invoice totals
- Example: 111900.04 → "Сто одиннадцать тысяч девятьсот сум 04 тийин"
- Supports both "sum" (UZS) and "usd" currencies

### 2. Completely Rewrote PDF Generation
**File**: `src/lib/pdf/generateSchetFakturaPDF.ts`

#### Old Format (Simple):
- Basic English/Russian mixed layout
- USD currency with $ symbols
- Minimal supplier/buyer details
- Simple 5-column table
- Generic footer

#### New Format (Official Uzbek):
- Full Russian-only content
- Uzbek Som (UZS) currency
- Complete legal entity details:
  - INN (Идентификационный номер)
  - VAT registration codes (Регистрационный код плательщика НДС)
  - Bank accounts (Р/С)
  - Bank codes (МФО)
- Government-compliant table with all required columns:
  - №
  - Наименование товаров (услуг)
  - Идентификационный код и название по каталогу
  - Единица измерения
  - Количество
  - Цена
  - Стоимость поставки
  - НДС (Ставка / Сумма)
  - Стоимость поставки с учетом НДС
- Total amount in Russian words
- Proper signatures section for both parties
- Contract reference line (к договору № X от DD.MM.YYYY)

### 3. Updated Filename Format
**File**: `src/app/api/orders/bulk-schet-faktura/route.ts`

#### Old Format:
- `bulk-schet-faktura-2026-02-15.pdf`
- `schet-faktura-ORDER_ID.pdf` (for separate files)

#### New Format:
- `Счет_фактура_без_акта_2129_от_05_12_2025_.pdf`
- Pattern: `Счет_фактура_без_акта_[NUMBER]_от_[DD_MM_YYYY]_.pdf`
- Matches official Uzbek government invoice naming convention

### 4. Key Layout Changes

- Increased page margins from 20pt to 40pt
- Two-column layout for supplier/buyer information
- Proper table borders and cell spacing
- Font sizes: 6-12pt (government standard)
- Contract info displayed prominently under invoice number

## Deployment

### Files Updated on Production (ice.erpstable.com):
1. `/opt/evercold/.next/` - Rebuilt Next.js bundle
2. `/opt/evercold/src/lib/pdf/generateSchetFakturaPDF.ts`
3. `/opt/evercold/src/lib/utils/numberToWords.ts`
4. `/opt/evercold/src/app/api/orders/bulk-schet-faktura/route.ts`

### Server: ice-production (173.212.195.32)
- PM2 process restarted successfully
- Application running on port 3000
- Nginx proxying HTTPS traffic
- No errors in startup logs

## Testing

To test the new invoice format:
1. Log in to https://ice.erpstable.com
2. Go to Orders page
3. Select one or more orders
4. Click "Generate Invoice" or "Bulk Invoice"
5. Check that downloaded PDF matches reference format

## Reference Files

- **Official Format**: `/Users/zafar/Downloads/Счет_фактура_без_акта_2129_от_05_12_2025_.pdf`
- **Old Format**: `/Users/zafar/Desktop/bulk-schet-faktura-2026-02-15 (1).pdf`

## Notes

- Font path issue resolved with `/ROOT` symlink (created earlier)
- All text now in Russian (no English except code identifiers)
- Currency changed from USD to UZS throughout
- Invoice numbers auto-increment from database
- Contract info comes from order.contractInfo field or defaults to "к договору № 1 от 02.01.2022"

---

**Date**: 2026-02-15
**Deployed to**: ice.erpstable.com (173.212.195.32)
**Status**: ✅ Complete and deployed
