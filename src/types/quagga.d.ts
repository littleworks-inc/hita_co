// FIX 1: Create src/types/quagga.d.ts (NEW FILE)
// ============================================
declare module 'quagga' {
  interface QuaggaJSConfigObject {
    inputStream: {
      name: string
      type: string
      target: string | HTMLElement
      constraints: {
        width: number
        height: number
        facingMode: string
      }
    }
    decoder: {
      readers: string[]
    }
  }

  interface QuaggaJSResultObject {
    codeResult: {
      code: string
    }
  }

  export function init(config: QuaggaJSConfigObject, callback: (err: any) => void): void
  export function start(): void
  export function stop(): void
  export function onDetected(callback: (result: QuaggaJSResultObject) => void): void
  export function offDetected(callback: (result: QuaggaJSResultObject) => void): void
}