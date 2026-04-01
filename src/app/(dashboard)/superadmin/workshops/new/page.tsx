import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import WorkshopForm from '@/components/superadmin/workshops/WorkshopForm'

export default async function NewWorkshopPage() {
  const supabase = await createClient()

  const { data: plans } = await supabase
    .from('plans')
    .select('id, name, price_monthly')
    .eq('is_active', true)
    .order('price_monthly', { ascending: true })

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/superadmin/workshops" className="hover:text-white transition-colors">
          Talleres
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-zinc-300">Nuevo Taller</span>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Nuevo Taller</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Crea un nuevo inquilino y aprovisiona una cuenta Admin inicial.
        </p>
      </div>

      <WorkshopForm planOptions={plans ?? []} />
    </div>
  )
}
