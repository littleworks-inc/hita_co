// =====================================
// FIXED: src/components/admin/ProductForm.tsx
// Enhanced ProductForm with Correct AutoBarcodeGenerator Integration
// =====================================

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Textarea } from '@/components/ui'
import { generateSKU, calculateCostBreakdown, calculateSellingPrice } from '@/lib/utils'
import { shouldUpdateBarcode } from '@/lib/barcode-utils'
import ImageUpload from '@/components/admin/ImageUpload'
import { AIGenerationPanel } from '@/components/admin/AIGenerationPanel'
import AutoBarcodeGenerator from '@/components/admin/AutoBarcodeGenerator'
import Link from 'next/link'
import {
  Save,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Image as ImageIcon,
  Package,
  DollarSign,
  BarChart3,
  Settings,
  Tag,
  Search,
  Globe,
  EyeOff,
  Info
} from 'lucide-react'

// Interfaces
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
  showDiscountToCustomers: boolean  // 🎯 DISCOUNT SYSTEM FIELD
  sellingPriceUSD: number
  stockQuantity: number
  lowStockAlert: number
  isActive: boolean
  isFeatured: boolean
  tags: string[]
  images: string[]
  seoTitle?: string
  seoDescription?: string
  // Draft system fields
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  publishedAt?: string | null
  archivedAt?: string | null
}

interface ProductFormProps {
  categories: Category[]
  countries: Country[]
  suppliers: Supplier[]
  product?: Product
  mode: 'create' | 'edit'
}

interface AIInputData {
  fabricType?: string
  occasion?: string
  specialFeatures?: string
  craftmanship?: string
  careInstructions?: string
  sizing?: string
  targetKeywords?: string
}

