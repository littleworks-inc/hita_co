import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Globe,
  Store,
  ExternalLink,
  BarChart3
} from 'lucide-react'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

// Helper function to safely extract numeric values
function safeNumber(value: any): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value) || 0
  if (value && typeof value === 'object' && 'toNumber' in value) return value.toNumber()
  return 0
}

// Helper function to safely extract count values
function safeCount(value: any): number {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object') {
    // Handle Prisma aggregate result
    if ('_count' in value) return safeNumber(value._count)
    if ('count' in value) return safeNumber(value.count)
  }
  return 0
}

// Dynamic Dashboard Stats Component
async function DashboardStats() {
  try {
    // Calculate date ranges for comparison
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Fetch current period data with explicit error handling
    const currentRevenue = await db.order.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: {
        createdAt: { gte: thirtyDaysAgo, lte: now },
        status: { not: 'CANCELLED' }
      }
    }).catch(() => ({ _sum: { total: 0 }, _count: 0 }))

    // Fetch previous period data
    const previousRevenue = await db.order.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        status: { not: 'CANCELLED' }
      }
    }).catch(() => ({ _sum: { total: 0 }, _count: 0 }))

    // Fetch product data safely
    const [totalProducts, activeProducts, lowStockProducts] = await Promise.all([
      db.product.count().catch(() => 0),
      db.product.count({ where: { isActive: true } }).catch(() => 0),
      db.product.count({
        where: {
          isActive: true,
          stockQuantity: { lte: 5 } // Simple threshold
        }
      }).catch(() => 0)
    ])

    // Safely extract values using our helper functions
    const currentRevenueAmount = safeNumber(currentRevenue._sum?.total)
    const previousRevenueAmount = safeNumber(previousRevenue._sum?.total)
    const currentOrdersCount = safeCount(currentRevenue._count)
    const previousOrdersCount = safeCount(previousRevenue._count)

    // Calculate changes safely
    const revenueChange = previousRevenueAmount > 0 
      ? ((currentRevenueAmount - previousRevenueAmount) / previousRevenueAmount) * 100 
      : 0

    const ordersChange = previousOrdersCount > 0 
      ? ((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100 
      : 0

    // Determine if this is a fresh system
    const isFreshSystem = totalProducts === 0 || (currentRevenueAmount === 0 && currentOrdersCount === 0)

    const stats = [
      {
        title: 'Total Revenue',
        value: formatPrice(currentRevenueAmount),
        change: revenueChange !== 0 ? `${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}%` : isFreshSystem ? 'Start selling' : 'No change',
        changeType: revenueChange > 0 ? 'positive' : revenueChange < 0 ? 'negative' : 'neutral',
        icon: DollarSign,
        isEmpty: currentRevenueAmount === 0,
        actionText: 'View Store',
        actionLink: '/'
      },
      {
        title: 'Total Orders',
        value: currentOrdersCount.toString(), // Explicit string conversion
        change: ordersChange !== 0 ? `${ordersChange > 0 ? '+' : ''}${ordersChange.toFixed(1)}%` : isFreshSystem ? 'Share your store' : 'No change',
        changeType: ordersChange > 0 ? 'positive' : ordersChange < 0 ? 'negative' : 'neutral',
        icon: ShoppingCart,
        isEmpty: currentOrdersCount === 0,
        actionText: 'View Products',
        actionLink: '/admin/products'
      },
      {
        title: 'Products',
        value: totalProducts.toString(), // Explicit string conversion
        change: `${activeProducts} active`,
        changeType: totalProducts > 0 ? 'positive' : 'neutral',
        icon: Package,
        isEmpty: totalProducts === 0,
        actionText: 'Add Product',
        actionLink: '/admin/products/new'
      },
      {
        title: 'Stock Status',
        value: totalProducts > 0 ? (lowStockProducts === 0 ? 'All Good' : `${lowStockProducts} Alert${lowStockProducts !== 1 ? 's' : ''}`) : 'No Products',
        change: lowStockProducts > 0 ? 'Needs attention' : totalProducts > 0 ? 'Well stocked' : 'Add inventory',
        changeType: lowStockProducts > 0 ? 'negative' : totalProducts > 0 ? 'positive' : 'neutral',
        icon: AlertTriangle,
        isEmpty: totalProducts === 0,
        actionText: lowStockProducts > 0 ? 'View Alerts' : totalProducts === 0 ? 'Add Product' : 'Manage Stock',
        actionLink: lowStockProducts > 0 ? '/admin/products?stock=low-stock' : totalProducts === 0 ? '/admin/products/new' : '/admin/products'
      }
    ]

    return (
      <div className="space-y-6">
        {/* Empty State Banner for Fresh System */}
        {isFreshSystem && (
          <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
            <CardContent className="p-6 text-center">
              {totalProducts === 0 ? (
                <>
                  <Package className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Welcome to Hita&Co Admin Dashboard!
                  </h3>
                  <p className="text-gray-600 mb-4 max-w-md mx-auto">
                    Let's get started by adding your first product to the catalog.
                  </p>
                  <Link href="/admin/products/new">
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Your First Product
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Products Ready! Time to Start Selling
                  </h3>
                  <p className="text-gray-600 mb-4 max-w-md mx-auto">
                    You have {totalProducts} products in your catalog. Share your store to start getting orders!
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Link href="/">
                      <Button className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        View Your Store
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Link href="/admin/analytics">
                      <Button variant="outline" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        View Analytics
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${
                    stat.changeType === 'positive' ? 'bg-green-50' :
                    stat.changeType === 'negative' ? 'bg-red-50' : 'bg-gray-50'
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      stat.changeType === 'positive' ? 'text-green-600' :
                      stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                    }`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {stat.changeType === 'positive' && <ArrowUpRight className="h-3 w-3 text-green-500" />}
                        {stat.changeType === 'negative' && <ArrowDownRight className="h-3 w-3 text-red-500" />}
                        <span className={`text-xs font-medium ${
                          stat.changeType === 'positive' ? 'text-green-600' :
                          stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                      {stat.isEmpty && stat.actionText && (
                        <Link href={stat.actionLink || '#'}>
                          <Button size="sm" variant="outline" className="text-xs h-6">
                            {stat.actionText}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
                
                {/* Subtle background decoration */}
                <div className="absolute -right-4 -bottom-4 opacity-5">
                  <Icon className="h-16 w-16" />
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">Error loading dashboard statistics</p>
          <p className="text-sm text-gray-500 mt-1">Please refresh the page to try again</p>
        </CardContent>
      </Card>
    )
  }
}

// Dynamic Recent Orders Component
async function RecentOrders() {
  try {
    const recentOrders = await db.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          select: {
            id: true,
            quantity: true,
            product: {
              select: { name: true }
            }
          }
        }
      }
    })

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            Recent Orders
          </CardTitle>
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No orders yet</p>
                <Link href="/">
                  <Button size="sm" className="flex items-center gap-2">
                    <ExternalLink className="h-3 w-3" />
                    Share Your Store
                  </Button>
                </Link>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Order #{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">{order.customerName}</p>
                    <p className="text-xs text-gray-500">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(safeNumber(order.total))}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                      order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'PENDING' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    )
  } catch (error) {
    console.error('Error fetching recent orders:', error)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 text-center">Error loading recent orders</p>
        </CardContent>
      </Card>
    )
  }
}

