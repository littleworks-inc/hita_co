'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui'
import ColorPicker from '@/components/admin/ColorPicker'
import ImageUpload from '@/components/admin/ImageUpload'
import { DEFAULT_PRIMARY_COLOR, DEFAULT_ACCENT_COLOR } from '@/lib/brand'
import {
  RotateCcw,
  Store,
  Palette,
  Contact,
  Share2,
  Brain,
  Globe,
  Save,
  Type,
  Hash,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  MessageCircle,
  Twitter,
  Zap,
  Sparkles,
  X,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  Heart,
  User,
  Search,
  Settings,
  Key,
  Shield,
  Info,
  Lightbulb,
  Clock
} from 'lucide-react'

interface StoreSettings {
  id: string
  storeName: string
  tagline: string | null
  logo: string | null
  favicon: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  email: string | null
  phone: string | null
  address: any
  instagram: string | null
  facebook: string | null
  pinterest: string | null
  twitter: string | null
  aiProvider: string | null
  aiApiKey: string | null
  aiModel: string | null
  currency: string
  timezone: string
  
  // ✅ ADDED: Missing return policy fields
  returnsEnabled: boolean | null
  returnPeriodDays: number | null
  returnPolicyUrl: string | null          // ✅ MISSING FIELD - This was causing the error
  hasRestockingFee: boolean | null
  restockingFeePercentage: number | null
  returnPolicyDescription: string | null
  noReturnsReason: string | null
  
  // ✅ ADDED: Missing catalog mode fields
  disableShoppingCart: boolean | null
  catalogModeSettings: string | null

  // Site content fields
  announcementBar: string | null
  metaTitle: string | null
  metaDescription: string | null
  businessHours: string | null
  footerDescription: string | null

  // Database fields
  createdAt?: Date
  updatedAt?: Date
  defaultShippingZoneId?: string | null
}

interface StoreSettingsFormProps {
  storeSettings: StoreSettings
}

// Constants
const DEFAULT_VALUES = {
  PRIMARY_COLOR: DEFAULT_PRIMARY_COLOR,
  SECONDARY_COLOR: '#ffffff',
  ACCENT_COLOR: DEFAULT_ACCENT_COLOR,
  CURRENCY: 'USD',
  TIMEZONE: 'America/New_York'
} as const

const TABS = [
  { id: 'branding', name: 'Branding', icon: Store },
  { id: 'colors', name: 'Colors & Theme', icon: Palette },
  { id: 'contact', name: 'Contact Info', icon: Contact },
  { id: 'social', name: 'Social Media', icon: Share2 },
  { id: 'ai', name: 'AI Settings', icon: Brain },
  { id: 'business', name: 'Business Mode', icon: Settings }, // ✅ ADD THIS LINE
  { id: 'policies', name: 'Policies', icon: Shield },
  { id: 'general', name: 'General', icon: Globe }
]

const AI_PROVIDERS = [
  { value: '', label: 'None Selected' },
  { value: 'openai', label: 'OpenAI (ChatGPT)' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'claude', label: 'Anthropic Claude' },
  { value: 'mistral', label: 'Mistral AI' },
  { value: 'openrouter', label: 'OpenRouter (Multi-Model)' }
]

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'INR', label: 'Indian Rupee (INR)' },
  { value: 'CAD', label: 'Canadian Dollar (CAD)' }
]

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' }
]

const AI_PROVIDER_INFO: Record<string, { name: string; url: string; description: string }> = {
  openai: {
    name: 'OpenAI (ChatGPT)',
    url: 'https://platform.openai.com/api-keys',
    description: 'Uses GPT-4o-mini model for content generation.'
  },
  gemini: {
    name: 'Google Gemini',
    url: 'https://makersuite.google.com/app/apikey',
    description: 'Uses Gemini 1.5 Flash model for fast content generation.'
  },
  claude: {
    name: 'Anthropic Claude',
    url: 'https://console.anthropic.com/',
    description: 'Uses Claude 3.5 Sonnet for high-quality content generation.'
  },
  mistral: {
    name: 'Mistral AI',
    url: 'https://console.mistral.ai/',
    description: 'Uses Mistral Small model for efficient content generation.'
  },
  openrouter: {
    name: 'OpenRouter (Multi-Model)',
    url: 'https://openrouter.ai/keys',
    description: 'Access to multiple AI models including free options.'
  }
}

