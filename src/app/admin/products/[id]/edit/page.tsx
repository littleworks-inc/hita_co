import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import AdminNavigation from '@/components/admin/AdminNavigation'
import ProductForm from '@/components/admin/ProductForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui'

interface EditProductPageProps {
  params: {
    id: string
  }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  // Get product data
  const product = await db.product.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      country: true,
      supplier: true,
      // ✅ ADD THIS: Include product sizes
      productSizes: {
        orderBy: {
          sortOrder: 'asc'
        }
      }
    }
  })

  if (!product) {
    notFound()
  }

  // Get categories, countries, and suppliers for the form
  const [categories, countries, suppliersRaw] = await Promise.all([
    db.category.findMany({
      orderBy: { name: 'asc' }
    }),
    db.country.findMany({
      orderBy: { name: 'asc' }
    }),
    db.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
  ])

  // ✅ FIX: Convert null values to undefined for TypeScript compatibility
  const suppliers = suppliersRaw.map(supplier => ({
    ...supplier,
    contactPerson: supplier.contactPerson ?? undefined,
    email: supplier.email ?? undefined,
    phone: supplier.phone ?? undefined,
    whatsapp: supplier.whatsapp ?? undefined,
    address: supplier.address ?? undefined,
    city: supplier.city ?? undefined,
    state: supplier.state ?? undefined,
    country: supplier.country ?? undefined,
    pincode: supplier.pincode ?? undefined,
    businessType: supplier.businessType ?? undefined,
    gstNumber: supplier.gstNumber ?? undefined,
    panNumber: supplier.panNumber ?? undefined,
    bankName: supplier.bankName ?? undefined,
    accountNumber: supplier.accountNumber ?? undefined,
    ifscCode: supplier.ifscCode ?? undefined,
    notes: supplier.notes ?? undefined,
    rating: supplier.rating ?? undefined,
  }))

  // ✅ FIX: Convert product null values to strings for TypeScript compatibility
  const productForForm = product ? {
    ...product,
    description: product.description || '',
    shortDescription: product.shortDescription || '',
    seoTitle: product.seoTitle || '',
    seoDescription: product.seoDescription || '',
    barcode: product.barcode || '',
    barcodeType: product.barcodeType || 'CODE128',
    invoiceNumber: product.invoiceNumber || '',
    publishedAt: product.publishedAt?.toISOString() || null,
    archivedAt: product.archivedAt?.toISOString() || null,
    purchaseDate: product.purchaseDate?.toISOString().split('T')[0] || '',
  } : undefined

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <main className="lg:pl-64">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="border-b border-gray-200 pb-5 mb-6">
              <div className="flex items-center gap-4">
                <Link href="/admin/products">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Products
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold leading-6 text-gray-900">
                    Edit Product
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Update product details, pricing, and inventory.
                  </p>
                </div>
              </div>
            </div>

            {/* Product Form */}
            <ProductForm 
              categories={categories}
              countries={countries}
              suppliers={suppliers}
              product={productForForm}
              mode="edit"
            />
          </div>
        </div>
      </main>
    </div>
  )
}