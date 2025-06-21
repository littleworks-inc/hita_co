import { db } from '@/lib/db'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type AIProvider = 'openai' | 'gemini' | 'claude' | 'mistral' | 'openrouter'

export interface AIGenerationOptions {
  contentType: 'product_description' | 'seo_meta' | 'social_caption' | 'category_description' | 'custom'
  tone?: 'professional' | 'casual' | 'elegant' | 'playful' | 'informative'
  length?: 'short' | 'medium' | 'long'
  language?: string
  customPrompt?: string
  maxTokens?: number
  temperature?: number
}

export interface ProductContext {
  name: string
  category?: string
  materials?: string[]
  colors?: string[]
  description?: string
  price?: number
  currency?: string
  origin?: string
  targetAudience?: string
}

export interface AIGenerationResult {
  success: boolean
  content?: string
  error?: string
  provider?: AIProvider
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

// ============================================================================
// CONTENT TEMPLATES
// ============================================================================

const CONTENT_TEMPLATES = {
  product_description: {
    short: `Write a compelling 50-word product description for this {category} item called "{name}". Focus on key features, materials, and appeal to customers interested in authentic Indian products. Make it sales-focused and highlight quality.`,
    
    medium: `Create a detailed product description (100-150 words) for "{name}", a {category} item. Include information about materials, craftsmanship, cultural significance, and styling suggestions. Target customers who appreciate authentic Indian fashion and quality handmade products.`,
    
    long: `Write a comprehensive product description (200-300 words) for "{name}". This is a premium {category} item. Include detailed information about materials, traditional craftsmanship, cultural background, styling tips, care instructions, and why this piece is special. Appeal to customers who value authentic Indian culture and high-quality products.`
  },

  seo_meta: {
    title: `Generate an SEO-optimized page title (under 60 characters) for the product "{name}" - a {category} item. Include relevant keywords for Indian ethnic wear.`,
    
    description: `Create an SEO meta description (150-160 characters) for "{name}", a {category}. Focus on key benefits, materials, and target customers searching for authentic Indian products.`
  },

  social_caption: {
    instagram: `Write an engaging Instagram caption for "{name}" - a beautiful {category}. Include relevant hashtags, emoji, and appeal to fashion-conscious customers who love Indian ethnic wear. Keep it authentic and inspiring.`,
    
    facebook: `Create a Facebook post for "{name}" showcasing this elegant {category}. Write in a conversational tone that highlights the product's beauty, quality, and cultural significance. Encourage engagement.`,
    
    twitter: `Write a compelling Twitter post (under 280 characters) for "{name}" - a stunning {category}. Include relevant hashtags and highlight what makes this piece special.`
  },

  category_description: `Write an engaging category description for "{name}" category. Explain what products belong here, their cultural significance, styling tips, and why customers should explore this collection. Make it informative and inspiring (100-200 words).`
}

// ============================================================================
// AI PROVIDER CONFIGURATIONS
// ============================================================================

const PROVIDER_CONFIGS = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    })
  },
  
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-1.5-flash',
    headers: (apiKey: string) => ({
      'Content-Type': 'application/json'
    })
  },
  
  claude: {
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-sonnet-20241022',
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    })
  },
  
  mistral: {
    baseUrl: 'https://api.mistral.ai/v1',
    model: 'mistral-small-latest',
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    })
  },
  
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.1-8b-instruct:free', // Free model, can be configured
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Hita&Co eCommerce Platform'
    })
  }
}

// ============================================================================
// CORE AI SERVICE
// ============================================================================

class AIService {
  private static instance: AIService
  private storeSettings: any = null
  private settingsCache: { data: any; timestamp: number } | null = null
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  /**
   * Get store settings with caching
   */
  private async getStoreSettings(): Promise<any> {
    const now = Date.now()
    
    // Return cached settings if still valid
    if (this.settingsCache && (now - this.settingsCache.timestamp) < this.CACHE_TTL) {
      return this.settingsCache.data
    }

    try {
      const settings = await db.storeSetting.findFirst()
      
      this.settingsCache = {
        data: settings,
        timestamp: now
      }
      
      return settings
    } catch (error) {
      console.error('Failed to fetch store settings:', error)
      throw new Error('Unable to access AI configuration')
    }
  }

