import { ElementType } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type Tendencia = 'positivo' | 'negativo' | 'neutro'

interface Props {
    etiqueta: string
    valor: string | number
    subtexto?: string
    tendencia?: Tendencia
    etiquetaTendencia?: string
    Icono: ElementType
    colorIcono: string
    bgIcono: string
    className?: string
}

const TENDENCIA_ESTILOS: Record<Tendencia, { color: string; Comp: ElementType }> = {
    positivo: { color: 'text-emerald-400', Comp: TrendingUp },
    negativo: { color: 'text-rose-400',    Comp: TrendingDown },
    neutro:   { color: 'text-zinc-500',    Comp: Minus },
}

export default function MetricCard({
    etiqueta, valor, subtexto, tendencia = 'neutro',
    etiquetaTendencia, Icono, colorIcono, bgIcono, className = '',
}: Props) {
    const { color, Comp: IconTendencia } = TENDENCIA_ESTILOS[tendencia]

    return (
        <div className={`relative overflow-hidden bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm group hover:bg-zinc-900/70 transition-all duration-300 ${className}`}>
            {/* Glow ambiental */}
            <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full ${bgIcono} -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-700 ease-out opacity-50`} />

            <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium tracking-wide uppercase text-zinc-500 truncate">{etiqueta}</p>
                    <p className="mt-2.5 text-2xl sm:text-[28px] font-bold text-white tracking-tight tabular-nums">{valor}</p>
                </div>
                <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${bgIcono} border border-white/8 flex items-center justify-center ${colorIcono}`}>
                    <Icono className="w-4.5 h-4.5" />
                </div>
            </div>

            {(subtexto || etiquetaTendencia) && (
                <div className="relative z-10 mt-3.5 flex items-center gap-1.5 text-[11px]">
                    <IconTendencia className={`w-3 h-3 flex-shrink-0 ${color}`} />
                    <span className={`font-medium ${color}`}>{etiquetaTendencia ?? subtexto}</span>
                    {subtexto && etiquetaTendencia && (
                        <span className="text-zinc-600">{subtexto}</span>
                    )}
                </div>
            )}
        </div>
    )
}
