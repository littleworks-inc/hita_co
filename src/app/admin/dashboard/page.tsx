import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import AdminNavigation from '@/components/admin/AdminNavigation'
import {
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'

// Dashboard Stats Component
async function DashboardStats() {
  const [
    productsCount,
    ordersCount,
    lowStockProducts,
    totalRevenue
  ] = await Promise.all([
    db.product.count(),
    db.order.count(),
    db.product.count({
      where: {
        stockQuantity: {
          lte: db.product.fields.lowStockAlert
        }
      }
    }),
    db.order.aggregate({
      _sum: {
        total: true
      },
      where: {
        status: {
          not: 'CANCELLED'
        }
      }
    })
  ])

  const stats = [
    {
      title: 'Total Products',
      value: productsCount,
      icon: Package,
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'Total Orders',
      value: ordersCount,
      icon: ShoppingCart,
      change: '+8%',
      changeType: 'positive' as const
    },
    {
      title: 'Revenue',
      value: formatPrice(totalRevenue._sum.total || 0),
      icon: DollarSign,
      change: '+15%',
      changeType: 'positive' as const
    },
    {
      title: 'Low Stock Alert',
      value: lowStockProducts,
      icon: AlertTriangle,
      change: lowStockProducts > 0 ? 'Action needed' : 'All good',
      changeType: lowStockProducts > 0 ? 'negative' as const : 'positive' as const
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${
                stat.changeType === 'positive' 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// Recent Orders Component
async function RecentOrders() {
  const recentOrders = await db.order.findMany({
    take: 5,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true
            }
          }
        }
      }
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No orders yet
            </p>
          ) : (
            recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.customerName} • {order.items.length} item(s)
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatPrice(order.total)}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.source}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Low Stock Alert Component
async function LowStockAlert() {
  const lowStockProducts = await db.product.findMany({
    where: {
      stockQuantity: {
        lte: db.product.fields.lowStockAlert
      }
    },
    select: {
      id: true,
      name: true,
      stockQuantity: true,
      lowStockAlert: true
    },
    take: 5
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Low Stock Alert
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lowStockProducts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              All products are well stocked
            </p>
          ) : (
            lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Stock: {product.stockQuantity} units
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                    Low Stock
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function AdminDashboard() {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      {/* Fixed: Added lg:pl-64 to push content away from sidebar */}
      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-b border-gray-200 pb-5 mb-6">
              <h1 className="text-3xl font-bold leading-6 text-gray-900">
                Dashboard
              </h1>
              <p className="mt-2 max-w-4xl text-sm text-gray-500">
                Welcome back! Here's what's happening with your store.
              </p>
            </div>

            <div className="space-y-6">
              <Suspense fallback={<div>Loading stats...</div>}>
                <DashboardStats />
              </Suspense>

              <div className="grid gap-6 md:grid-cols-2">
                <Suspense fallback={<div>Loading orders...</div>}>
                  <RecentOrders />
                </Suspense>

                <Suspense fallback={<div>Loading alerts...</div>}>
                  <LowStockAlert />
                </Suspense>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full" variant="outline">
                      Add New Product
                    </Button>
                    <Button className="w-full" variant="outline">
                      Create Exhibition
                    </Button>
                    <Button className="w-full" variant="outline">
                      View Orders
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sales Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Online</span>
                        <span className="text-sm font-medium">$2,340</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Home Visits</span>
                        <span className="text-sm font-medium">$1,230</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Exhibitions</span>
                        <span className="text-sm font-medium">$890</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Store Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Store Online</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Payments Active</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">AI Tools Ready</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}