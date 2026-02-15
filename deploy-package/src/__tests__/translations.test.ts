import ru from '@/messages/ru.json'
import en from '@/messages/en.json'
import uzLatn from '@/messages/uz-Latn.json'
import uzCyrl from '@/messages/uz-Cyrl.json'

describe('Translation Keys Validation', () => {
  const messages = { ru, en, 'uz-Latn': uzLatn, 'uz-Cyrl': uzCyrl }

  // Keys that should exist in all message files for Orders functionality
  const requiredOrdersKeys = {
    'Orders.sheet': [
      'editTitle',
      'newTitle',
      'directEditBadge',
      'manualEntryBadge',
      'logisticsSection',
      'customerLabel',
      'customerPlaceholder',
      'branchLabel',
      'branchPlaceholder',
      'branchSearchPlaceholder',
      'branchNotFound',
      'deliveryDateLabel',
      'deliveryInformationLabel',
      'lineItemsSection',
      'cloneLastOrderButton',
      'cloningText',
      'addItemButton',
      'tableNo',
      'tableItemName',
      'tableItemCode',
      'tableBarcode',
      'tableQty',
      'tablePrice',
      'tableAmount',
      'tableVatPercent',
      'tableVatAmount',
      'tableTotal',
      'selectProductPlaceholder',
      'noProductsText',
      'totalLabel',
      'netLabel',
      'vatLabel',
      'totalWithVatLabel',
      'notesLabel',
      'notesPlaceholder',
      'cancelButton',
      'finalizeButton',
      'updateButton',
      'totalQuantityError',
    ],
    'Orders.table': [
      'emptyTitle',
      'emptySubtitle',
      'actionsMenu',
      'editDetails',
      'downloadInvoice',
      'downloading',
      'deleteOrder',
    ],
    'Orders.bulkDelete': [
      'title',
      'confirmation',
      'confirmationPlural',
      'description',
      'cancelButton',
      'deleteButton',
      'deleteCompleteButton',
      'success',
    ],
    'Orders.import': [
      'title',
      'description',
      'uploadArea',
      'supportedFormats',
      'formatRequirements',
      'detailedFormat',
      'registryFormat',
      'uploadButton',
      'importButton',
      'importingText',
      'success',
      'successCount',
    ],
    'Orders.invoice': [
      'title',
      'subtitle',
      'contractLabel',
      'contractPlaceholder',
      'invoiceDateLabel',
      'orderNumberCol',
      'quantityCol',
      'priceCol',
      'amountCol',
      'netAmount',
      'vatAmount',
      'totalAmount',
      'generateButton',
      'generatingText',
      'success',
      'error',
    ],
  }

  Object.entries(messages).forEach(([langCode, langMessages]) => {
    describe(`${langCode} Language`, () => {
      test('Orders namespace exists', () => {
        expect(langMessages.Orders).toBeDefined()
        expect(typeof langMessages.Orders).toBe('object')
      })

      Object.entries(requiredOrdersKeys).forEach(([namespace, keys]) => {
        test(`${namespace} section exists`, () => {
          const section = namespace.split('.')[1]
          expect((langMessages.Orders as any)[section]).toBeDefined()
        })

        keys.forEach(key => {
          test(`${namespace}.${key} exists`, () => {
            const section = namespace.split('.')[1]
            const sectionObj = (langMessages.Orders as any)[section]
            expect(sectionObj).toBeDefined()
            expect(sectionObj[key]).toBeDefined()
            expect(typeof sectionObj[key]).toBe('string')
            // Ensure value is not empty
            expect(sectionObj[key].trim().length).toBeGreaterThan(0)
          })
        })
      })

      test('No untranslated placeholders in Orders keys', () => {
        const orderKeys = (langMessages.Orders as any)
        const checkValue = (val: any): boolean => {
          if (typeof val === 'string') {
            // Check for common untranslated placeholders
            return (
              !val.includes('TODO') &&
              !val.includes('[') &&
              !val.includes(']') &&
              val.trim().length > 0
            )
          }
          if (typeof val === 'object' && val !== null) {
            return Object.values(val).every(checkValue)
          }
          return true
        }

        expect(checkValue(orderKeys)).toBe(true)
      })
    })
  })

  describe('Nested Translation Keys', () => {
    test('Orders.table.tableHeaders contains all required header keys', () => {
      const requiredHeaders = ['id', 'branch', 'date', 'volume', 'value', 'status']

      Object.entries(messages).forEach(([lang, msg]) => {
        const headers = (msg.Orders as any)?.table?.tableHeaders
        expect(headers).toBeDefined()
        expect(typeof headers).toBe('object')

        requiredHeaders.forEach(key => {
          expect(headers[key]).toBeDefined()
          expect(typeof headers[key]).toBe('string')
          expect(headers[key].trim().length).toBeGreaterThan(0)
        })
      })
    })
  })

  describe('Cross-Language Consistency', () => {
    test('All languages have same number of Orders sections', () => {
      const sectionCounts = Object.entries(messages).map(
        ([lang, msg]) =>
          Object.keys((msg.Orders as any) || {}).length
      )

      // All should have same count
      expect(new Set(sectionCounts).size).toBe(1)
    })

    test('Orders.statuses section exists in all languages', () => {
      Object.entries(messages).forEach(([lang, msg]) => {
        expect((msg.Orders as any).statuses).toBeDefined()
        expect(Object.keys((msg.Orders as any).statuses || {})).toEqual(
          expect.arrayContaining(['NEW', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
        )
      })
    })

    test('Orders.errors section exists in all languages', () => {
      Object.entries(messages).forEach(([lang, msg]) => {
        expect((msg.Orders as any).errors).toBeDefined()
        expect(Object.keys((msg.Orders as any).errors || {}).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Translation Quality Checks', () => {
    test('Russian translations are not empty', () => {
      const ru_obj = (ru.Orders as any)
      const checkFilled = (val: any): boolean => {
        if (typeof val === 'string') {
          return val.trim().length > 0 && val !== 'TRANSLATION_NEEDED'
        }
        if (typeof val === 'object' && val !== null) {
          return Object.values(val).every(checkFilled)
        }
        return true
      }

      expect(checkFilled(ru_obj)).toBe(true)
    })

    test('English translations are not empty', () => {
      const en_obj = (en.Orders as any)
      const checkFilled = (val: any): boolean => {
        if (typeof val === 'string') {
          return val.trim().length > 0 && val !== 'TRANSLATION_NEEDED'
        }
        if (typeof val === 'object' && val !== null) {
          return Object.values(val).every(checkFilled)
        }
        return true
      }

      expect(checkFilled(en_obj)).toBe(true)
    })

    test('Uzbek Latin translations are not empty', () => {
      const uz_obj = (uzLatn.Orders as any)
      const checkFilled = (val: any): boolean => {
        if (typeof val === 'string') {
          return val.trim().length > 0 && val !== 'TRANSLATION_NEEDED'
        }
        if (typeof val === 'object' && val !== null) {
          return Object.values(val).every(checkFilled)
        }
        return true
      }

      expect(checkFilled(uz_obj)).toBe(true)
    })

    test('Uzbek Cyrillic translations are not empty', () => {
      const uz_obj = (uzCyrl.Orders as any)
      const checkFilled = (val: any): boolean => {
        if (typeof val === 'string') {
          return val.trim().length > 0 && val !== 'TRANSLATION_NEEDED'
        }
        if (typeof val === 'object' && val !== null) {
          return Object.values(val).every(checkFilled)
        }
        return true
      }

      expect(checkFilled(uz_obj)).toBe(true)
    })
  })
})
