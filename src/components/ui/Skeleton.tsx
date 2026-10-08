import React from 'react'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'rounded' | 'text'
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rounded',
  ...props
}) => {
  const variantStyles = {
    rectangular: 'rounded-none',
    circular: 'rounded-full',
    rounded: 'rounded-2xl',
    text: 'rounded-md h-4 w-full',
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-[#141414] border border-[#222222]/40',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}
