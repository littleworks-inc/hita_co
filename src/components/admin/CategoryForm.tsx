'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui'
import { slugify } from '@/lib/utils'
import {
  FolderTree,
  Save,
  Type,
  Hash,
  FileText,
  Layers
} from 'lucide-react'

interface Category {
  id?: string
  name: string
  description: string
  slug: string
  parentId: string | null
}

interface ParentCategory {
  id: string
  name: string
}

interface CategoryFormProps {
  category?: Category
  parentCategories: ParentCategory[]
  mode: 'create' | 'edit'
}

export default function CategoryForm({ category, parentCategories, mode }: CategoryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<Category>({
    name: category?.name || '',
    description: category?.description || '',
    slug: category?.slug || '',
    parentId: category?.parentId || null
  })

  // Auto-generate slug when name changes (only for new categories)
  useEffect(() => {
    if (mode === 'create' && formData.name && !formData.slug) {
      setFormData(prev => ({
        ...prev,
        slug: slugify(formData.name)
      }))
    }
  }, [formData.name, mode])

  const handleInputChange = (field: keyof Category, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Category name is required'
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'

    // Validate slug format
    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)

    try {
      const url = mode === 'create' 
        ? '/api/admin/categories'
        : `/api/admin/categories/${category?.id}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null
        }),
      })

      if (response.ok) {
        router.push('/admin/categories')
        router.refresh()
      } else {
        const errorData = await response.json()
        setErrors({ submit: errorData.error || 'Something went wrong' })
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Category Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Category Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Jewelry, Earrings, Sarees"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              URL Slug *
            </Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase())}
              placeholder="e.g., jewelry, earrings, sarees"
              className={errors.slug ? 'border-red-500' : ''}
            />
            {errors.slug && (
              <p className="text-sm text-red-600">{errors.slug}</p>
            )}
            <p className="text-sm text-gray-500">
              Used in URLs. Only lowercase letters, numbers, and hyphens allowed.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description *
            </Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of this category..."
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Hierarchy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Category Hierarchy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parentId" className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              Parent Category
            </Label>
            <select
              id="parentId"
              value={formData.parentId || ''}
              onChange={(e) => handleInputChange('parentId', e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None (Main Category)</option>
              {parentCategories.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500">
              Select a parent category to create a subcategory, or leave empty for a main category.
            </p>
          </div>

          {/* Hierarchy Preview */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">Category Path Preview:</div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {formData.parentId ? (
                <>
                  <span className="font-medium">
                    {parentCategories.find(p => p.id === formData.parentId)?.name || 'Parent Category'}
                  </span>
                  <span>→</span>
                  <span className="font-medium text-blue-600">
                    {formData.name || 'Category Name'}
                  </span>
                </>
              ) : (
                <span className="font-medium text-blue-600">
                  {formData.name || 'Category Name'} (Main Category)
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Error */}
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : mode === 'create' ? 'Create Category' : 'Update Category'}
        </Button>
      </div>
    </form>
  )
}