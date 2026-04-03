'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { sendPasswordResetEmailAction } from '@/lib/actions/auth'

export default function ForgotPasswordPage() {
  const pageRef = useRef<HTMLDivElement>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.fp-card',
        { opacity: 0, y: 32 },
        { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }
      )
    }, pageRef)
    return () => ctx.revert()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)

    const result = await sendPasswordResetEmailAction(email.trim())

    if (!result.ok) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div
      ref={pageRef}
      className="min-h-screen bg-zinc-950 flex items-center justify-center px-4"
    >
      <div className="fp-card w-full max-w-[420px]">
        {/* Logo */}
        <Link href="/login" className="inline-flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
            </svg>
          </div>
          <span className="text-xl font-black text-white">
            Moto<span className="text-orange-500">Fix</span>
          </span>
        </Link>

        {sent ? (
          /* ── Success state ── */
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-white">Revisa tu correo</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Si <span className="text-white font-medium">{email}</span> tiene una cuenta activa,
              recibirás un enlace para restablecer tu contraseña en los próximos minutos.
            </p>
            <p className="text-zinc-600 text-xs">Revisa también la carpeta de spam.</p>
            <Link
              href="/login"
              className="inline-block mt-4 text-sm text-orange-400 hover:text-orange-300 font-medium transition-colors"
            >
              ← Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-black text-white mb-2">Olvidé mi contraseña</h2>
              <p className="text-zinc-400 text-sm">
                Ingresa tu correo y te enviaremos un enlace para restablecerla.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
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
                disabled={loading || !email.trim()}
                className="w-full py-4 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Enviando…
                  </span>
                ) : (
                  'Enviar enlace de restablecimiento'
                )}
              </button>

              <p className="text-center text-sm text-zinc-500">
                <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                  ← Volver al inicio de sesión
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
