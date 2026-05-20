'use client'

import { useState, useTransition, useRef, useEffect, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import {
    ArrowUpCircle, ArrowDownCircle, ReceiptText, Plus, CheckCircle2,
    AlertCircle, X, Ban,
} from 'lucide-react'
import CardV2 from '@/components/ui/CardV2'
import BadgeV2 from '@/components/ui/BadgeV2'
import EmptyState from '@/components/ui/EmptyState'
import SpinnerMinimal from '@/components/ui/SpinnerMinimal'
import SelectPremium from '@/components/ui/SelectPremium'
import {
    getTransaccionesAction,
    crearTransaccionAction,
    anularTransaccionAction,
} from '@/lib/actions/contabilidad'
import {
    CategoriaIngreso,
    CategoriaGasto,
    MetodoPago,
    TipoImpuesto,
    TASA_IMPUESTO,
    type Transaccion,
    type NuevaTransaccionParams,
    type FiltrotipoTransaccion,
    type RolContabilidad,
} from '@/lib/types/contabilidad'

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

function formatCompacto(val: number): string {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
    if (val >= 1_000)     return `$${(val / 1_000).toFixed(0)}K`
    return `$${val.toFixed(0)}`
}

function formatCOP(val: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)
}

function formatFecha(iso: string): string {
    const d = new Date(iso + 'T00:00:00')
    return `${d.getDate()} ${MESES_ES[d.getMonth()]} ${d.getFullYear()}`
}

function estadoBadge(estado: Transaccion['estado']) {
    if (estado === 'reconciled') return <BadgeV2 variante="exito"   etiqueta="Conciliado" />
    if (estado === 'cancelled')  return <BadgeV2 variante="peligro" etiqueta="Anulado" />
    return                              <BadgeV2 variante="alerta"  etiqueta="Pendiente" />
}

const inputCls = 'w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/60 focus:outline-none transition-colors'
const labelCls = 'block text-[11px] font-medium tracking-wide uppercase text-zinc-500 mb-1.5'

// ── Drawer nueva transacción ───────────────────────────────

interface DrawerProps {
    abierto:  boolean
    cargando: boolean
    rol:      RolContabilidad
    onCerrar: () => void
    onGuardar:(params: NuevaTransaccionParams) => void
}

