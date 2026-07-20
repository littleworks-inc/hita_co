// src/lib/store-settings.ts
// Shared store settings fetcher for customer-facing pages (navigation, footer, policy pages)

import { db } from '@/lib/db'

// Re-exported here so existing server-side imports of these constants from
// '@/lib/store-settings' keep working. Client components should import
// directly from '@/lib/brand' instead - this file pulls in the Prisma
// client via '@/lib/db' above, which must never end up in a client bundle.
export { DEFAULT_STORE_NAME, DEFAULT_PRIMARY_COLOR, DEFAULT_SECONDARY_COLOR, DEFAULT_ACCENT_COLOR } from '@/lib/brand'

export interface CustomerStoreSettings {
  id: string
  storeName: string
  tagline: string | null
  logo: string | null
  favicon: string | null
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
  currency: string
  disableShoppingCart?: boolean
  catalogModeSettings?: string
  returnsEnabled: boolean
  returnPeriodDays: number
  hasRestockingFee: boolean
  restockingFeePercentage: number
  noReturnsReason: string | null
  announcementBar: string | null
  metaTitle: string | null
  metaDescription: string | null
  businessHours: string | null
  footerDescription: string | null
}

export async function getCustomerStoreSettings(): Promise<CustomerStoreSettings | null> {
  try {
    const settings = await db.storeSetting.findFirst({
      where: { id: 'default' }
    })

    if (!settings) return null

    return {
      id: settings.id,
      storeName: settings.storeName,
      tagline: settings.tagline,
      logo: settings.logo,
      favicon: settings.favicon,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      email: settings.email,
      phone: settings.phone,
      address: settings.address,
      instagram: settings.instagram,
      facebook: settings.facebook,
      pinterest: settings.pinterest,
      twitter: settings.twitter,
      currency: settings.currency,
      disableShoppingCart: settings.disableShoppingCart ?? undefined,
      catalogModeSettings: (settings.catalogModeSettings as string | undefined) ?? undefined,
      returnsEnabled: settings.returnsEnabled ?? true,
      returnPeriodDays: settings.returnPeriodDays || 30,
      hasRestockingFee: settings.hasRestockingFee || false,
      restockingFeePercentage: settings.restockingFeePercentage || 0,
      noReturnsReason: settings.noReturnsReason || null,
      announcementBar: settings.announcementBar || null,
      metaTitle: settings.metaTitle || null,
      metaDescription: settings.metaDescription || null,
      businessHours: settings.businessHours || null,
      footerDescription: settings.footerDescription || null,
    }
  } catch (error) {
    console.error('Error fetching store settings:', error)
    return null
  }
}

export interface NavCategory {
  id: string
  name: string
  slug: string
}

// Top-level categories with at least one active, in-stock product — same
// query /api/categories runs with no query params. Fetched server-side so
// CustomerNavigation doesn't need a client round trip on every page load.
export async function getNavCategories(): Promise<NavCategory[]> {
  try {
    const categories = await db.category.findMany({
      where: { parentId: null },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: {
              where: { isActive: true, stockQuantity: { gt: 0 } }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return categories
      .filter(category => category._count.products > 0)
      .map(({ id, name, slug }) => ({ id, name, slug }))
  } catch (error) {
    console.error('Error fetching nav categories:', error)
    return []
  }
}
