import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Client } from '@/types/database'
import { Badge } from '@/components/ui/Badge'
import { dataSync } from '@/services/dataSync'

export const ClientsSection: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const loadClients = async () => {
    try {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order', { ascending: true })
      if (data) setClients(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()

    const unsub = dataSync.on('clients.updated', () => loadClients())
    return () => unsub()
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-2xl bg-[#0B0B0B] border border-[#242424] space-y-4 animate-pulse">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#181818]" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-[#1F1F1F] rounded w-2/3" />
                    <div className="h-3 bg-[#181818] rounded w-1/3" />
                  </div>
                </div>
                <div className="h-3 bg-[#181818] rounded w-full" />
                <div className="h-3 bg-[#181818] rounded w-4/5" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((c) => (
              <div
                key={c.id}
                className="p-6 rounded-2xl bg-[#0B0B0B] border border-[#242424] hover:border-[#8B5CF6]/40 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60 group"
              >
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-center text-[#8B5CF6] group-hover:scale-105 transition-transform overflow-hidden flex-shrink-0">
                      {c.logo_url ? (
                        <img src={c.logo_url} alt={isAr ? c.name_ar : c.name_en} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">
                        {isAr ? c.name_ar : (c.name_en || c.name_ar)}
                      </h3>
                      <span className="text-xs text-[#8B5CF6] font-medium block">
                        {isAr ? c.profession_ar : (c.profession_en || c.profession_ar)}
                      </span>
                    </div>
                  </div>

                  {((isAr ? c.description_ar : c.description_en) || c.description_ar || c.description_en) && (
                    <p className="text-xs text-[#9B9B9B] leading-relaxed line-clamp-3">
                      {isAr ? c.description_ar || c.description_en : c.description_en || c.description_ar}
                    </p>
                  )}

                  {/* Work Done with Client */}
                  {((isAr ? c.work_description_ar || c.work_description_en : c.work_description_en || c.work_description_ar)) && (
                    <div className="mt-4 pt-3 border-t border-[#1C1C1C]">
                      <span className="text-[11px] font-semibold text-[#A78BFA] uppercase tracking-wider block mb-1">
                        {isAr ? 'الأعمال والخدمات المنفذة' : 'What We Delivered'}
                      </span>
                      <p className="text-xs text-[#E5E5E5] leading-relaxed whitespace-pre-line">
                        {isAr ? c.work_description_ar || c.work_description_en : c.work_description_en || c.work_description_ar}
                      </p>
                    </div>
                  )}
                </div>

                {(c.website_url || c.project_url) && (
                  <div className="mt-5 pt-3 border-t border-[#1C1C1C]">
                    <a
                      href={c.website_url || c.project_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-[#8B5CF6] hover:text-[#A78BFA] flex items-center gap-1.5"
                    >
                      <span>{t('clients.view_project')}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
