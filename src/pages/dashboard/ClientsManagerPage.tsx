import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Edit2, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Client } from '@/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MediaUploader } from '@/components/media/MediaUploader'
import { deleteStorageMedia } from '@/services/storageService'
import { dataSync } from '@/services/dataSync'

export const ClientsManagerPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null)
  const [originalLogoUrl, setOriginalLogoUrl] = useState<string | null>(null)

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('sort_order', { ascending: true })
      if (!error && data) {
        setClients(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client)
      setOriginalLogoUrl(client.logo_url || null)
    } else {
      setEditingClient({
        name_ar: '',
        name_en: '',
        profession_ar: '',
        profession_en: '',
        work_description_ar: '',
        work_description_en: '',
        logo_url: null,
        is_visible: true,
        sort_order: clients.length + 1,
      })
      setOriginalLogoUrl(null)
    }
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient) return

    try {
      if (editingClient.id) {
        const { error } = await supabase.from('clients').update(editingClient).eq('id', editingClient.id)
        if (error) throw error

        // Safe cleanup: delete old logo if changed
        if (originalLogoUrl && originalLogoUrl !== editingClient.logo_url) {
          deleteStorageMedia(originalLogoUrl).catch((err) =>
            console.warn('Failed to cleanup old client logo:', err)
          )
        }
      } else {
        const { error } = await supabase.from('clients').insert([editingClient])
        if (error) throw error
      }

      // Immediate local sync
      dataSync.emit('clients.updated')

      setShowModal(false)
      setEditingClient(null)
      fetchClients()
    } catch (err) {
      console.error('Error saving client:', err)
    }
  }

  const handleDelete = async (client: Client) => {
    if (
      confirm(
        isAr ? 'هل أنت متأكد من حذف هذا العميل؟' : 'Are you sure you want to delete this client?'
      )
    ) {
      try {
        const { error } = await supabase.from('clients').delete().eq('id', client.id)
        if (error) throw error

        if (client.logo_url) {
          deleteStorageMedia(client.logo_url).catch((err) =>
            console.warn('Failed to cleanup client logo from storage:', err)
          )
        }

        dataSync.emit('clients.updated')
        fetchClients()
      } catch (err) {
        console.error('Error deleting client:', err)
      }
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F5F5F5]">
            {isAr ? 'العملاء والشركاء' : 'Clients & Partners'}
          </h2>
          <p className="text-xs text-[#9B9B9B] mt-0.5">
            {isAr
              ? 'إدارة قائمة العملاء والشعارات وشراكات النجاح'
              : 'Manage client list, logos, and strategic collaborations'}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => openModal()}
        >
          {isAr ? 'إضافة عميل جديد' : 'Add Client'}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-[#0B0B0B] border-[#242424] p-5 space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#181818]" />
                <div className="w-14 h-5 rounded-full bg-[#181818]" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-[#1F1F1F] rounded w-2/3" />
                <div className="h-3 bg-[#181818] rounded w-1/3" />
              </div>
              <div className="h-3 bg-[#181818] rounded w-full" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card key={client.id} className="bg-[#0B0B0B] border-[#242424] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-[#151515] border border-[#242424] flex items-center justify-center overflow-hidden text-[#8B5CF6]">
                    {client.logo_url ? (
                      <img src={client.logo_url} alt={client.name_ar} className="w-full h-full object-contain p-1" />
                    ) : (
                      <Building2 className="w-6 h-6" />
                    )}
                  </div>
                  <Badge variant={client.is_visible ? 'accent' : 'default'}>
                    {client.is_visible ? (isAr ? 'ظاهر' : 'Visible') : (isAr ? 'مخفي' : 'Hidden')}
                  </Badge>
                </div>

                <h4 className="font-bold text-[#F5F5F5] text-base">
                  {isAr ? client.name_ar : client.name_en}
                </h4>
                <p className="text-xs text-[#9B9B9B] mt-1">
                  {isAr ? client.profession_ar : client.profession_en}
                </p>
                {(client.work_description_ar || client.work_description_en) && (
                  <p className="text-xs text-[#8B5CF6]/90 mt-2.5 bg-[#8B5CF6]/5 px-2.5 py-1.5 rounded-lg border border-[#8B5CF6]/20 line-clamp-2">
                    <span className="font-medium text-[#F5F5F5]">{isAr ? 'الأعمال: ' : 'Delivered: '}</span>
                    {isAr ? (client.work_description_ar || client.work_description_en) : (client.work_description_en || client.work_description_ar)}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-[#1C1C1C]">
                <button
                  onClick={() => openModal(client)}
                  className="p-1.5 rounded-lg text-[#9B9B9B] hover:text-white hover:bg-[#1A1A1A] transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(client)}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}

          {!loading && clients.length === 0 && (
            <div className="col-span-full p-12 text-center text-sm text-[#777] border border-dashed border-[#242424] rounded-2xl">
              {isAr ? 'لا يوجد عملاء مضافين بعد.' : 'No clients added yet.'}
            </div>
          )}
        </div>
      )}

      {/* Modal Dialog */}
      {showModal && editingClient && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="bg-[#0B0B0B] border-[#242424] w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#F5F5F5] mb-4">
              {editingClient.id ? (isAr ? 'تعديل عميل' : 'Edit Client') : (isAr ? 'إضافة عميل جديد' : 'New Client')}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Client Logo Upload */}
              <div>
                <MediaUploader
                  value={editingClient.logo_url}
                  onChange={(newUrl) => setEditingClient((prev) => ({ ...prev, logo_url: newUrl }))}
                  folder="clients"
                  mediaType="image"
                  label={isAr ? 'شعار / صورة العميل (Client Logo)' : 'Client Logo'}
                  isAr={isAr}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                  {isAr ? 'اسم العميل (بالعربية)' : 'Client Name (Arabic)'}
                </label>
                <input
                  type="text"
                  required
                  value={editingClient.name_ar || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, name_ar: e.target.value })}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                  {isAr ? 'اسم العميل (بالإنجليزية)' : 'Client Name (English)'}
                </label>
                <input
                  type="text"
                  required
                  value={editingClient.name_en || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, name_en: e.target.value })}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                  {isAr ? 'التخصص أو المجال (بالعربية)' : 'Profession / Industry (Arabic)'}
                </label>
                <input
                  type="text"
                  value={editingClient.profession_ar || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, profession_ar: e.target.value })}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                  {isAr ? 'التخصص أو المجال (بالإنجليزية)' : 'Profession / Industry (English)'}
                </label>
                <input
                  type="text"
                  value={editingClient.profession_en || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, profession_en: e.target.value })}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                  {isAr ? 'الأعمال والخدمات المنفذة للعميل (بالعربية)' : 'Work Done With Client (Arabic)'}
                </label>
                <textarea
                  rows={2}
                  value={editingClient.work_description_ar || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, work_description_ar: e.target.value })}
                  placeholder={isAr ? 'مثال: إدارة حملات تسويقية، صناعة فيديو بالذكاء الاصطناعي...' : 'e.g. Social Media Management, AI Video Production...'}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#8B5CF6] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                  {isAr ? 'الأعمال والخدمات المنفذة للعميل (بالإنجليزية)' : 'Work Done With Client (English)'}
                </label>
                <textarea
                  rows={2}
                  value={editingClient.work_description_en || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, work_description_en: e.target.value })}
                  placeholder="e.g. Social Media Management, AI Video Production..."
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#8B5CF6] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="clientVisible"
                  checked={editingClient.is_visible ?? true}
                  onChange={(e) => setEditingClient({ ...editingClient, is_visible: e.target.checked })}
                  className="rounded border-[#303030] text-[#8B5CF6] focus:ring-[#8B5CF6]"
                />
                <label htmlFor="clientVisible" className="text-xs text-[#D1D1D1]">
                  {isAr ? 'إظهار هذا العميل في الموقع العام' : 'Show on public website'}
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1F1F1F]">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" variant="primary">
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
