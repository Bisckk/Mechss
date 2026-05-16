import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShieldAlert, Mail, LogOut, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Plan vencido | MotoFix' }

export default async function SuscripcionVencidaPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('role, workshop_id, full_name, workshops(name, email, plan_status, trial_ends_at, subscription_ends_at)')
        .eq('id', user.id)
        .single() as { data: any }

    // Superadmin never gets blocked
    if (profile?.role === 'superadmin') redirect('/dashboard/superadmin')

    const ws = profile?.workshops
    const isTrial = ws?.plan_status === 'trial'

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            {/* Ambient glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <span className="text-2xl font-black text-orange-500 tracking-tight">
                        Moto<span className="text-white">Fix</span>
                    </span>
                </div>

                {/* Card */}
                <div className="bg-zinc-900 border border-white/8 rounded-2xl overflow-hidden shadow-2xl">
                    {/* Top accent bar */}
                    <div className="h-1 bg-gradient-to-r from-rose-500 via-rose-400 to-orange-500" />

                    <div className="p-8">
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                <ShieldAlert className="w-8 h-8 text-rose-400" />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-xl font-bold text-white text-center mb-2">
                            {isTrial ? 'Tu período de prueba ha vencido' : 'Tu suscripción ha vencido'}
                        </h1>
                        <p className="text-zinc-400 text-sm text-center leading-relaxed mb-8">
                            {isTrial
                                ? 'El período de prueba gratuita de tu taller ha terminado. Activa un plan para seguir usando MotoFix.'
                                : 'La suscripción de tu taller ha expirado. Renueva para recuperar el acceso completo a todas las funciones.'}
                        </p>

                        {/* Workshop info */}
                        {ws?.name && (
                            <div className="bg-zinc-800/60 border border-white/5 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-black text-orange-400">
                                        {ws.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{ws.name}</p>
                                    <p className="text-xs text-zinc-500">
                                        {isTrial ? 'Prueba vencida' : 'Suscripción vencida'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* CTA */}
                        <div className="space-y-3">
                            <a
                                href={`mailto:soporte@motofix.app?subject=Renovar plan - ${ws?.name ?? ''}&body=Hola, deseo renovar mi plan de MotoFix para el taller: ${ws?.name ?? ''}`}
                                className="flex items-center justify-center gap-2 w-full py-3 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-semibold text-sm rounded-xl transition-all shadow-lg hover:shadow-orange-500/20"
                            >
                                <Mail className="w-4 h-4" />
                                Contactar para renovar
                                <ArrowRight className="w-4 h-4" />
                            </a>

                            <form action="/api/auth/signout" method="POST">
                                <button
                                    type="submit"
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-semibold text-sm rounded-xl transition-colors border border-white/8"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Cerrar sesión
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 bg-zinc-950/60 border-t border-white/5">
                        <p className="text-xs text-zinc-600 text-center">
                            ¿Necesitas ayuda? Escríbenos a{' '}
                            <a href="mailto:soporte@motofix.app" className="text-orange-500 hover:text-orange-400 transition-colors">
                                soporte@motofix.app
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
