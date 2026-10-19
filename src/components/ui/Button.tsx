import React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  icon?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium transition-all duration-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B51D19]/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'

  const variants = {
    primary:
      'bg-[#B51D19] text-white hover:bg-[#991512] shadow-lg shadow-[#B51D19]/25 border border-[#B51D19]/40',
    secondary:
      'bg-[#151515] text-[#F5F5F5] hover:bg-[#202020] border border-[#242424] hover:border-[#303030]',
    outline:
      'bg-transparent text-[#F5F5F5] border border-[#303030] hover:border-[#B51D19] hover:bg-[#B51D19]/10',
    ghost:
      'bg-transparent text-[#9B9B9B] hover:text-[#F5F5F5] hover:bg-[#151515]',
    gradient:
      'bg-gradient-to-r from-[#B51D19] via-[#D32F2F] to-[#E63B32] text-white hover:opacity-95 shadow-lg shadow-[#B51D19]/25 font-semibold',
    danger:
      'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
  }

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  }

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      ) : (
        icon
      )}
      {typeof children === 'string' || typeof children === 'number' ? (
        <span>{children}</span>
      ) : (
        children
      )}
    </button>
  )
}
