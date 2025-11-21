import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import AdminNavigation from '@/components/admin/AdminNavigation'
import CategoryForm from '@/components/admin/CategoryForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

interface EditCategoryPageProps {
  params: {
    id: string
  }
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  // Get category data
  const category = await db.category.findUnique({
    where: { id: params.id },
    include: {
      parent: true
    }
  })

  if (!category) {
    notFound()
  }

  // Get existing categories to use as potential parents (excluding self and children)
  const parentCategories = await db.category.findMany({
    where: { 
      parentId: null, // Only main categories can be parents
      id: { not: params.id } // Can't be parent of itself
    },
    select: {
      id: true,
      name: true
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <main className="lg:pl-64">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="border-b border-gray-200 pb-5 mb-6">
              <div className="flex items-center gap-4">
                <Link href="/admin/categories">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Categories
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold leading-6 text-gray-900">
                    Edit Category
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Update category details and hierarchy.
                  </p>
                </div>
              </div>
            </div>

            {/* Category Form - FIXED: Handle null description */}
            <CategoryForm 
              category={category ? {
                ...category,
                description: category.description || ''
              } : undefined}
              parentCategories={parentCategories}
              mode="edit"
            />
          </div>
        </div>
      </main>
    </div>
  )
}