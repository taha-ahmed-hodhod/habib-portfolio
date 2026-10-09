import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, ExternalLink, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Work } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { useSEO } from '@/hooks/useSEO'

export const WorkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  const [work, setWork] = useState<Work | null>(null)
  const [loading, setLoading] = useState(true)

  useSEO({
    title: work ? (isAr ? work.title_ar : work.title_en) : undefined,
    description: work ? (isAr ? work.description_ar : work.description_en) : undefined,
    image: work?.thumbnail_url || (work?.media_type === 'image' ? work?.media_url : undefined),
    url: id ? `/work/${id}` : undefined,
    type: 'article',
  })

  useEffect(() => {
    async function fetchWork() {
      if (!id) return
      try {
        const { data, error } = await supabase
          .from('works')
          .select('*, category:categories(*), client:clients(*)')
          .eq('id', id)
          .single()

        if (!error && data) {
          setWork(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchWork()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!work) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold text-white mb-2">
          {isAr ? 'العمل غير موجود' : 'Work Not Found'}
        </h2>
        <p className="text-sm text-[#9B9B9B] mb-6">
          {isAr ? 'قد يكون هذا العمل قد تم حذفه أو نقله.' : 'This work might have been removed.'}
        </p>
        <Link to="/">
          <Button variant="primary">
            {isAr ? 'العودة للرئيسية' : 'Back to Home'}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#9B9B9B] hover:text-white mb-8 transition-colors"
      >
        {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        <span>{isAr ? 'العودة لمعرض الأعمال' : 'Back to Works'}</span>
      </Link>

      <div className="relative aspect-video rounded-3xl overflow-hidden bg-black border border-[#242424] mb-8 shadow-2xl">
        {work.media_type === 'video' ? (
          <video
            src={work.media_url}
            poster={work.thumbnail_url || undefined}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        ) : work.media_type === 'document' ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-[#151515] border border-[#282828] flex items-center justify-center text-[#38BDF8] shadow-2xl">
              <FileText className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                {isAr ? work.title_ar : work.title_en}
              </h3>
              <p className="text-xs text-[#888]">
                {isAr ? 'مستند رقمي مرفق' : 'Attached Digital Document'}
              </p>
            </div>
            <a href={work.media_url} target="_blank" rel="noreferrer" download>
              <Button variant="primary" size="md" icon={<ExternalLink className="w-4 h-4" />}>
                {isAr ? 'فتح أو تحميل المستند' : 'Open or Download Document'}
              </Button>
            </a>
          </div>
        ) : (
          <img
            src={work.media_url}
            alt={work.title_ar}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="accent">
              {work.media_type === 'video'
                ? isAr ? 'فيديو سينمائي' : 'Cinematic Video'
                : work.media_type === 'document'
                ? isAr ? 'مستند رقمي' : 'Digital Document'
                : isAr ? 'صورة / تصميم' : 'Image / Design'}
            </Badge>
            {work.category && (
              <Badge variant="outline">
                {isAr ? work.category.name_ar : work.category.name_en}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight">
            {isAr ? work.title_ar : work.title_en}
          </h1>

          <p className="text-sm sm:text-base text-[#A3A3A3] leading-relaxed whitespace-pre-line">
            {isAr ? work.description_ar : work.description_en}
          </p>
        </div>

        <div className="space-y-4">
          <Card className="bg-[#0B0B0B] border-[#242424] p-6 space-y-4">
            <h3 className="text-xs font-bold text-[#8B5CF6] uppercase tracking-wider">
              {isAr ? 'معلومات المشروع' : 'Project Details'}
            </h3>

            {work.client && (
              <div className="space-y-1">
                <span className="text-xs text-[#777] block">{isAr ? 'العميل' : 'Client'}</span>
                <span className="text-sm font-semibold text-white">
                  {isAr ? work.client.name_ar : work.client.name_en}
                </span>
              </div>
            )}

            {work.project_url && (
              <div className="pt-2">
                <a href={work.project_url} target="_blank" rel="noreferrer">
                  <Button variant="primary" size="md" className="w-full" icon={<ExternalLink className="w-4 h-4" />}>
                    {isAr ? 'زيارة رابط المشروع' : 'Visit Project URL'}
                  </Button>
                </a>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
