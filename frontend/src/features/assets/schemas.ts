import { z } from 'zod'

const optionalText = (max: number, message: string) => z.string().trim().max(max, message)

const purchaseCost = z.string().trim().superRefine((value, ctx) => {
  if (!value) return
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(value)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Enter a non-negative amount with up to 2 decimal places',
    })
  }
})

const purchaseDate = z.string().trim().refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), {
  message: 'Enter a valid date',
})

export const assetFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(150, 'Name must be 150 characters or fewer'),
  assetTag: z.string().trim().min(1, 'Asset tag is required').max(100, 'Asset tag must be 100 characters or fewer'),
  categoryId: z.string(),
  serialNumber: optionalText(100, 'Serial number must be 100 characters or fewer'),
  purchaseDate,
  purchaseCost,
  notes: optionalText(1000, 'Notes must be 1000 characters or fewer'),
})

export type AssetFormValues = z.infer<typeof assetFormSchema>

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer'),
  description: optionalText(500, 'Description must be 500 characters or fewer'),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

export const assignAssetSchema = z.object({
  employeeId: z.string().min(1, 'Choose an employee'),
  notes: optionalText(1000, 'Notes must be 1000 characters or fewer'),
})

export type AssignAssetValues = z.infer<typeof assignAssetSchema>

export const bulkCategorySchema = z
  .object({
    categoryId: z.string(),
    clearCategory: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (!value.clearCategory && !value.categoryId) {
      ctx.addIssue({ code: 'custom', message: 'Choose a category', path: ['categoryId'] })
    }
  })

export type BulkCategoryValues = z.infer<typeof bulkCategorySchema>
