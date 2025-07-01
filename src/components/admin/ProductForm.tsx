// =====================================
// MODULAR: src/components/admin/ProductForm.tsx
// Clean, Modular ProductForm using Separate Components
// =====================================

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { generateSKU } from '@/lib/utils'
import Link from 'next/link'
import {
  Save,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

// Import all the modular components
import ProductBasicInfo from '@/components/admin/ProductBasicInfo'
import ProductDescriptions from '@/components/admin/ProductDescriptions'
import ProductPricing from '@/components/admin/ProductPricing'
import ProductSizeManager from '@/components/admin/ProductSizeManager'
import ProductBarcodeGenerator from '@/components/admin/ProductBarcodeGenerator'
import ProductSEO from '@/components/admin/ProductSEO'

// =====================================
// INTERFACES
// =====================================

interface Category {
  id: string
  name: string
  slug: string
}

interface Supplier {
  id: string
  name: string
  contactPerson?: string
  phone?: string
  email?: string
}

interface Country {
  id: string
  name: string
  code: string
  currency: string
  currencySymbol: string
  exchangeRate: number | null
  isDefault?: boolean
}

interface ProductSize {
  id?: string
  size: string
  sku: string
  stockQuantity: number
  lowStockAlert: number
  isActive: boolean
  sortOrder: number
}

interface Product {
  id?: string
  sku: string
  name: string
  description: string
  shortDescription: string
  categoryId: string
  countryId: string
  barcode: string
  barcodeType: string
  supplierId: string
  purchaseDate: string
  invoiceNumber: string
  originalPrice: number
  originalCurrency: string
  quantity: number
  gstPercentage: number
  shippingCost: number
  conversionCharges: number
  additionalExpenses: number
  costPriceUSD: number
  piecePriceUSD: number
  profitMargin: number
  discountPercentage: number
  showDiscountToCustomers: boolean
  sellingPriceUSD: number
  stockQuantity: number
  lowStockAlert: number
  isActive: boolean
  isFeatured: boolean
  tags: string[]
  images: string[]
  seoTitle?: string
  seoDescription?: string
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  publishedAt?: string | null
  archivedAt?: string | null
  // Size system fields
  requiresSizes: boolean
  productSizes: ProductSize[]
}

interface ProductFormProps {
  categories: Category[]
  countries: Country[]
  suppliers: Supplier[]
  product?: Product
  mode: 'create' | 'edit'
}

// =====================================
// MAIN COMPONENT
// =====================================

export default function ProductForm({ categories, countries, suppliers, product, mode }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')

  // Barcode-specific state
  const [barcodeNeedsUpdate, setBarcodeNeedsUpdate] = useState(false)
  const [originalSku, setOriginalSku] = useState(product?.sku || '')

  // Enhanced pricing state
  const [showCustomerPreview, setShowCustomerPreview] = useState(false)
  const [showCostBreakdown, setShowCostBreakdown] = useState(false)
  const [pricingMode, setPricingMode] = useState<'automatic' | 'manual'>('automatic')

  // Form state with NO hardcoded defaults - admin sets everything
  const [formData, setFormData] = useState<Product>({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    shortDescription: product?.shortDescription || '',
    categoryId: product?.categoryId || '',
    countryId: product?.countryId || countries.find(c => c.isDefault)?.id || '',
    barcode: product?.barcode || '',
    barcodeType: product?.barcodeType || 'CODE128',
    supplierId: product?.supplierId || '',
    purchaseDate: product?.purchaseDate || new Date().toISOString().split('T')[0],
    invoiceNumber: product?.invoiceNumber || '',
    originalPrice: product?.originalPrice || 0,        // ✅ No hardcoded values
    originalCurrency: product?.originalCurrency || 'USD',
    quantity: product?.quantity || 1,                  // ✅ Minimal default
    gstPercentage: product?.gstPercentage || 0,        // ✅ No default GST
    shippingCost: product?.shippingCost || 0,          // ✅ No default shipping
    conversionCharges: product?.conversionCharges || 0, // ✅ No default charges
    additionalExpenses: product?.additionalExpenses || 0, // ✅ No default expenses
    costPriceUSD: product?.costPriceUSD || 0,          // ✅ Will be calculated
    piecePriceUSD: product?.piecePriceUSD || 0,        // ✅ Will be calculated
    profitMargin: product?.profitMargin || 0,          // ✅ No default margin
    discountPercentage: product?.discountPercentage || 0, // ✅ No default discount
    showDiscountToCustomers: product?.showDiscountToCustomers ?? true,
    sellingPriceUSD: product?.sellingPriceUSD || 0,    // ✅ Will be calculated
    stockQuantity: product?.stockQuantity || 0,        // ✅ No default stock
    lowStockAlert: product?.lowStockAlert || 0,        // ✅ No default alert
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    tags: product?.tags || [],
    images: product?.images || [],
    seoTitle: product?.seoTitle || '',
    seoDescription: product?.seoDescription || '',
    status: product?.status || 'DRAFT',
    publishedAt: product?.publishedAt || null,
    archivedAt: product?.archivedAt || null,
    requiresSizes: product?.requiresSizes ?? false,
    productSizes: product?.productSizes || []
  })

  // =====================================
  // HELPER FUNCTIONS
  // =====================================

  const safeToFixed = (value: number | undefined | null, digits: number = 2): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.00'
    }
    return Number(value).toFixed(digits)
  }

  const safeNumber = (value: number | undefined | null): number => {
    if (value === undefined || value === null || isNaN(value)) {
      return 0
    }
    return Number(value)
  }

  // Pricing suggestions based on category - NO hardcoded values
  const getPricingSuggestions = () => {
    const category = categories.find(c => c.id === formData.categoryId)
    if (!category) return null

    // Return empty suggestions - let admin decide their own pricing strategy
    return {
      margin: [0, 0],    // ✅ No suggested margins - admin sets their own
      stock: [0, 0],     // ✅ No suggested stock - admin sets their own  
      discount: [0, 0],  // ✅ No suggested discounts - admin sets their own
      message: `Category: ${category.name} - Set your own pricing strategy`
    }
  }

  const pricingSuggestions = useMemo(() => getPricingSuggestions(), [formData.categoryId, categories])

  // =====================================
  // INPUT HANDLING
  // =====================================

  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Auto-calculate cost breakdown when relevant fields change
    if (['originalPrice', 'quantity', 'gstPercentage', 'shippingCost', 'conversionCharges', 'additionalExpenses', 'countryId'].includes(field)) {
      const country = countries.find(c => c.id === (field === 'countryId' ? value : formData.countryId))
      if (country?.exchangeRate) {
        setTimeout(() => {
          const updatedFormData = { ...formData, [field]: value }

          // Calculate costs step by step
          const originalPrice = safeNumber(updatedFormData.originalPrice)
          const quantity = safeNumber(updatedFormData.quantity)
          const gstPercentage = safeNumber(updatedFormData.gstPercentage)
          const shippingCost = safeNumber(updatedFormData.shippingCost)
          const conversionCharges = safeNumber(updatedFormData.conversionCharges)
          const additionalExpenses = safeNumber(updatedFormData.additionalExpenses)
          const exchangeRate = safeNumber(country.exchangeRate)

          const gstAmount = (originalPrice * gstPercentage) / 100
          const totalCostInLocalCurrency = originalPrice + gstAmount + shippingCost + conversionCharges + additionalExpenses
          const totalCostUSD = exchangeRate > 0 ? totalCostInLocalCurrency / exchangeRate : totalCostInLocalCurrency
          const costPerPieceUSD = quantity > 0 ? totalCostUSD / quantity : totalCostUSD

          setFormData(prev => ({
            ...prev,
            costPriceUSD: totalCostUSD,
            piecePriceUSD: costPerPieceUSD
          }))
        }, 100)
      }
    }

    // Auto-calculate selling price when profit margin changes
    if (['piecePriceUSD', 'profitMargin'].includes(field) && pricingMode === 'automatic') {
      setTimeout(() => {
        const updatedFormData = { ...formData, [field]: value }
        const newSellingPrice = updatedFormData.piecePriceUSD * (1 + updatedFormData.profitMargin / 100)
        setFormData(prev => ({ ...prev, sellingPriceUSD: newSellingPrice }))
      }, 100)
    }

    // SKU change detection for barcode updates
    if (field === 'sku') {
      if (originalSku && originalSku !== value && formData.barcode) {
        setBarcodeNeedsUpdate(true)
        console.log('🔄 SKU changed, barcode needs update:', { from: originalSku, to: value })
      }
    }
  }

  // Auto-generate SKU when name/category changes
  useEffect(() => {
    if (formData.name && formData.categoryId && !product?.sku) {
      const category = categories.find(c => c.id === formData.categoryId)
      if (category) {
        const generatedSKU = generateSKU(formData.name, category.name)
        handleInputChange('sku', generatedSKU)
      }
    }
  }, [formData.name, formData.categoryId])

  // =====================================
  // COMPONENT-SPECIFIC HANDLERS
  // =====================================

  // Error handling helpers
  const setError = (field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const clearError = (field: string) => {
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  // Size management handlers
  const handleRequiresSizesChange = (requiresSizes: boolean) => {
    setFormData(prev => ({
      ...prev,
      requiresSizes,
      productSizes: requiresSizes ? prev.productSizes : []
    }))
  }

  const handleSizesChange = (sizes: ProductSize[]) => {
    setFormData(prev => ({ ...prev, productSizes: sizes }))
  }

  // Barcode handlers
  const handleBarcodeGenerated = (barcode: string, barcodeType: string) => {
    setFormData(prev => ({
      ...prev,
      barcode,
      barcodeType
    }))
    setBarcodeNeedsUpdate(false)
    setSuccessMessage(`${barcodeType} barcode generated: ${barcode}`)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  // =====================================
  // FORM VALIDATION AND SUBMISSION
  // =====================================

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Basic validation
    if (!formData.name?.trim()) newErrors.name = 'Product name is required'
    if (!formData.sku?.trim()) newErrors.sku = 'SKU is required'
    if (!formData.categoryId) newErrors.categoryId = 'Category is required'
    if (!formData.countryId) newErrors.countryId = 'Country is required'
    if (!formData.supplierId) newErrors.supplierId = 'Supplier is required'
    if (formData.originalPrice <= 0) newErrors.originalPrice = 'Original price must be greater than 0'
    if (formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0'

    // Size-specific validation
    if (formData.requiresSizes) {
      if (!formData.productSizes || formData.productSizes.length === 0) {
        newErrors.sizes = 'At least one size variant is required when sizes are enabled'
      } else {
        const sizeErrors = formData.productSizes.map((size, index) => {
          if (!size.size?.trim()) return `Size ${index + 1}: Size name is required`
          if (!size.sku?.trim()) return `Size ${index + 1}: SKU is required`
          if (size.stockQuantity < 0) return `Size ${index + 1}: Stock quantity cannot be negative`
          return null
        }).filter(Boolean)

        if (sizeErrors.length > 0) {
          newErrors.sizes = sizeErrors[0] as string
        }
      }
    } else {
      if (formData.stockQuantity < 0) newErrors.stockQuantity = 'Stock quantity cannot be negative'
      if (formData.lowStockAlert < 0) newErrors.lowStockAlert = 'Low stock alert cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      setErrors(prev => ({ ...prev, submit: 'Please fix the errors above' }))
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const endpoint = mode === 'create' ? '/api/admin/products' : `/api/admin/products/${product?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage(`Product ${mode === 'create' ? 'created' : 'updated'} successfully!`)
        setTimeout(() => {
          router.push('/admin/products')
        }, 1500)
      } else {
        setErrors({ submit: data.error || 'Failed to save product' })
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  // =====================================
  // RENDER COMPONENT
  // =====================================

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {mode === 'create' ? 'Create Product' : 'Edit Product'}
          </h1>
          <p className="text-gray-600 mt-1">
            {mode === 'create' ? 'Add a new product to your ethnic fashion inventory' : 'Update product information'}
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/admin/products">
            <Button variant="outline">Cancel</Button>
          </Link>
          {product && (
            <Link href={`/products/${product.id}`} target="_blank">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800 font-medium">{errors.submit}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Basic Information */}
        <ProductBasicInfo
          formData={formData}
          categories={categories}
          countries={countries}
          suppliers={suppliers}
          errors={errors}
          onInputChange={handleInputChange}
        />

        {/* 2. Product Descriptions */}
        <ProductDescriptions
          formData={formData}
          onInputChange={handleInputChange}
        />

        {/* 3. Enhanced Pricing & Inventory */}
        <ProductPricing
          formData={formData}
          selectedCountry={countries.find(c => c.id === formData.countryId)}
          exchangeRate={countries.find(c => c.id === formData.countryId)?.exchangeRate || 1}
          errors={errors}
          onInputChange={handleInputChange}
          pricingSuggestions={pricingSuggestions}
          showCostBreakdown={showCostBreakdown}
          onToggleCostBreakdown={() => setShowCostBreakdown(!showCostBreakdown)}
          pricingMode={pricingMode}
          onPricingModeChange={setPricingMode}
          showCustomerPreview={showCustomerPreview}
          onToggleCustomerPreview={() => setShowCustomerPreview(!showCustomerPreview)}
        />

        {/* 4. Size Management */}
        <ProductSizeManager
          requiresSizes={formData.requiresSizes}
          productSizes={formData.productSizes}
          baseSku={formData.sku}
          errors={errors}
          onRequiresSizesChange={handleRequiresSizesChange}
          onSizesChange={handleSizesChange}
          onError={setError}
          onClearError={clearError}
        />

        {/* 5. Barcode Generation */}
        <ProductBarcodeGenerator
          sku={formData.sku}
          barcode={formData.barcode}
          barcodeType={formData.barcodeType}
          barcodeNeedsUpdate={barcodeNeedsUpdate}
          onBarcodeChange={(barcode) => handleInputChange('barcode', barcode)}
          onBarcodeTypeChange={(type) => handleInputChange('barcodeType', type)}
          onBarcodeGenerated={handleBarcodeGenerated}
          onUpdateNeeded={setBarcodeNeedsUpdate}
        />

        {/* 6. SEO Settings */}
        <ProductSEO
          formData={formData}
          onInputChange={handleInputChange}
        />

        {/* 7. Product Images - Simple URL Input for now */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-800">
            <strong>Image Upload:</strong> Advanced image upload component will be restored after fixing navigation context issues.
            For now, you can add image URLs separated by commas.
          </div>
          <input
            type="text"
            placeholder="Image URLs (comma-separated)"
            value={formData.images.join(', ')}
            onChange={(e) => handleInputChange('images', e.target.value.split(',').map(url => url.trim()).filter(Boolean))}
            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* 8. Product Tags and Status */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Product Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Product Tags</label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
              placeholder="ethnic, silk, traditional, festive (comma-separated)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Product Status */}
          <div className="space-y-4">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Product is Active</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">Featured Product</label>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex gap-3">
            <Link href="/admin/products">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleInputChange('status', 'DRAFT')}
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            
            <Button
              type="submit"
              disabled={loading}
              onClick={() => handleInputChange('status', 'PUBLISHED')}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {mode === 'create' ? 'Create Product' : 'Update Product'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}