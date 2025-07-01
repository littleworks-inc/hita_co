// =====================================
// ENHANCED: src/components/admin/ProductForm.tsx
// Complete ProductForm with Advanced Pricing System for Ethnic Fashion Store
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
  Info,
  Calculator,
  TrendingUp,
  Percent,
  Plus,
  Trash2,
  Ruler
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
  // 🎯 NEW: Size system fields
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

  // 🎯 NEW: Enhanced pricing state
  const [showCustomerPreview, setShowCustomerPreview] = useState(false)
  const [showCostBreakdown, setShowCostBreakdown] = useState(false)
  const [pricingMode, setPricingMode] = useState<'automatic' | 'manual'>('automatic')

  // Form state - ENHANCED WITH BETTER DEFAULTS
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
    originalPrice: product?.originalPrice || 55, // 🎯 DEFAULT: $55 as mentioned in your example
    originalCurrency: product?.originalCurrency || 'USD',
    quantity: product?.quantity || 1,
    gstPercentage: product?.gstPercentage || 18,
    shippingCost: product?.shippingCost || 0,
    conversionCharges: product?.conversionCharges || 0,
    additionalExpenses: product?.additionalExpenses || 0,
    costPriceUSD: product?.costPriceUSD || 55, // Will be calculated
    piecePriceUSD: product?.piecePriceUSD || 55, // Will be calculated
    profitMargin: product?.profitMargin || 100, // 🎯 DEFAULT: 100% as mentioned
    discountPercentage: product?.discountPercentage || 0,
    showDiscountToCustomers: product?.showDiscountToCustomers ?? true, // 🎯 DEFAULT: Show discounts
    sellingPriceUSD: product?.sellingPriceUSD || 110, // Will be calculated (55 + 100% = 110)
    stockQuantity: product?.stockQuantity || 12, // 🎯 DEFAULT: Based on recommendation
    lowStockAlert: product?.lowStockAlert || 5, // 🎯 DEFAULT: Based on recommendation
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    tags: product?.tags || [],
    images: product?.images || [],
    seoTitle: product?.seoTitle || '',
    seoDescription: product?.seoDescription || '',
    status: product?.status || 'DRAFT',
    publishedAt: product?.publishedAt || null,
    archivedAt: product?.archivedAt || null,
    // 🎯 NEW: Size system fields with defaults
    requiresSizes: product?.requiresSizes ?? false,
    productSizes: product?.productSizes || []
  })

  // ✅ ENHANCED: Helper Functions for Pricing Calculations
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

  // 🎯 NEW: Calculate comprehensive pricing breakdown
  const calculatePricingBreakdown = () => {
    const originalPrice = safeNumber(formData.originalPrice)
    const costPrice = safeNumber(formData.piecePriceUSD)
    const sellingPrice = safeNumber(formData.sellingPriceUSD)
    const discountPercent = safeNumber(formData.discountPercentage)
    
    // Calculate what customer actually pays
    const customerPayment = discountPercent > 0 
      ? sellingPrice * (1 - discountPercent / 100)
      : sellingPrice
    
    // Calculate profit information
    const grossProfit = customerPayment - costPrice
    const profitMarginPercent = costPrice > 0 ? (grossProfit / costPrice) * 100 : 0
    
    // Calculate the "original price" for display (if showing discount)
    const displayOriginalPrice = discountPercent > 0 && formData.showDiscountToCustomers
      ? customerPayment / (1 - discountPercent / 100)
      : sellingPrice
    
    // Calculate savings for customer
    const customerSavings = discountPercent > 0 ? sellingPrice - customerPayment : 0
    
    return {
      originalPrice,
      costPrice,
      sellingPrice,
      customerPayment,
      grossProfit,
      profitMarginPercent,
      displayOriginalPrice,
      customerSavings,
      discountPercent
    }
  }

  // ✅ FIXED: Proper barcode callback function
  const handleBarcodeGenerated = (barcode: string, barcodeType: string) => {
    console.log('✅ Barcode callback received:', { barcode, barcodeType })

    setFormData(prev => ({
      ...prev,
      barcode: barcode,
      barcodeType: barcodeType
    }))

    setBarcodeNeedsUpdate(false)
    setSuccessMessage(`Barcode updated: ${barcode} (${barcodeType})`)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  // 🎯 ENHANCED: Advanced input change handler with pricing calculations
  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // 🎯 ENHANCED: Auto-calculate cost breakdown when relevant fields change
    if (['originalPrice', 'quantity', 'gstPercentage', 'shippingCost', 'conversionCharges', 'additionalExpenses'].includes(field)) {
      const country = countries.find(c => c.id === formData.countryId)
      if (country?.exchangeRate) {
        setTimeout(() => {
          const updatedFormData = { ...formData, [field]: value }

          const costBreakdown = calculateCostBreakdown(
            updatedFormData.originalPrice,
            updatedFormData.quantity,
            updatedFormData.gstPercentage,
            updatedFormData.shippingCost,
            updatedFormData.conversionCharges,
            updatedFormData.additionalExpenses,
            country.exchangeRate
          )

          setFormData(prev => ({
            ...prev,
            costPriceUSD: costBreakdown.costPriceUSD,
            piecePriceUSD: costBreakdown.piecePriceUSD
          }))
        }, 100)
      }
    }

    // 🎯 ENHANCED: Auto-calculate selling price when profit margin changes
    if (['piecePriceUSD', 'profitMargin'].includes(field) && pricingMode === 'automatic') {
      setTimeout(() => {
        const updatedFormData = { ...formData, [field]: value }
        
        // Calculate selling price based on cost + profit margin
        const newSellingPrice = updatedFormData.piecePriceUSD * (1 + updatedFormData.profitMargin / 100)
        
        setFormData(prev => ({ ...prev, sellingPriceUSD: newSellingPrice }))
      }, 100)
    }

    // ✅ FIXED: SKU change detection for barcode updates
    if (field === 'sku') {
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

  // 🎯 NEW: Pricing suggestions based on category
  const getPricingSuggestions = () => {
    const category = categories.find(c => c.id === formData.categoryId)
    if (!category) return null

    const suggestions = {
      'Sarees': { margin: [100, 150], stock: [8, 15], discount: [15, 25] },
      'Kurtas': { margin: [80, 120], stock: [12, 20], discount: [20, 30] },
      'Lehengas': { margin: [150, 200], stock: [3, 8], discount: [10, 20] },
      'Jewelry': { margin: [200, 300], stock: [15, 25], discount: [5, 15] },
      'Accessories': { margin: [100, 150], stock: [20, 30], discount: [25, 35] }
    }

    return suggestions[category.name as keyof typeof suggestions] || suggestions['Kurtas']
  }

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
    if (formData.profitMargin < 0) newErrors.profitMargin = 'Profit margin cannot be negative'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Form submission
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
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          return dateValue
        }
        const date = new Date(dateValue)
        if (isNaN(date.getTime())) return null
        return date.toISOString().split('T')[0]
      }

      const submissionData = {
        ...formData,
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

  // 🎯 NEW: Size management functions
  const addSize = (size: string) => {
    if (!size.trim()) return

    // Check if size already exists
    if (formData.productSizes?.some(s => s.size.toLowerCase() === size.toLowerCase())) {
      setErrors(prev => ({ ...prev, sizes: `Size "${size}" already exists` }))
      return
    }

    const newSize: ProductSize = {
      size: size.trim(),
      sku: `${formData.sku}-${size.trim().toUpperCase()}`,
      stockQuantity: 0,
      lowStockAlert: 5,
      isActive: true,
      sortOrder: formData.productSizes?.length || 0
    }

    setFormData(prev => ({
      ...prev,
      productSizes: [...(prev.productSizes || []), newSize]
    }))

    // Clear any size errors
    setErrors(prev => ({ ...prev, sizes: '' }))
  }

  const removeSize = (index: number) => {
    setFormData(prev => ({
      ...prev,
      productSizes: prev.productSizes?.filter((_, i) => i !== index) || []
    }))
  }

  const updateSize = (index: number, field: keyof ProductSize, value: any) => {
    setFormData(prev => ({
      ...prev,
      productSizes: prev.productSizes?.map((size, i) =>
        i === index ? { ...size, [field]: value } : size
      ) || []
    }))
  }

  const addStandardSizes = (sizeType: 'clothing' | 'shoes' | 'jewelry') => {
    const sizePresets = {
      clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      shoes: ['6', '7', '8', '9', '10', '11'],
      jewelry: ['XS', 'S', 'M', 'L']
    }

    sizePresets[sizeType].forEach(size => {
      if (!formData.productSizes?.some(s => s.size === size)) {
        addSize(size)
      }
    })
  }

  // 🎯 ENHANCED: Auto-detect size requirements based on category
  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    
    // Auto-detect if sizes are needed based on category name
    const categoryName = category?.name.toLowerCase() || ''
    const needsSizes = ['kurta', 'blouse', 'lehenga', 'pant', 'salwar', 'dress', 'top'].some(term => 
      categoryName.includes(term)
    )

    setFormData(prev => ({
      ...prev,
      categoryId,
      requiresSizes: needsSizes,
      // Clear sizes if switching to a non-sized category
      productSizes: needsSizes ? prev.productSizes : []
    }))

    handleInputChange('categoryId', categoryId)
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
                  onChange={(e) => handleCategoryChange(e.target.value)}
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

        {/* 4. 🎯 ENHANCED: Advanced Pricing & Inventory System */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Advanced Pricing & Inventory
              <div className="ml-auto flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                >
                  <Calculator className="h-4 w-4 mr-1" />
                  {showCostBreakdown ? 'Hide' : 'Show'} Breakdown
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* 🎯 NEW: Pricing Strategy Suggestions */}
            {pricingSuggestions && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-800 mb-2">
                      Ethnic Fashion Pricing Recommendations
                    </h4>
                    <div className="grid gap-2 md:grid-cols-3 text-sm">
                      <div>
                        <span className="text-blue-700 font-medium">Profit Margin:</span>
                        <span className="ml-1">{pricingSuggestions.margin[0]}% - {pricingSuggestions.margin[1]}%</span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Stock Level:</span>
                        <span className="ml-1">{pricingSuggestions.stock[0]} - {pricingSuggestions.stock[1]} units</span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Discount Range:</span>
                        <span className="ml-1">{pricingSuggestions.discount[0]}% - {pricingSuggestions.discount[1]}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Original Purchase Details */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="originalPrice">Original Price (Cost) *</Label>
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

            {/* 🎯 ENHANCED: Cost Breakdown Display */}
            {showCostBreakdown && (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-3">Detailed Cost Breakdown</h4>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div>
                    <div className="text-gray-600">Total Cost (USD)</div>
                    <div className="text-lg font-semibold text-gray-900">
                      ${safeToFixed(formData.costPriceUSD)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Per Piece Cost</div>
                    <div className="text-lg font-semibold text-blue-600">
                      ${safeToFixed(formData.piecePriceUSD)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Exchange Rate</div>
                    <div className="text-sm text-gray-900">
                      1 USD = {countries.find(c => c.id === formData.countryId)?.exchangeRate || 1} {formData.originalCurrency}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">GST Amount</div>
                    <div className="text-sm text-gray-900">
                      ${safeToFixed((formData.originalPrice * formData.gstPercentage) / 100)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 🎯 ENHANCED: Pricing Strategy Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Pricing Strategy
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={pricingMode === 'automatic' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPricingMode('automatic')}
                  >
                    Auto Calculate
                  </Button>
                  <Button
                    type="button"
                    variant={pricingMode === 'manual' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPricingMode('manual')}
                  >
                    Manual Override
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profitMargin">Profit Margin % *</Label>
                  <Input
                    id="profitMargin"
                    type="number"
                    step="0.01"
                    value={formData.profitMargin}
                    onChange={(e) => handleInputChange('profitMargin', parseFloat(e.target.value) || 0)}
                    className={errors.profitMargin ? 'border-red-500' : ''}
                  />
                  {errors.profitMargin && <p className="text-sm text-red-500">{errors.profitMargin}</p>}
                  <div className="text-xs text-gray-500">
                    100% margin = Double your cost price
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sellingPriceUSD">Selling Price (USD)</Label>
                  <Input
                    id="sellingPriceUSD"
                    type="number"
                    step="0.01"
                    value={formData.sellingPriceUSD}
                    onChange={(e) => handleInputChange('sellingPriceUSD', parseFloat(e.target.value) || 0)}
                    disabled={pricingMode === 'automatic'}
                    className={pricingMode === 'automatic' ? 'bg-gray-100' : ''}
                  />
                  <div className="text-xs text-gray-500">
                    {pricingMode === 'automatic' ? 'Auto-calculated from profit margin' : 'Manual price override'}
                  </div>
                </div>
              </div>

              {/* 🎯 ENHANCED: Profit Display */}
              <div className="grid gap-4 md:grid-cols-3 mt-4 p-4 bg-green-50 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-green-700">Gross Profit</div>
                  <div className="text-xl font-bold text-green-800">
                    ${safeToFixed(pricingBreakdown.grossProfit)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-green-700">Profit Margin</div>
                  <div className="text-xl font-bold text-green-800">
                    {safeToFixed(pricingBreakdown.profitMarginPercent, 1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-green-700">Customer Pays</div>
                  <div className="text-xl font-bold text-green-800">
                    ${safeToFixed(pricingBreakdown.customerPayment)}
                  </div>
                </div>
              </div>
            </div>

            {/* 🎯 ENHANCED: Discount System */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Percent className="h-5 w-5 text-purple-600" />
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
                    Display original price crossed out with discount percentage
                  </div>
                </div>
              </div>

              {/* 🎯 ENHANCED: Customer Preview */}
              {formData.discountPercentage > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
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
                        <div className="bg-white p-4 rounded border">
                          <div className="text-sm text-gray-600 mb-2">Customer sees discount:</div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg line-through text-gray-500">
                              ${safeToFixed(pricingBreakdown.sellingPriceUSD)}
                            </span>
                            <span className="text-2xl font-bold text-green-600">
                              ${safeToFixed(pricingBreakdown.customerPayment)}
                            </span>
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                              {formData.discountPercentage}% OFF
                            </span>
                          </div>
                          <div className="text-sm text-green-600 mt-2">
                            You save ${safeToFixed(pricingBreakdown.customerSavings)}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-4 rounded border">
                          <div className="text-sm text-gray-600 mb-2">Clean pricing (no discount shown):</div>
                          <div className="text-2xl font-bold text-green-600">
                            ${safeToFixed(pricingBreakdown.customerPayment)}
                          </div>
                          <div className="text-sm text-gray-500 mt-2">
                            Discount applied internally
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 🎯 ENHANCED: Stock Management with Size Support */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Inventory Management
              </h3>

              {/* 🎯 ENHANCED: Size System Checkbox */}
              <div className="mb-6">
                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border">
                  <input
                    type="checkbox"
                    id="requiresSizes"
                    checked={formData.requiresSizes}
                    onChange={(e) => {
                      const requiresSizes = e.target.checked
                      setFormData(prev => ({
                        ...prev,
                        requiresSizes,
                        // Clear sizes if disabling
                        productSizes: requiresSizes ? prev.productSizes : []
                      }))
                    }}
                    className="rounded h-4 w-4"
                  />
                  <Label htmlFor="requiresSizes" className="cursor-pointer">
                    <span className="font-medium">This product has size variants</span>
                    <div className="text-sm text-gray-500 mt-1">
                      Enable for kurtas, blouses, lehengas, and other fitted garments that require different sizes
                    </div>
                  </Label>
                </div>
              </div>

              {/* 🎯 ENHANCED: Size Selection Interface (shown when checkbox is checked) */}
              {formData.requiresSizes && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-blue-900">Size Variants Management</h4>
                    <div className="text-sm text-blue-700">
                      {formData.productSizes.length} size{formData.productSizes.length !== 1 ? 's' : ''} added
                    </div>
                  </div>

                  {/* Quick Size Addition Buttons */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Quick Add:</div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addStandardSizes('clothing')}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Clothing Sizes (XS-XXL)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addStandardSizes('shoes')}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Shoe Sizes (6-11)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const size = prompt('Enter custom size name (e.g., 32, 34, 36 for waist sizes):')
                          if (size?.trim()) addSize(size.trim())
                        }}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Custom Size
                      </Button>
                    </div>
                  </div>

                  {/* Size Management Table */}
                  {formData.productSizes.length > 0 ? (
                    <div className="space-y-3">
                      {/* Table Header */}
                      <div className="grid grid-cols-6 gap-3 text-xs font-medium text-gray-600 px-3 py-2 bg-white rounded border">
                        <div>Size</div>
                        <div>SKU</div>
                        <div>Stock Qty</div>
                        <div>Low Alert</div>
                        <div>Status</div>
                        <div>Action</div>
                      </div>
                      
                      {/* Size Rows */}
                      {formData.productSizes.map((size, index) => (
                        <div key={index} className="grid grid-cols-6 gap-3 items-center bg-white p-3 rounded border">
                          {/* Size Name */}
                          <div className="font-medium text-sm">{size.size}</div>
                          
                          {/* SKU */}
                          <Input
                            value={size.sku}
                            onChange={(e) => updateSize(index, 'sku', e.target.value)}
                            placeholder="SKU"
                            className="text-xs h-8"
                          />
                          
                          {/* Stock Quantity */}
                          <Input
                            type="number"
                            min="0"
                            value={size.stockQuantity}
                            onChange={(e) => updateSize(index, 'stockQuantity', parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="text-xs h-8"
                          />
                          
                          {/* Low Stock Alert */}
                          <Input
                            type="number"
                            min="0"
                            value={size.lowStockAlert}
                            onChange={(e) => updateSize(index, 'lowStockAlert', parseInt(e.target.value) || 0)}
                            placeholder="5"
                            className="text-xs h-8"
                          />
                          
                          {/* Status Toggle */}
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={size.isActive}
                              onChange={(e) => updateSize(index, 'isActive', e.target.checked)}
                              className="rounded h-3 w-3"
                            />
                            <span className="ml-1 text-xs text-gray-600">Active</span>
                          </div>
                          
                          {/* Remove Button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSize(index)}
                            className="text-red-600 hover:text-red-800 h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}

                      {/* Size Summary Card */}
                      <div className="mt-4 p-3 bg-white rounded border">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-gray-600">Total Stock</div>
                            <div className="text-lg font-bold text-blue-600">
                              {formData.productSizes.reduce((sum, size) => sum + size.stockQuantity, 0)}
                            </div>
                            <div className="text-xs text-gray-500">across all sizes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600">Active Sizes</div>
                            <div className="text-lg font-bold text-green-600">
                              {formData.productSizes.filter(s => s.isActive).length}
                            </div>
                            <div className="text-xs text-gray-500">of {formData.productSizes.length} total</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600">Low Stock</div>
                            <div className="text-lg font-bold text-orange-600">
                              {formData.productSizes.filter(s => s.stockQuantity <= s.lowStockAlert && s.stockQuantity > 0).length}
                            </div>
                            <div className="text-xs text-gray-500">sizes need restock</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600">Out of Stock</div>
                            <div className="text-lg font-bold text-red-600">
                              {formData.productSizes.filter(s => s.stockQuantity === 0).length}
                            </div>
                            <div className="text-xs text-gray-500">sizes unavailable</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Empty State */
                    <div className="text-center py-8 border-2 border-dashed border-blue-300 rounded-lg bg-blue-25">
                      <Ruler className="h-8 w-8 mx-auto mb-3 text-blue-400" />
                      <div className="text-blue-800 font-medium mb-1">No sizes added yet</div>
                      <div className="text-sm text-blue-600 mb-3">
                        Add size variants using the quick buttons above or create custom sizes
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addStandardSizes('clothing')}
                        className="text-blue-700 border-blue-300"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Standard Clothing Sizes
                      </Button>
                    </div>
                  )}

                  {/* Size Validation Errors */}
                  {errors.sizes && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-700 font-medium">{errors.sizes}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 🎯 Traditional Stock Management (for non-sized products) */}
              {!formData.requiresSizes && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-3">Traditional Inventory</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                      <Input
                        id="stockQuantity"
                        type="number"
                        min="0"
                        value={formData.stockQuantity}
                        onChange={(e) => handleInputChange('stockQuantity', parseInt(e.target.value) || 0)}
                        className={errors.stockQuantity ? 'border-red-500' : ''}
                        placeholder="e.g., 12"
                      />
                      {errors.stockQuantity && <p className="text-sm text-red-500">{errors.stockQuantity}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
                      <Input
                        id="lowStockAlert"
                        type="number"
                        min="0"
                        value={formData.lowStockAlert}
                        onChange={(e) => handleInputChange('lowStockAlert', parseInt(e.target.value) || 0)}
                        placeholder="e.g., 5"
                      />
                      <div className="text-xs text-gray-500">
                        Get notified when stock drops to this level
                      </div>
                    </div>
                  </div>

                  {/* Stock Status Indicator */}
                  <div className="mt-4 p-3 bg-white rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Current Status:</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        formData.stockQuantity === 0 
                          ? 'bg-red-100 text-red-700' 
                          : formData.stockQuantity <= formData.lowStockAlert 
                          ? 'bg-orange-100 text-orange-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {formData.stockQuantity === 0 ? 'Out of Stock' :
                         formData.stockQuantity <= formData.lowStockAlert ? 'Low Stock' :
                         'In Stock'}
                      </span>
                    </div>
                    
                    {/* Visual Stock Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          formData.stockQuantity === 0 ? 'bg-red-500' :
                          formData.stockQuantity <= formData.lowStockAlert ? 'bg-orange-500' :
                          'bg-green-500'
                        }`}
                        style={{ 
                          width: formData.stockQuantity === 0 ? '0%' : 
                                 `${Math.min((formData.stockQuantity / Math.max(formData.lowStockAlert * 3, 10)) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>{formData.stockQuantity} units</span>
                      <span>{formData.lowStockAlert * 3}+ (Good stock)</span>
                    </div>
                  </div>
                </div>
              )}
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