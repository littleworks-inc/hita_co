import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import AdminNavigation from '@/components/admin/AdminNavigation'
import CurrencyManagement from '@/components/admin/CurrencyManagement'
import LoadingSpinner from '@/components/customer/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import {
  Globe,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Clock
} from 'lucide-react'

// Get exchange rates
async function getExchangeRates() {
  return await db.exchangeRate.findMany({
    where: { fromCurrency: 'USD' },
    orderBy: { toCurrency: 'asc' }
  })
}

// Exchange rates stats
async function ExchangeRatesStats() {
  const rates = await getExchangeRates()
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  
  const recentUpdates = rates.filter(rate => rate.lastUpdated > oneHourAgo)
  const oldRates = rates.filter(rate => rate.lastUpdated <= oneHourAgo)

  const stats = [
    {
      title: 'Total Currencies',
      value: rates.length + 1, // +1 for USD base
      icon: Globe,
      color: 'blue'
    },
    {
      title: 'Recent Updates',
      value: recentUpdates.length,
      icon: RefreshCw,
      color: 'green'
    },
    {
      title: 'Needs Update',
      value: oldRates.length,
      icon: Clock,
      color: oldRates.length > 0 ? 'orange' : 'gray'
    },
    {
      title: 'Auto Refresh',
      value: 'Enabled',
      icon: TrendingUp,
      color: 'purple'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 text-${stat.color}-600`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// Exchange rates data
async function ExchangeRatesData() {
  const rates = await getExchangeRates()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Exchange Rates Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CurrencyManagement rates={rates} />
      </CardContent>
    </Card>
  )
}

export default async function AdminCurrencyPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminNavigation />
      
      <main className="flex-1 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Currency Management</h1>
            <p className="text-gray-600">
              Manage exchange rates and currency settings for your store
            </p>
          </div>

          {/* Stats */}
          <Suspense fallback={<LoadingSpinner text="Loading stats..." />}>
            <ExchangeRatesStats />
          </Suspense>

          {/* Exchange Rates Management */}
          <Suspense fallback={<LoadingSpinner text="Loading exchange rates..." />}>
            <ExchangeRatesData />
          </Suspense>

          {/* Information Cards */}
          <div className="grid gap-6 lg:grid-cols-2 mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-green-600" />
                  Auto-Update Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>• Exchange rates update automatically every hour</p>
                  <p>• Manual refresh available for immediate updates</p>
                  <p>• Fallback rates ensure system always works</p>
                  <p>• Customer location detection for currency selection</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Important Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>• All product prices are stored in USD as base currency</p>
                  <p>• Customer sees converted prices in their local currency</p>
                  <p>• Exchange rates are cached for performance</p>
                  <p>• Free tier API has 1500 requests/month limit</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}