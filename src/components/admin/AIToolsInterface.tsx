'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui'
import { AIBulkGenerateButton } from '@/components/admin/AIGenerateButton'
import {
  Sparkles,
  Package,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  BarChart3,
  Filter,
  Search,
  FileText,
  Hash,
  MessageSquare,
  Wand2,
  Brain,
  TrendingUp,
  AlertTriangle,
  Eye
} from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string | null
  shortDescription: string | null
  seoTitle: string | null
  seoDescription: string | null
  tags: string[]
  sellingPriceUSD: number
  category: {
    id: string
    name: string
  }
  country: {
    id: string
    name: string
  }
}

interface Stats {
  totalProducts: number
  productsWithDescription: number
  productsWithSEO: number
  productsWithTags: number
  incompleteProducts: number
}

interface AIToolsInterfaceProps {
  products: Product[]
  stats: Stats
}

interface GenerationResult {
  productId: string
  productName: string
  success: boolean
  content?: string
  error?: string
}

export default function AIToolsInterface({ products, stats }: AIToolsInterfaceProps) {
  const router = useRouter()
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [generationType, setGenerationType] = useState<'product_description' | 'seo_content'>('product_description')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResults, setGenerationResults] = useState<GenerationResult[]>([])
  const [showResults, setShowResults] = useState(false)

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !categoryFilter || product.category.id === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Get unique categories for filter
  const categories = [...new Set(products.map(p => p.category))].sort((a, b) => a.name.localeCompare(b.name))

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id))
    }
  }

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleBulkGeneration = async (results: any) => {
    setGenerationResults(results.results || [])
    setShowResults(true)
    router.refresh() // Refresh to show updated content
  }

  const getCompletionPercentage = () => {
    if (stats.totalProducts === 0) return 0
    const completed = stats.productsWithDescription + stats.productsWithSEO + stats.productsWithTags
    const total = stats.totalProducts * 3 // 3 types of content
    return Math.round((completed / total) * 100)
  }

  const getProductCompletionStatus = (product: Product) => {
    const hasDescription = product.description && product.description.length > 0
    const hasSEO = product.seoTitle && product.seoDescription
    const hasTags = product.tags && product.tags.length > 0
    
    const completedItems = [hasDescription, hasSEO, hasTags].filter(Boolean).length
    
    if (completedItems === 3) return { status: 'complete', color: 'text-green-600' }
    if (completedItems === 0) return { status: 'empty', color: 'text-red-600' }
    return { status: 'partial', color: 'text-yellow-600' }
  }

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.incompleteProducts} need content
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Descriptions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productsWithDescription}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalProducts > 0 ? Math.round((stats.productsWithDescription / stats.totalProducts) * 100) : 0}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SEO Optimized</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productsWithSEO}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalProducts > 0 ? Math.round((stats.productsWithSEO / stats.totalProducts) * 100) : 0}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Tags</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productsWithTags}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalProducts > 0 ? Math.round((stats.productsWithTags / stats.totalProducts) * 100) : 0}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getCompletionPercentage()}%</div>
            <p className="text-xs text-muted-foreground">
              Overall content completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Generation Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Bulk AI Content Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Generation Type Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Content Type
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setGenerationType('product_description')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  generationType === 'product_description'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium">Product Descriptions</h3>
                    <p className="text-sm text-gray-600">Generate compelling product descriptions and short summaries</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setGenerationType('seo_content')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  generationType === 'seo_content'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Hash className="h-5 w-5 text-green-600" />
                  <div>
                    <h3 className="font-medium">SEO Content</h3>
                    <p className="text-sm text-gray-600">Generate SEO titles, meta descriptions, and tags</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-medium text-gray-700">
                Select Products ({selectedProducts.length} selected)
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedProducts.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
                </Button>
                <AIBulkGenerateButton
                  productIds={selectedProducts}
                  type={generationType}
                  onComplete={handleBulkGeneration}
                  disabled={selectedProducts.length === 0}
                />
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-48"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Products List */}
            <div className="border rounded-lg max-h-96 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No products found matching your criteria
                </div>
              ) : (
                <div className="divide-y">
                  {filteredProducts.map((product) => {
                    const completion = getProductCompletionStatus(product)
                    return (
                      <div key={product.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleSelectProduct(product.id)}
                            className="rounded border-gray-300"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">{product.name}</h4>
                              <span className={`text-xs ${completion.color}`}>
                                {completion.status === 'complete' && <CheckCircle className="h-3 w-3" />}
                                {completion.status === 'partial' && <AlertTriangle className="h-3 w-3" />}
                                {completion.status === 'empty' && <XCircle className="h-3 w-3" />}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.category.name} • {product.country.name} • ${product.sellingPriceUSD}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                              <span>Desc: {product.description ? '✓' : '✗'}</span>
                              <span>SEO: {product.seoTitle && product.seoDescription ? '✓' : '✗'}</span>
                              <span>Tags: {product.tags && product.tags.length > 0 ? '✓' : '✗'}</span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/products/${product.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Results */}
      {showResults && generationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Generation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {generationResults.filter(r => r.success).length}
                  </div>
                  <div className="text-sm text-green-700">Successful</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {generationResults.filter(r => !r.success).length}
                  </div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {generationResults.length}
                  </div>
                  <div className="text-sm text-blue-700">Total Processed</div>
                </div>
              </div>

              {/* Results List */}
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {generationResults.map((result, index) => (
                  <div key={index} className="p-3 border-b last:border-b-0 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{result.productName}</div>
                      {result.error && (
                        <div className="text-xs text-red-600">{result.error}</div>
                      )}
                    </div>
                    <div>
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => setShowResults(false)}
                className="w-full"
              >
                Close Results
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}