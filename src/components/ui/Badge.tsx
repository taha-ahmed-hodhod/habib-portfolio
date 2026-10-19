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
      'bg-[#B51D19]/15 text-[#E63B32] border border-[#B51D19]/35 font-semibold',
    outline: 'bg-transparent text-[#F5F5F5] border border-[#303030]',
    dot: 'bg-[#151515] text-[#F5F5F5] border border-[#242424]',
  }

  return (
    <span className={cn(base, variants[variant], className)} {...props}>
      {variant === 'dot' && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#E63B32] animate-pulse" />
      )}
      {children}
    </span>
  )
}
