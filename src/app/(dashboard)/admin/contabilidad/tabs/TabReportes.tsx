'use client'

import { useState, useTransition } from 'react'
import {
    BarChart3, Download, FileDown, AlertCircle, TrendingUp, TrendingDown,
} from 'lucide-react'
import CardV2 from '@/components/ui/CardV2'
import EmptyState from '@/components/ui/EmptyState'
import SpinnerMinimal from '@/components/ui/SpinnerMinimal'
import SelectPremium from '@/components/ui/SelectPremium'
import { getEstadoResultadosAction, getTransaccionesAction, getResumenImpuestosAction } from '@/lib/actions/contabilidad'
import { printBalanceMensual, printEstadoResultados, printReporteImpuestos } from '@/lib/utils/reportes'
import { exportTransacciones, exportLibroDiario } from '@/lib/utils/exportar'
import type { EstadoResultados, ResumenFinanciero, FlujoCaja, ItemCartera } from '@/lib/types/contabilidad'

// ── Helpers ────────────────────────────────────────────────

const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function getMesActual(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function generarOpcionesMeses() {
    const opciones: { valor: string; etiqueta: string }[] = []
    const hoy = new Date()
    for (let i = 0; i < 12; i++) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
        const valor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        opciones.push({ valor, etiqueta: `${MESES_ES[d.getMonth()]} ${d.getFullYear()}` })
    }
    return opciones
}

function formatCOP(val: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)
}

// ── Fila P&G ───────────────────────────────────────────────

function FilaPyG({ label, valor, nivel = 0, negrita = false, separador = false, color }: {
    label: string
    valor: number
    nivel?: number
    negrita?: boolean
    separador?: boolean
    color?: string
}) {
    const paddingLeft = nivel * 16
    const colorClase = color ?? (valor >= 0 ? 'text-white' : 'text-rose-400')

    return (
        <div
            className={`flex items-center justify-between py-2.5 ${separador ? 'border-t border-white/[0.06] mt-1 pt-3.5' : 'border-b border-white/[0.03]'}`}
            style={{ paddingLeft }}
        >
            <span className={`text-sm ${negrita ? 'font-bold text-white' : 'text-zinc-500'}`}>{label}</span>
            <span className={`text-sm tabular-nums tracking-tight font-${negrita ? 'black' : 'semibold'} ${colorClase}`}>
                {formatCOP(valor)}
            </span>
        </div>
    )
}

// ── Props ──────────────────────────────────────────────────

interface Props {
    resumen:  ResumenFinanciero | null
    flujo:    FlujoCaja[]
    cartera:  ItemCartera[]
}

// ── Componente principal ───────────────────────────────────

