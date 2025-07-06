// src/app/exhibition/page.tsx
// =====================================
// 🔥 FIXED: Exhibition Portal Homepage - Exhibition List with Status Filtering
// Fixed to use finalTotal instead of total for ExhibitionSale model
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

// ✅ FIXED: Enhanced exhibition interface with correct field names
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
    total: number       // ✅ FIXED: Use 'total' (actual database field)
    isCompleted: boolean
  }>
  _count: {
    products: number
    sales: number
  }
}

// ✅ FIXED: Calculate exhibition status and stats with correct field names
function calculateExhibitionStatus(exhibition: ExhibitionWithStats) {
  const now = new Date()
  const startDate = new Date(exhibition.startDate)
  const endDate = new Date(exhibition.endDate)

  // Determine status
  let status: 'upcoming' | 'ongoing' | 'completed' = 'completed'
  if (startDate > now) status = 'upcoming'
  else if (endDate >= now) status = 'ongoing'

  // ✅ FIXED: Calculate financial metrics using 'total' (actual database field)
  const revenue = exhibition.sales
    .filter(sale => sale.isCompleted)
    .reduce((sum, sale) => sum + sale.total, 0)  // ✅ FIXED: 'total' instead of 'finalTotal'
  
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

// ✅ FIXED: Get all exhibitions with stats using correct field names
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
          total: true,        // ✅ This is correct - 'total' exists in database
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
          {isGoodPerformance ? 'Good' : 'Needs Attention'}
        </span>
      </div>
    )
  }

  const ExhibitionCard = ({ exhibition }: { exhibition: any }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg text-gray-900">
                {exhibition.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                {exhibition.location}
              </div>
            </div>
            <StatusBadge status={exhibition.stats.status} />
          </div>

          {/* Dates */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(exhibition.startDate)}</span>
            </div>
            <span>to</span>
            <span>{formatDate(exhibition.endDate)}</span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Products:</span>
                <span className="font-medium">
                  {exhibition.stats.totalProductsSold}/{exhibition.stats.totalProductsTaken}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Sell Rate:</span>
                <span className="font-medium">{exhibition.stats.sellThroughRate}%</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Revenue:</span>
                <span className="font-medium">{formatPrice(exhibition.stats.revenue)}</span>
              </div>
              <div className={`flex items-center gap-2 text-sm ${exhibition.stats.netProfit >= 0 
                ? 'text-green-600' : 'text-red-600'}`}>
                <span className="text-gray-600">Net:</span>
                <span className="font-medium">{formatPrice(exhibition.stats.netProfit)}</span>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="flex justify-between items-center pt-2 border-t">
            <PerformanceIndicator stats={exhibition.stats} />
            <div className="text-sm text-gray-500">
              {exhibition.stats.completedSales} sales
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
            <div className="text-gray-500">Ongoing</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">{groupedExhibitions.upcoming.length}</div>
            <div className="text-gray-500">Upcoming</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-600">{groupedExhibitions.completed.length}</div>
            <div className="text-gray-500">Completed</div>
          </div>
        </div>
      </div>

      {/* Ongoing Exhibitions */}
      {groupedExhibitions.ongoing.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
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