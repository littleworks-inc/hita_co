// src/types/exhibition-pos.ts
// =====================================
// 🔧 UNIFIED Exhibition POS Types
// Shared types for consistency across POS components
// =====================================

// Base Exhibition Product interface with all required fields
export interface ExhibitionProduct {
  id: string
  productId: string
  exhibitionId: string
  quantityTaken: number
  quantitySold: number
  
  // Exhibition-specific pricing (can be null)
  exhibitionPrice?: number | null
  originalPrice?: number | null
  discountPercentage?: number | null
  isClearance: boolean
  
  // Sales tracking
  salesNotes?: string | null
  lastSaleDate?: Date | string | null
  priceChangedAt?: Date | string | null
  
  // Related product data with proper typing
  product: {
    id: string
    name: string
    sku: string
    barcode?: string | null
    barcodeType?: string | null
    sellingPriceUSD: number
    discountPercentage: number  // This is required in the product
    images: string[]
    stockQuantity: number      // This is required in the product
    category: { 
      id?: string
      name: string 
    }
    country: { 
      id?: string
      name: string 
    }
    // Add productSizes relation with proper typing
    productSizes?: ProductSize[]
  }
}

// Product Size interface
export interface ProductSize {
  id: string
  productId: string
  size: string
  sku: string
  barcode?: string | null
  stockQuantity: number
  lowStockAlert: number
  isActive: boolean
  sortOrder: number
  createdAt?: Date | string
  updatedAt?: Date | string
}
export interface CartItem {
  exhibitionProductId: string
  productId: string
  productName: string
  productSku: string
  categoryName: string
  originalPrice: number
  exhibitionPrice: number
  finalPrice: number
  quantity: number
  availableStock: number
  priceBreakdown: {
    hasStoreDiscount: boolean
    hasExhibitionPrice: boolean
    hasExhibitionDiscount: boolean
    storeDiscountPercent: number
    exhibitionDiscountPercent: number
  }
}

// Payment methods enum
export type PaymentMethod = 'CASH' | 'ZELLE' | 'CARD' | 'SPLIT_PAYMENT'

// Exhibition details
export interface Exhibition {
  id: string
  title: string
  description?: string
  location: string
  startDate: Date | string
  endDate: Date | string
  participationFee: number
  images: string[]
  isActive: boolean
  createdAt?: Date | string
  updatedAt?: Date | string
}

// Cart totals calculation
export interface CartTotals {
  subtotal: number
  totalDiscount: number
  finalTotal: number
  itemCount: number
}

// Payment details for sale processing
export interface PaymentDetails {
  cashAmount?: number | null
  zelleAmount?: number | null
  cardAmount?: number | null
  bargainApplied: boolean
  bargainReason?: string | null
  salesPersonNotes?: string | null
}

// Sale data structure
export interface SaleData {
  customerName: string
  customerPhone?: string | null
  customerEmail?: string | null
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: PaymentMethod
  paymentDetails: PaymentDetails
  items: SaleItemData[]
}

// Individual sale item
export interface SaleItemData {
  exhibitionProductId: string
  productId: string
  productName: string
  productSku: string
  categoryName: string
  originalPrice: number
  exhibitionPrice: number
  finalPrice: number
  quantity: number
  lineTotal: number
}

// Props for barcode search component
export interface BarcodeSearchProps {
  exhibitionId: string
  products: ExhibitionProduct[]
  onProductFound: (product: ExhibitionProduct) => void
  onError: (error: string) => void
}

// Product lookup API response
export interface ProductLookupResponse {
  success: boolean
  query: string
  type: string
  exhibition: {
    id: string
    title: string
  }
  results: ExhibitionProduct[]
  stats: {
    totalResults: number
    inStockResults: number
    exactMatches: number
    hasExactMatch: boolean
  }
}

// Helper function to calculate available stock
export const calculateAvailableStock = (product: ExhibitionProduct): number => {
  return product.quantityTaken - product.quantitySold
}

// Helper function to calculate final price
export const calculateFinalPrice = (product: ExhibitionProduct): number => {
  const originalPrice = product.originalPrice || product.product.sellingPriceUSD
  const exhibitionPrice = product.exhibitionPrice || originalPrice
  const discountPercentage = product.discountPercentage || 0
  
  return discountPercentage > 0
    ? exhibitionPrice * (1 - discountPercentage / 100)
    : exhibitionPrice
}

// Helper function to check if product has stock
export const hasStock = (product: ExhibitionProduct): boolean => {
  return calculateAvailableStock(product) > 0
}

// Helper function to format price
export const formatPrice = (amount: number): string => {
  return `$${amount.toFixed(2)}`
}