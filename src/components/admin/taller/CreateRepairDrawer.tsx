'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { gsap } from 'gsap'
import {
    X, Search, User, Car, Wrench, ChevronRight, ChevronLeft,
    Plus, Loader2, DollarSign, PenTool, UserCog, Check, AlertCircle
} from 'lucide-react'
import {
    searchClientsAction, createClientAction,
    getClientVehiclesAction, createVehicleAction,
    createServiceOrderAction, getWorkshopMechanicsAction
} from '@/lib/actions/admin'
import PrintTicketModal from './PrintTicketModal'

// ── Types ──────────────────────────────────────────────────

type Client = { id: string; full_name: string; phone: string | null; email: string | null }
type Vehicle = { id: string; plate: string; brand: string; model: string; year: number | null; fuel_type: string | null }
type Mechanic = { id: string; full_name: string; email: string }
type Step = 1 | 2 | 3

interface Props {
    open: boolean
    onClose: () => void
    onCreated: () => void
}

export default function CreateRepairDrawer({ open, onClose, onCreated }: Props) {
    const backdropRef = useRef<HTMLDivElement>(null)
    const drawerRef = useRef<HTMLDivElement>(null)

    const [step, setStep] = useState<Step>(1)
    const [isPending, startTransition] = useTransition()

    // Step 1 — Client
    const [clientSearch, setClientSearch] = useState('')
    const [clientResults, setClientResults] = useState<Client[]>([])
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const [showNewClient, setShowNewClient] = useState(false)
    const [newClientForm, setNewClientForm] = useState({ full_name: '', phone: '', email: '' })

    // Step 2 — Vehicle
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(false)
    const [showNewVehicle, setShowNewVehicle] = useState(false)
    const [newVehicleForm, setNewVehicleForm] = useState({ plate: '', brand: '', model: '', year: '', fuel_type: 'FI' as 'FI' | 'Carburada' })

    // Step 3 — Service
    const [mechanics, setMechanics] = useState<Mechanic[]>([])
    const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null)
    const [reportedIssue, setReportedIssue] = useState('')
    const [estimatedCost, setEstimatedCost] = useState('')
    const [formError, setFormError] = useState<string | null>(null)

    // Ticket
    const [ticketData, setTicketData] = useState<any>(null)
    const [showTicket, setShowTicket] = useState(false)

    // Drawer animation
    useEffect(() => {
        const backdrop = backdropRef.current
        const drawer = drawerRef.current
        if (!backdrop || !drawer) return

        if (open) {
            gsap.set(backdrop, { display: 'block', opacity: 0 })
            gsap.set(drawer, { x: '100%' })
            gsap.to(backdrop, { opacity: 1, duration: 0.3, ease: 'expo.out', force3D: true })
            gsap.to(drawer, { x: '0%', duration: 0.38, ease: 'expo.out', force3D: true })
        } else {
            gsap.to(backdrop, { opacity: 0, duration: 0.22, ease: 'expo.in', onComplete: () => gsap.set(backdrop, { display: 'none' }) })
            gsap.to(drawer, { x: '100%', duration: 0.26, ease: 'expo.in', force3D: true })
        }
    }, [open])

    // Step transition animation
    const animateStep = () => {
        gsap.fromTo('.step-content',
            { opacity: 0, x: 20 },
            { opacity: 1, x: 0, duration: 0.3, ease: 'expo.out', force3D: true }
        )
    }

    const reset = () => {
        setStep(1)
        setClientSearch('')
        setClientResults([])
        setSelectedClient(null)
        setShowNewClient(false)
        setNewClientForm({ full_name: '', phone: '', email: '' })
        setVehicles([])
        setSelectedVehicle(null)
        setShowNewVehicle(false)
        setNewVehicleForm({ plate: '', brand: '', model: '', year: '', fuel_type: 'FI' })
        setMechanics([])
        setSelectedMechanic(null)
        setReportedIssue('')
        setEstimatedCost('')
        setFormError(null)
    }

    const handleClose = () => { reset(); onClose() }

    // ── Step 1 handlers ──────────────────────────────────────

    useEffect(() => {
        if (!clientSearch.trim() || clientSearch.length < 2) { setClientResults([]); return }
        const t = setTimeout(async () => {
            setIsSearching(true)
            const res = await searchClientsAction(clientSearch)
            if (res.ok) setClientResults(res.data)
            setIsSearching(false)
        }, 300)
        return () => clearTimeout(t)
    }, [clientSearch])

    const selectClient = async (client: Client) => {
        setSelectedClient(client)
        setClientSearch('')
        setClientResults([])
        setIsLoadingVehicles(true)
        const res = await getClientVehiclesAction(client.id)
        if (res.ok) setVehicles(res.data)
        setIsLoadingVehicles(false)
        setStep(2)
        setTimeout(animateStep, 50)
    }

    const handleCreateClient = async () => {
        if (!newClientForm.full_name.trim()) return
        startTransition(async () => {
            const res = await createClientAction({
                full_name: newClientForm.full_name,
                phone: newClientForm.phone,
                email: newClientForm.email || undefined,
            })
            if (res.ok && res.data) {
                const client: Client = { id: res.data.id, full_name: newClientForm.full_name, phone: newClientForm.phone || null, email: newClientForm.email || null }
                await selectClient(client)
                setShowNewClient(false)
            }
        })
    }

    // ── Step 2 handlers ──────────────────────────────────────

    const selectVehicle = async (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle)
        const res = await getWorkshopMechanicsAction()
        if (res.ok) setMechanics(res.data)
        setStep(3)
        setTimeout(animateStep, 50)
    }

    const handleCreateVehicle = async () => {
        if (!newVehicleForm.plate.trim() || !newVehicleForm.brand.trim() || !newVehicleForm.model.trim()) return
        if (!selectedClient) return
        startTransition(async () => {
            const res = await createVehicleAction({
                client_id: selectedClient.id,
                plate: newVehicleForm.plate,
                brand: newVehicleForm.brand,
                model: newVehicleForm.model,
                year: newVehicleForm.year ? parseInt(newVehicleForm.year) : null,
                fuel_type: newVehicleForm.fuel_type,
            })
            if (res.ok && res.data) {
                const vehicle: Vehicle = {
                    id: res.data.id,
                    plate: newVehicleForm.plate.toUpperCase(),
                    brand: newVehicleForm.brand,
                    model: newVehicleForm.model,
                    year: newVehicleForm.year ? parseInt(newVehicleForm.year) : null,
                    fuel_type: newVehicleForm.fuel_type,
                }
                await selectVehicle(vehicle)
                setShowNewVehicle(false)
            }
        })
    }

    // ── Step 3 handlers ──────────────────────────────────────

    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '')
        setEstimatedCost(val ? new Intl.NumberFormat('es-CO').format(parseInt(val)) : '')
    }

    const handleSubmit = async () => {
        if (!reportedIssue.trim()) return setFormError('El motivo de ingreso es obligatorio.')
        if (!selectedClient || !selectedVehicle) return
        setFormError(null)

        startTransition(async () => {
            const cost = estimatedCost ? parseFloat(estimatedCost.replace(/\D/g, '')) : undefined
            const res = await createServiceOrderAction({
                client_id: selectedClient.id,
                vehicle_id: selectedVehicle.id,
                reported_issue: reportedIssue,
                estimated_cost: cost,
                mechanic_id: selectedMechanic?.id,
                vehicle_brand: selectedVehicle.brand,
                vehicle_model: selectedVehicle.model,
                vehicle_year: selectedVehicle.year || undefined,
                vehicle_plate: selectedVehicle.plate,
            })

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

    // ── Step indicator ───────────────────────────────────────

    const steps = [
        { n: 1, label: 'Cliente', icon: User },
        { n: 2, label: 'Vehículo', icon: Car },
        { n: 3, label: 'Servicio', icon: Wrench },
    ]

    return (
        <>
            <div
                ref={backdropRef}
                className="fixed inset-0 z-[160] bg-black/50 backdrop-blur-sm"
                style={{ display: 'none' }}
                onClick={handleClose}
            />

            <div
                ref={drawerRef}
                className="fixed top-0 right-0 z-[170] h-full w-full sm:w-[520px] flex flex-col"
                style={{ transform: 'translateX(100%)' }}
            >
                <div className="flex flex-col h-full bg-zinc-950 border-l border-white/8 shadow-2xl overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/6 flex-shrink-0">
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">Nueva Orden de Servicio</h2>
                            <p className="text-zinc-500 text-xs mt-0.5">Ingreso de vehículo al taller</p>
                        </div>
                        <button onClick={handleClose} className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/8 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center gap-0 px-6 py-4 border-b border-white/5 flex-shrink-0">
                        {steps.map(({ n, label, icon: Icon }, i) => (
                            <div key={n} className="flex items-center gap-0 flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                                        ${step > n ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                                            : step === n ? 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                                                : 'bg-white/5 text-zinc-600 border border-white/8'}`}
                                    >
                                        {step > n ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                                    </div>
                                    <span className={`text-[10px] mt-1 font-medium transition-colors ${step === n ? 'text-white' : step > n ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                        {label}
                                    </span>
                                </div>
                                {i < steps.length - 1 && (
                                    <div className={`h-px flex-1 mb-4 transition-all duration-500 ${step > n ? 'bg-emerald-500/40' : 'bg-white/8'}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step content */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="step-content p-6 space-y-5">

                            {/* ── STEP 1: CLIENT ── */}
                            {step === 1 && (
                                <>
                                    <div>
                                        <p className="text-sm font-semibold text-white mb-1">¿A quién le pertenece el vehículo?</p>
                                        <p className="text-xs text-zinc-500 mb-4">Busca un cliente existente o crea uno nuevo.</p>

                                        {selectedClient ? (
                                            <div className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3">
                                                <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm font-bold text-emerald-400">{selectedClient.full_name.charAt(0)}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">{selectedClient.full_name}</p>
                                                    <p className="text-xs text-zinc-500">{selectedClient.phone || selectedClient.email || 'Sin contacto'}</p>
                                                </div>
                                                <button onClick={() => { setSelectedClient(null); setStep(1) }} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="relative mb-3">
                                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                                    {isSearching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 animate-spin" />}
                                                    <input
                                                        type="text"
                                                        placeholder="Buscar por nombre o teléfono..."
                                                        value={clientSearch}
                                                        onChange={(e) => setClientSearch(e.target.value)}
                                                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition-all"
                                                        autoFocus
                                                    />
                                                </div>

                                                {clientResults.length > 0 && (
                                                    <div className="bg-zinc-900 border border-white/8 rounded-xl overflow-hidden mb-3">
                                                        {clientResults.map((client, i) => (
                                                            <button
                                                                key={client.id}
                                                                onClick={() => selectClient(client)}
                                                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${i > 0 ? 'border-t border-white/5' : ''}`}
                                                            >
                                                                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                                                                    <span className="text-xs font-bold text-orange-400">{client.full_name.charAt(0)}</span>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium text-white truncate">{client.full_name}</p>
                                                                    <p className="text-xs text-zinc-500">{client.phone || client.email || ''}</p>
                                                                </div>
                                                                <ChevronRight className="w-4 h-4 text-zinc-600 ml-auto flex-shrink-0" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {!showNewClient && (
                                                    <button
                                                        onClick={() => setShowNewClient(true)}
                                                        className="w-full flex items-center gap-3 px-4 py-3 border border-dashed border-white/15 rounded-xl text-sm text-zinc-500 hover:text-white hover:border-white/30 hover:bg-white/[0.02] transition-all"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Crear nuevo cliente
                                                    </button>
                                                )}

                                                {showNewClient && (
                                                    <div className="bg-white/[0.02] border border-white/8 rounded-xl p-4 space-y-3">
                                                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nuevo cliente</p>
                                                        <input
                                                            type="text" placeholder="Nombre completo *"
                                                            value={newClientForm.full_name}
                                                            onChange={e => setNewClientForm(f => ({ ...f, full_name: e.target.value }))}
                                                            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/40 transition-all"
                                                        />
                                                        <input
                                                            type="tel" placeholder="Teléfono"
                                                            value={newClientForm.phone}
                                                            onChange={e => setNewClientForm(f => ({ ...f, phone: e.target.value }))}
                                                            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/40 transition-all"
                                                        />
                                                        <div className="flex gap-2 pt-1">
                                                            <button onClick={() => setShowNewClient(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-xs text-zinc-500 hover:text-white transition-colors">
                                                                Cancelar
                                                            </button>
                                                            <button
                                                                onClick={handleCreateClient}
                                                                disabled={!newClientForm.full_name.trim() || isPending}
                                                                className="flex-1 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                                                            >
                                                                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                                                Crear
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* ── STEP 2: VEHICLE ── */}
                            {step === 2 && selectedClient && (
                                <>
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-bold text-orange-400">{selectedClient.full_name.charAt(0)}</span>
                                            </div>
                                            <p className="text-sm font-semibold text-white">{selectedClient.full_name}</p>
                                        </div>

                                        <p className="text-xs text-zinc-500 mb-3">¿Qué vehículo va a ingresar?</p>

                                        {isLoadingVehicles ? (
                                            <div className="flex items-center justify-center py-10">
                                                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {vehicles.map(v => (
                                                    <button
                                                        key={v.id}
                                                        onClick={() => selectVehicle(v)}
                                                        className="w-full flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 hover:border-white/15 rounded-xl px-4 py-3.5 transition-all group text-left"
                                                    >
                                                        <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-white/8 flex items-center justify-center flex-shrink-0 group-hover:border-orange-500/30 transition-colors">
                                                            <Car className="w-4 h-4 text-zinc-500 group-hover:text-orange-400 transition-colors" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-white">{v.brand} {v.model} {v.year || ''}</p>
                                                            <p className="text-xs font-mono text-zinc-500 tracking-widest">{v.plate}</p>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-orange-400 transition-colors flex-shrink-0" />
                                                    </button>
                                                ))}

                                                {!showNewVehicle && (
                                                    <button
                                                        onClick={() => setShowNewVehicle(true)}
                                                        className="w-full flex items-center gap-3 px-4 py-3 border border-dashed border-white/15 rounded-xl text-sm text-zinc-500 hover:text-white hover:border-white/30 hover:bg-white/[0.02] transition-all"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        {vehicles.length === 0 ? 'Registrar primer vehículo' : 'Agregar otro vehículo'}
                                                    </button>
                                                )}

                                                {showNewVehicle && (
                                                    <div className="bg-white/[0.02] border border-white/8 rounded-xl p-4 space-y-3">
                                                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nuevo vehículo</p>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <input type="text" placeholder="Marca *" value={newVehicleForm.brand} onChange={e => setNewVehicleForm(f => ({ ...f, brand: e.target.value }))} className="col-span-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/40 transition-all" />
                                                            <input type="text" placeholder="Modelo *" value={newVehicleForm.model} onChange={e => setNewVehicleForm(f => ({ ...f, model: e.target.value }))} className="col-span-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/40 transition-all" />
                                                            <input type="text" placeholder="Placa *" value={newVehicleForm.plate} onChange={e => setNewVehicleForm(f => ({ ...f, plate: e.target.value.toUpperCase() }))} className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/40 transition-all uppercase" />
                                                            <input type="number" placeholder="Año" value={newVehicleForm.year} onChange={e => setNewVehicleForm(f => ({ ...f, year: e.target.value }))} className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/40 transition-all" />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {(['FI', 'Carburada'] as const).map(ft => (
                                                                <button key={ft} type="button" onClick={() => setNewVehicleForm(f => ({ ...f, fuel_type: ft }))}
                                                                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${newVehicleForm.fuel_type === ft ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-white/[0.03] border-white/8 text-zinc-500 hover:text-zinc-300'}`}>
                                                                    {ft}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-2 pt-1">
                                                            <button onClick={() => setShowNewVehicle(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-xs text-zinc-500 hover:text-white transition-colors">Cancelar</button>
                                                            <button onClick={handleCreateVehicle} disabled={!newVehicleForm.plate.trim() || !newVehicleForm.brand.trim() || !newVehicleForm.model.trim() || isPending}
                                                                className="flex-1 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                                                                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                                                Registrar
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* ── STEP 3: SERVICE ── */}
                            {step === 3 && selectedClient && selectedVehicle && (
                                <>
                                    {/* Summary bar */}
                                    <div className="flex items-center gap-2 bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3">
                                        <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-bold text-orange-400">{selectedClient.full_name.charAt(0)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-white truncate">{selectedClient.full_name}</p>
                                            <p className="text-xs text-zinc-500 font-mono">{selectedVehicle.brand} {selectedVehicle.model} · {selectedVehicle.plate}</p>
                                        </div>
                                    </div>

                                    {/* Reported Issue */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <PenTool className="w-3.5 h-3.5" /> Motivo de ingreso *
                                        </label>
                                        <textarea
                                            rows={3}
                                            placeholder="Ej. Cambio de aceite, revisión de frenos, no enciende..."
                                            value={reportedIssue}
                                            onChange={e => setReportedIssue(e.target.value)}
                                            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 transition-all resize-none"
                                        />
                                    </div>

                                    {/* Mechanic assignment */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <UserCog className="w-3.5 h-3.5" /> Asignar mecánico
                                        </label>
                                        {mechanics.length === 0 ? (
                                            <p className="text-xs text-zinc-600 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3">
                                                No hay mecánicos activos. Agrega mecánicos en la sección Empleados.
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-2">
                                                <button
                                                    onClick={() => setSelectedMechanic(null)}
                                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm transition-all text-left
                                                        ${!selectedMechanic ? 'bg-zinc-800 border-white/15 text-zinc-300' : 'bg-white/[0.02] border-white/8 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'}`}
                                                >
                                                    <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                                                        <UserCog className="w-3.5 h-3.5 text-zinc-400" />
                                                    </div>
                                                    <span>Sin asignar (asignar luego)</span>
                                                    {!selectedMechanic && <Check className="w-4 h-4 text-zinc-400 ml-auto flex-shrink-0" />}
                                                </button>
                                                {mechanics.map(m => (
                                                    <button
                                                        key={m.id}
                                                        onClick={() => setSelectedMechanic(m)}
                                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm transition-all text-left
                                                            ${selectedMechanic?.id === m.id ? 'bg-orange-500/10 border-orange-500/30 text-orange-300' : 'bg-white/[0.02] border-white/8 text-zinc-300 hover:bg-white/[0.05] hover:border-white/15'}`}
                                                    >
                                                        <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-xs font-bold text-orange-400">{m.full_name.charAt(0)}</span>
                                                        </div>
                                                        <span className="flex-1 truncate">{m.full_name}</span>
                                                        {selectedMechanic?.id === m.id && <Check className="w-4 h-4 text-orange-400 flex-shrink-0" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Estimated cost */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <DollarSign className="w-3.5 h-3.5" /> Presupuesto estimado (COP)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">$</span>
                                            <input
                                                type="text"
                                                placeholder="0"
                                                value={estimatedCost}
                                                onChange={handleCostChange}
                                                className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-14 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 transition-all"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-xs font-bold">COP</span>
                                        </div>
                                    </div>

                                    {formError && (
                                        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-sm text-rose-400">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                            {formError}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Footer navigation */}
                    <div className="flex-shrink-0 px-6 py-4 border-t border-white/6 flex gap-3">
                        {step > 1 && (
                            <button
                                onClick={() => { setStep((step - 1) as Step); setTimeout(animateStep, 50) }}
                                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all font-medium active:scale-95"
                            >
                                <ChevronLeft className="w-4 h-4" /> Atrás
                            </button>
                        )}
                        {step === 3 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={isPending || !reportedIssue.trim()}
                                className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-all shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</> : <><Wrench className="w-4 h-4" /> Crear Orden y Generar Ticket</>}
                            </button>
                        ) : (
                            step === 1 && selectedClient && (
                                <button
                                    onClick={() => { setStep(2); setTimeout(animateStep, 50) }}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-sm font-semibold text-white transition-all active:scale-95"
                                >
                                    Seleccionar vehículo <ChevronRight className="w-4 h-4" />
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Print Ticket Modal */}
            <PrintTicketModal
                open={showTicket}
                onClose={() => setShowTicket(false)}
                data={ticketData}
            />
        </>
    )
}
