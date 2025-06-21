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
  AlertTriangle
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

// Get product by slug
async function getProduct(slug: string) {
  // Extract SKU from slug (format: product-name-SKU)
  const parts = slug.split('-')
  const sku = parts[parts.length - 1]

  const product = await db.product.findFirst({
    where: {
      sku: sku,
      isActive: true
    },
    include: {
      category: {
        include: {
          parent: true
        }
      },
      country: true,
      supplier: true
    }
  })

  return product
}

// Get related products
async function getRelatedProducts(productId: string, categoryId: string) {
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
    orderBy: { createdAt: 'desc' }
  })
}

// Main Product Detail Component
async function ProductDetail({ slug }: { slug: string }) {
  const product = await getProduct(slug)

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

        {/* Product Title & Rating */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
              ))}
              <span className="text-sm text-gray-600 ml-2">(24 reviews)</span>
            </div>
            <span className="text-sm text-gray-500">SKU: {product.sku}</span>
          </div>
        </div>

        {/* Price */}
        <div className="text-3xl font-bold text-gray-900">
          {formatPrice(product.sellingPriceUSD)}
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-2">
          {isOutOfStock ? (
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Out of Stock</span>
            </div>
          ) : isLowStock ? (
            <div className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Only {product.stockQuantity} left in stock</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">In Stock</span>
            </div>
          )}
        </div>

        {/* Short Description */}
        {product.shortDescription && (
          <div className="text-lg text-gray-600 leading-relaxed">
            {product.shortDescription}
          </div>
        )}

        {/* Product Details */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Category:</span>
            <span className="text-sm font-medium">{product.category.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Origin:</span>
            <span className="text-sm font-medium">{product.country.name}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <button
              disabled={isOutOfStock}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                isOutOfStock
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg transform hover:-translate-y-1'
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            
            <button className="p-4 border-2 border-gray-300 rounded-lg hover:border-red-500 hover:text-red-500 transition-colors">
              <Heart className="h-6 w-6" />
            </button>
            
            <button className="p-4 border-2 border-gray-300 rounded-lg hover:border-purple-500 hover:text-purple-500 transition-colors">
              <Share2 className="h-6 w-6" />
            </button>
          </div>

          {/* Buy Now Button */}
          {!isOutOfStock && (
            <button className="w-full bg-gray-900 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors">
              Buy Now
            </button>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3 text-sm">
            <Truck className="h-5 w-5 text-green-600" />
            <div>
              <div className="font-medium text-gray-900">Free Shipping</div>
              <div className="text-gray-500">On orders over $100</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Shield className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">Secure Payment</div>
              <div className="text-gray-500">100% protected</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <RotateCcw className="h-5 w-5 text-purple-600" />
            <div>
              <div className="font-medium text-gray-900">Easy Returns</div>
              <div className="text-gray-500">30-day policy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Related Products Component
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

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const [storeSettings, product] = await Promise.all([
    getStoreSettings(),
    getProduct(params.slug)
  ])

  if (!product) {
    notFound()
  }

  // Generate structured data
  const productSchema = generateProductJsonLd(product, storeSettings)
  const breadcrumbSchema = generateBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    { name: product.category.name, url: `/categories/${product.category.slug}` },
    { name: product.name, url: `/products/${params.slug}` }
  ])

  return (
    <>
      {/* JSON-LD Structured Data */}
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

          {/* Product Description */}
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

          {/* Related Products */}
          <Suspense fallback={<LoadingSpinner text="Loading related products..." />}>
            <RelatedProducts productId={product.id} categoryId={product.categoryId} />
          </Suspense>
        </main>
      </div>
    </>
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductDetailPageProps) {
  const [product, storeSettings] = await Promise.all([
    getProduct(params.slug),
    getStoreSettings()
  ])

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
    }
  }

  return generateProductMetadata(product, storeSettings)
}