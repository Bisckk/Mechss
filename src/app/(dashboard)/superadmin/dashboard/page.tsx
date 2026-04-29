import { createClient } from '@/lib/supabase/server'
import StatsCards, { type StatsData } from '@/components/superadmin/dashboard/StatsCards'
import ChartWrapper from './ChartWrapper'
import type { ChartEntry } from '@/components/superadmin/dashboard/WorkshopsChart'
import { MESES_ES } from '@/lib/utils'
import DashboardAnimator from '@/components/ui/DashboardAnimator'

async function fetchStats(): Promise<StatsData> {
  const supabase = await createClient()

  const [
    { count: totalWorkshops },
    { count: activeUsers },
    { count: workshopsInTrial },
  ] = await Promise.all([
    supabase.from('workshops').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('workshops').select('*', { count: 'exact', head: true }).eq('plan_status', 'trial'),
  ])

  const { data: activePlansRaw } = await supabase
    .from('workshops')
    .select('plans(price_monthly)')
    .in('plan_status', ['active', 'trial'])

  const activePlans = (activePlansRaw ?? []) as unknown as { plans: { price_monthly: number } | null }[]
  const monthlyRevenue = activePlans.reduce((sum, w) => sum + (w.plans?.price_monthly ?? 0), 0)

  return {
    totalWorkshops:   totalWorkshops ?? 0,
    monthlyRevenue,
    activeUsers:      activeUsers ?? 0,
    workshopsInTrial: workshopsInTrial ?? 0,
    workshopsDelta:   12.3,
    revenueDelta:     8.7,
    usersDelta:       5.1,
    trialDelta:       -3.2,
  }
}

async function fetchChartData(): Promise<ChartEntry[]> {
  const supabase = await createClient()

  const since = new Date()
  since.setMonth(since.getMonth() - 5)
  since.setDate(1)

  const { data: rawData } = await supabase
    .from('workshops')
    .select('created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })

  const data = (rawData ?? []) as { created_at: string }[]

  if (!data.length) {
    return [
      { month: 'Oct', workshops: 0, revenue: 0 },
      { month: 'Nov', workshops: 0, revenue: 0 },
      { month: 'Dic', workshops: 0, revenue: 0 },
      { month: 'Ene', workshops: 0, revenue: 0 },
      { month: 'Feb', workshops: 0, revenue: 0 },
      { month: 'Mar', workshops: 0, revenue: 0 },
    ]
  }

  const counts: Record<string, number> = {}

  data.forEach((w) => {
    const d = new Date(w.created_at)
    const key = MESES_ES[d.getMonth()]
    counts[key] = (counts[key] ?? 0) + 1
  })

  return Object.entries(counts).map(([month, workshops]) => ({
    month,
    workshops,
    revenue: workshops * 79000, // precio estimado en COP
  }))
}

export default async function DashboardPage() {
  const [stats, chartData] = await Promise.all([fetchStats(), fetchChartData()])

  return (
    <div className="space-y-6 sm:space-y-8">
      <DashboardAnimator />
      <div className="dash-header">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Vista General
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Métricas en tiempo real de todos los inquilinos de MotoFix.
        </p>
      </div>

      <StatsCards data={stats} />

      {/* Chart card — ChartWrapper is a Client Component */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6">
        <ChartWrapper chartData={chartData} />
      </div>

      {/* Quick-links */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: '/superadmin/workshops', label: 'Gestionar Talleres', desc: 'Ver, crear y editar inquilinos',       icon: '🏢' },
          { href: '/superadmin/plans',     label: 'Planes y Precios',   desc: 'Editar niveles de suscripción',       icon: '💳' },
          { href: '/superadmin/users',     label: 'Usuarios Admin',     desc: 'Administrar admins de talleres',      icon: '👤' },
        ].map((ql) => (
          <a
            key={ql.href}
            href={ql.href}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 flex items-start gap-3 transition-all duration-150 hover:-translate-y-0.5 group"
          >
            <span className="text-2xl">{ql.icon}</span>
            <div>
              <p className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                {ql.label}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">{ql.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
