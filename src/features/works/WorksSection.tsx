import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Film, ArrowUpRight, ImageIcon, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Work, Category } from '@/types/database'
import { WorkModal } from './WorkModal'
import { dataSync } from '@/services/dataSync'

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

  return (
    <section id="works" className="py-24 relative bg-transparent overflow-hidden">
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-rose-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3">
            <span className="bg-gradient-to-r from-amber-400 via-rose-500 to-[#8B5CF6] bg-clip-text text-transparent">
              {isAr ? 'أهم الأعمال' : 'Featured Works'}
            </span>
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-rose-500 mx-auto rounded-full mb-3" />
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
                    ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg'
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
                      ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg'
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
  onClick: () => void
}

const WorkCardItem: React.FC<WorkCardProps> = ({ work, isAr, onClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Mobile viewport auto-playback using IntersectionObserver
  useEffect(() => {
    if (work.media_type !== 'video' || !containerRef.current) return

    const isMobile = window.matchMedia('(max-width: 768px)').matches || ('ontouchstart' in window)
    if (!isMobile) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!videoRef.current) return
          if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
            videoRef.current
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => {})
          } else {
            videoRef.current.pause()
            setIsPlaying(false)
          }
        })
      },
      { threshold: [0, 0.4] }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [work.media_type, work.media_url])

  // Desktop hover playback
  const handleMouseEnter = () => {
    if (work.media_type === 'video' && videoRef.current) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {})
    }
  }

  const handleMouseLeave = () => {
    if (work.media_type === 'video' && videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group cursor-pointer rounded-2xl bg-[#0B0B0B] border border-[#242424] hover:border-rose-500/40 overflow-hidden transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-950/20"
    >
      <div className="relative aspect-video bg-[#121212] overflow-hidden">
        {work.media_type === 'video' ? (
          <>
            <video
              ref={videoRef}
              src={work.media_url}
              poster={work.thumbnail_url || undefined}
              muted
              playsInline
              loop
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-white/90 text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>
            )}
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-amber-300 border border-amber-500/30 flex items-center gap-1 z-10">
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
