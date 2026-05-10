'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface Props {
    value: string          // 'YYYY-MM-DD' o ''
    onChange: (v: string) => void
    placeholder?: string
    minDate?: string       // 'YYYY-MM-DD'
}

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function toLocalDateString(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

function formatearFecha(iso: string): string {
    if (!iso) return ''
    const [y, m, d] = iso.split('-').map(Number)
    const hoy = toLocalDateString(new Date())
    if (iso === hoy) return `Hoy, ${d} de ${MESES[m - 1]}`
    return `${d} de ${MESES[m - 1]} de ${y}`
}

export default function CalendarioPicker({ value, onChange, placeholder = 'Seleccionar fecha', minDate }: Props) {
    const hoy = toLocalDateString(new Date())

    const [abierto, setAbierto] = useState(false)
    const [pagina, setPagina]   = useState<{ mes: number; anio: number }>(() => {
        const base = value || hoy
        const [y, m] = base.split('-').map(Number)
        return { mes: m - 1, anio: y }
    })

    const contenedorRef = useRef<HTMLDivElement>(null)
    const dropdownRef   = useRef<HTMLDivElement>(null)

    // Sincroniza la página cuando cambia el value externamente
    useEffect(() => {
        const base = value || hoy
        const [y, m] = base.split('-').map(Number)
        setPagina({ mes: m - 1, anio: y })
    }, [value])

    // Cierra al hacer click fuera
    useEffect(() => {
        if (!abierto) return
        const cerrar = (e: MouseEvent) => {
            if (!contenedorRef.current?.contains(e.target as Node)) setAbierto(false)
        }
        document.addEventListener('mousedown', cerrar)
        return () => document.removeEventListener('mousedown', cerrar)
    }, [abierto])

    // Scroll suavizado hacia el calendario cuando se abre
    useEffect(() => {
        if (!abierto || !dropdownRef.current) return

        const timer = setTimeout(() => {
            const el = dropdownRef.current
            if (!el) return

            // Busca el contenedor scrollable más cercano
            let padre = el.parentElement
            while (padre) {
                const { overflowY } = window.getComputedStyle(padre)
                if (overflowY === 'auto' || overflowY === 'scroll') break
                padre = padre.parentElement
            }
            if (!padre) return

            const rectPadre = padre.getBoundingClientRect()
            const rectEl    = el.getBoundingClientRect()
            const desborde  = rectEl.bottom - rectPadre.bottom

            if (desborde <= 0) return  // ya es visible, nada que hacer

            const desplazamiento = desborde + 20  // 20px de margen inferior
            const inicio         = padre.scrollTop
            const destino        = inicio + desplazamiento
            const duracion       = 380
            const tiempoInicio   = performance.now()

            const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

            const animar = (ahora: number) => {
                const progreso       = Math.min((ahora - tiempoInicio) / duracion, 1)
                const progresoSuave  = easeOutCubic(progreso)
                padre!.scrollTop     = inicio + desplazamiento * progresoSuave
                if (progreso < 1) requestAnimationFrame(animar)
            }

            requestAnimationFrame(animar)
        }, 60)

        return () => clearTimeout(timer)
    }, [abierto])

    const irMesAnterior = () => {
        setPagina(p => {
            if (p.mes === 0) return { mes: 11, anio: p.anio - 1 }
            return { mes: p.mes - 1, anio: p.anio }
        })
    }

    const irMesSiguiente = () => {
        setPagina(p => {
            if (p.mes === 11) return { mes: 0, anio: p.anio + 1 }
            return { mes: p.mes + 1, anio: p.anio }
        })
    }

    const seleccionar = (iso: string) => {
        onChange(iso)
        setAbierto(false)
    }

    // Genera la cuadrícula del mes (42 celdas: 6 semanas × 7 días)
    const generarCeldas = () => {
        const primerDia    = new Date(pagina.anio, pagina.mes, 1)
        // lunes = 0 … domingo = 6
        const offsetLunes  = (primerDia.getDay() + 6) % 7
        const diasEnMes    = new Date(pagina.anio, pagina.mes + 1, 0).getDate()
        const celdas: { iso: string; esActual: boolean }[] = []

        // Días del mes anterior
        for (let i = offsetLunes - 1; i >= 0; i--) {
            const d = new Date(pagina.anio, pagina.mes, -i)
            celdas.push({ iso: toLocalDateString(d), esActual: false })
        }
        // Días del mes actual
        for (let d = 1; d <= diasEnMes; d++) {
            const fecha = new Date(pagina.anio, pagina.mes, d)
            celdas.push({ iso: toLocalDateString(fecha), esActual: true })
        }
        // Rellenar hasta 42
        let d = 1
        while (celdas.length < 42) {
            const fecha = new Date(pagina.anio, pagina.mes + 1, d++)
            celdas.push({ iso: toLocalDateString(fecha), esActual: false })
        }
        return celdas
    }

    const celdas     = generarCeldas()
    const hayValor   = !!value
    const esHoy      = value === hoy

    return (
        <div ref={contenedorRef} className="relative w-full">

            {/* Trigger */}
            <button
                type="button"
                onClick={() => setAbierto(v => !v)}
                className={`w-full flex items-center gap-3 bg-zinc-900 border rounded-xl px-4 py-3 text-sm text-left transition-all
                    ${abierto ? 'border-orange-500/50 shadow-[0_0_0_3px_rgba(249,115,22,0.08)]' : 'border-white/10 hover:border-white/20'}`}
            >
                <Calendar className={`w-4 h-4 flex-shrink-0 ${hayValor ? 'text-orange-400' : 'text-zinc-600'}`} />
                <span className={`flex-1 ${hayValor ? 'text-white font-medium' : 'text-zinc-600'}`}>
                    {hayValor ? formatearFecha(value) : placeholder}
                </span>
                {hayValor && (
                    <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onChange('') }}
                        className="text-zinc-600 hover:text-zinc-400 transition-colors text-xs font-bold shrink-0"
                    >
                        ✕
                    </button>
                )}
            </button>

            {/* Dropdown calendario */}
            {abierto && (
                <div ref={dropdownRef} className="absolute left-0 right-0 top-full mt-2 z-[200] bg-zinc-900 border border-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] p-4 animate-in fade-in zoom-in-95 duration-150 origin-top">

                    {/* Navegación de mes */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="button"
                            onClick={irMesAnterior}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/8 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <span className="text-sm font-bold text-white">
                            {MESES[pagina.mes]} {pagina.anio}
                        </span>

                        <button
                            type="button"
                            onClick={irMesSiguiente}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/8 transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Encabezado días de la semana */}
                    <div className="grid grid-cols-7 mb-1">
                        {DIAS_SEMANA.map(d => (
                            <div key={d} className="h-8 flex items-center justify-center text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Cuadrícula de días */}
                    <div className="grid grid-cols-7 gap-y-0.5">
                        {celdas.map((celda, i) => {
                            const esSeleccionado = celda.iso === value
                            const esHoyDia       = celda.iso === hoy
                            const bloqueado      = minDate ? celda.iso < minDate : false

                            return (
                                <button
                                    key={i}
                                    type="button"
                                    disabled={bloqueado}
                                    onClick={() => !bloqueado && seleccionar(celda.iso)}
                                    className={`
                                        h-9 w-full flex items-center justify-center rounded-lg text-sm font-medium transition-all relative
                                        ${esSeleccionado
                                            ? 'bg-orange-500 text-white font-bold shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                                            : esHoyDia
                                                ? 'text-orange-400 ring-1 ring-orange-500/40 hover:bg-orange-500/15'
                                                : celda.esActual
                                                    ? bloqueado
                                                        ? 'text-zinc-700 cursor-not-allowed'
                                                        : 'text-zinc-300 hover:bg-white/8 hover:text-white'
                                                    : 'text-zinc-700 hover:text-zinc-500'
                                        }
                                    `}
                                >
                                    {parseInt(celda.iso.split('-')[2], 10)}
                                    {esHoyDia && !esSeleccionado && (
                                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-500" />
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Atajo "Hoy" */}
                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-end">
                        <button
                            type="button"
                            onClick={() => seleccionar(hoy)}
                            className="text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-orange-500/10"
                        >
                            Ir a hoy
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
