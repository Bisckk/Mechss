'use client'

import { useState, useTransition } from 'react'
import { updateWorkshop, type WorkshopFormData } from '@/lib/actions/superadmin'
import { formatCurrency, formatDate } from '@/lib/utils'

export type WorkshopRowExt = {
  id:           string
  name:         string
  slug:         string
  phone:        string | null
  country:      string | null
  city:         string | null
  email:        string | null
  plan_status:  'active' | 'trial' | 'inactive'
  plan_id:      string | null
  created_at:   string
  plans:        { name: string } | null
}

export type PlanOption = { id: string; name: string; price_monthly?: number }

interface Props {
  workshop: WorkshopRowExt
  planOptions: PlanOption[]
  mode: 'view' | 'edit'
  onClose: () => void
  onSuccess: () => void
}

const CIUDADES_COL = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
  'Bucaramanga', 'Pereira', 'Manizales', 'Ibagué', 'Cúcuta',
  'Santa Marta', 'Villavicencio', 'Pasto', 'Neiva', 'Armenia',
]

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function WorkshopModal({ workshop, planOptions, mode, onClose, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isView = mode === 'view'

  const [form, setForm] = useState<Partial<WorkshopFormData>>({
    name: workshop.name,
    slug: workshop.slug,
    email: workshop.email ?? '',
    phone: workshop.phone ?? '',
    city: workshop.city ?? '',
    country: workshop.country ?? 'CO',
    plan_id: workshop.plan_id ?? planOptions[0]?.id ?? '',
  })

  const set = (key: keyof WorkshopFormData, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'name' ? { slug: slugify(value) } : {}),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isView) return onClose()
    
    setError(null)
    startTransition(async () => {
      const res = await updateWorkshop(workshop.id, form)
      if (res.ok) {
        onSuccess()
      } else {
        setError(res.error)
      }
    })
  }

  // Get current plan name for view mode
  const currentPlanName = planOptions.find(p => p.id === workshop.plan_id)?.name ?? 'Sin plan asignado'

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-auto">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900/95 backdrop-blur-md z-10">
          <h2 className="text-lg font-bold text-white">
            {isView ? 'Detalles del Taller' : 'Editar Taller'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 max-h-[calc(100vh-160px)] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* ── Metadata / Read Only ───────────────────── */}
          {isView && (
             <div className="grid grid-cols-2 gap-4 bg-zinc-800/50 rounded-xl p-4 mb-6">
                <div>
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Estado</p>
                  <p className="text-sm font-medium text-white mt-1 capitalize">{workshop.plan_status}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Registrado el</p>
                  <p className="text-sm font-medium text-white mt-1">{formatDate(workshop.created_at)}</p>
                </div>
             </div>
          )}

          {/* ── Fields ─────────────────────────────────── */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nombre del Taller">
              <input {...input} value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Moto Express Pro" required disabled={isView} />
            </Field>

            <Field label="URL Slug">
              <div className="flex rounded-xl overflow-hidden border border-zinc-700 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500/50 transition-all">
                <span className="flex items-center px-3 bg-zinc-800 text-zinc-500 text-sm border-r border-zinc-700 select-none">
                  motofix.co/
                </span>
                <input
                  value={form.slug}
                  onChange={(e) => set('slug', slugify(e.target.value))}
                  className="flex-1 bg-zinc-800/50 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none disabled:bg-zinc-800/20 disabled:text-zinc-400"
                  placeholder="moto-express-pro"
                  required disabled={isView}
                />
              </div>
            </Field>

            <Field label="Email de Contacto">
              <input {...input} type="email" value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="contacto@taller.com" disabled={isView} />
            </Field>

            <Field label="Teléfono">
              <input {...input} type="tel" value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+57 300 123 4567" disabled={isView} />
            </Field>

            <Field label="Ciudad">
              {!isView ? (
                <div className="relative">
                  <input {...input} value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    placeholder="Bogotá"
                    list="ciudades-col-modal" />
                  <datalist id="ciudades-col-modal">
                    {CIUDADES_COL.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              ) : (
                <input {...input} value={form.city || '—'} readOnly disabled />
              )}
            </Field>

            <Field label="País">
              {!isView ? (
                <select
                  value={form.country}
                  onChange={(e) => set('country', e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all cursor-pointer"
                >
                  <option value="CO">🇨🇴 Colombia</option>
                  <option value="MX">🇲🇽 México</option>
                  <option value="EC">🇪🇨 Ecuador</option>
                  <option value="PE">🇵🇪 Perú</option>
                  <option value="VE">🇻🇪 Venezuela</option>
                  <option value="AR">🇦🇷 Argentina</option>
                  <option value="CL">🇨🇱 Chile</option>
                  <option value="PA">🇵🇦 Panamá</option>
                </select>
              ) : (
                 <input {...input} value={form.country === 'CO' ? '🇨🇴 Colombia' : form.country || '—'} readOnly disabled />
              )}
            </Field>
          </div>

          {/* ── Plan Selection ────────────────────────── */}
          <div className="border-t border-zinc-800 pt-6">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">
              Plan de Suscripción Actual
            </h3>
            {isView ? (
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
                 <p className="text-sm font-bold text-white">{currentPlanName}</p>
                 <p className="text-xs text-zinc-500 mt-0.5">La modificación del plan se realiza desde la opción editar.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {planOptions.map((plan) => (
                  <label
                    key={plan.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
                      form.plan_id === plan.id
                        ? 'border-orange-500/50 bg-orange-500/5'
                        : 'border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={plan.id}
                      checked={form.plan_id === plan.id}
                      onChange={() => set('plan_id', plan.id)}
                      className="mt-0.5 accent-orange-500"
                    />
                    <div>
                      <p className="text-sm font-bold text-white">{plan.name}</p>
                      {plan.price_monthly !== undefined && (
                        <p className="text-xs text-zinc-500">{formatCurrency(plan.price_monthly!)}/mes</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* ── Footer Actions ────────────────────────── */}
          <div className="pt-6 border-t border-zinc-800 flex gap-3 justify-end items-center sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              {isView ? 'Cerrar' : 'Cancelar'}
            </button>
            {!isView && (
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {isPending ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const input = {
  className:
    'w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed',
}
