// =====================================
// ENHANCED: src/components/admin/ProductForm.tsx
// ProductForm with Complete Flexible Size Management System
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
  Plus,
  Trash2,
  Ruler,
  Archive
} from 'lucide-react'

// Interfaces
interface Category {
  id: string
  name: string
  slug: string
  defaultRequiresSizes?: boolean
  // ✅ REMOVE: defaultSizeType field no longer needed
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
  // ✅ SIMPLIFIED: Only need requiresSizes boolean
  requiresSizes: boolean
  productSizes?: ProductSize[]
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

// Size presets for different types
const SIZE_PRESETS = {
  CLOTHING: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  SHOE: ['6', '7', '8', '9', '10', '11', '12'],
  JEWELRY: ['Small', 'Medium', 'Large'],
  CUSTOM: []
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

  // Discount preview state
  const [showCustomerPreview, setShowCustomerPreview] = useState(false)

  // ✅ NEW: Size management state
  const [showSizePresets, setShowSizePresets] = useState(false)

  // Form state - INCLUDING SIZE FIELDS
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
    showDiscountToCustomers: product?.showDiscountToCustomers ?? false,
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
    archivedAt: product?.archivedAt || null,
    // ✅ SIMPLIFIED: Only requiresSizes needed
    requiresSizes: product?.requiresSizes ?? false,
    productSizes: product?.productSizes || []
  })

  // ✅ Handle category change with size auto-detection
  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)

    setFormData(prev => ({
      ...prev,
      categoryId,
      // Auto-set size requirements based on category defaults
      requiresSizes: category?.defaultRequiresSizes ?? prev.requiresSizes,
      // Reset sizes if switching between sized/non-sized categories
      productSizes: category?.defaultRequiresSizes ? prev.productSizes : []
    }))

    // Auto-generate SKU
    if (formData.name && !originalSku) {
      const newSku = generateSKU(formData.name, category?.name || '')
      setFormData(prev => ({ ...prev, sku: newSku }))
    }
  }

  // ✅ Size management functions
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

  const addPresetSizes = () => {
    const presets = SIZE_PRESETS[formData.sizeType || 'CLOTHING']
    presets.forEach(size => addSize(size))
    setShowSizePresets(false)
  }

  // ✅ Calculate total stock for sized products
  const getTotalStock = () => {
    if (formData.requiresSizes && formData.productSizes?.length) {
      return formData.productSizes.reduce((total, size) => total + size.stockQuantity, 0)
    }
    return formData.stockQuantity
  }

  // Input change handler
  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Auto-calculations
    if (field === 'profitMargin' || field === 'costPriceUSD') {
      const newSellingPrice = calculateSellingPrice(
        field === 'costPriceUSD' ? value : formData.costPriceUSD,
        field === 'profitMargin' ? value : formData.profitMargin
      )
      setFormData(prev => ({ ...prev, sellingPriceUSD: newSellingPrice }))
    }

    // Auto-generate SKU on name/category change
    if (field === 'name' && value && formData.categoryId && !originalSku) {
      const category = categories.find(c => c.id === formData.categoryId)
      const newSku = generateSKU(value, category?.name || '')
      setFormData(prev => ({ ...prev, sku: newSku }))
    }

    // Check if barcode needs update
    if (field === 'sku' && originalSku && value !== originalSku) {
      setBarcodeNeedsUpdate(shouldUpdateBarcode(originalSku, value))
    }
  }

  // Form validation with size validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Product name is required'
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required'
    if (!formData.categoryId) newErrors.categoryId = 'Category is required'
    if (!formData.countryId) newErrors.countryId = 'Country is required'
    if (!formData.supplierId) newErrors.supplierId = 'Supplier is required'
    if (formData.originalPrice <= 0) newErrors.originalPrice = 'Price must be greater than 0'
    if (formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0'

    // ✅ Size-specific validation
    if (formData.requiresSizes) {
      if (!formData.productSizes?.length) {
        newErrors.sizes = 'At least one size is required for sized products'
      } else {
        // Validate individual sizes
        const duplicateSizes = formData.productSizes
          .map(s => s.size.toLowerCase())
          .filter((size, index, arr) => arr.indexOf(size) !== index)

        if (duplicateSizes.length > 0) {
          newErrors.sizes = 'Duplicate sizes found'
        }

        // Check for empty size names
        if (formData.productSizes.some(s => !s.size.trim())) {
          newErrors.sizes = 'Size names cannot be empty'
        }
      }
    } else {
      // Non-sized products need stock quantity
      if (formData.stockQuantity < 0) newErrors.stockQuantity = 'Stock quantity cannot be negative'
    }

    if (formData.discountPercentage < 0 || formData.discountPercentage > 100) {
      newErrors.discountPercentage = 'Discount must be between 0% and 100%'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Form submission with size data
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
        publishedAt: actionType === 'publish' ? new Date().toISOString() : formData.publishedAt,
        // ✅ Include size data
        productSizes: formData.requiresSizes ? formData.productSizes : []
      }

      console.log('📤 Sending data to API:', submissionData)

      const url = mode === 'edit' ? `/api/admin/products/${product?.id}` : '/api/admin/products'
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save product')
      }

      setSuccessMessage(
        actionType === 'publish' ? 'Product published successfully!' :
          actionType === 'archive' ? 'Product archived successfully!' :
            mode === 'edit' ? 'Product updated successfully!' : 'Product created successfully!'
      )

      setTimeout(() => {
        router.push('/admin/products')
      }, 1500)

    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'An error occurred' })
    } finally {
      setLoading(false)
    }
  }

  // AI generation handler
  const handleAIGenerate = async (type: string, userInput?: any) => {
  setIsGeneratingAI(true)
  setErrors(prev => ({ ...prev, aiGeneration: '' }))

  try {
    const response = await fetch('/api/admin/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        context: {
          name: formData.name,
          category: categories.find(c => c.id === formData.categoryId)?.name,
          userInput: userInput || {}, // ✅ FIXED: Include user input
          // ✅ NEW: Include size information
          sizing: formData.requiresSizes && formData.productSizes?.length 
            ? `Available in sizes: ${formData.productSizes.map(s => s.size).join(', ')}` 
            : 'One size fits all'
        },
        options: {
          maxTokens: type === 'short_description' ? 100 : 200
        }
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="e.g., SAR-001"
                  className={errors.sku ? 'border-red-500' : ''}
                />
                {errors.sku && <p className="text-sm text-red-500">{errors.sku}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.categoryId ? 'border-red-500' : ''}`}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                      {category.defaultRequiresSizes && ' (Sized)'}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country of Origin *</Label>
                <select
                  id="country"
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
            </div>

            {/* ✅ NEW: Size Management Section */}
            <div className="border-t pt-4 mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requiresSizes"
                      checked={formData.requiresSizes}
                      onChange={(e) => {
                        handleInputChange('requiresSizes', e.target.checked)
                        if (!e.target.checked) {
                          setFormData(prev => ({ ...prev, productSizes: [] }))
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="requiresSizes" className="flex items-center gap-2">
                      <Ruler className="h-4 w-4" />
                      This product has sizes
                    </Label>
                  </div>
                </div>

                {formData.requiresSizes && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Size Management</h4>
                      <div className="flex gap-2">
                        {/* ✅ SIMPLIFIED: Quick preset buttons for common sizes */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Add standard clothing sizes
                            const clothingSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
                            clothingSizes.forEach(size => addSize(size))
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Clothing Sizes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const size = prompt('Enter size name (e.g., S, M, L, or custom size):')
                            if (size) addSize(size)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Custom Size
                        </Button>
                      </div>
                    </div>

                    {errors.sizes && (
                      <p className="text-sm text-red-500">{errors.sizes}</p>
                    )}

                    {formData.productSizes && formData.productSizes.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Current Sizes:</h5>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {formData.productSizes.map((size, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-white rounded border">
                              <div className="flex-1 grid grid-cols-4 gap-3">
                                <Input
                                  value={size.size}
                                  onChange={(e) => updateSize(index, 'size', e.target.value)}
                                  placeholder="Size (e.g., M, Large, 32)"
                                  className="text-sm"
                                />
                                <Input
                                  value={size.sku}
                                  onChange={(e) => updateSize(index, 'sku', e.target.value)}
                                  placeholder="SKU"
                                  className="text-sm"
                                />
                                <Input
                                  type="number"
                                  value={size.stockQuantity}
                                  onChange={(e) => updateSize(index, 'stockQuantity', parseInt(e.target.value) || 0)}
                                  placeholder="Stock"
                                  className="text-sm"
                                />
                                <Input
                                  type="number"
                                  value={size.lowStockAlert}
                                  onChange={(e) => updateSize(index, 'lowStockAlert', parseInt(e.target.value) || 5)}
                                  placeholder="Alert at"
                                  className="text-sm"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeSize(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-800 font-medium">
                              Total Stock: {getTotalStock()} units
                            </span>
                            <span className="text-blue-600">
                              {formData.productSizes.length} size{formData.productSizes.length !== 1 ? 's' : ''} configured
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.productSizes && formData.productSizes.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Ruler className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>No sizes added yet</p>
                        <p className="text-sm">Use the buttons above to add sizes</p>
                      </div>
                    )}
                  </div>
                )}
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
          </CardContent>
        </Card>

        {/* 2. Inventory & Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing & Inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="profitMargin">Profit Margin (%)</Label>
                <Input
                  id="profitMargin"
                  type="number"
                  value={formData.profitMargin}
                  onChange={(e) => handleInputChange('profitMargin', parseFloat(e.target.value) || 0)}
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellingPriceUSD">Selling Price (USD)</Label>
                <Input
                  id="sellingPriceUSD"
                  type="number"
                  step="0.01"
                  value={formData.sellingPriceUSD}
                  onChange={(e) => handleInputChange('sellingPriceUSD', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Discount System */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountPercentage">Discount Percentage (%)</Label>
                <Input
                  id="discountPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) => handleInputChange('discountPercentage', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className={errors.discountPercentage ? 'border-red-500' : ''}
                />
                {errors.discountPercentage && <p className="text-sm text-red-500">{errors.discountPercentage}</p>}
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="showDiscountToCustomers"
                  checked={formData.showDiscountToCustomers}
                  onChange={(e) => handleInputChange('showDiscountToCustomers', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="showDiscountToCustomers" className="flex items-center gap-2">
                  <EyeOff className="h-4 w-4" />
                  Show discount to customers
                </Label>
              </div>
            </div>

            {/* Stock Management - Conditional based on size requirements */}
            {!formData.requiresSizes && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Stock Quantity</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => handleInputChange('stockQuantity', parseInt(e.target.value) || 0)}
                    placeholder="0"
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
                    placeholder="5"
                  />
                </div>
              </div>
            )}

            {/* Stock Summary for Sized Products */}
            {formData.requiresSizes && formData.productSizes && formData.productSizes.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Stock Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Stock:</span>
                    <span className="ml-2 font-medium">{getTotalStock()} units</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Sizes:</span>
                    <span className="ml-2 font-medium">{formData.productSizes.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">In Stock:</span>
                    <span className="ml-2 font-medium">
                      {formData.productSizes.filter(s => s.stockQuantity > 0).length} sizes
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Low Stock:</span>
                    <span className="ml-2 font-medium text-amber-600">
                      {formData.productSizes.filter(s => s.stockQuantity <= s.lowStockAlert).length} sizes
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Product Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              images={formData.images}
              onImagesChange={(images) => handleInputChange('images', images)}
              maxImages={5}
            />
          </CardContent>
        </Card>

        {/* 4. Barcode & SKU */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Barcode & Identification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AutoBarcodeGenerator
              sku={formData.sku}
              currentBarcode={formData.barcode}
              needsUpdate={barcodeNeedsUpdate}
              onBarcodeGenerated={(barcode) => {
                handleInputChange('barcode', barcode)
                setBarcodeNeedsUpdate(false)
              }}
            />
          </CardContent>
        </Card>

        {/* 5. SEO & Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              SEO & Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO Title</Label>
              <Input
                id="seoTitle"
                value={formData.seoTitle || ''}
                onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                placeholder="SEO-optimized title"
                maxLength={60}
              />
              <div className="text-xs text-gray-500">
                {(formData.seoTitle || '').length}/60 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO Description</Label>
              <Textarea
                id="seoDescription"
                value={formData.seoDescription || ''}
                onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                placeholder="SEO-optimized description"
                rows={3}
                maxLength={160}
              />
              <div className="text-xs text-gray-500">
                {(formData.seoDescription || '').length}/160 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="ethnic, traditional, silk, handwoven"
              />
              <p className="text-xs text-gray-500">Separate tags with commas</p>
            </div>
          </CardContent>
        </Card>

        {/* 6. AI Generation Panel */}
        <AIGenerationPanel
          productName={formData.name}
          categoryName={categories.find(c => c.id === formData.categoryId)?.name || ''}
          images={formData.images || []} // ✅ FIXED: Ensure array is passed
          onGenerate={handleAIGenerate}
          isGenerating={isGeneratingAI}
          hasSizes={formData.requiresSizes} // ✅ NEW: Pass size info
          sizes={formData.productSizes?.map(s => s.size) || []} // ✅ NEW: Pass available sizes
        />

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="isActive">Product is active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="isFeatured">Featured product</Label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e as any, 'draft')}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save as Draft
            </Button>

            {mode === 'edit' && product?.status !== 'ARCHIVED' && (
              <Button
                type="button"
                variant="outline"
                onClick={(e) => handleSubmit(e as any, 'archive')}
                disabled={loading}
                className="text-amber-600 hover:text-amber-700"
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
            )}

            <Button
              type="button"
              onClick={(e) => handleSubmit(e as any, 'publish')}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {mode === 'edit' ? 'Update & Publish' : 'Publish Product'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}