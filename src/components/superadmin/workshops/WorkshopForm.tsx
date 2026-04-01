'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkshop, type WorkshopFormData } from '@/lib/actions/superadmin'
import { formatCurrency } from '@/lib/utils'

type PlanOption = { id: string; name: string; price_monthly: number }

interface Props {
  planOptions: PlanOption[]
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const CIUDADES_COL = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
  'Bucaramanga', 'Pereira', 'Manizales', 'Ibagué', 'Cúcuta',
  'Santa Marta', 'Villavicencio', 'Pasto', 'Neiva', 'Armenia',
]

export default function WorkshopForm({ planOptions }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<WorkshopFormData>({
    name:             '',
    slug:             '',
    email:            '',
    phone:            '',
    city:             '',
    country:          'CO',
    plan_id:          planOptions[0]?.id ?? '',
    admin_full_name:  '',
    admin_email:      '',
    admin_password:   '',
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
    setError(null)

    startTransition(async () => {
      const res = await createWorkshop(form)
      if (res.ok) {
        router.push('/superadmin/workshops')
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* ── Workshop details ─────────────────────── */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-5">
          Datos del Taller
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nombre del Taller *">
            <input {...input} value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Moto Express Pro" required />
          </Field>

          <Field label="URL Slug *">
            <div className="flex rounded-xl overflow-hidden border border-zinc-700 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500/50 transition-all">
              <span className="flex items-center px-3 bg-zinc-800 text-zinc-500 text-sm border-r border-zinc-700 select-none">
                motofix.co/
              </span>
              <input
                value={form.slug}
                onChange={(e) => set('slug', slugify(e.target.value))}
                className="flex-1 bg-zinc-800/50 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"
                placeholder="moto-express-pro"
                required
              />
            </div>
          </Field>

          <Field label="Email de Contacto">
            <input {...input} type="email" value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="contacto@taller.com" />
          </Field>

          <Field label="Teléfono">
            <input {...input} type="tel" value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+57 300 123 4567" />
          </Field>

          <Field label="Ciudad">
            <div className="relative">
              <input {...input} value={form.city}
                onChange={(e) => set('city', e.target.value)}
                placeholder="Bogotá"
                list="ciudades-col" />
              <datalist id="ciudades-col">
                {CIUDADES_COL.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </Field>

          <Field label="País">
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
          </Field>
        </div>
      </section>

      {/* ── Plan selection ────────────────────────── */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-5">
          Plan de Suscripción
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
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
                <p className="text-xs text-zinc-500">{formatCurrency(plan.price_monthly)}/mes</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* ── Initial Admin user ────────────────────── */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-1">
          Usuario Admin Inicial
        </h2>
        <p className="text-xs text-zinc-600 mb-5">
          Se creará una cuenta <strong className="text-zinc-400">Admin</strong> y se vinculará a este taller.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Nombre Completo *">
            <input {...input} value={form.admin_full_name}
              onChange={(e) => set('admin_full_name', e.target.value)}
              placeholder="Juan Pérez" required />
          </Field>

          <Field label="Email *">
            <input {...input} type="email" value={form.admin_email}
              onChange={(e) => set('admin_email', e.target.value)}
              placeholder="admin@taller.com" required />
          </Field>

          <Field label="Contraseña Temporal *">
            <input {...input} type="password" value={form.admin_password}
              onChange={(e) => set('admin_password', e.target.value)}
              placeholder="Mín. 8 caracteres"
              minLength={8} required />
          </Field>
        </div>
      </section>

      {/* ── Error + Submit ───────────────────────── */}
      {error && (
        <div className="flex items-start gap-2.5 p-4 bg-red-500/8 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/20"
        >
          {isPending ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creando…
            </>
          ) : 'Crear Taller'}
        </button>
      </div>
    </form>
  )
}

// ── Helpers ───────────────────────────────────────────────

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
    'w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all',
}
