// src/app/admin/hero-slides/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { Plus, Edit3, Trash2, Eye, EyeOff, GripVertical, Save, X, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import ImageUpload from '@/components/admin/ImageUpload'
import AdminNavigation from '@/components/admin/AdminNavigation'

interface HeroSlide {
  id: string
  title: string
  subtitle?: string
  description?: string
  ctaText?: string
  ctaLink?: string
  image?: string
  gradient?: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface SlideFormData {
  title: string
  subtitle: string
  description: string
  ctaText: string
  ctaLink: string
  image: string
  gradient: string
  isActive: boolean
}

const GRADIENT_OPTIONS = [
  { value: 'from-purple-600 to-pink-600', label: 'Purple to Pink', preview: 'bg-gradient-to-r from-purple-600 to-pink-600' },
  { value: 'from-blue-600 to-indigo-600', label: 'Blue to Indigo', preview: 'bg-gradient-to-r from-blue-600 to-indigo-600' },
  { value: 'from-green-600 to-teal-600', label: 'Green to Teal', preview: 'bg-gradient-to-r from-green-600 to-teal-600' },
  { value: 'from-red-600 to-orange-600', label: 'Red to Orange', preview: 'bg-gradient-to-r from-red-600 to-orange-600' },
  { value: 'from-gray-600 to-gray-800', label: 'Gray to Dark Gray', preview: 'bg-gradient-to-r from-gray-600 to-gray-800' },
]

export default function HeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [formData, setFormData] = useState<SlideFormData>({
    title: '',
    subtitle: '',
    description: '',
    ctaText: '',
    ctaLink: '',
    image: '',
    gradient: 'from-purple-600 to-pink-600',
    isActive: true
  })

