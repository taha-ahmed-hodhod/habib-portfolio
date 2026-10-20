import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Globe, Menu, X, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useProfile } from '@/hooks/useProfile'

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { profile } = useProfile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('ar') ? 'en' : 'ar'
    i18n.changeLanguage(nextLang)
  }

  const isAr = i18n.language.startsWith('ar')

  const navLinks = [
    { label: t('nav.home'), href: '/#hero' },
    { label: t('nav.works'), href: '/#works' },
    { label: t('nav.clients'), href: '/#clients' },
    { label: t('nav.pages'), href: '/#pages' },
    { label: t('nav.testimonials'), href: '/#testimonials' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/85 backdrop-blur-md border-b border-[#242424]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#B51D19] p-[1.5px] transition-transform duration-300 group-hover:scale-105 shrink-0 overflow-hidden">
            <div className="w-full h-full bg-[#0B0B0B] rounded-[10px] overflow-hidden flex items-center justify-center font-bold text-base sm:text-lg text-white">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name_en || 'Habib AL-Rahman'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>H</span>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm sm:text-base tracking-tight gradient-name whitespace-nowrap">
              Habib AL-Rahman
            </span>
            <span className="text-[10px] sm:text-[11px] text-[#9B9B9B] hidden sm:block whitespace-nowrap">
              {isAr ? 'خبير الذكاء الاصطناعي والتسويق' : 'AI Video & Marketing'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links (Visible on lg screens >= 1024px to prevent overflow) */}
        {!isDashboard && (
          <nav className="hidden lg:flex items-center gap-1 bg-[#101010]/90 border border-[#242424] rounded-full px-3 py-1 shadow-inner shrink-0">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-xs xl:text-sm text-[#9B9B9B] hover:text-[#F5F5F5] rounded-full hover:bg-[#1A1A1A] transition-all duration-200 whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        {/* Desktop Action Controls (Visible on lg screens >= 1024px) */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#242424] bg-[#0E0E0E] hover:bg-[#181818] text-xs font-semibold text-[#9B9B9B] hover:text-[#F5F5F5] transition-all shrink-0"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#E63B32]" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>

          <Link to="/dashboard" className="shrink-0">
            <Button variant="secondary" size="sm" icon={<ArrowUpRight className="w-3.5 h-3.5 text-[#E63B32]" />}>
              {t('nav.dashboard')}
            </Button>
          </Link>
        </div>

        {/* Mobile & Tablet Controls (Visible on screens < 1024px) */}
        <div className="flex lg:hidden items-center gap-2 shrink-0">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#242424] bg-[#0E0E0E] text-xs font-semibold text-[#9B9B9B] hover:text-white transition-colors"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#E63B32]" />
            <span>{isAr ? 'EN' : 'عربي'}</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#9B9B9B] hover:text-white rounded-lg border border-[#242424] bg-[#0E0E0E] transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-[#242424] px-4 py-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xl">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-sm font-medium text-[#9B9B9B] hover:text-white hover:bg-[#151515] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-3 border-t border-[#202020]">
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block w-full">
              <Button variant="primary" size="md" className="w-full justify-center" icon={<ArrowUpRight className="w-4 h-4" />}>
                {t('nav.dashboard')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
