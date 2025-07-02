// ✅ SOLUTION: Update the ProductDetail component to manage shared size state

'use client'

import { useState } from 'react'
import { useCurrency } from '@/contexts/CurrencyContext'
import ProductSizeSelector from '@/components/customer/ProductSizeSelector'
import AddToCartButton from '@/components/cart/AddToCartButton'
import ProductDetailWrapper from '@/components/customer/ProductDetailWrapper'

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

// ✅ ADD: ProductSize interface
interface ProductSize {
  id: string
  size: string
  sku: string
  stockQuantity: number
  lowStockAlert: number
  isActive: boolean
  sortOrder: number
}

// ✅ Component to replace your current ProductDetail component
export default function ProductDetailClient({ 
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
  // ✅ SHARED STATE: Manage selected size at parent level
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null)
  const { formatPrice } = useCurrency()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Product Images */}
      <div>
        {/* Your existing ProductGallery component */}
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

        {/* Price Display */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {originalPrice && (
              <span className="text-lg text-gray-500 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(finalPrice)}
            </span>
            {originalPrice && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                {Math.round(((originalPrice - finalPrice) / originalPrice) * 100)}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-2">
          {stockStatus.isOutOfStock ? (
            <span className="flex items-center gap-1 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Out of Stock
            </span>
          ) : stockStatus.isLowStock ? (
            <span className="flex items-center gap-1 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              Limited stock - {stockStatus.totalStock} sizes running low
            </span>
          ) : (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              Available sizes: {product.productSizes?.filter(s => s.stockQuantity > 0).map(s => s.size).join(', ')}
            </span>
          )}
        </div>

        {/* ✅ SIZE SELECTOR: Pass shared state */}
        {product.requiresSizes && product.productSizes?.length > 0 && (
          <ProductSizeSelector
            product={product}
            stockStatus={stockStatus}
            onSizeSelect={setSelectedSize}  // ✅ Update shared state
            selectedSize={selectedSize}    // ✅ Pass shared state
          />
        )}

        {/* Product Description */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Product Description</h3>
          <div className="prose prose-sm text-gray-600">
            <p>{product.description}</p>
          </div>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-200">
          <div>
            <span className="text-sm font-medium text-gray-900">Category:</span>
            <span className="text-sm text-gray-600 ml-2">{product.category.name}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-900">Origin:</span>
            <span className="text-sm text-gray-600 ml-2">{product.country.name}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-900">Sizes Available:</span>
            <span className="text-sm text-gray-600 ml-2">{product.productSizes?.length || 'N/A'}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-900">Total Stock:</span>
            <span className="text-sm text-gray-600 ml-2">{stockStatus.totalStock} units</span>
          </div>
        </div>

        {/* ✅ ADD TO CART: Pass shared state */}
        <div className="space-y-4">
          <AddToCartButton
            product={product}
            selectedSize={selectedSize}      // ✅ Pass selected size
            onSizeRequired={() => {
              // ✅ Optional: Focus on size selector when size is required
              console.log('Please select a size first')
            }}
            showQuantitySelector={true}
            variant="large"
          />
        </div>

        {/* Product Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Heart className="h-4 w-4" />
            Add to Wishlist
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          <div className="text-center">
            <Shield className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-xs font-medium text-gray-900">Secure Payment</div>
            <div className="text-xs text-gray-500">256-bit SSL encrypted</div>
          </div>
          <div className="text-center">
            <Truck className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-xs font-medium text-gray-900">Fast Shipping</div>
            <div className="text-xs text-gray-500">Free above $75</div>
          </div>
          <div className="text-center">
            <RotateCcw className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-xs font-medium text-gray-900">Easy Returns</div>
            <div className="text-xs text-gray-500">30-day policy</div>
          </div>
        </div>
      </div>
    </div>
  )
}