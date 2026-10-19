import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { dataSync } from '@/services/dataSync'
import { useSocialLinks } from '@/hooks/useSocialLinks'
import { renderPlatformIcon } from '@/components/shared/EntityLinksEditor'
import { Skeleton } from '@/components/ui/Skeleton'

export const HeroSection: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')
  const { heroLinks, loading: linksLoading } = useSocialLinks()

  const [profile, setProfile] = useState<Profile>({
    id: 'default',
    full_name_ar: 'Habib AL-Rahman',
    full_name_en: 'Habib AL-Rahman',
    title_ar: 'خبير التسويق الرقمي وبناء العلامات التجارية',
    title_en: 'Generative AI & Digital Marketing Specialist',
    bio_ar:
      'Founder & CEO at Seven B | Generative AI & Digital Marketing Specialist | Media Buying | AI Video • Creative Ads • Automation | Arabic Tutor for non-native speakers',
    bio_en:
      'Founder & CEO at Seven B | Generative AI & Digital Marketing Specialist | Media Buying | AI Video • Creative Ads • Automation | Arabic Tutor for non-native speakers',
    avatar_url: null,
    clients_count: 50,
    projects_count: 100,
    experience_years: 5,
    primary_website_url: null,
  })

  const [loading, setLoading] = useState(true)

  // Live count-up animation state
  const [displayProjects, setDisplayProjects] = useState(0)
  const [displayClients, setDisplayClients] = useState(0)
  const [displayYears, setDisplayYears] = useState(0)

  const loadProfile = async () => {
    try {
      const { data } = await supabase.from('profiles').select('*').limit(1).single()
      if (data) {
        setProfile(data)
      }
    } catch (e) {
      console.error('Profile fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()

    const unsubProfile = dataSync.on('profile.updated', () => loadProfile())

    return () => {
      unsubProfile()
    }
  }, [])

  // Count up timer
  useEffect(() => {
    const targetProjects = profile.projects_count || 100
    const targetClients = profile.clients_count || 50
    const targetYears = profile.experience_years || 5

    let p = 0,
      c = 0,
      y = 0
    const interval = setInterval(() => {
      if (p < targetProjects) p += Math.ceil(targetProjects / 25)
      if (c < targetClients) c += Math.ceil(targetClients / 25)
      if (y < targetYears) y += 1

      setDisplayProjects(Math.min(p, targetProjects))
      setDisplayClients(Math.min(c, targetClients))
      setDisplayYears(Math.min(y, targetYears))

      if (p >= targetProjects && c >= targetClients && y >= targetYears) {
        clearInterval(interval)
      }
    }, 40)

    return () => clearInterval(interval)
  }, [profile])

  return (
    <section
      id="hero"
      className="relative min-h-[90vh] flex items-center justify-center pt-12 pb-20 overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-[#B51D19]/15 via-[#B51D19]/5 to-[#080707]/20 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute -top-10 left-10 w-72 h-72 bg-[#B51D19]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center flex flex-col items-center">
        {/* Profile Avatar with Glowing Halo Ring */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-2 rounded-full hero-glow-animated opacity-70 blur-md group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full p-[5px] hero-border-animated">
            <div className="w-full h-full rounded-full overflow-hidden bg-[#0A0A0A] flex items-center justify-center relative">
              {loading && !profile.avatar_url ? (
                <Skeleton variant="circular" className="w-full h-full" />
              ) : profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name_en}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#121212] via-[#0D0D0D] to-[#181818] flex items-center justify-center relative">
                  <span className="text-4xl sm:text-5xl font-black gradient-name">
                    HR
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Name Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight mb-3">
          <span className="gradient-name">
            {isAr ? profile.full_name_ar : profile.full_name_en}
          </span>
        </h1>

        {/* Subtitle / Job Title */}
        <h2 className="text-base sm:text-xl font-bold text-[#D4D4D4] mb-5 max-w-2xl">
          {isAr ? profile.title_ar : profile.title_en}
        </h2>

        {/* Bio / Description */}
        <p className="text-xs sm:text-sm md:text-base text-[#A3A3A3] max-w-3xl leading-relaxed mb-8 px-2 font-normal">
          {isAr ? profile.bio_ar : profile.bio_en}
        </p>

        {/* Dynamic Social Links Bar (Powered by useSocialLinks) */}
        {linksLoading ? (
          <div className="flex items-center justify-center gap-3 mb-10 flex-wrap">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-11 h-11 rounded-2xl bg-[#0F0F0F] border border-[#242424] animate-pulse"
              />
            ))}
          </div>
        ) : heroLinks.length > 0 ? (
          <div className="flex items-center justify-center gap-3 mb-10 flex-wrap">
            {heroLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="w-11 h-11 rounded-2xl bg-[#0F0F0F] border border-[#242424] hover:border-[#B51D19]/60 hover:bg-[#B51D19]/15 flex items-center justify-center text-[#9B9B9B] hover:text-[#E63B32] transition-all duration-300 shadow-lg shadow-black/40"
                aria-label={link.platform}
                title={isAr ? link.label_ar || link.platform : link.label_en || link.platform}
              >
                {renderPlatformIcon(link.icon || link.platform)}
              </a>
            ))}
          </div>
        ) : null}

        {/* Live Animated Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full max-w-xl mb-10">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0A0A0A] border border-[#202020] hover:border-[#B51D19]/40 transition-all duration-300 flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] tracking-tight">
              {displayProjects}+
            </span>
            <span className="text-[11px] sm:text-xs text-[#8A8A8A] mt-1 font-medium">
              {isAr ? 'مشروع منفذ' : 'Executed Projects'}
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#0A0A0A] border border-[#202020] hover:border-[#B51D19]/40 transition-all duration-300 flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] tracking-tight">
              {displayClients}+
            </span>
            <span className="text-[11px] sm:text-xs text-[#8A8A8A] mt-1 font-medium">
              {isAr ? 'عميل وبراند' : 'Clients & Brands'}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-4 sm:p-5 rounded-2xl bg-[#0A0A0A] border border-[#202020] hover:border-[#B51D19]/40 transition-all duration-300 flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] tracking-tight">
              {displayYears}+
            </span>
            <span className="text-[11px] sm:text-xs text-[#8A8A8A] mt-1 font-medium">
              {isAr ? 'سنوات خبرة' : 'Years Experience'}
            </span>
          </div>
        </div>

        {/* Hero Action CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a href="#works">
            <Button
              variant="primary"
              size="lg"
              icon={<ArrowUpRight className="w-4 h-4" />}
              className="px-8"
            >
              {t('hero.cta_primary')}
            </Button>
          </a>
          <a href="#pages">
            <Button variant="secondary" size="lg" className="px-8">
              {isAr ? 'استكشف Habib AI' : 'Explore Habib AI'}
            </Button>
          </a>
        </div>
      </div>
    </section>
  )
}
