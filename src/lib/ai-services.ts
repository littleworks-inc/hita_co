// AI Service Utility for Content Generation
import { db } from '@/lib/db'

export interface AIGenerationRequest {
  type: 'product_description' | 'seo_content' | 'social_caption' | 'category_description'
  context: {
    productName?: string
    category?: string
    price?: number
    features?: string[]
    targetAudience?: string
    tone?: 'professional' | 'casual' | 'elegant' | 'playful' | 'informative'
    maxLength?: number
    includeKeywords?: string[]
    customPrompt?: string
  }
}

export interface AIGenerationResponse {
  success: boolean
  content?: {
    description?: string
    shortDescription?: string
    seoTitle?: string
    seoDescription?: string
    tags?: string[]
    socialCaption?: string
  }
  error?: string
  usage?: {
    model: string
    tokens: number
  }
}

class AIService {
  private async getAISettings() {
    const settings = await db.storeSetting.findFirst({
      where: { id: 'default' },
      select: {
        aiProvider: true,
        aiApiKey: true
      }
    })

    if (!settings?.aiProvider || !settings?.aiApiKey) {
      throw new Error('AI provider not configured. Please configure AI settings in store settings.')
    }

    return settings
  }

  private buildPrompt(request: AIGenerationRequest): string {
    const { type, context } = request
    const {
      productName,
      category,
      price,
      features = [],
      targetAudience = 'customers interested in Indian ethnic wear',
      tone = 'elegant',
      maxLength = 150,
      includeKeywords = [],
      customPrompt
    } = context

    // If custom prompt is provided, use it
    if (customPrompt) {
      return customPrompt
    }

    const baseContext = `
Product: ${productName || 'Product'}
Category: ${category || 'General'}
Price: ${price ? `$${price}` : 'Not specified'}
Features: ${features.join(', ') || 'Not specified'}
Target Audience: ${targetAudience}
Tone: ${tone}
Keywords to include: ${includeKeywords.join(', ') || 'ethnic wear, traditional, handcrafted'}
`

    switch (type) {
      case 'product_description':
        return `Create a compelling product description for an Indian ethnic wear product.

${baseContext}

Requirements:
- Write in ${tone} tone
- Maximum ${maxLength} words
- Highlight unique features and craftsmanship
- Appeal to ${targetAudience}
- Include cultural significance where relevant
- Focus on quality and authenticity
- Make it SEO-friendly

Please provide:
1. A detailed description (${maxLength} words max)
2. A short description (50 words max)
3. 5-8 relevant tags

Format as JSON:
{
  "description": "detailed description here",
  "shortDescription": "brief description here",
  "tags": ["tag1", "tag2", "tag3"]
}`

      case 'seo_content':
        return `Create SEO-optimized content for an Indian ethnic wear product.

${baseContext}

Requirements:
- SEO title (60 characters max)
- Meta description (160 characters max)
- Include primary keywords naturally
- Appeal to search intent
- Include brand value proposition

Format as JSON:
{
  "seoTitle": "SEO title here",
  "seoDescription": "meta description here"
}`

      case 'social_caption':
        return `Create engaging social media captions for an Indian ethnic wear product.

${baseContext}

Requirements:
- Platform: Instagram/Facebook
- Include relevant hashtags
- Engaging and shareable
- Maximum 150 words
- Include call-to-action
- Appeal to fashion-conscious audience

Format as JSON:
{
  "socialCaption": "caption with hashtags here"
}`

      case 'category_description':
        return `Create a category description for Indian ethnic wear.

Category: ${category}
Tone: ${tone}
Target Audience: ${targetAudience}

Requirements:
- Describe the category and its significance
- Highlight what makes this category special
- Appeal to target audience
- SEO-friendly content
- Maximum 200 words

Format as JSON:
{
  "description": "category description here"
}`

      default:
        return `Generate content for: ${type}\n\n${baseContext}`
    }
  }

