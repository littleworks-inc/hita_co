/** @type {import('next').NextConfig} */

// ✅ FIXED: Next.js configuration for Netlify with proper runtime settings
const nextConfig = {
  // ✅ NETLIFY: Essential configuration
  trailingSlash: false,
  
  // ✅ OUTPUT: Standalone for serverless deployment
  output: 'standalone',
  
  // ✅ EXPERIMENTAL: Server components configuration
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  
  // ✅ SECURITY: Image domains
  images: {
    domains: [
      'localhost',
      'uploadthing.com',
      'utfs.io',
      'hitaco.netlify.app',
    ],
    unoptimized: false,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // ✅ METADATA: Set metadataBase to fix build warnings
  async generateMetadata() {
    return {
      metadataBase: new URL(
        process.env.NEXT_PUBLIC_APP_URL || 
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
        'https://hitaco.netlify.app'
      ),
    }
  },
  
  // ✅ SECURITY: Apply security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
    ]
  },
  
  // ✅ REDIRECTS: Handle routing
  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin/login',
        permanent: false,
      },
    ]
  },
  
  // ✅ WEBPACK: Optimize for production
  webpack: (config, { isServer, dev }) => {
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@prisma/client': '@prisma/client',
      }
    }
    
    // ✅ FIX: Handle Node.js modules for browser compatibility
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: false,
      buffer: false,
      stream: false,
    }
    
    return config
  },
  
  // ✅ ENVIRONMENT: Runtime variables
  env: {
    NETLIFY: process.env.NETLIFY,
    NETLIFY_DEV: process.env.NETLIFY_DEV,
  },
  
  // ✅ TYPESCRIPT: Ignore build errors during deployment
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ✅ ESLINT: Ignore lint errors during build
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig