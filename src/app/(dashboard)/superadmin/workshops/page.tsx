import { createClient } from '@/lib/supabase/server'
import WorkshopsList from '@/components/superadmin/workshops/WorkshopsList'
import type { WorkshopRowExt, PlanOption } from '@/components/superadmin/workshops/WorkshopModal'

export default async function WorkshopsPage() {
  const supabase = await createClient()

  const [workshopsRes, plansRes] = await Promise.all([
    supabase
      .from('workshops')
      .select('id, name, slug, phone, country, city, email, plan_status, plan_id, created_at, plans(name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('plans')
      .select('id, name')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true }),
  ])

  const workshops = (workshopsRes.data ?? []) as unknown as WorkshopRowExt[]
  const planOptions = (plansRes.data ?? []) as PlanOption[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Talleres</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {workshops.length} taller{workshops.length !== 1 ? 'es' : ''} registrado{workshops.length !== 1 ? 's' : ''} en la plataforma.
        </p>
      </div>
      <WorkshopsList workshops={workshops} planOptions={planOptions} />
    </div>
  )
}
