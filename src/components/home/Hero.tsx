'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import Link from 'next/link'

const repairRows = [
  { code: 'REP-A4F2D8', vehicle: 'Honda CB500 · 2021', status: 'En Reparación',  dot: 'bg-orange-400', pill: 'bg-orange-500/10 text-orange-400' },
  { code: 'REP-B3E1C7', vehicle: 'Yamaha MT-07 · 2023', status: 'Diagnóstico', dot: 'bg-yellow-400', pill: 'bg-yellow-500/10 text-yellow-400' },
  { code: 'REP-C9D5A2', vehicle: 'Kawasaki Z900 · 2022', status: 'Lista',     dot: 'bg-green-400',  pill: 'bg-green-500/10 text-green-400' },
]

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out', force3D: true } })

      tl.fromTo('.hero-badge',     { opacity: 0, y: -12 },              { opacity: 1, y: 0, duration: 0.5 })
        .fromTo('.hero-headline',  { opacity: 0, y: 44, skewY: 2 },    { opacity: 1, y: 0, skewY: 0, duration: 0.75 },  '-=0.18')
        .fromTo('.hero-sub',       { opacity: 0, y: 22 },               { opacity: 1, y: 0, duration: 0.55 },            '-=0.45')
        .fromTo('.hero-cta > *',   { opacity: 0, y: 16 },               { opacity: 1, y: 0, duration: 0.45, stagger: 0.1 }, '-=0.4')
        .fromTo('.hero-stat',      { opacity: 0, y: 12 },               { opacity: 1, y: 0, duration: 0.4, stagger: 0.07 }, '-=0.28')
        .fromTo('.hero-mockup',    { opacity: 0, scale: 0.95, x: 28 }, { opacity: 1, scale: 1, x: 0, duration: 0.85 },  '-=0.7')
        .fromTo('.hero-notif',     { opacity: 0, x: -20, y: 12 },      { opacity: 1, x: 0, y: 0, duration: 0.45 },      '-=0.28')
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen bg-zinc-950 flex items-center overflow-hidden"
    >
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-950/20 via-zinc-950 to-zinc-950" />
      <div className="pointer-events-none absolute -top-32 right-0 w-[600px] h-[600px] bg-orange-500/8 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-32 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 lg:pt-32 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-16 xl:gap-20 items-center">

          {/* ── Left: copy ── */}
          <div>
            <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse-slow" />
              Usado por más de 2.400 talleres en Latinoamérica
            </div>

            <h1 className="hero-headline text-5xl sm:text-6xl lg:text-[4rem] xl:text-[4.5rem] font-black text-white leading-[1.05] tracking-tight mb-6">
              Administra tu taller.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
                Sin complicaciones.
              </span>
            </h1>

            <p className="hero-sub text-lg sm:text-xl text-zinc-400 leading-relaxed mb-10 max-w-[480px]">
              El SaaS todo-en-uno para talleres de motos y vehículos — citas,
              seguimiento de reparaciones, inventario, contabilidad y constructor de landing pages. Todos los roles, una plataforma.
            </p>

            <div className="hero-cta flex flex-col sm:flex-row gap-4 mb-14">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-7 py-4 bg-orange-500 hover:bg-orange-400 text-white font-bold text-base sm:text-lg rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5"
              >
                Prueba Gratis 14 Días
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-semibold text-base sm:text-lg rounded-xl transition-all duration-200 hover:-translate-y-0.5"
              >
                <PlayIcon />
                Ver Demo
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-zinc-800/80">
              {[
                { value: '2.400+',  label: 'Talleres activos' },
                { value: '180k+',   label: 'Reparaciones rastreadas' },
                { value: '99.9%',   label: 'SLA de disponibilidad' },
              ].map((s) => (
                <div key={s.label} className="hero-stat">
                  <div className="text-2xl xl:text-3xl font-black text-white">{s.value}</div>
                  <div className="text-xs sm:text-sm text-zinc-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: dashboard mockup ── */}
          <div className="hero-mockup relative hidden lg:block">
            {/* Browser shell */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-hidden">
              {/* Chrome bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
                <div className="ml-3 flex-1 bg-zinc-800 rounded-md px-3 py-1 text-xs text-zinc-500 font-mono">
                  app.motofix.co/panel/admin
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-5 bg-zinc-950 space-y-5">
                {/* KPI row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Reparaciones', value: '12', accent: 'text-orange-400' },
                    { label: 'Citas Hoy',    value: '8',  accent: 'text-blue-400' },
                    { label: 'Ingresos/Mes',   value: '$14.2M', accent: 'text-emerald-400' },
                  ].map((kpi) => (
                    <div key={kpi.label} className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
                      <p className="text-[10px] text-zinc-500 mb-1 truncate">{kpi.label}</p>
                      <p className={`text-lg font-bold ${kpi.accent}`}>{kpi.value}</p>
                    </div>
                  ))}
                </div>

                {/* Repair list */}
                <div>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-2.5">
                    Reparaciones Activas
                  </p>
                  <div className="space-y-2">
                    {repairRows.map((r) => (
                      <div
                        key={r.code}
                        className="flex items-center justify-between bg-zinc-900 rounded-xl px-3.5 py-2.5 border border-zinc-800"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.dot}`} />
                          <div>
                            <p className="text-[11px] font-mono font-semibold text-orange-400">{r.code}</p>
                            <p className="text-[11px] text-zinc-400">{r.vehicle}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${r.pill}`}>
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating notification */}
            <div className="hero-notif absolute -bottom-5 -left-6 bg-zinc-900 border border-zinc-700/80 rounded-2xl p-3.5 shadow-2xl flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500/15 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-white leading-snug">Reparación Completa</p>
                <p className="text-[11px] text-zinc-500">Cliente notificado por SMS</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PlayIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.34-5.89a1.5 1.5 0 000-2.54L6.3 2.84z" />
    </svg>
  )
}
