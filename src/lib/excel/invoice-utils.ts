import ExcelJS from 'exceljs'

// Create cell with borders
export function createBorderedCell(
  sheet: ExcelJS.Worksheet,
  address: string,
  value: any,
  options: {
    bold?: boolean
    fontSize?: number
    alignment?: 'left' | 'center' | 'right'
    wrapText?: boolean
  } = {}
) {
  const cell = sheet.getCell(address)
  cell.value = value
  cell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  }
  cell.font = {
    size: options.fontSize || 7,
    bold: options.bold || false,
  }
  if (options.alignment) {
    cell.alignment = { horizontal: options.alignment, vertical: 'middle', wrapText: options.wrapText }
  }
  return cell
}

// Merge cells and set value
export function mergeCellsAndSet(
  sheet: ExcelJS.Worksheet,
  range: string,
  value: any,
  options: {
    bold?: boolean
    fontSize?: number
    alignment?: 'left' | 'center' | 'right'
    wrapText?: boolean
  } = {}
) {
  sheet.mergeCells(range)
  const startCell = range.split(':')[0]
  createBorderedCell(sheet, startCell, value, options)
}

// Apply borders to range
export function applyBordersToRange(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
) {
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cell = sheet.getCell(row, col)
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    }
  }
}

// Format date in Russian format
export function formatInvoiceDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Convert column letter to number (A=1, B=2, etc.)
export function colLetterToNum(letter: string): number {
  let num = 0
  for (let i = 0; i < letter.length; i++) {
    num = num * 26 + letter.charCodeAt(i) - 64
  }
  return num
}

// Convert column number to letter (1=A, 2=B, etc.)
export function colNumToLetter(num: number): string {
  let letter = ''
  while (num > 0) {
    const mod = (num - 1) % 26
    letter = String.fromCharCode(65 + mod) + letter
    num = Math.floor((num - mod) / 26)
  }
  return letter
}
