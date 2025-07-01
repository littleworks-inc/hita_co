// =====================================
// src/components/admin/ProductForm.tsx - WITH AI CONTENT GENERATION
// Complete ProductForm with Image Upload + AI Generation + Clean Configuration
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
  AlertTriangle,
  Sparkles,
  Brain
} from 'lucide-react'

// Import all the modular components
import ProductBasicInfo from '@/components/admin/ProductBasicInfo'
import ProductDescriptions from '@/components/admin/ProductDescriptions'
import ProductPricing from '@/components/admin/ProductPricing'
import ProductSizeManager from '@/components/admin/ProductSizeManager'
import ProductBarcodeGenerator from '@/components/admin/ProductBarcodeGenerator'
import ProductSEO from '@/components/admin/ProductSEO'
import ImageUpload from '@/components/admin/ImageUpload'

// ✅ RESTORED: AI Components
import AIGenerateButton from '@/components/admin/AIGenerateButton'

// Import clean configuration service
import { cleanConfigurationService } from '@/lib/clean-configuration-service'

// =====================================
// INTERFACES (same as before)
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

  // ✅ NEW: AI Generation state
  const [aiGenerating, setAiGenerating] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)

  // ✅ CLEAN: Form state with no hardcoded defaults
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
    
    // ✅ CLEAN: No hardcoded values, admin sets everything
    originalPrice: product?.originalPrice || 0,
    originalCurrency: product?.originalCurrency || '',
    quantity: product?.quantity || 0,
    gstPercentage: product?.gstPercentage || 0,
    shippingCost: product?.shippingCost || 0,
    conversionCharges: product?.conversionCharges || 0,
    additionalExpenses: product?.additionalExpenses || 0,
    costPriceUSD: product?.costPriceUSD || 0,
    piecePriceUSD: product?.piecePriceUSD || 0,
    profitMargin: product?.profitMargin || 0,
    discountPercentage: product?.discountPercentage || 0,
    showDiscountToCustomers: product?.showDiscountToCustomers ?? true,
    sellingPriceUSD: product?.sellingPriceUSD || 0,
    stockQuantity: product?.stockQuantity || 0,
    lowStockAlert: product?.lowStockAlert || 0,
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

  // ✅ Auto-set currency from country selection
  useEffect(() => {
    if (formData.countryId) {
      const selectedCountry = countries.find(c => c.id === formData.countryId)
      if (selectedCountry && selectedCountry.currency !== formData.originalCurrency) {
        setFormData(prev => ({
          ...prev,
          originalCurrency: selectedCountry.currency
        }))
      }
    }
  }, [formData.countryId, countries])

  // =====================================
  // HELPER FUNCTIONS (same as before)
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

  // ✅ CLEAN: No pricing suggestions - admin decides everything
  const getPricingSuggestions = () => {
    const category = categories.find(c => c.id === formData.categoryId)
    if (!category) return null

    return {
      margin: [0, 0],
      stock: [0, 0],
      discount: [0, 0],
      message: `Category: ${category.name} - Set your own pricing strategy`
    }
  }

  const pricingSuggestions = useMemo(() => getPricingSuggestions(), [formData.categoryId, categories])

  // =====================================
  // AI GENERATION HANDLERS
  // =====================================

  // ✅ NEW: AI context for generation
  const getAIContext = () => {
    const category = categories.find(c => c.id === formData.categoryId)
    const country = countries.find(c => c.id === formData.countryId)
    
    return {
      productName: formData.name,
      category: category?.name || '',
      price: formData.sellingPriceUSD || formData.originalPrice,
      currency: formData.originalCurrency || 'USD',
      country: country?.name || '',
      tags: formData.tags,
      features: [], // Could be extracted from existing description
      shortDescription: formData.shortDescription,
      description: formData.description
    }
  }

  // ✅ NEW: Handle AI-generated content
  const handleAIGenerated = (type: string, content: any) => {
    setAiGenerating(false)
    
    try {
      if (type === 'product_description') {
        if (typeof content === 'string') {
          handleInputChange('description', content)
        } else if (content.description) {
          handleInputChange('description', content.description)
          if (content.shortDescription) {
            handleInputChange('shortDescription', content.shortDescription)
          }
          if (content.tags && Array.isArray(content.tags)) {
            handleInputChange('tags', content.tags)
          }
        }
      } else if (type === 'seo_content') {
        if (content.title) {
          handleInputChange('seoTitle', content.title)
        }
        if (content.description) {
          handleInputChange('seoDescription', content.description)
        }
      }
    } catch (error) {
      console.error('Error handling AI generated content:', error)
    }
  }

  // ✅ NEW: Check if AI is ready
  const isAIReady = () => {
    return formData.name.trim().length > 0 && formData.categoryId.length > 0
  }

  // =====================================
  // INPUT HANDLING (same as before)
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
  // COMPONENT-SPECIFIC HANDLERS (same as before)
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

  const handleSizesChange = (productSizes: ProductSize[]) => {
    setFormData(prev => ({ ...prev, productSizes }))
  }

  // Barcode generation handler
  const handleBarcodeGenerated = (newBarcode: string) => {
    handleInputChange('barcode', newBarcode)
    setBarcodeNeedsUpdate(false)
  }

  // Image upload handler
  const handleImagesChange = (images: string[]) => {
    handleInputChange('images', images)
  }

  // =====================================
  // FORM SUBMISSION (same as before)
  // =====================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      // Enhanced validation
      const validationErrors: Record<string, string> = {}

      // Required fields
      if (!formData.name.trim()) validationErrors.name = 'Product name is required'
      if (!formData.sku.trim()) validationErrors.sku = 'SKU is required'
      if (!formData.categoryId) validationErrors.categoryId = 'Category is required'
      if (!formData.countryId) validationErrors.countryId = 'Country of origin is required'
      if (!formData.supplierId) validationErrors.supplierId = 'Supplier is required'

      if (formData.originalPrice <= 0) {
        validationErrors.originalPrice = 'Original price must be greater than 0'
      }

      if (formData.quantity <= 0) {
        validationErrors.quantity = 'Quantity must be at least 1'
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        setLoading(false)
        return
      }

      // Submit form data
      const endpoint = mode === 'edit' ? `/api/admin/products/${product?.id}` : '/api/admin/products'
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save product')
      }

      const savedProduct = await response.json()
      setSuccessMessage(`Product ${mode === 'edit' ? 'updated' : 'created'} successfully!`)
      
      setTimeout(() => {
        router.push('/admin/products')
      }, 1500)

    } catch (error) {
      console.error('Form submission error:', error)
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to save product' 
      })
    } finally {
      setLoading(false)
    }
  }

  // =====================================
  // RENDER COMPONENT
  // =====================================

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header with AI Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {mode === 'edit' ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-gray-600 mt-1">
            {mode === 'edit' ? 'Update product information' : 'Create a new product with AI-powered content generation'}
          </p>
        </div>
        
        {/* ✅ NEW: AI Panel Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Clean configuration system
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAiPanel(!showAiPanel)}
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            {showAiPanel ? 'Hide AI Panel' : 'Show AI Panel'}
          </Button>
        </div>
      </div>

      {/* ✅ NEW: AI Quick Actions Panel */}
      {showAiPanel && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="font-medium text-purple-900">AI Content Generation</h3>
            </div>
            {!isAIReady() && (
              <div className="text-sm text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Add product name and category first
              </div>
            )}
          </div>
          
          {isAIReady() && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Product Description AI */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Product Description</div>
                <AIGenerateButton
                  type="product_description"
                  context={getAIContext()}
                  onGenerated={(content) => handleAIGenerated('product_description', content)}
                  disabled={!isAIReady() || aiGenerating}
                  size="sm"
                />
              </div>

              {/* SEO Content AI */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">SEO Content</div>
                <AIGenerateButton
                  type="seo_content"
                  context={getAIContext()}
                  onGenerated={(content) => handleAIGenerated('seo_content', content)}
                  disabled={!isAIReady() || aiGenerating}
                  size="sm"
                />
              </div>

              {/* Social Caption AI */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Social Media</div>
                <AIGenerateButton
                  type="social_caption"
                  context={getAIContext()}
                  onGenerated={(content) => {
                    // For social captions, could be used for product tags or descriptions
                    console.log('Social caption generated:', content)
                  }}
                  disabled={!isAIReady() || aiGenerating}
                  size="sm"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{errors.submit}</span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 1. PRODUCT IMAGES & VIDEOS - TOP PRIORITY */}
        <ImageUpload
          label="Product Images & Videos"
          description="Upload high-quality images and videos to showcase your product. First image will be the main product image."
          images={formData.images}
          onImagesChange={handleImagesChange}
          maxImages={8}
          maxVideos={2}
          multiple={true}
          disabled={loading}
        />

        {/* 2. Basic Information */}
        <ProductBasicInfo
          formData={formData}
          categories={categories}
          countries={countries}
          suppliers={suppliers}
          errors={errors}
          onInputChange={handleInputChange}
        />

        {/* 3. Product Descriptions with AI */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Product Descriptions</h3>
            {isAIReady() && (
              <div className="flex gap-2">
                <AIGenerateButton
                  type="product_description"
                  context={getAIContext()}
                  onGenerated={(content) => handleAIGenerated('product_description', content)}
                  disabled={!isAIReady() || aiGenerating}
                  size="sm"
                  variant="outline"
                />
              </div>
            )}
          </div>
          
          <ProductDescriptions
            formData={formData}
            onInputChange={handleInputChange}
          />
        </div>

        {/* 4. Pricing with Clean Configuration */}
        <ProductPricing
          formData={formData}
          selectedCountry={countries.find(c => c.id === formData.countryId)}
          exchangeRate={countries.find(c => c.id === formData.countryId)?.exchangeRate || 1}
          errors={errors}
          onInputChange={handleInputChange}
          showCostBreakdown={showCostBreakdown}
          onToggleCostBreakdown={() => setShowCostBreakdown(!showCostBreakdown)}
          pricingMode={pricingMode}
          onPricingModeChange={setPricingMode}
          showCustomerPreview={showCustomerPreview}
          onToggleCustomerPreview={() => setShowCustomerPreview(!showCustomerPreview)}
        />

        {/* 5. Size Management */}
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

        {/* 6. Barcode Generation */}
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

        {/* 7. SEO Settings with AI */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">SEO Settings</h3>
            {isAIReady() && (
              <AIGenerateButton
                type="seo_content"
                context={getAIContext()}
                onGenerated={(content) => handleAIGenerated('seo_content', content)}
                disabled={!isAIReady() || aiGenerating}
                size="sm"
                variant="outline"
              />
            )}
          </div>
          
          <ProductSEO
            formData={formData}
            onInputChange={handleInputChange}
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
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {mode === 'edit' ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ✅ COMPLETE FEATURES:
// ✅ Image and video upload functionality (top priority)
// ✅ AI content generation for descriptions and SEO
// ✅ Clean configuration system (no hardcoded values)
// ✅ Toggle-able AI panel for quick content generation
// ✅ AI buttons integrated into relevant sections
// ✅ Professional form layout and user experience
// ✅ All existing functionality preserved
// ✅ Smart AI context generation from product data