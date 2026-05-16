'use client'

import { useState, useEffect } from 'react'
import { X, Clock, AlertTriangle, Zap, Mail } from 'lucide-react'
import type { PlanInfo } from '@/lib/actions/subscription'

interface Props {
    plan: PlanInfo
}

export default function PlanStatusBanner({ plan }: Props) {
    const [dismissed, setDismissed] = useState(false)

    // Persist dismiss per session (sessionStorage so it resets on next visit)
    useEffect(() => {
        const key = `plan_banner_dismissed_${plan.plan_status}`
        if (sessionStorage.getItem(key) === 'true') setDismissed(true)
    }, [plan.plan_status])

    const handleDismiss = () => {
        const key = `plan_banner_dismissed_${plan.plan_status}`
        sessionStorage.setItem(key, 'true')
        setDismissed(true)
    }

    if (dismissed) return null
    if (!plan.showTrialBanner && !plan.showExpiryBanner) return null

    const isTrial = plan.showTrialBanner
    const daysLeft = isTrial ? plan.daysLeftTrial : plan.daysLeftSubscription
    const urgent = plan.bannerUrgent

    const daysText = () => {
        if (daysLeft === null) return ''
        if (daysLeft <= 0) return isTrial ? 'Tu prueba vence hoy' : 'Tu plan vence hoy'
        if (daysLeft === 1) return isTrial ? 'Tu prueba vence mañana' : 'Tu plan vence mañana'
        return isTrial
            ? `${daysLeft} días de prueba restantes`
            : `Tu plan vence en ${daysLeft} días`
    }

    const contactHref = `mailto:soporte@motofix.app?subject=Renovar plan - ${plan.workshop_name}&body=Hola, deseo activar%2Frenovar mi plan de MotoFix.`

    if (urgent) {
        return (
            <div className="relative w-full bg-gradient-to-r from-rose-950/80 via-rose-900/60 to-rose-950/80 border-b border-rose-500/30 px-4 py-2.5 flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="text-sm font-semibold text-rose-200 truncate">
                        {daysText()}
                    </span>
                    <span className="hidden sm:inline text-xs text-rose-400/80">
                        — Activa tu plan para no perder el acceso.
                    </span>
                </div>
                <a
                    href={contactHref}
                    className="shrink-0 flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                >
                    <Mail className="w-3 h-3" />
                    <span className="hidden xs:inline">Activar plan</span>
                    <span className="xs:hidden">Activar</span>
                </a>
                <button
                    onClick={handleDismiss}
                    className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-rose-500 hover:text-rose-300 hover:bg-rose-500/15 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        )
    }

    return (
        <div className="relative w-full bg-gradient-to-r from-orange-950/60 via-amber-950/40 to-orange-950/60 border-b border-orange-500/20 px-4 py-2.5 flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                {isTrial
                    ? <Zap className="w-4 h-4 text-orange-400 shrink-0" />
                    : <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                }
                <span className="text-sm font-semibold text-orange-200 truncate">
                    {daysText()}
                </span>
                <span className="hidden sm:inline text-xs text-orange-400/70">
                    {isTrial ? '— Activa un plan para continuar.' : '— Renueva para no perder el acceso.'}
                </span>
            </div>
            <a
                href={contactHref}
                className="shrink-0 flex items-center gap-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 hover:text-orange-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
            >
                <Mail className="w-3 h-3" />
                <span>Contactar</span>
            </a>
            <button
                onClick={handleDismiss}
                className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-orange-600 hover:text-orange-300 hover:bg-orange-500/10 transition-colors"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    )
}
