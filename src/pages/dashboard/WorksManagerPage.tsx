import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Edit2, Film, Image as ImageIcon, Star, AlertCircle, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Work, Category, Client } from '@/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MediaUploader } from '@/components/media/MediaUploader'
import { deleteStorageMedia } from '@/services/storageService'
import { dataSync } from '@/services/dataSync'

export const WorksManagerPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  const [works, setWorks] = useState<Work[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingWork, setEditingWork] = useState<Partial<Work> | null>(null)
  const [originalMediaUrl, setOriginalMediaUrl] = useState<string | null>(null)
  const [originalThumbnailUrl, setOriginalThumbnailUrl] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const [
        { data: worksData },
        { data: catsData },
        { data: clientsData },
      ] = await Promise.all([
        supabase.from('works').select('*, category:categories(*), client:clients(*)').order('sort_order', { ascending: true }),
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('clients').select('*').order('name_ar', { ascending: true }),
      ])

      if (worksData) setWorks(worksData)
      if (catsData) setCategories(catsData)
      if (clientsData) setClients(clientsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingWork) return

    if (!editingWork.media_url) {
      setErrorMessage(isAr ? 'يرجى رفع ملف الوسائط (فيديو أو صورة أو مستند)' : 'Please upload a media file (video, image, or document)')
      return
    }

    setSaving(true)
    setErrorMessage(null)

    const payload = {
      title_ar: editingWork.title_ar,
      title_en: editingWork.title_en || editingWork.title_ar,
      description_ar: editingWork.description_ar,
      description_en: editingWork.description_en,
      media_type: editingWork.media_type || 'video',
      media_url: editingWork.media_url,
      thumbnail_url: editingWork.thumbnail_url || (editingWork.media_type === 'image' ? editingWork.media_url : null),
      category_id: editingWork.category_id || null,
      client_id: editingWork.client_id || null,
      project_url: editingWork.project_url,
      is_featured: editingWork.is_featured ?? false,
      is_visible: editingWork.is_visible ?? true,
      sort_order: editingWork.sort_order ?? 0,
    }

    try {
      let resultError = null

      if (editingWork.id) {
        const { error } = await supabase.from('works').update(payload).eq('id', editingWork.id)
        resultError = error
      } else {
        const { error } = await supabase.from('works').insert([payload])
        resultError = error
      }

      if (resultError) {
        throw new Error(resultError.message)
      }

      // Safe media cleanup: only delete old storage files after database confirms success
      if (originalMediaUrl && originalMediaUrl !== editingWork.media_url) {
        await deleteStorageMedia(originalMediaUrl)
      }
      if (originalThumbnailUrl && originalThumbnailUrl !== editingWork.thumbnail_url) {
        await deleteStorageMedia(originalThumbnailUrl)
      }

      dataSync.emit('works.updated')
      setShowModal(false)
      setEditingWork(null)
      setOriginalMediaUrl(null)
      setOriginalThumbnailUrl(null)
      fetchData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save work'
      setErrorMessage(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (work: Work) => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذا العمل؟' : 'Are you sure you want to delete this work?')) {
      const { error } = await supabase.from('works').delete().eq('id', work.id)
      if (!error) {
        if (work.media_url) await deleteStorageMedia(work.media_url)
        if (work.thumbnail_url && work.thumbnail_url !== work.media_url) {
          await deleteStorageMedia(work.thumbnail_url)
        }
        dataSync.emit('works.updated')
        fetchData()
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
            {isAr ? 'الأعمال والمشاريع' : 'Works & Portfolio'}
          </h2>
          <p className="text-xs text-[#9B9B9B] mt-0.5">
            {isAr ? 'إدارة فيديوهات الذكاء الاصطناعي والأعمال المميزة' : 'Manage AI videos and featured portfolio works'}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setEditingWork({
              title_ar: '',
              title_en: '',
              media_type: 'video',
              media_url: '',
              is_featured: true,
              is_visible: true,
              sort_order: works.length + 1,
            })
            setShowModal(true)
          }}
        >
          {isAr ? 'إضافة عمل جديد' : 'New Work'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {works.map((w) => (
          <Card key={w.id} className="bg-[#0B0B0B] border-[#242424] overflow-hidden p-0 flex flex-col justify-between group">
            <div className="relative aspect-video bg-[#121212] overflow-hidden">
              {w.thumbnail_url ? (
                <img src={w.thumbnail_url} alt={w.title_ar} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#444]">
                  {w.media_type === 'video' ? (
                    <Film className="w-8 h-8" />
                  ) : w.media_type === 'document' ? (
                    <FileText className="w-8 h-8 text-[#38BDF8]" />
                  ) : (
                    <ImageIcon className="w-8 h-8" />
                  )}
                </div>
              )}

              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <Badge variant="accent" className="bg-black/70 backdrop-blur-sm text-[10px]">
                  {w.media_type === 'video'
                    ? (isAr ? 'فيديو' : 'Video')
                    : w.media_type === 'document'
                    ? (isAr ? 'مستند' : 'Document')
                    : (isAr ? 'صورة' : 'Image')}
                </Badge>
                {w.is_featured && (
                  <Badge variant="dot" className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    <span>{isAr ? 'مميز' : 'Featured'}</span>
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-[#F5F5F5] text-sm">
                  {isAr ? w.title_ar : w.title_en}
                </h4>
                {w.client && (
                  <span className="text-[11px] text-[#8B5CF6] block mt-0.5">
                    {isAr ? w.client.name_ar : w.client.name_en}
                  </span>
                )}
                <p className="text-xs text-[#9B9B9B] mt-1.5 line-clamp-2">
                  {isAr ? w.description_ar : w.description_en}
                </p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1C1C1C]">
                <Badge variant={w.is_visible ? 'accent' : 'default'} className="text-[10px]">
                  {w.is_visible ? (isAr ? 'ظاهر' : 'Visible') : (isAr ? 'مخفي' : 'Hidden')}
                </Badge>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingWork(w)
                      setOriginalMediaUrl(w.media_url || null)
                      setOriginalThumbnailUrl(w.thumbnail_url || null)
                      setShowModal(true)
                    }}
                    className="p-1.5 rounded-lg text-[#9B9B9B] hover:text-white hover:bg-[#1A1A1A]"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(w)}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {!loading && works.length === 0 && (
          <div className="col-span-full p-12 text-center text-sm text-[#777] border border-dashed border-[#242424] rounded-2xl">
            {isAr ? 'لا توجد أعمال مضافة بعد.' : 'No works added yet.'}
          </div>
        )}
      </div>

      {showModal && editingWork && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="bg-[#0B0B0B] border-[#242424] w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#F5F5F5] mb-4">
              {editingWork.id ? (isAr ? 'تعديل عمل' : 'Edit Work') : (isAr ? 'إضافة عمل جديد' : 'New Work')}
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
                  {isAr ? 'عنوان العمل (بالعربية)' : 'Title (Arabic)'}
                </label>
                <input
                  type="text"
                  required
                  value={editingWork.title_ar || ''}
                  onChange={(e) => setEditingWork({ ...editingWork, title_ar: e.target.value })}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                  {isAr ? 'عنوان العمل (بالإنجليزية)' : 'Title (English)'}
                </label>
                <input
                  type="text"
                  value={editingWork.title_en || ''}
                  onChange={(e) => setEditingWork({ ...editingWork, title_en: e.target.value })}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                    {isAr ? 'نوع الوسائط' : 'Media Type'}
                  </label>
                  <select
                    value={editingWork.media_type || 'video'}
                    onChange={(e) => setEditingWork({ ...editingWork, media_type: e.target.value as 'image' | 'video' | 'document' })}
                    className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="video">{isAr ? 'فيديو سينمائي' : 'Video'}</option>
                    <option value="image">{isAr ? 'صورة / تصميم' : 'Image'}</option>
                    <option value="document">{isAr ? 'مستند (PDF / ملف)' : 'Document (PDF / File)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                    {isAr ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={editingWork.category_id || ''}
                    onChange={(e) => setEditingWork({ ...editingWork, category_id: e.target.value || null })}
                    className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="">{isAr ? 'بدون تصنيف' : 'Uncategorized'}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {isAr ? c.name_ar : c.name_en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                  {isAr ? 'العميل أو البراند المرتبط' : 'Associated Client'}
                </label>
                <select
                  value={editingWork.client_id || ''}
                  onChange={(e) => setEditingWork({ ...editingWork, client_id: e.target.value || null })}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="">{isAr ? 'لا يوجد عميل مرتبط' : 'None'}</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isAr ? c.name_ar : c.name_en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Media File Upload (Video, Document, or Image) */}
              {editingWork.media_type === 'video' ? (
                <>
                  <MediaUploader
                    label={isAr ? 'ملف الفيديو (MP4, WebM)' : 'Video File (MP4, WebM)'}
                    folder="works/videos"
                    mediaType="video"
                    maxSizeBytes={100 * 1024 * 1024}
                    currentUrl={editingWork.media_url || undefined}
                    onUploadComplete={(url) => setEditingWork({ ...editingWork, media_url: url })}
                    onRemove={() => setEditingWork({ ...editingWork, media_url: '' })}
                  />

                  <MediaUploader
                    label={isAr ? 'الصورة المصغرة للغلاف (Thumbnail Poster)' : 'Video Thumbnail (Poster Image)'}
                    folder="works/thumbnails"
                    mediaType="image"
                    maxSizeBytes={10 * 1024 * 1024}
                    currentUrl={editingWork.thumbnail_url || undefined}
                    onUploadComplete={(url) => setEditingWork({ ...editingWork, thumbnail_url: url })}
                    onRemove={() => setEditingWork({ ...editingWork, thumbnail_url: '' })}
                  />
                </>
              ) : editingWork.media_type === 'document' ? (
                <>
                  <MediaUploader
                    label={isAr ? 'ملف المستند (PDF, Word, Excel)' : 'Document File (PDF, Word, Excel)'}
                    folder="works/documents"
                    mediaType="document"
                    maxSizeBytes={30 * 1024 * 1024}
                    currentUrl={editingWork.media_url || undefined}
                    onUploadComplete={(url) => setEditingWork({ ...editingWork, media_url: url })}
                    onRemove={() => setEditingWork({ ...editingWork, media_url: '' })}
                  />

                  <MediaUploader
                    label={isAr ? 'غلاف المستند الاختياري (Thumbnail)' : 'Optional Document Cover (Thumbnail)'}
                    folder="works/thumbnails"
                    mediaType="image"
                    maxSizeBytes={10 * 1024 * 1024}
                    currentUrl={editingWork.thumbnail_url || undefined}
                    onUploadComplete={(url) => setEditingWork({ ...editingWork, thumbnail_url: url })}
                    onRemove={() => setEditingWork({ ...editingWork, thumbnail_url: '' })}
                  />
                </>
              ) : (
                <MediaUploader
                  label={isAr ? 'صورة العمل (JPEG, PNG, WebP)' : 'Work Image (JPEG, PNG, WebP)'}
                  folder="works/images"
                  mediaType="image"
                  maxSizeBytes={10 * 1024 * 1024}
                  currentUrl={editingWork.media_url || undefined}
                  onUploadComplete={(url) =>
                    setEditingWork({
                      ...editingWork,
                      media_url: url,
                      thumbnail_url: url,
                    })
                  }
                  onRemove={() =>
                    setEditingWork({
                      ...editingWork,
                      media_url: '',
                      thumbnail_url: '',
                    })
                  }
                />
              )}

              <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                  {isAr ? 'رابط المشروع الخارجي (اختياري)' : 'Project External URL (Optional)'}
                </label>
                <input
                  type="url"
                  value={editingWork.project_url || ''}
                  onChange={(e) => setEditingWork({ ...editingWork, project_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                  {isAr ? 'الوصف' : 'Description'}
                </label>
                <textarea
                  rows={3}
                  value={editingWork.description_ar || ''}
                  onChange={(e) => setEditingWork({ ...editingWork, description_ar: e.target.value })}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs text-[#D1D1D1] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingWork.is_featured ?? false}
                    onChange={(e) => setEditingWork({ ...editingWork, is_featured: e.target.checked })}
                    className="rounded border-[#303030] text-[#8B5CF6]"
                  />
                  <span>{isAr ? 'تمييز العمل في الصفحة الرئيسية' : 'Feature on homepage'}</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-[#D1D1D1] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingWork.is_visible ?? true}
                    onChange={(e) => setEditingWork({ ...editingWork, is_visible: e.target.checked })}
                    className="rounded border-[#303030] text-[#8B5CF6]"
                  />
                  <span>{isAr ? 'إظهار العمل' : 'Visible'}</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1F1F1F]">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" variant="primary" isLoading={saving}>
                  {isAr ? 'حفظ العمل' : 'Save Work'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
