'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui'
import { formatPrice } from '@/lib/utils'
import ProductImageDisplay from '@/components/admin/ProductImageDisplay'
import {
  Search,
  Filter,
  Package,
  Star,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  Zap,
  Copy,
  Download,
  Check,
  X,
  Wand2,
  Image,
  Type,
  Hash,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  sellingPriceUSD: number
  stockQuantity: number
  images: string[]
  shortDescription?: string | null
  description?: string | null
  isFeatured: boolean
  tags: string[]
  category: {
    id: string
    name: string
  }
  country: {
    name: string
  }
  supplier: {
    name: string
  }
}

interface Category {
  id: string
  name: string
}

interface SocialProductSelectorProps {
  products: Product[]
  categories: Category[]
  searchParams: {
    search?: string
    category?: string
    featured?: string
  }
}

interface GeneratedContent {
  platform: string
  caption: string
  hashtags: string[]
}

export default function SocialProductSelector({ 
  products, 
  categories, 
  searchParams 
}: SocialProductSelectorProps) {
  const router = useRouter()
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState(searchParams.search || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.category || '')
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(searchParams.featured === 'true')
  const [showFilters, setShowFilters] = useState(false)
  const [generatingContent, setGeneratingContent] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<Record<string, GeneratedContent[]>>({})
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram'])

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-purple-600' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'text-blue-500' },
    { id: 'pinterest', name: 'Pinterest', icon: MessageCircle, color: 'text-red-500' }
  ]

  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(p => p.id))
    }
  }

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  const generateSocialContent = async () => {
    if (selectedProducts.length === 0 || selectedPlatforms.length === 0) {
      alert('Please select at least one product and one platform')
      return
    }

    setGeneratingContent(true)
    const newContent: Record<string, GeneratedContent[]> = {}

    try {
      for (const productId of selectedProducts) {
        const product = products.find(p => p.id === productId)
        if (!product) continue

        const platformContent: GeneratedContent[] = []

        for (const platformId of selectedPlatforms) {
          // Mock AI content generation - replace with actual AI API call
          const caption = await generateCaption(product, platformId)
          const hashtags = generateHashtags(product, platformId)

          platformContent.push({
            platform: platformId,
            caption,
            hashtags
          })
        }

        newContent[productId] = platformContent
      }

      setGeneratedContent(newContent)
    } catch (error) {
      console.error('Error generating content:', error)
      alert('Failed to generate content. Please try again.')
    } finally {
      setGeneratingContent(false)
    }
  }

  // Mock AI content generation functions
  const generateCaption = async (product: Product, platform: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const templates = {
      instagram: `✨ Discover the beauty of ${product.name}! ✨\n\nHandcrafted with love from ${product.country.name}, this stunning piece brings authentic elegance to your wardrobe. ${product.shortDescription || product.description || ''}\n\n💫 Perfect for special occasions or everyday glamour\n🌟 Limited stock available\n\n#ShopNow #AuthenticFashion`,
      facebook: `🌟 New Arrival Alert! 🌟\n\nIntroducing our gorgeous ${product.name}, carefully crafted in ${product.country.name}. This beautiful piece combines traditional artistry with modern style.\n\n${product.shortDescription || product.description || ''}\n\nWhat makes this special:\n✨ Handcrafted quality\n✨ Authentic design\n✨ Premium materials\n\nDon't miss out - limited pieces available!`,
      twitter: `✨ Just dropped: ${product.name}! 

Handcrafted in ${product.country.name} with love and attention to detail. ${product.shortDescription ? product.shortDescription.slice(0, 100) + '...' : 'Perfect for any occasion!'}

Shop now while stocks last! 🛍️`,
      pinterest: `${product.name} | Authentic ${product.category.name} from ${product.country.name}

${product.shortDescription || product.description || 'Beautiful handcrafted piece perfect for your wardrobe'}

✨ Handmade with premium materials
🌟 Authentic traditional design
💫 Limited edition piece

#${product.category.name.replace(/\s+/g, '')} #HandmadeJewelry #EthnicWear #AuthenticFashion`
    }
    
    return templates[platform as keyof typeof templates] || templates.instagram
  }

  const generateHashtags = (product: Product, platform: string): string[] => {
    const baseHashtags = [
      'HitaCo',
      'AuthenticFashion',
      'HandcraftedJewelry',
      product.category.name.replace(/\s+/g, ''),
      product.country.name.replace(/\s+/g, ''),
      'EthnicWear',
      'TraditionalStyle'
    ]

    const platformSpecific = {
      instagram: ['OOTD', 'FashionInspo', 'JewelryLover', 'EthnicStyle', 'HandmadeWithLove'],
      facebook: ['SmallBusiness', 'SupportLocal', 'QualityCraftsmanship', 'UniqueFinds'],
      twitter: ['NewDrop', 'LimitedEdition', 'ShopSmall', 'Artisan'],
      pinterest: ['FashionInspiration', 'JewelryCollection', 'StyleGuide', 'EthnicJewelry']
    }

    const productTags = product.tags.map(tag => tag.replace(/\s+/g, ''))
    
    return [...baseHashtags, ...platformSpecific[platform as keyof typeof platformSpecific] || [], ...productTags]
      .slice(0, platform === 'twitter' ? 5 : 10)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const exportContent = (productId: string) => {
    const product = products.find(p => p.id === productId)
    const content = generatedContent[productId]
    
    if (!product || !content) return

    const exportData = {
      product: {
        name: product.name,
        sku: product.sku,
        price: formatPrice(product.sellingPriceUSD, 'USD'),
        images: product.images
      },
      content: content.map(c => ({
        platform: c.platform,
        caption: c.caption,
        hashtags: c.hashtags.join(' #')
      }))
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${product.name.replace(/\s+/g, '_')}_social_content.json`
    link.click()
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (selectedCategory) params.set('category', selectedCategory)
    if (showFeaturedOnly) params.set('featured', 'true')
    
    router.push(`/admin/social/products?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Product Filters
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Search Products</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, SKU, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showFeaturedOnly}
                    onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm">Featured Only</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={applyFilters}>Apply Filters</Button>
              <Button variant="outline" onClick={() => {
                setSearchQuery('')
                setSelectedCategory('')
                setShowFeaturedOnly(false)
                router.push('/admin/social/products')
              }}>
                Clear
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Platform Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            Select Platforms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {platforms.map((platform) => {
              const Icon = platform.icon
              const isSelected = selectedPlatforms.includes(platform.id)
              return (
                <div
                  key={platform.id}
                  onClick={() => handlePlatformToggle(platform.id)}
                  className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                    isSelected 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-5 w-5 ${platform.color}`} />
                    <span className="font-medium">{platform.name}</span>
                    {isSelected && <Check className="h-4 w-4 text-purple-600 ml-auto" />}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Product Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Select Products ({selectedProducts.length} selected)
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedProducts.length === products.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button 
                onClick={generateSocialContent}
                disabled={selectedProducts.length === 0 || selectedPlatforms.length === 0 || generatingContent}
                className="flex items-center gap-2"
              >
                <Wand2 className="h-4 w-4" />
                {generatingContent ? 'Generating...' : 'Generate Content'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const isSelected = selectedProducts.includes(product.id)
                const hasGeneratedContent = generatedContent[product.id]
                
                return (
                  <div key={product.id} className="space-y-4">
                    {/* Product Card */}
                    <div
                      onClick={() => handleProductSelect(product.id)}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {product.images[0] ? (
                            <ProductImageDisplay
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                              <p className="text-sm text-gray-500">{product.sku}</p>
                              <p className="text-sm font-medium text-green-600">
                                {formatPrice(product.sellingPriceUSD, 'USD')}
                              </p>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              {isSelected && <Check className="h-5 w-5 text-purple-600" />}
                              {product.isFeatured && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                            </div>
                          </div>
                          
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {product.category.name}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {product.country.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Generated Content */}
                    {hasGeneratedContent && (
                      <div className="space-y-3">
                        {generatedContent[product.id].map((content, index) => {
                          const platform = platforms.find(p => p.id === content.platform)
                          const Icon = platform?.icon || Instagram
                          
                          return (
                            <Card key={index} className="border-l-4 border-l-purple-500">
                              <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Icon className={`h-4 w-4 ${platform?.color}`} />
                                    <span className="text-sm font-medium capitalize">{content.platform}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => copyToClipboard(content.caption + '\n\n#' + content.hashtags.join(' #'))}
                                      title="Copy to clipboard"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => exportContent(product.id)}
                                      title="Export content"
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="space-y-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Type className="h-3 w-3 text-gray-400" />
                                      <span className="text-xs font-medium text-gray-500">Caption</span>
                                    </div>
                                    <p className="text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap">
                                      {content.caption}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Hash className="h-3 w-3 text-gray-400" />
                                      <span className="text-xs font-medium text-gray-500">Hashtags</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {content.hashtags.map((hashtag, hashIndex) => (
                                        <span
                                          key={hashIndex}
                                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                                        >
                                          #{hashtag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}