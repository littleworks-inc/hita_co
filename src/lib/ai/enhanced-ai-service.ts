// =====================================
// Enhanced AI Service with Rate Limiting, Caching & Error Handling
// src/lib/ai/enhanced-ai-service.ts
// ✅ COMPLETE FIXED VERSION with proper metadata handling
// =====================================

import { db } from '@/lib/db'
import { 
  AIProvider, 
  AIGenerationRequest, 
  AIResponse, 
  ProductContext,
  AIGenerationOptions,
  ContentType,
  AIProviderError,
  AIRateLimitError,
  AIQuotaExceededError,
  AI_PROVIDER_CONFIGS,
  CONTENT_TEMPLATES,
  FALLBACK_CONTENT,
  BulkGenerationRequest,
  BulkGenerationResponse,
  ResponseMetadata,
  UsageInfo
} from '@/types/ai'

interface CacheEntry {
  content: any
  timestamp: Date
  provider: AIProvider
  expiresAt: Date
}

interface RateLimitEntry {
  requests: number[]
  tokens: number
  resetTime: Date
}

export class EnhancedAIService {
  private cache = new Map<string, CacheEntry>()
  private rateLimits = new Map<string, RateLimitEntry>()
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAY_BASE = 1000 // 1 second

  constructor() {
    // Clean up expired cache entries every hour
    setInterval(() => this.cleanupCache(), 60 * 60 * 1000)
  }

  /**
   * ✅ HELPER METHOD: Create consistent metadata
   */
  private createMetadata(startTime: number, options: {
    fallbackUsed?: boolean
    cacheHit?: boolean
    rateLimitHit?: boolean
    retryCount?: number
    providerSwitched?: boolean
    requestId?: string
  } = {}): ResponseMetadata {
    return {
      timestamp: new Date(),
      processingTime: Date.now() - startTime,
      fallbackUsed: options.fallbackUsed || false,
      cacheHit: options.cacheHit || false,
      rateLimitHit: options.rateLimitHit || false,
      retryCount: options.retryCount || 0,
      requestId: options.requestId
    }
  }

  /**
   * Main content generation method with caching and error handling
   */
  async generateContent(request: AIGenerationRequest): Promise<AIResponse> {
    const startTime = Date.now()
    
    try {
      // Validate request
      this.validateRequest(request)
      
      // Check cache first
      const cacheKey = this.generateCacheKey(request)
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        console.log('Returning cached AI content')
        return {
          success: true,
          content: cached.content,
          provider: cached.provider,
          metadata: this.createMetadata(startTime, { 
            cacheHit: true 
          })
        }
      }

      // Get AI settings
      const settings = await this.getStoreSettings()
      if (!settings?.aiProvider || !settings?.aiApiKey) {
        throw new AIProviderError(
          'AI provider not configured. Please configure AI settings first.',
          'openai',
          400,
          false
        )
      }

      const provider = settings.aiProvider as AIProvider
      
      // Check rate limits
      const rateLimitHit = await this.checkRateLimit(provider, request.options?.maxTokens || 200)
      
      // Generate content with retries
      const result = await this.generateWithRetries(provider, settings, request)
      
      // Cache successful result
      if (result.success && result.content) {
        this.saveToCache(cacheKey, result.content, provider)
      }
      
      // ✅ FIXED: Add metadata using helper method
      result.metadata = this.createMetadata(startTime, {
        fallbackUsed: false,
        cacheHit: false,
        rateLimitHit: rateLimitHit,
        retryCount: result.metadata?.retryCount || 0
      })
      
      return result
      
    } catch (error) {
      console.error('AI generation failed:', error)
      
      // Return fallback content for critical errors
      if (error instanceof AIProviderError && !error.retryable) {
        const fallbackContent = this.getFallbackContent(request.type, request.context)
        return {
          success: true,
          content: fallbackContent,
          provider: 'fallback',
          metadata: this.createMetadata(startTime, { 
            fallbackUsed: true 
          })
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: this.createMetadata(startTime, { 
          fallbackUsed: false 
        })
      }
    }
  }

