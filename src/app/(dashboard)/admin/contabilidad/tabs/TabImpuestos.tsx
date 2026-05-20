'use client'

import { useState, useTransition } from 'react'
import { Receipt, AlertCircle, Info } from 'lucide-react'
import CardV2 from '@/components/ui/CardV2'
import EmptyState from '@/components/ui/EmptyState'
import SpinnerMinimal from '@/components/ui/SpinnerMinimal'
import SelectPremium from '@/components/ui/SelectPremium'
import { getResumenImpuestosAction } from '@/lib/actions/contabilidad'
import type { ResumenImpuestos } from '@/lib/types/contabilidad'

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

// ── Fila de impuesto ───────────────────────────────────────

function FilaImpuesto({ label, descripcion, valor, colorClase = 'text-white' }: {
    label: string
    descripcion: string
    valor: number
    colorClase?: string
}) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
            <div>
                <p className="text-sm font-medium text-zinc-300">{label}</p>
                <p className="text-[11px] text-zinc-600 mt-0.5">{descripcion}</p>
            </div>
            <span className={`text-sm font-bold tabular-nums tracking-tight ${colorClase}`}>{formatCOP(valor)}</span>
        </div>
    )
}

// ── Props ──────────────────────────────────────────────────

interface Props {
    resumenInicial: ResumenImpuestos | null
}

// ── Componente principal ───────────────────────────────────

export default function TabImpuestos({ resumenInicial }: Props) {
    const [resumen, setResumen]     = useState<ResumenImpuestos | null>(resumenInicial)
    const [mes, setMes]             = useState(getMesActual())
    const [cargando, start]         = useTransition()
    const [error, setError]         = useState<string | null>(null)

    const opcionesMeses = generarOpcionesMeses().map(o => ({ value: o.valor, label: o.etiqueta }))

    const cambiarMes = (nuevoMes: string) => {
        setMes(nuevoMes)
        setError(null)
        start(async () => {
            const res = await getResumenImpuestosAction(nuevoMes)
            if (res.ok) setResumen(res.data)
            else setError(res.error)
        })
    }

    const hayImpuestos = resumen && resumen.total_a_pagar > 0

    return (
        <div className="space-y-5">
            {/* Banner DIAN */}
            <div className="flex items-start gap-3 px-4 py-4 bg-blue-500/4 border border-blue-500/10 rounded-xl">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-blue-400">Facturación Electrónica DIAN</p>
                    <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                        La integración con la DIAN está pendiente de activación. Cuando el taller solicite la habilitación,
                        se conectará con el operador de facturación electrónica autorizado para emitir y validar facturas en tiempo real.
                    </p>
                </div>
            </div>

            {/* Selector de mes */}
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Resumen Fiscal</h2>
                <SelectPremium
                    value={mes}
                    onChange={cambiarMes}
                    options={opcionesMeses}
                    className="w-40"
                />
            </div>

            {error && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-500/8 border border-rose-500/15 rounded-lg text-rose-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /><span>{error}</span>
                </div>
            )}

            {cargando ? (
                <div className="flex justify-center py-12">
                    <SpinnerMinimal className="w-5 h-5 text-orange-400" />
                </div>
            ) : !resumen || !hayImpuestos ? (
                <EmptyState
                    Icono={Receipt}
                    titulo="Sin impuestos registrados"
                    descripcion="Los impuestos aparecen automáticamente cuando creas transacciones con IVA, ICA u otros tributos."
                />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* IVA */}
                    <CardV2 relleno="lg">
                        <h3 className="text-[11px] font-semibold tracking-wide uppercase text-zinc-500 mb-4">IVA — Impuesto al Valor Agregado</h3>
                        <FilaImpuesto label="IVA generado (ventas)"    descripcion="IVA cobrado en servicios y repuestos" valor={resumen.iva_generado}    colorClase="text-rose-400" />
                        <FilaImpuesto label="IVA descontable (compras)" descripcion="IVA pagado en compras a proveedores"  valor={resumen.iva_descontable} colorClase="text-emerald-400" />
                        <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/[0.06]">
                            <div>
                                <p className="text-sm font-bold text-white">IVA neto a declarar</p>
                                <p className="text-[11px] text-zinc-600">Generado − Descontable</p>
                            </div>
                            <span className={`text-lg font-black tabular-nums tracking-tight ${resumen.iva_neto > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {formatCOP(resumen.iva_neto)}
                            </span>
                        </div>
                    </CardV2>

                    {/* Otros impuestos */}
                    <CardV2 relleno="lg">
                        <h3 className="text-[11px] font-semibold tracking-wide uppercase text-zinc-500 mb-4">Otros Tributos</h3>
                        <FilaImpuesto label="ICA"                    descripcion="Impuesto de Industria y Comercio" valor={resumen.ica} />
                        <FilaImpuesto label="Retención en la Fuente" descripcion="Retenciones practicadas"          valor={resumen.ret_fuente} />
                        <FilaImpuesto label="Impoconsumo"            descripcion="Impuesto al consumo"              valor={resumen.impoconsumo} />
                        <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/[0.06]">
                            <div>
                                <p className="text-sm font-bold text-white">Total a pagar</p>
                                <p className="text-[11px] text-zinc-600">Estimado del período</p>
                            </div>
                            <span className="text-lg font-black tabular-nums tracking-tight text-orange-400">
                                {formatCOP(resumen.total_a_pagar)}
                            </span>
                        </div>
                    </CardV2>

                    {/* Nota */}
                    <div className="lg:col-span-2 px-4 py-3 bg-zinc-900/40 border border-white/[0.04] rounded-xl text-[11px] text-zinc-600 leading-relaxed">
                        Los valores aquí mostrados son calculados automáticamente a partir de las transacciones registradas en el período.
                        Para las declaraciones oficiales, valida con tu contador o utiliza los reportes de exportación.
                    </div>
                </div>
            )}
        </div>
    )
}
