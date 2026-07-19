// ✅ PERMANENT FIX: src/app/products/[slug]/page.tsx
// Server Component - Fetches data and handles routing

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { generateProductMetadata, generateProductJsonLd } from '@/lib/seo'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import { getCustomerStoreSettings, getNavCategories } from '@/lib/store-settings'
import ProductGallery from '@/components/customer/ProductGallery'
import ProductSizeSelector from '@/components/customer/ProductSizeSelector'
import AddToCartButton from '@/components/cart/AddToCartButton'
import LoadingSpinner from '@/components/customer/LoadingSpinner'
import ProductDetailClient from '@/components/customer/ProductDetailClient'
import {
  Star,
  Heart,
  Share2,
  Shield,
  Truck,
  RotateCcw,
  MapPin,
  Tag,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

interface ProductPageProps {
  params: {
    slug: string
  }
}

// Shared helper - same store settings query every customer page uses
async function getStoreSettings() {
  return getCustomerStoreSettings()
}

// Get product by slug
async function getProduct(slug: string) {
  console.log('🔍 Looking for product with slug:', slug)

  // Extract SKU from slug format: "kurta-HC-KURT-790016" -> "HC-KURT-790016"
  const parts = slug.split('-')
  const sku = parts.slice(-3).join('-') // Get last 3 parts: HC-KURT-790016
  
  console.log('🔍 Extracted SKU:', sku)

  const product = await db.product.findFirst({
    where: {
      sku: sku,
      status: 'PUBLISHED',
      isActive: true
    },
    include: {
      category: {
        include: {
          parent: true
        }
      },
      country: true,
      productSizes: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })

  console.log('🔍 Product search result:', product ? `Found: ${product.name} (${product.sku})` : 'Not found')
  return product
}

// Calculate stock status
function calculateStockStatus(product: any) {
  if (!product) return null

  const totalStock = product.requiresSizes 
    ? product.productSizes?.reduce((sum: number, size: any) => sum + size.stockQuantity, 0) || 0
    : product.stockQuantity

  const isOutOfStock = totalStock === 0
  const isLowStock = totalStock <= 5 && totalStock > 0
  const availableSizes = product.productSizes?.filter((size: any) => size.stockQuantity > 0).length || 0
  const lowStockSizes = product.productSizes?.filter((size: any) => size.stockQuantity <= 5 && size.stockQuantity > 0).length || 0

  return {
    isOutOfStock,
    isLowStock,
    totalStock,
    availableSizes,
    lowStockSizes,
    hasMultipleSizes: product.requiresSizes && product.productSizes?.length > 0,
    requiresSizeSelection: product.requiresSizes && product.productSizes?.length > 0
  }
}

// Calculate pricing
function calculatePricing(product: any) {
  if (!product) return { finalPrice: 0, originalPrice: null }

  const hasDiscount = product.discountPercentage > 0 && product.showDiscountToCustomers
  const originalPrice = hasDiscount ? product.sellingPriceUSD : null
  const finalPrice = hasDiscount 
    ? product.sellingPriceUSD * (1 - product.discountPercentage / 100)
    : product.sellingPriceUSD

  return { finalPrice, originalPrice }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps) {
  // ✅ FIXED: Fetch both product and storeSettings in parallel
  const [product, storeSettings] = await Promise.all([
    getProduct(params.slug),
    getStoreSettings()
  ])
  
  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.'
    }
  }

  // ✅ FIXED: Pass both product and storeSettings to generateProductMetadata
  return generateProductMetadata(product, storeSettings)
}

// Main Product Detail Page
export default async function ProductDetailPage({ params }: ProductPageProps) {
  const [storeSettings, product, navCategories] = await Promise.all([
    getStoreSettings(),
    getProduct(params.slug),
    getNavCategories()
  ])

  // Handle 404 for missing or draft products
  if (!product) {
    notFound()
  }

  // Calculate derived data
  const stockStatus = calculateStockStatus(product)
  const { finalPrice, originalPrice } = calculatePricing(product)

  // Generate structured data for SEO
  const productJsonLd = generateProductJsonLd(product, storeSettings)


  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd)
        }}
      />

      <div className="min-h-screen bg-gray-50">
        <CustomerNavigation storeSettings={storeSettings} initialCategories={navCategories} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-gray-500 mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-purple-600 transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/products" className="hover:text-purple-600 transition-colors">Products</Link>
            <span className="mx-2">/</span>
            <Link 
              href={`/categories/${product.category.slug}`} 
              className="hover:text-purple-600 transition-colors"
            >
              {product.category.name}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>

          {/* Product Detail Client Component */}
          <ProductDetailClient
            product={product}
            stockStatus={stockStatus}
            finalPrice={finalPrice}
            originalPrice={originalPrice}
            storeSettings={storeSettings}
          />
        </main>
      </div>
    </>
  )
}