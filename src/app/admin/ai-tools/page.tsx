import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import AdminNavigation from '@/components/admin/AdminNavigation'
import AIToolsInterface from '@/components/admin/AIToolsInterface'
import { Card, CardContent } from '@/components/ui'
import { RefreshCw } from 'lucide-react'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

// Server component to fetch products for AI processing
async function AIToolsData() {
  try {
    // Get products that need content generation
    const products = await db.product.findMany({
      where: {
        isActive: true,
        OR: [
          { description: null },
          { description: '' },
          { shortDescription: null },
          { shortDescription: '' },
          { seoTitle: null },
          { seoDescription: null }
        ]
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        country: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit for performance
    })

    // Get all products for statistics
    const allProducts = await db.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        shortDescription: true,
        seoTitle: true,
        seoDescription: true,
        tags: true
      }
    })

    // Calculate statistics
    const stats = {
      totalProducts: allProducts.length,
      productsWithDescription: allProducts.filter(p => p.description && p.description.length > 0).length,
      productsWithSEO: allProducts.filter(p => p.seoTitle && p.seoDescription).length,
      productsWithTags: allProducts.filter(p => p.tags && p.tags.length > 0).length,
      incompleteProducts: products.length
    }

    return <AIToolsInterface products={products} stats={stats} />
    
  } catch (error) {
    console.error('Error fetching AI tools data:', error)
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-red-600">
            Error loading AI tools. Please try again.
          </div>
        </CardContent>
      </Card>
    )
  }
}

// Loading component
function AIToolsLoading() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tools skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function AIToolsPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="border-b border-gray-200 pb-5 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold leading-6 text-gray-900">
                    AI Content Tools
                  </h1>
                  <p className="mt-2 max-w-4xl text-sm text-gray-500">
                    Generate professional product descriptions, SEO content, and marketing copy using AI.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Tools Interface */}
            <Suspense fallback={<AIToolsLoading />}>
              <AIToolsData />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}