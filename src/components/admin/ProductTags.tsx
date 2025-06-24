// =====================================
// src/components/admin/ProductTags.tsx - FIXED
// =====================================
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Button } from '@/components/ui'
import { Plus, X } from 'lucide-react'

interface Product {
  tags: string[]
  isActive: boolean
  isFeatured: boolean
}

interface ProductTagsProps {
  formData: Product
  onInputChange: (field: keyof Product, value: any) => void
}

export default function ProductTags({ 
  formData, 
  onInputChange 
}: ProductTagsProps) {
  const [tagInput, setTagInput] = useState('')

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      onInputChange('tags', [...formData.tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags & Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tags */}
        <div className="space-y-2">
          <Label>Product Tags</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            />
            <Button type="button" onClick={handleAddTag} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Product Settings */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center space-x-2">
            <input
              id="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => onInputChange('isActive', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <Label htmlFor="isActive">Active Product</Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="isFeatured"
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => onInputChange('isFeatured', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <Label htmlFor="isFeatured">Featured Product</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}