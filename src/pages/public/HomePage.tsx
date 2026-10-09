import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { SiteSettings } from '@/types/database'
import { HeroSection } from '@/features/hero/HeroSection'
import { WorksSection } from '@/features/works/WorksSection'
import { ClientsSection } from '@/features/clients/ClientsSection'
import { PagesSection } from '@/features/pages/PagesSection'
import { TestimonialsSection } from '@/features/testimonials/TestimonialsSection'
import { dataSync } from '@/services/dataSync'
import { useSEO } from '@/hooks/useSEO'

export const HomePage: React.FC = () => {
  useSEO()

  const [settings, setSettings] = useState<Partial<SiteSettings>>({
    hero_visible: true,
    clients_visible: true,
    pages_visible: true,
    works_visible: true,
    testimonials_visible: true,
    testimonials_cta_visible: true,
    testimonials_limit: 6,
    section_order: ['hero', 'works', 'clients', 'pages', 'testimonials'],
  })

  const loadSettings = async () => {
    try {
      const { data } = await supabase.from('site_settings').select('*').limit(1).single()
      if (data) {
        setSettings(data)
      }
    } catch (err) {
      console.error('Settings load err:', err)
    }
  }

  useEffect(() => {
    loadSettings()

    const unsub = dataSync.on('site_settings.updated', () => {
      loadSettings()
    })

    return () => {
      unsub()
    }
  }, [])

  const sectionMap: Record<string, React.ReactNode> = {
    hero: settings.hero_visible !== false ? <HeroSection key="hero" /> : null,
    works: settings.works_visible !== false ? <WorksSection key="works" /> : null,
    clients: settings.clients_visible !== false ? <ClientsSection key="clients" /> : null,
    pages: settings.pages_visible !== false ? <PagesSection key="pages" /> : null,
    testimonials:
      settings.testimonials_visible !== false ? (
        <TestimonialsSection
          key="testimonials"
          testimonials_cta_visible={settings.testimonials_cta_visible}
          testimonials_limit={settings.testimonials_limit}
        />
      ) : null,
  }

  const order = settings.section_order || ['hero', 'works', 'clients', 'pages', 'testimonials']

  return (
    <div className="flex flex-col">
      {order.map((key) => sectionMap[key])}
    </div>
  )
}