  /**
   * Check if AI is configured and available
   */
  async isAIConfigured(): Promise<{ configured: boolean; provider?: AIProvider; error?: string }> {
    try {
      const settings = await this.getStoreSettings()
      
      if (!settings?.aiProvider || !settings?.aiApiKey) {
        return {
          configured: false,
          error: 'AI provider or API key not configured in store settings'
        }
      }

      const provider = settings.aiProvider as AIProvider
      
      if (!PROVIDER_CONFIGS[provider]) {
        return {
          configured: false,
          error: `Unsupported AI provider: ${provider}`
        }
      }

      return {
        configured: true,
        provider
      }
    } catch (error) {
      return {
        configured: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Build prompt with context and template
   */
  private buildPrompt(
    options: AIGenerationOptions,
    context?: ProductContext
  ): string {
    let prompt = ''

    // Use custom prompt if provided
    if (options.customPrompt) {
      prompt = options.customPrompt
    } else {
      // Build prompt from template
      const { contentType, length = 'medium' } = options
      
      switch (contentType) {
        case 'product_description':
          prompt = CONTENT_TEMPLATES.product_description[length]
          break
        case 'seo_meta':
          prompt = CONTENT_TEMPLATES.seo_meta.description
          break
        case 'social_caption':
          prompt = CONTENT_TEMPLATES.social_caption.instagram
          break
        case 'category_description':
          prompt = CONTENT_TEMPLATES.category_description
          break
        default:
          prompt = 'Generate helpful content based on the provided information.'
      }
    }

    // Replace placeholders with context
    if (context) {
      prompt = prompt.replace(/\{name\}/g, context.name || 'this product')
      prompt = prompt.replace(/\{category\}/g, context.category || 'product')
      prompt = prompt.replace(/\{materials\}/g, context.materials?.join(', ') || '')
      prompt = prompt.replace(/\{colors\}/g, context.colors?.join(', ') || '')
      prompt = prompt.replace(/\{price\}/g, context.price ? `${context.price} ${context.currency || 'USD'}` : '')
    }

    // Add tone guidance
    if (options.tone) {
      const toneGuidance = {
        professional: 'Use a professional, informative tone.',
        casual: 'Use a casual, friendly tone.',
        elegant: 'Use an elegant, sophisticated tone.',
        playful: 'Use a playful, engaging tone.',
        informative: 'Use an informative, educational tone.'
      }
      prompt += ` ${toneGuidance[options.tone]}`
    }

    return prompt
  }

  /**
   * Generate content using OpenAI
   */
  private async generateWithOpenAI(
    prompt: string,
    apiKey: string,
    options: AIGenerationOptions
  ): Promise<AIGenerationResult> {
    const config = PROVIDER_CONFIGS.openai
    
    const requestBody = {
      model: config.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert copywriter specializing in Indian ethnic wear and traditional products. Create compelling, authentic content that resonates with customers who appreciate quality and cultural heritage.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.7
    }

    try {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: config.headers(apiKey),
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error?.message || `OpenAI API error: ${response.status}`
        }
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        return {
          success: false,
          error: 'No content generated by OpenAI'
        }
      }

      return {
        success: true,
        content: content.trim(),
        provider: 'openai',
        usage: data.usage
      }
    } catch (error) {
      return {
        success: false,
        error: `OpenAI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Generate content using Google Gemini
   */
  private async generateWithGemini(
    prompt: string,
    apiKey: string,
    options: AIGenerationOptions
  ): Promise<AIGenerationResult> {
    const config = PROVIDER_CONFIGS.gemini
    
    const requestBody = {
      contents: [{
        parts: [{
          text: `You are an expert copywriter specializing in Indian ethnic wear and traditional products. ${prompt}`
        }]
      }],
      generationConfig: {
        maxOutputTokens: options.maxTokens || 500,
        temperature: options.temperature || 0.7
      }
    }

    try {
      const response = await fetch(
        `${config.baseUrl}/models/${config.model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: config.headers(apiKey),
          body: JSON.stringify(requestBody)
        }
      )

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error?.message || `Gemini API error: ${response.status}`
        }
      }

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!content) {
        return {
          success: false,
          error: 'No content generated by Gemini'
        }
      }

