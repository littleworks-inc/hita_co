// src/components/admin/ProductBasicInfo.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/components/ui'
import { Package } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

interface Supplier {
  id: string
  name: string
}

interface Country {
  id: string
  name: string
  currency: string
}

interface Product {
  name: string
  sku: string
  categoryId: string
  countryId: string
  supplierId: string
  purchaseDate: string
  invoiceNumber: string
}

interface ProductBasicInfoProps {
  formData: Product
  categories: Category[]
  countries: Country[]
  suppliers: Supplier[]
  errors: Record<string, string>
  onInputChange: (field: keyof Product, value: any) => void
}

export default function ProductBasicInfo({
  formData,
  categories,
  countries,
  suppliers,
  errors,
  onInputChange
}: ProductBasicInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Product Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Product Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              placeholder="Enter product name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU *</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => onInputChange('sku', e.target.value)}
              placeholder="Auto-generated from name"
              className={errors.sku ? 'border-red-500' : ''}
            />
            {errors.sku && <p className="text-sm text-red-500">{errors.sku}</p>}
          </div>
        </div>

        {/* Category, Country, Supplier */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category *</Label>
            <select
              id="categoryId"
              value={formData.categoryId}
              onChange={(e) => onInputChange('categoryId', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.categoryId ? 'border-red-500' : ''}`}
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="countryId">Country of Origin *</Label>
            <select
              id="countryId"
              value={formData.countryId}
              onChange={(e) => onInputChange('countryId', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.countryId ? 'border-red-500' : ''}`}
            >
              <option value="">Select Country</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name} ({country.currency})
                </option>
              ))}
            </select>
            {errors.countryId && <p className="text-sm text-red-500">{errors.countryId}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplierId">Supplier *</Label>
            <select
              id="supplierId"
              value={formData.supplierId}
              onChange={(e) => onInputChange('supplierId', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.supplierId ? 'border-red-500' : ''}`}
            >
              <option value="">Select Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            {errors.supplierId && <p className="text-sm text-red-500">{errors.supplierId}</p>}
          </div>
        </div>

        {/* Purchase Information */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Purchase Date</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => onInputChange('purchaseDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number</Label>
            <Input
              id="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={(e) => onInputChange('invoiceNumber', e.target.value)}
              placeholder="INV-2024-001"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}