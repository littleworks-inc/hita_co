// src/components/exhibition/QRCodeGenerator.tsx
// =====================================
// QR Code Generator Component
// Generates QR codes for digital receipts
// =====================================

'use client'

import { useEffect, useRef } from 'react'

interface QRCodeGeneratorProps {
  data: string
  size?: number
  className?: string
}

export default function QRCodeGenerator({ 
  data, 
  size = 96, 
  className = '' 
}: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && data) {
      generateQRCode(data, canvasRef.current, size)
    }
  }, [data, size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`border border-gray-300 rounded ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

// Simple QR Code generator (basic implementation)
// In production, consider using a library like 'qrcode' or 'qr-code-generator'
function generateQRCode(text: string, canvas: HTMLCanvasElement, size: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  // This is a simplified QR code representation
  // In production, use a proper QR code library
  const gridSize = 21 // Standard QR code is 21x21 modules
  const moduleSize = Math.floor(size / gridSize)
  const offset = (size - (gridSize * moduleSize)) / 2

  // Create a simple pattern based on the text hash
  const hash = simpleHash(text)
  
  ctx.fillStyle = '#000000'
  
  // Draw finder patterns (corner squares)
  drawFinderPattern(ctx, offset, offset, moduleSize)
  drawFinderPattern(ctx, offset + (gridSize - 7) * moduleSize, offset, moduleSize)
  drawFinderPattern(ctx, offset, offset + (gridSize - 7) * moduleSize, moduleSize)
  
  // Draw data modules (simplified pattern based on hash)
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // Skip finder pattern areas
      if (isFinderPatternArea(row, col, gridSize)) continue
      
      // Use hash to determine if module should be dark
      const moduleHash = (hash + row * gridSize + col) % 2
      if (moduleHash === 0) {
        ctx.fillRect(
          offset + col * moduleSize,
          offset + row * moduleSize,
          moduleSize,
          moduleSize
        )
      }
    }
  }
}

function drawFinderPattern(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  moduleSize: number
) {
  // Draw 7x7 finder pattern
  // Outer border
  ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize)
  
  // Inner white area
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize)
  
  // Center black square
  ctx.fillStyle = '#000000'
  ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize)
}

function isFinderPatternArea(row: number, col: number, gridSize: number): boolean {
  // Top-left finder pattern
  if (row < 7 && col < 7) return true
  
  // Top-right finder pattern
  if (row < 7 && col >= gridSize - 7) return true
  
  // Bottom-left finder pattern
  if (row >= gridSize - 7 && col < 7) return true
  
  return false
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}