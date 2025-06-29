'use client'

import { formatPrice } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Star
} from 'lucide-react'

interface ExhibitionProduct {
  id: string
  productId: string
  quantityTaken: number
  quantitySold: number
  product: {
    id: string
    name: string
    sku: string
    sellingPriceUSD: number
    discountPercentage?: number
    category?: { name: string } | null // ✅ Fixed: Made optional and nullable
  }
}

interface ExhibitionAnalyticsProps {
  exhibitionProducts: ExhibitionProduct[]
  participationFee: number
}

export default function ExhibitionAnalytics({ exhibitionProducts, participationFee }: ExhibitionAnalyticsProps) {
  // Calculate overall metrics with corrected pricing logic
  const totalProductsTaken = exhibitionProducts.reduce((sum, p) => sum + p.quantityTaken, 0)
  const totalProductsSold = exhibitionProducts.reduce((sum, p) => sum + p.quantitySold, 0)
  
  // ✅ Fixed: Use corrected pricing calculation (sellingPriceUSD is original price)
  const totalRevenue = exhibitionProducts.reduce((sum, p) => {
    const originalPrice = p.product.sellingPriceUSD
    const finalPrice = p.product.discountPercentage 
      ? originalPrice * (1 - p.product.discountPercentage / 100)
      : originalPrice
    return sum + (p.quantitySold * finalPrice)
  }, 0)
  
  const netProfit = totalRevenue - participationFee
  const sellThroughRate = totalProductsTaken > 0 ? (totalProductsSold / totalProductsTaken) * 100 : 0
  const avgOrderValue = totalProductsSold > 0 ? totalRevenue / totalProductsSold : 0
  const roi = participationFee > 0 ? ((netProfit / participationFee) * 100) : 0

  // Product performance analysis with corrected pricing
  const productPerformance = exhibitionProducts.map(ep => {
    const originalPrice = ep.product.sellingPriceUSD
    const finalPrice = ep.product.discountPercentage 
      ? originalPrice * (1 - ep.product.discountPercentage / 100)
      : originalPrice
    
    return {
      ...ep,
      sellRate: ep.quantityTaken > 0 ? (ep.quantitySold / ep.quantityTaken) * 100 : 0,
      revenue: ep.quantitySold * finalPrice,
      unsoldValue: (ep.quantityTaken - ep.quantitySold) * finalPrice
    }
  }).sort((a, b) => b.revenue - a.revenue)

  const topPerformers = productPerformance.filter(p => p.sellRate >= 80)
  const poorPerformers = productPerformance.filter(p => p.sellRate < 30 && p.quantityTaken > 0)

  // ✅ Fixed: Category analysis with proper error handling
  const categoryStats = exhibitionProducts.reduce((acc, ep) => {
    // ✅ Fixed: Handle missing or null category
    const categoryName = ep.product.category?.name || 'Uncategorized'
    
    if (!acc[categoryName]) {
      acc[categoryName] = { taken: 0, sold: 0, revenue: 0 }
    }
    
    // ✅ Fixed: Use corrected pricing calculation
    const originalPrice = ep.product.sellingPriceUSD
    const finalPrice = ep.product.discountPercentage 
      ? originalPrice * (1 - ep.product.discountPercentage / 100)
      : originalPrice
    
    acc[categoryName].taken += ep.quantityTaken
    acc[categoryName].sold += ep.quantitySold
    acc[categoryName].revenue += ep.quantitySold * finalPrice
    return acc
  }, {} as Record<string, { taken: number; sold: number; revenue: number }>)

  const categoryPerformance = Object.entries(categoryStats).map(([category, stats]) => ({
    category,
    ...stats,
    sellRate: stats.taken > 0 ? (stats.sold / stats.taken) * 100 : 0
  })).sort((a, b) => b.revenue - a.revenue)

  // ✅ Fixed: Performance indicators
  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 50) return 'text-blue-600'
    if (rate >= 30) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceIcon = (rate: number) => {
    if (rate >= 80) return TrendingUp
    if (rate >= 50) return CheckCircle
    if (rate >= 30) return AlertTriangle
    return TrendingDown
  }

  return (
    <div className="space-y-6">
      {/* Overall Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {totalProductsSold} items sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPrice(netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              After {formatPrice(participationFee)} fee
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sell-Through Rate</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(sellThroughRate)}`}>
              {sellThroughRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {totalProductsSold} of {totalProductsTaken} sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <Star className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {roi.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Return on investment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Top Performers (80%+ Sell Rate)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50">
                  <div>
                    <div className="font-medium text-green-900">{product.product.name}</div>
                    <div className="text-sm text-green-700">
                      SKU: {product.product.sku} • {product.quantitySold}/{product.quantityTaken} sold
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{formatPrice(product.revenue)}</div>
                    <div className="text-sm text-green-600">{product.sellRate.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Performance */}
      {categoryPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Category Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryPerformance.map((category) => {
                const PerformanceIcon = getPerformanceIcon(category.sellRate)
                return (
                  <div key={category.category} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <PerformanceIcon className={`h-5 w-5 ${getPerformanceColor(category.sellRate)}`} />
                      <div>
                        <div className="font-medium">{category.category}</div>
                        <div className="text-sm text-gray-600">
                          {category.sold}/{category.taken} sold
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatPrice(category.revenue)}</div>
                      <div className={`text-sm ${getPerformanceColor(category.sellRate)}`}>
                        {category.sellRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Poor Performers Alert */}
      {poorPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Products Needing Attention (&lt;30% Sell Rate)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {poorPerformers.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <div className="font-medium text-red-900">{product.product.name}</div>
                    <div className="text-sm text-red-700">
                      SKU: {product.product.sku} • {product.quantitySold}/{product.quantityTaken} sold
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-red-600">{formatPrice(product.unsoldValue)} unsold</div>
                    <div className="text-sm text-red-600">{product.sellRate.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Exhibition Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Total Products:</span>
              <span className="font-medium">{exhibitionProducts.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Items Taken:</span>
              <span className="font-medium">{totalProductsTaken}</span>
            </div>
            <div className="flex justify-between">
              <span>Items Sold:</span>
              <span className="font-medium">{totalProductsSold}</span>
            </div>
            <div className="flex justify-between">
              <span>Average Order Value:</span>
              <span className="font-medium">{formatPrice(avgOrderValue)}</span>
            </div>
            <div className="flex justify-between">
              <span>Categories:</span>
              <span className="font-medium">{categoryPerformance.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}