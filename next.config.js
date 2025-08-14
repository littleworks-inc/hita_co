/** @type {import('next').NextConfig} */

// ✅ CORRECTED: Next.js configuration preserving customer portal
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
  
  // ✅ REMOVED: NO ROOT REDIRECT - Let customer portal work normally
  // The root "/" should show the customer homepage, not redirect to admin
  
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