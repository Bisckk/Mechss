'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { gsap } from 'gsap'
import {
  LayoutDashboard, Building2, CreditCard, BarChart3,
  Users, ChevronLeft, ChevronRight, LogOut, X,
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
  collapsed:        boolean
  onToggleCollapse: () => void
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

export default function Sidebar({
  mobileOpen, onMobileClose, collapsed, onToggleCollapse, user,
}: Props) {
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
      { opacity: 0, x: -14 },
      { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.15 }
    )
  }, [])

  // Mobile drawer animation — only affects the mobile drawer element
  useEffect(() => {
    const backdrop = backdropRef.current
    const drawer   = drawerRef.current
    if (!backdrop || !drawer) return

    if (mobileOpen) {
      gsap.set(backdrop, { display: 'block', opacity: 0 })
      gsap.set(drawer,   { x: '-100%' })
      gsap.to(backdrop, { opacity: 1, duration: 0.25 })
      gsap.to(drawer,   { x: '0%',  duration: 0.3, ease: 'power3.out' })
    } else {
      gsap.to(backdrop, { opacity: 0, duration: 0.2, onComplete: () => { gsap.set(backdrop, { display: 'none' }) } })
      gsap.to(drawer,   { x: '-100%', duration: 0.25, ease: 'power3.in' })
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
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Logo */}
      <div className={`flex items-center h-16 flex-shrink-0 ${collapsed && !mobile ? 'justify-center' : 'justify-between px-5'}`}>
        {(!collapsed || mobile) && (
          <Link href="/superadmin/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/25 flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <span className="text-[15px] font-black text-white tracking-tight leading-none block">
                Moto<span className="text-orange-500">Fix</span>
              </span>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em] block mt-0.5">
                Superadmin
              </span>
            </div>
          </Link>
        )}

        {/* Collapsed: show only icon */}
        {collapsed && !mobile && (
          <Link href="/superadmin/dashboard" title="Panel de Control">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25 transition-transform hover:scale-105">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
              </svg>
            </div>
          </Link>
        )}

        <div className="flex items-center">
          {/* Mobile close */}
          {mobile && (
            <button
              onClick={onMobileClose}
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 mb-2">
         <div className="h-px w-full bg-gradient-to-r from-zinc-800/0 via-zinc-800 to-zinc-800/0" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto pt-2 pb-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
        {NAV.map((group) => (
          <div key={group.seccion} className="px-3">
            {(!collapsed || mobile) && (
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                {group.seccion}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map(({ href, label, Icon }) => {
                const active = isActive(href)
                return (
                  <li key={href} className="sa-nav-item">
                    <Link
                      href={href}
                      onClick={mobile ? onMobileClose : undefined}
                      title={collapsed && !mobile ? label : undefined}
                      className={`
                        flex items-center gap-3 rounded-xl text-sm font-medium
                        transition-all duration-200 group relative overflow-hidden
                        ${collapsed && !mobile
                          ? 'justify-center w-11 h-11 mx-auto'
                          : 'px-3 py-2.5 w-full'}
                        ${active
                          ? 'text-white bg-zinc-800/80 shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'}
                      `}
                    >
                      {active && (
                         <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-orange-500 rounded-r-full" />
                      )}
                      <Icon className={`flex-shrink-0 transition-colors ${active ? 'text-orange-500' : 'text-zinc-500 group-hover:text-zinc-300'} ${collapsed && !mobile ? 'w-[22px] h-[22px]' : 'w-[18px] h-[18px]'}`} />
                      {(!collapsed || mobile) && (
                        <span className="truncate">{label}</span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className={`flex-shrink-0 py-4 border-t border-zinc-800 bg-zinc-950/20 space-y-2 ${collapsed && !mobile ? 'px-2' : 'px-4'}`}>
        {(!collapsed || mobile) ? (
          <div className="flex items-center gap-3 p-2 rounded-xl border border-zinc-800/60 bg-zinc-900/50">
            <Avatar name={user.full_name} />
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="text-[13px] font-bold text-white truncate leading-tight">{user.full_name}</p>
              <p className="text-[11px] text-zinc-500 truncate mt-0.5">{user.email}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center pb-2">
            <Avatar name={user.full_name} title={user.full_name} />
          </div>
        )}

        <button
          onClick={handleLogout}
          title={collapsed && !mobile ? 'Cerrar sesión' : undefined}
          className={`w-full flex items-center gap-2.5 rounded-xl text-[13px] text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 font-semibold group
            ${collapsed && !mobile ? 'justify-center w-11 h-11 mx-auto' : 'px-3 py-2.5'}`}
        >
          <LogOut className={`flex-shrink-0 transition-transform group-hover:-translate-x-0.5 ${collapsed && !mobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
          {(!collapsed || mobile) && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Mobile backdrop ──────────────────────────── */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
        style={{ display: 'none' }}
        onClick={onMobileClose}
      />

      {/* ── Mobile drawer ────────────────────────────── */}
      <div
        ref={drawerRef}
        className="
          fixed top-0 left-0 z-[70] h-full w-[280px]
          bg-zinc-900 border-r border-zinc-800 shadow-2xl
          lg:hidden
        "
        style={{ transform: 'translateX(-100%)' }}
      >
        <SidebarContent mobile />
      </div>

      {/* ── Desktop sidebar ──────────────────────────── */}
      <aside
        className={`
          hidden lg:flex flex-col flex-shrink-0 relative z-20
          bg-zinc-900 border-r border-zinc-800
          transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)]
          ${collapsed ? 'w-20' : 'w-[260px]'}
        `}
      >
        <SidebarContent />

        {/* Elegant Floating Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3.5 top-6 w-7 h-7 bg-zinc-800 border-2 border-zinc-900 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-orange-500 hover:border-orange-500 transition-all shadow-md cursor-pointer z-[100] group"
          title={collapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4 translate-x-0.5 group-hover:translate-x-0 transition-transform" />
            : <ChevronLeft  className="w-4 h-4 -translate-x-0.5 group-hover:translate-x-0 transition-transform" />
          }
        </button>
      </aside>
    </>
  )
}

function Avatar({ name, title }: { name: string; title?: string }) {
  return (
    <div
      title={title}
      className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0"
    >
      <span className="text-xs font-bold text-orange-400">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}
