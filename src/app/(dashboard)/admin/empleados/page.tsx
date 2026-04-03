import { createClient } from '@/lib/supabase/server'
import { Plus, UserCog, ShieldCheck } from 'lucide-react'

export const metadata = {
    title: 'Empleados | MotoFix Admin',
}

export default async function AdminEmpleadosPage() {
    const supabase = await createClient()

    // Future integration to fetch employees for this workshop (Mecánicos, Recepcionistas, Admin extra)

    return (
        <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-500">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Empleados</h1>
                    <p className="text-zinc-400 text-sm mt-1">Administra tu personal de Recepcionista y Mecánicos.</p>
                </div>
                <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-orange-500/20 active:scale-95">
                    <Plus className="w-4 h-4" /> Nuevo Empleado
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Placeholder cards */}
                {[1, 2, 3].map((_, i) => (
                    <div key={i} className="bg-zinc-900 border border-white/5 rounded-2xl p-5 hover:bg-white/[0.02] transition-colors relative overflow-hidden flex flex-col items-center text-center">

                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                            Activo
                        </div>

                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 border-2 border-zinc-800 flex items-center justify-center shadow-lg mt-2 mb-4">
                            <UserCog className="w-6 h-6 text-zinc-400" />
                        </div>

                        <h3 className="text-white font-semibold mb-1">Juan Mecánico {i + 1}</h3>
                        <p className="text-zinc-500 text-xs mb-3 flex items-center justify-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Mecánico
                        </p>

                        <div className="w-full flex justify-between px-2 pt-3 border-t border-white/5 mt-auto">
                            <button className="text-xs hover:text-white text-zinc-400 font-medium">Editar</button>
                            <button className="text-xs hover:text-rose-400 text-zinc-400 font-medium">Desactivar</button>
                        </div>

                    </div>
                ))}
            </div>

            <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden backdrop-blur-md min-h-[150px] flex items-center justify-center mt-8">
                <div className="text-center text-zinc-500 flex flex-col items-center gap-3">
                    <p className="text-sm">Configuración de Accesos y Permisos irá aquí.</p>
                </div>
            </div>

        </div>
    )
}
