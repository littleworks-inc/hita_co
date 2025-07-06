'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui'
import {
  Calendar,
  Save,
  MapPin,
  FileText,
  DollarSign,
  Image as ImageIcon,
  X,
  Plus
} from 'lucide-react'

interface Exhibition {
  id?: string
  title: string
  description: string | null
  location: string
  startDate: string
  endDate: string
  participationFee: number
  images: string[]
  isActive: boolean
}

interface ExhibitionFormProps {
  exhibition?: Exhibition
  mode: 'create' | 'edit'
}

export default function ExhibitionForm({ exhibition, mode }: ExhibitionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<Exhibition>({
    title: exhibition?.title || '',
    description: exhibition?.description || '',
    location: exhibition?.location || '',
    startDate: exhibition?.startDate || '',
    endDate: exhibition?.endDate || '',
    participationFee: exhibition?.participationFee || 0,
    images: exhibition?.images || [],
    isActive: exhibition?.isActive ?? true
  })

  const handleInputChange = (field: keyof Exhibition, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleImageAdd = () => {
    const url = prompt('Enter image URL:')
    if (url && url.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url.trim()]
      }))
    }
  }

  const handleImageRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = 'Exhibition title is required'
    if (!formData.location.trim()) newErrors.location = 'Location is required'
    if (!formData.startDate) newErrors.startDate = 'Start date is required'
    if (!formData.endDate) newErrors.endDate = 'End date is required'
    if (formData.participationFee < 0) newErrors.participationFee = 'Participation fee cannot be negative'

    // Validate dates
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      
      if (start >= end) {
        newErrors.endDate = 'End date must be after start date'
      }
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
        ? '/api/admin/exhibitions'
        : `/api/admin/exhibitions/${exhibition?.id}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'

      // Convert dates to ISO strings
      const submitData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        router.push('/admin/exhibitions')
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
            <Calendar className="h-5 w-5" />
            Exhibition Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Exhibition Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Winter Craft Fair 2024"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location *
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., NYC Convention Center, Hall A"
              className={errors.location ? 'border-red-500' : ''}
            />
            {errors.location && (
              <p className="text-sm text-red-600">{errors.location}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date & Time *</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={errors.startDate ? 'border-red-500' : ''}
              />
              {errors.startDate && (
                <p className="text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date & Time *</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className={errors.endDate ? 'border-red-500' : ''}
              />
              {errors.endDate && (
                <p className="text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Participation Fee */}
          <div className="space-y-2">
            <Label htmlFor="participationFee" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Participation Fee
            </Label>
            <Input
              id="participationFee"
              type="number"
              step="0.01"
              min="0"
              value={formData.participationFee}
              onChange={(e) => handleInputChange('participationFee', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className={errors.participationFee ? 'border-red-500' : ''}
            />
            {errors.participationFee && (
              <p className="text-sm text-red-600">{errors.participationFee}</p>
            )}
            <p className="text-sm text-gray-500">
              Cost to participate in this exhibition (booth fee, registration, etc.)
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the exhibition, target audience, expected visitors, etc."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Exhibition Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Exhibition Images
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Images Grid */}
          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={image}
                      alt={`Exhibition image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleImageRemove(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Image Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleImageAdd}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Image URL
          </Button>
          
          <p className="text-sm text-gray-500">
            Add images of the exhibition venue, your booth setup, or promotional materials.
          </p>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isActive">Active Exhibition</Label>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Inactive exhibitions won't appear in public listings and reports.
          </p>
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
          {loading ? 'Saving...' : mode === 'create' ? 'Create Exhibition' : 'Update Exhibition'}
        </Button>
      </div>
    </form>
  )
}