import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  User,
  Building2,
  Layers,
  Film,
  FolderTree,
  MessageSquareQuote,
  Link2,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Globe,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/hooks/useProfile'

export const DashboardLayout: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { profile } = useProfile()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isAr = i18n.language.startsWith('ar')

  const toggleLanguage = () => {
    const nextLang = isAr ? 'en' : 'ar'
    i18n.changeLanguage(nextLang)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { label: isAr ? 'نظرة عامة' : 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: isAr ? 'الملف الشخصي' : 'Profile', path: '/dashboard/profile', icon: User },
    { label: isAr ? 'العملاء والشركاء' : 'Clients', path: '/dashboard/clients', icon: Building2 },
    { label: isAr ? 'الصفحات والعلامات' : 'Pages / Brands', path: '/dashboard/pages', icon: Layers },
    { label: isAr ? 'الأعمال والمشاريع' : 'Works', path: '/dashboard/works', icon: Film },
    { label: isAr ? 'التصنيفات' : 'Categories', path: '/dashboard/works/categories', icon: FolderTree },
    { label: isAr ? 'آراء العملاء' : 'Testimonials', path: '/dashboard/testimonials', icon: MessageSquareQuote },
    { label: isAr ? 'الروابط الديناميكية' : 'Dynamic Links', path: '/dashboard/links', icon: Link2 },
    { label: isAr ? 'الإعدادات والأمان' : 'Settings & Security', path: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 z-50 w-64 bg-[#0B0B0B] border-r border-[#242424] flex flex-col transition-transform duration-300 lg:translate-x-0 ${isAr
            ? sidebarOpen
              ? 'translate-x-0 right-0 border-l border-r-0'
              : 'translate-x-full right-0 lg:translate-x-0 border-l border-r-0'
            : sidebarOpen
              ? 'translate-x-0 left-0'
              : '-translate-x-full left-0 lg:translate-x-0'
          }`}
      >
        {/* Sidebar Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-[#1A1A1A]">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#B51D19] to-[#080707] p-[1px] overflow-hidden">
              <div className="w-full h-full bg-[#0E0E0E] rounded-[11px] overflow-hidden flex items-center justify-center font-bold text-white text-sm">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name_en || 'Habib Portfolio'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>H</span>
                )}
              </div>
            </div>
            <div>
              <span className="font-bold text-sm text-[#F5F5F5] block">Habib Portfolio</span>
              <span className="text-[10px] text-[#E63B32] font-medium tracking-wide">CMS DASHBOARD</span>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[#9B9B9B] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                  ? 'bg-[#B51D19]/15 text-[#E63B32] border border-[#B51D19]/30 shadow-sm'
                  : 'text-[#9B9B9B] hover:text-[#F5F5F5] hover:bg-[#141414]'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#1A1A1A] space-y-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-[#9B9B9B] hover:text-[#F5F5F5] hover:bg-[#141414] transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-[#E63B32]" />
              {isAr ? 'عرض الموقع العام' : 'View Public Site'}
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${isAr ? 'lg:mr-64' : 'lg:ml-64'}`}>
        {/* Top Navbar */}
        <header className="h-20 bg-[#080808]/80 backdrop-blur-md border-b border-[#242424] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-[#242424] bg-[#0E0E0E] text-[#9B9B9B] hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-[#F5F5F5]">
              {isAr ? 'إدارة المحتوى والبورتفوليو' : 'Portfolio Management'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#242424] bg-[#0E0E0E] hover:bg-[#181818] text-xs font-semibold text-[#9B9B9B] hover:text-white transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-[#E63B32]" />
              <span>{isAr ? 'English' : 'العربية'}</span>
            </button>

            <Link
              to="/dashboard/settings?tab=security"
              title={isAr ? 'أمان الحساب وتغيير كلمة المرور' : 'Account Security & Password'}
              className="flex items-center gap-2.5 pl-2 border-l border-[#242424] hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-[#181818] border border-[#303030] flex items-center justify-center text-xs font-bold text-[#E63B32]">
                H
              </div>
              <span className="text-xs font-medium text-[#D1D1D1] hidden sm:block">
                Habib Al-Rahman
              </span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 bg-[#050505] overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
