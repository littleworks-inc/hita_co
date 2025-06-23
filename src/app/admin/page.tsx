// src/app/admin/page.tsx - Redirect to dashboard
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function AdminPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  // Redirect authenticated admin users to the dashboard
  redirect('/admin/dashboard')
}