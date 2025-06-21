'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import {
  Send,
  Mail,
  User,
  MessageCircle,
  Phone,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react'

interface ContactFormData {
  name: string
  email: string
  phone: string
  subject: string
  message: string
  inquiryType: string
}

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  })
  
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const inquiryTypes = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'product', label: 'Product Question' },
    { value: 'order', label: 'Order Support' },
    { value: 'shipping', label: 'Shipping Question' },
    { value: 'return', label: 'Return/Exchange' },
    { value: 'wholesale', label: 'Wholesale Inquiry' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'other', label: 'Other' }
  ]

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Phone validation (optional but if provided, should be valid)
    if (formData.phone.trim() && !/^[\+]?[\s\-\(\)]*([0-9][\s\-\(\)]*){10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    // Subject validation
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required'
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters'
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Simulate API call - replace with actual API endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitted(true)
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          inquiryType: 'general'
        })
      } else {
        const errorData = await response.json()
        setErrors({ submit: errorData.error || 'Failed to send message. Please try again.' })
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please check your connection and try again.' })
    } finally {
      setLoading(false)
    }
  }

  // Success state
  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Message Sent Successfully!
        </h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Thank you for contacting us. We've received your message and will get back to you within 24 hours.
        </p>
        <Button
          onClick={() => setSubmitted(false)}
          variant="outline"
        >
          Send Another Message
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form Header */}
      <div className="text-center mb-8">
        <MessageCircle className="h-8 w-8 text-purple-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">
          We'd love to hear from you
        </h3>
        <p className="text-gray-600 mt-2">
          Fill out the form below and we'll get back to you as soon as possible.
        </p>
      </div>

      {/* Error message */}
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-red-800">Error sending message</h4>
            <p className="text-sm text-red-700 mt-1">{errors.submit}</p>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <User className="h-4 w-4" />
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors ${
              errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Enter your full name"
          />
          {errors.name && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Mail className="h-4 w-4" />
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors ${
              errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Enter your email address"
          />
          {errors.email && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phone */}
        <div className="space-y-2">
          <label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Phone className="h-4 w-4" />
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors ${
              errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Enter your phone number"
          />
          {errors.phone && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.phone}
            </p>
          )}
        </div>

        {/* Inquiry Type */}
        <div className="space-y-2">
          <label htmlFor="inquiryType" className="text-sm font-medium text-gray-700">
            Inquiry Type
          </label>
          <select
            id="inquiryType"
            value={formData.inquiryType}
            onChange={(e) => handleInputChange('inquiryType', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          >
            {inquiryTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <label htmlFor="subject" className="text-sm font-medium text-gray-700">
          Subject *
        </label>
        <input
          type="text"
          id="subject"
          value={formData.subject}
          onChange={(e) => handleInputChange('subject', e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors ${
            errors.subject ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="What is your message about?"
        />
        {errors.subject && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {errors.subject}
          </p>
        )}
      </div>

      {/* Message */}
      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium text-gray-700">
          Message *
        </label>
        <textarea
          id="message"
          rows={6}
          value={formData.message}
          onChange={(e) => handleInputChange('message', e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors resize-none ${
            errors.message ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="Tell us more about your inquiry..."
        />
        {errors.message && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {errors.message}
          </p>
        )}
        <p className="text-xs text-gray-500">
          {formData.message.length}/500 characters
        </p>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send Message
            </>
          )}
        </Button>
      </div>

      {/* Privacy Notice */}
      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          By submitting this form, you agree to our privacy policy. We'll only use your information to respond to your inquiry.
        </p>
      </div>
    </form>
  )
}