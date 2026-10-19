import React, { useRef, useState, useEffect } from 'react'
import {
  Upload,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Film,
  FileText,
  Sparkles,
  Check,
} from 'lucide-react'
import {
  type MediaFolder,
  validateMediaFile,
  uploadMediaFile,
  deleteStorageMedia,
} from '@/services/storageService'
import {
  optimizeImageFile,
  formatBytes,
} from '@/lib/imageOptimizer'
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

interface PendingOptimizationReview {
  file: File
  previewUrl: string
  originalSize: number
  optimizedSize: number
  savedBytes: number
  savedPercentage: number
  wasOptimized: boolean
  width: number
  height: number
  format: string
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
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [pendingReview, setPendingReview] = useState<PendingOptimizationReview | null>(null)
  const [optimizationBadge, setOptimizationBadge] = useState<{
    originalSize: number
    optimizedSize: number
    savedPercentage: number
    wasOptimized: boolean
  } | null>(null)

  // Revoke object URL on cleanup
  useEffect(() => {
    return () => {
      if (pendingReview?.previewUrl) {
        URL.revokeObjectURL(pendingReview.previewUrl)
      }
    }
  }, [pendingReview])

  const handleFileSelection = async (file: File) => {
    setErrorMsg(null)
    setSuccessMsg(null)

    // 1. Initial Validation
    const validation = validateMediaFile(file, mediaType, isAr)
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Invalid file')
      return
    }

    // For non-images (video or document), upload directly with standard flow
    if (mediaType !== 'image') {
      if (maxSizeBytes && file.size > maxSizeBytes) {
        setErrorMsg(
          isAr
            ? `حجم الملف يتجاوز الحد المسموح (${Math.round(maxSizeBytes / (1024 * 1024))}MB)`
            : `File size exceeds the limit (${Math.round(maxSizeBytes / (1024 * 1024))}MB)`
        )
        return
      }

      await executeUpload(file)
      return
    }

