'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { 
  Sparkles, 
  RefreshCw, 
  Wand2, 
  FileText, 
  Hash, 
  MessageSquare,
  Settings,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Type // ✅ NEW: Icon for short description
} from 'lucide-react'

interface AIGenerateButtonProps {
  type: 'product_description' | 'short_description' | 'seo_content' | 'social_caption' | 'category_description' // ✅ ADDED: short_description
  context: {
    productName?: string
    category?: string
    price?: number
    features?: string[]
  }
  onGenerated: (content: any) => void
  disabled?: boolean
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
}

interface AIBulkGenerateButtonProps {
  productIds: string[]
  type: 'product_description' | 'seo_content'
  onComplete: (results: any) => void
  disabled?: boolean
}

interface AIConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (config: any) => void
  type: string
}

// Main AI Generate Button
export default function AIGenerateButton({
  type,
  context,
  onGenerated,
  disabled = false,
  size = 'default',
  variant = 'outline'
}: AIGenerateButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [success, setSuccess] = useState(false)

  const getButtonConfig = () => {
    switch (type) {
      case 'product_description':
        return {
          icon: FileText,
          label: 'Generate Description',
          color: 'text-blue-600'
        }
      // ✅ NEW: Short description support
      case 'short_description':
        return {
          icon: Type,
          label: 'Generate Short Description',
          color: 'text-indigo-600'
        }
      case 'seo_content':
        return {
          icon: Hash,
          label: 'Generate SEO',
          color: 'text-green-600'
        }
      case 'social_caption':
        return {
          icon: MessageSquare,
          label: 'Generate Caption',
          color: 'text-purple-600'
        }
      case 'category_description':
        return {
          icon: FileText,
          label: 'Generate Description',
          color: 'text-orange-600'
        }
      default:
        return {
          icon: Sparkles,
          label: 'Generate with AI',
          color: 'text-gray-600'
        }
    }
  }

  const buttonConfig = getButtonConfig()
  const Icon = loading ? RefreshCw : success ? CheckCircle : buttonConfig.icon

  const handleGenerate = async (customConfig?: any) => {
    setLoading(true)
    setSuccess(false)

    try {
      const response = await fetch('/api/admin/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          context: {
            ...context,
            ...customConfig
          }
        })
      })

      const data = await response.json()

      if (data.success && data.content) {
        onGenerated(data.content)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
      } else {
        throw new Error(data.error || 'Failed to generate content')
      }
    } catch (error) {
      console.error('Generation error:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate content')
    } finally {
      setLoading(false)
      setShowConfig(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant={variant}
          size={size}
          onClick={() => handleGenerate()}
          disabled={disabled || loading}
          className={`${buttonConfig.color} ${success ? 'border-green-500 bg-green-50' : ''}`}
        >
          <Icon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {success ? 'Generated!' : buttonConfig.label}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowConfig(true)}
          disabled={disabled || loading}
          className="px-2"
        >
          <Settings className="h-3 w-3" />
        </Button>
      </div>

      {/* Configuration Modal */}
      {showConfig && (
        <AIConfigModal
          isOpen={showConfig}
          onClose={() => setShowConfig(false)}
          onGenerate={handleGenerate}
          type={type}
        />
      )}
    </>
  )
}

// AI Configuration Modal
function AIConfigModal({ isOpen, onClose, onGenerate, type }: AIConfigModalProps) {
  const [tone, setTone] = useState<'professional' | 'casual' | 'elegant' | 'playful' | 'informative'>('elegant')
  const [maxLength, setMaxLength] = useState(150)
  const [keywords, setKeywords] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)

  if (!isOpen) return null

  const handleGenerate = () => {
    const config = {
      tone,
      maxLength,
      includeKeywords: keywords.split(',').map(k => k.trim()).filter(k => k),
      ...(useCustomPrompt && customPrompt ? { customPrompt } : {})
    }
    
    onGenerate(config)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-medium mb-4">
          AI Generation Settings - {type.replace('_', ' ').toUpperCase()}
        </h3>

        <div className="space-y-4">
          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="elegant">Elegant</option>
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="playful">Playful</option>
              <option value="informative">Informative</option>
            </select>
          </div>

          {/* Max Length */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Length (words)
            </label>
            <input
              type="number"
              value={maxLength}
              onChange={(e) => setMaxLength(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="50"
              max="500"
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Include Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="traditional, handmade, ethnic"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Custom Prompt Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useCustomPrompt"
              checked={useCustomPrompt}
              onChange={(e) => setUseCustomPrompt(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="useCustomPrompt" className="text-sm text-gray-700">
              Use custom prompt
            </label>
          </div>

          {/* Custom Prompt */}
          {useCustomPrompt && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Prompt
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Write your custom prompt here..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleGenerate}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate
          </Button>
        </div>
      </div>
    </div>
  )
}

// Bulk AI Generation Button
export function AIBulkGenerateButton({
  productIds,
  type,
  onComplete,
  disabled = false
}: AIBulkGenerateButtonProps) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleBulkGenerate = async () => {
    if (productIds.length === 0) {
      alert('No products selected')
      return
    }

    setLoading(true)
    setProgress(0)

    try {
      const response = await fetch('/api/admin/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          bulk: true,
          productIds
        })
      })

      const data = await response.json()

      if (data.success) {
        onComplete(data.results)
      } else {
        throw new Error(data.error || 'Bulk generation failed')
      }
    } catch (error) {
      console.error('Bulk generation error:', error)
      alert(error instanceof Error ? error.message : 'Bulk generation failed')
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleBulkGenerate}
      disabled={disabled || loading || productIds.length === 0}
      className="text-purple-600"
    >
      <Wand2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
      {loading ? `Generating... (${productIds.length} products)` : `Bulk Generate (${productIds.length})`}
    </Button>
  )
}

// SEO-specific AI Generate Button
export function AISEOButton({
  context,
  onGenerated,
  disabled = false
}: Omit<AIGenerateButtonProps, 'type'>) {
  return (
    <AIGenerateButton
      type="seo_content"
      context={context}
      onGenerated={onGenerated}
      disabled={disabled}
      variant="outline"
      size="sm"
    />
  )
}