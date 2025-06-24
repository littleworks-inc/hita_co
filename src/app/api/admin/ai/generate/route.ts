// Enhanced AI API Route with better prompts and user input
// /src/app/api/admin/ai/generate/route.ts

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

      // Clean the generated content to remove any reasoning or explanations
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

// Clean AI response to remove reasoning and explanations
function cleanAIResponse(content: string): string {
  // Remove common AI reasoning patterns
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

  // If images are available and provider supports vision
  if (images?.length > 0 && settings.aiProvider === 'openai') {
    return await generateWithOpenAIVision(settings, { ...context, prompt }, 'short')
  }
  
  return await callAIProvider(settings, prompt, 80)
}

// Enhanced product description generation
async function generateProductDescription(settings: any, context: any, options: any = {}) {
  const { name, category, price, materials, colors, tags, images, userInput } = context
  const { tone = 'elegant' } = options

  let prompt = `Write a detailed 100-150 word product description for "${name}".

Product Information:
- Name: ${name}
- Category: ${category || 'Traditional ethnic wear'}`

  // Add user-provided context
  if (userInput?.fabricType) {
    prompt += `\n- Fabric/Material: ${userInput.fabricType}`
  }
  
  if (userInput?.craftmanship) {
    prompt += `\n- Craftsmanship: ${userInput.craftmanship}`
  }
  
  if (userInput?.occasion) {
    prompt += `\n- Ideal for: ${userInput.occasion}`
  }
  
  if (userInput?.careInstructions) {
    prompt += `\n- Care: ${userInput.careInstructions}`
  }
  
  if (userInput?.sizing) {
    prompt += `\n- Sizing: ${userInput.sizing}`
  }

  // Add extracted data
  if (price) prompt += `\n- Price: $${price}`
  if (materials?.length > 0) prompt += `\n- Materials detected: ${materials.join(', ')}`
  if (colors?.length > 0) prompt += `\n- Colors: ${colors.join(', ')}`
  if (tags?.length > 0) prompt += `\n- Features: ${tags.join(', ')}`

  prompt += `

Style Guidelines:
- Tone: ${tone}
- Length: 100-150 words exactly
- Focus on cultural heritage and quality
- Highlight comfort and versatility
- Use descriptive, elegant language

Instructions:
- Write ONLY the product description
- NO explanations or reasoning
- Start directly with the description
- Make it compelling for customers

Description:`

  // Use image analysis if available
  if (images?.length > 0 && settings.aiProvider === 'openai') {
    return await generateWithOpenAIVision(settings, { ...context, prompt }, 'long')
  }
  
  return await callAIProvider(settings, prompt, 200)
}

