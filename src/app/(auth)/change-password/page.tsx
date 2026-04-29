'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { createClient } from '@/lib/supabase/client'
import { forcedChangePasswordAction } from '@/lib/actions/auth'
import type { UserRole } from '@/lib/supabase/types'
import { getRoleDashboardPath } from '@/lib/utils'

export default function ChangePasswordPage() {
  const pageRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.cp-card',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', force3D: true }
      )
    }, pageRef)
    return () => ctx.revert()
  }, [])

  // Verify the user is authenticated; if not, send to login
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/login')
        return
      }
      // Show a personalized greeting
      supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data && (data as any).full_name) setUserName((data as any).full_name)
        })
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const res = await forcedChangePasswordAction(password)

    if (!res.ok) {
      setError(res.error)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)

    // Redirect to role dashboard after a brief success moment
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profileData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      const role = (profileData as { role: UserRole } | null)?.role
      setTimeout(() => router.push(role ? getRoleDashboardPath(role) : '/dashboard'), 2000)
    }
  }

  return (
    <div
      ref={pageRef}
      className="min-h-screen bg-zinc-950 flex items-center justify-center px-4"
    >
      <div className="cp-card w-full max-w-[460px]">
        {/* Logo */}
        <div className="inline-flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
            </svg>
          </div>
          <span className="text-xl font-black text-white">
            Moto<span className="text-orange-500">Fix</span>
          </span>
        </div>

        {done ? (
          /* ── Success ── */
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-white">¡Contraseña actualizada!</h2>
            <p className="text-zinc-400 text-sm">Tu nueva contraseña está activa. Redirigiendo…</p>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full mb-4">
                <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Acción requerida</span>
              </div>
              <h2 className="text-3xl font-black text-white mb-2">
                {userName ? `Hola, ${userName.split(' ')[0]}` : 'Cambio de contraseña'}
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Se te ha asignado una contraseña temporal. Por tu seguridad, debes crear una nueva contraseña antes de continuar.
              </p>
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="new-password">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-4 py-3 pr-12 bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="confirm-password">
                  Confirmar nueva contraseña
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="Repite la contraseña"
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all duration-200"
                />
              </div>

              {/* Password strength hints */}
              <div className="flex items-center gap-4 text-xs text-zinc-600">
                <span className={password.length >= 8 ? 'text-emerald-400' : ''}>
                  ✓ Mínimo 8 caracteres
                </span>
                <span className={password === confirm && confirm.length > 0 ? 'text-emerald-400' : ''}>
                  ✓ Las contraseñas coinciden
                </span>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-500/8 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="w-full py-4 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Guardando…
                  </span>
                ) : (
                  'Guardar nueva contraseña'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}
