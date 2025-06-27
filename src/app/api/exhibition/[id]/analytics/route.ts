// src/app/api/exhibition/[id]/analytics/route.ts
// =====================================
// Exhibition Analytics API Endpoint
// Provides real-time analytics data for exhibition dashboard
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const exhibitionId = params.id

    // Validate exhibition exists and is accessible
    const exhibition = await db.exhibition.findUnique({
      where: { id: exhibitionId },
      select: {
        id: true,
        title: true,
        location: true,
        startDate: true,
        endDate: true,
        participationFee: true,
        isActive: true
      }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || '24h'
    const timezone = url.searchParams.get('timezone') || 'UTC'

    // Calculate analytics data
    const analyticsData = await calculateExhibitionAnalytics(exhibition, period)

    return NextResponse.json(analyticsData)

  } catch (error) {
    console.error('Exhibition Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function calculateExhibitionAnalytics(exhibition: any, period: string) {
  const exhibitionId = exhibition.id
  const now = new Date()
  
  // Calculate date ranges
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  try {
    // 1. Get all exhibition sales and products data
    const [sales, products, todaySales, yesterdaySales] = await Promise.all([
      // All sales for this exhibition
      db.exhibitionSale.findMany({
        where: { exhibitionId },
        include: {
          items: {
            select: {
              id: true,
              productName: true,
              productSku: true,
              quantity: true,
              finalPrice: true,
              lineTotal: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      // All products for this exhibition
      db.exhibitionProduct.findMany({
        where: { exhibitionId },
        include: {
          product: {
            include: {
              category: true,
              country: true
            }
          }
        }
      }),
      
      // Today's sales
      db.exhibitionSale.findMany({
        where: {
          exhibitionId,
          createdAt: { gte: today }
        },
        include: { items: true }
      }),
      
      // Yesterday's sales
      db.exhibitionSale.findMany({
        where: {
          exhibitionId,
          createdAt: { gte: yesterday, lt: today }
        },
        include: { items: true }
      })
    ])

    // 2. Calculate real-time metrics
    const metrics = calculateRealTimeMetrics(sales, products, todaySales, yesterdaySales, exhibition)
    
    // 3. Generate hourly sales trend
    const hourlyTrend = generateHourlyTrend(sales, last24Hours)
    
    // 4. Calculate top-selling products
    const topProducts = calculateTopProducts(products, sales)
    
    // 5. Generate payment method breakdown
    const paymentBreakdown = calculatePaymentBreakdown(sales)
    
    // 6. Calculate category performance
    const categoryPerformance = calculateCategoryPerformance(products, sales)
    
    // 7. Generate business insights
    const insights = generateBusinessInsights(metrics, exhibition, sales, products)
    
    // 8. Calculate staff performance (if multiple staff)
    const staffPerformance = calculateStaffPerformance(sales)

    return {
      exhibition: {
        id: exhibition.id,
        title: exhibition.title,
        location: exhibition.location,
        startDate: exhibition.startDate,
        endDate: exhibition.endDate
      },
      metrics,
      hourlyTrend,
      topProducts,
      paymentBreakdown,
      categoryPerformance,
      insights,
      staffPerformance,
      lastUpdated: new Date().toISOString()
    }

  } catch (error) {
    console.error('Error calculating exhibition analytics:', error)
    
    // Return empty state if data calculation fails
    return {
      exhibition: {
        id: exhibition.id,
        title: exhibition.title,
        location: exhibition.location,
        startDate: exhibition.startDate,
        endDate: exhibition.endDate
      },
      metrics: getEmptyMetrics(),
      hourlyTrend: [],
      topProducts: [],
      paymentBreakdown: [],
      categoryPerformance: [],
      insights: {},
      staffPerformance: [],
      lastUpdated: new Date().toISOString(),
      isEmpty: true
    }
  }
}

function calculateRealTimeMetrics(sales: any[], products: any[], todaySales: any[], yesterdaySales: any[], exhibition: any) {
  // Calculate totals
  const totalSales = sales.length
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.finalTotal, 0)
  const totalItems = sales.reduce((sum, sale) => 
    sum + sale.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0), 0
  )
  
  // Today vs Yesterday
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.finalTotal, 0)
  const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + sale.finalTotal, 0)
  const todaySalesCount = todaySales.length
  const yesterdaySalesCount = yesterdaySales.length
  
  // Calculate changes
  const revenueChange = yesterdayRevenue > 0 
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
    : todayRevenue > 0 ? 100 : 0
    
  const salesChange = yesterdaySalesCount > 0 
    ? ((todaySalesCount - yesterdaySalesCount) / yesterdaySalesCount) * 100 
    : todaySalesCount > 0 ? 100 : 0

  // Inventory metrics
  const totalQuantityTaken = products.reduce((sum: number, p: any) => sum + p.quantityTaken, 0)
  const totalQuantitySold = products.reduce((sum: number, p: any) => sum + p.quantitySold, 0)
  const remainingInventory = totalQuantityTaken - totalQuantitySold
  const sellThroughRate = totalQuantityTaken > 0 ? (totalQuantitySold / totalQuantityTaken) * 100 : 0
  
  // Calculate average order value
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0
  
  // Calculate ROI
  const participationFee = exhibition.participationFee || 0
  const netProfit = totalRevenue - participationFee
  const roi = participationFee > 0 ? (netProfit / participationFee) * 100 : 0

  return {
    totalSales,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalItems,
    todayRevenue: Math.round(todayRevenue * 100) / 100,
    yesterdayRevenue: Math.round(yesterdayRevenue * 100) / 100,
    todaySalesCount,
    yesterdaySalesCount,
    revenueChange: Math.round(revenueChange * 100) / 100,
    salesChange: Math.round(salesChange * 100) / 100,
    totalQuantityTaken,
    totalQuantitySold,
    remainingInventory,
    sellThroughRate: Math.round(sellThroughRate * 100) / 100,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    participationFee,
    netProfit: Math.round(netProfit * 100) / 100,
    roi: Math.round(roi * 100) / 100
  }
}

function generateHourlyTrend(sales: any[], startTime: Date) {
  const hourlyData = new Map()
  
  // Initialize 24 hours with zero values
  for (let i = 0; i < 24; i++) {
    const hour = new Date(startTime.getTime() + i * 60 * 60 * 1000)
    const hourKey = hour.getHours()
    hourlyData.set(hourKey, {
      hour: hourKey,
      sales: 0,
      revenue: 0,
      items: 0
    })
  }
  
  // Add actual sales data
  sales.forEach(sale => {
    const saleTime = new Date(sale.createdAt)
    if (saleTime >= startTime) {
      const hour = saleTime.getHours()
      if (hourlyData.has(hour)) {
        const data = hourlyData.get(hour)
        data.sales += 1
        data.revenue += sale.finalTotal
        data.items += sale.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      }
    }
  })
  
  // Convert to array and format for charts
  return Array.from(hourlyData.values()).map(data => ({
    hour: `${data.hour.toString().padStart(2, '0')}:00`,
    sales: data.sales,
    revenue: Math.round(data.revenue * 100) / 100,
    items: data.items
  }))
}

function calculateTopProducts(products: any[], sales: any[]) {
  // Create a map of product sales
  const productSales = new Map()
  
  // Initialize products
  products.forEach(ep => {
    productSales.set(ep.productId, {
      id: ep.id,
      productId: ep.productId,
      name: ep.product.name,
      sku: ep.product.sku,
      category: ep.product.category.name,
      image: ep.product.images[0] || null,
      quantityTaken: ep.quantityTaken,
      quantitySold: ep.quantitySold,
      revenue: 0,
      transactions: 0,
      exhibitionPrice: ep.exhibitionPrice || ep.product.sellingPriceUSD
    })
  })
  
  // Add sales data
  sales.forEach(sale => {
    sale.items.forEach((item: any) => {
      const productData = productSales.get(item.productId)
      if (productData) {
        productData.revenue += item.lineTotal
        productData.transactions += 1
      }
    })
  })
  
  // Convert to array and sort by revenue
  return Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(product => ({
      ...product,
      revenue: Math.round(product.revenue * 100) / 100,
      sellRate: product.quantityTaken > 0 ? 
        Math.round((product.quantitySold / product.quantityTaken) * 100 * 100) / 100 : 0
    }))
}

function calculatePaymentBreakdown(sales: any[]) {
  const paymentMethods = {
    CASH: 0,
    ZELLE: 0,
    CARD: 0,
    SPLIT_PAYMENT: 0
  }
  
  sales.forEach(sale => {
    if (paymentMethods.hasOwnProperty(sale.paymentMethod)) {
      paymentMethods[sale.paymentMethod as keyof typeof paymentMethods] += sale.finalTotal
    }
  })
  
  const total = Object.values(paymentMethods).reduce((sum, amount) => sum + amount, 0)
  
  return Object.entries(paymentMethods).map(([method, amount]) => ({
    method,
    amount: Math.round(amount * 100) / 100,
    percentage: total > 0 ? Math.round((amount / total) * 100 * 100) / 100 : 0,
    count: sales.filter(sale => sale.paymentMethod === method).length
  })).filter(item => item.amount > 0)
}

function calculateCategoryPerformance(products: any[], sales: any[]) {
  const categoryStats = new Map()
  
  // Initialize categories
  products.forEach(ep => {
    const category = ep.product.category.name
    if (!categoryStats.has(category)) {
      categoryStats.set(category, {
        category,
        productCount: 0,
        quantityTaken: 0,
        quantitySold: 0,
        revenue: 0,
        transactions: 0
      })
    }
    
    const stats = categoryStats.get(category)
    stats.productCount += 1
    stats.quantityTaken += ep.quantityTaken
    stats.quantitySold += ep.quantitySold
  })
  
  // Add sales revenue
  sales.forEach(sale => {
    sale.items.forEach((item: any) => {
      // Find the product to get its category
      const product = products.find(p => p.productId === item.productId)
      if (product) {
        const category = product.product.category.name
        const stats = categoryStats.get(category)
        if (stats) {
          stats.revenue += item.lineTotal
          stats.transactions += 1
        }
      }
    })
  })
  
  return Array.from(categoryStats.values())
    .map(stats => ({
      ...stats,
      revenue: Math.round(stats.revenue * 100) / 100,
      sellRate: stats.quantityTaken > 0 ? 
        Math.round((stats.quantitySold / stats.quantityTaken) * 100 * 100) / 100 : 0,
      avgProductRevenue: stats.productCount > 0 ? 
        Math.round((stats.revenue / stats.productCount) * 100) / 100 : 0
    }))
    .sort((a, b) => b.revenue - a.revenue)
}

function generateBusinessInsights(metrics: any, exhibition: any, sales: any[], products: any[]) {
  const insights: any = {}
  
  // ROI Analysis
  if (metrics.roi > 100) {
    insights.roi = {
      type: 'success',
      message: `Excellent ROI of ${metrics.roi.toFixed(1)}%! This exhibition is highly profitable.`,
      recommendation: 'Consider participating in similar exhibitions or extending this one.'
    }
  } else if (metrics.roi < 0) {
    insights.roi = {
      type: 'warning',
      message: `Negative ROI of ${metrics.roi.toFixed(1)}%. Revenue hasn't covered participation costs.`,
      recommendation: 'Review pricing strategy and product selection for future exhibitions.'
    }
  } else {
    insights.roi = {
      type: 'info',
      message: `ROI is ${metrics.roi.toFixed(1)}%. Breaking even but room for improvement.`,
      recommendation: 'Focus on higher-margin products and increase sales volume.'
    }
  }
  
  // Sell-through Analysis
  if (metrics.sellThroughRate > 80) {
    insights.inventory = {
      type: 'success',
      message: `Outstanding sell-through rate of ${metrics.sellThroughRate.toFixed(1)}%!`,
      recommendation: 'Consider bringing more inventory to similar events.'
    }
  } else if (metrics.sellThroughRate < 30) {
    insights.inventory = {
      type: 'warning',
      message: `Low sell-through rate of ${metrics.sellThroughRate.toFixed(1)}%.`,
      recommendation: 'Review product selection and consider reducing quantities for similar events.'
    }
  }
  
  // Peak hours analysis
  const hourlyTrend = generateHourlyTrend(sales, new Date(Date.now() - 24 * 60 * 60 * 1000))
  const peakHour = hourlyTrend.reduce((max, current) => 
    current.revenue > max.revenue ? current : max, hourlyTrend[0])
    
  if (peakHour && peakHour.revenue > 0) {
    insights.timing = {
      type: 'info',
      message: `Peak sales hour is ${peakHour.hour} with $${peakHour.revenue} in revenue.`,
      recommendation: 'Ensure adequate staffing during peak hours for optimal service.'
    }
  }
  
  return insights
}

function calculateStaffPerformance(sales: any[]) {
  // For now, return empty array as staff tracking isn't implemented
  // This can be enhanced when staff assignment is added to sales
  return []
}

function getEmptyMetrics() {
  return {
    totalSales: 0,
    totalRevenue: 0,
    totalItems: 0,
    todayRevenue: 0,
    yesterdayRevenue: 0,
    todaySalesCount: 0,
    yesterdaySalesCount: 0,
    revenueChange: 0,
    salesChange: 0,
    totalQuantityTaken: 0,
    totalQuantitySold: 0,
    remainingInventory: 0,
    sellThroughRate: 0,
    averageOrderValue: 0,
    participationFee: 0,
    netProfit: 0,
    roi: 0
  }
}