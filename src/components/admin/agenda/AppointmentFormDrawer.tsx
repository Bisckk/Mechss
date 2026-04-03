'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { gsap } from 'gsap'
import { X, CalendarIcon, Clock, User, Car, FileText, Search, Plus, CheckCircle2, ChevronRight, AlertCircle, ChevronLeft, ChevronDown, Zap, Thermometer, AlertOctagon, Loader2 } from 'lucide-react'
import {
    searchClientsAction,
    getRecentClientsAction,
    createClientAction,
    getClientVehiclesAction,
    createVehicleAction,
    createAppointmentAction,
} from '@/lib/actions/admin'

// --- Types ---
type DbClient = { id: string; full_name: string; email: string | null; phone: string | null }
type DbVehicle = { id: string; plate: string; brand: string; model: string; year: number | null; fuel_type: 'FI' | 'Carburada' | null }

export const MOTORCYCLE_CATALOG: Record<string, string[]> = {
    'Yamaha': ['NMAX', 'BWS 125', 'FZ 25', 'FZ 150', 'MT-09', 'MT-07', 'MT-03', 'MT-15', 'XTZ 125', 'XTZ 150', 'XTZ 250', 'R15', 'R3', 'R6', 'Crypton'],
    'Honda': ['CB 125F', 'CB 190R', 'XR 150L', 'XR 190L', 'Tornado 250', 'XRE 300', 'PCX 150', 'CBR 600RR', 'CBR 1000RR', 'Navi', 'Wave 110S', 'CB 500X', 'XR 300L'],
    'Suzuki': ['DR 150', 'Gixxer 150', 'Gixxer 250', 'V-Strom 250', 'V-Strom 650', 'V-Strom 1050', 'GSX-R150', 'GN 125', 'AX 4', 'Vivax 115'],
    'Bajaj': ['Boxer CT 100', 'Boxer 150', 'Pulsar NS 200', 'Pulsar NS 160', 'Pulsar RS 200', 'Dominar 400', 'Dominar 250', 'Discover 125'],
    'AKT': ['NKD 125', 'CR4 125', 'CR5 200', 'TT Dual Sport 200', 'Dynamic Pro 125', 'Flex 125', 'Evo NE'],
    'TVS': ['Apache RTR 160', 'Apache RTR 200', 'Raider 125', 'Sport 100', 'Ntorq 125'],
    'Hero': ['Eco Deluxe', 'Splendor', 'Ignitor 125', 'Hunk 160R', 'Hunk 150', 'Xpulse 200'],
    'KTM': ['Duke 200', 'Duke 250', 'Duke 390', 'RC 200', 'RC 390', 'Adventure 250', 'Adventure 390'],
    'Husqvarna': ['Svartpilen 200', 'Svartpilen 401', 'Vitpilen 401'],
    'Royal Enfield': ['Himalayan 411', 'Meteor 350', 'Classic 350', 'Interceptor 650', 'Continental GT 650'],
    'Kawasaki': ['Ninja 400', 'Ninja 650', 'Z400', 'Z650', 'Z900', 'Versys 300', 'Versys 650', 'KLR 650'],
    'BMW': ['G 310 R', 'G 310 GS', 'F 750 GS', 'F 850 GS', 'R 1250 GS', 'R 1300 GS', 'S 1000 RR'],
    'Ducati': ['Scrambler', 'Monster', 'Multistrada', 'Panigale'],
    'Victory': ['Blackline', 'Bomber 125', 'MRX 125', 'MRX 150', 'Zontes 310'],
    'Kymco': ['Agility 125', 'Agility 150', 'Twist 125'],
    'SYM': ['Crox 125', 'Crox 150', 'NHX 190'],
    'Vespa': ['Primavera 150', 'GTS 300', 'Sprint 150'],
}
export const COLOMBIA_BRANDS = Object.keys(MOTORCYCLE_CATALOG)

const COMMON_REASONS = [
    "Cambio de aceite y filtro",
    "Cambio de pastillas de freno",
    "Mantenimiento general",
    "Mantenimiento preventivo",
    "Revisión de sistema eléctrico",
    "Sincronización de cuerpo de aceleración",
    "Sincronización de carburador",
    "Cambio de kit de arrastre",
    "Parcheo y rotación de llantas",
    "Revisión de motor por sonidos anormales",
    "Revisión general de frenos",
    "Cambio de líquido refrigerante",
    "Revisión y cambio de fluidos",
    "Ajuste de guayas y comandos"
]

const TIME_SLOTS: string[] = []
for (let h = 8; h <= 18; h++) {
    TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`)
    TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`)
}

interface Props {
    isOpen: boolean
    onClose: () => void
    initialDate?: Date
    onSave?: (appt: any) => void
}

