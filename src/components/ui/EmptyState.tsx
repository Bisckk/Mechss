import { ElementType, ReactNode } from 'react'

interface Props {
    Icono: ElementType
    titulo: string
    descripcion?: string
    accion?: ReactNode
}

export default function EmptyState({ Icono, titulo, descripcion, accion }: Props) {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-white/5 flex items-center justify-center mb-3">
                <Icono className="w-5 h-5 text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-zinc-400">{titulo}</p>
            {descripcion && (
                <p className="text-xs text-zinc-600 mt-1 max-w-xs">{descripcion}</p>
            )}
            {accion && <div className="mt-4">{accion}</div>}
        </div>
    )
}
