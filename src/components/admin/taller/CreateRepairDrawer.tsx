'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { gsap } from 'gsap'
import {
    X, Search, User, Car, Wrench, ChevronRight, ChevronLeft,
    Plus, Loader2, DollarSign, PenTool, UserCog, Check, AlertCircle,
    Clock, Zap, Fuel, Phone, Mail, ArrowRight
} from 'lucide-react'
import {
    searchClientsAction, getRecentClientsAction, createClientAction,
    getClientVehiclesAction, createVehicleAction,
    createServiceOrderAction, getWorkshopMechanicsAction
} from '@/lib/actions/admin'
import PrintTicketModal from './PrintTicketModal'

type Client  = { id: string; full_name: string; phone: string | null; email: string | null }
type Vehicle = { id: string; plate: string; brand: string; model: string; year: number | null; fuel_type: string | null }
type Mechanic = { id: string; full_name: string; email: string }
type Step = 1 | 2 | 3

interface Props {
    open: boolean
    onClose: () => void
    onCreated: () => void
}

function Skeleton() {
    return (
        <div className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-white/[0.06] flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/[0.06] rounded-full w-3/4" />
                <div className="h-2.5 bg-white/[0.04] rounded-full w-1/2" />
            </div>
        </div>
    )
}

const FUEL_COLOR: Record<string, string> = {
    FI:        'bg-blue-500/15 text-blue-400 border-blue-500/20',
    Carburada: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
}

const REPAIR_SUGGESTIONS = [
    'Cambio de aceite y filtro',
    'Cambio de aceite',
    'Cambio de pastillas de freno delanteras',
    'Cambio de pastillas de freno traseras',
    'Cambio de pastillas de freno',
    'Cambio de frenos delanteros',
    'Cambio de frenos traseros',
    'Cambio de llanta delantera',
    'Cambio de llanta trasera',
    'Cambio de bujías',
    'Cambio de correa de distribución',
    'Cambio de filtro de aire',
    'Cambio de filtro de combustible',
    'Cambio de batería',
    'Cambio de amortiguadores delanteros',
    'Cambio de amortiguadores traseros',
    'Cambio de amortiguadores',
    'Revisión general del motor',
    'Revisión general',
    'Revisión de frenos',
    'Revisión de suspensión',
    'Revisión de motor',
    'Revisión eléctrica',
    'Revisión de transmisión',
    'Revisión de batería',
    'Revisión de sistema de enfriamiento',
    'Mantenimiento preventivo 3000 km',
    'Mantenimiento preventivo',
    'Mantenimiento general',
    'No enciende el motor',
    'No enciende',
    'No arranca',
    'Pérdida de aceite por empaque',
    'Pérdida de aceite',
    'Pérdida de refrigerante',
    'Recalentamiento del motor',
    'Ruido en los frenos al frenar',
    'Ruido en los frenos',
    'Ruido en el motor al acelerar',
    'Ruido en el motor',
    'Vibración en el manillar',
    'Vibración en el volante',
    'Alineación y balanceo',
    'Falla en el sistema eléctrico',
    'Falla en el motor',
    'Fuga de combustible',
]

