'use client'

import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import NotificationBell from '@/components/admin/notifications/NotificationBell'

const TITULOS: Record<string, string> = {
    '/admin/dashboard':     'Dashboard',
    '/admin/taller':        'Taller',
    '/admin/agenda':        'Agenda & Citas',
    '/admin/clientes':      'Gestión de Clientes',
    '/admin/inventario':    'Inventario',
    '/admin/empleados':     'Empleados',
    '/admin/builder':       'Constructor Landing',
    '/admin/configuracion': 'Configuración',
    '/admin/contabilidad':  'Contabilidad & Flujo de Caja',
}

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    receptionist: 'Recepcionista',
    mechanic: 'Mecánico',
}

interface Props {
    onMenuClick: () => void
    userName: string
    role: string
    workshopName: string | null
}

export default function TopBar({ onMenuClick, userName, role, workshopName }: Props) {
    const pathname = usePathname()
    const titulo = TITULOS[pathname] ?? 'Panel'

    return (
        <header className="sticky top-0 z-[150] flex items-center gap-4 h-16 px-4 sm:px-6 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 flex-shrink-0">
            {/* Mobile Menu */}
            <button
                onClick={onMenuClick}
                className="lg:hidden p-2 -ml-1 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
                aria-label="Abrir menú"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Page Title */}
            <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-white truncate">{titulo}</h1>
                <p className="hidden sm:block text-xs text-zinc-500 font-medium -mt-0.5 tracking-wide truncate">
                    {workshopName ?? 'Mi Taller'}
                </p>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
                {/* Notifications */}
                <NotificationBell />

                {/* User Info */}
                <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-zinc-800">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-600 to-orange-400 border border-orange-400/30 flex items-center justify-center">
                        <span className="text-xs font-bold text-white drop-shadow-md">
                            {userName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-semibold text-white leading-none">{userName}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">{ROLE_LABELS[role] ?? role}</p>
                    </div>
                </div>
            </div>
        </header>
    )
}
