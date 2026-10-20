import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

export interface MorphingTextProps {
  words?: string[]
  duration?: number
  className?: string
  textClassName?: string
}

export const MorphingText: React.FC<MorphingTextProps> = ({
  words = [
    'Habib AL-Rahman',
    'CEO @ SevenB',
    'Digital Marketing',
    'AI ADS Videos',
    'Arabic Tutor',
  ],
  duration = 3000,
  className = '',
  textClassName = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (!words || words.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length)
    }, duration)

    return () => clearInterval(interval)
  }, [words, duration])

  // Motion variants with reduced motion support
  const variants = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.3 },
      }
    : {
        initial: {
          opacity: 0,
          filter: 'blur(10px)',
          scale: 0.8,
          rotateX: -90,
        },
        animate: {
          opacity: 1,
          filter: 'blur(0px)',
          scale: 1,
          rotateX: 0,
        },
        exit: {
          opacity: 0,
          filter: 'blur(10px)',
          scale: 1.2,
          rotateX: 90,
        },
        transition: {
          duration: 0.8,
          ease: [0.25, 0.46, 0.45, 0.94] as const,
          filter: { duration: 0.6 },
          scale: { duration: 0.6 },
          rotateX: { duration: 0.8 },
        },
      }

  return (
    <div
      className={`relative inline-flex items-center justify-center min-h-[3.5rem] sm:min-h-[4.5rem] w-full overflow-hidden perspective-[1000px] ${className}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={variants.transition}
          className={`text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-center max-w-full px-2 select-none ${textClassName}`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <span className="gradient-name py-1">
            {words[currentIndex]}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default MorphingText
