import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import AdminNavigation from '@/components/admin/AdminNavigation'
import AnalyticsCharts from '@/components/admin/AnalyticsCharts'
import AnalyticsMetrics from '@/components/admin/AnalyticsMetrics'
import AnalyticsFilters from '@/components/admin/AnalyticsFilters'
import AnalyticsExport from '@/components/admin/AnalyticsExport'
import AnalyticsInsights from '@/components/admin/AnalyticsInsights'
import AnalyticsAlerts from '@/components/admin/AnalyticsAlerts'
import AnalyticsRefreshButton from '@/components/admin/AnalyticsRefreshButton'
import {
  TrendingUp,
  BarChart3,
  AlertCircle
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
                  <AnalyticsRefreshButton />
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