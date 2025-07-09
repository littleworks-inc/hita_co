import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import AdminNavigation from '@/components/admin/AdminNavigation'
import ExhibitionProductsManager from '@/components/admin/ExhibitionProductsManager'
import {
  ArrowLeft,
  Package,
  Calendar,
  MapPin,
  DollarSign,
  TrendingUp,
  Plus
} from 'lucide-react'

interface ExhibitionProductsPageProps {
  params: {
    id: string
  }
}

export default async function ExhibitionProductsPage({ params }: ExhibitionProductsPageProps) {
  const session = await getSession()

  if (!session) {
    redirect('/admin/login')
  }

  // ✅ FIXED: Include productSizes and exhibitionSizes in the queries
  const [exhibition, availableProducts] = await Promise.all([
    db.exhibition.findUnique({
      where: { id: params.id },
      include: {
        products: {
          include: {
            product: {
              include: {
                category: true,
                country: true,
                productSizes: {
                  where: { isActive: true },
                  orderBy: { sortOrder: 'asc' }
                }
              }
            },
            exhibitionSizes: {
              include: {
                productSize: true
              },
              orderBy: {
                productSize: { sortOrder: 'asc' }
              }
            }
          },
          orderBy: {
            product: {
              name: 'asc'
            }
          }
        }
      }
    }),
    // ✅ FIXED: Include productSizes in available products query
    db.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        country: true,
        productSizes: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    })
  ])

  if (!exhibition) {
    notFound()
  }

  // Calculate exhibition stats
  const totalProductsTaken = exhibition.products.reduce((sum, p) => sum + p.quantityTaken, 0)
  const totalProductsSold = exhibition.products.reduce((sum, p) => sum + p.quantitySold, 0)
  const totalValue = exhibition.products.reduce((sum, p) => sum + (p.quantityTaken * (p.product.sellingPriceUSD || 0)), 0)
  const soldValue = exhibition.products.reduce((sum, p) => sum + (p.quantitySold * (p.product.sellingPriceUSD || 0)), 0)
  const sellThroughRate = totalProductsTaken > 0 ? 
    Math.round((totalProductsSold / totalProductsTaken) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />

      {/* ✅ FIXED: Proper layout with left margin for sidebar */}
      <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link href={`/admin/exhibitions/${exhibition.id}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Exhibition
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Exhibition Products</h1>
                <p className="text-gray-600">{exhibition.title}</p>
              </div>
            </div>

            {/* Exhibition Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Exhibition Period</p>
                    <p className="font-medium">{formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{exhibition.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Products</p>
                    <p className="font-medium">{exhibition.products.length} items</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="font-medium">{formatPrice(totalValue)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products Taken</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProductsTaken}</div>
                <p className="text-xs text-muted-foreground">Total quantity at exhibition</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProductsSold}</div>
                <p className="text-xs text-muted-foreground">
                  {sellThroughRate}% sell-through rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(totalValue)}</div>
                <p className="text-xs text-muted-foreground">Total value of inventory</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(soldValue)}</div>
                <p className="text-xs text-muted-foreground">From products sold</p>
              </CardContent>
            </Card>
          </div>

          {/* Exhibition Products Manager */}
          <ExhibitionProductsManager
            exhibition={exhibition}
            exhibitionProducts={exhibition.products}
            availableProducts={availableProducts}
          />
        </div>
      </main>
    </div>
  )
}