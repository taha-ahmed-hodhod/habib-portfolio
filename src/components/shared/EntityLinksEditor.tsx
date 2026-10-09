import React, { useState } from 'react'
import { Plus, Trash2, Link2, Globe, Eye, EyeOff, MessageCircle } from 'lucide-react'
import type { SocialLink } from '@/types/database'
import { Button } from '@/components/ui/Button'
import {
  LinkedinIcon,
  InstagramIcon,
  FacebookIcon,
  TikTokIcon,
} from '@/components/ui/Icons'

const YoutubeSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
)

const TwitterSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const BehanceSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-4.726 3-3.177 0-5.5-2.071-5.5-5.5 0-3.324 2.37-5.5 5.5-5.5 3.376 0 5.176 2.377 4.966 5.5h-7.966c.071 1.734 1.353 2.935 3.033 2.935 1.488 0 2.457-.697 2.871-1.435h1.822zm-7.692-4h5.418c-.126-1.503-1.171-2.45-2.656-2.45-1.503 0-2.585.952-2.762 2.45zm-11.034-8h5.278c2.409 0 4.222 1.156 4.222 3.32 0 1.272-.654 2.298-1.782 2.879 1.442.597 2.282 1.776 2.282 3.351 0 2.502-1.956 3.95-4.52 3.95h-5.48v-13.5zm2.5 5.5h2.479c1.077 0 1.921-.502 1.921-1.587 0-1.047-.844-1.513-1.921-1.513h-2.479v3.1zm0 5.6h2.721c1.242 0 2.179-.569 2.179-1.849 0-1.24-.937-1.851-2.179-1.851h-2.721v3.7z" />
  </svg>
)

export interface EntityLinksEditorProps {
  links: Partial<SocialLink>[]
  onChange: (links: Partial<SocialLink>[]) => void
  isAr?: boolean
  className?: string
  title?: string
}

export const COMMON_PLATFORMS = [
  { name: 'Instagram', icon: 'instagram', defaultUrl: 'https://instagram.com/' },
  { name: 'TikTok', icon: 'tiktok', defaultUrl: 'https://tiktok.com/@' },
  { name: 'YouTube', icon: 'youtube', defaultUrl: 'https://youtube.com/' },
  { name: 'Facebook', icon: 'facebook', defaultUrl: 'https://facebook.com/' },
  { name: 'LinkedIn', icon: 'linkedin', defaultUrl: 'https://linkedin.com/in/' },
  { name: 'WhatsApp', icon: 'whatsapp', defaultUrl: 'https://wa.me/201007430812' },
  { name: 'Website', icon: 'website', defaultUrl: 'https://' },
  { name: 'Behance', icon: 'behance', defaultUrl: 'https://behance.net/' },
  { name: 'X (Twitter)', icon: 'twitter', defaultUrl: 'https://x.com/' },
  { name: 'Custom', icon: 'custom', defaultUrl: 'https://' },
]

export const renderPlatformIcon = (platformOrIcon?: string | null) => {
  const p = (platformOrIcon || '').toLowerCase()
  if (p.includes('instagram')) return <InstagramIcon className="w-4 h-4" />
  if (p.includes('tiktok')) return <TikTokIcon className="w-4 h-4" />
  if (p.includes('youtube')) return <YoutubeSvg className="w-4 h-4 text-red-500" />
  if (p.includes('facebook')) return <FacebookIcon className="w-4 h-4" />
  if (p.includes('linkedin')) return <LinkedinIcon className="w-4 h-4" />
  if (p.includes('twitter') || p.includes('x')) return <TwitterSvg className="w-4 h-4" />
  if (p.includes('behance')) return <BehanceSvg className="w-4 h-4 text-[#0057ff]" />
  if (p.includes('whatsapp') || p.includes('wa.me')) return <MessageCircle className="w-4 h-4 text-green-500" />
  if (p.includes('web') || p.includes('site')) return <Globe className="w-4 h-4" />
  return <Link2 className="w-4 h-4" />
}

