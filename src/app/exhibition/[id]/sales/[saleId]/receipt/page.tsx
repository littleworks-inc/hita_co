// src/app/exhibition/[id]/sales/[saleId]/receipt/page.tsx
// =====================================
// Exhibition Receipt & Printing System
// Mobile-optimized receipt view with print functionality and QR codes
// =====================================

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  Printer,
  Download,
  Share2,
  Mail,
  MessageSquare,
  Copy,
  CheckCircle,
  AlertCircle,
  QrCode,
  Package,
  User,
  Phone,
  MapPin,
  DollarSign,
  Info,
  CreditCard
} from 'lucide-react'
import QRCodeGenerator from '@/components/exhibition/QRCodeGenerator'

// Types for sale data
interface ReceiptData {
  sale: {
    id: string
    saleNumber: string
    customerName?: string
    customerPhone?: string
    customerEmail?: string
    subtotal: number
    customDiscount: number
    bundleDiscount: number
    finalTotal: number
    paymentMethod: 'CASH' | 'ZELLE' | 'CARD' | 'SPLIT_PAYMENT'
    cashAmount?: number
    zelleAmount?: number
    cardAmount?: number
    bargainApplied: boolean
    bargainReason?: string
    salesPersonNotes?: string
    paymentNotes?: string
    createdAt: string
  }
  items: Array<{
    id: string
    productName: string
    productSku: string
    categoryName: string
    originalPrice: number
    exhibitionPrice: number
    finalPrice: number
    quantity: number
    lineTotal: number
  }>
  exhibition: {
    id: string
    title: string
    location: string
  }
  storeSettings: {
    storeName: string
    tagline?: string
    logo?: string
    email?: string
    phone?: string
    address?: any
  }
}

interface ReceiptProps {
  params: {
    id: string // exhibition id
    saleId: string
  }
}

