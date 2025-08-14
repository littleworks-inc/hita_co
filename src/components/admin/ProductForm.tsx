// =====================================
// src/components/admin/ProductForm.tsx - WITH ENHANCED AI CONTENT GENERATION
// Complete ProductForm with Image Upload + Enhanced AI Generation + Clean Configuration
// ✅ FIXED: Removed duplicate inventory section
// ✅ UPDATED: Removed barcode input section - barcode management moved to sidebar printer tool
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
  Brain,
  FileText,
  Settings
} from 'lucide-react'

// Import all the modular components
import ProductBasicInfo from '@/components/admin/ProductBasicInfo'
import ProductDescriptions from '@/components/admin/ProductDescriptions'
import ProductPricing from '@/components/admin/ProductPricing'
import ProductSizeManager from '@/components/admin/ProductSizeManager'
// ✅ REMOVED: ProductBarcodeGenerator import - barcode management moved to sidebar
// import ProductBarcodeGenerator from '@/components/admin/ProductBarcodeGenerator'
import ProductSEO from '@/components/admin/ProductSEO'
import ImageUpload from '@/components/admin/ImageUpload'

// ✅ AI Components
import AIGenerateButton from '@/components/admin/AIGenerateButton'
import EnhancedAIInputForm from '@/components/admin/EnhancedAIInputForm'

// Import clean configuration service
import { cleanConfigurationService } from '@/lib/clean-configuration-service'

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

