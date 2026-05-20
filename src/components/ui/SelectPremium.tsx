'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
    value: string
    label: string
}

interface Props {
    value:       string
    onChange:    (val: string) => void
    options:     SelectOption[]
    placeholder?: string
    className?:  string
    disabled?:   boolean
}

export default function SelectPremium({
    value, onChange, options,
    placeholder = 'Seleccionar...', className = '', disabled = false,
}: Props) {
    const [open, setOpen]           = useState(false)
    const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
    const triggerRef = useRef<HTMLButtonElement>(null)
    const panelRef   = useRef<HTMLDivElement>(null)
    const selected   = options.find(o => o.value === value)

    const handleOpen = () => {
        if (disabled || !triggerRef.current) return
        const rect        = triggerRef.current.getBoundingClientRect()
        const spaceBelow  = window.innerHeight - rect.bottom
        const panelHeight = Math.min(options.length * 44 + 8, 224)

        // Abre hacia arriba si no hay espacio suficiente abajo
        if (spaceBelow < panelHeight && rect.top > panelHeight) {
            setPanelStyle({ position: 'fixed', bottom: window.innerHeight - rect.top + 6, left: rect.left, width: rect.width, zIndex: 9999 })
        } else {
            setPanelStyle({ position: 'fixed', top: rect.bottom + 6, left: rect.left, width: rect.width, zIndex: 9999 })
        }
        setOpen(p => !p)
    }

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            const target = e.target as Node
            if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    return (
        <div className={`relative ${className}`}>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={handleOpen}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-left flex items-center justify-between gap-2 focus:outline-none focus:border-orange-500/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className={selected ? 'text-white' : 'text-zinc-600'}>
                    {selected?.label ?? placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && typeof document !== 'undefined' && createPortal(
                <div
                    ref={panelRef}
                    style={panelStyle}
                    className="bg-zinc-900 border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden"
                >
                    <ul className="max-h-56 overflow-y-auto py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {options.map(opt => (
                            <li key={opt.value}>
                                <button
                                    type="button"
                                    onClick={() => { onChange(opt.value); setOpen(false) }}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${
                                        opt.value === value
                                            ? 'text-orange-400 bg-orange-500/8'
                                            : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                                    }`}
                                >
                                    {opt.label}
                                    {opt.value === value && <Check className="w-3.5 h-3.5 flex-shrink-0 text-orange-400" />}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>,
                document.body
            )}
        </div>
    )
}
