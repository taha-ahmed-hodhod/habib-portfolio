import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSocialLinks } from '@/hooks/useSocialLinks'
import { renderPlatformIcon } from '@/components/shared/EntityLinksEditor'

export const Footer: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')
  const { footerLinks, loading: linksLoading } = useSocialLinks()

  return (
    <footer className="border-t border-[#242424]/60 bg-[#050505]/75 backdrop-blur-sm text-[#9B9B9B] py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-start">
          {/* Brand Info */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <h3 className="text-xl font-bold tracking-tight">
              <span className="gradient-name">Habib AL-Rahman</span>
            </h3>
            <p className="text-sm text-[#9B9B9B] max-w-sm">
              {isAr
                ? 'خبير التسويق الرقمي وبناء العلامات التجارية وإنتاج فيديوهات الذكاء الاصطناعي السينمائية.'
                : 'Digital marketing strategist, AI video creator, and creative brand consultant.'}
            </p>
          </div>

          {/* Social Icons */}
          <div className="flex flex-col items-center md:items-end gap-3">
            {/* Dynamic Social Icons */}
            {linksLoading ? (
              <div className="flex items-center gap-3 flex-wrap justify-center md:justify-end">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-xl bg-[#0F0F0F] border border-[#242424] animate-pulse"
                  />
                ))}
              </div>
            ) : footerLinks.length > 0 ? (
              <div className="flex items-center gap-3 flex-wrap justify-center md:justify-end">
                {footerLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.platform}
                    title={isAr ? link.label_ar || link.platform : link.label_en || link.platform}
                    className="w-10 h-10 rounded-xl bg-[#0F0F0F] border border-[#242424] flex items-center justify-center text-[#9B9B9B] hover:text-[#E63B32] hover:border-[#B51D19]/40 hover:bg-[#B51D19]/10 transition-all duration-300"
                  >
                    {renderPlatformIcon(link.icon || link.platform)}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="mt-10 pt-8 border-t border-[#1C1C1C] flex flex-col sm:flex-row items-center justify-between text-xs text-[#707070] gap-4">
          <p className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
            <span>
              {isAr
                ? 'جميع الحقوق محفوظة © 2026 — صُنع بشغف وحب بواسطة'
                : 'All rights reserved © 2026 — Crafted with passion & love by'}
            </span>
            <a
              href="https://my-portfolio-two-gamma-xa2fur93st.vercel.app/#/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E63B32] hover:text-[#B51D19] hover:underline font-semibold transition-colors"
            >
              Taha Ahmed
            </a>
          </p>
          <div className="flex items-center gap-6">
            <a href="/#hero" className="hover:text-[#F5F5F5] transition-colors">
              {t('nav.home')}
            </a>
            <a href="/#works" className="hover:text-[#F5F5F5] transition-colors">
              {t('nav.works')}
            </a>
            <a href="/#clients" className="hover:text-[#F5F5F5] transition-colors">
              {t('nav.clients')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
