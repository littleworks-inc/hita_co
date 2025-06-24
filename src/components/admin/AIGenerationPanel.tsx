// Enhanced AI Input Component for ProductForm
// Add this component to your ProductForm to gather user input for better AI generation

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Textarea } from '@/components/ui'
import { 
  Sparkles, 
  Wand2, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Image as ImageIcon,
  Type,
  Palette,
  Calendar,
  Scissors,
  Shirt
} from 'lucide-react'

interface AIInputData {
  fabricType?: string
  occasion?: string
  specialFeatures?: string
  craftmanship?: string
  careInstructions?: string
  sizing?: string
  targetKeywords?: string
}

interface AIGenerationPanelProps {
  productName: string
  categoryName: string
  images: string[]
  onGenerate: (type: 'short_description' | 'product_description' | 'seo_content', userInput: AIInputData) => Promise<void>
  isGenerating: boolean
}

export function AIGenerationPanel({ 
  productName, 
  categoryName, 
  images, 
  onGenerate, 
  isGenerating 
}: AIGenerationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [userInput, setUserInput] = useState<AIInputData>({})
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'seo'>('basic')

  const isReadyForAI = productName?.trim() && categoryName?.trim()

  const handleGenerate = async (type: 'short_description' | 'product_description' | 'seo_content') => {
    if (!isReadyForAI) return
    await onGenerate(type, userInput)
  }

  const updateInput = (field: keyof AIInputData, value: string) => {
    setUserInput(prev => ({ ...prev, [field]: value }))
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Shirt },
    { id: 'details', label: 'Details', icon: Scissors },
    { id: 'seo', label: 'SEO', icon: Type }
  ]

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Sparkles className="h-5 w-5" />
            AI Content Generation
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Status Bar */}
        <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
          isReadyForAI 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isReadyForAI ? 'bg-green-500' : 'bg-yellow-500'}`} />
          {isReadyForAI ? (
            <>
              <span>Ready for AI generation</span>
              {images.length > 0 && (
                <span className="flex items-center gap-1 ml-2">
                  <ImageIcon className="h-3 w-3" />
                  {images.length} image{images.length > 1 ? 's' : ''} available
                </span>
              )}
            </>
          ) : (
            <span>Add product name and category to enable AI generation</span>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Quick Generation Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => handleGenerate('short_description')}
              disabled={!isReadyForAI || isGenerating}
              className="flex items-center gap-2"
            >
              <Wand2 className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Quick Short Description'}
            </Button>
            
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleGenerate('product_description')}
              disabled={!isReadyForAI || isGenerating}
              className="flex items-center gap-2"
            >
              <Wand2 className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Full Description'}
            </Button>
            
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleGenerate('seo_content')}
              disabled={!isReadyForAI || isGenerating}
              className="flex items-center gap-2"
            >
              <Type className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'SEO Content'}
            </Button>
          </div>

          {/* Advanced Options */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                Provide additional context for better AI results
              </span>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-4">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Tab Content */}
            {activeTab === 'basic' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fabricType" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Fabric/Material Type
                  </Label>
                  <Input
                    id="fabricType"
                    value={userInput.fabricType || ''}
                    onChange={(e) => updateInput('fabricType', e.target.value)}
                    placeholder="e.g., Cotton, Silk, Chiffon, Georgette"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occasion" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Occasion/Use
                  </Label>
                  <Input
                    id="occasion"
                    value={userInput.occasion || ''}
                    onChange={(e) => updateInput('occasion', e.target.value)}
                    placeholder="e.g., Wedding, Festival, Casual, Party"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="specialFeatures">Special Features</Label>
                  <Input
                    id="specialFeatures"
                    value={userInput.specialFeatures || ''}
                    onChange={(e) => updateInput('specialFeatures', e.target.value)}
                    placeholder="e.g., Handwoven, Embroidered, Block printed, Mirror work"
                  />
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="craftmanship">Craftsmanship Details</Label>
                  <Textarea
                    id="craftmanship"
                    value={userInput.craftmanship || ''}
                    onChange={(e) => updateInput('craftmanship', e.target.value)}
                    placeholder="e.g., Hand-embroidered by artisans in Jaipur, Traditional block printing technique"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="careInstructions">Care Instructions</Label>
                  <Textarea
                    id="careInstructions"
                    value={userInput.careInstructions || ''}
                    onChange={(e) => updateInput('careInstructions', e.target.value)}
                    placeholder="e.g., Dry clean only, Hand wash in cold water, Iron on low heat"
                    rows={3}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="sizing">Sizing Information</Label>
                  <Input
                    id="sizing"
                    value={userInput.sizing || ''}
                    onChange={(e) => updateInput('sizing', e.target.value)}
                    placeholder="e.g., Available in XS-XXL, Custom sizing available, One size fits all"
                  />
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="targetKeywords">Target Keywords</Label>
                  <Input
                    id="targetKeywords"
                    value={userInput.targetKeywords || ''}
                    onChange={(e) => updateInput('targetKeywords', e.target.value)}
                    placeholder="e.g., Indian kurta, ethnic wear, traditional dress, festival outfit"
                  />
                  <p className="text-xs text-gray-500">
                    Separate keywords with commas. These will be included in SEO title and description.
                  </p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">SEO Tips:</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Include your main product type (kurta, saree, lehenga, etc.)</li>
                    <li>• Add occasion keywords (wedding, festival, party)</li>
                    <li>• Include material keywords (silk, cotton, chiffon)</li>
                    <li>• Consider regional terms (Indian, ethnic, traditional)</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Preview Data */}
            <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">AI will use this data:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Product:</strong> {productName || 'Not specified'}</div>
                <div><strong>Category:</strong> {categoryName || 'Not specified'}</div>
                {images.length > 0 && (
                  <div><strong>Images:</strong> {images.length} image{images.length > 1 ? 's' : ''} for analysis</div>
                )}
                {userInput.fabricType && (
                  <div><strong>Fabric:</strong> {userInput.fabricType}</div>
                )}
                {userInput.occasion && (
                  <div><strong>Occasion:</strong> {userInput.occasion}</div>
                )}
                {userInput.specialFeatures && (
                  <div><strong>Features:</strong> {userInput.specialFeatures}</div>
                )}
                {userInput.craftmanship && (
                  <div><strong>Craftsmanship:</strong> {userInput.craftmanship.substring(0, 50)}{userInput.craftmanship.length > 50 ? '...' : ''}</div>
                )}
                {userInput.targetKeywords && (
                  <div><strong>SEO Keywords:</strong> {userInput.targetKeywords}</div>
                )}
              </div>
            </div>

            {/* Enhanced Generation Buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => handleGenerate('short_description')}
                disabled={!isReadyForAI || isGenerating}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <Wand2 className="h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Generate Enhanced Short Description'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => handleGenerate('product_description')}
                disabled={!isReadyForAI || isGenerating}
                className="flex items-center gap-2"
              >
                <Wand2 className="h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Generate Enhanced Full Description'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => handleGenerate('seo_content')}
                disabled={!isReadyForAI || isGenerating}
                className="flex items-center gap-2"
              >
                <Type className="h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Generate SEO Content'}
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Integration example for ProductForm
// Add this to your ProductForm component:

/*
// In your ProductForm component, add this state for AI generation
const [isGeneratingAI, setIsGeneratingAI] = useState(false)

// Enhanced AI generation handler
const handleAIGeneration = async (type: 'short_description' | 'product_description' | 'seo_content', userInput: AIInputData) => {
  if (!isReadyForAI()) return

  setIsGeneratingAI(true)
  
  try {
    const context = {
      name: formData.name.trim(),
      category: categories.find(c => c.id === formData.categoryId)?.name,
      price: formData.sellingPriceUSD,
      materials: extractMaterialsFromForm(),
      colors: extractColorsFromForm(),
      tags: formData.tags,
      images: formData.images,
      userInput // Include user-provided context
    }

    const response = await fetch('/api/admin/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        context,
        options: {
          tone: 'elegant',
          maxTokens: type === 'short_description' ? 80 : 200
        }
      })
    })

    const data = await response.json()

    if (data.success) {
      if (type === 'short_description') {
        handleInputChange('shortDescription', data.content)
      } else if (type === 'product_description') {
        handleInputChange('description', data.content)
      } else if (type === 'seo_content') {
        if (data.content.title) handleInputChange('seoTitle', data.content.title)
        if (data.content.description) handleInputChange('seoDescription', data.content.description)
      }
      
      setSuccessMessage(`${type.replace('_', ' ')} generated successfully!`)
      setTimeout(() => setSuccessMessage(''), 3000)
    } else {
      setErrors(prev => ({ ...prev, aiGeneration: data.error }))
    }
  } catch (error) {
    setErrors(prev => ({
      ...prev,
      aiGeneration: `Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`
    }))
  } finally {
    setIsGeneratingAI(false)
  }
}

// Then add this component in your ProductForm JSX:
<AIGenerationPanel
  productName={formData.name}
  categoryName={categories.find(c => c.id === formData.categoryId)?.name || ''}
  images={formData.images}
  onGenerate={handleAIGeneration}
  isGenerating={isGeneratingAI}
/>
*/