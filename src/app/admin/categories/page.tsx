import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import AdminNavigation from '@/components/admin/AdminNavigation'
import CategoriesTable from '@/components/admin/CategoriesTable'
import {
  FolderTree,
  Plus,
  Package,
  Layers
} from 'lucide-react'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

// Category Stats Component
async function CategoryStats() {
  const [
    totalCategories,
    parentCategories,
    subcategories,
    categoriesWithProducts
  ] = await Promise.all([
    db.category.count(),
    db.category.count({ where: { parentId: null } }),
    db.category.count({ where: { parentId: { not: null } } }),
    db.category.count({
      where: {
        products: {
          some: {}
        }
      }
    })
  ])

  const stats = [
    {
      title: 'Total Categories',
      value: totalCategories,
      icon: FolderTree,
      color: 'blue'
    },
    {
      title: 'Main Categories',
      value: parentCategories,
      icon: Layers,
      color: 'green'
    },
    {
      title: 'Subcategories',
      value: subcategories,
      icon: Package,
      color: 'purple'
    },
    {
      title: 'With Products',
      value: categoriesWithProducts,
      icon: Package,
      color: 'orange'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 text-${stat.color}-600`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// Categories Data Component
async function CategoriesData() {
  const categories = await db.category.findMany({
    include: {
      parent: true,
      children: true,
      _count: {
        select: {
          products: true,
          children: true
        }
      }
    },
    orderBy: [
      { parentId: 'asc' },
      { name: 'asc' }
    ]
  })

  return <CategoriesTable categories={categories} />
}

export default async function CategoriesPage() {
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
                    Categories
                  </h1>
                  <p className="mt-2 max-w-4xl text-sm text-gray-500">
                    Manage your product categories and subcategories to organize your inventory.
                  </p>
                </div>
                
                <Link href="/admin/categories/new">
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Category
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <Suspense fallback={<div>Loading stats...</div>}>
              <CategoryStats />
            </Suspense>

            {/* Categories Table */}
            <Suspense fallback={<div>Loading categories...</div>}>
              <CategoriesData />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}