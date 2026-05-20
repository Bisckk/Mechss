'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import {
    Building2, Plus, AlertCircle, CheckCircle2, X,
    FileText, CreditCard, ChevronRight,
} from 'lucide-react'
import CardV2 from '@/components/ui/CardV2'
import BadgeV2 from '@/components/ui/BadgeV2'
import EmptyState from '@/components/ui/EmptyState'
import SpinnerMinimal from '@/components/ui/SpinnerMinimal'
import SelectPremium from '@/components/ui/SelectPremium'
import {
    getProveedoresAction,
    getFacturasProveedorAction,
    crearProveedorAction,
    crearFacturaProveedorAction,
    registrarPagoProveedorAction,
} from '@/lib/actions/proveedores'
import { MetodoPago } from '@/lib/types/contabilidad'
import type {
    Proveedor,
    FacturaProveedor,
    EstadoFacturaProveedor,
} from '@/lib/types/contabilidad'

// ── Helpers ────────────────────────────────────────────────

function formatCOP(val: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)
}

function formatFecha(iso: string): string {
    const [y, m, d] = iso.split('-')
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    return `${parseInt(d)} ${meses[parseInt(m) - 1]} ${y}`
}

function estadoFacturaBadge(estado: EstadoFacturaProveedor) {
    if (estado === 'paid')    return <BadgeV2 variante="exito"   etiqueta="Pagada" />
    if (estado === 'partial') return <BadgeV2 variante="alerta"  etiqueta="Parcial" />
    return                           <BadgeV2 variante="peligro" etiqueta="Pendiente" />
}

// ── Clases reutilizables ───────────────────────────────────

const inputCls = 'w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/60 focus:outline-none transition-colors'
const labelCls = 'block text-[11px] font-medium tracking-wide uppercase text-zinc-500 mb-1.5'

// ── Shell compartido de modal ──────────────────────────────

function ModalShell({ abierto, onCerrar, titulo, subtitulo, icono: Icono, children, footer }: {
    abierto: boolean
    onCerrar: () => void
    titulo: string
    subtitulo?: string
    icono?: React.ElementType
    children: React.ReactNode
    footer: React.ReactNode
}) {
    const wrapperRef  = useRef<HTMLDivElement>(null)
    const backdropRef = useRef<HTMLDivElement>(null)
    const modalRef    = useRef<HTMLDivElement>(null)
    const [montado, setMontado] = useState(false)

    useEffect(() => { setMontado(true) }, [])

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
                        {Icono && (
                            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                                <Icono className="w-4 h-4 text-orange-400" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-white font-bold">{titulo}</h2>
                            {subtitulo && <p className="text-zinc-500 text-xs mt-0.5">{subtitulo}</p>}
                        </div>
                    </div>
                    <button onClick={onCerrar} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {children}
                </div>

                <div className="flex gap-3 px-5 py-4 border-t border-white/5 flex-shrink-0">
                    {footer}
                </div>
                </div>
            </div>
        </>,
        document.body
    )
}

function FooterBtns({ onCerrar, onGuardar, cargando, labelGuardar, IconoGuardar }: {
    onCerrar: () => void
    onGuardar: () => void
    cargando: boolean
    labelGuardar: string
    IconoGuardar: React.ElementType
}) {
    return (
        <>
            <button onClick={onCerrar} className="flex-1 px-4 py-2.5 border border-white/10 text-zinc-400 hover:text-white font-medium rounded-xl transition-colors text-sm hover:bg-white/5">
                Cancelar
            </button>
            <button onClick={onGuardar} disabled={cargando} className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors shadow-lg shadow-orange-500/20 text-sm flex items-center justify-center gap-2">
                {cargando ? <SpinnerMinimal className="w-4 h-4" /> : <IconoGuardar className="w-4 h-4" />}
                {labelGuardar}
            </button>
        </>
    )
}

// ── Drawer nuevo proveedor ─────────────────────────────────

function DrawerNuevoProveedor({ abierto, onCerrar, onExito }: {
    abierto: boolean
    onCerrar: () => void
    onExito: (prov: Proveedor) => void
}) {
    const [form, setForm]   = useState({ nombre: '', nit: '', contacto: '', telefono: '', email: '' })
    const [error, setError] = useState<string | null>(null)
    const [cargando, start] = useTransition()

    const cambiar = (campo: string, val: string) => setForm(p => ({ ...p, [campo]: val }))

    const guardar = () => {
        if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }
        setError(null)
        start(async () => {
            const res = await crearProveedorAction({
                nombre:   form.nombre,
                nit:      form.nit      || undefined,
                contacto: form.contacto || undefined,
                telefono: form.telefono || undefined,
                email:    form.email    || undefined,
            })
            if (!res.ok) { setError(res.error); return }
            onExito({ id: res.data.id, nombre: form.nombre, nit: form.nit || null, contacto: form.contacto || null, telefono: form.telefono || null, email: form.email || null, saldo_pendiente: 0 })
            onCerrar()
        })
    }

    const campos = [
        { label: 'Nombre / Razón social', campo: 'nombre', placeholder: 'Distribuidora XYZ S.A.S.', required: true },
        { label: 'NIT',      campo: 'nit',      placeholder: '900.123.456-7' },
        { label: 'Contacto', campo: 'contacto', placeholder: 'Carlos Pérez' },
        { label: 'Teléfono', campo: 'telefono', placeholder: '300 000 0000' },
        { label: 'Email',    campo: 'email',    placeholder: 'proveedor@email.com' },
    ]

    return (
        <ModalShell
            abierto={abierto}
            onCerrar={onCerrar}
            titulo="Nuevo Proveedor"
            subtitulo="Agrega un proveedor al directorio del taller"
            icono={Building2}
            footer={<FooterBtns onCerrar={onCerrar} onGuardar={guardar} cargando={cargando} labelGuardar="Guardar" IconoGuardar={CheckCircle2} />}
        >
            {campos.map(({ label, campo, placeholder, required }) => (
                <div key={campo}>
                    <label className={labelCls}>
                        {label} {required && <span className="text-orange-500">*</span>}
                    </label>
                    <input
                        type="text"
                        value={(form as any)[campo]}
                        onChange={e => cambiar(campo, e.target.value)}
                        placeholder={placeholder}
                        className={inputCls}
                    />
                </div>
            ))}
            {error && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /><span>{error}</span>
                </div>
            )}
        </ModalShell>
    )
}