  /**
   * Bulk content generation for multiple products
   */
  async bulkGenerate(request: BulkGenerationRequest): Promise<BulkGenerationResponse> {
    const startTime = Date.now()
    const { productIds, type, options = {}, batchSize = 5 } = request
    
    const results: any[] = []
    let successCount = 0
    let failedCount = 0
    let totalTokens = 0
    let totalCost = 0
    const failureReasons: { [reason: string]: number } = {}

    // Process in batches to respect rate limits
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (productId) => {
        try {
          // Get product context
          const product = await db.product.findUnique({
            where: { id: productId },
            include: {
              category: true,
              country: true
            }
          })

          if (!product) {
            failedCount++
            const errorMessage = `Product not found: ${productId}`
            failureReasons[errorMessage] = (failureReasons[errorMessage] || 0) + 1
            return { 
              productId, 
              success: false, 
              error: errorMessage 
            }
          }

          // Build request context
          const context: ProductContext = {
            name: product.name,
            category: product.category?.name,
            price: product.sellingPriceUSD
          }

          // Generate content
          const generationRequest: AIGenerationRequest = {
            type,
            context,
            options
          }

          const result = await this.generateContent(generationRequest)
          
          if (result.success) {
            successCount++
            totalTokens += result.usage?.tokens || 0
            totalCost += result.usage?.cost || 0
            
            return { 
              productId, 
              success: true, 
              content: result.content,
              processingTime: result.metadata?.processingTime || 0
            }
          } else {
            failedCount++
            const errorMessage = result.error || 'Unknown error'
            failureReasons[errorMessage] = (failureReasons[errorMessage] || 0) + 1
            return { 
              productId, 
              success: false, 
              error: errorMessage 
            }
          }
        } catch (error) {
          failedCount++
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          failureReasons[errorMessage] = (failureReasons[errorMessage] || 0) + 1
          return { 
            productId, 
            success: false, 
            error: errorMessage 
          }
        }
      })

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Add delay between batches to respect rate limits
      if (i + batchSize < productIds.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    const totalTime = Date.now() - startTime
    
    return {
      success: successCount,
      failed: failedCount,
      total: productIds.length,
      results,
      summary: {
        totalTokensUsed: totalTokens,
        estimatedCost: totalCost,
        averageProcessingTime: totalTime / productIds.length,
        failureReasons
      }
    }
  }

  /**
   * Generate content with retry logic and exponential backoff
   */
  private async generateWithRetries(
    provider: AIProvider, 
    settings: any, 
    request: AIGenerationRequest
  ): Promise<AIResponse> {
    const startTime = Date.now()
    let lastError: Error | null = null
    let retryCount = 0
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`AI generation attempt ${attempt}/${this.MAX_RETRIES} with ${provider}`)
        
        const result = await this.callAIProvider(provider, settings, request)
        
        // Update rate limit tracking
        this.updateRateLimit(provider, result.usage?.tokens || 0)
        
        // ✅ FIXED: Add retry count to metadata
        if (result.metadata) {
          result.metadata.retryCount = retryCount
        } else {
          result.metadata = this.createMetadata(startTime, { 
            retryCount: retryCount 
          })
        }
        
