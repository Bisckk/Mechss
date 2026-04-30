'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { gsap } from 'gsap'
import {
    LayoutDashboard, CalendarRange, UsersRound, Package,
    UserCog, Laptop, Settings, LogOut, X, Wrench
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export type SidebarUser = {
    full_name: string
    email: string
    avatar_url: string | null
    role: string
}

interface Props {
    mobileOpen: boolean
    onMobileClose: () => void
    user: SidebarUser
}

type NavItem = { href: string; label: string; mechLabel?: string; Icon: React.ElementType; roles: string[] }
type NavSection = { seccion: string; items: NavItem[] }

const ALL_NAV: NavSection[] = [
    {
        seccion: 'Operaciones',
        items: [
            { href: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard, roles: ['admin', 'receptionist'] },
            { href: '/admin/agenda', label: 'Agenda & Citas', Icon: CalendarRange, roles: ['admin', 'receptionist'] },
            { href: '/admin/taller', label: 'Taller Activo', mechLabel: 'Mis Órdenes', Icon: Wrench, roles: ['admin', 'receptionist', 'mechanic'] },
        ],
    },
    {
        seccion: 'Gestión',
        items: [
            { href: '/admin/clientes', label: 'Clientes', Icon: UsersRound, roles: ['admin', 'receptionist'] },
            { href: '/admin/inventario', label: 'Inventario', Icon: Package, roles: ['admin', 'receptionist'] },
            { href: '/admin/empleados', label: 'Empleados', Icon: UserCog, roles: ['admin'] },
        ],
    },
    {
        seccion: 'Herramientas',
        items: [
            { href: '/admin/builder', label: 'Landing Page', Icon: Laptop, roles: ['admin'] },
            { href: '/admin/configuracion', label: 'Configuración', Icon: Settings, roles: ['admin'] },
        ],
    },
]

const ROLE_COLORS: Record<string, string> = {
    admin: 'from-orange-600 to-orange-500 border-orange-400/30',
    receptionist: 'from-blue-600 to-blue-500 border-blue-400/30',
    mechanic: 'from-emerald-600 to-emerald-500 border-emerald-400/30',
}

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    receptionist: 'Recepcionista',
    mechanic: 'Mecánico',
}

