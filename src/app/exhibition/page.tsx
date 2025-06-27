// src/app/exhibition/page.tsx
// =====================================
// Exhibition Portal Dashboard - Main Staff Interface
// Provides overview and quick access to POS functionality
// =====================================

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  MapPin,
  Users,
  Calendar,
  BarChart3,
  Plus,
  ArrowRight,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

// Get current exhibition with stats
async function getCurrentExhibitionWithStats() {
  const now = new Date()
  
  // First, try to find a currently running exhibition
  let exhibition = await db.exhibition.findFirst({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now }
    },
    include: {
      products: {
        include: {
          product: {
            include: {
              category: true,
              country: true
            }
          }
        }
      },
      sales: {
        include: {
          items: true
        }
      }
    },
    orderBy: {
      startDate: 'desc'
    }
  })

  // If no currently running exhibition, find the next upcoming exhibition
  if (!exhibition) {
    exhibition = await db.exhibition.findFirst({
      where: {
        isActive: true,
        startDate: { gt: now }
      },
      include: {
        products: {
          include: {
            product: {
              include: {
                category: true,
                country: true
              }
            }
          }
        },
        sales: {
          include: {
            items: true
          }
        }
      },
      orderBy: {
        startDate: 'asc' // Get the soonest upcoming
      }
    })
  }

  // If still no exhibition, get the most recent one (including past)
  if (!exhibition) {
    exhibition = await db.exhibition.findFirst({
      where: {
        isActive: true
      },
      include: {
        products: {
          include: {
            product: {
              include: {
                category: true,
                country: true
              }
            }
          }
        },
        sales: {
          include: {
            items: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    })
  }

  if (!exhibition) return null

  // Use a stable date that doesn't change between server and client
  const serverTime = new Date()
  const todayStart = new Date(serverTime.getFullYear(), serverTime.getMonth(), serverTime.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

  // Calculate stats with stable date comparison
  const totalProducts = exhibition.products.length
  const totalQuantityTaken = exhibition.products.reduce((sum, p) => sum + p.quantityTaken, 0)
  const totalQuantitySold = exhibition.products.reduce((sum, p) => sum + p.quantitySold, 0)
  const totalValue = exhibition.products.reduce((sum, p) => {
    const price = p.exhibitionPrice || p.product.sellingPriceUSD
    return sum + (p.quantityTaken * price)
  }, 0)
  
  const totalSales = exhibition.sales.length
  
  // Use stable date filtering
  const todaySales = exhibition.sales.filter(sale => {
    const saleDate = new Date(sale.createdAt)
    return saleDate >= todayStart && saleDate < todayEnd
  }).length

  const totalRevenue = exhibition.sales.reduce((sum, sale) => sum + sale.finalTotal, 0)
  const todayRevenue = exhibition.sales
    .filter(sale => {
      const saleDate = new Date(sale.createdAt)
      return saleDate >= todayStart && saleDate < todayEnd
    })
    .reduce((sum, sale) => sum + sale.finalTotal, 0)

  const sellThroughRate = totalQuantityTaken > 0 ? (totalQuantitySold / totalQuantityTaken) * 100 : 0

  return {
    exhibition,
    stats: {
      totalProducts,
      totalQuantityTaken,
      totalQuantitySold,
      totalValue,
      totalSales,
      todaySales,
      totalRevenue,
      todayRevenue,
      sellThroughRate
    }
  }
}

export default async function ExhibitionDashboard() {
  const session = await getSession()
  
  if (!session) {
    redirect('/exhibition/login')
  }

  const data = await getCurrentExhibitionWithStats()
  
  // If no active exhibition, the layout will handle showing the "No Active Exhibition" state
  if (!data) {
    return null
  }

  const { exhibition, stats } = data

  // Calculate exhibition status and progress with stable dates
  const now = new Date()
  const start = new Date(exhibition.startDate)
  const end = new Date(exhibition.endDate)
  
  let exhibitionStatus: 'upcoming' | 'active' | 'completed' = 'completed'
  let badgeColor = 'bg-gray-100 text-gray-800'
  
  if (start > now) {
    exhibitionStatus = 'upcoming'
    badgeColor = 'bg-blue-100 text-blue-800'
  } else if (end >= now) {
    exhibitionStatus = 'active'
    badgeColor = 'bg-green-100 text-green-800'
  }

  const totalDuration = end.getTime() - start.getTime()
  const elapsed = Math.max(0, now.getTime() - start.getTime())
  const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))

  return (
    <div className="space-y-6">
      {/* Exhibition Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {exhibition.title}
              </h1>
              <Badge variant="success" className={badgeColor}>
                {exhibitionStatus.charAt(0).toUpperCase() + exhibitionStatus.slice(1)}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{exhibition.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)}
                </span>
              </div>
              {exhibition.description && (
                <p className="text-gray-700 mt-2">{exhibition.description}</p>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="w-full sm:w-32">
            <div className="text-sm text-gray-600 mb-1">Progress</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {progress.toFixed(0)}% complete
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(stats.todayRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.todaySales} transactions
            </p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSales} transactions
            </p>
          </CardContent>
        </Card>

        {/* Products Sold */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalQuantitySold}
            </div>
            <p className="text-xs text-muted-foreground">
              of {stats.totalQuantityTaken} taken
            </p>
          </CardContent>
        </Card>

        {/* Sell-Through Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sell-Through</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.sellThroughRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalProducts} product types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* POS System */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href={`/exhibition/${exhibition.id}/pos`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                Point of Sale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Process sales, apply discounts, and handle payments
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-600">
                  Start New Sale
                </span>
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </div>
            </CardContent>
          </Link>
        </Card>

        {/* Product Inventory */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href={`/exhibition/${exhibition.id}/products`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                Product Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                View products, check stock, and update pricing
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-600">
                  View Products
                </span>
                <ArrowRight className="w-4 h-4 text-green-600" />
              </div>
            </CardContent>
          </Link>
        </Card>

        {/* Sales History */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href={`/exhibition/${exhibition.id}/sales`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Sales History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Review transactions and daily performance
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-purple-600">
                  View Sales
                </span>
                <ArrowRight className="w-4 h-4 text-purple-600" />
              </div>
            </CardContent>
          </Link>
        </Card>

        {/* Analytics Dashboard */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href={`/exhibition/${exhibition.id}/analytics`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Real-time insights, charts, and business intelligence
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-600">
                  View Analytics
                </span>
                <ArrowRight className="w-4 h-4 text-orange-600" />
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.totalSales > 0 ? (
            <div className="space-y-3">
              {exhibition.sales.slice(0, 5).map((sale: any) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Sale #{sale.saleNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        {sale.customerName || 'Walk-in customer'} • {new Date(sale.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatPrice(sale.finalTotal)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {sale.paymentMethod.toLowerCase().replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ))}
              
              {stats.totalSales > 5 && (
                <Link href={`/exhibition/${exhibition.id}/sales`}>
                  <Button variant="outline" className="w-full">
                    View All Sales ({stats.totalSales})
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-4">
                No sales recorded yet for this exhibition
              </p>
              <Link href={`/exhibition/${exhibition.id}/pos`}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Make First Sale
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Indicators */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <Users className="w-3 h-3 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              Exhibition Portal Active
            </h3>
            <p className="text-sm text-blue-700">
              You are connected to the mobile POS system. All sales will be recorded and synchronized with the main system.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}