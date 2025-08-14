// src/components/admin/ExhibitionsTable.tsx
// =====================================
// 🔥 FIXED: ExhibitionsTable Component - Correct Model Relationships
// Changed from 'orders' to 'sales' to fix revenue calculations
// =====================================

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatPrice, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui'
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

// 🔥 FIXED: Updated interface to use 'sales' instead of 'orders'
interface Exhibition {
  id: string
  title: string
  description: string | null
  location: string
  startDate: Date
  endDate: Date
  participationFee: number
  images: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  products: Array<{
    id: string
    quantityTaken: number
    quantitySold: number
    product: {
      name: string
      sellingPriceUSD: number
    }
  }>
  // 🔥 FIXED: Changed from 'orders' to 'sales' with correct properties
  sales: Array<{
    total: number
    isCompleted: boolean // 🔥 FIXED: Use isCompleted instead of status
  }>
  _count: {
    products: number
    sales: number // 🔥 FIXED: Count sales instead of orders
  }
}

interface ExhibitionsTableProps {
  exhibitions: Exhibition[]
}

export default function ExhibitionsTable({ exhibitions }: ExhibitionsTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (exhibitionId: string, exhibitionTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${exhibitionTitle}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(exhibitionId)

    try {
      const response = await fetch(`/api/admin/exhibitions/${exhibitionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to delete exhibition')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete exhibition. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const calculateExhibitionStats = (exhibition: Exhibition) => {
    const now = new Date()
    const startDate = new Date(exhibition.startDate)
    const endDate = new Date(exhibition.endDate)

    // Status
    let status: 'upcoming' | 'ongoing' | 'completed' = 'completed'
    if (startDate > now) status = 'upcoming'
    else if (endDate >= now) status = 'ongoing'

    // 🔥 FIXED: Revenue calculation using sales with isCompleted filter
    const revenue = exhibition.sales
      .filter(sale => sale.isCompleted) // 🔥 FIXED: Filter by isCompleted instead of status
      .reduce((sum, sale) => sum + sale.total, 0)

    // Products taken vs sold
    const totalProductsTaken = exhibition.products.reduce((sum, p) => sum + p.quantityTaken, 0)
    const totalProductsSold = exhibition.products.reduce((sum, p) => sum + p.quantitySold, 0)

    // 🔥 FIXED: Net profit = Revenue - Participation Fee (proper ROI calculation)
    const netProfit = revenue - exhibition.participationFee

    return {
      status,
      revenue,
      netProfit,
      totalProductsTaken,
      totalProductsSold,
      sellThroughRate: totalProductsTaken > 0 ? 
        Math.round((totalProductsSold / totalProductsTaken) * 100) : 0
    }
  }

  const getStatusBadge = (status: 'upcoming' | 'ongoing' | 'completed') => {
    switch (status) {
      case 'upcoming':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Upcoming
          </Badge>
        )
      case 'ongoing':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Ongoing
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        )
    }
  }

  const getPerformanceIndicator = (sellThroughRate: number, revenue: number, netProfit: number) => {
    // Performance logic: good if sell-through > 50% OR net profit > 0
    const isGoodPerformance = sellThroughRate >= 50 || netProfit > 0
    
    if (isGoodPerformance) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">Good</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-1 text-yellow-600">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">Review</span>
        </div>
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Exhibitions ({exhibitions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {exhibitions.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No exhibitions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first exhibition or event.
            </p>
            <div className="mt-6">
              <Link href="/admin/exhibitions/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Exhibition
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exhibition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates & Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue & ROI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {exhibitions.map((exhibition) => {
                  const stats = calculateExhibitionStats(exhibition)
                  const isDeleting = deletingId === exhibition.id

                  return (
                    <tr key={exhibition.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {exhibition.title}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {exhibition.location}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Fee: {formatPrice(exhibition.participationFee)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {stats.totalProductsTaken} taken • {stats.totalProductsSold} sold
                        </div>
                        <div className="text-sm text-gray-500">
                          {stats.sellThroughRate}% sell-through
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Revenue: {formatPrice(stats.revenue)}
                        </div>
                        <div className={`text-sm ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Net Profit: {formatPrice(stats.netProfit)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          {getStatusBadge(stats.status)}
                          {getPerformanceIndicator(stats.sellThroughRate, stats.revenue, stats.netProfit)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/exhibitions/${exhibition.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/exhibitions/${exhibition.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(exhibition.id, exhibition.title)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-700"
                          >
                            {isDeleting ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Performance Summary */}
        {exhibitions.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-700">Exhibition Performance Tips</h4>
                <ul className="mt-1 text-sm text-gray-600 space-y-1">
                  <li>• Track sell-through rates to optimize product selection</li>
                  <li>• Monitor net profit (Revenue - Participation Fee) to ensure profitable participation</li>
                  <li>• Use past performance data to plan future exhibitions</li>
                  <li>• Add products to exhibitions to track inventory and sales</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}