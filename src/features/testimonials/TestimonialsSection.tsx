import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Star, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Testimonial } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SubmitReviewModal } from './SubmitReviewModal'
import { dataSync } from '@/services/dataSync'

export interface TestimonialsSectionProps {
  testimonials_cta_visible?: boolean
  testimonials_limit?: number
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  testimonials_cta_visible = true,
  testimonials_limit = 6,
}) => {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [modalOpen, setModalOpen] = useState(false)

  const loadTestimonials = async () => {
    try {
      let query = supabase
        .from('testimonials')
        .select('*')
        .eq('status', 'approved')
        .eq('is_visible', true)
        .order('sort_order', { ascending: true })

      const limit =
        typeof testimonials_limit === 'number' && testimonials_limit > 0
          ? testimonials_limit
          : 6

      query = query.limit(limit)

      const { data, error } = await query
      if (!error && data) {
        setTestimonials(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadTestimonials()

    const unsub = dataSync.on('testimonials.updated', () => {
      loadTestimonials()
    })

    return () => {
      unsub()
    }
  }, [testimonials_limit])

  return (
    <section id="testimonials" className="py-24 relative bg-transparent border-t border-[#141414]/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
          <div>
            <Badge variant="accent" className="mb-3">
              <span>{isAr ? 'شهادات نعتز بها' : 'Client Feedback'}</span>
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-[#F5F5F5] tracking-tight">
              {t('testimonials.title')}
            </h2>
            <p className="text-sm text-[#9B9B9B] mt-2 max-w-xl">
              {t('testimonials.subtitle')}
            </p>
          </div>

          {/* Dynamic CTA Button: Controlled strictly by testimonials_cta_visible setting */}
          {testimonials_cta_visible !== false && (
            <Button
              variant="outline"
              size="md"
              icon={<Plus className="w-4 h-4 text-[#8B5CF6]" />}
              onClick={() => setModalOpen(true)}
              className="shrink-0"
            >
              {t('testimonials.add_review')}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((tItem) => (
            <div
              key={tItem.id}
              className="p-6 rounded-2xl bg-[#0B0B0B] border border-[#242424] hover:border-[#8B5CF6]/30 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {Array.from({ length: tItem.rating || 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>

                <p className="text-sm text-[#CCCCCC] leading-relaxed italic mb-6">
                  "{isAr ? tItem.content_ar : tItem.content_en}"
                </p>
              </div>

              <div className="pt-4 border-t border-[#1C1C1C] flex items-center gap-3">
                {tItem.avatar_url ? (
                  <img
                    src={tItem.avatar_url}
                    alt={isAr ? tItem.client_name_ar : tItem.client_name_en}
                    className="w-10 h-10 rounded-full object-cover border border-[#2E2E2E]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#161616] border border-[#2E2E2E] flex items-center justify-center font-bold text-xs text-[#A78BFA]">
                    {(isAr ? tItem.client_name_ar : tItem.client_name_en).charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {isAr ? tItem.client_name_ar : tItem.client_name_en}
                  </h4>
                  <span className="text-xs text-[#7A7A7A]">
                    {isAr ? tItem.profession_ar : tItem.profession_en}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SubmitReviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        isAr={isAr}
      />
    </section>
  )
}
