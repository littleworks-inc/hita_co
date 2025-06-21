import Link from 'next/link'
import {
  Tag,
  Grid3X3,
  ArrowRight,
  Package,
  Sparkles,
  Search,
  Menu,
  User,
  Heart
} from 'lucide-react'

// Simple Categories Index Page - No database dependencies
export default function CategoriesPage() {
  // Static categories data - you can later replace with database calls
  const categories = [
    {
      id: '1',
      name: 'Ethnic Clothing',
      slug: 'ethnic-clothing',
      description: 'Traditional sarees, lehengas, kurtis, and authentic Indian clothing',
      productCount: 45,
      icon: '👗',
      gradient: 'from-purple-600 to-pink-600'
    },
    {
      id: '2',
      name: 'Handcrafted Jewelry',
      slug: 'jewelry',
      description: 'Authentic silver jewelry, traditional designs, and artisan pieces',
      productCount: 32,
      icon: '💎',
      gradient: 'from-blue-600 to-purple-600'
    },
    {
      id: '3',
      name: 'Natural Cosmetics',
      slug: 'cosmetics',
      description: 'Ayurvedic beauty products, herbal cosmetics, and natural skincare',
      productCount: 28,
      icon: '🌿',
      gradient: 'from-green-600 to-blue-600'
    },
    {
      id: '4',
      name: 'Artisan Soaps',
      slug: 'soaps',
      description: 'Handmade natural soaps, organic skincare, and traditional recipes',
      productCount: 18,
      icon: '🧼',
      gradient: 'from-yellow-600 to-orange-600'
    },
    {
      id: '5',
      name: 'Home Decor',
      slug: 'home-decor',
      description: 'Traditional decorative items, handicrafts, and cultural artifacts',
      productCount: 24,
      icon: '🏺',
      gradient: 'from-pink-600 to-red-600'
    },
    {
      id: '6',
      name: 'Accessories',
      slug: 'accessories',
      description: 'Bags, scarves, traditional accessories, and ethnic wear complements',
      productCount: 36,
      icon: '👜',
      gradient: 'from-indigo-600 to-purple-600'
    }
  ]

  return (
    <>
      {/* Simple Navigation */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 px-4">
        <p className="text-sm font-medium">
          ✨ Free shipping on orders over $100 | Authentic handcrafted products
        </p>
      </div>

      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  H
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Hita&Co</h1>
                  <p className="text-xs text-gray-500">Authentic Indian Ethnic Wear</p>
                </div>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-sm font-medium text-gray-700 hover:text-purple-600">
                Home
              </Link>
              <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-purple-600">
                Products
              </Link>
              <Link href="/categories" className="text-sm font-medium text-purple-600 border-b-2 border-purple-600">
                Categories
              </Link>
              <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-purple-600">
                About
              </Link>
              <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-purple-600">
                Contact
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Search className="h-6 w-6 text-gray-700 hover:text-purple-600 cursor-pointer" />
              <div className="relative">
                <Heart className="h-6 w-6 text-gray-700 hover:text-red-500 cursor-pointer" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </div>
              <div className="relative">
                <Package className="h-6 w-6 text-gray-700 hover:text-purple-600 cursor-pointer" />
                <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </div>
              <User className="h-6 w-6 text-gray-700 hover:text-purple-600 cursor-pointer" />
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-purple-600 transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Categories</span>
          </nav>

          {/* Page Header */}
          <header className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Tag className="h-8 w-8 text-purple-600" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                Shop by Category
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Explore our carefully curated collections of authentic Indian products. 
              Each category features handcrafted items that celebrate traditional artistry and cultural heritage.
            </p>
          </header>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {categories.map((category, index) => (
              <Link 
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group block"
              >
                <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${category.gradient} p-8 text-white shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300`}>
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon and Product Count */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="text-5xl">{category.icon}</div>
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                        {category.productCount} items
                      </span>
                    </div>

                    {/* Category Info */}
                    <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-white/90 transition-colors">
                        {category.name}
                      </h3>
                      
                      <p className="text-white/80 text-sm mb-6 line-clamp-2 opacity-90 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                        {category.description}
                      </p>

                      <div className="flex items-center gap-2 text-sm font-medium opacity-90 group-hover:opacity-100 transition-opacity duration-300 delay-200">
                        <span>Shop Collection</span>
                        <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>

                  {/* Sparkle Effect */}
                  <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Browse All Products Section */}
          <div className="text-center bg-white rounded-2xl p-12 shadow-sm">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Can't Find What You're Looking For?
              </h2>
              <p className="text-gray-600 mb-8">
                Browse our complete collection of authentic Indian products, or use our search to find specific items.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700 transition-colors"
                >
                  <Grid3X3 className="h-5 w-5" />
                  Browse All Products
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button className="inline-flex items-center gap-2 border border-purple-600 text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-purple-50 transition-colors">
                  <Search className="h-5 w-5" />
                  Search Products
                </button>
              </div>
            </div>
          </div>

          {/* Featured Categories Info */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Package className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Curated Collections
              </h3>
              <p className="text-gray-600 text-sm">
                Each category is carefully curated to showcase the finest examples of traditional Indian craftsmanship.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Sparkles className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Authentic Products
              </h3>
              <p className="text-gray-600 text-sm">
                Every item is sourced directly from skilled artisans and verified for authenticity and quality.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                <Heart className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Cultural Heritage
              </h3>
              <p className="text-gray-600 text-sm">
                Supporting traditional craftspeople and preserving centuries-old techniques for future generations.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}