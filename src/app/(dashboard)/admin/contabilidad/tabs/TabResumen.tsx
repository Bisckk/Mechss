'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import {
    TrendingUp, TrendingDown, DollarSign, Clock, Wallet,
    ArrowUpCircle, CheckCircle2, AlertCircle, X, Receipt,
} from 'lucide-react'
import MetricCard from '@/components/ui/MetricCard'
import CardV2 from '@/components/ui/CardV2'
import BadgeV2 from '@/components/ui/BadgeV2'
import EmptyState from '@/components/ui/EmptyState'
import SpinnerMinimal from '@/components/ui/SpinnerMinimal'
import SelectPremium from '@/components/ui/SelectPremium'
import { abonarCarteraAction } from '@/lib/actions/contabilidad'
import type { ResumenFinanciero, FlujoCaja, MixIngreso, ItemCartera } from '@/lib/types/contabilidad'
import { MetodoPago } from '@/lib/types/contabilidad'

// ── Helpers ────────────────────────────────────────────────

const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const COLORES_PIE = ['#f97316', '#3b82f6', '#a855f7', '#71717a', '#22c55e', '#f59e0b']

function formatCompacto(val: number): string {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
    if (val >= 1_000)     return `$${(val / 1_000).toFixed(0)}K`
    return `$${val.toFixed(0)}`
}

function formatCOP(val: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)
}

// ── Clases reutilizables ───────────────────────────────────

const inputCls = 'w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/60 focus:outline-none transition-colors'
const labelCls = 'block text-[11px] font-medium tracking-wide uppercase text-zinc-500 mb-1.5'

// ── Tooltips ───────────────────────────────────────────────

function TooltipFlujo({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-zinc-950 border border-white/8 rounded-xl px-4 py-3 shadow-2xl text-xs min-w-[140px]">
            <p className="text-zinc-500 mb-2 font-medium">{label}</p>
            {payload.map((entry: any) => (
                <div key={entry.name} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-zinc-500">{entry.name}</span>
                    </div>
                    <span className="text-white font-semibold tabular-nums">{formatCompacto(entry.value)}</span>
                </div>
            ))}
        </div>
    )
}

function TooltipPastel({ active, payload }: any) {
    if (!active || !payload?.length) return null
    const item = payload[0]
    return (
        <div className="bg-zinc-950 border border-white/8 rounded-xl px-3 py-2 shadow-2xl text-xs">
            <p className="text-zinc-300 font-medium">{item.name}</p>
            <p className="text-white font-bold tabular-nums mt-0.5">{formatCOP(item.value)}</p>
            <p className="text-zinc-600">{item.payload.porcentaje}%</p>
        </div>
    )
}

// ── Drawer de Abono ────────────────────────────────────────

interface DrawerAbonoProps {
    item: ItemCartera | null
    onCerrar: () => void
    onExito: () => void
}

