import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Film, ArrowUpRight, ImageIcon, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Work, Category } from '@/types/database'
import { WorkModal } from './WorkModal'
import { dataSync } from '@/services/dataSync'
import { isYouTubeUrl, getYouTubeThumbnailUrl, getYouTubeCardPreviewUrl } from '@/lib/youtube'


// ── Module-level single-playback registry ──────────────────────────
// Ensures only one card video plays at a time, across all WorkCardItem instances.

type PauseCallback = () => void
let _activeCardId: string | null = null
let _activePause: PauseCallback | null = null

function claimPlayback(cardId: string, pause: PauseCallback): void {
  if (_activeCardId && _activeCardId !== cardId && _activePause) {
    _activePause()
  }
  _activeCardId = cardId
  _activePause = pause
}

function releasePlayback(cardId: string): void {
  if (_activeCardId === cardId) {
    _activeCardId = null
    _activePause = null
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// ── WorksSection ───────────────────────────────────────────────────

export const WorksSection: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  const [works, setWorks] = useState<Work[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [activeModalWork, setActiveModalWork] = useState<Work | null>(null)

  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [{ data: worksData }, { data: catsData }] = await Promise.all([
        supabase.from('works').select('*, category:categories(*)').eq('is_visible', true).order('sort_order', { ascending: true }),
        supabase.from('categories').select('*').eq('is_visible', true).order('sort_order', { ascending: true }),
      ])

      if (worksData) setWorks(worksData)
      if (catsData) setCategories(catsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    const unsubWorks = dataSync.on('works.updated', () => loadData())
    const unsubCats = dataSync.on('categories.updated', () => loadData())

    return () => {
      unsubWorks()
      unsubCats()
    }
  }, [])

  const filteredWorks =
    selectedCategory === 'all'
      ? works
      : works.filter((w) => w.category_id === selectedCategory)

  // Modal isolation: pause all card playback when modal opens
  const handleOpenModal = useCallback((work: Work) => {
    // Pause any card that is currently playing
    if (_activePause) {
      _activePause()
    }
    _activeCardId = null
    _activePause = null
    setActiveModalWork(work)
  }, [])

  return (
    <section id="works" className="py-24 relative bg-transparent overflow-hidden">
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-[#B51D19]/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3 text-[#F5F5F5]">
            {isAr ? 'أهم الأعمال' : 'Featured Works'}
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#B51D19] to-[#E63B32] mx-auto rounded-full mb-3" />
          <p className="text-xs sm:text-sm text-[#9B9B9B]">
            {isAr
              ? 'صور — فيديوهات — مستندات (اضغط على أي عمل لعرضه)'
              : 'Images — Videos — Documents (Click any work to view in fullscreen)'}
          </p>
        </div>

        {categories.length > 0 && (
          <div className="w-full mb-12 overflow-x-auto no-scrollbar pb-2">
            <div className="flex items-center justify-start md:justify-center gap-2 min-w-max px-1 md:px-0">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                  selectedCategory === 'all'
                    ? 'bg-[#B51D19]/15 text-[#E63B32] border border-[#B51D19]/40 shadow-lg shadow-[#B51D19]/10'
                    : 'bg-[#0E0E0E] text-[#9B9B9B] border border-[#222] hover:text-white hover:bg-[#181818]'
                }`}
              >
                {t('works.all')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                    selectedCategory === cat.id
                      ? 'bg-[#B51D19]/15 text-[#E63B32] border border-[#B51D19]/40 shadow-lg shadow-[#B51D19]/10'
                      : 'bg-[#0E0E0E] text-[#9B9B9B] border border-[#222] hover:text-white hover:bg-[#181818]'
                  }`}
                >
                  {isAr ? cat.name_ar : cat.name_en}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && works.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-[#0B0B0B] border border-[#242424] overflow-hidden p-0 animate-pulse">
                <div className="aspect-video bg-[#141414]" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-[#1F1F1F] rounded w-2/3" />
                  <div className="h-3 bg-[#181818] rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredWorks.map((work) => (
              <WorkCardItem
                key={work.id}
                work={work}
                isAr={isAr}
                modalOpen={activeModalWork !== null}
                onClick={() => handleOpenModal(work)}
              />
            ))}
          </div>
        )}
      </div>

      <WorkModal
        work={activeModalWork}
        onClose={() => setActiveModalWork(null)}
        isAr={isAr}
      />
    </section>
  )
}

// ── WorkCardItem ───────────────────────────────────────────────────

interface WorkCardProps {
  work: Work
  isAr: boolean
  modalOpen: boolean
  onClick: () => void
}

