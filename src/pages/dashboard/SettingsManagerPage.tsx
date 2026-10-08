import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Save, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { SiteSettings } from '@/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { dataSync } from '@/services/dataSync'

export const SettingsManagerPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  const [settings, setSettings] = useState<Partial<SiteSettings>>({
    hero_visible: true,
    clients_visible: true,
    pages_visible: true,
    works_visible: true,
    testimonials_visible: true,
    testimonials_cta_visible: true,
    testimonials_limit: 6,
    section_order: ['hero', 'clients', 'pages', 'works', 'testimonials'],
  })
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState(false)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase.from('site_settings').select('*').limit(1).single()
        if (!error && data) {
          setSettings(data)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg(false)

    try {
      const { data: existing } = await supabase.from('site_settings').select('id').limit(1).single()

      if (existing?.id) {
        await supabase.from('site_settings').update({
          ...settings,
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id)
      } else {
        await supabase.from('site_settings').insert([settings])
      }

      dataSync.emit('site_settings.updated')
      setSuccessMsg(true)
      setTimeout(() => setSuccessMsg(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const toggleVisibility = (key: keyof SiteSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const sectionsList = [
    { key: 'hero_visible' as const, label: isAr ? 'قسم الواجهة الرئيسية (Hero)' : 'Hero Section' },
    { key: 'works_visible' as const, label: isAr ? 'معرض الأعمال المميزة (Works)' : 'Works Section' },
    { key: 'clients_visible' as const, label: isAr ? 'قسم العملاء والشركاء (Clients)' : 'Clients Section' },
    { key: 'pages_visible' as const, label: isAr ? 'قسم الصفحات والعلامات (Pages / Habib AI)' : 'Pages / Brands Section' },
    { key: 'testimonials_visible' as const, label: isAr ? 'قسم آراء العملاء (Testimonials)' : 'Testimonials Section' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F5F5F5]">
            {isAr ? 'إعدادات وظهور أقسام الموقع' : 'Homepage Section Settings'}
          </h2>
          <p className="text-xs text-[#9B9B9B] mt-0.5">
            {isAr ? 'التحكم في تفعيل أو إخفاء أقسام الموقع العام وترتيبها' : 'Control homepage section visibility and limits'}
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{isAr ? 'تم حفظ الإعدادات بنجاح!' : 'Settings updated successfully!'}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="bg-[#0B0B0B] border-[#242424] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[#8B5CF6] uppercase tracking-wider">
            {isAr ? 'ظهور الأقسام في الصفحة الرئيسية' : 'Section Visibility'}
          </h3>

          <div className="space-y-3">
            {sectionsList.map((sec) => {
              const isVis = settings[sec.key] !== false
              return (
                <div
                  key={sec.key}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#121212] border border-[#202020]"
                >
                  <span className="text-sm font-medium text-[#F5F5F5]">{sec.label}</span>
                  <button
                    type="button"
                    onClick={() => toggleVisibility(sec.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isVis
                        ? 'bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40'
                        : 'bg-[#1F1F1F] text-[#777] border border-[#2E2E2E]'
                    }`}
                  >
                    {isVis ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{isVis ? (isAr ? 'مفعل' : 'Active') : (isAr ? 'معطل' : 'Hidden')}</span>
                  </button>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="bg-[#0B0B0B] border-[#242424] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[#8B5CF6] uppercase tracking-wider">
            {isAr ? 'إعدادات قسم الآراء والتقييمات' : 'Testimonials Preferences'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                {isAr ? 'الحد الأقصى لعدد الآراء المعروضة' : 'Testimonials Display Limit'}
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.testimonials_limit ?? 6}
                onChange={(e) =>
                  setSettings({ ...settings, testimonials_limit: parseInt(e.target.value) || 6 })
                }
                className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="ctaReview"
                checked={settings.testimonials_cta_visible ?? true}
                onChange={(e) =>
                  setSettings({ ...settings, testimonials_cta_visible: e.target.checked })
                }
                className="rounded border-[#303030] text-[#8B5CF6]"
              />
              <label htmlFor="ctaReview" className="text-xs text-[#D1D1D1]">
                {isAr ? 'إظهار زر "شاركنا رأيك" للزوار' : 'Show "Leave a Review" button to visitors'}
              </label>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={saving}
            icon={<Save className="w-4 h-4" />}
          >
            {isAr ? 'حفظ الإعدادات' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  )
}
