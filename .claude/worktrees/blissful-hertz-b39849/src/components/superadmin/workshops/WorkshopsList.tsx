'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { deleteWorkshop, changeWorkshopPlan, toggleWorkshopStatus, type ActionResult } from '@/lib/actions/superadmin'
import WorkshopModal, { type WorkshopRowExt, type PlanOption } from './WorkshopModal'

interface Props {
  workshops:    WorkshopRowExt[]
  planOptions:  PlanOption[]
}

const STATUS_STYLES = {
  active:   { dot: 'bg-emerald-400', pill: 'bg-emerald-500/10 text-emerald-400', label: 'Activo' },
  trial:    { dot: 'bg-amber-400',   pill: 'bg-amber-500/10 text-amber-400',     label: 'Prueba' },
  inactive: { dot: 'bg-zinc-500',    pill: 'bg-zinc-700/50 text-zinc-400',       label: 'Inactivo' },
}

export default function WorkshopsList({ workshops, planOptions }: Props) {
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState<'all' | 'active' | 'trial' | 'inactive'>('all')
  const [toast,    setToast]    = useState<string | null>(null)
  const [modal,    setModal]    = useState<{ open: boolean; mode: 'view' | 'edit'; workshop: WorkshopRowExt | null }>({ open: false, mode: 'view', workshop: null })
  // NEW: State for beautiful confirm modal
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; workshopId: string; name: string; currentStatus: string } | null>(null)
  const [, startTransition] = useTransition()

  const filtered = workshops.filter((w) => {
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase()) ||
                        (w.city ?? '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || w.plan_status === filter
    return matchSearch && matchFilter
  })

  const notify = (res: ActionResult) => {
    setToast(res.ok ? '¡Listo!' : res.error)
    setTimeout(() => setToast(null), 3000)
  }

  const executeToggleStatus = (id: string, currentStatus: string) => {
    const isInactive = currentStatus === 'inactive'
    
    startTransition(async () => {
      const res = await toggleWorkshopStatus(id, isInactive ? 'active' : 'inactive')
      notify(res)
      setConfirmDialog(null)
    })
  }

  const requestToggleStatus = (id: string, name: string, currentStatus: string) => {
    setConfirmDialog({ open: true, workshopId: id, name, currentStatus })
  }

  const handlePlanChange = (workshopId: string, planId: string) => {
    startTransition(async () => {
      const res = await changeWorkshopPlan(workshopId, planId, 'active')
      notify(res)
    })
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-800 border border-zinc-700 text-white text-sm px-4 py-3 rounded-xl shadow-2xl">
          {toast}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Buscar por nombre o ciudad…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-colors"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {(['all', 'active', 'trial', 'inactive'] as const).map((s) => {
            const LABEL: Record<string, string> = { all: 'Todos', active: 'Activo', trial: 'Prueba', inactive: 'Inactivo' }
            return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                filter === s
                  ? 'bg-orange-500 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {LABEL[s]}
            </button>
          )})}
        </div>

        <Link
          href="/superadmin/workshops/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/20 hover:-translate-y-0.5 whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Taller
        </Link>
      </div>

      {/* Count */}
      <p className="text-xs text-zinc-600">
        Mostrando <span className="text-zinc-400 font-semibold">{filtered.length}</span> de {workshops.length} talleres
      </p>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Taller', 'Plan', 'Estado', 'Ciudad', 'Creado', 'Acciones'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-zinc-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-600">
                    No se encontraron talleres.
                  </td>
                </tr>
              ) : (
                filtered.map((w) => {
                  const s = STATUS_STYLES[w.plan_status]
                  return (
                    <tr key={w.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-semibold text-white">{w.name}</p>
                        {w.email && (
                          <p className="text-[11px] text-zinc-500 mt-0.5">{w.email}</p>
                        )}
                      </td>

                      {/* Inline plan change deleted - display static */}
                      <td className="px-4 py-3.5">
                        <span className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-xs text-zinc-300 px-2.5 py-1.5">
                          {w.plans?.name ?? 'Sin plan'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-sm text-zinc-400">
                        {w.city ?? '—'}
                      </td>

                      <td className="px-4 py-3.5 text-sm text-zinc-500">
                        {formatDate(w.created_at)}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          {/* View details */}
                          <button
                            onClick={() => setModal({ open: true, mode: 'view', workshop: w })}
                            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                            title="Ver Detalles"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {/* Edit details */}
                          <button
                            onClick={() => setModal({ open: true, mode: 'edit', workshop: w })}
                            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {/* Toggle Status */}
                          <button
                            onClick={() => requestToggleStatus(w.id, w.name, w.plan_status)}
                            className={`p-1.5 text-zinc-500 hover:text-white rounded-lg transition-colors ${
                              w.plan_status === 'inactive' ? 'hover:bg-emerald-500/10 hover:text-emerald-400' : 'hover:bg-amber-500/10 hover:text-amber-400'
                            }`}
                            title={w.plan_status === 'inactive' ? 'Activar' : 'Inactivar'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal.open && modal.workshop && (
        <WorkshopModal
          workshop={modal.workshop}
          planOptions={planOptions}
          mode={modal.mode}
          onClose={() => setModal({ ...modal, open: false })}
          onSuccess={() => {
            setModal({ ...modal, open: false })
            notify({ ok: true, data: null })
          }}
        />
      )}

      {/* ── Confirm Modal ────────────────────────────── */}
      {confirmDialog && confirmDialog.open && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2">
              ¿{confirmDialog.currentStatus === 'inactive' ? 'Activar' : 'Inactivar'} Taller?
            </h3>
            <p className="text-sm text-zinc-400 mb-6">
              Estás a punto de {confirmDialog.currentStatus === 'inactive' ? 'activar' : 'inactivar'} el taller <strong className="text-white">"{confirmDialog.name}"</strong>.
              {confirmDialog.currentStatus !== 'inactive' && ' El sistema lo ocultará y pausará sus funciones principales pero no borrará sus datos.'}
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => executeToggleStatus(confirmDialog.workshopId, confirmDialog.currentStatus)}
                className={`flex-1 px-4 py-2.5 text-white text-sm font-bold rounded-xl transition-colors shadow-lg ${
                  confirmDialog.currentStatus === 'inactive'
                    ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'
                    : 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
