import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { PublicLayout } from '@/layouts/PublicLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { HomePage } from '@/pages/public/HomePage'
import { WorkDetailPage } from '@/pages/public/WorkDetailPage'
import { LoginPage } from '@/pages/public/LoginPage'

import { DashboardOverviewPage } from '@/pages/dashboard/DashboardOverviewPage'
import { ProfileManagerPage } from '@/pages/dashboard/ProfileManagerPage'
import { ClientsManagerPage } from '@/pages/dashboard/ClientsManagerPage'
import { PagesManagerPage } from '@/pages/dashboard/PagesManagerPage'
import { WorksManagerPage } from '@/pages/dashboard/WorksManagerPage'
import { CategoriesManagerPage } from '@/pages/dashboard/CategoriesManagerPage'
import { TestimonialsManagerPage } from '@/pages/dashboard/TestimonialsManagerPage'
import { LinksManagerPage } from '@/pages/dashboard/LinksManagerPage'
import { SettingsManagerPage } from '@/pages/dashboard/SettingsManagerPage'

// Protected Route Guard for CMS Dashboard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B51D19] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // During development or when authenticated, allow access; redirect to login if session missing
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/work/:id" element={<WorkDetailPage />} />
      </Route>

      {/* Authentication */}
      <Route path="/login" element={<LoginPage />} />

      {/* Admin CMS Dashboard Routes (Protected) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardOverviewPage />} />
        <Route path="profile" element={<ProfileManagerPage />} />
        <Route path="clients" element={<ClientsManagerPage />} />
        <Route path="pages" element={<PagesManagerPage />} />
        <Route path="works" element={<WorksManagerPage />} />
        <Route path="works/categories" element={<CategoriesManagerPage />} />
        <Route path="testimonials" element={<TestimonialsManagerPage />} />
        <Route path="links" element={<LinksManagerPage />} />
        <Route path="settings" element={<SettingsManagerPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
