'use client'

import { useState } from 'react'
import { Button, Input } from '@/components/ui'
import { 
  Palette, 
  Wand2, 
  Copy, 
  Check, 
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react'

interface EnhancedColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
  description?: string
  suggestions?: string[]
  disabled?: boolean
}

export default function EnhancedColorPicker({
  label,
  value,
  onChange,
  description,
  suggestions = [],
  disabled = false
}: EnhancedColorPickerProps) {
  const [inputValue, setInputValue] = useState(value)
  const [copied, setCopied] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleColorChange = (color: string) => {
    setInputValue(color)
    onChange(color)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setInputValue(color)
    
    // Validate hex color format
    if (/^#[0-9A-F]{6}$/i.test(color)) {
      onChange(color)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy color:', err)
    }
  }

  // Predefined color palettes for different brand personalities
  const brandPalettes = {
    luxury: {
      name: 'Luxury',
      colors: ['#1a1a1a', '#2d2d2d', '#8b7355', '#c9a876', '#000000']
    },
    vibrant: {
      name: 'Vibrant',
      colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7']
    },
    minimal: {
      name: 'Minimal',
      colors: ['#2c3e50', '#34495e', '#95a5a6', '#bdc3c7', '#ecf0f1']
    },
    warm: {
      name: 'Warm',
      colors: ['#e17055', '#fdcb6e', '#fd79a8', '#fdcb6e', '#fab1a0']
    },
    professional: {
      name: 'Professional',
      colors: ['#2d3436', '#636e72', '#74b9ff', '#0984e3', '#6c5ce7']
    },
    nature: {
      name: 'Nature',
      colors: ['#00b894', '#55a3ff', '#fd79a8', '#fdcb6e', '#e17055']
    }
  }

  // Generate analogous colors (colors next to each other on color wheel)
  const generateAnalogousColors = (baseColor: string) => {
    // This is a simplified version - in production, you'd use a proper color library
    const colors = [baseColor]
    
    // Add some variations (this is simplified)
    const variations = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
      '#74b9ff', '#a29bfe', '#6c5ce7', '#fd79a8', '#fdcb6e'
    ]
    
    return variations.slice(0, 4)
  }

  const analogousColors = generateAnalogousColors(value)

  return (
    <div className="space-y-4">
      {/* Label and Description */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          {suggestions.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="h-6 px-2 text-xs"
            >
              <Wand2 className="h-3 w-3 mr-1" />
              Suggestions
            </Button>
          )}
        </div>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>

      {/* Main Color Input */}
      <div className="flex items-center gap-3">
        {/* Color Preview & Picker */}
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => handleColorChange(e.target.value)}
            disabled={disabled}
            className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer disabled:cursor-not-allowed shadow-sm"
          />
          <div className="absolute inset-0 border-2 border-gray-300 rounded-lg pointer-events-none" />
        </div>

        {/* Color Code Input */}
        <div className="flex-1">
          <div className="flex">
            <Input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="#000000"
              className="font-mono text-sm rounded-r-none"
              disabled={disabled}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="rounded-l-none border-l-0 px-3"
              disabled={disabled}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Color Information */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="text-gray-500">
            <span className="font-medium">RGB:</span> {/* Add RGB conversion here */}
          </span>
          <span className="text-gray-500">
            <span className="font-medium">HSL:</span> {/* Add HSL conversion here */}
          </span>
        </div>
        
        <div className="flex items-center gap-1 text-gray-500">
          <div 
            className="w-3 h-3 rounded border"
            style={{ backgroundColor: value }}
          />
          <span className="font-mono">{value}</span>
        </div>
      </div>

      {/* Analogous Colors */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-gray-400" />
          <span className="text-xs font-medium text-gray-600">Similar Colors</span>
        </div>
        <div className="flex gap-1">
          {analogousColors.map((color, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleColorChange(color)}
              disabled={disabled}
              className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-300 transition-colors disabled:cursor-not-allowed hover:scale-105"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Brand Palette Suggestions */}
      {showSuggestions && (
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Brand Palettes</span>
          </div>
          
          <div className="space-y-2">
            {Object.entries(brandPalettes).map(([key, palette]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600 w-20">
                    {palette.name}
                  </span>
                  <div className="flex gap-1">
                    {palette.colors.map((color, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleColorChange(color)}
                        disabled={disabled}
                        className="w-6 h-6 rounded border border-gray-200 hover:border-gray-300 transition-colors disabled:cursor-not-allowed"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleColorChange(palette.colors[0])}
                  disabled={disabled}
                  className="h-6 px-2 text-xs"
                >
                  Use
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 p-2 bg-blue-50 rounded border border-blue-200">
            <Info className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              Choose colors that reflect your brand personality. Luxury brands often use darker colors, 
              while vibrant brands use bright, energetic colors.
            </p>
          </div>
        </div>
      )}

      {/* Custom Suggestions */}
      {suggestions.length > 0 && !showSuggestions && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-gray-600">Recommended for this field:</span>
          <div className="flex gap-1 flex-wrap">
            {suggestions.map((color, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleColorChange(color)}
                disabled={disabled}
                className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-300 transition-colors disabled:cursor-not-allowed hover:scale-105"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}