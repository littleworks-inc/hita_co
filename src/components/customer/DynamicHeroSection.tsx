// src/components/customer/DynamicHeroSection.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
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

  // Fallback slides if no database slides exist
  const fallbackSlides: HeroSlide[] = [
    {
      id: 'fallback-1',
      title: `Welcome to ${storeName}`,
      subtitle: tagline,
      description: 'Discover our curated collection of authentic handcrafted Indian ethnic wear, jewelry, and lifestyle products.',
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
      description: 'Every product in our collection is carefully selected from skilled artisans across India.',
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
      description: 'Be the first to discover our latest collection of stunning products.',
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
        <div className="w-full h-[70vh] bg-gray-200 animate-pulse"></div>
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
      {/* Hero Background */}
      <div className="absolute inset-0">
        {currentSlideData.image ? (
          <div className="absolute inset-0">
            <Image
              src={currentSlideData.image}
              alt="Hero background"
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          </div>
        ) : (
          // Fallback gradient when no image
          <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.gradient || 'from-purple-600 to-pink-600'}`}>
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>
          </div>
        )}
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
        </>
      )}
    </section>
  )
}