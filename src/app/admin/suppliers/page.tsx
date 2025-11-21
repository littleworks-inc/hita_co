import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import AdminNavigation from '@/components/admin/AdminNavigation'
import SuppliersTable from '@/components/admin/SuppliersTable'
import {
  Building2,
  CheckCircle,
  Package,
  Star
} from 'lucide-react'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

// Suppliers Data Component
async function SuppliersData() {
  const suppliers = await db.supplier.findMany({
    include: {
      products: {
        select: {
          id: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return <SuppliersTable suppliers={suppliers} />
}

// Quick Stats Component
async function SuppliersStats() {
  const [
    totalSuppliers,
    activeSuppliers,
    suppliersWithProducts,
    topSupplier
  ] = await Promise.all([
    db.supplier.count(),
    db.supplier.count({ where: { isActive: true } }),
    db.supplier.count({
      where: {
        products: {
          some: {}
        }
      }
    }),
    db.supplier.findFirst({
      include: {
        products: {
          select: { id: true }
        }
      },
      orderBy: {
        products: {
          _count: 'desc'
        }
      }
    })
  ])

  const stats = [
    {
      title: 'Total Suppliers',
      value: totalSuppliers,
      icon: Building2,
      color: 'blue',
      description: 'All registered suppliers'
    },
    {
      title: 'Active Suppliers',
      value: activeSuppliers,
      icon: CheckCircle,
      color: 'green',
      description: 'Currently active'
    },
    {
      title: 'With Products',
      value: suppliersWithProducts,
      icon: Package,
      color: 'purple',
      description: 'Suppliers with products'
    },
    {
      title: 'Top Supplier',
      value: topSupplier?.products.length || 0,
      icon: Star,
      color: 'yellow',
      description: topSupplier?.name || 'No suppliers yet',
      subtitle: topSupplier ? `${topSupplier.products.length} products` : undefined
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
              <div className={`p-2 rounded-md ${
                stat.color === 'blue' ? 'bg-blue-50' :
                stat.color === 'green' ? 'bg-green-50' :
                stat.color === 'purple' ? 'bg-purple-50' :
                stat.color === 'yellow' ? 'bg-yellow-50' : 'bg-gray-50'
              }`}>
                <Icon className={`h-4 w-4 ${
                  stat.color === 'blue' ? 'text-blue-600' :
                  stat.color === 'green' ? 'text-green-600' :
                  stat.color === 'purple' ? 'text-purple-600' :
                  stat.color === 'yellow' ? 'text-yellow-600' : 'text-gray-600'
                }`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              {stat.subtitle && (
                <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default async function SuppliersPage() {
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
              <h1 className="text-3xl font-bold leading-6 text-gray-900">
                Suppliers
              </h1>
              <p className="mt-2 max-w-4xl text-sm text-gray-500">
                Manage your supplier relationships and contact information.
              </p>
            </div>

            {/* Stats */}
            <Suspense fallback={
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            }>
              <SuppliersStats />
            </Suspense>

            {/* Suppliers Table */}
            <Suspense fallback={
              <Card>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded"></div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            }>
              <SuppliersData />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}