  private async callOpenAI(prompt: string, apiKey: string): Promise<AIGenerationResponse> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a professional copywriter specializing in Indian ethnic wear and traditional fashion. Always respond with valid JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No content generated')
      }

      // Parse JSON response
      let parsedContent
      try {
        parsedContent = JSON.parse(content)
      } catch (e) {
        // If JSON parsing fails, treat as plain text
        parsedContent = { description: content }
      }

      return {
        success: true,
        content: parsedContent,
        usage: {
          model: data.model,
          tokens: data.usage?.total_tokens || 0
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  private async callGemini(prompt: string, apiKey: string): Promise<AIGenerationResponse> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a professional copywriter specializing in Indian ethnic wear. Always respond with valid JSON format.\n\n${prompt}`
            }]
          }],
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!content) {
        throw new Error('No content generated')
      }

      // Parse JSON response
      let parsedContent
      try {
        parsedContent = JSON.parse(content)
      } catch (e) {
        parsedContent = { description: content }
      }

      return {
        success: true,
        content: parsedContent,
        usage: {
          model: 'gemini-1.5-flash',
          tokens: data.usageMetadata?.totalTokenCount || 0
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  private async callClaude(prompt: string, apiKey: string): Promise<AIGenerationResponse> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1000,
          temperature: 0.7,
          messages: [{
            role: 'user',
            content: `You are a professional copywriter specializing in Indian ethnic wear. Always respond with valid JSON format.\n\n${prompt}`
          }]
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Claude API error: ${error.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      const content = data.content?.[0]?.text

      if (!content) {
        throw new Error('No content generated')
      }

      // Parse JSON response
      let parsedContent
      try {
        parsedContent = JSON.parse(content)
      } catch (e) {
        parsedContent = { description: content }
      }

      return {
        success: true,
        content: parsedContent,
        usage: {
          model: 'claude-3-haiku',
          tokens: data.usage?.input_tokens + data.usage?.output_tokens || 0
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async generateContent(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    try {
      const settings = await this.getAISettings()
      const prompt = this.buildPrompt(request)

      switch (settings.aiProvider) {
        case 'openai':
          return await this.callOpenAI(prompt, settings.aiApiKey)
        
        case 'gemini':
          return await this.callGemini(prompt, settings.aiApiKey)
        
        case 'claude':
          return await this.callClaude(prompt, settings.aiApiKey)
        
        default:
          return {
            success: false,
            error: `Unsupported AI provider: ${settings.aiProvider}`
          }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate content'
      }
    }
  }

  // Bulk generation for multiple products
  async bulkGenerateProductContent(productIds: string[], type: AIGenerationRequest['type']): Promise<{
    success: number
    failed: number
    results: Array<{ productId: string; success: boolean; error?: string }>
  }> {
    const results = []
    let successCount = 0
    let failedCount = 0

    for (const productId of productIds) {
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
          results.push({ productId, success: false, error: 'Product not found' })
          failedCount++
          continue
        }

        // Generate content
        const response = await this.generateContent({
          type,
          context: {
            productName: product.name,
            category: product.category.name,
            price: product.sellingPriceUSD,
            features: [], // Could extract from existing description
            tone: 'elegant'
          }
        })

        if (response.success && response.content) {
          // Update product with generated content
          const updateData: any = {}
          
          if (response.content.description) {
            updateData.description = response.content.description
          }
          if (response.content.shortDescription) {
            updateData.shortDescription = response.content.shortDescription
          }
          if (response.content.seoTitle) {
            updateData.seoTitle = response.content.seoTitle
          }
          if (response.content.seoDescription) {
            updateData.seoDescription = response.content.seoDescription
          }
          if (response.content.tags) {
            updateData.tags = response.content.tags
          }

          await db.product.update({
            where: { id: productId },
            data: updateData
          })

          results.push({ productId, success: true })
          successCount++
        } else {
          results.push({ productId, success: false, error: response.error })
          failedCount++
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        results.push({ 
          productId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
        failedCount++
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      results
    }
  }
}

export const aiService = new AIService()