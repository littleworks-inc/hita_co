import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Force dynamic rendering - this route uses cookies or request.url
export const dynamic = 'force-dynamic'

// Contact form submission interface
interface ContactFormData {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  inquiryType: string
}

export async function POST(request: NextRequest) {
  try {
    const data: ContactFormData = await request.json()

    // Validate required fields
    const requiredFields = ['name', 'email', 'subject', 'message', 'inquiryType']
    const missingFields = requiredFields.filter(field => !data[field as keyof ContactFormData]?.trim())
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Validate name length
    if (data.name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long' },
        { status: 400 }
      )
    }

    // Validate subject length
    if (data.subject.trim().length < 5) {
      return NextResponse.json(
        { error: 'Subject must be at least 5 characters long' },
        { status: 400 }
      )
    }

    // Validate message length
    if (data.message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters long' },
        { status: 400 }
      )
    }

    // Validate phone if provided
    if (data.phone && data.phone.trim() && !/^[\+]?[\s\-\(\)]*([0-9][\s\-\(\)]*){10,}$/.test(data.phone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number' },
        { status: 400 }
      )
    }

    // Rate limiting check (simple implementation)
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    
    // You can implement more sophisticated rate limiting here
    // For now, we'll just proceed

    // Store the contact message in database (you may want to create a ContactMessage model)
    // For now, we'll log it and simulate sending an email
    
    console.log('Contact form submission:', {
      name: data.name,
      email: data.email,
      phone: data.phone || 'Not provided',
      subject: data.subject,
      message: data.message,
      inquiryType: data.inquiryType,
      timestamp: new Date().toISOString(),
      ip: clientIP
    })

    // Here you would typically:
    // 1. Save to database
    // 2. Send email notification to admin
    // 3. Send confirmation email to customer
    // 4. Integrate with CRM or support system

    // Example of saving to database (you'll need to create the ContactMessage model):
    /*
    await db.contactMessage.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        subject: data.subject.trim(),
        message: data.message.trim(),
        inquiryType: data.inquiryType,
        ipAddress: clientIP,
        userAgent: request.headers.get('user-agent') || null,
        status: 'new'
      }
    })
    */

    // Example of sending email notification (you'll need to configure email service):
    /*
    await sendEmailNotification({
      to: process.env.ADMIN_EMAIL || 'admin@hitaandco.com',
      subject: `New Contact Form: ${data.subject}`,
      template: 'contact-form-notification',
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
        inquiryType: data.inquiryType
      }
    })

    await sendEmailConfirmation({
      to: data.email,
      subject: 'Thank you for contacting us',
      template: 'contact-confirmation',
      data: {
        name: data.name,
        subject: data.subject
      }
    })
    */

    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you for your message. We will get back to you within 24 hours.' 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact form error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}

// Optional: GET method to retrieve contact messages (admin only)
export async function GET(request: NextRequest) {
  try {
    // You would add admin authentication here
    // const session = await getSession()
    // if (!session || session.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Retrieve contact messages from database
    // const messages = await db.contactMessage.findMany({
    //   orderBy: { createdAt: 'desc' },
    //   take: 50
    // })

    return NextResponse.json(
      { message: 'Contact messages endpoint - admin authentication required' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}