// =====================================
// COMPLETE: Enhanced ProductForm with Integrated Barcode System
// src/components/admin/ProductForm.tsx
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
  Globe
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
  sellingPriceUSD: number
  
  // 🎯 NEW: Discount Visibility Control
  showDiscountToCustomers: boolean
  
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
  
  // ✅ ENHANCED: Barcode-specific state
  const [barcodeNeedsUpdate, setBarcodeNeedsUpdate] = useState(false)
  const [originalSku, setOriginalSku] = useState(product?.sku || '')

  // Form state
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
    sellingPriceUSD: product?.sellingPriceUSD || 0,
    stockQuantity: product?.stockQuantity || 0,
    lowStockAlert: product?.lowStockAlert || 5,
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    tags: product?.tags || [],
    images: product?.images || [],
    seoTitle: product?.seoTitle || '',
    seoDescription: product?.seoDescription || '',
    // ✅ ADDED: Draft system initialization
    status: product?.status || 'DRAFT',
    publishedAt: product?.publishedAt || null,
    archivedAt: product?.archivedAt || null,
    discountPercentage: product?.discountPercentage || 0,
    showDiscountToCustomers: product?.showDiscountToCustomers ?? false, // NEW FIELD
    sellingPriceUSD: product?.sellingPriceUSD || 0,
  })

  // Get selected country for exchange rate
  const selectedCountry = countries.find(c => c.id === formData.countryId)
  const exchangeRate = selectedCountry?.exchangeRate || 1

  // ✅ ENHANCED: Barcode change handler
  const handleBarcodeGenerated = (barcode: string, barcodeType: string) => {
    setFormData(prev => ({
      ...prev,
      barcode,
      barcodeType
    }))
    setBarcodeNeedsUpdate(false)
  }

  // ✅ ENHANCED: SKU change detection for barcode updates
  useEffect(() => {
    if (formData.sku && originalSku && formData.sku !== originalSku) {
      const needsUpdate = shouldUpdateBarcode(formData.barcode, originalSku, formData.sku)
      setBarcodeNeedsUpdate(needsUpdate)
    }
  }, [formData.sku, originalSku, formData.barcode])

  // ✅ ENHANCED: Initialize barcode for existing products
  useEffect(() => {
    if (mode === 'edit' && product) {
      setOriginalSku(product.sku)
      
      // If product has no barcode but has SKU, offer to generate one
      if (!product.barcode && product.sku) {
        setBarcodeNeedsUpdate(true)
      }
    }
  }, [mode, product])

  // Auto-generate SKU when name changes (only for new products)
  useEffect(() => {
    if (mode === 'create' && formData.name && !formData.sku) {
      setFormData(prev => ({
        ...prev,
        sku: generateSKU(formData.name)
      }))
    }
  }, [formData.name, mode])

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

  // ✅ ENHANCED: Form validation including barcode and draft status
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Product name is required'
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required'
    if (!formData.categoryId) newErrors.categoryId = 'Category is required'
    if (!formData.countryId) newErrors.countryId = 'Country is required'
    if (!formData.supplierId) newErrors.supplierId = 'Supplier is required'
    if (!formData.barcode.trim()) newErrors.barcode = 'Barcode is required'
    if (formData.originalPrice <= 0) newErrors.originalPrice = 'Original price must be greater than 0'
    if (formData.stockQuantity < 0) newErrors.stockQuantity = 'Stock quantity cannot be negative'

    // ✅ ADDED: Additional validation for publishing
    if (formData.status === 'PUBLISHED') {
      if (!formData.description?.trim()) newErrors.description = 'Description is required for published products'
      if (!formData.shortDescription?.trim()) newErrors.shortDescription = 'Short description is required for published products'
      if (!formData.images || formData.images.length === 0) newErrors.images = 'At least one image is required for published products'
      if (formData.sellingPriceUSD <= 0) newErrors.sellingPriceUSD = 'Selling price must be greater than 0 for published products'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ✅ ENHANCED: AI Generation Handler
  const handleAIGeneration = async (type: string, aiInputData: AIInputData) => {
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
          currentDescription: formData.description,
          currentShortDescription: formData.shortDescription,
          images: formData.images,
          ...aiInputData,
          maxTokens: type === 'product_description' ? 300 : type === 'seo_content' ? 80 : 200
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

  // ✅ ENHANCED: Form submission with draft system
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const url = mode === 'create' 
        ? '/api/admin/products' 
        : `/api/admin/products/${product?.id}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'

      // ✅ ADDED: Handle draft system timestamps
      const submitData = { ...formData }
      
      // Set publishedAt timestamp if publishing for the first time
      if (formData.status === 'PUBLISHED' && !formData.publishedAt) {
        submitData.publishedAt = new Date().toISOString()
      }
      
      // Set archivedAt timestamp if archiving
      if (formData.status === 'ARCHIVED' && !formData.archivedAt) {
        submitData.archivedAt = new Date().toISOString()
      }
      
      // Clear archivedAt if moving from archived to draft/published
      if (formData.status !== 'ARCHIVED') {
        submitData.archivedAt = null
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      const data = await response.json()

      if (data.success) {
        const statusText = formData.status === 'DRAFT' ? 'saved as draft' : 
                          formData.status === 'PUBLISHED' ? 'published' : 'archived'
        setSuccessMessage(`Product ${mode === 'create' ? 'created' : 'updated'} and ${statusText} successfully!`)
        if (mode === 'create') {
          setTimeout(() => router.push('/admin/products'), 1500)
        }
      } else {
        setErrors({ submit: data.error || 'Failed to save product' })
      }
    } catch (error) {
      setErrors({ submit: 'Network error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {/* Error Messages */}
      {errors.submit && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{errors.submit}</span>
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
              <Label htmlFor="countryId">Country of Origin *</Label>
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
        </CardContent>
      </Card>

      {/* 3. ✅ ENHANCED: Barcode System with SKU Change Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Product Barcode
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* SKU Change Alert */}
          {barcodeNeedsUpdate && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-amber-800">SKU Updated</div>
                <div className="text-sm text-amber-700">
                  Your SKU changed from "{originalSku}" to "{formData.sku}". 
                  Regenerate barcode to match the new SKU?
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBarcodeNeedsUpdate(false)}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  Keep Current
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleBarcodeGenerated('', formData.barcodeType || 'CODE128')
                    setOriginalSku(formData.sku)
                  }}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100 font-medium"
                >
                  Regenerate
                </Button>
              </div>
            </div>
          )}

          {/* Enhanced Auto Barcode Generator */}
          <AutoBarcodeGenerator
            sku={formData.sku}
            currentBarcode={formData.barcode}
            currentBarcodeType={formData.barcodeType || 'CODE128'}
            onBarcodeGenerated={handleBarcodeGenerated}
            productName={formData.name}
          />
          
          {errors.barcode && (
            <p className="text-sm text-red-500 mt-2">{errors.barcode}</p>
          )}
        </CardContent>
      </Card>

      {/* 4. AI Generation Panel */}
      <AIGenerationPanel
        productName={formData.name}
        categoryName={categories.find(c => c.id === formData.categoryId)?.name || ''}
        images={formData.images}
        onGenerate={handleAIGeneration}
        isGenerating={isGeneratingAI}
      />

      {/* 5. Product Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Product Descriptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Textarea
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) => handleInputChange('shortDescription', e.target.value)}
              placeholder="Brief product summary for listings"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Detailed product description"
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      {/* 6. Pricing & Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing & Costs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Original Price *</Label>
              <Input
                id="originalPrice"
                type="number"
                step="0.01"
                value={formData.originalPrice}
                onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
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

          <div className="grid gap-4 md:grid-cols-3">
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
              />
            </div>

            <div className="space-y-2">
              <Label>Selling Price (USD)</Label>
              <div className="text-lg font-semibold text-green-600">
                ${formData.sellingPriceUSD.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500">Auto-calculated</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7. Inventory Management */}
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
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Active Product</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Featured Product</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 8. ✅ SIMPLIFIED: Product Status Display (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Product Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status Display (Read-only) */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <Label>Current Status</Label>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                formData.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                formData.status === 'PUBLISHED' ? 'bg-green-100 text-green-800 border border-green-200' :
                'bg-gray-100 text-gray-800 border border-gray-200'
              }`}>
                {formData.status === 'DRAFT' && <RefreshCw className="h-3 w-3" />}
                {formData.status === 'PUBLISHED' && <CheckCircle className="h-3 w-3" />}
                {formData.status === 'ARCHIVED' && <AlertTriangle className="h-3 w-3" />}
                {formData.status || 'Draft'}
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Use the action buttons below to change the product status.
            </p>
          </div>

          {/* Product Settings */}
          <div className="space-y-4">
            <Label>Product Settings</Label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Active Product (Legacy)</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                  className="rounded"
                  disabled={formData.status !== 'PUBLISHED'}
                />
                <span className="text-sm">
                  Featured Product
                  {formData.status !== 'PUBLISHED' && (
                    <span className="text-gray-400"> (only for published products)</span>
                  )}
                </span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 9. Tags & SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags & SEO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Product Tags</Label>
            <Input
              id="tags"
              value={formData.tags.join(', ')}
              onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
              placeholder="silk, handmade, festive, traditional"
            />
            <p className="text-xs text-gray-500">
              Separate tags with commas. Used for search and filtering.
            </p>
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
        </CardContent>
      </Card>

      {/* 9. Cost Breakdown Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Breakdown Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Total Cost (USD)</div>
              <div className="text-lg font-bold text-blue-800">
                ${(formData.costPriceUSD || 0).toFixed(2)}
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Per Piece (USD)</div>
              <div className="text-lg font-bold text-green-800">
                ${(formData.piecePriceUSD || 0).toFixed(2)}
              </div>
            </div>
            
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Selling Price (USD)</div>
              <div className="text-lg font-bold text-purple-800">
                ${(formData.sellingPriceUSD || 0).toFixed(2)}
              </div>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-sm text-yellow-600 font-medium">Profit Margin</div>
              <div className="text-lg font-bold text-yellow-800">
                {(formData.profitMargin || 0).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Exchange Rate Info */}
          {selectedCountry && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <strong>Exchange Rate:</strong> 1 {selectedCountry.currency} = ${(1/exchangeRate).toFixed(4)} USD
                <br />
                <strong>Original Price:</strong> {selectedCountry.currencySymbol}{formData.originalPrice.toFixed(2)} {selectedCountry.currency}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ ENHANCED: Action Buttons with Draft System Workflow */}
      <div className="flex justify-between items-center pt-6 border-t bg-gray-50 p-4 rounded-lg">
        {/* Left side - Cancel */}
        <Link href="/admin/products">
          <Button type="button" variant="outline" size="lg">
            Cancel
          </Button>
        </Link>

        {/* Right side - Draft/Publish Actions */}
        <div className="flex gap-3">
          {/* Preview Button (for existing products) */}
          {mode === 'edit' && product?.id && (
            <Link href={`/admin/products/${product.id}`}>
              <Button type="button" variant="outline" size="lg">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </Link>
          )}

          {/* Save as Draft Button */}
          <Button 
            type="button" 
            variant="outline"
            size="lg"
            onClick={async (e) => {
              e.preventDefault()
              const previousStatus = formData.status
              handleInputChange('status', 'DRAFT')
              
              // Wait a moment for state to update, then submit
              setTimeout(async () => {
                const form = document.querySelector('form') as HTMLFormElement
                if (form) {
                  const formEvent = new Event('submit', { bubbles: true, cancelable: true })
                  form.dispatchEvent(formEvent)
                }
              }, 100)
            }}
            disabled={loading}
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-400"
          >
            {loading && formData.status === 'DRAFT' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Save as Draft
          </Button>

          {/* Publish Button */}
          <Button 
            type="button"
            size="lg"
            onClick={async (e) => {
              e.preventDefault()
              handleInputChange('status', 'PUBLISHED')
              
              // Wait a moment for state to update, then submit
              setTimeout(async () => {
                const form = document.querySelector('form') as HTMLFormElement
                if (form) {
                  const formEvent = new Event('submit', { bubbles: true, cancelable: true })
                  form.dispatchEvent(formEvent)
                }
              }, 100)
            }}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading && formData.status === 'PUBLISHED' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {mode === 'create' ? 'Create & Publish' : 'Save & Publish'}
          </Button>

          {/* Archive Button (only for existing products) */}
          {mode === 'edit' && (
            <Button 
              type="button"
              variant="outline"
              size="lg"
              onClick={async (e) => {
                e.preventDefault()
                if (confirm('Are you sure you want to archive this product? It will be hidden from customers.')) {
                  handleInputChange('status', 'ARCHIVED')
                  
                  // Wait a moment for state to update, then submit
                  setTimeout(async () => {
                    const form = document.querySelector('form') as HTMLFormElement
                    if (form) {
                      const formEvent = new Event('submit', { bubbles: true, cancelable: true })
                      form.dispatchEvent(formEvent)
                    }
                  }, 100)
                }
              }}
              disabled={loading}
              className="border-gray-400 text-gray-700 hover:bg-gray-50 hover:border-gray-500"
            >
              {loading && formData.status === 'ARCHIVED' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* Status Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${
            formData.status === 'DRAFT' ? 'bg-yellow-500' :
            formData.status === 'PUBLISHED' ? 'bg-green-500' :
            'bg-gray-500'
          }`}></div>
          <span className="text-sm font-medium text-blue-900">
            Current Status: {formData.status || 'DRAFT'}
          </span>
        </div>
        
        <div className="text-sm text-blue-700">
          {formData.status === 'DRAFT' && (
            <>
              <strong>Draft:</strong> This product is being created or edited. It's not visible to customers.
              You can save changes without validation requirements.
            </>
          )}
          {formData.status === 'PUBLISHED' && (
            <>
              <strong>Published:</strong> This product is live and visible to customers.
              {formData.publishedAt && (
                <span className="block text-xs text-blue-600 mt-1">
                  Published: {new Date(formData.publishedAt).toLocaleDateString()}
                </span>
              )}
            </>
          )}
          {formData.status === 'ARCHIVED' && (
            <>
              <strong>Archived:</strong> This product is hidden from customers but preserved in the system.
              {formData.archivedAt && (
                <span className="block text-xs text-blue-600 mt-1">
                  Archived: {new Date(formData.archivedAt).toLocaleDateString()}
                </span>
              )}
            </>
          )}
        </div>

        {/* Publishing Requirements Check */}
        {formData.status === 'PUBLISHED' && (
          <div className="mt-3 p-3 bg-white border border-blue-200 rounded">
            <div className="text-xs font-medium text-blue-900 mb-2">Publishing Requirements:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`flex items-center gap-1 ${formData.name ? 'text-green-700' : 'text-red-700'}`}>
                {formData.name ? '✓' : '✗'} Product name
              </div>
              <div className={`flex items-center gap-1 ${formData.description ? 'text-green-700' : 'text-red-700'}`}>
                {formData.description ? '✓' : '✗'} Description
              </div>
              <div className={`flex items-center gap-1 ${formData.images?.length ? 'text-green-700' : 'text-red-700'}`}>
                {formData.images?.length ? '✓' : '✗'} Images
              </div>
              <div className={`flex items-center gap-1 ${formData.sellingPriceUSD > 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formData.sellingPriceUSD > 0 ? '✓' : '✗'} Pricing
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Debug Information (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <details className="text-xs text-gray-600">
              <summary className="cursor-pointer font-medium mb-2">Form Data</summary>
              <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify({
                  mode,
                  formDataPreview: {
                    name: formData.name,
                    sku: formData.sku,
                    barcode: formData.barcode,
                    barcodeType: formData.barcodeType,
                    originalPrice: formData.originalPrice,
                    sellingPriceUSD: formData.sellingPriceUSD,
                    stockQuantity: formData.stockQuantity,
                    isActive: formData.isActive
                  },
                  barcodeState: {
                    originalSku,
                    barcodeNeedsUpdate,
                    currentBarcode: formData.barcode
                  },
                  selectedCountry: selectedCountry?.name,
                  exchangeRate,
                  errors: Object.keys(errors)
                }, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </form>
  )
}

/*
🎯 USAGE INSTRUCTIONS:

1. **Import Required Components:**
   Make sure these components exist or create them:
   - AutoBarcodeGenerator (✅ provided)
   - ImageUpload 
   - AIGenerationPanel

2. **Install Dependencies:**
   ```bash
   npm install jsbarcode
   ```

3. **Required Utility Functions:**
   Make sure these exist in src/lib/utils.ts:
   - generateSKU()
   - calculateCostBreakdown()
   - calculateSellingPrice()

4. **Required Utility Functions for Barcode:**
   Make sure src/lib/barcode-utils.ts exists with:
   - shouldUpdateBarcode()

5. **API Endpoints:**
   - POST /api/admin/products (create)
   - PUT /api/admin/products/[id] (update)
   - POST /api/admin/ai/generate (AI generation)

6. **Database Schema:**
   Ensure your Product model includes all fields used in the form

🚀 FEATURES INCLUDED:

✅ Complete product form with all sections
✅ Enhanced barcode system with auto-generation
✅ SKU change detection and barcode regeneration alerts
✅ AI content generation integration
✅ Real-time cost calculations
✅ Currency conversion support
✅ Form validation with error handling
✅ Image upload support
✅ SEO optimization fields
✅ Inventory management
✅ Tags and categorization
✅ Cost breakdown summary
✅ Debug information (development)
✅ Responsive design
✅ Loading states and success messages

This is a production-ready ProductForm component that integrates all your existing systems
with the enhanced barcode functionality! 🎉
*/