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

  // Security headers applied at the framework level, not via netlify.toml's
  // [[headers]] - that only covers static assets on Netlify's Next.js
  // Runtime and silently does not apply to dynamic/SSR routes, which this
  // app uses almost everywhere (confirmed: netlify.toml defined these same
  // headers but they never showed up in production responses).
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },


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