export const EntityLinksEditor: React.FC<EntityLinksEditorProps> = ({
  links,
  onChange,
  isAr = true,
  className = '',
  title,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState('Instagram')

  const handleAddLink = () => {
    const platObj = COMMON_PLATFORMS.find((p) => p.name === selectedPlatform)
    const isWa = selectedPlatform.toLowerCase().includes('whatsapp')
    const newLink: Partial<SocialLink> = {
      platform: selectedPlatform,
      label_ar: isWa ? 'واتساب' : selectedPlatform,
      label_en: selectedPlatform,
      url: platObj?.defaultUrl || (isWa ? 'https://wa.me/201007430812' : 'https://'),
      icon: platObj?.icon || 'link',
      is_visible: true,
      sort_order: links.length + 1,
    }
    onChange([...links, newLink])
  }

  const handleRemoveLink = (index: number) => {
    const updated = links.filter((_, i) => i !== index)
    onChange(updated)
  }

  const handleUpdateLink = (index: number, updates: Partial<SocialLink>) => {
    const updated = links.map((link, i) => (i === index ? { ...link, ...updates } : link))
    onChange(updated)
  }

  return (
    <div className={`space-y-3.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-[#B3B3B3] uppercase tracking-wider">
          {title || (isAr ? 'الروابط الديناميكية (Dynamic Links)' : 'Dynamic Links')}
        </label>
        <span className="text-[11px] text-[#777] font-mono">
          {links.length} {isAr ? 'روابط' : 'links'}
        </span>
      </div>

      {/* Add Link Bar */}
      <div className="flex items-center gap-2">
        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          className="bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
        >
          {COMMON_PLATFORMS.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddLink}
          icon={<Plus className="w-3.5 h-3.5 text-[#8B5CF6]" />}
          className="text-xs shrink-0"
        >
          {isAr ? 'إضافة رابط' : 'Add Link'}
        </Button>
      </div>

      {/* Links List */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {links.map((link, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-[#121212] border border-[#242424] hover:border-[#333] transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-[#181818] border border-[#2B2B2B] flex items-center justify-center text-[#8B5CF6] shrink-0">
              {renderPlatformIcon(link.icon || link.platform)}
            </div>

            <input
              type="text"
              value={link.platform || ''}
              onChange={(e) => handleUpdateLink(index, { platform: e.target.value })}
              placeholder={isAr ? 'الاسم/المنصة' : 'Platform'}
              className="w-24 bg-[#0A0A0A] border border-[#222] rounded-lg px-2 py-1 text-xs text-white shrink-0 focus:outline-none focus:border-[#8B5CF6]"
            />

            <input
              type="url"
              required
              value={link.url || ''}
              onChange={(e) => handleUpdateLink(index, { url: e.target.value })}
              placeholder="https://..."
              className="flex-1 min-w-[120px] bg-[#0A0A0A] border border-[#222] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
            />

            <button
              type="button"
              onClick={() => handleUpdateLink(index, { is_visible: !(link.is_visible ?? true) })}
              title={link.is_visible ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
              className={`p-1.5 rounded-lg text-xs transition-colors shrink-0 ${
                link.is_visible ?? true
                  ? 'text-[#8B5CF6] hover:bg-[#8B5CF6]/10'
                  : 'text-[#666] hover:bg-[#202020]'
              }`}
            >
              {link.is_visible ?? true ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => handleRemoveLink(index)}
              title={isAr ? 'حذف' : 'Delete'}
              className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {links.length === 0 && (
          <div className="p-4 text-center text-xs text-[#666] border border-dashed border-[#202020] rounded-xl">
            {isAr
              ? 'لا توجد روابط مضافة بعد. اضغط على "إضافة رابط" لإضافة روابط انستقرام، يوتيوب، تيك توك، وغيرها.'
              : 'No links added yet. Click "Add Link" to add Instagram, YouTube, TikTok, etc.'}
          </div>
        )}
      </div>
    </div>
  )
}