export default function TabReportes({ resumen, flujo, cartera }: Props) {
    const [mes, setMes]              = useState(getMesActual())
    const [pyg, setPyg]              = useState<EstadoResultados | null>(null)
    const [loadingAction, setLoading] = useState<string | null>(null)
    const [error, setError]          = useState<string | null>(null)
    const [, startTransition]        = useTransition()

    const opcionesMeses    = generarOpcionesMeses().map(o => ({ value: o.valor, label: o.etiqueta }))
    const mesLabel = opcionesMeses.find(o => o.value === mes)?.label ?? mes

    const cargarPyg = (exportarDespues = false) => {
        setError(null)
        setLoading('pyg')
        startTransition(async () => {
            const res = await getEstadoResultadosAction(mes)
            if (res.ok) {
                setPyg(res.data)
                if (exportarDespues) printEstadoResultados(res.data)
            } else setError(res.error)
            setLoading(null)
        })
    }

    const exportarBalancePDF = () => {
        if (!resumen) return
        setLoading('balance')
        setError(null)
        startTransition(async () => {
            const txRes = await getTransaccionesAction({ tipo: 'todos', mes, limite: 500 })
            const txs = txRes.ok ? txRes.data : []
            printBalanceMensual(mesLabel, resumen, flujo, cartera, txs)
            setLoading(null)
        })
    }

    const exportarPyGPDF = () => {
        if (!pyg) { cargarPyg(true); return }
        printEstadoResultados(pyg)
    }

    const exportarImpuestosPDF = () => {
        setLoading('impuestos')
        setError(null)
        startTransition(async () => {
            const res = await getResumenImpuestosAction(mes)
            if (res.ok) printReporteImpuestos(res.data, mesLabel)
            else setError(res.error)
            setLoading(null)
        })
    }

    const exportarCSV = () => {
        setLoading('csv')
        startTransition(async () => {
            const res = await getTransaccionesAction({ tipo: 'todos', mes, limite: 1000 })
            if (res.ok) exportTransacciones(res.data)
            setLoading(null)
        })
    }

    const exportarLibroDiario = () => {
        setLoading('libro')
        startTransition(async () => {
            const res = await getTransaccionesAction({ tipo: 'todos', mes, limite: 1000 })
            if (res.ok) exportLibroDiario(res.data, mesLabel)
            setLoading(null)
        })
    }

    const acciones = [
        { key: 'balance',   label: 'Balance Mensual',      descripcion: 'PDF con ingresos, egresos y cartera del período', Icono: FileDown,  accion: exportarBalancePDF,  color: 'bg-orange-500/8 hover:bg-orange-500/15 text-orange-400 border-orange-500/25' },
        { key: 'pyg',       label: 'Estado de Resultados', descripcion: 'P&G — utilidades y márgenes del período',         Icono: BarChart3, accion: exportarPyGPDF,      color: 'bg-blue-500/8 hover:bg-blue-500/15 text-blue-400 border-blue-500/25' },
        { key: 'impuestos', label: 'Reporte de Impuestos', descripcion: 'IVA, ICA y retenciones del período',              Icono: FileDown,  accion: exportarImpuestosPDF, color: 'bg-purple-500/8 hover:bg-purple-500/15 text-purple-400 border-purple-500/25' },
        { key: 'csv',       label: 'Exportar CSV',         descripcion: 'Transacciones del período en Excel / CSV',        Icono: Download,  accion: exportarCSV,          color: 'bg-emerald-500/8 hover:bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
        { key: 'libro',     label: 'Libro Diario CSV',     descripcion: 'Auxiliar contable cronológico del período',       Icono: Download,  accion: exportarLibroDiario,  color: 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 border-zinc-700' },
    ]

    return (
        <div className="space-y-6">
            {/* Selector de período */}
            <div className="flex items-center gap-3">
                <label className="text-[11px] font-medium tracking-wide uppercase text-zinc-500">Período</label>
                <SelectPremium
                    value={mes}
                    onChange={v => { setMes(v); setPyg(null) }}
                    options={opcionesMeses}
                    className="w-40"
                />
            </div>

            {error && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-500/8 border border-rose-500/15 rounded-lg text-rose-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /><span>{error}</span>
                </div>
            )}

            {/* Grid de exportaciones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {acciones.map(({ key, label, descripcion, Icono, accion, color }) => (
                    <button
                        key={key}
                        onClick={accion}
                        disabled={loadingAction !== null}
                        className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all disabled:opacity-60 ${color}`}
                    >
                        <div className="w-8 h-8 rounded-xl bg-current/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {loadingAction === key
                                ? <SpinnerMinimal className="w-4 h-4" />
                                : <Icono className="w-4 h-4" />
                            }
                        </div>
                        <div>
                            <p className="text-sm font-semibold">{label}</p>
                            <p className="text-[11px] mt-0.5 opacity-50 leading-relaxed">{descripcion}</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Estado de resultados P&G */}
            <CardV2 relleno="lg">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Estado de Resultados (P&G)</h3>
                        <p className="text-[11px] text-zinc-600 mt-0.5">{mesLabel}</p>
                    </div>
                    <button
                        onClick={() => cargarPyg()}
                        disabled={loadingAction !== null}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-medium rounded-lg transition-all disabled:opacity-50 border border-zinc-700"
                    >
                        {loadingAction === 'pyg' ? <SpinnerMinimal className="w-3.5 h-3.5" /> : <BarChart3 className="w-3.5 h-3.5" />}
                        {pyg ? 'Actualizar' : 'Generar P&G'}
                    </button>
                </div>

                {!pyg ? (
                    <EmptyState Icono={BarChart3} titulo="Estado de Resultados" descripcion="Haz clic en 'Generar P&G' para calcular las utilidades del período seleccionado." />
                ) : (
                    <div className="space-y-0">
                        <FilaPyG label="Ventas brutas"    valor={pyg.ventas_brutas} negrita />
                        <FilaPyG label="Costo de ventas" valor={-pyg.costo_ventas} nivel={1} color="text-rose-400" />
                        <FilaPyG label="Utilidad bruta"  valor={pyg.utilidad_bruta} negrita separador color={pyg.utilidad_bruta >= 0 ? 'text-emerald-400' : 'text-rose-400'} />

                        {pyg.gastos_operacionales.length > 0 && (
                            <>
                                <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 pt-4 pb-1">Gastos operacionales</p>
                                {pyg.gastos_operacionales.map(g => (
                                    <FilaPyG key={g.concepto} label={`${g.concepto} (${g.porcentaje}%)`} valor={-g.monto} nivel={1} color="text-rose-400" />
                                ))}
                            </>
                        )}

                        <FilaPyG label="Total gastos"         valor={-pyg.total_gastos}          negrita separador color="text-rose-400" />
                        <FilaPyG label="Utilidad operacional"  valor={pyg.utilidad_operacional}   negrita separador color={pyg.utilidad_operacional >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
                        <FilaPyG label="Impuesto estimado (33%)" valor={-pyg.impuestos_estimados} nivel={1} color="text-rose-400" />

                        <div className="flex items-center justify-between pt-5 mt-2 border-t-2 border-white/8">
                            <div className="flex items-center gap-2.5">
                                {pyg.utilidad_neta >= 0
                                    ? <TrendingUp className="w-5 h-5 text-emerald-400" />
                                    : <TrendingDown className="w-5 h-5 text-rose-400" />
                                }
                                <div>
                                    <p className="text-sm font-black text-white">Utilidad neta</p>
                                    <p className="text-[11px] text-zinc-600">Margen: {pyg.margen_neto}%</p>
                                </div>
                            </div>
                            <span className={`text-2xl font-black tabular-nums tracking-tight ${pyg.utilidad_neta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatCOP(pyg.utilidad_neta)}
                            </span>
                        </div>
                    </div>
                )}
            </CardV2>
        </div>
    )
}
