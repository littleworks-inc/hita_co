'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import {
  Sparkles,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Settings,
  Wand2
} from 'lucide-react'

interface AIGenerateButtonProps {
  contentType: 'product_description' | 'seo_meta' | 'social_caption' | 'category_description'
  productContext?: {
    name: string
    category?: string
    materials?: string[]
    colors?: string[]
    description?: string
    price?: number
    currency?: string
    origin?: string
  }
  options?: {
    tone?: 'professional' | 'casual' | 'elegant' | 'playful' | 'informative'
    length?: 'short' | 'medium' | 'long'
    platform?: 'instagram' | 'facebook' | 'twitter'
    maxTokens?: number
    temperature?: number
  }
  onSuccess: (content: string) => void
  onError?: (error: string) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'ghost'
  className?: string
  children?: React.ReactNode
}

export default function AIGenerateButton({
  contentType,
  productContext,
  options = {},
  onSuccess,
  onError,
  disabled = false,
  size = 'md',
  variant = 'secondary',
  className = '',
  children
}: AIGenerateButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState<'success' | 'error' | null>(null)

  const handleGenerate = async () => {
    // Validate required context
    if (!productContext?.name) {
      const error = 'Product name is required for AI generation'
      onError?.(error)
      return
    }

    setIsLoading(true)
    setLastResult(null)

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType,
          productContext,
          options: {
            tone: 'elegant',
            length: 'medium',
            ...options
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content')
      }

      if (data.success && data.content) {
        onSuccess(data.content)
        setLastResult('success')
        
        // Clear success indicator after 3 seconds
        setTimeout(() => setLastResult(null), 3000)
      } else {
        throw new Error(data.error || 'No content generated')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'AI generation failed'
      onError?.(errorMessage)
      setLastResult('error')
      
      // Clear error indicator after 5 seconds
      setTimeout(() => setLastResult(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonIcon = () => {
    if (isLoading) return Loader2
    if (lastResult === 'success') return CheckCircle
    if (lastResult === 'error') return AlertTriangle
    return Sparkles
  }

  const getButtonText = () => {
    if (isLoading) {
      switch (contentType) {
        case 'product_description': return 'Generating Description...'
        case 'seo_meta': return 'Generating SEO...'
        case 'social_caption': return 'Generating Caption...'
        case 'category_description': return 'Generating Description...'
        default: return 'Generating...'
      }
    }
    
    if (lastResult === 'success') return 'Generated!'
    if (lastResult === 'error') return 'Failed'
    
    if (children) return children
    
    switch (contentType) {
      case 'product_description': return 'Generate Description'
      case 'seo_meta': return 'Generate SEO'
      case 'social_caption': return 'Generate Caption'
      case 'category_description': return 'Generate Description'
      default: return 'Generate with AI'
    }
  }

  const getButtonStyles = () => {
    const baseStyles = 'transition-all duration-200'
    
    if (lastResult === 'success') {
      return `${baseStyles} bg-green-600 hover:bg-green-700 text-white border-green-600`
    }
    
    if (lastResult === 'error') {
      return `${baseStyles} bg-red-600 hover:bg-red-700 text-white border-red-600`
    }
    
    if (variant === 'primary') {
      return `${baseStyles} bg-purple-600 hover:bg-purple-700 text-white border-purple-600`
    }
    
    return baseStyles
  }

  const Icon = getButtonIcon()
  const buttonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'

  return (
    <div className="relative">
      <Button
        type="button"
        variant={lastResult ? undefined as any : variant}
        size={buttonSize}
        onClick={handleGenerate}
        disabled={disabled || isLoading}
        className={`${getButtonStyles()} ${className}`}
      >
        <Icon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        {getButtonText()}
      </Button>
      
      {/* Tooltip for configuration */}
      {!productContext?.name && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-600 whitespace-nowrap">
          Requires product name
        </div>
      )}
    </div>
  )
}

// Specialized button variants for common use cases
export function AIProductDescriptionButton(props: Omit<AIGenerateButtonProps, 'contentType'>) {
  return (
    <AIGenerateButton
      {...props}
      contentType="product_description"
      options={{ tone: 'elegant', length: 'medium', ...props.options }}
    >
      <Wand2 className="h-4 w-4 mr-2" />
      Generate Description
    </AIGenerateButton>
  )
}

export function AISEOButton(props: Omit<AIGenerateButtonProps, 'contentType'>) {
  return (
    <AIGenerateButton
      {...props}
      contentType="seo_meta"
      options={{ tone: 'professional', length: 'short', ...props.options }}
      size="sm"
    >
      Generate SEO
    </AIGenerateButton>
  )
}

export function AISocialButton(props: Omit<AIGenerateButtonProps, 'contentType'> & { platform?: 'instagram' | 'facebook' | 'twitter' }) {
  return (
    <AIGenerateButton
      {...props}
      contentType="social_caption"
      options={{ tone: 'playful', platform: props.platform || 'instagram', ...props.options }}
      size="sm"
    >
      Generate Caption
    </AIGenerateButton>
  )
}

// Bulk generation button for admin tables
interface AIBulkGenerateButtonProps {
  contentType: 'product_description' | 'seo_meta'
  products: any[]
  onSuccess: (results: any[]) => void
  onError?: (error: string) => void
  disabled?: boolean
}

export function AIBulkGenerateButton({
  contentType,
  products,
  onSuccess,
  onError,
  disabled = false
}: AIBulkGenerateButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleBulkGenerate = async () => {
    if (!products.length) {
      onError?.('No products selected for bulk generation')
      return
    }

    setIsLoading(true)
    setProgress(0)

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType,
          bulk: true,
          products,
          options: {
            tone: 'elegant',
            length: 'medium'
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Bulk generation failed')
      }

      if (data.success) {
        onSuccess(data.results)
      } else {
        throw new Error('Bulk generation failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bulk generation failed'
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleBulkGenerate}
      disabled={disabled || isLoading || !products.length}
      className="relative"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generating... ({products.length} items)
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          Bulk Generate ({products.length} items)
        </>
      )}
    </Button>
  )
}