import React, { useEffect, useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { MorphingText } from '@/components/ui/MorphingText'

export interface GlobalInitialLoaderProps {
  onComplete?: () => void
}

export const GlobalInitialLoader: React.FC<GlobalInitialLoaderProps> = ({ onComplete }) => {
  const { profile, loading: profileLoading } = useProfile()
  const [progress, setProgress] = useState(0)
  const [isExiting, setIsExiting] = useState(false)
  const [isDone, setIsDone] = useState(false)

  // Smooth progress bar connected to the application initialization lifecycle
  useEffect(() => {
    const startTime = Date.now()

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      // Smoothly advance progress; allow at least ~2.8s for morphing showcase or while data loads
      const targetDuration = !profileLoading ? 2800 : 4200
      const calculatedProgress = Math.min(Math.round((elapsed / targetDuration) * 100), 100)

      setProgress(calculatedProgress)

      if (calculatedProgress >= 100 && !profileLoading) {
        clearInterval(timer)
        // Brief pause at 100% then trigger smooth exit transition
        setTimeout(() => {
          setIsExiting(true)
          setTimeout(() => {
            setIsDone(true)
            if (onComplete) onComplete()
          }, 500) // Match 500ms exit transition
        }, 250)
      }
    }, 25)

    return () => clearInterval(timer)
  }, [profileLoading, onComplete])

  if (isDone) return null

  return (
    <aside
      aria-label="Loading Screen"
      aria-busy={!isDone}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#050505] transition-all duration-500 ease-out select-none ${
        isExiting ? 'opacity-0 scale-[1.03] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Subtle ambient lighting */}
      <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-[#B51D19]/15 via-[#B51D19]/5 to-[#080707]/10 blur-[130px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-lg w-full">
        {/* Animated Brand Emblem with Shared Profile Avatar */}
        <div className="relative mb-6">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#B51D19] to-[#080707] opacity-75 blur-sm animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-[#0B0B0B] border border-[#242424] overflow-hidden flex items-center justify-center shadow-2xl">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name_en || 'Habib AL-Rahman'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-black gradient-name">
                HR
              </span>
            )}
          </div>
        </div>

        {/* MorphingText Animation (3D Blur + Scale + Flip) */}
        <div className="w-full flex items-center justify-center my-2">
          <MorphingText
            words={[
              'Habib AL-Rahman',
              'CEO @ SevenB',
              'Digital Marketing',
              'AI ADS Videos',
              'Arabic Tutor',
            ]}
            duration={3000}
          />
        </div>

        {/* Progress Container */}
        <div className="w-full max-w-xs mt-8 space-y-2">
          {/* Thin Progress Bar */}
          <div className="h-1 w-full bg-[#151515] rounded-full overflow-hidden border border-[#202020]">
            <div
              className="h-full bg-gradient-to-r from-[#B51D19] to-[#E63B32] rounded-full transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Progress Percentage Display */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[#7A7A7A] px-0.5">
            <span className="tracking-widest uppercase text-[10px] text-[#555]">Initializing</span>
            <span className="font-semibold text-[#E63B32]">{progress}%</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
