'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { ChartEntry } from '@/components/superadmin/dashboard/WorkshopsChart'

const WorkshopsChart = dynamic(
  () => import('@/components/superadmin/dashboard/WorkshopsChart'),
  { ssr: false, loading: () => <div className="h-[220px] bg-zinc-800/40 animate-pulse rounded-xl" /> }
)

export default function ChartWrapper({ chartData }: { chartData: ChartEntry[] }) {
  const LABELS: Record<'workshops' | 'revenue', string> = { workshops: 'Talleres', revenue: 'Ingresos' }
  const [activeKey, setActiveKey] = useState<'workshops' | 'revenue'>('workshops')

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-white">Crecimiento de Talleres</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Últimos 6 meses</p>
        </div>
        <div className="flex gap-1 bg-zinc-800 rounded-xl p-1">
          {(['workshops', 'revenue'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setActiveKey(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeKey === k ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {LABELS[k]}
            </button>
          ))}
        </div>
      </div>
      <WorkshopsChart data={chartData} activeKey={activeKey} />
    </>
  )
}
