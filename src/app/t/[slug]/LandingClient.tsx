'use client'

import { useState } from 'react'
import { Search, Loader2, Wrench, Clock, CheckCircle, Package, AlertTriangle, ArrowLeft, Camera, ChevronDown, MapPin, Phone, Zap } from 'lucide-react'
import { lookupTrackingCodeAction } from '@/lib/actions/tracking'
import { HeroBlock, TrackingBlock, EcommerceBlock, ServicesBlock, GalleryBlock, TestimonialsBlock, FaqBlock, ContactBlock } from '@/components/landing/LandingBlocks'
import LandingFooter from '@/components/landing/LandingFooter'

type LandingConfig = {
    theme_preset: string
    font_family: string
    button_radius: string
    primary_color: string
    bg_color: string
    blocks: any[]
    logo_url?: string | null
    cover_url?: string | null
}

type Workshop = {
    name: string
    phone: string | null
    map_url: string | null
}

type Product = {
    id: string
    name: string
    description: string
    sale_price: number
    image_url: string | null
    category: string
    stock_quantity: number
}

const STATUS_STEPS = [
    { key: 'received', label: 'Recibido', icon: Package },
    { key: 'in_progress', label: 'Diagnóstico', icon: Search },
    { key: 'repairing', label: 'En Reparación', icon: Wrench },
    { key: 'completed', label: 'Completado', icon: CheckCircle },
]

const statusLabels: Record<string, string> = {
    'received': 'Recibido', 'in_progress': 'En Diagnóstico', 'repairing': 'En Reparación',
    'waiting_parts': 'Esperando Repuestos', 'completed': 'Completado',
    'delivered': 'Entregado', 'cancelled': 'Cancelado',
}

