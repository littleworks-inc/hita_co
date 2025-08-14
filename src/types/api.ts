// File: src/types/api.ts
// =====================================
// PERMANENT TYPESCRIPT SOLUTION
// Complete API type definitions for the entire application
// =====================================

import { Prisma, OrderStatus, OrderSource, ProductStatus } from '@prisma/client'

// =====================================
// CORE PRISMA EXTENSIONS
// =====================================

// Extend Prisma types with proper query inputs
export type SafeOrderWhereInput = Prisma.OrderWhereInput & {
  status?: OrderStatus | Prisma.EnumOrderStatusFilter<"Order">
  source?: OrderSource | Prisma.EnumOrderSourceFilter<"Order">
}

export type SafeProductWhereInput = Prisma.ProductWhereInput & {
  status?: ProductStatus | Prisma.EnumProductStatusFilter<"Product">
}

// =====================================
// PRODUCT SIZE MANAGEMENT
// =====================================

export interface ProductSizeInput {
  id?: string
  size: string
  sku: string
  stockQuantity: number
  lowStockAlert: number
  isActive: boolean
  sortOrder: number
}

export interface ProductSizeOutput {
  id: string
  productId: string
  size: string
  sku: string
  stockQuantity: number
  lowStockAlert: number
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

// =====================================
// PRODUCT API TYPES
// =====================================

export interface ProductCreateRequest {
  sku: string
  name: string
  description?: string
  shortDescription?: string
  categoryId: string
  countryId: string
  supplierId: string
  barcode?: string
  barcodeType?: string
  originalPrice: number | string
  originalCurrency: string
  quantity: number | string
  gstPercentage: number | string
  shippingCost: number | string
  conversionCharges: number | string
  additionalExpenses: number | string
  costPriceUSD: number | string
  piecePriceUSD: number | string
  profitMargin: number | string
  discountPercentage: number | string
  showDiscountToCustomers?: boolean
  sellingPriceUSD: number | string
  stockQuantity?: number | string
  lowStockAlert: number | string
  tags: string[]
  images: string[]
  seoTitle?: string
  seoDescription?: string
  purchaseDate?: string
  invoiceNumber?: string
  isActive?: boolean
  isFeatured?: boolean
  status: ProductStatus
  publishedAt?: string
  requiresSizes: boolean
  productSizes?: ProductSizeInput[]
}

export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {
  id?: string
}

// =====================================
// CATEGORY PERFORMANCE TYPES
// =====================================

export interface CategoryWithProducts {
  id: string
  name: string
  products: {
    id: string
  }[]
}

export interface CategoryPerformanceInput {
  id: string
  name: string
  products: { id: string }[]
}

export interface CategoryPerformanceOutput {
  category: string
  revenue: number
  orders: number
  products: number
}

// =====================================
// ANALYTICS TYPES
// =====================================

export interface AnalyticsMetricsRequest {
  period?: string
  currency?: string
  startDate?: string
  endDate?: string
}

export interface AnalyticsMetricsResponse {
  isEmpty: boolean
  emptyStateType?: 'no_products' | 'no_orders'
  message?: string
  actionText?: string
  actionLink?: string
  revenue: {
    current: number
    previous: number
    change: number
    changeType: 'increase' | 'decrease' | 'neutral'
  }
  orders: {
    current: number
    previous: number
    change: number
    changeType: 'increase' | 'decrease' | 'neutral'
  }
  products: {
    total: number
    active: number
    lowStock: number
    outOfStock: number
  }
  performance: {
    conversionRate: number
    averageOrderValue: number
    topCategory: string
    topCountry: string
  }
  salesTrend: Array<{
    date: string
    revenue: number
    orders: number
    averageOrderValue: number
  }>
  categoryPerformance: CategoryPerformanceOutput[]
  geographicData: Array<{
    country: string
    revenue: number
    orders: number
    customers: number
  }>
  inventoryStatus: Array<{
    status: string
    count: number
    percentage: number
  }>
}

// =====================================
// EXHIBITION TYPES
// =====================================

export interface ExhibitionProductsSummary {
  totalProducts: number
  totalQuantityTaken: number
  totalQuantitySold: number
  totalValue: number
  totalRevenue: number
  clearanceProducts: number
  customPricedProducts: number
  sellThroughRate: number
}

export interface ExhibitionProductsResponse {
  exhibitionId: string
  exhibition: {
    id: string
    title: string
    location: string
    startDate: Date
    endDate: Date
  }
  products: any[]
  summary: ExhibitionProductsSummary
}

// =====================================
// ORDER TYPES
// =====================================

export interface OrdersQueryParams {
  search?: string
  status?: string | OrderStatus
  source?: string | OrderSource
  page?: string | number
  limit?: string | number
}

export interface OrdersWhereClause {
  OR?: Array<{
    orderNumber?: { contains: string; mode: Prisma.QueryMode }
    customerName?: { contains: string; mode: Prisma.QueryMode }
    customerEmail?: { contains: string; mode: Prisma.QueryMode }
    customerPhone?: { contains: string; mode: Prisma.QueryMode }
  }>
  status?: OrderStatus
  source?: OrderSource
}

export interface OrderUpdateRequest {
  orderId: string
  status?: OrderStatus
  source?: OrderSource
}

export interface OrderStatsResponse {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  statusBreakdown: Array<{
    status: OrderStatus
    count: number
    revenue: number
  }>
  sourceBreakdown: Array<{
    source: OrderSource
    count: number
    revenue: number
  }>
}

// =====================================
// CUSTOMER TYPES
// =====================================

export interface CustomersQueryParams {
  search?: string
  page?: string | number
  limit?: string | number
  sortBy?: 'name' | 'totalSpent' | 'totalOrders' | 'lastOrderDate'
  sortOrder?: 'asc' | 'desc'
}

export interface CustomersWhereClause {
  OR?: Array<{
    customerName?: { contains: string; mode: Prisma.QueryMode }
    customerEmail?: { contains: string; mode: Prisma.QueryMode }
    customerPhone?: { contains: string; mode: Prisma.QueryMode }
  }>
}

// =====================================
// UTILITY TYPES
// =====================================

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  errors?: string[]
}

export interface PaginationParams {
  page: number
  limit: number
  total: number
  pages: number
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination: PaginationParams
}

// =====================================
// VALIDATION HELPERS
// =====================================

export function isValidOrderStatus(status: string): status is OrderStatus {
  return Object.values(OrderStatus).includes(status as OrderStatus)
}

export function isValidOrderSource(source: string): source is OrderSource {
  return Object.values(OrderSource).includes(source as OrderSource)
}

export function isValidProductStatus(status: string): status is ProductStatus {
  return Object.values(ProductStatus).includes(status as ProductStatus)
}

// =====================================
// TYPE GUARDS
// =====================================

export function isCategoryWithProducts(obj: any): obj is CategoryWithProducts {
  return obj && 
         typeof obj.id === 'string' && 
         typeof obj.name === 'string' && 
         Array.isArray(obj.products)
}

export function isProductSizeInput(obj: any): obj is ProductSizeInput {
  return obj && 
         typeof obj.size === 'string' && 
         typeof obj.sku === 'string' && 
         typeof obj.stockQuantity === 'number'
}

// =====================================
// SEARCH MODE HELPER
// =====================================

export const SEARCH_MODE = Prisma.QueryMode.insensitive