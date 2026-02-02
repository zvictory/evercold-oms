export const INVOICE_CONSTANTS = {
  SUPPLIER: {
    NAME: 'ЧАСТНОЕ ПРЕДПРИЯТИЕ "EVER COLD"',
    ADDRESS: 'ГОРОД ТАШКЕНТ АЛМАЗАРСКИЙ РАЙОН ZIYO KO`CHASI, 3-UY',
    INN: '304628242',
    VAT_CODE: '326090030353 (сертификат активный)',
    BANK_ACCOUNT: '20208000100748810001',
    MFO: '00963',
    TG: '0.1',
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
    SUPPLIER_START: 6,
    TABLE_HEADER_1: 14,
    TABLE_HEADER_2: 15,
    TABLE_HEADER_NUMS: 16,
    DATA_START: 17,
    TOTALS_OFFSET: 2, // Rows after last item
    SIGNATURE_OFFSET: 5, // Rows after totals
  },

  // Row heights (exact from template)
  ROW_HEIGHTS: {
    DEFAULT: 15,
    TABLE_HEADER: 23.25,  // Row 14
    DATA_ROW: 17.25,       // Rows 17-18 (item rows)
    SIGNATURE_1: 9.75,     // Row 22
    SIGNATURE_2: 24.75,    // Rows 24, 26
    SIGNATURE_3: 12.75,    // Row 28
  },

  // Offset for second copy
  SECOND_COPY_OFFSET: 33,
}

export const TABLE_HEADERS = {
  // Row 1 - Main headers (some will be merged with row 2)
  ROW_1: [
    '№',
    'Наименование товаров (услуг)',
    'Идентификационный код и название по Единому электронному национальному классификатору продукции и услуг',
    'Штрих-код товара/услуги',
    '',
    'Единица измерения',
    'Количество',
    'Цена',
    'Стоимость поставки',
    'НДС',
    '',
    'Стоимость поставки с учетом НДС',
  ],
  // Row 2 - Sub headers
  ROW_2: [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Ставка',
    'Сумма',
    '',
  ],
  // Row 3 - Column numbers
  ROW_3: ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
}
