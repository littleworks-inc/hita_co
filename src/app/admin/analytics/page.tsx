import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import AdminNavigation from '@/components/admin/AdminNavigation'
import AnalyticsCharts from '@/components/admin/AnalyticsCharts'
import AnalyticsMetrics from '@/components/admin/AnalyticsMetrics'
import AnalyticsFilters from '@/components/admin/AnalyticsFilters'
import AnalyticsExport from '@/components/admin/AnalyticsExport'
import {
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Globe,
  Calendar,
  BarChart3,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

interface AnalyticsPageProps {
  searchParams: {
    period?: string
    startDate?: string
    endDate?: string
    currency?: string
  }
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  // Default to last 30 days if no period specified
  const period = searchParams.period || '30d'
  const currency = searchParams.currency || 'USD'

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="border-b border-gray-200 pb-5 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold leading-6 text-gray-900 flex items-center gap-2">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                    Analytics Dashboard
                  </h1>
                  <p className="mt-2 max-w-4xl text-sm text-gray-500">
                    Comprehensive business insights, sales trends, and performance metrics for your eCommerce platform.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Suspense fallback={<div>Loading...</div>}>
                    <AnalyticsExport period={period} currency={currency} />
                  </Suspense>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6">
              <Suspense fallback={<div>Loading filters...</div>}>
                <AnalyticsFilters 
                  defaultPeriod={period}
                  defaultCurrency={currency}
                  startDate={searchParams.startDate}
                  endDate={searchParams.endDate}
                />
              </Suspense>
            </div>

            {/* Quick Metrics Overview */}
            <div className="mb-8">
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
                <AnalyticsMetrics period={period} currency={currency} />
              </Suspense>
            </div>

            {/* Charts Section */}
            <div className="space-y-6">
              <Suspense fallback={
                <div className="grid gap-6 lg:grid-cols-2">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-64 bg-gray-200 rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              }>
                <AnalyticsCharts 
                  period={period} 
                  currency={currency}
                  startDate={searchParams.startDate}
                  endDate={searchParams.endDate}
                />
              </Suspense>
            </div>

            {/* Business Intelligence Summary */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Business Intelligence Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  }>
                    <AnalyticsInsights period={period} currency={currency} />
                  </Suspense>
                </CardContent>
              </Card>
            </div>

            {/* Performance Alerts */}
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Performance Alerts & Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  }>
                    <AnalyticsAlerts />
                  </Suspense>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Insights Component
async function AnalyticsInsights({ period, currency }: { period: string, currency: string }) {
  // This would fetch insights from your analytics API
  const insights = [
    {
      icon: TrendingUp,
      color: 'text-green-600',
      title: 'Revenue Growth',
      description: 'Sales increased by 23% compared to the previous period',
      impact: 'positive'
    },
    {
      icon: Package,
      color: 'text-blue-600', 
      title: 'Product Performance',
      description: 'Traditional Jewelry category is your top performer with 35% of total sales',
      impact: 'neutral'
    },
    {
      icon: Globe,
      color: 'text-purple-600',
      title: 'Geographic Insights',
      description: 'North American market shows 18% growth, consider expanding inventory',
      impact: 'positive'
    },
    {
      icon: Calendar,
      color: 'text-orange-600',
      title: 'Seasonal Trends',
      description: 'Exhibition sales contribute 28% of monthly revenue - optimize event strategy',
      impact: 'neutral'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {insights.map((insight, index) => {
        const Icon = insight.icon
        return (
          <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <div className={`p-2 rounded-lg bg-white`}>
              <Icon className={`h-5 w-5 ${insight.color}`} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{insight.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
            </div>
            {insight.impact === 'positive' && (
              <ArrowUp className="h-5 w-5 text-green-500" />
            )}
            {insight.impact === 'negative' && (
              <ArrowDown className="h-5 w-5 text-red-500" />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Alerts Component
async function AnalyticsAlerts() {
  const alerts = [
    {
      type: 'warning',
      icon: AlertCircle,
      title: 'Low Stock Alert',
      message: '12 products are running low on inventory',
      action: 'View Products',
      actionHref: '/admin/products?filter=low-stock'
    },
    {
      type: 'success',
      icon: CheckCircle,
      title: 'Revenue Target',
      message: "You've achieved 85% of this month's revenue goal",
      action: 'View Details',
      actionHref: '/admin/analytics?period=1m'
    },
    {
      type: 'info',
      icon: TrendingUp,
      title: 'Growth Opportunity',
      message: 'Consider expanding your Traditional Earrings category',
      action: 'Add Products',
      actionHref: '/admin/products/new'
    }
  ]

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => {
        const Icon = alert.icon
        const colorClasses = {
          warning: 'border-orange-200 bg-orange-50 text-orange-800',
          success: 'border-green-200 bg-green-50 text-green-800',
          info: 'border-blue-200 bg-blue-50 text-blue-800'
        }

        return (
          <div key={index} className={`flex items-center justify-between p-4 border rounded-lg ${colorClasses[alert.type as keyof typeof colorClasses]}`}>
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5" />
              <div>
                <h4 className="font-medium">{alert.title}</h4>
                <p className="text-sm opacity-90">{alert.message}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={alert.actionHref}>
                {alert.action}
              </a>
            </Button>
          </div>
        )
      })}
    </div>
  )
}