import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface StarfieldBackgroundProps {
  className?: string
  children?: React.ReactNode
  /** Number of stars */
  count?: number
  /** Travel speed */
  speed?: number
  /** Star color */
  starColor?: string
  /** Enable twinkling */
  twinkle?: boolean
  /** Base background color */
  backgroundColor?: string
}

interface Star {
  x: number
  y: number
  z: number
  twinkleSpeed: number
  twinkleOffset: number
}

export function StarfieldBackground({
  className,
  children,
  count = 350,
  speed = 0.4,
  starColor = '#ffffff',
  twinkle = true,
  backgroundColor = '#050505',
}: StarfieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = container.getBoundingClientRect()
    let width = rect.width || window.innerWidth
    let height = rect.height || window.innerHeight
    canvas.width = width
    canvas.height = height

    let animationId: number
    let tick = 0
    const maxDepth = 1500

    // Create stars
    const createStar = (initialZ?: number): Star => ({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: initialZ ?? Math.random() * maxDepth,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinkleOffset: Math.random() * Math.PI * 2,
    })

    const stars: Star[] = Array.from({ length: count }, () => createStar())

    // Resize handler
    const handleResize = () => {
      if (!container || !canvas) return
      const updatedRect = container.getBoundingClientRect()
      width = updatedRect.width || window.innerWidth
      height = updatedRect.height || window.innerHeight
      canvas.width = width
      canvas.height = height
    }

    const ro = new ResizeObserver(handleResize)
    ro.observe(container)

    // Animation loop
    const animate = () => {
      tick++

      // Fade effect for trails
      ctx.fillStyle = backgroundColor === '#050505' ? 'rgba(5, 5, 5, 0.25)' : 'rgba(10, 10, 15, 0.25)'
      ctx.fillRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2

      for (const star of stars) {
        // Move star toward camera
        star.z -= speed * 2

        // Reset if passed camera
        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * width * 2
          star.y = (Math.random() - 0.5) * height * 2
          star.z = maxDepth
        }

        // Project to 2D
        const scale = 400 / star.z
        const x = cx + star.x * scale
        const y = cy + star.y * scale

        // Skip if off screen
        if (x < -10 || x > width + 10 || y < -10 || y > height + 10) continue

        // Size based on depth (closer = bigger)
        const size = Math.max(0.5, (1 - star.z / maxDepth) * 2.8)

        // Opacity based on depth (closer = brighter)
        let opacity = (1 - star.z / maxDepth) * 0.9 + 0.1

        // Twinkle effect
        if (twinkle && star.twinkleSpeed > 0.015) {
          opacity *= 0.7 + 0.3 * Math.sin(tick * star.twinkleSpeed + star.twinkleOffset)
        }

        // Draw star
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fillStyle = starColor
        ctx.globalAlpha = Math.min(1, Math.max(0, opacity))
        ctx.fill()

        // Draw subtle streak for fast/close stars
        if (star.z < maxDepth * 0.3 && speed > 0.3) {
          const streakLength = (1 - star.z / maxDepth) * speed * 8
          const angle = Math.atan2(star.y, star.x)
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x - Math.cos(angle) * streakLength, y - Math.sin(angle) * streakLength)
          ctx.strokeStyle = starColor
          ctx.globalAlpha = Math.min(1, Math.max(0, opacity * 0.3))
          ctx.lineWidth = size * 0.5
          ctx.stroke()
        }
      }

      ctx.globalAlpha = 1
      animationId = requestAnimationFrame(animate)
    }

    // Initial clear
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)

    animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
      ro.disconnect()
    }
  }, [count, speed, starColor, twinkle, backgroundColor])

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed inset-0 overflow-hidden pointer-events-none select-none',
        className
      )}
      style={{ backgroundColor }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />

      {/* Subtle crimson / red nebula glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          background:
            'radial-gradient(ellipse at 30% 40%, rgba(181, 29, 25, 0.15) 0%, transparent 55%), radial-gradient(ellipse at 70% 60%, rgba(230, 59, 50, 0.08) 0%, transparent 50%)',
        }}
      />

      {/* Vignette for cinematic dark depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, transparent 45%, rgba(5,5,5,0.85) 100%)',
        }}
      />

      {/* Content layer if passed */}
      {children && <div className="relative z-10 h-full w-full pointer-events-auto">{children}</div>}
    </div>
  )
}

export default StarfieldBackground
