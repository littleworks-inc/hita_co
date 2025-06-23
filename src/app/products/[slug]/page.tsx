// File: app/products/[slug]/page.tsx - Enhanced with Draft System Protection

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { db } from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import { 
  generateProductMetadata, 
  generateProductJsonLd, 
  generateBreadcrumbJsonLd 
} from '@/lib/seo'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import ProductCard from '@/components/customer/ProductCard'
import ProductGallery from '@/components/customer/ProductGallery'
import LoadingSpinner from '@/components/customer/LoadingSpinner'
import {
  Star,
  Heart,
  ShoppingCart,
  Share2,
  Shield,
  Truck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Package,
  MapPin,
  Tag,
  Info,
  CheckCircle,
  AlertTriangle,
  Eye
} from 'lucide-react'

interface ProductDetailPageProps {
  params: {
    slug: string
  }
}

// Get store settings
async function getStoreSettings() {
  return await db.storeSetting.findFirst({
    where: { id: 'default' }
  })
}

// Enhanced product fetching with Draft System Protection
async function getProduct(slug: string) {
  // Extract SKU from slug (format: product-name-SKU)
  const parts = slug.split('-')
  const sku = parts[parts.length - 1]

  const product = await db.product.findFirst({
    where: {
      sku: sku,
      // CRITICAL: Only show published products to customers
      OR: [
        { status: 'PUBLISHED' },
        { 
          AND: [
            { status: null }, // Legacy products without status
            { isActive: true } // But must be active
          ]
        }
      ]
      // NOTE: We don't check stockQuantity here as customers should see 
      // out-of-stock products (just not be able to buy them)
    },
    include: {
      category: {
        include: {
          parent: true
        }
      },
      country: true,
      supplier: {
        select: {
          id: true,
          name: true,
          country: true
        }
      }
    }
  })

  return product
}

// Get related published products only
async function getRelatedProducts(productId: string, categoryId: string) {
  return await db.product.findMany({
    where: {
      // Only published products for related products
      OR: [
        { status: 'PUBLISHED' },
        { 
          AND: [
            { status: null },
            { isActive: true }
          ]
        }
      ],
      stockQuantity: { gt: 0 }, // Related products should have stock
      categoryId: categoryId,
      id: { not: productId }
    },
    include: {
      category: true,
      country: true
    },
    take: 4,
    orderBy: [
      { isFeatured: 'desc' },
      { createdAt: 'desc' }
    ]
  })
}

// Main Product Detail Component
async function ProductDetail({ slug }: { slug: string }) {
  const product = await getProduct(slug)

  // Return 404 for draft/archived products or non-existent products
  if (!product) {
    notFound()
  }

  const isOutOfStock = product.stockQuantity === 0
  const isLowStock = product.stockQuantity <= 5 && product.stockQuantity > 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Product Images */}
      <div>
        <ProductGallery images={product.images} productName={product.name} />
      </div>

      {/* Product Information */}
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500">
          <Link href="/" className="hover:text-purple-600">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-purple-600">Products</Link>
          <span className="mx-2">/</span>
          <Link 
            href={`/categories/${product.category.slug}`} 
            className="hover:text-purple-600"
          >
            {product.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Product Title & SKU */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">SKU: {product.sku}</span>
            {product.isFeatured && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="text-3xl font-bold text-purple-600">
          {formatPrice(product.sellingPriceUSD)}
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-2">
          {isOutOfStock ? (
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Out of Stock</span>
            </div>
          ) : isLowStock ? (
            <div className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Only {product.stockQuantity} left</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">In Stock ({product.stockQuantity} available)</span>
            </div>
          )}
        </div>

        {/* Short Description */}
        {product.shortDescription && (
          <p className="text-gray-600 text-lg">{product.shortDescription}</p>
        )}

        {/* Product Details */}
        <div className="space-y-3 py-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Made in <span className="font-medium">{product.country.name}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Package className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Category: <span className="font-medium">{product.category.name}</span>
            </span>
          </div>
          {product.tags && product.tags.length > 0 && (
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {product.tags.slice(0, 5).map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            disabled={isOutOfStock}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Heart className="h-4 w-4" />
              Save
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          <div className="text-center">
            <Shield className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-900">Secure Payment</div>
            <div className="text-xs text-gray-500">SSL protected</div>
          </div>
          <div className="text-center">
            <Truck className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-900">Fast Shipping</div>
            <div className="text-xs text-gray-500">2-3 business days</div>
          </div>
          <div className="text-center">
            <RotateCcw className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-900">Easy Returns</div>
            <div className="text-xs text-gray-500">30-day policy</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Related Products Component (only published products)
async function RelatedProducts({ productId, categoryId }: { productId: string, categoryId: string }) {
  const relatedProducts = await getRelatedProducts(productId, categoryId)

  if (relatedProducts.length === 0) {
    return null
  }

  return (
    <section className="mt-16 pt-16 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">You might also like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

// Generate static paths for published products only (for static generation)
export async function generateStaticParams() {
  // Only generate paths for published products
  const products = await db.product.findMany({
    where: {
      OR: [
        { status: 'PUBLISHED' },
        { 
          AND: [
            { status: null },
            { isActive: true }
          ]
        }
      ]
    },
    select: {
      sku: true,
      name: true
    }
  })

  return products.map((product) => ({
    slug: `${product.name.toLowerCase().replace(/\s+/g, '-')}-${product.sku}`
  }))
}

// Enhanced metadata generation with draft system considerations
export async function generateMetadata({ params }: ProductDetailPageProps) {
  const [product, storeSettings] = await Promise.all([
    getProduct(params.slug),
    getStoreSettings()
  ])

  // Return 404 metadata for draft/archived products
  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found or is no longer available.',
      robots: {
        index: false,
        follow: false
      }
    }
  }

  return generateProductMetadata(product, storeSettings)
}

// Main Page Component
export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const [storeSettings, product] = await Promise.all([
    getStoreSettings(),
    getProduct(params.slug)
  ])

  // Return 404 for draft/archived products
  if (!product) {
    notFound()
  }

  // Generate structured data (only for published products)
  const productSchema = generateProductJsonLd(product, storeSettings)
  const breadcrumbSchema = generateBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    { name: product.category.name, url: `/categories/${product.category.slug}` },
    { name: product.name, url: `/products/${params.slug}` }
  ])

  return (
    <>
      {/* JSON-LD Structured Data for Published Products Only */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema)
        }}
      />
      
      <div className="min-h-screen bg-white">
        <CustomerNavigation storeSettings={storeSettings} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Suspense fallback={<LoadingSpinner size="lg" text="Loading product details..." />}>
            <ProductDetail slug={params.slug} />
          </Suspense>

          {/* Product Description (only for published products) */}
          {product.description && (
            <section className="mt-16 pt-16 border-t border-gray-200">
              <div className="max-w-4xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Description</h2>
                <div className="prose prose-lg text-gray-600 leading-relaxed">
                  {product.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Related Products (only published) */}
          <Suspense fallback={<LoadingSpinner text="Loading related products..." />}>
            <RelatedProducts productId={product.id} categoryId={product.categoryId} />
          </Suspense>
        </main>
      </div>
    </>
  )
}