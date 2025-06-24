'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui'
import { Upload, X, Image as ImageIcon, Plus, Video, Play } from 'lucide-react'

interface ImageUploadProps {
  // ✅ FLEXIBLE: Support both prop naming conventions
  images?: string[]
  value?: string[]
  onImagesChange?: (images: string[]) => void
  onChange?: (images: string[]) => void
  maxImages?: number
  maxVideos?: number
  disabled?: boolean
  multiple?: boolean
  label?: string
  description?: string
}

export default function ImageUpload({ 
  images: imagesProp,
  value: valueProp,
  onImagesChange: onImagesChangeProp,
  onChange: onChangeProp,
  maxImages = 8,
  maxVideos = 2,
  disabled = false,
  multiple = true,
  label,
  description
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ✅ FLEXIBLE: Support both prop naming conventions
  const images = imagesProp || valueProp || []
  const onImagesChange = onImagesChangeProp || onChangeProp || (() => {})

  // Rest of the component remains the same but with proper null checks
  const imageFiles = images.filter(file => !file.includes('video-marker:'))
  const videoFiles = images.filter(file => file.includes('video-marker:'))

  const handleFileSelect = (files: FileList | null) => {
    if (!files || disabled) return

    const remainingImageSlots = maxImages - imageFiles.length
    const remainingVideoSlots = maxVideos - videoFiles.length
    
    setUploading(true)

    const processedFiles: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Check if it's an image or video
      const isVideo = file.type.startsWith('video/')
      const isImage = file.type.startsWith('image/')
      
      if (!isImage && !isVideo) {
        console.error('Only image and video files are allowed')
        continue
      }

      // Check slots available
      if (isVideo && remainingVideoSlots <= 0) {
        console.error(`Maximum ${maxVideos} videos allowed`)
        continue
      }
      
      if (isImage && remainingImageSlots <= 0) {
        console.error(`Maximum ${maxImages} images allowed`)
        continue
      }

      // Validate file size (max 50MB for videos, 5MB for images)
      const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024
      if (file.size > maxSize) {
        console.error(`File size must be less than ${isVideo ? '50MB' : '5MB'}`)
        continue
      }

      // Convert to base64 for preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        // Mark videos with a special prefix for identification
        const markedUrl = isVideo ? `video-marker:${dataUrl}` : dataUrl
        processedFiles.push(markedUrl)
        
        // Update with the new file
        onImagesChange([...images, markedUrl])
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

  const removeFile = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const canAddMore = (imageFiles.length < maxImages) || (videoFiles.length < maxVideos)

  return (
    <div className="space-y-4">
      {/* Label and Description */}
      {label && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">{label}</h3>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      )}

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
            multiple={multiple}
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={disabled}
          />
          
          <div className="space-y-2">
            <div className="flex justify-center gap-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <Video className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {uploading ? 'Uploading...' : 'Upload product images & videos'}
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop files here, or click to select
              </p>
            </div>
            <div className="text-xs text-gray-400">
              Images: PNG, JPG, WEBP up to 5MB • Videos: MP4, MOV up to 50MB<br />
              Maximum {maxImages} images + {maxVideos} videos
            </div>
          </div>
        </div>
      )}

      {/* Files Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((file, index) => {
            const isVideo = file.includes('video-marker:')
            const cleanUrl = isVideo ? file.replace('video-marker:', '') : file
            
            return (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {isVideo ? (
                    <div className="relative w-full h-full">
                      <video
                        src={cleanUrl}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <Play className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded">
                        Video
                      </div>
                    </div>
                  ) : (
                    <img
                      src={cleanUrl}
                      alt={`Product media ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>
                
                {/* Index Badge */}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  {index === 0 ? 'Main' : index + 1}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upload Stats */}
      <div className="flex justify-between text-sm text-gray-500">
        <span>Images: {imageFiles.length}/{maxImages}</span>
        <span>Videos: {videoFiles.length}/{maxVideos}</span>
      </div>
    </div>
  )
}