/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    domains: [
      'localhost',
      'uploadthing.com',
      'utfs.io',
    ],
  },
  // NOTE: Do NOT add a top-level `env` block for DATABASE_URL / JWT_SECRET.
  // Next.js inlines `env` values into the CLIENT bundle, which would leak
  // these secrets to every visitor. Server code reads them directly from
  // process.env (they are available server-side without being declared here).

  // Production optimizations
  poweredByHeader: false,
  compress: true,
  
  // Handle Prisma in serverless environments
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client')
    }
    return config
  },
  
  // Output configuration for static deployment
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
}

module.exports = nextConfig