// Live Preview Component
interface BrandingPreviewProps {
  storeName: string
  tagline: string
  logo: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

function BrandingPreview({
  storeName,
  tagline,
  logo,
  primaryColor,
  secondaryColor,
  accentColor
}: BrandingPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

  const displayStoreName = storeName || 'Your Store'
  const displayTagline = tagline || 'Welcome to our store!'

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Preview Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Live Preview</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Preview Mode Toggle */}
            <div className="flex bg-white rounded-md border border-gray-200 p-1">
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={`p-1.5 rounded text-xs transition-colors ${previewMode === 'desktop'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={`p-1.5 rounded text-xs transition-colors ${previewMode === 'mobile'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>

            {/* Open in New Tab */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => window.open('/', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Live
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className={`bg-gray-100 p-4 ${previewMode === 'mobile' ? 'flex justify-center' : ''}`}>
        <div className={`bg-white shadow-lg ${previewMode === 'mobile'
          ? 'w-80 h-96 rounded-lg overflow-hidden'
          : 'w-full h-80 rounded-lg overflow-hidden'
          }`}>

          {/* Mock Store Header */}
          <div
            className="px-4 py-3 text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {logo ? (
                  <img
                    src={logo}
                    alt={displayStoreName}
                    className="w-8 h-8 object-contain bg-white rounded p-1"
                  />
                ) : (
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">
                      {displayStoreName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                <div>
                  <h1 className={`font-bold ${previewMode === 'mobile' ? 'text-sm' : 'text-lg'}`}>
                    {displayStoreName}
                  </h1>
                  {tagline && previewMode === 'desktop' && (
                    <p className="text-xs opacity-90">{tagline}</p>
                  )}
                </div>
              </div>

              {/* Mock Navigation Icons */}
              <div className="flex items-center gap-2 text-white">
                <Search className="h-4 w-4" />
                <Heart className="h-4 w-4" />
                <ShoppingBag className="h-4 w-4" />
                <User className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Mock Content */}
          <div className="p-4 space-y-4">
            {/* Hero Section */}
            <div
              className="rounded-lg p-4 text-white text-center"
              style={{ backgroundColor: accentColor }}
            >
              <h2 className={`font-bold ${previewMode === 'mobile' ? 'text-sm' : 'text-lg'}`}>
                {displayTagline}
              </h2>
              <p className="text-xs opacity-90 mt-1">
                Discover amazing products
              </p>
            </div>

            {/* Mock Button */}
            <button
              type="button"
              className="w-full py-2 rounded font-medium text-white text-sm"
              style={{ backgroundColor: primaryColor }}
            >
              Shop Now
            </button>
          </div>
        </div>
      </div>

      {/* Color Scheme Info */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Colors being used:</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded border"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="text-gray-500">Primary</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded border"
                style={{ backgroundColor: accentColor }}
              />
              <span className="text-gray-500">Accent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Component
export default function StoreSettingsForm({ storeSettings }: StoreSettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState('branding')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Enhanced AI state variables
  const [showApiKey, setShowApiKey] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [availableModels, setAvailableModels] = useState<Array<{ value: string, label: string, recommended?: boolean }>>([])
  const [loadingModels, setLoadingModels] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    storeName: storeSettings.storeName || '',
    tagline: storeSettings.tagline || '',
    logo: storeSettings.logo || '',
    favicon: storeSettings.favicon || '',
    primaryColor: storeSettings.primaryColor || DEFAULT_VALUES.PRIMARY_COLOR,
    secondaryColor: storeSettings.secondaryColor || DEFAULT_VALUES.SECONDARY_COLOR,
    accentColor: storeSettings.accentColor || DEFAULT_VALUES.ACCENT_COLOR,
    email: storeSettings.email || '',
    phone: storeSettings.phone || '',
    address: storeSettings.address || '',
    instagram: storeSettings.instagram || '',
    facebook: storeSettings.facebook || '',
    pinterest: storeSettings.pinterest || '',
    twitter: storeSettings.twitter || '',
    aiProvider: storeSettings.aiProvider || '',
    aiApiKey: storeSettings.aiApiKey || '',
    aiModel: storeSettings.aiModel || '',
    currency: storeSettings.currency || DEFAULT_VALUES.CURRENCY,
    timezone: storeSettings.timezone || DEFAULT_VALUES.TIMEZONE,
    returnsEnabled: storeSettings.returnsEnabled ?? true,
    returnPeriodDays: storeSettings.returnPeriodDays || 30,
    returnPolicyUrl: storeSettings.returnPolicyUrl || '',
    hasRestockingFee: storeSettings.hasRestockingFee || false,
    restockingFeePercentage: storeSettings.restockingFeePercentage || 0,
    returnPolicyDescription: storeSettings.returnPolicyDescription || '',
    noReturnsReason: storeSettings.noReturnsReason || '',
    disableShoppingCart: storeSettings.disableShoppingCart ?? false,
    catalogModeSettings: storeSettings.catalogModeSettings || JSON.stringify({
      whatsappNumber: '',
      instagramHandle: '',
      contactMessage: 'Hi! I\'m interested in this product. Can you provide more details?',
      showWhatsApp: true,
      showInstagram: true,
      customContactText: 'Contact us for pricing and availability'
    }),
    announcementBar: storeSettings.announcementBar || '',
    metaTitle: storeSettings.metaTitle || '',
    metaDescription: storeSettings.metaDescription || '',
    businessHours: storeSettings.businessHours || '',
    footerDescription: storeSettings.footerDescription || '',
  })

  useEffect(() => {
    // ✅ FIX: Refetch models when component mounts if provider and API key exist
    if (formData.aiProvider && formData.aiApiKey && availableModels.length === 0) {
      console.log('Refetching models on component mount:', {
        provider: formData.aiProvider,
        hasApiKey: !!formData.aiApiKey,
        currentModel: formData.aiModel
      })
      fetchAvailableModels(formData.aiProvider, formData.aiApiKey)
    }
  }, [formData.aiProvider, formData.aiApiKey, availableModels.length])

  // Dynamic model fetching
  const fetchAvailableModels = async (provider: string, apiKey: string) => {
    if (!provider || !apiKey) {
      setAvailableModels([])
      return
    }

    setLoadingModels(true)
    try {
      const response = await fetch('/api/admin/ai/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider, apiKey })
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableModels(data.models || [])

        // ✅ FIX: Don't auto-select model if one is already saved
        if (!formData.aiModel && data.models.length > 0) {
          const recommendedModel = data.models.find((m: any) => m.recommended)
          const defaultModel = recommendedModel || data.models[0]
          if (defaultModel) {
            handleInputChange('aiModel', defaultModel.value)
          }
        }
      } else {
        // ✅ FIX: Use static models as fallback
        const staticModels = getStaticModels(provider)
        setAvailableModels(staticModels)
        console.log(`API failed, using static models for ${provider}:`, staticModels)
      }
    } catch (error) {
      // ✅ FIX: Use static models as fallback
      const staticModels = getStaticModels(provider)
      setAvailableModels(staticModels)
      console.log(`Error fetching models, using static fallback for ${provider}:`, error)
    } finally {
      setLoadingModels(false)
    }
  }

  // Static fallback models (in case API fails)
  const getStaticModels = (provider: string) => {
    const staticModels: Record<string, Array<{ value: string, label: string, recommended?: boolean }>> = {
      openai: [
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini', recommended: true },
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
      ],
      gemini: [
        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', recommended: true },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
        { value: 'gemini-pro', label: 'Gemini Pro' }
      ],
      claude: [
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', recommended: true },
        { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' }
      ],
      mistral: [
        { value: 'mistral-small-latest', label: 'Mistral Small', recommended: true },
        { value: 'mistral-medium-latest', label: 'Mistral Medium' },
        { value: 'mistral-large-latest', label: 'Mistral Large' }
      ],
      openrouter: [
        { value: 'meta-llama/llama-3.2-3b-instruct:free', label: 'Llama 3.2 3B (Free)', recommended: true },
        { value: 'microsoft/phi-3-mini-128k-instruct:free', label: 'Phi-3 Mini (Free)' },
        { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
        { value: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5' },
        { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' }
      ]
    }
    return staticModels[provider] || []
  }

  const getModelDescription = (provider: string, model: string) => {
    const descriptions: Record<string, Record<string, string>> = {
      openai: {
        'gpt-4o-mini': 'Fast and cost-effective, perfect for most content generation tasks',
        'gpt-4o': 'Most capable model, best for complex content creation',
        'gpt-3.5-turbo': 'Balanced performance and cost'
      },
      gemini: {
        'gemini-1.5-flash': 'Fast and efficient, great for bulk content generation',
        'gemini-1.5-pro': 'High quality content with better reasoning',
        'gemini-pro': 'Balanced model for general content creation'
      },
      claude: {
        'claude-3-haiku-20240307': 'Fast and affordable, excellent for product descriptions',
        'claude-3-sonnet-20240229': 'Balanced performance for most content types',
        'claude-3-opus-20240229': 'Highest quality, best for complex content'
      },
      mistral: {
        'mistral-small-latest': 'Cost-effective with good performance',
        'mistral-medium-latest': 'Balanced model for general use',
        'mistral-large-latest': 'High performance for complex tasks'
      },
      openrouter: {
        'meta-llama/llama-3.2-3b-instruct:free': 'Free tier model, good for basic content generation',
        'microsoft/phi-3-mini-128k-instruct:free': 'Free Microsoft model, efficient for simple tasks',
        'openai/gpt-4o-mini': 'OpenAI via OpenRouter, reliable and fast',
        'google/gemini-flash-1.5': 'Google Gemini via OpenRouter, very fast',
        'anthropic/claude-3-haiku': 'Claude via OpenRouter, high quality',
        'mistralai/mistral-7b-instruct:free': 'Free Mistral model, European provider'
      }
    }
    return descriptions[provider]?.[model] || 'Good for general content generation'
  }

  const getProviderInfo = (provider: string) => {
    const info: Record<string, any> = {
      openai: {
        name: 'OpenAI (ChatGPT)',
        description: 'Industry-leading AI with excellent content quality and reliability.',
        pricing: 'Pay per token',
        speed: 'Fast',
        quality: 'Excellent',
        apiUrl: 'https://platform.openai.com/api-keys'
      },
      gemini: {
        name: 'Google Gemini',
        description: 'Google\'s advanced AI model with competitive pricing and good performance.',
        pricing: 'Very affordable',
        speed: 'Very fast',
        quality: 'Very good',
        apiUrl: 'https://makersuite.google.com/app/apikey'
      },
      claude: {
        name: 'Anthropic Claude',
        description: 'High-quality AI focused on helpful, harmless, and honest content.',
        pricing: 'Premium pricing',
        speed: 'Fast',
        quality: 'Excellent',
        apiUrl: 'https://console.anthropic.com/account/keys'
      },
      mistral: {
        name: 'Mistral AI',
        description: 'European AI provider with good performance and competitive pricing.',
        pricing: 'Competitive',
        speed: 'Fast',
        quality: 'Good',
        apiUrl: 'https://console.mistral.ai/api-keys/'
      },
      openrouter: {
        name: 'OpenRouter (Multi-Model)',
        description: 'Access multiple AI providers through one API. Includes free models and premium options.',
        pricing: 'Free & paid options',
        speed: 'Variable',
        quality: 'Variable by model',
        apiUrl: 'https://openrouter.ai/keys'
      }
    }
    return info[provider] || {}
  }

  const testAIConnection = async () => {
    if (!formData.aiProvider || !formData.aiApiKey) {
      setConnectionStatus({
        success: false,
        message: 'Please select a provider and enter an API key first.'
      })
      return
    }

    setTestingConnection(true)
    setConnectionStatus(null)

    try {
      const response = await fetch('/api/admin/ai/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: formData.aiProvider,
          apiKey: formData.aiApiKey,
          model: formData.aiModel || (availableModels.find(m => m.recommended)?.value || availableModels[0]?.value)
        })
      })

      const data = await response.json()

      setConnectionStatus({
        success: data.success,
        message: data.success
          ? `✅ Connection successful! AI is ready to generate content.`
          : `❌ Connection failed: ${data.error}`
      })
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: '❌ Failed to test connection. Please check your settings.'
      })
    } finally {
      setTestingConnection(false)
    }
  }

  // Input change handler
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSaveSuccess(false)

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Fetch models when provider or API key changes
    if (field === 'aiProvider') {
      setAvailableModels([])
      setFormData(prev => ({ ...prev, aiModel: '' }))
      if (value && formData.aiApiKey) {
        fetchAvailableModels(value, formData.aiApiKey)
      } else if (value) {
        // Show static models if no API key yet
        setAvailableModels(getStaticModels(value))
      }
    }

    if (field === 'aiApiKey' && formData.aiProvider && value) {
      fetchAvailableModels(formData.aiProvider, value)
    }
  }, [errors, formData.aiApiKey, formData.aiProvider])

  // Validation function
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!formData.storeName.trim()) {
      newErrors.storeName = 'Store name is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.aiProvider && !formData.aiApiKey.trim()) {
      newErrors.aiApiKey = 'API key is required when AI provider is selected'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSaveSuccess(true)
        router.refresh()
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        const errorData = await response.json()
        setErrors({ submit: errorData.error || 'Failed to save settings' })
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }, [formData, validateForm, router])

  // Get AI provider info
  const aiProviderInfo = formData.aiProvider ? AI_PROVIDER_INFO[formData.aiProvider] : null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Enhanced Branding Tab */}
        {activeTab === 'branding' && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Store Identity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Store Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="storeName" className="flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Store Name *
                      </Label>
                      <Input
                        id="storeName"
                        value={formData.storeName}
                        onChange={(e) => handleInputChange('storeName', e.target.value)}
                        placeholder="e.g., Hita&Co"
                        className={errors.storeName ? 'border-red-500' : ''}
                        disabled={loading}
                      />
                      {errors.storeName && (
                        <p className="text-sm text-red-600">{errors.storeName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tagline" className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Tagline
                      </Label>
                      <Input
                        id="tagline"
                        value={formData.tagline}
                        onChange={(e) => handleInputChange('tagline', e.target.value)}
                        placeholder="e.g., Authentic Indian Ethnic Wear & Lifestyle"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Brand Assets */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Brand Assets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Store Logo */}
                  <div className="space-y-2">
                    <Label>Store Logo</Label>
                    <div className="flex items-center gap-4">
                      {formData.logo && (
                        <div className="relative">
                          <img
                            src={formData.logo}
                            alt="Store logo"
                            className="w-16 h-16 object-contain border border-gray-200 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleInputChange('logo', '')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <div className="flex-1">
                        <Input
                          type="url"
                          value={formData.logo}
                          onChange={(e) => handleInputChange('logo', e.target.value)}
                          placeholder="Enter logo URL"
                          disabled={loading}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Paste a URL to your logo image (PNG, JPG, or SVG)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Favicon */}
                  <div className="space-y-2">
                    <Label>Favicon</Label>
                    <div className="flex items-center gap-4">
                      {formData.favicon && (
                        <div className="relative">
                          <img
                            src={formData.favicon}
                            alt="Favicon"
                            className="w-8 h-8 object-contain border border-gray-200 rounded"
                          />
                          <button
                            type="button"
                            onClick={() => handleInputChange('favicon', '')}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X className="h-2 w-2" />
                          </button>
                        </div>
                      )}
                      <div className="flex-1">
                        <Input
                          type="url"
                          value={formData.favicon}
                          onChange={(e) => handleInputChange('favicon', e.target.value)}
                          placeholder="Enter favicon URL"
                          disabled={loading}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Paste a URL to your favicon (16x16 or 32x32 pixels, ICO or PNG)
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Live Preview */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <BrandingPreview
                  storeName={formData.storeName}
                  tagline={formData.tagline}
                  logo={formData.logo}
                  primaryColor={formData.primaryColor}
                  secondaryColor={formData.secondaryColor}
                  accentColor={formData.accentColor}
                />
              </div>
            </div>
          </div>
        )}

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Colors & Theme
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <ColorPicker
                        value={formData.primaryColor}
                        onChange={(color) => handleInputChange('primaryColor', color)}
                        disabled={loading}
                      />
                      <p className="text-sm text-gray-500">Main brand color for headers, buttons</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Secondary Color</Label>
                      <ColorPicker
                        value={formData.secondaryColor}
                        onChange={(color) => handleInputChange('secondaryColor', color)}
                        disabled={loading}
                      />
                      <p className="text-sm text-gray-500">Background and secondary elements</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Accent Color</Label>
                      <ColorPicker
                        value={formData.accentColor}
                        onChange={(color) => handleInputChange('accentColor', color)}
                        disabled={loading}
                      />
                      <p className="text-sm text-gray-500">Call-to-action buttons, highlights</p>
                    </div>
                  </div>

                  {/* Color Preview */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Color Preview</h4>
                    <div className="space-y-2">
                      <div
                        className="h-12 rounded-lg flex items-center px-4 text-white font-medium"
                        style={{ backgroundColor: formData.primaryColor }}
                      >
                        Primary Color - {formData.primaryColor}
                      </div>
                      <div
                        className="h-8 rounded-lg flex items-center px-4 border"
                        style={{
                          backgroundColor: formData.secondaryColor,
                          borderColor: formData.primaryColor,
                          color: formData.primaryColor
                        }}
                      >
                        Secondary Color - {formData.secondaryColor}
                      </div>
                      <div
                        className="h-10 rounded-lg flex items-center px-4 text-white font-medium"
                        style={{ backgroundColor: formData.accentColor }}
                      >
                        Accent Color - {formData.accentColor}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <BrandingPreview
                  storeName={formData.storeName}
                  tagline={formData.tagline}
                  logo={formData.logo}
                  primaryColor={formData.primaryColor}
                  secondaryColor={formData.secondaryColor}
                  accentColor={formData.accentColor}
                />
              </div>
            </div>
          </div>
        )}

        {/* Contact Info Tab */}
        {activeTab === 'contact' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Contact className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contact@yourdomain.com"
                    className={errors.email ? 'border-red-500' : ''}
                    disabled={loading}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Business Address
                </Label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main St, City, State, ZIP Code"
                  rows={3}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessHours" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Business Hours
                </Label>
                <textarea
                  id="businessHours"
                  value={formData.businessHours}
                  onChange={(e) => handleInputChange('businessHours', e.target.value)}
                  placeholder={'Monday - Friday: 9:00 AM - 6:00 PM EST\nSaturday: 10:00 AM - 4:00 PM EST\nSunday: Closed'}
                  rows={3}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">One line per day/schedule. Shown as-is on the Contact page. Leave blank to hide the Business Hours section.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Social Media Tab */}
        {activeTab === 'social' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Social Media Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                    placeholder="https://instagram.com/youraccount"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook" className="flex items-center gap-2">
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Label>
                  <Input
                    id="facebook"
                    value={formData.facebook}
                    onChange={(e) => handleInputChange('facebook', e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pinterest" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Pinterest
                  </Label>
                  <Input
                    id="pinterest"
                    value={formData.pinterest}
                    onChange={(e) => handleInputChange('pinterest', e.target.value)}
                    placeholder="https://pinterest.com/youraccount"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter" className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" />
                    Twitter / X
                  </Label>
                  <Input
                    id="twitter"
                    value={formData.twitter}
                    onChange={(e) => handleInputChange('twitter', e.target.value)}
                    placeholder="https://twitter.com/youraccount"
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced AI Settings Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            {/* AI Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Content Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-900">AI-Powered Content</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Generate professional product descriptions, SEO content, and marketing copy automatically using AI.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          Product Descriptions
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          SEO Meta Tags
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          Social Media Captions
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          Bulk Processing
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Provider Selection */}
                <div className="space-y-2">
                  <Label htmlFor="aiProvider" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    AI Provider *
                  </Label>
                  <select
                    id="aiProvider"
                    value={formData.aiProvider || ''}
                    onChange={(e) => handleInputChange('aiProvider', e.target.value)}
                    disabled={loading}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${errors.aiProvider ? 'border-red-500' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select AI Provider</option>
                    <option value="openai">OpenAI (ChatGPT) - Recommended</option>
                    <option value="gemini">Google Gemini - Fast & Cost-Effective</option>
                    <option value="claude">Anthropic Claude - High Quality</option>
                    <option value="mistral">Mistral AI - European Alternative</option>
                    <option value="openrouter">OpenRouter - Multi-Model & Free Options</option>
                  </select>
                  {errors.aiProvider && (
                    <p className="text-sm text-red-600">{errors.aiProvider}</p>
                  )}
                </div>

                {/* Model Selection (when provider is selected) */}
                {formData.aiProvider && (
                  <div className="space-y-2">
                    <Label htmlFor="aiModel" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Model Selection
                      {loadingModels && (
                        <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                      )}
                    </Label>
                    <select
                      id="aiModel"
                      value={formData.aiModel || ''}
                      onChange={(e) => handleInputChange('aiModel', e.target.value)}
                      disabled={loading || loadingModels}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loadingModels ? (
                        <option value="">Loading models...</option>
                      ) : availableModels.length > 0 ? (
                        <>
                          <option value="">Select a model</option>
                          {availableModels.map((model) => (
                            <option key={model.value} value={model.value}>
                              {model.label} {model.recommended && '(Recommended)'}
                            </option>
                          ))}
                        </>
                      ) : formData.aiApiKey ? (
                        <option value="">No models available</option>
                      ) : (
                        <option value="">Enter API key to load models</option>
                      )}
                    </select>
                    {availableModels.length > 0 && formData.aiModel && (
                      <p className="text-xs text-gray-500">
                        {getModelDescription(formData.aiProvider, formData.aiModel)}
                      </p>
                    )}
                    {!formData.aiApiKey && (
                      <p className="text-xs text-amber-600">
                        💡 Enter your API key above to load the latest available models
                      </p>
                    )}
                  </div>
                )}

                {/* API Key Input */}
                {formData.aiProvider && (
                  <div className="space-y-2">
                    <Label htmlFor="aiApiKey" className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      API Key *
                    </Label>
                    <div className="relative">
                      <Input
                        id="aiApiKey"
                        type={showApiKey ? 'text' : 'password'}
                        value={formData.aiApiKey || ''}
                        onChange={(e) => handleInputChange('aiApiKey', e.target.value)}
                        placeholder={`Enter your ${getProviderInfo(formData.aiProvider).name} API key`}
                        disabled={loading}
                        className={errors.aiApiKey ? 'border-red-500 pr-20' : 'pr-20'}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-3">
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <a
                          href={getProviderInfo(formData.aiProvider).apiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title="Get API Key"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                    {errors.aiApiKey && (
                      <p className="text-sm text-red-600">{errors.aiApiKey}</p>
                    )}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="text-xs text-gray-600">
                          <p className="font-medium">Your API key is secure:</p>
                          <ul className="mt-1 space-y-1">
                            <li>• Encrypted in database</li>
                            <li>• Never logged or exposed</li>
                            <li>• Only used for content generation</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Provider Information */}
                {formData.aiProvider && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {getProviderInfo(formData.aiProvider).name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {getProviderInfo(formData.aiProvider).description}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <span>• {getProviderInfo(formData.aiProvider).pricing}</span>
                          <span>• {getProviderInfo(formData.aiProvider).speed}</span>
                          <span>• {getProviderInfo(formData.aiProvider).quality}</span>
                        </div>
                        <div className="mt-3">
                          <a
                            href={getProviderInfo(formData.aiProvider).apiUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Get API Key <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Test AI Connection */}
                {formData.aiProvider && formData.aiApiKey && (
                  <div className="pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testAIConnection}
                      disabled={loading || testingConnection}
                      className="w-full"
                    >
                      {testingConnection ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Testing Connection...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Test AI Connection
                        </>
                      )}
                    </Button>
                    {connectionStatus && (
                      <div className={`mt-2 p-2 rounded text-sm ${connectionStatus.success
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {connectionStatus.message}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Usage Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  AI Usage Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Best Practices</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Review all generated content before publishing</li>
                      <li>• Use specific product information for better results</li>
                      <li>• Generate content in batches to save costs</li>
                      <li>• Customize tone settings for your brand voice</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Features Available</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Product descriptions & summaries</li>
                      <li>• SEO titles & meta descriptions</li>
                      <li>• Social media captions</li>
                      <li>• Bulk processing (up to 50 products)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* General Tab */}
        {activeTab === 'general' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.value} value={currency.value}>
                        {currency.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {TIMEZONES.map((timezone) => (
                      <option key={timezone.value} value={timezone.value}>
                        {timezone.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Site Content Tab (shares the General tab) */}
        {activeTab === 'general' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Site Content
              </CardTitle>
              <p className="text-sm text-gray-600">
                Text shown across the customer-facing site. Leave blank to hide.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="announcementBar">Top Announcement Banner</Label>
                <Input
                  id="announcementBar"
                  value={formData.announcementBar}
                  onChange={(e) => handleInputChange('announcementBar', e.target.value)}
                  placeholder="e.g., ✨ Authentic Indian ethnic wear for women | Shipped across the USA"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">Shown in the purple bar at the very top of every customer page. Leave blank to hide it.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerDescription">Footer Description</Label>
                <textarea
                  id="footerDescription"
                  rows={2}
                  value={formData.footerDescription}
                  onChange={(e) => handleInputChange('footerDescription', e.target.value)}
                  placeholder="e.g., Kurtas, sets and ethnic wear curated from India, shipped within the USA."
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">Short sentence shown under your tagline in the site footer.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">SEO Title Override</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                    placeholder={`${formData.storeName || 'Hita&Co'} - Indian Ethnic Wear for Women in the USA`}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500">Shown in the browser tab and search results. Leave blank to use store name.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">SEO Description Override</Label>
                  <Input
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                    placeholder="Shown under your listing in Google search results"
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      {/* ✅ ENHANCED: Policies Tab with No Returns Option */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          {/* Return Policy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Return Policy Configuration
              </CardTitle>
              <p className="text-sm text-gray-600">
                Configure your store's return policy settings. These will be displayed throughout your site.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Returns Enabled Toggle */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    id="returnsEnabled"
                    checked={formData.returnsEnabled}
                    onChange={(e) => handleInputChange('returnsEnabled', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="returnsEnabled" className="flex items-center gap-2 font-medium">
                    <RotateCcw className="h-4 w-4 text-blue-500" />
                    Enable Returns & Exchanges
                  </Label>
                </div>
                <p className="text-sm text-gray-600">
                  {formData.returnsEnabled
                    ? "Customers can return items according to your policy below"
                    : "No returns or exchanges will be accepted (all sales final)"
                  }
                </p>
              </div>

              {/* No Returns Reason (when returns disabled) */}
              {!formData.returnsEnabled && (
                <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  <Label htmlFor="noReturnsReason" className="flex items-center gap-2 text-orange-800 font-medium mb-2">
                    <AlertCircle className="h-4 w-4" />
                    Reason for No Returns (Optional)
                  </Label>
                  <textarea
                    id="noReturnsReason"
                    rows={3}
                    value={formData.noReturnsReason}
                    onChange={(e) => handleInputChange('noReturnsReason', e.target.value)}
                    placeholder="e.g., Due to hygiene reasons, custom-made items, or perishable goods"
                    className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                  <p className="text-xs text-orange-700 mt-2">
                    Brief explanation for why returns aren't accepted (shown to customers)
                  </p>
                </div>
              )}

              {/* Return Policy Details (when returns enabled) */}
              {formData.returnsEnabled && (
                <>
                  {/* Return Period */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="returnPeriodDays" className="flex items-center gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Return Period (Days) *
                      </Label>
                      <select
                        id="returnPeriodDays"
                        value={formData.returnPeriodDays}
                        onChange={(e) => handleInputChange('returnPeriodDays', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={7}>7 days</option>
                        <option value={14}>14 days</option>
                        <option value={30}>30 days</option>
                        <option value={60}>60 days</option>
                        <option value={90}>90 days</option>
                      </select>
                      <p className="text-xs text-gray-500">
                        Number of days customers have to return items
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="returnPolicyUrl">Return Policy URL (Optional)</Label>
                      <Input
                        id="returnPolicyUrl"
                        type="url"
                        value={formData.returnPolicyUrl}
                        onChange={(e) => handleInputChange('returnPolicyUrl', e.target.value)}
                        placeholder="https://yourstore.com/return-policy"
                      />
                      <p className="text-xs text-gray-500">
                        Link to your detailed return policy page
                      </p>
                    </div>
                  </div>

                  {/* Restocking Fee Settings */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <input
                        type="checkbox"
                        id="hasRestockingFee"
                        checked={formData.hasRestockingFee}
                        onChange={(e) => handleInputChange('hasRestockingFee', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="hasRestockingFee" className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        Apply Restocking Fee
                      </Label>
                    </div>

                    {formData.hasRestockingFee && (
                      <div className="space-y-2">
                        <Label htmlFor="restockingFeePercentage">Restocking Fee Percentage</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="restockingFeePercentage"
                            type="number"
                            min="0"
                            max="50"
                            step="0.1"
                            value={formData.restockingFeePercentage}
                            onChange={(e) => handleInputChange('restockingFeePercentage', parseFloat(e.target.value) || 0)}
                            placeholder="15"
                            className="w-32"
                          />
                          <span className="text-gray-500">%</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Percentage of item price charged as restocking fee (0-50%)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Return Policy Description */}
                  <div className="space-y-2">
                    <Label htmlFor="returnPolicyDescription">Return Policy Description</Label>
                    <textarea
                      id="returnPolicyDescription"
                      rows={4}
                      value={formData.returnPolicyDescription}
                      onChange={(e) => handleInputChange('returnPolicyDescription', e.target.value)}
                      placeholder="We offer hassle-free returns within 30 days of purchase. Items must be in original condition with tags attached."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500">
                      Brief description of your return policy (displayed in trust indicators)
                    </p>
                  </div>
                </>
              )}

              {/* Enhanced Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Customer Preview
                </h4>
                <div className="text-center bg-white p-4 rounded border">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${formData.returnsEnabled ? 'bg-purple-100' : 'bg-red-100'
                    }`}>
                    {formData.returnsEnabled ? (
                      <RotateCcw className="h-6 w-6 text-purple-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>

                  {formData.returnsEnabled ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Returns</h3>
                      <p className="text-gray-600">
                        {formData.returnPeriodDays}-day return policy
                        {formData.hasRestockingFee && formData.restockingFeePercentage > 0 && (
                          <span className="block text-sm mt-1">
                            {formData.restockingFeePercentage}% restocking fee applies
                          </span>
                        )}
                        {!formData.hasRestockingFee && (
                          <span className="block text-sm mt-1">
                            No restocking fees
                          </span>
                        )}
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Returns</h3>
                      <p className="text-gray-600">
                        All sales are final
                        {formData.noReturnsReason && (
                          <span className="block text-sm mt-1">
                            {formData.noReturnsReason}
                          </span>
                        )}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {activeTab === 'business' && (
        <div className="space-y-6">
          {/* Business Mode Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Business Mode Configuration
              </CardTitle>
              <p className="text-sm text-gray-600">
                Choose how customers interact with your products - full eCommerce with cart or catalog mode with contact buttons.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mode Toggle */}
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <input
                        type="checkbox"
                        id="disableShoppingCart"
                        checked={formData.disableShoppingCart}
                        onChange={(e) => handleInputChange('disableShoppingCart', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="disableShoppingCart" className="flex items-center gap-2 font-medium text-lg">
                        <ShoppingBag className="h-5 w-5 text-blue-500" />
                        Enable Catalog Mode
                      </Label>
                    </div>

                    <div className="space-y-3">
                      {/* Current Mode Display */}
                      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${formData.disableShoppingCart
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                        }`}>
                        {formData.disableShoppingCart ? (
                          <>
                            <MessageCircle className="h-4 w-4" />
                            Catalog Mode Active
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="h-4 w-4" />
                            eCommerce Mode Active
                          </>
                        )}
                      </div>

                      {/* Mode Description */}
                      <p className="text-sm text-gray-600">
                        {formData.disableShoppingCart
                          ? "Products display with prices, but customers contact you directly via WhatsApp or Instagram instead of using a shopping cart."
                          : "Full eCommerce experience with shopping cart, checkout, and payment processing."
                        }
                      </p>
                    </div>
                  </div>

                  {/* Visual Preview */}
                  <div className="ml-6 flex-shrink-0">
                    <div className="w-32 h-20 border rounded-lg bg-white p-3 text-xs">
                      <div className="text-gray-800 font-medium mb-2">Product Card</div>
                      {formData.disableShoppingCart ? (
                        <div className="space-y-1">
                          <div className="bg-green-500 text-white px-2 py-1 rounded text-center">
                            📱 WhatsApp
                          </div>
                          <div className="bg-pink-500 text-white px-2 py-1 rounded text-center">
                            📷 Instagram
                          </div>
                        </div>
                      ) : (
                        <div className="bg-blue-500 text-white px-2 py-1 rounded text-center">
                          🛒 Add to Cart
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Catalog Mode Settings - Only show when catalog mode is enabled */}
              {formData.disableShoppingCart && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-orange-800">
                      <MessageCircle className="h-5 w-5" />
                      Catalog Mode Contact Settings
                    </CardTitle>
                    <p className="text-sm text-orange-700">
                      Configure how customers can contact you when browsing your catalog.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      // Parse current catalog settings
                      let catalogSettings;
                      try {
                        catalogSettings = JSON.parse(formData.catalogModeSettings);
                      } catch {
                        catalogSettings = {
                          whatsappNumber: '',
                          instagramHandle: '',
                          contactMessage: 'Hi! I\'m interested in this product. Can you provide more details?',
                          showWhatsApp: true,
                          showInstagram: true,
                          customContactText: 'Contact us for pricing and availability'
                        };
                      }

                      const updateCatalogSettings = (field: string, value: any) => {
                        const updated = { ...catalogSettings, [field]: value };
                        handleInputChange('catalogModeSettings', JSON.stringify(updated));
                      };

                      return (
                        <>
                          {/* Contact Options */}
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="whatsappNumber" className="flex items-center gap-2">
                                <MessageCircle className="h-4 w-4 text-green-600" />
                                WhatsApp Number
                              </Label>
                              <Input
                                id="whatsappNumber"
                                value={catalogSettings.whatsappNumber}
                                onChange={(e) => updateCatalogSettings('whatsappNumber', e.target.value)}
                                placeholder="+1234567890"
                                className="bg-white border-orange-300 focus:border-orange-500 focus:ring-orange-500"
                              />
                              <p className="text-xs text-orange-600">
                                Include country code (e.g., +1 for US, +91 for India)
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="instagramHandle" className="flex items-center gap-2">
                                <Instagram className="h-4 w-4 text-pink-600" />
                                Instagram Handle
                              </Label>
                              <Input
                                id="instagramHandle"
                                value={catalogSettings.instagramHandle}
                                onChange={(e) => updateCatalogSettings('instagramHandle', e.target.value)}
                                placeholder="hitaco_store"
                                className="bg-white border-orange-300 focus:border-orange-500 focus:ring-orange-500"
                              />
                              <p className="text-xs text-orange-600">
                                Without @ symbol (e.g., hitaco_store)
                              </p>
                            </div>
                          </div>

                          {/* Default Contact Message */}
                          <div className="space-y-2">
                            <Label htmlFor="contactMessage">Default Contact Message</Label>
                            <textarea
                              id="contactMessage"
                              rows={3}
                              value={catalogSettings.contactMessage}
                              onChange={(e) => updateCatalogSettings('contactMessage', e.target.value)}
                              placeholder="Hi! I'm interested in this product. Can you provide more details?"
                              className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                            />
                            <p className="text-xs text-orange-600">
                              This message will be pre-filled when customers contact you about products
                            </p>
                          </div>

                          {/* Custom Contact Text */}
                          <div className="space-y-2">
                            <Label htmlFor="customContactText">Contact Button Text</Label>
                            <Input
                              id="customContactText"
                              value={catalogSettings.customContactText}
                              onChange={(e) => updateCatalogSettings('customContactText', e.target.value)}
                              placeholder="Contact us for pricing and availability"
                              className="bg-white border-orange-300 focus:border-orange-500 focus:ring-orange-500"
                            />
                            <p className="text-xs text-orange-600">
                              Text displayed above contact buttons on product pages
                            </p>
                          </div>

                          {/* Contact Options Toggle */}
                          <div className="border border-orange-200 rounded-lg p-4 bg-white">
                            <Label className="text-sm font-medium text-orange-800 mb-3 block">
                              Contact Methods to Display
                            </Label>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  id="showWhatsApp"
                                  checked={catalogSettings.showWhatsApp}
                                  onChange={(e) => updateCatalogSettings('showWhatsApp', e.target.checked)}
                                  className="rounded border-orange-300 text-green-600 focus:ring-green-500"
                                />
                                <Label htmlFor="showWhatsApp" className="flex items-center gap-2">
                                  <MessageCircle className="h-4 w-4 text-green-600" />
                                  Show WhatsApp Button
                                </Label>
                              </div>
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  id="showInstagram"
                                  checked={catalogSettings.showInstagram}
                                  onChange={(e) => updateCatalogSettings('showInstagram', e.target.checked)}
                                  className="rounded border-orange-300 text-pink-600 focus:ring-pink-500"
                                />
                                <Label htmlFor="showInstagram" className="flex items-center gap-2">
                                  <Instagram className="h-4 w-4 text-pink-600" />
                                  Show Instagram Button
                                </Label>
                              </div>
                            </div>
                          </div>

                          {/* Preview */}
                          <div className="border border-orange-200 rounded-lg p-4 bg-white">
                            <h4 className="text-sm font-medium text-orange-800 mb-3">Contact Buttons Preview</h4>
                            <div className="space-y-2">
                              <p className="text-xs text-gray-600 italic">{catalogSettings.customContactText}</p>
                              <div className="flex gap-2">
                                {catalogSettings.showWhatsApp && catalogSettings.whatsappNumber && (
                                  <div className="inline-flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded text-xs">
                                    <MessageCircle className="h-3 w-3" />
                                    WhatsApp
                                  </div>
                                )}
                                {catalogSettings.showInstagram && catalogSettings.instagramHandle && (
                                  <div className="inline-flex items-center gap-1 bg-pink-500 text-white px-3 py-1 rounded text-xs">
                                    <Instagram className="h-3 w-3" />
                                    Instagram
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Mode Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mode Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* eCommerce Mode */}
                    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        eCommerce Mode
                      </h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Full shopping cart functionality</li>
                        <li>• "Add to Cart" buttons on products</li>
                        <li>• Complete checkout process</li>
                        <li>• Payment processing</li>
                        <li>• Order management</li>
                        <li>• Cart icon in navigation</li>
                      </ul>
                    </div>

                    {/* Catalog Mode */}
                    <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                      <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Catalog Mode
                      </h4>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• Product showcase with prices</li>
                        <li>• WhatsApp contact buttons</li>
                        <li>• Instagram contact buttons</li>
                        <li>• Direct customer communication</li>
                        <li>• No cart or checkout needed</li>
                        <li>• Perfect for custom orders</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Use Cases */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">When to Use Each Mode</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium text-green-800 mb-2">Use eCommerce Mode For:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Standard retail products</li>
                        <li>• Fixed pricing</li>
                        <li>• Immediate purchase needs</li>
                        <li>• Automated order processing</li>
                        <li>• High-volume sales</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-orange-800 mb-2">Use Catalog Mode For:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Custom or made-to-order items</li>
                        <li>• Price varies by specification</li>
                        <li>• Consultation needed before purchase</li>
                        <li>• Relationship-based sales</li>
                        <li>• Limited or exclusive items</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success Message */}
      {saveSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <p className="text-sm text-green-600">Settings saved successfully!</p>
          </div>
        </div>
      )}

      {/* Submit Error */}
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 min-w-[120px]"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </form>
  )
}