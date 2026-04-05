'use client'

import React, { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Search, Loader2, Package, MapPin, Clock, Wrench } from 'lucide-react'

gsap.registerPlugin(useGSAP, ScrollTrigger)

// ─── Shared animation setup ─────────────────────────────────────────────────

function useBlockEntrance(ref: React.RefObject<HTMLElement | null>, preview?: boolean) {
    useGSAP(() => {
        if (preview) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        gsap.fromTo(ref.current,
            { opacity: 0, y: 44 },
            {
                opacity: 1, y: 0,
                duration: 0.75,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: ref.current,
                    start: 'top 88%',
                    once: true,
                }
            }
        )
    }, { scope: ref })
}

// ─── HERO ────────────────────────────────────────────────────────────────────

export function HeroBlock({ block, config, mobile, preview }: any) {
    const ref = useRef<HTMLElement>(null)

    useGSAP(() => {
        if (preview) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        const tl = gsap.timeline()
        tl.fromTo('.hero-title',
            { opacity: 0, y: 36 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
        ).fromTo('.hero-sub',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
            '-=0.4'
        )
    }, { scope: ref })

    return (
        <section ref={ref} className="text-center px-4">
            <h1 className={`hero-title font-black text-white mb-4 tracking-tight leading-tight ${mobile ? 'text-3xl' : 'text-3xl sm:text-5xl lg:text-6xl'}`}>
                {block.content.title || 'Bienvenido'}
            </h1>
            <p className={`hero-sub text-zinc-400 max-w-2xl mx-auto leading-relaxed ${mobile ? 'text-base' : 'text-base sm:text-xl'}`}>
                {block.content.subtitle || 'Promesa de valor del taller.'}
            </p>
        </section>
    )
}

// ─── TRACKING ────────────────────────────────────────────────────────────────

export function TrackingBlock({ block, config, code, setCode, handleSearch, isSearching, error, mobile, preview }: any) {
    const ref = useRef<HTMLElement>(null)

    useGSAP(() => {
        if (preview) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        gsap.fromTo(ref.current,
            { opacity: 0, y: 50, scale: 0.97 },
            {
                opacity: 1, y: 0, scale: 1,
                duration: 0.8, ease: 'power3.out',
                scrollTrigger: { trigger: ref.current, start: 'top 86%', once: true }
            }
        )
    }, { scope: ref })

    return (
        <section ref={ref} className={`w-full ${mobile ? 'px-4' : 'max-w-2xl mx-auto px-4'}`}>
            <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 p-6 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${config.primary_color}, transparent)` }} />

                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${config.primary_color}20` }}>
                        <Search className="w-7 h-7" style={{ color: config.primary_color }} />
                    </div>
                    <h3 className={`font-bold text-white tracking-tight mb-2 ${mobile ? 'text-xl' : 'text-xl sm:text-2xl'}`}>
                        {block.content.title || 'Rastreo en Tiempo Real'}
                    </h3>
                    <p className="text-zinc-400 text-sm font-medium">{block.content.subtitle || 'Ingresa tu código para ver el estado de tu vehículo.'}</p>
                </div>

                <form onSubmit={handleSearch} className="flex flex-col gap-3">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-zinc-500 font-mono font-bold">#</span>
                        </div>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="REP-XXXXXXX"
                            className={`w-full bg-black/60 border border-white/10 ${config.button_radius} pl-10 pr-4 py-4 text-base font-mono font-bold text-white tracking-widest focus:outline-none placeholder:text-zinc-700 transition-colors`}
                            style={{ outlineColor: config.primary_color }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSearching || !code.trim()}
                        className={`w-full py-4 font-bold text-black text-base transition-transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 ${config.button_radius}`}
                        style={{ backgroundColor: config.primary_color, boxShadow: `0 0 20px ${config.primary_color}40` }}
                    >
                        {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold text-center animate-in fade-in">
                        {error}
                    </div>
                )}
            </div>
        </section>
    )
}

// ─── ECOMMERCE ───────────────────────────────────────────────────────────────

