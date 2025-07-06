// =====================================
// Enhanced AI Settings Component with Vision Model Support
// src/components/admin/EnhancedAISettings.tsx
// =====================================

import React, { useState, useCallback, useEffect } from 'react'
import { Brain, Zap, Eye, Image, CheckCircle, AlertCircle, ExternalLink, RefreshCw, Info } from 'lucide-react'

interface AIModel {
  value: string
  label: string
  recommended?: boolean
  hasVision?: boolean
  description?: string
  pricing?: 'free' | 'paid' | 'credits'
  speed?: 'fast' | 'medium' | 'slow'
  quality?: 'excellent' | 'good' | 'basic'
}

interface AIProvider {
  id: string
  name: string
  description: string
  pricing: string
  hasVisionModels: boolean
  apiUrl: string
  setupComplexity: 'easy' | 'medium' | 'advanced'
  reliability: 'excellent' | 'good' | 'fair'
}

interface EnhancedAISettingsProps {
  formData: {
    aiProvider: string
    aiApiKey: string
    aiModel: string
  }
  onInputChange: (field: string, value: any) => void
  loading: boolean
  errors: Record<string, string>
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    description: 'Industry-leading AI with excellent image analysis capabilities',
    pricing: 'Pay-per-use ($0.10-$30/month typical)',
    hasVisionModels: true,
    apiUrl: 'https://platform.openai.com/api-keys',
    setupComplexity: 'easy',
    reliability: 'excellent'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Fast and affordable with excellent vision capabilities',
    pricing: 'Free tier + Pay-per-use (very affordable)',
    hasVisionModels: true,
    apiUrl: 'https://makersuite.google.com/app/apikey',
    setupComplexity: 'easy',
    reliability: 'excellent'
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    description: 'High-quality content generation with vision support',
    pricing: 'Pay-per-use ($3-$15/month typical)',
    hasVisionModels: true,
    apiUrl: 'https://console.anthropic.com/account/keys',
    setupComplexity: 'easy',
    reliability: 'excellent'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (Multi-Model)',
    description: 'Access multiple AI providers including free vision models',
    pricing: 'Free options + Pay-per-use',
    hasVisionModels: true,
    apiUrl: 'https://openrouter.ai/keys',
    setupComplexity: 'medium',
    reliability: 'good'
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    description: 'European AI provider, text-only (no image analysis)',
    pricing: 'Pay-per-use ($1-$8/month typical)',
    hasVisionModels: false,
    apiUrl: 'https://console.mistral.ai/api-keys/',
    setupComplexity: 'easy',
    reliability: 'good'
  }
]

