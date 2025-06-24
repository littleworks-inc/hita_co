'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { generateSKU, calculateCostBreakdown, calculateSellingPrice } from '@/lib/utils'
import ImageUpload from '@/components/admin/ImageUpload'
import { AIGenerationPanel } from '@/components/admin/AIGenerationPanel'
import ProductBasicInfo from '@/components/admin/ProductBasicInfo'
import ProductDescriptions from '@/components/admin/ProductDescriptions'
import ProductPricing from '@/components/admin/ProductPricing'
import ProductInventory from '@/components/admin/ProductInventory'
import ProductBarcode from '@/components/admin/ProductBarcode'
import ProductTags from '@/components/admin/ProductTags'
import ProductSEO from '@/components/admin/ProductSEO'
import Link from 'next/link'
import {
  Save,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Image as ImageIcon
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
  stockQuantity: number
  lowStockAlert: number
  isActive: boolean
  isFeatured: boolean
  tags: string[]
  images: string[]
  seoTitle?: string
  seoDescription?: string
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
    seoDescription: product?.seoDescription || ''
  })

  // Get selected country for exchange rate
  const selectedCountry = countries.find(c => c.id === formData.countryId)
  const exchangeRate = selectedCountry?.exchangeRate || 1

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

  // Extract materials from form data for AI context
  const extractMaterialsFromForm = (): string[] => {
    const materials = new Set<string>()
    const materialKeywords = [
      'silk', 'cotton', 'chiffon', 'georgette', 'crepe', 'satin', 'velvet', 'linen',
      'khadi', 'handloom', 'organic cotton', 'bamboo', 'jute', 'wool', 'cashmere',
      'modal', 'rayon', 'net', 'tulle', 'organza', 'taffeta', 'brocade', 'jacquard',
      'gold', 'silver', 'brass', 'copper', 'pearl', 'diamond', 'ruby', 'emerald',
      'kundan', 'meenakari', 'zardozi', 'gota', 'sequin', 'mirror work', 'embroidery'
    ]

    const allText = [
      formData.name,
      formData.description,
      formData.shortDescription,
      ...formData.tags
    ].join(' ').toLowerCase()

    materialKeywords.forEach(material => {
      if (allText.includes(material.toLowerCase())) {
        materials.add(material)
      }
    })

    return Array.from(materials)
  }

  // Extract colors from form data for AI context
  const extractColorsFromForm = (): string[] => {
    const colors = new Set<string>()
    const colorKeywords = [
      'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white',
      'gray', 'brown', 'beige', 'cream', 'ivory', 'gold', 'silver', 'maroon', 'navy',
      'turquoise', 'coral', 'magenta', 'cyan', 'lime', 'olive', 'teal', 'aqua',
      'crimson', 'scarlet', 'burgundy', 'indigo', 'violet', 'lavender', 'rose'
    ]

    const allText = [
      formData.name,
      formData.description,
      formData.shortDescription,
      ...formData.tags
    ].join(' ').toLowerCase()

    colorKeywords.forEach(color => {
      if (allText.includes(color)) {
        colors.add(color)
      }
    })

    return Array.from(colors)
  }

  // AI Generation Handler
  const handleAIGeneration = async (type: 'short_description' | 'product_description' | 'seo_content', userInput: AIInputData) => {
    if (!formData.name?.trim() || !formData.categoryId) return

    setIsGeneratingAI(true)
    
    try {
      const context = {
        name: formData.name.trim(),
        category: categories.find(c => c.id === formData.categoryId)?.name,
        price: formData.sellingPriceUSD,
        materials: extractMaterialsFromForm(),
        colors: extractColorsFromForm(),
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
            maxTokens: type === 'short_description' ? 80 : 200
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      {/* Error Messages */}
      {(errors.submit || errors.aiGeneration) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {errors.submit || errors.aiGeneration}
        </div>
      )}

      {/* Basic Product Information */}
      <ProductBasicInfo
        formData={formData}
        categories={categories}
        countries={countries}
        suppliers={suppliers}
        errors={errors}
        onInputChange={handleInputChange}
      />

      {/* Product Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Product Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            label="Product Images"
            value={formData.images}
            onChange={(images) => handleInputChange('images', images)}
            multiple={true}
            description="Upload high-quality product images. First image will be used as the main product image."
          />
        </CardContent>
      </Card>

      {/* AI Generation Panel */}
      <AIGenerationPanel
        productName={formData.name}
        categoryName={categories.find(c => c.id === formData.categoryId)?.name || ''}
        images={formData.images}
        onGenerate={handleAIGeneration}
        isGenerating={isGeneratingAI}
      />

      {/* Product Descriptions */}
      <ProductDescriptions
        formData={formData}
        onInputChange={handleInputChange}
      />

      {/* Barcode Information */}
      <ProductBarcode
        formData={formData}
        onInputChange={handleInputChange}
        mode={mode}
      />

      {/* Pricing & Costs */}
      <ProductPricing
        formData={formData}
        selectedCountry={selectedCountry}
        exchangeRate={exchangeRate}
        errors={errors}
        onInputChange={handleInputChange}
      />

      {/* Inventory Management */}
      <ProductInventory
        formData={formData}
        onInputChange={handleInputChange}
      />

      {/* Tags & Settings */}
      <ProductTags
        formData={formData}
        onInputChange={handleInputChange}
      />

      {/* SEO Settings */}
      <ProductSEO
        formData={formData}
        onInputChange={handleInputChange}
      />

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Link href="/admin/products">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        
        <div className="flex gap-2">
          {mode === 'edit' && (
            <Link href={`/admin/products/${product?.id}`}>
              <Button type="button" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </Link>
          )}
          
          <Button type="submit" disabled={loading}>
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
  )
}