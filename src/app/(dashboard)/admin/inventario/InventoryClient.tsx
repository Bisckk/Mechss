'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
    Plus, Search, Filter, AlertCircle, Package, Edit, Trash2, Eye, EyeOff, Loader2,
    DollarSign, TrendingUp, ShoppingBag, BarChart3, Grid3X3, List, X, ImagePlus, Tag,
    TriangleAlert, Download
} from 'lucide-react'
import { exportInventario } from '@/lib/utils/exportar'
import { gsap } from 'gsap'
import { InventoryItem, createInventoryItemAction, updateInventoryItemAction, deleteInventoryItemAction } from '@/lib/actions/inventory'
import ImageUploader from '@/components/ui/ImageUploader'

type ViewMode = 'table' | 'grid'

export default function InventoryClient({ initialItems }: { initialItems: InventoryItem[] }) {
    const [items, setItems] = useState<InventoryItem[]>(initialItems)
    const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const pageRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.inv-header',
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.35, ease: 'expo.out', force3D: true }
            )
            gsap.fromTo('.inv-stat',
                { opacity: 0, y: 16, scale: 0.97 },
                { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.06, ease: 'expo.out', force3D: true, delay: 0.05 }
            )
        }, pageRef)
        return () => ctx.revert()
    }, [])
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [viewMode, setViewMode] = useState<ViewMode>('table')

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedItem, setSelectedItem] = useState<Partial<InventoryItem>>({})
    const [isSaving, setIsSaving] = useState(false)

    const categories = ['Accesorios', 'Repuestos', 'Líquidos y Lubricantes', 'Herramientas', 'Otro']

    // ── Computed Stats ──────────────────────────────────────────
    const stats = useMemo(() => {
        const totalProducts = items.length
        const published = items.filter(i => i.is_published).length
        const lowStock = items.filter(i => i.stock_quantity > 0 && i.stock_quantity <= (i.min_stock || 2)).length
        const outOfStock = items.filter(i => i.stock_quantity === 0).length
        const totalValue = items.reduce((acc, i) => acc + (i.sale_price * i.stock_quantity), 0)
        return { totalProducts, published, lowStock, outOfStock, totalValue }
    }, [items])

    const lowStockItems = useMemo(
        () => items.filter(i => i.stock_quantity <= (i.min_stock || 0) && (i.min_stock || 0) > 0),
        [items]
    )

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
        return matchesSearch && matchesCategory
    })

    const formatCOP = (value: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
    }

    const parseCurrencyInput = (raw: string): number => {
        const cleaned = raw.replace(/[^0-9]/g, '')
        return parseInt(cleaned) || 0
    }

    const formatInputDisplay = (value: number | undefined): string => {
        if (!value || value === 0) return ''
        return value.toLocaleString('es-CO')
    }

    // ── Margin Calculation ──────────────────────────────────────
    const margin = useMemo(() => {
        const cost = selectedItem.cost_price || 0
        const sale = selectedItem.sale_price || 0
        if (sale <= 0) return 0
        return Math.round(((sale - cost) / sale) * 100)
    }, [selectedItem.cost_price, selectedItem.sale_price])

    const handleOpenModal = (item?: InventoryItem) => {
        if (item) {
            setSelectedItem(item)
            setIsEditing(true)
        } else {
            setSelectedItem({
                name: '',
                description: '',
                sku: '',
                category: 'Accesorios',
                cost_price: 0,
                sale_price: 0,
                stock_quantity: 0,
                min_stock: 0,
                is_published: false,
                image_url: ''
            })
            setIsEditing(false)
        }
        setIsModalOpen(true)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        if (isEditing && selectedItem.id) {
            const res = await updateInventoryItemAction(selectedItem.id, selectedItem)
            if (res.ok) {
                setItems(items.map(i => i.id === selectedItem.id ? { ...i, ...selectedItem } as InventoryItem : i))
            } else {
                alert(res.error)
            }
        } else {
            const res = await createInventoryItemAction(selectedItem)
            if (res.ok) {
                setItems([res.data, ...items])
            } else {
                alert(res.error)
            }
        }

        setIsSaving(false)
        setIsModalOpen(false)
    }

    const handleDelete = (item: InventoryItem) => {
        setDeleteError(null)
        setDeleteTarget(item)
    }

    const confirmDelete = async () => {
        if (!deleteTarget) return
        setIsDeleting(true)
        const res = await deleteInventoryItemAction(deleteTarget.id)
        setIsDeleting(false)
        if (res.ok) {
            setItems(prev => prev.filter(i => i.id !== deleteTarget.id))
            setDeleteTarget(null)
        } else {
            setDeleteError(res.error)
        }
    }

    const togglePublish = async (item: InventoryItem) => {
        const res = await updateInventoryItemAction(item.id, { is_published: !item.is_published })
        if (res.ok) {
            setItems(items.map(i => i.id === item.id ? { ...i, is_published: !item.is_published } : i))
        }
    }

    // ── Stat Cards ──────────────────────────────────────────────
    const statCards = [
        { label: 'Total Productos', value: stats.totalProducts, icon: Package, color: 'from-blue-500/20 to-blue-600/5', iconColor: 'text-blue-400', borderColor: 'border-blue-500/10' },
        { label: 'Publicados', value: stats.published, icon: Eye, color: 'from-emerald-500/20 to-emerald-600/5', iconColor: 'text-emerald-400', borderColor: 'border-emerald-500/10' },
        { label: 'Stock Bajo', value: stats.lowStock + stats.outOfStock, icon: AlertCircle, color: 'from-rose-500/20 to-rose-600/5', iconColor: 'text-rose-400', borderColor: 'border-rose-500/10' },
        { label: 'Valor Inventario', value: formatCOP(stats.totalValue), icon: DollarSign, color: 'from-orange-500/20 to-orange-600/5', iconColor: 'text-orange-400', borderColor: 'border-orange-500/10' },
    ]

    return (
        <div ref={pageRef} className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="inv-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-500/10">
                            <ShoppingBag className="w-6 h-6 text-orange-400" />
                        </div>
                        Inventario y Catálogo
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1">Administra tus repuestos y los productos de tu tienda virtual.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => exportInventario(items)}
                        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border border-white/10 active:scale-95"
                        title="Exportar CSV"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">CSV</span>
                    </button>
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-orange-500/20 active:scale-95">
                        <Plus className="w-4 h-4" /> Nuevo Producto
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map(card => (
                    <div key={card.label} className={`inv-stat bg-gradient-to-br ${card.color} border ${card.borderColor} rounded-2xl p-5 backdrop-blur-sm`}>
                        <div className="flex items-center justify-between mb-3">
                            <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                            <BarChart3 className="w-4 h-4 text-zinc-600" />
                        </div>
                        <p className="text-2xl font-black text-white">{card.value}</p>
                        <p className="text-xs text-zinc-400 mt-1 font-medium">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Low-stock alert banner */}
            {lowStockItems.length > 0 && (
                <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 rounded-2xl px-5 py-4">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-amber-400">
                            {lowStockItems.length} {lowStockItems.length === 1 ? 'producto por debajo' : 'productos por debajo'} del stock mínimo
                        </p>
                        <p className="text-xs text-amber-400/70 mt-0.5">
                            {lowStockItems.slice(0, 3).map(i => i.name).join(', ')}{lowStockItems.length > 3 ? ` y ${lowStockItems.length - 3} más` : ''}
                        </p>
                    </div>
                </div>
            )}

            {/* Filters & View Toggle */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="bg-zinc-900/80 border border-white/5 rounded-xl flex items-center px-4 py-3 backdrop-blur-md flex-1">
                    <Search className="w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nombre, SKU o descripción..."
                        className="bg-transparent border-none outline-none text-white w-full placeholder-zinc-600 pl-3 text-sm focus:ring-0"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="bg-zinc-900/80 border border-white/5 rounded-xl flex items-center px-4 py-3 backdrop-blur-md">
                        <Filter className="w-4 h-4 text-zinc-400 mr-2" />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="bg-transparent border-none text-white text-sm focus:outline-none"
                        >
                            <option value="all">Todas</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="bg-zinc-900/80 border border-white/5 rounded-xl flex items-center p-1 backdrop-blur-md">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Grid3X3 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {filteredItems.length === 0 ? (
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl text-center text-zinc-500 flex flex-col items-center justify-center p-16 gap-4 backdrop-blur-md">
                    <div className="p-4 rounded-full bg-white/5">
                        <Package className="w-12 h-12 opacity-30" />
                    </div>
                    <div>
                        <p className="text-white font-bold text-lg">Sin productos</p>
                        <p className="text-sm text-zinc-500 mt-1">Añade tu primer producto y empieza a vender en tu tienda virtual.</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="mt-2 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                        <Plus className="w-4 h-4" /> Crear Primer Producto
                    </button>
                </div>
            ) : viewMode === 'table' ? (
                /* ── TABLE VIEW ────────────────────────────────── */
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-zinc-400">
                            <thead className="bg-black/40 text-xs uppercase font-semibold text-zinc-500 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4">Artículo</th>
                                    <th className="px-6 py-4">Categoría</th>
                                    <th className="px-6 py-4">Stock</th>
                                    <th className="px-6 py-4">Costo</th>
                                    <th className="px-6 py-4">Precio Venta</th>
                                    <th className="px-6 py-4">Catálogo Web</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredItems.map(item => (
                                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg border border-white/10 object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center bg-white/5">
                                                        <Package className="w-5 h-5 text-zinc-600" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-white max-w-[200px] truncate">{item.name}</p>
                                                    <p className="text-xs text-zinc-500 truncate max-w-[200px]">{item.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-white/5 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 w-fit">
                                                <Tag className="w-3 h-3 text-zinc-500" />
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-bold ${item.stock_quantity === 0 ? 'text-red-500' : item.stock_quantity <= 2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                {item.stock_quantity}
                                            </span>
                                            {item.stock_quantity === 0 && <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">AGOTADO</span>}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-zinc-500">{formatCOP(Number(item.cost_price))}</td>
                                        <td className="px-6 py-4 text-white font-bold">{formatCOP(Number(item.sale_price))}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => togglePublish(item)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${item.is_published ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}
                                            >
                                                {item.is_published ? <><Eye className="w-3.5 h-3.5" /> Público</> : <><EyeOff className="w-3.5 h-3.5" /> Oculto</>}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenModal(item)} className="p-2 text-zinc-400 hover:text-white transition-colors hover:bg-white/5 rounded-lg"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(item)} className="p-2 text-rose-400 hover:text-rose-300 transition-colors hover:bg-rose-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* ── GRID VIEW ────────────────────────────────── */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems.map(item => (
                        <div key={item.id} className="bg-zinc-900/60 border border-white/5 rounded-2xl overflow-hidden group hover:border-white/10 transition-all backdrop-blur-md flex flex-col">
                            {/* Image */}
                            <div className="h-40 bg-zinc-950 border-b border-white/5 relative overflow-hidden flex items-center justify-center">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <Package className="w-12 h-12 text-zinc-700" />
                                )}
                                {/* Badges */}
                                <div className="absolute top-3 left-3 flex gap-2">
                                    {item.is_published && (
                                        <span className="bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">PÚBLICO</span>
                                    )}
                                    {item.stock_quantity === 0 && (
                                        <span className="bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">AGOTADO</span>
                                    )}
                                    {item.stock_quantity > 0 && item.stock_quantity <= 2 && (
                                        <span className="bg-amber-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">BAJO STOCK</span>
                                    )}
                                </div>
                                {/* Quick Actions */}
                                <div className="absolute top-3 right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(item)} className="p-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white hover:bg-black/80 transition-colors">
                                        <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDelete(item)} className="p-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-rose-400 hover:bg-black/80 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            {/* Info */}
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider bg-white/5 px-2 py-0.5 rounded">{item.category}</span>
                                </div>
                                <h3 className="text-sm font-bold text-white leading-tight mb-1 flex-1">{item.name}</h3>
                                {item.description && <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{item.description}</p>}
                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                                    <div>
                                        <p className="text-xs text-zinc-500">Precio</p>
                                        <p className="text-lg font-black text-white">{formatCOP(Number(item.sale_price))}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-zinc-500">Stock</p>
                                        <p className={`text-lg font-black ${item.stock_quantity === 0 ? 'text-red-500' : item.stock_quantity <= 2 ? 'text-amber-400' : 'text-emerald-400'}`}>{item.stock_quantity}</p>
                                    </div>
                                </div>
                            </div>
                            {/* Footer Action */}
                            <div className="px-4 pb-4">
                                <button
                                    onClick={() => togglePublish(item)}
                                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-colors ${item.is_published ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/30' : 'bg-white/5 text-zinc-500 border border-white/5 hover:text-white hover:bg-white/10'}`}
                                >
                                    {item.is_published ? <><Eye className="w-3.5 h-3.5" /> Visible en Tienda</> : <><EyeOff className="w-3.5 h-3.5" /> Mostrar en Tienda</>}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── MODAL ─────────────────────────────────────────── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-20 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[calc(100dvh-5rem)] relative overflow-hidden">
                        {/* Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none z-0" />

                        {/* Header — flex-shrink-0, never scrolls */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 flex-shrink-0 relative z-10">
                            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-orange-500/20 shrink-0">
                                    {isEditing ? <Edit className="w-4 h-4 text-orange-400" /> : <Plus className="w-4 h-4 text-orange-400" />}
                                </div>
                                {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-colors shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 relative z-10">
                        {/* Scrollable body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Product Name */}
                            <div>
                                <label className="text-xs font-semibold text-zinc-400">Nombre del Producto *</label>
                                <input required type="text" value={selectedItem.name || ''} onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })} className="w-full mt-1 bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500/50" placeholder="Ej: Casco Integral Pro" />
                            </div>

                            {/* Image Upload + Live Preview */}
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-zinc-400 block">Imagen del Producto</label>

                                {/* Layout: uploader izquierda, preview derecha en sm+ */}
                                <div className={`flex gap-4 ${selectedItem.image_url ? 'flex-col sm:flex-row sm:items-start' : ''}`}>
                                    <div className={selectedItem.image_url ? 'flex-1' : 'w-full'}>
                                        <ImageUploader
                                            value={selectedItem.image_url || ''}
                                            onChange={(url) => setSelectedItem({ ...selectedItem, image_url: url })}
                                            folder="products"
                                        />
                                    </div>

                                    {/* Vista previa — solo visible cuando hay imagen */}
                                    {selectedItem.image_url && (
                                        <div className="sm:w-44 flex-shrink-0">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Vista previa</p>
                                            <div className="bg-zinc-900/60 border border-white/8 rounded-2xl overflow-hidden">
                                                {/* Imagen */}
                                                <div className="h-32 bg-zinc-950 flex items-center justify-center overflow-hidden">
                                                    <img
                                                        src={selectedItem.image_url}
                                                        alt="Preview"
                                                        className="w-full h-full object-contain p-3"
                                                    />
                                                </div>
                                                {/* Info */}
                                                <div className="p-3">
                                                    {selectedItem.category && (
                                                        <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-1">{selectedItem.category}</p>
                                                    )}
                                                    <p className="text-xs font-bold text-white leading-tight line-clamp-2">
                                                        {selectedItem.name || 'Nombre del producto'}
                                                    </p>
                                                    {(selectedItem.sale_price || 0) > 0 && (
                                                        <p className="text-sm font-black text-white mt-1.5">
                                                            ${Number(selectedItem.sale_price).toLocaleString('es-CO')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-zinc-400">Descripción</label>
                                <textarea value={selectedItem.description || ''} onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })} className="w-full mt-1 bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500/50 min-h-[80px]" placeholder="Breve descripción del producto para tus clientes..." />
                            </div>

                            {/* Category Pills */}
                            <div>
                                <label className="text-xs font-semibold text-zinc-400 block mb-3">Categoría</label>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setSelectedItem({ ...selectedItem, category: c as any })}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedItem.category === c
                                                ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-lg shadow-orange-500/10'
                                                : 'bg-white/[0.03] text-zinc-400 border-white/5 hover:border-white/10 hover:text-white'
                                                }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Pricing Section */}
                            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-orange-400" /> Precio e Inventario
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                    {/* Costo */}
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-400">Costo (COP)</label>
                                        <div className="relative mt-1">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600 text-sm font-bold pointer-events-none">$</span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={formatInputDisplay(selectedItem.cost_price)}
                                                onChange={(e) => setSelectedItem({ ...selectedItem, cost_price: parseCurrencyInput(e.target.value) })}
                                                className="w-full bg-black/40 border border-white/5 rounded-xl p-3 pl-7 text-sm text-white focus:outline-none focus:border-orange-500/50 min-h-[44px]"
                                                placeholder="50.000"
                                            />
                                        </div>
                                    </div>

                                    {/* Precio Venta */}
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-400">Precio Venta (COP)</label>
                                        <div className="relative mt-1">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-orange-500/60 text-sm font-bold pointer-events-none">$</span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={formatInputDisplay(selectedItem.sale_price)}
                                                onChange={(e) => setSelectedItem({ ...selectedItem, sale_price: parseCurrencyInput(e.target.value) })}
                                                className="w-full bg-black/40 border border-white/5 rounded-xl p-3 pl-7 text-sm text-white font-bold focus:outline-none focus:border-orange-500/50 min-h-[44px]"
                                                placeholder="120.000"
                                            />
                                        </div>
                                    </div>

                                    {/* Stock */}
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-400">Stock Actual</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={selectedItem.stock_quantity || ''}
                                            onChange={(e) => setSelectedItem({ ...selectedItem, stock_quantity: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
                                            className="w-full mt-1 bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500/50 min-h-[44px]"
                                            placeholder="10"
                                        />
                                    </div>

                                    {/* Min Stock */}
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-400">Stock Mínimo</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={selectedItem.min_stock || ''}
                                            onChange={(e) => setSelectedItem({ ...selectedItem, min_stock: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
                                            className="w-full mt-1 bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500/50 min-h-[44px]"
                                            placeholder="3"
                                        />
                                    </div>
                                </div>
                                {/* Margin Indicator */}
                                {(selectedItem.sale_price || 0) > 0 && (
                                    <div className="mt-4 flex items-center gap-3">
                                        <TrendingUp className={`w-4 h-4 ${margin > 30 ? 'text-emerald-400' : margin > 10 ? 'text-amber-400' : 'text-rose-400'}`} />
                                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-500 ${margin > 30 ? 'bg-emerald-500' : margin > 10 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(margin, 100)}%` }} />
                                        </div>
                                        <span className={`text-sm font-bold ${margin > 30 ? 'text-emerald-400' : margin > 10 ? 'text-amber-400' : 'text-rose-400'}`}>{margin}%</span>
                                        <span className="text-xs text-zinc-500">margen</span>
                                    </div>
                                )}
                            </div>

                            {/* Publish Toggle - Premium Switch */}
                            <button
                                type="button"
                                onClick={() => setSelectedItem({ ...selectedItem, is_published: !selectedItem.is_published })}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${selectedItem.is_published
                                    ? 'bg-emerald-500/10 border-emerald-500/20'
                                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                                    }`}
                            >
                                {/* Custom Toggle */}
                                <div className={`w-12 h-7 rounded-full p-1 transition-colors flex-shrink-0 ${selectedItem.is_published ? 'bg-emerald-500' : 'bg-zinc-700'
                                    }`}>
                                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${selectedItem.is_published ? 'translate-x-5' : 'translate-x-0'
                                        }`} />
                                </div>
                                <div className="text-left">
                                    <p className={`text-sm font-bold ${selectedItem.is_published ? 'text-emerald-400' : 'text-white'}`}>
                                        {selectedItem.is_published ? 'Publicado en Catálogo Web' : 'Publicar en Catálogo Web'}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        {selectedItem.is_published ? 'Visible para tus clientes en la tienda virtual.' : 'Activa para que los clientes lo vean y compren por WhatsApp.'}
                                    </p>
                                </div>
                                {selectedItem.is_published && <Eye className="w-5 h-5 text-emerald-400 ml-auto flex-shrink-0" />}
                            </button>

                        </div>{/* end scrollable body */}

                        {/* Footer — flex-shrink-0, never scrolls */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-zinc-950/60 backdrop-blur-sm flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 text-sm font-semibold text-zinc-400 hover:text-white transition-colors rounded-xl hover:bg-white/5"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-orange-500/20 active:scale-95 disabled:opacity-50"
                            >
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
                            </button>
                        </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Confirm Delete Modal ───────────────────────────── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
                        onClick={() => !isDeleting && setDeleteTarget(null)}
                    />

                    {/* Sheet / Card */}
                    <div className="
                        relative w-full bg-zinc-950 border border-white/10 shadow-2xl
                        flex flex-col
                        rounded-t-2xl sm:rounded-2xl
                        sm:max-w-sm
                        animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200
                    ">
                        {/* Drag handle — mobile only */}
                        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
                            <div className="w-10 h-1 rounded-full bg-white/20" />
                        </div>

                        {/* Body */}
                        <div className="px-6 pt-5 pb-2 text-center sm:text-left">
                            {/* Icon */}
                            <div className="flex justify-center sm:justify-start mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                    <TriangleAlert className="w-5 h-5 text-rose-400" />
                                </div>
                            </div>

                            <h3 className="text-base font-bold text-white mb-1.5">
                                ¿Eliminar producto?
                            </h3>
                            <p className="text-sm text-zinc-400 leading-relaxed">
                                Estás a punto de eliminar{' '}
                                <span className="font-semibold text-white">"{deleteTarget.name}"</span>.
                                {' '}Esta acción no se puede deshacer.
                            </p>

                            {deleteError && (
                                <p className="mt-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
                                    {deleteError}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 px-6 py-5">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                                className="flex-1 py-3 sm:py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 py-3 sm:py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Eliminando...</>
                                    : <><Trash2 className="w-4 h-4" /> Eliminar</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
