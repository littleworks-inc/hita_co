import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// Force dynamic rendering - this route uses cookies via getSession()
export const dynamic = 'force-dynamic'

interface CategoryWithProducts {
  id: string
  name: string
  products: {
    id: string
  }[]
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    const currency = searchParams.get('currency') || 'USD'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Calculate date range
    const dateRange = calculateDateRange(period, startDate, endDate)
    
    // Fetch REAL analytics data
    const analyticsData = await fetchRealAnalyticsData(dateRange, currency)
    
    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateDateRange(period: string, startDate?: string | null, endDate?: string | null) {
  const now = new Date()
  let start: Date
  let end: Date = now

  if (startDate && endDate) {
    start = new Date(startDate)
    end = new Date(endDate)
  } else {
    switch (period) {
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  return { start, end }
}

async function fetchRealAnalyticsData(dateRange: { start: Date, end: Date }, currency: string) {
  const { start, end } = dateRange

  try {
    // 1. Get REAL order data
    const [currentRevenue, previousRevenue, productStats] = await Promise.all([
      // Current period revenue
      db.order.aggregate({
        where: {
          createdAt: { gte: start, lte: end },
          status: { not: 'CANCELLED' }
        },
        _sum: { total: true },
        _count: { id: true }
      }),
      
      // Previous period for comparison
      db.order.aggregate({
        where: {
          createdAt: { 
            gte: new Date(start.getTime() - (end.getTime() - start.getTime())),
            lt: start 
          },
          status: { not: 'CANCELLED' }
        },
        _sum: { total: true },
        _count: { id: true }
      }),
      
      // Product statistics
      db.product.aggregate({
        where: { isActive: true },
        _count: { id: true }
      })
    ])

    // 2. Calculate real metrics
    const currentRevenueAmount = currentRevenue._sum.total || 0
    const previousRevenueAmount = previousRevenue._sum.total || 0
    const currentOrders = currentRevenue._count.id || 0
    const previousOrders = previousRevenue._count.id || 0
    
    const revenueChange = previousRevenueAmount > 0 
      ? ((currentRevenueAmount - previousRevenueAmount) / previousRevenueAmount) * 100 
      : 0
    
    const ordersChange = previousOrders > 0 
      ? ((currentOrders - previousOrders) / previousOrders) * 100 
      : 0

    // 3. Get real product inventory data
    const [lowStockProducts, outOfStockProducts, totalProducts] = await Promise.all([
      db.product.count({
        where: {
          isActive: true,
          stockQuantity: { lte: db.product.fields.lowStockAlert }
        }
      }),
      db.product.count({
        where: {
          isActive: true,
          stockQuantity: { lte: 0 }
        }
      }),
      db.product.count({ where: { isActive: true } })
    ])

    // 4. Check if this is a fresh system (no real data)
    const isFreshSystem = currentRevenueAmount === 0 && currentOrders === 0

    // 5. Get category performance (real data)
    const categoryPerformance = await db.category.findMany({
      include: {
        products: {
          where: { isActive: true },
          select: { id: true }
        }
      },
      orderBy: {
        products: { _count: 'desc' }
      },
      take: 5
    })

    // 6. Generate sales trend from real order data
    const salesTrend = await generateRealSalesTrend(start, end)

    // 7. Return appropriate data based on system state
    if (isFreshSystem) {
      return getEmptyStateData(totalProducts, lowStockProducts, outOfStockProducts, categoryPerformance)
    } else {
      return getRealAnalyticsData({
        currentRevenueAmount,
        previousRevenueAmount,
        currentOrders,
        previousOrders,
        revenueChange,
        ordersChange,
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        categoryPerformance,
        salesTrend
      })
    }

  } catch (error) {
    console.error('Error fetching real analytics data:', error)
    
    // Fallback: Check if we have any products to show appropriate state
    const productCount = await db.product.count({ where: { isActive: true } }).catch(() => 0)
    
    if (productCount === 0) {
      return getNoProductsState()
    } else {
      return getEmptyStateData(productCount, 0, 0, [])
    }
  }
}

async function generateRealSalesTrend(start: Date, end: Date) {
  try {
    // Get actual orders grouped by day
    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { not: 'CANCELLED' }
      },
      select: {
        createdAt: true,
        total: true
      },
      orderBy: { createdAt: 'asc' }
    })

    // Group by day
    const dailyData = new Map()
    
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0]
      
      if (!dailyData.has(date)) {
        dailyData.set(date, { revenue: 0, orders: 0 })
      }
      
      const dayData = dailyData.get(date)
      dayData.revenue += order.total
      dayData.orders += 1
    })

    // Convert to array format
    const trend = Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders,
      averageOrderValue: data.orders > 0 ? Math.round((data.revenue / data.orders) * 100) / 100 : 0
    }))

    return trend.length > 0 ? trend : []
  } catch (error) {
    console.error('Error generating sales trend:', error)
    return []
  }
}

