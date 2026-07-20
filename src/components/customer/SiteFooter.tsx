// src/components/customer/SiteFooter.tsx
// Site-wide footer for customer-facing pages with shop, help, and policy links

import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Facebook, Twitter, Mail, Phone } from 'lucide-react'
import { getCustomerStoreSettings, DEFAULT_PRIMARY_COLOR } from '@/lib/store-settings'

export default async function SiteFooter() {
  const settings = await getCustomerStoreSettings()

  const storeName = settings?.storeName || 'Hita&Co'
  const tagline = settings?.tagline || 'Authentic Indian Ethnic Wear'
  const year = new Date().getFullYear()

  const shopLinks = [
    { label: 'All Products', href: '/products' },
    { label: 'Categories', href: '/categories' },
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ]

  const helpLinks = [
    { label: 'Size Guide', href: '/size-guide' },
    { label: 'Shipping Policy', href: '/shipping-policy' },
    { label: 'Sales Policy', href: '/returns' },
  ]

  const legalLinks = [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms' },
  ]

  const socialLinks = [
    settings?.instagram
      ? { label: 'Instagram', href: settings.instagram, Icon: Instagram }
      : null,
    settings?.facebook
      ? { label: 'Facebook', href: settings.facebook, Icon: Facebook }
      : null,
    settings?.twitter
      ? { label: 'Twitter', href: settings.twitter, Icon: Twitter }
      : null,
  ].filter((link): link is { label: string; href: string; Icon: typeof Instagram } => link !== null)

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {settings?.logo ? (
                <Image
                  src={settings.logo}
                  alt={storeName}
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: settings?.primaryColor || DEFAULT_PRIMARY_COLOR }}
                >
                  {storeName.charAt(0)}
                </div>
              )}
              <span className="text-lg font-bold text-white">{storeName}</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {tagline}
              {settings?.footerDescription ? `. ${settings.footerDescription}` : '.'}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex gap-4 mt-4">
                {socialLinks.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Shop</h3>
            <ul className="space-y-2">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Help</h3>
            <ul className="space-y-2">
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Get in Touch</h3>
            <ul className="space-y-3">
              {settings?.email && (
                <li>
                  <a
                    href={`mailto:${settings.email}`}
                    className="flex items-center gap-2 text-sm hover:text-white transition-colors"
                  >
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    {settings.email}
                  </a>
                </li>
              )}
              {settings?.phone && (
                <li>
                  <a
                    href={`tel:${settings.phone}`}
                    className="flex items-center gap-2 text-sm hover:text-white transition-colors"
                  >
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    {settings.phone}
                  </a>
                </li>
              )}
              {!settings?.email && !settings?.phone && (
                <li>
                  <Link href="/contact" className="text-sm hover:text-white transition-colors">
                    Send us a message
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {year} {storeName}. All rights reserved.
          </p>
          <div className="flex gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
