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
    
    // Fetch chart data
    const chartData = await fetchChartData(dateRange, currency)
    
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

async function fetchChartData(dateRange: { start: Date, end: Date }, currency: string) {
  const { start, end } = dateRange

  try {
    // Generate mock data for charts
    // In production, this would fetch real data from your database
    const salesTrend = generateSalesTrendData(start, end)
    const categoryPerformance = await getCategoryPerformance()
    const geographicData = getGeographicData()
    const inventoryStatus = await getInventoryStatus()

    return {
      salesTrend,
      categoryPerformance,
      geographicData,
      inventoryStatus
    }
  } catch (error) {
    console.error('Error fetching chart data:', error)
    
    // Return mock data as fallback
    return {
      salesTrend: [
        { date: '2024-01-01', revenue: 4520, orders: 32, averageOrderValue: 141.25 },
        { date: '2024-01-02', revenue: 3890, orders: 28, averageOrderValue: 138.93 },
        { date: '2024-01-03', revenue: 5670, orders: 41, averageOrderValue: 138.29 },
        { date: '2024-01-04', revenue: 4320, orders: 31, averageOrderValue: 139.35 },
        { date: '2024-01-05', revenue: 6210, orders: 45, averageOrderValue: 138.00 },
        { date: '2024-01-06', revenue: 5480, orders: 39, averageOrderValue: 140.51 },
        { date: '2024-01-07', revenue: 4890, orders: 35, averageOrderValue: 139.71 }
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
}

function generateSalesTrendData(start: Date, end: Date) {
  const data = []
  const current = new Date(start)
  
  while (current <= end) {
    const revenue = Math.floor(Math.random() * 3000) + 2000 // 2000-5000
    const orders = Math.floor(Math.random() * 30) + 20     // 20-50
    const averageOrderValue = revenue / orders

    data.push({
      date: current.toISOString().split('T')[0],
      revenue,
      orders,
      averageOrderValue: Number(averageOrderValue.toFixed(2))
    })

    current.setDate(current.getDate() + 1)
  }
  
  return data
}

async function getCategoryPerformance() {
  try {
    // Try to get real category data
    const categories = await db.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    // For now, return mock data
    // In production, you would calculate actual revenue per category
    return [
      { category: 'Traditional Jewelry', revenue: 28500, orders: 204, products: 45 },
      { category: 'Ethnic Wear', revenue: 22100, orders: 158, products: 38 },
      { category: 'Home Decor', revenue: 15600, orders: 112, products: 29 },
      { category: 'Accessories', revenue: 12800, orders: 92, products: 34 },
      { category: 'Lifestyle', revenue: 8900, orders: 64, products: 18 }
    ]
  } catch (error) {
    // Return mock data on error
    return [
      { category: 'Traditional Jewelry', revenue: 28500, orders: 204, products: 45 },
      { category: 'Ethnic Wear', revenue: 22100, orders: 158, products: 38 },
      { category: 'Home Decor', revenue: 15600, orders: 112, products: 29 }
    ]
  }
}

function getGeographicData() {
  // Mock geographic data - in production, get from order shipping addresses
  return [
    { country: 'United States', revenue: 35200, orders: 252, customers: 189 },
    { country: 'Canada', revenue: 18900, orders: 135, customers: 98 },
    { country: 'United Kingdom', revenue: 15600, orders: 112, customers: 87 },
    { country: 'Australia', revenue: 12100, orders: 87, customers: 65 },
    { country: 'Germany', revenue: 8800, orders: 63, customers: 52 }
  ]
}

async function getInventoryStatus() {
  try {
    const totalProducts = await db.product.count({ where: { isActive: true } })
    const lowStockCount = await db.product.count({
      where: {
        stockQuantity: { lte: 10 },
        isActive: true
      }
    })
    const outOfStockCount = await db.product.count({
      where: {
        stockQuantity: { lte: 0 },
        isActive: true
      }
    })

    const inStockCount = Math.max(0, totalProducts - lowStockCount - outOfStockCount)

    return [
      { 
        status: 'In Stock', 
        count: inStockCount,
        percentage: totalProducts > 0 ? (inStockCount / totalProducts) * 100 : 0
      },
      { 
        status: 'Low Stock', 
        count: lowStockCount,
        percentage: totalProducts > 0 ? (lowStockCount / totalProducts) * 100 : 0
      },
      { 
        status: 'Out of Stock', 
        count: outOfStockCount,
        percentage: totalProducts > 0 ? (outOfStockCount / totalProducts) * 100 : 0
      }
    ]
  } catch (error) {
    // Return mock data on error
    return [
      { status: 'In Stock', count: 128, percentage: 82.1 },
      { status: 'Low Stock', count: 18, percentage: 11.5 },
      { status: 'Out of Stock', count: 10, percentage: 6.4 }
    ]
  }
}