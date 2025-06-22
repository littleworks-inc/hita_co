'use client'

import { useState, useRef } from 'react'
import { Button, Input, Label } from '@/components/ui'
import {
  Upload,
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Crop,
  Palette
} from 'lucide-react'

interface EnhancedLogoUploadProps {
  label: string
  value: string
  onChange: (url: string) => void
  type?: 'logo' | 'favicon'
  description?: string
  disabled?: boolean
}

export default function EnhancedLogoUpload({
  label,
  value,
  onChange,
  type = 'logo',
  description,
  disabled = false
}: EnhancedLogoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState(value)
  const [dragOver, setDragOver] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUrlChange = (url: string) => {
    setUrlInput(url)
    setImageError(false)
    
    // Validate URL format
    if (url && (url.startsWith('http') || url.startsWith('data:'))) {
      onChange(url)
    } else if (!url) {
      onChange('')
    }
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return

    const file = files[0]
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setUploading(true)

    try {
      // Convert to base64 for preview (in production, you'd upload to a service)
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        handleUrlChange(dataUrl)
        setUploading(false)
      }
      reader.onerror = () => {
        alert('Failed to read file')
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file')
      setUploading(false)
    }
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

  const handleImageError = () => {
    setImageError(true)
  }

  const handleImageLoad = () => {
    setImageError(false)
  }

  const clearImage = () => {
    onChange('')
    setUrlInput('')
    setImageError(false)
  }

  const logoRecommendations = {
    logo: {
      dimensions: '200x80px or larger',
      format: 'PNG with transparent background preferred',
      tips: [
        'Use vector formats (SVG) for crisp scaling',
        'Ensure logo is readable at small sizes',
        'Test on both light and dark backgrounds'
      ]
    },
    favicon: {
      dimensions: '32x32px or 16x16px',
      format: 'ICO, PNG, or SVG',
      tips: [
        'Keep design simple and recognizable',
        'Use high contrast colors',
        'Test how it looks in browser tabs'
      ]
    }
  }

  const currentRec = logoRecommendations[type]

  return (
    <div className="space-y-4">
      {/* Label and Description */}
      <div>
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>

      {/* Upload Method Selector */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setUploadMethod('url')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            uploadMethod === 'url'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <LinkIcon className="h-4 w-4" />
          URL
        </button>
        <button
          type="button"
          onClick={() => setUploadMethod('file')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            uploadMethod === 'file'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Upload className="h-4 w-4" />
          Upload
        </button>
      </div>

      {/* Current Image Preview */}
      {value && (
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border">
          <div className="relative">
            {type === 'logo' ? (
              <img
                src={value}
                alt="Store logo"
                className="w-20 h-12 object-contain border border-gray-200 rounded-lg bg-white"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            ) : (
              <img
                src={value}
                alt="Favicon"
                className="w-8 h-8 object-contain border border-gray-200 rounded bg-white"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            )}
            
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {imageError ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">Failed to load image</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Image loaded successfully</span>
                  </>
                )}
              </div>
              
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(value, '_blank')}
                  className="h-7 px-2"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearImage}
                  className="h-7 px-2"
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 font-mono break-all">
              {value.length > 50 ? `${value.substring(0, 50)}...` : value}
            </p>
          </div>
        </div>
      )}

      {/* URL Input Method */}
      {uploadMethod === 'url' && (
        <div className="space-y-2">
          <Input
            type="url"
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={`Enter ${type} URL (https://...)`}
            disabled={disabled}
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-500">
            Paste a URL to your {type} image (PNG, JPG, SVG, or {type === 'favicon' ? 'ICO' : 'WebP'})
          </p>
        </div>
      )}

      {/* File Upload Method */}
      {uploadMethod === 'file' && (
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
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={disabled}
          />
          
          <div className="space-y-2">
            {uploading ? (
              <>
                <RefreshCw className="h-8 w-8 text-blue-500 mx-auto animate-spin" />
                <p className="text-sm text-blue-600">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Drop your {type} here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {currentRec.format} • Max 5MB • {currentRec.dimensions}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <div className="flex items-start gap-2">
          <ImageIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-900">
              {type === 'logo' ? 'Logo' : 'Favicon'} Guidelines
            </h4>
            
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Recommended size:</strong> {currentRec.dimensions}</p>
              <p><strong>Format:</strong> {currentRec.format}</p>
            </div>

            <ul className="text-xs text-blue-700 space-y-1">
              {currentRec.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Free Logo Resources */}
      {type === 'logo' && !value && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-start gap-2">
            <Palette className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Need a logo?</h4>
              <p className="text-xs text-gray-600">
                You can create a free logo using these tools:
              </p>
              <div className="flex gap-2 text-xs">
                <a 
                  href="https://www.canva.com/create/logos/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Canva
                </a>
                <span className="text-gray-400">•</span>
                <a 
                  href="https://logomaker.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  LogoMaker
                </a>
                <span className="text-gray-400">•</span>
                <a 
                  href="https://www.freelogodesign.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  FreeLogoDesign
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}