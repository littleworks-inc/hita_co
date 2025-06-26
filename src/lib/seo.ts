// ✅ FIXED: src/lib/seo.ts - Fix Invalid OpenGraph Type

import type { Metadata } from 'next'

interface StoreSettings {
  id: string
  storeName: string
  tagline: string | null
  logo: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  email: string | null
  phone: string | null
  address: any
  instagram: string | null
  facebook: string | null
  pinterest: string | null
  twitter: string | null
}

interface Product {
  id: string
  name: string
  sku: string
  sellingPriceUSD: number
  stockQuantity: number
  images: string[]
  description?: string | null
  shortDescription?: string | null
  tags?: string[]
  seoTitle?: string | null
  seoDescription?: string | null
  category: {
    name: string
    slug: string
  }
  country: {
    name: string
    code: string
  }
  createdAt: Date
  updatedAt: Date
}

// Generate base metadata for store
export function generateStoreMetadata(storeSettings: StoreSettings | null): Metadata {
  const storeName = storeSettings?.storeName || 'Hita&Co'
  const tagline = storeSettings?.tagline || 'Authentic Indian Ethnic Wear & Lifestyle'
  const description = `Discover ${storeName} - ${tagline}. Shop authentic handcrafted Indian ethnic wear, jewelry, and lifestyle products. Each piece tells a story of tradition, artistry, and timeless elegance.`
  
  return {
    title: {
      default: `${storeName} - ${tagline}`,
      template: `%s | ${storeName}`
    },
    description,
    keywords: [
      'Indian ethnic wear',
      'handcrafted jewelry',
      'traditional clothing',
      'sarees',
      'authentic Indian products',
      'artisan made',
      'ethnic fashion',
      'Indian accessories',
      'handmade crafts',
      'cultural wear'
    ],
    authors: [{ name: storeName }],
    creator: storeName,
    publisher: storeName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://hitaandco.com'),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: '/',
      title: `${storeName} - ${tagline}`,
      description,
      siteName: storeName,
      images: [
        {
          url: storeSettings?.logo || '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: `${storeName} - Authentic Indian Products`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${storeName} - ${tagline}`,
      description,
      images: [storeSettings?.logo || '/og-image.jpg'],
      creator: storeSettings?.twitter ? 
        `@${storeSettings.twitter.split('/').pop()}` : undefined
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      // Add these when you have them
      // google: 'your-google-verification-code',
      // yandex: 'your-yandex-verification-code',
      // yahoo: 'your-yahoo-verification-code',
    }
  }
}

// ✅ FIXED: Generate product metadata with valid OpenGraph type
export function generateProductMetadata(product: Product, storeSettings: StoreSettings | null): Metadata {
  const storeName = storeSettings?.storeName || 'Hita&Co'
  const title = product.seoTitle || `${product.name} - ${product.category.name}`
  const description = product.seoDescription || product.shortDescription || product.description || 
    `${product.name} - Authentic ${product.category.name.toLowerCase()} from ${product.country.name}. Handcrafted with traditional techniques. SKU: ${product.sku}`

  // Clean description for meta tags
  const cleanDescription = description.replace(/\n/g, ' ').substring(0, 160)
  
  // Generate keywords
  const keywords = [
    product.name,
    product.category.name,
    product.country.name,
    'handcrafted',
    'authentic',
    'traditional',
    ...(product.tags || [])
  ]

  return {
    title,
    description: cleanDescription,
    keywords: keywords.join(', '),
    openGraph: {
      title,
      description: cleanDescription,
      type: 'website', // ✅ FIXED: Changed from 'product' to 'website'
      images: product.images.slice(0, 4).map((image, index) => ({
        url: image,
        width: 800,
        height: 800,
        alt: `${product.name} - Image ${index + 1}`
      })),
      url: `/products/${product.name.toLowerCase().replace(/\s+/g, '-')}-${product.sku}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: cleanDescription,
      images: product.images.slice(0, 1),
    },
    alternates: {
      canonical: `/products/${product.name.toLowerCase().replace(/\s+/g, '-')}-${product.sku}`,
    }
  }
}

// Generate category metadata
export function generateCategoryMetadata(category: any, storeSettings: StoreSettings | null): Metadata {
  const storeName = storeSettings?.storeName || 'Hita&Co'
  const title = `${category.name} Collection`
  const description = category.description || 
    `Explore our ${category.name.toLowerCase()} collection at ${storeName}. Authentic handcrafted ${category.name.toLowerCase()} products from skilled artisans.`

  return {
    title,
    description: description.substring(0, 160),
    keywords: [
      category.name,
      'handcrafted',
      'authentic',
      'Indian products',
      'traditional',
      'artisan made'
    ],
    openGraph: {
      title,
      description: description.substring(0, 160),
      type: 'website', // ✅ FIXED: Using 'website' instead of 'product'
      url: `/categories/${category.slug}`,
    },
    twitter: {
      card: 'summary',
      title,
      description: description.substring(0, 160),
    },
    alternates: {
      canonical: `/categories/${category.slug}`,
    }
  }
}

// Generate structured data for products
export function generateProductJsonLd(product: Product, storeSettings: StoreSettings | null) {
  const storeName = storeSettings?.storeName || 'Hita&Co'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hitaandco.com'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.shortDescription || `${product.name} from ${storeName}`,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: storeName
    },
    offers: {
      '@type': 'Offer',
      price: product.sellingPriceUSD,
      priceCurrency: 'USD',
      availability: product.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: storeName
      }
    },
    image: product.images.map(image => `${baseUrl}${image}`),
    category: product.category.name,
    url: `${baseUrl}/products/${product.name.toLowerCase().replace(/\s+/g, '-')}-${product.sku}`
  }
}

// Generate breadcrumb structured data
export function generateBreadcrumbJsonLd(breadcrumbs: { name: string; url: string }[]) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hitaandco.com'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${baseUrl}${crumb.url}`
    }))
  }
}

// Generate organization structured data
export function generateOrganizationJsonLd(storeSettings: StoreSettings | null) {
  const storeName = storeSettings?.storeName || 'Hita&Co'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hitaandco.com'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: storeName,
    url: baseUrl,
    logo: storeSettings?.logo ? `${baseUrl}${storeSettings.logo}` : `${baseUrl}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      email: storeSettings?.email,
      telephone: storeSettings?.phone,
      contactType: 'customer service'
    },
    sameAs: [
      storeSettings?.instagram,
      storeSettings?.facebook,
      storeSettings?.twitter,
      storeSettings?.pinterest
    ].filter(Boolean)
  }
}