export default function CreateRepairDrawer({ open, onClose, onCreated }: Props) {
    const backdropRef    = useRef<HTMLDivElement>(null)
    const modalRef       = useRef<HTMLDivElement>(null)
    const stepContentRef = useRef<HTMLDivElement>(null)
    const listRef        = useRef<HTMLDivElement>(null)

    const [step, setStep] = useState<Step>(1)
    const [stepDir, setStepDir] = useState<'forward' | 'back'>('forward')
    const [isPending, startTransition] = useTransition()

    // Step 1 — Client
    const [clientSearch,   setClientSearch]   = useState('')
    const [clientResults,  setClientResults]  = useState<Client[]>([])
    const [recentClients,  setRecentClients]  = useState<Client[]>([])
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [isSearching,    setIsSearching]    = useState(false)
    const [showNewClient,  setShowNewClient]  = useState(false)
    const [newClientForm,  setNewClientForm]  = useState({ full_name: '', phone: '', email: '' })

    // Step 2 — Vehicle
    const [vehicles,         setVehicles]         = useState<Vehicle[]>([])
    const [selectedVehicle,  setSelectedVehicle]  = useState<Vehicle | null>(null)
    const [isLoadingVehicles,setIsLoadingVehicles] = useState(false)
    const [showNewVehicle,   setShowNewVehicle]   = useState(false)
    const [newVehicleForm,   setNewVehicleForm]   = useState({ plate: '', brand: '', model: '', year: '', fuel_type: 'FI' as 'FI' | 'Carburada' })

    // Step 3 — Service
    const [mechanics,        setMechanics]        = useState<Mechanic[]>([])
    const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null)
    const [reportedIssue,    setReportedIssue]    = useState('')
    const [ghostText,        setGhostText]        = useState('')
    const [estimatedCost,    setEstimatedCost]    = useState('')
    const [formError,        setFormError]        = useState<string | null>(null)

    // Ticket
    const [ticketData, setTicketData] = useState<any>(null)
    const [showTicket, setShowTicket] = useState(false)

    // ── Modal open/close animation ────────────────────────────────────────────
    useEffect(() => {
        const backdrop = backdropRef.current
        const modal    = modalRef.current
        if (!backdrop || !modal) return

        if (open) {
            gsap.set(backdrop, { display: 'flex', opacity: 0 })
            gsap.set(modal,    { y: 40, opacity: 0, scale: 0.96 })
            gsap.to(backdrop,  { opacity: 1, duration: 0.28, ease: 'expo.out' })
            gsap.to(modal,     { y: 0, opacity: 1, scale: 1, duration: 0.38, ease: 'expo.out', force3D: true })
            getRecentClientsAction().then(res => { if (res.ok) setRecentClients(res.data) })
        } else {
            gsap.to(modal,    { y: 24, opacity: 0, scale: 0.96, duration: 0.2,  ease: 'expo.in' })
            gsap.to(backdrop, { opacity: 0, duration: 0.24, ease: 'expo.in',
                onComplete: () => { gsap.set(backdrop, { display: 'none' }) } })
        }
    }, [open])

    // ── Step transition animation ─────────────────────────────────────────────
    const goStep = (newStep: Step, dir: 'forward' | 'back') => {
        const el = stepContentRef.current
        setStepDir(dir)
        if (!el) { setStep(newStep); return }
        gsap.to(el, {
            opacity: 0, x: dir === 'forward' ? -28 : 28,
            duration: 0.18, ease: 'expo.in',
            onComplete: () => { setStep(newStep) },
        })
    }

    useEffect(() => {
        const el = stepContentRef.current
        if (!el || !open) return
        gsap.fromTo(el,
            { opacity: 0, x: stepDir === 'forward' ? 28 : -28 },
            { opacity: 1, x: 0, duration: 0.28, ease: 'expo.out', force3D: true }
        )
    }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

    // ── List stagger animation ────────────────────────────────────────────────
    const animateList = () => {
        const items = listRef.current?.querySelectorAll('[data-list-item]')
        if (!items?.length) return
        gsap.fromTo(items,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.22, ease: 'expo.out', stagger: 0.04, force3D: true }
        )
    }

    useEffect(() => { if (clientResults.length) setTimeout(animateList, 0) }, [clientResults])
    useEffect(() => { if (recentClients.length && clientSearch.length < 2) setTimeout(animateList, 0) }, [recentClients]) // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (vehicles.length) setTimeout(animateList, 0) }, [vehicles])

    // ── Reset ─────────────────────────────────────────────────────────────────
    const reset = () => {
        setStep(1); setStepDir('forward')
        setClientSearch(''); setClientResults([]); setRecentClients([])
        setSelectedClient(null); setShowNewClient(false)
        setNewClientForm({ full_name: '', phone: '', email: '' })
        setVehicles([]); setSelectedVehicle(null); setShowNewVehicle(false)
        setNewVehicleForm({ plate: '', brand: '', model: '', year: '', fuel_type: 'FI' })
        setMechanics([]); setSelectedMechanic(null)
        setReportedIssue(''); setGhostText(''); setEstimatedCost(''); setFormError(null)
    }

    const handleClose = () => { reset(); onClose() }

    // ── Ghost text prediction — una palabra a la vez ──────────────────────────
    useEffect(() => {
        const lines    = reportedIssue.split('\n')
        const lastLine = lines[lines.length - 1]
        if (!lastLine.trim()) { setGhostText(''); return }

        const match = REPAIR_SUGGESTIONS.find(s =>
            s.toLowerCase().startsWith(lastLine.toLowerCase()) &&
            s.toLowerCase() !== lastLine.toLowerCase()
        )
        if (!match) { setGhostText(''); return }

        const remainder = match.slice(lastLine.length)
        // Extrae solo el próximo token: terminación de palabra actual o (espacio + siguiente palabra)
        const nextToken = remainder.match(/^\s*\S+/)?.[0] ?? ''
        setGhostText(nextToken)
    }, [reportedIssue])

    const handleIssueKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab' && ghostText) {
            e.preventDefault()
            setReportedIssue(prev => prev + ghostText)
            setGhostText('')
        }
    }

    // ── Debounced client search (150ms for real-time feel) ───────────────────
    useEffect(() => {
        if (!clientSearch.trim() || clientSearch.length < 2) {
            setClientResults([])
            setIsSearching(false)
            return
        }
        setIsSearching(true)
        const t = setTimeout(async () => {
            const res = await searchClientsAction(clientSearch)
            if (res.ok) setClientResults(res.data)
            setIsSearching(false)
        }, 150)
        return () => clearTimeout(t)
    }, [clientSearch])

    // ── Select client → load vehicles → step 2 ───────────────────────────────
    const selectClient = async (client: Client) => {
        setSelectedClient(client)
        setClientSearch(''); setClientResults([])
        setIsLoadingVehicles(true)
        goStep(2, 'forward')
        const res = await getClientVehiclesAction(client.id)
        if (res.ok) setVehicles(res.data)
        setIsLoadingVehicles(false)
    }

    const handleCreateClient = () => {
        if (!newClientForm.full_name.trim()) return
        startTransition(async () => {
            const res = await createClientAction({
                full_name: newClientForm.full_name,
                phone:     newClientForm.phone,
                email:     newClientForm.email || undefined,
            })
            if (res.ok && res.data) {
                const client: Client = { id: res.data.id, full_name: newClientForm.full_name, phone: newClientForm.phone || null, email: newClientForm.email || null }
                await selectClient(client)
                setShowNewClient(false)
            }
        })
    }

    // ── Select vehicle → load mechanics → step 3 ─────────────────────────────
    const selectVehicle = async (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle)
        goStep(3, 'forward')
        const res = await getWorkshopMechanicsAction()
        if (res.ok) setMechanics(res.data)
    }

    const handleCreateVehicle = () => {
        if (!newVehicleForm.plate.trim() || !newVehicleForm.brand.trim() || !newVehicleForm.model.trim()) return
        if (!selectedClient) return
        startTransition(async () => {
            const res = await createVehicleAction({
                client_id: selectedClient.id,
                plate:     newVehicleForm.plate,
                brand:     newVehicleForm.brand,
                model:     newVehicleForm.model,
                year:      newVehicleForm.year ? parseInt(newVehicleForm.year) : null,
                fuel_type: newVehicleForm.fuel_type,
            })
            if (res.ok && res.data) {
                const vehicle: Vehicle = {
                    id:        res.data.id,
                    plate:     newVehicleForm.plate.toUpperCase(),
                    brand:     newVehicleForm.brand,
                    model:     newVehicleForm.model,
                    year:      newVehicleForm.year ? parseInt(newVehicleForm.year) : null,
                    fuel_type: newVehicleForm.fuel_type,
                }
                await selectVehicle(vehicle)
                setShowNewVehicle(false)
            }
        })
    }

    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '')
        setEstimatedCost(val ? new Intl.NumberFormat('es-CO').format(parseInt(val)) : '')
    }

    const handleSubmit = () => {
        console.log('[NOS] handleSubmit | client:', selectedClient?.id, '| vehicle:', selectedVehicle?.id, '| issue:', reportedIssue.trim())
        if (!reportedIssue.trim()) return setFormError('El motivo de ingreso es obligatorio.')
        if (!selectedClient || !selectedVehicle) {
            console.warn('[NOS] guard failed — selectedClient:', selectedClient, '| selectedVehicle:', selectedVehicle)
            return
        }
        setFormError(null)

        startTransition(async () => {
            const cost = estimatedCost ? parseFloat(estimatedCost.replace(/\D/g, '')) : undefined
            console.log('[NOS] calling createServiceOrderAction…')
            const res  = await createServiceOrderAction({
                client_id:     selectedClient.id,
                vehicle_id:    selectedVehicle.id,
                reported_issue: reportedIssue,
                estimated_cost: cost,
                mechanic_id:   selectedMechanic?.id,
                vehicle_brand: selectedVehicle.brand,
                vehicle_model: selectedVehicle.model,
                vehicle_year:  selectedVehicle.year || undefined,
                vehicle_plate: selectedVehicle.plate,
            })
            console.log('[NOS] result:', res)

            if (!res.ok) return setFormError(res.error)

            setTicketData({
                tracking_code: res.data.tracking_code,
                workshop_name: res.data.workshop_name,
                workshop_slug: res.data.workshop_slug,
                workshop_logo: res.data.workshop_logo,
                vehicle_brand: selectedVehicle.brand,
                vehicle_model: selectedVehicle.model,
                vehicle_plate: selectedVehicle.plate,
                reported_issue: reportedIssue,
                created_at: new Date().toISOString(),
            })
            setShowTicket(true)
            onCreated()
            handleClose()
        })
    }

    const steps = [
        { n: 1 as Step, label: 'Cliente',  icon: User   },
        { n: 2 as Step, label: 'Vehículo', icon: Car    },
        { n: 3 as Step, label: 'Servicio', icon: Wrench },
    ]

    const showingSearch = clientSearch.length >= 2
    const displayList   = showingSearch ? clientResults : recentClients

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            <div
                ref={backdropRef}
                className="fixed inset-0 z-[160] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
                style={{ display: 'none' }}
                onClick={e => { if (e.target === e.currentTarget) handleClose() }}
            >
                <div
                    ref={modalRef}
                    className="bg-[#0d0d0f] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl max-h-[94vh] flex flex-col overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Orange accent bar */}
                    <div className="h-[3px] w-full bg-gradient-to-r from-orange-600 via-orange-400 to-amber-400 flex-shrink-0" />

                    {/* Mobile drag handle */}
                    <div className="sm:hidden flex justify-center pt-2.5 pb-0 flex-shrink-0">
                        <div className="w-9 h-1 rounded-full bg-white/10" />
                    </div>

                    {/* ── Header ──────────────────────────────────────────── */}
                    <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                                <Wrench className="w-4.5 h-4.5 text-orange-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-white tracking-tight leading-none">Nueva Orden de Servicio</h2>
                                <p className="text-[11px] text-zinc-500 mt-0.5">Ingreso de vehículo al taller</p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="w-8 h-8 rounded-xl text-zinc-500 hover:text-white hover:bg-white/8 transition-colors flex items-center justify-center">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* ── Step indicator ──────────────────────────────────── */}
                    <div className="px-6 pb-4 flex-shrink-0">
                        <div className="flex items-center">
                            {steps.map(({ n, label, icon: Icon }, i) => (
                                <div key={n} className="flex items-center flex-1 min-w-0">
                                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-400
                                            ${step > n
                                                ? 'bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.35)]'
                                                : step === n
                                                    ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-[0_0_16px_rgba(249,115,22,0.4)]'
                                                    : 'bg-white/[0.04] border border-white/8'}`}
                                        >
                                            {step > n
                                                ? <Check className="w-4 h-4 text-white" />
                                                : <Icon className={`w-4 h-4 ${step === n ? 'text-white' : 'text-zinc-600'}`} />
                                            }
                                        </div>
                                        <span className={`text-[10px] font-semibold tracking-wide transition-colors leading-none
                                            ${step === n ? 'text-white' : step > n ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                            {label}
                                        </span>
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className={`flex-1 h-[2px] mx-3 mb-4 rounded-full transition-all duration-500
                                            ${step > n
                                                ? 'bg-gradient-to-r from-emerald-500/60 to-emerald-500/30'
                                                : 'bg-white/[0.06]'}`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Divider ──────────────────────────────────────────── */}
                    <div className="h-px bg-white/[0.05] flex-shrink-0 mx-6" />

                    {/* ── Step content ─────────────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto overscroll-contain">
                        <div ref={stepContentRef} className="p-6 space-y-5">

                            {/* ══════════════ STEP 1: CLIENT ══════════════ */}
                            {step === 1 && (
                                <>
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-white">¿A quién le pertenece el vehículo?</p>
                                        <p className="text-xs text-zinc-500">Busca un cliente existente o regístralo ahora.</p>
                                    </div>

                                    {selectedClient ? (
                                        /* Selected client badge */
                                        <div className="flex items-center gap-3 bg-emerald-500/[0.07] border border-emerald-500/25 rounded-2xl px-4 py-3.5">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                                                <span className="text-sm font-bold text-emerald-300">{selectedClient.full_name.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{selectedClient.full_name}</p>
                                                <p className="text-xs text-zinc-500 mt-0.5">{selectedClient.phone || selectedClient.email || 'Sin contacto'}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">Seleccionado</span>
                                                <button onClick={() => setSelectedClient(null)} className="w-7 h-7 rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-white/5 transition-colors flex items-center justify-center ml-1">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Search input */}
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar por nombre, teléfono..."
                                                    value={clientSearch}
                                                    onChange={e => setClientSearch(e.target.value)}
                                                    autoFocus
                                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl pl-11 pr-11 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(249,115,22,0.08)] transition-all"
                                                />
                                                {isSearching
                                                    ? <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 animate-spin" />
                                                    : clientSearch.length >= 2
                                                        ? <Zap className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400/50" />
                                                        : null
                                                }
                                            </div>

                                            {/* Client list */}
                                            {(isSearching || displayList.length > 0) && (
                                                <div className="bg-zinc-900/80 border border-white/[0.07] rounded-2xl overflow-hidden" ref={listRef}>
                                                    {/* List header */}
                                                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.01]">
                                                        {!showingSearch
                                                            ? <><Clock className="w-3 h-3 text-zinc-600" /><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recientes</span></>
                                                            : <><Search className="w-3 h-3 text-orange-400/70" /><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Resultados</span></>
                                                        }
                                                    </div>

                                                    {isSearching
                                                        ? <><Skeleton /><Skeleton /><Skeleton /></>
                                                        : displayList.map((client, i) => (
                                                            <button
                                                                key={client.id}
                                                                data-list-item
                                                                onClick={() => selectClient(client)}
                                                                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors text-left group ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}
                                                            >
                                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500/25 to-amber-500/15 border border-orange-500/20 flex items-center justify-center flex-shrink-0 group-hover:shadow-[0_0_10px_rgba(249,115,22,0.2)] transition-shadow">
                                                                    <span className="text-xs font-bold text-orange-300">{client.full_name.charAt(0).toUpperCase()}</span>
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-sm font-semibold text-white group-hover:text-orange-100 transition-colors truncate">{client.full_name}</p>
                                                                    <p className="text-[11px] text-zinc-500 mt-0.5">{client.phone || client.email || '—'}</p>
                                                                </div>
                                                                <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                                                            </button>
                                                        ))
                                                    }
                                                </div>
                                            )}

                                            {/* New client toggle */}
                                            {!showNewClient ? (
                                                <button
                                                    onClick={() => setShowNewClient(true)}
                                                    className="w-full flex items-center gap-3 px-4 py-3.5 border border-dashed border-white/[0.12] rounded-2xl text-sm text-zinc-500 hover:text-white hover:border-orange-500/30 hover:bg-orange-500/[0.03] transition-all group"
                                                >
                                                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] group-hover:bg-orange-500/10 border border-white/8 group-hover:border-orange-500/20 flex items-center justify-center transition-all">
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </div>
                                                    Crear nuevo cliente
                                                </button>
                                            ) : (
                                                <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-4 space-y-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="w-5 h-5 rounded-md bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
                                                            <Plus className="w-3 h-3 text-orange-400" />
                                                        </div>
                                                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Nuevo cliente</p>
                                                    </div>
                                                    <input type="text" placeholder="Nombre completo *" value={newClientForm.full_name}
                                                        onChange={e => setNewClientForm(f => ({ ...f, full_name: e.target.value }))}
                                                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/40 transition-all" />
                                                    <div className="grid grid-cols-2 gap-2.5">
                                                        <div className="relative">
                                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                                                            <input type="tel" placeholder="Teléfono" value={newClientForm.phone}
                                                                onChange={e => setNewClientForm(f => ({ ...f, phone: e.target.value }))}
                                                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/40 transition-all" />
                                                        </div>
                                                        <div className="relative">
                                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                                                            <input type="email" placeholder="Correo" value={newClientForm.email}
                                                                onChange={e => setNewClientForm(f => ({ ...f, email: e.target.value }))}
                                                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/40 transition-all" />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 pt-1">
                                                        <button onClick={() => setShowNewClient(false)} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-xs text-zinc-500 hover:text-white transition-colors">
                                                            Cancelar
                                                        </button>
                                                        <button onClick={handleCreateClient} disabled={!newClientForm.full_name.trim() || isPending}
                                                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-xs font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20">
                                                            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-3.5 h-3.5" />Crear y continuar</>}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}

                            {/* ══════════════ STEP 2: VEHICLE ══════════════ */}
                            {step === 2 && selectedClient && (
                                <>
                                    {/* Client chip */}
                                    <div className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl px-3.5 py-2.5">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500/25 to-amber-500/15 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-bold text-orange-300">{selectedClient.full_name.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-white truncate">{selectedClient.full_name}</p>
                                            <p className="text-[10px] text-zinc-500">{selectedClient.phone || selectedClient.email || 'Sin contacto'}</p>
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-600 bg-white/[0.04] rounded-full px-2 py-0.5 flex-shrink-0">Cliente</span>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-white">¿Qué vehículo ingresa?</p>
                                        <p className="text-xs text-zinc-500">Selecciona uno registrado o agrega uno nuevo.</p>
                                    </div>

                                    {isLoadingVehicles ? (
                                        <div ref={listRef} className="bg-zinc-900/80 border border-white/[0.07] rounded-2xl overflow-hidden">
                                            <Skeleton /><Skeleton /><Skeleton />
                                        </div>
                                    ) : (
                                        <div className="space-y-2" ref={listRef}>
                                            {vehicles.map(v => (
                                                <button key={v.id} data-list-item onClick={() => selectVehicle(v)}
                                                    className="w-full flex items-center gap-3.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-orange-500/25 rounded-2xl px-4 py-3.5 transition-all group text-left hover:shadow-[0_0_20px_rgba(249,115,22,0.06)]">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-white/[0.08] group-hover:border-orange-500/25 flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-orange-500/[0.08]">
                                                        <Car className="w-5 h-5 text-zinc-500 group-hover:text-orange-400 transition-colors" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-white group-hover:text-orange-100 transition-colors">{v.brand} {v.model} {v.year ? `· ${v.year}` : ''}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs font-mono text-zinc-400 tracking-widest bg-zinc-800/60 border border-white/[0.06] rounded-md px-1.5 py-0.5">{v.plate}</span>
                                                            {v.fuel_type && (
                                                                <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 border ${FUEL_COLOR[v.fuel_type] ?? 'bg-white/5 text-zinc-500 border-white/10'}`}>
                                                                    {v.fuel_type === 'FI' ? 'Inyección' : v.fuel_type}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                                                </button>
                                            ))}

                                            {!showNewVehicle && (
                                                <button onClick={() => setShowNewVehicle(true)}
                                                    className="w-full flex items-center gap-3 px-4 py-3.5 border border-dashed border-white/[0.12] rounded-2xl text-sm text-zinc-500 hover:text-white hover:border-orange-500/30 hover:bg-orange-500/[0.03] transition-all group">
                                                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] group-hover:bg-orange-500/10 border border-white/8 group-hover:border-orange-500/20 flex items-center justify-center transition-all">
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </div>
                                                    {vehicles.length === 0 ? 'Registrar primer vehículo' : 'Agregar otro vehículo'}
                                                </button>
                                            )}

                                            {showNewVehicle && (
                                                <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-4 space-y-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="w-5 h-5 rounded-md bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
                                                            <Car className="w-3 h-3 text-orange-400" />
                                                        </div>
                                                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Nuevo vehículo</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2.5">
                                                        <input type="text" placeholder="Marca *" value={newVehicleForm.brand}
                                                            onChange={e => setNewVehicleForm(f => ({ ...f, brand: e.target.value }))}
                                                            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/40 transition-all" />
                                                        <input type="text" placeholder="Modelo *" value={newVehicleForm.model}
                                                            onChange={e => setNewVehicleForm(f => ({ ...f, model: e.target.value }))}
                                                            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/40 transition-all" />
                                                        <input type="text" placeholder="Placa *" value={newVehicleForm.plate}
                                                            onChange={e => setNewVehicleForm(f => ({ ...f, plate: e.target.value.toUpperCase() }))}
                                                            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/40 transition-all uppercase" />
                                                        <input type="number" placeholder="Año" value={newVehicleForm.year}
                                                            onChange={e => setNewVehicleForm(f => ({ ...f, year: e.target.value }))}
                                                            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/40 transition-all" />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {(['FI', 'Carburada'] as const).map(ft => (
                                                            <button key={ft} type="button" onClick={() => setNewVehicleForm(f => ({ ...f, fuel_type: ft }))}
                                                                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5
                                                                    ${newVehicleForm.fuel_type === ft
                                                                        ? ft === 'FI' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                                                        : 'bg-white/[0.03] border-white/[0.07] text-zinc-500 hover:text-zinc-300'}`}>
                                                                <Fuel className="w-3 h-3" />
                                                                {ft === 'FI' ? 'Inyección' : 'Carburada'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2 pt-1">
                                                        <button onClick={() => setShowNewVehicle(false)} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-xs text-zinc-500 hover:text-white transition-colors">
                                                            Cancelar
                                                        </button>
                                                        <button onClick={handleCreateVehicle} disabled={!newVehicleForm.plate.trim() || !newVehicleForm.brand.trim() || !newVehicleForm.model.trim() || isPending}
                                                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-xs font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20">
                                                            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-3.5 h-3.5" />Registrar</>}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* ══════════════ STEP 3: SERVICE ══════════════ */}
                            {step === 3 && selectedClient && selectedVehicle && (
                                <>
                                    {/* Client + vehicle summary */}
                                    <div className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl px-3.5 py-2.5">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500/25 to-amber-500/15 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-bold text-orange-300">{selectedClient.full_name.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-white truncate">{selectedClient.full_name}</p>
                                            <p className="text-[10px] text-zinc-500 font-mono">{selectedVehicle.brand} {selectedVehicle.model} · {selectedVehicle.plate}</p>
                                        </div>
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                                        </span>
                                    </div>

                                    {/* Reported issue — ghost text prediction */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                                <PenTool className="w-3.5 h-3.5 text-orange-400/70" />
                                                Motivo de ingreso <span className="text-orange-500 normal-case font-normal tracking-normal">*</span>
                                            </label>
                                            {ghostText && (
                                                <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                                    <kbd className="px-1.5 py-0.5 rounded-md border border-white/[0.10] bg-white/[0.04] font-mono text-[9px] text-zinc-500">Tab</kbd>
                                                    para aceptar
                                                </span>
                                            )}
                                        </div>

                                        {/* Layered textarea with inline ghost text */}
                                        <div className="relative rounded-2xl">
                                            {/* Mirror div — ghost text layer */}
                                            <div
                                                aria-hidden
                                                className="absolute inset-0 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words pointer-events-none select-none overflow-hidden rounded-2xl"
                                                style={{ fontFamily: 'inherit', wordBreak: 'break-word' }}
                                            >
                                                {/* Invisible spacer matching typed text */}
                                                <span style={{ visibility: 'hidden' }}>{reportedIssue}</span>
                                                {/* Ghost prediction text */}
                                                <span className="text-zinc-600 transition-opacity duration-100">{ghostText}</span>
                                            </div>

                                            {/* Actual textarea — transparent bg so mirror shows through */}
                                            <textarea
                                                rows={3}
                                                placeholder={ghostText ? '' : 'Ej. Cambio de aceite, revisión de frenos, no enciende...'}
                                                value={reportedIssue}
                                                onChange={e => { setReportedIssue(e.target.value); if (formError) setFormError(null) }}
                                                onKeyDown={handleIssueKeyDown}
                                                autoFocus
                                                spellCheck={false}
                                                className="relative z-10 w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/40 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.07)] transition-all resize-none leading-relaxed caret-orange-400"
                                                style={{ background: reportedIssue ? 'transparent' : undefined }}
                                            />
                                        </div>
                                    </div>

                                    {/* Mechanic assignment */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                            <UserCog className="w-3.5 h-3.5 text-orange-400/70" />
                                            Asignar mecánico
                                            <span className="ml-auto text-[10px] font-normal text-zinc-600 normal-case tracking-normal">Opcional</span>
                                        </label>
                                        {mechanics.length === 0 ? (
                                            <div className="flex items-center gap-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3">
                                                <UserCog className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                                                <p className="text-xs text-zinc-600">Sin mecánicos activos. Agrégalos en <span className="text-zinc-400">Empleados</span>.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                {/* Unassigned option */}
                                                <button onClick={() => setSelectedMechanic(null)}
                                                    className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-sm transition-all text-left ${!selectedMechanic
                                                        ? 'bg-zinc-800/80 border-white/15 shadow-[0_0_12px_rgba(255,255,255,0.04)]'
                                                        : 'bg-white/[0.02] border-white/[0.06] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'}`}>
                                                    <div className="w-8 h-8 rounded-full bg-zinc-700/60 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                                                        <UserCog className="w-3.5 h-3.5 text-zinc-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-zinc-300 truncate">Sin asignar</p>
                                                    </div>
                                                    {!selectedMechanic && <Check className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />}
                                                </button>

                                                {mechanics.map(m => (
                                                    <button key={m.id} onClick={() => setSelectedMechanic(m)}
                                                        className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-sm transition-all text-left ${selectedMechanic?.id === m.id
                                                            ? 'bg-orange-500/[0.08] border-orange-500/30 shadow-[0_0_16px_rgba(249,115,22,0.1)]'
                                                            : 'bg-white/[0.02] border-white/[0.06] text-zinc-300 hover:bg-white/[0.05] hover:border-white/12'}`}>
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border transition-colors
                                                            ${selectedMechanic?.id === m.id
                                                                ? 'bg-orange-500/20 border-orange-500/30'
                                                                : 'bg-zinc-800/60 border-white/[0.08]'}`}>
                                                            <span className={`text-xs font-bold ${selectedMechanic?.id === m.id ? 'text-orange-300' : 'text-zinc-400'}`}>
                                                                {m.full_name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <p className={`text-xs font-semibold flex-1 truncate transition-colors ${selectedMechanic?.id === m.id ? 'text-orange-200' : 'text-zinc-300'}`}>
                                                            {m.full_name.split(' ')[0]}
                                                        </p>
                                                        {selectedMechanic?.id === m.id && <Check className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Estimated cost */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                            <DollarSign className="w-3.5 h-3.5 text-orange-400/70" />
                                            Presupuesto estimado
                                            <span className="ml-auto text-[10px] font-normal text-zinc-600 normal-case tracking-normal">Opcional</span>
                                        </label>
                                        <div className="relative flex items-center">
                                            <span className="absolute left-4 text-zinc-400 font-bold text-sm pointer-events-none">$</span>
                                            <input
                                                type="text"
                                                placeholder="0"
                                                value={estimatedCost}
                                                onChange={handleCostChange}
                                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl pl-9 pr-[72px] py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/40 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.07)] transition-all font-mono text-base"
                                            />
                                            <span className="absolute right-4 text-[11px] font-bold text-zinc-500 bg-zinc-800/60 border border-white/[0.08] rounded-lg px-2 py-1 pointer-events-none">COP</span>
                                        </div>
                                    </div>

                                    {/* Error */}
                                    {formError && (
                                        <div className="flex items-center gap-2.5 bg-rose-500/[0.08] border border-rose-500/20 rounded-xl px-4 py-3">
                                            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                                            <p className="text-sm text-rose-400">{formError}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── Footer navigation ────────────────────────────────── */}
                    <div className="flex-shrink-0 px-6 py-4 border-t border-white/[0.05] bg-white/[0.01] flex gap-2.5">
                        {step > 1 && (
                            <button
                                onClick={() => goStep((step - 1) as Step, 'back')}
                                className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-white/[0.08] text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all font-medium active:scale-95"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Atrás
                            </button>
                        )}

                        {step === 3 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={isPending || !reportedIssue.trim()}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-bold transition-all shadow-lg shadow-orange-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isPending
                                    ? <><Loader2 className="w-4 h-4 animate-spin" />Creando orden...</>
                                    : <><Wrench className="w-4 h-4" />Crear Orden de Servicio</>
                                }
                            </button>
                        ) : (
                            step === 1 && selectedClient && (
                                <button
                                    onClick={() => goStep(2, 'forward')}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-sm font-bold text-white transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]"
                                >
                                    Seleccionar vehículo
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>

            <PrintTicketModal open={showTicket} onClose={() => setShowTicket(false)} data={ticketData} />
        </>
    )
}
