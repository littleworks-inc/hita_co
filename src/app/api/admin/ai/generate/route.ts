// =====================================
// src/app/api/admin/ai/generate/route.ts - FIXED
// Fixed context field mapping for AI generation
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// TypeScript interfaces for type safety
interface AIGenerationRequest {
  type: 'short_description' | 'product_description' | 'seo_content' | 'social_caption'
  context: {
    // ✅ FLEXIBLE: Support both naming conventions
    name?: string
    productName?: string
    category?: string
    price?: number
    currency?: string
    country?: string
    materials?: string[]
    colors?: string[]
    tags?: string[]
    features?: string[]
    shortDescription?: string
    description?: string
    userInput?: {
      fabricType?: string
      occasion?: string
      specialFeatures?: string
      craftmanship?: string
      careInstructions?: string
      targetKeywords?: string
    }
  }
  options?: {
    tone?: 'elegant' | 'casual' | 'professional' | 'playful'
    maxTokens?: number
    temperature?: number
  }
}

interface AIResponse {
  success: boolean
  content?: any
  error?: string
  provider?: string
  model?: string
  usage?: {
    tokens: number
    cost?: number
  }
}

interface SEOContent {
  title: string
  description: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Handle different request formats for backward compatibility
    let type, context, options = {}
    
    if (body.type) {
      // Standard AIGenerationRequest format
      type = body.type
      context = body.context
      options = body.options || {}
    } else if (body.contentType) {
      // Legacy format - convert contentType to type
      type = body.contentType === 'custom' ? 'product_description' : body.contentType
      context = body.productContext || body.context
      options = body.options || {}
    } else {
      return NextResponse.json({
        success: false,
        error: 'Missing content type. Please specify either "type" or "contentType"'
      }, { status: 400 })
    }

    console.log('AI Generate Request:', { type, context, options })

    // ✅ FIXED: Flexible context field mapping
    const productName = context?.name || context?.productName || ''
    
    // Validate required fields with flexible field names
    if (!type || !productName.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: type and product name are required'
      }, { status: 400 })
    }

    // ✅ NORMALIZE: Create normalized context for AI functions
    const normalizedContext = {
      name: productName, // Normalize to 'name' for internal functions
      productName: productName, // Keep both for compatibility
      category: context?.category || '',
      price: context?.price || 0,
      currency: context?.currency || 'USD',
      country: context?.country || '',
      materials: context?.materials || [],
      colors: context?.colors || [],
      tags: context?.tags || [],
      features: context?.features || [],
      shortDescription: context?.shortDescription || '',
      description: context?.description || '',
      userInput: context?.userInput || {}
    }

    // Get AI settings from store settings
    const storeSettings = await db.storeSetting.findFirst({
      where: { id: 'default' },
      select: {
        aiProvider: true,
        aiApiKey: true,
        aiModel: true
      }
    })

    if (!storeSettings?.aiProvider || !storeSettings?.aiApiKey) {
      return NextResponse.json({
        success: false,
        error: 'AI provider not configured. Please configure AI settings first.'
      }, { status: 400 })
    }

    if (!storeSettings.aiModel) {
      return NextResponse.json({
        success: false,
        error: 'No AI model selected. Please select a model in Store Settings.'
      }, { status: 400 })
    }

    // Generate content based on type
    let generatedContent: any = null
    
    try {
      console.log('Generating content for type:', type, 'with context:', normalizedContext)
      
      if (type === 'short_description' || type === 'shortDescription') {
        generatedContent = await generateShortDescription(storeSettings, normalizedContext, options)
      } else if (type === 'product_description' || type === 'description') {
        generatedContent = await generateProductDescription(storeSettings, normalizedContext, options)
      } else if (type === 'seo_content') {
        generatedContent = await generateSEOContent(storeSettings, normalizedContext, options)
      } else if (type === 'social_caption') {
        generatedContent = await generateSocialCaption(storeSettings, normalizedContext, options)
      } else {
        console.error('Unsupported content type:', type)
        return NextResponse.json({
          success: false,
          error: `Unsupported content type: ${type}. Supported types: product_description, seo_content, social_caption`
        }, { status: 400 })
      }

      console.log('Generated content:', generatedContent)
      
      if (!generatedContent) {
        throw new Error('No content was generated')
      }

      // ✅ FIXED: Clean the generated content properly
      const cleanedContent = safeCleanAIResponse(generatedContent, type)

      return NextResponse.json({
        success: true,
        content: cleanedContent,
        provider: storeSettings.aiProvider,
        model: storeSettings.aiModel
      })

    } catch (error) {
      console.error('AI generation error:', error)
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Content generation failed',
        provider: storeSettings.aiProvider
      }, { status: 500 })
    }

  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// ✅ CONTENT GENERATION FUNCTIONS

