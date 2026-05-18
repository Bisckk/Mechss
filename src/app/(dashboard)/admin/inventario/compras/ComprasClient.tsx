'use client'

import { useState, useTransition } from 'react'
import { Plus, ShoppingCart, CheckCircle, Clock, X, Loader2, Trash2, Package, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
    createPurchaseOrderAction, receivePurchaseOrderAction, cancelPurchaseOrderAction,
    type PurchaseOrder, type Supplier,
} from '@/lib/actions/inventario_v2'
import type { InventoryItem } from '@/lib/actions/inventario_v2'

interface Props {
    initialOrders: PurchaseOrder[]
    suppliers: Supplier[]
    inventoryItems: InventoryItem[]
}

const STATUS_LABELS: Record<string, string> = { pending: 'Pendiente', received: 'Recibida', cancelled: 'Cancelada' }
const STATUS_COLORS: Record<string, string> = {
    pending:   'bg-amber-500/10 border-amber-500/20 text-amber-400',
    received:  'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    cancelled: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500',
}

interface OrderLineForm {
    key: number
    item_id: string
    item_name: string
    quantity: number
    unit_cost: number
}

export default function ComprasClient({ initialOrders, suppliers, inventoryItems }: Props) {
    const [orders, setOrders] = useState<PurchaseOrder[]>(initialOrders)
    const [showForm, setShowForm] = useState(false)
    const [supplierId, setSupplierId] = useState('')
    const [notes, setNotes] = useState('')
    const [lines, setLines] = useState<OrderLineForm[]>([{ key: 0, item_id: '', item_name: '', quantity: 1, unit_cost: 0 }])
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()
    const [actionId, setActionId] = useState<string | null>(null)

    const addLine = () => setLines(prev => [...prev, { key: Date.now(), item_id: '', item_name: '', quantity: 1, unit_cost: 0 }])
    const removeLine = (key: number) => setLines(prev => prev.filter(l => l.key !== key))

    const updateLine = (key: number, field: keyof OrderLineForm, value: any) => {
        setLines(prev => prev.map(l => {
            if (l.key !== key) return l
            const updated = { ...l, [field]: value }
            if (field === 'item_id') {
                const item = inventoryItems.find(i => i.id === value)
                if (item) { updated.item_name = item.name; updated.unit_cost = item.cost_price || item.sale_price }
            }
            return updated
        }))
    }

    const totalOrder = lines.reduce((acc, l) => acc + (l.quantity || 0) * (l.unit_cost || 0), 0)

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (!lines.some(l => l.item_name.trim())) { setError('Agrega al menos un producto.'); return }

        startTransition(async () => {
            const res = await createPurchaseOrderAction({
                supplier_id: supplierId || undefined,
                notes: notes || undefined,
                items: lines.filter(l => l.item_name.trim()).map(l => ({
                    item_id: l.item_id || undefined,
                    item_name: l.item_name,
                    quantity: l.quantity,
                    unit_cost: l.unit_cost,
                })),
            })
            if (!res.ok) { setError(res.error); return }
            const supplier = suppliers.find(s => s.id === supplierId)
            setOrders(prev => [{
                id: res.data.id, workshop_id: '', supplier_id: supplierId || null, status: 'pending',
                notes: notes || null, total_cost: totalOrder, received_at: null,
                created_at: new Date().toISOString(),
                supplier: supplier ? { name: supplier.name } : null,
            } as PurchaseOrder, ...prev])
            setShowForm(false)
            setSupplierId(''); setNotes(''); setLines([{ key: 0, item_id: '', item_name: '', quantity: 1, unit_cost: 0 }])
        })
    }

    const handleReceive = (orderId: string) => {
        setActionId(orderId)
        startTransition(async () => {
            const res = await receivePurchaseOrderAction(orderId)
            if (res.ok) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'received', received_at: new Date().toISOString() } : o))
            setActionId(null)
        })
    }

    const handleCancel = (orderId: string) => {
        setActionId(orderId)
        startTransition(async () => {
            const res = await cancelPurchaseOrderAction(orderId)
            if (res.ok) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
            setActionId(null)
        })
    }

    return (
        <div className="space-y-6 pb-16">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-purple-400" />
                        </div>
                        Órdenes de Compra
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1 ml-[52px]">{orders.filter(o => o.status === 'pending').length} órdenes pendientes</p>
                </div>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95">
                    <Plus className="w-4 h-4" /> Nueva Orden
                </button>
            </div>

            {/* Orders list */}
            {orders.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-2xl bg-zinc-900/20">
                    <ShoppingCart className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 font-semibold">Sin órdenes de compra</p>
                    <p className="text-xs text-zinc-700 mt-1">Crea una orden para registrar la entrada de repuestos.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map(order => (
                        <div key={order.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/15 flex items-center justify-center flex-shrink-0">
                                        <ShoppingCart className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[order.status]}`}>
                                                {STATUS_LABELS[order.status]}
                                            </span>
                                            {order.supplier && <span className="text-xs text-zinc-500">{order.supplier.name}</span>}
                                        </div>
                                        <p className="text-sm font-bold text-white">{formatCurrency(order.total_cost)}</p>
                                        <p className="text-xs text-zinc-600 mt-0.5">
                                            {new Date(order.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })}
                                            {order.received_at && ` · Recibida ${new Date(order.received_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}`}
                                        </p>
                                        {order.notes && <p className="text-xs text-zinc-600 mt-1 italic">{order.notes}</p>}
                                    </div>
                                </div>
                                {order.status === 'pending' && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleReceive(order.id)}
                                            disabled={isPending && actionId === order.id}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-sm font-bold border border-emerald-500/30 transition-all disabled:opacity-50"
                                        >
                                            {isPending && actionId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                            Recibir
                                        </button>
                                        <button
                                            onClick={() => handleCancel(order.id)}
                                            disabled={isPending && actionId === order.id}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm font-semibold border border-white/5 transition-all disabled:opacity-50"
                                        >
                                            <X className="w-4 h-4" /> Cancelar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create form drawer */}
            {showForm && (
                <div className="fixed inset-0 z-[200] flex">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="relative ml-auto h-full w-full max-w-lg bg-zinc-950 border-l border-white/10 shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
                            <h2 className="font-bold text-white">Nueva Orden de Compra</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-none">
                            {/* Supplier */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Proveedor</label>
                                <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all">
                                    <option value="">Sin proveedor</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Notas</label>
                                <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones..." className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-700" />
                            </div>

                            {/* Lines */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Productos</label>
                                    <button onClick={addLine} type="button" className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1">
                                        <Plus className="w-3.5 h-3.5" /> Agregar
                                    </button>
                                </div>
                                {lines.map((line, idx) => (
                                    <div key={line.key} className="bg-zinc-900 border border-white/8 rounded-xl p-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={line.item_id}
                                                onChange={e => updateLine(line.key, 'item_id', e.target.value)}
                                                className="flex-1 bg-zinc-800 border border-white/8 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50"
                                            >
                                                <option value="">Seleccionar del inventario</option>
                                                {inventoryItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                            </select>
                                            {lines.length > 1 && (
                                                <button onClick={() => removeLine(line.key)} type="button" className="p-1.5 text-zinc-600 hover:text-red-400 rounded-lg transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        {!line.item_id && (
                                            <input type="text" value={line.item_name} onChange={e => updateLine(line.key, 'item_name', e.target.value)} placeholder="Nombre del producto" className="w-full bg-zinc-800 border border-white/8 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50 placeholder:text-zinc-700" />
                                        )}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] text-zinc-600 font-semibold">Cantidad</label>
                                                <input type="number" min="1" value={line.quantity} onChange={e => updateLine(line.key, 'quantity', parseInt(e.target.value) || 1)} className="w-full bg-zinc-800 border border-white/8 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50 mt-1" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-zinc-600 font-semibold">Costo unit.</label>
                                                <input type="number" min="0" step="any" value={line.unit_cost} onChange={e => updateLine(line.key, 'unit_cost', parseFloat(e.target.value) || 0)} className="w-full bg-zinc-800 border border-white/8 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50 mt-1" />
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-zinc-600 text-right">Subtotal: {formatCurrency(line.quantity * line.unit_cost)}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Total */}
                            <div className="flex items-center justify-between bg-zinc-900 border border-white/5 rounded-xl px-4 py-3">
                                <span className="text-sm font-semibold text-zinc-400">Total Orden</span>
                                <span className="text-lg font-black text-white">{formatCurrency(totalOrder)}</span>
                            </div>

                            {error && <p className="text-xs text-red-400 bg-red-500/8 border border-red-500/20 px-3 py-2 rounded-xl">{error}</p>}
                        </div>
                        <div className="px-5 py-4 border-t border-white/5 flex-shrink-0 flex gap-3">
                            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl bg-zinc-900 border border-white/8 text-sm text-zinc-400 hover:text-white font-semibold transition-all">Cancelar</button>
                            <button onClick={e => handleCreate(e as any)} disabled={isPending} className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                Crear Orden
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
