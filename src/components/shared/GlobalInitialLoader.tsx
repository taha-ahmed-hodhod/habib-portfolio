import React, { useEffect, useState } from 'react'
import { useProfile } from '@/hooks/useProfile'

export interface GlobalInitialLoaderProps {
  onComplete?: () => void
}

export const GlobalInitialLoader: React.FC<GlobalInitialLoaderProps> = ({ onComplete }) => {
  const { profile } = useProfile()
  const profileName = profile?.full_name_en || 'Habib Al-Rahman'
  const [displayedText, setDisplayedText] = useState('')
  const [progress, setProgress] = useState(0)
  const [isExiting, setIsExiting] = useState(false)
  const [isDone, setIsDone] = useState(false)

  // 1. Letter-by-letter typing animation for the name
  useEffect(() => {
    let currentIndex = 0
    const targetText = profileName

    const interval = setInterval(() => {
      if (currentIndex <= targetText.length) {
        setDisplayedText(targetText.slice(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(interval)
      }
    }, 45) // Smooth 45ms per character

    return () => clearInterval(interval)
  }, [profileName])

  // 2. Smooth Progress Bar (Connected to initialization)
  useEffect(() => {
    const startTime = Date.now()
    const targetDuration = 1400 // Smooth ~1.4s total initialization window

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const calculatedProgress = Math.min(Math.round((elapsed / targetDuration) * 100), 100)

      setProgress(calculatedProgress)

      if (calculatedProgress >= 100) {
        clearInterval(timer)
        // Give 200ms at 100% for visual satisfaction, then trigger exit transition
        setTimeout(() => {
          setIsExiting(true)
          setTimeout(() => {
            setIsDone(true)
            if (onComplete) onComplete()
          }, 500) // Match 500ms transition duration
        }, 200)
      }
    }, 20)

    return () => clearInterval(timer)
  }, [onComplete])

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

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-md w-full">
        {/* Animated Brand Emblem */}
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

        {/* Dynamic Name with Letter-by-Letter Animation */}
        <div className="min-h-[2.5rem] flex items-center justify-center">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F5F5F5] font-sans">
            {displayedText}
            {displayedText.length < profileName.length && (
              <span className="inline-block w-0.5 h-6 ml-1 bg-[#E63B32] animate-pulse align-middle" />
            )}
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-xs text-[#9B9B9B] mt-1.5 font-medium tracking-wide">
          Digital Marketer & AI Video Creator
        </p>

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
