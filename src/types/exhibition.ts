// src/types/exhibition.ts
// =====================================
// 🔥 FIXED: Exhibition TypeScript Interfaces
// Updated to use ExhibitionSale instead of Order model
// =====================================

export interface ExhibitionSale {
  id: string
  exhibitionId: string
  saleNumber: string
  
  // Customer Info
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  
  // Sale Details
  subtotal: number
  tax: number
  discount: number
  total: number
  
  // Payment Info
  paymentMethod: ExhibitionPaymentMethod
  paymentDetails?: any
  cashReceived?: number
  changeGiven?: number
  
  // Status & Tracking
  isCompleted: boolean // 🔥 FIXED: Use isCompleted instead of status
  completedAt?: Date
  receiptPrinted: boolean
  receiptEmailSent: boolean
  staffNotes?: string
  
  createdAt: Date
  updatedAt: Date
  
  // Relations
  items: ExhibitionSaleItem[]
}

export interface ExhibitionSaleItem {
  id: string
  saleId: string
  exhibitionProductId: string
  productId: string
  productSizeId?: string
  sizeLabel?: string
  quantity: number
  pricePerItem: number
  totalPrice: number
  discount: number
  createdAt: Date
  updatedAt: Date
}

export interface ExhibitionProduct {
  id: string
  exhibitionId: string
  productId: string
  quantityTaken: number
  quantitySold: number
  
  // Exhibition-specific pricing
  exhibitionPrice?: number
  originalPrice?: number
  discountPercentage?: number
  isClearance: boolean
  priceHistory?: any
  
  // Sales tracking
  salesNotes?: string
  lastSaleDate?: Date
  priceChangedAt?: Date
  
  createdAt: Date
  updatedAt: Date
  
  // Relations
  product: {
    id: string
    name: string
    sellingPriceUSD: number
    category?: {
      name: string
    }
    country?: {
      name: string
    }
  }
  saleItems: ExhibitionSaleItem[]
}

export interface Exhibition {
  id: string
  title: string
  description?: string
  location: string
  startDate: Date
  endDate: Date
  participationFee: number
  images: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  
  // Relations - 🔥 FIXED: Use both sales and orders for different purposes
  products: ExhibitionProduct[]
  sales: ExhibitionSale[]     // 🔥 FIXED: POS transactions for revenue calculation
  orders?: Order[]            // Keep for online orders that reference exhibitions
  
  // Counts
  _count?: {
    products: number
    sales: number             // 🔥 FIXED: Count sales instead of orders
  }
}

// Keep existing Order interface for online orders
export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  total: number
  status: OrderStatus
  exhibitionId?: string
  createdAt: Date
  updatedAt: Date
}

export interface ExhibitionStats {
  status: 'upcoming' | 'ongoing' | 'completed'
  revenue: number              // 🔥 FIXED: From sales.total sum
  netProfit: number           // 🔥 FIXED: Revenue - Participation Fee
  totalProductsTaken: number
  totalProductsSold: number
  sellThroughRate: number
  completedSales: number      // 🔥 FIXED: Count of completed sales
}

export interface ExhibitionAnalytics {
  totalRevenue: number        // 🔥 FIXED: Sum of completed sales
  totalSales: number          // 🔥 FIXED: Count of completed sales
  averageOrderValue: number   // 🔥 FIXED: Based on sales
  topSellingProducts: Array<{
    productId: string
    productName: string
    quantitySold: number
    revenue: number
  }>
  performanceMetrics: {
    sellThroughRate: number
    netProfit: number
    roi: number // (Revenue - ParticipationFee) / ParticipationFee * 100
  }
}

// Enums
export enum ExhibitionPaymentMethod {
  CASH = 'CASH',
  ZELLE = 'ZELLE',
  CARD = 'CARD',
  VENMO = 'VENMO',
  PAYPAL = 'PAYPAL',
  SPLIT_PAYMENT = 'SPLIT_PAYMENT'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

// Helper functions for calculations
export function calculateExhibitionStats(exhibition: Exhibition): ExhibitionStats {
  const now = new Date()
  const startDate = new Date(exhibition.startDate)
  const endDate = new Date(exhibition.endDate)

  // Determine status
  let status: 'upcoming' | 'ongoing' | 'completed' = 'completed'
  if (startDate > now) status = 'upcoming'
  else if (endDate >= now) status = 'ongoing'

  // 🔥 FIXED: Calculate revenue from sales instead of orders
  const revenue = exhibition.sales
    .filter(sale => sale.isCompleted)
    .reduce((sum, sale) => sum + sale.total, 0)

  // Product statistics
  const totalProductsTaken = exhibition.products.reduce((sum, p) => sum + p.quantityTaken, 0)
  const totalProductsSold = exhibition.products.reduce((sum, p) => sum + p.quantitySold, 0)

  // 🔥 FIXED: Proper ROI calculation
  const netProfit = revenue - exhibition.participationFee
  const sellThroughRate = totalProductsTaken > 0 ? 
    Math.round((totalProductsSold / totalProductsTaken) * 100) : 0

  return {
    status,
    revenue,
    netProfit,
    totalProductsTaken,
    totalProductsSold,
    sellThroughRate,
    completedSales: exhibition.sales.filter(sale => sale.isCompleted).length
  }
}

export function calculateROI(revenue: number, participationFee: number): number {
  if (participationFee === 0) return revenue > 0 ? 100 : 0
  return Math.round(((revenue - participationFee) / participationFee) * 100)
}