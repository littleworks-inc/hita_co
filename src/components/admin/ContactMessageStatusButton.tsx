'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const NEXT_STATUS: Record<string, string> = {
  new: 'read',
  read: 'replied',
  replied: 'new'
}

const LABEL: Record<string, string> = {
  new: 'Mark as Read',
  read: 'Mark as Replied',
  replied: 'Mark as New'
}

export default function ContactMessageStatusButton({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await fetch(`/api/admin/contact-messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: NEXT_STATUS[status] || 'read' })
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 whitespace-nowrap"
    >
      {loading ? 'Updating...' : LABEL[status] || 'Mark as Read'}
    </button>
  )
}