// Dynamic Inventory Status Component
async function InventoryStatus() {
  try {
    const [allProducts, lowStockProducts] = await Promise.all([
      db.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
          lowStockAlert: true
        },
        take: 10
      }),
      db.product.count({
        where: {
          isActive: true,
          stockQuantity: { lte: 5 } // Simple threshold
        }
      })
    ])

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            Inventory Overview
          </CardTitle>
          <Link href="/admin/products">
            <Button variant="outline" size="sm">Manage Products</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allProducts.length === 0 ? (
              <div className="text-center py-6">
                <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">No products found</p>
                <p className="text-sm text-gray-500 mb-4">Add your first product to start tracking inventory</p>
                <Link href="/admin/products/new">
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="h-3 w-3" />
                    Add Product
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="text-sm text-gray-600 mb-3">
                  Showing {allProducts.length} of your products
                  {lowStockProducts > 0 && (
                    <span className="text-orange-600 font-medium ml-2">
                      ({lowStockProducts} need restocking)
                    </span>
                  )}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {allProducts.map(product => (
                    <div key={product.id} className="flex items-center justify-between text-sm p-2 hover:bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sku}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          product.stockQuantity <= 0 ? 'bg-red-100 text-red-800' :
                          product.stockQuantity <= 5 ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {product.stockQuantity} units
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  } catch (error) {
    console.error('Error fetching inventory status:', error)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 text-center">Error loading inventory status</p>
        </CardContent>
      </Card>
    )
  }
}

// Quick Actions Component
function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link href="/admin/products/new">
          <Button className="w-full justify-start" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add New Product
          </Button>
        </Link>
        <Link href="/admin/exhibitions/new">
          <Button className="w-full justify-start" variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Create Exhibition
          </Button>
        </Link>
        <Link href="/admin/analytics">
          <Button className="w-full justify-start" variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </Link>
        <Link href="/">
          <Button className="w-full justify-start" variant="outline">
            <Globe className="h-4 w-4 mr-2" />
            View Store
            <ExternalLink className="h-3 w-3 ml-auto" />
          </Button>
        </Link>
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
              {/* Dynamic Stats */}
              <Suspense fallback={
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              }>
                <DashboardStats />
              </Suspense>

              {/* Main Content Grid */}
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <Suspense fallback={
                    <Card>
                      <CardContent className="p-6">
                        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
                      </CardContent>
                    </Card>
                  }>
                    <RecentOrders />
                  </Suspense>
                </div>

                <div className="space-y-6">
                  <Suspense fallback={
                    <Card>
                      <CardContent className="p-6">
                        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
                      </CardContent>
                    </Card>
                  }>
                    <InventoryStatus />
                  </Suspense>

                  <QuickActions />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}