'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import Link from 'next/link'
import LoginForm from '@/components/auth/LoginForm'

const features = [
  'Agendamiento inteligente de citas',
  'Seguimiento de reparaciones con códigos únicos',
  'Control de acceso por roles',
  'Inventario y gestión financiera',
]

export default function LoginPage() {
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.fromTo('.login-left',  { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.8 })
        .fromTo('.login-right', { opacity: 0, x: 40 },  { opacity: 1, x: 0, duration: 0.8 }, '-=0.65')
    }, pageRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={pageRef} className="min-h-screen bg-zinc-950 flex">

      {/* ── Left panel: brand ── */}
      <div className="login-left hidden lg:flex flex-col justify-between w-1/2 bg-zinc-900 border-r border-zinc-800 p-12 xl:p-16 relative overflow-hidden">
        {/* Background decoration */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 bg-orange-500/8 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl" />

        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-3 group w-fit">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-xl shadow-orange-500/30">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
            </svg>
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            Moto<span className="text-orange-500">Fix</span>
          </span>
        </Link>

        {/* Mid: headline + features */}
        <div className="relative z-10">
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight mb-4">
            Tu taller,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
              en tus manos.
            </span>
          </h1>
          <p className="text-zinc-400 text-base mb-10 leading-relaxed max-w-sm">
            Inicia sesión para gestionar citas, rastrear reparaciones y dirigir tu equipo — desde cualquier dispositivo.
          </p>
          <ul className="space-y-3.5">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                <span className="w-5 h-5 rounded-full bg-orange-500/15 border border-orange-500/25 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: social proof */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex -space-x-2">
            {['bg-orange-400', 'bg-blue-400', 'bg-emerald-400', 'bg-purple-400'].map((c, i) => (
              <div key={i} className={`w-8 h-8 rounded-full border-2 border-zinc-900 ${c} flex items-center justify-center text-xs font-bold text-white`}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500">
            <span className="text-white font-semibold">2.400+</span> talleres confían en MotoFix
          </p>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="login-right flex-1 flex flex-col items-center justify-center px-6 sm:px-10 lg:px-16 py-12">
        {/* Mobile logo */}
        <Link href="/" className="lg:hidden inline-flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
            </svg>
          </div>
          <span className="text-xl font-black text-white">Moto<span className="text-orange-500">Fix</span></span>
        </Link>

        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white mb-2">Bienvenido de nuevo</h2>
            <p className="text-zinc-400 text-sm">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                Empieza tu prueba gratis
              </Link>
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