const STATIC_MODELS: Record<string, AIModel[]> = {
  openai: [
    {
      value: 'gpt-4o-mini',
      label: 'GPT-4o Mini',
      recommended: true,
      hasVision: true,
      description: 'Fast, cost-effective with image analysis',
      pricing: 'paid',
      speed: 'fast',
      quality: 'excellent'
    },
    {
      value: 'gpt-4o',
      label: 'GPT-4o',
      hasVision: true,
      description: 'Most capable with advanced image understanding',
      pricing: 'paid',
      speed: 'medium',
      quality: 'excellent'
    },
    {
      value: 'gpt-3.5-turbo',
      label: 'GPT-3.5 Turbo',
      hasVision: false,
      description: 'Text-only, no image analysis',
      pricing: 'paid',
      speed: 'fast',
      quality: 'good'
    }
  ],
  gemini: [
    {
      value: 'gemini-1.5-flash',
      label: 'Gemini 1.5 Flash',
      recommended: true,
      hasVision: true,
      description: 'Fast and free with excellent image analysis',
      pricing: 'free',
      speed: 'fast',
      quality: 'excellent'
    },
    {
      value: 'gemini-1.5-pro',
      label: 'Gemini 1.5 Pro',
      hasVision: true,
      description: 'Premium quality with advanced vision',
      pricing: 'paid',
      speed: 'medium',
      quality: 'excellent'
    },
    {
      value: 'gemini-pro',
      label: 'Gemini Pro (Legacy)',
      hasVision: false,
      description: 'Text-only, older model',
      pricing: 'free',
      speed: 'fast',
      quality: 'good'
    }
  ],
  claude: [
    {
      value: 'claude-3-5-sonnet-20241022',
      label: 'Claude 3.5 Sonnet',
      recommended: true,
      hasVision: true,
      description: 'Latest model with excellent image understanding',
      pricing: 'paid',
      speed: 'fast',
      quality: 'excellent'
    },
    {
      value: 'claude-3-haiku-20240307',
      label: 'Claude 3 Haiku',
      hasVision: true,
      description: 'Fast and affordable with vision support',
      pricing: 'paid',
      speed: 'fast',
      quality: 'good'
    },
    {
      value: 'claude-3-opus-20240229',
      label: 'Claude 3 Opus',
      hasVision: true,
      description: 'Highest quality with advanced image analysis',
      pricing: 'paid',
      speed: 'slow',
      quality: 'excellent'
    }
  ],
  openrouter: [
    {
      value: 'openai/gpt-4o-mini',
      label: 'GPT-4o Mini (via OpenRouter)',
      recommended: true,
      hasVision: true,
      description: 'OpenAI model with image analysis',
      pricing: 'paid',
      speed: 'fast',
      quality: 'excellent'
    },
    {
      value: 'google/gemini-flash-1.5',
      label: 'Gemini Flash 1.5 (via OpenRouter)',
      hasVision: true,
      description: 'Google model with vision capabilities',
      pricing: 'paid',
      speed: 'fast',
      quality: 'excellent'
    },
    {
      value: 'anthropic/claude-3-haiku',
      label: 'Claude 3 Haiku (via OpenRouter)',
      hasVision: true,
      description: 'Claude model with image support',
      pricing: 'paid',
      speed: 'fast',
      quality: 'good'
    },
    {
      value: 'meta-llama/llama-3.2-3b-instruct:free',
      label: 'Llama 3.2 3B (Free)',
      hasVision: false,
      description: 'Free text-only model',
      pricing: 'free',
      speed: 'medium',
      quality: 'good'
    },
    {
      value: 'microsoft/phi-3-mini-128k-instruct:free',
      label: 'Phi-3 Mini (Free)',
      hasVision: false,
      description: 'Free Microsoft model, text-only',
      pricing: 'free',
      speed: 'fast',
      quality: 'basic'
    }
  ],
  mistral: [
    {
      value: 'mistral-small-latest',
      label: 'Mistral Small',
      recommended: true,
      hasVision: false,
      description: 'Cost-effective, text-only',
      pricing: 'paid',
      speed: 'fast',
      quality: 'good'
    },
    {
      value: 'mistral-medium-latest',
      label: 'Mistral Medium',
      hasVision: false,
      description: 'Balanced performance, text-only',
      pricing: 'paid',
      speed: 'medium',
      quality: 'good'
    },
    {
      value: 'mistral-large-latest',
      label: 'Mistral Large',
      hasVision: false,
      description: 'High performance, text-only',
      pricing: 'paid',
      speed: 'medium',
      quality: 'excellent'
    }
  ]
}

