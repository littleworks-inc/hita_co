// ✅ FIXED: src/app/products/[slug]/page.tsx - Enhanced SKU Extraction

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

// ✅ FIXED: Enhanced product fetching with correct SKU extraction
async function getProduct(slug: string) {
  console.log(`🔍 Getting product from slug: ${slug}`)
  
  // ✅ CRITICAL FIX: Extract SKU correctly from slug
  // URL format: "product-name-SKU" where SKU can contain hyphens like "HC-SARE-452468"
  // Example: "saree-HC-SARE-452468" should extract "HC-SARE-452468"
  
  let sku: string
  
  // Method 1: Look for HC- pattern (your SKUs start with HC-)
  const hcMatch = slug.match(/HC-[A-Z0-9-]+$/i)
  if (hcMatch) {
    sku = hcMatch[0]
    console.log(`✅ Extracted SKU using HC- pattern: ${sku}`)
  } else {
    // Method 2: Look for any pattern that could be a SKU (contains letters and numbers)
    const skuMatch = slug.match(/[A-Z]{2,}-[A-Z0-9-]+$/i)
    if (skuMatch) {
      sku = skuMatch[0]
      console.log(`✅ Extracted SKU using general pattern: ${sku}`)
    } else {
      // Fallback: Take everything after the last dash (old method)
      const parts = slug.split('-')
      sku = parts[parts.length - 1]
      console.log(`⚠️ Using fallback extraction: ${sku}`)
    }
  }

  console.log(`🔍 Final extracted SKU: ${sku} from slug: ${slug}`)

  // Try to fetch the product using multiple approaches for maximum compatibility
  try {
    // Primary approach: Try with status field
    let product
    try {
      product = await db.product.findFirst({
        where: {
          sku: sku,
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
        },
        // ✅ Ensure we select all fields including discount fields
        select: {
          id: true,
          name: true,
          sku: true,
          description: true,
          shortDescription: true,
          sellingPriceUSD: true,
          discountPercentage: true,
          showDiscountToCustomers: true,
          images: true,
          stockQuantity: true,
          isFeatured: true,
          tags: true,
          seoTitle: true,
          seoDescription: true,
          isActive: true,
          status: true,
          categoryId: true,
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
          },
          createdAt: true,
          updatedAt: true
        }
      })
      
      if (product) {
        console.log(`✅ Found product using status field: ${product.name} (SKU: ${product.sku})`)
        return product
      }
    } catch (statusError) {
      console.warn('⚠️ Status field query failed, trying fallback:', statusError.message)
    }

    // Fallback approach: Use only isActive field
    product = await db.product.findFirst({
      where: {
        sku: sku,
        isActive: true
      },
      // ✅ Ensure we select all fields including discount fields
      select: {
        id: true,
        name: true,
        sku: true,
        description: true,
        shortDescription: true,
        sellingPriceUSD: true,
        discountPercentage: true,
        showDiscountToCustomers: true,
        images: true,
        stockQuantity: true,
        isFeatured: true,
        tags: true,
        seoTitle: true,
        seoDescription: true,
        isActive: true,
        status: true,
        categoryId: true,
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
        },
        createdAt: true,
        updatedAt: true
      }
    })

    if (product) {
      console.log(`✅ Found product using fallback isActive: ${product.name} (SKU: ${product.sku})`)
    } else {
      console.log(`❌ No active product found with SKU: ${sku}`)
      
      // Debug: Let's see what SKUs are actually available
      const allActiveProducts = await db.product.findMany({
        where: { isActive: true },
        select: { sku: true, name: true }
      })
      console.log('📦 Available SKUs:', allActiveProducts.map(p => p.sku))
    }

    return product
  } catch (error) {
    console.error(`❌ Error fetching product with SKU ${sku}:`, error)
    return null
  }
}

