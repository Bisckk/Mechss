import { createClient } from '@/lib/supabase/server'
import AccountingOverview from '@/components/superadmin/accounting/AccountingOverview'
import type { PlatformEntry } from '@/components/superadmin/accounting/AccountingOverview'

export default async function AccountingPage() {
  const supabase = await createClient()

  const [entriesRes, workshopsRes] = await Promise.all([
    supabase
      .from('platform_accounting')
      .select('id, type, category, description, amount, transaction_date, workshop_id, workshops(name)')
      .order('transaction_date', { ascending: false })
      .limit(100),
    supabase
      .from('workshops')
      .select('id, name')
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ])

  const entries = (entriesRes.data ?? []) as unknown as PlatformEntry[]

  const workshopRows = (workshopsRes.data ?? []) as unknown as { id: string; name: string }[]
  const workshopMap: Record<string, string> = Object.fromEntries(
    workshopRows.map((w) => [w.id, w.name])
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Contabilidad de Plataforma
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Ingresos SaaS por suscripciones y gastos operativos.
        </p>
      </div>
      <AccountingOverview entries={entries} workshopMap={workshopMap} />
    </div>
  )
}
