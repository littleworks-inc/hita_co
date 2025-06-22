'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  TrendingUp,
  Package,
  Globe,
  Calendar,
  AlertTriangle,
  ShoppingCart,
  BarChart3,
  Plus,
  ExternalLink
} from 'lucide-react'

interface ChartData {
  isEmpty?: boolean
  emptyStateType?: 'no_products' | 'no_orders'
  message?: string
  salesTrend: Array<{
    date: string
    revenue: number
    orders: number
    averageOrderValue: number
  }>
  categoryPerformance: Array<{
    category: string
    revenue: number
    orders: number
    products: number
  }>
  geographicData: Array<{
    country: string
    revenue: number
    orders: number
    customers: number
  }>
  inventoryStatus: Array<{
    status: string
    count: number
    percentage: number
  }>
}

interface AnalyticsChartsProps {
  period: string
  currency: string
  startDate?: string
  endDate?: string
}

export default function AnalyticsCharts({ period, currency, startDate, endDate }: AnalyticsChartsProps) {
  const [data, setData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchChartData()
  }, [period, currency, startDate, endDate])

  const fetchChartData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        period,
        currency,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      })
      
      const response = await fetch(`/api/admin/analytics/charts?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch chart data')
      }
      
      const chartData = await response.json()
      setData(chartData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load charts')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-64 bg-gray-200 rounded"></div>
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
          <p className="text-red-600">Error loading charts: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  // Show empty state for fresh systems
  if (data.isEmpty) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Empty State Cards */}
        {[
          {
            title: 'Sales Trend',
            icon: TrendingUp,
            description: data.emptyStateType === 'no_products' 
              ? 'Add products to track sales over time'
              : 'Sales trend will appear here once orders start coming in'
          },
          {
            title: 'Category Performance',
            icon: Package,
            description: data.emptyStateType === 'no_products'
              ? 'Product categories will be ranked by performance'
              : 'Category revenue comparison will show here'
          },
          {
            title: 'Geographic Sales',
            icon: Globe,
            description: 'Order locations will be mapped once sales begin'
          },
          {
            title: 'Inventory Status',
            icon: BarChart3,
            description: data.emptyStateType === 'no_products'
              ? 'Inventory distribution will be tracked here'
              : 'Stock levels overview will appear here'
          }
        ].map((chart, index) => {
          const Icon = chart.icon
          return (
            <Card key={index} className="border-2 border-dashed border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-600">
                  <Icon className="h-5 w-5" />
                  {chart.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <div className="p-4 rounded-full bg-gray-100 mb-4">
                    <Icon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-4 max-w-xs">
                    {chart.description}
                  </p>
                  {data.emptyStateType === 'no_products' && index === 0 && (
                    <Link href="/admin/products/new">
                      <Button size="sm" className="flex items-center gap-2">
                        <Plus className="h-3 w-3" />
                        Add Product
                      </Button>
                    </Link>
                  )}
                  {data.emptyStateType === 'no_orders' && index === 0 && (
                    <Link href="/">
                      <Button size="sm" className="flex items-center gap-2">
                        <ExternalLink className="h-3 w-3" />
                        View Store
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // Show real charts with data
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Sales Trend Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Sales Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.salesTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#666"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={12}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatCurrency(value) : value,
                    name === 'revenue' ? 'Revenue' : name === 'orders' ? 'Orders' : 'Avg Order Value'
                  ]}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Orders"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No sales data available for the selected period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            Category Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.categoryPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.categoryPerformance} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  type="number"
                  stroke="#666"
                  fontSize={12}
                  tickFormatter={formatCurrency}
                />
                <YAxis 
                  type="category"
                  dataKey="category"
                  stroke="#666"
                  fontSize={12}
                  width={100}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatCurrency(value) : value,
                    name === 'revenue' ? 'Revenue' : name === 'orders' ? 'Orders' : 'Products'
                  ]}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#8b5cf6" 
                  name="Revenue"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No category sales data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geographic Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            Geographic Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.geographicData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.geographicData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="country"
                  stroke="#666"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={12}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatCurrency(value) : value,
                    name === 'revenue' ? 'Revenue' : name === 'orders' ? 'Orders' : 'Customers'
                  ]}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#10b981" 
                  name="Revenue"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No geographic sales data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Status - Show even if no orders */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            Inventory Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.inventoryStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.inventoryStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {data.inventoryStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `${value} products (${props.payload.percentage.toFixed(1)}%)`,
                    props.payload.status
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-500">
              <Package className="h-12 w-12 mb-4 text-gray-300" />
              <p>No products in inventory</p>
              <Link href="/admin/products/new">
                <Button size="sm" className="mt-3 flex items-center gap-2">
                  <Plus className="h-3 w-3" />
                  Add Product
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}