      return {
        success: true,
        content: content.trim(),
        provider: 'gemini',
        usage: data.usageMetadata
      }
    } catch (error) {
      return {
        success: false,
        error: `Gemini request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Generate content using Anthropic Claude
   */
  private async generateWithClaude(
    prompt: string,
    apiKey: string,
    options: AIGenerationOptions
  ): Promise<AIGenerationResult> {
    const config = PROVIDER_CONFIGS.claude
    
    const requestBody = {
      model: config.model,
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.7,
      messages: [
        {
          role: 'user',
          content: `You are an expert copywriter specializing in Indian ethnic wear and traditional products. Create compelling, authentic content that resonates with customers who appreciate quality and cultural heritage.\n\n${prompt}`
        }
      ]
    }

    try {
      const response = await fetch(`${config.baseUrl}/messages`, {
        method: 'POST',
        headers: config.headers(apiKey),
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error?.message || `Claude API error: ${response.status}`
        }
      }

      const data = await response.json()
      const content = data.content?.[0]?.text

      if (!content) {
        return {
          success: false,
          error: 'No content generated by Claude'
        }
      }

      return {
        success: true,
        content: content.trim(),
        provider: 'claude',
        usage: data.usage
      }
    } catch (error) {
      return {
        success: false,
        error: `Claude request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Generate content using Mistral
   */
  private async generateWithMistral(
    prompt: string,
    apiKey: string,
    options: AIGenerationOptions
  ): Promise<AIGenerationResult> {
    const config = PROVIDER_CONFIGS.mistral
    
    const requestBody = {
      model: config.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert copywriter specializing in Indian ethnic wear and traditional products. Create compelling, authentic content that resonates with customers who appreciate quality and cultural heritage.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.7
    }

    try {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: config.headers(apiKey),
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error?.message || `Mistral API error: ${response.status}`
        }
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        return {
          success: false,
          error: 'No content generated by Mistral'
        }
      }

      return {
        success: true,
        content: content.trim(),
        provider: 'mistral',
        usage: data.usage
      }
    } catch (error) {
      return {
        success: false,
        error: `Mistral request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Generate content using OpenRouter
   */
  private async generateWithOpenRouter(
    prompt: string,
    apiKey: string,
    options: AIGenerationOptions
  ): Promise<AIGenerationResult> {
    const config = PROVIDER_CONFIGS.openrouter
    
    const requestBody = {
      model: config.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert copywriter specializing in Indian ethnic wear and traditional products. Create compelling, authentic content that resonates with customers who appreciate quality and cultural heritage.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.7
    }

    try {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: config.headers(apiKey),
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error?.message || `OpenRouter API error: ${response.status}`
        }
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        return {
          success: false,
          error: 'No content generated by OpenRouter'
        }
      }

      return {
        success: true,
        content: content.trim(),
        provider: 'openrouter',
        usage: data.usage
      }
    } catch (error) {
      return {
        success: false,
        error: `OpenRouter request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Main content generation method
   */
  async generateContent(
    options: AIGenerationOptions,
    context?: ProductContext
  ): Promise<AIGenerationResult> {
    try {
      // Check if AI is configured
      const configCheck = await this.isAIConfigured()
      if (!configCheck.configured) {
        return {
          success: false,
          error: configCheck.error
        }
      }

      const settings = await this.getStoreSettings()
      const provider = settings.aiProvider as AIProvider
      const apiKey = settings.aiApiKey

      if (!apiKey) {
        return {
          success: false,
          error: 'API key not found in store settings'
        }
      }

      // Build prompt
      const prompt = this.buildPrompt(options, context)

      // Generate content based on provider
      switch (provider) {
        case 'openai':
          return await this.generateWithOpenAI(prompt, apiKey, options)
        
        case 'gemini':
          return await this.generateWithGemini(prompt, apiKey, options)
        
        case 'claude':
          return await this.generateWithClaude(prompt, apiKey, options)
        
        case 'mistral':
          return await this.generateWithMistral(prompt, apiKey, options)
        
        case 'openrouter':
          return await this.generateWithOpenRouter(prompt, apiKey, options)
        
        default:
          return {
            success: false,
            error: `Unsupported AI provider: ${provider}`
          }
      }
    } catch (error) {
      return {
        success: false,
        error: `AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Generate product description
   */
  async generateProductDescription(
    productContext: ProductContext,
    options: Partial<AIGenerationOptions> = {}
  ): Promise<AIGenerationResult> {
    return this.generateContent({
      contentType: 'product_description',
      tone: 'elegant',
      length: 'medium',
      ...options
    }, productContext)
  }

  /**
   * Generate SEO meta description
   */
  async generateSEOMeta(
    productContext: ProductContext,
    options: Partial<AIGenerationOptions> = {}
  ): Promise<AIGenerationResult> {
    return this.generateContent({
      contentType: 'seo_meta',
      tone: 'professional',
      maxTokens: 200,
      ...options
    }, productContext)
  }

  /**
   * Generate social media caption
   */
  async generateSocialCaption(
    productContext: ProductContext,
    platform: 'instagram' | 'facebook' | 'twitter' = 'instagram',
    options: Partial<AIGenerationOptions> = {}
  ): Promise<AIGenerationResult> {
    const socialTemplates = CONTENT_TEMPLATES.social_caption
    return this.generateContent({
      contentType: 'social_caption',
      tone: 'playful',
      customPrompt: socialTemplates[platform],
      ...options
    }, productContext)
  }

  /**
   * Generate category description
   */
  async generateCategoryDescription(
    categoryName: string,
    options: Partial<AIGenerationOptions> = {}
  ): Promise<AIGenerationResult> {
    return this.generateContent({
      contentType: 'category_description',
      tone: 'informative',
      length: 'medium',
      ...options
    }, { name: categoryName, category: 'category' })
  }

  /**
   * Clear settings cache (useful when settings are updated)
   */
  clearCache(): void {
    this.settingsCache = null
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const aiService = AIService.getInstance()

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Quick helper to check if AI is available
 */
export async function isAIAvailable(): Promise<boolean> {
  const check = await aiService.isAIConfigured()
  return check.configured
}

/**
 * Get current AI provider
 */
export async function getCurrentAIProvider(): Promise<AIProvider | null> {
  const check = await aiService.isAIConfigured()
  return check.provider || null
}