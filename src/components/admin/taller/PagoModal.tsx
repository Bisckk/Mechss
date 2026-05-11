'use client'

import { useState, useEffect, useTransition } from 'react'
import { X, CreditCard, Banknote, Smartphone, Clock, CheckCircle, AlertCircle, Loader2, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
    getPagosRepairAction, getTotalesRepairAction, registrarPagoAction,
    type Pago, type TotalesRepair, type MetodoPago,
} from '@/lib/actions/pagos'

interface Repair {
    id: string
    tracking_code: string
    vehicle_brand: string | null
    vehicle_model: string | null
    vehicle_plate: string | null
    clients: { full_name: string } | null
}

interface Props {
    repair: Repair | null
    isOpen: boolean
    onClose: () => void
    onPagado?: () => void
}

const METODOS: { value: MetodoPago; label: string; Icon: React.ElementType }[] = [
    { value: 'efectivo',       label: 'Efectivo',       Icon: Banknote },
    { value: 'transferencia',  label: 'Transferencia',  Icon: Smartphone },
    { value: 'tarjeta',        label: 'Tarjeta',        Icon: CreditCard },
    { value: 'credito',        label: 'Crédito',        Icon: Clock },
]

function PayBadge({ status }: { status: string }) {
    if (status === 'paid') return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" /> Pagado
        </span>
    )
    if (status === 'partial') return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-full">
            <AlertCircle className="w-3 h-3" /> Pago Parcial
        </span>
    )
    return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 bg-zinc-500/10 border border-zinc-500/25 px-2.5 py-1 rounded-full">
            <Clock className="w-3 h-3" /> Pendiente
        </span>
    )
}

