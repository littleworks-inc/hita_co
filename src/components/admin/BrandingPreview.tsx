'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import {
  Monitor,
  Smartphone,
  Eye,
  ShoppingBag,
  Star,
  Heart,
  User,
  Search,
  ExternalLink
} from 'lucide-react'

interface BrandingPreviewProps {
  storeName: string
  tagline: string
  logo: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

export default function BrandingPreview({
  storeName,
  tagline,
  logo,
  primaryColor,
  secondaryColor,
  accentColor
}: BrandingPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

  const sampleProducts = [
    { name: 'Handcrafted Jewelry', price: '$89', image: '🎨' },
    { name: 'Ethnic Wear', price: '$149', image: '👗' },
    { name: 'Traditional Art', price: '$199', image: '🖼️' }
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Preview Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Live Preview</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Preview Mode Toggle */}
            <div className="flex bg-white rounded-md border border-gray-200 p-1">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  previewMode === 'desktop'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  previewMode === 'mobile'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>

            {/* Open in New Tab */}
            <Button variant="outline" size="sm" className="text-xs">
              <ExternalLink className="h-3 w-3 mr-1" />
              View Live
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className={`bg-gray-100 p-4 ${previewMode === 'mobile' ? 'flex justify-center' : ''}`}>
        <div className={`bg-white shadow-lg ${
          previewMode === 'mobile' 
            ? 'w-80 h-96 rounded-lg overflow-hidden' 
            : 'w-full h-80 rounded-lg overflow-hidden'
        }`}>
          
          {/* Mock Store Header */}
          <div 
            className="px-4 py-3 text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {logo ? (
                  <img 
                    src={logo} 
                    alt={storeName}
                    className="w-8 h-8 object-contain bg-white rounded p-1"
                  />
                ) : (
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">
                      {storeName.charAt(0)}
                    </span>
                  </div>
                )}
                
                <div>
                  <h1 className={`font-bold ${previewMode === 'mobile' ? 'text-sm' : 'text-lg'}`}>
                    {storeName || 'Your Store'}
                  </h1>
                  {tagline && previewMode === 'desktop' && (
                    <p className="text-xs opacity-90">{tagline}</p>
                  )}
                </div>
              </div>

              {/* Mock Navigation Icons */}
              <div className="flex items-center gap-2 text-white">
                <Search className="h-4 w-4" />
                <Heart className="h-4 w-4" />
                <ShoppingBag className="h-4 w-4" />
                <User className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Mock Content */}
          <div className="p-4 space-y-4">
            {/* Hero Section */}
            <div 
              className="rounded-lg p-4 text-white text-center"
              style={{ backgroundColor: accentColor }}
            >
              <h2 className={`font-bold ${previewMode === 'mobile' ? 'text-sm' : 'text-lg'}`}>
                {tagline || 'Welcome to our store!'}
              </h2>
              <p className="text-xs opacity-90 mt-1">
                Discover amazing products
              </p>
            </div>

            {/* Mock Products */}
            <div className="space-y-2">
              <h3 className={`font-semibold text-gray-800 ${previewMode === 'mobile' ? 'text-xs' : 'text-sm'}`}>
                Featured Products
              </h3>
              
              <div className={`grid gap-2 ${previewMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-3'}`}>
                {sampleProducts.map((product, index) => (
                  <div key={index} className="border border-gray-200 rounded p-2">
                    <div className="text-center mb-2">
                      <span className="text-2xl">{product.image}</span>
                    </div>
                    <h4 className="text-xs font-medium text-gray-800 mb-1">
                      {product.name}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: primaryColor }}>
                        {product.price}
                      </span>
                      <button
                        className="px-2 py-1 rounded text-xs text-white font-medium"
                        style={{ backgroundColor: accentColor }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock Button */}
            <button
              className="w-full py-2 rounded font-medium text-white text-sm"
              style={{ backgroundColor: primaryColor }}
            >
              Shop Now
            </button>
          </div>
        </div>
      </div>

      {/* Color Scheme Info */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Colors being used:</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded border"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="text-gray-500">Primary</span>
            </div>
            <div className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded border"
                style={{ backgroundColor: accentColor }}
              />
              <span className="text-gray-500">Accent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}