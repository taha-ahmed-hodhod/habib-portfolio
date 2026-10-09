import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Edit2, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { SocialLink } from '@/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { dataSync } from '@/services/dataSync'
import { renderPlatformIcon, COMMON_PLATFORMS } from '@/components/shared/EntityLinksEditor'

export const LinksManagerPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  const [links, setLinks] = useState<SocialLink[]>([])
  const [profileId, setProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingLink, setEditingLink] = useState<Partial<SocialLink> | null>(null)

  const fetchProfileAndLinks = async () => {
    try {
      setLoading(true)
      const [linksRes, profileRes] = await Promise.all([
        supabase
          .from('social_links')
          .select('*')
          .eq('owner_type', 'profile')
          .order('sort_order', { ascending: true }),
        supabase.from('profiles').select('id').limit(1).single(),
      ])

      if (linksRes.data) {
        setLinks(linksRes.data)
      }
      if (profileRes.data?.id) {
        setProfileId(profileRes.data.id)
      }
    } catch (err) {
      console.error('Error fetching links or profile:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfileAndLinks()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLink) return

    setSaving(true)
    try {
      // Ensure we have a valid owner_id for the link
      let targetOwnerId = profileId
      if (!targetOwnerId) {
        const { data: prof } = await supabase.from('profiles').select('id').limit(1).single()
        targetOwnerId = prof?.id || null
      }

      if (!targetOwnerId) {
        throw new Error(
          isAr
            ? 'تعذر العثور على معرّف الملف الشخصي في قاعدة البيانات'
            : 'Profile ID not found in database'
        )
      }

      const payload = {
        platform: editingLink.platform?.trim() || 'Custom',
        label_ar: editingLink.label_ar?.trim() || editingLink.platform?.trim() || 'رابط',
        label_en: editingLink.label_en?.trim() || editingLink.platform?.trim() || 'Link',
        url: editingLink.url?.trim() || '',
        icon: editingLink.icon || 'link',
        owner_type: 'profile' as const,
        owner_id: targetOwnerId,
        sort_order: editingLink.sort_order ?? (links.length + 1),
        is_visible: editingLink.is_visible ?? true,
        show_in_hero: editingLink.show_in_hero ?? true,
        show_in_footer: editingLink.show_in_footer ?? true,
      }

      if (!payload.url) {
        throw new Error(isAr ? 'يرجى إدخال الرابط (URL)' : 'Please enter a valid URL')
      }

      if (editingLink.id) {
        const { error } = await supabase.from('social_links').update(payload).eq('id', editingLink.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('social_links').insert([payload])
        if (error) throw error
      }

      dataSync.emit('links.updated')
      setShowModal(false)
      setEditingLink(null)
      await fetchProfileAndLinks()
    } catch (err: unknown) {
      console.error('Error saving link:', err)
      const msg = err instanceof Error ? err.message : 'Error saving link'
      alert(isAr ? `حدث خطأ أثناء الحفظ: ${msg}` : `Error saving link: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm(isAr ? 'حذف هذا الرابط؟' : 'Delete this link?')) {
      try {
        const { error } = await supabase.from('social_links').delete().eq('id', id)
        if (error) throw error
        dataSync.emit('links.updated')
        await fetchProfileAndLinks()
      } catch (err: unknown) {
        console.error('Error deleting link:', err)
        const msg = err instanceof Error ? err.message : 'Error deleting link'
        alert(isAr ? `حدث خطأ أثناء الحذف: ${msg}` : `Error deleting link: ${msg}`)
      }
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F5F5F5]">
            {isAr ? 'الروابط الديناميكية' : 'Dynamic Links'}
          </h2>
          <p className="text-xs text-[#9B9B9B] mt-0.5">
            {isAr ? 'إدارة روابط التواصل الاجتماعي وتحديد أماكن ظهورها (Hero / Footer)' : 'Manage social profiles and placements (Hero / Footer)'}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            const defaultPlatform = COMMON_PLATFORMS[0]
            setEditingLink({
              platform: defaultPlatform.name,
              label_ar: 'انستقرام',
              label_en: defaultPlatform.name,
              icon: defaultPlatform.icon,
              url: defaultPlatform.defaultUrl,
              owner_type: 'profile',
              owner_id: profileId || undefined,
              is_visible: true,
              show_in_hero: true,
              show_in_footer: true,
              sort_order: links.length + 1,
            })
            setShowModal(true)
          }}
        >
          {isAr ? 'إضافة رابط' : 'Add Link'}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-[#0B0B0B] border-[#242424] p-4 flex flex-col justify-between space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#181818]" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-[#1F1F1F] rounded w-20" />
                  <div className="h-3 bg-[#181818] rounded w-28" />
                </div>
              </div>
              <div className="pt-2 border-t border-[#1C1C1C] flex items-center gap-2">
                <div className="w-12 h-5 rounded-full bg-[#181818]" />
                <div className="w-12 h-5 rounded-full bg-[#181818]" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {links.map((link) => (
            <Card key={link.id} className="bg-[#0B0B0B] border-[#242424] p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#151515] border border-[#242424] flex items-center justify-center text-[#8B5CF6]">
                    {renderPlatformIcon(link.icon || link.platform || link.label_en)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#F5F5F5]">
                      {isAr ? link.label_ar || link.platform : link.label_en || link.platform}
                    </h4>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#38BDF8] hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <span className="truncate max-w-[140px]">{link.url}</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingLink(link)
                      setShowModal(true)
                    }}
                    className="p-1.5 rounded-lg text-[#9B9B9B] hover:text-white hover:bg-[#1A1A1A]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Badges for placements */}
              <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[#1C1C1C]">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${link.show_in_hero !== false ? 'bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30' : 'bg-[#181818] text-[#666]'}`}>
                  {isAr ? 'الهيرو' : 'Hero'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${link.show_in_footer !== false ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30' : 'bg-[#181818] text-[#666]'}`}>
                  {isAr ? 'الفوتر' : 'Footer'}
                </span>
                {!link.is_visible && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                    {isAr ? 'مخفي' : 'Hidden'}
                  </span>
                )}
              </div>
            </Card>
          ))}

          {!loading && links.length === 0 && (
            <div className="col-span-full p-8 text-center text-xs text-[#777] border border-dashed border-[#242424] rounded-xl">
              {isAr ? 'لا توجد روابط مضافة بعد.' : 'No links found.'}
            </div>
          )}
        </div>
      )}

      {showModal && editingLink && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="bg-[#0B0B0B] border-[#242424] w-full max-w-md p-6">
            <h3 className="text-base font-bold text-white mb-4">
              {editingLink.id ? (isAr ? 'تعديل الرابط' : 'Edit Link') : (isAr ? 'إضافة رابط' : 'New Link')}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs text-[#B3B3B3] mb-1">{isAr ? 'المنصة' : 'Platform'}</label>
                <div className="flex gap-2">
                  <select
                    value={editingLink.platform || 'Instagram'}
                    onChange={(e) => {
                      const plat = e.target.value
                      const platObj = COMMON_PLATFORMS.find((p) => p.name === plat)
                      const isWhatsApp = plat.toLowerCase().includes('whatsapp')
                      const isDefaultOrEmpty =
                        !editingLink.url ||
                        editingLink.url === 'https://' ||
                        COMMON_PLATFORMS.some((p) => p.defaultUrl === editingLink.url) ||
                        isWhatsApp

                      setEditingLink({
                        ...editingLink,
                        platform: plat,
                        label_ar: isWhatsApp ? 'واتساب' : (editingLink.label_ar === 'واتساب' ? plat : (editingLink.label_ar || plat)),
                        label_en: editingLink.label_en || plat,
                        icon: platObj?.icon || 'link',
                        url: isWhatsApp ? 'https://wa.me/201007430812' : (isDefaultOrEmpty ? (platObj?.defaultUrl || 'https://') : editingLink.url),
                      })
                    }}
                    className="bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  >
                    {COMMON_PLATFORMS.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    value={editingLink.platform || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      const isWa = val.toLowerCase().includes('whatsapp') || val.includes('واتساب')
                      const shouldAutoFill = isWa && (!editingLink.url || editingLink.url === 'https://' || COMMON_PLATFORMS.some((p) => p.defaultUrl === editingLink.url))
                      setEditingLink({
                        ...editingLink,
                        platform: val,
                        label_ar: isWa && (!editingLink.label_ar || editingLink.label_ar === 'انستقرام') ? 'واتساب' : editingLink.label_ar,
                        url: shouldAutoFill ? 'https://wa.me/201007430812' : editingLink.url,
                        icon: isWa ? 'whatsapp' : editingLink.icon,
                      })
                    }}
                    placeholder="Platform name"
                    className="flex-1 bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#B3B3B3] mb-1">{isAr ? 'الاسم (عربي)' : 'Label (AR)'}</label>
                  <input
                    type="text"
                    value={editingLink.label_ar || ''}
                    onChange={(e) => setEditingLink({ ...editingLink, label_ar: e.target.value })}
                    className="w-full bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#B3B3B3] mb-1">{isAr ? 'الاسم (إنجليزي)' : 'Label (EN)'}</label>
                  <input
                    type="text"
                    value={editingLink.label_en || ''}
                    onChange={(e) => setEditingLink({ ...editingLink, label_en: e.target.value })}
                    className="w-full bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-[#B3B3B3]">{isAr ? 'الرابط (URL)' : 'URL'}</label>
                  {editingLink.platform?.toLowerCase().includes('whatsapp') && (
                    <span className="text-[10px] text-[#A78BFA] bg-[#8B5CF6]/10 px-2 py-0.5 rounded-md border border-[#8B5CF6]/20">
                      {isAr ? 'مجهز برقم حبيب تلقائياً (يمكنك تعديله)' : 'Pre-filled with Habib’s number (editable)'}
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  required
                  value={editingLink.url || ''}
                  onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              {/* Placement & Visibility Checkboxes */}
              <div className="space-y-2 pt-1 border-t border-[#1F1F1F]">
                <label className="text-xs font-semibold text-[#8B5CF6] block">
                  {isAr ? 'أماكن الظهور (Placements)' : 'Placements & Visibility'}
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showInHero"
                    checked={editingLink.show_in_hero ?? true}
                    onChange={(e) => setEditingLink({ ...editingLink, show_in_hero: e.target.checked })}
                    className="rounded border-[#303030] text-[#8B5CF6] focus:ring-[#8B5CF6]"
                  />
                  <label htmlFor="showInHero" className="text-xs text-[#D1D1D1]">
                    {isAr ? 'إظهار في قسم البداية (Hero Section)' : 'Show in Hero section'}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showInFooter"
                    checked={editingLink.show_in_footer ?? true}
                    onChange={(e) => setEditingLink({ ...editingLink, show_in_footer: e.target.checked })}
                    className="rounded border-[#303030] text-[#8B5CF6] focus:ring-[#8B5CF6]"
                  />
                  <label htmlFor="showInFooter" className="text-xs text-[#D1D1D1]">
                    {isAr ? 'إظهار في أسفل الصفحة (Footer)' : 'Show in Footer'}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="linkVisible"
                    checked={editingLink.is_visible ?? true}
                    onChange={(e) => setEditingLink({ ...editingLink, is_visible: e.target.checked })}
                    className="rounded border-[#303030] text-[#8B5CF6] focus:ring-[#8B5CF6]"
                  />
                  <label htmlFor="linkVisible" className="text-xs text-[#D1D1D1]">
                    {isAr ? 'مفعل وظاهر في الموقع' : 'Active and visible'}
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1F1F1F]">
                <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={() => setShowModal(false)}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={saving}>
                  {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'حفظ' : 'Save'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