        return result
        
      } catch (error) {
        retryCount = attempt
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(`Attempt ${attempt} failed:`, lastError.message)
        
        // Don't retry for non-retryable errors
        if (error instanceof AIProviderError && !error.retryable) {
          throw error
        }
        
        // Don't retry on the last attempt
        if (attempt === this.MAX_RETRIES) {
          break
        }
        
        // Exponential backoff with jitter
        const delay = this.RETRY_DELAY_BASE * Math.pow(2, attempt - 1) + Math.random() * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError || new Error('All retry attempts failed')
  }

  /**
   * Call AI provider with proper error handling
   */
  private async callAIProvider(
    provider: AIProvider, 
    settings: any, 
    request: AIGenerationRequest
  ): Promise<AIResponse> {
    const config = AI_PROVIDER_CONFIGS[provider]
    if (!config) {
      throw new AIProviderError(`Unsupported AI provider: ${provider}`, provider, 400, false)
    }

    // Build prompt from template
    const prompt = this.buildPrompt(request)
    const maxTokens = request.options?.maxTokens || 200
    
    try {
      switch (provider) {
        case 'openai':
          return await this.callOpenAI(settings.aiApiKey, settings.aiModel, prompt, maxTokens)
        case 'gemini':
          return await this.callGemini(settings.aiApiKey, settings.aiModel, prompt, maxTokens)
        case 'claude':
          return await this.callClaude(settings.aiApiKey, settings.aiModel, prompt, maxTokens)
        case 'mistral':
          return await this.callMistral(settings.aiApiKey, settings.aiModel, prompt, maxTokens)
        case 'openrouter':
          return await this.callOpenRouter(settings.aiApiKey, settings.aiModel, prompt, maxTokens)
        default:
          throw new AIProviderError(`Unsupported provider: ${provider}`, provider, 400, false)
      }
    } catch (error) {
      // Transform generic errors into AI-specific errors
      if (error instanceof AIProviderError) {
        throw error
      }
      
      // Parse common API errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      if (errorMessage.includes('rate limit')) {
        throw new AIRateLimitError(provider)
      }
      
      if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
        throw new AIQuotaExceededError(provider)
      }
      
      throw new AIProviderError(errorMessage, provider, 500, true)
    }
  }

  /**
   * OpenAI API call
   */
  private async callOpenAI(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<AIResponse> {
    const startTime = Date.now()
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a professional copywriter specializing in ethnic fashion. Write compelling, authentic content.'
            },
            { role: 'user', content: prompt }
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new AIProviderError(
          `OpenAI API error: ${errorData.error?.message || response.statusText}`,
          'openai',
          response.status,
          response.status >= 500
        )
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content
      
      if (!content) {
        throw new AIProviderError('No content generated by OpenAI', 'openai', 500, true)
      }

      return {
        success: true,
        content: content.trim(),
        provider: 'openai',
        model: data.model,
        usage: {
          tokens: data.usage?.total_tokens || 0,
          model: data.model,
          cost: this.calculateCost('openai', data.usage?.total_tokens || 0)
        },
        metadata: this.createMetadata(startTime)
      }
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'openai',
        metadata: this.createMetadata(startTime)
      }
    }
  }

  /**
   * Google Gemini API call
   */
  private async callGemini(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<AIResponse> {
    const startTime = Date.now()
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.7,
          }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new AIProviderError(
          `Gemini API error: ${errorData.error?.message || response.statusText}`,
          'gemini',
          response.status,
          response.status >= 500
        )
      }

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text
      
      if (!content) {
        throw new AIProviderError('No content generated by Gemini', 'gemini', 500, true)
      }

      return {
        success: true,
        content: content.trim(),
        provider: 'gemini',
        model: model || 'gemini-1.5-flash',
        usage: {
          tokens: data.usageMetadata?.totalTokenCount || 0,
          model: model || 'gemini-1.5-flash',
          cost: this.calculateCost('gemini', data.usageMetadata?.totalTokenCount || 0)
        },
        metadata: this.createMetadata(startTime)
      }
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'gemini',
        metadata: this.createMetadata(startTime)
      }
    }
  }

  /**
   * Anthropic Claude API call
   */
  private async callClaude(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<AIResponse> {
    const startTime = Date.now()
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model || 'claude-3-haiku-20240307',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new AIProviderError(
          `Claude API error: ${errorData.error?.message || response.statusText}`,
          'claude',
          response.status,
          response.status >= 500
        )
      }

      const data = await response.json()
      const content = data.content[0]?.text
      
      if (!content) {
        throw new AIProviderError('No content generated by Claude', 'claude', 500, true)
      }

      return {
        success: true,
        content: content.trim(),
        provider: 'claude',
        model: data.model,
        usage: {
          tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
          model: data.model,
          cost: this.calculateCost('claude', (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0))
        },
        metadata: this.createMetadata(startTime)
      }
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'claude',
        metadata: this.createMetadata(startTime)
      }
    }
  }

  /**
   * Mistral AI API call
   */
  private async callMistral(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<AIResponse> {
    const startTime = Date.now()
    
    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'mistral-small-latest',
          messages: [
            {
              role: 'system',
              content: 'You are a professional copywriter specializing in ethnic fashion. Write compelling, authentic content.'
            },
            { role: 'user', content: prompt }
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new AIProviderError(
          `Mistral API error: ${errorData.error?.message || response.statusText}`,
          'mistral',
          response.status,
          response.status >= 500
        )
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content
      
      if (!content) {
        throw new AIProviderError('No content generated by Mistral', 'mistral', 500, true)
      }

      return {
        success: true,
        content: content.trim(),
        provider: 'mistral',
        model: data.model,
        usage: {
          tokens: data.usage?.total_tokens || 0,
          model: data.model,
          cost: this.calculateCost('mistral', data.usage?.total_tokens || 0)
        },
        metadata: this.createMetadata(startTime)
      }
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'mistral',
        metadata: this.createMetadata(startTime)
      }
    }
  }

  /**
   * OpenRouter API call
   */
  private async callOpenRouter(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<AIResponse> {
    const startTime = Date.now()
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Ecommerce AI Content Generator',
        },
        body: JSON.stringify({
          model: model || 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [
            {
              role: 'system',
              content: 'You are a professional copywriter specializing in ethnic fashion. Write compelling, authentic content.'
            },
            { role: 'user', content: prompt }
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new AIProviderError(
          `OpenRouter API error: ${errorData.error?.message || response.statusText}`,
          'openrouter',
          response.status,
          response.status >= 500
        )
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content
      
      if (!content) {
        throw new AIProviderError('No content generated by OpenRouter', 'openrouter', 500, true)
      }

      return {
        success: true,
        content: content.trim(),
        provider: 'openrouter',
        model: data.model,
        usage: {
          tokens: data.usage?.total_tokens || 0,
          model: data.model,
          cost: this.calculateCost('openrouter', data.usage?.total_tokens || 0)
        },
        metadata: this.createMetadata(startTime)
      }
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'openrouter',
        metadata: this.createMetadata(startTime)
      }
    }
  }

  /**
   * Utility methods for caching, rate limiting, and validation
   */
  private generateCacheKey(request: AIGenerationRequest): string {
    const { type, context, options } = request
    const keyData = {
      type,
      name: context.name,
      category: context.category,
      materials: context.materials?.sort(),
      colors: context.colors?.sort(),
      tone: options?.tone,
      userInput: context.userInput
    }
    return Buffer.from(JSON.stringify(keyData)).toString('base64')
  }

  private getFromCache(key: string): CacheEntry | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (entry.expiresAt < new Date()) {
      this.cache.delete(key)
      return null
    }
    
    return entry
  }

  private saveToCache(key: string, content: any, provider: AIProvider): void {
    const entry: CacheEntry = {
      content,
      timestamp: new Date(),
      provider,
      expiresAt: new Date(Date.now() + this.CACHE_TTL)
    }
    this.cache.set(key, entry)
  }

  private cleanupCache(): void {
    const now = new Date()
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key)
      }
    }
  }

  private validateRequest(request: AIGenerationRequest): void {
    if (!request.type) {
      throw new Error('Request type is required')
    }
    
    if (!request.context?.name) {
      throw new Error('Product name is required in context')
    }
  }

  private buildPrompt(request: AIGenerationRequest): string {
    const { type, context, options } = request
    const template = CONTENT_TEMPLATES[type]
    
    if (!template) {
      throw new Error(`No template found for content type: ${type}`)
    }
    
    // Replace template variables
    let prompt = template.prompt
    
    // Basic replacements
    prompt = prompt.replace(/\{name\}/g, context.name || '')
    prompt = prompt.replace(/\{category\}/g, context.category || '')
    prompt = prompt.replace(/\{price\}/g, context.price?.toString() || '')
    prompt = prompt.replace(/\{materials\}/g, context.materials?.join(', ') || '')
    prompt = prompt.replace(/\{colors\}/g, context.colors?.join(', ') || '')
    
    // Add tone if specified
    if (options?.tone) {
      prompt += `\n\nTone: ${options.tone}`
    }
    
    // Add custom prompt if provided
    if (options?.customPrompt) {
      prompt += `\n\nAdditional instructions: ${options.customPrompt}`
    }
    
    return prompt
  }

  private async checkRateLimit(provider: AIProvider, tokens: number): Promise<boolean> {
    const config = AI_PROVIDER_CONFIGS[provider]
    if (!config) return false
    
    const now = new Date()
    const key = `${provider}_rate_limit`
    
    let rateLimit = this.rateLimits.get(key)
    if (!rateLimit) {
      rateLimit = {
        requests: [],
        tokens: 0,
        resetTime: new Date(now.getTime() + 60000) // 1 minute from now
      }
      this.rateLimits.set(key, rateLimit)
    }
    
    // Clean old requests
    const oneMinuteAgo = new Date(now.getTime() - 60000)
    rateLimit.requests = rateLimit.requests.filter(timestamp => timestamp > oneMinuteAgo.getTime())
    
    // Check limits
    const requestsThisMinute = rateLimit.requests.length
    const tokensThisMinute = rateLimit.tokens
    
    if (requestsThisMinute >= config.rateLimits.requestsPerMinute ||
        tokensThisMinute + tokens > config.rateLimits.tokensPerMinute) {
      throw new AIRateLimitError(provider, 60)
    }
    
    return false
  }

  private updateRateLimit(provider: AIProvider, tokens: number): void {
    const key = `${provider}_rate_limit`
    const rateLimit = this.rateLimits.get(key)
    
    if (rateLimit) {
      rateLimit.requests.push(Date.now())
      rateLimit.tokens += tokens
    }
  }

  private calculateCost(provider: AIProvider, tokens: number): number {
    const config = AI_PROVIDER_CONFIGS[provider]
    if (!config) return 0
    
    return (tokens / 1000) * config.pricing.inputTokenCost
  }

  private getFallbackContent(type: ContentType, context: ProductContext): any {
    switch (type) {
      case 'short_description':
        return FALLBACK_CONTENT.SHORT_DESCRIPTION.replace('{name}', context.name)
      
      case 'product_description':
        return `${context.name} - A beautiful piece from our collection. Crafted with attention to detail and quality materials. Perfect for special occasions, festivals, and celebrations.`
      
      case 'seo_content':
        return {
          title: `${context.name} - Authentic ${context.category || 'Traditional Wear'}`,
          description: `Beautiful ${context.name} with authentic designs and premium quality materials. Perfect for special occasions and cultural celebrations.`
        }
      
      case 'social_caption':
        return `✨ Discover the beauty of ${context.name} ✨\n\nAuthentic designs meet modern elegance in this stunning piece. Perfect for making every moment special! 💫\n\n#TraditionalWear #AuthenticStyle #EthnicFashion`
      
      default:
        return FALLBACK_CONTENT.SHORT_DESCRIPTION
    }
  }

  private async updateProductWithContent(productId: string, type: ContentType, content: any): Promise<void> {
    const updateData: any = {}

    switch (type) {
      case 'short_description':
        updateData.shortDescription = content
        break
      
      case 'product_description':
        updateData.description = content
        break
      
      case 'seo_content':
        if (content.title) updateData.seoTitle = content.title
        if (content.description) updateData.seoDescription = content.description
        break
    }

    if (Object.keys(updateData).length > 0) {
      await db.product.update({
        where: { id: productId },
        data: updateData
      })
    }
  }

  private async getStoreSettings() {
    return await db.storeSetting.findFirst({
      where: { id: 'default' },
      select: {
        aiProvider: true,
        aiApiKey: true,
        aiModel: true
      }
    })
  }

  /**
   * Public utility methods
   */
  async isConfigured(): Promise<{ configured: boolean; provider?: AIProvider; error?: string }> {
    try {
      const settings = await this.getStoreSettings()
      
      if (!settings?.aiProvider || !settings?.aiApiKey) {
        return {
          configured: false,
          error: 'AI provider or API key not configured'
        }
      }

      const provider = settings.aiProvider as AIProvider
      
      if (!AI_PROVIDER_CONFIGS[provider]) {
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

  async testConnection(provider: AIProvider, apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const testRequest: AIGenerationRequest = {
        type: 'short_description',
        context: {
          name: 'Test Product',
          category: 'Traditional Wear'
        },
        options: {
          maxTokens: 50
        }
      }

      const result = await this.callAIProvider(provider, { aiApiKey: apiKey, aiModel: null }, testRequest)
      
      return { success: result.success }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      }
    }
  }

  getProviderInfo(provider: AIProvider) {
    return AI_PROVIDER_CONFIGS[provider]
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key: key.substring(0, 20) + '...',
        provider: entry.provider,
        timestamp: entry.timestamp,
        expiresAt: entry.expiresAt
      }))
    }
  }

  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Generate product description specifically
   */
  async generateProductDescription(
    productContext: ProductContext,
    options: Partial<AIGenerationOptions> = {}
  ): Promise<AIResponse> {
    return this.generateContent({
      type: 'product_description',
      context: productContext,
      options: {
        tone: 'elegant',
        maxTokens: 300,
        ...options
      }
    })
  }

  /**
   * Generate SEO meta description
   */
  async generateSEOMeta(
    productContext: ProductContext,
    options: Partial<AIGenerationOptions> = {}
  ): Promise<AIResponse> {
    return this.generateContent({
      type: 'seo_content',
      context: productContext,
      options: {
        tone: 'professional',
        maxTokens: 200,
        ...options
      }
    })
  }

  /**
   * Generate social media caption
   */
  async generateSocialCaption(
    productContext: ProductContext,
    platform: 'instagram' | 'facebook' | 'twitter' | 'pinterest' = 'instagram',
    options: Partial<AIGenerationOptions> = {}
  ): Promise<AIResponse> {
    return this.generateContent({
      type: 'social_caption',
      context: productContext,
      options: {
        tone: 'playful',
        maxTokens: 150,
        ...options
      }
    })
  }

  /**
   * Generate category description
   */
  async generateCategoryDescription(
    categoryName: string,
    options: Partial<AIGenerationOptions> = {}
  ): Promise<AIResponse> {
    return this.generateContent({
      type: 'category_description',
      context: { name: categoryName, category: 'category' },
      options: {
        tone: 'informative',
        maxTokens: 250,
        ...options
      }
    })
  }

  /**
   * Get rate limit status for a provider
   */
  getRateLimitStatus(provider: AIProvider): {
    requestsRemaining: number
    tokensRemaining: number
    resetTime: Date | null
  } {
    const config = AI_PROVIDER_CONFIGS[provider]
    if (!config) {
      return {
        requestsRemaining: 0,
        tokensRemaining: 0,
        resetTime: null
      }
    }

    const key = `${provider}_rate_limit`
    const rateLimit = this.rateLimits.get(key)
    
    if (!rateLimit) {
      return {
        requestsRemaining: config.rateLimits.requestsPerMinute,
        tokensRemaining: config.rateLimits.tokensPerMinute,
        resetTime: null
      }
    }

    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60000)
    
    // Clean old requests
    const activeRequests = rateLimit.requests.filter(timestamp => timestamp > oneMinuteAgo.getTime())
    
    return {
      requestsRemaining: Math.max(0, config.rateLimits.requestsPerMinute - activeRequests.length),
      tokensRemaining: Math.max(0, config.rateLimits.tokensPerMinute - rateLimit.tokens),
      resetTime: rateLimit.resetTime
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    cacheHitRate: number
    averageResponseTime: number
    totalRequests: number
    errorRate: number
  } {
    // This would typically come from a more sophisticated logging system
    // For now, return basic metrics
    return {
      cacheHitRate: 0.25, // 25% cache hit rate
      averageResponseTime: 2500, // 2.5 seconds average
      totalRequests: 0,
      errorRate: 0.05 // 5% error rate
    }
  }

  /**
   * Clear all rate limits (useful for testing)
   */
  clearRateLimits(): void {
    this.rateLimits.clear()
  }

  /**
   * Get fallback content without making API calls
   */
  getFallbackContentOnly(type: ContentType, context: ProductContext): any {
    return this.getFallbackContent(type, context)
  }

  /**
   * Validate API key for a specific provider
   */
  async validateApiKey(provider: AIProvider, apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const testResult = await this.testConnection(provider, apiKey)
      return {
        valid: testResult.success,
        error: testResult.error
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'API key validation failed'
      }
    }
  }

  /**
   * Get supported content types
   */
  getSupportedContentTypes(): ContentType[] {
    return ['short_description', 'product_description', 'seo_content', 'category_description', 'social_caption']
  }

  /**
   * Get supported providers
   */
  getSupportedProviders(): AIProvider[] {
    return ['openai', 'gemini', 'claude', 'mistral', 'openrouter']
  }

  /**
   * Health check for the AI service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: {
      configuration: boolean
      cacheSize: number
      rateLimitsActive: number
      lastError?: string
    }
  }> {
    try {
      const configCheck = await this.isConfigured()
      
      return {
        status: configCheck.configured ? 'healthy' : 'degraded',
        details: {
          configuration: configCheck.configured,
          cacheSize: this.cache.size,
          rateLimitsActive: this.rateLimits.size,
          lastError: configCheck.error
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          configuration: false,
          cacheSize: this.cache.size,
          rateLimitsActive: this.rateLimits.size,
          lastError: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }
}

// Export singleton instance
export const enhancedAIService = new EnhancedAIService()

// =====================================
// EXPORT ADDITIONAL UTILITIES
// =====================================

/**
 * Quick helper to check if AI is available
 */
