'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui'
import { generateSKU, calculateCostBreakdown, calculateSellingPrice, slugify } from '@/lib/utils'
import ImageUpload from '@/components/admin/ImageUpload'
import BarcodeDisplay from '@/components/admin/BarcodeDisplay'
import AIGenerateButton, { AISEOButton } from '@/components/admin/AIGenerateButton'
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
  AlertTriangle,
  Sparkles,
  Search,
  Wand2,
  Brain,
  Settings2,
  FileText // Added for Draft System
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

  // SEO fields
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

// Enhanced barcode generation function
const generateBarcodeFromSKU = (sku: string, format: string) => {
  if (!sku) return { isValid: false, error: 'SKU required' }

  const cleanSKU = sku.replace(/[^A-Z0-9]/g, '').toUpperCase()
  const timestamp = Date.now().toString().slice(-6)

  switch (format) {
    case 'UPC':
      const upcBase = (cleanSKU + timestamp).replace(/[^0-9]/g, '').slice(0, 11).padStart(11, '0')
      return { isValid: true, correctedCode: upcBase }

    case 'EAN13':
      const eanBase = (cleanSKU + timestamp).replace(/[^0-9]/g, '').slice(0, 12).padStart(12, '0')
      return { isValid: true, correctedCode: eanBase }

    case 'CODE39':
      const code39Data = cleanSKU.slice(0, 20)
      return { isValid: true, correctedCode: code39Data }

    case 'CODE128':
    default:
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
  
  // Draft System States
  const [submitMode, setSubmitMode] = useState<'draft' | 'publish' | null>(null)
  const [showPublishValidation, setShowPublishValidation] = useState(false)
  
  const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false)
  const [barcodeRecommendation, setBarcodeRecommendation] = useState<any>(null)
  const [successMessage, setSuccessMessage] = useState('')

  // AI Configuration State
  const [selectedTone, setSelectedTone] = useState<'professional' | 'casual' | 'elegant' | 'playful' | 'informative'>('elegant')
  const [customPrompt, setCustomPrompt] = useState('')
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const [showAIConfig, setShowAIConfig] = useState(false)

  // Form state - Removed social media fields from initialization
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
    images: product?.images || [],

    // SEO fields - Keep these
    seoTitle: product?.seoTitle || '',
    seoDescription: product?.seoDescription || ''
  })

  // Tags input state
  const [tagInput, setTagInput] = useState('')

  // Get selected country for exchange rate
  const selectedCountry = countries.find(c => c.id === formData.countryId)
  const exchangeRate = selectedCountry?.exchangeRate || 1

  // Draft System: Validation function for publishing
  const validateForPublishing = () => {
    const errors = []
    
    if (!formData.description || formData.description.trim().length < 10) {
      errors.push('Product description is required (minimum 10 characters)')
    }
    
    if (!formData.images || formData.images.length === 0) {
      errors.push('At least one product image is required')
    }
    
    if (!formData.sellingPriceUSD || formData.sellingPriceUSD <= 0) {
      errors.push('Valid selling price is required')
    }
    
    if (formData.stockQuantity === undefined || formData.stockQuantity < 0) {
      errors.push('Stock quantity must be set')
    }
    
    if (!formData.categoryId) {
      errors.push('Product category must be selected')
    }
    
    return errors
  }

  /**
   * Build dynamic product context from current form data
   */
  const buildProductContext = () => {
    const selectedCategory = categories.find(c => c.id === formData.categoryId)
    const selectedCountry = countries.find(c => c.id === formData.countryId)
    const selectedSupplier = suppliers.find(s => s.id === formData.supplierId)

    return {
      name: formData.name.trim(),
      category: selectedCategory?.name,
      materials: extractMaterialsFromForm(),
      colors: extractColorsFromForm(),
      description: formData.shortDescription || formData.description,
      price: formData.sellingPriceUSD,
      currency: 'USD',
      originalPrice: formData.originalPrice,
      originalCurrency: formData.originalCurrency,
      origin: selectedCountry?.name,
      supplier: selectedSupplier?.name,
      tags: formData.tags,
      stockQuantity: formData.stockQuantity,
      targetAudience: 'customers who appreciate authentic Indian ethnic wear and traditional craftsmanship'
    }
  }

  /**
   * Extract materials from all form inputs (description, tags, name)
   */
  const extractMaterialsFromForm = (): string[] => {
    const materials = new Set<string>()

    const materialKeywords = [
      // Fabrics
      'silk', 'cotton', 'chiffon', 'georgette', 'crepe', 'satin', 'velvet', 'linen',
      'khadi', 'handloom', 'organic cotton', 'bamboo', 'jute', 'wool', 'cashmere',
      'modal', 'rayon', 'net', 'tulle', 'organza', 'taffeta', 'brocade', 'jacquard',
      'denim', 'canvas', 'muslin', 'voile', 'lawn', 'poplin', 'twill', 'corduroy',

      // Metals & Stones
      'silver', 'gold', 'rose gold', 'white gold', 'brass', 'copper', 'bronze',
      'platinum', 'steel', 'stainless steel', 'pearl', 'diamond', 'ruby', 'emerald',
      'sapphire', 'amethyst', 'turquoise', 'coral', 'jade', 'onyx', 'quartz',
      'crystal', 'glass', 'ceramic', 'wood', 'bamboo', 'bone', 'horn',

      // Traditional materials
      'kundan', 'meenakari', 'zardozi', 'gota', 'sequin', 'mirror work', 'embroidery',
      'block print', 'hand painted', 'tie dye', 'bandhani', 'ikat', 'ajrakh'
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

  /**
   * Extract colors from all form inputs
   */
  const extractColorsFromForm = (): string[] => {
    const colors = new Set<string>()

    const colorKeywords = [
      // Basic colors
      'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white',
      'grey', 'gray', 'brown', 'beige', 'cream', 'ivory', 'off-white', 'pearl',

      // Metallic colors
      'gold', 'silver', 'rose gold', 'copper', 'bronze', 'champagne', 'platinum',

      // Specific shades
      'maroon', 'burgundy', 'wine', 'navy', 'royal blue', 'sky blue', 'teal',
      'turquoise', 'mint', 'sage', 'olive', 'forest green', 'lime', 'coral',
      'salmon', 'peach', 'apricot', 'lavender', 'lilac', 'violet', 'indigo',
      'magenta', 'fuchsia', 'crimson', 'scarlet', 'ruby', 'emerald', 'sapphire',
      'mustard', 'ochre', 'rust', 'tan', 'khaki', 'taupe', 'charcoal', 'slate',

      // Traditional Indian colors
      'saffron', 'turmeric', 'henna', 'mehendi', 'vermillion', 'sindoor'
    ]

    const allText = [
      formData.name,
      formData.description,
      formData.shortDescription,
      ...formData.tags
    ].join(' ').toLowerCase()

    colorKeywords.forEach(color => {
      if (allText.includes(color.toLowerCase())) {
        colors.add(color)
      }
    })

    return Array.from(colors)
  }

  /**
   * Check if form has enough data for AI generation
   */
  const isReadyForAI = (): boolean => {
    return !!(formData.name?.trim() && formData.categoryId)
  }

  /**
   * Get AI readiness status message
   */
  const getAIReadinessMessage = (): string => {
    if (!formData.name?.trim()) return 'Product name required'
    if (!formData.categoryId) return 'Category selection required'
    return 'Ready for AI generation'
  }

  /**
   * Handle AI generation with custom prompts
   */
  const handleCustomAIGeneration = async (targetField: string) => {
    if (!isReadyForAI()) return

    const context = buildProductContext()

    try {
      // Determine the type based on target field
      let type = 'product_description'
      if (targetField === 'shortDescription') {
        type = 'short_description'
      } else if (targetField === 'seoTitle' || targetField === 'seoDescription') {
        type = 'seo_content'
      }

      const response = await fetch('/api/admin/ai/generate', {  // ✅ Correct endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type,  // ✅ Correct format
          context: {
            name: context.name,
            category: context.category,
            price: context.price,
            materials: context.materials,
            colors: context.colors,
            tags: context.tags
          },
          options: {
            tone: selectedTone,
            maxLength: getOptimalLength(targetField),
            maxTokens: getMaxTokensForField(targetField)
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        handleInputChange(targetField, data.content)
        setSuccessMessage(`${getFieldLabel(targetField)} generated successfully!`)
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setErrors(prev => ({ ...prev, aiGeneration: data.error }))
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        aiGeneration: `Failed to generate ${getFieldLabel(targetField)}: ${error instanceof Error ? error.message : 'Unknown error'}`
      }))
    }
  }

  /**
   * Build contextual prompt based on available form data
   */
  const buildContextualPrompt = (targetField: string, context: any): string => {
    const hasPrice = context.price > 0
    const hasMaterials = context.materials?.length > 0
    const hasColors = context.colors?.length > 0
    const hasOrigin = !!context.origin
    const hasTags = context.tags?.length > 0

    let prompt = `Create compelling content for "${context.name}"`

    if (context.category) {
      prompt += `, a ${context.category.toLowerCase()}`
    }

    if (hasMaterials) {
      prompt += ` made with ${context.materials.join(', ')}`
    }

    if (hasColors) {
      prompt += ` featuring ${context.colors.join(', ')} colors`
    }

    if (hasPrice) {
      prompt += ` priced at $${context.price}`
    }

    if (hasOrigin) {
      prompt += ` sourced from ${context.origin}`
    }

    if (hasTags && context.tags.length > 0) {
      prompt += `. Key features: ${context.tags.join(', ')}`
    }

    // Add field-specific instructions
    switch (targetField) {
      case 'description':
        prompt += '. Write a detailed, engaging product description that highlights craftsmanship, cultural significance, and styling suggestions.'
        break
      case 'shortDescription':
        prompt += '. Write a concise, compelling summary in 1-2 sentences that captures the essence and appeal.'
        break
      case 'seoTitle':
        prompt += '. Create an SEO-optimized title under 60 characters with relevant keywords.'
        break
      case 'seoDescription':
        prompt += '. Write an SEO meta description under 160 characters that encourages clicks.'
        break
      default:
        prompt += '. Create engaging, authentic content that resonates with customers who appreciate quality and cultural heritage.'
    }

    return prompt
  }

  /**
   * Get optimal content length for field
   */
  const getOptimalLength = (field: string): number => {
    switch (field) {
      case 'shortDescription': return 50
      case 'description': return 200
      case 'seoTitle': return 60
      case 'seoDescription': return 160
      default: return 100
    }
  }

  const getMaxTokensForField = (field: string): number => {
    switch (field) {
      case 'shortDescription': return 80
      case 'description': return 300
      case 'seoTitle': return 100
      case 'seoDescription': return 250
      default: return 150
    }
  }

  /**
   * Get user-friendly field label
   */
  const getFieldLabel = (field: string): string => {
    switch (field) {
      case 'shortDescription': return 'Short Description'
      case 'description': return 'Full Description'
      case 'seoTitle': return 'SEO Title'
      case 'seoDescription': return 'SEO Description'
      default: return field
    }
  }

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

  // Enhanced handleSubmit with Draft System
  const handleSubmit = async (e: React.FormEvent, submitType: 'draft' | 'publish' = 'draft') => {
    e.preventDefault()

    setSubmitMode(submitType)
    
    // For drafts, only validate basic required fields
    if (submitType === 'draft') {
      if (!formData.name.trim() || !formData.sku.trim()) {
        setErrors({ submit: 'Product name and SKU are required for drafts' })
        setSubmitMode(null)
        return
      }
    } else {
      // For publishing, validate everything + publishing requirements
      if (!validateForm()) {
        setSubmitMode(null)
        return
      }
      
      const validationErrors = validateForPublishing()
      if (validationErrors.length > 0) {
        setShowPublishValidation(true)
        setSubmitMode(null)
        return
      }
    }

    setLoading(true)

    try {
      // Prepare form data with status
      const submissionData = {
        ...formData,
        status: submitType === 'publish' ? 'PUBLISHED' : 'DRAFT'
      }

      const url = mode === 'create'
        ? '/api/admin/products'
        : `/api/admin/products/${product?.id}`

      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })

      const data = await response.json()

      if (response.ok) {
        const successMessage = submitType === 'publish' ? 
          'Product published successfully!' : 
          'Product saved as draft!'
        
        setSuccessMessage(successMessage)
        
        // Redirect after short delay
        setTimeout(() => {
          router.push('/admin/products')
          router.refresh()
        }, 1500)
      } else {
        if (data.validationErrors) {
          setErrors({ submit: `Validation failed: ${data.validationErrors.join(', ')}` })
        } else {
          setErrors({ submit: data.error || 'Failed to save product' })
        }
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
      setSubmitMode(null)
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
    <form className="space-y-6">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {errors.submit}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      {/* AI Configuration Panel */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Content Generation Settings
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAIConfig(!showAIConfig)}
            >
              <Settings2 className="h-4 w-4 mr-1" />
              {showAIConfig ? 'Hide' : 'Configure'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Readiness Status */}
          <div className={`p-3 rounded-lg border ${isReadyForAI()
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
            }`}>
            <div className="flex items-center gap-2">
              {isReadyForAI() ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
              <span className={`text-sm font-medium ${isReadyForAI()
                ? 'text-green-800'
                : 'text-yellow-800'
                }`}>
                {getAIReadinessMessage()}
              </span>
            </div>
          </div>

          {showAIConfig && (
            <>
              {/* Tone Selection */}
              <div className="space-y-2">
                <Label>Content Tone</Label>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="elegant">Elegant & Sophisticated</option>
                  <option value="professional">Professional & Informative</option>
                  <option value="casual">Casual & Friendly</option>
                  <option value="playful">Playful & Engaging</option>
                  <option value="informative">Educational & Detailed</option>
                </select>
              </div>

              {/* Custom Prompt Option */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useCustomPrompt"
                    checked={useCustomPrompt}
                    onChange={(e) => setUseCustomPrompt(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="useCustomPrompt">Use custom prompt</Label>
                </div>

                {useCustomPrompt && (
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Enter your custom prompt for AI generation..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              {/* Data Preview */}
              {isReadyForAI() && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">AI will use this data:</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div><strong>Product:</strong> {formData.name}</div>
                    <div><strong>Category:</strong> {categories.find(c => c.id === formData.categoryId)?.name}</div>
                    {extractMaterialsFromForm().length > 0 && (
                      <div><strong>Materials:</strong> {extractMaterialsFromForm().join(', ')}</div>
                    )}
                    {extractColorsFromForm().length > 0 && (
                      <div><strong>Colors:</strong> {extractColorsFromForm().join(', ')}</div>
                    )}
                    {formData.sellingPriceUSD > 0 && (
                      <div><strong>Price:</strong> ${formData.sellingPriceUSD}</div>
                    )}
                    {formData.tags.length > 0 && (
                      <div><strong>Tags:</strong> {formData.tags.join(', ')}</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Product Images & Videos */}
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
          <p className="text-sm text-gray-500 mt-2">
            {formData.images.length} of 8 images uploaded {formData.images.length === 0 && '(at least 1 required for publishing)'}
          </p>
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

          {/* AI-Enhanced Short Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleCustomAIGeneration('shortDescription')}
                disabled={!isReadyForAI()}
              >
                <Wand2 className="h-4 w-4 mr-1" />
                Generate Short
              </Button>
            </div>
            <Input
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) => handleInputChange('shortDescription', e.target.value)}
              placeholder="Brief description for listings (or use AI to generate)"
            />
          </div>

          {/* AI-Enhanced Full Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Full Description</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleCustomAIGeneration('description')}
                  disabled={!isReadyForAI()}
                >
                  <Wand2 className="h-4 w-4 mr-1" />
                  Smart Generate
                </Button>
                <AIGenerateButton
                  contentType="product_description"
                  productContext={buildProductContext()}
                  options={{
                    tone: selectedTone,
                    length: 'long'
                  }}
                  onSuccess={(content) => {
                    handleInputChange('description', content)
                    setSuccessMessage('Product description generated successfully!')
                  }}
                  onError={(error) => {
                    setErrors(prev => ({ ...prev, aiGeneration: error }))
                  }}
                  disabled={!isReadyForAI()}
                  size="sm"
                  variant="ghost"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Alternative
                </AIGenerateButton>
              </div>
            </div>
            <textarea
              id="description"
              rows={6}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Detailed product description (or use Smart Generate based on your inputs)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500">
              {formData.description.length} characters {formData.description.length < 10 && '(minimum 10 for publishing)'}
            </p>
            {errors.aiGeneration && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                {errors.aiGeneration}
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category *</Label>
              <select
                id="categoryId"
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.categoryId ? 'border-red-500' : 'border-gray-300'
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.countryId ? 'border-red-500' : 'border-gray-300'
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

      {/* Supplier & Purchase Information */}
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
                  className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.supplierId ? 'border-red-500' : 'border-gray-300'
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

      {/* Cost & Pricing Calculation */}
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

      {/* Inventory Management */}
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
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${formData.barcodeType === option.value
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
              price={formData.sellingPriceUSD ? `${formData.sellingPriceUSD.toFixed(2)}` : undefined}
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

      {/* SEO & Marketing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            SEO & Marketing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* SEO Meta Fields */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="seoTitle">SEO Title</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleCustomAIGeneration('seoTitle')}
                disabled={!isReadyForAI()}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Generate
              </Button>
            </div>
            <Input
              id="seoTitle"
              value={formData.seoTitle || ''}
              onChange={(e) => handleInputChange('seoTitle', e.target.value)}
              placeholder="SEO-optimized page title (60 characters max)"
              maxLength={60}
            />
            <p className="text-xs text-gray-500">
              {(formData.seoTitle || '').length}/60 characters
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="seoDescription">Meta Description</Label>
              <AISEOButton
                productContext={buildProductContext()}
                onSuccess={(content) => {
                  handleInputChange('seoDescription', content)
                  setSuccessMessage('SEO description generated successfully!')
                }}
                onError={(error) => {
                  setErrors(prev => ({ ...prev, seoGeneration: error }))
                }}
                disabled={!isReadyForAI()}
              />
            </div>
            <textarea
              id="seoDescription"
              rows={3}
              value={formData.seoDescription || ''}
              onChange={(e) => handleInputChange('seoDescription', e.target.value)}
              placeholder="SEO meta description (160 characters max)"
              maxLength={160}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">
              {(formData.seoDescription || '').length}/160 characters
            </p>
          </div>

          {/* AI Content Generation Status */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">AI Content Generation</p>
                <p className="text-blue-700 mt-1">
                  Fill in the product name and category first, then use AI to generate compelling descriptions and SEO content.
                  For social media content, use the dedicated Social Media section in the admin menu.
                </p>
              </div>
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
            <p className="text-xs text-gray-500">
              Tags help with AI content generation and improve search visibility
            </p>
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

          {/* AI Content Summary */}
          {(formData.description || formData.seoTitle || formData.seoDescription) && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">AI Generated Content Summary</span>
              </div>
              <div className="space-y-2 text-xs text-purple-700">
                {formData.description && (
                  <div>✓ Product description ({formData.description.length} characters)</div>
                )}
                {formData.seoTitle && (
                  <div>✓ SEO title ({formData.seoTitle.length}/60 characters)</div>
                )}
                {formData.seoDescription && (
                  <div>✓ SEO description ({formData.seoDescription.length}/160 characters)</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Submit Buttons with Draft System */}
      <div className="flex gap-4 justify-end sticky bottom-4 bg-white p-4 border-t border-gray-200 rounded-lg shadow-lg">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>

        {mode === 'edit' && product?.id && (
          <Link href={`/products/${product.id}`} target="_blank">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          </Link>
        )}

        {/* Save as Draft Button */}
        <Button
          type="button"
          variant="outline"
          onClick={(e) => handleSubmit(e, 'draft')}
          disabled={loading}
          className="flex items-center gap-2 min-w-[140px] border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          {loading && submitMode === 'draft' ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Save as Draft
            </>
          )}
        </Button>

        {/* Publish Product Button */}
        <Button
          type="button"
          onClick={(e) => handleSubmit(e, 'publish')}
          disabled={loading}
          className="flex items-center gap-2 min-w-[140px] bg-green-600 hover:bg-green-700 text-white"
        >
          {loading && submitMode === 'publish' ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Publish Product
            </>
          )}
        </Button>
      </div>

      {/* Publishing Validation Modal */}
      {showPublishValidation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <h3 className="text-lg font-semibold">Publishing Requirements</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                This product cannot be published yet. Please complete the following requirements:
              </p>
              
              <ul className="space-y-2">
                {validateForPublishing().map((error, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {error}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPublishValidation(false)}
                className="flex-1"
              >
                Continue Editing
              </Button>
              <Button
                onClick={(e) => {
                  setShowPublishValidation(false)
                  handleSubmit(e, 'draft')
                }}
                disabled={loading}
                className="flex-1"
              >
                Save as Draft
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Draft System Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              Draft System Guide
            </h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Save as Draft:</strong> Save your work in progress - not visible to customers</p>
              <p><strong>Publish Product:</strong> Make product live after validation - visible to customers</p>
              <p><strong>Requirements:</strong> Description, images, price, and category are required for publishing</p>
              <p><strong>AI Features:</strong> Use AI buttons to generate descriptions and SEO content automatically</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Readiness Status */}
      {!isReadyForAI() && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Wand2 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-orange-900 mb-1">
                AI Content Generation
              </h3>
              <p className="text-sm text-orange-700">
                Complete product name and category to unlock AI-powered content generation features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Generation Progress Indicator */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-lg font-medium">
                {submitMode === 'publish' ? 'Publishing Product' : 'Saving Product'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Please wait while we save your product information and any AI-generated content...
            </div>
          </div>
        </div>
      )}
    </form>
  )
}