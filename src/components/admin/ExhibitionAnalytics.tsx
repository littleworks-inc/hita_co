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
    category: { name: string }
  }
}

interface ExhibitionAnalyticsProps {
  exhibitionProducts: ExhibitionProduct[]
  participationFee: number
}

export default function ExhibitionAnalytics({ exhibitionProducts, participationFee }: ExhibitionAnalyticsProps) {
  // Calculate overall metrics
  const totalProductsTaken = exhibitionProducts.reduce((sum, p) => sum + p.quantityTaken, 0)
  const totalProductsSold = exhibitionProducts.reduce((sum, p) => sum + p.quantitySold, 0)
  const totalRevenue = exhibitionProducts.reduce((sum, p) => sum + (p.quantitySold * p.product.sellingPriceUSD), 0)
  const netProfit = totalRevenue - participationFee
  const sellThroughRate = totalProductsTaken > 0 ? (totalProductsSold / totalProductsTaken) * 100 : 0
  const avgOrderValue = totalProductsSold > 0 ? totalRevenue / totalProductsSold : 0
  const roi = participationFee > 0 ? ((netProfit / participationFee) * 100) : 0

  // Product performance analysis
  const productPerformance = exhibitionProducts.map(ep => ({
    ...ep,
    sellRate: ep.quantityTaken > 0 ? (ep.quantitySold / ep.quantityTaken) * 100 : 0,
    revenue: ep.quantitySold * ep.product.sellingPriceUSD,
    unsoldValue: (ep.quantityTaken - ep.quantitySold) * ep.product.sellingPriceUSD
  })).sort((a, b) => b.revenue - a.revenue)

  const topPerformers = productPerformance.filter(p => p.sellRate >= 80)
  const poorPerformers = productPerformance.filter(p => p.sellRate < 30 && p.quantityTaken > 0)

  // Category analysis
  const categoryStats = exhibitionProducts.reduce((acc, ep) => {
    const category = ep.product.category.name
    if (!acc[category]) {
      acc[category] = { taken: 0, sold: 0, revenue: 0 }
    }
    acc[category].taken += ep.quantityTaken
    acc[category].sold += ep.quantitySold
    acc[category].revenue += ep.quantitySold * ep.product.sellingPriceUSD
    return acc
  }, {} as Record<string, { taken: number; sold: number; revenue: number }>)

  const categoryPerformance = Object.entries(categoryStats).map(([category, stats]) => ({
    category,
    ...stats,
    sellRate: stats.taken > 0 ? (stats.sold / stats.taken) * 100 : 0
  })).sort((a, b) => b.revenue - a.revenue)

  const getPerformanceColor = (value: number, thresholds: { good: number; fair: number }) => {
    if (value >= thresholds.good) return 'text-green-600'
    if (value >= thresholds.fair) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceIcon = (value: number, thresholds: { good: number; fair: number }) => {
    if (value >= thresholds.good) return CheckCircle
    if (value >= thresholds.fair) return TrendingUp
    return AlertTriangle
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sell-Through Rate</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(sellThroughRate, { good: 70, fair: 50 })}`}>
                  {sellThroughRate.toFixed(1)}%
                </p>
              </div>
              {React.createElement(getPerformanceIcon(sellThroughRate, { good: 70, fair: 50 }), {
                className: `h-8 w-8 ${getPerformanceColor(sellThroughRate, { good: 70, fair: 50 })}`
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPrice(netProfit)}
                </p>
              </div>
              {netProfit >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ROI</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(roi, { good: 100, fair: 50 })}`}>
                  {roi.toFixed(1)}%
                </p>
              </div>
              <Target className={`h-8 w-8 ${getPerformanceColor(roi, { good: 100, fair: 50 })}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Item Value</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPrice(avgOrderValue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Top Performers (80%+ sell-through)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPerformers.length === 0 ? (
              <p className="text-gray-500 text-sm">No products with 80%+ sell-through rate</p>
            ) : (
              <div className="space-y-3">
                {topPerformers.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <div className="font-medium text-green-900">{product.product.name}</div>
                      <div className="text-sm text-green-700">
                        {product.quantitySold}/{product.quantityTaken} sold ({product.sellRate.toFixed(1)}%)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{formatPrice(product.revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Poor Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Needs Attention (&lt;30% sell-through)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {poorPerformers.length === 0 ? (
              <p className="text-gray-500 text-sm">All products performing well! 🎉</p>
            ) : (
              <div className="space-y-3">
                {poorPerformers.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div>
                      <div className="font-medium text-red-900">{product.product.name}</div>
                      <div className="text-sm text-red-700">
                        {product.quantitySold}/{product.quantityTaken} sold ({product.sellRate.toFixed(1)}%)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">{formatPrice(product.unsoldValue)}</div>
                      <div className="text-xs text-red-500">unsold value</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Category Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryPerformance.length === 0 ? (
            <p className="text-gray-500 text-sm">No category data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taken
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sold
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sell Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoryPerformance.map((category) => (
                    <tr key={category.category} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{category.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-900">{category.taken}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-900">{category.sold}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-sm font-medium ${getPerformanceColor(category.sellRate, { good: 70, fair: 50 })}`}>
                          {category.sellRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-gray-900">{formatPrice(category.revenue)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* ROI Analysis */}
            {roi > 100 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-900">Excellent ROI!</div>
                    <div className="text-sm text-green-700">
                      This exhibition generated {roi.toFixed(0)}% return on investment. Consider similar events.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {roi < 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-red-900">Loss on Investment</div>
                    <div className="text-sm text-red-700">
                      This exhibition didn't break even. Consider reducing participation fees or improving product selection.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sell-through Analysis */}
            {sellThroughRate < 50 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-900">Low Sell-Through Rate</div>
                    <div className="text-sm text-yellow-700">
                      Only {sellThroughRate.toFixed(1)}% of products sold. Consider bringing fewer quantities or different products.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {sellThroughRate >= 80 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-900">High Demand!</div>
                    <div className="text-sm text-blue-700">
                      {sellThroughRate.toFixed(1)}% sell-through suggests you could bring more inventory to similar events.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Category Insight */}
            {categoryPerformance.length > 0 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Star className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-purple-900">Best Category: {categoryPerformance[0].category}</div>
                    <div className="text-sm text-purple-700">
                      Generated {formatPrice(categoryPerformance[0].revenue)} with {categoryPerformance[0].sellRate.toFixed(1)}% sell-through.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Poor Performers Insight */}
            {poorPerformers.length > 0 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Package className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-orange-900">Inventory Optimization</div>
                    <div className="text-sm text-orange-700">
                      {poorPerformers.length} products had low sell-through rates. 
                      Total unsold value: {formatPrice(poorPerformers.reduce((sum, p) => sum + p.unsoldValue, 0))}.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}