export default function AppointmentFormDrawer({ isOpen, onClose, initialDate, onSave }: Props) {
    const backdropRef = useRef<HTMLDivElement>(null)
    const modalRef = useRef<HTMLDivElement>(null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    // --- States ---
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Client State
    const [clientSearch, setClientSearch] = useState('')
    const [selectedClient, setSelectedClient] = useState<DbClient | null>(null)
    const [isCreatingClient, setIsCreatingClient] = useState(false)
    const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', document: '', address: '' })

    // Vehicle State
    const [selectedVehicle, setSelectedVehicle] = useState<DbVehicle | null>(null)
    const [isCreatingVehicle, setIsCreatingVehicle] = useState(false)
    type NewVehicleType = { plate: string; brand: string; model: string; year: string; fuelType: 'FI' | 'Carburada' }
    const [newVehicle, setNewVehicle] = useState<NewVehicleType>({ plate: '', brand: '', model: '', year: new Date().getFullYear().toString(), fuelType: 'FI' })

    // Custom Dropdown States
    const [brandSearch, setBrandSearch] = useState('')
    const [brandOpen, setBrandOpen] = useState(false)
    const [modelSearch, setModelSearch] = useState('')
    const [modelOpen, setModelOpen] = useState(false)

    // Appt State
    const [apptData, setApptData] = useState({ date: new Date(), time: '09:00', reason: '' })
    const [showCalendar, setShowCalendar] = useState(false)
    const [showTimePicker, setShowTimePicker] = useState(false)

    const showError = (msg: string) => {
        setErrorMsg(msg)
        setTimeout(() => setErrorMsg(null), 4000)
    }

    // Derived Dropdowns
    const filteredBrands = useMemo(() => {
        const term = brandSearch.toLowerCase()
        return COLOMBIA_BRANDS.filter(b => b.toLowerCase().includes(term))
    }, [brandSearch])

    const filteredModels = useMemo(() => {
        if (!newVehicle.brand || !MOTORCYCLE_CATALOG[newVehicle.brand]) return []
        const term = modelSearch.toLowerCase()
        return MOTORCYCLE_CATALOG[newVehicle.brand].filter(m => m.toLowerCase().includes(term))
    }, [modelSearch, newVehicle.brand])

    // Inline ghost text prediction — works on the last segment (after last comma/newline)
    // so it keeps predicting even if the user already wrote several items
    const ghostSuggestion = useMemo(() => {
        const text = apptData.reason
        if (!text.trim()) return ''

        // Isolate the active segment: text after the last comma or newline
        const parts = text.split(/[,\n]/)
        const lastSegment = parts[parts.length - 1].trimStart()

        if (lastSegment.trim().length < 2) return ''

        const lower = lastSegment.toLowerCase()
        const match = COMMON_REASONS.find(r => r.toLowerCase().startsWith(lower))
        if (!match) return ''

        return match.slice(lastSegment.length)
    }, [apptData.reason])

    const handleReasonKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab' && ghostSuggestion) {
            e.preventDefault()
            // Accept one word at a time: consume leading spaces + the next word
            const nextWord = ghostSuggestion.match(/^(\s*\S+)/)
            const toAccept = nextWord ? nextWord[1] : ghostSuggestion
            setApptData({ ...apptData, reason: apptData.reason + toAccept })
        }
    }

    // --- Reset Form ---
    const resetForm = () => {
        setStep(1)
        setClientSearch('')
        setSelectedClient(null)
        setIsCreatingClient(false)
        setNewClient({ name: '', email: '', phone: '', document: '', address: '' })
        setSelectedVehicle(null)
        setIsCreatingVehicle(false)
        setNewVehicle({ plate: '', brand: '', model: '', year: new Date().getFullYear().toString(), fuelType: 'FI' })
        setBrandSearch(''); setBrandOpen(false)
        setModelSearch(''); setModelOpen(false)
        setApptData({ date: new Date(), time: '09:00', reason: '' })
        setShowCalendar(false); setShowTimePicker(false)
        setErrorMsg(null)
    }

    // --- Effects ---
    useEffect(() => {
        if (initialDate && isOpen) {
            const h = initialDate.getHours().toString().padStart(2, '0') + ':00'
            const nearestTime = TIME_SLOTS.includes(h) ? h : '09:00'
            setApptData(f => ({ ...f, date: initialDate, time: nearestTime }))
        }
    }, [initialDate, isOpen])

    useEffect(() => {
        const backdrop = backdropRef.current
        const modal = modalRef.current
        if (!backdrop || !modal) return

        if (isOpen) {
            gsap.set(backdrop, { display: 'flex', opacity: 0 })
            gsap.set(modal, { opacity: 0, scale: 0.95, y: 15 })
            gsap.to(backdrop, { opacity: 1, duration: 0.3, ease: 'power2.out' })
            gsap.to(modal, { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.2)', delay: 0.05 })
        } else {
            gsap.to(modal, { opacity: 0, scale: 0.95, y: -10, duration: 0.25, ease: 'power2.in' })
            gsap.to(backdrop, { opacity: 0, duration: 0.3, delay: 0.1, onComplete: () => { gsap.set(backdrop, { display: 'none' }); resetForm() } })
        }
    }, [isOpen])

    // Custom Date Picker Math
    const currentMonthDate = new Date(apptData.date.getFullYear(), apptData.date.getMonth(), 1)
    const daysInMonth = new Date(apptData.date.getFullYear(), apptData.date.getMonth() + 1, 0).getDate()
    let firstDay = currentMonthDate.getDay()
    firstDay = firstDay === 0 ? 6 : firstDay - 1
    const blanks = Array.from({ length: firstDay }, (_, i) => i)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    const handleNextMonth = () => setApptData({ ...apptData, date: new Date(apptData.date.getFullYear(), apptData.date.getMonth() + 1, apptData.date.getDate()) })
    const handlePrevMonth = () => setApptData({ ...apptData, date: new Date(apptData.date.getFullYear(), apptData.date.getMonth() - 1, apptData.date.getDate()) })

    // --- DB Search State ---
    const [filteredClients, setFilteredClients] = useState<DbClient[]>([])
    const [recentClients, setRecentClients] = useState<DbClient[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [clientVehicles, setClientVehicles] = useState<DbVehicle[]>([])
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(false)

    // Per-session vehicle cache: clientId → vehicles[]
    // Avoids re-fetching the same client twice and makes hover-prefetch instant on click
    const vehicleCache = useRef<Map<string, DbVehicle[]>>(new Map())

    // Load recent clients once — they don't change between drawer opens
    useEffect(() => {
        if (isOpen && recentClients.length === 0) {
            (async () => {
                setIsSearching(true)
                const res = await getRecentClientsAction()
                if (res.ok) setRecentClients(res.data as DbClient[])
                setIsSearching(false)
            })()
        }
    }, [isOpen])

    // Debounced client search
    useEffect(() => {
        if (!clientSearch || clientSearch.length < 2) { setFilteredClients([]); return }
        const timer = setTimeout(async () => {
            setIsSearching(true)
            const res = await searchClientsAction(clientSearch)
            if (res.ok) setFilteredClients(res.data as DbClient[])
            setIsSearching(false)
        }, 300)
        return () => clearTimeout(timer)
    }, [clientSearch])

    // Prefetch vehicles for a client (on hover). Stores result in cache.
    const prefetchVehicles = useCallback(async (clientId: string) => {
        if (vehicleCache.current.has(clientId)) return
        const res = await getClientVehiclesAction(clientId)
        if (res.ok) vehicleCache.current.set(clientId, res.data as DbVehicle[])
    }, [])

    // Load vehicles when a client is selected — instant if already cached from hover
    useEffect(() => {
        if (!selectedClient) { setClientVehicles([]); return }
        const cached = vehicleCache.current.get(selectedClient.id)
        if (cached) {
            setClientVehicles(cached)
            return
        }
        setIsLoadingVehicles(true)
        getClientVehiclesAction(selectedClient.id).then(res => {
            if (res.ok) {
                const vehicles = res.data as DbVehicle[]
                vehicleCache.current.set(selectedClient.id, vehicles)
                setClientVehicles(vehicles)
            }
            setIsLoadingVehicles(false)
        })
    }, [selectedClient])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!apptData.reason.trim()) return showError('El motivo es obligatorio')
        setIsSubmitting(true)

        try {
            // 1. Ensure we have a DB client
            let clientId = selectedClient?.id || ''
            let clientDisplayName = selectedClient?.full_name || ''
            if (!clientId && isCreatingClient) {
                // The client was created inline — we need to persist it
                // (Already done in step 1 validation → stored as selectedClient)
                return showError('Seleccione o cree un cliente primero')
            }

            // 2. Build vehicle info string
            const vehicleInfo = selectedVehicle
                ? `${selectedVehicle.brand} ${selectedVehicle.model}`
                : `${newVehicle.brand} ${newVehicle.model}`

            // 3. Build scheduled_at datetime
            const [hours, minutes] = apptData.time.split(':').map(Number)
            const scheduledDate = new Date(apptData.date.getFullYear(), apptData.date.getMonth(), apptData.date.getDate(), hours, minutes)

            // 4. Create appointment in DB
            const apptRes = await createAppointmentAction({
                client_id: clientId,
                vehicle_id: selectedVehicle?.id || null,
                vehicle_info: vehicleInfo,
                title: apptData.reason,
                description: apptData.reason,
                scheduled_at: scheduledDate.toISOString(),
                status: 'pending',
            })

            if (!apptRes.ok) {
                showError(apptRes.error)
                setIsSubmitting(false)
                return
            }

            // 5. Update local calendar view immediately
            if (onSave) {
                onSave({
                    id: apptRes.data.id,
                    clientName: clientDisplayName,
                    vehicle: vehicleInfo,
                    date: scheduledDate,
                    reason: apptData.reason,
                    status: 'pending',
                })
            }

            setIsSubmitting(false)
            onClose()
        } catch (err: any) {
            showError(err.message || 'Error inesperado')
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <div
                ref={backdropRef} style={{ display: 'none' }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6"
            // User requested NOT to close when clicking outside. So removed onClick={onClose} here.
            >
                <div
                    ref={modalRef}
                    className="relative w-full max-w-[550px] max-h-[90vh] bg-zinc-950 border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.6)] flex flex-col pt-1"
                >
                    {/* Error Notification Toast */}
                    <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[110] transition-all duration-300 pointer-events-none ${errorMsg ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                        <div className="bg-red-500/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-red-500/50 flex items-center gap-2 shadow-xl shadow-red-500/20">
                            <AlertOctagon className="w-4 h-4 text-white" />
                            <span className="text-sm font-bold text-white tracking-wide">{errorMsg}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-6 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md shrink-0 rounded-t-2xl">
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Agendar Cita</h2>
                            <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-zinc-500">
                                <span className={step >= 1 ? 'text-orange-400' : ''}>Cliente</span>
                                <ChevronRight className="w-3 h-3" />
                                <span className={step >= 2 ? 'text-blue-400' : ''}>Vehículo</span>
                                <ChevronRight className="w-3 h-3" />
                                <span className={step >= 3 ? 'text-emerald-400' : ''}>Detalles</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 -mr-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors focus:outline-none"><X className="w-5 h-5" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 scrollbar-none space-y-8 relative">

                        {/* STEP 1: CLIENT SELECTION */}
                        <div className={`transition-all duration-300 ${step !== 1 && selectedClient ? 'opacity-60 hover:opacity-100' : ''}`}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5 text-orange-400" />
                                    </div>
                                    1. Datos del Cliente
                                </h3>
                                {selectedClient && (
                                    <button onClick={() => { setSelectedClient(null); setSelectedVehicle(null); setClientVehicles([]); setStep(1); setClientSearch(''); }} className="text-[11px] text-orange-400/80 hover:text-orange-300 font-semibold px-2 py-1 rounded-md hover:bg-orange-500/10 transition-all">
                                        Cambiar
                                    </button>
                                )}
                            </div>

                            {selectedClient ? (
                                <div className="bg-gradient-to-r from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-xl p-4 flex items-center gap-3 shadow-lg shadow-orange-500/5">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 text-sm font-black shrink-0">
                                        {selectedClient.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{selectedClient.full_name}</p>
                                        <p className="text-xs text-orange-200/60 truncate">{selectedClient.phone}{selectedClient.email ? ` • ${selectedClient.email}` : ''}</p>
                                    </div>
                                    <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Search Bar */}
                                    <div className="relative group/search">
                                        <Search className="w-4 h-4 text-zinc-500 group-focus-within/search:text-orange-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                                        <input
                                            type="text" placeholder="Buscar por nombre o teléfono..." value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/40 focus:shadow-[0_0_12px_rgba(249,115,22,0.06)] transition-all placeholder:text-zinc-600"
                                        />
                                    </div>

                                    {isSearching && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-orange-400 animate-spin" /></div>}

                                    {/* Search results */}
                                    {!isSearching && clientSearch.length >= 2 && filteredClients.length > 0 && (
                                        <div className="rounded-xl overflow-hidden border border-white/5 animate-in slide-in-from-top-2 divide-y divide-white/[0.03]">
                                            {filteredClients.map((c, i) => {
                                                const colors = ['orange', 'blue', 'emerald', 'violet', 'rose', 'cyan'];
                                                const color = colors[c.full_name.charCodeAt(0) % colors.length];
                                                return (
                                                    <div key={c.id} onClick={() => { setSelectedClient(c); setStep(2); }} onMouseEnter={() => prefetchVehicles(c.id)}
                                                        className="px-3 py-3 bg-zinc-900/70 hover:bg-zinc-800/80 cursor-pointer transition-all flex items-center gap-3 group border-l-2 border-transparent hover:border-orange-500"
                                                    >
                                                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color === 'orange' ? 'from-orange-500/30 to-amber-600/20' : color === 'blue' ? 'from-blue-500/30 to-indigo-600/20' : color === 'emerald' ? 'from-emerald-500/30 to-teal-600/20' : color === 'violet' ? 'from-violet-500/30 to-purple-600/20' : color === 'rose' ? 'from-rose-500/30 to-pink-600/20' : 'from-cyan-500/30 to-sky-600/20'} flex items-center justify-center shrink-0 shadow-inner`}>
                                                            <span className={`text-xs font-black ${color === 'orange' ? 'text-orange-300' : color === 'blue' ? 'text-blue-300' : color === 'emerald' ? 'text-emerald-300' : color === 'violet' ? 'text-violet-300' : color === 'rose' ? 'text-rose-300' : 'text-cyan-300'}`}>{c.full_name.charAt(0).toUpperCase()}</span>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-[13px] font-semibold text-white group-hover:text-orange-300 transition-colors truncate leading-tight">{c.full_name}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                {c.phone && <span className="text-[11px] text-zinc-500 truncate">{c.phone}</span>}
                                                                {c.email && <span className="text-[11px] text-zinc-600 truncate hidden sm:inline">• {c.email}</span>}
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* No results */}
                                    {!isSearching && clientSearch.length >= 2 && filteredClients.length === 0 && (
                                        <div className="text-center p-6 bg-zinc-900/60 border border-white/5 rounded-xl animate-in slide-in-from-top-2">
                                            <div className="w-12 h-12 rounded-full bg-zinc-800/80 border border-white/5 flex items-center justify-center mx-auto mb-3">
                                                <User className="w-5 h-5 text-zinc-600" />
                                            </div>
                                            <p className="text-xs text-zinc-400 mb-1">No se encontró ningún cliente.</p>
                                            <p className="text-[11px] text-zinc-600 mb-4">¿Deseas registrarlo?</p>
                                            <button onClick={() => { setIsCreatingClient(true); setNewClient(prev => ({ ...prev, name: clientSearch })) }} className="bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 text-sm font-semibold px-5 py-2.5 rounded-xl border border-orange-500/20 hover:border-orange-500/40 inline-flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-orange-500/5">
                                                <Plus className="w-4 h-4" /> Crear "{clientSearch}"
                                            </button>
                                        </div>
                                    )}

                                    {/* Recent clients */}
                                    {!isSearching && clientSearch.length < 2 && recentClients.length > 0 && (
                                        <div className="animate-in fade-in">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-2.5 ml-0.5 flex items-center gap-1.5">
                                                <span className="w-1 h-1 rounded-full bg-orange-500/60"></span>
                                                Clientes recientes
                                            </p>
                                            <div className="rounded-xl overflow-hidden border border-white/5 divide-y divide-white/[0.03]">
                                                {recentClients.map(c => {
                                                    const colors = ['orange', 'blue', 'emerald', 'violet', 'rose', 'cyan'];
                                                    const color = colors[c.full_name.charCodeAt(0) % colors.length];
                                                    return (
                                                        <div key={c.id} onClick={() => { setSelectedClient(c); setStep(2); }} onMouseEnter={() => prefetchVehicles(c.id)}
                                                            className="px-3 py-3 bg-zinc-900/50 hover:bg-zinc-800/70 cursor-pointer transition-all flex items-center gap-3 group border-l-2 border-transparent hover:border-orange-500"
                                                        >
                                                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color === 'orange' ? 'from-orange-500/30 to-amber-600/20' : color === 'blue' ? 'from-blue-500/30 to-indigo-600/20' : color === 'emerald' ? 'from-emerald-500/30 to-teal-600/20' : color === 'violet' ? 'from-violet-500/30 to-purple-600/20' : color === 'rose' ? 'from-rose-500/30 to-pink-600/20' : 'from-cyan-500/30 to-sky-600/20'} flex items-center justify-center shrink-0 shadow-inner`}>
                                                                <span className={`text-xs font-black ${color === 'orange' ? 'text-orange-300' : color === 'blue' ? 'text-blue-300' : color === 'emerald' ? 'text-emerald-300' : color === 'violet' ? 'text-violet-300' : color === 'rose' ? 'text-rose-300' : 'text-cyan-300'}`}>{c.full_name.charAt(0).toUpperCase()}</span>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-[13px] font-semibold text-white group-hover:text-orange-300 transition-colors truncate leading-tight">{c.full_name}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    {c.phone && <span className="text-[11px] text-zinc-500 truncate">{c.phone}</span>}
                                                                    {c.email && <span className="text-[11px] text-zinc-600 truncate hidden sm:inline">• {c.email}</span>}
                                                                </div>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* New client button */}
                                    <button onClick={() => setIsCreatingClient(true)} className="w-full bg-zinc-900/40 border border-dashed border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 text-zinc-500 hover:text-orange-400 rounded-xl py-3.5 flex items-center justify-center gap-2.5 transition-all group">
                                        <div className="w-6 h-6 rounded-full bg-white/5 group-hover:bg-orange-500/15 flex items-center justify-center transition-colors">
                                            <Plus className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-xs font-semibold">Registrar Nuevo Cliente</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* STEP 2: VEHICLE SELECTION */}
                        {step >= 2 && (
                            <div className={`transition-all duration-300 ${step !== 2 && selectedVehicle ? 'opacity-60 hover:opacity-100' : ''}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <Car className="w-3.5 h-3.5 text-blue-400" />
                                        </div>
                                        2. Selección de Vehículo
                                    </h3>
                                    {selectedVehicle && (
                                        <button onClick={() => { setSelectedVehicle(null); setStep(2); }} className="text-[11px] text-blue-400/80 hover:text-blue-300 font-semibold px-2 py-1 rounded-md hover:bg-blue-500/10 transition-all">
                                            Cambiar
                                        </button>
                                    )}
                                </div>

                                {selectedVehicle ? (
                                    <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3 shadow-lg shadow-blue-500/5 animate-in fade-in">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                                            <Car className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs font-black tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded uppercase border border-blue-500/30">{selectedVehicle.plate}</span>
                                                <span className="text-[10px] font-bold tracking-wider bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-white/5">{selectedVehicle.year}</span>
                                                <span className={`text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded border ${selectedVehicle.fuel_type === 'FI' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                    {selectedVehicle.fuel_type}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-white truncate">{selectedVehicle.brand} {selectedVehicle.model}</p>
                                        </div>
                                        <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                                    </div>
                                ) : (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        {clientVehicles.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-2">
                                                {isLoadingVehicles ? (
                                                    <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 text-blue-400 animate-spin" /></div>
                                                ) : clientVehicles.map((v) => (
                                                    <div key={v.id} onClick={() => { setSelectedVehicle(v); setStep(3); }} className="bg-black/40 border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 rounded-xl p-3 cursor-pointer flex justify-between items-center group transition-all">
                                                        <div>
                                                            <div className="flex gap-2 items-center mb-0.5">
                                                                <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase">{v.plate}</p>
                                                                <span className="text-[10px] font-bold tracking-wider bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-white/5">{v.year}</span>
                                                                <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded border ${v.fuel_type === 'FI' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                                    {v.fuel_type}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-zinc-500">{v.brand} {v.model}</p>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                                                    </div>
                                                ))}
                                                <button onClick={() => setIsCreatingVehicle(true)} className="w-full mt-1 border border-dashed border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 text-zinc-500 hover:text-blue-400 rounded-xl py-3 flex justify-center items-center gap-2 transition-all text-xs font-semibold">
                                                    <Plus className="w-4 h-4" /> Añadir otro vehículo
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 bg-zinc-900/60 border border-white/5 rounded-xl">
                                                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center mx-auto mb-3">
                                                    <Car className="w-4 h-4 text-zinc-600" />
                                                </div>
                                                <p className="text-xs text-zinc-400 mb-3">Este cliente aún no tiene vehículos.</p>
                                                <button onClick={() => setIsCreatingVehicle(true)} className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-semibold px-4 py-2 rounded-lg border border-blue-500/20 inline-flex items-center gap-1.5 transition-colors">
                                                    <Plus className="w-3.5 h-3.5" /> Añadir Vehículo
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STEP 3: APPOINTMENT DETAILS */}
                        {step >= 3 && (
                            <div className="animate-in fade-in slide-in-from-top-2 relative z-0">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                        <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
                                    </div>
                                    3. Detalles de la Cita
                                </h3>

                                <form id="appointment-form" onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">

                                        {/* Custom Date Picker */}
                                        <div className="space-y-1.5 relative">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Fecha de ingreso</label>
                                            <button
                                                type="button"
                                                onClick={() => { setShowCalendar(!showCalendar); setShowTimePicker(false) }}
                                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all flex items-center justify-between group hover:bg-black/60 shadow-inner"
                                            >
                                                <span>{apptData.date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                <CalendarIcon className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                                            </button>

                                            {/* Calendar Dropdown */}
                                            {showCalendar && (
                                                <div className="absolute top-[65px] left-0 w-[280px] bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-white/10 rounded"><ChevronLeft className="w-4 h-4 text-zinc-400" /></button>
                                                        <span className="text-xs font-bold text-white uppercase tracking-widest">{currentMonthDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</span>
                                                        <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-white/10 rounded"><ChevronRight className="w-4 h-4 text-zinc-400" /></button>
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                                                        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => <span key={d} className="text-[10px] font-bold text-zinc-500">{d}</span>)}
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1">
                                                        {blanks.map(b => <div key={`blank-${b}`} className="w-8 h-8"></div>)}
                                                        {days.map(d => {
                                                            const isSelected = apptData.date.getDate() === d && apptData.date.getMonth() === currentMonthDate.getMonth() && apptData.date.getFullYear() === currentMonthDate.getFullYear()
                                                            const dateObj = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), d)
                                                            return (
                                                                <button
                                                                    key={d} type="button"
                                                                    onClick={() => { setApptData({ ...apptData, date: dateObj }); setShowCalendar(false) }}
                                                                    className={`w-8 h-8 flex justify-center items-center text-xs font-medium rounded-full transition-all ${isSelected ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-zinc-300 hover:bg-white/10'}`}
                                                                >
                                                                    {d}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Custom Time Picker */}
                                        <div className="space-y-1.5 relative">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Hora esperada</label>
                                            <button
                                                type="button"
                                                onClick={() => { setShowTimePicker(!showTimePicker); setShowCalendar(false) }}
                                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all flex items-center justify-between group hover:bg-black/60 shadow-inner"
                                            >
                                                <span className="font-semibold">{apptData.time}</span>
                                                <Clock className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                                            </button>

                                            {/* Time Dropdown */}
                                            {showTimePicker && (
                                                <div className="absolute top-[65px] right-0 w-[180px] max-h-[220px] overflow-y-auto bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 scrollbar-none">
                                                    <div className="grid grid-cols-2 gap-1">
                                                        {TIME_SLOTS.map(time => (
                                                            <button
                                                                key={time} type="button"
                                                                onClick={() => { setApptData({ ...apptData, time }); setShowTimePicker(false) }}
                                                                className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all ${apptData.time === time ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                                                            >
                                                                {time}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 relative z-10 w-full">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5" /> Motivo Principal
                                        </label>

                                        {/* Textarea with inline ghost text */}
                                        <div className="relative bg-zinc-900 shadow-inner border border-white/10 rounded-xl focus-within:border-emerald-500/50 transition-all">
                                            {/* Ghost text layer — renders behind the textarea */}
                                            <div
                                                aria-hidden="true"
                                                className="absolute inset-0 px-4 py-3 text-sm leading-5 whitespace-pre-wrap break-words pointer-events-none select-none overflow-hidden rounded-xl"
                                            >
                                                <span className="text-transparent">{apptData.reason}</span>
                                                <span className="text-zinc-500">{ghostSuggestion}</span>
                                            </div>

                                            <textarea
                                                required rows={3} value={apptData.reason}
                                                onChange={e => setApptData({ ...apptData, reason: e.target.value })}
                                                onKeyDown={handleReasonKeyDown}
                                                placeholder={ghostSuggestion ? '' : 'Ej. Revisión de frenos, Ruidos rápidos...'}
                                                className="relative w-full bg-transparent border-0 rounded-xl px-4 py-3 text-sm leading-5 text-white focus:outline-none resize-none placeholder:text-zinc-600 block"
                                                style={{ caretColor: 'white' }}
                                            />
                                        </div>
                                        {ghostSuggestion && (
                                            <p className="text-[10px] text-zinc-600 mt-1 ml-1">
                                                Tab → siguiente palabra
                                            </p>
                                        )}

                                    </div>
                                </form>
                            </div>
                        )}

                    </div>

                    {/* Action Footer */}
                    <div className="p-6 border-t border-white/5 bg-zinc-950/90 backdrop-blur-md flex gap-3 shrink-0 rounded-b-2xl">
                        <button
                            type="button" onClick={onClose}
                            className="w-1/3 px-4 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 active:scale-[0.98] transition-all text-sm shadow-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            form="appointment-form" type="submit"
                            disabled={isSubmitting || step < 3}
                            className="flex-1 px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm"
                        >
                            {isSubmitting ? (
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                            ) : "Confirmar Cita"}
                        </button>
                    </div>
                </div>
            </div>
            {/* ══════════════════════════════════════════════════════════════ */}
            {/* MODAL: CREAR NUEVO CLIENTE                                   */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {isCreatingClient && (
                <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                            <div>
                                <h3 className="text-white font-bold text-lg">Registrar Nuevo Cliente</h3>
                                <p className="text-xs text-zinc-500 mt-0.5">Se vinculará automáticamente al módulo de clientes.</p>
                            </div>
                            <button onClick={() => setIsCreatingClient(false)} className="text-zinc-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-zinc-400 mb-1.5 block uppercase tracking-wider">Nombre completo *</label>
                                <input type="text" placeholder="Ej: Juan Pérez" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-orange-500/50 outline-none transition-colors" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 mb-1.5 block uppercase tracking-wider">Teléfono *</label>
                                    <input type="tel" placeholder="3101234567" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-orange-500/50 outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 mb-1.5 block uppercase tracking-wider">Correo <span className="text-zinc-600">(Opc)</span></label>
                                    <input type="email" placeholder="correo@mail.com" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-orange-500/50 outline-none transition-colors" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 mb-1.5 block uppercase tracking-wider">Identificación <span className="text-zinc-600">(Opc)</span></label>
                                    <input type="text" placeholder="CC / NIT" value={newClient.document} onChange={e => setNewClient({ ...newClient, document: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-orange-500/50 outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 mb-1.5 block uppercase tracking-wider">Dirección <span className="text-zinc-600">(Opc)</span></label>
                                    <input type="text" placeholder="Calle 1 #2-3" value={newClient.address} onChange={e => setNewClient({ ...newClient, address: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-orange-500/50 outline-none transition-colors" />
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-400 text-xs font-medium">
                                    <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
                                </div>
                            )}

                            <button
                                onClick={async () => {
                                    if (!newClient.name || !newClient.phone) return showError('Nombre y teléfono son obligatorios');
                                    const notes = newClient.document ? `Documento: ${newClient.document}` : undefined;
                                    const res = await createClientAction({
                                        full_name: newClient.name,
                                        phone: newClient.phone,
                                        email: newClient.email || undefined,
                                        address: newClient.address || undefined,
                                        notes: notes
                                    });
                                    if (!res.ok) return showError(res.error);
                                    setSelectedClient({ id: res.data.id, full_name: newClient.name, email: newClient.email || null, phone: newClient.phone });
                                    setIsCreatingClient(false);
                                    setStep(2);
                                }}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-orange-500/20 flex justify-center items-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Registrar Cliente
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ══════════════════════════════════════════════════════════════ */}
            {/* MODAL: CREAR NUEVO VEHÍCULO                                  */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {isCreatingVehicle && (
                <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                            <div>
                                <h3 className="text-white font-bold text-lg">Registrar Nuevo Vehículo</h3>
                                <p className="text-xs text-zinc-500 mt-0.5">Se vinculará a: <span className="text-orange-400 font-semibold">{selectedClient?.full_name}</span></p>
                            </div>
                            <button onClick={() => setIsCreatingVehicle(false)} className="text-zinc-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Plate */}
                            <div>
                                <label className="text-xs font-semibold text-zinc-400 mb-1.5 block uppercase tracking-wider">Placa *</label>
                                <input type="text" placeholder="Ej: ABC12D" value={newVehicle.plate} onChange={e => setNewVehicle({ ...newVehicle, plate: e.target.value.toUpperCase() })} maxLength={6} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none transition-colors uppercase font-mono tracking-widest font-bold" />
                            </div>

                            {/* Brand & Model */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* BRAND */}
                                <div className="relative z-20">
                                    <label className="text-xs font-semibold text-zinc-400 mb-1.5 block uppercase tracking-wider">Marca *</label>
                                    <div
                                        onClick={() => { setBrandOpen(!brandOpen); setModelOpen(false) }}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white flex items-center justify-between cursor-pointer hover:bg-black/60 transition-colors"
                                    >
                                        <span className={newVehicle.brand ? 'text-white' : 'text-zinc-600'}>{newVehicle.brand || 'Seleccionar'}</span>
                                        <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${brandOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                    {brandOpen && (
                                        <div className="absolute top-full left-0 w-full mt-1 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-1">
                                            <div className="px-2 py-2 border-b border-white/5">
                                                <input type="text" autoFocus placeholder="Buscar marca..." value={brandSearch} onChange={e => setBrandSearch(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500/30" />
                                            </div>
                                            <div className="max-h-[160px] overflow-y-auto scrollbar-none py-1">
                                                {filteredBrands.concat(brandSearch && !filteredBrands.includes(brandSearch) ? [brandSearch] : []).map(b => (
                                                    <button key={b} type="button" onClick={() => { setNewVehicle({ ...newVehicle, brand: b, model: '' }); setBrandSearch(''); setBrandOpen(false); if (MOTORCYCLE_CATALOG[b]) setModelOpen(true) }} className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition-colors">
                                                        {b} {!COLOMBIA_BRANDS.includes(b) && <span className="text-[9px] text-zinc-500 ml-1">(Personalizado)</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* MODEL */}
                                <div className="relative z-10">
                                    <label className="text-xs font-semibold text-zinc-400 mb-1.5 block uppercase tracking-wider">Modelo *</label>
                                    <div
                                        onClick={() => { if (!newVehicle.brand) return; setModelOpen(!modelOpen); setBrandOpen(false) }}
                                        className={`w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm flex items-center justify-between transition-colors ${!newVehicle.brand ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-black/60 text-white'}`}
                                    >
                                        <span className={newVehicle.model ? 'text-white' : 'text-zinc-600'}>{newVehicle.model || 'Seleccionar'}</span>
                                        <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${modelOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                    {modelOpen && newVehicle.brand && (
                                        <div className="absolute top-full left-0 w-full mt-1 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-1">
                                            <div className="px-2 py-2 border-b border-white/5">
                                                <input type="text" autoFocus placeholder="Buscar modelo..." value={modelSearch} onChange={e => setModelSearch(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500/30" />
                                            </div>
                                            <div className="max-h-[160px] overflow-y-auto scrollbar-none py-1">
                                                {filteredModels.concat(modelSearch && !filteredModels.includes(modelSearch) ? [modelSearch] : []).map(m => (
                                                    <button key={m} type="button" onClick={() => { setNewVehicle({ ...newVehicle, model: m }); setModelSearch(''); setModelOpen(false) }} className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition-colors">
                                                        {m} {!filteredModels.includes(m) && <span className="text-[9px] text-zinc-500 ml-1">(Personalizado)</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Year & Fuel */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 mb-1.5 block uppercase tracking-wider">Año Mod.</label>
                                    <input type="number" min="1950" max={new Date().getFullYear() + 1} value={newVehicle.year} onChange={e => setNewVehicle({ ...newVehicle, year: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500/50 outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 mb-1.5 block uppercase tracking-wider">Alimentación</label>
                                    <div className="flex bg-black/40 rounded-xl border border-white/10 p-1 relative isolate overflow-hidden">
                                        <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-blue-500/20 border border-blue-500/30 rounded-lg transition-all duration-300 z-0 ${newVehicle.fuelType === 'FI' ? 'left-1' : 'left-[50%]'}`} />
                                        <button type="button" onClick={() => setNewVehicle({ ...newVehicle, fuelType: 'FI' })} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold z-10 transition-colors ${newVehicle.fuelType === 'FI' ? 'text-blue-300' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                            <Zap className="w-3.5 h-3.5" /> FI
                                        </button>
                                        <button type="button" onClick={() => setNewVehicle({ ...newVehicle, fuelType: 'Carburada' })} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold z-10 transition-colors ${newVehicle.fuelType === 'Carburada' ? 'text-emerald-300' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                            <Thermometer className="w-3.5 h-3.5" /> Carb.
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-400 text-xs font-medium">
                                    <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
                                </div>
                            )}

                            <button
                                onClick={async () => {
                                    if (!newVehicle.plate || !newVehicle.brand || !newVehicle.model || !newVehicle.year) return showError('Por favor llene todos los campos del vehículo');
                                    const res = await createVehicleAction({
                                        client_id: selectedClient!.id,
                                        plate: newVehicle.plate,
                                        brand: newVehicle.brand,
                                        model: newVehicle.model,
                                        year: parseInt(newVehicle.year),
                                        fuel_type: newVehicle.fuelType,
                                    });
                                    if (!res.ok) return showError(res.error);
                                    setSelectedVehicle({ id: res.data.id, plate: newVehicle.plate, brand: newVehicle.brand, model: newVehicle.model, year: parseInt(newVehicle.year), fuel_type: newVehicle.fuelType } as DbVehicle);
                                    setIsCreatingVehicle(false);
                                    setNewVehicle({ plate: '', brand: '', model: '', year: new Date().getFullYear().toString(), fuelType: 'FI' });
                                    setStep(3);
                                }}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex justify-center items-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Registrar Vehículo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
