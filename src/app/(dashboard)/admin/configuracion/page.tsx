import { createClient } from '@/lib/supabase/server'
import { Settings, Info, Briefcase, KeyRound, Camera, Globe } from 'lucide-react'

export const metadata = {
    title: 'Configuración | MotoFix Admin',
}

export default async function AdminConfiguracionPage() {
    const supabase = await createClient()

    // Future backend fetch configuration for current workshop

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500 pb-10">

            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Configuración del Taller</h1>
                <p className="text-zinc-400 text-sm mt-1">Ajusta los detalles legales, redes sociales y tu plan actual.</p>
            </div>

            {/* Plan Info */}
            <div className="bg-gradient-to-r from-orange-500/10 to-transparent border-l-4 border-orange-500 p-5 rounded-r-2xl border border-white/5 shadow-sm">
                <h2 className="text-white font-semibold flex items-center gap-2 mb-1.5"><Briefcase className="w-4 h-4 text-orange-400" /> Plan Pro Activo</h2>
                <p className="text-sm text-zinc-400 max-w-lg leading-relaxed">Estás disfrutando de todas las características avanzadas para escalar tu taller. Renueva el 15 de Mayo de 2026.</p>
                <button className="text-xs font-semibold text-orange-400 mt-4 hover:underline underline-offset-4 decoration-orange-500/30">Gestionar Suscripción →</button>
            </div>

            <div className="space-y-6">

                {/* Info Legal */}
                <section className="bg-zinc-900 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                    <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                        <Info className="w-5 h-5 text-zinc-500" /> Información General y Legal
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="text-xs text-zinc-400 block mb-1.5 font-medium">Nombre Comercial</label>
                            <input type="text" defaultValue="Mi Taller MotoFix" className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors" />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400 block mb-1.5 font-medium">Razón Social o NIT</label>
                            <input type="text" defaultValue="900.123.456-7" className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-xs text-zinc-400 block mb-1.5 font-medium">Dirección Principal</label>
                            <input type="text" defaultValue="Av. Principal #123, Ciudad" className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors" />
                        </div>
                    </div>
                </section>

                {/* Redes Sociales */}
                <section className="bg-zinc-900 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                    <h2 className="text-lg font-semibold text-white mb-5">Redes Sociales</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-2">
                        <div>
                            <label className="text-xs text-zinc-400 flex items-center gap-1.5 mb-1.5 font-medium"><Camera className="w-3.5 h-3.5" /> Instagram / Redes Visuales</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-zinc-500 text-sm">@</span>
                                <input type="text" placeholder="mitaller" className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-8 pr-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400 flex items-center gap-1.5 mb-1.5 font-medium"><Globe className="w-3.5 h-3.5" /> Enlace Web / Facebook</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-zinc-500 text-sm">/</span>
                                <input type="text" placeholder="mitallerpage" className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-8 pr-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors" />
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-zinc-500 italic mt-3">Estos enlaces aparecerán en tu Landing Page y correos electrónicos.</p>
                </section>

                {/* Seguridad */}
                <section className="bg-zinc-900 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                    <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-zinc-500" /> Seguridad
                    </h2>

                    <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                        Cambiar Contraseña
                    </button>
                </section>

            </div>

            <div className="flex justify-end pt-4">
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-orange-500/20 active:scale-95">
                    Guardar Cambios
                </button>
            </div>

        </div>
    )
}
