import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface SEOProps {
  title?: string | null
  description?: string | null
  image?: string | null
  url?: string | null
  type?: string
}

export const useSEO = ({
  title,
  description,
  image,
  url,
  type = 'website',
}: SEOProps = {}) => {
  const { i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  useEffect(() => {
    const rawUrl = (import.meta.env.VITE_SITE_URL || 'https://habib-portfolio-gamma.vercel.app').replace(/\/+$/, '')
    const siteUrl = rawUrl
    const defaultTitle = isAr
      ? 'حبيب الرحمن | خبير التسويق الرقمي وإنتاج إعلانات الذكاء الاصطناعي'
      : 'Habib Al-Rahman | Digital Marketing & AI Video Creation'
    const defaultDescription = isAr
      ? 'بورتفوليو حبيب الرحمن: خبير التسويق الرقمي، صناعة الإعلانات وفيديوهات الذكاء الاصطناعي السينمائية، وبناء العلامات التجارية.'
      : "Explore Habib Al-Rahman's portfolio featuring digital marketing, AI video creation, client projects, creative work, and digital experiences."
    const defaultImage = `${siteUrl}/habib.jpg`

    const finalTitle = title ? `${title} | Habib Al-Rahman` : defaultTitle
    const finalDesc = description || defaultDescription
    const finalImage = image || defaultImage
    const finalUrl = url ? (url.startsWith('http') ? url : `${siteUrl}${url.startsWith('/') ? url : `/${url}`}`) : `${siteUrl}/`

    // Update document title
    document.title = finalTitle

    // Helper to set or create meta tag
    const setMetaTag = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector)
      if (!el) {
        el = document.createElement('meta')
        if (selector.startsWith('meta[property=')) {
          const prop = selector.match(/meta\[property="([^"]+)"\]/)?.[1]
          if (prop) el.setAttribute('property', prop)
        } else if (selector.startsWith('meta[name=')) {
          const name = selector.match(/meta\[name="([^"]+)"\]/)?.[1]
          if (name) el.setAttribute('name', name)
        }
        document.head.appendChild(el)
      }
      el.setAttribute(attr, value)
    }

    setMetaTag('meta[name="description"]', 'content', finalDesc)
    setMetaTag('meta[property="og:title"]', 'content', finalTitle)
    setMetaTag('meta[property="og:description"]', 'content', finalDesc)
    setMetaTag('meta[property="og:image"]', 'content', finalImage)
    setMetaTag('meta[property="og:url"]', 'content', finalUrl)
    setMetaTag('meta[property="og:type"]', 'content', type)

    setMetaTag('meta[name="twitter:title"]', 'content', finalTitle)
    setMetaTag('meta[name="twitter:description"]', 'content', finalDesc)
    setMetaTag('meta[name="twitter:image"]', 'content', finalImage)
  }, [title, description, image, url, type, isAr])
}
 