async function generateProductDescription(settings: any, context: any, options: any): Promise<string> {
  const { name, category, price, currency, country, materials, features } = context
  
  const prompt = `Create a compelling product description for "${name}" which is a ${category} product.

Product Details:
- Name: ${name}
- Category: ${category}
- Price: ${price > 0 ? `${currency} ${price}` : 'Not specified'}
- Origin: ${country || 'Not specified'}
- Materials: ${materials?.length ? materials.join(', ') : 'Not specified'}
- Features: ${features?.length ? features.join(', ') : 'Not specified'}

Write a professional product description (100-200 words) that:
1. Highlights the product's key features and benefits
2. Appeals to customers interested in quality ${category.toLowerCase()} products
3. Mentions cultural significance if relevant
4. Uses an elegant, sophisticated tone
5. Includes information about materials and craftsmanship

Write ONLY the product description, no additional text or formatting.`

  try {
    const content = await callAIProvider(settings, prompt, 300)
    return content.trim()
  } catch (error) {
    console.error('Product description generation failed:', error)
    return `Beautiful ${name} crafted with attention to detail. This ${category.toLowerCase()} piece combines traditional design with modern appeal, perfect for those who appreciate quality and style.`
  }
}

async function generateShortDescription(settings: any, context: any, options: any): Promise<string> {
  const { name, category, materials } = context
  
  const prompt = `Write a short, compelling description (30-50 words) for "${name}" - a ${category} product.
${materials?.length ? `Made from: ${materials.join(', ')}` : ''}

Focus on the key selling points and make it appealing to customers. Write only the description.`

  try {
    const content = await callAIProvider(settings, prompt, 100)
    return content.trim()
  } catch (error) {
    console.error('Short description generation failed:', error)
    return `Premium ${name} featuring quality craftsmanship and elegant design. Perfect for those who appreciate authentic ${category.toLowerCase()} pieces.`
  }
}

async function generateSEOContent(settings: any, context: any, options: any): Promise<SEOContent> {
  const { name, category, country, materials } = context
  
  const prompt = `Generate SEO content for "${name}" - a ${category} product.
${country ? `Origin: ${country}` : ''}
${materials?.length ? `Materials: ${materials.join(', ')}` : ''}

Create:
1. SEO Title (under 60 characters): Include product name and key terms
2. Meta Description (150-160 characters): Compelling description with benefits

Format as JSON:
{
  "title": "SEO title here",
  "description": "Meta description here"
}`

  try {
    const content = await callAIProvider(settings, prompt, 200)
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(content)
      if (parsed.title && parsed.description) {
        return {
          title: parsed.title.substring(0, 60),
          description: parsed.description.substring(0, 160)
        }
      }
    } catch (parseError) {
      console.log('Failed to parse JSON, using fallback parsing')
    }
    
    // Fallback parsing
    const titleMatch = content.match(/title['":\s]*([^"'\n,}]+)/i)
    const descMatch = content.match(/description['":\s]*([^"'\n,}]+)/i)
    
    return {
      title: titleMatch?.[1]?.substring(0, 60) || `${name} - Premium ${category}`,
      description: descMatch?.[1]?.substring(0, 160) || `Discover our beautiful ${name}. High-quality ${category.toLowerCase()} with authentic design and premium materials. Shop now for exceptional craftsmanship.`
    }
  } catch (error) {
    console.error('SEO generation failed:', error)
    
    return {
      title: `${name} - Authentic ${category}`,
      description: `Beautiful ${name} with authentic designs and premium quality. Perfect for special occasions and cultural celebrations. Shop our ${category.toLowerCase()} collection.`
    }
  }
}

