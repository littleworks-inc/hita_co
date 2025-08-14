// src/app/exhibition/[id]/analytics/page.tsx
// =====================================
// Exhibition Analytics Dashboard - Real-time Business Intelligence
// Mobile-first analytics interface for exhibition staff
// =====================================

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Clock,
  Users,
  Download,
  RefreshCw,
  BarChart3,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  Star,
  CreditCard,
  Smartphone,
  Banknote
} from 'lucide-react'

// Types for analytics data
interface AnalyticsData {
  exhibition: {
    id: string
    title: string
    location: string
    startDate: string
    endDate: string
  }
  metrics: {
    totalSales: number
    totalRevenue: number
    totalItems: number
    todayRevenue: number
    yesterdayRevenue: number
    todaySalesCount: number
    yesterdaySalesCount: number
    revenueChange: number
    salesChange: number
    totalQuantityTaken: number
    totalQuantitySold: number
    remainingInventory: number
    sellThroughRate: number
    averageOrderValue: number
    participationFee: number
    netProfit: number
    roi: number
  }
  hourlyTrend: Array<{
    hour: string
    sales: number
    revenue: number
    items: number
  }>
  topProducts: Array<{
    id: string
    name: string
    sku: string
    category: string
    image: string | null
    quantityTaken: number
    quantitySold: number
    revenue: number
    transactions: number
    sellRate: number
    exhibitionPrice: number
  }>
  paymentBreakdown: Array<{
    method: string
    amount: number
    percentage: number
    count: number
  }>
  categoryPerformance: Array<{
    category: string
    productCount: number
    quantityTaken: number
    quantitySold: number
    revenue: number
    transactions: number
    sellRate: number
    avgProductRevenue: number
  }>
  insights: {
    roi?: {
      type: 'success' | 'warning' | 'info'
      message: string
      recommendation: string
    }
    inventory?: {
      type: 'success' | 'warning' | 'info'
      message: string
      recommendation: string
    }
    timing?: {
      type: 'success' | 'warning' | 'info'
      message: string
      recommendation: string
    }
  }
  staffPerformance: any[]
  lastUpdated: string
  isEmpty?: boolean
}

interface ExhibitionAnalyticsProps {
  params: {
    id: string
  }
}

