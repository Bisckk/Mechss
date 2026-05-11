'use client'

import { useState, useTransition } from 'react'
import { Plus, Phone, Mail, X, Loader2, Users, Edit2, CheckCircle } from 'lucide-react'
import { createSupplierAction, updateSupplierAction, type Supplier } from '@/lib/actions/inventario_v2'

interface Props { initialSuppliers: Supplier[] }

const emptyForm = { name: '', contact_name: '', phone: '', email: '', address: '', payment_terms: '', notes: '' }

export default function ProveedoresClient({ initialSuppliers }: Props) {
    const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
    const [showForm, setShowForm] = useState(false)
    const [editTarget, setEditTarget] = useState<Supplier | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()
    const [savedId, setSavedId] = useState<string | null>(null)

    const openCreate = () => { setForm(emptyForm); setEditTarget(null); setError(''); setShowForm(true) }
    const openEdit   = (s: Supplier) => {
        setForm({ name: s.name, contact_name: s.contact_name ?? '', phone: s.phone ?? '', email: s.email ?? '', address: s.address ?? '', payment_terms: s.payment_terms ?? '', notes: s.notes ?? '' })
        setEditTarget(s); setError(''); setShowForm(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (!form.name.trim()) { setError('El nombre es obligatorio.'); return }

        startTransition(async () => {
            if (editTarget) {
                const res = await updateSupplierAction(editTarget.id, form)
                if (!res.ok) { setError(res.error); return }
                setSuppliers(prev => prev.map(s => s.id === editTarget.id ? { ...s, ...form } : s))
                setSavedId(editTarget.id)
            } else {
                const res = await createSupplierAction(form)
                if (!res.ok) { setError(res.error); return }
                setSuppliers(prev => [{ id: res.data.id, workshop_id: '', is_active: true, created_at: new Date().toISOString(), ...form } as Supplier, ...prev])
                setSavedId(res.data.id)
            }
            setShowForm(false)
            setTimeout(() => setSavedId(null), 3000)
        })
    }

    return (
        <div className="space-y-6 pb-16">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        Proveedores
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1 ml-[52px]">{suppliers.length} proveedores registrados</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95">
                    <Plus className="w-4 h-4" /> Nuevo Proveedor
                </button>
            </div>

            {/* Success toast */}
            {savedId && (
                <div className="flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> Proveedor guardado correctamente.
                </div>
            )}

            {/* List */}
            {suppliers.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-2xl bg-zinc-900/20">
                    <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 font-semibold">Sin proveedores registrados</p>
                    <p className="text-xs text-zinc-700 mt-1">Agrega tus proveedores para vincularlos a las órdenes de compra.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {suppliers.map(s => (
                        <div key={s.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center font-bold text-blue-400 text-sm">
                                    {s.name.charAt(0).toUpperCase()}
                                </div>
                                <button onClick={() => openEdit(s)} className="p-1.5 text-zinc-600 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                            <h3 className="font-bold text-white text-base mb-1">{s.name}</h3>
                            {s.contact_name && <p className="text-xs text-zinc-500 mb-2">{s.contact_name}</p>}
                            <div className="space-y-1.5">
                                {s.phone && (
                                    <a href={`tel:${s.phone}`} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors">
                                        <Phone className="w-3.5 h-3.5" /> {s.phone}
                                    </a>
                                )}
                                {s.email && (
                                    <a href={`mailto:${s.email}`} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors truncate">
                                        <Mail className="w-3.5 h-3.5" /> {s.email}
                                    </a>
                                )}
                                {s.payment_terms && (
                                    <p className="text-[11px] text-zinc-600 mt-2 border-t border-white/5 pt-2">{s.payment_terms}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Slide-in form drawer */}
            {showForm && (
                <div className="fixed inset-0 z-[200] flex">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="relative ml-auto h-full w-full max-w-sm bg-zinc-950 border-l border-white/10 shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
                            <h2 className="font-bold text-white">{editTarget ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-none">
                            {[
                                { key: 'name', label: 'Nombre *', placeholder: 'Distribuidora Honda', required: true },
                                { key: 'contact_name', label: 'Contacto', placeholder: 'Juan Pérez' },
                                { key: 'phone', label: 'Teléfono', placeholder: '+57 300 000 0000' },
                                { key: 'email', label: 'Email', placeholder: 'ventas@proveedor.com' },
                                { key: 'address', label: 'Dirección', placeholder: 'Calle 45 # 12-34' },
                                { key: 'payment_terms', label: 'Condiciones de pago', placeholder: 'Crédito 30 días' },
                                { key: 'notes', label: 'Notas', placeholder: 'Observaciones adicionales' },
                            ].map(f => (
                                <div key={f.key} className="space-y-1.5">
                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{f.label}</label>
                                    <input
                                        type="text"
                                        value={(form as any)[f.key]}
                                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder}
                                        required={f.required}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-700"
                                    />
                                </div>
                            ))}
                            {error && <p className="text-xs text-red-400 bg-red-500/8 border border-red-500/20 px-3 py-2 rounded-xl">{error}</p>}
                        </form>
                        <div className="px-5 py-4 border-t border-white/5 flex-shrink-0 flex gap-3">
                            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl bg-zinc-900 border border-white/8 text-sm text-zinc-400 hover:text-white font-semibold transition-all">Cancelar</button>
                            <button onClick={e => handleSubmit(e as any)} disabled={isPending} className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editTarget ? 'Guardar cambios' : 'Crear proveedor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
