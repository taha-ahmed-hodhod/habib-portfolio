import React, { useState } from 'react'
import { X, Star, Send, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { dataSync } from '@/services/dataSync'

export interface SubmitReviewModalProps {
  isOpen: boolean
  onClose: () => void
  isAr: boolean
}

export const SubmitReviewModal: React.FC<SubmitReviewModalProps> = ({
  isOpen,
  onClose,
  isAr,
}) => {
  const [name, setName] = useState('')
  const [profession, setProfession] = useState('')
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(5)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { error } = await supabase.from('testimonials').insert([
        {
          client_name_ar: name,
          client_name_en: name,
          profession_ar: profession,
          profession_en: profession,
          content_ar: content,
          content_en: content,
          rating,
          status: 'pending',
          is_visible: true,
        },
      ])

      if (error) throw error

      dataSync.emit('testimonials.updated')
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 2500)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-lg bg-[#0B0B0B] border-[#242424] p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#888] hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-white mb-2">
          {isAr ? 'شاركنا رأيك وتجربتك' : 'Share Your Review'}
        </h3>
        <p className="text-xs text-[#9B9B9B] mb-6">
          {isAr
            ? 'نسعد دائماً برأيك. ستتم مراجعة تقييمك ونشره في الموقع.'
            : 'We appreciate your feedback. It will be published after review.'}
        </p>

        {success ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">
              {isAr ? 'شكراً جزيلاً لرأيك!' : 'Thank you for your review!'}
            </h4>
            <p className="text-xs text-[#9B9B9B]">
              {isAr ? 'تم استلام تقييمك وسيظهر بعد المراجعة.' : 'Your review was received and is pending approval.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                {isAr ? 'الاسم' : 'Your Name'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أحمد محمد"
                className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                {isAr ? 'المسمى الوظيفي أو الشركة' : 'Profession or Company'}
              </label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="مدير تسويق في شركة..."
                className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                {isAr ? 'التقييم' : 'Rating'}
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? 'fill-current' : 'text-[#333]'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B3B3B3] mb-1">
                {isAr ? 'الرأي أو التجربة' : 'Review'}
              </label>
              <textarea
                rows={3}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={isAr ? 'اكتب رأيك هنا...' : 'Write your thoughts here...'}
                className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={submitting}
              className="w-full mt-2"
              icon={<Send className="w-4 h-4" />}
            >
              {isAr ? 'إرسال التقييم' : 'Submit Review'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
