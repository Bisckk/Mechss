'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Link from 'next/link'

const plans = [
  {
    name: 'Inicial',
    slug: 'starter',
    monthly: 89000,
    yearly: 75000,
    description: 'Perfecto para talleres pequeños e independientes.',
    highlight: false,
    badge: null,
    features: [
      '3 miembros de equipo',
      '200 clientes',
      'Agendamiento de citas',
      'Seguimiento de reparaciones + QR',
      'Gestión de inventario',
      'Soporte por email',
    ],
    missing: ['Contabilidad financiera', 'Constructor de landing pages', 'Acceso API'],
  },
  {
    name: 'Profesional',
    slug: 'professional',
    monthly: 249000,
    yearly: 209000,
    description: 'Para talleres en crecimiento que necesitan todas las herramientas.',
    highlight: true,
    badge: 'Más Popular',
    features: [
      '10 miembros de equipo',
      '1.000 clientes',
      'Agendamiento de citas',
      'Seguimiento de reparaciones + QR',
      'Gestión de inventario',
      'Contabilidad financiera',
      'Constructor de landing pages',
      'Soporte prioritario',
    ],
    missing: ['Acceso API'],
  },
  {
    name: 'Empresarial',
    slug: 'enterprise',
    monthly: 599000,
    yearly: 499000,
    description: 'Escala ilimitada, marca blanca y acceso API.',
    highlight: false,
    badge: null,
    features: [
      'Miembros ilimitados',
      'Clientes ilimitados',
      'Agendamiento de citas',
      'Seguimiento de reparaciones + QR',
      'Gestión de inventario',
      'Contabilidad financiera',
      'Constructor de landing pages',
      'Acceso API',
      'Marca blanca',
      'SLA dedicado',
    ],
    missing: [],
  },
]

export default function Pricing() {
  const sectionRef = useRef<HTMLElement>(null)
  const [yearly, setYearly] = useState(false)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.pricing-header',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8,
          scrollTrigger: { trigger: '.pricing-header', start: 'top 85%' } }
      )
      gsap.fromTo(
        '.pricing-card',
        { opacity: 0, y: 56 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: '.pricing-grid', start: 'top 80%' } }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section id="pricing" ref={sectionRef} className="bg-zinc-950 py-24 sm:py-32 border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="pricing-header text-center mb-14 sm:mb-16">
          <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-sm font-medium mb-5">
            Precios simples y transparentes
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-5">
            Empieza gratis.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
              Escala cuando estés listo.
            </span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-8">
            14 días de prueba gratis en todos los planes. Sin tarjeta de crédito.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-full p-1">
            <button
              onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                !yearly ? 'bg-white text-zinc-900 shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                yearly ? 'bg-white text-zinc-900 shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Anual
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="pricing-grid grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {plans.map((plan) => (
            <div
              key={plan.slug}
              className={`pricing-card relative rounded-2xl p-7 border transition-all duration-300 ${
                plan.highlight
                  ? 'bg-zinc-900 border-orange-500/40 shadow-2xl shadow-orange-500/10'
                  : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center px-3.5 py-1 bg-orange-500 text-white text-xs font-bold rounded-full shadow-lg shadow-orange-500/30">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-zinc-500">{plan.description}</p>
              </div>

              <div className="mb-7">
                <div className="flex items-end gap-1">
                  <span className="text-4xl xl:text-5xl font-black text-white">
                    ${(yearly ? plan.yearly : plan.monthly).toLocaleString('es-CO')}
                  </span>
                  <span className="text-zinc-500 text-sm mb-2">/mes</span>
                </div>
                {yearly && (
                  <p className="text-xs text-emerald-400 mt-1">Facturado ${(plan.yearly * 12).toLocaleString('es-CO')}/año</p>
                )}
              </div>

              <Link
                href={`/register?plan=${plan.slug}`}
                className={`block w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all duration-200 mb-7 ${
                  plan.highlight
                    ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                }`}
              >
                Empezar Prueba Gratis
              </Link>

              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <CheckIcon className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-600 line-through">
                    <XIcon className="flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function XIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
