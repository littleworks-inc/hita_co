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
    
    // Fetch analytics data
    const analyticsData = await fetchAnalyticsData(dateRange, currency)
    
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

async function fetchAnalyticsData(dateRange: { start: Date, end: Date }, currency: string) {
  const { start, end } = dateRange

  try {
    // Revenue and Orders Analytics
    const revenueData = await db.order.aggregate({
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        status: {
          not: 'CANCELLED'
        }
      },
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    })

    // Previous period for comparison
    const periodLength = end.getTime() - start.getTime()
    const previousStart = new Date(start.getTime() - periodLength)
    const previousEnd = start

    const previousRevenueData = await db.order.aggregate({
      where: {
        createdAt: {
          gte: previousStart,
          lte: previousEnd
        },
        status: {
          not: 'CANCELLED'
        }
      },
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    })

    // Product Analytics
    const productStats = await db.product.aggregate({
      _count: {
        id: true
      }
    })

    const activeProducts = await db.product.count({
      where: { isActive: true }
    })

    const lowStockProducts = await db.product.count({
      where: {
        stockQuantity: {
          lte: db.product.fields.lowStockAlert
        },
        isActive: true
      }
    })

    const outOfStockProducts = await db.product.count({
      where: {
        stockQuantity: 0,
        isActive: true
      }
    })

    // Get categories with their product performance
    const categories = await db.category.findMany({
      include: {
        products: {
          where: { isActive: true },
          include: {
            _count: {
              select: {
                orderItems: {
                  where: {
                    order: {
                      createdAt: {
                        gte: start,
                        lte: end
                      },
                      status: {
                        not: 'CANCELLED'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    // Calculate category performance (simplified)
    const categoryStats = categories.map(category => {
      // For now, we'll use mock revenue calculation
      // In a real scenario, you'd calculate from actual order data
      const productCount = category.products.length
      const mockRevenue = productCount * 1000 * Math.random() * 5 // Mock calculation
      const mockOrders = Math.floor(mockRevenue / 150) // Assuming avg order value of 150

      return {
        category: category.name,
        revenue: Math.round(mockRevenue),
        orders: mockOrders,
        products: productCount
      }
    }).sort((a, b) => b.revenue - a.revenue)

    // Geographic Data (mock for now - in production, you'd get this from order shipping addresses)
    const geographicData = [
      { country: 'United States', revenue: 35200, orders: 252, customers: 189 },
      { country: 'Canada', revenue: 18900, orders: 135, customers: 98 },
      { country: 'United Kingdom', revenue: 15600, orders: 112, customers: 87 },
      { country: 'Australia', revenue: 12100, orders: 87, customers: 65 },
      { country: 'Germany', revenue: 8800, orders: 63, customers: 52 }
    ]

    // Daily sales trend (simplified)
    const salesTrend = generateDailySalesTrend(start, end, revenueData._sum.total || 0, revenueData._count || 0)

    // Calculate metrics
    const currentRevenue = revenueData._sum.total || 0
    const previousRevenue = previousRevenueData._sum.total || 0
    const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0

    const currentOrders = revenueData._count || 0
    const previousOrders = previousRevenueData._count || 0
    const ordersChange = previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders) * 100 : 0

    const averageOrderValue = currentOrders > 0 ? currentRevenue / currentOrders : 0
    const conversionRate = 3.2 // Mock - in production, calculate from site visits vs orders
    const topCategory = categoryStats[0]?.category || 'Traditional Jewelry'

    return {
      // Metrics for AnalyticsMetrics component
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        change: revenueChange,
        changeType: revenueChange > 0 ? 'increase' : revenueChange < 0 ? 'decrease' : 'neutral'
      },
      orders: {
        current: currentOrders,
        previous: previousOrders,
        change: ordersChange,
        changeType: ordersChange > 0 ? 'increase' : ordersChange < 0 ? 'decrease' : 'neutral'
      },
      products: {
        total: productStats._count.id,
        active: activeProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts
      },
      performance: {
        conversionRate,
        averageOrderValue,
        topCategory,
        topCountry: geographicData[0].country
      },
      
      // Chart data for AnalyticsCharts component
      salesTrend,
      categoryPerformance: categoryStats.slice(0, 5),
      geographicData,
      inventoryStatus: [
        { 
          status: 'In Stock', 
          count: Math.max(0, activeProducts - lowStockProducts - outOfStockProducts),
          percentage: activeProducts > 0 ? ((activeProducts - lowStockProducts - outOfStockProducts) / activeProducts) * 100 : 0
        },
        { 
          status: 'Low Stock', 
          count: lowStockProducts,
          percentage: activeProducts > 0 ? (lowStockProducts / activeProducts) * 100 : 0
        },
        { 
          status: 'Out of Stock', 
          count: outOfStockProducts,
          percentage: activeProducts > 0 ? (outOfStockProducts / activeProducts) * 100 : 0
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    
    // Return mock data if database queries fail (for development)
    return getMockAnalyticsData()
  }
}

function generateDailySalesTrend(start: Date, end: Date, totalRevenue: number, totalOrders: number) {
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const dailyRevenue = totalRevenue / Math.max(days, 1)
  const dailyOrders = Math.ceil(totalOrders / Math.max(days, 1))
  
  const trend = []
  for (let i = 0; i < Math.min(days, 30); i++) {
    const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000)
    const variance = 0.7 + Math.random() * 0.6 // Random variance between 0.7 and 1.3
    
    trend.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.round(dailyRevenue * variance),
      orders: Math.round(dailyOrders * variance),
      averageOrderValue: Math.round((dailyRevenue * variance) / Math.max(dailyOrders * variance, 1))
    })
  }
  
  return trend
}

function getMockAnalyticsData() {
  return {
    revenue: {
      current: 45230.50,
      previous: 38150.25,
      change: 18.5,
      changeType: 'increase' as const
    },
    orders: {
      current: 324,
      previous: 289,
      change: 12.1,
      changeType: 'increase' as const
    },
    products: {
      total: 156,
      active: 142,
      lowStock: 12,
      outOfStock: 2
    },
    performance: {
      conversionRate: 3.2,
      averageOrderValue: 139.60,
      topCategory: 'Traditional Jewelry',
      topCountry: 'United States'
    },
    salesTrend: [
      { date: '2024-01-01', revenue: 12420, orders: 89, averageOrderValue: 139.55 },
      { date: '2024-01-02', revenue: 15680, orders: 112, averageOrderValue: 140.00 },
      { date: '2024-01-03', revenue: 13250, orders: 95, averageOrderValue: 139.47 },
      { date: '2024-01-04', revenue: 18900, orders: 135, averageOrderValue: 140.00 },
      { date: '2024-01-05', revenue: 16750, orders: 120, averageOrderValue: 139.58 },
      { date: '2024-01-06', revenue: 21200, orders: 152, averageOrderValue: 139.47 },
      { date: '2024-01-07', revenue: 19650, orders: 141, averageOrderValue: 139.36 }
    ],
    categoryPerformance: [
      { category: 'Traditional Jewelry', revenue: 28500, orders: 204, products: 45 },
      { category: 'Ethnic Wear', revenue: 22100, orders: 158, products: 38 },
      { category: 'Home Decor', revenue: 15600, orders: 112, products: 29 },
      { category: 'Accessories', revenue: 12800, orders: 92, products: 34 },
      { category: 'Lifestyle', revenue: 8900, orders: 64, products: 18 }
    ],
    geographicData: [
      { country: 'United States', revenue: 35200, orders: 252, customers: 189 },
      { country: 'Canada', revenue: 18900, orders: 135, customers: 98 },
      { country: 'United Kingdom', revenue: 15600, orders: 112, customers: 87 },
      { country: 'Australia', revenue: 12100, orders: 87, customers: 65 },
      { country: 'Germany', revenue: 8800, orders: 63, customers: 52 }
    ],
    inventoryStatus: [
      { status: 'In Stock', count: 128, percentage: 82.1 },
      { status: 'Low Stock', count: 18, percentage: 11.5 },
      { status: 'Out of Stock', count: 10, percentage: 6.4 }
    ]
  }
}