'use client'

import { InputHTMLAttributes, forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    hint?: string
    iconLeft?: ReactNode
    iconRight?: ReactNode
    fullWidth?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, iconLeft, iconRight, fullWidth, className, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

        return (
            <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
                {label && (
                    <label htmlFor={inputId} className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {iconLeft && (
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                            {iconLeft}
                        </span>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            'w-full bg-zinc-900 border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600',
                            'focus:outline-none transition-all duration-200',
                            error
                                ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                                : 'border-white/10 focus:border-orange-500/50 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)]',
                            iconLeft  ? 'pl-10' : undefined,
                            iconRight ? 'pr-10' : undefined,
                            className
                        )}
                        {...props}
                    />
                    {iconRight && (
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                            {iconRight}
                        </span>
                    )}
                </div>
                {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
                {hint && !error && <p className="text-xs text-zinc-600">{hint}</p>}
            </div>
        )
    }
)
Input.displayName = 'Input'
export default Input
