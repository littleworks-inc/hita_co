'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui'
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react'

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  disabled?: boolean
}

export default function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 5,
  disabled = false 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files || disabled) return

    const remainingSlots = maxImages - images.length
    const filesToProcess = Math.min(files.length, remainingSlots)

    setUploading(true)

    // Process each file
    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i]
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error('Only image files are allowed')
        continue
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.error('File size must be less than 5MB')
        continue
      }

      // Convert to base64 for preview (in production, upload to cloud storage)
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        onImagesChange([...images, dataUrl])
      }
      reader.readAsDataURL(file)
    }

    setUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const canAddMore = images.length < maxImages

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canAddMore && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={disabled}
          />
          
          <div className="space-y-2">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {uploading ? 'Uploading...' : 'Upload product images'}
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop files here, or click to select
              </p>
            </div>
            <div className="text-xs text-gray-400">
              PNG, JPG, WEBP up to 5MB each • Maximum {maxImages} images
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={image}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </button>
              
              {/* Primary Badge */}
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}
            </div>
          ))}

          {/* Add More Button */}
          {canAddMore && (
            <button
              type="button"
              onClick={() => !disabled && fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 flex items-center justify-center group transition-colors"
              disabled={disabled}
            >
              <div className="text-center">
                <Plus className="mx-auto h-8 w-8 text-gray-400 group-hover:text-gray-500" />
                <p className="text-sm text-gray-500 mt-1">Add Image</p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Image Count */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>{images.length} of {maxImages} images uploaded</span>
        {images.length > 0 && (
          <span>First image will be used as the main product image</span>
        )}
      </div>

      {/* Guidelines */}
      <div className="bg-blue-50 p-3 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-1">Image Guidelines:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Use high-quality images (minimum 800x800px recommended)</li>
          <li>• First image will be the main product image</li>
          <li>• Show product from different angles</li>
          <li>• Use good lighting and clean backgrounds</li>
          <li>• Supported formats: JPG, PNG, WEBP</li>
        </ul>
      </div>
    </div>
  )
}