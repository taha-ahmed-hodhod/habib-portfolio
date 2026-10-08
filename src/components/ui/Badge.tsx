import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'outline' | 'dot'
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  ...props
}) => {
  const base =
    'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-colors'

  const variants = {
    default: 'bg-[#151515] text-[#9B9B9B] border border-[#242424]',
    accent:
      'bg-[#8B5CF6]/10 text-[#A78BFA] border border-[#8B5CF6]/30 font-semibold',
    outline: 'bg-transparent text-[#F5F5F5] border border-[#303030]',
    dot: 'bg-[#151515] text-[#F5F5F5] border border-[#242424]',
  }

  return (
    <span className={cn(base, variants[variant], className)} {...props}>
      {variant === 'dot' && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
      )}
      {children}
    </span>
  )
}
