// src/components/customer/DynamicHeroSection.tsx - Responsive Version
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight
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
  initialSlides?: HeroSlide[]
}

export default function DynamicHeroSection({ storeSettings, initialSlides }: DynamicHeroSectionProps) {
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
      gradient: 'from-primary to-accent',
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
      gradient: 'from-primary via-primary/80 to-accent',
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
      gradient: 'from-accent to-primary',
      order: 3,
      isActive: true
    }
  ]

  // When the parent server component already fetched slides, resolve the
  // initial state synchronously (DB slides, or the fallback set if the DB
  // has none) so the server-rendered HTML already shows real content — no
  // skeleton, no blank flash, no client round trip.
  const [slides, setSlides] = useState<HeroSlide[]>(() =>
    initialSlides ? (initialSlides.length > 0 ? initialSlides : fallbackSlides) : []
  )
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(!initialSlides)
  const [isPaused, setIsPaused] = useState(false)

  // Fallback path: only used if no slides were passed in from the server.
  useEffect(() => {
    if (initialSlides) return

    const fetchSlides = async () => {
      try {
        const response = await fetch('/api/hero-slides')
        if (response.ok) {
          const data = await response.json()
          setSlides(data.length > 0 ? data : fallbackSlides)
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
  }, [initialSlides])

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
        <div className="w-full bg-gray-200 animate-pulse" style={{ aspectRatio: '16/9' }}>
          <div className="h-full min-h-[50vh] sm:min-h-[60vh] lg:min-h-[70vh]"></div>
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
      className="relative overflow-hidden bg-gray-50 w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Constrained container for hero content */}
      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Background with Responsive Height and Width Constraints */}
        <div 
          className="relative w-full h-[25vh] sm:h-[30vh] md:h-[35vh] lg:h-[40vh] xl:h-[45vh] 
                     rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden shadow-lg"
        >
          {currentSlideData.image ? (
            // Image Background with Proper Scaling
            <div className="absolute inset-0">
              <Image
                src={currentSlideData.image}
                alt="Hero background"
                fill
                className="object-cover object-center w-full h-full"
                priority
                sizes="100vw"
                quality={85}
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
              />
              {/* Overlay for better content readability */}
              <div className="absolute inset-0 bg-black/40"></div>
            </div>
          ) : (
            // Fallback gradient when no image with responsive scaling
            <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.gradient || 'from-primary to-accent'}`}>
              {/* Subtle background pattern that scales */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: 'clamp(40px, 4vw, 80px)' // Responsive pattern size
                }}
              />
            </div>
          )}

          {/* Slide copy + CTA overlay */}
          <div className="absolute inset-0 z-10 flex items-center">
            <div className="px-6 sm:px-10 lg:px-14 max-w-2xl">
              {currentSlideData.subtitle && (
                <p className="text-white/90 text-sm sm:text-base font-medium mb-2 sm:mb-3 drop-shadow">
                  {currentSlideData.subtitle}
                </p>
              )}
              <h1 className="font-display text-white text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight drop-shadow-lg">
                {currentSlideData.title}
              </h1>
              {currentSlideData.description && (
                <p className="hidden sm:block text-white/90 text-base lg:text-lg mt-3 lg:mt-4 max-w-xl drop-shadow">
                  {currentSlideData.description}
                </p>
              )}
              {currentSlideData.ctaText && currentSlideData.ctaLink && (
                <Link
                  href={currentSlideData.ctaLink}
                  className="inline-flex items-center gap-2 mt-4 sm:mt-6 bg-white text-gray-900 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base shadow-lg hover:bg-gray-100 transition-colors"
                >
                  {currentSlideData.ctaText}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Controls - Only show if multiple slides */}
        {slides.length > 1 && (
          <>
            {/* Slide Indicators - Responsive Positioning */}
            <div className="absolute bottom-4 sm:bottom-6 lg:bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 sm:space-x-4 z-20">
              {/* Previous Button - Responsive Size */}
              <button
                onClick={prevSlide}
                className="p-2 sm:p-3 rounded-full bg-white/20 backdrop-blur-sm shadow-lg hover:bg-white/30 border border-white/30 transition-all duration-200 hover:scale-105"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </button>

              {/* Slide Indicators - Responsive Size */}
              <div className="flex space-x-1.5 sm:space-x-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`rounded-full transition-all duration-200 ${
                      index === currentSlide
                        ? 'bg-white scale-125 shadow-lg w-3 h-3 sm:w-4 sm:h-4'
                        : 'bg-white/50 hover:bg-white/70 w-2.5 h-2.5 sm:w-3 sm:h-3'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Next Button - Responsive Size */}
              <button
                onClick={nextSlide}
                className="p-2 sm:p-3 rounded-full bg-white/20 backdrop-blur-sm shadow-lg hover:bg-white/30 border border-white/30 transition-all duration-200 hover:scale-105"
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Remove custom CSS - use Tailwind responsive classes only */}
    </section>
  )
}