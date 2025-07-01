// ✅ ENHANCED: src/app/products/[slug]/page.tsx 
// Product Detail Page with Complete Size Selection System

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
import AddToCartButton from '@/components/cart/AddToCartButton'
import ProductSizeSelector from '@/components/customer/ProductSizeSelector' // ✅ NEW: Size selector component
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
  Eye,
  Ruler // ✅ NEW: Size icon
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

// ✅ ENHANCED: Product fetching with size data
async function getProduct(slug: string) {
  console.log(`🔍 Getting product from slug: ${slug}`)
  
  // Extract SKU from slug (Enhanced method)
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

  console.log(`🔍 Looking up product with SKU: ${sku}`)

  try {
    const product = await db.product.findFirst({
      where: {
        sku: sku,
        status: 'PUBLISHED', // Only published products
        isActive: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        country: {
          select: {
            id: true,
            name: true,
            currency: true,
            currencySymbol: true
          }
        },
        // ✅ NEW: Include size data
        productSizes: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            size: true,
            sku: true,
            stockQuantity: true,
            lowStockAlert: true,
            sortOrder: true
          },
          orderBy: {
            sortOrder: 'asc'
          }
        }
      }
    })

    if (product) {
      console.log(`✅ Found product: ${product.name}`)
      if (product.requiresSizes) {
        console.log(`📏 Product has ${product.productSizes?.length || 0} sizes`)
      }
    } else {
      console.log(`❌ No product found with SKU: ${sku}`)
    }

    return product
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

// Get related products with size awareness
async function getRelatedProducts(categoryId: string, productId: string) {
  try {
    // Priority: Published products with stock (considering sizes)
    const relatedProducts = await db.product.findMany({
      where: {
        categoryId: categoryId,
        id: { not: productId },
        status: 'PUBLISHED',
        isActive: true,
        OR: [
          // Non-sized products with stock
          {
            requiresSizes: false,
            stockQuantity: { gt: 0 }
          },
          // Sized products with at least one size in stock
          {
            requiresSizes: true,
            productSizes: {
              some: {
                stockQuantity: { gt: 0 },
                isActive: true
              }
            }
          }
        ]
      },
      include: {
        category: true,
        country: true,
        productSizes: {
          where: {
            isActive: true,
            stockQuantity: { gt: 0 }
          },
          select: {
            id: true,
            size: true,
            stockQuantity: true
          }
        }
      },
      take: 4,
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    if (relatedProducts.length > 0) {
      return relatedProducts
    }

    // Fallback: Any published products in category
    return await db.product.findMany({
      where: {
        isActive: true,
        status: 'PUBLISHED',
        categoryId: categoryId,
        id: { not: productId }
      },
      include: {
        category: true,
        country: true,
        productSizes: {
          where: { isActive: true },
          select: {
            id: true,
            size: true,
            stockQuantity: true
          }
        }
      },
      take: 4,
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ]
    })
  } catch (error) {
    console.error('Error fetching related products:', error)
    return []
  }
}

// ✅ ENHANCED: Stock calculation with size awareness
function calculateStockStatus(product: any) {
  if (product.requiresSizes && product.productSizes?.length > 0) {
    const totalStock = product.productSizes.reduce((total, size) => total + size.stockQuantity, 0)
    const availableSizes = product.productSizes.filter(size => size.stockQuantity > 0)
    const lowStockSizes = product.productSizes.filter(size => 
      size.stockQuantity > 0 && size.stockQuantity <= size.lowStockAlert
    )

    return {
      isOutOfStock: totalStock === 0,
      isLowStock: lowStockSizes.length > 0 && totalStock > 0,
      totalStock,
      availableSizes: availableSizes.length,
      lowStockSizes: lowStockSizes.length,
      hasMultipleSizes: product.productSizes.length > 1,
      requiresSizeSelection: true
    }
  } else {
    return {
      isOutOfStock: product.stockQuantity === 0,
      isLowStock: product.stockQuantity <= 5 && product.stockQuantity > 0,
      totalStock: product.stockQuantity,
      availableSizes: null,
      lowStockSizes: null,
      hasMultipleSizes: false,
      requiresSizeSelection: false
    }
  }
}

// Generate metadata
export async function generateMetadata({ params }: ProductDetailPageProps) {
  const product = await getProduct(params.slug)
  if (!product) return { title: 'Product Not Found' }
  
  return generateProductMetadata(product)
}

// Main page component
export default async function ProductPage({ params }: ProductDetailPageProps) {
  const [product, storeSettings] = await Promise.all([
    getProduct(params.slug),
    getStoreSettings()
  ])

  if (!product) {
    notFound()
  }

  const relatedProducts = await getRelatedProducts(product.categoryId, product.id)
  const stockStatus = calculateStockStatus(product)

  // Calculate final price with discount
  const finalPrice = product.showDiscountToCustomers && product.discountPercentage > 0
    ? product.sellingPriceUSD * (1 - product.discountPercentage / 100)
    : product.sellingPriceUSD

  const originalPrice = product.showDiscountToCustomers && product.discountPercentage > 0
    ? product.sellingPriceUSD
    : null

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateProductJsonLd(product))
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBreadcrumbJsonLd([
            { name: 'Home', url: '/' },
            { name: 'Products', url: '/products' },
            { name: product.category.name, url: `/categories/${product.category.slug}` },
            { name: product.name, url: `/products/${params.slug}` }
          ]))
        }}
      />

      <CustomerNavigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductDetail product={product} stockStatus={stockStatus} finalPrice={finalPrice} originalPrice={originalPrice} />
        
        <Suspense fallback={<LoadingSpinner />}>
          <RelatedProducts products={relatedProducts} />
        </Suspense>
      </main>
    </>
  )
}

