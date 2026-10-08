import React, { useEffect } from 'react'
import { X, ExternalLink, FileText } from 'lucide-react'
import type { Work } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export interface WorkModalProps {
  work: Work | null
  onClose: () => void
  isAr: boolean
}

export const WorkModal: React.FC<WorkModalProps> = ({ work, onClose, isAr }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (work) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'auto'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [work, onClose])

  if (!work) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-[#0B0B0B] border border-[#242424] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close */}
        <div className="p-4 sm:p-5 border-b border-[#1A1A1A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="accent">
              {work.media_type === 'video'
                ? isAr ? 'فيديو سينمائي' : 'Cinematic Video'
                : work.media_type === 'document'
                ? isAr ? 'مستند رقمي' : 'Digital Document'
                : isAr ? 'صورة / تصميم' : 'Image / Design'}
            </Badge>
            <h3 className="font-bold text-base sm:text-lg text-white">
              {isAr ? work.title_ar : work.title_en}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#141414] border border-[#242424] flex items-center justify-center text-[#9B9B9B] hover:text-white hover:bg-[#202020] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Content */}
        <div className="relative bg-black flex items-center justify-center min-h-[300px] max-h-[60vh] overflow-hidden">
          {work.media_type === 'video' ? (
            <video
              src={work.media_url}
              poster={work.thumbnail_url || undefined}
              controls
              autoPlay
              playsInline
              className="w-full max-h-[60vh] object-contain"
            />
          ) : work.media_type === 'document' ? (
            <div className="flex flex-col items-center justify-center p-10 text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-[#151515] border border-[#282828] flex items-center justify-center text-[#38BDF8] shadow-2xl">
                <FileText className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-1">
                  {isAr ? work.title_ar : work.title_en}
                </h4>
                <p className="text-xs text-[#888]">
                  {isAr ? 'مستند رقمي مرفق' : 'Attached Digital Document'}
                </p>
              </div>
              <a
                href={work.media_url}
                target="_blank"
                rel="noreferrer"
                download
              >
                <Button variant="primary" size="md" icon={<ExternalLink className="w-4 h-4" />}>
                  {isAr ? 'فتح أو تحميل المستند' : 'Open or Download Document'}
                </Button>
              </a>
            </div>
          ) : (
            <img
              src={work.media_url}
              alt={work.title_ar}
              className="w-full max-h-[60vh] object-contain"
            />
          )}
        </div>

        {/* Details Footer */}
        <div className="p-5 sm:p-6 border-t border-[#1A1A1A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs sm:text-sm text-[#B3B3B3] leading-relaxed max-w-xl">
              {isAr ? work.description_ar : work.description_en}
            </p>
          </div>

          {work.project_url && (
            <a href={work.project_url} target="_blank" rel="noreferrer" className="shrink-0">
              <Button variant="primary" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                {isAr ? 'زيارة رابط المشروع' : 'View Project'}
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
