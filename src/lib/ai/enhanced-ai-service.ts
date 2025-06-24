// =====================================
// Enhanced AI Service with Rate Limiting, Caching & Error Handling
// src/lib/ai/enhanced-ai-service.ts
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
  BulkGenerationResponse
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
          metadata: {
            timestamp: new Date(),
            fallbackUsed: false
          }
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
      await this.checkRateLimit(provider, request.options?.maxTokens || 200)
      
      // Generate content with retries
      const result = await this.generateWithRetries(provider, settings, request)
      
      // Cache successful result
      if (result.success && result.content) {
        this.saveToCache(cacheKey, result.content, provider)
      }
      
      // Add metadata
      result.metadata = {
        timestamp: new Date(),
        processingTime: Date.now() - startTime,
        fallbackUsed: false
      }
      
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
          metadata: {
            timestamp: new Date(),
            processingTime: Date.now() - startTime,
            fallbackUsed: true
          }
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Content generation failed',
        metadata: {
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          fallbackUsed: false
        }
      }
    }
  }

  /**
   * Bulk content generation with progress tracking
   */
  async bulkGenerateContent(request: BulkGenerationRequest): Promise<BulkGenerationResponse> {
    const { productIds, type, options, batchSize = 5 } = request
    const results: any[] = []
    let successCount = 0
    let failedCount = 0
    let totalTokens = 0
    let totalCost = 0
    const failureReasons: { [reason: string]: number } = {}
    const startTime = Date.now()

    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize)
      const batchPromises = batch.map(async (productId) => {
        try {
          // Get product data
          const product = await db.product.findUnique({
            where: { id: productId },
            include: {
              category: true,
              country: true
            }
          })

          if (!product) {
            const error = 'Product not found'
            failedCount++
            failureReasons[error] = (failureReasons[error] || 0) + 1
            return { productId, success: false, error }
          }

          // Build context from product data
          const context: ProductContext = {
            name: product.name,
            category: product.category?.name,
            price: product.sellingPriceUSD,
            materials: product.materials ? JSON.parse(product.materials) : [],
            colors: product.colors ? JSON.parse(product.colors) : [],
            tags: product.tags ? JSON.parse(product.tags) : []
          }

          // Generate content
          const response = await this.generateContent({
            type,
            context,
            options
          })

          if (response.success) {
            // Update product with generated content
            await this.updateProductWithContent(productId, type, response.content)
            
            successCount++
            if (response.usage) {
              totalTokens += response.usage.tokens
              totalCost += response.usage.cost || 0
            }
            
            return { 
              productId, 
              success: true, 
              content: response.content,
              processingTime: response.metadata?.processingTime
            }
          } else {
            failedCount++
            const error = response.error || 'Unknown error'
            failureReasons[error] = (failureReasons[error] || 0) + 1
            return { productId, success: false, error }
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
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`AI generation attempt ${attempt}/${this.MAX_RETRIES} with ${provider}`)
        
        const result = await this.callAIProvider(provider, settings, request)
        
        // Update rate limit tracking
        this.updateRateLimit(provider, result.usage?.tokens || 0)
        
        return result
        
      } catch (error) {
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
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        throw new AIRateLimitError(provider)
      }
      
      if (errorMessage.includes('quota') || errorMessage.includes('402')) {
        throw new AIQuotaExceededError(provider)
      }
      
      throw new AIProviderError(errorMessage, provider, 500, true)
    }
  }

  /**
   * Enhanced prompt building with templates
   */
  private buildPrompt(request: AIGenerationRequest): string {
    const { type, context, options } = request
    
    // Get template for content type
    const templateKey = type.toUpperCase()
    const template = CONTENT_TEMPLATES[templateKey]
    
    if (!template) {
      return `Generate ${type.replace('_', ' ')} for "${context.name}".`
    }
    
    let prompt = template.prompt
    
    // Replace template variables
    prompt = prompt.replace(/\{name\}/g, context.name || '')
    prompt = prompt.replace(/\{category\}/g, context.category || 'product')
    prompt = prompt.replace(/\{materials\}/g, context.materials?.join(', ') || '')
    prompt = prompt.replace(/\{colors\}/g, context.colors?.join(', ') || '')
    prompt = prompt.replace(/\{price\}/g, context.price ? `$${context.price}` : '')
    prompt = prompt.replace(/\{tone\}/g, options?.tone || 'elegant')
    prompt = prompt.replace(/\{keywords\}/g, context.userInput?.targetKeywords || '')
    
    // Add user input context if available
    if (context.userInput) {
      const userContext = Object.entries(context.userInput)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')
      
      if (userContext) {
        prompt += `\n\nAdditional Context:\n${userContext}`
      }
    }
    
    return prompt
  }

  /**
   * Individual AI provider methods with enhanced error handling
   */
  private async callOpenAI(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<AIResponse> {
    const startTime = Date.now()
    
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
            content: 'You are a professional copywriter specializing in ethnic fashion and traditional wear. Write compelling, authentic content that resonates with customers. Be concise and focus on quality, style, and cultural significance.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      if (response.status === 429) {
        throw new AIRateLimitError('openai', errorData.error?.retry_after)
      }
      
      if (response.status === 402) {
        throw new AIQuotaExceededError('openai')
      }
      
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
        processingTime: Date.now() - startTime,
        cost: this.calculateCost('openai', data.usage?.total_tokens || 0)
      }
    }
  }

  private async callGemini(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<AIResponse> {
    const startTime = Date.now()
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.7,
          },
        }),
      }
    )

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
    const content = data.candidates[0]?.content?.parts[0]?.text
    
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
        processingTime: Date.now() - startTime,
        cost: this.calculateCost('gemini', data.usageMetadata?.totalTokenCount || 0)
      }
    }
  }

  private async callClaude(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<AIResponse> {
    const startTime = Date.now()
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
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
        processingTime: Date.now() - startTime,
        cost: this.calculateCost('claude', (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0))
      }
    }
  }

  private async callMistral(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<AIResponse> {
    const startTime = Date.now()
    
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
        processingTime: Date.now() - startTime,
        cost: this.calculateCost('mistral', data.usage?.total_tokens || 0)
      }
    }
  }

  private async callOpenRouter(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<AIResponse> {
    const startTime = Date.now()
    
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
        processingTime: Date.now() - startTime,
        cost: this.calculateCost('openrouter', data.usage?.total_tokens || 0)
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

  private async checkRateLimit(provider: AIProvider, estimatedTokens: number): Promise<void> {
    const config = AI_PROVIDER_CONFIGS[provider]
    if (!config) return

    const key = `${provider}_rate_limit`
    const entry = this.rateLimits.get(key)
    const now = new Date()

    if (!entry || entry.resetTime < now) {
      // Reset rate limit window
      this.rateLimits.set(key, {
        requests: [now],
        tokens: estimatedTokens,
        resetTime: new Date(now.getTime() + 60 * 1000) // 1 minute window
      })
      return
    }

    // Check request rate limit
    const recentRequests = entry.requests.filter(
      time => now.getTime() - time.getTime() < 60 * 1000
    )

    if (recentRequests.length >= config.rateLimits.requestsPerMinute) {
      throw new AIRateLimitError(provider, 60)
    }

    // Check token rate limit
    if (entry.tokens + estimatedTokens > config.rateLimits.tokensPerMinute) {
      throw new AIRateLimitError(provider, 60)
    }

    // Update rate limit tracking
    entry.requests.push(now)
    entry.tokens += estimatedTokens
    entry.requests = entry.requests.filter(
      time => now.getTime() - time.getTime() < 60 * 1000
    )
  }

  private updateRateLimit(provider: AIProvider, actualTokens: number): void {
    const key = `${provider}_rate_limit`
    const entry = this.rateLimits.get(key)
    
    if (entry) {
      // Adjust token count based on actual usage
      entry.tokens = Math.max(0, entry.tokens + actualTokens - 200) // Subtract estimated tokens
    }
  }

  private calculateCost(provider: AIProvider, tokens: number): number {
    const config = AI_PROVIDER_CONFIGS[provider]
    if (!config) return 0

    return (tokens / 1000) * config.pricing.inputTokenCost
  }

  private validateRequest(request: AIGenerationRequest): void {
    if (!request.type) {
      throw new Error('Content type is required')
    }

    if (!request.context?.name) {
      throw new Error('Product name is required in context')
    }

    // Validate content type
    const validTypes: ContentType[] = [
      'short_description', 
      'product_description', 
      'seo_content', 
      'category_description', 
      'social_caption'
    ]
    
    if (!validTypes.includes(request.type)) {
      throw new Error(`Invalid content type: ${request.type}`)
    }
  }

  private getFallbackContent(type: ContentType, context: ProductContext): any {
    switch (type) {
      case 'short_description':
        return `Beautiful ${context.name} crafted with authentic designs and premium materials.`
      
      case 'product_description':
        return `Discover this exquisite ${context.name}, carefully crafted with attention to detail and authentic designs. Made with premium quality materials, this garment combines cultural heritage with contemporary style. Perfect for special occasions, festivals, and celebrations.`
      
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
}

// Export singleton instance
export const enhancedAIService = new EnhancedAIService()