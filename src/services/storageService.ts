import { supabase } from '@/lib/supabase'

export const BUCKET_NAME = 'portfolio-media'

export type MediaFolder =
  | 'profile'
  | 'clients'
  | 'pages'
  | 'works/images'
  | 'works/videos'
  | 'works/thumbnails'
  | 'works/documents'
  | 'testimonials'

export interface MediaValidationConfig {
  allowedMimeTypes: string[]
  maxSizeBytes: number
}

export const MEDIA_CONFIG = {
  image: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
  },
  video: {
    allowedMimeTypes: ['video/mp4', 'video/webm'],
    maxSizeBytes: 100 * 1024 * 1024, // 100MB
  },
  document: {
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
    ],
    maxSizeBytes: 30 * 1024 * 1024, // 30MB
  },
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate a file against media type rules (MIME and size).
 */
export function validateMediaFile(
  file: File,
  type: 'image' | 'video' | 'document',
  isAr = true
): ValidationResult {
  const config = MEDIA_CONFIG[type]

  if (!config.allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: isAr
        ? `نوع الملف غير مدعوم (${file.type}). الأنواع المدعومة: ${config.allowedMimeTypes
            .map((m) => m.split('/')[1].toUpperCase())
            .join(', ')}`
        : `Unsupported file type (${file.type}). Supported types: ${config.allowedMimeTypes
            .map((m) => m.split('/')[1].toUpperCase())
            .join(', ')}`,
    }
  }

  if (file.size > config.maxSizeBytes) {
    const maxMb = Math.round(config.maxSizeBytes / (1024 * 1024))
    const currentMb = (file.size / (1024 * 1024)).toFixed(1)
    return {
      valid: false,
      error: isAr
        ? `حجم الملف (${currentMb}MB) يتجاوز الحد الأقصى المسموح به (${maxMb}MB)`
        : `File size (${currentMb}MB) exceeds the maximum allowed limit of ${maxMb}MB`,
    }
  }

  return { valid: true }
}

/**
 * Extract storage relative path from a Supabase public URL.
 * e.g. https://xyz.supabase.co/storage/v1/object/public/portfolio-media/profile/avatar.png -> profile/avatar.png
 */
export function extractStoragePath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null
  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`
  const index = publicUrl.indexOf(marker)
  if (index !== -1) {
    return publicUrl.substring(index + marker.length)
  }
  return null
}

/**
 * Generate a unique, URL-safe path for the file inside the given folder.
 */
export function generateFilePath(folder: MediaFolder, originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'bin'
  const cleanBase = originalName
    .substring(0, originalName.lastIndexOf('.'))
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .substring(0, 30)
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  return `${folder}/${cleanBase}-${uniqueSuffix}.${ext}`
}

/**
 * Upload a media file to Supabase Storage in the specified folder.
 */
export async function uploadMediaFile(
  file: File,
  folder: MediaFolder
): Promise<{ publicUrl: string; storagePath: string }> {
  const filePath = generateFilePath(folder, file.name)

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)
  if (!data?.publicUrl) {
    throw new Error('Failed to retrieve public URL for uploaded media')
  }

  return {
    publicUrl: data.publicUrl,
    storagePath: filePath,
  }
}

/**
 * Delete a media file from Supabase Storage by its public URL or storage path.
 */
export async function deleteStorageMedia(publicUrlOrPath: string | null | undefined): Promise<boolean> {
  if (!publicUrlOrPath) return false
  const storagePath = publicUrlOrPath.includes('http')
    ? extractStoragePath(publicUrlOrPath)
    : publicUrlOrPath

  if (!storagePath) return false

  try {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath])
    if (error) {
      console.warn('Storage removal notice:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('Storage removal exception:', err)
    return false
  }
}

/**
 * Safe replacement flow:
 * 1. Upload new file.
 * 2. Return new URL and storagePath.
 * 3. The caller updates the DB, and only after successful DB update calls `deleteStorageMedia(oldUrl)`.
 * If DB update fails, caller calls `deleteStorageMedia(newStoragePath)` to cleanup the newly uploaded orphan.
 */
export async function replaceMediaFile(
  file: File,
  folder: MediaFolder
): Promise<{ newPublicUrl: string; newStoragePath: string }> {
  const result = await uploadMediaFile(file, folder)
  return {
    newPublicUrl: result.publicUrl,
    newStoragePath: result.storagePath,
  }
}
