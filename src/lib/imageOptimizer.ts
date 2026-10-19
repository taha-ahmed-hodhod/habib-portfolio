/**
 * High-Quality Browser-Side Image Optimization Utility
 *
 * Converts uploaded images to high-fidelity WebP (quality 88-92)
 * with smart dimension preservation, alpha transparency retention,
 * animation detection, and safe fallback.
 */

export interface ImageOptimizationOptions {
  /**
   * Maximum width or height. If an image exceeds this dimension,
   * it is downscaled proportionally. Smaller images are NEVER upscaled.
   * Default: 2560px (preserves full detail for 2K/4K displays).
   */
  maxDimension?: number

  /**
   * Compression quality (0 to 1).
   * Default: 0.90 (90%, visually near-lossless with ~60-80% file size reduction).
   */
  quality?: number

  /**
   * Output MIME type.
   * Default: 'image/webp'.
   */
  preferredFormat?: 'image/webp' | 'image/jpeg'
}

export interface ImageOptimizationResult {
  /** The final file to upload (optimized WebP, or original if smaller/animated) */
  file: File

  /** Original size in bytes */
  originalSize: number

  /** Optimized size in bytes */
  optimizedSize: number

  /** Number of bytes saved (0 if not optimized or larger) */
  savedBytes: number

  /** Space saved percentage: ((original - optimized) / original) * 100 */
  savedPercentage: number

  /** True if the file was transformed and size reduced */
  wasOptimized: boolean

  /** Original or final width */
  width: number

  /** Original or final height */
  height: number

  /** Final MIME type */
  format: string
}

/**
 * Formats byte values into human-readable strings (e.g. "1.8 MB", "340 KB").
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Detects if a GIF file is animated by inspecting its binary structure
 * for multiple Graphic Control Extensions.
 */
export async function isAnimatedGif(file: File): Promise<boolean> {
  if (file.type !== 'image/gif') return false
  try {
    const buffer = await file.slice(0, 128 * 1024).arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let frames = 0
    for (let i = 0; i < bytes.length - 1; i++) {
      // 0x21 0xF9 is the Graphic Control Extension header
      if (bytes[i] === 0x21 && bytes[i + 1] === 0xf9) {
        frames++
        if (frames > 1) return true
      }
    }
    return false
  } catch {
    return false
  }
}

/**
 * Detects if a WebP file is animated by checking the RIFF header and VP8X ANIM flag.
 */
export async function isAnimatedWebp(file: File): Promise<boolean> {
  if (file.type !== 'image/webp') return false
  try {
    const buffer = await file.slice(0, 32).arrayBuffer()
    const bytes = new Uint8Array(buffer)
    // Validate RIFF header and WEBP signature
    const riff = String.fromCharCode(...bytes.slice(0, 4))
    const webp = String.fromCharCode(...bytes.slice(8, 12))
    if (riff === 'RIFF' && webp === 'WEBP') {
      const chunk = String.fromCharCode(...bytes.slice(12, 16))
      if (chunk === 'VP8X') {
        // Bit 1 (0x02) of byte 20 is the Animation flag in VP8X chunk
        return (bytes[20] & 0x02) !== 0
      }
    }
    return false
  } catch {
    return false
  }
}

/**
 * Calculates proportional dimensions keeping aspect ratio.
 * Never upscales.
 */
export function calculateTargetDimensions(
  srcWidth: number,
  srcHeight: number,
  maxDimension: number
): { width: number; height: number } {
  if (srcWidth <= maxDimension && srcHeight <= maxDimension) {
    return { width: srcWidth, height: srcHeight }
  }

  const ratio = srcWidth / srcHeight
  if (srcWidth > srcHeight) {
    const width = maxDimension
    const height = Math.round(maxDimension / ratio)
    return { width, height }
  } else {
    const height = maxDimension
    const width = Math.round(maxDimension * ratio)
    return { width, height }
  }
}

/**
 * Optimizes an image File in the browser using HTML5 Canvas.
 *
 * Rules:
 * - Transparent PNGs maintain transparency via WebP alpha channel.
 * - Animated GIFs & animated WebPs are preserved without conversion to avoid losing animation.
 * - Vector images (SVG) are preserved untouched.
 * - If the optimized file is larger than the original, the original is retained.
 * - Visual quality target is conservative (default 0.90).
 */
