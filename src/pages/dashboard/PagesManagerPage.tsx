import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Edit2, Layers, ExternalLink, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PortfolioPage, SocialLink } from '@/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MediaUploader } from '@/components/media/MediaUploader'
import { deleteStorageMedia } from '@/services/storageService'
import { dataSync } from '@/services/dataSync'
import { EntityLinksEditor } from '@/components/shared/EntityLinksEditor'
import { getEntityLinks, saveEntityLinks } from '@/services/linksService'

export const PagesManagerPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  const [pages, setPages] = useState<PortfolioPage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingPage, setEditingPage] = useState<Partial<PortfolioPage> | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [pageLinks, setPageLinks] = useState<Partial<SocialLink>[]>([])

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_pages')
        .select('*')
        .order('sort_order', { ascending: true })
      if (!error && data) {
        setPages(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPages()
  }, [])

  const openModal = async (page?: PortfolioPage) => {
    setErrorMessage(null)
    if (page) {
      setEditingPage(page)
      setOriginalImageUrl(page.image_url || null)
      const links = await getEntityLinks('page', page.id)
      setPageLinks(links)
    } else {
      setEditingPage({
        name_ar: '',
        name_en: '',
        specialization_ar: '',
        specialization_en: '',
        description_ar: '',
        description_en: '',
        primary_url: '',
        is_visible: true,
        sort_order: pages.length + 1,
      })
      setOriginalImageUrl(null)
      setPageLinks([])
    }
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPage) return

    setSaving(true)
    setErrorMessage(null)

    try {
      let pageId = editingPage.id

      if (editingPage.id) {
        const { error } = await supabase
          .from('portfolio_pages')
          .update(editingPage)
          .eq('id', editingPage.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('portfolio_pages')
          .insert([editingPage])
          .select('id')
          .single()
        if (error) throw error
        pageId = data.id
      }

      // Save dynamic page links
      if (pageId) {
        await saveEntityLinks('page', pageId, pageLinks)
      }

      // Safe media replacement: delete old image only after successful DB update
      if (originalImageUrl && originalImageUrl !== editingPage.image_url) {
        await deleteStorageMedia(originalImageUrl)
      }

      dataSync.emit('pages.updated')
      setShowModal(false)
      setEditingPage(null)
      setOriginalImageUrl(null)
      setPageLinks([])
      fetchPages()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save page'
      setErrorMessage(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (page: PortfolioPage) => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذه الصفحة/العلامة؟' : 'Are you sure you want to delete this page/brand?')) {
      const { error } = await supabase.from('portfolio_pages').delete().eq('id', page.id)
      if (!error) {
        if (page.image_url) {
          await deleteStorageMedia(page.image_url)
        }
        dataSync.emit('pages.updated')
        fetchPages()
      } else {
        alert(error.message)
      }
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F5F5F5]">
            {isAr ? 'الصفحات والعلامات الرقمية' : 'Pages & Digital Brands'}
          </h2>
          <p className="text-xs text-[#9B9B9B] mt-0.5">
            {isAr
              ? 'إدارة صفحات وعلامات حبيب الخاصة مثل (Habib AI) مع الروابط والوصف'
              : 'Manage dedicated pages/brands like Habib AI'}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => openModal()}
        >
          {isAr ? 'إضافة صفحة/علامة' : 'Add Page / Brand'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((p) => (
          <Card key={p.id} className="bg-[#0B0B0B] border-[#242424] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#38BDF8]/20 to-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6]">
                  <Layers className="w-5 h-5" />
                </div>
                <Badge variant={p.is_visible ? 'accent' : 'default'}>
                  {p.is_visible ? (isAr ? 'ظاهر' : 'Visible') : (isAr ? 'مخفي' : 'Hidden')}
                </Badge>
              </div>

              <h4 className="font-bold text-[#F5F5F5] text-base">
                {isAr ? p.name_ar : p.name_en}
              </h4>
              <p className="text-xs text-[#8B5CF6] font-medium mt-0.5">
                {isAr ? p.specialization_ar : p.specialization_en}
              </p>
              <p className="text-xs text-[#9B9B9B] mt-2 line-clamp-3 whitespace-pre-line">
                {isAr ? p.description_ar : p.description_en}
              </p>
            </div>

            <div className="flex items-center justify-between mt-5 pt-3 border-t border-[#1C1C1C]">
              {p.primary_url ? (
                <a
                  href={p.primary_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#38BDF8] hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{isAr ? 'زيارة' : 'Visit'}</span>
                </a>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openModal(p)}
                  className="p-1.5 rounded-lg text-[#9B9B9B] hover:text-white hover:bg-[#1A1A1A]"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}

        {!loading && pages.length === 0 && (
          <div className="col-span-full p-12 text-center text-sm text-[#777] border border-dashed border-[#242424] rounded-2xl">
            {isAr ? 'لا توجد صفحات مضافة بعد.' : 'No pages added yet.'}
          </div>
        )}
      </div>

      {showModal && editingPage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="bg-[#0B0B0B] border-[#242424] w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#F5F5F5] mb-4">
              {editingPage.id ? (isAr ? 'تعديل الصفحة' : 'Edit Page') : (isAr ? 'إضافة صفحة/علامة' : 'New Page')}
            </h3>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                  {isAr ? 'الاسم (بالعربية)' : 'Name (Arabic)'}
                </label>
                <input
                  type="text"
                  required
                  value={editingPage.name_ar || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, name_ar: e.target.value })}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                  {isAr ? 'التخصص (مثال: Habib AI | AI Video Ads)' : 'Specialization'}
                </label>
                <input
                  type="text"
                  value={editingPage.specialization_ar || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, specialization_ar: e.target.value })}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                  {isAr ? 'الوصف' : 'Description'}
                </label>
                <textarea
                  rows={3}
                  value={editingPage.description_ar || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, description_ar: e.target.value })}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                  {isAr ? 'رابط الصفحة الأساسي (الموقع الرئيسي)' : 'Primary URL / Website'}
                </label>
                <input
                  type="url"
                  value={editingPage.primary_url || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, primary_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              {/* Dynamic Multiple Links */}
              <div className="pt-2">
                <EntityLinksEditor
                  links={pageLinks}
                  onChange={setPageLinks}
                  isAr={isAr}
                />
              </div>

              <MediaUploader
                label={isAr ? 'صورة الغلاف / الشعار' : 'Cover Image / Logo'}
                folder="pages"
                mediaType="image"
                currentUrl={editingPage.image_url || undefined}
                onUploadComplete={(url) => setEditingPage({ ...editingPage, image_url: url })}
                onRemove={() => setEditingPage({ ...editingPage, image_url: null })}
              />

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pageVisible"
                  checked={editingPage.is_visible ?? true}
                  onChange={(e) => setEditingPage({ ...editingPage, is_visible: e.target.checked })}
                  className="rounded border-[#303030] text-[#8B5CF6]"
                />
                <label htmlFor="pageVisible" className="text-xs text-[#D1D1D1]">
                  {isAr ? 'إظهار في الموقع العام' : 'Show on public site'}
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1F1F1F]">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" variant="primary" isLoading={saving}>
                  {isAr ? 'حفظ' : 'Save'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
