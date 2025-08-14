// ✅ FIXED: src/components/admin/AIGenerationPanel.tsx
// Fix the undefined images issue

'use client'

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
  categoryName?: string
  images?: string[]  // ✅ FIXED: Make optional
  onGenerate: (type: 'short_description' | 'product_description' | 'seo_content', userInput?: AIInputData) => Promise<void>
  isGenerating: boolean
  hasSizes?: boolean // ✅ NEW: Size info for AI context
  sizes?: string[]   // ✅ NEW: Available sizes
}

export function AIGenerationPanel({ 
  productName, 
  categoryName = '', // ✅ FIXED: Default value
  images = [],       // ✅ FIXED: Default to empty array
  onGenerate, 
  isGenerating,
  hasSizes = false,
  sizes = []
}: AIGenerationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [userInput, setUserInput] = useState<AIInputData>({})

  const isReadyForAI = productName?.trim() && categoryName?.trim()

  const handleGenerate = async (type: 'short_description' | 'product_description' | 'seo_content') => {
    if (!isReadyForAI) return
    
    // ✅ ENHANCED: Include size information in AI context
    const enhancedUserInput = {
      ...userInput,
      sizing: hasSizes && sizes.length > 0 
        ? `Available in sizes: ${sizes.join(', ')}` 
        : 'One size fits all'
    }
    
    await onGenerate(type, enhancedUserInput)
  }

  const updateInput = (field: keyof AIInputData, value: string) => {
    setUserInput(prev => ({ ...prev, [field]: value }))
  }

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
              {/* ✅ FIXED: Proper null check for images */}
              {images && images.length > 0 && (
                <span className="flex items-center gap-1 ml-2">
                  <ImageIcon className="h-3 w-3" />
                  {images.length} image{images.length > 1 ? 's' : ''} available
                </span>
              )}
              {/* ✅ NEW: Show size info */}
              {hasSizes && sizes && sizes.length > 0 && (
                <span className="flex items-center gap-1 ml-2">
                  <Shirt className="h-3 w-3" />
                  {sizes.length} size{sizes.length > 1 ? 's' : ''} configured
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

          {/* Enhanced Context Input */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                Provide additional context for better AI results
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fabricType" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Fabric/Material
                </Label>
                <Input
                  id="fabricType"
                  value={userInput.fabricType || ''}
                  onChange={(e) => updateInput('fabricType', e.target.value)}
                  placeholder="e.g., Cotton, Silk, Chiffon"
                  disabled={isGenerating}
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
                  placeholder="e.g., Wedding, Festival, Casual"
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialFeatures" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Special Features
                </Label>
                <Input
                  id="specialFeatures"
                  value={userInput.specialFeatures || ''}
                  onChange={(e) => updateInput('specialFeatures', e.target.value)}
                  placeholder="e.g., Handwoven, Embroidered, Sequined"
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetKeywords" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Target Keywords
                </Label>
                <Input
                  id="targetKeywords"
                  value={userInput.targetKeywords || ''}
                  onChange={(e) => updateInput('targetKeywords', e.target.value)}
                  placeholder="e.g., ethnic wear, traditional, elegant"
                  disabled={isGenerating}
                />
              </div>
            </div>

            {/* Care Instructions */}
            <div className="space-y-2 mt-4">
              <Label htmlFor="careInstructions" className="flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Care Instructions
              </Label>
              <Textarea
                id="careInstructions"
                value={userInput.careInstructions || ''}
                onChange={(e) => updateInput('careInstructions', e.target.value)}
                placeholder="e.g., Dry clean only, Hand wash in cold water"
                rows={2}
                disabled={isGenerating}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}