// src/app/exhibition/[id]/sales/page.tsx
// =====================================
// Exhibition Sales History - Transaction Review Interface
// Mobile-optimized view for reviewing past sales and daily performance
// =====================================

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Receipt,
  TrendingUp,
  Users,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  CreditCard,
  Smartphone,
  Banknote,
  Tag,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react'

// Types based on API response
interface ExhibitionSale {
  id: string
  saleNumber: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  subtotal: number
  customDiscount: number
  bundleDiscount: number
  finalTotal: number
  paymentMethod: 'CASH' | 'ZELLE' | 'CARD' | 'SPLIT_PAYMENT'
  cashAmount?: number
  zelleAmount?: number
  cardAmount?: number
  bargainApplied: boolean
  bargainReason?: string
  salesPersonNotes?: string
  createdAt: string
  items: {
    id: string
    productName: string
    productSku: string
    quantity: number
    finalPrice: number
    lineTotal: number
  }[]
}

interface SalesData {
  exhibition: {
    id: string
    title: string
    location: string
    startDate: string
    endDate: string
  }
  sales: ExhibitionSale[]
  summary: {
    totalSales: number
    totalRevenue: number
    totalItems: number
    averageSaleValue: number
    paymentMethodBreakdown: {
      CASH: number
      ZELLE: number
      CARD: number
      SPLIT_PAYMENT: number
    }
  }
}

interface SalesHistoryProps {
  params: {
    id: string
  }
}