async function generateSocialCaption(settings: any, context: any, options: any): Promise<string> {
  const { name, category, country } = context
  
  const prompt = `Write an engaging social media caption for "${name}" - a beautiful ${category}.
${country ? `From ${country}` : ''}

Include:
- Appealing description
- Relevant hashtags
- Emoji
- Call to action

Keep it under 200 characters and make it Instagram-ready.`

  try {
    const content = await callAIProvider(settings, prompt, 150)
    return content.trim()
  } catch (error) {
    console.error('Social caption generation failed:', error)
    return `✨ Discover the beauty of ${name}! This stunning ${category.toLowerCase()} combines traditional craftsmanship with modern elegance. 💫 #${category.toLowerCase()} #authentic #fashion #traditional`
  }
}

// ✅ SAFE AI RESPONSE CLEANING
function safeCleanAIResponse(content: any, contentType: string): any {
  console.log('Cleaning AI response:', { content, type: typeof content, contentType })

  // Handle null or undefined
  if (content === null || content === undefined) {
    console.warn('Content is null/undefined, returning fallback')
    return contentType === 'seo_content' 
      ? { title: 'Untitled Product', description: 'Product description coming soon.' }
      : 'Product description coming soon.'
  }

  // Handle string content
  if (typeof content === 'string') {
    const cleaned = content.trim()
    if (cleaned.length === 0) {
      return contentType === 'seo_content' 
        ? { title: 'Untitled Product', description: 'Product description coming soon.' }
        : 'Product description coming soon.'
    }
    return cleaned
  }

  // Handle object content (for SEO)
  if (typeof content === 'object' && contentType === 'seo_content') {
    return {
      title: content.title || 'Untitled Product',
      description: content.description || 'Product description coming soon.'
    }
  }

  // Convert object to string if needed
  if (typeof content === 'object') {
    const stringified = JSON.stringify(content)
    return stringified !== '{}' ? stringified : 'Content generated successfully.'
  }

  return String(content)
}

// ✅ AI PROVIDER CALLING FUNCTION
// async function callAIProvider(settings: any, prompt: string, maxTokens: number = 200): Promise<string> {
//   const { aiProvider, aiApiKey, aiModel } = settings
  
//   // Add retry logic
//   const maxRetries = 2
//   let lastError: Error | null = null

//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       console.log(`AI Provider call attempt ${attempt}/${maxRetries}:`, { provider: aiProvider, model: aiModel })
      
//       switch (aiProvider) {
//         case 'openai':
//           return await callOpenAI(aiApiKey, aiModel, prompt, maxTokens)
//         case 'gemini':
//           return await callGemini(aiApiKey, aiModel, prompt, maxTokens)
//         case 'claude':
//           return await callClaude(aiApiKey, aiModel, prompt, maxTokens)
//         case 'mistral':
//           return await callMistral(aiApiKey, aiModel, prompt, maxTokens)
//         case 'openrouter':
//           return await callOpenRouter(aiApiKey, aiModel, prompt, maxTokens)
//         default:
//           throw new Error(`Unsupported AI provider: ${aiProvider}`)
//       }
//     } catch (error) {
//       lastError = error instanceof Error ? error : new Error(String(error))
//       console.error(`AI Provider call failed (attempt ${attempt}):`, lastError.message)
      
//       if (attempt === maxRetries) {
//         throw lastError
//       }
      
//       // Wait before retry
//       await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
//     }
//   }
  
//   throw lastError || new Error('All retry attempts failed')
// }

// ✅ INDIVIDUAL AI PROVIDER FUNCTIONS (simplified versions)

