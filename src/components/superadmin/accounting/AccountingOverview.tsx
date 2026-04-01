'use client'

import { useState, useTransition } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { createPlatformEntry, deletePlatformEntry, type PlatformEntryData } from '@/lib/actions/superadmin'
import { Trash2 } from 'lucide-react'

export type PlatformEntry = {
  id:               string
  type:             'income' | 'expense'
  category:         string
  description:      string
  amount:           number
  transaction_date: string
  workshop_id:      string | null
  workshops:        { name: string } | null
}

interface Props {
  entries:     PlatformEntry[]
  workshopMap: Record<string, string> // id → name
}

export default function AccountingOverview({ entries, workshopMap }: Props) {
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all')
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const income  = entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0)
  const expense = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
  const net     = income - expense

  const filtered = activeTab === 'all' ? entries : entries.filter((e) => e.type === activeTab)

  const handleAddEntry = (fd: Omit<PlatformEntryData, never>) => {
    startTransition(async () => {
      const res = await createPlatformEntry(fd)
      setToast(res.ok ? 'Registro agregado.' : res.error)
      setTimeout(() => setToast(null), 3500)
      if (res.ok) setShowForm(false)
    })
  }

  const handleDeleteEntry = (id: string) => {
    if (!confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return
    startTransition(async () => {
      const res = await deletePlatformEntry(id)
      setToast(res.ok ? 'Registro eliminado.' : res.error)
      setTimeout(() => setToast(null), 3500)
    })
  }

  const TAB_LABELS: Record<'all' | 'income' | 'expense', string> = {
    all: 'Todos',
    income: 'Ingresos',
    expense: 'Gastos',
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-800 border border-zinc-700 text-white text-sm px-4 py-3 rounded-xl shadow-2xl">
          {toast}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Ingresos',     value: income,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Total Gastos',       value: expense, color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'Flujo de Caja Neto', value: net,     color: net >= 0 ? 'text-emerald-400' : 'text-red-400', bg: 'bg-zinc-800 border-zinc-700' },
        ].map((k) => (
          <div key={k.label} className={`rounded-2xl border p-5 ${k.bg}`}>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">{k.label}</p>
            <p className={`text-2xl font-black ${k.color}`}>{formatCurrency(k.value)}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {(['all', 'income', 'expense'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === t ? 'bg-orange-500 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 hover:-translate-y-0.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Agregar Registro
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <QuickEntryForm
          workshopMap={workshopMap}
          onSubmit={handleAddEntry}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Taller', 'Monto', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-600">
                    Sin registros aún.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-zinc-400 whitespace-nowrap">
                      {formatDate(e.transaction_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                        e.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {e.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{e.category}</td>
                    <td className="px-4 py-3 text-sm text-white">{e.description}</td>
                    <td className="px-4 py-3 text-sm text-zinc-500">
                      {e.workshops?.name ?? '—'}
                    </td>
                    <td className={`px-4 py-3 text-sm font-bold tabular-nums ${
                      e.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {e.type === 'income' ? '+' : '-'}{formatCurrency(e.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteEntry(e.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Quick entry form ───────────────────────────────────────

function QuickEntryForm({
  workshopMap,
  onSubmit,
  onCancel,
}: {
  workshopMap: Record<string, string>
  onSubmit: (fd: PlatformEntryData) => void
  onCancel: () => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const [fd, setFd] = useState<PlatformEntryData>({
    type: 'income', category: '', description: '',
    amount: 0, transaction_date: today,
  })

  const s = <K extends keyof PlatformEntryData>(k: K, v: PlatformEntryData[K]) =>
    setFd((p) => ({ ...p, [k]: v }))

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Nuevo Registro</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Tipo</label>
          <select value={fd.type} onChange={(e) => s('type', e.target.value as 'income' | 'expense')}
            className={sel}>
            <option value="income">Ingreso</option>
            <option value="expense">Gasto</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Categoría</label>
          <input value={fd.category} onChange={(e) => s('category', e.target.value)}
            placeholder="Suscripción, Servidor…" className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Monto (COP)</label>
          <input type="number" min={0} step={100} value={fd.amount}
            onChange={(e) => s('amount', Number(e.target.value))} className={inp} />
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="block text-xs font-medium text-zinc-400 mb-1">Descripción</label>
          <input value={fd.description} onChange={(e) => s('description', e.target.value)}
            placeholder="Suscripción Pro mensual — Taller XYZ" className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Fecha</label>
          <input type="date" value={fd.transaction_date}
            onChange={(e) => s('transaction_date', e.target.value)} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Taller (opc.)</label>
          <select value={fd.workshop_id ?? ''} onChange={(e) => s('workshop_id', e.target.value || undefined)}
            className={sel}>
            <option value="">— ninguno —</option>
            {Object.entries(workshopMap).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2 mt-4 justify-end">
        <button onClick={onCancel}
          className="px-4 py-2 text-sm text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors">
          Cancelar
        </button>
        <button onClick={() => onSubmit(fd)}
          className="px-5 py-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-400 rounded-xl transition-colors shadow shadow-orange-500/20">
          Agregar Registro
        </button>
      </div>
    </div>
  )
}

const inp = 'w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-colors'
const sel = 'w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-zinc-300 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer'
