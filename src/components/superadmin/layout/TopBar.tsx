'use client'

import { usePathname } from 'next/navigation'
import { Menu, Bell } from 'lucide-react'

const TITULOS: Record<string, string> = {
  '/superadmin/dashboard':      'Panel de Control',
  '/superadmin/workshops':      'Talleres',
  '/superadmin/workshops/new':  'Nuevo Taller',
  '/superadmin/plans':          'Planes y Suscripciones',
  '/superadmin/accounting':     'Contabilidad',
  '/superadmin/users':          'Usuarios Admin',
}

interface Props {
  onMenuClick: () => void
  userName:    string
}

export default function TopBar({ onMenuClick, userName }: Props) {
  const pathname = usePathname()
  const titulo   = TITULOS[pathname] ?? 'Superadmin'

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 h-16 px-4 sm:px-6 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 flex-shrink-0">
      {/* Hamburguesa — solo móvil */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-1 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Título de página */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base sm:text-lg font-bold text-white truncate">{titulo}</h1>
        <p className="hidden sm:block text-xs text-zinc-600 -mt-0.5">Plataforma MotoFix</p>
      </div>

      {/* Acciones derechas */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button className="relative p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-zinc-800">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
            <span className="text-xs font-bold text-orange-400">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white leading-none">{userName}</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">Superadmin</p>
          </div>
        </div>
      </div>
    </header>
  )
}
