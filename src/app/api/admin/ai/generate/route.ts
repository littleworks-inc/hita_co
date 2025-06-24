// =====================================
// FIXED: AI API Route - Handle Object and String Responses
// src/app/api/admin/ai/generate/route.ts
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// TypeScript interfaces for type safety
interface AIGenerationRequest {
  type: 'short_description' | 'product_description' | 'seo_content'
  context: {
    name: string
    category?: string
    price?: number
    materials?: string[]
    colors?: string[]
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

    const body: AIGenerationRequest = await request.json()
    
    // Handle different request formats for backward compatibility
    let type, context, options = {}
    
    if (body.contentType) {
      type = body.contentType === 'custom' ? 'product_description' : body.contentType
      context = body.productContext || body.context
      options = body.options || {}
    } else {
      type = body.type
      context = body.context
      options = body.options || {}
    }

    console.log('AI Generate Request:', { type, context, options })

    // Validate required fields
    if (!type || !context?.name) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: type and context.name are required'
      }, { status: 400 })
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
      console.log('Generating content for type:', type)
      
      if (type === 'short_description' || type === 'shortDescription') {
        generatedContent = await generateShortDescription(storeSettings, context, options)
      } else if (type === 'product_description' || type === 'description') {
        generatedContent = await generateProductDescription(storeSettings, context, options)
      } else if (type === 'seo_content') {
        generatedContent = await generateSEOContent(storeSettings, context, options)
      } else {
        console.error('Unsupported content type:', type)
        return NextResponse.json({
          success: false,
          error: `Unsupported content type: ${type}. Supported types: short_description, product_description, seo_content`
        }, { status: 400 })
      }

      console.log('Generated content:', generatedContent)
      
      if (!generatedContent) {
        throw new Error('No content was generated')
      }

      // ✅ FIXED: Clean the generated content properly handling both objects and strings
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
    console.error('AI API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// ✅ COMPLETELY REWRITTEN: Safe AI response cleaning with proper type handling
function safeCleanAIResponse(content: any, contentType: string): any {
  console.log('Cleaning AI response:', { content, type: typeof content, contentType })

  // Handle null or undefined
  if (content === null || content === undefined) {
    console.warn('Content is null/undefined, returning fallback')
    return contentType === 'seo_content' 
      ? { title: 'Untitled Product', description: 'Product description coming soon.' }
      : 'Product description coming soon.'
  }

  // Handle SEO content - should be an object
  if (contentType === 'seo_content') {
    // If already a proper object with title and description, return as-is
    if (typeof content === 'object' && content.title && content.description) {
      console.log('SEO content is valid object, returning as-is')
      return {
        title: String(content.title).substring(0, 60), // SEO title limit
        description: String(content.description).substring(0, 160) // Meta description limit
      }
    }

    // If content is a string, try to parse as JSON
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content)
        if (parsed.title && parsed.description) {
          console.log('Successfully parsed SEO JSON from string')
          return {
            title: String(parsed.title).substring(0, 60),
            description: String(parsed.description).substring(0, 160)
          }
        }
      } catch (e) {
        console.warn('Failed to parse SEO content as JSON:', e)
      }

      // Fallback: create SEO object from string content
      console.log('Creating fallback SEO content from string')
      const cleanedString = cleanStringContent(content)
      return {
        title: cleanedString.substring(0, 60) || 'Elegant Traditional Wear',
        description: cleanedString.substring(0, 160) || 'Discover beautiful traditional clothing with premium quality and authentic designs.'
      }
    }

    // Fallback for any other type
    console.warn('Unexpected SEO content type, creating fallback')
    return {
      title: 'Premium Traditional Wear',
      description: 'Beautiful traditional clothing with authentic designs and premium quality materials.'
    }
  }

  // Handle string content (short_description, product_description)
  if (typeof content === 'string') {
    return cleanStringContent(content)
  }

  // If content is an object but not SEO, try to extract description
  if (typeof content === 'object') {
    console.log('Content is object for string type, extracting text')
    
    // Try common properties
    if (content.description) return cleanStringContent(String(content.description))
    if (content.content) return cleanStringContent(String(content.content))
    if (content.text) return cleanStringContent(String(content.text))
    
    // Try to convert entire object to string
    return cleanStringContent(String(content))
  }

  // Fallback: convert whatever it is to string
  console.warn('Unexpected content type, converting to string:', typeof content)
  return cleanStringContent(String(content))
}

