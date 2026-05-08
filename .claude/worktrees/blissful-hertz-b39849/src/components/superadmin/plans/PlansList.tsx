'use client'

import { useState, useTransition } from 'react'
import { deletePlan, type ActionResult } from '@/lib/actions/superadmin'
import { formatCurrency } from '@/lib/utils'
import PlanForm from './PlanForm'

export type PlanRow = {
  id:            string
  name:          string
  slug:          string
  description:   string | null
  price_monthly: number
  price_yearly:  number
  trial_days:    number
  max_users:     number
  max_clients:   number
  features:      Record<string, boolean>
  is_active:     boolean
}

interface Props { plans: PlanRow[] }

export default function PlansList({ plans }: Props) {
  const [editing, setEditing] = useState<PlanRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const notify = (res: ActionResult<unknown>) => {
    setToast(res.ok ? 'Guardado correctamente.' : res.error)
    setTimeout(() => setToast(null), 3500)
    if (res.ok) { setEditing(null); setCreating(false) }
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`¿Eliminar el plan "${name}"? Todos los talleres vinculados deben migrarse primero.`)) return
    startTransition(async () => {
      const res = await deletePlan(id)
      notify(res)
    })
  }

  if (creating || editing) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => { setCreating(false); setEditing(null) }}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Planes
        </button>
        <PlanForm
          initial={editing ?? undefined}
          onDone={notify}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-800 border border-zinc-700 text-white text-sm px-4 py-3 rounded-xl shadow-2xl">
          {toast}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 hover:-translate-y-0.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Plan
        </button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 transition-colors flex flex-col gap-4 h-full"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="w-full">
                <div className="flex items-center gap-2 mb-1 justify-between">
                  <h3 className="text-base font-bold text-white">{plan.name}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    plan.is_active
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-zinc-700 text-zinc-500'
                  }`}>
                    {plan.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 min-h-[32px]">{plan.description}</p>
              </div>
            </div>

            {/* Pricing */}
            <div className="flex items-end gap-4">
              <div>
                <p className="text-2xl font-black text-white">{formatCurrency(plan.price_monthly)}<span className="text-sm font-normal text-zinc-500">/mes</span></p>
                <p className="text-xs text-zinc-600">{formatCurrency(plan.price_yearly)}/año · {plan.trial_days} días de prueba</p>
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-2 gap-2 py-3 border-t border-zinc-800">
              <Limit label="Usuarios"  value={plan.max_users   === -1 ? '∞' : plan.max_users} />
              <Limit label="Clientes"  value={plan.max_clients === -1 ? '∞' : plan.max_clients} />
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-1.5 flex-1 content-start">
              {Object.entries(plan.features)
                .filter(([, v]) => v)
                .map(([k]) => (
                  <span key={k} className="text-[10px] font-semibold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md capitalize flex-shrink-0">
                    {k.replace(/_/g, ' ')}
                  </span>
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1 border-t border-zinc-800 mt-auto">
              <button
                onClick={() => setEditing(plan)}
                className="flex-1 py-2 text-sm font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(plan.id, plan.name)}
                className="px-3 py-2 text-sm font-semibold text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Limit({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-zinc-800/40 hover:bg-zinc-800/60 transition-colors border border-zinc-700/50 rounded-xl p-3 flex flex-col items-center justify-center text-center">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-0.5">{label}</p>
    </div>
  )
}
