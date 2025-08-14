// =====================================
// src/components/admin/ProductSEO.tsx - CORRECTED SEO COMPONENT
// =====================================
'use client'

import { Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/components/ui'
import { Search } from 'lucide-react'

interface Product {
  seoTitle?: string      // ✅ CHANGED: Made optional to match ProductForm interface
  seoDescription?: string // ✅ CHANGED: Made optional to match ProductForm interface
}

interface ProductSEOProps {
  formData: Product
  onInputChange: (field: keyof Product, value: any) => void
}

export default function ProductSEO({ 
  formData, 
  onInputChange 
}: ProductSEOProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          SEO Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="seoTitle">SEO Title</Label>
          <Input
            id="seoTitle"
            value={formData.seoTitle || ''}  // ✅ Already handles undefined correctly
            onChange={(e) => onInputChange('seoTitle', e.target.value)}
            placeholder="SEO optimized title"
          />
          <p className="text-xs text-gray-500">
            {(formData.seoTitle || '').length}/60 characters (recommended)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seoDescription">SEO Description</Label>
          <textarea
            id="seoDescription"
            value={formData.seoDescription || ''}  // ✅ Already handles undefined correctly
            onChange={(e) => onInputChange('seoDescription', e.target.value)}
            placeholder="SEO optimized description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500">
            {(formData.seoDescription || '').length}/160 characters (recommended)
          </p>
        </div>

        {/* SEO Preview */}
        {(formData.seoTitle || formData.seoDescription) && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">SEO Preview</h4>
            <div className="space-y-1">
              <div className="text-blue-600 text-lg font-medium truncate">
                {formData.seoTitle || 'Product Title'}
              </div>
              <div className="text-green-700 text-sm">
                www.yourstore.com/products/product-name
              </div>
              <div className="text-gray-600 text-sm leading-relaxed">
                {formData.seoDescription || 'Product description will appear here...'}
              </div>
            </div>
          </div>
        )}

        {/* SEO Tips */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-700 mb-2">SEO Tips</h4>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>• Include your main keyword in the title</li>
            <li>• Keep title under 60 characters</li>
            <li>• Write compelling meta descriptions under 160 characters</li>
            <li>• Include relevant keywords naturally</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}