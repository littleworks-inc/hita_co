'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui'
import { generateSKU, calculateCostBreakdown, calculateSellingPrice, slugify } from '@/lib/utils'
import ImageUpload from '@/components/admin/ImageUpload'
import BarcodeDisplay from '@/components/admin/BarcodeDisplay'
import Link from 'next/link'
import {
  Package,
  DollarSign,
  Calculator,
  Save,
  Eye,
  Upload,
  X,
  Plus,
  Image as ImageIcon,
  RefreshCw,
  Info,
  Zap,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

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
}

interface Product {
  id?: string
  sku: string
  name: string
  description: string
  shortDescription: string
  categoryId: string
  countryId: string
  
  // Barcode Information
  barcode: string
  barcodeType: string
  
  // Supplier Information
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
  stockQuantity: number
  lowStockAlert: number
  isActive: boolean
  isFeatured: boolean
  tags: string[]
  images: string[]
}

interface ProductFormProps {
  categories: Category[]
  countries: Country[]
  suppliers: Supplier[]
  product?: Product
  mode: 'create' | 'edit'
}

// Enhanced barcode generation function
const generateBarcodeFromSKU = (sku: string, format: string) => {
  if (!sku) return { isValid: false, error: 'SKU required' }
  
  const cleanSKU = sku.replace(/[^A-Z0-9]/g, '').toUpperCase()
  const timestamp = Date.now().toString().slice(-6)
  
  switch (format) {
    case 'UPC':
      // Generate 11 digits for UPC, system will add check digit
      const upcBase = (cleanSKU + timestamp).replace(/[^0-9]/g, '').slice(0, 11).padStart(11, '0')
      return { isValid: true, correctedCode: upcBase }
      
    case 'EAN13':
      // Generate 12 digits for EAN-13, system will add check digit
      const eanBase = (cleanSKU + timestamp).replace(/[^0-9]/g, '').slice(0, 12).padStart(12, '0')
      return { isValid: true, correctedCode: eanBase }
      
    case 'CODE39':
      // Use SKU directly (CODE39 supports alphanumeric)
      const code39Data = cleanSKU.slice(0, 20)
      return { isValid: true, correctedCode: code39Data }
      
    case 'CODE128':
    default:
      // Use SKU + timestamp for uniqueness
      const code128Data = `${cleanSKU}${timestamp}`.slice(0, 40)
      return { isValid: true, correctedCode: code128Data }
  }
}

// Barcode format recommendations
const getBarcodeFormatRecommendation = (format: string) => {
  const recommendations = {
    'CODE128': {
      reason: 'Best for inventory tracking, supports all characters',
      description: 'Most versatile format, perfect for internal use',
      icon: '🏷️',
      useCase: 'Internal inventory tracking'
    },
    'UPC': {
      reason: 'Standard for US retail stores',
      description: 'Required for major US retailers like Walmart, Amazon',
      icon: '🏪',
      useCase: 'US retail, Amazon, Walmart'
    },
    'EAN13': {
      reason: 'International standard, accepted worldwide',
      description: 'Global retail format with country codes',
      icon: '🌍',
      useCase: 'International sales, European markets'
    },
    'CODE39': {
      reason: 'Simple format, easy to implement',
      description: 'Basic format good for simple tracking',
      icon: '📄',
      useCase: 'Simple tracking, legacy systems'
    }
  }
  
  return recommendations[format as keyof typeof recommendations] || recommendations.CODE128
}