// Main Product Detail Component
async function ProductDetail({ 
  product, 
  stockStatus, 
  finalPrice, 
  originalPrice 
}: { 
  product: any
  stockStatus: any
  finalPrice: number
  originalPrice: number | null
}) {
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
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(finalPrice, product.country.currencySymbol)}
            </span>
            {originalPrice && (
              <>
                <span className="text-xl text-gray-500 line-through">
                  {formatPrice(originalPrice, product.country.currencySymbol)}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  {product.discountPercentage}% OFF
                </span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-600">
            Includes all taxes • Free shipping on orders over $100
          </p>
        </div>

        {/* ✅ NEW: Size Selection Section */}
        {product.requiresSizes && product.productSizes?.length > 0 && (
          <ProductSizeSelector 
            product={product}
            stockStatus={stockStatus}
          />
        )}

        {/* Stock Status */}
        <div className="space-y-2">
          {stockStatus.isOutOfStock ? (
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Out of Stock</span>
            </div>
          ) : stockStatus.isLowStock ? (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                {product.requiresSizes 
                  ? `Limited stock - ${stockStatus.lowStockSizes} size${stockStatus.lowStockSizes !== 1 ? 's' : ''} running low`
                  : `Only ${stockStatus.totalStock} left in stock`
                }
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                {product.requiresSizes 
                  ? `Available in ${stockStatus.availableSizes} size${stockStatus.availableSizes !== 1 ? 's' : ''}`
                  : 'In Stock'
                }
              </span>
            </div>
          )}

          {/* ✅ NEW: Size availability summary */}
          {product.requiresSizes && product.productSizes?.length > 0 && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Available sizes: </span>
              {product.productSizes
                .filter(size => size.stockQuantity > 0)
                .map(size => size.size)
                .join(', ')}
            </div>
          )}
        </div>

        {/* Short Description */}
        {product.shortDescription && (
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700">{product.shortDescription}</p>
          </div>
        )}

        {/* Product Details */}
        <div className="border-t border-b border-gray-200 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-900">Category:</span>
              <span className="ml-2 text-gray-600">{product.category.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Origin:</span>
              <span className="ml-2 text-gray-600">{product.country.name}</span>
            </div>
            {product.requiresSizes && (
              <div>
                <span className="font-medium text-gray-900">Sizes Available:</span>
                <span className="ml-2 text-gray-600">{product.productSizes?.length || 0}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-900">Total Stock:</span>
              <span className="ml-2 text-gray-600">{stockStatus.totalStock} units</span>
            </div>
          </div>
        </div>

        {/* Add to Cart Section */}
        <div className="space-y-4">
          {(() => {
            return (
              <AddToCartButton 
                product={{
                  id: product.id,
                  sku: product.sku,
                  name: product.name,
                  sellingPriceUSD: finalPrice,
                  stockQuantity: stockStatus.totalStock,
                  images: product.images,
                  category: product.category,
                  country: product.country,
                  // ✅ NEW: Size information
                  requiresSizes: product.requiresSizes,
                  productSizes: product.productSizes
                }}
                variant="large"
                showQuantitySelector={!product.requiresSizes} // Hide quantity selector for sized products
                className="w-full"
                disabled={stockStatus.isOutOfStock}
              />
            )
          })()}

          {/* Additional action buttons */}
          <div className="flex gap-3">
            <button className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2">
              <Heart className="h-5 w-5" />
              Add to Wishlist
            </button>
            <button className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2">
              <Share2 className="h-5 w-5" />
              Share
            </button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          <div className="text-center">
            <Shield className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-xs font-medium text-gray-900">Secure Payment</div>
            <div className="text-xs text-gray-500">SSL Encrypted</div>
          </div>
          <div className="text-center">
            <Truck className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-xs font-medium text-gray-900">Free Shipping</div>
            <div className="text-xs text-gray-500">Orders over $100</div>
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

// Related Products Section
function RelatedProducts({ products }: { products: any[] }) {
  if (products.length === 0) return null

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">You might also like</h2>
        <Link href="/products" className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
          View all products
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}