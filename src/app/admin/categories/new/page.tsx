import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import AdminNavigation from '@/components/admin/AdminNavigation'
import CategoryForm from '@/components/admin/CategoryForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

export default async function NewCategoryPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  // Get existing categories to use as potential parents
  const parentCategories = await db.category.findMany({
    where: { parentId: null }, // Only main categories can be parents
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
                    Add New Category
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Create a new product category or subcategory to organize your inventory.
                  </p>
                </div>
              </div>
            </div>

            {/* Category Form */}
            <CategoryForm 
              parentCategories={parentCategories}
              mode="create"
            />
          </div>
        </div>
      </main>
    </div>
  )
}