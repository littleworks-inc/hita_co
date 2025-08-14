'use client'

import { useState } from 'react'
import { Input } from '@/components/ui'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  disabled?: boolean
}

export default function ColorPicker({ value, onChange, disabled = false }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value)

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

  const presetColors = [
    '#1f2937', // Gray-800
    '#374151', // Gray-700
    '#111827', // Gray-900
    '#000000', // Black
    '#ffffff', // White
    '#f3f4f6', // Gray-100
    '#e5e7eb', // Gray-200
    '#dc2626', // Red-600
    '#ea580c', // Orange-600
    '#f59e0b', // Amber-500
    '#eab308', // Yellow-500
    '#65a30d', // Lime-600
    '#16a34a', // Green-600
    '#059669', // Emerald-600
    '#0891b2', // Cyan-600
    '#0284c7', // Sky-600
    '#2563eb', // Blue-600
    '#7c3aed', // Violet-600
    '#c026d3', // Fuchsia-600
    '#e11d48', // Rose-600
  ]

  return (
    <div className="space-y-3">
      {/* Color Input */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => handleColorChange(e.target.value)}
            disabled={disabled}
            className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer disabled:cursor-not-allowed"
          />
        </div>
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="#000000"
          className="font-mono text-sm"
          disabled={disabled}
        />
      </div>

      {/* Preset Colors */}
      <div className="grid grid-cols-10 gap-1">
        {presetColors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => handleColorChange(color)}
            disabled={disabled}
            className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 disabled:cursor-not-allowed ${
              value === color 
                ? 'border-blue-500 shadow-md' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Color Preview */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div 
          className="w-4 h-4 rounded border border-gray-300"
          style={{ backgroundColor: value }}
        />
        <span className="font-mono">{value}</span>
      </div>
    </div>
  )
}