// src/app/admin/products/[id]/edit/page.tsx
// ✅ UPDATED: Fixed server component event handler issue

import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import AdminNavigation from '@/components/admin/AdminNavigation'
import ProductForm from '@/components/admin/ProductForm'
import BarcodeClientWrapper from '@/components/admin/BarcodeClientWrapper' // ✅ NEW: Use wrapper instead
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

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
      // ✅ EXISTING: Include product sizes
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

  // ✅ EXISTING: Convert null values to undefined for TypeScript compatibility
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

  // ✅ EXISTING: Convert product null values to strings for TypeScript compatibility
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

  // ✅ UPDATED: Format product for BarcodeClientWrapper
  const productForBarcode = {
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode || undefined,
    sellingPriceUSD: product.sellingPriceUSD,
    stockQuantity: product.stockQuantity,
    category: { name: product.category.name },
    requiresSizes: product.requiresSizes,
    productSizes: product.productSizes.map(size => ({
      size: size.size,
      sku: size.sku,
      stockQuantity: size.stockQuantity
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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

            {/* ✅ EXISTING: Two-column layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Left Column: Product Form */}
              <div className="xl:col-span-2">
                <ProductForm 
                  categories={categories}
                  countries={countries}
                  suppliers={suppliers}
                  product={productForForm}
                  mode="edit"
                />
              </div>

              {/* ✅ UPDATED: Right Column - Using BarcodeClientWrapper */}
              <div className="xl:col-span-1">
                <div className="sticky top-6 space-y-6">
                  
                  {/* ✅ FIXED: Use wrapper component (no function passing) */}
                  <BarcodeClientWrapper product={productForBarcode} />

                  {/* Product Quick Stats */}
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Quick Stats</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${
                          product.status === 'PUBLISHED' ? 'text-green-600' :
                          product.status === 'DRAFT' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>
                          {product.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stock:</span>
                        <span className={`font-medium ${
                          product.stockQuantity > 10 ? 'text-green-600' :
                          product.stockQuantity > 0 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {product.stockQuantity} units
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="text-gray-900">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Updated:</span>
                        <span className="text-gray-900">
                          {new Date(product.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Product Sizes (if applicable) */}
                  {product.requiresSizes && product.productSizes.length > 0 && (
                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Size Variants</h3>
                      <div className="space-y-2">
                        {product.productSizes.map((size) => (
                          <div key={size.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">{size.size}:</span>
                            <span className={`font-medium ${
                              size.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {size.stockQuantity} units
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}