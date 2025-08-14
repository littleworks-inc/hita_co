import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import AdminNavigation from '@/components/admin/AdminNavigation'
import OrdersTable from '@/components/admin/OrdersTable'
import { Card, CardContent } from '@/components/ui/card'
import { RefreshCw } from 'lucide-react'

// Server component to fetch initial data
async function OrdersData() {
  try {
    // Fetch initial orders data
    const [orders, stats] = await Promise.all([
      // Get recent orders with pagination
      db.order.findMany({
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                  sku: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Get statistics
      Promise.all([
        // Total stats
        db.order.aggregate({
          _count: { id: true },
          _sum: { total: true },
          _avg: { total: true }
        }),
        
        // Status breakdown
        db.order.groupBy({
          by: ['status'],
          _count: { status: true },
          _sum: { total: true }
        }),
        
        // Total count for pagination
        db.order.count()
      ])
    ])

    const [totalStats, statusBreakdown, totalCount] = stats

    // Transform data to match OrdersTable interface
    const transformedOrders = orders.map(order => ({
      ...order,
      createdAt: order.createdAt.toISOString(), // Convert Date to string
      items: order.items.map(item => ({
        ...item,
        // Note: OrdersTable doesn't use item dates, so no conversion needed for items
      }))
    }))

    const initialData = {
      orders: transformedOrders,
      pagination: {
        page: 1,
        limit: 10,
        total: totalCount,
        pages: Math.ceil(totalCount / 10)
      },
      stats: {
        totalOrders: totalStats._count.id || 0,
        totalRevenue: totalStats._sum.total || 0,
        averageOrderValue: totalStats._avg.total || 0,
        statusBreakdown: statusBreakdown.map(item => ({
          status: item.status,
          count: item._count.status,
          revenue: item._sum.total || 0
        }))
      }
    }

    return <OrdersTable initialData={initialData} />
    
  } catch (error) {
    console.error('Error fetching orders:', error)
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-red-600">
            Error loading orders. Please try again.
          </div>
        </CardContent>
      </Card>
    )
  }
}

// Loading component
function OrdersLoading() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function OrdersPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="border-b border-gray-200 pb-5 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold leading-6 text-gray-900">
                    Orders Management
                  </h1>
                  <p className="mt-2 max-w-4xl text-sm text-gray-500">
                    Manage customer orders, track status, and process fulfillment across all sales channels.
                  </p>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <Suspense fallback={<OrdersLoading />}>
              <OrdersData />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}