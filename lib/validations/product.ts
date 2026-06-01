import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const productBasicSchema = z.object({
  title: z
    .string({ message: 'Title is required' })
    .min(3, 'Title must be at least 3 characters'),
  desc: z
    .string({ message: 'Description is required' })
    .min(10, 'Description must be at least 10 characters'),
  brandId: z.string().regex(objectIdRegex, 'Please select a brand'),
  categoryId: z.string().regex(objectIdRegex, 'Please select a category'),
  pickupWareHouseId: z.string().regex(objectIdRegex, 'Please select a warehouse'),
  returnPolicyType: z.enum(['REPLACE', 'RETURN', 'BOTH', 'NONE']).default('REPLACE'),
  returnWindowDays: z.coerce.number().min(0, 'Return window cannot be negative'),
});

export const variantSchema = z.object({
  title: z.string().min(1, 'Variant title is required').min(3, 'Variant title must be at least 3 characters'),
  sku: z.string().min(1, 'SKU is required').min(3, 'SKU must be at least 3 characters'),
  price: z.string().min(1, 'Price is required').refine(val => !isNaN(Number(val)) && Number(val) >= 0, 'Price must be a valid non-negative number'),
  mrp: z.string().min(1, 'MRP is required').refine(val => !isNaN(Number(val)) && Number(val) >= 0, 'MRP must be a valid non-negative number'),
  stocks: z.string().min(1, 'Stock quantity is required').refine(val => !isNaN(Number(val)) && Number(val) >= 0, 'Stock must be a valid non-negative number'),
});