// ── Drawer nueva factura proveedor ─────────────────────────

function DrawerNuevaFactura({ proveedor, onCerrar, onExito }: {
    proveedor: Proveedor | null
    onCerrar: () => void
    onExito: () => void
}) {
    const abierto = !!proveedor
    const [form, setForm]   = useState({ numero: '', concepto: '', monto: '', emision: new Date().toISOString().split('T')[0], vencimiento: '' })
    const [error, setError] = useState<string | null>(null)
    const [cargando, start] = useTransition()

    const cambiar = (campo: string, val: string) => { setForm(p => ({ ...p, [campo]: val })); setError(null) }

    const guardar = () => {
        if (!form.numero.trim())   { setError('El número de factura es obligatorio.'); return }
        if (!form.concepto.trim()) { setError('El concepto es obligatorio.'); return }
        const monto = parseFloat(form.monto)
        if (!monto || monto <= 0) { setError('El monto debe ser mayor a cero.'); return }
        if (!proveedor) return
        setError(null)

        start(async () => {
            const res = await crearFacturaProveedorAction({
                proveedor_id:      proveedor.id,
                numero_factura:    form.numero,
                concepto:          form.concepto,
                monto_total:       monto,
                fecha_emision:     form.emision,
                fecha_vencimiento: form.vencimiento || undefined,
            })
            if (!res.ok) { setError(res.error); return }
            onExito()
            onCerrar()
        })
    }

    return (
        <ModalShell
            abierto={abierto}
            onCerrar={onCerrar}
            titulo="Nueva Factura"
            subtitulo={proveedor?.nombre}
            icono={FileText}
            footer={<FooterBtns onCerrar={onCerrar} onGuardar={guardar} cargando={cargando} labelGuardar="Registrar" IconoGuardar={CheckCircle2} />}
        >
            <div>
                <label className={labelCls}>N° Factura <span className="text-orange-500">*</span></label>
                <input type="text" value={form.numero} onChange={e => cambiar('numero', e.target.value)} placeholder="FV-001234" className={inputCls} />
            </div>
            <div>
                <label className={labelCls}>Concepto <span className="text-orange-500">*</span></label>
                <input type="text" value={form.concepto} onChange={e => cambiar('concepto', e.target.value)} placeholder="Compra repuestos..." className={inputCls} />
            </div>
            <div>
                <label className={labelCls}>Monto total ($) <span className="text-orange-500">*</span></label>
                <input type="number" min="0" step="1" value={form.monto} onChange={e => cambiar('monto', e.target.value)} placeholder="0" className={inputCls + ' tabular-nums'} />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={labelCls}>Fecha emisión</label>
                    <input type="date" value={form.emision} onChange={e => cambiar('emision', e.target.value)} className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Vencimiento <span className="normal-case text-zinc-700 font-normal">(opc.)</span></label>
                    <input type="date" value={form.vencimiento} onChange={e => cambiar('vencimiento', e.target.value)} className={inputCls} />
                </div>
            </div>
            {error && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /><span>{error}</span>
                </div>
            )}
        </ModalShell>
    )
}

