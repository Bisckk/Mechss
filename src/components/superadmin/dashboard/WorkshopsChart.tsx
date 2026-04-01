'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

export type ChartEntry = { month: string; workshops: number; revenue: number }

const DEMO_DATA: ChartEntry[] = [
  { month: 'Oct', workshops: 178, revenue: 142400000 },
  { month: 'Nov', workshops: 215, revenue: 172000000 },
  { month: 'Dic', workshops: 248, revenue: 148600000 },
  { month: 'Ene', workshops: 294, revenue: 176400000 },
  { month: 'Feb', workshops: 341, revenue: 204600000 },
  { month: 'Mar', workshops: 410, revenue: 246000000 },
]

interface CustomTooltipProps {
  active?:  boolean
  payload?: { value: number; dataKey: string }[]
  label?:   string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-sm font-semibold text-white">
          {p.dataKey === 'revenue'
            ? formatCurrency(p.value)
            : `${p.value} talleres`}
        </p>
      ))}
    </div>
  )
}

interface Props {
  data?:       ChartEntry[]
  activeKey?:  'workshops' | 'revenue'
}

export default function WorkshopsChart({ data = DEMO_DATA, activeKey = 'workshops' }: Props) {
  const isRevenue = activeKey === 'revenue'

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradWorkshops" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#f97316" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />

        <XAxis
          dataKey="month"
          tick={{ fill: '#71717a', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis
          tick={{ fill: '#71717a', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          dx={-4}
          tickFormatter={(v: number) =>
            isRevenue ? `$${(v / 1000000).toFixed(0)}M` : String(v)
          }
          width={isRevenue ? 50 : 32}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1 }} />

        <Area
          type="monotone"
          dataKey={activeKey}
          stroke={isRevenue ? '#10b981' : '#f97316'}
          strokeWidth={2.5}
          fill={isRevenue ? 'url(#gradRevenue)' : 'url(#gradWorkshops)'}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0, fill: isRevenue ? '#10b981' : '#f97316' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
