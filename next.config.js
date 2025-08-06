/** @type {import('next').NextConfig} */

// ✅ SECURITY: Enhanced Next.js configuration with security best practices
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
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
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  },
  {
    key: 'Content-Security-Policy',
    value: process.env.NODE_ENV === 'production' 
      ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://api.mistral.ai https://openrouter.ai https://generativelanguage.googleapis.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
      : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' http://localhost:* ws://localhost:*;"
  }
]

const nextConfig = {
  // ✅ SECURITY: Server components configuration
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  
  // ✅ SECURITY: Restricted image domains
  images: {
    domains: [
      'localhost',
      'uploadthing.com',
      'utfs.io',
    ],
    // Additional security for image optimization
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // ❌ REMOVED: No sensitive environment variables exposed to client
  // Only public variables should be prefixed with NEXT_PUBLIC_
  
  // ✅ SECURITY: Production optimizations
  poweredByHeader: false, // Don't advertise Next.js usage
  compress: true, // Enable gzip compression
  generateEtags: true, // Enable ETags for caching
  
  // ✅ SECURITY: Headers configuration
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Additional headers for API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'X-API-Version',
            value: '1.0.0',
          },
        ],
      },
    ]
  },
  
  // ✅ SECURITY: Redirects for common security issues
  async redirects() {
    return [
      {
        source: '/.env',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/.git/:path*',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/wp-admin/:path*',
        destination: '/404',
        permanent: false,
      },
    ]
  },
  
  // ✅ SECURITY: Webpack configuration for production
  webpack: (config, { isServer, dev }) => {
    // Handle Prisma in serverless environments
    if (isServer) {
      config.externals.push('@prisma/client')
    }
    
    // ✅ SECURITY: Minimize and optimize in production
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        // Additional optimization for security
        sideEffects: false,
        usedExports: true,
      }
    }
    
    // ✅ SECURITY: Source map configuration
    if (!dev) {
      config.devtool = false // No source maps in production
    }
    
    return config
  },
  
  // ✅ SECURITY: Runtime configuration (server-side only)
  serverRuntimeConfig: {
    // Server-only secrets (not exposed to browser)
    jwtSecret: process.env.JWT_SECRET,
    databaseUrl: process.env.DATABASE_URL,
  },
  
  // ✅ SECURITY: Public runtime configuration (careful with this)
  publicRuntimeConfig: {
    // Only truly public configuration
    appName: 'Ecommers Platform',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || '',
  },
  
  // Output configuration for deployment
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // ✅ SECURITY: Disable x-powered-by header
  poweredByHeader: false,
  
  // ✅ SECURITY: Enable React strict mode for better error detection
  reactStrictMode: true,
  
  // ✅ SECURITY: SWC minification for better performance and smaller bundles
  swcMinify: true,
}

module.exports = nextConfig