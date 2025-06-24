// =====================================
// ProductSEO.tsx
// =====================================
export function ProductSEO({ formData, onInputChange }: {
  formData: { seoTitle: string; seoDescription: string }
  onInputChange: (field: string, value: any) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          SEO Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="seoTitle">SEO Title</Label>
          <Input
            id="seoTitle"
            value={formData.seoTitle}
            onChange={(e) => onInputChange('seoTitle', e.target.value)}
            placeholder="SEO optimized title"
          />
          <p className="text-xs text-gray-500">
            {formData.seoTitle.length}/60 characters (recommended)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seoDescription">SEO Description</Label>
          <textarea
            id="seoDescription"
            value={formData.seoDescription}
            onChange={(e) => onInputChange('seoDescription', e.target.value)}
            placeholder="SEO optimized description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500">
            {formData.seoDescription.length}/160 characters (recommended)
          </p>
        </div>
      </CardContent>
    </Card>
  )
}