import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import AdminNavigation from '@/components/admin/AdminNavigation'
import ContactMessageStatusButton from '@/components/admin/ContactMessageStatusButton'
import { Card, CardContent } from '@/components/ui'
import { Badge } from '@/components/ui'
import { Mail } from 'lucide-react'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  read: 'bg-gray-100 text-gray-700',
  replied: 'bg-green-100 text-green-800'
}

export default async function ContactMessagesPage() {
  const session = await getSession()
  if (!session) {
    redirect('/admin/login')
  }

  const messages = await db.contactMessage.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />

      <main className="lg:pl-64">
        <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-b border-gray-200 pb-5 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold leading-6 text-gray-900">
                    Contact Messages
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Messages submitted through the Contact page form ({messages.length} total).
                  </p>
                </div>
              </div>
            </div>

            {messages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  No messages yet.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <Card key={msg.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">{msg.name}</span>
                            <Badge className={STATUS_STYLES[msg.status] || STATUS_STYLES.new}>
                              {msg.status}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {new Date(msg.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            <a href={`mailto:${msg.email}`} className="hover:underline">{msg.email}</a>
                            {msg.phone && <span> · {msg.phone}</span>}
                          </div>
                          <p className="mt-2 font-medium text-gray-800">{msg.subject}</p>
                          <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{msg.message}</p>
                        </div>
                        <ContactMessageStatusButton id={msg.id} status={msg.status} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
