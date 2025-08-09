// src/app/api/admin/dashboard/mobile-stats/route.ts
// API endpoint for mobile dashboard statistics and recent activity
// ✅ FIXED to match actual Prisma schema

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { withRateLimiting } from '@/lib/rate-limit'

interface RecentActivity {
  id: string
  type: 'order' | 'product' | 'customer' | 'exhibition' | 'sale'
  title: string
  description: string
  timestamp: Date
  time: string  // ✅ Keep this for display
  status: 'success' | 'warning' | 'info'
  priority?: 'high' | 'medium' | 'low'
}

export const GET = withRateLimiting({ interval: 60000, maxRequests: 100 })(
  async (request: NextRequest) => {
    try {
      const session = await getSession()
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // ✅ FIXED: Get comprehensive dashboard statistics using correct field names
      const [
        totalProducts,
        activeProducts,
        publishedProducts, // ✅ Use 'status' instead of 'isDraft'
        totalCategories,
        totalSuppliers,
        activeSuppliers,
        totalExhibitions,
        activeExhibitions,
        totalSales,
        totalRevenue
      ] = await Promise.all([
        db.product.count(),
        db.product.count({ where: { isActive: true } }),
        db.product.count({ where: { status: 'PUBLISHED' } }), // ✅ FIXED: Use status field
        db.category.count(),
        db.supplier.count(),
        db.supplier.count({ where: { isActive: true } }),
        db.exhibition.count(),
        db.exhibition.count({ where: { isActive: true } }),
        db.exhibitionSale.count(),
        db.exhibitionSale.aggregate({
          _sum: { total: true } // ✅ FIXED: Use 'total' instead of 'finalTotal'
        })
      ])

      // ✅ FIXED: Get low stock products using correct field (quantity instead of stockQuantity)
      const lowStockProducts = await db.product.count({
        where: {
          isActive: true,
          quantity: { lt: 10 } // ✅ FIXED: Use 'quantity' field
        }
      })

      // Get upcoming exhibitions (next 30 days)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      const upcomingExhibitions = await db.exhibition.count({
        where: {
          isActive: true,
          startDate: {
            gte: new Date(),
            lte: thirtyDaysFromNow
          }
        }
      })

      // Get today's stats
      const today = new Date()
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)

      const [todaySales, todayRevenue] = await Promise.all([
        db.exhibitionSale.count({
          where: {
            createdAt: {
              gte: startOfToday,
              lt: endOfToday
            }
          }
        }),
        db.exhibitionSale.aggregate({
          where: {
            createdAt: {
              gte: startOfToday,
              lt: endOfToday
            }
          },
          _sum: { total: true } // ✅ FIXED: Use 'total' field
        })
      ])

      // Get this month's stats
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const [monthSales, monthRevenue] = await Promise.all([
        db.exhibitionSale.count({
          where: {
            createdAt: { gte: startOfMonth }
          }
        }),
        db.exhibitionSale.aggregate({
          where: {
            createdAt: { gte: startOfMonth }
          },
          _sum: { total: true } // ✅ FIXED: Use 'total' field
        })
      ])

      // ✅ FIXED: Build dashboard stats with correct field mapping
      const stats = {
        products: {
          total: totalProducts,
          active: activeProducts,
          draft: totalProducts - publishedProducts, // Calculate draft products
          lowStock: lowStockProducts
        },
        categories: {
          total: totalCategories
        },
        suppliers: {
          total: totalSuppliers,
          active: activeSuppliers
        },
        exhibitions: {
          total: totalExhibitions,
          active: activeExhibitions,
          upcoming: upcomingExhibitions
        },
        sales: {
          total: totalSales,
          today: todaySales,
          thisMonth: monthSales
        },
        revenue: {
          total: totalRevenue._sum.total || 0, // ✅ FIXED: Use 'total' field
          today: todayRevenue._sum.total || 0, // ✅ FIXED: Use 'total' field
          thisMonth: monthRevenue._sum.total || 0 // ✅ FIXED: Use 'total' field
        }
      }

      // Get recent activity (last 10 activities)
      const recentActivity: RecentActivity[] = []

      try {
        // Recent products added
        const recentProducts = await db.product.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            createdAt: true,
            isActive: true,
            status: true // ✅ Include status field
          }
        })

        recentProducts.forEach(product => {
          const timeDiff = Date.now() - new Date(product.createdAt).getTime()
          const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60))

          recentActivity.push({
            id: `product-${product.id}`,
            type: 'product',
            title: 'Product Added',
            description: `${product.name} was ${product.status === 'PUBLISHED' ? 'published' : 'saved as draft'}`,
            timestamp: product.createdAt, // ✅ ADD this line
            time: hoursAgo < 1 ? 'Just now' : hoursAgo < 24 ? `${hoursAgo}h ago` : new Date(product.createdAt).toLocaleDateString(),
            status: product.status === 'PUBLISHED' && product.isActive ? 'success' : 'info'
          })
        })
      } catch (error) {
        console.warn('Could not fetch recent products:', error)
      }

      try {
        // Recent exhibitions
        const recentExhibitions = await db.exhibition.findMany({
          take: 3,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            location: true,
            createdAt: true,
            startDate: true,
            isActive: true
          }
        })

        recentExhibitions.forEach(exhibition => {
          const timeDiff = Date.now() - new Date(exhibition.createdAt).getTime()
          const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60))

          recentActivity.push({
            id: `exhibition-${exhibition.id}`,
            type: 'exhibition',
            title: 'Exhibition Created',
            description: `${exhibition.title} at ${exhibition.location}`,
            timestamp: exhibition.createdAt, // ✅ ADD this line
            time: hoursAgo < 1 ? 'Just now' : hoursAgo < 24 ? `${hoursAgo}h ago` : new Date(exhibition.createdAt).toLocaleDateString(),
            status: exhibition.isActive ? 'success' : 'info'
          })
        })
      } catch (error) {
        console.warn('Could not fetch recent exhibitions:', error)
      }

      try {
        // Recent sales
        const recentSales = await db.exhibitionSale.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            saleNumber: true,
            total: true, // ✅ FIXED: Use 'total' field
            createdAt: true,
            customerName: true,
            exhibition: {
              select: { title: true }
            }
          }
        })

        recentSales.forEach(sale => {
          const timeDiff = Date.now() - new Date(sale.createdAt).getTime()
          const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60))

          recentActivity.push({
            id: `sale-${sale.id}`,
            type: 'order', // Use 'order' instead of 'sale'
            title: 'Sale Completed',
            description: `Sale #${sale.saleNumber} - $${sale.total} ${sale.customerName ? `to ${sale.customerName}` : '(walk-in)'}`,
            timestamp: sale.createdAt, // ✅ ADD this line
            time: hoursAgo < 1 ? 'Just now' : hoursAgo < 24 ? `${hoursAgo}h ago` : new Date(sale.createdAt).toLocaleDateString(),
            status: 'success'
          })
        })
      } catch (error) {
        console.warn('Could not fetch recent sales:', error)
      }

      // Sort recent activity by time (most recent first)
      recentActivity.sort((a: RecentActivity, b: RecentActivity) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })

      const response = {
        stats,
        recentActivity: recentActivity.slice(0, 10),
        timestamp: new Date().toISOString(),
        summary: {
          totalItems: stats.products.total + stats.categories.total + stats.suppliers.total,
          activeExhibitions: stats.exhibitions.active,
          revenueToday: stats.revenue.today,
          lowStockAlerts: stats.products.lowStock
        }
      }

      return NextResponse.json(response)

    } catch (error) {
      console.error('Mobile dashboard API error:', error)
      return NextResponse.json(
        {
          error: 'Failed to load dashboard data',
          details: error instanceof Error ? error.message : 'Unknown error',
          // ✅ Provide fallback data for mobile app
          stats: {
            products: { total: 0, active: 0, draft: 0, lowStock: 0 },
            categories: { total: 0 },
            suppliers: { total: 0, active: 0 },
            exhibitions: { total: 0, active: 0, upcoming: 0 },
            sales: { total: 0, today: 0, thisMonth: 0 },
            revenue: { total: 0, today: 0, thisMonth: 0 }
          },
          recentActivity: [],
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  }
)