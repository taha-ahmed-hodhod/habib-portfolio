import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Film,
  Building2,
  Layers,
  MessageSquareQuote,
  Plus,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export const DashboardOverviewPage: React.FC = () => {
  const { i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  const [stats, setStats] = useState({
    works: 0,
    clients: 0,
    pages: 0,
    testimonials: 0,
    pendingTestimonials: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const [
          { count: worksCount },
          { count: clientsCount },
          { count: pagesCount },
          { count: testimonialsCount },
          { count: pendingTestimonialsCount },
        ] = await Promise.all([
          supabase.from('works').select('*', { count: 'exact', head: true }),
          supabase.from('clients').select('*', { count: 'exact', head: true }),
          supabase.from('portfolio_pages').select('*', { count: 'exact', head: true }),
          supabase.from('testimonials').select('*', { count: 'exact', head: true }),
          supabase.from('testimonials').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        ])

        setStats({
          works: worksCount || 0,
          clients: clientsCount || 0,
          pages: pagesCount || 0,
          testimonials: testimonialsCount || 0,
          pendingTestimonials: pendingTestimonialsCount || 0,
        })
      } catch (err) {
        console.error('Error fetching dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const statCards = [
    {
      title: isAr ? 'إجمالي الأعمال' : 'Total Works',
      value: stats.works,
      icon: Film,
      href: '/dashboard/works',
      color: 'from-[#8B5CF6]/20 to-[#6D28D9]/5',
      border: 'border-[#8B5CF6]/30',
      badge: isAr ? 'فيديو وصور' : 'Videos & Images',
    },
    {
      title: isAr ? 'العملاء والشركاء' : 'Clients & Brands',
      value: stats.clients,
      icon: Building2,
      href: '/dashboard/clients',
      color: 'from-blue-500/20 to-blue-600/5',
      border: 'border-blue-500/30',
      badge: isAr ? 'شركاء نجاح' : 'Partners',
    },
    {
      title: isAr ? 'الصفحات والمنصات' : 'Pages / Brands',
      value: stats.pages,
      icon: Layers,
      href: '/dashboard/pages',
      color: 'from-emerald-500/20 to-emerald-600/5',
      border: 'border-emerald-500/30',
      badge: isAr ? 'منصات رقمية' : 'Platforms',
    },
    {
      title: isAr ? 'آراء العملاء' : 'Testimonials',
      value: stats.testimonials,
      icon: MessageSquareQuote,
      href: '/dashboard/testimonials',
      color: 'from-amber-500/20 to-amber-600/5',
      border: 'border-amber-500/30',
      badge:
        stats.pendingTestimonials > 0
          ? `${stats.pendingTestimonials} ${isAr ? 'قيد المراجعة' : 'Pending'}`
          : isAr ? 'معتمد' : 'Approved',
    },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#121212] via-[#0E0E0E] to-[#141414] border border-[#242424] p-6 sm:p-8">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="accent">
                <TrendingUp className="w-3 h-3" />
                <span>Habib Portfolio Mangement</span>
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#F5F5F5]">
              {isAr ? 'مرحباً بك يا حبيب الرحمن 👋' : 'Welcome, Habib Al-Rahman 👋'}
            </h2>
            <p className="text-sm text-[#9B9B9B] mt-1 max-w-2xl">
              {isAr
                ? 'تحكم في كافة محتويات معرض أعمالك الشخصي؛ أضف فيديوهات وأعمال جديدة، عدّل العملاء والصفحات، وتحكم في ترتيب الأقسام فوراً دون كتابة سطر كود.'
                : 'Manage your portfolio content in real-time. Add works, update clients and brands, and control section visibility seamlessly.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/dashboard/works">
              <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />}>
                {isAr ? 'إضافة عمل جديد' : 'New Work'}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.title} to={card.href} className="group">
            <Card
              className={`h-full bg-gradient-to-br ${card.color} border-[#242424] group-hover:${card.border} transition-all duration-300`}
            >
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-[#141414] border border-[#242424]">
                  <card.icon className="w-5 h-5 text-[#F5F5F5]" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#777] group-hover:text-white transition-colors" />
              </div>

              <div className="mt-4">
                <span className="text-3xl font-extrabold text-[#F5F5F5] block">
                  {loading ? '...' : card.value}
                </span>
                <span className="text-xs font-medium text-[#9B9B9B] mt-1 block">
                  {card.title}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1F1F1F]">
                <Badge variant="outline" className="text-[11px]">
                  {card.badge}
                </Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Access Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#0B0B0B] border-[#242424]">
          <h3 className="text-base font-bold text-[#F5F5F5] mb-4">
            {isAr ? 'إجراءات سريعة' : 'Quick Actions'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/dashboard/profile" className="p-3 rounded-xl bg-[#121212] border border-[#202020] hover:border-[#8B5CF6]/40 hover:bg-[#181818] transition-all text-xs font-semibold text-[#D1D1D1] flex items-center justify-between">
              <span>{isAr ? 'تعديل البروفايل والإحصائيات' : 'Edit Profile & Stats'}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#8B5CF6]" />
            </Link>
            <Link to="/dashboard/clients" className="p-3 rounded-xl bg-[#121212] border border-[#202020] hover:border-[#8B5CF6]/40 hover:bg-[#181818] transition-all text-xs font-semibold text-[#D1D1D1] flex items-center justify-between">
              <span>{isAr ? 'إدارة العملاء والشركاء' : 'Manage Clients'}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#8B5CF6]" />
            </Link>
            <Link to="/dashboard/pages" className="p-3 rounded-xl bg-[#121212] border border-[#202020] hover:border-[#8B5CF6]/40 hover:bg-[#181818] transition-all text-xs font-semibold text-[#D1D1D1] flex items-center justify-between">
              <span>{isAr ? 'إدارة صفحات وعلامات حبيب' : 'Manage Pages & Brands'}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#8B5CF6]" />
            </Link>
            <Link to="/dashboard/settings" className="p-3 rounded-xl bg-[#121212] border border-[#202020] hover:border-[#8B5CF6]/40 hover:bg-[#181818] transition-all text-xs font-semibold text-[#D1D1D1] flex items-center justify-between">
              <span>{isAr ? 'ترتيب وظهور الأقسام' : 'Section Order & Visibility'}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#8B5CF6]" />
            </Link>
          </div>
        </Card>

        <Card className="bg-[#0B0B0B] border-[#242424]">
          <h3 className="text-base font-bold text-[#F5F5F5] mb-4">
            {isAr ? 'حالة التخزين والاتصال' : 'System & Connection Status'}
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#121212] border border-[#202020]">
              <span className="text-[#9B9B9B]">{isAr ? 'قاعدة بيانات Supabase' : 'Supabase Database'}</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {isAr ? 'متصل' : 'Connected'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#121212] border border-[#202020]">
              <span className="text-[#9B9B9B]">{isAr ? 'سلة الوسائط (Storage)' : 'Storage Bucket'}</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                portfolio-media
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#121212] border border-[#202020]">
              <span className="text-[#9B9B9B]">{isAr ? 'نظام الحماية (RLS)' : 'RLS Security'}</span>
              <span className="text-purple-400 font-semibold">{isAr ? 'مفعّل بالكامل' : 'Enabled'}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
