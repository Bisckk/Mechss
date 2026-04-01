'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Building2, DollarSign, UserCheck, Timer, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export type StatsData = {
  totalWorkshops:   number
  monthlyRevenue:   number
  activeUsers:      number
  workshopsInTrial: number
  workshopsDelta:   number
  revenueDelta:     number
  usersDelta:       number
  trialDelta:       number
}

const DEMO: StatsData = {
  totalWorkshops:   2847,
  monthlyRevenue:   184320000,
  activeUsers:      14293,
  workshopsInTrial: 847,
  workshopsDelta:   12.3,
  revenueDelta:     8.7,
  usersDelta:       5.1,
  trialDelta:       -3.2,
}

export default function StatsCards({ data }: { data?: StatsData }) {
  const d = data ?? DEMO
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.stat-card',
        { opacity: 0, y: 28, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.09, ease: 'power3.out' }
      )
    }, ref)
    return () => ctx.revert()
  }, [])

  const tarjetas = [
    {
      etiqueta: 'Total Talleres',
      valor:    d.totalWorkshops.toLocaleString('es-CO'),
      delta:    d.workshopsDelta,
      Icono:    Building2,
      acento:   'text-blue-400',
      fondo:    'bg-blue-500/10 border-blue-500/20',
    },
    {
      etiqueta: 'Ingresos Mensuales',
      valor:    formatCurrency(d.monthlyRevenue),
      delta:    d.revenueDelta,
      Icono:    DollarSign,
      acento:   'text-emerald-400',
      fondo:    'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      etiqueta: 'Usuarios Activos',
      valor:    d.activeUsers.toLocaleString('es-CO'),
      delta:    d.usersDelta,
      Icono:    UserCheck,
      acento:   'text-purple-400',
      fondo:    'bg-purple-500/10 border-purple-500/20',
    },
    {
      etiqueta: 'En Período de Prueba',
      valor:    d.workshopsInTrial.toLocaleString('es-CO'),
      delta:    d.trialDelta,
      Icono:    Timer,
      acento:   'text-amber-400',
      fondo:    'bg-amber-500/10 border-amber-500/20',
    },
  ]

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
      {tarjetas.map((t) => {
        const sube = t.delta >= 0
        return (
          <div
            key={t.etiqueta}
            className="stat-card bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-xl border ${t.fondo}`}>
                <t.Icono className={`w-5 h-5 ${t.acento}`} />
              </div>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                sube ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {sube
                  ? <TrendingUp   className="w-3 h-3" />
                  : <TrendingDown className="w-3 h-3" />}
                {Math.abs(t.delta)}%
              </span>
            </div>

            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
              {t.valor}
            </p>
            <p className="text-xs text-zinc-500 font-medium">{t.etiqueta}</p>
            <p className="text-[11px] text-zinc-700 mt-1">vs. mes anterior</p>
          </div>
        )
      })}
    </div>
  )
}
