import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Client, SocialLink } from '@/types/database'
import { Badge } from '@/components/ui/Badge'
import { dataSync } from '@/services/dataSync'
import { renderPlatformIcon } from '@/components/shared/EntityLinksEditor'
import { getAllClientLinks } from '@/services/linksService'

export const ClientsSection: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  const [clients, setClients] = useState<Client[]>([])
  const [clientLinksMap, setClientLinksMap] = useState<Record<string, SocialLink[]>>({})
  const [loading, setLoading] = useState(true)

  const loadClients = async () => {
    try {
      const [clientsRes, linksRes] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .eq('is_visible', true)
          .order('sort_order', { ascending: true }),
        getAllClientLinks(),
      ])
      if (clientsRes.data) setClients(clientsRes.data)
      setClientLinksMap(linksRes)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()

    const unsubClients = dataSync.on('clients.updated', () => loadClients())
    const unsubLinks = dataSync.on('links.updated', () => loadClients())
    return () => {
      unsubClients()
      unsubLinks()
    }
  }, [])

  return (
    <section id="clients" className="py-24 relative bg-transparent border-t border-[#141414]/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="accent" className="mb-3">
            <span>{isAr ? 'شركاء النجاح' : 'Success Partners'}</span>
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-[#F5F5F5] tracking-tight">
            {t('clients.title')}
          </h2>
          <p className="text-sm text-[#9B9B9B] mt-2">{t('clients.subtitle')}</p>
        </div>

        {loading && clients.length === 0 ? (
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-2xl bg-[#0B0B0B] border border-[#242424] flex flex-col items-center text-center space-y-4 animate-pulse">
                  <div className="w-16 h-16 rounded-2xl bg-[#181818]" />
                  <div className="space-y-2 w-full flex flex-col items-center">
                    <div className="h-4 bg-[#1F1F1F] rounded w-2/3" />
                    <div className="h-3 bg-[#181818] rounded w-1/3" />
                  </div>
                  <div className="h-3 bg-[#181818] rounded w-full" />
                  <div className="h-3 bg-[#181818] rounded w-4/5" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
              {clients.map((c) => {
                const clientLinks = clientLinksMap[c.id] || []
                return (
                  <div
                    key={c.id}
                    className="p-6 rounded-2xl bg-[#0B0B0B] border border-[#242424] hover:border-[#B51D19]/40 transition-all duration-300 flex flex-col items-center text-center justify-between hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60 group w-full"
                  >
                    <div className="w-full flex flex-col items-center">
                      {/* Client Logo & Identity */}
                      <div className="flex flex-col items-center text-center mb-2">
                        <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-center text-[#E63B32] group-hover:scale-105 transition-transform overflow-hidden flex-shrink-0 mb-3 shadow-lg">
                          {c.logo_url ? (
                            <img src={c.logo_url} alt={isAr ? c.name_ar : c.name_en} loading="lazy" className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-7 h-7" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-white">
                            {isAr ? c.name_ar : (c.name_en || c.name_ar)}
                          </h3>
                          <span className="text-xs text-[#E63B32] font-medium block mt-0.5">
                            {isAr ? c.profession_ar : (c.profession_en || c.profession_ar)}
                          </span>
                        </div>
                      </div>

                      {((isAr ? c.description_ar : c.description_en) || c.description_ar || c.description_en) && (
                        <p className="text-xs text-[#9B9B9B] leading-relaxed line-clamp-3 text-center">
                          {isAr ? c.description_ar || c.description_en : c.description_en || c.description_ar}
                        </p>
                      )}

                      {/* Work Done with Client */}
                      {((isAr ? c.work_description_ar || c.work_description_en : c.work_description_en || c.work_description_ar)) && (
                        <div className="mt-4 pt-3 border-t border-[#1C1C1C] w-full text-center">
                          <span className="text-[11px] font-semibold text-[#E63B32] uppercase tracking-wider block mb-1">
                            {isAr ? 'الأعمال والخدمات المنفذة' : 'What We Delivered'}
                          </span>
                          <p className="text-xs text-[#E5E5E5] leading-relaxed whitespace-pre-line">
                            {isAr ? c.work_description_ar || c.work_description_en : c.work_description_en || c.work_description_ar}
                          </p>
                        </div>
                      )}

                      {/* Client Social Links */}
                      {clientLinks.length > 0 && (
                        <div className="flex items-center justify-center flex-wrap gap-2 mt-4 pt-3 border-t border-[#1C1C1C] w-full">
                          {clientLinks.map((link) => (
                            <a
                              key={link.id}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={(isAr ? link.label_ar : link.label_en) || link.platform || undefined}
                              className="w-8 h-8 rounded-lg bg-[#141414] border border-[#262626] flex items-center justify-center text-white hover:border-[#B51D19] hover:text-[#E63B32] transition-all hover:scale-105"
                            >
                              {renderPlatformIcon(link.icon || link.platform || link.label_en)}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {(c.website_url || c.project_url) && (
                      <div className="mt-5 pt-3 border-t border-[#1C1C1C] w-full flex justify-center">
                        <a
                          href={c.website_url || c.project_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-[#E63B32] hover:text-[#B51D19] flex items-center justify-center gap-1.5"
                        >
                          <span>{t('clients.view_project')}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
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
