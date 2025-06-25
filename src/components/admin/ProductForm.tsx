// =====================================
// src/components/admin/ProductForm.tsx - COMPLETE WITH DISCOUNT SYSTEM
// Enhanced ProductForm with Integrated Barcode System + Discount Controls
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

  // Derived state
  const selectedCountry = countries.find(c => c.id === formData.countryId)
  const exchangeRate = selectedCountry?.exchangeRate || 1

  // Generate SKU when name changes
  useEffect(() => {
    if (formData.name && mode === 'create') {
      const generatedSku = generateSKU(formData.name)
      setFormData(prev => ({ ...prev, sku: generatedSku }))
    }
  }, [formData.name, mode])

  // Check if barcode needs update when SKU changes
  useEffect(() => {
    if (mode === 'edit' && formData.sku !== originalSku) {
      const needsUpdate = shouldUpdateBarcode(originalSku, formData.sku, formData.barcode)
      setBarcodeNeedsUpdate(needsUpdate)
    }
  }, [formData.sku, originalSku, formData.barcode, mode])

  // Calculate costs automatically when relevant fields change
  useEffect(() => {
    const costBreakdown = calculateCostBreakdown(
      formData.originalPrice,
      formData.quantity,
      formData.gstPercentage,
      formData.shippingCost,
      formData.conversionCharges,
      formData.additionalExpenses,
      exchangeRate,
      selectedCountry?.currency || 'INR'
    )

    const sellingPrice = calculateSellingPrice(
      costBreakdown.piecePriceUSD,
      formData.profitMargin,
      formData.discountPercentage
    )

    setFormData(prev => ({
      ...prev,
      costPriceUSD: costBreakdown.totalCostUSD,
      piecePriceUSD: costBreakdown.piecePriceUSD,
      sellingPriceUSD: sellingPrice
    }))
  }, [
    formData.originalPrice,
    formData.quantity,
    formData.gstPercentage,
    formData.shippingCost,
    formData.conversionCharges,
    formData.additionalExpenses,
    formData.profitMargin,
    formData.discountPercentage,
    exchangeRate,
    selectedCountry?.currency
  ])

  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Enhanced: Form validation including barcode and draft status
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Product name is required'
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required'
    if (!formData.categoryId) newErrors.categoryId = 'Category is required'
    if (!formData.countryId) newErrors.countryId = 'Country is required'
    if (!formData.supplierId) newErrors.supplierId = 'Supplier is required'
    if (formData.originalPrice <= 0) newErrors.originalPrice = 'Original price must be greater than 0'
    if (formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0'
    if (formData.stockQuantity < 0) newErrors.stockQuantity = 'Stock quantity cannot be negative'

    // 🎯 NEW: Discount validation
    if (formData.discountPercentage < 0 || formData.discountPercentage >= 100) {
      newErrors.discountPercentage = 'Discount must be between 0% and 99.99%'
    }

    // Additional validation for publishing
    if (formData.status === 'PUBLISHED') {
      if (!formData.images || formData.images.length === 0) {
        newErrors.images = 'At least one image is required for published products'
      }
      if (formData.sellingPriceUSD <= 0) {
        newErrors.sellingPriceUSD = 'Selling price must be greater than 0 for published products'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (actionType: 'save' | 'publish' | 'archive') => {
    if (!validateForm()) return

    setLoading(true)
    setErrors({})

    try {
      // Determine status based on action
      let status = formData.status
      if (actionType === 'publish') status = 'PUBLISHED'
      if (actionType === 'archive') status = 'ARCHIVED'

      const submissionData = {
        ...formData,
        status,
        tags: Array.isArray(formData.tags) ? formData.tags : formData.tags.toString().split(',').map(tag => tag.trim()).filter(Boolean)
      }

      const url = mode === 'edit' ? `/api/admin/products/${product?.id}` : '/api/admin/products'
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.validationErrors) {
          const validationErrors: Record<string, string> = {}
          result.validationErrors.forEach((error: string) => {
            const field = error.toLowerCase().includes('name') ? 'name' :
                         error.toLowerCase().includes('category') ? 'categoryId' :
                         error.toLowerCase().includes('image') ? 'images' :
                         error.toLowerCase().includes('price') ? 'sellingPriceUSD' : 'general'
            validationErrors[field] = error
          })
          setErrors(validationErrors)
        } else {
          setErrors({ general: result.error || 'Something went wrong' })
        }
        return
      }

      setSuccessMessage(result.message || `Product ${actionType === 'publish' ? 'published' : actionType === 'archive' ? 'archived' : 'saved'} successfully!`)
      
      if (mode === 'create') {
        setTimeout(() => router.push('/admin/products'), 1500)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  // AI Generation Handler
  const handleAIGeneration = async (type: 'short_description' | 'product_description' | 'seo_content', userInput: AIInputData) => {
    if (!formData.name.trim()) {
      setErrors({ name: 'Product name is required for AI generation' })
      return
    }

    setIsGeneratingAI(true)
    
    try {
      const context = {
        name: formData.name.trim(),
        category: categories.find(c => c.id === formData.categoryId)?.name,
        price: formData.sellingPriceUSD,
        currency: 'USD',
        tags: formData.tags,
        images: formData.images,
        userInput
      }

      const response = await fetch('/api/admin/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          context,
          options: {
            tone: 'elegant',
            maxTokens: type === 'short_description' ? 100 : type === 'product_description' ? 500 : 300,
            length: type === 'short_description' ? 'short' : 'medium'
          }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'AI generation failed')
      }

      // Update form based on generated content
      if (type === 'short_description') {
        handleInputChange('shortDescription', result.content)
      } else if (type === 'product_description') {
        handleInputChange('description', result.content)
      } else if (type === 'seo_content') {
        handleInputChange('seoTitle', result.content.title)
        handleInputChange('seoDescription', result.content.description)
      }

      setSuccessMessage('AI content generated successfully!')
    } catch (error) {
      console.error('AI generation error:', error)
      setErrors({ ai: error instanceof Error ? error.message : 'AI generation failed' })
    } finally {
      setIsGeneratingAI(false)
    }
  }

  // 🎯 NEW: Calculate discount display values
  const calculateDiscountDisplay = () => {
    if (!formData.discountPercentage || formData.discountPercentage === 0) {
      return null
    }

    const originalPriceForDisplay = formData.sellingPriceUSD / (1 - formData.discountPercentage / 100)
    const savings = originalPriceForDisplay - formData.sellingPriceUSD

    return {
      originalPrice: originalPriceForDisplay.toFixed(2),
      savings: savings.toFixed(2),
      discountPercent: Math.round(formData.discountPercentage)
    }
  }

  const discountDisplay = calculateDiscountDisplay()

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {mode === 'edit' ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-gray-600 mt-2">
            {mode === 'edit' ? 'Update product information' : 'Create a new product for your store'}
          </p>
        </div>
        <Link href="/admin/products">
          <Button variant="outline">
            <Package className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </Link>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
            <p className="text-sm font-medium text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
            <p className="text-sm font-medium text-red-800">{errors.general}</p>
          </div>
        </div>
      )}

      {/* 1. Basic Product Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Product Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter product name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="Auto-generated from name"
                className={errors.sku ? 'border-red-500' : ''}
              />
              {errors.sku && <p className="text-sm text-red-500">{errors.sku}</p>}
            </div>
          </div>

          {/* Category, Country, Supplier */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category *</Label>
              <select
                id="categoryId"
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.categoryId ? 'border-red-500' : ''}`}
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
              <Label htmlFor="countryId">Country *</Label>
              <select
                id="countryId"
                value={formData.countryId}
                onChange={(e) => handleInputChange('countryId', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.countryId ? 'border-red-500' : ''}`}
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

            <div className="space-y-2">
              <Label htmlFor="supplierId">Supplier *</Label>
              <select
                id="supplierId"
                value={formData.supplierId}
                onChange={(e) => handleInputChange('supplierId', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.supplierId ? 'border-red-500' : ''}`}
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

      {/* 3. Enhanced Barcode System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Barcode System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AutoBarcodeGenerator
            sku={formData.sku}
            productName={formData.name}
            barcode={formData.barcode}
            barcodeType={formData.barcodeType}
            onBarcodeChange={(barcode) => handleInputChange('barcode', barcode)}
            onBarcodeTypeChange={(type) => handleInputChange('barcodeType', type)}
            needsUpdate={barcodeNeedsUpdate}
            onUpdateComplete={() => setBarcodeNeedsUpdate(false)}
          />
        </CardContent>
      </Card>

      {/* 4. Cost & Pricing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost & Pricing
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
                placeholder="1000"
                className={errors.originalPrice ? 'border-red-500' : ''}
              />
              {errors.originalPrice && <p className="text-sm text-red-500">{errors.originalPrice}</p>}
              <p className="text-xs text-gray-500">
                Price in {selectedCountry?.currency || 'INR'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstPercentage">GST %</Label>
              <Input
                id="gstPercentage"
                type="number"
                step="0.1"
                value={formData.gstPercentage}
                onChange={(e) => handleInputChange('gstPercentage', parseFloat(e.target.value) || 0)}
                placeholder="18"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="shippingCost">Shipping Cost</Label>
              <Input
                id="shippingCost"
                type="number"
                step="0.01"
                value={formData.shippingCost}
                onChange={(e) => handleInputChange('shippingCost', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
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
                placeholder="0.00"
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
                placeholder="0.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. 🎯 ENHANCED PRICING & DISCOUNT SYSTEM */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing & Discount System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profit and Discount Inputs */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profitMargin">Profit Margin %</Label>
              <Input
                id="profitMargin"
                type="number"
                step="0.1"
                value={formData.profitMargin}
                onChange={(e) => handleInputChange('profitMargin', parseFloat(e.target.value) || 0)}
                placeholder="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountPercentage">Discount %</Label>
              <Input
                id="discountPercentage"
                type="number"
                step="0.1"
                value={formData.discountPercentage}
                onChange={(e) => handleInputChange('discountPercentage', parseFloat(e.target.value) || 0)}
                placeholder="0"
                className={errors.discountPercentage ? 'border-red-500' : ''}
              />
              {errors.discountPercentage && <p className="text-sm text-red-500">{errors.discountPercentage}</p>}
            </div>
          </div>

          {/* 🎯 DISCOUNT VISIBILITY CONTROL */}
          {formData.discountPercentage > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <Label className="text-yellow-800 font-medium">Customer Discount Display</Label>
                    <p className="text-sm text-yellow-700 mt-1">
                      Control whether customers see the discount on your store
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showDiscountToCustomers}
                      onChange={(e) => handleInputChange('showDiscountToCustomers', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                  </label>
                  <span className="text-sm font-medium text-yellow-800">
                    {formData.showDiscountToCustomers ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              </div>

              {/* 🎯 CUSTOMER PREVIEW */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-yellow-900 flex items-center gap-2">
                    👥 Customer Preview
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowCustomerPreview(!showCustomerPreview)}
                    className="flex items-center gap-2 text-sm text-yellow-700 hover:text-yellow-800"
                  >
                    {showCustomerPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showCustomerPreview ? 'Hide' : 'Show'} Preview
                  </button>
                </div>
                
                {showCustomerPreview && (
                  <div className="space-y-3">
                    {/* When discount is visible to customers */}
                    {formData.showDiscountToCustomers ? (
                      <div className="bg-white p-4 rounded border">
                        <p className="text-xs text-gray-500 mb-2">Customer sees:</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-gray-400 line-through text-xl">
                            ${discountDisplay?.originalPrice}
                          </span>
                          <span className="text-3xl font-bold text-gray-900">
                            ${formData.sellingPriceUSD.toFixed(2)}
                          </span>
                          <span className="bg-red-100 text-red-600 text-sm font-bold px-3 py-1 rounded-full">
                            {discountDisplay?.discountPercent}% OFF
                          </span>
                        </div>
                        <p className="text-sm text-green-600 mt-2 font-medium">
                          You save ${discountDisplay?.savings}!
                        </p>
                      </div>
                    ) : (
                      /* When discount is hidden from customers */
                      <div className="bg-white p-4 rounded border">
                        <p className="text-xs text-gray-500 mb-2">Customer sees:</p>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl font-bold text-gray-900">
                            ${formData.sellingPriceUSD.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          No discount information shown (but they still get the discounted price)
                        </p>
                      </div>
                    )}

                    {/* Business info */}
                    <div className="bg-gray-100 p-3 rounded text-sm text-gray-600">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Business Logic:</strong> Customers pay ${formData.sellingPriceUSD.toFixed(2)} regardless of visibility setting. 
                          {formData.showDiscountToCustomers 
                            ? ' They see the savings they\'re getting, which can increase conversions.' 
                            : ' They don\'t see discount details, giving a cleaner price presentation.'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Price Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-blue-50 p-4 rounded-md">
              <Label>Final Selling Price (USD)</Label>
              <div className="text-2xl font-bold text-blue-600">
                ${(formData.sellingPriceUSD || 0).toFixed(2)}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                What customer pays
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-md">
              <Label>Total Cost (USD)</Label>
              <div className="text-xl font-bold text-green-600">
                ${(formData.costPriceUSD || 0).toFixed(2)}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Your total cost
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-md">
              <Label>Profit (USD)</Label>
              <div className="text-xl font-bold text-purple-600">
                ${((formData.sellingPriceUSD || 0) - (formData.costPriceUSD || 0)).toFixed(2)}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {formData.costPriceUSD > 0 ? (((formData.sellingPriceUSD - formData.costPriceUSD) / formData.costPriceUSD * 100)).toFixed(1) : '0'}% margin
              </p>
            </div>
          </div>

          {/* Discount Breakdown (when discount exists) */}
          {formData.discountPercentage > 0 && discountDisplay && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-3">Discount Breakdown</h4>
              <div className="grid gap-3 md:grid-cols-3 text-sm">
                <div>
                  <span className="text-gray-600">Original Price:</span>
                  <span className="ml-2 font-semibold">${discountDisplay.originalPrice}</span>
                </div>
                <div>
                  <span className="text-gray-600">Discount:</span>
                  <span className="ml-2 font-semibold text-red-600">-{formData.discountPercentage}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Customer Saves:</span>
                  <span className="ml-2 font-semibold text-green-600">${discountDisplay.savings}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. Inventory Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Stock Quantity *</Label>
              <Input
                id="stockQuantity"
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => handleInputChange('stockQuantity', parseInt(e.target.value) || 0)}
                min="0"
                className={errors.stockQuantity ? 'border-red-500' : ''}
              />
              {errors.stockQuantity && <p className="text-sm text-red-500">{errors.stockQuantity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
              <Input
                id="lowStockAlert"
                type="number"
                value={formData.lowStockAlert}
                onChange={(e) => handleInputChange('lowStockAlert', parseInt(e.target.value) || 5)}
                min="0"
              />
              <p className="text-xs text-gray-500">
                Alert when stock falls below this number
              </p>
            </div>
          </div>

          {/* Stock Status Indicator */}
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-center gap-2">
              {formData.stockQuantity === 0 ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-red-700 font-medium">Out of Stock</span>
                </>
              ) : formData.stockQuantity <= formData.lowStockAlert ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-yellow-700 font-medium">Low Stock Warning</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-700 font-medium">In Stock</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7. Product Content & SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Product Content & SEO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Short Description */}
          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Textarea
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) => handleInputChange('shortDescription', e.target.value)}
              placeholder="Brief product description for listings"
              rows={2}
              maxLength={200}
            />
            <p className="text-xs text-gray-500">
              {formData.shortDescription.length}/200 characters
            </p>
          </div>

          {/* Full Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Detailed product description"
              rows={4}
            />
          </div>

          {/* SEO Title */}
          <div className="space-y-2">
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input
              id="seoTitle"
              value={formData.seoTitle}
              onChange={(e) => handleInputChange('seoTitle', e.target.value)}
              placeholder="Optimized title for search engines"
              maxLength={60}
            />
            <p className="text-xs text-gray-500">
              {formData.seoTitle.length}/60 characters. Keep under 60 for best SEO.
            </p>
          </div>

          {/* SEO Description */}
          <div className="space-y-2">
            <Label htmlFor="seoDescription">SEO Description</Label>
            <Textarea
              id="seoDescription"
              value={formData.seoDescription}
              onChange={(e) => handleInputChange('seoDescription', e.target.value)}
              placeholder="Meta description for search engines"
              maxLength={160}
              rows={3}
            />
            <p className="text-xs text-gray-500">
              {formData.seoDescription.length}/160 characters. Keep under 160 for best SEO.
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()))}
              placeholder="traditional, handmade, ethnic (comma separated)"
            />
            <p className="text-xs text-gray-500">
              Separate tags with commas for better search visibility
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 8. AI Content Generation */}
      <AIGenerationPanel
        productName={formData.name}
        categoryName={categories.find(c => c.id === formData.categoryId)?.name || ''}
        images={formData.images}
        onGenerate={handleAIGeneration}
        isGenerating={isGeneratingAI}
      />

      {/* 9. Product Status & Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Product Status & Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isActive">Active Product</Label>
            </div>

            <div className="flex items-center space-x-2">
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

          {/* Current Status Display */}
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Current Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                formData.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                formData.status === 'ARCHIVED' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {formData.status || 'DRAFT'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4 pt-6">
        <Link href="/admin/products">
          <Button variant="outline" disabled={loading}>
            Cancel
          </Button>
        </Link>

        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit('save')}
          disabled={loading}
        >
          {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save as Draft
        </Button>

        <Button
          type="button"
          onClick={() => handleSubmit('publish')}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
          {formData.status === 'PUBLISHED' ? 'Update & Keep Published' : 'Publish Product'}
        </Button>
      </div>

      {/* Debug Information (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Debug Info (Dev Only)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify({
                sellingPriceUSD: formData.sellingPriceUSD,
                costPriceUSD: formData.costPriceUSD,
                discountPercentage: formData.discountPercentage,
                showDiscountToCustomers: formData.showDiscountToCustomers,
                discountDisplay,
                exchangeRate,
                selectedCountry: selectedCountry?.name
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}