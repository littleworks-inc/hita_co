'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Star,
  Sparkles,
  Heart,
  ShoppingBag
} from 'lucide-react'

interface StoreSettings {
  id: string
  storeName: string
  tagline: string | null
  logo: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

interface HeroSectionProps {
  storeSettings: StoreSettings | null
}

export default function HeroSection({ storeSettings }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const storeName = storeSettings?.storeName || 'Hita&Co'
  const tagline = storeSettings?.tagline || 'Authentic Indian Ethnic Wear & Lifestyle'
  const primaryColor = storeSettings?.primaryColor || '#1f2937'
  const accentColor = storeSettings?.accentColor || '#f59e0b'

  // Hero slides data
  const slides = [
    {
      id: 1,
      title: `Welcome to ${storeName}`,
      subtitle: tagline,
      description: 'Discover our curated collection of authentic handcrafted Indian ethnic wear, jewelry, and lifestyle products. Each piece tells a story of tradition, artistry, and timeless elegance.',
      cta: 'Shop Collection',
      ctaLink: '/products',
      image: '/hero-1.jpg', // Placeholder - replace with actual images
      gradient: 'from-purple-600 to-pink-600'
    },
    {
      id: 2,
      title: 'Handcrafted Excellence',
      subtitle: 'Artisan-made products with love',
      description: 'Every product in our collection is carefully selected from skilled artisans across India. Experience the beauty of traditional craftsmanship with modern style.',
      cta: 'Explore Jewelry',
      ctaLink: '/categories/jewelry',
      image: '/hero-2.jpg', // Placeholder
      gradient: 'from-indigo-600 to-purple-600'
    },
    {
      id: 3,
      title: 'New Arrivals',
      subtitle: 'Fresh styles just in',
      description: 'Be the first to discover our latest collection of stunning sarees, elegant jewelry, and beautiful home decor items. Limited quantities available.',
      cta: 'See New Arrivals',
      ctaLink: '/products?sort=newest',
      image: '/hero-3.jpg', // Placeholder
      gradient: 'from-pink-600 to-red-600'
    }
  ]

  // Auto-slide functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(timer)
  }, [slides.length])

  const currentSlideData = slides[currentSlide]

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[70vh] py-16">
          {/* Content Side */}
          <div className="space-y-8 lg:pr-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Featured Collection
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                {currentSlideData.title.split(' ').map((word, index) => (
                  <span key={index}>
                    {word === storeName ? (
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {word}
                      </span>
                    ) : (
                      word
                    )}
                    {index < currentSlideData.title.split(' ').length - 1 && ' '}
                  </span>
                ))}
              </h1>
              
              <h2 className="text-xl md:text-2xl text-gray-600 font-medium">
                {currentSlideData.subtitle}
              </h2>
            </div>

            {/* Description */}
            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
              {currentSlideData.description}
            </p>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span>4.9/5 (500+ reviews)</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span>1000+ happy customers</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={currentSlideData.ctaLink}
                className={`inline-flex items-center gap-2 bg-gradient-to-r ${currentSlideData.gradient} text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 justify-center sm:justify-start`}
              >
                <ShoppingBag className="h-5 w-5" />
                {currentSlideData.cta}
                <ArrowRight className="h-5 w-5" />
              </Link>
              
              <Link
                href="/about"
                className="inline-flex items-center gap-2 border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full font-semibold text-lg hover:border-purple-500 hover:text-purple-600 transition-all duration-300 justify-center sm:justify-start"
              >
                Our Story
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Image Side */}
          <div className="relative">
            {/* Main Hero Image */}
            <div className="relative aspect-square lg:aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
              {/* Placeholder for when no image is available */}
              <div className={`w-full h-full bg-gradient-to-br ${currentSlideData.gradient} flex items-center justify-center`}>
                <div className="text-white text-center">
                  <div className="w-32 h-32 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles className="h-16 w-16" />
                  </div>
                  <p className="text-xl font-medium">Beautiful Product Collection</p>
                  <p className="text-white/80 mt-2">Premium quality items</p>
                </div>
              </div>
              
              {/* Uncomment when you have actual images */}
              {/* <Image
                src={currentSlideData.image}
                alt={currentSlideData.title}
                fill
                className="object-cover"
                priority={currentSlide === 0}
              /> */}
            </div>

            {/* Floating Cards */}
            <div className="absolute -top-6 -left-6 bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Star className="h-6 w-6 text-green-600 fill-current" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Free Shipping</p>
                  <p className="text-sm text-gray-500">On orders $100+</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Heart className="h-6 w-6 text-purple-600 fill-current" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Handcrafted</p>
                  <p className="text-sm text-gray-500">With love & care</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="flex justify-center space-x-3 pb-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 w-8'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
    </section>
  )
}