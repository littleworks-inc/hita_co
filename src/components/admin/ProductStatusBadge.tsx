'use client'

import { FileText, Eye, Archive, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductStatusBadgeProps {
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  isFeatured?: boolean
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function ProductStatusBadge({ 
  status, 
  isFeatured = false, 
  className,
  showIcon = true,
  size = 'md'
}: ProductStatusBadgeProps) {
  
  const getStatusConfig = (status: string) => {
    const configs = {
      DRAFT: {
        label: 'Draft',
        icon: FileText,
        colors: 'bg-gray-100 text-gray-700 border-gray-200',
        description: 'Not visible to customers'
      },
      PUBLISHED: {
        label: 'Published',
        icon: Eye,
        colors: 'bg-green-100 text-green-700 border-green-200',
        description: 'Live and visible to customers'
      },
      ARCHIVED: {
        label: 'Archived',
        icon: Archive,
        colors: 'bg-orange-100 text-orange-700 border-orange-200',
        description: 'Hidden from customers but preserved'
      }
    }
    
    return configs[status as keyof typeof configs] || configs.DRAFT
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <div className="flex items-center gap-2">
      {/* Main Status Badge */}
      <span className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.colors,
        sizeClasses[size],
        className
      )}>
        {showIcon && (
          <Icon className={cn('mr-1', iconSizes[size])} />
        )}
        {config.label}
      </span>

      {/* Featured Badge (only for published products) */}
      {isFeatured && status === 'PUBLISHED' && (
        <span className={cn(
          'inline-flex items-center font-medium rounded-full border',
          'bg-blue-100 text-blue-700 border-blue-200',
          sizeClasses[size]
        )}>
          <AlertCircle className={cn('mr-1', iconSizes[size])} />
          Featured
        </span>
      )}
    </div>
  )
}

// Compact version for tables and lists
export function ProductStatusBadgeCompact({ 
  status, 
  isFeatured = false 
}: Pick<ProductStatusBadgeProps, 'status' | 'isFeatured'>) {
  return (
    <ProductStatusBadge 
      status={status} 
      isFeatured={isFeatured}
      size="sm"
      showIcon={false}
    />
  )
}

// Enhanced version with tooltip
export function ProductStatusBadgeWithTooltip({ 
  status, 
  isFeatured = false,
  className
}: Pick<ProductStatusBadgeProps, 'status' | 'isFeatured' | 'className'>) {
  const getTooltipStatusConfig = (status: string) => {
    const configs = {
      DRAFT: {
        label: 'Draft',
        icon: FileText,
        colors: 'bg-gray-100 text-gray-700 border-gray-200',
        description: 'Not visible to customers'
      },
      PUBLISHED: {
        label: 'Published',
        icon: Eye,
        colors: 'bg-green-100 text-green-700 border-green-200',
        description: 'Live and visible to customers'
      },
      ARCHIVED: {
        label: 'Archived',
        icon: Archive,
        colors: 'bg-orange-100 text-orange-700 border-orange-200',
        description: 'Hidden from customers but preserved'
      }
    }
    
    return configs[status as keyof typeof configs] || configs.DRAFT
  }

  const config = getTooltipStatusConfig(status)

  return (
    <div className="group relative">
      <ProductStatusBadge 
        status={status} 
        isFeatured={isFeatured}
        className={className}
      />
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        <div className="font-medium">{config.label}</div>
        <div className="text-gray-300 text-xs">{config.description}</div>
        
        {/* Tooltip Arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  )
}

// Utility function to get status from boolean flags (for backward compatibility)
export function getProductStatus(isActive: boolean, status?: string): 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' {
  // If new status field exists, use it
  if (status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
    return status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  }
  
  // Fallback to old boolean logic
  return isActive ? 'PUBLISHED' : 'ARCHIVED'
}