export default function ExhibitionSalesHistory({ params }: SalesHistoryProps) {
  const router = useRouter()
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const salesPerPage = 20

  // Load sales data
  const loadSalesData = async (refresh = false) => {
    if (refresh) setRefreshing(true)
    setError('')

    try {
      const queryParams = new URLSearchParams()
      queryParams.set('limit', String(salesPerPage * currentPage))
      queryParams.set('offset', '0')
      
      if (dateFrom) queryParams.set('dateFrom', dateFrom)
      if (dateTo) queryParams.set('dateTo', dateTo)

      const response = await fetch(`/api/exhibition/${params.id}/sales?${queryParams}`)
      if (!response.ok) throw new Error('Failed to load sales data')
      
      const data = await response.json()
      setSalesData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load sales data')
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadSalesData()
  }, [params.id, currentPage, dateFrom, dateTo])

  // Filter sales based on search and payment method
  const filteredSales = useMemo(() => {
    if (!salesData) return []
    
    return salesData.sales.filter(sale => {
      // Search filter
      const matchesSearch = !searchQuery || (
        sale.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.items.some(item => 
          item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.productSku.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
      
      // Payment method filter
      const matchesPayment = !paymentMethodFilter || sale.paymentMethod === paymentMethodFilter
      
      return matchesSearch && matchesPayment
    })
  }, [salesData, searchQuery, paymentMethodFilter])

  // Calculate filtered summary
  const filteredSummary = useMemo(() => {
    if (!filteredSales.length) {
      return {
        totalSales: 0,
        totalRevenue: 0,
        totalItems: 0,
        averageSaleValue: 0
      }
    }

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.finalTotal, 0)
    const totalItems = filteredSales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    )

    return {
      totalSales: filteredSales.length,
      totalRevenue,
      totalItems,
      averageSaleValue: totalRevenue / filteredSales.length
    }
  }, [filteredSales])

  // Group sales by date for daily breakdown
  const salesByDate = useMemo(() => {
    const grouped: Record<string, ExhibitionSale[]> = {}
    
    filteredSales.forEach(sale => {
      const date = new Date(sale.createdAt).toDateString()
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(sale)
    })
    
    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
  }, [filteredSales])

  // Get payment method icon
  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'CASH': return <Banknote className="w-4 h-4" />
      case 'ZELLE': return <Smartphone className="w-4 h-4" />
      case 'CARD': return <CreditCard className="w-4 h-4" />
      case 'SPLIT_PAYMENT': return <Tag className="w-4 h-4" />
      default: return <DollarSign className="w-4 h-4" />
    }
  }

  // Get payment method color
  const getPaymentColor = (method: string) => {
    switch (method) {
      case 'CASH': return 'bg-green-100 text-green-800'
      case 'ZELLE': return 'bg-blue-100 text-blue-800'
      case 'CARD': return 'bg-purple-100 text-purple-800'
      case 'SPLIT_PAYMENT': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sales history...</p>
        </div>
      </div>
    )
  }

  if (!salesData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Sales</h2>
          <p className="text-gray-600 mb-4">There was an error loading the sales data.</p>
          <Button onClick={() => loadSalesData()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push(`/exhibition`)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Sales History</h1>
              <p className="text-sm text-gray-600">{salesData.exhibition.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSalesData(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredSummary.totalSales}
                  </p>
                </div>
                <Receipt className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(filteredSummary.totalRevenue, 'USD')}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Items Sold</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredSummary.totalItems}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Sale</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(filteredSummary.averageSaleValue, 'USD')}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search Sales</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by sale number, customer, or product..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>

              {/* Payment Method Filter */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={paymentMethodFilter === '' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentMethodFilter('')}
                  >
                    All Methods
                  </Button>
                  {['CASH', 'ZELLE', 'CARD', 'SPLIT_PAYMENT'].map(method => (
                    <Button
                      key={method}
                      variant={paymentMethodFilter === method ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethodFilter(method)}
                      className="flex items-center gap-1"
                    >
                      {getPaymentIcon(method)}
                      {method.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sales List by Date */}
        {salesByDate.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Found</h3>
              <p className="text-gray-500">
                {searchQuery || paymentMethodFilter || dateFrom || dateTo
                  ? 'No sales match your current filters'
                  : 'No sales have been recorded yet'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          salesByDate.map(([date, dateSales]) => {
            const dayRevenue = dateSales.reduce((sum, sale) => sum + sale.finalTotal, 0)
            const dayItems = dateSales.reduce((sum, sale) => 
              sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
            )

            return (
              <Card key={date}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CardTitle>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {dateSales.length} sales • {dayItems} items
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        {formatPrice(dayRevenue, 'USD')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dateSales.map(sale => (
                      <div key={sale.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        {/* Sale Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">
                                #{sale.saleNumber}
                              </span>
                              <Badge className={`${getPaymentColor(sale.paymentMethod)} text-xs`}>
                                <span className="flex items-center gap-1">
                                  {getPaymentIcon(sale.paymentMethod)}
                                  {sale.paymentMethod.replace('_', ' ')}
                                </span>
                              </Badge>
                              {sale.bargainApplied && (
                                <Badge variant="secondary" className="text-xs">
                                  Discount Applied
                                </Badge>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600">
                              {sale.customerName ? (
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {sale.customerName}
                                  {sale.customerPhone && ` • ${sale.customerPhone}`}
                                </div>
                              ) : (
                                <span>Walk-in customer</span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <Clock className="w-3 h-3" />
                              {new Date(sale.createdAt).toLocaleTimeString()}
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {formatPrice(sale.finalTotal, 'USD')}
                            </p>
                            {(sale.customDiscount > 0 || sale.bundleDiscount > 0) && (
                              <p className="text-sm text-red-600">
                                -{formatPrice(sale.customDiscount + sale.bundleDiscount, 'USD')} discount
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Sale Items */}
                        <div className="space-y-1">
                          {sale.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <div className="flex-1">
                                <span className="font-medium">{item.quantity}x</span>{' '}
                                <span className="text-gray-700">{item.productName}</span>
                                <span className="text-gray-500 ml-2">({item.productSku})</span>
                              </div>
                              <span className="font-medium">
                                {formatPrice(item.lineTotal, 'USD')}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Sale Notes */}
                        {(sale.bargainReason || sale.salesPersonNotes) && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            {sale.bargainReason && (
                              <p className="text-sm text-orange-700">
                                <strong>Discount reason:</strong> {sale.bargainReason}
                              </p>
                            )}
                            {sale.salesPersonNotes && (
                              <p className="text-sm text-gray-600">
                                <strong>Notes:</strong> {sale.salesPersonNotes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}

        {/* Load More Button */}
        {salesData && salesData.sales.length >= salesPerPage * currentPage && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Loading...
                </div>
              ) : (
                'Load More Sales'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}