// =====================================
// AI Content Generation Types & Interfaces
// src/types/ai.ts
// =====================================

export type AIProvider = 'openai' | 'gemini' | 'claude' | 'mistral' | 'openrouter'

export type ContentType = 'short_description' | 'product_description' | 'seo_content' | 'category_description' | 'social_caption'

export type ToneType = 'elegant' | 'casual' | 'professional' | 'playful' | 'informative' | 'luxurious' | 'friendly'

export interface AIGenerationRequest {
  type: ContentType
  context: ProductContext
  options?: AIGenerationOptions
}

export interface ProductContext {
  name: string
  category?: string
  price?: number
  currency?: string
  materials?: string[]
  colors?: string[]
  images?: string[]
  tags?: string[]
  userInput?: UserInput
}

export interface UserInput {
  fabricType?: string
  occasion?: string
  specialFeatures?: string
  craftmanship?: string
  careInstructions?: string
  targetKeywords?: string
  customPrompt?: string
  brandVoice?: string
}

export interface AIGenerationOptions {
  tone?: ToneType
  maxTokens?: number
  temperature?: number
  customPrompt?: string
  length?: 'short' | 'medium' | 'long'
  includeKeywords?: string[]
  targetAudience?: string
}

export interface AIResponse {
  success: boolean
  content?: any
  error?: string
  provider?: string
  model?: string
  usage?: UsageInfo
  metadata?: ResponseMetadata
}

export interface UsageInfo {
  tokens: number
  cost?: number
  model: string
  processingTime?: number
}

export interface ResponseMetadata {
  requestId?: string
  timestamp: Date
  retryCount?: number
  fallbackUsed?: boolean
}

export interface SEOContent {
  title: string
  description: string
  keywords?: string[]
}

export interface SocialContent {
  caption: string
  hashtags?: string[]
  platform?: 'instagram' | 'facebook' | 'twitter' | 'pinterest'
}

export interface BulkGenerationRequest {
  productIds: string[]
  type: ContentType
  options?: AIGenerationOptions
  batchSize?: number
}

export interface BulkGenerationResponse {
  success: number
  failed: number
  total: number
  results: BulkGenerationResult[]
  summary: BulkGenerationSummary
}

export interface BulkGenerationResult {
  productId: string
  success: boolean
  content?: any
  error?: string
  processingTime?: number
}

export interface BulkGenerationSummary {
  totalTokensUsed: number
  estimatedCost: number
  averageProcessingTime: number
  failureReasons: { [reason: string]: number }
}

// Provider-specific configurations
export interface ProviderConfig {
  name: string
  baseUrl: string
  headers: (apiKey: string) => Record<string, string>
  models: ModelConfig[]
  rateLimits: RateLimitConfig
  pricing: PricingConfig
}

export interface ModelConfig {
  id: string
  name: string
  maxTokens: number
  costPer1kTokens: number
  capabilities: ModelCapability[]
}

export type ModelCapability = 'text_generation' | 'json_mode' | 'function_calling' | 'vision'

export interface RateLimitConfig {
  requestsPerMinute: number
  tokensPerMinute: number
  burstLimit?: number
}

export interface PricingConfig {
  inputTokenCost: number  // per 1k tokens
  outputTokenCost: number // per 1k tokens
  currency: string
}

// Content templates and prompts
export interface ContentTemplate {
  name: string
  type: ContentType
  prompt: string
  variables: string[]
  defaultOptions: Partial<AIGenerationOptions>
}

export interface PromptTemplate {
  system: string
  user: string
  examples?: PromptExample[]
}

export interface PromptExample {
  input: string
  output: string
}

// Error types for better error handling
export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: AIProvider,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'AIProviderError'
  }
}

export class AIRateLimitError extends AIProviderError {
  constructor(provider: AIProvider, retryAfter?: number) {
    super(`Rate limit exceeded for ${provider}`, provider, 429, true)
    this.name = 'AIRateLimitError'
    this.retryAfter = retryAfter
  }
  
  retryAfter?: number
}

