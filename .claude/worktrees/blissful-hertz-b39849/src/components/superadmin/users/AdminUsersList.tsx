'use client'

import { useState, useTransition } from 'react'
import { formatDate } from '@/lib/utils'
import { suspendAdminUser, activateAdminUser, sendPasswordReset, setTempPasswordAction } from '@/lib/actions/superadmin'
import AdminUserForm from './AdminUserForm'

export type AdminUser = {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  workshop_id: string | null
  workshops: { name: string } | null
}

export type PlanOption = { id: string; name: string }

interface Props {
  users: AdminUser[]
  workshops: { id: string; name: string }[]
  planOptions: PlanOption[]
}

export default function AdminUsersList({ users, workshops, planOptions }: Props) {
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [, startT] = useTransition()

  // Temp password modal state
  const [tempPwdUser, setTempPwdUser] = useState<AdminUser | null>(null)
  const [tempPwd, setTempPwd] = useState('')
  const [showTempPwd, setShowTempPwd] = useState(false)
  const [tempPwdLoading, setTempPwdLoading] = useState(false)
  const [tempPwdError, setTempPwdError] = useState<string | null>(null)

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

  const openTempPwd = (user: AdminUser) => {
    setTempPwdUser(user)
    setTempPwd('')
    setShowTempPwd(false)
    setTempPwdError(null)
  }

  const closeTempPwd = () => {
    setTempPwdUser(null)
    setTempPwd('')
    setTempPwdError(null)
  }

  const submitTempPwd = async () => {
    if (!tempPwdUser) return
    if (tempPwd.length < 8) {
      setTempPwdError('Mínimo 8 caracteres.')
      return
    }
    setTempPwdLoading(true)
    setTempPwdError(null)
    const res = await setTempPasswordAction(tempPwdUser.id, tempPwd)
    setTempPwdLoading(false)
    if (!res.ok) {
      setTempPwdError(res.error)
      return
    }
    closeTempPwd()
    notify(`Contraseña temporal asignada a ${tempPwdUser.full_name}. Se le pedirá cambiarla al ingresar.`)
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
          onClick={() => {
            setEditingUser(null)
            setShowForm(true)
          }}
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
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${u.is_active
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
                        <button
                          onClick={() => {
                            setEditingUser(u)
                            setShowForm(true)
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg transition-colors"
                        >
                          Editar
                        </button>

                        {/* Suspend / Activate */}
                        <button
                          onClick={() => toggle(u)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${u.is_active
                              ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                              : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                            }`}
                        >
                          {u.is_active ? 'Suspender' : 'Activar'}
                        </button>

                        {/* Send reset email */}
                        <button
                          onClick={() => resetPwd(u.email)}
                          className="px-3 py-1.5 text-xs font-semibold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                          title="Enviar correo de restablecimiento"
                        >
                          Enviar email
                        </button>

                        {/* Assign temp password */}
                        <button
                          onClick={() => openTempPwd(u)}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="Asignar contraseña temporal"
                        >
                          Contraseña temp.
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
          initialData={editingUser}
          onCancel={() => {
            setShowForm(false)
            setEditingUser(null)
          }}
          onSuccess={(isEdit) => {
            setShowForm(false)
            setEditingUser(null)
            notify(isEdit ? 'Usuario actualizado exitosamente.' : 'Usuario Admin creado exitosamente.')
          }}
        />
      )}

      {/* ── Temp Password Modal ── */}
      {tempPwdUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[420px] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Contraseña temporal</h3>
                <p className="text-sm text-zinc-400 mt-0.5">
                  Para <span className="text-white font-medium">{tempPwdUser.full_name}</span>
                </p>
              </div>
              <button
                onClick={closeTempPwd}
                className="text-zinc-500 hover:text-white transition-colors mt-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-2.5 p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl text-amber-300 text-xs leading-relaxed">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                El usuario deberá cambiar esta contraseña <strong>obligatoriamente</strong> en su próximo ingreso.
              </span>
            </div>

            {/* Password input */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Contraseña temporal
              </label>
              <div className="relative">
                <input
                  type={showTempPwd ? 'text' : 'password'}
                  value={tempPwd}
                  onChange={(e) => { setTempPwd(e.target.value); setTempPwdError(null) }}
                  placeholder="Mínimo 8 caracteres"
                  autoFocus
                  className="w-full px-4 py-3 pr-12 bg-zinc-900 border border-zinc-700 hover:border-zinc-600 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowTempPwd(!showTempPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showTempPwd ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {tempPwdError && (
                <p className="text-xs text-red-400 mt-1.5">{tempPwdError}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={closeTempPwd}
                className="flex-1 py-2.5 text-sm font-semibold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={submitTempPwd}
                disabled={tempPwdLoading || tempPwd.length < 8}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {tempPwdLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Asignando…
                  </>
                ) : (
                  'Asignar contraseña'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
