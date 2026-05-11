const VARIANTES = {
    exito:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    alerta:  'bg-amber-500/10   text-amber-400   border border-amber-500/20',
    peligro: 'bg-rose-500/10    text-rose-400    border border-rose-500/20',
    info:    'bg-blue-500/10    text-blue-400    border border-blue-500/20',
    neutro:  'bg-zinc-700/30    text-zinc-400    border border-zinc-700/40',
} as const

const TAMAÑOS = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
} as const

interface Props {
    variante?: keyof typeof VARIANTES
    etiqueta: string
    tamaño?: keyof typeof TAMAÑOS
    className?: string
}

export default function BadgeV2({ variante = 'neutro', etiqueta, tamaño = 'sm', className = '' }: Props) {
    return (
        <span className={`inline-flex items-center font-semibold rounded-full ${VARIANTES[variante]} ${TAMAÑOS[tamaño]} ${className}`}>
            {etiqueta}
        </span>
    )
}
