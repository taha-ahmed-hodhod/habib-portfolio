import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import {
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  Sliders,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { SiteSettings } from '@/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { dataSync } from '@/services/dataSync'

export const SettingsManagerPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')
  const [searchParams, setSearchParams] = useSearchParams()

  const currentTab = searchParams.get('tab') === 'security' ? 'security' : 'sections'
  const [activeTab, setActiveTab] = useState<'sections' | 'security'>(currentTab)

  // Sync tab with URL
  const handleTabChange = (tab: 'sections' | 'security') => {
    setActiveTab(tab)
    setSearchParams(tab === 'security' ? { tab: 'security' } : {})
  }

  // --- Site Settings State ---
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
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState(false)

  // --- Password & Account State ---
  const [userEmail, setUserEmail] = useState<string>('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [settingsRes, userRes] = await Promise.all([
          supabase.from('site_settings').select('*').limit(1).single(),
          supabase.auth.getUser(),
        ])

        if (settingsRes.data && !settingsRes.error) {
          setSettings(settingsRes.data)
        }
        if (userRes.data?.user?.email) {
          setUserEmail(userRes.data.user.email)
        }
      } catch (err) {
        console.error('Error fetching settings or user:', err)
      }
    }
    loadData()
  }, [])

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    setSettingsSuccessMsg(false)

    try {
      const { data: existing } = await supabase.from('site_settings').select('id').limit(1).single()

      if (existing?.id) {
        await supabase
          .from('site_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      } else {
        await supabase.from('site_settings').insert([settings])
      }

      dataSync.emit('site_settings.updated')
      setSettingsSuccessMsg(true)
      setTimeout(() => setSettingsSuccessMsg(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingSettings(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (!newPassword || newPassword.length < 6) {
      setPasswordError(
        isAr
          ? 'يجب أن تتكون كلمة المرور من 6 خانات على الأقل'
          : 'Password must be at least 6 characters long'
      )
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'
      )
      return
    }

    setUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw error
      }

      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 6000)
    } catch (err: unknown) {
      console.error('Password change error:', err)
      const msg = err instanceof Error ? err.message : 'Error changing password'
      setPasswordError(
        isAr ? `تعذر تحديث كلمة المرور: ${msg}` : `Failed to update password: ${msg}`
      )
    } finally {
      setUpdatingPassword(false)
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
    {
      key: 'pages_visible' as const,
      label: isAr ? 'قسم الصفحات والعلامات (Pages / Habib AI)' : 'Pages / Brands Section',
    },
    { key: 'testimonials_visible' as const, label: isAr ? 'قسم آراء العملاء (Testimonials)' : 'Testimonials Section' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#F5F5F5]">
            {isAr ? 'الإعدادات العامة وأمان الحساب' : 'Settings & Account Security'}
          </h2>
          <p className="text-xs text-[#9B9B9B] mt-0.5">
            {isAr
              ? 'التحكم في ظهور أقسام الموقع العام وتغيير كلمة مرور حساب المشرف'
              : 'Control homepage section visibility and administrator account credentials'}
          </p>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex items-center p-1 rounded-xl bg-[#0F0F0F] border border-[#242424] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleTabChange('sections')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sections'
                ? 'bg-[#B51D19] text-white shadow-lg shadow-[#B51D19]/20'
                : 'text-[#9B9B9B] hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isAr ? 'أقسام الموقع' : 'Site Sections'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('security')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'security'
                ? 'bg-[#B51D19] text-white shadow-lg shadow-[#B51D19]/20'
                : 'text-[#9B9B9B] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isAr ? 'أمان الحساب' : 'Account Security'}</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: SITE SECTIONS --- */}
      {activeTab === 'sections' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {settingsSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{isAr ? 'تم حفظ الإعدادات بنجاح!' : 'Settings updated successfully!'}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <Card className="bg-[#0B0B0B] border-[#242424] p-6 space-y-4">
              <h3 className="text-sm font-semibold text-[#E63B32] uppercase tracking-wider">
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
                            ? 'bg-[#B51D19]/20 text-[#E63B32] border border-[#B51D19]/40'
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
              <h3 className="text-sm font-semibold text-[#E63B32] uppercase tracking-wider">
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
                    className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#B51D19]"
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
                    className="rounded border-[#303030] text-[#B51D19] accent-[#B51D19]"
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
                isLoading={savingSettings}
                icon={<Save className="w-4 h-4" />}
              >
                {isAr ? 'حفظ الإعدادات' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* --- TAB 2: ACCOUNT SECURITY & CHANGE PASSWORD --- */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Account Overview Card */}
          <Card className="bg-[#0B0B0B] border-[#242424] p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#B51D19]/15 border border-[#B51D19]/30 flex items-center justify-center text-[#E63B32]">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-[#9B9B9B] block">
                    {isAr ? 'البريد الإلكتروني لحساب المشرف' : 'Administrator Email'}
                  </span>
                  <span className="text-base font-bold text-white tracking-wide">
                    {userEmail || 'hb202065@gmail.com'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{isAr ? 'حساب نشط ومحمي بـ RLS' : 'Active & Secured by RLS'}</span>
              </div>
            </div>
          </Card>

          {/* Change Password Form Card */}
          <Card className="bg-[#0B0B0B] border-[#242424] p-6 space-y-6">
            <div className="flex items-start gap-3 border-b border-[#1C1C1C] pb-4">
              <div className="w-9 h-9 rounded-xl bg-[#141414] border border-[#242424] flex items-center justify-center text-[#E63B32] shrink-0 mt-0.5">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
                </h3>
                <p className="text-xs text-[#9B9B9B] mt-0.5">
                  {isAr
                    ? 'أدخل كلمة المرور الجديدة لحسابك. يجب أن تتكون من 6 خانات على الأقل.'
                    : 'Enter a new password for your account. It must be at least 6 characters long.'}
                </p>
              </div>
            </div>

            {/* Error Message Alert */}
            {passwordError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {/* Success Message Alert */}
            {passwordSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {isAr
                    ? 'تم تحديث كلمة المرور بنجاح! يمكنك الآن استخدامها في تسجيل الدخول القادم.'
                    : 'Password updated successfully! You can now use it on your next login.'}
                </span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
              {/* New Password Field */}
              <div>
                <label className="block text-xs font-semibold text-[#D1D1D1] mb-1.5">
                  {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 pr-11 text-sm text-white focus:outline-none focus:border-[#B51D19] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#707070] hover:text-[#D1D1D1] transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-xs font-semibold text-[#D1D1D1] mb-1.5">
                  {isAr ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 pr-11 text-sm text-white focus:outline-none focus:border-[#B51D19] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#707070] hover:text-[#D1D1D1] transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={updatingPassword}
                  icon={<Lock className="w-4 h-4" />}
                >
                  {isAr ? 'تحديث كلمة المرور' : 'Update Password'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}