export default function ExhibitionAnalytics({ params }: ExhibitionAnalyticsProps) {
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState('24h')

  // Load analytics data
  const loadAnalytics = async (refresh = false) => {
    if (refresh) setRefreshing(true)
    setError('')

    try {
      const response = await fetch(`/api/exhibition/${params.id}/analytics?period=${period}`)
      
      if (!response.ok) {
        throw new Error('Failed to load analytics data')
      }
      
      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadAnalytics(true)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [params.id, period])

  // Export functionality
  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      // This would integrate with your export API
      const response = await fetch(`/api/exhibition/${params.id}/analytics/export?format=${format}&period=${period}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `exhibition-analytics-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => loadAnalytics()} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Empty state
  if (!analytics || analytics.isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="touch-target"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Analytics</h1>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Empty State */}
        <div className="flex items-center justify-center px-4 py-16">
          <div className="text-center max-w-md">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data</h3>
            <p className="text-gray-600 mb-4">
              Start making sales to see analytics and insights for this exhibition.
            </p>
            <Button 
              onClick={() => router.push(`/exhibition/${params.id}/pos`)}
              className="w-full"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Go to POS
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const { metrics, hourlyTrend, topProducts, paymentBreakdown, categoryPerformance, insights } = analytics

  // Chart colors
  const chartColors = {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    gray: '#6B7280'
  }

  const paymentMethodColors = {
    CASH: '#10B981',
    ZELLE: '#3B82F6', 
    CARD: '#8B5CF6',
    SPLIT_PAYMENT: '#F59E0B'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="touch-target"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">Analytics</h1>
            <p className="text-xs text-gray-500">{analytics.exhibition.title}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadAnalytics(true)}
              disabled={refreshing}
              className="touch-target"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleExport('csv')}
              className="touch-target"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Real-time Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Revenue */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(metrics.todayRevenue)}
                  </p>
                  <div className="flex items-center mt-1">
                    {metrics.revenueChange >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${metrics.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.revenueChange >= 0 ? '+' : ''}{metrics.revenueChange.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          {/* Today's Sales */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.todaySalesCount}</p>
                  <div className="flex items-center mt-1">
                    {metrics.salesChange >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${metrics.salesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.salesChange >= 0 ? '+' : ''}{metrics.salesChange.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <ShoppingCart className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* Sell-through Rate */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sell-through Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.sellThroughRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500">
                    {metrics.totalQuantitySold} of {metrics.totalQuantityTaken} sold
                  </p>
                </div>
                <Target className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          {/* ROI */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ROI</p>
                  <p className={`text-2xl font-bold ${metrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.roi.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatPrice(metrics.netProfit)} profit
                  </p>
                </div>
                <TrendingUp className={`w-8 h-8 ${metrics.roi >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hourly Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Hourly Sales Trend (Last 24 Hours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#666"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#666"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    formatter={(value, name) => [
                      name === 'revenue' ? formatPrice(Number(value)) : value,
                      name === 'revenue' ? 'Revenue' : 'Sales Count'
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="sales"
                    fill={chartColors.primary}
                    name="Sales Count"
                    radius={[2, 2, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={chartColors.success}
                    strokeWidth={3}
                    dot={{ fill: chartColors.success, strokeWidth: 2, r: 4 }}
                    name="Revenue ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Breakdown */}
        {paymentBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="amount"
                        label={(entry) => `${entry.percentage.toFixed(1)}%`}
                      >
                        {paymentBreakdown.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={paymentMethodColors[entry.method as keyof typeof paymentMethodColors] || chartColors.gray}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => formatPrice(Number(value))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-3">
                  {paymentBreakdown.map((method) => (
                    <div key={method.method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ 
                            backgroundColor: paymentMethodColors[method.method as keyof typeof paymentMethodColors] || chartColors.gray 
                          }}
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {method.method === 'SPLIT_PAYMENT' ? 'Split Payment' : method.method}
                          </p>
                          <p className="text-sm text-gray-500">{method.count} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatPrice(method.amount)}</p>
                        <p className="text-sm text-gray-500">{method.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Products */}
        {topProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Top Performing Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.slice(0, 5).map((product, index) => (
                  <div key={product.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                      {index + 1}
                    </div>
                    
                    {product.image && (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                      <p className="text-sm text-gray-500">{product.category} • {product.sku}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-600">
                          {product.quantitySold}/{product.quantityTaken} sold
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          {product.sellRate.toFixed(1)}% sell rate
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatPrice(product.revenue)}</p>
                      <p className="text-sm text-gray-500">{product.transactions} sales</p>
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
                <Package className="w-5 h-5" />
                Category Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="category" 
                      stroke="#666"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      stroke="#666"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      formatter={(value, name) => [
                        name === 'revenue' ? formatPrice(Number(value)) : value,
                        name === 'revenue' ? 'Revenue' : 'Sell Rate (%)'
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="revenue"
                      fill={chartColors.primary}
                      name="Revenue"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="sellRate"
                      fill={chartColors.secondary}
                      name="Sell Rate (%)"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Business Insights */}
        {Object.keys(insights).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Business Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(insights).map(([key, insight]) => (
                  <Alert key={key} className={`border-l-4 ${
                    insight.type === 'success' ? 'border-l-green-500 bg-green-50' :
                    insight.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
                    'border-l-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex">
                      {insight.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                      {insight.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
                      <div className="ml-3">
                        <AlertDescription>
                          <p className="font-medium mb-1">{insight.message}</p>
                          <p className="text-sm opacity-80">{insight.recommendation}</p>
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer with last updated */}
        <div className="text-center text-sm text-gray-500 py-4">
          Last updated: {new Date(analytics.lastUpdated).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}