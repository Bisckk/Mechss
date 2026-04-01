'use client'

import { useState, useTransition } from 'react'
import { createPlan, updatePlan, type PlanFormData, type ActionResult } from '@/lib/actions/superadmin'
import type { PlanRow } from './PlansList'

interface Props {
  initial?: PlanRow
  onDone:  (result: ActionResult<unknown>) => void
}

const FEATURE_KEYS = [
  { key: 'appointments',  label: 'Citas' },
  { key: 'repairs',       label: 'Seguimiento de Reparaciones' },
  { key: 'inventory',     label: 'Inventario' },
  { key: 'accounting',    label: 'Contabilidad' },
  { key: 'landing_page',  label: 'Constructor de Landing Page' },
  { key: 'api_access',    label: 'Acceso a API' },
  { key: 'white_label',   label: 'Marca Blanca' },
]

const DEFAULT: PlanFormData = {
  name:          '',
  slug:          '',
  description:   '',
  price_monthly: 0,
  price_yearly:  0,
  trial_days:    14,
  max_users:     5,
  max_clients:   500,
  features: {
    appointments: true, repairs: true, inventory: true,
    accounting: false, landing_page: false, api_access: false, white_label: false,
  },
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function PlanForm({ initial, onDone }: Props) {
  const isEditing = !!initial
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState<PlanFormData>(
    initial
      ? {
          name: initial.name, slug: initial.slug,
          description: initial.description ?? '',
          price_monthly: initial.price_monthly, price_yearly: initial.price_yearly,
          trial_days: initial.trial_days, max_users: initial.max_users,
          max_clients: initial.max_clients, features: { ...initial.features },
        }
      : DEFAULT
  )

  const set = <K extends keyof PlanFormData>(key: K, value: PlanFormData[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'name' ? { slug: slugify(String(value)) } : {}),
    }))
  }

  const toggleFeature = (key: string) => {
    setForm((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] },
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = isEditing
        ? await updatePlan(initial!.id, form)
        : await createPlan(form)
      onDone(res)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
      <h2 className="text-base font-bold text-white">
        {isEditing ? `Editar Plan — ${initial!.name}` : 'Nuevo Plan'}
      </h2>

      {/* Basic info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Nombre del Plan *">
          <input {...inp} value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Profesional" required />
        </Field>

        <Field label="Slug *">
          <input {...inp} value={form.slug}
            onChange={(e) => set('slug', slugify(e.target.value))}
            placeholder="profesional" required />
        </Field>

        <Field label="Descripción" className="sm:col-span-2">
          <textarea {...inp} value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Para talleres en crecimiento…"
            rows={2} className={inp.className + ' resize-none'} />
        </Field>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Field label="Precio Mensual (COP) *">
          <input {...inp} type="number" min={0} step={100}
            value={form.price_monthly}
            onChange={(e) => set('price_monthly', Number(e.target.value))}
            required />
        </Field>

        <Field label="Precio Anual (COP) *">
          <input {...inp} type="number" min={0} step={100}
            value={form.price_yearly}
            onChange={(e) => set('price_yearly', Number(e.target.value))}
            required />
        </Field>

        <Field label="Días de Prueba">
          <input {...inp} type="number" min={0} max={90}
            value={form.trial_days}
            onChange={(e) => set('trial_days', Number(e.target.value))} />
        </Field>
      </div>

      {/* Limits */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Máx. Usuarios (-1 = ilimitado)">
          <input {...inp} type="number" min={-1}
            value={form.max_users}
            onChange={(e) => set('max_users', Number(e.target.value))} />
        </Field>

        <Field label="Máx. Clientes (-1 = ilimitado)">
          <input {...inp} type="number" min={-1}
            value={form.max_clients}
            onChange={(e) => set('max_clients', Number(e.target.value))} />
        </Field>
      </div>

      {/* Features */}
      <div>
        <p className="text-sm font-medium text-zinc-300 mb-3">Funcionalidades Incluidas</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {FEATURE_KEYS.map(({ key, label }) => (
            <label
              key={key}
              className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                form.features[key]
                  ? 'bg-orange-500/8 border-orange-500/25 text-orange-300'
                  : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-500 hover:border-zinc-600'
              }`}
            >
              <input
                type="checkbox"
                checked={!!form.features[key]}
                onChange={() => toggleFeature(key)}
                className="accent-orange-500 w-4 h-4"
              />
              <span className="text-xs font-semibold">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20"
        >
          {isPending ? 'Guardando…' : isEditing ? 'Guardar Cambios' : 'Crear Plan'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-zinc-300 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inp = {
  className:
    'w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all',
}