function NuevaTransaccionDrawer({ abierto, cargando, rol, onCerrar, onGuardar }: DrawerProps) {
    const puedeCraneEgresos = rol !== 'receptionist'
    const [tipo, setTipo]   = useState<'income' | 'expense'>('income')
    const [form, setForm]   = useState({
        categoria: '', descripcion: '', monto: '',
        fecha: new Date().toISOString().split('T')[0],
        metodo_pago: MetodoPago.Efectivo, referencia: '', notas: '',
        impuesto_tipo: TipoImpuesto.Ninguno,
    })
    const [error, setError] = useState<string | null>(null)

    const backdropRef = useRef<HTMLDivElement>(null)
    const wrapperRef  = useRef<HTMLDivElement>(null)
    const modalRef    = useRef<HTMLDivElement>(null)
    const [montado, setMontado] = useState(false)

    useEffect(() => { setMontado(true) }, [])

    useEffect(() => {
        const backdrop = backdropRef.current
        const wrapper  = wrapperRef.current
        const modal    = modalRef.current
        if (!backdrop || !wrapper || !modal) return

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

    const categorias = tipo === 'income' ? Object.values(CategoriaIngreso) : Object.values(CategoriaGasto)
    const montoBase     = parseFloat(form.monto) || 0
    const tasaImpuesto  = TASA_IMPUESTO[form.impuesto_tipo as TipoImpuesto] ?? 0
    const valorImpuesto = Math.round(montoBase * tasaImpuesto)
    const montoTotal    = montoBase + valorImpuesto

    const cambiar = (campo: string, valor: string) => {
        setForm(prev => ({ ...prev, [campo]: valor }))
        setError(null)
    }

    const handleSubmit = (e?: FormEvent) => {
        e?.preventDefault()
        if (!montoBase || montoBase <= 0)             { setError('El monto debe ser mayor a cero.'); return }
        if (!form.categoria)                           { setError('Selecciona una categoría.'); return }
        if (!form.descripcion.trim())                  { setError('Ingresa una descripción.'); return }
        if (tipo === 'expense' && !puedeCraneEgresos) { setError('No tienes permiso para registrar egresos.'); return }

        onGuardar({
            tipo,
            categoria:     form.categoria,
            descripcion:   form.descripcion.trim(),
            monto:         montoBase,
            fecha:         form.fecha,
            metodo_pago:   form.metodo_pago || undefined,
            referencia:    form.referencia  || undefined,
            notas:         form.notas       || undefined,
            impuesto_tipo: form.impuesto_tipo as TipoImpuesto,
        })
    }

    const categoriasOpts = categorias.map(c => ({ value: c, label: c }))
    const impuestoOpts   = Object.values(TipoImpuesto).map(t => ({
        value: t,
        label: `${t}${TASA_IMPUESTO[t] > 0 ? ` (${(TASA_IMPUESTO[t] * 100).toFixed(0)}%)` : ''}`,
    }))
    const metodoPagoOpts = Object.values(MetodoPago).map(m => ({ value: m, label: m }))

    if (!montado) return null

    return createPortal(
        <>
            {/* Backdrop cubre toda la pantalla */}
            <div
                ref={backdropRef}
                className="fixed inset-0 z-[155] bg-black/70 backdrop-blur-sm"
                style={{ opacity: 0, pointerEvents: 'none' }}
                onClick={onCerrar}
            />
            {/* Wrapper centrado en toda la pantalla */}
            <div
                ref={wrapperRef}
                className="fixed inset-0 z-[156] flex items-center justify-center p-4 sm:p-6 pointer-events-none"
                style={{ display: 'none' }}
            >
                <div ref={modalRef} className="pointer-events-auto relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-zinc-900/50 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                                <ReceiptText className="w-4 h-4 text-orange-400" />
                            </div>
                            <div>
                                <h2 className="text-white font-bold">Nueva Transacción</h2>
                                <p className="text-zinc-500 text-xs">Registra un ingreso o egreso del taller</p>
                            </div>
                        </div>
                        <button onClick={onCerrar} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

                        {/* Tipo */}
                        <div>
                            <label className={labelCls}>Tipo</label>
                            <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-0.5">
                                <button
                                    type="button"
                                    onClick={() => { setTipo('income'); cambiar('categoria', '') }}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-sm font-medium transition-all ${
                                        tipo === 'income' ? 'bg-emerald-500/15 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                                >
                                    <ArrowUpCircle className="w-3.5 h-3.5" /> Ingreso
                                </button>
                                <button
                                    type="button"
                                    disabled={!puedeCraneEgresos}
                                    onClick={() => { setTipo('expense'); cambiar('categoria', '') }}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-sm font-medium transition-all disabled:opacity-35 disabled:cursor-not-allowed ${
                                        tipo === 'expense' ? 'bg-rose-500/15 text-rose-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                                >
                                    <ArrowDownCircle className="w-3.5 h-3.5" /> Egreso
                                </button>
                            </div>
                        </div>

                        {/* Categoría */}
                        <div>
                            <label className={labelCls}>Categoría</label>
                            <SelectPremium value={form.categoria} onChange={val => cambiar('categoria', val)} options={categoriasOpts} placeholder="Seleccionar categoría..." />
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className={labelCls}>Descripción</label>
                            <input type="text" value={form.descripcion} onChange={e => cambiar('descripcion', e.target.value)} placeholder="Ej: Pago nómina mecánicos mayo" className={inputCls} />
                        </div>

                        {/* Monto + Impuesto */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Monto base ($)</label>
                                <input type="number" min="0" step="1" value={form.monto} onChange={e => cambiar('monto', e.target.value)} placeholder="0" className={inputCls + ' tabular-nums'} />
                            </div>
                            <div>
                                <label className={labelCls}>Impuesto</label>
                                <SelectPremium value={form.impuesto_tipo} onChange={val => cambiar('impuesto_tipo', val)} options={impuestoOpts} />
                            </div>
                        </div>

                        {valorImpuesto > 0 && (
                            <div className="flex items-center justify-between px-4 py-2.5 bg-blue-500/5 border border-blue-500/15 rounded-xl text-xs">
                                <span className="text-zinc-500">+ {formatCOP(valorImpuesto)} impuesto</span>
                                <span className="text-white font-semibold tabular-nums">Total {formatCOP(montoTotal)}</span>
                            </div>
                        )}

                        {/* Fecha + Método */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Fecha</label>
                                <input type="date" value={form.fecha} onChange={e => cambiar('fecha', e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Método de pago</label>
                                <SelectPremium value={form.metodo_pago} onChange={val => cambiar('metodo_pago', val)} options={metodoPagoOpts} />
                            </div>
                        </div>

                        {/* Referencia */}
                        <div>
                            <label className={labelCls}>Referencia <span className="normal-case text-zinc-700 font-normal">(opcional)</span></label>
                            <input type="text" value={form.referencia} onChange={e => cambiar('referencia', e.target.value)} placeholder="Nro. de transferencia, recibo..." className={inputCls} />
                        </div>

                        {/* Notas */}
                        <div>
                            <label className={labelCls}>Notas <span className="normal-case text-zinc-700 font-normal">(opcional)</span></label>
                            <textarea value={form.notas} onChange={e => cambiar('notas', e.target.value)} rows={2} className={inputCls + ' resize-none'} />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /><span>{error}</span>
                            </div>
                        )}
                    </form>

                    <div className="flex gap-3 px-5 py-4 border-t border-white/5 flex-shrink-0">
                        <button type="button" onClick={onCerrar} className="flex-1 px-4 py-2.5 border border-zinc-800 text-zinc-400 hover:text-white font-medium rounded-xl transition-colors text-sm hover:bg-white/5">
                            Cancelar
                        </button>
                        <button type="button" disabled={cargando} onClick={() => handleSubmit()}
                            className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors shadow-lg shadow-orange-500/20 text-sm flex items-center justify-center gap-2"
                        >
                            {cargando ? <SpinnerMinimal className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            Guardar
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
    transacciones: Transaccion[]
    rol:           RolContabilidad
}

// ── Componente principal ───────────────────────────────────

export default function TabMovimientos({ transacciones: txInit, rol }: Props) {
    const [transacciones, setTransacciones] = useState<Transaccion[]>(txInit)
    const [filtroTipo, setFiltroTipo]       = useState<FiltrotipoTransaccion>('todos')
    const [filtroMes, setFiltroMes]         = useState(getMesActual())
    const [mostrarDrawer, setMostrarDrawer] = useState(false)
    const [anulando, setAnulando]           = useState<string | null>(null)
    const [cargando, startTransition]       = useTransition()

    const opcionesMeses = generarOpcionesMeses()
    const esAdmin = rol !== 'receptionist'

    // ── GSAP filtro segmented control
    const filtroIndicador = useRef<HTMLDivElement>(null)
    const filtroBtns      = useRef<Map<FiltrotipoTransaccion, HTMLButtonElement>>(new Map())
    const primerFiltro    = useRef(true)

    useEffect(() => {
        const btn  = filtroBtns.current.get(filtroTipo)
        const pill = filtroIndicador.current
        if (!btn || !pill) return
        if (primerFiltro.current) {
            primerFiltro.current = false
            gsap.set(pill, { x: btn.offsetLeft, width: btn.offsetWidth, opacity: 1 })
        } else {
            gsap.to(pill, { x: btn.offsetLeft, width: btn.offsetWidth, duration: 0.28, ease: 'expo.out' })
        }
    }, [filtroTipo])

    const aplicarFiltros = (tipo: FiltrotipoTransaccion, mes: string) => {
        setFiltroTipo(tipo)
        setFiltroMes(mes)
        startTransition(async () => {
            const res = await getTransaccionesAction({ tipo, mes })
            if (res.ok) setTransacciones(res.data)
        })
    }

    const guardarTransaccion = (params: NuevaTransaccionParams) => {
        startTransition(async () => {
            const res = await crearTransaccionAction(params)
            if (!res.ok) return
            const nuevas = await getTransaccionesAction({ tipo: filtroTipo, mes: filtroMes })
            if (nuevas.ok) setTransacciones(nuevas.data)
            setMostrarDrawer(false)
        })
    }

    const anularTx = (id: string) => {
        setAnulando(id)
        startTransition(async () => {
            const res = await anularTransaccionAction(id)
            if (res.ok) {
                const nuevas = await getTransaccionesAction({ tipo: filtroTipo, mes: filtroMes })
                if (nuevas.ok) setTransacciones(nuevas.data)
            }
            setAnulando(null)
        })
    }

    const FILTROS: { id: FiltrotipoTransaccion; label: string }[] = [
        { id: 'todos',   label: 'Todos' },
        { id: 'income',  label: 'Ingresos' },
        { id: 'expense', label: 'Egresos' },
    ]

    return (
        <>
            <CardV2 relleno="ninguno" className="overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-white/[0.06]">
                    <h2 className="text-sm font-semibold text-white">Movimientos</h2>
                    <div className="flex items-center gap-2 flex-wrap">

                        {/* Filtro tipo con GSAP */}
                        <div className="relative flex bg-zinc-950 border border-zinc-800 rounded-xl p-0.5">
                            <div
                                ref={filtroIndicador}
                                className="absolute inset-y-0 bg-zinc-800 rounded-[10px] shadow-sm pointer-events-none"
                                style={{ opacity: 0, width: 0 }}
                            />
                            {FILTROS.map(({ id, label }) => (
                                <button
                                    key={id}
                                    ref={el => { if (el) filtroBtns.current.set(id, el) }}
                                    onClick={() => aplicarFiltros(id, filtroMes)}
                                    className={`relative z-10 px-4 py-2 text-sm font-medium rounded-[10px] transition-colors whitespace-nowrap ${
                                        filtroTipo === id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Selector de mes */}
                        <SelectPremium
                            value={filtroMes}
                            onChange={val => aplicarFiltros(filtroTipo, val)}
                            options={opcionesMeses.map(op => ({ value: op.valor, label: op.etiqueta }))}
                            className="w-36"
                        />

                        <button
                            onClick={() => setMostrarDrawer(true)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold rounded-xl transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Nueva
                        </button>
                    </div>
                </div>

                {/* Lista */}
                {cargando ? (
                    <div className="flex items-center justify-center py-12">
                        <SpinnerMinimal className="w-5 h-5 text-orange-400" />
                    </div>
                ) : transacciones.length === 0 ? (
                    <EmptyState Icono={ReceiptText} titulo="Sin transacciones este período" descripcion="Crea una nueva transacción con el botón Nueva." />
                ) : (
                    <ul className="divide-y divide-white/[0.04]">
                        {transacciones.map(tx => (
                            <li key={tx.id} className={`px-5 py-3 hover:bg-white/[0.02] transition-colors ${tx.estado === 'cancelled' ? 'opacity-40' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.tipo === 'income' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                                        {tx.tipo === 'income'
                                            ? <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-400" />
                                            : <ArrowDownCircle className="w-3.5 h-3.5 text-rose-400" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-zinc-200 font-medium truncate">{tx.descripcion}</p>
                                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-600">
                                            <span>{tx.categoria}</span>
                                            <span>·</span>
                                            <span>{formatFecha(tx.fecha)}</span>
                                            {tx.metodo_pago && <><span>·</span><span>{tx.metodo_pago}</span></>}
                                            {tx.impuesto_tipo && tx.impuesto_valor > 0 && (
                                                <span className="text-blue-500">{tx.impuesto_tipo}: {formatCompacto(tx.impuesto_valor)}</span>
                                            )}
                                        </div>
                                    </div>
                                    {estadoBadge(tx.estado)}
                                    <span className={`text-sm font-bold tabular-nums tracking-tight min-w-[80px] text-right flex-shrink-0 ${tx.tipo === 'income' ? 'text-emerald-400' : 'text-rose-400'} ${tx.estado === 'cancelled' ? 'line-through' : ''}`}>
                                        {tx.tipo === 'income' ? '+' : '-'}{formatCompacto(tx.monto)}
                                    </span>
                                    {esAdmin && tx.estado !== 'cancelled' && (
                                        <button
                                            onClick={() => anularTx(tx.id)}
                                            disabled={anulando === tx.id}
                                            className="p-1.5 text-zinc-700 hover:text-rose-400 hover:bg-rose-500/8 rounded-lg transition-all flex-shrink-0"
                                            title="Anular transacción"
                                        >
                                            {anulando === tx.id
                                                ? <SpinnerMinimal className="w-3.5 h-3.5" />
                                                : <Ban className="w-3.5 h-3.5" />
                                            }
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardV2>

            <NuevaTransaccionDrawer
                abierto={mostrarDrawer}
                cargando={cargando}
                rol={rol}
                onCerrar={() => setMostrarDrawer(false)}
                onGuardar={guardarTransaccion}
            />
        </>
    )
}
