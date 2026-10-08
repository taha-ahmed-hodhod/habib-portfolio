import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MediaUploader } from '@/components/media/MediaUploader'
import { deleteStorageMedia } from '@/services/storageService'
import { dataSync } from '@/services/dataSync'

export const ProfileManagerPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  const [profile, setProfile] = useState<Partial<Profile>>({
    full_name_ar: 'حبيب الرحمن',
    full_name_en: 'Habib AL-Rahman',
    title_ar: 'خبير التسويق الرقمي وبناء العلامات التجارية',
    title_en: 'Generative AI & Digital Marketing Specialist',
    bio_ar: 'Founder & CEO at Seven B | Generative AI & Digital Marketing Specialist | Media Buying | AI Video • Creative Ads • Automation | Arabic Tutor for non-native speakers',
    bio_en: 'Founder & CEO at Seven B | Generative AI & Digital Marketing Specialist | Media Buying | AI Video • Creative Ads • Automation | Arabic Tutor for non-native speakers',
    avatar_url: null,
    clients_count: 50,
    projects_count: 100,
    experience_years: 5,
  })

  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data, error } = await supabase.from('profiles').select('*').limit(1).single()
        if (data && !error) {
          setProfile(data)
          setOriginalAvatarUrl(data.avatar_url || null)
        }
      } catch (err) {
        console.error('Fetch profile err:', err)
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)

    try {
      const { data: existing } = await supabase.from('profiles').select('id').limit(1).single()

      if (existing?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({
            ...profile,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('profiles').insert([profile])
        if (error) throw error
      }

      // Safe Media Cleanup: Only delete previous avatar if DB update succeeded and avatar was changed/removed
      if (originalAvatarUrl && originalAvatarUrl !== profile.avatar_url) {
        deleteStorageMedia(originalAvatarUrl).catch((err) =>
          console.warn('Failed to cleanup old avatar from storage:', err)
        )
      }
      setOriginalAvatarUrl(profile.avatar_url || null)

      // Emit immediate cross-component update for active SPA session
      dataSync.emit('profile.updated', profile)

      setMsg({
        type: 'success',
        text: isAr ? 'تم حفظ التعديلات بنجاح!' : 'Profile updated successfully!',
      })
    } catch (err: unknown) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error saving profile',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F5F5F5]">
            {isAr ? 'إدارة الملف الشخصي والهوية' : 'Profile & Identity Management'}
          </h2>
          <p className="text-xs text-[#9B9B9B] mt-0.5">
            {isAr
              ? 'تعديل الصورة الشخصية والبيانات الأساسية ونصوص الـ Hero والإحصائيات'
              : 'Edit avatar, hero bio, titles, and live statistics'}
          </p>
        </div>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
            msg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Avatar Upload Card */}
        <Card className="bg-[#0B0B0B] border-[#242424] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[#8B5CF6] uppercase tracking-wider">
            {isAr ? 'الصورة الشخصية (Profile Avatar)' : 'Profile Avatar Image'}
          </h3>

          <MediaUploader
            value={profile.avatar_url}
            onChange={(newUrl) => setProfile((prev) => ({ ...prev, avatar_url: newUrl }))}
            folder="profile"
            mediaType="image"
            isAr={isAr}
            description={
              isAr
                ? 'ارفع صورتك الشخصية بصيغة JPG أو PNG أو WebP (بحد أقصى 10MB)'
                : 'Upload your avatar in JPG, PNG, or WebP format (up to 10MB)'
            }
          />
        </Card>

        {/* Personal Information Card */}
        <Card className="bg-[#0B0B0B] border-[#242424] p-6 space-y-6">
          <h3 className="text-sm font-semibold text-[#8B5CF6] uppercase tracking-wider">
            {isAr ? 'البيانات الشخصية والمسميات' : 'Personal Information & Titles'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                {isAr ? 'الاسم (بالعربية)' : 'Full Name (Arabic)'}
              </label>
              <input
                type="text"
                required
                value={profile.full_name_ar || ''}
                onChange={(e) => setProfile({ ...profile, full_name_ar: e.target.value })}
                className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                {isAr ? 'الاسم (بالإنجليزية)' : 'Full Name (English)'}
              </label>
              <input
                type="text"
                required
                value={profile.full_name_en || ''}
                onChange={(e) => setProfile({ ...profile, full_name_en: e.target.value })}
                className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                {isAr ? 'المسمى الوظيفي (بالعربية)' : 'Job Title (Arabic)'}
              </label>
              <input
                type="text"
                required
                value={profile.title_ar || ''}
                onChange={(e) => setProfile({ ...profile, title_ar: e.target.value })}
                className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                {isAr ? 'المسمى الوظيفي (بالإنجليزية)' : 'Job Title (English)'}
              </label>
              <input
                type="text"
                required
                value={profile.title_en || ''}
                onChange={(e) => setProfile({ ...profile, title_en: e.target.value })}
                className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                {isAr ? 'النبذة التعريفية (بالعربية)' : 'Bio / Tagline (Arabic)'}
              </label>
              <textarea
                rows={4}
                value={profile.bio_ar || ''}
                onChange={(e) => setProfile({ ...profile, bio_ar: e.target.value })}
                className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                {isAr ? 'النبذة التعريفية (بالإنجليزية)' : 'Bio / Tagline (English)'}
              </label>
              <textarea
                rows={4}
                value={profile.bio_en || ''}
                onChange={(e) => setProfile({ ...profile, bio_en: e.target.value })}
                className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
          </div>
        </Card>

        {/* Statistics Card */}
        <Card className="bg-[#0B0B0B] border-[#242424] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[#8B5CF6] uppercase tracking-wider">
            {isAr ? 'الإحصائيات والأرقام' : 'Statistics (Live Counters)'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                {isAr ? 'عدد المشاريع المنفذة' : 'Projects Count'}
              </label>
              <input
                type="number"
                min="0"
                value={profile.projects_count ?? 100}
                onChange={(e) =>
                  setProfile({ ...profile, projects_count: parseInt(e.target.value) || 0 })
                }
                className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                {isAr ? 'عدد العملاء والبراندات' : 'Clients & Brands Count'}
              </label>
              <input
                type="number"
                min="0"
                value={profile.clients_count ?? 50}
                onChange={(e) =>
                  setProfile({ ...profile, clients_count: parseInt(e.target.value) || 0 })
                }
                className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                {isAr ? 'سنوات الخبرة' : 'Years Experience'}
              </label>
              <input
                type="number"
                min="0"
                value={profile.experience_years ?? 5}
                onChange={(e) =>
                  setProfile({ ...profile, experience_years: parseInt(e.target.value) || 0 })
                }
                className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#8B5CF6]"
              />
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
            {isAr ? 'حفظ التعديلات' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
