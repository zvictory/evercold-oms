/**
 * Convert number to Russian words for invoice amounts
 * Example: 111900.04 => "Сто одиннадцать тысяч девятьсот сум 04 тийин"
 */

const ones = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять']
const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто']
const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать']
const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот']

const thousands = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять']

function convertHundreds(num: number, isFeminine: boolean = false): string {
  if (num === 0) return ''

  const parts: string[] = []
  const h = Math.floor(num / 100)
  const t = Math.floor((num % 100) / 10)
  const o = num % 10

  if (h > 0) parts.push(hundreds[h])

  if (t === 1) {
    parts.push(teens[o])
  } else {
    if (t > 0) parts.push(tens[t])
    if (o > 0) {
      parts.push(isFeminine ? thousands[o] : ones[o])
    }
  }

  return parts.filter(p => p).join(' ')
}

function getThousandsSuffix(num: number): string {
  const lastDigit = num % 10
  const lastTwoDigits = num % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'тысяч'
  if (lastDigit === 1) return 'тысяча'
  if (lastDigit >= 2 && lastDigit <= 4) return 'тысячи'
  return 'тысяч'
}

function getMillionsSuffix(num: number): string {
  const lastDigit = num % 10
  const lastTwoDigits = num % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'миллионов'
  if (lastDigit === 1) return 'миллион'
  if (lastDigit >= 2 && lastDigit <= 4) return 'миллиона'
  return 'миллионов'
}

export function numberToRussianWords(amount: number, currency: 'sum' | 'usd' = 'sum'): string {
  const [integerPart, decimalPart] = amount.toFixed(2).split('.')
  const num = parseInt(integerPart)

  if (num === 0) {
    return currency === 'sum' ? `ноль сум ${decimalPart} тийин` : `ноль долларов ${decimalPart} центов`
  }

  const parts: string[] = []

  // Millions
  const millions = Math.floor(num / 1000000)
  if (millions > 0) {
    parts.push(convertHundreds(millions))
    parts.push(getMillionsSuffix(millions))
  }

  // Thousands
  const thousands = Math.floor((num % 1000000) / 1000)
  if (thousands > 0) {
    parts.push(convertHundreds(thousands, true)) // feminine for thousands
    parts.push(getThousandsSuffix(thousands))
  }

  // Hundreds
  const remainder = num % 1000
  if (remainder > 0) {
    parts.push(convertHundreds(remainder))
  }

  let result = parts.filter(p => p).join(' ')

  // Capitalize first letter
  result = result.charAt(0).toUpperCase() + result.slice(1)

  // Add currency
  if (currency === 'sum') {
    result += ` сум ${decimalPart} тийин`
  } else {
    result += ` долларов ${decimalPart} центов`
  }

  return result
}
