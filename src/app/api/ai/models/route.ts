// /src/app/api/admin/ai/models/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

interface AIModel {
  value: string
  label: string
  recommended?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider, apiKey } = await request.json()

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Provider and API key are required' }, { status: 400 })
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

      return NextResponse.json({ 
        models,
        success: true 
      })

    } catch (error) {
      console.error(`Error fetching ${provider} models:`, error)
      
      // Return static fallback models if API fails
      const fallbackModels = getStaticFallbackModels(provider)
      
      return NextResponse.json({ 
        models: fallbackModels,
        success: true,
        warning: 'Using fallback models due to API error'
      })
    }

  } catch (error) {
    console.error('Error in models API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// OpenAI Models
async function fetchOpenAIModels(apiKey: string): Promise<AIModel[]> {
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
  
  // Filter for content generation models and sort by preference
  const contentModels = data.data
    .filter((model: any) => 
      model.id.includes('gpt-4') || 
      model.id.includes('gpt-3.5') ||
      model.id.includes('gpt-4o')
    )
    .map((model: any) => ({
      value: model.id,
      label: formatModelName(model.id),
      recommended: model.id === 'gpt-4o-mini'
    }))
    .sort((a: AIModel, b: AIModel) => {
      if (a.recommended) return -1
      if (b.recommended) return 1
      return a.label.localeCompare(b.label)
    })

  return contentModels.slice(0, 10) // Limit to top 10 models
}

// Google Gemini Models
async function fetchGeminiModels(apiKey: string): Promise<AIModel[]> {
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
      value: model.name.replace('models/', ''),
      label: formatModelName(model.displayName || model.name),
      recommended: model.name.includes('gemini-1.5-flash')
    }))
    .sort((a: AIModel, b: AIModel) => {
      if (a.recommended) return -1
      if (b.recommended) return 1
      return a.label.localeCompare(b.label)
    }) || []

  return models.slice(0, 10)
}

// Anthropic Claude Models
async function fetchClaudeModels(apiKey: string): Promise<AIModel[]> {
  // Claude doesn't have a public models endpoint, so we return known models
  // But we can test the API key validity
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'test' }]
    })
  })

  // If API key is valid, return known models
  if (response.status !== 401 && response.status !== 403) {
    return [
      { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', recommended: true },
      { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' }
    ]
  }

  throw new Error('Invalid Claude API key')
}

// Mistral Models
async function fetchMistralModels(apiKey: string): Promise<AIModel[]> {
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
      recommended: model.id.includes('mistral-small')
    }))
    .sort((a: AIModel, b: AIModel) => {
      if (a.recommended) return -1
      if (b.recommended) return 1
      return a.label.localeCompare(b.label)
    }) || []

  return models
}

// OpenRouter Models
async function fetchOpenRouterModels(apiKey: string): Promise<AIModel[]> {
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
  
  // Filter for popular models and free options
  const popularModels = data.data
    ?.filter((model: any) => 
      model.id.includes('gpt-') ||
      model.id.includes('claude-') ||
      model.id.includes('gemini-') ||
      model.id.includes('llama-') ||
      model.id.includes('mistral-') ||
      model.id.includes('phi-')
    )
    .map((model: any) => ({
      value: model.id,
      label: `${formatModelName(model.name || model.id)}${model.pricing?.prompt === '0' ? ' (Free)' : ''}`,
      recommended: model.pricing?.prompt === '0' || model.id.includes('gpt-4o-mini')
    }))
    .sort((a: AIModel, b: AIModel) => {
      // Sort free models first, then by name
      const aFree = a.label.includes('(Free)')
      const bFree = b.label.includes('(Free)')
      
      if (aFree && !bFree) return -1
      if (!aFree && bFree) return 1
      if (a.recommended && !b.recommended) return -1
      if (!a.recommended && b.recommended) return 1
      
      return a.label.localeCompare(b.label)
    }) || []

  return popularModels.slice(0, 15) // Top 15 models
}

// Helper function to format model names
function formatModelName(modelId: string): string {
  return modelId
    .replace(/^models\//, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/Gpt/g, 'GPT')
    .replace(/Api/g, 'API')
    .replace(/Ai/g, 'AI')
    .replace(/\d{8}/g, '') // Remove date suffixes
    .trim()
}

// Static fallback models when API fails
function getStaticFallbackModels(provider: string): AIModel[] {
  const fallbacks: Record<string, AIModel[]> = {
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

  return fallbacks[provider] || []
}