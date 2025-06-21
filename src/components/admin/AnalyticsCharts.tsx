'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
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
  AlertTriangle
} from 'lucide-react'

interface ChartData {
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
      // Set mock data for development
      setData({
        salesTrend: [
          { date: '2024-01-01', revenue: 12420, orders: 89, averageOrderValue: 139.55 },
          { date: '2024-01-02', revenue: 15680, orders: 112, averageOrderValue: 140.00 },
          { date: '2024-01-03', revenue: 13250, orders: 95, averageOrderValue: 139.47 },
          { date: '2024-01-04', revenue: 18900, orders: 135, averageOrderValue: 140.00 },
          { date: '2024-01-05', revenue: 16750, orders: 120, averageOrderValue: 139.58 },
          { date: '2024-01-06', revenue: 21200, orders: 152, averageOrderValue: 139.47 },
          { date: '2024-01-07', revenue: 19650, orders: 141, averageOrderValue: 139.36 }
        ],
        categoryPerformance: [
          { category: 'Traditional Jewelry', revenue: 28500, orders: 204, products: 45 },
          { category: 'Ethnic Wear', revenue: 22100, orders: 158, products: 38 },
          { category: 'Home Decor', revenue: 15600, orders: 112, products: 29 },
          { category: 'Accessories', revenue: 12800, orders: 92, products: 34 },
          { category: 'Lifestyle', revenue: 8900, orders: 64, products: 18 }
        ],
        geographicData: [
          { country: 'United States', revenue: 35200, orders: 252, customers: 189 },
          { country: 'Canada', revenue: 18900, orders: 135, customers: 98 },
          { country: 'United Kingdom', revenue: 15600, orders: 112, customers: 87 },
          { country: 'Australia', revenue: 12100, orders: 87, customers: 65 },
          { country: 'Germany', revenue: 8800, orders: 63, customers: 52 }
        ],
        inventoryStatus: [
          { status: 'In Stock', count: 128, percentage: 82.1 },
          { status: 'Low Stock', count: 18, percentage: 11.5 },
          { status: 'Out of Stock', count: 10, percentage: 6.4 }
        ]
      })
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  // Color palettes for charts
  const colors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
    teal: '#14B8A6',
    orange: '#F97316'
  }

  const pieColors = [colors.primary, colors.secondary, colors.danger]

  return (
    <div className="space-y-6">
      {/* Sales Trend Chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Sales Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#666"
                  fontSize={12}
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
                  labelFormatter={(label) => `Date: ${formatDate(label)}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={colors.primary}
                  fill={colors.primary}
                  fillOpacity={0.1}
                  strokeWidth={2}
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke={colors.secondary}
                  strokeWidth={2}
                  name="Orders"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Inventory Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Inventory Status
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                    `${value} products (${props.payload.percentage}%)`,
                    props.payload.status
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance & Geographic Data */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              Category Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                <Bar dataKey="revenue" fill={colors.purple} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-teal-600" />
              Geographic Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                <Legend />
                <Bar dataKey="revenue" fill={colors.teal} radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="orders" fill={colors.orange} radius={[4, 4, 0, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance Metrics */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Daily Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#666"
                  fontSize={10}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={10}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  labelFormatter={(label) => `Date: ${formatDate(label)}`}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={colors.orange}
                  strokeWidth={3}
                  dot={{ fill: colors.orange, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: colors.orange, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Performing Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.categoryPerformance.slice(0, 3).map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: [colors.purple, colors.teal, colors.orange][index] }}></div>
                    <span className="text-sm font-medium text-gray-900">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(category.revenue)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {category.orders} orders
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.geographicData.slice(0, 3).map((country, index) => (
                <div key={country.country} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: [colors.primary, colors.secondary, colors.accent][index] }}></div>
                    <span className="text-sm font-medium text-gray-900">{country.country}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(country.revenue)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {country.customers} customers
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}