  // Helper function to show alerts
  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertMessage({ type, message })
    setTimeout(() => setAlertMessage(null), 5000) // Auto-hide after 5 seconds
  }

  // Load slides
  useEffect(() => {
    fetchSlides()
  }, [])

  const fetchSlides = async () => {
    try {
      const response = await fetch('/api/admin/hero-slides')
      if (response.ok) {
        const data = await response.json()
        setSlides(data)
      }
    } catch (error) {
      console.error('Error fetching slides:', error)
      showAlert('error', 'Failed to load hero slides')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSlide = () => {
    if (slides.length >= 5) {
      showAlert('error', 'Maximum 5 slides allowed')
      return
    }
    setIsCreating(true)
    setEditingSlide(null)
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      ctaText: 'Shop Now',
      ctaLink: '/products',
      image: '',
      gradient: 'from-purple-600 to-pink-600',
      isActive: true
    })
  }

  const handleEditSlide = (slide: HeroSlide) => {
    setEditingSlide(slide)
    setIsCreating(false)
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle || '',
      description: slide.description || '',
      ctaText: slide.ctaText || '',
      ctaLink: slide.ctaLink || '',
      image: slide.image || '',
      gradient: slide.gradient || 'from-purple-600 to-pink-600',
      isActive: slide.isActive
    })
  }

  const handleSaveSlide = async () => {
    if (!formData.title.trim()) {
      showAlert('error', 'Title is required')
      return
    }

    try {
      const url = editingSlide ? `/api/admin/hero-slides/${editingSlide.id}` : '/api/admin/hero-slides'
      const method = editingSlide ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showAlert('success', editingSlide ? 'Slide updated successfully' : 'Slide created successfully')
        setEditingSlide(null)
        setIsCreating(false)
        fetchSlides()
      } else {
        showAlert('error', 'Failed to save slide')
      }
    } catch (error) {
      console.error('Error saving slide:', error)
      showAlert('error', 'Failed to save slide')
    }
  }

  const handleDeleteSlide = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slide?')) return

    try {
      const response = await fetch(`/api/admin/hero-slides/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showAlert('success', 'Slide deleted successfully')
        fetchSlides()
      } else {
        showAlert('error', 'Failed to delete slide')
      }
    } catch (error) {
      console.error('Error deleting slide:', error)
      showAlert('error', 'Failed to delete slide')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/hero-slides/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        showAlert('success', `Slide ${isActive ? 'enabled' : 'disabled'}`)
        fetchSlides()
      } else {
        showAlert('error', 'Failed to update slide')
      }
    } catch (error) {
      console.error('Error toggling slide:', error)
      showAlert('error', 'Failed to update slide')
    }
  }

  const handleReorder = async (slideId: string, newOrder: number) => {
    try {
      const response = await fetch(`/api/admin/hero-slides/${slideId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder })
      })

      if (response.ok) {
        fetchSlides()
      }
    } catch (error) {
      console.error('Error reordering slides:', error)
      showAlert('error', 'Failed to reorder slides')
    }
  }

  const cancelEdit = () => {
    setEditingSlide(null)
    setIsCreating(false)
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      ctaText: '',
      ctaLink: '',
      image: '',
      gradient: 'from-purple-600 to-pink-600',
      isActive: true
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <main className="lg:pl-64">
        <div className="p-6 max-w-6xl mx-auto">
          {/* Alert Messages */}
          {alertMessage && (
            <Alert 
              variant={alertMessage.type === 'success' ? 'success' : 'destructive'} 
              className="mb-6"
            >
              {alertMessage.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{alertMessage.message}</AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hero Slides</h1>
          <p className="text-gray-600 mt-1">Manage your homepage hero section slides</p>
        </div>
        <Button
          onClick={handleCreateSlide}
          disabled={slides.length >= 5}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Slide {slides.length > 0 && `(${slides.length}/5)`}
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingSlide) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingSlide ? 'Edit Slide' : 'Create New Slide'}
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter slide title"
                />
              </div>
              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Enter slide subtitle"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter slide description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ctaText">CTA Button Text</Label>
                <Input
                  id="ctaText"
                  value={formData.ctaText}
                  onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                  placeholder="e.g., Shop Now"
                />
              </div>
              <div>
                <Label htmlFor="ctaLink">CTA Button Link</Label>
                <Input
                  id="ctaLink"
                  value={formData.ctaLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, ctaLink: e.target.value }))}
                  placeholder="e.g., /products"
                />
              </div>
            </div>

            <div>
              <Label>Hero Image</Label>
              <ImageUpload
                value={formData.image ? [formData.image] : []}
                onChange={(images) => setFormData(prev => ({ ...prev, image: images[0] || '' }))}
                maxImages={1}
                maxVideos={0}
                multiple={false}
                label="Upload hero image"
                description="Recommended: 1920x1080px or larger"
              />
            </div>

            <div>
              <Label>Fallback Gradient</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {GRADIENT_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, gradient: option.value }))}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.gradient === option.value
                        ? 'border-purple-500 ring-2 ring-purple-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-full h-8 rounded ${option.preview} mb-1`}></div>
                    <p className="text-xs text-gray-600">{option.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveSlide} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Save Slide
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slides List */}
      <div className="space-y-4">
        {slides.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-gray-500">
                <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No hero slides yet</h3>
                <p className="text-sm">Create your first slide to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          slides
            .sort((a, b) => a.order - b.order)
            .map((slide, index) => (
              <Card key={slide.id} className={`${slide.isActive ? 'border-green-200' : 'border-gray-200'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    </div>

                    {slide.image && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{slide.title}</h3>
                      {slide.subtitle && (
                        <p className="text-sm text-gray-600">{slide.subtitle}</p>
                      )}
                      {slide.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{slide.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(slide.id, !slide.isActive)}
                      >
                        {slide.isActive ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSlide(slide)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>

      {/* Info Card */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Hero Slides Tips</h4>
              <ul className="text-sm text-blue-800 mt-1 space-y-1">
                <li>• Maximum 5 slides allowed</li>
                <li>• Slides auto-rotate every 5 seconds</li>
                <li>• Recommended image size: 1920x1080px or larger</li>
                <li>• Use compelling titles and clear call-to-action buttons</li>
                <li>• Inactive slides won't be shown to customers</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </main>
</div>
  )
}