export async function optimizeImageFile(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<ImageOptimizationResult> {
  const {
    maxDimension = 2560,
    quality = 0.90,
    preferredFormat = 'image/webp',
  } = options

  const originalSize = file.size

  // 1. Skip non-raster or vector images (e.g. SVG)
  if (file.type === 'image/svg+xml') {
    return {
      file,
      originalSize,
      optimizedSize: originalSize,
      savedBytes: 0,
      savedPercentage: 0,
      wasOptimized: false,
      width: 0,
      height: 0,
      format: file.type,
    }
  }

  // 2. Check for animated GIFs and animated WebPs to preserve animation
  if (file.type === 'image/gif') {
    const animated = await isAnimatedGif(file)
    if (animated) {
      return {
        file,
        originalSize,
        optimizedSize: originalSize,
        savedBytes: 0,
        savedPercentage: 0,
        wasOptimized: false,
        width: 0,
        height: 0,
        format: file.type,
      }
    }
  }

  if (file.type === 'image/webp') {
    const animated = await isAnimatedWebp(file)
    if (animated) {
      return {
        file,
        originalSize,
        optimizedSize: originalSize,
        savedBytes: 0,
        savedPercentage: 0,
        wasOptimized: false,
        width: 0,
        height: 0,
        format: file.type,
      }
    }
  }

  // 3. Load image into ImageBitmap or HTMLImageElement
  let srcWidth = 0
  let srcHeight = 0
  let imageSource: ImageBitmap | HTMLImageElement

  try {
    if (typeof createImageBitmap === 'function') {
      imageSource = await createImageBitmap(file)
      srcWidth = imageSource.width
      srcHeight = imageSource.height
    } else {
      imageSource = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        const objectUrl = URL.createObjectURL(file)
        img.onload = () => {
          URL.revokeObjectURL(objectUrl)
          resolve(img)
        }
        img.onerror = (e) => {
          URL.revokeObjectURL(objectUrl)
          reject(e)
        }
        img.src = objectUrl
      })
      srcWidth = imageSource.width
      srcHeight = imageSource.height
    }
  } catch (err) {
    console.warn('Image could not be decoded for optimization, falling back to original:', err)
    return {
      file,
      originalSize,
      optimizedSize: originalSize,
      savedBytes: 0,
      savedPercentage: 0,
      wasOptimized: false,
      width: 0,
      height: 0,
      format: file.type,
    }
  }

  // 4. Calculate dimensions
  const targetDims = calculateTargetDimensions(srcWidth, srcHeight, maxDimension)

  // 5. Draw on canvas with alpha channel support
  const canvas = document.createElement('canvas')
  canvas.width = targetDims.width
  canvas.height = targetDims.height

  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) {
    if ('close' in imageSource && typeof imageSource.close === 'function') {
      imageSource.close()
    }
    return {
      file,
      originalSize,
      optimizedSize: originalSize,
      savedBytes: 0,
      savedPercentage: 0,
      wasOptimized: false,
      width: srcWidth,
      height: srcHeight,
      format: file.type,
    }
  }

  // High-quality image smoothing
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(imageSource, 0, 0, targetDims.width, targetDims.height)

  // Clean up ImageBitmap memory if applicable
  if ('close' in imageSource && typeof imageSource.close === 'function') {
    imageSource.close()
  }

  // 6. Encode to WebP (or fallback)
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), preferredFormat, quality)
  })

  // Release canvas
  canvas.width = 0
  canvas.height = 0

  if (!blob) {
    return {
      file,
      originalSize,
      optimizedSize: originalSize,
      savedBytes: 0,
      savedPercentage: 0,
      wasOptimized: false,
      width: srcWidth,
      height: srcHeight,
      format: file.type,
    }
  }

  // 7. Check if optimization produced a smaller file
  // If the converted blob is larger or equal (e.g. an already small/compressed image),
  // retain the original file!
  if (blob.size >= originalSize) {
    return {
      file,
      originalSize,
      optimizedSize: originalSize,
      savedBytes: 0,
      savedPercentage: 0,
      wasOptimized: false,
      width: srcWidth,
      height: srcHeight,
      format: file.type,
    }
  }

  // 8. Construct clean WebP File with descriptive name
  const lastDotIndex = file.name.lastIndexOf('.')
  const baseName = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name
  const cleanExt = preferredFormat === 'image/webp' ? 'webp' : 'jpg'
  const optimizedFileName = `${baseName}.${cleanExt}`

  const optimizedFile = new File([blob], optimizedFileName, {
    type: preferredFormat,
    lastModified: Date.now(),
  })

  const savedBytes = originalSize - blob.size
  const savedPercentage = Math.round((savedBytes / originalSize) * 100)

  return {
    file: optimizedFile,
    originalSize,
    optimizedSize: blob.size,
    savedBytes,
    savedPercentage,
    wasOptimized: true,
    width: targetDims.width,
    height: targetDims.height,
    format: preferredFormat,
  }
}
