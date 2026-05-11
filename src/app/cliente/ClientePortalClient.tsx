'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Wrench, Search, ArrowRight, Hash, Loader2, AlertTriangle } from 'lucide-react'
import { lookupTrackingCodeAction } from '@/lib/actions/tracking'

export default function ClientePortalClient() {
    const router = useRouter()
    const [code, setCode] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [error, setError] = useState('')

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim()) return
        setIsSearching(true)
        setError('')

        const res = await lookupTrackingCodeAction(code.trim())
        if (res.ok) {
            router.push(`/cliente/${code.trim()}`)
        } else {
            setError('No encontramos un servicio con ese código. Verifica que sea correcto.')
            setIsSearching(false)
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            {/* Background glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-orange-500/4 rounded-full blur-[140px]" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-orange-400 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                            <Wrench className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold text-white tracking-tight">MotoFix</span>
                    </Link>
                    <Link href="/rastreo" className="text-sm text-zinc-500 hover:text-white transition-colors">
                        Rastreo rápido →
                    </Link>
                </div>
            </header>

            <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
                {/* Hero */}
                <div className="text-center mb-12">
                    <div className="w-20 h-20 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(249,115,22,0.15)]">
                        <Hash className="w-9 h-9 text-orange-500" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
                        Portal del <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">Cliente</span>
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-md mx-auto leading-relaxed">
                        Ingresa tu código de servicio para ver el estado de tu reparación en tiempo real.
                    </p>
                </div>

                {/* Search form */}
                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <span className="text-zinc-500 font-mono font-bold text-lg">#</span>
                        </div>
                        <input
                            type="text"
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase().trim())}
                            placeholder="REP-XXXXXXXX"
                            className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl pl-11 pr-5 py-5 text-xl font-mono font-bold text-white tracking-widest focus:outline-none focus:border-orange-500/50 focus:shadow-[0_0_30px_rgba(249,115,22,0.1)] transition-all placeholder:text-zinc-700"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="flex items-start gap-3 bg-rose-500/8 border border-rose-500/20 rounded-xl px-4 py-3">
                            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-rose-400">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSearching || !code.trim()}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-2xl transition-all shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
                    >
                        {isSearching ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Buscando...</>
                        ) : (
                            <><Search className="w-5 h-5" /> Ver mi servicio <ArrowRight className="w-5 h-5" /></>
                        )}
                    </button>
                </form>

                {/* Helper text */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-zinc-600">
                        ¿No tienes tu código? Puedes encontrarlo en el <span className="text-zinc-400 font-semibold">ticket de ingreso</span> que te entregaron en el taller o en el SMS/WhatsApp recibido.
                    </p>
                </div>

                {/* Features */}
                <div className="mt-12 grid grid-cols-3 gap-4">
                    {[
                        { emoji: '📍', title: 'Estado en vivo', desc: 'Seguimiento en tiempo real de tu moto' },
                        { emoji: '📸', title: 'Fotos del proceso', desc: 'Evidencias del trabajo realizado' },
                        { emoji: '🔔', title: 'Sin registro', desc: 'Solo necesitas tu código de servicio' },
                    ].map(f => (
                        <div key={f.title} className="text-center p-4 bg-zinc-900/50 border border-white/5 rounded-2xl">
                            <div className="text-2xl mb-2">{f.emoji}</div>
                            <p className="text-xs font-bold text-white mb-1">{f.title}</p>
                            <p className="text-[11px] text-zinc-600 leading-snug">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </main>

            <footer className="relative z-10 border-t border-white/5 py-6 text-center">
                <p className="text-xs text-zinc-700">
                    Powered by <span className="text-orange-500 font-bold">MotoFix Platform</span>
                </p>
            </footer>
        </div>
    )
}