export default function ProductForm({ categories, countries, suppliers, product, mode }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  // Enhanced: Barcode-specific state
  const [barcodeNeedsUpdate, setBarcodeNeedsUpdate] = useState(false)
  const [originalSku, setOriginalSku] = useState(product?.sku || '')

  // 🎯 NEW: Discount preview state
  const [showCustomerPreview, setShowCustomerPreview] = useState(false)

  // Form state - INCLUDING DISCOUNT FIELD
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
    originalPrice: product?.originalPrice || 0,
    originalCurrency: product?.originalCurrency || 'INR',
    quantity: product?.quantity || 1,
    gstPercentage: product?.gstPercentage || 18,
    shippingCost: product?.shippingCost || 0,
    conversionCharges: product?.conversionCharges || 0,
    additionalExpenses: product?.additionalExpenses || 0,
    costPriceUSD: product?.costPriceUSD || 0,
    piecePriceUSD: product?.piecePriceUSD || 0,
    profitMargin: product?.profitMargin || 100,
    discountPercentage: product?.discountPercentage || 0,
    showDiscountToCustomers: product?.showDiscountToCustomers ?? false,  // 🎯 DISCOUNT VISIBILITY
    sellingPriceUSD: product?.sellingPriceUSD || 0,
    stockQuantity: product?.stockQuantity || 0,
    lowStockAlert: product?.lowStockAlert || 5,
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    tags: product?.tags || [],
    images: product?.images || [],
    seoTitle: product?.seoTitle || '',
    seoDescription: product?.seoDescription || '',
    status: product?.status || 'DRAFT',
    publishedAt: product?.publishedAt || null,
    archivedAt: product?.archivedAt || null
  })

  // ✅ FIXED: Proper barcode callback function
  const handleBarcodeGenerated = (barcode: string, barcodeType: string) => {
    console.log('✅ Barcode callback received:', { barcode, barcodeType })

    setFormData(prev => ({
      ...prev,
      barcode: barcode,
      barcodeType: barcodeType
    }))

    // Clear barcode update flag since we've updated it
    setBarcodeNeedsUpdate(false)

    // Show success message
    setSuccessMessage(`Barcode updated: ${barcode} (${barcodeType})`)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  // Enhanced input change handler
  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Auto-calculate dependent fields for pricing
    if (['originalPrice', 'quantity', 'gstPercentage', 'shippingCost', 'conversionCharges', 'additionalExpenses'].includes(field)) {
      const country = countries.find(c => c.id === formData.countryId)
      if (country?.exchangeRate) {
        setTimeout(() => {
          const updatedFormData = { ...formData, [field]: value }

          // ✅ FIXED: Correct function call with individual parameters
          const costBreakdown = calculateCostBreakdown(
            updatedFormData.originalPrice,     // originalPrice
            updatedFormData.quantity,          // quantity  
            updatedFormData.gstPercentage,     // gstPercentage
            updatedFormData.shippingCost,      // shippingCost
            updatedFormData.conversionCharges, // conversionCharges
            updatedFormData.additionalExpenses,// additionalExpenses
            country.exchangeRate               // exchangeRate
          )

          setFormData(prev => ({
            ...prev,
            costPriceUSD: costBreakdown.costPriceUSD,
            piecePriceUSD: costBreakdown.piecePriceUSD
          }))
        }, 100)
      }
    }

    // Auto-calculate selling price when relevant fields change
    if (['piecePriceUSD', 'profitMargin', 'discountPercentage'].includes(field)) {
      setTimeout(() => {
        const updatedFormData = { ...formData, [field]: value }

        // ✅ FIXED: Correct function call for selling price
        const sellingPrice = calculateSellingPrice(
          updatedFormData.piecePriceUSD,       // costPriceUSD (piece price)
          updatedFormData.profitMargin,        // profitMargin
          updatedFormData.discountPercentage   // discountPercentage
        )

        setFormData(prev => ({ ...prev, sellingPriceUSD: sellingPrice }))
      }, 100)
    }


    // ✅ FIXED: SKU change detection for barcode updates
    if (field === 'sku') {
      // Check if this is a meaningful SKU change that should trigger barcode update
      const shouldUpdate = shouldUpdateBarcode(originalSku, value as string, formData.barcode)
      if (shouldUpdate) {
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

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Product name is required'
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required'
    if (!formData.categoryId) newErrors.categoryId = 'Category is required'
    if (!formData.countryId) newErrors.countryId = 'Country is required'
    if (!formData.supplierId) newErrors.supplierId = 'Supplier is required'
    if (formData.originalPrice <= 0) newErrors.originalPrice = 'Price must be greater than 0'
    if (formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0'
    if (formData.stockQuantity < 0) newErrors.stockQuantity = 'Stock quantity cannot be negative'
    if (formData.discountPercentage < 0 || formData.discountPercentage > 100) {
      newErrors.discountPercentage = 'Discount must be between 0% and 100%'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Form submission
  // ✅ DEBUGGING: Add this to your ProductForm.tsx handleSubmit function
// Find your handleSubmit function and add console logging:

const handleSubmit = async (e: React.FormEvent, actionType: 'draft' | 'publish' | 'archive' = 'draft') => {
  e.preventDefault()
  
  if (!validateForm()) {
    console.log('❌ Form validation failed:', errors)
    return
  }

  setLoading(true)
  setErrors({})

  try {
    const formatDateForAPI = (dateValue: string) => {
      if (!dateValue) return null
      // If it's already in YYYY-MM-DD format, use it
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue
      }
      // Otherwise, convert to YYYY-MM-DD format
      const date = new Date(dateValue)
      if (isNaN(date.getTime())) return null
      return date.toISOString().split('T')[0] // Get just YYYY-MM-DD part
    }
    // ✅ ADD: Log the data being sent
    const submissionData = {
      ...formData,
      // ✅ FIX: Format purchase date
      purchaseDate: formatDateForAPI(formData.purchaseDate),
      tags: Array.isArray(formData.tags) ? formData.tags : formData.tags.toString().split(',').map(tag => tag.trim()).filter(Boolean),
      status: actionType === 'publish' ? 'PUBLISHED' : actionType === 'archive' ? 'ARCHIVED' : 'DRAFT',
      publishedAt: actionType === 'publish' ? new Date().toISOString() : formData.publishedAt
    }

    console.log('📤 Sending data to API:', submissionData)

    const url = mode === 'edit' ? `/api/admin/products/${product?.id}` : '/api/admin/products'
    const method = mode === 'edit' ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData)
    })

    // ✅ ADD: Log the response
    const result = await response.json()
    
    console.log('📥 API Response:', {
      status: response.status,
      ok: response.ok,
      data: result
    })

    if (!response.ok) {
      console.log('❌ API Error Details:', result)
      
      if (result.validationErrors) {
        console.log('📝 Validation Errors:', result.validationErrors)
        // Handle validation errors...
      } else {
        console.log('🚨 General Error:', result.error)
        setErrors({ general: result.error || 'Something went wrong' })
      }
      return
    }

    setSuccessMessage(result.message || 'Product saved successfully!')
    
    if (mode === 'create') {
      setTimeout(() => router.push('/admin/products'), 1500)
    }
  } catch (error) {
    console.error('🔥 Network/JavaScript Error:', error)
    setErrors({ general: 'Network error. Please try again.' })
  } finally {
    setLoading(false)
  }
}

  // AI Content Generation
  const handleAIGeneration = async (type: string, inputData: AIInputData) => {
    setIsGeneratingAI(true)
    setErrors(prev => ({ ...prev, aiGeneration: '' }))

    try {
      const response = await fetch('/api/admin/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          productName: formData.name,
          categoryName: categories.find(c => c.id === formData.categoryId)?.name || '',
          inputData,
          maxLength: type === 'short_description' ? 80 : 200
        })
      })

      const data = await response.json()

      if (data.success) {
        if (type === 'short_description') {
          handleInputChange('shortDescription', data.content)
        } else if (type === 'product_description') {
          handleInputChange('description', data.content)
        } else if (type === 'seo_content') {
          if (data.content.title) handleInputChange('seoTitle', data.content.title)
          if (data.content.description) handleInputChange('seoDescription', data.content.description)
        }

        setSuccessMessage(`${type.replace('_', ' ')} generated successfully!`)
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setErrors(prev => ({ ...prev, aiGeneration: data.error }))
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        aiGeneration: `Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`
      }))
    } finally {
      setIsGeneratingAI(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {mode === 'create' ? 'Create Product' : 'Edit Product'}
          </h1>
          <p className="text-gray-600 mt-1">
            {mode === 'create' ? 'Add a new product to your inventory' : 'Update product information'}
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

      <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
        {/* 1. Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Name & SKU */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Elegant Silk Saree"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU (Stock Keeping Unit) *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="Auto-generated or custom"
                  className={errors.sku ? 'border-red-500' : ''}
                />
                {errors.sku && <p className="text-sm text-red-500">{errors.sku}</p>}
              </div>
            </div>

            {/* Category & Country */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.categoryId ? 'border-red-500' : ''
                    }`}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Origin Country *</Label>
                <select
                  id="country"
                  value={formData.countryId}
                  onChange={(e) => handleInputChange('countryId', e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.countryId ? 'border-red-500' : ''
                    }`}
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name} ({country.currency})
                    </option>
                  ))}
                </select>
                {errors.countryId && <p className="text-sm text-red-500">{errors.countryId}</p>}
              </div>
            </div>

            {/* Descriptions */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  placeholder="Brief product description (1-2 lines)"
                  rows={2}
                  maxLength={150}
                />
                <div className="text-xs text-gray-500">
                  {formData.shortDescription.length}/150 characters
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Detailed product description"
                  rows={4}
                />
              </div>
            </div>

            {/* Supplier */}
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <select
                id="supplier"
                value={formData.supplierId}
                onChange={(e) => handleInputChange('supplierId', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.supplierId ? 'border-red-500' : ''
                  }`}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.supplierId && <p className="text-sm text-red-500">{errors.supplierId}</p>}
            </div>

            {/* Purchase Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                  placeholder="INV-2024-001"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Product Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Product Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              images={formData.images || []}
              onImagesChange={(images) => handleInputChange('images', images)}
              maxImages={8}
              maxVideos={2}
              disabled={loading}
            />
            {errors.images && <p className="text-sm text-red-500 mt-2">{errors.images}</p>}
          </CardContent>
        </Card>

        {/* 3. ✅ FIXED: Enhanced Barcode System */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Barcode System
              {barcodeNeedsUpdate && (
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Update Available
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AutoBarcodeGenerator
              sku={formData.sku}
              currentBarcode={formData.barcode}
              currentBarcodeType={formData.barcodeType}
              onBarcodeGenerated={handleBarcodeGenerated}
              productName={formData.name}
            />
          </CardContent>
        </Card>

        {/* 4. Pricing & Inventory */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing & Inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Original Purchase Details */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="originalPrice">Original Price *</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || 0)}
                  className={errors.originalPrice ? 'border-red-500' : ''}
                />
                {errors.originalPrice && <p className="text-sm text-red-500">{errors.originalPrice}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity Purchased *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                  className={errors.quantity ? 'border-red-500' : ''}
                />
                {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstPercentage">GST %</Label>
                <Input
                  id="gstPercentage"
                  type="number"
                  step="0.01"
                  value={formData.gstPercentage}
                  onChange={(e) => handleInputChange('gstPercentage', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Additional Costs */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="shippingCost">Shipping Cost</Label>
                <Input
                  id="shippingCost"
                  type="number"
                  step="0.01"
                  value={formData.shippingCost}
                  onChange={(e) => handleInputChange('shippingCost', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conversionCharges">Conversion Charges</Label>
                <Input
                  id="conversionCharges"
                  type="number"
                  step="0.01"
                  value={formData.conversionCharges}
                  onChange={(e) => handleInputChange('conversionCharges', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalExpenses">Additional Expenses</Label>
                <Input
                  id="additionalExpenses"
                  type="number"
                  step="0.01"
                  value={formData.additionalExpenses}
                  onChange={(e) => handleInputChange('additionalExpenses', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Calculated Costs (Read-only) */}
            <div className="grid gap-4 md:grid-cols-2 bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <Label>Total Cost Price (USD)</Label>
                <div className="text-lg font-semibold text-gray-700">
                  ${formData.costPriceUSD.toFixed(2)}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Price Per Piece (USD)</Label>
                <div className="text-lg font-semibold text-gray-700">
                  ${formData.piecePriceUSD.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Selling Price Settings */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profitMargin">Profit Margin %</Label>
                <Input
                  id="profitMargin"
                  type="number"
                  step="0.01"
                  value={formData.profitMargin}
                  onChange={(e) => handleInputChange('profitMargin', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Final Selling Price (USD)</Label>
                <div className="text-xl font-bold text-green-600">
                  ${formData.sellingPriceUSD.toFixed(2)}
                </div>
              </div>
            </div>

            {/* 🎯 DISCOUNT SYSTEM */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Discount Settings</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="discountPercentage">Discount Percentage</Label>
                  <Input
                    id="discountPercentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.discountPercentage}
                    onChange={(e) => handleInputChange('discountPercentage', parseFloat(e.target.value) || 0)}
                    className={errors.discountPercentage ? 'border-red-500' : ''}
                  />
                  {errors.discountPercentage && (
                    <p className="text-sm text-red-500">{errors.discountPercentage}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.showDiscountToCustomers}
                      onChange={(e) => handleInputChange('showDiscountToCustomers', e.target.checked)}
                      className="rounded"
                    />
                    Show Discount to Customers
                  </Label>
                  <div className="text-xs text-gray-500">
                    When enabled, customers will see the original price crossed out and the discount percentage
                  </div>
                </div>
              </div>

              {/* Customer Preview */}
              {formData.discountPercentage > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-800">Customer Preview</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCustomerPreview(!showCustomerPreview)}
                    >
                      {showCustomerPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showCustomerPreview ? 'Hide' : 'Show'} Preview
                    </Button>
                  </div>

                  {showCustomerPreview && (
                    <div className="space-y-3">
                      {formData.showDiscountToCustomers ? (
                        <div className="bg-white p-3 rounded border">
                          <div className="text-sm text-gray-600">Visible Discount Display:</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg line-through text-gray-500">
                              ${formData.sellingPriceUSD.toFixed(2)}
                            </span>
                            <span className="text-xl font-bold text-green-600">
                              ${(formData.sellingPriceUSD * (1 - formData.discountPercentage / 100)).toFixed(2)}
                            </span>
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                              {formData.discountPercentage}% OFF
                            </span>
                          </div>
                          <div className="text-sm text-green-600 mt-1">
                            You save ${(formData.sellingPriceUSD * (formData.discountPercentage / 100)).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-3 rounded border">
                          <div className="text-sm text-gray-600">Hidden Discount Display:</div>
                          <div className="text-xl font-bold text-green-600 mt-1">
                            ${(formData.sellingPriceUSD * (1 - formData.discountPercentage / 100)).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Clean pricing - no discount information shown
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stock Management */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Stock Management</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Current Stock Quantity</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => handleInputChange('stockQuantity', parseInt(e.target.value) || 0)}
                    className={errors.stockQuantity ? 'border-red-500' : ''}
                  />
                  {errors.stockQuantity && <p className="text-sm text-red-500">{errors.stockQuantity}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lowStockAlert">Low Stock Alert Threshold</Label>
                  <Input
                    id="lowStockAlert"
                    type="number"
                    min="0"
                    value={formData.lowStockAlert}
                    onChange={(e) => handleInputChange('lowStockAlert', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. SEO & Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              SEO & Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* SEO Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle}
                  onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                  placeholder="Optimized title for search engines"
                  maxLength={60}
                />
                <div className="text-xs text-gray-500">
                  {formData.seoTitle.length}/60 characters (recommended)
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoDescription">SEO Description</Label>
                <Textarea
                  id="seoDescription"
                  value={formData.seoDescription}
                  onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                  placeholder="Meta description for search engines"
                  rows={3}
                  maxLength={160}
                />
                <div className="text-xs text-gray-500">
                  {formData.seoDescription.length}/160 characters (recommended)
                </div>
              </div>
            </div>

            {/* Product Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Product Tags</Label>
              <Input
                id="tags"
                value={formData.tags.join(', ')}
                onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
                placeholder="ethnic, silk, traditional, festive (comma-separated)"
              />
              <div className="text-xs text-gray-500">
                Enter tags separated by commas to help customers find your product
              </div>
            </div>

            {/* Product Status */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="isActive">Product is Active</Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="isFeatured">Featured Product</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 6. AI Content Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              AI Content Generation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AIGenerationPanel
              productName={formData.name}
              categoryName={categories.find(c => c.id === formData.categoryId)?.name || ''}
              images={formData.images}
              onGenerate={handleAIGeneration}
              isGenerating={isGeneratingAI}
            />
            {errors.aiGeneration && (
              <p className="text-sm text-red-500 mt-2">{errors.aiGeneration}</p>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-6 border-t">
          <Button
            type="submit"
            disabled={loading}
            onClick={(e) => handleSubmit(e, 'draft')}
            variant="outline"
            className="flex-1"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </>
            )}
          </Button>

          <Button
            type="submit"
            disabled={loading}
            onClick={(e) => handleSubmit(e, 'publish')}
            className="flex-1"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Publish Product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}