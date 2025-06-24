// =====================================
// ProductInventory.tsx
// =====================================
export function ProductInventory({ formData, onInputChange }: {
  formData: { stockQuantity: number; lowStockAlert: number }
  onInputChange: (field: string, value: any) => void
}) {
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