export class AIQuotaExceededError extends AIProviderError {
  constructor(provider: AIProvider) {
    super(`API quota exceeded for ${provider}`, provider, 402, false)
    this.name = 'AIQuotaExceededError'
  }
}

export class AIContentFilterError extends AIProviderError {
  constructor(provider: AIProvider, reason: string) {
    super(`Content filtered by ${provider}: ${reason}`, provider, 400, false)
    this.name = 'AIContentFilterError'
  }
}

// Configuration constants
export const AI_PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }),
    models: [
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        maxTokens: 16384,
        costPer1kTokens: 0.15,
        capabilities: ['text_generation', 'json_mode']
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        maxTokens: 128000,
        costPer1kTokens: 2.50,
        capabilities: ['text_generation', 'json_mode', 'vision']
      }
    ],
    rateLimits: {
      requestsPerMinute: 500,
      tokensPerMinute: 200000
    },
    pricing: {
      inputTokenCost: 0.15,
      outputTokenCost: 0.60,
      currency: 'USD'
    }
  },
  gemini: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    headers: (apiKey: string) => ({
      'Content-Type': 'application/json'
    }),
    models: [
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        maxTokens: 8192,
        costPer1kTokens: 0.075,
        capabilities: ['text_generation', 'vision']
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        maxTokens: 32768,
        costPer1kTokens: 1.25,
        capabilities: ['text_generation', 'vision']
      }
    ],
    rateLimits: {
      requestsPerMinute: 60,
      tokensPerMinute: 32000
    },
    pricing: {
      inputTokenCost: 0.075,
      outputTokenCost: 0.30,
      currency: 'USD'
    }
  },
  claude: {
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    headers: (apiKey: string) => ({
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    }),
    models: [
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        maxTokens: 4096,
        costPer1kTokens: 0.25,
        capabilities: ['text_generation']
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        maxTokens: 8192,
        costPer1kTokens: 3.00,
        capabilities: ['text_generation', 'vision']
      }
    ],
    rateLimits: {
      requestsPerMinute: 50,
      tokensPerMinute: 40000
    },
    pricing: {
      inputTokenCost: 0.25,
      outputTokenCost: 1.25,
      currency: 'USD'
    }
  },
  mistral: {
    name: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1',
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }),
    models: [
      {
        id: 'mistral-small-latest',
        name: 'Mistral Small',
        maxTokens: 32768,
        costPer1kTokens: 1.00,
        capabilities: ['text_generation', 'json_mode']
      },
      {
        id: 'mistral-large-latest',
        name: 'Mistral Large',
        maxTokens: 128000,
        costPer1kTokens: 4.00,
        capabilities: ['text_generation', 'json_mode']
      }
    ],
    rateLimits: {
      requestsPerMinute: 60,
      tokensPerMinute: 60000
    },
    pricing: {
      inputTokenCost: 1.00,
      outputTokenCost: 3.00,
      currency: 'USD'
    }
  },
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Ecommerce AI Content Generator'
    }),
    models: [
      {
        id: 'meta-llama/llama-3.1-8b-instruct:free',
        name: 'Llama 3.1 8B (Free)',
        maxTokens: 8000,
        costPer1kTokens: 0.00,
        capabilities: ['text_generation']
      },
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet (via OpenRouter)',
        maxTokens: 8192,
        costPer1kTokens: 3.00,
        capabilities: ['text_generation']
      }
    ],
    rateLimits: {
      requestsPerMinute: 20,
      tokensPerMinute: 20000
    },
    pricing: {
      inputTokenCost: 0.00, // Varies by model
      outputTokenCost: 0.00, // Varies by model
      currency: 'USD'
    }
  }
}