async function callOpenAI(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<string> {
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
          content: 'You are a professional copywriter specializing in ethnic fashion. Write only the requested content without any explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'Failed to generate content'
}

async function callGemini(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<string> {
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
        temperature: 0.7
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Failed to generate content'
}

async function callClaude(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-sonnet-20241022',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text || 'Failed to generate content'
}

async function callMistral(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<string> {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model || 'mistral-small-latest',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    throw new Error(`Mistral API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'Failed to generate content'
}

async function callOpenRouter(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Hita&Co eCommerce Platform'
    },
    body: JSON.stringify({
      model: model || 'meta-llama/llama-3.1-8b-instruct:free',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'Failed to generate content'
}

// Enhanced rate limiting handler for your AI generate route
// Add this to your existing callAIProvider function in src/app/api/admin/ai/generate/route.ts

async function callAIProviderWithRetry(settings: any, prompt: string, maxTokens: number = 200): Promise<string> {
  const { aiProvider, aiApiKey, aiModel } = settings
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`AI Provider call attempt ${attempt}/${maxRetries}:`, { provider: aiProvider, model: aiModel })
      
      let result: string
      
      switch (aiProvider) {
        case 'openai':
          result = await callOpenAI(aiApiKey, aiModel, prompt, maxTokens)
          break
        case 'gemini':
          result = await callGemini(aiApiKey, aiModel, prompt, maxTokens)
          break
        case 'claude':
          result = await callClaude(aiApiKey, aiModel, prompt, maxTokens)
          break
        case 'mistral':
          result = await callMistral(aiApiKey, aiModel, prompt, maxTokens)
          break
        case 'openrouter':
          result = await callOpenRouterWithFallback(aiApiKey, aiModel, prompt, maxTokens)
          break
        default:
          throw new Error(`Unsupported AI provider: ${aiProvider}`)
      }
      
      console.log('AI Provider call successful')
      return result
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`AI Provider call failed (attempt ${attempt}):`, lastError.message)
      
      // Check if it's a rate limit error
      if (lastError.message.includes('429') || lastError.message.includes('Too Many Requests')) {
        if (attempt < maxRetries) {
          // Exponential backoff: 2s, 4s, 8s
          const delay = Math.pow(2, attempt) * 1000
          console.log(`Rate limited, waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
      }
      
      // For non-rate-limit errors, don't retry
      if (!lastError.message.includes('429')) {
        break
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed')
}

// Enhanced OpenRouter function with model fallback
async function callOpenRouterWithFallback(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<string> {
  const fallbackModels = [
    model, // Try the selected model first
    'meta-llama/llama-3.1-8b-instruct:free',
    'microsoft/phi-3-mini-128k-instruct:free',
    'mistralai/mistral-7b-instruct:free'
  ]
  
  let lastError: Error | null = null
  
  for (const tryModel of fallbackModels) {
    try {
      console.log(`Trying OpenRouter model: ${tryModel}`)
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
          'X-Title': 'Hita&Co eCommerce Platform'
        },
        body: JSON.stringify({
          model: tryModel,
          messages: [
            {
              role: 'system',
              content: 'You are a professional copywriter specializing in ethnic fashion. Write only the requested content without any explanations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // If rate limited on this model, try the next one
        if (response.status === 429) {
          console.log(`Model ${tryModel} rate limited, trying next model...`)
          lastError = new Error(`Rate limited: ${tryModel}`)
          continue
        }
        
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      
      if (!content) {
        throw new Error('No content generated by OpenRouter')
      }
      
      console.log(`Successfully generated content using model: ${tryModel}`)
      return content.trim()
      
    } catch (error) {
      console.log(`Model ${tryModel} failed:`, error instanceof Error ? error.message : 'Unknown error')
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // If it's not a rate limit error, don't try other models
      if (!lastError.message.includes('429') && !lastError.message.includes('Rate limited')) {
        throw lastError
      }
    }
  }
  
  throw lastError || new Error('All OpenRouter models failed')
}

// Update your existing callAIProvider function to use the retry logic:
async function callAIProvider(settings: any, prompt: string, maxTokens: number = 200): Promise<string> {
  try {
    return await callAIProviderWithRetry(settings, prompt, maxTokens)
  } catch (error) {
    console.error('All AI provider attempts failed:', error)
    // Return to your existing fallback logic here
    throw error
  }
}