export default function ExhibitionReceipt({ params }: ReceiptProps) {
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [customerEmail, setCustomerEmail] = useState('')
  const [qrCodeData, setQrCodeData] = useState('')
  const [copied, setCopied] = useState(false)

  // Load receipt data
  useEffect(() => {
    loadReceiptData()
  }, [params.id, params.saleId])

  // Generate QR code data when receipt loads
  useEffect(() => {
    if (receiptData) {
      const qrData = {
        type: 'exhibition_receipt',
        saleNumber: receiptData.sale.saleNumber,
        exhibitionId: params.id,
        saleId: params.saleId,
        total: receiptData.sale.finalTotal,
        date: receiptData.sale.createdAt,
        store: receiptData.storeSettings.storeName
      }
      setQrCodeData(JSON.stringify(qrData))
      
      // Set customer email if available
      if (receiptData.sale.customerEmail) {
        setCustomerEmail(receiptData.sale.customerEmail)
      }
    }
  }, [receiptData, params.id, params.saleId])

  const loadReceiptData = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/exhibition/${params.id}/sales/${params.saleId}/receipt`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load receipt')
      }

      const data = await response.json()
      setReceiptData(data)

    } catch (err) {
      console.error('Receipt loading error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load receipt')
    } finally {
      setLoading(false)
    }
  }

  // Print receipt
  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        const printContent = printRef.current.innerHTML
        
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Receipt - ${receiptData?.sale.saleNumber}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                  font-family: 'Courier New', monospace; 
                  font-size: 12px; 
                  line-height: 1.4; 
                  color: #000;
                  background: white;
                }
                .receipt-container { 
                  max-width: 72mm; 
                  margin: 0 auto; 
                  padding: 10px;
                }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .border-t { border-top: 1px dashed #000; margin: 8px 0; }
                .mb-2 { margin-bottom: 8px; }
                .mb-4 { margin-bottom: 16px; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .qr-code { display: none; }
                
                @media print {
                  body { margin: 0; }
                  .no-print { display: none !important; }
                  .receipt-container { width: 72mm; margin: 0; padding: 0; }
                }
              </style>
            </head>
            <body>
              <div class="receipt-container">
                ${printContent}
              </div>
            </body>
          </html>
        `)
        
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }
    }
  }

  // Download receipt as text
  const handleDownload = () => {
    if (receiptData) {
      const receiptText = generateReceiptText()
      const blob = new Blob([receiptText], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Receipt-${receiptData.sale.saleNumber}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  // Generate plain text receipt
  const generateReceiptText = (): string => {
    if (!receiptData) return ''

    const { sale, items, exhibition, storeSettings } = receiptData
    const date = new Date(sale.createdAt)
    
    return `
=====================================
${storeSettings.storeName.toUpperCase()}
${storeSettings.tagline || ''}
=====================================

EXHIBITION RECEIPT
${exhibition.title}
${exhibition.location}

Receipt #: ${sale.saleNumber}
Date: ${date.toLocaleDateString()}
Time: ${date.toLocaleTimeString()}

${sale.customerName ? `Customer: ${sale.customerName}` : ''}
${sale.customerPhone ? `Phone: ${sale.customerPhone}` : ''}

-------------------------------------
ITEMS PURCHASED
-------------------------------------
${items.map(item => `
${item.productName}
SKU: ${item.productSku}
Qty: ${item.quantity} x $${item.finalPrice.toFixed(2)}
Total: $${item.lineTotal.toFixed(2)}
`).join('')}

-------------------------------------
TOTALS
-------------------------------------
Subtotal: $${sale.subtotal.toFixed(2)}
${sale.customDiscount > 0 ? `Discount: -$${sale.customDiscount.toFixed(2)}` : ''}
${sale.bundleDiscount > 0 ? `Bundle Discount: -$${sale.bundleDiscount.toFixed(2)}` : ''}

TOTAL: $${sale.finalTotal.toFixed(2)}

Payment: ${sale.paymentMethod.replace('_', ' ')}
${sale.paymentNotes || ''}

${sale.bargainApplied ? `\nBargain Applied: ${sale.bargainReason || 'Staff discount'}` : ''}

=====================================
Thank you for your purchase!
${storeSettings.email || ''}
${storeSettings.phone || ''}
=====================================
    `.trim()
  }

  // Send email receipt
  const sendEmailReceipt = async () => {
    if (!customerEmail.trim() || !receiptData) return

    try {
      setSendingEmail(true)
      
      const response = await fetch(`/api/exhibition/${params.id}/sales/${params.saleId}/email-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: customerEmail.trim(),
          receiptData 
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send email')
      }

      setEmailSent(true)
      setTimeout(() => setEmailSent(false), 3000)

    } catch (err) {
      console.error('Email send error:', err)
      alert(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setSendingEmail(false)
    }
  }

  // Copy receipt link
  const copyReceiptLink = async () => {
    const link = `${window.location.origin}/exhibition/${params.id}/sales/${params.saleId}/receipt`
    
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = link
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">Loading receipt...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={loadReceiptData}
                className="flex-1"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!receiptData) return null

  const { sale, items, exhibition, storeSettings } = receiptData
  const saleDate = new Date(sale.createdAt)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Receipt #{sale.saleNumber}
                </h1>
                <p className="text-sm text-gray-600">
                  {saleDate.toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="p-2"
              >
                <Printer className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="p-2"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Email Receipt Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="w-5 h-5" />
              Email Receipt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {emailSent && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Receipt sent successfully!
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Customer Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                disabled={sendingEmail}
              />
            </div>
            
            <Button 
              onClick={sendEmailReceipt}
              disabled={!customerEmail.trim() || sendingEmail}
              className="w-full"
            >
              {sendingEmail ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </div>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email Receipt
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Share Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Share2 className="w-5 h-5" />
              Share Receipt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              onClick={copyReceiptLink}
              className="w-full justify-start"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? 'Link Copied!' : 'Copy Receipt Link'}
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const text = `Receipt ${sale.saleNumber} - $${sale.finalTotal.toFixed(2)} - ${exhibition.title}`
                  const smsLink = `sms:${sale.customerPhone || ''}?body=${encodeURIComponent(text)}`
                  window.open(smsLink, '_blank')
                }}
                disabled={!sale.customerPhone}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                SMS
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const whatsappText = `Receipt ${sale.saleNumber}\nTotal: $${sale.finalTotal.toFixed(2)}\n${exhibition.title}`
                  const whatsappLink = `https://wa.me/${sale.customerPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappText)}`
                  window.open(whatsappLink, '_blank')
                }}
                disabled={!sale.customerPhone}
              >
                <Phone className="w-4 h-4 mr-1" />
                WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Display */}
        <Card>
          <CardContent className="p-0">
            <div ref={printRef} className="receipt-content bg-white">
              <div className="p-6">
                {/* Header */}
                <div className="text-center mb-6">
                  {storeSettings.logo && (
                    <img 
                      src={storeSettings.logo} 
                      alt={storeSettings.storeName}
                      className="w-16 h-16 mx-auto mb-3 object-contain"
                    />
                  )}
                  <h2 className="text-xl font-bold text-gray-900">
                    {storeSettings.storeName}
                  </h2>
                  {storeSettings.tagline && (
                    <p className="text-sm text-gray-600 mt-1">
                      {storeSettings.tagline}
                    </p>
                  )}
                  <div className="border-t border-gray-300 mt-3 pt-3">
                    <p className="text-lg font-semibold">EXHIBITION RECEIPT</p>
                    <p className="text-sm text-gray-600">{exhibition.title}</p>
                    <p className="text-sm text-gray-600">{exhibition.location}</p>
                  </div>
                </div>

                {/* Receipt Details */}
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold">Receipt #</p>
                      <p className="text-gray-600">{sale.saleNumber}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Date & Time</p>
                      <p className="text-gray-600">
                        {saleDate.toLocaleDateString()}
                      </p>
                      <p className="text-gray-600">
                        {saleDate.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  {(sale.customerName || sale.customerPhone) && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="font-semibold text-sm mb-2">Customer Information</p>
                      {sale.customerName && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <User className="w-3 h-3" />
                          {sale.customerName}
                        </p>
                      )}
                      {sale.customerPhone && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {sale.customerPhone}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Items Purchased
                  </h3>
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.productName}</p>
                            <p className="text-xs text-gray-500">
                              SKU: {item.productSku} • {item.categoryName}
                            </p>
                          </div>
                          <p className="text-sm font-medium ml-2">
                            ${item.lineTotal.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Qty: {item.quantity} × ${item.finalPrice.toFixed(2)}</span>
                          {item.finalPrice < item.originalPrice && (
                            <Badge variant="secondary" className="text-xs">
                              ${(item.originalPrice - item.finalPrice).toFixed(2)} saved
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Payment Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${sale.subtotal.toFixed(2)}</span>
                    </div>
                    {sale.customDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Staff Discount</span>
                        <span>-${sale.customDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {sale.bundleDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Bundle Discount</span>
                        <span>-${sale.bundleDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${sale.finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment Method
                  </h3>
                  <div className="text-sm">
                    <p className="font-medium capitalize">
                      {sale.paymentMethod.replace('_', ' ')}
                    </p>
                    {sale.paymentNotes && (
                      <p className="text-gray-600 mt-1">{sale.paymentNotes}</p>
                    )}
                    {sale.paymentMethod === 'SPLIT_PAYMENT' && (
                      <div className="mt-2 space-y-1 text-xs text-gray-600">
                        {sale.cashAmount && <p>Cash: ${sale.cashAmount.toFixed(2)}</p>}
                        {sale.zelleAmount && <p>Zelle: ${sale.zelleAmount.toFixed(2)}</p>}
                        {sale.cardAmount && <p>Card: ${sale.cardAmount.toFixed(2)}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Special Notes */}
                {(sale.bargainApplied || sale.salesPersonNotes) && (
                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Additional Notes
                    </h3>
                    <div className="text-sm space-y-2">
                      {sale.bargainApplied && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                          <p className="font-medium text-yellow-800">Bargain Applied</p>
                          {sale.bargainReason && (
                            <p className="text-yellow-700">{sale.bargainReason}</p>
                          )}
                        </div>
                      )}
                      {sale.salesPersonNotes && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-2">
                          <p className="font-medium text-blue-800">Staff Notes</p>
                          <p className="text-blue-700">{sale.salesPersonNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* QR Code */}
                <div className="border-t border-gray-200 pt-4 mb-6 text-center qr-code">
                  <h3 className="font-semibold mb-3 flex items-center justify-center gap-2">
                    <QrCode className="w-4 h-4" />
                    Digital Receipt
                  </h3>
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-4 inline-block">
                    <QRCodeGenerator 
                      data={qrCodeData} 
                      size={96}
                      className="mx-auto"
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      Scan for digital copy
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 pt-4 text-center">
                  <p className="font-semibold text-lg mb-2">Thank you for your purchase!</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    {storeSettings.email && (
                      <p className="flex items-center justify-center gap-1">
                        <Mail className="w-3 h-3" />
                        {storeSettings.email}
                      </p>
                    )}
                    {storeSettings.phone && (
                      <p className="flex items-center justify-center gap-1">
                        <Phone className="w-3 h-3" />
                        {storeSettings.phone}
                      </p>
                    )}
                    {storeSettings.address && (
                      <p className="flex items-center justify-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {typeof storeSettings.address === 'string' ? 
                          storeSettings.address : 
                          `${storeSettings.address.city || ''} ${storeSettings.address.state || ''}`
                        }
                      </p>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Receipt generated on {new Date().toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 no-print">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </Button>
          
          <Button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-content,
          .receipt-content * {
            visibility: visible;
          }
          .receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .qr-code {
            display: none !important;
          }
        }
        
        /* Thermal printer styles */
        @media print and (max-width: 80mm) {
          .receipt-content {
            font-size: 11px;
            font-family: 'Courier New', monospace;
          }
          .receipt-content img {
            max-width: 60px;
            max-height: 60px;
          }
        }
      `}</style>
    </div>
  )
}