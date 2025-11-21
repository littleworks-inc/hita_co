// src/app/api/exhibition/[id]/analytics/route.ts
// =====================================
// Exhibition Analytics API Endpoint
// Provides real-time analytics data for exhibition dashboard
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// Force dynamic rendering - this route uses cookies or request.url
export const dynamic = 'force-dynamic'

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
              // ✅ FIXED: Use only fields that exist in the schema
              // These fields exist based on the actual usage in the codebase
              productId: true,
              exhibitionProductId: true,
              quantity: true,
              // Instead of selecting non-existent fields, we'll include relations
            },
            include: {
              // Get product data through relations
              exhibitionProduct: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      sku: true,
                      category: {
                        select: {
                          name: true
                        }
                      }
                    }
                  }
                }
              }
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
        include: { 
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
            },
            include: {
              exhibitionProduct: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      sku: true,
                      category: {
                        select: {
                          name: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }),
      
      // Yesterday's sales
      db.exhibitionSale.findMany({
        where: {
          exhibitionId,
          createdAt: { gte: yesterday, lt: today }
        },
        include: { 
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
            },
            include: {
              exhibitionProduct: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      sku: true,
                      category: {
                        select: {
                          name: true
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
    
    // 8. Return comprehensive analytics
    return {
      exhibition: {
        id: exhibition.id,
        title: exhibition.title,
        location: exhibition.location,
        startDate: exhibition.startDate,
        endDate: exhibition.endDate,
        participationFee: exhibition.participationFee,
        isActive: exhibition.isActive
      },
      metrics,
      trends: {
        hourly: hourlyTrend,
        period: period
      },
      performance: {
        topProducts,
        categoryPerformance,
        paymentBreakdown
      },
      insights,
      lastUpdated: new Date().toISOString()
    }

  } catch (error) {
    console.error('Error calculating exhibition analytics:', error)
    throw error
  }
}

function calculateRealTimeMetrics(sales: any[], products: any[], todaySales: any[], yesterdaySales: any[], exhibition: any) {
  // Revenue calculations
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0)
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0)
  const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + sale.total, 0)
  
  // Sales count
  const totalSales = sales.length
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
    revenue: {
      total: totalRevenue,
      today: todayRevenue,
      yesterday: yesterdayRevenue,
      change: revenueChange
    },
    sales: {
      total: totalSales,
      today: todaySalesCount,
      yesterday: yesterdaySalesCount,
      change: salesChange,
      averageOrderValue
    },
    inventory: {
      totalQuantityTaken,
      totalQuantitySold,
      remainingInventory,
      sellThroughRate
    },
    profitability: {
      totalRevenue,
      participationFee,
      netProfit,
      roi
    }
  }
}

function generateHourlyTrend(sales: any[], since: Date) {
  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    sales: 0,
    revenue: 0
  }))

  sales.forEach(sale => {
    if (new Date(sale.createdAt) >= since) {
      const hour = new Date(sale.createdAt).getHours()
      hourlyData[hour].sales += 1
      hourlyData[hour].revenue += sale.total
    }
  })

  return hourlyData
}

function calculateTopProducts(products: any[], sales: any[]) {
  const productStats: Record<string, any> = {}

  // Initialize with exhibition products
  products.forEach(ep => {
    productStats[ep.productId] = {
      productId: ep.productId,
      productName: ep.product.name,
      productSku: ep.product.sku || '',
      quantityTaken: ep.quantityTaken,
      quantitySold: ep.quantitySold,
      revenue: 0,
      category: ep.product.category?.name || 'Uncategorized'
    }
  })

  // Add sales data - calculate revenue based on sale totals
  sales.forEach(sale => {
    sale.items.forEach((item: any) => {
      if (productStats[item.productId]) {
        // Calculate proportion of sale total based on quantity
        const totalQuantity = sale.items.reduce((sum: number, i: any) => sum + i.quantity, 0)
        const itemProportion = item.quantity / totalQuantity
        const itemRevenue = sale.total * itemProportion
        productStats[item.productId].revenue += itemRevenue
      }
    })
  })

  return Object.values(productStats)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 10)
}

function calculatePaymentBreakdown(sales: any[]) {
  const breakdown: Record<string, { count: number; revenue: number }> = {}

  sales.forEach(sale => {
    const method = sale.paymentMethod || 'UNKNOWN'
    if (!breakdown[method]) {
      breakdown[method] = { count: 0, revenue: 0 }
    }
    breakdown[method].count += 1
    breakdown[method].revenue += sale.total
  })

  return breakdown
}

function calculateCategoryPerformance(products: any[], sales: any[]) {
  const categoryStats: Record<string, any> = {}

  // Initialize categories
  products.forEach(ep => {
    const category = ep.product.category?.name || 'Uncategorized'
    if (!categoryStats[category]) {
      categoryStats[category] = {
        category,
        totalProducts: 0,
        quantityTaken: 0,
        quantitySold: 0,
        revenue: 0
      }
    }
    categoryStats[category].totalProducts += 1
    categoryStats[category].quantityTaken += ep.quantityTaken
    categoryStats[category].quantitySold += ep.quantitySold
  })

  // Add revenue from sales (estimated based on product quantities)
  sales.forEach(sale => {
    sale.items.forEach((item: any) => {
      const category = item.exhibitionProduct?.product?.category?.name || 'Uncategorized'
      if (categoryStats[category]) {
        // Calculate proportion of sale total
        const totalQuantity = sale.items.reduce((sum: number, i: any) => sum + i.quantity, 0)
        const itemProportion = item.quantity / totalQuantity
        const itemRevenue = sale.total * itemProportion
        categoryStats[category].revenue += itemRevenue
      }
    })
  })

  return Object.values(categoryStats)
}

function generateBusinessInsights(metrics: any, exhibition: any, sales: any[], products: any[]) {
  const insights = []

  // Revenue insights
  if (metrics.revenue.change > 20) {
    insights.push({
      type: 'positive',
      title: 'Strong Daily Performance',
      message: `Revenue is up ${metrics.revenue.change.toFixed(1)}% compared to yesterday`
    })
  } else if (metrics.revenue.change < -20) {
    insights.push({
      type: 'warning',
      title: 'Revenue Decline',
      message: `Revenue is down ${Math.abs(metrics.revenue.change).toFixed(1)}% compared to yesterday`
    })
  }

  // Inventory insights
  if (metrics.inventory.sellThroughRate > 80) {
    insights.push({
      type: 'positive',
      title: 'High Sell-Through Rate',
      message: `${metrics.inventory.sellThroughRate.toFixed(1)}% of inventory has been sold`
    })
  } else if (metrics.inventory.sellThroughRate < 30) {
    insights.push({
      type: 'warning',
      title: 'Low Inventory Movement',
      message: `Only ${metrics.inventory.sellThroughRate.toFixed(1)}% of inventory sold. Consider pricing adjustments.`
    })
  }

  // ROI insights
  if (metrics.profitability.roi > 100) {
    insights.push({
      type: 'positive',
      title: 'Profitable Exhibition',
      message: `ROI of ${metrics.profitability.roi.toFixed(1)}% - exhibition costs covered with profit`
    })
  }

  return insights
}