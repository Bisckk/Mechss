'use client'

import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl'
    footer?: ReactNode
    className?: string
}

const SIZE_CLASSES = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
} as const

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer, className }: ModalProps) {
    useEffect(() => {
        if (!isOpen) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className={cn(
                'relative w-full bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]',
                SIZE_CLASSES[size],
                className
            )}>
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 flex-shrink-0">
                        <h2 className="text-lg font-bold text-white">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {!title && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-none">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-white/5 flex-shrink-0 flex items-center justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}

// Drawer variant (slides from right)
interface DrawerProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: ReactNode
    footer?: ReactNode
    width?: string
}

export function Drawer({ isOpen, onClose, title, children, footer, width = 'w-full max-w-sm' }: DrawerProps) {
    useEffect(() => {
        if (!isOpen) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [isOpen, onClose])

    return (
        <div className={cn('fixed inset-0 z-[200]', !isOpen && 'pointer-events-none')}>
            {/* Backdrop */}
            <div
                className={cn('absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300', isOpen ? 'opacity-100' : 'opacity-0')}
                onClick={onClose}
            />

            {/* Panel */}
            <div className={cn(
                'absolute top-0 right-0 h-full bg-zinc-950 border-l border-white/10 shadow-2xl flex flex-col transition-transform duration-350 ease-[cubic-bezier(0.22,1,0.36,1)]',
                width,
                isOpen ? 'translate-x-0' : 'translate-x-full'
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-5 border-b border-white/5 flex-shrink-0">
                    {title && <h2 className="text-base font-bold text-white">{title}</h2>}
                    <button
                        onClick={onClose}
                        className="ml-auto p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-none">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-5 py-4 border-t border-white/5 flex-shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}
