import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import AdminNavigation from '@/components/admin/AdminNavigation'
import ExhibitionProductsManager from '@/components/admin/ExhibitionProductsManager'
import QuickSalesUpdate from '@/components/admin/QuickSalesUpdate'
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

  // Get exhibition with products and all available products
  const [exhibition, availableProducts] = await Promise.all([
    db.exhibition.findUnique({
      where: { id: params.id },
      include: {
        products: {
          include: {
            product: {
              include: {
                category: true,
                country: true
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
    db.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        country: true
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
  const totalValue = exhibition.products.reduce((sum, p) => sum + (p.quantityTaken * p.product.sellingPriceUSD), 0)
  const soldValue = exhibition.products.reduce((sum, p) => sum + (p.quantitySold * p.product.sellingPriceUSD), 0)
  const sellThroughRate = totalProductsTaken > 0 ? (totalProductsSold / totalProductsTaken) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="border-b border-gray-200 pb-5 mb-6">
              <div className="flex items-center gap-4">
                <Link href={`/admin/exhibitions/${exhibition.id}`}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Exhibition
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold leading-6 text-gray-900">
                    Products for {exhibition.title}
                  </h1>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {exhibition.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Products Taken</CardTitle>
                  <Package className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalProductsTaken}</div>
                  <p className="text-xs text-muted-foreground">
                    {exhibition.products.length} product types
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalProductsSold}</div>
                  <p className="text-xs text-muted-foreground">
                    {sellThroughRate.toFixed(1)}% sell-through rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPrice(totalValue)}</div>
                  <p className="text-xs text-muted-foreground">
                    Total product value taken
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
                  <DollarSign className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPrice(soldValue)}</div>
                  <p className="text-xs text-muted-foreground">
                    From product sales
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Exhibition Products Manager */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ExhibitionProductsManager 
                  exhibition={exhibition}
                  exhibitionProducts={exhibition.products}
                  availableProducts={availableProducts}
                />
              </div>
              
              {/* Quick Sales Update Sidebar */}
              <div>
                <QuickSalesUpdate 
                  exhibitionId={exhibition.id}
                  exhibitionProducts={exhibition.products}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}