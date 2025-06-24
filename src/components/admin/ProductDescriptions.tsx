 // src/components/admin/ProductDescriptions.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle, Label } from '@/components/ui'
import { FileText } from 'lucide-react'

interface Product {
  shortDescription: string
  description: string
}

interface ProductDescriptionsProps {
  formData: Product
  onInputChange: (field: keyof Product, value: any) => void
}

export default function ProductDescriptions({
  formData,
  onInputChange
}: ProductDescriptionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Product Descriptions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Short Description */}
        <div className="space-y-2">
          <Label htmlFor="shortDescription">Short Description</Label>
          <textarea
            id="shortDescription"
            value={formData.shortDescription}
            onChange={(e) => onInputChange('shortDescription', e.target.value)}
            placeholder="Brief product description for listings"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500">
            Used in product listings and search results (recommended: 50-150 characters)
          </p>
        </div>

        {/* Full Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Full Description</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            placeholder="Detailed product description"
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500">
            Detailed description shown on product pages (recommended: 200-500 characters)
          </p>
        </div>
      </CardContent>
    </Card>
  )
}