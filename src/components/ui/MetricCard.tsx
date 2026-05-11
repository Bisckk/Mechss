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
        <div className={`relative overflow-hidden bg-zinc-900 border border-white/5 rounded-2xl p-5 group hover:bg-white/[0.02] transition-colors ${className}`}>
            {/* Glow de fondo */}
            <div className={`absolute top-0 right-0 w-28 h-28 blur-3xl rounded-full ${bgIcono} -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700 ease-out opacity-60`} />

            <div className="relative z-10 flex items-start justify-between">
                <div className="min-w-0 flex-1">
                    <p className="text-zinc-400 text-sm font-medium truncate">{etiqueta}</p>
                    <p className="mt-2 text-2xl sm:text-3xl font-bold text-white tracking-tight">{valor}</p>
                </div>
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${bgIcono} border border-white/10 flex items-center justify-center ${colorIcono} shadow-inner ml-3`}>
                    <Icono className="w-5 h-5" />
                </div>
            </div>

            {(subtexto || etiquetaTendencia) && (
                <div className="relative z-10 mt-4 flex items-center gap-1.5 text-xs">
                    <IconTendencia className={`w-3.5 h-3.5 flex-shrink-0 ${color}`} />
                    <span className={`font-medium ${color}`}>{etiquetaTendencia ?? subtexto}</span>
                    {subtexto && etiquetaTendencia && (
                        <span className="text-zinc-600">{subtexto}</span>
                    )}
                </div>
            )}
        </div>
    )
}
