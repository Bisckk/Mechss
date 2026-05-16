'use client'

import Link from 'next/link'
import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
            <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto mb-6">
                    <WifiOff className="w-9 h-9 text-zinc-600" />
                </div>
                <h1 className="text-2xl font-black text-white mb-2">Sin conexión</h1>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                    No hay internet disponible. Algunas funciones requieren conexión para funcionar correctamente.
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all"
                    >
                        <RefreshCw className="w-4 h-4" /> Reintentar
                    </button>
                    <Link
                        href="/admin/taller"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white font-semibold rounded-xl transition-all"
                    >
                        Volver al taller
                    </Link>
                </div>
            </div>
        </div>
    )
}
