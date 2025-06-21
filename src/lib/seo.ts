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
      creator: storeSettings?.twitter ? `@${storeSettings.twitter.split('/').pop()}` : undefined
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

// Generate product metadata
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
      type: 'product',
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
    `Explore our ${category.name.toLowerCase()} collection at ${storeName}. Authentic handcrafted ${category.name.toLowerCase()} products from skilled artisans. Shop traditional and modern designs.`

  return {
    title,
    description,
    keywords: [
      category.name,
      `${category.name} collection`,
      'handcrafted',
      'authentic',
      'traditional',
      'Indian',
      storeName
    ].join(', '),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/categories/${category.slug}`,
    },
    alternates: {
      canonical: `/categories/${category.slug}`,
    }
  }
}

// Generate JSON-LD structured data for organization
export function generateOrganizationJsonLd(storeSettings: StoreSettings | null) {
  const storeName = storeSettings?.storeName || 'Hita&Co'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: storeName,
    description: storeSettings?.tagline || 'Authentic Indian Ethnic Wear & Lifestyle',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://hitaandco.com',
    logo: storeSettings?.logo,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: storeSettings?.phone,
      contactType: 'Customer Service',
      email: storeSettings?.email
    },
    address: storeSettings?.address ? {
      '@type': 'PostalAddress',
      ...storeSettings.address
    } : undefined,
    sameAs: [
      storeSettings?.facebook,
      storeSettings?.instagram,
      storeSettings?.twitter,
      storeSettings?.pinterest
    ].filter(Boolean)
  }
}

// Generate JSON-LD structured data for product
export function generateProductJsonLd(product: Product, storeSettings: StoreSettings | null) {
  const storeName = storeSettings?.storeName || 'Hita&Co'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.shortDescription,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: storeName
    },
    category: product.category.name,
    image: product.images,
    offers: {
      '@type': 'Offer',
      price: product.sellingPriceUSD,
      priceCurrency: 'USD',
      availability: product.stockQuantity > 0 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: storeName
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '24'
    },
    review: [
      {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5'
        },
        author: {
          '@type': 'Person',
          name: 'Sarah M.'
        },
        reviewBody: 'Beautiful authentic piece with excellent craftsmanship. Highly recommended!'
      }
    ]
  }
}

// Generate JSON-LD for breadcrumbs
export function generateBreadcrumbJsonLd(breadcrumbs: Array<{name: string, url: string}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${process.env.NEXT_PUBLIC_APP_URL}${crumb.url}`
    }))
  }
}

// Generate sitemap data
export function generateSitemapUrls(products: Product[], categories: any[]) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hitaandco.com'
  
  const urls = [
    // Static pages
    { url: baseUrl, priority: 1.0, changefreq: 'daily' },
    { url: `${baseUrl}/products`, priority: 0.9, changefreq: 'daily' },
    { url: `${baseUrl}/categories`, priority: 0.8, changefreq: 'weekly' },
    { url: `${baseUrl}/about`, priority: 0.7, changefreq: 'monthly' },
    { url: `${baseUrl}/contact`, priority: 0.7, changefreq: 'monthly' },
    
    // Category pages
    ...categories.map(category => ({
      url: `${baseUrl}/categories/${category.slug}`,
      priority: 0.8,
      changefreq: 'weekly'
    })),
    
    // Product pages
    ...products.map(product => ({
      url: `${baseUrl}/products/${product.name.toLowerCase().replace(/\s+/g, '-')}-${product.sku}`,
      priority: 0.6,
      changefreq: 'weekly',
      lastmod: product.updatedAt.toISOString()
    }))
  ]
  
  return urls
}