// ── Drawer pago factura ────────────────────────────────────

function DrawerPagoFactura({ factura, onCerrar, onExito }: {
    factura: FacturaProveedor | null
    onCerrar: () => void
    onExito: () => void
}) {
    const abierto = !!factura
    const [monto, setMonto]   = useState('')
    const [metodo, setMetodo] = useState(MetodoPago.Efectivo)
    const [fecha, setFecha]   = useState(new Date().toISOString().split('T')[0])
    const [notas, setNotas]   = useState('')
    const [error, setError]   = useState<string | null>(null)
    const [cargando, start]   = useTransition()

    const metodoPagoOpts = Object.values(MetodoPago).map(m => ({ value: m, label: m }))

    const pagar = () => {
        const montoNum = parseFloat(monto)
        if (!montoNum || montoNum <= 0) { setError('El monto debe ser mayor a cero.'); return }
        if (!factura) return
        setError(null)

        start(async () => {
            const res = await registrarPagoProveedorAction({
                factura_id:  factura.id,
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

    return (
        <ModalShell
            abierto={abierto}
            onCerrar={onCerrar}
            titulo="Registrar Pago"
            subtitulo={factura ? `${factura.proveedor_nombre} · ${factura.numero_factura}` : undefined}
            icono={CreditCard}
            footer={<FooterBtns onCerrar={onCerrar} onGuardar={pagar} cargando={cargando} labelGuardar="Pagar" IconoGuardar={CreditCard} />}
        >
            {/* Saldo destacado */}
            {factura && (
                <div className="px-4 py-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                    <p className={labelCls + ' mb-1'}>Saldo pendiente</p>
                    <p className="text-2xl font-bold text-amber-400 tracking-tight tabular-nums">{formatCOP(factura.saldo_pendiente)}</p>
                    <p className="text-[11px] text-zinc-600 mt-1 truncate">{factura.concepto}</p>
                </div>
            )}

            <div>
                <label className={labelCls}>Monto a pagar ($)</label>
                <input type="number" min="0" step="1" value={monto} onChange={e => { setMonto(e.target.value); setError(null) }} placeholder="0" className={inputCls + ' tabular-nums'} />
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
                    <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputCls} />
                </div>
            </div>
            <div>
                <label className={labelCls}>Notas <span className="normal-case text-zinc-700 font-normal">(opcional)</span></label>
                <input type="text" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Transferencia enviada a..." className={inputCls} />
            </div>
            {error && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /><span>{error}</span>
                </div>
            )}
        </ModalShell>
    )
}

// ── Props ──────────────────────────────────────────────────

interface Props {
    proveedores: Proveedor[]
    facturas:    FacturaProveedor[]
}

// ── Componente principal ───────────────────────────────────

export default function TabProveedores({ proveedores: provInit, facturas: factInit }: Props) {
    const [proveedores, setProveedores]   = useState<Proveedor[]>(provInit)
    const [facturas, setFacturas]         = useState<FacturaProveedor[]>(factInit)
    const [provSelec, setProvSelec]       = useState<Proveedor | null>(null)
    const [showNuevoProv, setNuevoProv]   = useState(false)
    const [facturaDrawer, setFactDrawer]  = useState<Proveedor | null>(null)
    const [pagoDrawer, setPagoDrawer]     = useState<FacturaProveedor | null>(null)
    const [, startTransition]             = useTransition()

    const refrescar = () => {
        startTransition(async () => {
            const [p, f] = await Promise.all([
                getProveedoresAction(),
                getFacturasProveedorAction(provSelec?.id),
            ])
            if (p.ok) setProveedores(p.data)
            if (f.ok) setFacturas(f.data)
        })
    }

    const seleccionarProveedor = (prov: Proveedor) => {
        setProvSelec(prov)
        startTransition(async () => {
            const res = await getFacturasProveedorAction(prov.id)
            if (res.ok) setFacturas(res.data)
        })
    }

    const totalPendiente = proveedores.reduce((s, p) => s + p.saldo_pendiente, 0)

    return (
        <div className="space-y-5">
            {/* Banner total */}
            {totalPendiente > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-rose-500/5 border border-rose-500/10 rounded-xl text-sm">
                    <Building2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span className="text-zinc-500">Cuentas por pagar a proveedores</span>
                    <span className="text-rose-400 font-bold tabular-nums tracking-tight ml-auto">{formatCOP(totalPendiente)}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Lista proveedores */}
                <CardV2 relleno="ninguno" className="overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
                        <h3 className="text-sm font-semibold text-white">Proveedores</h3>
                        <button
                            onClick={() => setNuevoProv(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/18 text-orange-400 text-xs font-medium rounded-lg transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Nuevo
                        </button>
                    </div>

                    {proveedores.length === 0 ? (
                        <EmptyState Icono={Building2} titulo="Sin proveedores" descripcion="Agrega tu primer proveedor para gestionar cuentas por pagar." />
                    ) : (
                        <ul className="divide-y divide-white/[0.04]">
                            {proveedores.map(prov => (
                                <li key={prov.id}>
                                    <button
                                        onClick={() => seleccionarProveedor(prov)}
                                        className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all hover:bg-white/[0.02] ${provSelec?.id === prov.id ? 'bg-orange-500/4 border-r-2 border-orange-500' : ''}`}
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-zinc-800/80 border border-white/5 flex items-center justify-center flex-shrink-0">
                                            <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-zinc-200 truncate">{prov.nombre}</p>
                                            {prov.nit && <p className="text-[11px] text-zinc-600">NIT: {prov.nit}</p>}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            {prov.saldo_pendiente > 0
                                                ? <span className="text-sm font-bold tabular-nums tracking-tight text-rose-400">{formatCOP(prov.saldo_pendiente)}</span>
                                                : <BadgeV2 variante="exito" etiqueta="Al día" tamaño="sm" />
                                            }
                                        </div>
                                        <ChevronRight className="w-3.5 h-3.5 text-zinc-700 flex-shrink-0" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardV2>

                {/* Facturas del proveedor seleccionado */}
                <CardV2 relleno="ninguno" className="overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-white truncate">
                                {provSelec ? provSelec.nombre : 'Facturas'}
                            </h3>
                            {provSelec && <p className="text-[11px] text-zinc-600 mt-0.5">Historial de facturas</p>}
                        </div>
                        {provSelec && (
                            <button
                                onClick={() => setFactDrawer(provSelec)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/18 text-orange-400 text-xs font-medium rounded-lg transition-all flex-shrink-0 ml-3"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Factura
                            </button>
                        )}
                    </div>

                    {facturas.length === 0 ? (
                        <EmptyState
                            Icono={FileText}
                            titulo="Sin facturas"
                            descripcion={provSelec ? 'Este proveedor no tiene facturas registradas.' : 'Selecciona un proveedor para ver sus facturas.'}
                        />
                    ) : (
                        <ul className="divide-y divide-white/[0.04] max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {facturas.map(f => {
                                const vencida = f.fecha_vencimiento && f.estado !== 'paid' && new Date(f.fecha_vencimiento) < new Date()
                                return (
                                    <li key={f.id} className={`px-5 py-3.5 hover:bg-white/[0.02] transition-colors ${vencida ? 'bg-rose-500/2' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[11px] font-mono text-orange-400/80">{f.numero_factura}</span>
                                                    {estadoFacturaBadge(f.estado)}
                                                    {vencida && <BadgeV2 variante="peligro" etiqueta="Vencida" tamaño="sm" />}
                                                </div>
                                                <p className="text-sm text-zinc-300 truncate">{f.concepto}</p>
                                                <p className="text-[11px] text-zinc-600 mt-0.5">
                                                    {formatFecha(f.fecha_emision)}
                                                    {f.fecha_vencimiento ? ` · Vence ${formatFecha(f.fecha_vencimiento)}` : ''}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-bold tabular-nums tracking-tight text-white">{formatCOP(f.monto_total)}</p>
                                                {f.saldo_pendiente > 0 && (
                                                    <p className="text-[11px] text-rose-400 tabular-nums">Debe: {formatCOP(f.saldo_pendiente)}</p>
                                                )}
                                            </div>
                                            {f.estado !== 'paid' && (
                                                <button
                                                    onClick={() => setPagoDrawer(f)}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/8 hover:bg-emerald-500/15 text-emerald-400 text-xs font-medium rounded-lg transition-all flex-shrink-0"
                                                >
                                                    <CreditCard className="w-3.5 h-3.5" />
                                                    Pagar
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </CardV2>
            </div>

            <DrawerNuevoProveedor
                abierto={showNuevoProv}
                onCerrar={() => setNuevoProv(false)}
                onExito={prov => setProveedores(prev => [prov, ...prev])}
            />
            <DrawerNuevaFactura
                proveedor={facturaDrawer}
                onCerrar={() => setFactDrawer(null)}
                onExito={refrescar}
            />
            <DrawerPagoFactura
                factura={pagoDrawer}
                onCerrar={() => setPagoDrawer(null)}
                onExito={refrescar}
            />
        </div>
    )
}
