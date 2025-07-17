// src/components/customer/DynamicHeroSection.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Star,
  Sparkles,
  Heart,
  ShoppingBag,
  ChevronLeft,
  ChevronRight
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

interface HeroSlide {
  id: string
  title: string
  subtitle?: string
  description?: string
  ctaText?: string
  ctaLink?: string
  image?: string
  gradient?: string
  order: number
  isActive: boolean
}

interface DynamicHeroSectionProps {
  storeSettings: StoreSettings | null
}

export default function DynamicHeroSection({ storeSettings }: DynamicHeroSectionProps) {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  const storeName = storeSettings?.storeName || 'Hita&Co'
  const tagline = storeSettings?.tagline || 'Authentic Indian Ethnic Wear & Lifestyle'
  const primaryColor = storeSettings?.primaryColor || '#1f2937'
  const accentColor = storeSettings?.accentColor || '#f59e0b'

  // Fallback slides if no database slides exist
  const fallbackSlides: HeroSlide[] = [
    {
      id: 'fallback-1',
      title: `Welcome to ${storeName}`,
      subtitle: tagline,
      description: 'Discover our curated collection of authentic handcrafted Indian ethnic wear, jewelry, and lifestyle products. Each piece tells a story of tradition, artistry, and timeless elegance.',
      ctaText: 'Shop Collection',
      ctaLink: '/products',
      image: '',
      gradient: 'from-purple-600 to-pink-600',
      order: 1,
      isActive: true
    },
    {
      id: 'fallback-2',
      title: 'Handcrafted Excellence',
      subtitle: 'Artisan-made products with love',
      description: 'Every product in our collection is carefully selected from skilled artisans across India. Experience the beauty of traditional craftsmanship with modern style.',
      ctaText: 'Explore Collection',
      ctaLink: '/products',
      image: '',
      gradient: 'from-indigo-600 to-purple-600',
      order: 2,
      isActive: true
    },
    {
      id: 'fallback-3',
      title: 'New Arrivals',
      subtitle: 'Fresh styles just in',
      description: 'Be the first to discover our latest collection of stunning sarees, elegant jewelry, and beautiful home decor items. Limited quantities available.',
      ctaText: 'See New Arrivals',
      ctaLink: '/products?sort=newest',
      image: '',
      gradient: 'from-pink-600 to-red-600',
      order: 3,
      isActive: true
    }
  ]

  // Load slides from database
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await fetch('/api/hero-slides')
        if (response.ok) {
          const data = await response.json()
          if (data.length > 0) {
            setSlides(data)
          } else {
            // Use fallback slides if no database slides
            setSlides(fallbackSlides)
          }
        } else {
          setSlides(fallbackSlides)
        }
      } catch (error) {
        console.error('Error fetching hero slides:', error)
        setSlides(fallbackSlides)
      } finally {
        setLoading(false)
      }
    }

    fetchSlides()
  }, [])

  // Auto-slide functionality
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(timer)
  }, [slides.length, isPaused])

  // Navigation functions
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  if (loading) {
    return (
      <section className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[70vh] py-16">
            <div className="space-y-8 lg:pr-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-12 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-20 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square lg:aspect-[4/5] rounded-3xl bg-gray-200 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (slides.length === 0) {
    return null
  }

  const currentSlideData = slides[currentSlide]

  return (
    <section 
      className="relative overflow-hidden bg-white min-h-[70vh]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Hero Image Background */}
      {currentSlideData.image ? (
        <div className="absolute inset-0">
          <Image
            src={currentSlideData.image}
            alt={currentSlideData.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
      ) : (
        // Fallback gradient when no image
        <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.gradient || 'from-purple-600 to-pink-600'}`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center min-h-[70vh] py-16">
          {/* Content - Centered with max width */}
          <div className="w-full max-w-2xl space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm text-purple-700 px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              <Sparkles className="h-4 w-4" />
              Featured Collection
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white drop-shadow-lg">
                {currentSlideData.title.split(' ').map((word, index) => (
                  <span key={index}>
                    {word === storeName ? (
                      <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                        {word}
                      </span>
                    ) : (
                      word
                    )}
                    {index < currentSlideData.title.split(' ').length - 1 && ' '}
                  </span>
                ))}
              </h1>
              
              {currentSlideData.subtitle && (
                <h2 className="text-xl md:text-2xl text-white/90 font-medium drop-shadow-md">
                  {currentSlideData.subtitle}
                </h2>
              )}
            </div>

            {/* Description */}
            {currentSlideData.description && (
              <p className="text-lg text-white/85 leading-relaxed max-w-xl drop-shadow-md">
                {currentSlideData.description}
              </p>
            )}

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 text-yellow-400 fill-current drop-shadow-sm" />
                  ))}
                </div>
                <span className="drop-shadow-sm">4.9/5 (500+ reviews)</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-400 drop-shadow-sm" />
                <span className="drop-shadow-sm">1000+ happy customers</span>
              </div>
            </div>

            {/* CTA Buttons - Only show ONE set */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              {currentSlideData.ctaText && currentSlideData.ctaLink && (
                <Link
                  href={currentSlideData.ctaLink}
                  className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transform hover:-translate-y-1 transition-all duration-300 justify-center sm:justify-start shadow-xl"
                >
                  <ShoppingBag className="h-5 w-5" />
                  {currentSlideData.ctaText}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              )}
              
              <Link
                href="/about"
                className="inline-flex items-center gap-2 border-2 border-white/70 text-white backdrop-blur-sm px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/20 transition-all duration-300 justify-center sm:justify-start"
              >
                Our Story
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls - Only show if multiple slides */}
      {slides.length > 1 && (
        <>
          {/* Slide Indicators - Bottom Center */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 z-20">
            {/* Previous Button */}
            <button
              onClick={prevSlide}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm shadow-lg hover:bg-white/30 border border-white/30 transition-all duration-200 hover:scale-105"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>

            {/* Slide Indicators */}
            <div className="flex space-x-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentSlide
                      ? 'bg-white scale-125 shadow-lg'
                      : 'bg-white/50 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm shadow-lg hover:bg-white/30 border border-white/30 transition-all duration-200 hover:scale-105"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Slide Counter - Top Right (smaller and less prominent) */}
          <div className="absolute top-6 right-6 bg-black/30 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs z-20">
            {currentSlide + 1} / {slides.length}
          </div>
        </>
      )}
    </section>
  )
}