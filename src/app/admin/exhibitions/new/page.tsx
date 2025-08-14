import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import AdminNavigation from '@/components/admin/AdminNavigation'
import ExhibitionForm from '@/components/admin/ExhibitionForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui'

export default async function NewExhibitionPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
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
                <Link href="/admin/exhibitions">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Exhibitions
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold leading-6 text-gray-900">
                    Add New Exhibition
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Create a new exhibition or event to track products and sales.
                  </p>
                </div>
              </div>
            </div>

            {/* Exhibition Form */}
            <ExhibitionForm mode="create" />
          </div>
        </div>
      </main>
    </div>
  )
}