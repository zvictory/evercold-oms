import { z } from 'zod'

export const productSchema = z.object({
  name: z.string()
    .min(1, "Product name is required")
    .max(255, "Name too long"),

  sapCode: z.string()
    .optional()
    .refine(val => !val || val.length <= 50, "SAP code too long"),

  barcode: z.string()
    .optional()
    .refine(val => !val || val.length <= 50, "Barcode too long"),

  sku: z.string()
    .optional()
    .refine(val => !val || val.length <= 50, "SKU too long"),

  unitPrice: z.number()
    .min(0.01, "Price must be at least 0.01")
    .max(999999999, "Price too high"),

  unit: z.string()
    .min(1, "Unit is required")
    .default("ШТ")
    .optional(),

  vatRate: z.number()
    .min(0, "VAT rate cannot be negative")
    .max(100, "VAT rate cannot exceed 100%")
    .default(12)
    .optional(),

  description: z.string()
    .max(1000, "Description too long")
    .optional(),
})

export type ProductFormValues = z.infer<typeof productSchema>
