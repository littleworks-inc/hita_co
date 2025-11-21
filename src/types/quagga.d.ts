// Type declarations for quagga barcode scanner library
declare module 'quagga' {
  interface QuaggaConfig {
    inputStream?: {
      name?: string
      type?: string
      target?: HTMLElement | null
      constraints?: {
        width?: number | { min?: number; max?: number }
        height?: number | { min?: number; max?: number }
        facingMode?: string
        aspectRatio?: { min?: number; max?: number }
        deviceId?: string
      }
      area?: {
        top?: string
        right?: string
        left?: string
        bottom?: string
      }
      singleChannel?: boolean
    }
    locator?: {
      patchSize?: string
      halfSample?: boolean
    }
    numOfWorkers?: number
    frequency?: number
    decoder?: {
      readers?: string[]
      debug?: {
        drawBoundingBox?: boolean
        showFrequency?: boolean
        drawScanline?: boolean
        showPattern?: boolean
      }
      multiple?: boolean
    }
    locate?: boolean
  }

  interface QuaggaResult {
    codeResult?: {
      code?: string
      format?: string
      start?: number
      end?: number
      codeset?: string
      startInfo?: {
        error?: number
        code?: number
        start?: number
        end?: number
      }
      decodedCodes?: Array<{
        error?: number
        code?: number
        start?: number
        end?: number
      }>
      direction?: number
    }
    line?: Array<{ x: number; y: number }>
    angle?: number
    pattern?: number[]
    box?: Array<[number, number]>
    boxes?: Array<Array<[number, number]>>
  }

  interface Quagga {
    init(config: QuaggaConfig, callback?: (err: Error | null) => void): void
    start(): void
    stop(): void
    onDetected(callback: (result: QuaggaResult) => void): void
    offDetected(callback?: (result: QuaggaResult) => void): void
    onProcessed(callback: (result: QuaggaResult) => void): void
    offProcessed(callback?: (result: QuaggaResult) => void): void
    decodeSingle(config: QuaggaConfig, callback: (result: QuaggaResult) => void): void
    canvas: {
      ctx: {
        image: CanvasRenderingContext2D
        overlay: CanvasRenderingContext2D
      }
      dom: {
        image: HTMLCanvasElement
        overlay: HTMLCanvasElement
      }
    }
    CameraAccess: {
      request(video: HTMLVideoElement, constraints: MediaStreamConstraints): Promise<MediaStream>
      release(): void
      getActiveTrack(): MediaStreamTrack | null
      getActiveStreamLabel(): string
    }
    ImageDebug: {
      drawPath(path: Array<{ x: number; y: number }>, context: CanvasRenderingContext2D, style: { color: string; lineWidth: number }): void
      drawRect(box: Array<[number, number]>, context: CanvasRenderingContext2D, style: { color: string; lineWidth: number }): void
    }
  }

  const Quagga: Quagga
  export default Quagga
}