// ✅ ENHANCED: String cleaning function with better patterns
function cleanStringContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return 'Beautiful traditional wear crafted with care and attention to detail.'
  }

  // Clean the content step by step
  let cleaned = content
    // Remove JSON markers if present
    .replace(/^```json\s*|\s*```$/g, '')
    .replace(/^```\s*|\s*```$/g, '')
    
    // Remove reasoning and meta-commentary
    .replace(/^(Here's?|This is|I'll|Let me|I should|I would|I've|So,?|Now,?|Therefore,?|Alright,?|First,?).*/gim, '')
    .replace(/^(The description|This description|Here is|This is a|I've created).*/gim, '')
    
    // Remove explanation phrases
    .replace(/^.*?(would be|should be|needs to|requires).*$/gim, '')
    .replace(/^.*?(I think|I believe|In my opinion).*$/gim, '')
    
    // Remove lines in parentheses or brackets  
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    
    // Remove markdown formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    
    // Remove quotes if they wrap the entire content
    .replace(/^["'`](.*)["'`]$/s, '$1')
    
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Multiple line breaks
    .replace(/^\s+|\s+$/g, '') // Leading/trailing whitespace
    .trim()

  // If content starts with explanation words after cleaning, take everything after first sentence
  if (/^(This|The|It|A)\s+\w+\s+(is|are|should|will|has|have|can|could|would|features|offers)/i.test(cleaned)) {
    const sentences = cleaned.split(/[.!?]+/)
    if (sentences.length > 1) {
      cleaned = sentences.slice(1).join('.').trim()
    }
  }

  // Take only the first paragraph if multiple exist
  const firstParagraph = cleaned.split('\n\n')[0]
  
  // Final cleanup
  const result = firstParagraph
    .replace(/^[.!?;,\s]+/, '') // Remove leading punctuation
    .replace(/[.!?;,\s]+$/, '') // Remove trailing punctuation except final period
    .trim()

  // Ensure it ends with proper punctuation
  if (result && !/[.!?]$/.test(result)) {
    return result + '.'
  }

  return result || 'Beautiful traditional wear crafted with authentic designs and premium materials.'
}

// ✅ ENHANCED: Short description generation with better error handling
async function generateShortDescription(settings: any, context: any, options: any = {}): Promise<string> {
  const { name, category, userInput, materials, colors, price } = context
  
  let prompt = `Write a compelling 30-40 word product description for "${name}".

Product Details:
- Category: ${category || 'Traditional wear'}
- Name: ${name}`

  // Add user context
  if (userInput?.fabricType) prompt += `\n- Fabric: ${userInput.fabricType}`
  if (userInput?.occasion) prompt += `\n- Perfect for: ${userInput.occasion}`
  if (userInput?.specialFeatures) prompt += `\n- Features: ${userInput.specialFeatures}`
  if (materials?.length > 0) prompt += `\n- Materials: ${materials.join(', ')}`
  if (colors?.length > 0) prompt += `\n- Available in: ${colors.join(', ')}`
  if (price) prompt += `\n- Price: $${price}`

  prompt += `

Instructions:
- Write EXACTLY 30-40 words
- Focus on style, quality, and appeal
- Use elegant, sales-focused language
- NO explanations, reasoning, or meta-commentary
- Start directly with the product description
- End with proper punctuation

Description:`

  return await callAIProvider(settings, prompt, 80)
}

// ✅ ENHANCED: Product description generation  
async function generateProductDescription(settings: any, context: any, options: any = {}): Promise<string> {
  const { name, category, price, materials, colors, userInput } = context
  const { tone = 'elegant' } = options

  let prompt = `Write a detailed 100-150 word product description for "${name}".

Product Details:
- Category: ${category || 'Traditional wear'}
- Name: ${name}`

  if (userInput?.fabricType) prompt += `\n- Fabric: ${userInput.fabricType}`
  if (userInput?.occasion) prompt += `\n- Perfect for: ${userInput.occasion}`
  if (userInput?.specialFeatures) prompt += `\n- Features: ${userInput.specialFeatures}`
  if (userInput?.craftmanship) prompt += `\n- Craftsmanship: ${userInput.craftmanship}`
  if (userInput?.careInstructions) prompt += `\n- Care: ${userInput.careInstructions}`
  if (materials?.length > 0) prompt += `\n- Materials: ${materials.join(', ')}`
  if (colors?.length > 0) prompt += `\n- Colors: ${colors.join(', ')}`
  if (price) prompt += `\n- Price: $${price}`

  prompt += `

Instructions:
- Write in ${tone} tone
- Exactly 100-150 words
- Focus on quality, style, and cultural significance
- Highlight unique features and craftsmanship
- Appeal to customers who appreciate authentic ethnic wear
- NO explanations, reasoning, or meta-commentary
- Start directly with the description
- End with proper punctuation

Description:`

  return await callAIProvider(settings, prompt, 200)
}

// ✅ COMPLETELY REWRITTEN: SEO content generation with guaranteed JSON structure
async function generateSEOContent(settings: any, context: any, options: any = {}): Promise<SEOContent> {
  const { name, category, price, materials, colors, userInput } = context

  let prompt = `Generate SEO content for the product "${name}".

Product Details:
- Name: ${name}
- Category: ${category || 'Traditional wear'}`

  if (userInput?.targetKeywords) prompt += `\n- Target Keywords: ${userInput.targetKeywords}`
  if (materials?.length > 0) prompt += `\n- Materials: ${materials.join(', ')}`
  if (colors?.length > 0) prompt += `\n- Colors: ${colors.join(', ')}`
  if (price) prompt += `\n- Price: $${price}`

  prompt += `

Create SEO-optimized content:

1. SEO Title (50-60 characters, include main keyword)
2. Meta Description (150-160 characters, compelling and keyword-rich)

CRITICAL: Respond ONLY with valid JSON in this exact format:
{
  "title": "Your SEO title here (50-60 chars)",
  "description": "Your meta description here (150-160 chars)"
}

No explanations, no additional text, only the JSON object:`

  try {
    const response = await callAIProvider(settings, prompt, 150)
    
    // Try to parse JSON response
    try {
      const parsed = JSON.parse(response)
      if (parsed.title && parsed.description) {
        return {
          title: String(parsed.title).substring(0, 60),
          description: String(parsed.description).substring(0, 160)
        }
      }
    } catch (parseError) {
      console.warn('Failed to parse SEO JSON, creating fallback:', parseError)
    }

    // Enhanced fallback creation
    const cleanResponse = cleanStringContent(response)
    const productName = name || 'Traditional Wear'
    const categoryName = category || 'Ethnic Fashion'
    
    return {
      title: `${productName} - Authentic ${categoryName} | Premium Quality`,
      description: `Discover ${productName} featuring traditional designs and premium quality. Perfect for special occasions. ${cleanResponse.substring(0, 50)}...`
    }

  } catch (error) {
    console.error('SEO generation failed:', error)
    
    // Final fallback
    return {
      title: `${name} - Authentic ${category || 'Traditional Wear'}`,
      description: `Beautiful ${name} with authentic designs and premium quality. Perfect for special occasions and cultural celebrations.`
    }
  }
}

// ✅ ENHANCED: AI provider calling with better error handling and retries
async function callAIProvider(settings: any, prompt: string, maxTokens: number = 200): Promise<string> {
  const { aiProvider, aiApiKey, aiModel } = settings
  
  // Add retry logic
  const maxRetries = 2
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`AI Provider call attempt ${attempt}/${maxRetries}:`, { provider: aiProvider, model: aiModel })
      
      switch (aiProvider) {
        case 'openai':
          return await callOpenAI(aiApiKey, aiModel, prompt, maxTokens)
        case 'gemini':
          return await callGemini(aiApiKey, aiModel, prompt, maxTokens)
        case 'claude':
          return await callClaude(aiApiKey, aiModel, prompt, maxTokens)
        case 'mistral':
          return await callMistral(aiApiKey, aiModel, prompt, maxTokens)
        case 'openrouter':
          return await callOpenRouter(aiApiKey, aiModel, prompt, maxTokens)
        default:
          throw new Error(`Unsupported AI provider: ${aiProvider}`)
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`AI Provider call failed (attempt ${attempt}):`, lastError.message)
      
      // If it's the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  
  throw lastError || new Error('All retry attempts failed')
}

// ✅ ENHANCED: Individual AI provider functions with better error handling

// OpenAI API call
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
          content: 'You are a professional copywriter specializing in ethnic fashion. Write ONLY the requested content. Never include reasoning, explanations, or meta-commentary in your responses.'
        },
        { 
          role: 'user', 
          content: prompt 
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content
  
  if (!content) {
    throw new Error('No content generated by OpenAI')
  }
  
  return content.trim()
}

// Gemini API call
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
        temperature: 0.7,
      },
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`)
  }

  const data = await response.json()
  const content = data.candidates[0]?.content?.parts[0]?.text
  
  if (!content) {
    throw new Error('No content generated by Gemini')
  }
  
  return content.trim()
}

// Claude API call
async function callClaude(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<string> {
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
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Claude API error: ${errorData.error?.message || response.statusText}`)
  }

  const data = await response.json()
  const content = data.content[0]?.text
  
  if (!content) {
    throw new Error('No content generated by Claude')
  }
  
  return content.trim()
}

// Mistral API call
async function callMistral(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<string> {
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
          content: 'You are a professional copywriter specializing in ethnic fashion. Write ONLY the requested content. Never include reasoning, explanations, or meta-commentary in your responses.'
        },
        { 
          role: 'user', 
          content: prompt 
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Mistral API error: ${errorData.error?.message || response.statusText}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content
  
  if (!content) {
    throw new Error('No content generated by Mistral')
  }
  
  return content.trim()
}

// OpenRouter API call
async function callOpenRouter(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://your-ecommerce-site.com',
      'X-Title': 'Ecommerce AI Content Generator',
    },
    body: JSON.stringify({
      model: model || 'meta-llama/llama-3.1-8b-instruct:free',
      messages: [
        {
          role: 'system',
          content: 'You are a professional copywriter specializing in ethnic fashion. Write ONLY the requested content. Never include reasoning, explanations, or meta-commentary in your responses.'
        },
        { 
          role: 'user', 
          content: prompt 
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content
  
  if (!content) {
    throw new Error('No content generated by OpenRouter')
  }
  
  return content.trim()
}