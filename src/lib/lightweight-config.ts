// lib/lightweight-config.ts
// Configuration system to make your existing components lightweight without breaking them

interface LightweightConfig {
  // Navigation optimizations
  navigation: {
    height: 'compact' | 'normal' // h-12 vs h-16
    searchBehavior: 'hidden' | 'inline' // Hide search by default
    actionButtons: 'minimal' | 'full' // Fewer buttons in header
    logoSize: 'small' | 'normal'
  }
  
  // Product card optimizations  
  productCards: {
    padding: 'tight' | 'normal' // p-3 vs p-6
    hoverEffects: 'minimal' | 'full' // Simple hover vs complex
    imageLoading: 'lazy' | 'eager'
    textLength: 'truncated' | 'full' // Single line vs multi-line
    showSecondaryInfo: boolean // Category, stock info, etc.
  }
  
  // Homepage optimizations
  homepage: {
    heroSize: 'compact' | 'full' // py-12 vs py-20
    sectionsToShow: ('categories' | 'featured' | 'trust' | 'newArrivals')[]
    loadingStrategy: 'progressive' | 'immediate'
    imageOptimization: boolean
  }
  
  // Grid and layout optimizations
  layout: {
    gridGap: 'tight' | 'normal' // gap-4 vs gap-6
    containerPadding: 'minimal' | 'normal'
    maxWidth: 'constrained' | 'full' // max-w-6xl vs max-w-7xl
  }
  
  // Performance optimizations
  performance: {
    animationSpeed: 'fast' | 'normal' // 150ms vs 300ms
    enableComplexAnimations: boolean
    prefetchImages: boolean
    enableIntersectionObserver: boolean
  }
  
  // Feature toggles
  features: {
    wishlist: boolean
    themeToggle: boolean
    currencySelector: boolean
    advancedFiltering: boolean
    productComparison: boolean
  }
}

// Default lightweight configuration
export const LIGHTWEIGHT_CONFIG: LightweightConfig = {
  navigation: {
    height: 'compact',
    searchBehavior: 'hidden',
    actionButtons: 'minimal',
    logoSize: 'small'
  },
  productCards: {
    padding: 'tight',
    hoverEffects: 'minimal',
    imageLoading: 'lazy',
    textLength: 'truncated',
    showSecondaryInfo: false
  },
  homepage: {
    heroSize: 'compact',
    sectionsToShow: ['categories', 'featured'],
    loadingStrategy: 'progressive',
    imageOptimization: true
  },
  layout: {
    gridGap: 'tight',
    containerPadding: 'minimal',
    maxWidth: 'constrained'
  },
  performance: {
    animationSpeed: 'fast',
    enableComplexAnimations: false,
    prefetchImages: false,
    enableIntersectionObserver: true
  },
  features: {
    wishlist: false,
    themeToggle: false,
    currencySelector: true, // Keep this as it's core eCommerce
    advancedFiltering: false,
    productComparison: false
  }
}

// Normal configuration (your current setup)
export const NORMAL_CONFIG: LightweightConfig = {
  navigation: {
    height: 'normal',
    searchBehavior: 'inline',
    actionButtons: 'full',
    logoSize: 'normal'
  },
  productCards: {
    padding: 'normal',
    hoverEffects: 'full',
    imageLoading: 'eager',
    textLength: 'full',
    showSecondaryInfo: true
  },
  homepage: {
    heroSize: 'full',
    sectionsToShow: ['categories', 'featured', 'trust', 'newArrivals'],
    loadingStrategy: 'immediate',
    imageOptimization: false
  },
  layout: {
    gridGap: 'normal',
    containerPadding: 'normal',
    maxWidth: 'full'
  },
  performance: {
    animationSpeed: 'normal',
    enableComplexAnimations: true,
    prefetchImages: true,
    enableIntersectionObserver: false
  },
  features: {
    wishlist: true,
    themeToggle: true,
    currencySelector: true,
    advancedFiltering: true,
    productComparison: true
  }
}

// Configuration context for React components
import { createContext, useContext, ReactNode } from 'react'

const LightweightContext = createContext<LightweightConfig>(NORMAL_CONFIG)

interface LightweightProviderProps {
  children: ReactNode
  config?: Partial<LightweightConfig>
  mode?: 'lightweight' | 'normal'
}

export function LightweightProvider({ 
  children, 
  config = {},
  mode = 'normal'
}: LightweightProviderProps) {
  const baseConfig = mode === 'lightweight' ? LIGHTWEIGHT_CONFIG : NORMAL_CONFIG
  const mergedConfig = { ...baseConfig, ...config }
  
  return (
    <LightweightContext.Provider value={mergedConfig}>
      {children}
    </LightweightContext.Provider>
  )
}

export function useLightweight() {
  return useContext(LightweightContext)
}

// Utility functions to generate classes based on config
export function getNavigationClasses(config: LightweightConfig['navigation']) {
  const classes = []
  
  if (config.height === 'compact') classes.push('h-12')
  else classes.push('h-16')
  
  if (config.logoSize === 'small') classes.push('[&_.logo]:h-8 [&_.logo]:w-8')
  else classes.push('[&_.logo]:h-10 [&_.logo]:w-10')
  
  return classes.join(' ')
}

export function getProductCardClasses(config: LightweightConfig['productCards']) {
  const classes = []
  
  if (config.padding === 'tight') classes.push('p-3')
  else classes.push('p-6')
  
  if (config.hoverEffects === 'minimal') {
    classes.push('hover:shadow-md hover:transform hover:translate-y-[-1px] transition-all duration-150')
  } else {
    classes.push('hover:shadow-lg hover:transform hover:scale-105 transition-all duration-300')
  }
  
  if (config.textLength === 'truncated') {
    classes.push('[&_.product-title]:line-clamp-1')
  }
  
  return classes.join(' ')
}

export function getHeroClasses(config: LightweightConfig['homepage']) {
  const classes = []
  
  if (config.heroSize === 'compact') classes.push('py-12')
  else classes.push('py-20')
  
  return classes.join(' ')
}

export function getGridClasses(config: LightweightConfig['layout']) {
  const classes = []
  
  if (config.gridGap === 'tight') classes.push('gap-4')
  else classes.push('gap-6')
  
  if (config.maxWidth === 'constrained') classes.push('max-w-6xl')
  else classes.push('max-w-7xl')
  
  return classes.join(' ')
}

// HOW TO USE THIS SYSTEM:

// 1. Wrap your app with the provider:
/*
// In your layout.tsx or _app.tsx
<LightweightProvider mode="lightweight">
  <YourApp />
</LightweightProvider>
*/

// 2. Use in your existing components:
/*
// In your CustomerNavigation component
import { useLightweight, getNavigationClasses } from '@/lib/lightweight-config'

export default function CustomerNavigation() {
  const config = useLightweight()
  const navClasses = getNavigationClasses(config.navigation)
  
  return (
    <nav className={`bg-white shadow-lg ${navClasses}`}>
      {config.features.themeToggle && <ThemeToggle />}
      {config.features.wishlist && <WishlistButton />}
      // ... rest of your component
    </nav>
  )
}
*/

// 3. Easy toggle between modes:
/*
// For lightweight mode:
<LightweightProvider mode="lightweight">

// For normal mode:
<LightweightProvider mode="normal">

// For custom config:
<LightweightProvider 
  mode="lightweight" 
  config={{ 
    features: { currencySelector: true } 
  }}
>
*/

export default LightweightConfig