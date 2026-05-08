import { createClient } from '@/lib/supabase/server'
import PlansList from '@/components/superadmin/plans/PlansList'
import type { PlanRow } from '@/components/superadmin/plans/PlansList'

export default async function PlansPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('plans')
    .select('id, name, slug, description, price_monthly, price_yearly, trial_days, max_users, max_clients, features, is_active')
    .order('price_monthly', { ascending: true })

  const plans = (data ?? []) as PlanRow[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Planes y Suscripciones
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Define y gestiona los niveles de suscripción SaaS.
        </p>
      </div>
      <PlansList plans={plans} />
    </div>
  )
}
