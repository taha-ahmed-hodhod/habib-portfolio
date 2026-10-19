import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Edit2, FolderTree } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { dataSync } from '@/services/dataSync'

export const CategoriesManagerPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCat, setEditingCat] = useState<Partial<Category> | null>(null)

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
      if (data && !error) setCategories(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCat) return

    const slug = editingCat.slug || editingCat.name_en?.toLowerCase().replace(/\s+/g, '-') || 'cat-' + Date.now()

    if (editingCat.id) {
      await supabase.from('categories').update({ ...editingCat, slug }).eq('id', editingCat.id)
    } else {
      await supabase.from('categories').insert([{ ...editingCat, slug }])
    }

    dataSync.emit('categories.updated')
    setShowModal(false)
    setEditingCat(null)
    fetchCategories()
  }

  const handleDelete = async (id: string) => {
    if (confirm(isAr ? 'حذف هذا التصنيف؟' : 'Delete this category?')) {
      await supabase.from('categories').delete().eq('id', id)
      dataSync.emit('categories.updated')
      fetchCategories()
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F5F5F5]">
            {isAr ? 'تصنيفات الأعمال' : 'Work Categories'}
          </h2>
          <p className="text-xs text-[#9B9B9B] mt-0.5">
            {isAr ? 'إدارة تصنيفات وتصفية معرض الأعمال ديناميكياً' : 'Manage dynamic category filters for works'}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setEditingCat({
              name_ar: '',
              name_en: '',
              slug: '',
              sort_order: categories.length + 1,
              is_visible: true,
            })
            setShowModal(true)
          }}
        >
          {isAr ? 'إضافة تصنيف' : 'Add Category'}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-[#0B0B0B] border-[#242424] p-5 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#181818]" />
                <div className="space-y-1.5">
                  <div className="h-4 bg-[#1F1F1F] rounded w-24" />
                  <div className="h-2.5 bg-[#181818] rounded w-16" />
                </div>
              </div>
              <div className="w-12 h-6 rounded-lg bg-[#181818]" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((c) => (
            <Card key={c.id} className="bg-[#0B0B0B] border-[#242424] p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#151515] border border-[#242424] flex items-center justify-center text-[#E63B32]">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#F5F5F5]">
                    {isAr ? c.name_ar : c.name_en}
                  </h4>
                  <span className="text-[10px] text-[#777] block font-mono">{c.slug}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setEditingCat(c)
                    setShowModal(true)
                  }}
                  className="p-1.5 rounded-lg text-[#9B9B9B] hover:text-white hover:bg-[#1A1A1A]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}

          {!loading && categories.length === 0 && (
            <div className="col-span-full p-8 text-center text-xs text-[#777] border border-dashed border-[#242424] rounded-xl">
              {isAr ? 'لا توجد تصنيفات مضافة بعد.' : 'No categories found.'}
            </div>
          )}
        </div>
      )}

      {showModal && editingCat && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="bg-[#0B0B0B] border-[#242424] w-full max-w-md p-6">
            <h3 className="text-base font-bold text-white mb-4">
              {editingCat.id ? (isAr ? 'تعديل التصنيف' : 'Edit Category') : (isAr ? 'إضافة تصنيف' : 'New Category')}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs text-[#B3B3B3] mb-1">{isAr ? 'الاسم بالعربية' : 'Name (Arabic)'}</label>
                <input
                  type="text"
                  required
                  value={editingCat.name_ar || ''}
                  onChange={(e) => setEditingCat({ ...editingCat, name_ar: e.target.value })}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#B51D19]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#B3B3B3] mb-1">{isAr ? 'الاسم بالإنجليزية' : 'Name (English)'}</label>
                <input
                  type="text"
                  required
                  value={editingCat.name_en || ''}
                  onChange={(e) => setEditingCat({ ...editingCat, name_en: e.target.value })}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#B51D19]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowModal(false)}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" variant="primary" size="sm">
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
