'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatPrice, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
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
  orders: Array<{
    total: number
    status: string
  }>
  _count: {
    products: number
    orders: number
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

    // Revenue calculation
    const revenue = exhibition.orders
      .filter(order => order.status !== 'CANCELLED')
      .reduce((sum, order) => sum + order.total, 0)

    // Products taken vs sold
    const totalProductsTaken = exhibition.products.reduce((sum, p) => sum + p.quantityTaken, 0)
    const totalProductsSold = exhibition.products.reduce((sum, p) => sum + p.quantitySold, 0)

    // Net profit = Revenue - Participation Fee
    const netProfit = revenue - exhibition.participationFee

    return {
      status,
      revenue,
      netProfit,
      totalProductsTaken,
      totalProductsSold,
      sellThroughRate: totalProductsTaken > 0 ? (totalProductsSold / totalProductsTaken) * 100 : 0
    }
  }

  const getStatusBadge = (status: 'upcoming' | 'ongoing' | 'completed') => {
    const styles = {
      upcoming: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800'
    }

    const icons = {
      upcoming: Clock,
      ongoing: CheckCircle,
      completed: CheckCircle
    }

    const Icon = icons[status]

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        <Icon className="mr-1 h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            All Exhibitions ({exhibitions.length})
          </CardTitle>
          
          <Link href="/admin/exhibitions/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Exhibition
            </Button>
          </Link>
        </div>
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
                    Revenue
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
                  
                  return (
                    <tr key={exhibition.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {exhibition.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              Fee: {formatPrice(exhibition.participationFee)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1 mb-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {exhibition.location}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4 text-gray-400" />
                            {stats.totalProductsTaken} taken
                          </div>
                          <div className="text-xs text-gray-500">
                            {stats.totalProductsSold} sold ({stats.sellThroughRate.toFixed(1)}%)
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">
                            {formatPrice(stats.revenue)}
                          </div>
                          <div className={`text-xs ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Net: {formatPrice(stats.netProfit)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(stats.status)}
                        {!exhibition.isActive && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inactive
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/exhibitions/${exhibition.id}`}>
                            <Button variant="ghost" size="sm" title="View Exhibition">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/exhibitions/${exhibition.id}/edit`}>
                            <Button variant="ghost" size="sm" title="Edit Exhibition">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/exhibitions/${exhibition.id}/products`}>
                            <Button variant="ghost" size="sm" title="Manage Products">
                              <Package className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(exhibition.id, exhibition.title)}
                            disabled={deletingId === exhibition.id}
                            title="Delete Exhibition"
                          >
                            {deletingId === exhibition.id ? (
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
                  <li>• Monitor net profit to ensure profitable participation</li>
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