// src/app/exhibition/[id]/page.tsx
// =====================================
// 🔥 NEW: Exhibition Detail Page - Individual Exhibition View
// Shows exhibition-specific products, pricing, and performance metrics
// =====================================

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui'
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  MapPin,
  Calendar,
  Users,
  BarChart3,
  Tag,
  CheckCircle,
  AlertTriangle,
  Eye,
  Percent,
  Star
} from 'lucide-react'

interface ExhibitionDetailProps {
  params: {
    id: string
  }
}

// Get exhibition with detailed stats
async function getExhibitionDetail(exhibitionId: string) {
  const exhibition = await db.exhibition.findUnique({
    where: { id: exhibitionId, isActive: true },
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
        where: { isCompleted: true },
        include: {
          items: {
            include: {
              exhibitionProduct: {
                include: {
                  product: {
                    select: {
                      name: true,
                      sku: true
                    }
                  }
                }
              }
            }
          }
        }
      },
      _count: {
        select: {
          products: true,
          sales: true
        }
      }
    }
  })

  if (!exhibition) return null

  // Calculate detailed stats
  const now = new Date()
  const startDate = new Date(exhibition.startDate)
  const endDate = new Date(exhibition.endDate)

  // Status calculation
  let status: 'upcoming' | 'ongoing' | 'completed' = 'completed'
  if (startDate > now) status = 'upcoming'
  else if (endDate >= now) status = 'ongoing'

  // Financial metrics
  const totalRevenue = exhibition.sales.reduce((sum, sale) => sum + sale.total, 0)
  const netProfit = totalRevenue - exhibition.participationFee
  const roi = exhibition.participationFee > 0 ? 
    Math.round(((totalRevenue - exhibition.participationFee) / exhibition.participationFee) * 100) : 
    (totalRevenue > 0 ? 100 : 0)

  // Product metrics
  const totalProductsTaken = exhibition.products.reduce((sum, p) => sum + p.quantityTaken, 0)
  const totalProductsSold = exhibition.products.reduce((sum, p) => sum + p.quantitySold, 0)
  const sellThroughRate = totalProductsTaken > 0 ? 
    Math.round((totalProductsSold / totalProductsTaken) * 100) : 0

  // Top selling products
  const productSales = new Map<string, { name: string, sku: string, quantitySold: number, revenue: number }>()
  
  exhibition.sales.forEach(sale => {
    sale.items.forEach(item => {
      const productId = item.exhibitionProduct?.product?.id || 'unknown'
      const productName = item.exhibitionProduct?.product?.name || 'Unknown Product'
      const productSku = item.exhibitionProduct?.product?.sku || 'N/A'
      
      if (!productSales.has(productId)) {
        productSales.set(productId, {
          name: productName,
          sku: productSku,
          quantitySold: 0,
          revenue: 0
        })
      }
      
      const current = productSales.get(productId)!
      current.quantitySold += item.quantity
      current.revenue += item.totalPrice
    })
  })

  const topSellingProducts = Array.from(productSales.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  return {
    exhibition,
    stats: {
      status,
      totalRevenue,
      netProfit,
      roi,
      totalProductsTaken,
      totalProductsSold,
      sellThroughRate,
      averageOrderValue: exhibition.sales.length > 0 ? totalRevenue / exhibition.sales.length : 0,
      totalSales: exhibition.sales.length,
      topSellingProducts
    }
  }
}

// Calculate pricing hierarchy for a product
function calculatePricingHierarchy(exhibitionProduct: any) {
  const product = exhibitionProduct.product
  const storeOriginalPrice = product.sellingPriceUSD
  const storeDiscountedPrice = storeOriginalPrice * (1 - (product.discountPercentage || 0) / 100)
  
  // Exhibition price override or use store price
  const exhibitionBasePrice = exhibitionProduct.exhibitionPrice || storeDiscountedPrice
  
  // Apply exhibition discount
  const exhibitionDiscountedPrice = exhibitionBasePrice * (1 - (exhibitionProduct.discountPercentage || 0) / 100)
  
  // Apply clearance discount (additional 20% if clearance)
  const finalPrice = exhibitionProduct.isClearance ? 
    exhibitionDiscountedPrice * 0.8 : 
    exhibitionDiscountedPrice

  const totalSavings = storeOriginalPrice - finalPrice

  return {
    storeOriginalPrice,
    storeDiscountedPrice,
    exhibitionBasePrice,
    exhibitionDiscountedPrice,
    finalPrice,
    totalSavings,
    savingsPercentage: Math.round((totalSavings / storeOriginalPrice) * 100)
  }
}

