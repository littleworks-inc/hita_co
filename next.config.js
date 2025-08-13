/** @type {import('next').NextConfig} */

// ✅ Enhanced Next.js configuration optimized for Netlify deployment
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
  }
]

const nextConfig = {
  // ✅ NETLIFY: Essential configuration for Netlify deployment
  trailingSlash: false,
  
  // ✅ NETLIFY: Optimize for serverless functions
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  
  // ✅ SECURITY: Restricted image domains
  images: {
    domains: [
      'localhost',
      'uploadthing.com',
      'utfs.io',
      'hitaco.netlify.app', // Add your Netlify domain
    ],
    unoptimized: false, // Enable image optimization
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // ✅ SECURITY: Apply security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  
  // ✅ NETLIFY: Handle redirects at Next.js level
  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin/login',
        permanent: false,
      },
    ]
  },
  
  // ✅ PRODUCTION: Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    if (!dev && !isServer) {
      // Optimize bundle size for production
      config.resolve.alias = {
        ...config.resolve.alias,
        '@prisma/client': '@prisma/client',
      }
    }
    
    return config
  },
  
  // ✅ NETLIFY: Environment variable handling
  env: {
    NETLIFY: process.env.NETLIFY,
    NETLIFY_DEV: process.env.NETLIFY_DEV,
  },
  
  // ✅ OUTPUT: Configure for serverless deployment
  output: 'standalone',
}

module.exports = nextConfig