// ✅ FIXED: src/app/admin/currency/page.tsx
// Updated to work with Country model instead of non-existent ExchangeRate model

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

// ✅ FIXED: Get exchange rates from Country model
async function getExchangeRates() {
  return await db.country.findMany({
    where: { 
      exchangeRate: { not: null }
    },
    select: {
      id: true,
      name: true,
      code: true,
      currency: true,
      currencySymbol: true,
      exchangeRate: true,
      updatedAt: true,
      createdAt: true
    },
    orderBy: { name: 'asc' }
  })
}

// ✅ FIXED: Exchange rates stats using Country model
async function ExchangeRatesStats() {
  const countries = await getExchangeRates()
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  
  const recentUpdates = countries.filter(country => country.updatedAt > oneHourAgo)
  const oldRates = countries.filter(country => country.updatedAt <= oneHourAgo)

  const stats = [
    {
      title: 'Total Currencies',
      value: countries.length + 1, // +1 for USD base
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

// ✅ FIXED: Exchange rates data using Country model
async function ExchangeRatesData() {
  const countries = await getExchangeRates()

  // Transform country data to match the expected rate format
  const rates = countries.map(country => ({
    id: country.id,
    fromCurrency: 'USD',
    toCurrency: country.currency,
    rate: country.exchangeRate || 1,
    lastUpdated: country.updatedAt,
    createdAt: country.createdAt,
    updatedAt: country.updatedAt,
    countryName: country.name,
    countryCode: country.code,
    currencySymbol: country.currencySymbol
  }))

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
                  <p>• Exchange rates are stored in Country settings</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}