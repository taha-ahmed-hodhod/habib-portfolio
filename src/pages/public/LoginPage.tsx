import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { AlertCircle, ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

export const LoginPage: React.FC = () => {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const isAr = i18n.language.startsWith('ar')

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard', { replace: true })
      }
    })
  }, [navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg(error.message)
      } else if (data.session) {
        navigate('/dashboard')
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message)
      } else {
        setErrorMsg('An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#B51D19]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#B51D19] to-[#080707] p-[1.5px]">
              <div className="w-full h-full bg-[#0B0B0B] rounded-[10px] flex items-center justify-center font-bold text-lg text-white">
                H
              </div>
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold text-[#F5F5F5] tracking-tight">
            {isAr ? 'لوحة تحكم حبيب الرحمن' : 'Habib Al-Rahman CMS'}
          </h1>
          <p className="text-sm text-[#9B9B9B] mt-1">
            {isAr
              ? 'تسجيل الدخول لإدارة الأعمال والعملاء والمحتوى'
              : 'Sign in to manage works, clients, and content'}
          </p>
        </div>

        <Card className="bg-[#0B0B0B] border-[#242424] p-8 shadow-2xl">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#B3B3B3] mb-2 uppercase tracking-wider">
                {isAr ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@habibalrahman.com"
                  className="w-full bg-[#121212] border border-[#262626] focus:border-[#B51D19] rounded-xl px-4 py-3 pl-11 text-sm text-[#F5F5F5] placeholder-[#555] focus:outline-none transition-colors"
                />
                <Mail className="w-4 h-4 text-[#777] absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#B3B3B3] mb-2 uppercase tracking-wider">
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#121212] border border-[#262626] focus:border-[#B51D19] rounded-xl px-4 py-3 pl-11 text-sm text-[#F5F5F5] placeholder-[#555] focus:outline-none transition-colors"
                />
                <Lock className="w-4 h-4 text-[#777] absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {isAr ? 'دخول لوحة التحكم' : 'Sign In to Dashboard'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#1C1C1C] flex items-center justify-center gap-2 text-xs text-[#707070]">
            <ShieldCheck className="w-4 h-4 text-[#E63B32]" />
            <span>{isAr ? 'مؤمّن بواسطة Supabase Auth' : 'Secured by Supabase Auth'}</span>
          </div>
        </Card>

        <div className="text-center mt-6">
          <Link to="/" className="text-xs text-[#9B9B9B] hover:text-[#F5F5F5] transition-colors">
            {isAr ? '← العودة للموقع الرئيسي' : '← Back to Public Website'}
          </Link>
        </div>
      </div>
    </div>
  )
}
