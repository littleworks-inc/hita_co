// src/app/exhibition/page.tsx
// =====================================
// 🔥 NEW: Exhibition Portal Homepage - Exhibition List with Status Filtering
// Replaces single exhibition view with filterable list of all exhibitions
// =====================================

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui'
import {
  Calendar,
  MapPin,
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  ShoppingCart,
  Filter,
  Search,
  Grid3X3,
  List
} from 'lucide-react'

// Enhanced exhibition interface
interface ExhibitionWithStats {
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
  }>
  sales: Array<{
    total: number
    isCompleted: boolean
  }>
  _count: {
    products: number
    sales: number
  }
}

// Calculate exhibition status and stats
function calculateExhibitionStatus(exhibition: ExhibitionWithStats) {
  const now = new Date()
  const startDate = new Date(exhibition.startDate)
  const endDate = new Date(exhibition.endDate)

  // Determine status
  let status: 'upcoming' | 'ongoing' | 'completed' = 'completed'
  if (startDate > now) status = 'upcoming'
  else if (endDate >= now) status = 'ongoing'

  // Calculate financial metrics
  const revenue = exhibition.sales
    .filter(sale => sale.isCompleted)
    .reduce((sum, sale) => sum + sale.total, 0)
  
  const netProfit = revenue - exhibition.participationFee

  // Calculate product metrics
  const totalProductsTaken = exhibition.products.reduce((sum, p) => sum + p.quantityTaken, 0)
  const totalProductsSold = exhibition.products.reduce((sum, p) => sum + p.quantitySold, 0)
  const sellThroughRate = totalProductsTaken > 0 ? 
    Math.round((totalProductsSold / totalProductsTaken) * 100) : 0

  return {
    status,
    revenue,
    netProfit,
    totalProductsTaken,
    totalProductsSold,
    sellThroughRate,
    completedSales: exhibition.sales.filter(sale => sale.isCompleted).length
  }
}

// Get all exhibitions with stats
async function getAllExhibitionsWithStats() {
  const exhibitions = await db.exhibition.findMany({
    where: { isActive: true },
    include: {
      products: {
        select: {
          id: true,
          quantityTaken: true,
          quantitySold: true
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

  return exhibitions.map(exhibition => ({
    ...exhibition,
    stats: calculateExhibitionStatus(exhibition)
  }))
}

export default async function ExhibitionListPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/exhibition/login')
  }

  const exhibitions = await getAllExhibitionsWithStats()

  // Group exhibitions by status
  const groupedExhibitions = {
    ongoing: exhibitions.filter(ex => ex.stats.status === 'ongoing'),
    upcoming: exhibitions.filter(ex => ex.stats.status === 'upcoming'),
    completed: exhibitions.filter(ex => ex.stats.status === 'completed')
  }

  const StatusBadge = ({ status }: { status: 'ongoing' | 'upcoming' | 'completed' }) => {
    const configs = {
      ongoing: { label: 'Ongoing', icon: CheckCircle, className: 'bg-green-100 text-green-800' },
      upcoming: { label: 'Upcoming', icon: Clock, className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completed', icon: CheckCircle, className: 'bg-gray-100 text-gray-800' }
    }
    
    const config = configs[status]
    const Icon = config.icon
    
    return (
      <Badge className={`flex items-center gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const PerformanceIndicator = ({ stats }: { stats: any }) => {
    const isGoodPerformance = stats.sellThroughRate >= 50 || stats.netProfit > 0
    
    return (
      <div className={`flex items-center gap-1 ${isGoodPerformance ? 'text-green-600' : 'text-yellow-600'}`}>
        {isGoodPerformance ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <AlertTriangle className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">
          {isGoodPerformance ? 'Good' : 'Review'}
        </span>
      </div>
    )
  }

  const ExhibitionCard = ({ exhibition }: { exhibition: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
              {exhibition.title}
            </CardTitle>
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <MapPin className="h-3 w-3" />
              {exhibition.location}
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={exhibition.stats.status} />
              <PerformanceIndicator stats={exhibition.stats} />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Dates */}
          <div className="text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="font-medium text-gray-900">
                {exhibition.stats.totalProductsTaken} Products
              </div>
              <div className="text-gray-600">
                {exhibition.stats.totalProductsSold} sold ({exhibition.stats.sellThroughRate}%)
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {formatPrice(exhibition.stats.revenue)}
              </div>
              <div className={`${exhibition.stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Net: {formatPrice(exhibition.stats.netProfit)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Link href={`/exhibition/${exhibition.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </Link>
            {exhibition.stats.status === 'ongoing' && (
              <Link href={`/exhibition/${exhibition.id}/pos`} className="flex-1">
                <Button size="sm" className="w-full">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Open POS
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Exhibition Portal
          </h1>
          <p className="text-gray-600">
            Manage exhibitions and access POS systems
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-green-600">{groupedExhibitions.ongoing.length}</div>
            <div className="text-gray-600">Ongoing</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">{groupedExhibitions.upcoming.length}</div>
            <div className="text-gray-600">Upcoming</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-600">{groupedExhibitions.completed.length}</div>
            <div className="text-gray-600">Completed</div>
          </div>
        </div>
      </div>

      {/* Ongoing Exhibitions */}
      {groupedExhibitions.ongoing.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Ongoing Exhibitions</h2>
            <Badge className="bg-green-100 text-green-800">
              {groupedExhibitions.ongoing.length}
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedExhibitions.ongoing.map(exhibition => (
              <ExhibitionCard key={exhibition.id} exhibition={exhibition} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Exhibitions */}
      {groupedExhibitions.upcoming.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Exhibitions</h2>
            <Badge className="bg-blue-100 text-blue-800">
              {groupedExhibitions.upcoming.length}
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedExhibitions.upcoming.map(exhibition => (
              <ExhibitionCard key={exhibition.id} exhibition={exhibition} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Exhibitions */}
      {groupedExhibitions.completed.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Exhibitions</h2>
            <Badge className="bg-gray-100 text-gray-800">
              {groupedExhibitions.completed.length}
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedExhibitions.completed.slice(0, 6).map(exhibition => (
              <ExhibitionCard key={exhibition.id} exhibition={exhibition} />
            ))}
          </div>
          {groupedExhibitions.completed.length > 6 && (
            <div className="text-center mt-4">
              <Button variant="outline">
                View All Completed Exhibitions ({groupedExhibitions.completed.length})
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {exhibitions.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Exhibitions Found</h3>
          <p className="text-gray-600 mb-6">
            No exhibitions are currently configured. Contact your administrator to set up exhibitions.
          </p>
        </div>
      )}
    </div>
  )
}