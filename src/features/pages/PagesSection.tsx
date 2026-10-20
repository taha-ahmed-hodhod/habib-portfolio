import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PortfolioPage, SocialLink } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { renderPlatformIcon } from '@/components/shared/EntityLinksEditor'
import { getAllPageLinks } from '@/services/linksService'
import { dataSync } from '@/services/dataSync'

export const PagesSection: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  const [pages, setPages] = useState<PortfolioPage[]>([])
  const [pageLinksMap, setPageLinksMap] = useState<Record<string, SocialLink[]>>({})
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [pagesRes, linksRes] = await Promise.all([
        supabase
          .from('portfolio_pages')
          .select('*')
          .eq('is_visible', true)
          .order('sort_order', { ascending: true }),
        getAllPageLinks(),
      ])

      if (pagesRes.data) {
        setPages(pagesRes.data)
      }
      setPageLinksMap(linksRes)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    const unsubPages = dataSync.on('pages.updated', () => loadData())
    const unsubLinks = dataSync.on('links.updated', () => loadData())
    return () => {
      unsubPages()
      unsubLinks()
    }
  }, [])

  return (
    <section id="pages" className="py-24 relative overflow-hidden bg-transparent border-t border-[#141414]/60">
      {/* Background ambient light */}
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-[#B51D19]/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="accent" className="mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'العلامات والمنصات التابعة' : 'Sub-Brands & Platforms'}</span>
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-[#F5F5F5] tracking-tight">
            {t('pages.title')}
          </h2>
          <p className="text-sm text-[#9B9B9B] mt-2">{t('pages.subtitle')}</p>
        </div>

        {/* Loading state */}
        {loading && pages.length === 0 ? (
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl w-full">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-3xl p-8 bg-[#101010] border border-[#242424] animate-pulse flex flex-col items-center space-y-4"
                >
                  <div className="w-28 h-28 rounded-3xl bg-[#1C1C1C]" />
                  <div className="h-4 bg-[#1F1F1F] rounded w-1/2 mt-2" />
                  <div className="h-3 bg-[#181818] rounded w-1/3" />
                  <div className="h-12 bg-[#181818] rounded w-full mt-4" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Cards Grid */
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl w-full">
              {pages.map((p) => {
                const links = pageLinksMap[p.id] || []
                return (
                  <div
                    key={p.id}
                    className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-[#101010] to-[#0A0A0A] border border-[#242424] hover:border-[#B51D19]/50 shadow-2xl transition-all duration-300 flex flex-col items-center text-center group"
                  >
                    {/* Brand Avatar */}
                    <div className="w-28 h-28 rounded-3xl overflow-hidden mb-6 p-[2px] bg-[#E63B32] shadow-xl">
                      <div className="w-full h-full bg-[#121212] rounded-[22px] flex items-center justify-center overflow-hidden">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name_ar} loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] flex items-center justify-center font-black text-2xl text-[#E63B32]">
                            AI
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-black text-white tracking-tight mb-1">
                      {isAr ? p.name_ar : (p.name_en || p.name_ar)}
                    </h3>

                    {/* Subtitle */}
                    {(p.specialization_ar || p.specialization_en) && (
                      <p className="text-xs font-semibold text-[#E63B32] mb-4">
                        {isAr ? p.specialization_ar : (p.specialization_en || p.specialization_ar)}
                      </p>
                    )}

                    {/* Bullets / Description */}
                    {(p.description_ar || p.description_en) && (
                      <div className="text-xs text-[#A3A3A3] leading-relaxed whitespace-pre-line mb-6 max-w-xs">
                        {isAr ? p.description_ar : (p.description_en || p.description_ar)}
                      </div>
                    )}

                    {/* Dynamic Links Row */}
                    {links.length > 0 && (
                      <div className="flex items-center justify-center flex-wrap gap-2.5 mb-8">
                        {links.map((link) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            title={(isAr ? link.label_ar : link.label_en) || undefined}
                            className="w-9 h-9 rounded-xl bg-[#141414] border border-[#242424] flex items-center justify-center text-white hover:border-[#B51D19] hover:text-[#E63B32] transition-all hover:scale-105"
                          >
                            {renderPlatformIcon(link.icon || link.platform || link.label_en)}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Visit Button with Gradient — Fixed Directional Arrow Beside Text */}
                    {p.primary_url && (
                      <a
                        href={p.primary_url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full mt-auto block"
                      >
                        <Button
                          variant="gradient"
                          size="md"
                          className="w-full rounded-2xl font-bold text-sm"
                        >
                          <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                            <span>{isAr ? 'زيارة الصفحة' : 'Visit Page'}</span>
                            {isAr ? (
                              <ArrowLeft className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-1" />
                            ) : (
                              <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
                            )}
                          </span>
                        </Button>
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
