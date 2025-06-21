'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  Globe,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'

interface MetricsData {
  revenue: {
    current: number
    previous: number
    change: number
    changeType: 'increase' | 'decrease' | 'neutral'
  }
  orders: {
    current: number
    previous: number
    change: number
    changeType: 'increase' | 'decrease' | 'neutral'
  }
  products: {
    total: number
    active: number
    lowStock: number
    outOfStock: number
  }
  performance: {
    conversionRate: number
    averageOrderValue: number
    topCategory: string
    topCountry: string
  }
}

interface AnalyticsMetricsProps {
  period: string
  currency: string
}

export default function AnalyticsMetrics({ period, currency }: AnalyticsMetricsProps) {
  const [data, setData] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMetrics()
  }, [period, currency])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics/metrics?period=${period}&currency=${currency}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch metrics')
      }
      
      const metricsData = await response.json()
      setData(metricsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics')
      // Set mock data for development
      setData({
        revenue: {
          current: 45230.50,
          previous: 38150.25,
          change: 18.5,
          changeType: 'increase'
        },
        orders: {
          current: 324,
          previous: 289,
          change: 12.1,
          changeType: 'increase'
        },
        products: {
          total: 156,
          active: 142,
          lowStock: 12,
          outOfStock: 2
        },
        performance: {
          conversionRate: 3.2,
          averageOrderValue: 139.60,
          topCategory: 'Traditional Jewelry',
          topCountry: 'United States'
        }
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">Error loading metrics: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const formatPercentage = (num: number) => {
    return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`
  }

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />
      case 'decrease':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600'
      case 'decrease':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const metrics = [
    {
      title: 'Total Revenue',
      value: formatCurrency(data.revenue.current),
      change: formatPercentage(data.revenue.change),
      changeType: data.revenue.changeType,
      icon: DollarSign,
      description: `vs ${formatCurrency(data.revenue.previous)} last period`
    },
    {
      title: 'Total Orders',
      value: formatNumber(data.orders.current),
      change: formatPercentage(data.orders.change),
      changeType: data.orders.changeType,
      icon: ShoppingCart,
      description: `vs ${formatNumber(data.orders.previous)} last period`
    },
    {
      title: 'Active Products',
      value: formatNumber(data.products.active),
      change: data.products.lowStock > 0 ? `${data.products.lowStock} low stock` : 'All stocked',
      changeType: data.products.lowStock > 0 ? 'decrease' : 'neutral',
      icon: Package,
      description: `${data.products.total} total products`
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(data.performance.averageOrderValue),
      change: `${data.performance.conversionRate}% conversion`,
      changeType: 'neutral',
      icon: TrendingUp,
      description: `Top: ${data.performance.topCategory}`
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.title}
              </CardTitle>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Icon className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-900">
                  {metric.value}
                </div>
                <div className="flex items-center gap-2">
                  {getChangeIcon(metric.changeType)}
                  <span className={`text-sm font-medium ${getChangeColor(metric.changeType)}`}>
                    {metric.change}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {metric.description}
                </p>
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
  )
}