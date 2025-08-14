'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Archive, RotateCcw, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  // Add other required fields for validation
  description?: string
  images?: string[]
  sellingPriceUSD?: number
  stockQuantity?: number
}

interface QuickActionButtonProps {
  product: Product
  onStatusChange?: (productId: string, newStatus: string) => void
  disabled?: boolean
  className?: string
}

export default function QuickActionButton({ 
  product, 
  onStatusChange,
  disabled = false,
  className 
}: QuickActionButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showValidation, setShowValidation] = useState(false)

  // Define available actions based on current status
  const getAvailableActions = (status: string) => {
    const actions = {
      DRAFT: [
        {
          action: 'publish',
          label: 'Publish',
          icon: Eye,
          color: 'bg-green-600 hover:bg-green-700 text-white',
          description: 'Make this product live and visible to customers'
        }
      ],
      PUBLISHED: [
        {
          action: 'archive',
          label: 'Archive',
          icon: Archive,
          color: 'bg-orange-600 hover:bg-orange-700 text-white',
          description: 'Hide this product from customers but keep it in the system'
        }
      ],
      ARCHIVED: [
        {
          action: 'publish',
          label: 'Publish',
          icon: Eye,
          color: 'bg-green-600 hover:bg-green-700 text-white',
          description: 'Make this product live and visible to customers'
        },
        {
          action: 'restore',
          label: 'Restore to Draft',
          icon: RotateCcw,
          color: 'bg-blue-600 hover:bg-blue-700 text-white',
          description: 'Move back to draft for editing'
        }
      ]
    }
    
    return actions[status as keyof typeof actions] || []
  }

  // Validate product before publishing
  const validateProductForPublishing = (product: Product) => {
    const issues = []
    
    if (!product.description || product.description.trim().length < 10) {
      issues.push('Product description is missing or too short (minimum 10 characters)')
    }
    
    if (!product.images || product.images.length === 0) {
      issues.push('At least one product image is required')
    }
    
    if (!product.sellingPriceUSD || product.sellingPriceUSD <= 0) {
      issues.push('Valid selling price is required')
    }
    
    if (product.stockQuantity === undefined || product.stockQuantity < 0) {
      issues.push('Stock quantity must be set (can be 0 for pre-orders)')
    }
    
    return issues
  }

  // Handle status change
  const handleStatusChange = async (action: string) => {
    // Validate before publishing
    if (action === 'publish') {
      const validationIssues = validateProductForPublishing(product)
      if (validationIssues.length > 0) {
        setShowValidation(true)
        return
      }
    }

    setLoading(true)
    try {
      const newStatus = action === 'publish' ? 'PUBLISHED' : 
                       action === 'archive' ? 'ARCHIVED' : 
                       action === 'restore' ? 'DRAFT' : product.status

      const response = await fetch(`/api/admin/products/${product.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          action: action
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Call the callback if provided
        if (onStatusChange) {
          onStatusChange(product.id, newStatus)
        }
        
        // Show success message
        const actionMessages = {
          publish: 'Product published successfully!',
          archive: 'Product archived successfully!',
          restore: 'Product restored to draft!'
        }
        
        // You might want to use a toast notification here instead
        alert(actionMessages[action as keyof typeof actionMessages] || 'Status updated!')
        
        // Refresh the page to show updated data
        router.refresh()
      } else {
        throw new Error(data.error || 'Failed to update product status')
      }
    } catch (error) {
      console.error('Error updating product status:', error)
      alert(error instanceof Error ? error.message : 'Failed to update product status')
    } finally {
      setLoading(false)
    }
  }

  const availableActions = getAvailableActions(product.status)
  
  if (availableActions.length === 0) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Quick Action Buttons */}
      {availableActions.map((actionConfig) => {
        const Icon = actionConfig.icon
        
        return (
          <Button
            key={actionConfig.action}
            size="sm"
            onClick={() => handleStatusChange(actionConfig.action)}
            disabled={disabled || loading}
            className={cn(actionConfig.color, 'transition-all')}
            title={actionConfig.description}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
            {actionConfig.label}
          </Button>
        )
      })}

      {/* Validation Modal */}
      {showValidation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <h3 className="text-lg font-semibold">Publishing Requirements</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                This product cannot be published yet. Please fix the following issues:
              </p>
              
              <ul className="space-y-2">
                {validateProductForPublishing(product).map((issue, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowValidation(false)}
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  setShowValidation(false)
                  router.push(`/admin/products/${product.id}/edit`)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Edit Product
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Simplified version for table rows
export function QuickActionButtonCompact({ 
  product, 
  onStatusChange 
}: Pick<QuickActionButtonProps, 'product' | 'onStatusChange'>) {
  return (
    <QuickActionButton 
      product={product} 
      onStatusChange={onStatusChange}
      className="justify-end"
    />
  )
}

// Publishing checklist component (can be used in product forms)
export function PublishingChecklist({ product }: { product: Product }) {
  const validateProductForPublishing = (product: Product) => {
    const checks = [
      {
        label: 'Product description (min 10 characters)',
        passed: product.description && product.description.trim().length >= 10,
        required: true
      },
      {
        label: 'At least one product image',
        passed: product.images && product.images.length > 0,
        required: true
      },
      {
        label: 'Valid selling price',
        passed: product.sellingPriceUSD && product.sellingPriceUSD > 0,
        required: true
      },
      {
        label: 'Stock quantity set',
        passed: product.stockQuantity !== undefined && product.stockQuantity >= 0,
        required: true
      }
    ]
    
    return checks
  }

  const checks = validateProductForPublishing(product)
  const requiredPassed = checks.filter(check => check.required && check.passed).length
  const totalRequired = checks.filter(check => check.required).length
  const canPublish = requiredPassed === totalRequired

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">Publishing Checklist</h4>
        <span className={cn(
          'text-xs px-2 py-1 rounded-full',
          canPublish 
            ? 'bg-green-100 text-green-700'
            : 'bg-orange-100 text-orange-700'
        )}>
          {requiredPassed}/{totalRequired} required
        </span>
      </div>
      
      <div className="space-y-2">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={cn(
              'w-4 h-4 rounded-full flex items-center justify-center',
              check.passed 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-400'
            )}>
              {check.passed && <CheckCircle className="h-3 w-3" />}
            </div>
            <span className={cn(
              'text-sm',
              check.passed ? 'text-gray-900' : 'text-gray-500'
            )}>
              {check.label}
              {check.required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </div>
        ))}
      </div>
      
      {canPublish && (
        <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          Ready to publish!
        </div>
      )}
    </div>
  )
}