export function EcommerceBlock({ block, config, products, cart, addToCart, removeFromCart, mobile, preview }: any) {
    const ref = useRef<HTMLElement>(null)

    const displayProducts = products && products.length > 0 ? products : [
        { id: 'dummy-1', name: 'Casco Integral Pro', category: 'Accesorios', sale_price: 150000, stock_quantity: 5, image_url: '' },
        { id: 'dummy-2', name: 'Aceite Sintético 10W40', category: 'Líquidos', sale_price: 45000, stock_quantity: 12, image_url: '' },
        { id: 'dummy-3', name: 'Pastillas de Freno', category: 'Repuestos', sale_price: 35000, stock_quantity: 8, image_url: '' },
    ]

    useGSAP(() => {
        if (preview) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        gsap.fromTo('.ecom-header',
            { opacity: 0, y: 28 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
              scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true } }
        )
        gsap.fromTo('.ecom-card',
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.12,
              scrollTrigger: { trigger: ref.current, start: 'top 82%', once: true } }
        )
    }, { scope: ref })

    return (
        <section ref={ref} className="w-full px-4">
            <div className="ecom-header text-center mb-8">
                <h2 className={`font-black text-white mb-3 tracking-tight ${mobile ? 'text-2xl' : 'text-2xl sm:text-4xl'}`}>
                    {block.content.title || 'Catálogo Exclusivo'}
                </h2>
                <p className="text-zinc-400 text-sm font-medium">{block.content.subtitle || 'Equipamiento, repuestos y accesorios de primer nivel.'}</p>
            </div>

            <div className={`grid gap-4 ${mobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                {displayProducts.map((product: any) => {
                    const qtyInCart = cart ? cart[product.id] || 0 : 0
                    return (
                        <div key={product.id} className="ecom-card bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden group flex flex-col">
                            <div className="h-40 bg-zinc-900 border-b border-white/5 flex items-center justify-center p-4 overflow-hidden">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <Package className="w-12 h-12 opacity-20 group-hover:scale-110 transition-transform duration-500" />
                                )}
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1">{product.category}</span>
                                <h3 className="text-sm font-bold text-white leading-tight mb-3 flex-1">{product.name}</h3>
                                <div className="flex items-center justify-between gap-2 flex-wrap mt-auto">
                                    <span className="text-base font-black text-white whitespace-nowrap">${Number(product.sale_price).toLocaleString()}</span>
                                    {qtyInCart > 0 ? (
                                        <div className="flex items-center gap-2 bg-white/5 rounded-full px-2 py-1 border border-white/10">
                                            <button onClick={() => removeFromCart && removeFromCart(product.id)} className="w-6 h-6 rounded-full flex items-center justify-center bg-zinc-800 text-white text-sm">-</button>
                                            <span className="font-bold text-sm min-w-[1ch] text-center">{qtyInCart}</span>
                                            <button onClick={() => addToCart && addToCart(product.id)} className="w-6 h-6 rounded-full flex items-center justify-center text-black font-bold text-sm" style={{ backgroundColor: config.primary_color }}>+</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => addToCart && addToCart(product.id)} disabled={product.stock_quantity <= 0} className={`px-3 py-1.5 font-bold text-black text-xs rounded-lg shrink-0 disabled:opacity-50`} style={{ backgroundColor: config.primary_color }}>
                                            {product.stock_quantity > 0 ? 'Agregar' : 'Agotado'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {(!products || products.length === 0) && (
                <div className="text-center mt-6">
                    <p className="text-orange-500 text-xs border border-orange-500/20 bg-orange-500/10 inline-block px-4 py-2 rounded-full font-bold">
                        Productos de prueba. Agrega inventario real en el módulo de Inventario.
                    </p>
                </div>
            )}
        </section>
    )
}

// ─── SERVICES ────────────────────────────────────────────────────────────────

export function ServicesBlock({ block, config, mobile, preview }: any) {
    const ref = useRef<HTMLElement>(null)

    const services = block.content.items?.length > 0 ? block.content.items : [
        { title: 'Mantenimiento Preventivo', desc: 'Asegura la vida útil de tu motor con revisiones periódicas exhaustivas.' },
        { title: 'Reparación de Motor', desc: 'Solucionamos problemas mecánicos mayores con precisión y piezas originales.' },
        { title: 'Diagnóstico Electrónico', desc: 'Escaneo avanzado por computadora para detectar fallos silenciosos.' },
    ]

    useGSAP(() => {
        if (preview) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        gsap.fromTo('.srv-header',
            { opacity: 0, y: 28 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
              scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true } }
        )
        gsap.fromTo('.srv-card',
            { opacity: 0, y: 36, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.2)', stagger: 0.1,
              scrollTrigger: { trigger: ref.current, start: 'top 82%', once: true } }
        )
    }, { scope: ref })

    return (
        <section ref={ref} className="w-full text-center px-4">
            <div className="srv-header mb-8">
                <h2 className={`font-black text-white mb-3 tracking-tight ${mobile ? 'text-2xl' : 'text-2xl sm:text-3xl'}`}>
                    {block.content.title || 'Nuestros Servicios'}
                </h2>
                <p className="text-zinc-400 text-sm font-medium">{block.content.subtitle || 'Especialistas en Alto Cilindraje y Scooters.'}</p>
            </div>

            <div className={`grid gap-4 text-left ${mobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                {services.map((srv: any, i: number) => (
                    <div key={i} className="srv-card bg-zinc-900/40 border border-white/5 p-5 rounded-2xl hover:bg-zinc-900/80 transition-colors">
                        <div className="mb-4 p-3 inline-block rounded-xl" style={{ backgroundColor: `${config.primary_color}15`, color: config.primary_color }}>
                            <Wrench className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-bold text-white mb-2">{srv.title}</h4>
                        <p className="text-zinc-400 text-sm leading-relaxed">{srv.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}

// ─── GALLERY ─────────────────────────────────────────────────────────────────

export function GalleryBlock({ block, config, mobile, preview }: any) {
    const ref = useRef<HTMLElement>(null)

    useGSAP(() => {
        if (preview) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        gsap.fromTo('.gal-header',
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
              scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true } }
        )
        gsap.fromTo('.gal-img',
            { opacity: 0, scale: 1.06 },
            { opacity: 1, scale: 1, duration: 1, ease: 'power2.out',
              scrollTrigger: { trigger: ref.current, start: 'top 82%', once: true } }
        )
    }, { scope: ref })

    return (
        <section ref={ref} className="w-full text-center px-4">
            <div className="gal-header mb-8">
                <h2 className={`font-black text-white mb-3 tracking-tight ${mobile ? 'text-2xl' : 'text-2xl sm:text-3xl'}`}>
                    {block.content.title || 'Galería de Trabajos'}
                </h2>
                <p className="text-zinc-400 text-sm font-medium mb-0">{block.content.subtitle || 'Nuestros mejores proyectos'}</p>
            </div>

            <div className={`gal-img rounded-2xl overflow-hidden border border-white/10 relative group bg-zinc-900 ${mobile ? 'h-56' : 'h-56 sm:h-80'}`}>
                {block.content.image_url ? (
                    <img src={block.content.image_url} alt="Galería" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                        <span className="text-5xl mb-3">📸</span>
                        <p className="text-sm">Sube una imagen desde el Constructor</p>
                    </div>
                )}
            </div>
        </section>
    )
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────

export function TestimonialsBlock({ block, config, mobile, preview }: any) {
    const ref = useRef<HTMLElement>(null)

    const testimonials = block.content.items?.length > 0 ? block.content.items : [
        { quote: 'Excelente servicio, mi vehículo quedó como nuevo en un tiempo récord. Los precios muy justos.', author: 'Cliente Satisfecho' },
        { quote: 'La mejor atención, rápidos y muy profesionales. Sin duda los recomiendo.', author: 'Usuario Frecuente' },
    ]

    useGSAP(() => {
        if (preview) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        gsap.fromTo('.tst-header',
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
              scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true } }
        )
        // Alternating slide: even from left, odd from right
        const cards = ref.current?.querySelectorAll('.tst-card')
        cards?.forEach((card, i) => {
            gsap.fromTo(card,
                { opacity: 0, x: i % 2 === 0 ? -32 : 32 },
                { opacity: 1, x: 0, duration: 0.65, ease: 'power2.out', delay: i * 0.1,
                  scrollTrigger: { trigger: ref.current, start: 'top 82%', once: true } }
            )
        })
    }, { scope: ref })

    return (
        <section ref={ref} className="w-full text-center px-4">
            <div className="tst-header mb-8">
                <h2 className={`font-black text-white mb-3 tracking-tight ${mobile ? 'text-2xl' : 'text-2xl sm:text-3xl'}`}>
                    {block.content.title || 'Testimonios'}
                </h2>
                <p className="text-zinc-400 text-sm font-medium">{block.content.subtitle || 'Lo que dice la gente de nosotros'}</p>
            </div>

            <div className={`grid gap-4 text-left ${mobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                {testimonials.map((t: any, i: number) => (
                    <div key={i} className="tst-card bg-zinc-950 border border-white/10 p-6 rounded-2xl relative overflow-hidden">
                        <span className="text-4xl absolute top-3 left-4 opacity-10 font-serif leading-none" style={{ color: config.primary_color }}>&ldquo;</span>
                        <div className="flex gap-0.5 mb-3" style={{ color: config.primary_color }}>
                            {[...Array(5)].map((_, idx) => <span key={idx}>★</span>)}
                        </div>
                        <p className="text-zinc-300 text-sm italic mb-5 relative z-10">&ldquo;{t.quote}&rdquo;</p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 shrink-0" />
                            <div>
                                <h5 className="text-white font-bold text-sm">{t.author}</h5>
                                <p className="text-zinc-500 text-xs">Cliente Verificado</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

export function FaqBlock({ block, config, mobile, preview }: any) {
    const ref = useRef<HTMLElement>(null)

    const faqs = block.content.items?.length > 0 ? block.content.items : [
        { q: '¿Tienen garantía los mantenimientos?', a: 'Sí, todas nuestras reparaciones cuentan con 30 días de garantía sobre la mano de obra.' },
        { q: '¿Cuánto tiempo tarda un diagnóstico?', a: 'Los diagnósticos generales toman de 1 a 3 horas hábiles.' },
        { q: '¿Puedo revisar el estado en línea?', a: '¡Absolutamente! Con nuestro módulo de Tracking aquí arriba podrás ver el progreso exacto en todo momento.' },
    ]

    useGSAP(() => {
        if (preview) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        gsap.fromTo('.faq-header',
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
              scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true } }
        )
        gsap.fromTo('.faq-item',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.08,
              scrollTrigger: { trigger: ref.current, start: 'top 84%', once: true } }
        )
    }, { scope: ref })

    return (
        <section ref={ref} className="w-full px-4">
            <div className="faq-header text-center mb-8">
                <h2 className={`font-black text-white mb-3 tracking-tight ${mobile ? 'text-2xl' : 'text-2xl sm:text-3xl'}`}>
                    {block.content.title || 'Preguntas Frecuentes'}
                </h2>
                <p className="text-zinc-400 text-sm font-medium">{block.content.subtitle || 'Resolvemos tus dudas al instante'}</p>
            </div>

            <div className={`space-y-3 ${mobile ? 'w-full' : 'max-w-3xl mx-auto'}`}>
                {faqs.map((faq: any, i: number) => (
                    <div key={i} className="faq-item bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
                        <h4 className="text-white font-bold mb-2 text-sm flex items-start gap-2">
                            <span className="shrink-0 font-black" style={{ color: config.primary_color }}>Q.</span>
                            <span>{faq.q}</span>
                        </h4>
                        <p className="text-zinc-400 text-sm ml-6 leading-relaxed">{faq.a}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}

// ─── CONTACT ─────────────────────────────────────────────────────────────────

export function ContactBlock({ block, config, mobile, preview }: any) {
    const ref = useRef<HTMLElement>(null)

    useGSAP(() => {
        if (preview) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        gsap.fromTo('.cnt-header',
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
              scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true } }
        )
        const cards = ref.current?.querySelectorAll('.cnt-card')
        cards?.forEach((card, i) => {
            gsap.fromTo(card,
                { opacity: 0, x: i === 0 ? -28 : 28 },
                { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out', delay: 0.1,
                  scrollTrigger: { trigger: ref.current, start: 'top 84%', once: true } }
            )
        })
    }, { scope: ref })

    return (
        <section ref={ref} className="w-full text-center px-4">
            <div className="cnt-header mb-8">
                <h2 className={`font-black text-white mb-3 tracking-tight ${mobile ? 'text-2xl' : 'text-2xl sm:text-3xl'}`}>
                    {block.content.title || 'Ubicación y Horarios'}
                </h2>
                <p className="text-zinc-400 text-sm font-medium">{block.content.subtitle || 'Visítanos en nuestras instalaciones'}</p>
            </div>

            <div className={`grid gap-4 text-left ${mobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                <div className="cnt-card bg-zinc-950/80 border border-white/10 p-5 rounded-2xl flex items-start gap-3">
                    <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: `${config.primary_color}20`, color: config.primary_color }}>
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-1 text-sm">Dirección Física</h4>
                        <p className="text-zinc-400 text-sm">{block.content.address || 'Av. Principal #123, Ciudad'}</p>
                    </div>
                </div>

                <div className="cnt-card bg-zinc-950/80 border border-white/10 p-5 rounded-2xl flex items-start gap-3">
                    <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: `${config.primary_color}20`, color: config.primary_color }}>
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-1 text-sm">Horario de Atención</h4>
                        <p className="text-zinc-400 text-sm">{block.content.hours || 'Lunes a Sábado de 9:00 AM a 6:00 PM'}</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
