// =====================================
// src/components/admin/ProductInventory.tsx - FIXED
// =====================================
'use client'

import { Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/components/ui'
import { Package } from 'lucide-react'

interface Product {
  stockQuantity: number
  lowStockAlert: number
}

interface ProductInventoryProps {
  formData: Product
  onInputChange: (field: keyof Product, value: any) => void
}

export default function ProductInventory({ 
  formData, 
  onInputChange 
}: ProductInventoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Inventory Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="stockQuantity">Current Stock</Label>
            <Input
              id="stockQuantity"
              type="number"
              value={formData.stockQuantity}
              onChange={(e) => onInputChange('stockQuantity', parseInt(e.target.value) || 0)}
              placeholder="25"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
            <Input
              id="lowStockAlert"
              type="number"
              value={formData.lowStockAlert}
              onChange={(e) => onInputChange('lowStockAlert', parseInt(e.target.value) || 0)}
              placeholder="5"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}