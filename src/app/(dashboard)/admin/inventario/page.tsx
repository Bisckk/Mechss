import { createClient } from '@/lib/supabase/server'
import { Plus, Search, Filter, AlertCircle, Package } from 'lucide-react'

export const metadata = {
    title: 'Inventario | MotoFix Admin',
}

export default async function AdminInventarioPage() {
    const supabase = await createClient()

    return (
        <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-500">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Inventario</h1>
                    <p className="text-zinc-400 text-sm mt-1">Repuestos, aceites, accesorios y alertas de stock.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                        <AlertCircle className="w-4 h-4" /> Alertas
                    </button>
                    <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-orange-500/20 active:scale-95">
                        <Plus className="w-4 h-4" /> Nuevo Artículo
                    </button>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="bg-zinc-900 border border-white/5 rounded-xl flex items-center px-4 py-3 backdrop-blur-md flex-1">
                    <Search className="w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Buscar artículo, SKU o categoría..."
                        className="bg-transparent border-none outline-none text-white w-full placeholder-zinc-600 pl-3 text-sm focus:ring-0"
                    />
                </div>
                <button className="flex items-center gap-2 bg-zinc-900 border border-white/5 px-4 py-3 rounded-xl text-sm font-medium text-white hover:bg-zinc-800 transition-colors">
                    <Filter className="w-4 h-4 text-zinc-400" />
                    Categorías
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                {['Repuestos', 'Aceites', 'Accesorios'].map((cat, i) => (
                    <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 text-center cursor-pointer hover:bg-white/5 transition-colors border-t-zinc-800">
                        <p className="text-sm font-medium text-zinc-300">{cat}</p>
                    </div>
                ))}
            </div>

            <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden backdrop-blur-md min-h-[400px] flex items-center justify-center">
                <div className="text-center text-zinc-500 flex flex-col items-center gap-3">
                    <Package className="w-12 h-12 opacity-20" />
                    <p className="text-sm">Tabla de inventario aquí.</p>
                    <p className="text-xs max-w-sm">Listado, cantidades, precios y buscador.</p>
                </div>
            </div>

        </div>
    )
}
