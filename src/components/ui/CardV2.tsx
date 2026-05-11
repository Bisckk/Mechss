import { ReactNode } from 'react'

const RELLENO = {
    ninguno: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
} as const

interface Props {
    children: ReactNode
    className?: string
    relleno?: keyof typeof RELLENO
}

export default function CardV2({ children, className = '', relleno = 'md' }: Props) {
    return (
        <div className={`bg-zinc-900 border border-white/5 rounded-2xl ${RELLENO[relleno]} ${className}`}>
            {children}
        </div>
    )
}
