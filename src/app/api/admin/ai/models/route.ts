// =====================================
// Enhanced Models API with Vision Detection
// src/app/api/admin/ai/models/route.ts
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

interface AIModel {
  value: string
  label: string
  recommended?: boolean
  hasVision?: boolean
  description?: string
  pricing?: 'free' | 'paid' | 'credits'
  maxTokens?: number
}

// Vision-capable models database
const VISION_MODELS = new Set([
  // OpenAI
  'gpt-4o',
  'gpt-4o-mini', 
  'gpt-4-vision-preview',
  'gpt-4-turbo',
  
  // Gemini
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-pro-vision',
  
  // Claude
  'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet-20240620',
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
  
  // OpenRouter variants
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'openai/gpt-4-vision-preview',
  'google/gemini-flash-1.5',
  'google/gemini-pro-1.5',
  'google/gemini-pro-vision',
  'anthropic/claude-3-5-sonnet',
  'anthropic/claude-3-opus',
  'anthropic/claude-3-sonnet',
  'anthropic/claude-3-haiku'
])

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider, apiKey } = await request.json()

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }

    let models: AIModel[] = []

    try {
      switch (provider) {
        case 'openai':
          models = await fetchOpenAIModels(apiKey)
          break
        case 'gemini':
          models = await fetchGeminiModels(apiKey)
          break
        case 'claude':
          models = await fetchClaudeModels(apiKey)
          break
        case 'mistral':
          models = await fetchMistralModels(apiKey)
          break
        case 'openrouter':
          models = await fetchOpenRouterModels(apiKey)
          break
        default:
          return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
      }

      // Enhance models with vision capabilities and other metadata
      const enhancedModels = models.map(model => ({
        ...model,
        hasVision: VISION_MODELS.has(model.value),
        description: getModelDescription(provider, model.value, model.description),
        pricing: getModelPricing(provider, model.value),
        recommended: isRecommendedModel(provider, model.value)
      }))

      // Sort models: recommended first, then vision-capable, then alphabetical
      enhancedModels.sort((a, b) => {
        if (a.recommended !== b.recommended) return a.recommended ? -1 : 1
        if (a.hasVision !== b.hasVision) return a.hasVision ? -1 : 1
        return a.label.localeCompare(b.label)
      })

      return NextResponse.json({
        success: true,
        models: enhancedModels,
        provider,
        visionModelsAvailable: enhancedModels.some(m => m.hasVision)
      })

    } catch (error) {
      console.error(`Error fetching ${provider} models:`, error)
      
      // Return static fallback models on API error
      const staticModels = getStaticModels(provider)
      return NextResponse.json({
        success: true,
        models: staticModels,
        provider,
        fallback: true,
        visionModelsAvailable: staticModels.some(m => m.hasVision)
      })
    }

  } catch (error) {
    console.error('Models API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}

// OpenAI Models
async function fetchOpenAIModels(apiKey: string): Promise<AIModel[]> {
  if (!apiKey) throw new Error('API key required')

  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  
  // Filter for chat/completion models only
  const chatModels = data.data
    ?.filter((model: any) => 
      model.id.includes('gpt-') && 
      !model.id.includes('instruct') &&
      !model.id.includes('embedding') &&
      !model.id.includes('tts') &&
      !model.id.includes('whisper')
    )
    .map((model: any) => ({
      value: model.id,
      label: formatModelName(model.id),
      maxTokens: getModelMaxTokens('openai', model.id)
    }))
    .sort((a: AIModel, b: AIModel) => b.label.localeCompare(a.label)) || []

  return chatModels
}

// Gemini Models
async function fetchGeminiModels(apiKey: string): Promise<AIModel[]> {
  if (!apiKey) throw new Error('API key required')

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  
  const models = data.models
    ?.filter((model: any) => 
      model.name.includes('gemini') && 
      model.supportedGenerationMethods?.includes('generateContent')
    )
    .map((model: any) => ({
      value: model.name.split('/').pop(),
      label: formatModelName(model.displayName || model.name),
      maxTokens: model.outputTokenLimit || 8192
    })) || []

  return models
}

// Claude Models  
async function fetchClaudeModels(apiKey: string): Promise<AIModel[]> {
  // Claude doesn't have a public models endpoint, return static list
  return getStaticModels('claude')
}

// Mistral Models
async function fetchMistralModels(apiKey: string): Promise<AIModel[]> {
  if (!apiKey) throw new Error('API key required')

  const response = await fetch('https://api.mistral.ai/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Mistral API error: ${response.status}`)
  }

  const data = await response.json()
  
  const models = data.data
    ?.map((model: any) => ({
      value: model.id,
      label: formatModelName(model.id),
      maxTokens: model.max_context_length || 32768
    }))
    .sort((a: AIModel, b: AIModel) => {
      if (a.value.includes('small')) return -1
      if (b.value.includes('small')) return 1
      return a.label.localeCompare(b.label)
    }) || []

  return models
}

// OpenRouter Models
async function fetchOpenRouterModels(apiKey: string): Promise<AIModel[]> {
  if (!apiKey) throw new Error('API key required')

  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`)
  }

  const data = await response.json()
  
  // Filter for popular and reliable models
  const popularModels = data.data
    ?.filter((model: any) => {
      const id = model.id.toLowerCase()
      return (
        id.includes('gpt-') ||
        id.includes('claude-') ||
        id.includes('gemini-') ||
        id.includes('llama-3') ||
        id.includes('phi-3') ||
        (id.includes('mistral') && !id.includes('7b'))
      ) && !id.includes('instruct-') && !id.includes('-base')
    })
    .map((model: any) => ({
      value: model.id,
      label: `${formatModelName(model.name || model.id)}${model.pricing?.prompt === '0' ? ' (Free)' : ''}`,
      maxTokens: model.context_length || 8192,
      pricing: model.pricing?.prompt === '0' ? 'free' : 'paid'
    }))
    .sort((a: AIModel, b: AIModel) => {
      // Free models first, then by name
      if (a.pricing !== b.pricing) {
        return a.pricing === 'free' ? -1 : 1
      }
      return a.label.localeCompare(b.label)
    }) || []

  return popularModels
}

// Static fallback models
function getStaticModels(provider: string): AIModel[] {
  const staticModels: Record<string, AIModel[]> = {
    openai: [
      {
        value: 'gpt-4o-mini',
        label: 'GPT-4o Mini',
        hasVision: true,
        recommended: true,
        pricing: 'paid',
        maxTokens: 128000
      },
      {
        value: 'gpt-4o',
        label: 'GPT-4o',
        hasVision: true,
        pricing: 'paid',
        maxTokens: 128000
      },
      {
        value: 'gpt-3.5-turbo',
        label: 'GPT-3.5 Turbo',
        hasVision: false,
        pricing: 'paid',
        maxTokens: 16385
      }
    ],
    gemini: [
      {
        value: 'gemini-1.5-flash',
        label: 'Gemini 1.5 Flash',
        hasVision: true,
        recommended: true,
        pricing: 'free',
        maxTokens: 8192
      },
      {
        value: 'gemini-1.5-pro',
        label: 'Gemini 1.5 Pro',
        hasVision: true,
        pricing: 'paid',
        maxTokens: 32768
      },
      {
        value: 'gemini-pro',
        label: 'Gemini Pro (Legacy)',
        hasVision: false,
        pricing: 'free',
        maxTokens: 32768
      }
    ],
    claude: [
      {
        value: 'claude-3-5-sonnet-20241022',
        label: 'Claude 3.5 Sonnet',
        hasVision: true,
        recommended: true,
        pricing: 'paid',
        maxTokens: 8192
      },
      {
        value: 'claude-3-haiku-20240307',
        label: 'Claude 3 Haiku',
        hasVision: true,
        pricing: 'paid',
        maxTokens: 4096
      },
      {
        value: 'claude-3-opus-20240229',
        label: 'Claude 3 Opus',
        hasVision: true,
        pricing: 'paid',
        maxTokens: 4096
      }
    ],
    mistral: [
      {
        value: 'mistral-small-latest',
        label: 'Mistral Small',
        hasVision: false,
        recommended: true,
        pricing: 'paid',
        maxTokens: 32768
      },
      {
        value: 'mistral-medium-latest',
        label: 'Mistral Medium',
        hasVision: false,
        pricing: 'paid',
        maxTokens: 32768
      },
      {
        value: 'mistral-large-latest',
        label: 'Mistral Large',
        hasVision: false,
        pricing: 'paid',
        maxTokens: 128000
      }
    ],
    openrouter: [
      {
        value: 'openai/gpt-4o-mini',
        label: 'GPT-4o Mini (via OpenRouter)',
        hasVision: true,
        recommended: true,
        pricing: 'paid',
        maxTokens: 128000
      },
      {
        value: 'google/gemini-flash-1.5',
        label: 'Gemini Flash 1.5 (via OpenRouter)',
        hasVision: true,
        pricing: 'paid',
        maxTokens: 8192
      },
      {
        value: 'anthropic/claude-3-haiku',
        label: 'Claude 3 Haiku (via OpenRouter)',
        hasVision: true,
        pricing: 'paid',
        maxTokens: 4096
      },
      {
        value: 'meta-llama/llama-3.2-3b-instruct:free',
        label: 'Llama 3.2 3B (Free)',
        hasVision: false,
        pricing: 'free',
        maxTokens: 8000
      },
      {
        value: 'microsoft/phi-3-mini-128k-instruct:free',
        label: 'Phi-3 Mini (Free)',
        hasVision: false,
        pricing: 'free',
        maxTokens: 8000
      }
    ]
  }

  return staticModels[provider] || []
}

// Helper functions
function formatModelName(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/Gpt/g, 'GPT')
    .replace(/Api/g, 'API')
    .replace(/Ai/g, 'AI')
    .replace(/Llm/g, 'LLM')
}

function getModelDescription(provider: string, modelId: string, existingDescription?: string): string {
  if (existingDescription) return existingDescription

  const descriptions: Record<string, Record<string, string>> = {
    openai: {
      'gpt-4o-mini': 'Fast, cost-effective with excellent image analysis capabilities',
      'gpt-4o': 'Most capable model with advanced image understanding and reasoning',
      'gpt-3.5-turbo': 'Balanced performance and cost, text-only'
    },
    gemini: {
      'gemini-1.5-flash': 'Fast and free with excellent image analysis',
      'gemini-1.5-pro': 'High-quality content with advanced vision capabilities',
      'gemini-pro': 'Legacy model, text-only'
    },
    claude: {
      'claude-3-5-sonnet-20241022': 'Latest model with excellent image understanding',
      'claude-3-haiku-20240307': 'Fast and affordable with vision support',
      'claude-3-opus-20240229': 'Highest quality with advanced image analysis'
    },
    mistral: {
      'mistral-small-latest': 'Cost-effective European model, text-only',
      'mistral-medium-latest': 'Balanced performance, text-only',
      'mistral-large-latest': 'High performance, text-only'
    }
  }

  return descriptions[provider]?.[modelId] || 'Good for general content generation'
}

function getModelPricing(provider: string, modelId: string): 'free' | 'paid' | 'credits' {
  const freeModels = new Set([
    'gemini-1.5-flash',
    'gemini-pro',
    'meta-llama/llama-3.2-3b-instruct:free',
    'microsoft/phi-3-mini-128k-instruct:free'
  ])

  return freeModels.has(modelId) ? 'free' : 'paid'
}

function isRecommendedModel(provider: string, modelId: string): boolean {
  const recommended = new Set([
    'gpt-4o-mini',
    'gemini-1.5-flash',
    'claude-3-5-sonnet-20241022',
    'mistral-small-latest',
    'openai/gpt-4o-mini',
    'meta-llama/llama-3.2-3b-instruct:free'
  ])

  return recommended.has(modelId)
}

function getModelMaxTokens(provider: string, modelId: string): number {
  const tokenLimits: Record<string, Record<string, number>> = {
    openai: {
      'gpt-4o': 128000,
      'gpt-4o-mini': 128000,
      'gpt-3.5-turbo': 16385
    },
    gemini: {
      'gemini-1.5-flash': 8192,
      'gemini-1.5-pro': 32768,
      'gemini-pro': 32768
    },
    claude: {
      'claude-3-5-sonnet-20241022': 8192,
      'claude-3-haiku-20240307': 4096,
      'claude-3-opus-20240229': 4096
    }
  }

  return tokenLimits[provider]?.[modelId] || 8192
}