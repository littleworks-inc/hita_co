'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button, Label } from '@/components/ui'
import { Settings, Truck, CheckCircle, AlertCircle } from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
}

interface OrderStatusManagerProps {
  order: Order
}

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  { value: 'PROCESSING', label: 'Processing', color: 'bg-purple-100 text-purple-800', icon: Settings },
  { value: 'SHIPPED', label: 'Shipped', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: AlertCircle }
]

const STATUS_PROGRESSION = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: []
}

export default function OrderStatusManager({ order }: OrderStatusManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(order.status)

  const currentStatus = ORDER_STATUSES.find(s => s.value === order.status)
  const availableStatuses = STATUS_PROGRESSION[order.status as keyof typeof STATUS_PROGRESSION] || []

  const handleStatusUpdate = async () => {
    if (selectedStatus === order.status) {
      alert('No changes to save')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          status: selectedStatus
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Order status updated successfully')
        setDialogOpen(false)
        router.refresh()
      } else {
        throw new Error(data.error || 'Failed to update order')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert(error instanceof Error ? error.message : 'Failed to update order')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    const statusConfig = ORDER_STATUSES.find(s => s.value === status)
    if (!statusConfig) return null
    
    const Icon = statusConfig.icon
    return <Icon className="h-4 w-4" />
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = ORDER_STATUSES.find(s => s.value === status)
    if (!statusConfig) return null
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
        {statusConfig.label}
      </span>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Order Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Current Status</Label>
          <div className="mt-2 flex items-center gap-2">
            {currentStatus && getStatusIcon(currentStatus.value)}
            {getStatusBadge(order.status)}
          </div>
        </div>

        {/* Status Timeline */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Status Timeline</Label>
          <div className="mt-2 space-y-2">
            {ORDER_STATUSES.map((status, index) => {
              const isCompleted = ORDER_STATUSES.findIndex(s => s.value === order.status) >= index
              const isCurrent = status.value === order.status
              
              return (
                <div key={status.value} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500' 
                      : isCurrent 
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-gray-200 border-gray-300'
                  }`} />
                  <span className={`text-sm ${
                    isCompleted || isCurrent ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}>
                    {status.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        {availableStatuses.length > 0 && (
          <div>
            <Label className="text-sm font-medium text-gray-700">Quick Actions</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {availableStatuses.map(statusValue => {
                const statusConfig = ORDER_STATUSES.find(s => s.value === statusValue)
                if (!statusConfig) return null
                
                return (
                  <Button
                    key={statusValue}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedStatus(statusValue)
                      setDialogOpen(true)
                    }}
                    className="flex items-center gap-1"
                  >
                    {getStatusIcon(statusValue)}
                    Mark as {statusConfig.label}
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* Update Order Dialog */}
        {dialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="mb-4">
                <h3 className="text-lg font-medium">Update Order {order.orderNumber}</h3>
                <p className="text-sm text-gray-500">Change the order status.</p>
              </div>
              
              <div className="space-y-4">
                {/* Status Selection */}
                <div>
                  <Label htmlFor="status">Order Status</Label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {ORDER_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleStatusUpdate} disabled={loading}>
                  {loading ? 'Updating...' : 'Update Order'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <Button variant="outline" className="w-full" onClick={() => setDialogOpen(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Update Order Status
        </Button>
      </CardContent>
    </Card>
  )
}