export default async function ExhibitionDetailPage({ params }: ExhibitionDetailProps) {
  const session = await getSession()
  
  if (!session) {
    redirect('/exhibition/login')
  }

  const data = await getExhibitionDetail(params.id)
  
  if (!data) {
    notFound()
  }

  const { exhibition, stats } = data

  const StatusBadge = ({ status }: { status: 'ongoing' | 'upcoming' | 'completed' }) => {
    const configs = {
      ongoing: { label: 'Ongoing', icon: CheckCircle, className: 'bg-green-100 text-green-800' },
      upcoming: { label: 'Upcoming', icon: Clock, className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completed', icon: CheckCircle, className: 'bg-gray-100 text-gray-800' }
    }
    
    const config = configs[status]
    const Icon = config.icon
    
    return (
      <Badge className={`flex items-center gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/exhibition">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Exhibitions
          </Button>
        </Link>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {exhibition.title}
            </h1>
            <StatusBadge status={stats.status} />
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {exhibition.location}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {stats.status === 'ongoing' && (
            <Link href={`/exhibition/${exhibition.id}/pos`}>
              <Button>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Open POS
              </Button>
            </Link>
          )}
          <Link href={`/exhibition/${exhibition.id}/sales`}>
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Sales
            </Button>
          </Link>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPrice(stats.netProfit)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sell-Through Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.sellThroughRate}%</p>
              </div>
              <Percent className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exhibition Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Exhibition Products ({exhibition.products.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {exhibition.products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No products added to this exhibition yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pricing
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {exhibition.products.map((exhibitionProduct) => {
                    const pricing = calculatePricingHierarchy(exhibitionProduct)
                    const sellRate = exhibitionProduct.quantityTaken > 0 ? 
                      Math.round((exhibitionProduct.quantitySold / exhibitionProduct.quantityTaken) * 100) : 0

                    return (
                      <tr key={exhibitionProduct.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {exhibitionProduct.product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {exhibitionProduct.product.category.name} • {exhibitionProduct.product.country.name}
                              </div>
                              {exhibitionProduct.isClearance && (
                                <Badge className="mt-1 bg-red-100 text-red-800">
                                  <Tag className="h-3 w-3 mr-1" />
                                  Clearance
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {exhibitionProduct.quantitySold} / {exhibitionProduct.quantityTaken}
                            </div>
                            <div className="text-gray-500">
                              {sellRate}% sold
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {formatPrice(pricing.finalPrice)}
                            </div>
                            {pricing.totalSavings > 0 && (
                              <div className="text-green-600">
                                Save {formatPrice(pricing.totalSavings)} ({pricing.savingsPercentage}%)
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center">
                            {sellRate >= 75 ? (
                              <Badge className="bg-green-100 text-green-800">
                                <Star className="h-3 w-3 mr-1" />
                                Excellent
                              </Badge>
                            ) : sellRate >= 50 ? (
                              <Badge className="bg-blue-100 text-blue-800">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Good
                              </Badge>
                            ) : sellRate >= 25 ? (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Slow
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Poor
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Selling Products */}
      {stats.topSellingProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Top Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topSellingProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-600">SKU: {product.sku}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{formatPrice(product.revenue)}</div>
                    <div className="text-sm text-gray-600">{product.quantitySold} units sold</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exhibition Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Exhibition Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Financial Performance</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Participation Fee:</span>
                  <span className="font-medium">{formatPrice(exhibition.participationFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Revenue:</span>
                  <span className="font-medium">{formatPrice(stats.totalRevenue)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Net Profit:</span>
                  <span className={`font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPrice(stats.netProfit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ROI:</span>
                  <span className={`font-medium ${stats.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.roi}%
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Product Performance</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Products Taken:</span>
                  <span className="font-medium">{stats.totalProductsTaken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Products Sold:</span>
                  <span className="font-medium">{stats.totalProductsSold}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Sell-Through Rate:</span>
                  <span className="font-bold">{stats.sellThroughRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Order Value:</span>
                  <span className="font-medium">{formatPrice(stats.averageOrderValue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {exhibition.description && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600">{exhibition.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}