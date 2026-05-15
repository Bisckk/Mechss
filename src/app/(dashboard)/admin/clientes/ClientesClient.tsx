'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { Plus, Search, UsersRound, CalendarIcon, Car, MoreVertical, Mail, Phone, ChevronRight, Eye, Pencil, Power, Loader2 } from 'lucide-react'
import { gsap } from 'gsap'
import ClientDetailsDrawer from '@/components/admin/clientes/ClientDetailsDrawer'
import NewClientDrawer from '@/components/admin/clientes/NewClientDrawer'
import EditClientModal from '@/components/admin/clientes/EditClientModal'
import { toggleClientStatusAction } from '@/lib/actions/admin'

// Define the client type inline based on the Supabase schema
type DbClient = {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    address?: string | null;
    notes?: string | null;
    created_at: string;
    is_active: boolean;
}

type ClientWithCounts = DbClient & {
    vehicles_count: number
    appointments_count: number
}

interface ClientesClientProps {
    initialClients: ClientWithCounts[]
}

export default function ClientesClient({ initialClients }: ClientesClientProps) {
    const [clients, setClients] = useState<ClientWithCounts[]>(initialClients)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeMenu, setActiveMenu] = useState<string | null>(null)
    const [detailsClient, setDetailsClient] = useState<DbClient | null>(null)
    const [newClientOpen, setNewClientOpen] = useState(false)
    const [editClient, setEditClient] = useState<DbClient | null>(null)
    const [toggling, setToggling] = useState<string | null>(null)
    const [, startTransition] = useTransition()
    const menuRef = useRef<HTMLDivElement>(null)

    const filteredClients = clients.filter(c =>
        c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleToggleStatus = (client: ClientWithCounts) => {
        setActiveMenu(null)
        setToggling(client.id)
        startTransition(async () => {
            const res = await toggleClientStatusAction(client.id, !client.is_active)
            if (res.ok) {
                setClients(prev => prev.map(c =>
                    c.id === client.id ? { ...c, is_active: !client.is_active } : c
                ))
            }
            setToggling(null)
        })
    }

    // Entrance animation on mount
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.clientes-header',
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.35, ease: 'expo.out', force3D: true }
            )
            gsap.fromTo('.client-card',
                { opacity: 0, y: 18, scale: 0.97 },
                { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.05, ease: 'expo.out', force3D: true, delay: 0.08 }
            )
        })
        return () => ctx.revert()
    }, [])

    // Close options menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenu(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="clientes-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Clientes</h1>
                    <p className="text-zinc-400 text-sm mt-1">Administra los {clients.length} clientes registrados en tu taller.</p>
                </div>
                <button
                    onClick={() => setNewClientOpen(true)}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-orange-500/20 active:scale-95 group"
                >
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Nuevo Cliente
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-zinc-900 border border-white/5 rounded-xl p-3 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 group">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-orange-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email o teléfono..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-600"
                    />
                </div>
            </div>

            {/* Client List */}
            {filteredClients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" ref={menuRef}>
                    {filteredClients.map((client) => {
                        const colors = ['orange', 'blue', 'emerald', 'violet', 'rose', 'cyan'];
                        const color = colors[client.full_name.charCodeAt(0) % colors.length];

                        return (
                            <div
                                key={client.id}
                                onClick={() => setDetailsClient(client)}
                                className={`client-card cursor-pointer bg-zinc-900/80 backdrop-blur-sm border border-white/5 hover:border-orange-500/40 rounded-2xl p-5 transition-[border-color,box-shadow,background-color] duration-200 group flex flex-col hover:shadow-[0_0_30px_rgba(249,115,22,0.1)] relative overflow-hidden ${!client.is_active ? 'opacity-60 saturate-50 hover:opacity-100 transition-opacity' : ''}`}
                            >
                                {/* Background glow effect on hover */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/0 rounded-full blur-3xl group-hover:bg-orange-500/5 transition-colors pointer-events-none"></div>

                                {/* Options Menu Toggle */}
                                <div className="absolute top-3 right-3 z-10">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === client.id ? null : client.id); }}
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {/* Dropdown Popover */}
                                    {activeMenu === client.id && (
                                        <div className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 z-50">
                                            <button className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-sm text-white transition-colors text-left"
                                                onClick={(e) => { e.stopPropagation(); setActiveMenu(null); setDetailsClient(client); }}
                                            >
                                                <Eye className="w-4 h-4 text-zinc-400" /> Ver Detalles
                                            </button>
                                            <button className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-sm text-white transition-colors text-left"
                                                onClick={(e) => { e.stopPropagation(); setActiveMenu(null); setEditClient(client); }}
                                            >
                                                <Pencil className="w-4 h-4 text-zinc-400" /> Editar Cliente
                                            </button>
                                            <div className="h-px bg-white/5 my-1.5"></div>
                                            <button
                                                className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors text-left ${client.is_active ? 'hover:bg-rose-500/10 text-rose-400' : 'hover:bg-emerald-500/10 text-emerald-400'}`}
                                                onClick={(e) => { e.stopPropagation(); handleToggleStatus(client); }}
                                                disabled={toggling === client.id}
                                            >
                                                {toggling === client.id
                                                    ? <Loader2 className="w-4 h-4 animate-spin opacity-60" />
                                                    : <Power className="w-4 h-4 opacity-80" />
                                                }
                                                {client.is_active ? 'Inactivar' : 'Activar'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 mb-5 relative z-10">
                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${Object.fromEntries([
                                        ['orange', 'from-orange-500/30 to-amber-600/20 text-orange-400'],
                                        ['blue', 'from-blue-500/30 to-indigo-600/20 text-blue-400'],
                                        ['emerald', 'from-emerald-500/30 to-teal-600/20 text-emerald-400'],
                                        ['violet', 'from-violet-500/30 to-purple-600/20 text-violet-400'],
                                        ['rose', 'from-rose-500/30 to-pink-600/20 text-rose-400'],
                                        ['cyan', 'from-cyan-500/30 to-sky-600/20 text-cyan-400']
                                    ])[color]} flex items-center justify-center text-lg font-black shrink-0 shadow-inner border border-white/5`}>
                                        {client.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-8">
                                        <h3 className="text-base font-bold text-white truncate transition-colors flex items-center gap-2">
                                            {client.full_name}
                                            {!client.is_active && <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Inactivo</span>}
                                        </h3>
                                        <p className="text-xs text-zinc-500 mt-0.5">Registrado el {new Date(client.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                </div>

                                <div className="space-y-2.5 mb-5 flex-1 pl-1">
                                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                                        <div className="w-5 flex justify-center"><Phone className="w-4 h-4 text-zinc-500" /></div>
                                        <span className="truncate">{client.phone || <span className="text-zinc-600 italic">Sin teléfono</span>}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                                        <div className="w-5 flex justify-center"><Mail className="w-4 h-4 text-zinc-500" /></div>
                                        <span className="truncate">{client.email || <span className="text-zinc-600 italic">Sin correo</span>}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between mt-auto gap-3 relative z-10">
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-md border border-blue-500/20">
                                            <Car className="w-3.5 h-3.5" />
                                            {client.vehicles_count}
                                        </div>
                                        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20">
                                            <CalendarIcon className="w-3.5 h-3.5" />
                                            {client.appointments_count}
                                        </div>
                                    </div>

                                    <div className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold text-orange-500 bg-orange-500/10 px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                                        <span>Entrar al Perfil</span>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md min-h-[400px] flex items-center justify-center animate-in fade-in">
                    <div className="text-center flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-zinc-800/80 border border-white/5 flex items-center justify-center mb-4">
                            <UsersRound className="w-7 h-7 text-zinc-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">
                            {searchQuery ? 'No hay resultados' : 'Aún no hay clientes'}
                        </h3>
                        <p className="text-sm text-zinc-400 max-w-sm mb-6">
                            {searchQuery
                                ? `No se encontró ningún cliente que coincida con "${searchQuery}".`
                                : 'Comienza registrando a tu primer cliente para empezar a gestionar su historial y vehículos.'}
                        </p>
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-orange-400 text-sm font-semibold hover:text-orange-300">
                                Borrar búsqueda
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* View Details Drawer */}
            <ClientDetailsDrawer
                isOpen={detailsClient !== null}
                onClose={() => setDetailsClient(null)}
                client={detailsClient}
            />

            {/* New Client Drawer */}
            <NewClientDrawer
                isOpen={newClientOpen}
                onClose={() => setNewClientOpen(false)}
                onCreated={(newClient) => {
                    setClients(prev => [newClient, ...prev])
                    setNewClientOpen(false)
                }}
            />

            {/* Edit Client Modal */}
            <EditClientModal
                isOpen={editClient !== null}
                client={editClient}
                onClose={() => setEditClient(null)}
                onUpdated={(updated) => {
                    setClients(prev => prev.map(c =>
                        c.id === updated.id
                            ? { ...c, full_name: updated.full_name, phone: updated.phone, email: updated.email }
                            : c
                    ))
                    setEditClient(null)
                }}
            />
        </div>
    )
}
