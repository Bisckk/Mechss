'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { gsap } from 'gsap'
import {
  LayoutDashboard, Building2, CreditCard, BarChart3,
  Users, LogOut, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export type SidebarUser = {
  full_name:  string
  email:      string
  avatar_url: string | null
}

interface Props {
  mobileOpen:       boolean
  onMobileClose:    () => void
  user:             SidebarUser
}

const NAV = [
  {
    seccion: 'General',
    items: [
      { href: '/superadmin/dashboard', label: 'Panel de Control', Icon: LayoutDashboard },
    ],
  },
  {
    seccion: 'Inquilinos',
    items: [
      { href: '/superadmin/workshops', label: 'Talleres',          Icon: Building2 },
    ],
  },
  {
    seccion: 'Negocio',
    items: [
      { href: '/superadmin/plans',      label: 'Planes y Suscripciones', Icon: CreditCard },
      { href: '/superadmin/accounting', label: 'Contabilidad',           Icon: BarChart3 },
    ],
  },
  {
    seccion: 'Personas',
    items: [
      { href: '/superadmin/users', label: 'Usuarios Admin', Icon: Users },
    ],
  },
]

export default function Sidebar({ mobileOpen, onMobileClose, user }: Props) {
  const pathname     = usePathname()
  const router       = useRouter()
  const backdropRef  = useRef<HTMLDivElement>(null)
  const drawerRef    = useRef<HTMLDivElement>(null)
  const didAnimate   = useRef(false)

  // Entrance stagger for nav items (desktop, once)
  useEffect(() => {
    if (didAnimate.current) return
    didAnimate.current = true
    gsap.fromTo(
      '.sa-nav-item',
      { opacity: 0, x: -10, scale: 0.98 },
      { opacity: 1, x: 0, scale: 1, duration: 0.5, stagger: 0.04, ease: 'power3.out', delay: 0.1 }
    )
  }, [])

  // Mobile drawer animation
  useEffect(() => {
    const backdrop = backdropRef.current
    const drawer   = drawerRef.current
    if (!backdrop || !drawer) return

    if (mobileOpen) {
      gsap.set(backdrop, { display: 'block', opacity: 0 })
      gsap.set(drawer,   { x: '-100%' })
      gsap.to(backdrop, { opacity: 1, duration: 0.4, ease: 'power2.out' })
      gsap.to(drawer,   { x: '0%',  duration: 0.4, ease: 'expo.out' })
    } else {
      gsap.to(backdrop, { opacity: 0, duration: 0.3, onComplete: () => { gsap.set(backdrop, { display: 'none' }) } })
      gsap.to(drawer,   { x: '-100%', duration: 0.3, ease: 'expo.in' })
    }
  }, [mobileOpen])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) =>
    href === '/superadmin/dashboard' ? pathname === href : pathname.startsWith(href)

  // ── Shared inner content ─────────────────────────────────
  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full bg-zinc-950/40 backdrop-blur-2xl border-r border-white/5 shadow-[2px_0_16px_rgba(0,0,0,0.5)]">
      
      {/* Logo Area */}
      <div className="flex items-center justify-between h-20 px-6 flex-shrink-0">
        <Link href="/superadmin/dashboard" className="flex items-center gap-3.5 min-w-0 group">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center shadow-md shadow-black/40 group-hover:scale-105 group-hover:shadow-white/5 transition-all duration-300">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
            </svg>
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <span className="text-[16px] font-semibold text-white tracking-tight leading-none block">
              MotoFix
            </span>
            <span className="text-[10px] text-zinc-500 font-medium tracking-wide block mt-1">
              Superadmin
            </span>
          </div>
        </Link>

        {mobile && (
          <button
            onClick={onMobileClose}
            className="p-1.5 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 pt-2 pb-6 space-y-7 scrollbar-none">
        {NAV.map((group) => (
          <div key={group.seccion}>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {group.seccion}
            </p>
            <ul className="space-y-1">
              {group.items.map(({ href, label, Icon }) => {
                const active = isActive(href)
                return (
                  <li key={href} className="sa-nav-item">
                    <Link
                      href={href}
                      onClick={mobile ? onMobileClose : undefined}
                      className={`
                        relative flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[13.5px] font-medium
                        transition-all duration-300 ease-out overflow-hidden group
                        ${active
                          ? 'text-white bg-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.1)]'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 active:scale-[0.98]'}
                      `}
                    >
                      <Icon className={`flex-shrink-0 transition-transform duration-300 ${active ? 'text-white' : 'text-zinc-500 group-hover:scale-110'} w-[18px] h-[18px]`} />
                      <span className="truncate">{label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="flex-shrink-0 px-4 py-5 border-t border-white/5 bg-gradient-to-b from-transparent to-black/20">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors cursor-pointer group">
          <Avatar name={user.full_name} />
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="text-[13px] font-medium text-white truncate leading-tight group-hover:opacity-90 transition-opacity">{user.full_name}</p>
            <p className="text-[11px] text-zinc-500 truncate mt-0.5">{user.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl text-[13px] text-zinc-500 hover:text-white hover:bg-red-500/20 active:scale-[0.98] transition-all duration-300 font-medium px-3 py-2.5 group"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 transition-transform group-hover:-translate-x-1" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div
        ref={backdropRef}
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-md lg:hidden"
        style={{ display: 'none' }}
        onClick={onMobileClose}
      />

      <div
        ref={drawerRef}
        className="fixed top-0 left-0 z-[70] h-full w-[260px] lg:hidden"
        style={{ transform: 'translateX(-100%)' }}
      >
        <SidebarContent mobile />
      </div>

      <aside className="hidden lg:flex flex-col flex-shrink-0 relative z-20 w-[260px]">
        <SidebarContent />
      </aside>
    </>
  )
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-t from-zinc-700 to-zinc-600 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-sm">
      <span className="text-xs font-semibold text-white drop-shadow-md">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}
