'use client'

import { useState } from 'react'
import { Send, CheckCircle, AlertCircle } from 'lucide-react'

interface ContactFormClientProps {
  primaryColor: string
}

const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
}

export default function ContactFormClient({ primaryColor }: ContactFormClientProps) {
  const [formData, setFormData] = useState(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleChange = (field: keyof typeof initialFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          inquiryType: 'general',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message || 'Thank you for your message.' })
        setFormData(initialFormState)
      } else {
        setResult({ success: false, message: data.error || 'Something went wrong. Please try again.' })
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const ringStyle = { '--tw-ring-color': primaryColor } as React.CSSProperties

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {result && (
        <div
          className={`flex items-start gap-2 p-4 rounded-lg text-sm ${
            result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {result.success ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span>{result.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            required
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent focus:outline-none"
            style={ringStyle}
            placeholder="Enter your first name"
            disabled={submitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            required
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent focus:outline-none"
            style={ringStyle}
            placeholder="Enter your last name"
            disabled={submitting}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent focus:outline-none"
            style={ringStyle}
            placeholder="your.email@example.com"
            disabled={submitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent focus:outline-none"
            style={ringStyle}
            placeholder="+1 (555) 123-4567"
            disabled={submitting}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subject *
        </label>
        <input
          type="text"
          required
          minLength={5}
          value={formData.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent focus:outline-none"
          style={ringStyle}
          placeholder="What can we help you with? (e.g., Product inquiry, Order status, Shipping question)"
          disabled={submitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Message *
        </label>
        <textarea
          required
          minLength={10}
          rows={6}
          value={formData.message}
          onChange={(e) => handleChange('message', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent focus:outline-none resize-none"
          style={ringStyle}
          placeholder="Tell us more about your inquiry... (e.g., product details you're looking for, order number, delivery address, etc.)"
          disabled={submitting}
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:transform hover:scale-105 shadow-lg disabled:opacity-60 disabled:hover:scale-100"
          style={{ backgroundColor: primaryColor }}
        >
          <Send className="inline h-5 w-5 mr-2" />
          {submitting ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </form>
  )
}
