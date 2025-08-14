'use client'

import { Package } from 'lucide-react'

interface ProductImageProps {
  images: string[]
  name: string
  className?: string
}

export default function ProductImage({ images, name, className = "h-12 w-12" }: ProductImageProps) {
  if (images.length > 0) {
    return (
      <img 
        className={`${className} rounded-lg object-cover`}
        src={images[0]}
        alt={name}
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/api/placeholder-image'
        }}
      />
    )
  }

  return (
    <div className={`${className} rounded-lg bg-gray-200 flex items-center justify-center`}>
      <Package className="h-6 w-6 text-gray-400" />
    </div>
  )
}