export default function Sidebar({ mobileOpen, onMobileClose, user }: Props) {
    const pathname = usePathname()
    const router = useRouter()
    const backdropRef = useRef<HTMLDivElement>(null)
    const drawerRef = useRef<HTMLDivElement>(null)
    const didAnimate = useRef(false)

    const filteredNav = ALL_NAV.map(group => ({
        ...group,
        items: group.items
            .filter(item => item.roles.includes(user.role))
            .map(item => ({
                ...item,
                label: (item.mechLabel && user.role === 'mechanic') ? item.mechLabel : item.label,
            })),
    })).filter(group => group.items.length > 0)

    useEffect(() => {
        if (didAnimate.current) return
        didAnimate.current = true
        gsap.fromTo(
            '.admin-nav-item',
            { opacity: 0, x: -8, scale: 0.98 },
            { opacity: 1, x: 0, scale: 1, duration: 0.4, stagger: 0.03, ease: 'expo.out', force3D: true, delay: 0.08 }
        )
    }, [])

    useEffect(() => {
        const backdrop = backdropRef.current
        const drawer = drawerRef.current
        if (!backdrop || !drawer) return

        if (mobileOpen) {
            gsap.set(backdrop, { display: 'block', opacity: 0 })
            gsap.set(drawer, { x: '-100%' })
            gsap.to(backdrop, { opacity: 1, duration: 0.3, ease: 'expo.out', force3D: true })
            gsap.to(drawer, { x: '0%', duration: 0.35, ease: 'expo.out', force3D: true })
        } else {
            gsap.to(backdrop, { opacity: 0, duration: 0.22, ease: 'expo.in', onComplete: () => { gsap.set(backdrop, { display: 'none' }) } })
            gsap.to(drawer, { x: '-100%', duration: 0.25, ease: 'expo.in', force3D: true })
        }
    }, [mobileOpen])

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const isActive = (href: string) =>
        href === '/admin/dashboard' ? pathname === href : pathname.startsWith(href)

    const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
        <div className="flex flex-col h-full bg-zinc-950/40 backdrop-blur-2xl border-r border-white/5 shadow-[2px_0_16px_rgba(0,0,0,0.5)]">

            {/* Logo Area */}
            <div className="flex items-center justify-between h-20 px-6 flex-shrink-0">
                <Link href="/admin/taller" className="flex items-center gap-3.5 min-w-0 group">
                    <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-orange-600 to-orange-400 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 group-hover:shadow-orange-500/40 transition-all duration-300">
                        <Wrench className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0 flex flex-col justify-center">
                        <span className="text-[16px] font-semibold text-white tracking-tight leading-none block">
                            {user.role === 'mechanic' ? 'Mi Panel' : 'Taller Admin'}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium tracking-wide block mt-1 uppercase">
                            MotoFix Platform
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
                {filteredNav.map((group) => (
                    <div key={group.seccion}>
                        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                            {group.seccion}
                        </p>
                        <ul className="space-y-1">
                            {group.items.map(({ href, label, Icon }) => {
                                const active = isActive(href)
                                return (
                                    <li key={href} className="admin-nav-item">
                                        <Link
                                            href={href}
                                            onClick={mobile ? onMobileClose : undefined}
                                            className={`
                        relative flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[13.5px] font-medium
                        transition-all duration-300 ease-out overflow-hidden group
                        ${active
                                                    ? 'text-white bg-orange-500/10 shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-orange-500/20'
                                                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 active:scale-[0.98] border border-transparent'}
                      `}
                                        >
                                            {active && (
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orange-500 rounded-r-full" />
                                            )}
                                            <Icon className={`flex-shrink-0 transition-transform duration-300 ${active ? 'text-orange-400' : 'text-zinc-500 group-hover:scale-110'} w-[18px] h-[18px]`} />
                                            <span className="truncate">{label}</span>
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* Mechanic role badge */}
            {user.role === 'mechanic' && (
                <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[11px] text-emerald-400/80 font-medium">Vista de Mecánico</p>
                </div>
            )}

            {/* User footer */}
            <div className="flex-shrink-0 px-4 py-5 border-t border-white/5 bg-gradient-to-b from-transparent to-black/20">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors cursor-pointer group">
                    <Avatar name={user.full_name} role={user.role} />
                    <div className="overflow-hidden min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-white truncate leading-tight group-hover:opacity-90 transition-opacity">{user.full_name}</p>
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">{ROLE_LABELS[user.role] ?? user.role}</p>
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
            {/* Mobile backdrop */}
            <div
                ref={backdropRef}
                className="fixed inset-0 z-[160] bg-black/40 backdrop-blur-md lg:hidden"
                style={{ display: 'none' }}
                onClick={onMobileClose}
            />

            {/* Mobile drawer */}
            <div
                ref={drawerRef}
                className="fixed top-0 left-0 z-[170] h-full w-[260px] lg:hidden"
                style={{ transform: 'translateX(-100%)' }}
            >
                <SidebarContent mobile />
            </div>

            {/* Desktop sidebar */}
            <aside className="hidden lg:flex flex-col flex-shrink-0 relative z-20 w-[260px]">
                <SidebarContent />
            </aside>
        </>
    )
}

function Avatar({ name, role }: { name: string; role: string }) {
    const colors = ROLE_COLORS[role] ?? ROLE_COLORS.admin
    return (
        <div className={`w-8 h-8 rounded-full bg-gradient-to-t ${colors} border flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <span className="text-xs font-bold text-white drop-shadow-md">
                {name.charAt(0).toUpperCase()}
            </span>
        </div>
    )
}