export default function ProductForm({ categories, countries, suppliers, product, mode }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false)
  const [barcodeRecommendation, setBarcodeRecommendation] = useState<any>(null)
  
  // Form state
  const [formData, setFormData] = useState<Product>({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    shortDescription: product?.shortDescription || '',
    categoryId: product?.categoryId || '',
    countryId: product?.countryId || countries.find(c => c.isDefault)?.id || '',
    
    // Barcode Information
    barcode: product?.barcode || '',
    barcodeType: product?.barcodeType || 'CODE128',
    
    // Supplier Information
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
    images: product?.images || []
  })

  // Tags input state
  const [tagInput, setTagInput] = useState('')

  // Get selected country for exchange rate
  const selectedCountry = countries.find(c => c.id === formData.countryId)
  const exchangeRate = selectedCountry?.exchangeRate || 1

  // Auto-calculate costs when relevant fields change
  useEffect(() => {
    if (formData.originalPrice && formData.quantity && exchangeRate) {
      const costCalc = calculateCostBreakdown(
        formData.originalPrice,
        formData.quantity,
        formData.gstPercentage,
        formData.shippingCost,
        formData.conversionCharges,
        formData.additionalExpenses,
        exchangeRate
      )

      const sellingPrice = calculateSellingPrice(
        costCalc.costPriceUSD,
        formData.profitMargin,
        formData.discountPercentage
      )

      setFormData(prev => ({
        ...prev,
        costPriceUSD: costCalc.costPriceUSD,
        piecePriceUSD: costCalc.piecePriceUSD,
        sellingPriceUSD: sellingPrice,
        originalCurrency: selectedCountry?.currency || 'INR'
      }))
    }
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

  // Auto-generate SKU when name changes (only for new products)
  useEffect(() => {
    if (mode === 'create' && formData.name && !formData.sku) {
      setFormData(prev => ({
        ...prev,
        sku: generateSKU(formData.name)
      }))
    }
  }, [formData.name, mode])

  // Auto-generate barcode when SKU changes (only for new products)
  useEffect(() => {
    if (mode === 'create' && formData.sku && !formData.barcode) {
      const result = generateBarcodeFromSKU(formData.sku, formData.barcodeType)
      if (result.isValid && result.correctedCode) {
        setFormData(prev => ({
          ...prev,
          barcode: result.correctedCode
        }))
      }
    }
  }, [formData.sku, formData.barcodeType, mode])

  // Update recommendation when barcode type changes
  useEffect(() => {
    const recommendation = getBarcodeFormatRecommendation(formData.barcodeType)
    setBarcodeRecommendation(recommendation)
  }, [formData.barcodeType])

  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleBarcodeFormatChange = (newFormat: string) => {
    handleInputChange('barcodeType', newFormat)
    
    // Regenerate barcode with new format if SKU exists
    if (formData.sku) {
      const result = generateBarcodeFromSKU(formData.sku, newFormat)
      if (result.isValid && result.correctedCode) {
        handleInputChange('barcode', result.correctedCode)
      }
    }
  }

  const generateNewBarcode = async () => {
    if (!formData.sku) return
    
    setIsGeneratingBarcode(true)
    
    try {
      const result = generateBarcodeFromSKU(formData.sku, formData.barcodeType)
      if (result.isValid && result.correctedCode) {
        handleInputChange('barcode', result.correctedCode)
      }
    } catch (error) {
      console.error('Barcode generation error:', error)
    } finally {
      setIsGeneratingBarcode(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Product name is required'
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required'
    if (!formData.categoryId) newErrors.categoryId = 'Category is required'
    if (!formData.countryId) newErrors.countryId = 'Country is required'
    if (!formData.supplierId) newErrors.supplierId = 'Supplier is required'
    if (formData.originalPrice <= 0) newErrors.originalPrice = 'Original price must be greater than 0'
    if (formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)

    try {
      const url = mode === 'create' 
        ? '/api/admin/products'
        : `/api/admin/products/${product?.id}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/admin/products')
        router.refresh()
      } else {
        const errorData = await response.json()
        setErrors({ submit: errorData.error || 'Something went wrong' })
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const formatOptions = [
    {
      value: 'CODE128',
      label: 'CODE128 (Recommended)',
      description: 'Best for inventory, supports all characters',
      icon: '🏷️',
      useCase: 'Internal inventory tracking'
    },
    {
      value: 'UPC',
      label: 'UPC (US Retail)',
      description: 'Standard for US retail stores',
      icon: '🏪',
      useCase: 'US retail, Amazon, Walmart'
    },
    {
      value: 'EAN13',
      label: 'EAN-13 (International)',
      description: 'Global standard, includes country codes',
      icon: '🌍',
      useCase: 'International sales, European markets'
    },
    {
      value: 'CODE39',
      label: 'CODE39 (Simple)',
      description: 'Basic format, easy to implement',
      icon: '📄',
      useCase: 'Simple tracking, legacy systems'
    }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {errors.submit}
        </div>
      )}

      {/* Product Images & Videos - Enhanced */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Product Images & Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            images={formData.images}
            onImagesChange={(images) => handleInputChange('images', images)}
            maxImages={8}
            maxVideos={2}
            disabled={loading}
          />
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Traditional Jhumka Earrings"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="HC-EARR-001"
                className={errors.sku ? 'border-red-500' : ''}
              />
              {errors.sku && <p className="text-sm text-red-600">{errors.sku}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) => handleInputChange('shortDescription', e.target.value)}
              placeholder="Brief description for listings"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Full Description</Label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Detailed product description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category *</Label>
              <select
                id="categoryId"
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.categoryId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="text-sm text-red-600">{errors.categoryId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="countryId">Source Country *</Label>
              <select
                id="countryId"
                value={formData.countryId}
                onChange={(e) => handleInputChange('countryId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.countryId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Country</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name} ({country.currency})
                  </option>
                ))}
              </select>
              {errors.countryId && <p className="text-sm text-red-600">{errors.countryId}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Barcode Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-1 bg-blue-100 rounded">
              📊
            </div>
            Barcode Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Barcode Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Barcode Format</Label>
            <div className="grid gap-3 md:grid-cols-2">
              {formatOptions.map((option) => (
                <div
                  key={option.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.barcodeType === option.value
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleBarcodeFormatChange(option.value)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{option.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                      <div className="text-xs text-blue-600 mt-1">{option.useCase}</div>
                    </div>
                    {formData.barcodeType === option.value && (
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Format Recommendation */}
          {barcodeRecommendation && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <div className="font-medium text-sm text-blue-900">
                    {formData.barcodeType} Format Selected
                  </div>
                  <div className="text-sm text-blue-700 mt-1">
                    {barcodeRecommendation.reason}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {barcodeRecommendation.description}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Barcode Input and Generation */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="barcode">Barcode Code</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateNewBarcode}
                  disabled={!formData.sku || isGeneratingBarcode}
                  className="h-6 px-2 text-xs"
                >
                  {isGeneratingBarcode ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Zap className="h-3 w-3" />
                  )}
                  {isGeneratingBarcode ? 'Generating...' : 'Regenerate'}
                </Button>
              </div>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => handleInputChange('barcode', e.target.value)}
                placeholder={`Auto-generated ${formData.barcodeType} code`}
                className={errors.barcode ? 'border-red-500' : ''}
              />
              {errors.barcode && (
                <p className="text-sm text-red-600">{errors.barcode}</p>
              )}
              <p className="text-xs text-gray-500">
                Auto-generated from SKU or enter custom code
              </p>
            </div>

            {/* Scanner Compatibility Status */}
            <div className="space-y-2">
              <Label>Scanner Compatibility</Label>
              <div className="p-2 rounded-md text-xs bg-green-50 border border-green-200">
                <div className="flex items-center gap-1 font-medium text-green-700">
                  <CheckCircle className="h-3 w-3" />
                  Scanner Ready
                </div>
                <div className="mt-1 space-y-1">
                  <div className="text-green-600">💡 {formData.barcodeType} format is optimal for scanning</div>
                  <div className="text-green-600">📱 Compatible with mobile scanner apps</div>
                </div>
              </div>
            </div>
          </div>

          {/* Barcode Preview */}
          <div className="space-y-2">
            <Label>Barcode Preview & Actions</Label>
            <BarcodeDisplay
              barcode={formData.barcode}
              barcodeType={formData.barcodeType}
              productName={formData.name || 'Product Name'}
              price={formData.sellingPriceUSD ? `$${formData.sellingPriceUSD.toFixed(2)}` : undefined}
              size="medium"
            />
          </div>

          {/* Quick Tips */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-900 mb-2">💡 Barcode Best Practices</div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• <strong>CODE128:</strong> Best for internal inventory, supports all characters</div>
              <div>• <strong>UPC:</strong> Required for US retail stores (Walmart, Target, Amazon)</div>
              <div>• <strong>EAN-13:</strong> International standard, required for global sales</div>
              <div>• <strong>Print Quality:</strong> Use high contrast (black on white) for best scanning</div>
              <div>• <strong>Size:</strong> Minimum 1.5x width multiplier for reliable scanning</div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Supplier Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Supplier & Purchase Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="supplierId">Supplier *</Label>
              <div className="flex gap-2">
                <select
                  id="supplierId"
                  value={formData.supplierId}
                  onChange={(e) => handleInputChange('supplierId', e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.supplierId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                      {supplier.contactPerson && ` (${supplier.contactPerson})`}
                    </option>
                  ))}
                </select>
                <Link href="/admin/suppliers/new" target="_blank">
                  <Button type="button" variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              {errors.supplierId && <p className="text-sm text-red-600">{errors.supplierId}</p>}
              {formData.supplierId && (
                <div className="text-xs text-gray-500">
                  {(() => {
                    const selectedSupplier = suppliers.find(s => s.id === formData.supplierId)
                    return selectedSupplier ? (
                      <div className="bg-blue-50 p-2 rounded text-blue-700">
                        <div>📞 {selectedSupplier.phone || 'No phone'}</div>
                        {selectedSupplier.email && <div>📧 {selectedSupplier.email}</div>}
                      </div>
                    ) : null
                  })()}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice/Receipt Number</Label>
            <Input
              id="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
              placeholder="Bill number or reference"
            />
          </div>

          <div className="bg-green-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-green-900 mb-1">Professional Supplier Management</h4>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• Select from your supplier database for consistency</li>
              <li>• Add new suppliers anytime and link them to products</li>
              <li>• Track purchase history and supplier relationships</li>
              <li>• View supplier contact info when reordering</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Cost & Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Cost & Pricing Calculation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="originalPrice">
                Original Price ({selectedCountry?.currencySymbol || '₹'}) *
              </Label>
              <Input
                id="originalPrice"
                type="number"
                step="0.01"
                value={formData.originalPrice}
                onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || 0)}
                placeholder="1500"
                className={errors.originalPrice ? 'border-red-500' : ''}
              />
              {errors.originalPrice && <p className="text-sm text-red-600">{errors.originalPrice}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                placeholder="10"
                className={errors.quantity ? 'border-red-500' : ''}
              />
              {errors.quantity && <p className="text-sm text-red-600">{errors.quantity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstPercentage">GST %</Label>
              <Input
                id="gstPercentage"
                type="number"
                step="0.01"
                value={formData.gstPercentage}
                onChange={(e) => handleInputChange('gstPercentage', parseFloat(e.target.value) || 0)}
                placeholder="18"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="shippingCost">
                Shipping Cost ({selectedCountry?.currencySymbol || '₹'})
              </Label>
              <Input
                id="shippingCost"
                type="number"
                step="0.01"
                value={formData.shippingCost}
                onChange={(e) => handleInputChange('shippingCost', parseFloat(e.target.value) || 0)}
                placeholder="200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversionCharges">
                Conversion Charges ({selectedCountry?.currencySymbol || '₹'})
              </Label>
              <Input
                id="conversionCharges"
                type="number"
                step="0.01"
                value={formData.conversionCharges}
                onChange={(e) => handleInputChange('conversionCharges', parseFloat(e.target.value) || 0)}
                placeholder="50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalExpenses">
                Additional Expenses ({selectedCountry?.currencySymbol || '₹'})
              </Label>
              <Input
                id="additionalExpenses"
                type="number"
                step="0.01"
                value={formData.additionalExpenses}
                onChange={(e) => handleInputChange('additionalExpenses', parseFloat(e.target.value) || 0)}
                placeholder="100"
              />
            </div>
          </div>

          {/* Calculated Costs (Read-only) */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-900 mb-3">Calculated Costs</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Total Cost (USD)</Label>
                <div className="text-lg font-semibold text-green-600">
                  ${formData.costPriceUSD.toFixed(2)}
                </div>
              </div>
              <div>
                <Label>Per Piece Cost (USD)</Label>
                <div className="text-lg font-semibold text-blue-600">
                  ${formData.piecePriceUSD.toFixed(2)}
                </div>
              </div>
              <div>
                <Label>Exchange Rate</Label>
                <div className="text-sm text-gray-600">
                  1 USD = {exchangeRate} {selectedCountry?.currency || 'INR'}
                </div>
              </div>
            </div>
          </div>

          {/* Profit & Selling Price */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profitMargin">Profit Margin (%)</Label>
              <Input
                id="profitMargin"
                type="number"
                step="0.01"
                value={formData.profitMargin}
                onChange={(e) => handleInputChange('profitMargin', parseFloat(e.target.value) || 0)}
                placeholder="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountPercentage">Discount (%)</Label>
              <Input
                id="discountPercentage"
                type="number"
                step="0.01"
                value={formData.discountPercentage}
                onChange={(e) => handleInputChange('discountPercentage', parseFloat(e.target.value) || 0)}
                placeholder="10"
              />
            </div>
          </div>

          {/* Final Selling Price */}
          <div className="bg-blue-50 p-4 rounded-md">
            <Label>Final Selling Price (USD)</Label>
            <div className="text-2xl font-bold text-blue-600">
              ${formData.sellingPriceUSD.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Profit: ${(formData.sellingPriceUSD - formData.costPriceUSD).toFixed(2)} 
              ({((formData.sellingPriceUSD - formData.costPriceUSD) / formData.costPriceUSD * 100).toFixed(1)}%)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Inventory */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Current Stock</Label>
              <Input
                id="stockQuantity"
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => handleInputChange('stockQuantity', parseInt(e.target.value) || 0)}
                placeholder="25"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
              <Input
                id="lowStockAlert"
                type="number"
                value={formData.lowStockAlert}
                onChange={(e) => handleInputChange('lowStockAlert', parseInt(e.target.value) || 0)}
                placeholder="5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags & Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Tags & Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tags */}
          <div className="space-y-2">
            <Label>Product Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Status Toggles */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive">Active Product</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isFeatured">Featured Product</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Update Product'}
        </Button>
      </div>
    </form>
  )
}