/**
 * Product SAP Codes - Standard codes used in Evercold system
 */
export const SAP_CODES = {
  ICE_3KG: '107000001-00001',  // Лёд пищевой Ever Cold 3кг
  ICE_1KG: '107000001-00006',  // Лёд пищевой Ever Cold 1кг
} as const

/**
 * Product Weights (in kg) - Used for load capacity calculations
 */
export const PRODUCT_WEIGHTS: Record<string, number> = {
  [SAP_CODES.ICE_3KG]: 3.0,
  [SAP_CODES.ICE_1KG]: 1.0,
}

/**
 * Get product weight by SAP code
 */
export function getProductWeight(sapCode: string): number {
  return PRODUCT_WEIGHTS[sapCode] || 0
}

/**
 * Day names for chart display
 */
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/**
 * Performance thresholds for driver ratings
 */
export const PERFORMANCE_THRESHOLDS = {
  EXCELLENT: 95,  // >= 95% on-time
  GOOD: 85,       // >= 85% on-time
  // < 85% needs improvement
} as const