    // 2. High-Quality Image Optimization Flow (WebP, quality 0.90, max 2560px)
    setIsOptimizing(true)
    try {
      const optResult = await optimizeImageFile(file, {
        quality: 0.90,
        maxDimension: 2560,
      })

      // Check max size constraint after optimization
      if (maxSizeBytes && optResult.optimizedSize > maxSizeBytes) {
        setErrorMsg(
          isAr
            ? `حجم الصورة بعد التحسين (${formatBytes(optResult.optimizedSize)}) يتجاوز الحد المسموح به (${formatBytes(maxSizeBytes)}). يرجى اختيار صورة أخرى.`
            : `Optimized image size (${formatBytes(optResult.optimizedSize)}) exceeds the limit (${formatBytes(maxSizeBytes)}). Please choose another image.`
        )
        return
      }

      // Create temporary object URL for preview review
      const localPreviewUrl = URL.createObjectURL(optResult.file)

      // Store in pendingReview for user review before upload
      setPendingReview({
        file: optResult.file,
        previewUrl: localPreviewUrl,
        originalSize: optResult.originalSize,
        optimizedSize: optResult.optimizedSize,
        savedBytes: optResult.savedBytes,
        savedPercentage: optResult.savedPercentage,
        wasOptimized: optResult.wasOptimized,
        width: optResult.width,
        height: optResult.height,
        format: optResult.format,
      })
    } catch (err: unknown) {
      console.error('Image optimization error:', err)
      setErrorMsg(
        isAr
          ? 'تعذر تحسين الصورة تلقائياً. تأكد من أن الملف سليم وحاول مرة أخرى.'
          : 'Could not optimize image. Please verify file integrity and try again.'
      )
    } finally {
      setIsOptimizing(false)
    }
  }

  // 3. Confirm and Upload the optimized file to Supabase Storage
  const handleConfirmUpload = async () => {
    if (!pendingReview || isUploading) return
    const reviewData = pendingReview
    await executeUpload(reviewData.file, reviewData)
  }

  // Cancel the pending review and discard temporary preview
  const handleCancelReview = () => {
    if (pendingReview?.previewUrl) {
      URL.revokeObjectURL(pendingReview.previewUrl)
    }
    setPendingReview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const executeUpload = async (
    fileToUpload: File,
    reviewMeta?: PendingOptimizationReview
  ) => {
    setIsUploading(true)
    setErrorMsg(null)
    const oldUrl = effectiveValue

    try {
      const { publicUrl, storagePath } = await uploadMediaFile(fileToUpload, folder)

      // Notify parent of the new URL and storagePath
      if (onChange) onChange(publicUrl, storagePath)
      if (onUploadComplete) onUploadComplete(publicUrl, storagePath)

      // If autoDeleteOldOnStorage is configured and an old URL exists, clean it up safely
      if (autoDeleteOldOnStorage && oldUrl && oldUrl !== publicUrl) {
        deleteStorageMedia(oldUrl).catch((err) => console.warn('Old file cleanup notice:', err))
      }

      // Store optimization badge for UI display
      if (reviewMeta) {
        setOptimizationBadge({
          originalSize: reviewMeta.originalSize,
          optimizedSize: reviewMeta.optimizedSize,
          savedPercentage: reviewMeta.savedPercentage,
          wasOptimized: reviewMeta.wasOptimized,
        })

        if (reviewMeta.wasOptimized) {
          setSuccessMsg(
            isAr
              ? `تم تحسين الصورة ورفعها بنجاح! وفرت ${reviewMeta.savedPercentage}% (${formatBytes(
                  reviewMeta.originalSize
                )} ← ${formatBytes(reviewMeta.optimizedSize)})`
              : `Image optimized & uploaded! Saved ${reviewMeta.savedPercentage}% (${formatBytes(
                  reviewMeta.originalSize
                )} → ${formatBytes(reviewMeta.optimizedSize)})`
          )
        } else {
          setSuccessMsg(isAr ? 'تم رفع الصورة بنجاح!' : 'Image uploaded successfully!')
        }
      } else {
        setSuccessMsg(isAr ? 'تم رفع الملف بنجاح!' : 'File uploaded successfully!')
      }

      // Cleanup pending review
      if (reviewMeta?.previewUrl) {
        URL.revokeObjectURL(reviewMeta.previewUrl)
      }
      setPendingReview(null)

      setTimeout(() => setSuccessMsg(null), 4500)
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isUploading && !isOptimizing) {
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

    if (disabled || isUploading || isOptimizing) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelection(file)
    }
  }

  const handleDelete = async () => {
    if (disabled || isUploading || isOptimizing) return
    const currentUrl = effectiveValue
    setOptimizationBadge(null)
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
      : 'image/jpeg,image/png,image/webp,image/gif,image/jfif,image/svg+xml'

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
        disabled={disabled || isUploading || isOptimizing}
      />

      {/* 1. Review Modal / In-line Review Card for Optimized Image */}
      {pendingReview ? (
        <div className="relative rounded-2xl border border-[#B51D19]/40 bg-[#0E0E0E] p-3.5 overflow-hidden shadow-lg shadow-red-950/20 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1F1F1F]">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#E63B32]">
              <Sparkles className="w-4 h-4 text-[#E63B32]" />
              {isAr ? 'معاينة النسخة المُحسّنة قبل الرفع' : 'Review Optimized Image Before Upload'}
            </span>
            <span className="text-[11px] font-mono text-[#888]">
              {pendingReview.width > 0 && `${pendingReview.width} × ${pendingReview.height} px`}
            </span>
          </div>

          <div className="relative aspect-video sm:aspect-[16/9] w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-[#1C1C1C]">
            <img
              src={pendingReview.previewUrl}
              alt="Optimized preview"
              className="w-full h-full object-contain"
            />

            {/* Savings Badge on Image */}
            <div className="absolute top-2.5 start-2.5">
              {pendingReview.wasOptimized ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md shadow-sm">
                  <Check className="w-3 h-3" />
                  {isAr
                    ? `وفرت ${pendingReview.savedPercentage}% مساحة`
                    : `Saved ${pendingReview.savedPercentage}%`}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#1F1F1F]/80 text-[#B3B3B3] border border-[#333] backdrop-blur-md">
                  {isAr ? 'الحجم الأصلي الأمثل' : 'Optimal Original Size'}
                </span>
              )}
            </div>
          </div>

          {/* Size Comparison Bar */}
          <div className="mt-3 p-2.5 rounded-xl bg-[#141414] border border-[#222] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#777]">
                {isAr ? 'الأصلي:' : 'Original:'}{' '}
                <span className="line-through text-[#999]">{formatBytes(pendingReview.originalSize)}</span>
              </span>
              <span className="text-[#555]">→</span>
              <span className="font-semibold text-white">
                {isAr ? 'المُحسّن:' : 'Optimized:'}{' '}
                <span className="text-[#E63B32]">{formatBytes(pendingReview.optimizedSize)}</span>
              </span>
            </div>

            <span className="text-[11px] text-[#777] font-mono">
              WebP • 90% {isAr ? 'جودة فائقة' : 'High Fidelity'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-[#1C1C1C]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelReview}
              disabled={isUploading}
              icon={<X className="w-3.5 h-3.5" />}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmUpload}
              disabled={isUploading}
              icon={
                isUploading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )
              }
            >
              {isUploading
                ? isAr
                  ? 'جاري الرفع...'
                  : 'Uploading...'
                : isAr
                ? 'تأكيد ورفع الصورة'
                : 'Confirm & Upload'}
            </Button>
          </div>
        </div>
      ) : effectiveValue ? (
        /* 2. Uploaded Media Preview with Action Controls */
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
              <>
                <img
                  src={effectiveValue}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />

                {/* Optimization Badge on Uploaded Image */}
                {optimizationBadge?.wasOptimized && (
                  <div className="absolute top-2.5 start-2.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-950/40 text-[#E63B32] border border-[#B51D19]/30 backdrop-blur-md shadow-sm">
                      <Sparkles className="w-3 h-3 text-[#E63B32]" />
                      {isAr
                        ? `WebP • وفرت ${optimizationBadge.savedPercentage}%`
                        : `WebP • Saved ${optimizationBadge.savedPercentage}%`}
                    </span>
                  </div>
                )}
              </>
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
                disabled={disabled || isUploading || isOptimizing}
                icon={<RefreshCw className="w-3.5 h-3.5 text-[#E63B32]" />}
              >
                {isAr ? 'استبدال' : 'Replace'}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={disabled || isUploading || isOptimizing}
                icon={<X className="w-3.5 h-3.5" />}
              >
                {isAr ? 'حذف' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* 3. Empty / Drag & Drop Upload Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() =>
            !disabled && !isUploading && !isOptimizing && fileInputRef.current?.click()
          }
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[160px] ${
            isDragging
              ? 'border-[#B51D19] bg-[#B51D19]/10 scale-[1.01]'
              : 'border-[#262626] bg-[#0C0C0C] hover:border-[#383838] hover:bg-[#121212]'
          } ${disabled || isUploading || isOptimizing ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {isOptimizing ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full border-2 border-[#B51D19] border-t-transparent animate-spin" />
                <Sparkles className="w-4 h-4 text-[#E63B32] absolute inset-0 m-auto animate-pulse" />
              </div>
              <span className="text-xs font-semibold text-[#E63B32]">
                {isAr
                  ? 'جاري فحص وتحسين جودة الصورة بالمتصفح...'
                  : 'Optimizing image fidelity with WebP...'}
              </span>
              <span className="text-[10px] text-[#777]">
                {isAr
                  ? 'يتم تقليل الحجم دون فقدان الوضوح'
                  : 'Compressing file size while preserving high visual quality'}
              </span>
            </div>
          ) : isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#B51D19] border-t-transparent animate-spin" />
              <span className="text-xs font-semibold text-[#E63B32]">
                {isAr ? 'جاري الرفع إلى التخزين السحابي...' : 'Uploading to Supabase Storage...'}
              </span>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#161616] border border-[#242424] flex items-center justify-center text-[#E63B32] mb-3 group-hover:scale-105 transition-transform">
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
                  <span className="text-[#E63B32] underline underline-offset-2">
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
                      ? 'صور PNG أو JPG أو WebP (يتم تحسينها وضغطها تلقائياً)'
                      : 'PNG, JPG, or WebP images (automatically optimized with WebP)')}
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

