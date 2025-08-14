// src/app/admin/mobile/page.tsx
// Admin Mobile Dashboard - Touch-optimized interface for mobile/tablet devices

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Menu,
  X,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Building2,
  Settings,
  Plus,
  Search,
  Bell,
  BarChart3,
  Layers,
  Truck,
  Star,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  Camera,
  QrCode,
  Zap,
  Home
} from 'lucide-react'

interface DashboardStats {
  products: { total: number; active: number; lowStock: number }
  categories: { total: number }
  suppliers: { total: number; active: number }
  exhibitions: { total: number; active: number; upcoming: number }
  sales: { total: number; today: number; thisMonth: number }
  revenue: { total: number; today: number; thisMonth: number }
}

interface RecentActivity {
  id: string
  type: 'product' | 'exhibition' | 'sale' | 'supplier'
  title: string
  description: string
  time: string
  status: 'success' | 'warning' | 'info'
}

export default function AdminMobileDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showMenu, setShowMenu] = useState(false)

  // Load dashboard data
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard stats
      const response = await fetch('/api/admin/dashboard/mobile-stats')
      if (!response.ok) throw new Error('Failed to load dashboard data')
      
      const data = await response.json()
      setStats(data.stats)
      setRecentActivity(data.recentActivity || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Quick action buttons
  const quickActions = [
    {
      title: 'Add Product',
      icon: Package,
      color: 'bg-blue-500',
      href: '/admin/products/new',
      description: 'Create new product'
    },
    {
      title: 'Start Exhibition',
      icon: Building2,
      color: 'bg-purple-500',
      href: '/admin/exhibitions/new',
      description: 'Setup new exhibition'
    },
    {
      title: 'Scan Barcode',
      icon: QrCode,
      color: 'bg-green-500',
      href: '/admin/scanner',
      description: 'Quick product lookup'
    },
    {
      title: 'Inventory Check',
      icon: Layers,
      color: 'bg-orange-500',
      href: '/admin/inventory',
      description: 'Stock management'
    }
  ]

  // Main navigation items
  const navItems = [
    { title: 'Dashboard', icon: Home, href: '/admin/mobile', active: true },
    { title: 'Products', icon: Package, href: '/admin/products', count: stats?.products.total },
    { title: 'Categories', icon: Layers, href: '/admin/categories', count: stats?.categories.total },
    { title: 'Suppliers', icon: Truck, href: '/admin/suppliers', count: stats?.suppliers.total },
    { title: 'Exhibitions', icon: Building2, href: '/admin/exhibitions', count: stats?.exhibitions.total },
    { title: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
    { title: 'Settings', icon: Settings, href: '/admin/settings' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMenu(true)}
                className="p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-bold text-lg text-gray-900">Admin Panel</h1>
                <p className="text-xs text-gray-600">Mobile Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="p-2 relative">
                <Bell className="h-5 w-5" />
                {stats && (stats.products.lowStock > 0) && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                    {stats.products.lowStock}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products, exhibitions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-gray-50 border-0 focus:bg-white"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Products</p>
                  <p className="text-2xl font-bold">{stats?.products.total || 0}</p>
                  <p className="text-blue-100 text-xs">
                    {stats?.products.active || 0} active
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Exhibitions</p>
                  <p className="text-2xl font-bold">{stats?.exhibitions.total || 0}</p>
                  <p className="text-purple-100 text-xs">
                    {stats?.exhibitions.active || 0} active
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Suppliers</p>
                  <p className="text-2xl font-bold">{stats?.suppliers.total || 0}</p>
                  <p className="text-green-100 text-xs">
                    {stats?.suppliers.active || 0} active
                  </p>
                </div>
                <Truck className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Categories</p>
                  <p className="text-2xl font-bold">{stats?.categories.total || 0}</p>
                  <p className="text-orange-100 text-xs">
                    All active
                  </p>
                </div>
                <Layers className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.title}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform"
                    onClick={() => router.push(action.href)}
                  >
                    <div className={`w-10 h-10 rounded-full ${action.color} flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm">{action.title}</p>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </div>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Warnings */}
        {stats && stats.products.lowStock > 0 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700">
              <strong>{stats.products.lowStock} products</strong> are running low on stock. 
              <Button variant="link" className="p-0 h-auto text-orange-700 underline ml-1">
                Review inventory
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Side Navigation Menu */}
      {showMenu && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowMenu(false)}>
          <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg text-gray-900">Navigation</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowMenu(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <nav className="p-4">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Button
                      key={item.href}
                      variant={item.active ? "default" : "ghost"}
                      className="w-full justify-start h-12"
                      onClick={() => {
                        router.push(item.href)
                        setShowMenu(false)
                      }}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      <span className="flex-1 text-left">{item.title}</span>
                      {item.count && (
                        <Badge variant="secondary" className="ml-2">
                          {item.count}
                        </Badge>
                      )}
                    </Button>
                  )
                })}
              </div>
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Logout logic
                  router.push('/admin/login')
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}