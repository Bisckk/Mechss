'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'text-blue-400',
    bg:    'bg-blue-500/10',
    border:'border-blue-500/20',
    title: 'Agendamiento Inteligente de Citas',
    desc:  'Calendario drag-and-drop con asignación de mecánicos, recordatorios por SMS y detección de conflictos.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    color: 'text-orange-400',
    bg:    'bg-orange-500/10',
    border:'border-orange-500/20',
    title: 'Seguimiento de Reparaciones y Códigos QR',
    desc:  'Códigos únicos generados por reparación. Los clientes escanean para ver estado en tiempo real, fotos y notas del mecánico.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'text-purple-400',
    bg:    'bg-purple-500/10',
    border:'border-purple-500/20',
    title: 'Control de Acceso por Roles',
    desc:  'Roles de Superadmin, Admin, Recepcionista y Mecánico — cada uno con permisos granulares y dashboards personalizados.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    color: 'text-cyan-400',
    bg:    'bg-cyan-500/10',
    border:'border-cyan-500/20',
    title: 'Gestión de Inventario',
    desc:  'Catálogo de repuestos con alertas de stock, precios de costo/venta y seguimiento de proveedores.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'text-emerald-400',
    bg:    'bg-emerald-500/10',
    border:'border-emerald-500/20',
    title: 'Contabilidad Financiera',
    desc:  'Caja diaria, libro de ingresos/gastos, facturación por reparación y reportes de ingresos mensuales por taller.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    color: 'text-pink-400',
    bg:    'bg-pink-500/10',
    border:'border-pink-500/20',
    title: 'Constructor de Landing Pages',
    desc:  'Editor visual estilo WP para el sitio público de cada taller — vista previa de escritorio/móvil en tiempo real, sin código.',
  },
]

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.features-header',
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.8,
          scrollTrigger: { trigger: '.features-header', start: 'top 85%' },
        }
      )

      gsap.fromTo(
        '.feature-card',
        { opacity: 0, y: 48, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.65,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.features-grid', start: 'top 80%' },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section id="features" ref={sectionRef} className="bg-zinc-950 py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="features-header text-center mb-16 sm:mb-20">
          <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-sm font-medium mb-5">
            Todo lo que necesitas
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-5">
            Una plataforma,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
              cada rol.
            </span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Desde la recepción hasta el piso del taller — todas las funcionalidades que tu equipo necesita,
            con el acceso correcto para cada rol.
          </p>
        </div>

        {/* Grid */}
        <div className="features-grid grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className={`feature-card group relative bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30`}
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border ${f.bg} ${f.border} ${f.color} mb-5`}>
                {f.icon}
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>

              {/* Hover glow */}
              <div className={`pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${f.bg}`} style={{ filter: 'blur(20px)', zIndex: -1 }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
