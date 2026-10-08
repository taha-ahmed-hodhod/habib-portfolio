import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSocialLinks } from '@/hooks/useSocialLinks'
import { renderPlatformIcon } from '@/components/shared/EntityLinksEditor'
import { LinkedinIcon, InstagramIcon, FacebookIcon } from '@/components/ui/Icons'

export const Footer: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')
  const { footerLinks } = useSocialLinks()

  return (
    <footer className="border-t border-[#242424]/60 bg-[#050505]/75 backdrop-blur-sm text-[#9B9B9B] py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-start">
          {/* Brand Info */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <h3 className="text-xl font-bold text-[#F5F5F5] tracking-tight">
              Habib AL-Rahman
            </h3>
            <p className="text-sm text-[#9B9B9B] max-w-sm">
              {isAr
                ? 'خبير التسويق الرقمي وبناء العلامات التجارية وإنتاج فيديوهات الذكاء الاصطناعي السينمائية.'
                : 'Digital marketing strategist, AI video creator, and creative brand consultant.'}
            </p>
          </div>

          {/* Dynamic Social Icons */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {footerLinks.length > 0 ? (
              footerLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.platform}
                  title={isAr ? link.label_ar || link.platform : link.label_en || link.platform}
                  className="w-10 h-10 rounded-xl bg-[#0F0F0F] border border-[#242424] flex items-center justify-center text-[#9B9B9B] hover:text-[#A78BFA] hover:border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/10 transition-all duration-300"
                >
                  {renderPlatformIcon(link.icon || link.platform)}
                </a>
              ))
            ) : (
              <>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-10 h-10 rounded-xl bg-[#0F0F0F] border border-[#242424] flex items-center justify-center text-[#9B9B9B] hover:text-[#0A66C2] hover:border-[#0A66C2]/40 hover:bg-[#0A66C2]/10 transition-all duration-300"
                >
                  <LinkedinIcon className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-xl bg-[#0F0F0F] border border-[#242424] flex items-center justify-center text-[#9B9B9B] hover:text-[#E4405F] hover:border-[#E4405F]/40 hover:bg-[#E4405F]/10 transition-all duration-300"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-10 h-10 rounded-xl bg-[#0F0F0F] border border-[#242424] flex items-center justify-center text-[#9B9B9B] hover:text-[#1877F2] hover:border-[#1877F2]/40 hover:bg-[#1877F2]/10 transition-all duration-300"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              </>
            )}
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
              className="text-[#A78BFA] hover:text-[#8B5CF6] hover:underline font-semibold transition-colors"
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
