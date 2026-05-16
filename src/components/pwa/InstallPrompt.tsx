'use client'

import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'motofix-install-dismissed'

export default function InstallPrompt() {
    const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        // Don't show if already dismissed
        if (localStorage.getItem(DISMISSED_KEY)) return

        // Don't show if already running as a PWA
        if (window.matchMedia('(display-mode: standalone)').matches) return

        const handler = (e: Event) => {
            e.preventDefault()
            setPrompt(e as BeforeInstallPromptEvent)
            setVisible(true)
        }

        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    async function handleInstall() {
        if (!prompt) return
        await prompt.prompt()
        const { outcome } = await prompt.userChoice
        if (outcome === 'accepted') {
            setVisible(false)
        }
        setPrompt(null)
    }

    function handleDismiss() {
        localStorage.setItem(DISMISSED_KEY, '1')
        setVisible(false)
    }

    if (!visible) return null

    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/40 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-orange-400" />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white leading-tight">Instala MotoFix</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Acceso rápido desde tu pantalla de inicio</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={handleInstall}
                        className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors active:scale-95"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Instalar
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
