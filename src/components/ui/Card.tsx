import React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean
  hoverable?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  glow = false,
  hoverable = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        'relative bg-[#0B0B0B] border border-[#242424] rounded-2xl p-6 transition-all duration-300',
        hoverable &&
          'hover:border-[#383838] hover:bg-[#0E0E0E] hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60',
        glow &&
          'before:absolute before:-inset-[1px] before:rounded-2xl before:bg-gradient-to-r before:from-[#8B5CF6]/30 before:to-[#38BDF8]/20 before:-z-10 before:blur-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