export default function ProductForm({
  categories,
  countries,
  suppliers,
  product,
  mode
}: ProductFormProps) {
  const router = useRouter()

  // =====================================
  // STATE MANAGEMENT
  // =====================================

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [showCostBreakdown, setShowCostBreakdown] = useState(false)
  const [pricingMode, setPricingMode] = useState<'basic' | 'advanced'>('basic')
  const [showCustomerPreview, setShowCustomerPreview] = useState(false)
  // ✅ REMOVED: barcodeNeedsUpdate state - no longer needed

  // ✅ AI STATE
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [showEnhancedAI, setShowEnhancedAI] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [enhancedAIData, setEnhancedAIData] = useState<any>(null)

  // Form data state
  const [formData, setFormData] = useState<Product>({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    shortDescription: product?.shortDescription || '',
    categoryId: product?.categoryId || '',
    countryId: product?.countryId || '',
    barcode: product?.barcode || '',
    barcodeType: product?.barcodeType || 'CODE128',
    supplierId: product?.supplierId || '',
    purchaseDate: product?.purchaseDate || '',
    invoiceNumber: product?.invoiceNumber || '',
    originalPrice: product?.originalPrice || 0,
    originalCurrency: product?.originalCurrency || '',
    quantity: product?.quantity || 1,
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
    requiresSizes: product?.requiresSizes || false,
    productSizes: product?.productSizes || []
  })

  // =====================================
  // EFFECTS
  // =====================================

  // Auto-generate SKU when name changes
  useEffect(() => {
    if (formData.name && !product?.sku) {
      const newSku = generateSKU(formData.name)
      setFormData(prev => ({ ...prev, sku: newSku }))
    }
  }, [formData.name, product?.sku])

  // ✅ REMOVED: Auto-generate barcode effect - barcode management moved to sidebar

  // =====================================
  // CLEAN CONFIGURATION
  // =====================================

  const getPricingSuggestions = () => {
    if (!formData.categoryId) {
      return {
        profitMargin: 100,
        lowStockAlert: 5,
        message: `Using system defaults. Select a category for tailored suggestions.`
      }
    }

    const category = categories.find(c => c.id === formData.categoryId)
    const categoryName = category?.name.toLowerCase() || ''

    if (categoryName.includes('saree') || categoryName.includes('lehenga')) {
      return {
        profitMargin: 120,
        lowStockAlert: 3,
        message: `Premium category detected: Higher margins recommended for ${category?.name}`
      }
    } else if (categoryName.includes('kurti') || categoryName.includes('top')) {
      return {
        profitMargin: 80,
        lowStockAlert: 8,
        message: `Popular category: Competitive pricing for ${category?.name}`
      }
    } else {
      return {
        profitMargin: 100,
        lowStockAlert: 5,
        message: `Standard recommendations for ${category?.name}`
      }
    }
  }

  // =====================================
  // AI CONTEXT GENERATION
  // =====================================

  const getAIContext = () => {
    const category = categories.find(c => c.id === formData.categoryId)
    const country = countries.find(c => c.id === formData.countryId)
    
    return {
      product_name: formData.name,
      category: category?.name || '',
      country_origin: country?.name || '',
      price_usd: formData.sellingPriceUSD,
      existing_description: formData.description,
      existing_short_description: formData.shortDescription,
      tags: formData.tags,
      is_featured: formData.isFeatured
    }
  }

  // =====================================
  // AI HANDLERS
  // =====================================

  const handleAIGenerated = (type: string, content: any) => {
    if (type === 'basic_content') {
      setFormData(prev => ({
        ...prev,
        description: content.description || prev.description,
        shortDescription: content.short_description || prev.shortDescription,
        tags: content.tags || prev.tags
      }))
      setSuccessMessage('✨ AI content generated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } else if (type === 'seo_content') {
      setFormData(prev => ({
        ...prev,
        seoTitle: content.title || prev.seoTitle,
        seoDescription: content.description || prev.seoDescription
      }))
      setSuccessMessage('✨ AI SEO content generated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    }
  }

  const handleEnhancedAISubmit = async (aiInputs: any) => {
    setAiGenerating(true)
    setErrors({})

    try {
      const response = await fetch('/api/admin/ai/enhanced-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...getAIContext(),
          enhanced_inputs: aiInputs
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setEnhancedAIData(data.content)
        setFormData(prev => ({
          ...prev,
          name: data.content.name || prev.name,
          description: data.content.description || prev.description,
          shortDescription: data.content.short_description || prev.shortDescription,
          tags: data.content.tags || prev.tags,
          seoTitle: data.content.seo_title || prev.seoTitle,
          seoDescription: data.content.seo_description || prev.seoDescription
        }))
        setSuccessMessage('✨ Enhanced AI content generated successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        throw new Error(data.error || 'AI generation failed')
      }
    } catch (error) {
      console.error('Enhanced AI generation error:', error)
      setErrors(prev => ({
        ...prev,
        submit: error instanceof Error ? error.message : 'AI generation failed'
      }))
    } finally {
      setAiGenerating(false)
    }
  }

  // ✅ Check if AI is ready
  const isAIReady = () => {
    return formData.name.trim().length > 0 && formData.categoryId.length > 0
  }

  // =====================================
  // INPUT HANDLING
  // =====================================

  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // ✅ NEW: Auto-update currency when country changes (ADD THIS)
    if (field === 'countryId') {
      const selectedCountry = countries.find(c => c.id === value)
      if (selectedCountry && !product?.originalCurrency) {
        // Only auto-set currency for new products, not when editing existing ones
        setFormData(prev => ({
          ...prev,
          originalCurrency: selectedCountry.currency
        }))
      }
    }

    // ✅ FIXED: Auto-calculate cost breakdown when relevant fields change
    if (['originalPrice', 'quantity', 'gstPercentage', 'shippingCost', 'conversionCharges', 'additionalExpenses', 'countryId'].includes(field)) {
      const country = countries.find(c => c.id === (field === 'countryId' ? value : formData.countryId))
      if (country?.exchangeRate) {
        // Get current values (use new value if field is being changed)
        const currentOriginalPrice = field === 'originalPrice' ? parseFloat(value) || 0 : formData.originalPrice
        const currentQuantity = field === 'quantity' ? parseInt(value) || 1 : formData.quantity
        const currentGstPercentage = field === 'gstPercentage' ? parseFloat(value) || 0 : formData.gstPercentage
        const currentShippingCost = field === 'shippingCost' ? parseFloat(value) || 0 : formData.shippingCost
        const currentConversionCharges = field === 'conversionCharges' ? parseFloat(value) || 0 : formData.conversionCharges
        const currentAdditionalExpenses = field === 'additionalExpenses' ? parseFloat(value) || 0 : formData.additionalExpenses
        const exchangeRate = country.exchangeRate

        // Simple cost calculation
        const gstAmount = (currentOriginalPrice * currentGstPercentage) / 100
        const totalCostInOriginalCurrency = currentOriginalPrice + gstAmount + currentShippingCost + currentConversionCharges + currentAdditionalExpenses
        const costPriceUSD = totalCostInOriginalCurrency / exchangeRate
        const piecePriceUSD = costPriceUSD / currentQuantity

        // Update calculated fields
        setFormData(prev => ({
          ...prev,
          costPriceUSD: Math.round(costPriceUSD * 100) / 100,
          piecePriceUSD: Math.round(piecePriceUSD * 100) / 100
        }))
      }
    }

    // Auto-calculate selling price when profit margin changes
    if (field === 'profitMargin' && formData.piecePriceUSD > 0) {
      const newSellingPrice = formData.piecePriceUSD * (1 + parseFloat(value) / 100)
      setFormData(prev => ({ ...prev, sellingPriceUSD: Math.round(newSellingPrice * 100) / 100 }))
    }
  }

  // Handle image changes
  const handleImagesChange = (images: string[]) => {
    handleInputChange('images', images)
  }

  // Size management handlers
  const handleRequiresSizesChange = (requiresSizes: boolean) => {
    handleInputChange('requiresSizes', requiresSizes)
    if (!requiresSizes) {
      handleInputChange('productSizes', [])
    }
  }

  const handleSizesChange = (sizes: ProductSize[]) => {
    handleInputChange('productSizes', sizes)
  }

  const setError = (field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const clearError = (field: string) => {
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  // ✅ REMOVED: handleBarcodeGenerated function - no longer needed

  // =====================================
  // FORM SUBMISSION
  // =====================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading) return

    setLoading(true)
    setErrors({})

    try {
      const url = mode === 'edit' && product?.id
        ? `/api/admin/products/${product.id}`
        : '/api/admin/products'

      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage(
          mode === 'edit'
            ? 'Product updated successfully!'
            : 'Product created successfully!'
        )
        setTimeout(() => {
          router.push('/admin/products')
        }, 1500)
      } else {
        if (data.errors) {
          setErrors(data.errors)
        } else {
          setErrors({
            submit: data.error || 'Something went wrong. Please try again.'
          })
        }
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setErrors({
        submit: 'Network error. Please check your connection and try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{errors.submit}</span>
          </div>
        </div>
      )}

      {/* ✅ Enhanced AI Input Form Modal */}
      {showEnhancedAI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Enhanced AI Content Generation</h2>
                <button
                  onClick={() => setShowEnhancedAI(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <EnhancedAIInputForm
                productName={formData.name}
                categoryName={categories.find(c => c.id === formData.categoryId)?.name || ''}
                images={formData.images}
                onGenerate={handleEnhancedAISubmit}
                isGenerating={aiGenerating}
              />
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'edit' ? 'Edit Product' : 'Create New Product'}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {mode === 'edit' 
                ? 'Update your product information and settings.'
                : 'Add a new product to your inventory.'
              }
            </p>
          </div>

          {/* AI Toggle Controls */}
          <div className="flex items-center gap-3">
            {/* Enhanced AI Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEnhancedAI(true)}
              disabled={!isAIReady() || aiGenerating}
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              Enhanced AI
            </Button>

            {/* Quick AI Panel Toggle */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAiPanel(!showAiPanel)}
              disabled={!isAIReady()}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Quick AI {showAiPanel ? '(Hide)' : '(Show)'}
            </Button>
          </div>
        </div>

        {/* ✅ Quick AI Panel */}
        {showAiPanel && isAIReady() && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-blue-900">Quick AI Content Generation</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAiPanel(false)}
              >
                ×
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AIGenerateButton
                type="product_description"
                context={getAIContext()}
                onGenerated={(content) => handleAIGenerated('basic_content', content)}
                disabled={aiGenerating}
                variant="outline"
              />
              <AIGenerateButton
                type="seo_content"
                context={getAIContext()}
                onGenerated={(content) => handleAIGenerated('seo_content', content)}
                disabled={aiGenerating}
                variant="outline"
              />
            </div>
            <div className="text-xs text-blue-700 mt-2">
              AI will enhance your content based on product name and category. 
              Use Enhanced AI for more detailed customization.
            </div>
          </div>
        )}

        {/* Form Sections */}
        <div className="space-y-8">
          
          {/* 1. Basic Information */}
          <ProductBasicInfo
            formData={formData}
            categories={categories}
            suppliers={suppliers}
            countries={countries}
            errors={errors}
            onInputChange={handleInputChange}
          />

          {/* 2. Descriptions with AI */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Product Descriptions</h3>
              {isAIReady() && !showAiPanel && (
                <AIGenerateButton
                  type="product_description"
                  context={getAIContext()}
                  onGenerated={(content) => handleAIGenerated('basic_content', content)}
                  disabled={!isAIReady() || aiGenerating}
                  size="sm"
                  variant="outline"
                />
              )}
            </div>

            <ProductDescriptions
              formData={formData}
              onInputChange={handleInputChange}
            />
          </div>

          {/* 3. Images & Videos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Product Media</h3>
            <ImageUpload
              images={formData.images}
              onImagesChange={handleImagesChange}
              maxImages={8}
              maxVideos={2}
            />
          </div>

          {/* 4. Pricing with Smart Suggestions */}
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

          {/* 5. Size Management & Inventory (ProductSizeManager handles both cases) */}
          <ProductSizeManager
            requiresSizes={formData.requiresSizes}
            productSizes={formData.productSizes}
            baseSku={formData.sku}
            errors={errors}
            onRequiresSizesChange={handleRequiresSizesChange}
            onSizesChange={handleSizesChange}
            onError={setError}
            onClearError={clearError}
            // ✅ ADDED: Traditional inventory props
            stockQuantity={formData.stockQuantity}
            lowStockAlert={formData.lowStockAlert}
            onStockQuantityChange={(value) => handleInputChange('stockQuantity', value)}
            onLowStockAlertChange={(value) => handleInputChange('lowStockAlert', value)}
          />

          {/* ✅ REMOVED: Barcode Generation Section - moved to sidebar */}

          {/* 6. SEO Settings with AI */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">SEO Settings</h3>
              {isAIReady() && !showAiPanel && (
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

          {/* 7. Customer Preview Toggle */}
          {mode === 'edit' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={showCustomerPreview}
                  onChange={(e) => setShowCustomerPreview(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Show customer preview after saving
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/products"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </Link>

            {mode === 'edit' && (
              <Link
                href={`/admin/products/${product?.id}`}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Eye className="h-4 w-4" />
                Preview Product
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Status Controls */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* Save Button */}
            <Button
              type="submit"
              disabled={loading || aiGenerating}
              className="flex items-center gap-2"
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