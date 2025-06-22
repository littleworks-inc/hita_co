'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui'
import ColorPicker from '@/components/admin/ColorPicker'
import ImageUpload from '@/components/admin/ImageUpload'
import {
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
  Monitor,
  Smartphone,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  Heart,
  User,
  Search
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
  currency: string
  timezone: string
}

interface StoreSettingsFormProps {
  storeSettings: StoreSettings
}

// Constants
const DEFAULT_VALUES = {
  PRIMARY_COLOR: '#1f2937',
  SECONDARY_COLOR: '#ffffff',
  ACCENT_COLOR: '#f59e0b',
  CURRENCY: 'USD',
  TIMEZONE: 'America/New_York'
} as const

const TABS = [
  { id: 'branding', name: 'Branding', icon: Store },
  { id: 'colors', name: 'Colors & Theme', icon: Palette },
  { id: 'contact', name: 'Contact Info', icon: Contact },
  { id: 'social', name: 'Social Media', icon: Share2 },
  { id: 'ai', name: 'AI Settings', icon: Brain },
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
                className={`p-1.5 rounded text-xs transition-colors ${
                  previewMode === 'desktop'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  previewMode === 'mobile'
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
        <div className={`bg-white shadow-lg ${
          previewMode === 'mobile' 
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
    currency: storeSettings.currency || DEFAULT_VALUES.CURRENCY,
    timezone: storeSettings.timezone || DEFAULT_VALUES.TIMEZONE
  })

  // Input change handler
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSaveSuccess(false)

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [errors])

  // Validation function
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!formData.storeName.trim()) {
      newErrors.storeName = 'Store name is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
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
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
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

        {/* AI Settings Tab */}
        {activeTab === 'ai' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Content Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">AI-Powered Content Generation</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Configure AI services to automatically generate product descriptions, SEO content, and social media captions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiProvider" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  AI Provider
                </Label>
                <select
                  id="aiProvider"
                  value={formData.aiProvider}
                  onChange={(e) => handleInputChange('aiProvider', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {AI_PROVIDERS.map((provider) => (
                    <option key={provider.value} value={provider.value}>
                      {provider.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.aiProvider && aiProviderInfo && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="aiApiKey">API Key</Label>
                    <Input
                      id="aiApiKey"
                      type="password"
                      value={formData.aiApiKey}
                      onChange={(e) => handleInputChange('aiApiKey', e.target.value)}
                      placeholder="Enter your API key"
                      disabled={loading}
                    />
                    <p className="text-sm text-gray-500">
                      Your API key is encrypted and stored securely.
                    </p>
                  </div>

                  {/* Provider-specific help text */}
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-700">
                      <div>
                        <strong>{aiProviderInfo.name}</strong><br />
                        Get your API key from{' '}
                        <a 
                          href={aiProviderInfo.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {aiProviderInfo.url.replace('https://', '')}
                        </a>.<br />
                        {aiProviderInfo.description}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
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
      </div>

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