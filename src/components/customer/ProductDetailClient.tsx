// ✅ UPDATED: src/components/customer/ProductDetailClient.tsx - CATALOG/ECOMMERCE TOGGLE SUPPORT
// Client Component - Handles size selection and interactive features

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCurrency } from '@/contexts/CurrencyContext'
import ProductGallery from '@/components/customer/ProductGallery'
import ProductSizeSelector from '@/components/customer/ProductSizeSelector'
import AddToCartButton from '@/components/cart/AddToCartButton'
import ContactButtons from '@/components/customer/ContactButtons'
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
  AlertTriangle,
  Ruler,
  MessageCircle
} from 'lucide-react'

// ✅ ProductSize interface
interface ProductSize {
  id: string
  size: string
  sku: string
  stockQuantity: number
  lowStockAlert: number
  isActive: boolean
  sortOrder: number
}

interface StoreSettings {
  disableShoppingCart?: boolean
  catalogModeSettings?: string
}

interface ProductDetailClientProps {
  product: any
  stockStatus: any
  finalPrice: number
  originalPrice: number | null
  storeSettings?: StoreSettings | null
}

export default function ProductDetailClient({
  product,
  stockStatus,
  finalPrice,
  originalPrice,
  storeSettings
}: ProductDetailClientProps) {
  // ✅ SHARED STATE: Manage selected size at this level
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const { formatPrice } = useCurrency()

  // ✅ NEW: Parse catalog mode settings
  const isECommerceMode = !storeSettings?.disableShoppingCart
  const catalogSettings = storeSettings?.catalogModeSettings
    ? (() => {
        try {
          return JSON.parse(storeSettings.catalogModeSettings)
        } catch {
          return {
            whatsappNumber: '',
            instagramHandle: '',
            contactMessage: 'Hi! I\'m interested in this product. Can you provide more details?',
            showWhatsApp: true,
            showInstagram: true,
            customContactText: 'Contact us for pricing and availability'
          }
        }
      })()
    : null

  const handleSizeSelect = (size: ProductSize | null) => {
    setSelectedSize(size)
  }

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted)
    // TODO: Implement wishlist API call
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Product Images */}
      <div>
        <ProductGallery images={product.images} productName={product.name} />
      </div>

      {/* Product Information */}
      <div className="space-y-6">
        {/* Product Title & SKU */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">SKU: {product.sku}</span>
            <div className="flex items-center gap-1">
              <Tag className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">{product.category.name}</span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(finalPrice)}
            </span>
            {originalPrice && (
              <span className="text-xl text-gray-500 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
            {originalPrice && (
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                Save {formatPrice(originalPrice - finalPrice)}
              </span>
            )}
          </div>
          
          {/* Country Origin */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>Made in {product.country.name}</span>
          </div>
        </div>

        {/* Stock Status */}
        <div className="space-y-2">
          {stockStatus.isOutOfStock ? (
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Out of Stock</span>
            </div>
          ) : stockStatus.isLowStock ? (
            <div className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Only {stockStatus.totalStock} left in stock</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">In Stock</span>
            </div>
          )}
        </div>

        {/* Size Selection */}
        {stockStatus.requiresSizeSelection && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Select Size
            </h3>
            <ProductSizeSelector 
              product={product}
              stockStatus={stockStatus}
              onSizeSelect={handleSizeSelect}
              selectedSize={selectedSize}
            />
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Description</h3>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          </div>
        )}

        {/* Add to Cart / Contact Section */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          {isECommerceMode ? (
            /* eCommerce Mode: Show Add to Cart */
            <>
              <AddToCartButton
                product={product}
                variant="large"
                showQuantitySelector={true}
                selectedSize={selectedSize}
                disabled={stockStatus.isOutOfStock || (stockStatus.requiresSizeSelection && !selectedSize)}
              />

              {/* Size Selection Required Message */}
              {stockStatus.requiresSizeSelection && !selectedSize && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <Info className="h-5 w-5" />
                    <span className="font-medium">Please select a size to continue</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Catalog Mode: Show Contact Buttons */
            <>
              {catalogSettings && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 text-purple-800 mb-4">
                    <MessageCircle className="h-5 w-5" />
                    <span className="font-medium">Interested in this product?</span>
                  </div>
                  <ContactButtons
                    product={product}
                    catalogSettings={catalogSettings}
                    className="w-full"
                  />
                </div>
              )}

              {/* Size info for catalog mode */}
              {stockStatus.requiresSizeSelection && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Info className="h-5 w-5" />
                    <span className="font-medium">
                      Available in {stockStatus.availableSizes} size{stockStatus.availableSizes !== 1 ? 's' : ''} - Ask about your size when contacting us!
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={toggleWishlist}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 border rounded-lg font-medium transition-colors ${
                isWishlisted
                  ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
              {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
            </button>

            <button className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              <Share2 className="h-5 w-5" />
              Share
            </button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3 text-sm">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Truck className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Free Shipping</div>
              <div className="text-gray-500">On orders over $75</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="p-2 bg-green-100 rounded-lg">
              <RotateCcw className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Easy Returns</div>
              <div className="text-gray-500">30-day return policy</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Secure Payment</div>
              <div className="text-gray-500">100% secure checkout</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}