// Enhanced OpenAI Vision generation
async function generateWithOpenAIVision(settings: any, context: any, type: 'short' | 'long') {
  const { name, category, images, prompt } = context
  
  const visionPrompt = type === 'short' 
    ? `Look at this image and write a 30-40 word product description for "${name}". Focus on what you see - colors, patterns, style, fabric texture. Be descriptive but concise. Write ONLY the description, no explanations.`
    : `Analyze this image and write a 100-150 word detailed product description for "${name}". Describe the visual elements, fabric appearance, colors, patterns, and styling. Write ONLY the description, no explanations.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.aiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.aiModel,
      messages: [
        {
          role: 'system',
          content: 'You are a professional copywriter. Write ONLY product descriptions. Never include reasoning, explanations, or meta-commentary.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: visionPrompt },
            ...images.slice(0, 2).map((imageUrl: string) => ({
              type: 'image_url',
              image_url: { 
                url: imageUrl,
                detail: 'low' // Use low detail for faster processing
              }
            }))
          ]
        }
      ],
      max_tokens: type === 'short' ? 80 : 200,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI Vision API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content?.trim() || ''
}

// Enhanced SEO content generation
async function generateSEOContent(settings: any, context: any, options: any = {}) {
  const { name, category, userInput, materials, colors } = context
  
  let prompt = `Create SEO title and meta description for "${name}".

Product: ${name}
Category: ${category || 'Indian ethnic wear'}`

  if (userInput?.targetKeywords) {
    prompt += `\nTarget Keywords: ${userInput.targetKeywords}`
  }
  
  if (userInput?.occasion) {
    prompt += `\nOccasion: ${userInput.occasion}`
  }

  if (materials?.length > 0) {
    prompt += `\nMaterials: ${materials.join(', ')}`
  }

  prompt += `

Requirements:
- SEO Title: Maximum 60 characters, include main keywords
- Meta Description: Maximum 160 characters, compelling and click-worthy
- Focus on traditional Indian wear keywords
- Include style and occasion terms

Respond ONLY with JSON format:
{
  "title": "SEO title here",
  "description": "Meta description here"
}`

  const result = await callAIProvider(settings, prompt, 150)
  
  // Try to parse JSON, fallback to structured response
  try {
    return JSON.parse(result)
  } catch {
    return {
      title: `${name} - Authentic ${category || 'Indian Ethnic Wear'}`,
      description: `Discover our beautiful ${name}. Premium quality ${category || 'traditional wear'} perfect for special occasions. Shop authentic Indian ethnic wear.`
    }
  }
}

// Enhanced AI provider calling with better system prompts
async function callAIProvider(settings: any, prompt: string, maxTokens: number = 200) {
  const { aiProvider, aiApiKey, aiModel } = settings

  if (!aiModel) {
    throw new Error(`No model selected for ${aiProvider}. Please select a model in Store Settings.`)
  }

  try {
    let result = ''
    
    switch (aiProvider) {
      case 'openai':
        result = await callOpenAI(aiApiKey, aiModel, prompt, maxTokens)
        break
      
      case 'openrouter':
        result = await callOpenRouter(aiApiKey, aiModel, prompt, maxTokens)
        break
      
      case 'gemini':
        result = await callGemini(aiApiKey, aiModel, prompt, maxTokens)
        break
      
      case 'claude':
        result = await callClaude(aiApiKey, aiModel, prompt, maxTokens)
        break
      
      case 'mistral':
        result = await callMistral(apiKey, aiModel, prompt, maxTokens)
        break
      
      default:
        throw new Error(`Unsupported AI provider: ${aiProvider}`)
    }

    return result.trim()

  } catch (error) {
    console.error(`${aiProvider} API error:`, error)
    throw error
  }
}

// Enhanced provider implementations with better system prompts

async function callOpenAI(apiKey: string, model: string, prompt: string, maxTokens: number) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
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
      temperature: 0.7
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content?.trim() || ''
}

async function callGemini(apiKey: string, model: string, prompt: string, maxTokens: number) {
  const systemPrompt = 'You are a professional copywriter specializing in ethnic fashion. Write ONLY the requested content. Never include reasoning, explanations, or meta-commentary.'
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\n${prompt}`
        }]
      }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7
      }
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!content) {
    throw new Error('No content generated by Gemini')
  }

  return content.trim()
}

async function callClaude(apiKey: string, model: string, prompt: string, maxTokens: number) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.7,
      system: 'You are a professional copywriter specializing in ethnic fashion. Write ONLY the requested content. Never include reasoning, explanations, or meta-commentary in your responses.',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || `Claude API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.content?.[0]?.text

  if (!content) {
    throw new Error('No content generated by Claude')
  }

  return content.trim()
}

async function callOpenRouter(apiKey: string, model: string, prompt: string, maxTokens: number) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Hita&Co eCommerce Platform'
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a professional copywriter specializing in ethnic fashion. Write ONLY the requested content. Never include reasoning, explanations, or meta-commentary.'
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
    const errorText = await response.text()
    console.error('OpenRouter error response:', errorText)
    
    try {
      const error = JSON.parse(errorText)
      throw new Error(error.error?.message || `OpenRouter API error: ${response.status}`)
    } catch {
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
    }
  }

  const data = await response.json()
  
  const message = data.choices?.[0]?.message
  let content = ''
  
  if (message?.content && message.content.trim()) {
    content = message.content.trim()
  } else if (message?.reasoning && message.reasoning.trim()) {
    content = message.reasoning.trim()
  } else {
    throw new Error('No content generated by OpenRouter')
  }
  
  return content
}

async function callMistral(apiKey: string, model: string, prompt: string, maxTokens: number) {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a professional copywriter specializing in ethnic fashion. Write ONLY the requested content. Never include reasoning, explanations, or meta-commentary.'
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
    const error = await response.json()
    throw new Error(error.error?.message || `Mistral API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('No content generated by Mistral')
  }

  return content.trim()
}