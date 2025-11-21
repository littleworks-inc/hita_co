// src/app/exhibition/page.tsx
// =====================================
// 🔧 SIMPLIFIED: Exhibition Portal Main Page - No Currency Context
// Temporarily removed CurrencyContext to fix infinite API loop
// =====================================

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Calendar,
  MapPin,
  Package,
  Play,
  Clock,
  CheckCircle,
  List,
  Plus,
  DollarSign,
  TrendingUp
} from 'lucide-react'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

interface Exhibition {
  id: string
  title: string
  description: string | null
  location: string
  startDate: Date
  endDate: Date
  isActive: boolean
  participationFee: number
  createdAt: Date
  updatedAt: Date
  products: {
    id: string
    quantityTaken: number
    quantitySold: number
    originalPrice: number | null
    exhibitionPrice: number | null
    discountPercentage: number | null
    product: {
      id: string
      name: string
      sku: string
      sellingPriceUSD: number
      images: string[]
    }
  }[]
  sales: {
    total: number
    isCompleted: boolean
  }[]
  _count: {
    products: number
    sales: number
  }
}

// Format price in USD only (no currency context)
function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)
}

// Format date
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

// Get exhibition status
function getExhibitionStatus(startDate: Date, endDate: Date): 'upcoming' | 'ongoing' | 'completed' {
  const now = new Date()
  if (startDate > now) return 'upcoming'
  if (endDate >= now) return 'ongoing'
  return 'completed'
}

// Exhibition Card Component
function ExhibitionCard({ exhibition }: { exhibition: Exhibition }) {
  const status = getExhibitionStatus(exhibition.startDate, exhibition.endDate)
  
  // Calculate metrics with null handling
  const totalRevenue = exhibition.sales
    .filter(sale => sale.isCompleted)
    .reduce((sum, sale) => sum + sale.total, 0)
    
  const totalProductsTaken = exhibition.products.reduce((sum, p) => sum + p.quantityTaken, 0)
  const totalProductsSold = exhibition.products.reduce((sum, p) => sum + p.quantitySold, 0)
  
  const getStatusBadge = () => {
    switch (status) {
      case 'ongoing':
        return <Badge className="bg-green-100 text-green-800">Ongoing</Badge>
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{exhibition.title}</CardTitle>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{exhibition.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)}</span>
              </div>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Products</div>
            <div className="text-lg font-semibold">{totalProductsTaken}</div>
            <div className="text-xs text-gray-500">{totalProductsSold} sold</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Revenue</div>
            <div className="text-lg font-semibold">{formatPrice(totalRevenue)}</div>
            <div className="text-xs text-gray-500">{exhibition._count.sales} sales</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link href={`/exhibition/${exhibition.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              <Play className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>
          {status === 'ongoing' && (
            <Link href={`/exhibition/${exhibition.id}/pos`}>
              <Button>
                <Package className="h-4 w-4 mr-2" />
                POS
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Main Exhibition Page Component
export default async function ExhibitionPage() {
  // Check authentication
  const session = await getSession()
  
  if (!session) {
    redirect('/exhibition/login')
  }

  // Fetch exhibitions data
  const exhibitions = await db.exhibition.findMany({
    where: { isActive: true },
    include: {
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              sellingPriceUSD: true,
              images: true
            }
          }
        }
      },
      sales: {
        select: {
          total: true,
          isCompleted: true
        }
      },
      _count: {
        select: {
          products: true,
          sales: true
        }
      }
    },
    orderBy: {
      startDate: 'desc'
    }
  })

  // Group exhibitions by status
  const now = new Date()
  const groupedExhibitions = exhibitions.reduce((acc, exhibition) => {
    const status = getExhibitionStatus(exhibition.startDate, exhibition.endDate)
    acc[status].push(exhibition)
    return acc
  }, {
    ongoing: [] as Exhibition[],
    upcoming: [] as Exhibition[],
    completed: [] as Exhibition[]
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exhibition Portal</h1>
          <p className="text-gray-600">Manage your exhibition sales and inventory</p>
        </div>
        <Link href="/admin/exhibitions">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Admin Panel
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ongoing Exhibitions</p>
                <p className="text-2xl font-bold text-green-600">{groupedExhibitions.ongoing.length}</p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming Exhibitions</p>
                <p className="text-2xl font-bold text-blue-600">{groupedExhibitions.upcoming.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(
                    exhibitions.reduce((sum, ex) => 
                      sum + ex.sales.filter(s => s.isCompleted).reduce((s, sale) => s + sale.total, 0), 0
                    )
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ongoing Exhibitions */}
      {groupedExhibitions.ongoing.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Ongoing Exhibitions</h2>
            <Badge className="bg-green-100 text-green-800">{groupedExhibitions.ongoing.length}</Badge>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groupedExhibitions.ongoing.map((exhibition) => (
              <ExhibitionCard key={exhibition.id} exhibition={exhibition} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Exhibitions */}
      {groupedExhibitions.upcoming.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Exhibitions</h2>
            <Badge className="bg-blue-100 text-blue-800">{groupedExhibitions.upcoming.length}</Badge>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groupedExhibitions.upcoming.map((exhibition) => (
              <ExhibitionCard key={exhibition.id} exhibition={exhibition} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Exhibitions */}
      {groupedExhibitions.completed.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Completed Exhibitions</h2>
            <Badge className="bg-gray-100 text-gray-800">{groupedExhibitions.completed.length}</Badge>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groupedExhibitions.completed.slice(0, 6).map((exhibition) => (
              <ExhibitionCard key={exhibition.id} exhibition={exhibition} />
            ))}
          </div>
          {groupedExhibitions.completed.length > 6 && (
            <div className="text-center">
              <Button variant="outline">
                <List className="h-4 w-4 mr-2" />
                View All Completed ({groupedExhibitions.completed.length - 6} more)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {exhibitions.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Exhibitions Found
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first exhibition to get started with the POS system.
            </p>
            <Link href="/admin/exhibitions">
              <Button>
                Create Exhibition
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}