function DrawerAbono({ item, onCerrar, onExito }: DrawerAbonoProps) {
    const [monto, setMonto]      = useState('')
    const [metodo, setMetodo]    = useState(MetodoPago.Efectivo)
    const [fecha, setFecha]      = useState(new Date().toISOString().split('T')[0])
    const [notas, setNotas]      = useState('')
    const [error, setError]      = useState<string | null>(null)
    const [montado, setMontado]  = useState(false)

    useEffect(() => { setMontado(true) }, [])
    const [cargando, startTrans] = useTransition()

    const abierto = !!item

    // ── GSAP refs
    const wrapperRef  = useRef<HTMLDivElement>(null)
    const backdropRef = useRef<HTMLDivElement>(null)
    const modalRef    = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const wrapper  = wrapperRef.current
        const backdrop = backdropRef.current
        const modal    = modalRef.current
        if (!wrapper || !backdrop || !modal) return

        if (abierto) {
            gsap.set(wrapper, { display: 'flex' })
            gsap.set(backdrop, { pointerEvents: 'auto' })
            gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'expo.out' })
            gsap.fromTo(modal,
                { opacity: 0, scale: 0.96, y: 20 },
                { opacity: 1, scale: 1, y: 0, duration: 0.32, ease: 'expo.out', force3D: true }
            )
        } else {
            gsap.to(modal,    { opacity: 0, scale: 0.96, y: 20, duration: 0.2,  ease: 'expo.in' })
            gsap.to(backdrop, { opacity: 0, duration: 0.22, ease: 'expo.in',
                onComplete: () => {
                    gsap.set(wrapper, { display: 'none' })
                    gsap.set(backdrop, { pointerEvents: 'none' })
                }
            })
        }
    }, [abierto])

    const handleAbonar = () => {
        if (!item) return
        const montoNum = parseFloat(monto)
        if (!montoNum || montoNum <= 0) { setError('El monto debe ser mayor a cero.'); return }

        setError(null)
        startTrans(async () => {
            const res = await abonarCarteraAction({
                repair_id:   item.id,
                monto:       montoNum,
                metodo_pago: metodo,
                fecha,
                notas:       notas || undefined,
            })
            if (!res.ok) { setError(res.error); return }
            onExito()
            onCerrar()
        })
    }

    const metodoPagoOpts = Object.values(MetodoPago).map(m => ({ value: m, label: m }))

    if (!montado) return null

    return createPortal(
        <>
            <div
                ref={backdropRef}
                className="fixed inset-0 z-[155] bg-black/70 backdrop-blur-sm"
                style={{ opacity: 0, pointerEvents: 'none' }}
                onClick={onCerrar}
            />
            <div
                ref={wrapperRef}
                className="fixed inset-0 z-[156] flex items-center justify-center p-4 sm:p-6 pointer-events-none"
                style={{ display: 'none' }}
            >
                <div ref={modalRef} className="pointer-events-auto relative w-full max-w-sm bg-zinc-950 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-zinc-900/50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                            <ArrowUpCircle className="w-4 h-4 text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold">Registrar Abono</h2>
                            {item && <p className="text-zinc-500 text-xs mt-0.5">{item.cliente} · {item.tracking_code}</p>}
                        </div>
                    </div>
                    <button onClick={onCerrar} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Saldo destacado */}
                {item && (
                    <div className="px-5 py-4 bg-amber-500/5 border-b border-amber-500/10 flex-shrink-0">
                        <p className={labelCls + ' mb-1'}>Saldo pendiente</p>
                        <p className="text-2xl font-bold text-amber-400 tracking-tight tabular-nums">{formatCOP(item.monto_pendiente)}</p>
                        <p className="text-[11px] text-zinc-600 mt-1">
                            Total: {formatCOP(item.monto_total)} · Pagado: {formatCOP(item.monto_pagado)}
                        </p>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div>
                        <label className={labelCls}>Monto del abono ($)</label>
                        <input
                            type="number"
                            min="0"
                            step="1000"
                            value={monto}
                            onChange={e => { setMonto(e.target.value); setError(null) }}
                            placeholder="0"
                            className={inputCls + ' tabular-nums'}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Método de pago</label>
                            <SelectPremium
                                value={metodo}
                                onChange={val => setMetodo(val as MetodoPago)}
                                options={metodoPagoOpts}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Fecha</label>
                            <input
                                type="date"
                                value={fecha}
                                onChange={e => setFecha(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Notas <span className="normal-case text-zinc-700 font-normal">(opcional)</span></label>
                        <textarea
                            value={notas}
                            onChange={e => setNotas(e.target.value)}
                            rows={2}
                            className={inputCls + ' resize-none'}
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 px-5 py-4 border-t border-white/5 flex-shrink-0">
                    <button onClick={onCerrar} className="flex-1 px-4 py-2.5 border border-white/10 text-zinc-400 hover:text-white font-medium rounded-xl transition-colors text-sm hover:bg-white/5">
                        Cancelar
                    </button>
                    <button
                        onClick={handleAbonar}
                        disabled={cargando}
                        className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors shadow-lg shadow-orange-500/20 text-sm flex items-center justify-center gap-2"
                    >
                        {cargando ? <SpinnerMinimal className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        Abonar
                    </button>
                </div>
                </div>
            </div>
        </>,
        document.body
    )
}

// ── Props ──────────────────────────────────────────────────

interface Props {
    resumen:  ResumenFinanciero
    flujo:    FlujoCaja[]
    mix:      MixIngreso[]
    cartera:  ItemCartera[]
    onRefrescarCartera: () => void
}

// ── Componente principal ───────────────────────────────────

export default function TabResumen({ resumen, flujo, mix, cartera, onRefrescarCartera }: Props) {
    const [itemAbono, setItemAbono] = useState<ItemCartera | null>(null)

    const tendenciaUtilidad = resumen.utilidad_mes > 0 ? 'positivo'
        : resumen.utilidad_mes < 0 ? 'negativo' : 'neutro'

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <MetricCard
                    etiqueta="Ingresos del Mes"
                    valor={formatCompacto(resumen.ingresos_mes)}
                    subtexto={formatCOP(resumen.ingresos_mes)}
                    tendencia="positivo"
                    Icono={TrendingUp}
                    colorIcono="text-emerald-400"
                    bgIcono="bg-emerald-400/10"
                />
                <MetricCard
                    etiqueta="Egresos del Mes"
                    valor={formatCompacto(resumen.egresos_mes)}
                    subtexto={formatCOP(resumen.egresos_mes)}
                    tendencia="negativo"
                    Icono={TrendingDown}
                    colorIcono="text-rose-400"
                    bgIcono="bg-rose-400/10"
                />
                <MetricCard
                    etiqueta="Utilidad del Mes"
                    valor={formatCompacto(resumen.utilidad_mes)}
                    subtexto={formatCOP(resumen.utilidad_mes)}
                    tendencia={tendenciaUtilidad}
                    Icono={DollarSign}
                    colorIcono={tendenciaUtilidad === 'positivo' ? 'text-orange-400' : 'text-rose-400'}
                    bgIcono={tendenciaUtilidad === 'positivo' ? 'bg-orange-400/10' : 'bg-rose-400/10'}
                />
                <MetricCard
                    etiqueta="Cartera Pendiente"
                    valor={formatCompacto(resumen.cartera_pendiente)}
                    subtexto={formatCOP(resumen.cartera_pendiente)}
                    tendencia={resumen.cartera_pendiente > 0 ? 'negativo' : 'positivo'}
                    etiquetaTendencia={resumen.cartera_pendiente > 0 ? 'Por cobrar' : 'Al día'}
                    Icono={Clock}
                    colorIcono="text-amber-400"
                    bgIcono="bg-amber-400/10"
                />
            </div>

            {/* IVA por pagar */}
            {resumen.iva_por_pagar > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-sm">
                    <Receipt className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-zinc-500">IVA neto pendiente de declarar este mes</span>
                    <span className="text-blue-400 font-bold tabular-nums tracking-tight ml-auto">{formatCOP(resumen.iva_por_pagar)}</span>
                </div>
            )}

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <CardV2 relleno="lg" className="lg:col-span-2">
                    <h2 className="text-xs font-semibold tracking-wide uppercase text-zinc-500 mb-5">Flujo de Caja — últimos 6 meses</h2>
                    {flujo.length > 0 ? (
                        <ResponsiveContainer width="100%" height={210}>
                            <AreaChart data={flujo} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradEgresos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis dataKey="mes_label" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatCompacto} />
                                <Tooltip content={<TooltipFlujo />} />
                                <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#22c55e" strokeWidth={1.5} fill="url(#gradIngresos)" dot={false} />
                                <Area type="monotone" dataKey="egresos"  name="Egresos"  stroke="#f43f5e" strokeWidth={1.5} fill="url(#gradEgresos)"  dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState Icono={TrendingUp} titulo="Sin datos de flujo de caja" descripcion="Las transacciones registradas aparecerán aquí." />
                    )}
                    <div className="flex items-center gap-5 mt-4">
                        {[{ color: '#22c55e', label: 'Ingresos' }, { color: '#f43f5e', label: 'Egresos' }].map(({ color, label }) => (
                            <div key={label} className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                                <span className="w-3 h-px rounded-full" style={{ backgroundColor: color }} />
                                {label}
                            </div>
                        ))}
                    </div>
                </CardV2>

                <CardV2 relleno="lg">
                    <h2 className="text-xs font-semibold tracking-wide uppercase text-zinc-500 mb-5">Mix de Ingresos</h2>
                    {mix.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={170}>
                                <PieChart>
                                    <Pie data={mix} dataKey="total" nameKey="categoria" cx="50%" cy="50%" innerRadius={48} outerRadius={74} paddingAngle={3}>
                                        {mix.map((_, i) => <Cell key={i} fill={COLORES_PIE[i % COLORES_PIE.length]} />)}
                                    </Pie>
                                    <Tooltip content={<TooltipPastel />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <ul className="mt-3 space-y-2">
                                {mix.map((item, i) => (
                                    <li key={item.categoria} className="flex items-center justify-between text-[11px]">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORES_PIE[i % COLORES_PIE.length] }} />
                                            <span className="text-zinc-500">{item.categoria}</span>
                                        </div>
                                        <span className="text-zinc-400 font-medium tabular-nums">{item.porcentaje}%</span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <EmptyState Icono={DollarSign} titulo="Sin datos de ingresos" descripcion="Los ingresos del último trimestre aparecerán aquí." />
                    )}
                </CardV2>
            </div>

            {/* Cartera pendiente */}
            <CardV2 relleno="ninguno" className="overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
                    <h2 className="text-sm font-semibold text-white">Cartera Pendiente</h2>
                    <BadgeV2
                        variante={cartera.length > 0 ? 'alerta' : 'exito'}
                        etiqueta={cartera.length > 0 ? `${cartera.length} por cobrar` : 'Al día'}
                        tamaño="sm"
                    />
                </div>

                {cartera.length === 0 ? (
                    <EmptyState Icono={Wallet} titulo="Sin pagos pendientes" descripcion="¡Todas las órdenes completadas han sido cobradas!" />
                ) : (
                    <ul className="divide-y divide-white/[0.04]">
                        {cartera.map(item => (
                            <li key={item.id} className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-zinc-200 truncate">{item.cliente}</p>
                                        <p className="text-[11px] text-zinc-600 mt-0.5 truncate">{item.tracking_code} · {item.vehiculo}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[11px] text-zinc-700 tabular-nums">Total: {formatCOP(item.monto_total)}</span>
                                            {item.monto_pagado > 0 && (
                                                <span className="text-[11px] text-emerald-600 tabular-nums">· Pagado: {formatCOP(item.monto_pagado)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <BadgeV2
                                        variante={item.dias_pendiente > 7 ? 'peligro' : 'alerta'}
                                        etiqueta={item.dias_pendiente === 0 ? 'Hoy' : `${item.dias_pendiente}d`}
                                    />
                                    <span className="text-base font-bold text-amber-400 min-w-[90px] text-right tabular-nums tracking-tight">
                                        {formatCOP(item.monto_pendiente)}
                                    </span>
                                    <button
                                        onClick={() => setItemAbono(item)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/8 hover:bg-orange-500/15 text-orange-400 text-xs font-medium rounded-lg transition-all flex-shrink-0"
                                    >
                                        <ArrowUpCircle className="w-3.5 h-3.5" />
                                        Abonar
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardV2>

            <DrawerAbono
                item={itemAbono}
                onCerrar={() => setItemAbono(null)}
                onExito={onRefrescarCartera}
            />
        </div>
    )
}
