import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import AdminNavigation from '@/components/admin/AdminNavigation'
import ExhibitionForm from '@/components/admin/ExhibitionForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

interface EditExhibitionPageProps {
  params: {
    id: string
  }
}

export default async function EditExhibitionPage({ params }: EditExhibitionPageProps) {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  // Get exhibition data
  const exhibition = await db.exhibition.findUnique({
    where: { id: params.id }
  })

  if (!exhibition) {
    notFound()
  }

  // Format dates for form input
  const formattedExhibition = {
    ...exhibition,
    startDate: new Date(exhibition.startDate).toISOString().slice(0, 16),
    endDate: new Date(exhibition.endDate).toISOString().slice(0, 16)
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
                <Link href={`/admin/exhibitions/${exhibition.id}`}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Exhibition
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold leading-6 text-gray-900">
                    Edit Exhibition
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Update exhibition details, dates, and settings.
                  </p>
                </div>
              </div>
            </div>

            {/* Exhibition Form */}
            <ExhibitionForm 
              exhibition={formattedExhibition}
              mode="edit"
            />
          </div>
        </div>
      </main>
    </div>
  )
}