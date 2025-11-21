import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import AdminNavigation from '@/components/admin/AdminNavigation'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import Link from 'next/link'
import {
  Share2,
  Package,
  Calendar,
  TrendingUp,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  Plus,
  Eye,
  Edit,
  Zap,
  Image,
  Type,
  Hash
} from 'lucide-react'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

export default async function SocialMediaDashboard() {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  // Get store settings for social media configuration
  const storeSettings = await db.storeSetting.findFirst({
    where: { id: 'default' }
  })

  // Get product counts for quick stats
  const [
    totalProducts,
    featuredProducts,
    activeProducts
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { isFeatured: true } }),
    db.product.count({ where: { isActive: true } })
  ])

  // Social media platforms with their status
  const platforms = [
    {
      name: 'Instagram',
      icon: Instagram,
      configured: !!storeSettings?.instagram,
      url: storeSettings?.instagram,
      color: 'from-purple-400 to-pink-400',
      description: 'Visual storytelling for your products'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      configured: !!storeSettings?.facebook,
      url: storeSettings?.facebook,
      color: 'from-blue-500 to-blue-600',
      description: 'Connect with your community'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      configured: !!storeSettings?.twitter,
      url: storeSettings?.twitter,
      color: 'from-blue-400 to-blue-500',
      description: 'Quick updates and engagement'
    },
    {
      name: 'Pinterest',
      icon: MessageCircle,
      configured: !!storeSettings?.pinterest,
      url: storeSettings?.pinterest,
      color: 'from-red-400 to-red-500',
      description: 'Showcase your products visually'
    }
  ]

  const quickActions = [
    {
      title: 'Create Product Post',
      description: 'Select products and generate social media content',
      href: '/admin/social/products',
      icon: Package,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500'
    },
    {
      title: 'Content Calendar',
      description: 'Plan and schedule your social media posts',
      href: '/admin/social/calendar',
      icon: Calendar,
      color: 'bg-gradient-to-r from-blue-500 to-teal-500'
    },
    {
      title: 'Post Library',
      description: 'View and manage your published content',
      href: '/admin/social/posts',
      icon: Eye,
      color: 'bg-gradient-to-r from-green-500 to-emerald-500'
    },
    {
      title: 'AI Content Generator',
      description: 'Bulk generate content for multiple products',
      href: '/admin/social/generator',
      icon: Zap,
      color: 'bg-gradient-to-r from-orange-500 to-red-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="border-b border-gray-200 pb-5 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold leading-6 text-gray-900 flex items-center gap-3">
                    <Share2 className="h-8 w-8 text-purple-600" />
                    Social Media Management
                  </h1>
                  <p className="mt-2 max-w-4xl text-sm text-gray-500">
                    Create, manage, and schedule social media content for your products
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalProducts}</div>
                  <p className="text-xs text-gray-500">Available for social sharing</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Featured Products</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{featuredProducts}</div>
                  <p className="text-xs text-gray-500">Ready to promote</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                  <Eye className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeProducts}</div>
                  <p className="text-xs text-gray-500">Live on store</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {quickActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <Link key={action.title} href={action.href}>
                        <div className="group cursor-pointer rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-all duration-200">
                          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${action.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                          <p className="text-sm text-gray-500">{action.description}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Platform Status */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Social Media Platforms
                  </CardTitle>
                  <Link href="/admin/branding">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Configure Platforms
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {platforms.map((platform) => {
                    const Icon = platform.icon
                    return (
                      <div key={platform.name} className="group">
                        <div className={`p-4 rounded-lg border ${platform.configured ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'} hover:shadow-md transition-all`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r ${platform.color} text-white`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className={`w-3 h-3 rounded-full ${platform.configured ? 'bg-green-500' : 'bg-gray-300'}`} />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">{platform.name}</h3>
                          <p className="text-xs text-gray-500 mb-2">{platform.description}</p>
                          <p className={`text-xs font-medium ${platform.configured ? 'text-green-600' : 'text-gray-400'}`}>
                            {platform.configured ? 'Configured' : 'Not configured'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Content Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Content Types You Can Create
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-200">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Image className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Product Showcases</h4>
                      <p className="text-sm text-gray-500">Beautiful product photos with AI-generated descriptions</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-200">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Type className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Engaging Captions</h4>
                      <p className="text-sm text-gray-500">AI-powered captions tailored for each platform</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-200">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Hash className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Smart Hashtags</h4>
                      <p className="text-sm text-gray-500">Relevant hashtags for better discoverability</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}