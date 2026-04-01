'use client'

import { useState, useTransition } from 'react'
import { formatDate } from '@/lib/utils'
import { suspendAdminUser, activateAdminUser, sendPasswordReset } from '@/lib/actions/superadmin'
import AdminUserForm from './AdminUserForm'

export type AdminUser = {
  id:          string
  full_name:   string
  email:       string
  role:        string
  is_active:   boolean
  created_at:  string
  workshop_id: string | null
  workshops:   { name: string } | null
}

export type PlanOption = { id: string; name: string }

interface Props {
  users: AdminUser[]
  workshops: { id: string; name: string }[]
  planOptions: PlanOption[]
}

export default function AdminUsersList({ users, workshops, planOptions }: Props) {
  const [search, setSearch] = useState('')
  const [toast, setToast]   = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [, startT] = useTransition()

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.workshops?.name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const notify = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const toggle = (user: AdminUser) => {
    startT(async () => {
      const res = user.is_active
        ? await suspendAdminUser(user.id)
        : await activateAdminUser(user.id)
      notify(res.ok ? (user.is_active ? 'Usuario suspendido.' : 'Usuario activado.') : res.error)
    })
  }

  const resetPwd = (email: string) => {
    if (!confirm(`¿Enviar correo de restablecimiento de contraseña a ${email}?`)) return
    startT(async () => {
      const res = await sendPasswordReset(email)
      notify(res.ok ? `Correo de restablecimiento enviado a ${email}.` : res.error)
    })
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-800 border border-zinc-700 text-white text-sm px-4 py-3 rounded-xl shadow-2xl">
          {toast}
        </div>
      )}

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative max-w-sm w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Buscar por nombre, email o taller…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-colors"
            />
          </div>
          
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/20 hover:-translate-y-0.5 whitespace-nowrap ml-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Admin
          </button>
        </div>

        <p className="text-xs text-zinc-600">
        Mostrando <span className="text-zinc-400 font-semibold">{filtered.length}</span> de {users.length} usuarios
      </p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Usuario', 'Taller', 'Rol', 'Estado', 'Registrado', 'Acciones'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-600">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                    {/* User */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-zinc-300">
                            {u.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{u.full_name}</p>
                          <p className="text-[11px] text-zinc-500">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Workshop */}
                    <td className="px-4 py-3.5 text-sm text-zinc-400">
                      {u.workshops?.name ?? <span className="text-zinc-700">—</span>}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-semibold capitalize px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400">
                        {u.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        u.is_active
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-zinc-700/50 text-zinc-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                        {u.is_active ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3.5 text-sm text-zinc-500">
                      {formatDate(u.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        {/* Suspend / Activate */}
                        <button
                          onClick={() => toggle(u)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            u.is_active
                              ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                              : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                          }`}
                        >
                          {u.is_active ? 'Suspender' : 'Activar'}
                        </button>

                        {/* Reset password */}
                        <button
                          onClick={() => resetPwd(u.email)}
                          className="px-3 py-1.5 text-xs font-semibold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                          title="Enviar correo de restablecimiento"
                        >
                          Restablecer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <AdminUserForm
          workshops={workshops}
          planOptions={planOptions}
          onCancel={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            notify('Usuario Admin creado exitosamente.')
          }}
        />
      )}
    </div>
  )
}
