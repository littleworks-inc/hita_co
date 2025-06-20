import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import AdminNavigation from '@/components/admin/AdminNavigation'
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  Star,
  Package,
  CheckCircle,
  XCircle
} from 'lucide-react'

// Suppliers Table Component
async function SuppliersTable() {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            All Suppliers ({suppliers.length})
          </CardTitle>
          
          <Link href="/admin/suppliers/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Supplier
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent>
        {suppliers.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No suppliers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first supplier.
            </p>
            <div className="mt-6">
              <Link href="/admin/suppliers/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Supplier
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {supplier.name}
                          </div>
                          {supplier.contactPerson && (
                            <div className="text-sm text-gray-500">
                              Contact: {supplier.contactPerson}
                            </div>
                          )}
                          {supplier.businessType && (
                            <div className="text-xs text-gray-400">
                              {supplier.businessType}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {supplier.phone && (
                          <div className="flex items-center text-sm text-gray-900">
                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                            {supplier.phone}
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1 text-gray-400" />
                            {supplier.email}
                          </div>
                        )}
                        {supplier.whatsapp && (
                          <div className="text-xs text-green-600">
                            WhatsApp: {supplier.whatsapp}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {supplier.city && supplier.state ? (
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                            {supplier.city}, {supplier.state}
                          </div>
                        ) : supplier.address ? (
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                            {supplier.address.length > 30 
                              ? `${supplier.address.substring(0, 30)}...` 
                              : supplier.address
                            }
                          </div>
                        ) : (
                          <span className="text-gray-400">No address</span>
                        )}
                      </div>
                      {supplier.country && (
                        <div className="text-xs text-gray-500">{supplier.country}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {supplier.products.length}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          product{supplier.products.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {supplier.rating ? (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm text-gray-900">
                            {supplier.rating.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No rating</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        supplier.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {supplier.isActive ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/suppliers/${supplier.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/suppliers/${supplier.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
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
      color: 'blue'
    },
    {
      title: 'Active Suppliers',
      value: activeSuppliers,
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'With Products',
      value: suppliersWithProducts,
      icon: Package,
      color: 'purple'
    },
    {
      title: 'Top Supplier',
      value: topSupplier?.products.length || 0,
      icon: Star,
      color: 'yellow',
      subtitle: topSupplier?.name
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
              {stat.subtitle && (
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
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

            {/* Quick Stats */}
            <Suspense fallback={<div>Loading stats...</div>}>
              <SuppliersStats />
            </Suspense>

            {/* Suppliers Table */}
            <Suspense fallback={<div>Loading suppliers...</div>}>
              <SuppliersTable />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}