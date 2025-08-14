'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SUPPORTED_CURRENCIES } from '@/lib/currency'
import { Button } from '@/components/ui'
import {
  RefreshCw,
  Globe,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

interface ExchangeRate {
  id: string
  fromCurrency: string
  toCurrency: string
  rate: number
  lastUpdated: Date
  createdAt: Date
  updatedAt: Date
}

interface CurrencyManagementProps {
  rates: ExchangeRate[]
}

export default function CurrencyManagement({ rates }: CurrencyManagementProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefreshRates = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/currency/rates', {
        method: 'POST'
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to refresh exchange rates')
      }
    } catch (error) {
      console.error('Error refreshing rates:', error)
      alert('Error refreshing exchange rates')
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusColor = (lastUpdated: Date) => {
    const now = new Date()
    const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)

    if (hoursSinceUpdate < 1) return 'text-green-600'
    if (hoursSinceUpdate < 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusIcon = (lastUpdated: Date) => {
    const now = new Date()
    const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)

    if (hoursSinceUpdate < 1) return CheckCircle
    if (hoursSinceUpdate < 6) return Clock
    return AlertTriangle
  }

  const formatLastUpdated = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  // Add USD as base currency
  const allRates = [
    {
      id: 'usd-base',
      fromCurrency: 'USD',
      toCurrency: 'USD',
      rate: 1,
      lastUpdated: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    ...rates
  ]

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Current Exchange Rates</h3>
          <p className="text-sm text-gray-500">Base currency: USD</p>
        </div>
        
        <Button
          onClick={handleRefreshRates}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Rates'}
        </Button>
      </div>

      {/* Exchange Rates Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Currency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate (1 USD =)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allRates.map((rate) => {
              const currency = SUPPORTED_CURRENCIES[rate.toCurrency as keyof typeof SUPPORTED_CURRENCIES]
              const StatusIcon = getStatusIcon(rate.lastUpdated)
              const statusColor = getStatusColor(rate.lastUpdated)

              return (
                <tr key={rate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{currency?.flag}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {rate.toCurrency}
                        </div>
                        <div className="text-sm text-gray-500">
                          {currency?.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {currency?.symbol}{rate.rate.toLocaleString(undefined, {
                        minimumFractionDigits: rate.toCurrency === 'JPY' ? 0 : 2,
                        maximumFractionDigits: rate.toCurrency === 'JPY' ? 0 : 4
                      })}
                    </div>
                    {rate.toCurrency !== 'USD' && (
                      <div className="text-xs text-gray-500">
                        1 {rate.toCurrency} = ${(1 / rate.rate).toFixed(4)} USD
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center gap-1 ${statusColor}`}>
                      <StatusIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {rate.toCurrency === 'USD' ? 'Base' : 
                         getStatusColor(rate.lastUpdated) === 'text-green-600' ? 'Current' :
                         getStatusColor(rate.lastUpdated) === 'text-yellow-600' ? 'Outdated' : 'Stale'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rate.toCurrency === 'USD' ? 'Always current' : formatLastUpdated(rate.lastUpdated)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total Currencies</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{allRates.length}</div>
          <div className="text-xs text-blue-700">Including USD base</div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Current Rates</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {allRates.filter(r => getStatusColor(r.lastUpdated) === 'text-green-600').length}
          </div>
          <div className="text-xs text-green-700">Updated within 1 hour</div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Needs Update</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {allRates.filter(r => getStatusColor(r.lastUpdated) === 'text-red-600').length}
          </div>
          <div className="text-xs text-orange-700">Older than 6 hours</div>
        </div>
      </div>

      {/* API Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Exchange Rate API Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
          <div>
            <strong>Provider:</strong> ExchangeRate-API.com<br />
            <strong>Update Frequency:</strong> Every hour<br />
            <strong>Base Currency:</strong> USD
          </div>
          <div>
            <strong>Rate Limit:</strong> 1,500 requests/month<br />
            <strong>Fallback:</strong> Stored rates available<br />
            <strong>Accuracy:</strong> Real-time market rates
          </div>
        </div>
      </div>
    </div>
  )
}