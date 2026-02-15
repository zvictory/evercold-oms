export const INVOICE_CONSTANTS = {
  SUPPLIER: {
    NAME: 'ЧАСТНОЕ ПРЕДПРИЯТИЕ "EVER COLD"',
    ADDRESS: 'ГОРОД ТАШКЕНТ АЛМАЗАРСКИЙ РАЙОН ZIYO KO`CHASI, 3-UY',
    INN: '304628242',
    VAT_CODE: '326090030353',
    BANK_ACCOUNT: '20208000100748810001',
    MFO: '00963',
    TG: '0.1',
  },

  DEFAULT_BUYER: {
    NAME: '"ANGLESEY FOOD" MCHJ',
    ADDRESS: "TUROB TULA KO'CHASI 57-UY",
    INN: '202099756',
    VAT_CODE: '326060002860',
    BANK_ACCOUNT: '20208000900578902001',
    MFO: '00431',
    TG: '0.51',
  },

  CATALOG_CODE: '02105001002000000 - Лёд пищевой',

  FONT_SIZE: 7,

  // Exact column widths from template
  COLUMN_WIDTHS: [
    4.140625,   // A - №
    12.140625,  // B - Наименование
    20.7109375, // C - Идентификационный код
    11.5703125, // D - Штрих-код
    0.28515625, // E - Разделитель
    6.28515625, // F - Количество
    7.140625,   // G - Цена
    7.5703125,  // H - Стоимость
    7.140625,   // I - НДС Ставка
    11.42578125,// J - НДС Сумма
    10,         // K - Итого
  ],

  // Row numbers for first copy
  ROWS: {
    TITLE: 2,
    INVOICE_NUM: 3,
    CONTRACT: 4,
    BRANCH_HEADER: 5,        // NEW - empty row for branch info
    SUPPLIER_START: 6,
    BUYER_START: 6,          // Same row, different columns
    TABLE_HEADER_1: 14,
    TABLE_HEADER_2: 15,
    TABLE_HEADER_3: 16,
    DATA_START: 17,          // First item row
    TOTALS_OFFSET: 2,        // Empty row + totals
    SIGNATURE_OFFSET: 5,     // After totals to signatures
  },

  COLUMNS: {
    ROW_NUM: 'A',            // №
    PRODUCT_NAME: 'B',       // Наименование
    CATALOG_CODE: 'C',       // Код
    BARCODE: 'D',            // Штрих-код
    UNIT: 'E',               // Единица
    QUANTITY: 'F',           // Количество
    UNIT_PRICE: 'G',         // Цена
    SUBTOTAL: 'H',           // Стоимость
    VAT_RATE: 'I',           // НДС ставка
    VAT_AMOUNT: 'J',         // НДС сумма
    TOTAL: 'K',              // Итого с НДС
  },

  FORMULAS: {
    ITEM_SUBTOTAL: (row: number) => `F${row}*G${row}`,
    ITEM_VAT_AMOUNT: (row: number) => `H${row}/100*15`,
    ITEM_TOTAL: (row: number) => `H${row}+J${row}`,
    TOTALS_SUBTOTAL: (start: number, end: number) => `SUM(H${start}:H${end})`,
    TOTALS_VAT: (start: number, end: number) => `SUM(J${start}:J${end})`,
    TOTALS_TOTAL: (start: number, end: number) => `SUM(K${start}:K${end})`,
  },

  ROW_HEIGHTS: {
    TABLE_HEADER: 30,
    DATA_ROW: 15,
    SIGNATURE_1: 9.75,
    SIGNATURE_2: 24.75,
    SIGNATURE_3: 12.75,
  },

  SECOND_COPY_OFFSET: 33,
}
