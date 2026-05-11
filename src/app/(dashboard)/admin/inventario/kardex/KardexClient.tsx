'use client'

import { useState, useMemo } from 'react'
import { BarChart2, TrendingUp, TrendingDown, Minus, Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { InventoryMovement } from '@/lib/actions/inventario_v2'

const TYPE_CONFIG: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
    entrada: { label: 'Entrada',  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', Icon: TrendingUp },
    salida:  { label: 'Salida',   color: 'text-red-400 bg-red-500/10 border-red-500/20',             Icon: TrendingDown },
    ajuste:  { label: 'Ajuste',   color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',       Icon: Minus },
}

const REF_LABELS: Record<string, string> = {
    purchase_order: 'OC',
    repair:         'Reparación',
    manual:         'Manual',
}

interface Props { initialMovements: InventoryMovement[] }

export default function KardexClient({ initialMovements }: Props) {
    const [movements] = useState<InventoryMovement[]>(initialMovements)
    const [searchTerm, setSearchTerm] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('all')

    const filtered = useMemo(() => {
        return movements.filter(m => {
            const matchesType = typeFilter === 'all' || m.movement_type === typeFilter
            const matchesSearch = !searchTerm || m.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) || m.notes?.toLowerCase().includes(searchTerm.toLowerCase())
            return matchesType && matchesSearch
        })
    }, [movements, searchTerm, typeFilter])

    const totalEntradas = movements.filter(m => m.movement_type === 'entrada').reduce((a, m) => a + m.quantity, 0)
    const totalSalidas  = movements.filter(m => m.movement_type === 'salida').reduce((a, m) => a + Math.abs(m.quantity), 0)

    return (
        <div className="space-y-6 pb-16">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <BarChart2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    Kardex de Inventario
                </h1>
                <p className="text-sm text-zinc-500 mt-1 ml-[52px]">{movements.length} movimientos registrados</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                    { label: 'Total movimientos', value: movements.length, color: 'text-white' },
                    { label: 'Unidades ingresadas', value: totalEntradas, color: 'text-emerald-400' },
                    { label: 'Unidades salidas', value: totalSalidas, color: 'text-red-400' },
                ].map(s => (
                    <div key={s.label} className="bg-zinc-900 border border-white/5 rounded-2xl p-4">
                        <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">{s.label}</p>
                        <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value.toLocaleString('es-CO')}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar producto o nota..." className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-600" />
                </div>
                <div className="flex gap-2">
                    {['all', 'entrada', 'salida', 'ajuste'].map(t => (
                        <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all capitalize ${typeFilter === t ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-zinc-900 border-white/8 text-zinc-500 hover:text-white hover:border-white/15'}`}>
                            {t === 'all' ? 'Todos' : t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Movements table */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-2xl">
                    <BarChart2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 font-semibold">Sin movimientos</p>
                </div>
            ) : (
                <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
                    {/* Mobile: cards */}
                    <div className="sm:hidden divide-y divide-white/5">
                        {filtered.map(m => {
                            const cfg = TYPE_CONFIG[m.movement_type]
                            return (
                                <div key={m.id} className="p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-sm text-white">{m.item_name || '—'}</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-zinc-500">
                                        <span>{new Date(m.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                                        <span className={`font-black text-sm ${m.movement_type === 'entrada' ? 'text-emerald-400' : m.movement_type === 'salida' ? 'text-red-400' : 'text-amber-400'}`}>
                                            {m.quantity > 0 ? '+' : ''}{m.quantity}
                                        </span>
                                    </div>
                                    {m.notes && <p className="text-xs text-zinc-600 italic">{m.notes}</p>}
                                </div>
                            )
                        })}
                    </div>

                    {/* Desktop: table */}
                    <table className="hidden sm:table w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5">
                                {['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Costo Unit.', 'Referencia', 'Notas'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.map(m => {
                                const cfg = TYPE_CONFIG[m.movement_type]
                                return (
                                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                                            {new Date(m.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-white">{m.item_name || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                                        </td>
                                        <td className={`px-4 py-3 font-black tabular-nums ${m.movement_type === 'entrada' ? 'text-emerald-400' : m.movement_type === 'salida' ? 'text-red-400' : 'text-amber-400'}`}>
                                            {m.quantity > 0 ? '+' : ''}{m.quantity}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-zinc-400 tabular-nums">
                                            {m.unit_cost ? formatCurrency(m.unit_cost) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-zinc-500">
                                            {m.reference_type ? REF_LABELS[m.reference_type] || m.reference_type : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-zinc-600 max-w-[200px] truncate">{m.notes || '—'}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
