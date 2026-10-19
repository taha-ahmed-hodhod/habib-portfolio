import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Film, ArrowUpRight, ImageIcon, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Work, Category } from '@/types/database'
import { WorkModal } from './WorkModal'
import { dataSync } from '@/services/dataSync'
import { isYouTubeUrl, getYouTubeThumbnailUrl, getYouTubeCardPreviewUrl } from '@/lib/youtube'

export const WorksSection: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  const [works, setWorks] = useState<Work[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [activeModalWork, setActiveModalWork] = useState<Work | null>(null)
  const [loading, setLoading] = useState(true)

  // Coordination states for single active card playback
  const [hoveredWorkId, setHoveredWorkId] = useState<string | null>(null)
  const [viewportWorkId, setViewportWorkId] = useState<string | null>(null)
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  const visibilityMapRef = useRef<Map<string, number>>(new Map())

  // Detect mobile / touch environment (pointer: coarse or screen <= 768px)
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return
      const isCoarse = window.matchMedia('(pointer: coarse)').matches
      const isSmallScreen = window.innerWidth <= 768
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      setIsMobileDevice((isCoarse && hasTouch) || isSmallScreen)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const loadData = async () => {
    try {
      const [{ data: worksData }, { data: catsData }] = await Promise.all([
        supabase
          .from('works')
          .select('*, category:categories(*)')
          .eq('is_visible', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('categories')
          .select('*')
          .eq('is_visible', true)
          .order('sort_order', { ascending: true }),
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

  // Viewport visibility callback for mobile devices
  const handleVisibilityChange = useCallback((workId: string, ratio: number) => {
    visibilityMapRef.current.set(workId, ratio)

    // Find the video card with the highest visibility ratio
    let bestId: string | null = null
    let maxRatio = 0

    for (const [id, r] of visibilityMapRef.current.entries()) {
      if (r > maxRatio) {
        maxRatio = r
        bestId = id
      }
    }

    setViewportWorkId((current) => {
      // Hysteresis: only start playing if at least 50% in viewport
      if (maxRatio >= 0.5 && bestId) {
        // If current card is still sufficiently visible (>= 0.35) and within 15% of best, keep it to avoid thrashing
        if (current && current !== bestId) {
          const currentRatio = visibilityMapRef.current.get(current) || 0
          if (currentRatio >= 0.35 && maxRatio - currentRatio < 0.15) {
            return current
          }
        }
        return bestId
      }

      // If current card dropped below 0.35, stop playback
      if (current) {
        const currentRatio = visibilityMapRef.current.get(current) || 0
        if (currentRatio < 0.35) {
          return null
        }
        return current
      }

      return null
    })
  }, [])

  const handleHoverStart = useCallback((id: string) => {
    setHoveredWorkId(id)
  }, [])

  const handleHoverEnd = useCallback((id: string) => {
    setHoveredWorkId((prev) => (prev === id ? null : prev))
  }, [])

  // Active playing card ID:
  // 1. If modal is open, completely suppress card autoplay.
  // 2. On desktop (mouse devices): ONLY hover triggers autoplay.
  // 3. On mobile (touch/small screens): hover has priority, otherwise the most visible video in viewport autoplays.
  const activePlayingId = activeModalWork
    ? null
    : isMobileDevice
    ? hoveredWorkId || viewportWorkId
    : hoveredWorkId

  const filteredWorks =
    selectedCategory === 'all'
      ? works
      : works.filter((w) => w.category_id === selectedCategory)

  return (
    <section id="works" className="py-24 relative bg-transparent overflow-hidden">
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-rose-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3">
            <span className="bg-gradient-to-r from-red-500 via-red-400 to-red-800 bg-clip-text text-transparent">
              {isAr ? 'أهم الأعمال' : 'Featured Works'}
            </span>
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-red-500 to-red-800 mx-auto rounded-full mb-3" />
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
                    ? 'bg-gradient-to-r from-red-500/20 to-red-900/20 text-red-300 border border-red-500/40 shadow-lg'
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
                      ? 'bg-gradient-to-r from-red-500/20 to-red-900/20 text-red-300 border border-red-500/40 shadow-lg'
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
                isActive={activePlayingId === work.id}
                onHoverStart={handleHoverStart}
                onHoverEnd={handleHoverEnd}
                onVisibilityChange={handleVisibilityChange}
                onClick={() => setActiveModalWork(work)}
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

interface WorkCardProps {
  work: Work
  isAr: boolean
  isActive: boolean
  onHoverStart: (id: string) => void
  onHoverEnd: (id: string) => void
  onVisibilityChange: (id: string, ratio: number) => void
  onClick: () => void
}

const WorkCardItem: React.FC<WorkCardProps> = ({
  work,
  isAr,
  isActive,
  onHoverStart,
  onHoverEnd,
  onVisibilityChange,
  onClick,
}) => {
  const isVideo = work.media_type === 'video'
  const isYouTube = isVideo && isYouTubeUrl(work.media_url)

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Track viewport visibility for mobile devices
  useEffect(() => {
    if (!isVideo || !containerRef.current) return

    const el = containerRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          onVisibilityChange(work.id, entry.intersectionRatio)
        })
      },
      {
        threshold: [0, 0.25, 0.35, 0.5, 0.75, 1.0],
      }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      onVisibilityChange(work.id, 0)
    }
  }, [isVideo, work.id, onVisibilityChange])

  // Instant playback control for self-hosted video
  useEffect(() => {
    if (!isVideo || isYouTube) return

    const video = videoRef.current
    if (!video) return

    if (isActive) {
      video.muted = true
      if (video.ended) {
        video.currentTime = 0
      }
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {})
      }
    } else {
      video.pause()
      video.currentTime = 0
    }
  }, [isActive, isVideo, isYouTube])

  // Instant Desktop Hover Triggers (Immediate 0ms response)
  const handleMouseEnter = () => {
    if (!isVideo) return
    onHoverStart(work.id)
  }

  const handleMouseLeave = () => {
    if (!isVideo) return
    onHoverEnd(work.id)
  }

  // Determine thumbnail URL
  const thumbnailUrl =
    work.thumbnail_url ||
    (isYouTube ? getYouTubeThumbnailUrl(work.media_url, 'hq') : undefined) ||
    undefined

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
          <>
            {/* Base Thumbnail (always present beneath video to prevent layout shifts or black flash) */}
            <img
              src={thumbnailUrl}
              alt={isAr ? work.title_ar : work.title_en}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Self-hosted video element: ALWAYS mounted with preload="metadata" for INSTANT (0ms) playback */}
            {!isYouTube && (
              <video
                ref={videoRef}
                src={work.media_url}
                muted
                playsInline
                loop
                preload="metadata"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'
                }`}
              />
            )}

            {/* Active YouTube preview iframe */}
            {isYouTube && isActive && (
              <iframe
                src={getYouTubeCardPreviewUrl(work.media_url) || undefined}
                title={isAr ? work.title_ar : work.title_en}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                tabIndex={-1}
                loading="eager"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none border-0 z-10"
              />
            )}



            {/* Consistent Video Type Badge */}
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-amber-300 border border-amber-500/30 flex items-center gap-1 z-30 pointer-events-none">
              <Film className="w-3 h-3" />
              <span>{isAr ? 'فيديو' : 'Video'}</span>
            </div>
          </>
        ) : work.media_type === 'document' ? (
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
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-sky-400 border border-sky-500/30 flex items-center gap-1 z-20">
              <FileText className="w-3 h-3" />
              <span>{isAr ? 'مستند' : 'Document'}</span>
            </div>
          </div>
        ) : (
          <>
            <img
              src={work.thumbnail_url || work.media_url}
              alt={work.title_ar}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-rose-300 border border-rose-500/30 flex items-center gap-1 z-10">
              <ImageIcon className="w-3 h-3" />
              <span>{isAr ? 'صورة' : 'Image'}</span>
            </div>
          </>
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