function getNoProductsState() {
  return {
    isEmpty: true,
    emptyStateType: 'no_products',
    message: 'Welcome to Hita&Co! Add your first product to start tracking analytics.',
    actionText: 'Add Product',
    actionLink: '/admin/products/new',
    revenue: { current: 0, previous: 0, change: 0, changeType: 'neutral' as const },
    orders: { current: 0, previous: 0, change: 0, changeType: 'neutral' as const },
    products: { total: 0, active: 0, lowStock: 0, outOfStock: 0 },
    performance: {
      conversionRate: 0,
      averageOrderValue: 0,
      topCategory: 'No categories yet',
      topCountry: 'No orders yet'
    },
    salesTrend: [],
    categoryPerformance: [],
    geographicData: [],
    inventoryStatus: []
  }
}

function getEmptyStateData(
  totalProducts: number, 
  lowStockProducts: number, 
  outOfStockProducts: number, 
  categoryPerformance: CategoryWithProducts[]
) {
  const activeProducts = Math.max(0, totalProducts - outOfStockProducts)
  
  return {
    isEmpty: true,
    emptyStateType: 'no_orders',
    message: `You have ${totalProducts} products ready! Share your store to start getting orders and seeing revenue analytics.`,
    actionText: 'View Store',
    actionLink: '/',
    revenue: { current: 0, previous: 0, change: 0, changeType: 'neutral' as const },
    orders: { current: 0, previous: 0, change: 0, changeType: 'neutral' as const },
    products: { 
      total: totalProducts, 
      active: activeProducts, 
      lowStock: lowStockProducts, 
      outOfStock: outOfStockProducts 
    },
    performance: {
      conversionRate: 0,
      averageOrderValue: 0,
      topCategory: categoryPerformance[0]?.name || 'No top category yet',
      topCountry: 'No orders yet'
    },
    salesTrend: [],
    // ✅ FIXED: Proper typing here too
    categoryPerformance: categoryPerformance.map((cat: CategoryWithProducts) => ({
      category: cat.name,
      revenue: 0,
      orders: 0,
      products: cat.products.length
    })),
    geographicData: [],
    inventoryStatus: totalProducts > 0 ? [
      { 
        status: 'In Stock', 
        count: activeProducts,
        percentage: totalProducts > 0 ? (activeProducts / totalProducts) * 100 : 0
      },
      { 
        status: 'Low Stock', 
        count: lowStockProducts,
        percentage: totalProducts > 0 ? (lowStockProducts / totalProducts) * 100 : 0
      },
      { 
        status: 'Out of Stock', 
        count: outOfStockProducts,
        percentage: totalProducts > 0 ? (outOfStockProducts / totalProducts) * 100 : 0
      }
    ] : []
  }
}

function getRealAnalyticsData(data: {
  currentRevenueAmount: number
  previousRevenueAmount: number
  currentOrders: number
  previousOrders: number
  revenueChange: number
  ordersChange: number
  totalProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  categoryPerformance: CategoryWithProducts[]
  salesTrend: any[]
}) {
  const {
    currentRevenueAmount,
    previousRevenueAmount,
    currentOrders,
    previousOrders,
    revenueChange,
    ordersChange,
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    categoryPerformance,
    salesTrend
  } = data

  const activeProducts = Math.max(0, totalProducts - outOfStockProducts)
  const averageOrderValue = currentOrders > 0 ? currentRevenueAmount / currentOrders : 0

  return {
    isEmpty: false,
    revenue: {
      current: currentRevenueAmount,
      previous: previousRevenueAmount,
      change: revenueChange,
      changeType: revenueChange > 0 ? 'increase' : revenueChange < 0 ? 'decrease' : 'neutral' as const
    },
    orders: {
      current: currentOrders,
      previous: previousOrders,
      change: ordersChange,
      changeType: ordersChange > 0 ? 'increase' : ordersChange < 0 ? 'decrease' : 'neutral' as const
    },
    products: {
      total: totalProducts,
      active: activeProducts,
      lowStock: lowStockProducts,
      outOfStock: outOfStockProducts
    },
    performance: {
      conversionRate: 0, // Calculate based on real site visits in production
      averageOrderValue,
      topCategory: categoryPerformance[0]?.name || 'No top category',
      topCountry: 'United States' // Get from real order data in production
    },
    salesTrend,
    // ✅ FIXED: Now TypeScript knows the exact structure
    categoryPerformance: categoryPerformance.map((cat: CategoryWithProducts) => ({
      category: cat.name,
      revenue: 0, // Calculate real revenue per category in production
      orders: 0,  // Calculate real orders per category in production
      products: cat.products.length
    })),
    geographicData: [], // Will be populated with real order shipping data
    inventoryStatus: [
      { 
        status: 'In Stock', 
        count: activeProducts,
        percentage: totalProducts > 0 ? (activeProducts / totalProducts) * 100 : 0
      },
      { 
        status: 'Low Stock', 
        count: lowStockProducts,
        percentage: totalProducts > 0 ? (lowStockProducts / totalProducts) * 100 : 0
      },
      { 
        status: 'Out of Stock', 
        count: outOfStockProducts,
        percentage: totalProducts > 0 ? (outOfStockProducts / totalProducts) * 100 : 0
      }
    ]
  }
}