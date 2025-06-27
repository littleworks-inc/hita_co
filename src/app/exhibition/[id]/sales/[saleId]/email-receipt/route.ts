// src/app/api/exhibition/[id]/sales/[saleId]/email-receipt/route.ts
// =====================================
// Exhibition Email Receipt API Endpoint
// Handles sending receipt via email to customers
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; saleId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, receiptData } = body

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    if (!receiptData) {
      return NextResponse.json(
        { error: 'Receipt data is required' },
        { status: 400 }
      )
    }

    // Generate email content
    const { sale, items, exhibition, storeSettings } = receiptData
    const saleDate = new Date(sale.createdAt)

    const emailHTML = generateReceiptEmailHTML(receiptData)
    const emailText = generateReceiptEmailText(receiptData)

    // Here you would integrate with your email service
    // For now, we'll simulate sending the email
    
    // Example integrations:
    // - Nodemailer with SMTP
    // - SendGrid
    // - AWS SES
    // - Resend
    // - Postmark

    // Simulated email sending (replace with actual implementation)
    const emailSent = await simulateEmailSend({
      to: email,
      subject: `Receipt ${sale.saleNumber} - ${storeSettings.storeName}`,
      html: emailHTML,
      text: emailText
    })

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Receipt sent successfully',
      sentTo: email
    })

  } catch (error) {
    console.error('Email receipt error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Generate HTML email content
function generateReceiptEmailHTML(receiptData: any): string {
  const { sale, items, exhibition, storeSettings } = receiptData
  const saleDate = new Date(sale.createdAt)

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Receipt ${sale.saleNumber}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .receipt-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .content {
          padding: 30px 20px;
        }
        .section {
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .section:last-child {
          border-bottom: none;
        }
        .two-column {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }
        .item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .item-details {
          flex: 1;
        }
        .item-name {
          font-weight: 600;
          color: #333;
        }
        .item-sku {
          font-size: 0.9em;
          color: #666;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-weight: 600;
        }
        .grand-total {
          font-size: 1.2em;
          border-top: 2px solid #333;
          padding-top: 10px;
          margin-top: 10px;
        }
        .badge {
          background: #e3f2fd;
          color: #1976d2;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8em;
          font-weight: 600;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 0.9em;
        }
        @media (max-width: 600px) {
          .two-column {
            flex-direction: column;
            gap: 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <!-- Header -->
        <div class="header">
          <h1>${storeSettings.storeName}</h1>
          ${storeSettings.tagline ? `<p>${storeSettings.tagline}</p>` : ''}
          <h2>Exhibition Receipt</h2>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- Receipt Info -->
          <div class="section">
            <div class="two-column">
              <div>
                <h3>Receipt Details</h3>
                <p><strong>Receipt #:</strong> ${sale.saleNumber}</p>
                <p><strong>Date:</strong> ${saleDate.toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${saleDate.toLocaleTimeString()}</p>
              </div>
              <div>
                <h3>Exhibition</h3>
                <p><strong>${exhibition.title}</strong></p>
                <p>${exhibition.location}</p>
              </div>
            </div>
          </div>

          ${sale.customerName || sale.customerPhone ? `
          <!-- Customer Info -->
          <div class="section">
            <h3>Customer Information</h3>
            ${sale.customerName ? `<p><strong>Name:</strong> ${sale.customerName}</p>` : ''}
            ${sale.customerPhone ? `<p><strong>Phone:</strong> ${sale.customerPhone}</p>` : ''}
          </div>
          ` : ''}

          <!-- Items -->
          <div class="section">
            <h3>Items Purchased</h3>
            ${items.map((item: any) => `
              <div class="item-row">
                <div class="item-details">
                  <div class="item-name">${item.productName}</div>
                  <div class="item-sku">SKU: ${item.productSku} • ${item.categoryName}</div>
                  <div>Qty: ${item.quantity} × $${item.finalPrice.toFixed(2)}</div>
                </div>
                <div>
                  <strong>$${item.lineTotal.toFixed(2)}</strong>
                  ${item.finalPrice < item.originalPrice ? 
                    `<div class="badge">$${(item.originalPrice - item.finalPrice).toFixed(2)} saved</div>` : 
                    ''
                  }
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Totals -->
          <div class="section">
            <h3>Payment Summary</h3>
            <div class="total-row">
              <span>Subtotal</span>
              <span>$${sale.subtotal.toFixed(2)}</span>
            </div>
            ${sale.customDiscount > 0 ? `
              <div class="total-row" style="color: #4caf50;">
                <span>Staff Discount</span>
                <span>-$${sale.customDiscount.toFixed(2)}</span>
              </div>
            ` : ''}
            ${sale.bundleDiscount > 0 ? `
              <div class="total-row" style="color: #4caf50;">
                <span>Bundle Discount</span>
                <span>-$${sale.bundleDiscount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>Total</span>
              <span>$${sale.finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <!-- Payment Method -->
          <div class="section">
            <h3>Payment Method</h3>
            <p><strong>${sale.paymentMethod.replace('_', ' ')}</strong></p>
            ${sale.paymentNotes ? `<p>${sale.paymentNotes}</p>` : ''}
          </div>

          ${sale.bargainApplied || sale.salesPersonNotes ? `
          <!-- Special Notes -->
          <div class="section">
            <h3>Additional Notes</h3>
            ${sale.bargainApplied ? `
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                <strong>Bargain Applied</strong>
                ${sale.bargainReason ? `<br>${sale.bargainReason}` : ''}
              </div>
            ` : ''}
            ${sale.salesPersonNotes ? `
              <div style="background: #e3f2fd; border: 1px solid #bbdefb; padding: 10px; border-radius: 4px;">
                <strong>Staff Notes:</strong><br>${sale.salesPersonNotes}
              </div>
            ` : ''}
          </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div class="footer">
          <h3>Thank you for your purchase!</h3>
          ${storeSettings.email ? `<p>Email: ${storeSettings.email}</p>` : ''}
          ${storeSettings.phone ? `<p>Phone: ${storeSettings.phone}</p>` : ''}
          <p style="margin-top: 20px; font-size: 0.8em; color: #999;">
            This is an electronic receipt. Please keep for your records.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate plain text email content
function generateReceiptEmailText(receiptData: any): string {
  const { sale, items, exhibition, storeSettings } = receiptData
  const saleDate = new Date(sale.createdAt)

  return `
${storeSettings.storeName.toUpperCase()}
${storeSettings.tagline || ''}

EXHIBITION RECEIPT
==================

${exhibition.title}
${exhibition.location}

Receipt #: ${sale.saleNumber}
Date: ${saleDate.toLocaleDateString()}
Time: ${saleDate.toLocaleTimeString()}

${sale.customerName ? `Customer: ${sale.customerName}` : ''}
${sale.customerPhone ? `Phone: ${sale.customerPhone}` : ''}

ITEMS PURCHASED
===============
${items.map((item: any) => `
${item.productName}
SKU: ${item.productSku} • ${item.categoryName}
Qty: ${item.quantity} × $${item.finalPrice.toFixed(2)} = $${item.lineTotal.toFixed(2)}
${item.finalPrice < item.originalPrice ? `(Saved: $${(item.originalPrice - item.finalPrice).toFixed(2)})` : ''}
`).join('')}

PAYMENT SUMMARY
===============
Subtotal: $${sale.subtotal.toFixed(2)}
${sale.customDiscount > 0 ? `Staff Discount: -$${sale.customDiscount.toFixed(2)}` : ''}
${sale.bundleDiscount > 0 ? `Bundle Discount: -$${sale.bundleDiscount.toFixed(2)}` : ''}
-----------------
TOTAL: $${sale.finalTotal.toFixed(2)}

Payment Method: ${sale.paymentMethod.replace('_', ' ')}
${sale.paymentNotes || ''}

${sale.bargainApplied ? `\nBargain Applied: ${sale.bargainReason || 'Staff discount'}` : ''}
${sale.salesPersonNotes ? `\nStaff Notes: ${sale.salesPersonNotes}` : ''}

==================
Thank you for your purchase!
${storeSettings.email || ''}
${storeSettings.phone || ''}

This is an electronic receipt. Please keep for your records.
  `.trim()
}

// Simulate email sending (replace with actual email service)
async function simulateEmailSend(emailData: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<boolean> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Log email content for development
  console.log('📧 Email would be sent:', {
    to: emailData.to,
    subject: emailData.subject,
    textLength: emailData.text.length,
    htmlLength: emailData.html.length
  })
  
  // In production, replace this with actual email service:
  /*
  // Example with Nodemailer:
  const transporter = nodemailer.createTransporter({
    // Your SMTP config
  })
  
  const result = await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: emailData.to,
    subject: emailData.subject,
    text: emailData.text,
    html: emailData.html
  })
  
  return !!result.messageId
  */
  
  // Example with SendGrid:
  /*
  const sgMail = require('@sendgrid/mail')
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  
  const msg = {
    to: emailData.to,
    from: process.env.FROM_EMAIL,
    subject: emailData.subject,
    text: emailData.text,
    html: emailData.html
  }
  
  try {
    await sgMail.send(msg)
    return true
  } catch (error) {
    console.error('SendGrid error:', error)
    return false
  }
  */

  // For development, always return true
  return true
}