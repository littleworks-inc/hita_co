'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, Button, Input, Label } from '@/components/ui'
import {
  Calendar,
  Filter,
  RefreshCw,
  Download,
  TrendingUp,
  Clock,
  Globe
} from 'lucide-react'

interface AnalyticsFiltersProps {
  defaultPeriod: string
  defaultCurrency: string
  startDate?: string
  endDate?: string
}

export default function AnalyticsFilters({ 
  defaultPeriod, 
  defaultCurrency, 
  startDate, 
  endDate 
}: AnalyticsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod)
  const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency)
  const [customStartDate, setCustomStartDate] = useState(startDate || '')
  const [customEndDate, setCustomEndDate] = useState(endDate || '')
  const [showCustomDates, setShowCustomDates] = useState(!!startDate || !!endDate)

  const periodOptions = [
    { value: '7d', label: 'Last 7 days', icon: '📅' },
    { value: '30d', label: 'Last 30 days', icon: '📊' },
    { value: '90d', label: 'Last 3 months', icon: '📈' },
    { value: '1y', label: 'Last year', icon: '🗓️' },
    { value: 'custom', label: 'Custom range', icon: '🎯' }
  ]

  const currencyOptions = [
    { value: 'USD', label: 'USD ($)', flag: '🇺🇸' },
    { value: 'EUR', label: 'EUR (€)', flag: '🇪🇺' },
    { value: 'GBP', label: 'GBP (£)', flag: '🇬🇧' },
    { value: 'CAD', label: 'CAD ($)', flag: '🇨🇦' },
    { value: 'AUD', label: 'AUD ($)', flag: '🇦🇺' },
    { value: 'INR', label: 'INR (₹)', flag: '🇮🇳' }
  ]

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams)
    
    if (selectedPeriod === 'custom') {
      if (customStartDate) params.set('startDate', customStartDate)
      if (customEndDate) params.set('endDate', customEndDate)
      params.delete('period')
    } else {
      params.set('period', selectedPeriod)
      params.delete('startDate')
      params.delete('endDate')
    }
    
    params.set('currency', selectedCurrency)
    
    router.push(`/admin/analytics?${params.toString()}`)
  }

  const resetFilters = () => {
    setSelectedPeriod('30d')
    setSelectedCurrency('USD')
    setCustomStartDate('')
    setCustomEndDate('')
    setShowCustomDates(false)
    router.push('/admin/analytics')
  }

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    if (period === 'custom') {
      setShowCustomDates(true)
    } else {
      setShowCustomDates(false)
      setCustomStartDate('')
      setCustomEndDate('')
    }
  }

  const getDateRange = () => {
    const now = new Date()
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })

    if (showCustomDates && customStartDate && customEndDate) {
      return `${formatDate(new Date(customStartDate))} - ${formatDate(new Date(customEndDate))}`
    }

    switch (selectedPeriod) {
      case '7d':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return `${formatDate(weekAgo)} - ${formatDate(now)}`
      case '30d':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return `${formatDate(monthAgo)} - ${formatDate(now)}`
      case '90d':
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        return `${formatDate(quarterAgo)} - ${formatDate(now)}`
      case '1y':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        return `${formatDate(yearAgo)} - ${formatDate(now)}`
      default:
        return ''
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
          {/* Period Selection */}
          <div className="flex-1 space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Period
            </Label>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePeriodChange(option.value)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                    selectedPeriod === option.value
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
            
            {/* Date Range Display */}
            {getDateRange() && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <Calendar className="h-4 w-4" />
                <span>{getDateRange()}</span>
              </div>
            )}
          </div>

          {/* Currency Selection */}
          <div className="space-y-2 min-w-[150px]">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Currency
            </Label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.flag} {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={applyFilters}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Apply
            </Button>
            <Button 
              variant="outline" 
              onClick={resetFilters}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        {/* Custom Date Range */}
        {showCustomDates && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="startDate" className="text-sm font-medium">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  max={customEndDate || undefined}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="endDate" className="text-sm font-medium">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  min={customStartDate || undefined}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            
            <div className="mt-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>
                  Custom date range allows you to analyze specific periods and compare performance across different timeframes.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats Summary */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">
                Analyzing {selectedPeriod === 'custom' ? 'custom period' : periodOptions.find(p => p.value === selectedPeriod)?.label.toLowerCase()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <Globe className="h-4 w-4" />
              <span className="text-sm">
                {currencyOptions.find(c => c.value === selectedCurrency)?.label}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}