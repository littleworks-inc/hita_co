import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import AdminNavigation from '@/components/admin/AdminNavigation'
import StoreSettingsForm from '@/components/admin/StoreSettingsForm'
import { Settings } from 'lucide-react'

export default async function StoreSettingsPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  // Get store settings (create default if doesn't exist)
  let storeSettings = await db.storeSetting.findFirst({
    where: { id: 'default' }
  })

  if (!storeSettings) {
    storeSettings = await db.storeSetting.create({
      data: {
        id: 'default',
        storeName: 'Hita&Co',
        tagline: 'Authentic Indian Ethnic Wear & Lifestyle',
        primaryColor: '#1f2937',
        secondaryColor: '#ffffff',
        accentColor: '#f59e0b',
        email: 'thehitanco@gmail.com',
        currency: 'USD',
        timezone: 'America/New_York',
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <main className="lg:pl-64">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="border-b border-gray-200 pb-5 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold leading-6 text-gray-900">
                    Store Settings
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Customize your store branding, contact information, and preferences.
                  </p>
                </div>
              </div>
            </div>

            {/* Store Settings Form */}
            <StoreSettingsForm storeSettings={storeSettings} />
          </div>
        </div>
      </main>
    </div>
  )
}