// ✅ SIMPLIFIED: Update ProductSizeSelector.tsx

// 1. Remove the size type from Product interface (around line 20-40)
interface Product {
  id: string
  name: string
  sku: string
  sellingPriceUSD: number
  requiresSizes: boolean
  // ✅ REMOVE: sizeType field no longer needed
  productSizes?: ProductSize[]
  country: {
    currencySymbol: string
  }
}

// 2. Remove the SIZE_GUIDES object entirely (around line 60-100)
// DELETE ALL OF THIS:
// const SIZE_GUIDES = {
//   CLOTHING: { ... },
//   SHOE: { ... },
//   JEWELRY: { ... },
//   CUSTOM: { ... }
// }

// 3. Simplify the component (around line 120-160)
export default function ProductSizeSelector({ 
  product, 
  stockStatus, 
  onSizeSelect,
  selectedSize: externalSelectedSize 
}: ProductSizeSelectorProps) {
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(externalSelectedSize || null)
  // ✅ REMOVE: showSizeGuide state no longer needed

  // Update selected size when external prop changes
  useEffect(() => {
    if (externalSelectedSize !== undefined) {
      setSelectedSize(externalSelectedSize)
    }
  }, [externalSelectedSize])

  // Handle size selection
  const handleSizeSelect = (size: ProductSize) => {
    const newSelectedSize = selectedSize?.id === size.id ? null : size
    setSelectedSize(newSelectedSize)
    onSizeSelect?.(newSelectedSize)
  }

  // Get available sizes (in stock)
  const availableSizes = product.productSizes?.filter(size => size.stockQuantity > 0) || []
  
  // Get out of stock sizes
  const outOfStockSizes = product.productSizes?.filter(size => size.stockQuantity === 0) || []

  if (!product.requiresSizes || !product.productSizes?.length) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* ✅ SIMPLIFIED: Size Selection Header */}
      <div className="flex items-center gap-2">
        <Ruler className="h-5 w-5 text-gray-600" />
        <span className="font-medium text-gray-900">
          Size {selectedSize && <span className="text-purple-600">({selectedSize.size})</span>}
        </span>
      </div>

      {/* ✅ REMOVE: Size Guide section entirely */}

      {/* Available Sizes */}
      {availableSizes.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Available Sizes</h4>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {availableSizes.map((size) => {
              const isSelected = selectedSize?.id === size.id
              const isLowStock = size.stockQuantity <= size.lowStockAlert
              
              return (
                <button
                  key={size.id}
                  onClick={() => handleSizeSelect(size)}
                  className={`
                    relative p-3 border rounded-lg text-center transition-all duration-200
                    ${isSelected 
                      ? 'border-purple-600 bg-purple-50 text-purple-700' 
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                    }
                    ${isLowStock ? 'ring-2 ring-amber-200' : ''}
                  `}
                >
                  <div className="font-medium">{size.size}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {size.stockQuantity} left
                  </div>
                  
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1">
                      <CheckCircle className="h-4 w-4 text-purple-600 bg-white rounded-full" />
                    </div>
                  )}
                  
                  {/* Low stock indicator */}
                  {isLowStock && (
                    <div className="absolute -top-1 -left-1">
                      <AlertTriangle className="h-4 w-4 text-amber-500 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Out of Stock Sizes */}
      {outOfStockSizes.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-500">Currently Out of Stock</h4>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {outOfStockSizes.map((size) => (
              <div
                key={size.id}
                className="p-3 border border-gray-200 rounded-lg text-center bg-gray-50 opacity-60 cursor-not-allowed"
              >
                <div className="font-medium text-gray-400">{size.size}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Out of stock
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Size Information */}
      {selectedSize && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-green-900">
                Size {selectedSize.size} Selected
              </h4>
              <div className="text-sm text-green-700 mt-1 space-y-1">
                <div>SKU: {selectedSize.sku}</div>
                <div>
                  Stock: {selectedSize.stockQuantity} available
                  {selectedSize.stockQuantity <= selectedSize.lowStockAlert && (
                    <span className="ml-2 text-amber-600 font-medium">
                      (Low stock!)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Size Selection Required Notice */}
      {!selectedSize && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900">Size Selection Required</h4>
              <p className="text-sm text-amber-700 mt-1">
                Please select a size to add this item to your cart.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Size Summary */}
      <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span>Total available:</span>
          <span className="font-medium">{stockStatus.totalStock} units across {availableSizes.length} sizes</span>
        </div>
        {stockStatus.lowStockSizes > 0 && (
          <div className="flex items-center justify-between mt-1">
            <span>Low stock sizes:</span>
            <span className="font-medium text-amber-600">{stockStatus.lowStockSizes}</span>
          </div>
        )}
      </div>
    </div>
  )
}