// Get related published products only
async function getRelatedProducts(productId: string, categoryId: string) {
  try {
    // Try the new status-based query first
    return await db.product.findMany({
      where: {
        OR: [
          { status: 'PUBLISHED' },
          { 
            AND: [
              { status: null },
              { isActive: true }
            ]
          }
        ],
        stockQuantity: { gt: 0 },
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
    
  } catch (error) {
    console.warn('⚠️ Status field query failed for related products, using fallback...', error.message)
    
    // Fallback: Use old isActive-based query
    return await db.product.findMany({
      where: {
        isActive: true,
        stockQuantity: { gt: 0 },
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

        {/* Price with Discount Logic */}
        <div className="space-y-2">
          {/* Calculate discount information */}
          {(() => {
            const hasDiscount = product.discountPercentage > 0
            const shouldShowDiscount = hasDiscount && product.showDiscountToCustomers
            
            if (shouldShowDiscount) {
              // ✅ CRITICAL FIX: Use the SAME logic as admin system
              // sellingPriceUSD is the ORIGINAL price (before discount)
              const originalPrice = product.sellingPriceUSD  // $104.04 (original price)
              
              // Calculate the final discounted price (what customer actually pays)
              const finalPrice = originalPrice * (1 - product.discountPercentage / 100)  // $93.64
              const savings = originalPrice - finalPrice  // $10.40

              return (
                <>
                  {/* Discount pricing display */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-2xl line-through text-gray-400">
                      {formatPrice(originalPrice)}
                    </span>
                    <span className="text-3xl font-bold text-red-600">
                      {formatPrice(finalPrice)}
                    </span>
                    <span className="bg-red-100 text-red-600 px-3 py-1.5 rounded-full text-sm font-bold">
                      {product.discountPercentage}% OFF
                    </span>
                  </div>
                  {/* Savings information */}
                  <div className="text-lg text-green-600 font-medium">
                    You save {formatPrice(savings)}
                  </div>
                </>
              )
            } else {
              /* Regular price when no discount */
              return (
                <div className="text-3xl font-bold text-purple-600">
                  {formatPrice(product.sellingPriceUSD)}
                </div>
              )
            }
          })()}
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
              <span className="font-medium">In Stock</span>
            </div>
          )}
        </div>

        {/* Short Description */}
        {product.shortDescription && (
          <div className="text-gray-600 leading-relaxed">
            {product.shortDescription}
          </div>
        )}

        {/* Product Features */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Made in {product.country.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Tag className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{product.category.name}</span>
          </div>
        </div>

        {/* Add to Cart Section */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
              Quantity:
            </label>
            <select
              id="quantity"
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              defaultValue={1}
            >
              {Array.from({ length: Math.min(10, product.stockQuantity) }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              disabled={isOutOfStock}
              className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <ShoppingCart className="h-5 w-5 inline mr-2" />
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Heart className="h-5 w-5 text-gray-600" />
            </button>
            <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Share2 className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          <div className="text-center">
            <Shield className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-xs font-medium text-gray-900">Secure Payment</div>
            <div className="text-xs text-gray-500">100% protected</div>
          </div>
          <div className="text-center">
            <Truck className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-xs font-medium text-gray-900">Free Shipping</div>
            <div className="text-xs text-gray-500">Orders over $50</div>
          </div>
          <div className="text-center">
            <RotateCcw className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <div className="text-xs font-medium text-gray-900">Easy Returns</div>
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

// ✅ FIXED: Generate static paths with better error handling
export async function generateStaticParams() {
  try {
    console.log('🔍 Generating static params for product pages...')
    
    // Try the new status-based query first
    let products
    try {
      products = await db.product.findMany({
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
      console.log(`✅ Generated static params for ${products.length} products using status field`)
    } catch (statusError) {
      console.warn('⚠️ Status field not available, using fallback query:', statusError.message)
      
      // Fallback: Use the old isActive-based query
      products = await db.product.findMany({
        where: {
          isActive: true
        },
        select: {
          sku: true,
          name: true
        }
      })
      console.log(`✅ Fallback: Generated static params for ${products.length} products`)
    }
    
    const generatedSlugs = products.map((product) => {
      const slug = `${product.name.toLowerCase().replace(/\s+/g, '-')}-${product.sku}`
      console.log(`📎 Generated slug: ${slug} for SKU: ${product.sku}`)
      return { slug }
    })
    
    return generatedSlugs
    
  } catch (error) {
    console.error('❌ Failed to generate static params:', error)
    return []
  }
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