// ✅ SECURITY: Comprehensive input validation schemas using Zod
import { z } from 'zod'

// =====================================
// AUTHENTICATION SCHEMAS
// =====================================

export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim()
    .max(255, 'Email must be less than 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
})

export const registerSchema = loginSchema.extend({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const resetPasswordSchema = z.object({
  token: z.string().length(64, 'Invalid reset token'),
  newPassword: loginSchema.shape.password,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// =====================================
// PRODUCT SCHEMAS
// =====================================

export const productSchema = z.object({
  name: z
    .string()
    .min(3, 'Product name must be at least 3 characters')
    .max(200, 'Product name must be less than 200 characters')
    .trim(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .min(3, 'Slug must be at least 3 characters')
    .max(200, 'Slug must be less than 200 characters'),
  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional(),
  sku: z
    .string()
    .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens')
    .min(3, 'SKU must be at least 3 characters')
    .max(50, 'SKU must be less than 50 characters'),
  categoryId: z.string().uuid('Invalid category ID'),
  costPrice: z
    .number()
    .min(0, 'Cost price must be positive')
    .max(1000000, 'Cost price must be less than 1,000,000')
    .multipleOf(0.01, 'Cost price must have at most 2 decimal places'),
  sellingPrice: z
    .number()
    .min(0, 'Selling price must be positive')
    .max(1000000, 'Selling price must be less than 1,000,000')
    .multipleOf(0.01, 'Selling price must have at most 2 decimal places'),
  stockQuantity: z
    .number()
    .int('Stock quantity must be a whole number')
    .min(0, 'Stock quantity cannot be negative')
    .max(1000000, 'Stock quantity must be less than 1,000,000'),
  images: z
    .array(z.string().url('Invalid image URL'))
    .max(10, 'Maximum 10 images allowed'),
  tags: z
    .array(z.string().max(50, 'Tag must be less than 50 characters'))
    .max(20, 'Maximum 20 tags allowed')
    .optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
})

// =====================================
// ORDER SCHEMAS
// =====================================

export const orderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  productSizeId: z.string().uuid('Invalid size ID').optional(),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity must be less than 100'),
  price: z
    .number()
    .min(0, 'Price must be positive')
    .multipleOf(0.01, 'Price must have at most 2 decimal places'),
})

export const shippingAddressSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .regex(/^\+?[\d\s()-]+$/, 'Invalid phone number')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be less than 20 characters'),
  address: z
    .string()
    .min(5, 'Address is required')
    .max(200, 'Address must be less than 200 characters'),
  city: z
    .string()
    .min(2, 'City is required')
    .max(100, 'City must be less than 100 characters'),
  state: z
    .string()
    .min(2, 'State is required')
    .max(100, 'State must be less than 100 characters'),
  postalCode: z
    .string()
    .regex(/^[A-Z0-9\s-]+$/i, 'Invalid postal code')
    .min(3, 'Postal code is required')
    .max(20, 'Postal code must be less than 20 characters'),
  country: z
    .string()
    .length(2, 'Country must be a 2-letter code')
    .regex(/^[A-Z]{2}$/, 'Invalid country code'),
})

export const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
  shippingAddress: shippingAddressSchema,
  billingAddress: shippingAddressSchema.optional(),
  paymentMethod: z.enum(['stripe', 'paypal', 'razorpay', 'cod']),
  currency: z.string().length(3, 'Currency must be a 3-letter code'),
  couponCode: z
    .string()
    .regex(/^[A-Z0-9-]+$/, 'Invalid coupon code')
    .max(20, 'Coupon code must be less than 20 characters')
    .optional(),
})

// =====================================
// API REQUEST SCHEMAS
// =====================================

export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int('Page must be a whole number')
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.coerce
    .number()
    .int('Limit must be a whole number')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be at most 100')
    .default(20),
  sort: z
    .enum(['asc', 'desc', 'newest', 'oldest', 'price_low', 'price_high'])
    .optional(),
  search: z
    .string()
    .max(100, 'Search query must be less than 100 characters')
    .optional(),
})

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
})

export const slugParamSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Invalid slug format')
    .min(1, 'Slug is required')
    .max(200, 'Slug must be less than 200 characters'),
})

// =====================================
// CONTACT & FEEDBACK SCHEMAS
// =====================================

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters'),
  phone: z
    .string()
    .regex(/^\+?[\d\s()-]+$/, 'Invalid phone number')
    .optional(),
})

// =====================================
// BARCODE & SKU SCHEMAS
// =====================================

export const barcodeSchema = z.object({
  barcode: z
    .string()
    .regex(/^[0-9]+$/, 'Barcode must contain only numbers')
    .min(8, 'Barcode must be at least 8 digits')
    .max(20, 'Barcode must be at most 20 digits'),
})

// =====================================
// FILE UPLOAD SCHEMAS
// =====================================

export const fileUploadSchema = z.object({
  filename: z
    .string()
    .max(255, 'Filename must be less than 255 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Filename contains invalid characters'),
  mimetype: z.enum([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/avi',
    'video/mov',
  ]),
  size: z
    .number()
    .max(52428800, 'File size must be less than 50MB'), // 50MB max
})

// =====================================
// SANITIZATION HELPERS
// =====================================

export function sanitizeString(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}

export function sanitizeHTML(input: string): string {
  // Use a proper HTML sanitization library in production
  // This is a basic implementation
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a']
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi
  
  return input.replace(tagRegex, (match, tag) => {
    if (allowedTags.includes(tag.toLowerCase())) {
      return match
    }
    return ''
  })
}

// =====================================
// VALIDATION UTILITIES
// =====================================

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error }
    }
    throw error
  }
}

export function getErrorMessage(error: z.ZodError): string {
  return error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
}