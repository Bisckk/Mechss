'use client'

import { useState, useEffect, useRef } from 'react'
import {
    X, Clock, Wrench, Eye, EyeOff, Printer, ZoomIn,
    User, Phone, DollarSign, AlertCircle
} from 'lucide-react'
import { gsap } from 'gsap'
import { getRepairDetailAction, getRepairUpdatesAction } from '@/lib/actions/admin'

type RepairDetail = {
    id: string
    tracking_code: string
    status: string
    reported_issue: string
    created_at: string
    completed_at: string | null
    estimated_cost: number | null
    final_cost: number | null
    vehicle_brand: string | null
    vehicle_model: string | null
    vehicle_year: number | null
    vehicle_plate: string | null
    clients: { full_name: string; phone: string | null; email: string | null } | null
    mechanic: { full_name: string } | null
}

type Update = {
    id: string
    status: string
    notes: string | null
    photos: string[]
    is_client_visible: boolean
    created_at: string
    author: { full_name: string } | null
}

interface Props {
    isOpen: boolean
    onClose: () => void
    repairId: string | null
}

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
    received:      { label: 'Recibido',           color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
    in_progress:   { label: 'En Diagnóstico',      color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
    repairing:     { label: 'En Reparación',       color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    waiting_parts: { label: 'Esperando Repuestos', color: 'text-rose-400',   bg: 'bg-rose-500/10 border-rose-500/20' },
    completed:     { label: 'Completado',          color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/20' },
    delivered:     { label: 'Entregado',           color: 'text-zinc-400',   bg: 'bg-zinc-500/10 border-zinc-500/20' },
    cancelled:     { label: 'Cancelado',           color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
}

function fmtCOP(n: number) {
    return `$ ${new Intl.NumberFormat('es-CO').format(n)} COP`
}

function getDuration(from: string, to: string | null) {
    const ms = (to ? new Date(to) : new Date()).getTime() - new Date(from).getTime()
    const days = Math.floor(ms / 86_400_000)
    if (days === 0) return 'Menos de 1 día'
    return `${days} ${days === 1 ? 'día' : 'días'}`
}

export default function RepairDetailDrawer({ isOpen, onClose, repairId }: Props) {
    const [detail, setDetail]     = useState<RepairDetail | null>(null)
    const [updates, setUpdates]   = useState<Update[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [lightbox, setLightbox] = useState<string | null>(null)

    const backdropRef = useRef<HTMLDivElement>(null)
    const modalRef    = useRef<HTMLDivElement>(null)

    // Modal animation
    useEffect(() => {
        const backdrop = backdropRef.current
        const modal    = modalRef.current
        if (!backdrop || !modal) return

        if (isOpen) {
            gsap.set(backdrop, { display: 'flex', opacity: 0 })
            gsap.set(modal, { y: 32, opacity: 0, scale: 0.97 })
            gsap.to(backdrop, { opacity: 1, duration: 0.25, ease: 'expo.out' })
            gsap.to(modal, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'expo.out', force3D: true })
        } else {
            gsap.to(modal, { y: 20, opacity: 0, scale: 0.97, duration: 0.2, ease: 'expo.in' })
            gsap.to(backdrop, { opacity: 0, duration: 0.22, ease: 'expo.in', onComplete: () => { gsap.set(backdrop, { display: 'none' }) } })
        }
    }, [isOpen])

    // Load data when repairId changes
    useEffect(() => {
        if (!isOpen || !repairId) return
        setDetail(null)
        setUpdates([])
        setIsLoading(true)
        Promise.all([
            getRepairDetailAction(repairId),
            getRepairUpdatesAction(repairId),
        ]).then(([dr, ur]) => {
            if (dr.ok) setDetail(dr.data as RepairDetail)
            if (ur.ok) setUpdates(ur.data as Update[])
            setIsLoading(false)
        })
    }, [isOpen, repairId])

    // Animate timeline entries
    useEffect(() => {
        if (!isLoading && updates.length > 0) {
            gsap.fromTo(
                '.detail-entry',
                { opacity: 0, x: 12 },
                { opacity: 1, x: 0, duration: 0.35, stagger: 0.05, ease: 'expo.out', force3D: true }
            )
        }
    }, [isLoading])

    const sc = detail ? (STATUS[detail.status] ?? { label: detail.status, color: 'text-zinc-400', bg: 'bg-zinc-800 border-zinc-700' }) : null

    return (
        <>
            {/* Print styles */}
            <style>{`
                @media print {
                    body > *:not(#rdp-print) { display: none !important; }
                    #rdp-print {
                        display: block !important;
                        position: fixed; inset: 0; z-index: 99999;
                        background: white; color: black;
                        padding: 32px; font-family: sans-serif;
                        overflow-y: auto;
                    }
                }
                @media screen { #rdp-print { display: none; } }
            `}</style>

            {/* Print layout */}
            {detail && (
                <div id="rdp-print" className="text-black">
                    <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Reparación #{detail.tracking_code}</h1>
                    <p style={{ color: '#555', marginBottom: 16 }}>{detail.vehicle_brand} {detail.vehicle_model} {detail.vehicle_year}{detail.vehicle_plate ? ` · ${detail.vehicle_plate}` : ''}</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 13 }}>
                        <tbody>
                            <tr><td style={{ padding: '4px 8px', fontWeight: 600 }}>Cliente</td><td>{detail.clients?.full_name ?? '—'}</td></tr>
                            <tr><td style={{ padding: '4px 8px', fontWeight: 600 }}>Mecánico</td><td>{detail.mechanic?.full_name ?? 'Sin asignar'}</td></tr>
                            <tr><td style={{ padding: '4px 8px', fontWeight: 600 }}>Estado</td><td>{sc?.label}</td></tr>
                            <tr><td style={{ padding: '4px 8px', fontWeight: 600 }}>Duración</td><td>{getDuration(detail.created_at, detail.completed_at)}</td></tr>
                            {detail.estimated_cost && <tr><td style={{ padding: '4px 8px', fontWeight: 600 }}>Estimado</td><td>{fmtCOP(detail.estimated_cost)}</td></tr>}
                            {detail.final_cost && <tr><td style={{ padding: '4px 8px', fontWeight: 600 }}>Costo final</td><td>{fmtCOP(detail.final_cost)}</td></tr>}
                        </tbody>
                    </table>
                    <p style={{ fontWeight: 600, marginBottom: 6 }}>Motivo de ingreso:</p>
                    <p style={{ marginBottom: 20, color: '#333' }}>{detail.reported_issue}</p>
                    <hr style={{ marginBottom: 16 }} />
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Bitácora</h2>
                    {updates.map(u => (
                        <div key={u.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #eee' }}>
                            <div style={{ display: 'flex', gap: 12, marginBottom: 4, fontSize: 12, color: '#666' }}>
                                <span>{STATUS[u.status]?.label ?? u.status}</span>
                                {!u.is_client_visible && <span>[Nota Interna]</span>}
                                <span>{u.author?.full_name}</span>
                                <span>{new Date(u.created_at).toLocaleString('es-CO')}</span>
                            </div>
                            {u.notes && <p style={{ fontSize: 13, color: '#222' }}>{u.notes}</p>}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal backdrop */}
            <div
                ref={backdropRef}
                className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
                style={{ display: 'none' }}
                onClick={onClose}
            >
                {/* Modal */}
                <div
                    ref={modalRef}
                    className="bg-zinc-950 border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                <Wrench className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-white">Detalle de Reparación</h2>
                                {detail && <p className="text-xs font-mono text-orange-400/80">#{detail.tracking_code}</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => window.print()}
                                className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-medium"
                            >
                                <Printer className="w-4 h-4" />
                                <span className="hidden sm:inline">Imprimir</span>
                            </button>
                            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoading && (
                            <div className="flex items-center justify-center h-60">
                                <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                            </div>
                        )}

                        {!isLoading && !detail && (
                            <div className="flex flex-col items-center justify-center h-60 gap-3 text-zinc-600">
                                <AlertCircle className="w-8 h-8" />
                                <p className="text-sm">No se pudo cargar el detalle.</p>
                            </div>
                        )}

                        {!isLoading && detail && (
                            <>
                                <div className="p-5 space-y-4 border-b border-white/5">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        {sc && (
                                            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${sc.bg} ${sc.color}`}>
                                                {sc.label}
                                            </span>
                                        )}
                                        <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {getDuration(detail.created_at, detail.completed_at)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <p className="text-white font-bold text-base">
                                            {detail.vehicle_brand} {detail.vehicle_model}{detail.vehicle_year ? ` ${detail.vehicle_year}` : ''}
                                        </p>
                                        {detail.vehicle_plate && (
                                            <span className="font-mono text-xs font-black text-white bg-white/10 px-3 py-1 rounded-lg border border-white/10 tracking-widest shrink-0">
                                                {detail.vehicle_plate.toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-zinc-900 rounded-xl p-3 border border-white/5">
                                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1"><User className="w-3 h-3" /> Cliente</p>
                                            <p className="text-sm text-white font-semibold truncate">{detail.clients?.full_name ?? '—'}</p>
                                            {detail.clients?.phone && <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{detail.clients.phone}</p>}
                                        </div>
                                        <div className="bg-zinc-900 rounded-xl p-3 border border-white/5">
                                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1"><Wrench className="w-3 h-3" /> Mecánico</p>
                                            <p className={`text-sm font-semibold truncate ${detail.mechanic ? 'text-white' : 'text-zinc-600 italic'}`}>{detail.mechanic?.full_name ?? 'Sin asignar'}</p>
                                        </div>
                                    </div>

                                    {(detail.estimated_cost || detail.final_cost) && (
                                        <div className="grid grid-cols-2 gap-3">
                                            {detail.estimated_cost && (
                                                <div className="bg-zinc-900 rounded-xl p-3 border border-white/5">
                                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Estimado</p>
                                                    <p className="text-sm text-white font-bold">{fmtCOP(detail.estimated_cost)}</p>
                                                </div>
                                            )}
                                            {detail.final_cost && (
                                                <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/15">
                                                    <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Costo Final</p>
                                                    <p className="text-sm text-emerald-400 font-bold">{fmtCOP(detail.final_cost)}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-3">
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1.5">Motivo de Ingreso</p>
                                        <p className="text-sm text-zinc-300 leading-relaxed">{detail.reported_issue}</p>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="p-5">
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" />
                                        Bitácora · {updates.length} {updates.length === 1 ? 'entrada' : 'entradas'}
                                    </h3>

                                    {updates.length === 0 ? (
                                        <p className="text-sm text-zinc-600 text-center py-10">Sin entradas registradas.</p>
                                    ) : (
                                        <div className="relative">
                                            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-gradient-to-b from-orange-500/50 via-white/5 to-transparent" />
                                            <div className="space-y-5">
                                                {updates.map((upd, idx) => {
                                                    const usc = STATUS[upd.status] ?? { label: upd.status, color: 'text-zinc-400', bg: 'bg-zinc-800 border-zinc-700' }
                                                    const isInternal = !upd.is_client_visible
                                                    return (
                                                        <div key={upd.id} className="detail-entry relative flex gap-4">
                                                            <div className="shrink-0 z-10 pt-1.5">
                                                                <div className={`w-[11px] h-[11px] rounded-full border-2 border-zinc-950 ${idx === 0 ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-zinc-600'}`} />
                                                            </div>
                                                            <div className={`flex-1 rounded-xl p-4 border ${isInternal ? 'bg-amber-500/[0.04] border-amber-500/15' : 'bg-zinc-900/60 border-white/5'}`}>
                                                                <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${usc.bg} ${usc.color}`}>{usc.label}</span>
                                                                        {isInternal ? (
                                                                            <span className="text-[10px] font-bold text-amber-500/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1"><EyeOff className="w-2.5 h-2.5" /> Interna</span>
                                                                        ) : (
                                                                            <span className="text-[10px] font-bold text-emerald-500/70 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> Pública</span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[10px] text-zinc-600 whitespace-nowrap shrink-0">
                                                                        {new Date(upd.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} · {new Date(upd.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                                {upd.author?.full_name && (
                                                                    <div className="flex items-center gap-1.5 mb-2.5">
                                                                        <div className="w-4 h-4 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                                                                            <span className="text-[8px] font-black text-orange-400">{upd.author.full_name.charAt(0).toUpperCase()}</span>
                                                                        </div>
                                                                        <span className="text-[11px] text-zinc-500">{upd.author.full_name}</span>
                                                                    </div>
                                                                )}
                                                                {upd.notes && <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{upd.notes}</p>}
                                                                {upd.photos?.length > 0 && (
                                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                                        {upd.photos.map((url, i) => (
                                                                            <button key={i} onClick={() => setLightbox(url)} className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 hover:border-orange-500/40 transition-all group relative">
                                                                                <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-center justify-center transition-all">
                                                                                    <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                                </div>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div className="fixed inset-0 z-[200] bg-black/92 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
                    <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 p-2 text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-10">
                        <X className="w-5 h-5" />
                    </button>
                    <img src={lightbox} alt="Foto ampliada" className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
                </div>
            )}
        </>
    )
}
