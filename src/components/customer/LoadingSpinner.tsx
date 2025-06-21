'use client'

import { Sparkles } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      {/* Animated Spinner */}
      <div className="relative">
        {/* Outer Ring */}
        <div className={`${sizeClasses[size]} border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin`}></div>
        
        {/* Inner Sparkle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-5 w-5' : 'h-7 w-7'} text-purple-600 animate-pulse`} />
        </div>
      </div>

      {/* Loading Text */}
      {text && (
        <p className={`mt-4 text-gray-600 font-medium ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}

      {/* Animated Dots */}
      <div className="flex space-x-1 mt-2">
        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  )
}