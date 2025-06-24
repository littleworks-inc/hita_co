// =====================================
// FIXED: AI API Route - Handle Object and String Responses
// src/app/api/admin/ai/generate/route.ts
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Handle different request formats
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
    let generatedContent = ''
    
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
          error: `Unsupported content type: ${type}`
        }, { status: 400 })
      }

      console.log('Generated content:', generatedContent)
      
      if (!generatedContent) {
        throw new Error('No content was generated')
      }

      // ✅ FIXED: Clean the generated content properly handling both objects and strings
      const cleanedContent = cleanAIResponse(generatedContent)

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
        error: error instanceof Error ? error.message : 'Content generation failed'
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

// ✅ FIXED: Clean AI response to handle both strings and objects
function cleanAIResponse(content: any): any {
  // If content is already an object (like SEO content), return it as-is
  if (typeof content === 'object' && content !== null) {
    console.log('Content is object, returning as-is:', content)
    return content
  }

  // If content is not a string, convert it to string
  if (typeof content !== 'string') {
    console.log('Content is not string, converting:', typeof content, content)
    content = String(content)
  }

  // Clean string content to remove reasoning and explanations
  const cleanedContent = content
    // Remove lines that start with reasoning indicators
    .replace(/^(Alright,?|First,?|I should|Let me|So,?|Therefore,?|Now,?|Here's?|This is).*/gim, '')
    // Remove explanation paragraphs
    .replace(/^(The |This |It |A ).*(description|should|needs to|requires).*/gim, '')
    // Remove any lines in parentheses or brackets
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    // Remove multiple line breaks
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Remove leading/trailing whitespace
    .trim()

  // If the content starts with quotes, remove them
  const withoutQuotes = cleanedContent.replace(/^["']|["']$/g, '')
  
  // Take only the first paragraph if multiple paragraphs exist
  const firstParagraph = withoutQuotes.split('\n\n')[0]
  
  return firstParagraph.trim()
}

// Enhanced short description generation with better prompts
async function generateShortDescription(settings: any, context: any, options: any = {}) {
  const { name, category, images, userInput, materials, colors, price } = context
  
  // Build comprehensive prompt with user input
  let prompt = `Write a 30-40 word product description for "${name}".

Product Details:
- Category: ${category || 'Traditional wear'}
- Type: ${name}`

  // Add user input if provided
  if (userInput?.fabricType) {
    prompt += `\n- Fabric: ${userInput.fabricType}`
  }
  
  if (userInput?.occasion) {
    prompt += `\n- Best for: ${userInput.occasion}`
  }
  
  if (userInput?.specialFeatures) {
    prompt += `\n- Special features: ${userInput.specialFeatures}`
  }

  // Add detected materials and colors
  if (materials?.length > 0) {
    prompt += `\n- Materials: ${materials.join(', ')}`
  }
  
  if (colors?.length > 0) {
    prompt += `\n- Colors: ${colors.join(', ')}`
  }

  if (price) {
    prompt += `\n- Price: $${price}`
  }

  prompt += `

Instructions:
- Write ONLY the product description
- Exactly 30-40 words
- Focus on style, comfort, and occasion
- Use elegant, sales-focused language
- NO explanations or reasoning
- Start directly with the description

Description:`

  return await callAIProvider(settings, prompt, 80)
}

// Enhanced product description generation
async function generateProductDescription(settings: any, context: any, options: any = {}) {
  const { name, category, price, materials, colors, tags, images, userInput } = context
  const { tone = 'elegant' } = options

  let prompt = `Write a detailed 100-150 word product description for "${name}".

Product Details:
- Category: ${category || 'Traditional wear'}
- Name: ${name}`

  // Add user context
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
- 100-150 words
- Focus on quality, style, and cultural significance
- Highlight unique features and craftsmanship
- Appeal to customers who appreciate authentic ethnic wear
- NO explanations or reasoning
- Start directly with the description

Description:`

  return await callAIProvider(settings, prompt, 200)
}

// ✅ FIXED: Enhanced SEO content generation - returns structured object
async function generateSEOContent(settings: any, context: any, options: any = {}) {
  const { name, category, price, materials, colors, userInput } = context

  let prompt = `Generate SEO content for "${name}" product.

Product Details:
- Name: ${name}
- Category: ${category || 'Traditional wear'}`

  if (userInput?.targetKeywords) prompt += `\n- Target Keywords: ${userInput.targetKeywords}`
  if (materials?.length > 0) prompt += `\n- Materials: ${materials.join(', ')}`
  if (colors?.length > 0) prompt += `\n- Colors: ${colors.join(', ')}`
  if (price) prompt += `\n- Price: $${price}`

  prompt += `

Create:
1. SEO Title (50-60 characters, include main keyword)
2. Meta Description (150-160 characters, compelling and keyword-rich)

Format as JSON:
{
  "title": "SEO title here",
  "description": "Meta description here"
}

Return ONLY the JSON, no explanations:`

  const response = await callAIProvider(settings, prompt, 150)
  
  // Try to parse JSON response
  try {
    const parsed = JSON.parse(response)
    if (parsed.title && parsed.description) {
      return parsed
    }
  } catch (e) {
    console.log('Failed to parse JSON, creating fallback SEO content')
  }

  // Fallback if JSON parsing fails
  return {
    title: `${name} - Authentic ${category || 'Traditional Wear'}`,
    description: `Discover our beautiful ${name}. Premium quality ${category || 'traditional wear'} perfect for special occasions. Shop authentic Indian ethnic wear.`
  }
}

// Call AI Provider (with OpenRouter support)
async function callAIProvider(settings: any, prompt: string, maxTokens: number = 150): Promise<any> {
  const { aiProvider, aiApiKey, aiModel } = settings

  if (aiProvider === 'openai') {
    return await callOpenAI(aiApiKey, aiModel, prompt, maxTokens)
  } else if (aiProvider === 'gemini') {
    return await callGemini(aiApiKey, aiModel, prompt, maxTokens)
  } else if (aiProvider === 'claude') {
    return await callClaude(aiApiKey, aiModel, prompt, maxTokens)
  } else if (aiProvider === 'openrouter') {
    return await callOpenRouter(aiApiKey, aiModel, prompt, maxTokens)
  } else if (aiProvider === 'mistral') {
    return await callMistral(aiApiKey, aiModel, prompt, maxTokens)
  } else {
    throw new Error(`Unsupported AI provider: ${aiProvider}`)
  }
}

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
        { role: 'user', content: prompt }
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
  return data.choices[0]?.message?.content || ''
}

// ✅ NEW: OpenRouter API call
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
      model: model || 'meta-llama/llama-3.2-3b-instruct:free',
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
  return data.choices[0]?.message?.content || ''
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
  return data.candidates[0]?.content?.parts[0]?.text || ''
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
  return data.content[0]?.text || ''
}

// ✅ NEW: Mistral API call
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
  return data.choices[0]?.message?.content || ''
}