export default function PagoModal({ repair, isOpen, onClose, onPagado }: Props) {
    const [totales, setTotales] = useState<TotalesRepair | null>(null)
    const [pagos, setPagos] = useState<Pago[]>([])
    const [loadingData, setLoadingData] = useState(false)

    // Form state
    const [monto, setMonto] = useState('')
    const [metodo, setMetodo] = useState<MetodoPago>('efectivo')
    const [referencia, setReferencia] = useState('')
    const [notas, setNotas] = useState('')
    const [formError, setFormError] = useState('')
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        if (!isOpen || !repair) return
        setLoadingData(true)
        setFormError('')
        setMonto('')
        setReferencia('')
        setNotas('')
        setMetodo('efectivo')

        Promise.all([
            getTotalesRepairAction(repair.id),
            getPagosRepairAction(repair.id),
        ]).then(([totRes, pagRes]) => {
            if (totRes.ok) setTotales(totRes.data)
            if (pagRes.ok) setPagos(pagRes.data)
        }).finally(() => setLoadingData(false))
    }, [isOpen, repair])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setFormError('')
        const amt = parseFloat(monto.replace(/[^0-9.]/g, ''))
        if (!amt || amt <= 0) { setFormError('Ingresa un monto válido.'); return }

        startTransition(async () => {
            const res = await registrarPagoAction({
                repair_id: repair!.id,
                amount: amt,
                payment_method: metodo,
                reference: referencia || undefined,
                notes: notas || undefined,
            })

            if (!res.ok) { setFormError(res.error); return }

            // Refresh data
            const [totRes, pagRes] = await Promise.all([
                getTotalesRepairAction(repair!.id),
                getPagosRepairAction(repair!.id),
            ])
            if (totRes.ok) setTotales(totRes.data)
            if (pagRes.ok) setPagos(pagRes.data)
            setMonto('')
            setReferencia('')
            setNotas('')
            onPagado?.()
        })
    }

    if (!isOpen || !repair) return null

    const isPaid = totales?.payment_status === 'paid'

    return (
        <div className="fixed inset-0 z-[200] flex">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Panel - slides from right */}
            <div className="relative ml-auto h-full w-full max-w-[440px] bg-zinc-950 border-l border-white/10 shadow-2xl flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-orange-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white leading-tight">Cobrar Servicio</p>
                            <p className="text-[11px] text-zinc-500 font-mono">#{repair.tracking_code}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-none">
                    {/* Vehicle info */}
                    <div className="px-5 pt-4 pb-3 border-b border-white/5">
                        <p className="text-base font-bold text-white">
                            {repair.vehicle_brand} {repair.vehicle_model}
                            {repair.vehicle_plate && (
                                <span className="ml-2 text-[11px] font-mono font-black bg-white/10 px-1.5 py-0.5 rounded border border-white/10 align-middle">
                                    {repair.vehicle_plate.toUpperCase()}
                                </span>
                            )}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">{repair.clients?.full_name}</p>
                    </div>

                    {/* Financial summary */}
                    {loadingData ? (
                        <div className="px-5 py-6 space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : totales && (
                        <div className="px-5 py-4 space-y-2 border-b border-white/5">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-zinc-900 border border-white/5 rounded-xl p-3 text-center">
                                    <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1">Total</p>
                                    <p className="text-sm font-black text-white tabular-nums">{formatCurrency(totales.total_cost)}</p>
                                </div>
                                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 text-center">
                                    <p className="text-[10px] text-emerald-400/70 font-semibold uppercase tracking-wider mb-1">Pagado</p>
                                    <p className="text-sm font-black text-emerald-400 tabular-nums">{formatCurrency(totales.total_paid)}</p>
                                </div>
                                <div className={`rounded-xl p-3 text-center border ${totales.balance > 0 ? 'bg-amber-500/5 border-amber-500/15' : 'bg-zinc-900 border-white/5'}`}>
                                    <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${totales.balance > 0 ? 'text-amber-400/70' : 'text-zinc-500'}`}>Saldo</p>
                                    <p className={`text-sm font-black tabular-nums ${totales.balance > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>{formatCurrency(totales.balance)}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between px-1">
                                <PayBadge status={totales.payment_status} />
                                {isPaid && (
                                    <p className="text-xs text-emerald-400/60 font-medium">Servicio totalmente cobrado</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Payment history */}
                    {pagos.length > 0 && (
                        <div className="px-5 py-4 border-b border-white/5">
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Historial de Pagos</p>
                            <div className="space-y-2">
                                {pagos.map(pago => (
                                    <div key={pago.id} className="flex items-center justify-between bg-zinc-900 border border-white/5 rounded-xl px-3 py-2.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                                                {(() => {
                                                    const M = METODOS.find(m => m.value === pago.payment_method)
                                                    return M ? <M.Icon className="w-3.5 h-3.5 text-zinc-400" /> : <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                                                })()}
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-white capitalize">{pago.payment_method}</p>
                                                <p className="text-[10px] text-zinc-600">
                                                    {new Date(pago.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                                                    {pago.reference && ` · Ref: ${pago.reference}`}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-emerald-400">{formatCurrency(pago.amount)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New payment form */}
                    {!isPaid && (
                        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Registrar Pago</p>

                            {/* Amount */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-400">Monto *</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">$</span>
                                    <input
                                        type="number"
                                        min="1"
                                        step="any"
                                        value={monto}
                                        onChange={e => setMonto(e.target.value)}
                                        placeholder={totales ? String(Math.round(totales.balance)) : '0'}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-700 tabular-nums"
                                        required
                                    />
                                </div>
                                {totales && totales.balance > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setMonto(String(Math.round(totales.balance)))}
                                        className="text-xs text-orange-400 hover:text-orange-300 font-semibold"
                                    >
                                        Completar saldo → {formatCurrency(totales.balance)}
                                    </button>
                                )}
                            </div>

                            {/* Method */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-400">Método de pago</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {METODOS.map(({ value, label, Icon }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setMetodo(value)}
                                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                                                metodo === value
                                                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                                                    : 'bg-zinc-900 border-white/8 text-zinc-400 hover:border-white/15 hover:text-white'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reference (shown for transferencia/tarjeta) */}
                            {(metodo === 'transferencia' || metodo === 'tarjeta') && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-zinc-400">Referencia / Comprobante</label>
                                    <input
                                        type="text"
                                        value={referencia}
                                        onChange={e => setReferencia(e.target.value)}
                                        placeholder="Número de referencia"
                                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-600"
                                    />
                                </div>
                            )}

                            {/* Notes */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-400">Notas (opcional)</label>
                                <input
                                    type="text"
                                    value={notas}
                                    onChange={e => setNotas(e.target.value)}
                                    placeholder="Observaciones del pago"
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-600"
                                />
                            </div>

                            {formError && (
                                <p className="text-xs text-red-400 bg-red-500/8 border border-red-500/20 px-3 py-2 rounded-xl">{formError}</p>
                            )}
                        </form>
                    )}

                    {isPaid && (
                        <div className="px-5 py-8 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-7 h-7 text-emerald-400" />
                            </div>
                            <p className="text-base font-bold text-white mb-1">Pago Completo</p>
                            <p className="text-sm text-zinc-500">Este servicio está totalmente cobrado.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!isPaid && (
                    <div className="px-5 py-4 border-t border-white/5 flex-shrink-0 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl bg-zinc-900 border border-white/8 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 font-semibold transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={e => handleSubmit(e as any)}
                            disabled={isPending || !monto}
                            className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Registrar Pago
                        </button>
                    </div>
                )}

                {isPaid && (
                    <div className="px-5 py-4 border-t border-white/5 flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 rounded-xl bg-zinc-900 border border-white/8 text-sm text-zinc-400 hover:text-white font-semibold transition-all"
                        >
                            Cerrar
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
