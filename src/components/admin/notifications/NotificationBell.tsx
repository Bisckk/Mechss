'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Bell, X, CheckCheck, Wrench, Clock, User,
    Package, Calendar, ChevronDown, Loader2
} from 'lucide-react'
import {
    getNotificationsAction,
    markNotificationsReadAction,
    getUnreadCountAction,
} from '@/lib/actions/notifications'
import type { NotificationGroup, NotificationType, NotificationItem } from '@/lib/actions/notifications'

// ── Config ─────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, {
    Icon:    React.ElementType
    label:   string
    color:   string
    bg:      string
    border:  string
    dot:     string
}> = {
    repair_created:      { Icon: Wrench,   label: 'Servicios creados',      color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    dot: 'bg-blue-400' },
    pending_completion:  { Icon: Clock,    label: 'Listos para aprobar',    color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  dot: 'bg-orange-400' },
    client_created:      { Icon: User,     label: 'Clientes registrados',   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
    inventory_created:   { Icon: Package,  label: 'Productos en inventario',color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  dot: 'bg-purple-400' },
    appointment_created: { Icon: Calendar, label: 'Citas programadas',      color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   dot: 'bg-amber-400' },
}

function formatGroupDate(dateStr: string): string {
    const date     = new Date(dateStr + 'T00:00:00')
    const today    = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString())     return 'Hoy'
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer'
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

function formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function getItemDescription(type: NotificationType, metadata: Record<string, any>): string {
    switch (type) {
        case 'repair_created':
            return [
                metadata.tracking_code ? `#${metadata.tracking_code}` : null,
                [metadata.vehicle_brand, metadata.vehicle_model].filter(Boolean).join(' ') || null,
                metadata.vehicle_plate ? `· ${metadata.vehicle_plate}` : null,
            ].filter(Boolean).join(' ') || 'Servicio registrado'

        case 'pending_completion':
            return [
                metadata.tracking_code ? `#${metadata.tracking_code}` : null,
                [metadata.vehicle_brand, metadata.vehicle_model].filter(Boolean).join(' ') || null,
                '· Solicitó completar',
            ].filter(Boolean).join(' ')

        case 'client_created':
            return metadata.client_name || 'Cliente registrado'

        case 'inventory_created':
            return metadata.name
                ? `${metadata.name}${metadata.category ? ` · ${metadata.category}` : ''}`
                : 'Producto registrado'

        case 'appointment_created':
            return metadata.client_name || 'Cita programada'

        default:
            return 'Actualización'
    }
}

// ── Subcomponents ──────────────────────────────────────────

function GroupCard({ group, isExpanded, onToggle }: {
    group: NotificationGroup
    isExpanded: boolean
    onToggle: () => void
}) {
    const cfg = TYPE_CONFIG[group.type] ?? TYPE_CONFIG.repair_created
    const { Icon } = cfg
    const hasUnread = group.unread > 0

    return (
        <div className={`rounded-xl overflow-hidden border transition-colors ${hasUnread ? 'border-white/8 bg-white/[0.02]' : 'border-transparent'}`}>
            {/* Group header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 transition-colors text-left"
            >
                <div className={`w-9 h-9 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white">{cfg.label}</p>
                        {hasUnread && (
                            <span className="text-[10px] font-black text-orange-400 bg-orange-500/15 border border-orange-500/20 px-1.5 py-0.5 rounded-full leading-none shrink-0">
                                {group.unread} nuevo{group.unread !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-zinc-600">
                            {group.count} {group.count === 1 ? 'evento' : 'eventos'}
                        </span>
                        <span className="text-zinc-800">·</span>
                        <span className="text-xs text-zinc-600">{formatGroupDate(group.date)}</span>
                    </div>
                </div>

                <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {/* Expanded items */}
            {isExpanded && (
                <div className="border-t border-white/5 divide-y divide-white/5">
                    {group.items.map(item => (
                        <ItemRow key={item.id} item={item} dotColor={cfg.dot} />
                    ))}
                </div>
            )}
        </div>
    )
}

function ItemRow({ item, dotColor }: { item: NotificationItem; dotColor: string }) {
    return (
        <div className={`flex items-center gap-3 px-4 py-2.5 ${!item.is_read ? 'bg-white/[0.02]' : ''}`}>
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${!item.is_read ? dotColor : 'bg-transparent'}`} />
            <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-300 truncate">
                    {getItemDescription(item.type, item.metadata)}
                </p>
                {item.actor_name && (
                    <p className="text-[10px] text-zinc-600 mt-0.5">{item.actor_name}</p>
                )}
            </div>
            <span className="text-[10px] text-zinc-700 shrink-0 whitespace-nowrap tabular-nums">
                {formatTime(item.created_at)}
            </span>
        </div>
    )
}

// ── Main Component ─────────────────────────────────────────

export default function NotificationBell() {
    const [open, setOpen]             = useState(false)
    const [groups, setGroups]         = useState<NotificationGroup[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading]       = useState(false)
    const [expanded, setExpanded]     = useState<Set<string>>(new Set())
    const panelRef                    = useRef<HTMLDivElement>(null)
    const fetchedRef                  = useRef(false)

    // Unread badge on mount
    useEffect(() => {
        getUnreadCountAction().then(res => {
            if (res.ok) setUnreadCount(res.data)
        })
    }, [])

    // Load full data when panel opens (once per session unless forced)
    useEffect(() => {
        if (!open) return
        if (fetchedRef.current) return
        fetchedRef.current = true
        setLoading(true)
        getNotificationsAction().then(res => {
            if (res.ok) {
                setGroups(res.data)
                const total = res.data.reduce((s, g) => s + g.unread, 0)
                setUnreadCount(total)
            }
            setLoading(false)
        })
    }, [open])

    // Close on outside click
    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    const toggleExpand = (key: string) => {
        setExpanded(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const marcarTodoLeido = async () => {
        await markNotificationsReadAction()
        setGroups(prev => prev.map(g => ({
            ...g,
            unread: 0,
            items:  g.items.map(i => ({ ...i, is_read: true })),
        })))
        setUnreadCount(0)
    }

    const handleOpen = () => {
        setOpen(v => !v)
        // Force a fresh fetch next time if there were unread items
        if (!open) fetchedRef.current = false
    }

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={handleOpen}
                className={`relative p-2 transition-colors rounded-lg focus:outline-none ${
                    open
                        ? 'text-white bg-zinc-800'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                aria-label="Notificaciones"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-orange-500 rounded-full flex items-center justify-center text-[9px] font-black text-white px-0.5 leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Panel */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-1rem)] bg-zinc-950 border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] z-[200] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                            <Bell className="w-4 h-4 text-zinc-500" />
                            <h3 className="text-sm font-black text-white">Notificaciones</h3>
                            {unreadCount > 0 && (
                                <span className="text-[10px] font-black text-orange-400 bg-orange-500/15 border border-orange-500/20 px-1.5 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={marcarTodoLeido}
                                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-emerald-400 px-2 py-1 rounded-lg hover:bg-emerald-500/10 transition-all"
                                >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    Marcar leído
                                </button>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1.5 text-zinc-600 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="max-h-[72vh] overflow-y-auto overscroll-contain">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cargando...
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 text-center px-4">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-3">
                                    <Bell className="w-6 h-6 text-zinc-700" />
                                </div>
                                <p className="text-sm font-semibold text-zinc-500">Sin notificaciones</p>
                                <p className="text-xs text-zinc-700 mt-1 max-w-[200px]">
                                    Las actualizaciones del taller aparecerán aquí
                                </p>
                            </div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {groups.map(group => {
                                    const key = `${group.type}::${group.date}`
                                    return (
                                        <GroupCard
                                            key={key}
                                            group={group}
                                            isExpanded={expanded.has(key)}
                                            onToggle={() => toggleExpand(key)}
                                        />
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {!loading && groups.length > 0 && (
                        <div className="border-t border-white/5 px-4 py-2.5">
                            <p className="text-[10px] text-zinc-700 text-center">
                                Mostrando últimas 300 notificaciones
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
