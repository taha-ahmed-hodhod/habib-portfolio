import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Edit2, Building2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Client, SocialLink } from '@/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MediaUploader } from '@/components/media/MediaUploader'
import { deleteStorageMedia } from '@/services/storageService'
import { dataSync } from '@/services/dataSync'
import { EntityLinksEditor, renderPlatformIcon } from '@/components/shared/EntityLinksEditor'
import { getEntityLinks, saveEntityLinks, getAllClientLinks } from '@/services/linksService'

export const ClientsManagerPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  const [clients, setClients] = useState<Client[]>([])
  const [clientLinksMap, setClientLinksMap] = useState<Record<string, SocialLink[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null)
  const [originalLogoUrl, setOriginalLogoUrl] = useState<string | null>(null)
  const [clientLinks, setClientLinks] = useState<Partial<SocialLink>[]>([])

  const fetchClients = async () => {
    try {
      const [clientsRes, linksRes] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .order('sort_order', { ascending: true }),
        getAllClientLinks(true),
      ])

      if (!clientsRes.error && clientsRes.data) {
        setClients(clientsRes.data)
      }
      setClientLinksMap(linksRes)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const openModal = async (client?: Client) => {
    setErrorMessage(null)
    if (client) {
      setEditingClient(client)
      setOriginalLogoUrl(client.logo_url || null)
      const links = await getEntityLinks('client', client.id, true)
      setClientLinks(links)
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
      setClientLinks([])
    }
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient) return

    setSaving(true)
    setErrorMessage(null)

    try {
      let clientId = editingClient.id

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
        const { data, error } = await supabase.from('clients').insert([editingClient]).select('id').single()
        if (error) throw error
        clientId = data.id
      }

      // Save dynamic client social links
      if (clientId) {
        await saveEntityLinks('client', clientId, clientLinks)
      }

      // Immediate local sync
      dataSync.emit('clients.updated')
      dataSync.emit('links.updated')

      setShowModal(false)
      setEditingClient(null)
      setOriginalLogoUrl(null)
      setClientLinks([])
      fetchClients()
    } catch (err: unknown) {
      console.error('Error saving client:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Error saving client')
    } finally {
      setSaving(false)
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

        // Also cleanup associated social links
        await supabase.from('social_links').delete().eq('owner_type', 'client').eq('owner_id', client.id)

        if (client.logo_url) {
          deleteStorageMedia(client.logo_url).catch((err) =>
            console.warn('Failed to cleanup client logo from storage:', err)
          )
        }

        dataSync.emit('clients.updated')
        dataSync.emit('links.updated')
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
                  <div className="w-12 h-12 rounded-xl bg-[#151515] border border-[#242424] flex items-center justify-center overflow-hidden text-[#E63B32]">
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
                  <p className="text-xs text-[#E63B32] mt-2.5 bg-[#B51D19]/10 px-2.5 py-1.5 rounded-lg border border-[#B51D19]/25 line-clamp-2">
                    <span className="font-medium text-[#F5F5F5]">{isAr ? 'الأعمال: ' : 'Delivered: '}</span>
                    {isAr ? (client.work_description_ar || client.work_description_en) : (client.work_description_en || client.work_description_ar)}
                  </p>
                )}

                {clientLinksMap[client.id] && clientLinksMap[client.id].length > 0 && (
                  <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[#1C1C1C] flex-wrap">
                    {clientLinksMap[client.id].map((l) => (
                      <span
                        key={l.id}
                        title={(isAr ? l.label_ar : l.label_en) || l.platform}
                        className="w-6 h-6 rounded-md bg-[#161616] border border-[#242424] flex items-center justify-center text-[#9B9B9B]"
                      >
                        {renderPlatformIcon(l.icon || l.platform || l.label_en)}
                      </span>
                    ))}
                  </div>
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

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

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
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#B51D19]"
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
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#B51D19]"
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
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#B51D19]"
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
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#B51D19]"
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
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#B51D19] resize-none"
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
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#B51D19] resize-none"
                />
              </div>

              {/* Dynamic Social Media Links for Client */}
              <div className="pt-2 border-t border-[#1F1F1F]">
                <EntityLinksEditor
                  links={clientLinks}
                  onChange={setClientLinks}
                  isAr={isAr}
                  title={isAr ? 'روابط التواصل الاجتماعي وموقع العميل' : 'Client Social Media & Web Links'}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="clientVisible"
                  checked={editingClient.is_visible ?? true}
                  onChange={(e) => setEditingClient({ ...editingClient, is_visible: e.target.checked })}
                  className="rounded border-[#303030] text-[#B51D19] focus:ring-[#B51D19] accent-[#B51D19]"
                />
                <label htmlFor="clientVisible" className="text-xs text-[#D1D1D1]">
                  {isAr ? 'إظهار هذا العميل في الموقع العام' : 'Show on public website'}
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
