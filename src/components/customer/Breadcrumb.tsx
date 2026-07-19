// src/components/customer/Breadcrumb.tsx
// Shared breadcrumb trail for customer pages - matches the style already
// used on /products (Home > ... > Current), so wayfinding is consistent
// across pages instead of only appearing on product listing/detail.

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumb({ items, className = 'mb-8' }: BreadcrumbProps) {
  return (
    <nav className={className} aria-label="Breadcrumb">
      <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
        <Link href="/" className="hover:text-purple-600 transition-colors">
          Home
        </Link>
        {items.map((item, index) => (
          <span key={index} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            {item.href ? (
              <Link href={item.href} className="hover:text-purple-600 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium">{item.label}</span>
            )}
          </span>
        ))}
      </div>
    </nav>
  )
}