const WorkCardItem: React.FC<WorkCardProps> = ({ work, isAr, modalOpen, onClick }) => {
  const isVideo = work.media_type === 'video'
  const isYouTube = isVideo && isYouTubeUrl(work.media_url)
  const isSelfHosted = isVideo && !isYouTube

  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const ytIframeRef = useRef<HTMLIFrameElement>(null)

  const thumbnailUrl = work.thumbnail_url || (isYouTube ? getYouTubeThumbnailUrl(work.media_url) : undefined) || undefined
  const hasThumbnail = Boolean(thumbnailUrl)

  // Mount immediately if no thumbnail is provided so the first frame renders, otherwise lazy-load
  const [isNearView, setIsNearView] = useState(!hasThumbnail)
  // Whether the card video is actively playing
  const [isCardPlaying, setIsCardPlaying] = useState(false)
  // Whether the YouTube iframe is mounted (only mount on trigger)
  const [ytMounted, setYtMounted] = useState(false)

  // ── Lazy loading: mount video element when approaching viewport ──
  useEffect(() => {
    if (isNearView || !containerRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsNearView(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: '300px' }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [isNearView])

  // ── Pause callback (used by single-playback registry) ──
  const pauseCard = useCallback(() => {
    if (isSelfHosted && videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0.001
    }
    if (isYouTube) {
      setYtMounted(false)
    }
    setIsCardPlaying(false)
  }, [isSelfHosted, isYouTube])

  // ── Start playback ──
  const startCardPlayback = useCallback(() => {
    if (modalOpen) return

    // Claim single playback
    claimPlayback(work.id, pauseCard)

    if (isSelfHosted && videoRef.current) {
      videoRef.current
        .play()
        .then(() => setIsCardPlaying(true))
        .catch(() => {
          // Browser blocked autoplay — keep thumbnail
        })
    }

    if (isYouTube) {
      setYtMounted(true)
      setIsCardPlaying(true)
    }
  }, [work.id, isSelfHosted, isYouTube, modalOpen, pauseCard])

  // ── Stop playback ──
  const stopCardPlayback = useCallback(() => {
    pauseCard()
    releasePlayback(work.id)
  }, [work.id, pauseCard])

  // ── Modal isolation: pause when modal opens ──
  useEffect(() => {
    if (modalOpen && isCardPlaying) {
      stopCardPlayback()
    }
  }, [modalOpen])

  // ── Desktop hover handlers ──
  const handleMouseEnter = useCallback(() => {
    if (!isVideo || isTouchDevice() || modalOpen) return
    // Ensure the video element is ready
    setIsNearView(true)
    // Small delay to allow video element to mount if not yet
    if (isSelfHosted) {
      // If videoRef isn't ready yet (just set isNearView), wait a tick
      requestAnimationFrame(() => {
        startCardPlayback()
      })
    } else {
      startCardPlayback()
    }
  }, [isVideo, isSelfHosted, modalOpen, startCardPlayback])

  const handleMouseLeave = useCallback(() => {
    if (!isVideo || isTouchDevice()) return
    stopCardPlayback()
  }, [isVideo, stopCardPlayback])

  // ── Mobile viewport autoplay via IntersectionObserver ──
  useEffect(() => {
    if (!isVideo || !isNearView || !containerRef.current) return

    const isTouch = isTouchDevice()
    if (!isTouch) return

    const el = containerRef.current

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (modalOpen) return

          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            startCardPlayback()
          } else if (!entry.isIntersecting || entry.intersectionRatio < 0.35) {
            stopCardPlayback()
          }
        })
      },
      { threshold: [0, 0.35, 0.5] }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [isVideo, isNearView, modalOpen, startCardPlayback, stopCardPlayback])

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group cursor-pointer rounded-2xl bg-[#0B0B0B] border border-[#242424] hover:border-rose-500/40 overflow-hidden transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-950/20"
    >
      <div className="relative aspect-video bg-[#121212] overflow-hidden">
        {isVideo ? (
          isYouTube ? (
            <YouTubeCardMedia
              work={work}
              isAr={isAr}
              isCardPlaying={isCardPlaying}
              ytMounted={ytMounted}
              ytIframeRef={ytIframeRef}
              thumbnailUrl={thumbnailUrl}
            />
          ) : (
            <SelfHostedCardMedia
              work={work}
              isAr={isAr}
              isNearView={isNearView}
              isCardPlaying={isCardPlaying}
              videoRef={videoRef}
              thumbnailUrl={thumbnailUrl}
            />
          )
        ) : work.media_type === 'document' ? (
          <DocumentCardMedia work={work} isAr={isAr} />
        ) : (
          <ImageCardMedia work={work} isAr={isAr} />
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#F5F5F5] group-hover:text-rose-400 transition-colors">
            {isAr ? work.title_ar : work.title_en}
          </h3>
          <p className="text-xs text-[#9B9B9B] mt-1.5 line-clamp-2 leading-relaxed">
            {isAr ? work.description_ar : work.description_en}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#1C1C1C] flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-400 group-hover:text-rose-300 flex items-center gap-1 transition-colors">
            <span>{isAr ? 'اضغط للعرض' : 'Click to view'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>

          {work.category && (
            <span className="text-[10px] text-[#777] font-medium">
              {isAr ? work.category.name_ar : work.category.name_en}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Self-Hosted Video Card Media ───────────────────────────────────

interface SelfHostedCardMediaProps {
  work: Work
  isAr: boolean
  isNearView: boolean
  isCardPlaying: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
  thumbnailUrl: string | undefined
}

const SelfHostedCardMedia: React.FC<SelfHostedCardMediaProps> = ({
  work,
  isAr,
  isNearView,
  isCardPlaying,
  videoRef,
  thumbnailUrl,
}) => {
  const hasThumbnail = Boolean(thumbnailUrl)
  const videoSrc = work.media_url.includes('#') ? work.media_url : `${work.media_url}#t=0.001`

  return (
    <>
      {/* Base thumbnail layer — only rendered when thumbnail exists */}
      {hasThumbnail && (
        <img
          src={thumbnailUrl}
          alt={isAr ? work.title_ar : work.title_en}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}

      {/* Video layer — mounted when near viewport (or immediately if no thumbnail) */}
      {(isNearView || !hasThumbnail) && (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={thumbnailUrl}
          muted
          playsInline
          loop
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          tabIndex={-1}
          onLoadedData={(e) => {
            const v = e.currentTarget
            if (v.currentTime === 0) {
              v.currentTime = 0.001
            }
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none ${
            !hasThumbnail || isCardPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Video badge — disappears on hover and when playing */}
      <div
        className={`absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-amber-300 border border-amber-500/30 flex items-center gap-1 z-10 transition-all duration-300 group-hover:opacity-0 group-hover:pointer-events-none ${
          isCardPlaying ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <Film className="w-3 h-3" />
        <span>{isAr ? 'فيديو' : 'Video'}</span>
      </div>
    </>
  )
}

// ── YouTube Video Card Media ───────────────────────────────────────

interface YouTubeCardMediaProps {
  work: Work
  isAr: boolean
  isCardPlaying: boolean
  ytMounted: boolean
  ytIframeRef: React.RefObject<HTMLIFrameElement | null>
  thumbnailUrl: string | undefined
}

const YouTubeCardMedia: React.FC<YouTubeCardMediaProps> = ({
  work,
  isAr,
  isCardPlaying,
  ytMounted,
  ytIframeRef,
  thumbnailUrl,
}) => {
  const previewUrl = getYouTubeCardPreviewUrl(work.media_url)
  const hasThumbnail = Boolean(thumbnailUrl)

  return (
    <>
      {/* Base thumbnail layer — only rendered if thumbnail exists */}
      {hasThumbnail && (
        <img
          src={thumbnailUrl}
          alt={isAr ? work.title_ar : work.title_en}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}

      {/* YouTube iframe layer — mounted when triggered, cropped to hide title/share arrows/controls */}
      {ytMounted && previewUrl && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <iframe
            ref={ytIframeRef}
            src={previewUrl}
            title={isAr ? work.title_ar : work.title_en}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] max-w-none border-0 transition-opacity duration-500 pointer-events-none ${
              isCardPlaying ? 'opacity-100' : 'opacity-0'
            }`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            loading="lazy"
          />
        </div>
      )}

      {/* Video badge — disappears on hover and when playing */}
      <div
        className={`absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-amber-300 border border-amber-500/30 flex items-center gap-1 z-10 transition-all duration-300 group-hover:opacity-0 group-hover:pointer-events-none ${
          isCardPlaying ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <Film className="w-3 h-3" />
        <span>{isAr ? 'فيديو' : 'Video'}</span>
      </div>
    </>
  )
}

// ── Document Card Media ────────────────────────────────────────────

const DocumentCardMedia: React.FC<{ work: Work; isAr: boolean }> = ({ work, isAr }) => (
  <div className="w-full h-full bg-gradient-to-br from-[#181818] to-[#0E0E0E] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
    {work.thumbnail_url ? (
      <img
        src={work.thumbnail_url}
        alt={work.title_ar}
        className="w-full h-full object-cover absolute inset-0 opacity-40"
      />
    ) : null}
    <div className="relative z-10 w-12 h-12 rounded-2xl bg-[#202020] border border-[#333] flex items-center justify-center text-[#38BDF8] mb-2 shadow-xl">
      <FileText className="w-6 h-6" />
    </div>
    <span className="relative z-10 text-xs font-semibold text-white/90 max-w-[200px] truncate px-2">
      {isAr ? 'مستند رقمي' : 'Digital Document'}
    </span>
    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-sky-400 border border-sky-500/30 flex items-center gap-1 z-20 transition-opacity duration-300 group-hover:opacity-0">
      <FileText className="w-3 h-3" />
      <span>{isAr ? 'مستند' : 'Document'}</span>
    </div>
  </div>
)

// ── Image Card Media ───────────────────────────────────────────────

const ImageCardMedia: React.FC<{ work: Work; isAr: boolean }> = ({ work, isAr }) => (
  <>
    <img
      src={work.thumbnail_url || work.media_url}
      alt={work.title_ar}
      loading="lazy"
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-rose-300 border border-rose-500/30 flex items-center gap-1 z-10 transition-opacity duration-300 group-hover:opacity-0">
      <ImageIcon className="w-3 h-3" />
      <span>{isAr ? 'صورة' : 'Image'}</span>
    </div>
  </>
)
