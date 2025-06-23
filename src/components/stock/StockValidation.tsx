'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Stock Status Indicator Component
interface StockStatusProps {
  stockQuantity: number
  requestedQuantity?: number
  stockStatus?: 'available' | 'low' | 'out_of_stock' | 'unknown'
  className?: string
}

export function StockStatusIndicator({ 
  stockQuantity, 
  requestedQuantity = 1, 
  stockStatus,
  className = '' 
}: StockStatusProps) {
  const getStatusColor = () => {
    if (stockStatus === 'out_of_stock' || stockQuantity === 0) return 'destructive'
    if (stockStatus === 'low' || stockQuantity <= 5) return 'warning'
    if (stockStatus === 'unknown') return 'secondary'
    return 'success'
  }

  const getStatusText = () => {
    if (stockQuantity === 0) return 'Out of Stock'
    if (stockQuantity <= 5) return `Low Stock (${stockQuantity} left)`
    if (stockQuantity < requestedQuantity) return `Only ${stockQuantity} available`
    return `${stockQuantity} in stock`
  }

  const getStatusIcon = () => {
    if (stockQuantity === 0) return <XCircle className="h-4 w-4" />
    if (stockQuantity <= 5) return <AlertCircle className="h-4 w-4" />
    if (stockStatus === 'unknown') return <RefreshCw className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  return (
    <Badge 
      variant={getStatusColor() as any} 
      className={`flex items-center gap-1 ${className}`}
    >
      {getStatusIcon()}
      {getStatusText()}
    </Badge>
  )
}

// Cart Stock Validation Alert Component
interface CartStockAlertProps {
  stockIssues: Array<{
    id: string
    name: string
    stockIssue?: string
    maxQuantity: number
    quantity: number
    stockStatus?: 'available' | 'low' | 'out_of_stock' | 'unknown'
  }>
  onRefreshStock?: () => void
  onRemoveItem?: (productId: string) => void
  onUpdateQuantity?: (productId: string, quantity: number) => void
}

export function CartStockAlert({ 
  stockIssues, 
  onRefreshStock, 
  onRemoveItem, 
  onUpdateQuantity 
}: CartStockAlertProps) {
  if (stockIssues.length === 0) return null

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        <div className="space-y-2">
          <p className="font-medium">Some items in your cart have stock issues:</p>
          <div className="space-y-2">
            {stockIssues.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-sm text-orange-600">
                    {item.stockIssue || `Only ${item.maxQuantity} available`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.maxQuantity > 0 && item.quantity > item.maxQuantity && onUpdateQuantity && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateQuantity(item.id, item.maxQuantity)}
                    >
                      Update to {item.maxQuantity}
                    </Button>
                  )}
                  {onRemoveItem && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {onRefreshStock && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRefreshStock}
              className="w-full mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Stock Information
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

// Real-time Stock Validator Hook
export function useRealTimeStockValidation(productId: string, quantity: number = 1) {
  const [stockInfo, setStockInfo] = useState<{
    available: boolean
    stockQuantity: number
    maxAllowed: number
    message: string
    isLoading: boolean
    error?: string
  }>({
    available: false,
    stockQuantity: 0,
    maxAllowed: 0,
    message: '',
    isLoading: true
  })

  const validateStock = async () => {
    if (!productId) return

    setStockInfo(prev => ({ ...prev, isLoading: true, error: undefined }))

    try {
      const response = await fetch(`/api/products/stock?productId=${productId}&quantity=${quantity}`)
      
      if (!response.ok) {
        throw new Error('Failed to validate stock')
      }

      const result = await response.json()
      
      setStockInfo({
        available: result.available,
        stockQuantity: result.stockQuantity,
        maxAllowed: result.maxAllowed,
        message: result.message,
        isLoading: false
      })
    } catch (error) {
      console.error('Stock validation error:', error)
      setStockInfo(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to check stock availability'
      }))
    }
  }

  useEffect(() => {
    validateStock()
  }, [productId, quantity])

  return {
    ...stockInfo,
    refresh: validateStock
  }
}

// Bulk Stock Validator Component
interface BulkStockValidatorProps {
  items: Array<{
    productId: string
    quantity: number
    name?: string
  }>
  onValidationComplete?: (isValid: boolean, issues: any[]) => void
  className?: string
}

export function BulkStockValidator({ items, onValidationComplete, className = '' }: BulkStockValidatorProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    items: any[]
    errors: string[]
  } | null>(null)

  const validateBulkStock = async () => {
    if (items.length === 0) return

    setIsValidating(true)

    try {
      const response = await fetch('/api/products/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      })

      if (!response.ok) {
        throw new Error('Failed to validate stock')
      }

      const result = await response.json()
      setValidationResult(result)
      
      if (onValidationComplete) {
        onValidationComplete(result.isValid, result.items.filter((item: any) => !item.available))
      }
    } catch (error) {
      console.error('Bulk stock validation error:', error)
      const errorResult = {
        isValid: false,
        items: [],
        errors: ['Failed to validate stock. Please try again.']
      }
      setValidationResult(errorResult)
      
      if (onValidationComplete) {
        onValidationComplete(false, [])
      }
    } finally {
      setIsValidating(false)
    }
  }

  useEffect(() => {
    if (items.length > 0) {
      const timeoutId = setTimeout(validateBulkStock, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [items])

  if (items.length === 0) return null

  return (
    <div className={`space-y-2 ${className}`}>
      {isValidating && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Validating stock availability...
        </div>
      )}
      
      {validationResult && !validationResult.isValid && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-1">
              <p className="font-medium">Stock validation failed:</p>
              {validationResult.errors.map((error, index) => (
                <p key={index} className="text-sm">• {error}</p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {validationResult && validationResult.isValid && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          All items are available in stock
        </div>
      )}
    </div>
  )
}

// Stock Validation Summary Component
interface StockValidationSummaryProps {
  items: Array<{
    id: string
    name: string
    quantity: number
    maxQuantity: number
    stockValidated?: boolean
    stockIssue?: string
    stockStatus?: 'available' | 'low' | 'out_of_stock' | 'unknown'
  }>
  className?: string
}

export function StockValidationSummary({ items, className = '' }: StockValidationSummaryProps) {
  const validItems = items.filter(item => !item.stockIssue && item.stockStatus !== 'out_of_stock')
  const invalidItems = items.filter(item => item.stockIssue || item.stockStatus === 'out_of_stock')
  const lowStockItems = items.filter(item => item.stockStatus === 'low')

  if (items.length === 0) return null

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Overall Status */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <span className="font-medium">Stock Validation Summary</span>
        <Badge variant={invalidItems.length > 0 ? 'destructive' : validItems.length > 0 ? 'success' : 'secondary'}>
          {invalidItems.length > 0 ? 'Issues Found' : 'All Available'}
        </Badge>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="text-center p-2 bg-green-50 rounded">
          <div className="font-medium text-green-800">{validItems.length}</div>
          <div className="text-green-600">Available</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded">
          <div className="font-medium text-orange-800">{lowStockItems.length}</div>
          <div className="text-orange-600">Low Stock</div>
        </div>
        <div className="text-center p-2 bg-red-50 rounded">
          <div className="font-medium text-red-800">{invalidItems.length}</div>
          <div className="text-red-600">Unavailable</div>
        </div>
      </div>
    </div>
  )
}