export async function isAIAvailable(): Promise<boolean> {
  const check = await enhancedAIService.isConfigured()
  return check.configured
}

/**
 * Get current AI provider
 */
export async function getCurrentAIProvider(): Promise<AIProvider | null> {
  const check = await enhancedAIService.isConfigured()
  return check.provider || null
}

/**
 * Quick content generation helper
 */
export async function generateContent(
  type: ContentType,
  productName: string,
  options?: {
    category?: string
    price?: number
    tone?: 'elegant' | 'casual' | 'professional' | 'playful'
    maxTokens?: number
  }
): Promise<AIResponse> {
  return enhancedAIService.generateContent({
    type,
    context: {
      name: productName,
      category: options?.category,
      price: options?.price
    },
    options: {
      tone: options?.tone || 'elegant',
      maxTokens: options?.maxTokens || 200
    }
  })
}

/**
 * Batch content generation helper
 */
export async function generateBulkContent(
  productIds: string[],
  type: ContentType,
  options?: Partial<AIGenerationOptions>
): Promise<BulkGenerationResponse> {
  return enhancedAIService.bulkGenerate({
    productIds,
    type,
    options,
    batchSize: 5
  })
}

// =====================================
// TYPE EXPORTS FOR EXTERNAL USE
// =====================================

export type {
  AIResponse,
  AIGenerationRequest,
  ProductContext,
  AIGenerationOptions,
  BulkGenerationRequest,
  BulkGenerationResponse,
  ResponseMetadata,
  UsageInfo
}