import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

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
    
    // Fetch REAL chart data
    const chartData = await fetchRealChartData(dateRange, currency)
    
    return NextResponse.json(chartData)
  } catch (error) {
    console.error('Analytics Charts API error:', error)
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

async function fetchRealChartData(dateRange: { start: Date, end: Date }, currency: string) {
  const { start, end } = dateRange

  try {
    // 1. Check if we have any orders (determine if fresh system)
    const orderCount = await db.order.count({
      where: {
        status: { not: 'CANCELLED' }
      }
    })

    const productCount = await db.product.count({
      where: { isActive: true }
    })

    // 2. If no orders but have products, show empty state with product data
    if (orderCount === 0) {
      return getEmptyChartData(productCount)
    }

    // 3. Generate real sales trend from actual orders
    const salesTrend = await generateRealSalesTrend(start, end)
    
    // 4. Get real category performance
    const categoryPerformance = await getRealCategoryPerformance()
    
    // 5. Get real geographic data from orders
    const geographicData = await getRealGeographicData(start, end)
    
    // 6. Get real inventory status
    const inventoryStatus = await getRealInventoryStatus()

    return {
      isEmpty: false,
      salesTrend,
      categoryPerformance,
      geographicData,
      inventoryStatus
    }

  } catch (error) {
    console.error('Error fetching real chart data:', error)
    
    // Fallback to empty state
    const productCount = await db.product.count({ where: { isActive: true } }).catch(() => 0)
    return getEmptyChartData(productCount)
  }
}

function getEmptyChartData(productCount: number) {
  if (productCount === 0) {
    return {
      isEmpty: true,
      emptyStateType: 'no_products',
      message: 'Add products to start seeing analytics charts',
      salesTrend: [],
      categoryPerformance: [],
      geographicData: [],
      inventoryStatus: []
    }
  }

  // Have products but no orders
  return {
    isEmpty: true,
    emptyStateType: 'no_orders',
    message: 'Charts will appear here once you start getting orders',
    salesTrend: [],
    categoryPerformance: [],
    geographicData: [],
    inventoryStatus: []
  }
}

async function generateRealSalesTrend(start: Date, end: Date) {
  try {
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
    
    // Initialize all days in range with zero values
    const current = new Date(start)
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      dailyData.set(dateStr, { revenue: 0, orders: 0 })
      current.setDate(current.getDate() + 1)
    }

    // Add real order data
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0]
      if (dailyData.has(date)) {
        const dayData = dailyData.get(date)
        dayData.revenue += order.total
        dayData.orders += 1
      }
    })

    // Convert to array format
    const trend = Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders,
      averageOrderValue: data.orders > 0 ? Math.round((data.revenue / data.orders) * 100) / 100 : 0
    }))

    return trend

  } catch (error) {
    console.error('Error generating real sales trend:', error)
    return []
  }
}

async function getRealCategoryPerformance() {
  try {
    // Get categories with order data
    const categories = await db.category.findMany({
      include: {
        products: {
          where: { isActive: true },
          include: {
            orderItems: {
              include: {
                order: {
                  where: {
                    status: { not: 'CANCELLED' }
                  }
                }
              }
            }
          }
        }
      }
    })

    // Calculate revenue and orders per category
    const categoryPerformance = categories.map(category => {
      let revenue = 0
      let orders = 0
      const orderIds = new Set()

      category.products.forEach(product => {
        product.orderItems.forEach(item => {
          if (item.order) {
            revenue += item.totalPrice
            orderIds.add(item.order.id)
          }
        })
      })

      orders = orderIds.size

      return {
        category: category.name,
        revenue: Math.round(revenue * 100) / 100,
        orders,
        products: category.products.length
      }
    })

    // Sort by revenue and return top 5
    return categoryPerformance
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

  } catch (error) {
    console.error('Error getting category performance:', error)
    return []
  }
}

async function getRealGeographicData(start: Date, end: Date) {
  try {
    // Get orders with shipping addresses
    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { not: 'CANCELLED' }
      },
      select: {
        total: true,
        shippingAddress: true,
        customerEmail: true
      }
    })

    // Group by country from shipping address
    const countryData = new Map()

    orders.forEach(order => {
      const shippingAddress = order.shippingAddress as any
      const country = shippingAddress?.country || 'Unknown'
      
      if (!countryData.has(country)) {
        countryData.set(country, {
          revenue: 0,
          orders: 0,
          customers: new Set()
        })
      }
      
      const data = countryData.get(country)
      data.revenue += order.total
      data.orders += 1
      data.customers.add(order.customerEmail)
    })

    // Convert to array format
    const geographicData = Array.from(countryData.entries()).map(([country, data]) => ({
      country,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders,
      customers: data.customers.size
    }))

    // Sort by revenue and return top 5
    return geographicData
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

  } catch (error) {
    console.error('Error getting geographic data:', error)
    return []
  }
}

async function getRealInventoryStatus() {
  try {
    const [totalProducts, lowStockCount, outOfStockCount] = await Promise.all([
      db.product.count({ where: { isActive: true } }),
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
      })
    ])

    const inStockCount = Math.max(0, totalProducts - lowStockCount - outOfStockCount)

    if (totalProducts === 0) {
      return []
    }

    return [
      { 
        status: 'In Stock', 
        count: inStockCount,
        percentage: Math.round((inStockCount / totalProducts) * 100 * 100) / 100
      },
      { 
        status: 'Low Stock', 
        count: lowStockCount,
        percentage: Math.round((lowStockCount / totalProducts) * 100 * 100) / 100
      },
      { 
        status: 'Out of Stock', 
        count: outOfStockCount,
        percentage: Math.round((outOfStockCount / totalProducts) * 100 * 100) / 100
      }
    ]

  } catch (error) {
    console.error('Error getting inventory status:', error)
    return []
  }
}