export default function LandingClient({ config, workshop, products, mobile, preview }: { config: LandingConfig, workshop: Workshop, products: Product[], mobile?: boolean, preview?: boolean }) {
    const [code, setCode] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [trackingData, setTrackingData] = useState<any>(null)
    const [error, setError] = useState('')

    // Cart State
    const [cart, setCart] = useState<Record<string, number>>({})

    const addToCart = (productId: string) => {
        setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }))
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => {
            const newCart = { ...prev }
            if (newCart[productId] > 1) {
                newCart[productId]--
            } else {
                delete newCart[productId]
            }
            return newCart
        })
    }

    const totalCartItems = Object.values(cart).reduce((a, b) => a + b, 0)
    const storeBlock = config.blocks.find(b => b.type === 'ecommerce') || { visible: true, content: { title: 'Accesorios y Repuestos', subtitle: 'Lleva tu moto al siguiente nivel.' } }

    const handleWhatsAppCheckout = () => {
        if (!workshop.phone) {
            alert('El taller no tiene un número de WhatsApp configurado.')
            return
        }

        let message = `Hola, quiero comprar los siguientes artículos que vi en su sitio web:\n\n`
        let total = 0

        Object.entries(cart).forEach(([id, qty]) => {
            const product = products.find(p => p.id === id)
            if (product) {
                const subtotal = product.sale_price * qty
                total += subtotal
                message += `▪ ${qty}x ${product.name} - $${subtotal.toLocaleString()}\n`
            }
        })

        message += `\n*Total estimado: $${total.toLocaleString()}*`
        message += `\n\n¿Tienen disponibilidad?`

        const encodedMessage = encodeURIComponent(message)
        // Clean phone number (remove non-digits)
        const cleanPhone = workshop.phone.replace(/\D/g, '')
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank')
    }


    const heroBlock = config.blocks.find(b => b.type === 'hero')
    const trackBlock = config.blocks.find(b => b.type === 'tracking')

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim()) return
        setIsSearching(true)
        setError('')
        setTrackingData(null)

        const res = await lookupTrackingCodeAction(code.trim())
        if (res.ok) {
            setTrackingData(res.data)
        } else {
            setError(res.error)
        }
        setIsSearching(false)
    }

    const currentStepIndex = trackingData ? STATUS_STEPS.findIndex(s => s.key === trackingData.repair.status) : -1

    return (
        <div
            className="min-h-screen text-white relative overflow-hidden"
            style={{ fontFamily: config.font_family, backgroundColor: config.bg_color || '#09090b' }}
        >
            {/* Ambient Base Light */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] blur-[120px] opacity-10 pointer-events-none"
                style={{ backgroundColor: config.primary_color }}
            ></div>

            {/* Cover / Banner Image */}
            {config.cover_url && (
                <div className={`relative w-full overflow-hidden shrink-0 ${mobile ? 'h-44' : 'h-44 sm:h-72'}`}>
                    <img
                        src={config.cover_url}
                        alt="Portada"
                        className="w-full h-full object-cover"
                    />
                    <div
                        className="absolute inset-0"
                        style={{ background: `linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, ${config.bg_color || '#09090b'} 100%)` }}
                    />
                </div>
            )}

            {/* Header */}
            <header className={`px-4 py-3 border-b border-white/5 relative z-10 backdrop-blur-md flex items-center justify-between gap-3 ${config.cover_url ? '-mt-14 sm:-mt-16' : ''}`}>
                <div className={`font-black tracking-tight flex items-center gap-2 min-w-0 ${mobile ? 'text-base' : 'text-base sm:text-xl'}`}>
                    {config.logo_url ? (
                        <img
                            src={config.logo_url}
                            alt={workshop.name}
                            className={`object-contain shrink-0 ${mobile ? 'h-8 max-w-[120px]' : 'h-8 sm:h-10 max-w-[140px]'}`}
                        />
                    ) : (
                        <>
                            <Zap className="w-5 h-5 shrink-0" style={{ color: config.primary_color }} />
                            <span className="truncate">{workshop.name}</span>
                        </>
                    )}
                </div>
                {workshop.phone && (
                    <a
                        href={`tel:${workshop.phone}`}
                        className={`text-zinc-400 flex items-center gap-1.5 font-medium shrink-0 hover:text-white transition-colors ${mobile ? 'text-xs' : 'text-xs sm:text-sm'}`}
                    >
                        <Phone className="w-3.5 h-3.5" />
                        <span className={mobile ? 'hidden' : 'hidden sm:inline'}>{workshop.phone}</span>
                        <span className={mobile ? 'inline' : 'inline sm:hidden'}>Llamar</span>
                    </a>
                )}
            </header>

            <main className="relative z-10 w-full pb-32">
                {trackingData ? (
                    /* --- TRACKING RESULTS (Isolates from normal blocks) --- */
                    <div className="space-y-6 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full px-4">
                        <button
                            onClick={() => { setTrackingData(null); setCode('') }}
                            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" /> Volver al sitio web principal
                        </button>

                        <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/5 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] pointer-events-none" style={{ backgroundColor: `${config.primary_color}15` }}></div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="font-mono text-sm font-black text-black px-3 py-1 rounded-lg" style={{ backgroundColor: config.primary_color }}>
                                            #{trackingData.repair.tracking_code}
                                        </span>
                                        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-white">
                                            {statusLabels[trackingData.repair.status] || trackingData.repair.status}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-black text-white">
                                        {trackingData.repair.vehicle_brand} {trackingData.repair.vehicle_model}
                                    </h2>
                                    {trackingData.repair.vehicle_plate && (
                                        <span className="inline-block mt-3 bg-white/5 text-zinc-300 px-4 py-1.5 rounded-lg text-sm font-mono font-black tracking-widest border border-white/10">
                                            {trackingData.repair.vehicle_plate}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* STATUS STEPS */}
                        <div className="bg-zinc-950/80 border border-white/10 rounded-3xl p-6 sm:p-8 relative">
                            <h3 className="text-xl font-bold text-white mb-8 border-b border-white/5 pb-4">Progreso del Servicio</h3>
                            <div className="relative">
                                <div className="absolute top-6 left-6 right-6 h-1 bg-zinc-900 rounded-full hidden sm:block"></div>
                                <div className="absolute top-6 left-6 h-1 rounded-full bg-orange-500 transition-all duration-1000 hidden sm:block" style={{ width: `${Math.max(0, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)}%`, backgroundColor: config.primary_color }}></div>

                                <div className="flex flex-col sm:flex-row justify-between relative gap-6 sm:gap-0">
                                    {STATUS_STEPS.map((step, idx) => {
                                        const isCompleted = currentStepIndex >= idx
                                        const isCurrent = currentStepIndex === idx
                                        const Icon = step.icon

                                        return (
                                            <div key={idx} className="flex sm:flex-col items-center gap-4 sm:gap-3 relative">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-500 ${isCompleted ? 'bg-orange-500 border-orange-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`} style={{ backgroundColor: isCompleted ? config.primary_color : '', borderColor: isCompleted ? config.primary_color : '' }}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="sm:text-center">
                                                    <p className={`font-bold text-sm ${isCompleted ? 'text-white' : 'text-zinc-500'}`}>{step.label}</p>
                                                    {isCurrent && <p className="text-xs text-orange-400 mt-1 animate-pulse" style={{ color: config.primary_color }}>Tu moto está aquí</p>}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-950/80 border border-white/10 rounded-3xl p-6 sm:p-8">
                            <h3 className="text-xl font-bold text-white mb-6 border-b border-white/5 pb-4">Historial de Actualizaciones</h3>
                            <div className="space-y-6">
                                {trackingData.updates.map((upd: any, idx: number) => {
                                    const date = new Date(upd.created_at)
                                    return (
                                        <div key={upd.id} className="relative flex gap-4">
                                            <div className="shrink-0 flex flex-col items-center z-10 pt-1">
                                                <div className="w-3 h-3 rounded-full border-2 border-zinc-950" style={{ backgroundColor: idx === 0 ? config.primary_color : '#3f3f46', boxShadow: idx === 0 ? `0 0 8px ${config.primary_color}` : 'none' }}></div>
                                                {idx !== trackingData.updates.length - 1 && <div className="w-px h-full bg-zinc-800 mt-2"></div>}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <div className="flex items-center gap-2 border border-white/5 rounded-2xl p-5 bg-zinc-800/30">
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 text-zinc-300 bg-white/5">
                                                                {statusLabels[upd.status] || upd.status}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-500 font-mono">
                                                                {date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} · {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-white leading-relaxed">{upd.notes}</p>
                                                        {upd.photos && upd.photos.length > 0 && (
                                                            <div className="mt-4 flex flex-wrap gap-2">
                                                                {upd.photos.map((photo: string, i: number) => (
                                                                    <a key={i} href={photo} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 rounded-xl bg-zinc-950 border border-white/10 overflow-hidden hover:border-white/30 transition-colors">
                                                                        <img src={photo} alt={`Evidencia`} className="w-full h-full object-cover" />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                    </div>
                ) : (
                    /* --- DYNAMIC BLOCK RENDERER --- */
                    <>
                        <div className={`w-full flex flex-col pt-10 ${mobile ? 'gap-12' : 'gap-12 sm:gap-20'}`}>
                            {config.blocks.filter(b => b.visible && b.type !== 'footer').map((block) => {
                                const p = { block, config, mobile, preview }
                                switch (block.type) {
                                    case 'hero': return <HeroBlock key={block.id} {...p} />;
                                    case 'tracking': return <TrackingBlock key={block.id} {...p} code={code} setCode={setCode} handleSearch={handleSearch} isSearching={isSearching} error={error} />;
                                    case 'ecommerce': return <EcommerceBlock key={block.id} {...p} products={products} cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} />;
                                    case 'services': return <ServicesBlock key={block.id} {...p} />;
                                    case 'gallery': return <GalleryBlock key={block.id} {...p} />;
                                    case 'testimonials': return <TestimonialsBlock key={block.id} {...p} />;
                                    case 'faq': return <FaqBlock key={block.id} {...p} />;
                                    case 'contact': return <ContactBlock key={block.id} {...p} />;
                                    default: return null;
                                }
                            })}
                        </div>
                        <LandingFooter config={config} workshop={workshop} preview={preview} mobile={mobile} />
                    </>
                )}
            </main>

            {/* Floating Checkout CTA */}
            {totalCartItems > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <button
                        onClick={handleWhatsAppCheckout}
                        className="flex items-center gap-3 bg-zinc-950 border border-white/20 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-emerald-500/20 hover:border-emerald-500/50 transition-all group"
                    >
                        <div className="flex -space-x-2">
                            {Object.entries(cart).slice(0, 3).map(([id, _]) => {
                                const product = products.find(p => p.id === id)
                                if (!product) return null
                                return (
                                    <div key={id} className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-zinc-800 overflow-hidden flex items-center justify-center">
                                        {product.image_url ? (
                                            <img src={product.image_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package className="w-4 h-4 opacity-50" />
                                        )}
                                    </div>
                                )
                            })}
                            {Object.keys(cart).length > 3 && (
                                <div className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                                    +{Object.keys(cart).length - 3}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-start mr-2">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{totalCartItems} {totalCartItems === 1 ? 'Artículo' : 'Artículos'}</span>
                            <span className="text-sm font-black text-emerald-400 group-hover:text-emerald-300 transition-colors">Pedir por WhatsApp</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/40">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                        </div>
                    </button>
                </div>
            )}
        </div>
    )
}