export default function EnhancedAISettings({ formData, onInputChange, loading, errors }: EnhancedAISettingsProps) {
  const [availableModels, setAvailableModels] = useState<AIModel[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [testingConnection, setTestingConnection] = useState(false)

  // Get current provider info
  const currentProvider = AI_PROVIDERS.find(p => p.id === formData.aiProvider)

  // Fetch models when provider or API key changes
  useEffect(() => {
    if (formData.aiProvider && formData.aiApiKey) {
      fetchAvailableModels(formData.aiProvider, formData.aiApiKey)
    } else if (formData.aiProvider) {
      // Show static models if no API key yet
      setAvailableModels(STATIC_MODELS[formData.aiProvider] || [])
    } else {
      setAvailableModels([])
    }
  }, [formData.aiProvider, formData.aiApiKey])

  const fetchAvailableModels = async (provider: string, apiKey: string) => {
    if (!provider || !apiKey) {
      setAvailableModels(STATIC_MODELS[provider] || [])
      return
    }

    setLoadingModels(true)
    try {
      const response = await fetch('/api/admin/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey })
      })

      if (response.ok) {
        const data = await response.json()
        const models = data.models || []

        // Enhance models with vision capabilities info
        const enhancedModels = models.map((model: AIModel) => {
          const staticModel = STATIC_MODELS[provider]?.find(m => m.value === model.value)
          return {
            ...model,
            hasVision: staticModel?.hasVision || false,
            description: staticModel?.description || model.description,
            pricing: staticModel?.pricing || 'paid',
            speed: staticModel?.speed || 'medium',
            quality: staticModel?.quality || 'good'
          }
        })

        setAvailableModels(enhancedModels)

        // Auto-select recommended vision model if none selected
        if (!formData.aiModel && enhancedModels.length > 0) {
          const visionModel = enhancedModels.find((m: AIModel) => m.hasVision && m.recommended)
          const recommendedModel = visionModel || enhancedModels.find((m: AIModel) => m.recommended)
          const defaultModel = recommendedModel || enhancedModels[0]

          if (defaultModel) {
            onInputChange('aiModel', defaultModel.value)
          }
        }
      } else {
        setAvailableModels(STATIC_MODELS[provider] || [])
      }
    } catch (error) {
      console.error('Error fetching models:', error)
      setAvailableModels(STATIC_MODELS[provider] || [])
    } finally {
      setLoadingModels(false)
    }
  }

  const testConnection = async () => {
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
      const response = await fetch('/api/admin/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: formData.aiProvider,
          apiKey: formData.aiApiKey,
          model: formData.aiModel || availableModels.find(m => m.recommended)?.value
        })
      })

      const data = await response.json()
      setConnectionStatus({
        success: data.success,
        message: data.success
          ? '✅ Connection successful! AI is ready to generate content.'
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

  const selectedModel = availableModels.find(m => m.value === formData.aiModel)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Brain className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI Content Generation Settings
            </h3>
            <p className="text-gray-600 mb-3">
              Configure AI to generate product descriptions, SEO content, and analyze product images automatically.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                <Eye className="h-3 w-3 mr-1" />
                Image Analysis
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Product Descriptions
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                SEO Optimization
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                Bulk Processing
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          <Zap className="inline h-4 w-4 mr-2" />
          Choose AI Provider *
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AI_PROVIDERS.map((provider) => (
            <div
              key={provider.id}
              className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.aiProvider === provider.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
              onClick={() => onInputChange('aiProvider', provider.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900">{provider.name}</h4>
                <div className="flex gap-1">
                  {provider.hasVisionModels && (
                    <div className="bg-green-100 p-1 rounded">
                      <Eye className="h-3 w-3 text-green-600" />
                    </div>
                  )}
                  <div className={`p-1 rounded ${provider.reliability === 'excellent' ? 'bg-green-100' :
                      provider.reliability === 'good' ? 'bg-yellow-100' : 'bg-gray-100'
                    }`} title={`Reliability: ${provider.reliability}`}>
                    <CheckCircle className={`h-3 w-3 ${provider.reliability === 'excellent' ? 'text-green-600' :
                        provider.reliability === 'good' ? 'text-yellow-600' : 'text-gray-600'
                      }`} />
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-2">{provider.description}</p>

              <div className="space-y-1">
                <div className="text-xs text-gray-500">
                  <strong>Pricing:</strong> {provider.pricing}
                </div>
                <div className="text-xs text-gray-500">
                  <strong>Setup:</strong> {provider.setupComplexity}
                </div>
                {provider.hasVisionModels && (
                  <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Supports Image Analysis
                  </div>
                )}
              </div>

              {formData.aiProvider === provider.id && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
              )}
            </div>
          ))}
        </div>

        {errors.aiProvider && (
          <p className="text-sm text-red-600">{errors.aiProvider}</p>
        )}
      </div>

      {/* API Key Input */}
      {formData.aiProvider && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            API Key *
          </label>
          <div className="space-y-2">
            <input
              type="password"
              value={formData.aiApiKey || ''}
              onChange={(e) => onInputChange('aiApiKey', e.target.value)}
              placeholder="Enter your API key"
              disabled={loading}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${errors.aiApiKey ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {currentProvider && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Info className="h-4 w-4" />
                <span>Get your API key from:</span>
                <a
                  href={currentProvider.apiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {currentProvider.name}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
          {errors.aiApiKey && (
            <p className="text-sm text-red-600">{errors.aiApiKey}</p>
          )}
        </div>
      )}

      {/* Model Selection */}
      {formData.aiProvider && availableModels.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              <Zap className="inline h-4 w-4 mr-2" />
              Select Model *
            </label>
            {loadingModels && (
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            )}
          </div>

          {/* Vision Models Notice */}
          {currentProvider?.hasVisionModels && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-800 font-medium text-sm">
                <Eye className="h-4 w-4" />
                Image Analysis Available
              </div>
              <p className="text-green-700 text-xs mt-1">
                Models marked with 👁️ can analyze product images to generate descriptions automatically.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {availableModels.map((model) => (
              <div
                key={model.value}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.aiModel === model.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  } ${model.hasVision ? 'border-l-4 border-l-green-500' : ''}`}
                onClick={() => onInputChange('aiModel', model.value)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{model.label}</h4>
                      {model.hasVision && (
                        <Eye className="h-4 w-4 text-green-600" title="Supports image analysis" />
                      )}
                      {model.recommended && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          Recommended
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${model.pricing === 'free' ? 'bg-green-100 text-green-800' :
                          model.pricing === 'paid' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {model.pricing === 'free' ? 'Free' : 'Paid'}
                      </span>
                    </div>

                    {model.description && (
                      <p className="text-sm text-gray-600 mb-2">{model.description}</p>
                    )}

                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Speed: {model.speed}</span>
                      <span>Quality: {model.quality}</span>
                    </div>
                  </div>

                  {formData.aiModel === model.value && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Model Info */}
      {selectedModel && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Selected Model: {selectedModel.label}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Image Analysis:</span>
              <span className={`ml-2 font-medium ${selectedModel.hasVision ? 'text-green-600' : 'text-red-600'}`}>
                {selectedModel.hasVision ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Pricing:</span>
              <span className="ml-2 font-medium">{selectedModel.pricing}</span>
            </div>
            <div>
              <span className="text-gray-500">Speed:</span>
              <span className="ml-2 font-medium">{selectedModel.speed}</span>
            </div>
            <div>
              <span className="text-gray-500">Quality:</span>
              <span className="ml-2 font-medium">{selectedModel.quality}</span>
            </div>
          </div>

          {selectedModel.hasVision && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded p-3">
              <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
                <Image className="h-4 w-4" />
                Image Analysis Capabilities
              </div>
              <p className="text-green-700 text-xs mt-1">
                This model can analyze product images to automatically generate descriptions, identify materials, colors, and styling details.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Connection Test */}
      {formData.aiProvider && formData.aiApiKey && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={testConnection}
            disabled={testingConnection || loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testingConnection ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {testingConnection ? 'Testing Connection...' : 'Test AI Connection'}
          </button>

          {connectionStatus && (
            <div className={`p-3 rounded-md ${connectionStatus.success
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
              {connectionStatus.message}
            </div>
          )}
        </div>
      )}
    </div>
  )
}