// Content templates for different types
export const CONTENT_TEMPLATES: Record<string, ContentTemplate> = {
  SHORT_DESCRIPTION: {
    name: 'Short Product Description',
    type: 'short_description',
    prompt: `Write a compelling 30-40 word product description for "{name}".
    
Focus on: style, quality, occasion, and appeal.
Use {tone} tone.
Materials: {materials}
Colors: {colors}

Write only the description, no explanations.`,
    variables: ['name', 'tone', 'materials', 'colors'],
    defaultOptions: {
      tone: 'elegant',
      maxTokens: 80
    }
  },
  
  PRODUCT_DESCRIPTION: {
    name: 'Detailed Product Description',
    type: 'product_description',
    prompt: `Write a detailed 100-150 word product description for "{name}".

Product: {name}
Category: {category}
Materials: {materials}
Colors: {colors}
Price: {price}

Instructions:
- Use {tone} tone
- Focus on quality, style, and cultural significance
- Highlight unique features and craftsmanship
- Appeal to customers who appreciate authentic ethnic wear
- 100-150 words exactly
- No explanations or meta-commentary`,
    variables: ['name', 'category', 'materials', 'colors', 'price', 'tone'],
    defaultOptions: {
      tone: 'elegant',
      maxTokens: 200
    }
  },
  
  SEO_CONTENT: {
    name: 'SEO Title and Meta Description',
    type: 'seo_content',
    prompt: `Generate SEO content for "{name}".

Product: {name}
Category: {category}
Keywords: {keywords}

Create:
1. SEO Title (50-60 characters, keyword-rich)
2. Meta Description (150-160 characters, compelling)

Respond ONLY with valid JSON:
{
  "title": "SEO title here",
  "description": "Meta description here"
}`,
    variables: ['name', 'category', 'keywords'],
    defaultOptions: {
      maxTokens: 150
    }
  },
  
  SOCIAL_CAPTION: {
    name: 'Social Media Caption',
    type: 'social_caption',
    prompt: `Create an engaging social media caption for "{name}".

Product: {name}
Category: {category}
Tone: {tone}
Platform: Instagram

Include:
- Compelling description (50-80 words)
- Relevant emojis
- 3-5 hashtags

Format as engaging social post.`,
    variables: ['name', 'category', 'tone'],
    defaultOptions: {
      tone: 'friendly',
      maxTokens: 120
    }
  }
}

// Default fallback content
export const FALLBACK_CONTENT = {
  SHORT_DESCRIPTION: 'Beautiful traditional wear crafted with authentic designs and premium materials.',
  PRODUCT_DESCRIPTION: 'Discover this exquisite piece of traditional wear, carefully crafted with attention to detail and authentic designs. Made with premium quality materials, this garment combines cultural heritage with contemporary style. Perfect for special occasions, festivals, and celebrations. Experience the elegance and comfort that comes with authentic craftsmanship.',
  SEO_CONTENT: {
    title: 'Premium Traditional Wear - Authentic Designs',
    description: 'Discover beautiful traditional clothing with authentic designs and premium quality materials. Perfect for special occasions and cultural celebrations.'
  }
}

// Validation schemas
export interface AIRequestValidation {
  requiredFields: string[]
  optionalFields: string[]
  typeValidation: Record<string, string>
}

export const AI_REQUEST_VALIDATION: Record<ContentType, AIRequestValidation> = {
  short_description: {
    requiredFields: ['context.name'],
    optionalFields: ['context.category', 'context.materials', 'options.tone'],
    typeValidation: {
      'context.name': 'string',
      'context.category': 'string',
      'options.tone': 'string'
    }
  },
  product_description: {
    requiredFields: ['context.name'],
    optionalFields: ['context.category', 'context.price', 'context.materials', 'context.colors'],
    typeValidation: {
      'context.name': 'string',
      'context.price': 'number',
      'context.materials': 'array'
    }
  },
  seo_content: {
    requiredFields: ['context.name'],
    optionalFields: ['context.category', 'context.userInput.targetKeywords'],
    typeValidation: {
      'context.name': 'string',
      'context.category': 'string'
    }
  },
  category_description: {
    requiredFields: ['context.name'],
    optionalFields: ['context.category'],
    typeValidation: {
      'context.name': 'string'
    }
  },
  social_caption: {
    requiredFields: ['context.name'],
    optionalFields: ['context.category', 'options.tone'],
    typeValidation: {
      'context.name': 'string',
      'options.tone': 'string'
    }
  }
}