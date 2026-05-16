'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { createClient } from '@/lib/supabase/client'
import { getRoleDashboardPath } from '@/lib/utils'
import type { UserRole } from '@/lib/supabase/types'

type Step = 'password' | 'mfa'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('password')
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaChallengeId, setMfaChallengeId] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const formRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.login-field',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, ease: 'expo.out', force3D: true, delay: 0.1 }
      )
    }, formRef)
    return () => ctx.revert()
  }, [])

  async function redirectByRole() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('La autenticación falló. Por favor intenta de nuevo.')
      setLoading(false)
      return
    }
    const { data: profileData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = (profileData as { role: UserRole } | null)?.role
    router.push(role ? getRoleDashboardPath(role) : '/dashboard')
    router.refresh()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Check if MFA upgrade is required
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.nextLevel === 'aal2' && aal.currentLevel !== aal.nextLevel) {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const fid = factors?.totp?.[0]?.id
      if (fid) {
        const { data: ch } = await supabase.auth.mfa.challenge({ factorId: fid })
        setMfaFactorId(fid)
        setMfaChallengeId(ch?.id ?? '')
        setTotpCode('')
        setStep('mfa')
        setLoading(false)
        return
      }
    }

    await redirectByRole()
  }

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (totpCode.length !== 6) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: mfaChallengeId,
      code: totpCode,
    })

    if (verifyErr) {
      setError('Código incorrecto. Inténtalo de nuevo.')
      setTotpCode('')
      const { data: ch } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId })
      setMfaChallengeId(ch?.id ?? '')
      setLoading(false)
      return
    }

    await redirectByRole()
  }

  return (
    <div ref={formRef}>
      {/* Password step */}
      {step === 'password' && (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Email */}
          <div className="login-field">
            <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="tu@taller.com"
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all duration-200"
            />
          </div>

          {/* Password */}
          <div className="login-field">
            <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••••"
                className="w-full px-4 py-3 pr-12 bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="login-field flex items-start gap-2.5 p-3.5 bg-red-500/8 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertIcon />
              <span>{error}</span>
            </div>
          )}

          {/* Options row */}
          <div className="login-field flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-zinc-950"
              />
              Recuérdame
            </label>
            <a href="/forgot-password" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Submit */}
          <div className="login-field">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <SpinnerIcon />
                  Iniciando sesión…
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>
        </form>
      )}

      {/* MFA step */}
      {step === 'mfa' && (
        <form onSubmit={handleMfaSubmit} className="space-y-5" noValidate>
          <div className="login-field text-center">
            <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon />
            </div>
            <h3 className="text-white font-bold text-lg">Verificación en dos pasos</h3>
            <p className="text-zinc-400 text-sm mt-1.5">Ingresa el código de 6 dígitos de tu aplicación autenticadora</p>
          </div>

          <div className="login-field">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={totpCode}
              onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              autoFocus
              autoComplete="one-time-code"
              className="w-full px-4 py-4 bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 rounded-xl text-white text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all duration-200 placeholder:tracking-normal placeholder:text-zinc-600"
            />
          </div>

          {error && (
            <div className="login-field flex items-start gap-2.5 p-3.5 bg-red-500/8 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertIcon />
              <span>{error}</span>
            </div>
          )}

          <div className="login-field">
            <button
              type="submit"
              disabled={loading || totpCode.length !== 6}
              className="w-full py-4 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <SpinnerIcon />
                  Verificando…
                </span>
              ) : (
                'Verificar Código'
              )}
            </button>
          </div>

          <div className="login-field text-center">
            <button
              type="button"
              onClick={() => { setStep('password'); setError(null); setTotpCode('') }}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← Volver al inicio de sesión
            </button>
          </div>
        </form>
      )}
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

function AlertIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function ShieldCheckIcon() {
  return (
    <svg className="w-7 h-7 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}
