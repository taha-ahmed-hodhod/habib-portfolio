import React, { useRef, useState } from 'react'
import { Upload, X, RefreshCw, AlertCircle, CheckCircle2, Film, FileText } from 'lucide-react'
import {
  type MediaFolder,
  validateMediaFile,
  uploadMediaFile,
  deleteStorageMedia,
} from '@/services/storageService'
import { Button } from '@/components/ui/Button'

export interface MediaUploaderProps {
  value?: string | null
  currentUrl?: string | null
  onChange?: (url: string | null, storagePath?: string | null) => void
  onUploadComplete?: (url: string, storagePath?: string) => void
  onRemove?: () => void
  folder: MediaFolder
  mediaType?: 'image' | 'video' | 'document'
  maxSizeBytes?: number
  label?: string
  description?: string
  isAr?: boolean
  className?: string
  disabled?: boolean
  /**
   * If true, immediately deletes the old storage file when removed or replaced.
   * Default is false (caller performs deletion upon database commit).
   */
  autoDeleteOldOnStorage?: boolean
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  value,
  currentUrl,
  onChange,
  onUploadComplete,
  onRemove,
  folder,
  mediaType = 'image',
  maxSizeBytes,
  label,
  description,
  isAr = true,
  className = '',
  disabled = false,
  autoDeleteOldOnStorage = false,
}) => {
  const effectiveValue = currentUrl !== undefined ? currentUrl : value
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleFileSelection = async (file: File) => {
    setErrorMsg(null)
    setSuccessMsg(null)

    // 1. Validation
    const validation = validateMediaFile(file, mediaType, isAr)
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Invalid file')
      return
    }

    if (maxSizeBytes && file.size > maxSizeBytes) {
      setErrorMsg(
        isAr
          ? `حجم الملف يتجاوز الحد المسموح (${Math.round(maxSizeBytes / (1024 * 1024))}MB)`
          : `File size exceeds the limit (${Math.round(maxSizeBytes / (1024 * 1024))}MB)`
      )
      return
    }

    // 2. Upload
    setIsUploading(true)
    const oldUrl = effectiveValue

    try {
      const { publicUrl, storagePath } = await uploadMediaFile(file, folder)

      // Notify parent of the new URL and storagePath
      if (onChange) onChange(publicUrl, storagePath)
      if (onUploadComplete) onUploadComplete(publicUrl, storagePath)

      // If autoDeleteOldOnStorage is configured and an old URL exists, clean it up
      if (autoDeleteOldOnStorage && oldUrl && oldUrl !== publicUrl) {
        deleteStorageMedia(oldUrl).catch((err) => console.warn('Old file cleanup notice:', err))
      }

      setSuccessMsg(isAr ? 'تم رفع الملف بنجاح!' : 'File uploaded successfully!')
      setTimeout(() => setSuccessMsg(null), 3500)
    } catch (err: unknown) {
      console.error('Upload error:', err)
      setErrorMsg(
        err instanceof Error
          ? err.message
          : isAr
          ? 'فشل في رفع الملف، يرجى المحاولة مرة أخرى'
          : 'Failed to upload file, please try again'
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelection(file)
    }
    // reset input so the same file can be re-selected if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isUploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled || isUploading) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelection(file)
    }
  }

  const handleDelete = async () => {
    if (disabled || isUploading) return
    const currentUrl = effectiveValue
    if (onChange) onChange(null, null)
    if (onRemove) onRemove()
    if (autoDeleteOldOnStorage && currentUrl) {
      deleteStorageMedia(currentUrl).catch((err) => console.warn('Old file cleanup notice:', err))
    }
  }

  const acceptedTypes =
    mediaType === 'video'
      ? 'video/mp4,video/webm'
      : mediaType === 'document'
      ? 'application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,text/plain'
      : 'image/jpeg,image/png,image/webp'

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-[#B3B3B3] uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Upload Box / Preview Area */}
      {effectiveValue ? (
        /* Preview with Action Controls */
        <div className="relative rounded-2xl border border-[#262626] bg-[#0E0E0E] p-3 overflow-hidden group">
          <div className="relative aspect-video sm:aspect-[16/9] w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
            {mediaType === 'video' ? (
              <video
                src={effectiveValue}
                controls
                muted
                playsInline
                className="w-full h-full object-contain"
              />
            ) : mediaType === 'document' ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#141414] text-[#38BDF8]">
                <FileText className="w-12 h-12 mb-2" />
                <span className="text-xs text-white font-medium max-w-[220px] truncate">
                  {effectiveValue.split('/').pop()}
                </span>
                <span className="text-[10px] text-[#777] mt-1">
                  {isAr ? 'تم رفع المستند بنجاح' : 'Document uploaded successfully'}
                </span>
              </div>
            ) : (
              <img
                src={effectiveValue}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Action Overlay */}
          <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-[#1C1C1C]">
            <span className="text-[11px] text-[#777] truncate max-w-[220px] font-mono">
              {effectiveValue.split('/').pop()}
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                icon={<RefreshCw className="w-3.5 h-3.5 text-[#8B5CF6]" />}
              >
                {isAr ? 'استبدال' : 'Replace'}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={disabled || isUploading}
                icon={<X className="w-3.5 h-3.5" />}
              >
                {isAr ? 'حذف' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Drag & Drop Upload Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[160px] ${
            isDragging
              ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 scale-[1.01]'
              : 'border-[#262626] bg-[#0C0C0C] hover:border-[#383838] hover:bg-[#121212]'
          } ${disabled || isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#8B5CF6] border-t-transparent animate-spin" />
              <span className="text-xs font-semibold text-[#8B5CF6]">
                {isAr ? 'جاري الرفع إلى التخزين السحابي...' : 'Uploading to Supabase Storage...'}
              </span>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#161616] border border-[#242424] flex items-center justify-center text-[#8B5CF6] mb-3 group-hover:scale-105 transition-transform">
                {mediaType === 'video' ? (
                  <Film className="w-6 h-6" />
                ) : mediaType === 'document' ? (
                  <FileText className="w-6 h-6" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-semibold text-[#F5F5F5]">
                  {isAr ? 'اسحب الملف وأفلته هنا، أو' : 'Drag & drop file here, or'}{' '}
                  <span className="text-[#8B5CF6] underline underline-offset-2">
                    {isAr ? 'تصفح جهازك' : 'browse files'}
                  </span>
                </p>
                <p className="text-[11px] text-[#777]">
                  {description ||
                    (mediaType === 'video'
                      ? isAr
                        ? 'فيديوهات MP4 أو WebM (حتى 100MB)'
                        : 'MP4 or WebM videos (up to 100MB)'
                      : mediaType === 'document'
                      ? isAr
                        ? 'مستندات PDF أو Word أو Excel (حتى 30MB)'
                        : 'PDF, Word, or Excel documents (up to 30MB)'
                      : isAr
                      ? 'صور PNG أو JPG أو WebP (حتى 10MB)'
                      : 'PNG, JPG, or WebP images (up to 10MB)')}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Feedback Messages */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  )
}
