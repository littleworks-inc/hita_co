import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import AdminNavigation from '@/components/admin/AdminNavigation'
import SocialProductSelector from '@/components/admin/SocialProductSelector'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

interface SocialProductsPageProps {
  searchParams: {
    search?: string
    category?: string
    featured?: string
  }
}

export default async function SocialProductsPage({ searchParams }: SocialProductsPageProps) {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  // Build where clause for filtering
  const whereClause: any = {
    isActive: true // Only show active products
  }
  
  if (searchParams.search) {
    whereClause.OR = [
      { name: { contains: searchParams.search, mode: 'insensitive' } },
      { sku: { contains: searchParams.search, mode: 'insensitive' } },
      { description: { contains: searchParams.search, mode: 'insensitive' } }
    ]
  }
  
  if (searchParams.category) {
    whereClause.categoryId = searchParams.category
  }

  if (searchParams.featured === 'true') {
    whereClause.isFeatured = true
  }

  // Get products with all necessary data for social media
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: whereClause,
      include: {
        category: true,
        country: true,
        supplier: true
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ]
    }),
    db.category.findMany({
      orderBy: { name: 'asc' }
    })
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="border-b border-gray-200 pb-5 mb-6">
              <div className="flex items-center gap-4">
                <Link href="/admin/social">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Social Media
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold leading-6 text-gray-900">
                    Select Products for Social Media
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Choose products to create social media content for. Select multiple products for bulk generation.
                  </p>
                </div>
              </div>
            </div>

            {/* Product Selector Component */}
            <SocialProductSelector 
              products={products}
              categories={categories}
              searchParams={searchParams}
            />
          </div>
        </div>
      </main>
    </div>
  )
}