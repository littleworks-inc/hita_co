// ✅ COMPLETELY FIXED: /src/app/exhibition/[id]/page.tsx
// Back to single query approach with correct field names from schema

// src/app/exhibition/[id]/page.tsx
// =====================================
// Exhibition Detail Page - Individual Exhibition View
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

// ✅ FIXED: Single query approach with correct schema field names
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
          items: true // ✅ Include all fields - no select clause to avoid type issues
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

  // ✅ FIXED: Top selling products - using correct schema fields
  const productSales = new Map<string, { name: string, sku: string, quantitySold: number, revenue: number }>()
  
  exhibition.sales.forEach(sale => {
    sale.items.forEach(item => {
      // ✅ Using correct schema fields that actually exist
      const productId = item.productId || 'unknown'
      const productName = item.productName || 'Unknown Product'  // This field exists in schema
      const productSku = item.productSku || 'N/A'               // This field exists in schema
      
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
      // ✅ Using lineTotal field which exists in schema, with fallback
      current.revenue += item.lineTotal || (item.finalPrice * item.quantity) || 0
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

// ✅ Proper TypeScript interface for ExhibitionProduct
interface ExhibitionProductWithRelations {
  id: string
  exhibitionId: string
  productId: string
  quantityTaken: number
  quantitySold: number
  exhibitionPrice?: number | null
  originalPrice?: number | null
  discountPercentage?: number | null
  isClearance: boolean
  product: {
    id: string
    name: string
    sku: string
    sellingPriceUSD: number
    discountPercentage: number
    images: string[]
    category: {
      id: string
      name: string
    }
    country: {
      id: string
      name: string
    }
  }
}

// Calculate pricing hierarchy for a product
function calculatePricingHierarchy(exhibitionProduct: ExhibitionProductWithRelations) {
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
          <Link href={`/exhibition/${exhibition.id}/products`}>
            <Button variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Manage Products
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPrice(stats.netProfit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sell-Through Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.sellThroughRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Products Performance
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
                      <tr key={exhibitionProduct.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {exhibitionProduct.product.images?.[0] ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={exhibitionProduct.product.images[0]}
                                  alt={exhibitionProduct.product.name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {exhibitionProduct.product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {exhibitionProduct.product.category.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm text-gray-900">
                            {exhibitionProduct.quantitySold} / {exhibitionProduct.quantityTaken}
                          </div>
                          <div className="text-xs text-gray-500">Sold / Taken</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {formatPrice(pricing.finalPrice)}
                          </div>
                          {pricing.totalSavings > 0 && (
                            <div className="text-xs text-green-600">
                              {pricing.savingsPercentage}% off
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            <div className="text-sm font-medium text-gray-900">
                              {sellRate}%
                            </div>
                            {sellRate >= 80 ? (
                              <CheckCircle className="ml-1 h-4 w-4 text-green-500" />
                            ) : sellRate >= 50 ? (
                              <Clock className="ml-1 h-4 w-4 text-yellow-500" />
                            ) : (
                              <AlertTriangle className="ml-1 h-4 w-4 text-red-500" />
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
            <div className="space-y-4">
              {stats.topSellingProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{formatPrice(product.revenue)}</div>
                    <div className="text-sm text-gray-500">{product.quantitySold} sold</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}