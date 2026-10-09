import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, CheckCircle2, XCircle, Star, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Testimonial } from '@/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MediaUploader } from '@/components/media/MediaUploader'
import { deleteStorageMedia } from '@/services/storageService'
import { dataSync } from '@/services/dataSync'

export const TestimonialsManagerPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Partial<Testimonial> | null>(null)
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null)

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data) setTestimonials(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const updateStatus = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    const { error } = await supabase.from('testimonials').update({ status }).eq('id', id)
    if (!error) {
      dataSync.emit('testimonials.updated')
      fetchItems()
    }
  }

  const handleDelete = async (item: Testimonial) => {
    if (confirm(isAr ? 'حذف هذا الرأي نهائياً؟' : 'Permanently delete this testimonial?')) {
      const { error } = await supabase.from('testimonials').delete().eq('id', item.id)
      if (!error) {
        if (item.avatar_url) await deleteStorageMedia(item.avatar_url)
        dataSync.emit('testimonials.updated')
        fetchItems()
      }
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    setSaving(true)
    setErrorMessage(null)

    const payload = {
      client_name_ar: editingItem.client_name_ar,
      client_name_en: editingItem.client_name_en || editingItem.client_name_ar,
      profession_ar: editingItem.profession_ar,
      profession_en: editingItem.profession_en,
      avatar_url: editingItem.avatar_url || null,
      content_ar: editingItem.content_ar,
      content_en: editingItem.content_en || editingItem.content_ar,
      rating: editingItem.rating ?? 5,
      status: editingItem.status || 'approved',
      is_visible: editingItem.is_visible ?? true,
      sort_order: editingItem.sort_order ?? 0,
    }

    try {
      let resultError = null
      if (editingItem.id) {
        const { error } = await supabase.from('testimonials').update(payload).eq('id', editingItem.id)
        resultError = error
      } else {
        const { error } = await supabase.from('testimonials').insert([payload])
        resultError = error
      }

      if (resultError) {
        throw new Error(resultError.message)
      }

      if (originalAvatarUrl && originalAvatarUrl !== editingItem.avatar_url) {
        await deleteStorageMedia(originalAvatarUrl)
      }

      dataSync.emit('testimonials.updated')
      setShowModal(false)
      setEditingItem(null)
      setOriginalAvatarUrl(null)
      fetchItems()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save testimonial'
      setErrorMessage(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F5F5F5]">
            {isAr ? 'آراء وشهادات العملاء' : 'Testimonials & Reviews'}
          </h2>
          <p className="text-xs text-[#9B9B9B] mt-0.5">
            {isAr ? 'مراجعة وقبول أو رفض التقييمات وإضافة شهادات عملاء جديدة' : 'Moderate, approve, or add client testimonials'}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setEditingItem({
              client_name_ar: '',
              client_name_en: '',
              profession_ar: '',
              profession_en: '',
              content_ar: '',
              content_en: '',
              rating: 5,
              status: 'approved',
              is_visible: true,
            })
            setShowModal(true)
          }}
        >
          {isAr ? 'إضافة رأي عميل' : 'Add Testimonial'}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-[#0B0B0B] border-[#242424] p-5 space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-[#1F1F1F] rounded w-20" />
                <div className="w-14 h-5 rounded-full bg-[#181818]" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-[#181818] rounded w-full" />
                <div className="h-3 bg-[#181818] rounded w-4/5" />
              </div>
              <div className="pt-2 border-t border-[#1C1C1C] flex items-center justify-between">
                <div className="h-3.5 bg-[#1F1F1F] rounded w-24" />
                <div className="w-12 h-6 rounded-lg bg-[#181818]" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t) => (
          <Card key={t.id} className="bg-[#0B0B0B] border-[#242424] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: t.rating || 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>

                <Badge
                  variant={
                    t.status === 'approved'
                      ? 'accent'
                      : t.status === 'pending'
                      ? 'dot'
                      : 'default'
                  }
                  className="text-[10px]"
                >
                  {t.status === 'approved' && (isAr ? 'معتمد' : 'Approved')}
                  {t.status === 'pending' && (isAr ? 'قيد المراجعة' : 'Pending')}
                  {t.status === 'rejected' && (isAr ? 'مرفوض' : 'Rejected')}
                </Badge>
              </div>

              <p className="text-xs text-[#D1D1D1] italic line-clamp-3 mb-4">
                "{isAr ? t.content_ar : t.content_en}"
              </p>

              <div>
                <h4 className="font-bold text-sm text-[#F5F5F5]">
                  {isAr ? t.client_name_ar : t.client_name_en}
                </h4>
                <span className="text-[11px] text-[#9B9B9B]">
                  {isAr ? t.profession_ar : t.profession_en}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-5 pt-3 border-t border-[#1C1C1C]">
              <div className="flex items-center gap-1.5">
                {t.status !== 'approved' && (
                  <button
                    onClick={() => updateStatus(t.id, 'approved')}
                    className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10"
                    title={isAr ? 'اعتماد' : 'Approve'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                {t.status !== 'rejected' && (
                  <button
                    onClick={() => updateStatus(t.id, 'rejected')}
                    className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10"
                    title={isAr ? 'رفض' : 'Reject'}
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                onClick={() => handleDelete(t)}
                className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}

        {!loading && testimonials.length === 0 && (
          <div className="col-span-full p-12 text-center text-sm text-[#777] border border-dashed border-[#242424] rounded-2xl">
            {isAr ? 'لا توجد آراء مسجلة بعد.' : 'No testimonials found.'}
          </div>
        )}
      </div>
      )}

      {showModal && editingItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="bg-[#0B0B0B] border-[#242424] w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-4">
              {isAr ? 'إضافة رأي عميل' : 'Add Testimonial'}
            </h3>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs text-[#B3B3B3] mb-1">{isAr ? 'اسم العميل' : 'Client Name'}</label>
                <input
                  type="text"
                  required
                  value={editingItem.client_name_ar || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, client_name_ar: e.target.value })}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#B3B3B3] mb-1">{isAr ? 'المسمى / الوظيفة' : 'Profession'}</label>
                <input
                  type="text"
                  value={editingItem.profession_ar || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, profession_ar: e.target.value })}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <MediaUploader
                label={isAr ? 'صورة العميل (اختياري)' : 'Client Avatar (Optional)'}
                folder="testimonials"
                mediaType="image"
                currentUrl={editingItem.avatar_url || undefined}
                onUploadComplete={(url) => setEditingItem({ ...editingItem, avatar_url: url })}
                onRemove={() => setEditingItem({ ...editingItem, avatar_url: null })}
              />

              <div>
                <label className="block text-xs text-[#B3B3B3] mb-1">{isAr ? 'نص الرأي / التقييم' : 'Review Text'}</label>
                <textarea
                  rows={3}
                  required
                  value={editingItem.content_ar || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, content_ar: e.target.value })}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowModal(false)}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={saving}>
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
