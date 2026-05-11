'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const VARIANTS = {
    primary:   'bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.25)] hover:shadow-[0_0_25px_rgba(249,115,22,0.35)]',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/5',
    ghost:     'bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white',
    danger:    'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30',
    success:   'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30',
} as const

const SIZES = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
    lg: 'text-base px-6 py-3 rounded-xl gap-2.5',
} as const

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: keyof typeof VARIANTS
    size?: keyof typeof SIZES
    loading?: boolean
    fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }, ref) => (
        <button
            ref={ref}
            disabled={disabled || loading}
            className={cn(
                'inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
                VARIANTS[variant],
                SIZES[size],
                fullWidth && 'w-full',
                className
            )}
            {...props}
        >
            {loading && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />}
            {children}
        </button>
    )
)
Button.displayName = 'Button'
export default Button
