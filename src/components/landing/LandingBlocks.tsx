'use client'

import React from 'react'
import { Search, Loader2, Package, MapPin, Phone, Mail, Clock, ShieldCheck, Wrench, Settings } from 'lucide-react'

// HERO
export function HeroBlock({ block, config }: any) {
    return (
        <section className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-5xl sm:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                {block.content.title || 'Bienvenido'}
            </h1>
            <p className="text-zinc-400 text-xl max-w-2xl mx-auto leading-relaxed">
                {block.content.subtitle || 'Promesa de valor del taller.'}
            </p>
        </section>
    )
}

// TRACKING
export function TrackingBlock({ block, config, code, setCode, handleSearch, isSearching, error }: any) {
    return (
        <section className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${config.primary_color}, transparent)` }}></div>

                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: `${config.primary_color}20` }}>
                        <Search className="w-8 h-8" style={{ color: config.primary_color }} />
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight mb-2">{block.content.title || 'Rastreo en Tiempo Real'}</h3>
                    <p className="text-zinc-400 font-medium">{block.content.subtitle || 'Ingresa tu código para ver estadísticas de tu vehículo.'}</p>
                </div>

                <form onSubmit={handleSearch} className="relative flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-zinc-500 font-mono font-bold">#</span>
                        </div>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="REP-XXXXXXX"
                            className={`w-full bg-black/60 border border-white/10 ${config.button_radius} pl-10 pr-4 py-4 text-lg font-mono font-bold text-white tracking-widest focus:outline-none placeholder:text-zinc-700 transition-colors`}
                            style={{ outlineColor: config.primary_color }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSearching || !code.trim()}
                        className={`px-8 py-4 font-bold text-black text-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 ${config.button_radius}`}
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

// ECOMMERCE
export function EcommerceBlock({ block, config, products, cart, addToCart, removeFromCart }: any) {
    const displayProducts = products && products.length > 0 ? products : [
        { id: 'dummy-1', name: 'Casco Integral Pro', category: 'Accesorios', sale_price: 150000, stock_quantity: 5, image_url: '' },
        { id: 'dummy-2', name: 'Aceite Sintético 10W40', category: 'Líquidos', sale_price: 45000, stock_quantity: 12, image_url: '' },
        { id: 'dummy-3', name: 'Pastillas de Freno', category: 'Repuestos', sale_price: 35000, stock_quantity: 8, image_url: '' }
    ]

    return (
        <section className="max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">{block.content.title || 'Catálogo Exclusivo'}</h2>
                <p className="text-zinc-400 font-medium">{block.content.subtitle || 'Equipamiento, repuestos y accesorios de primer nivel.'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {displayProducts.map((product: any) => {
                    const qtyInCart = cart ? cart[product.id] || 0 : 0
                    return (
                        <div key={product.id} className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden group flex flex-col">
                            <div className="h-48 bg-zinc-900 border-b border-white/5 relative overflow-hidden flex items-center justify-center p-6">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <Package className="w-16 h-16 opacity-20 group-hover:scale-110 transition-transform duration-500" />
                                )}
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">{product.category}</span>
                                <h3 className="text-lg font-bold text-white leading-tight mb-2 flex-1">{product.name}</h3>
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-xl font-black text-white">${Number(product.sale_price).toLocaleString()}</span>
                                    {qtyInCart > 0 ? (
                                        <div className="flex items-center gap-3 bg-white/5 rounded-full px-2 py-1 border border-white/10">
                                            <button onClick={() => removeFromCart && removeFromCart(product.id)} className="w-7 h-7 rounded-full flex items-center justify-center bg-zinc-800 text-white">-</button>
                                            <span className="font-bold text-sm min-w-[1ch] text-center">{qtyInCart}</span>
                                            <button onClick={() => addToCart && addToCart(product.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-black font-bold" style={{ backgroundColor: config.primary_color }}>+</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => addToCart && addToCart(product.id)} disabled={product.stock_quantity <= 0} className={`px-4 py-2 font-bold text-black text-xs rounded-lg`} style={{ backgroundColor: config.primary_color }}>
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
                <div className="text-center mt-8">
                    <p className="text-orange-500 text-xs mt-2 border border-orange-500/20 bg-orange-500/10 inline-block px-4 py-2 rounded-full font-bold">
                        (Estos productos son de prueba. Añade productos en el módulo de Inventario para verlos aquí)
                    </p>
                </div>
            )}
        </section>
    )
}

// CONTACT
export function ContactBlock({ block, config }: any) {
    return (
        <section className="max-w-3xl mx-auto w-full text-center">
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">{block.content.title || 'Ubicación y Horarios'}</h2>
            <p className="text-zinc-400 font-medium mb-10">{block.content.subtitle || 'Visítanos en nuestras instalaciones'}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                <div className="bg-zinc-950/80 border border-white/10 p-6 rounded-3xl flex items-start gap-4">
                    <div className="p-3 rounded-2xl" style={{ backgroundColor: `${config.primary_color}20`, color: config.primary_color }}>
                        <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-1">Dirección Física</h4>
                        <p className="text-zinc-400 text-sm">{block.content.address || 'Av. Principal #123, Ciudad'}</p>
                    </div>
                </div>

                <div className="bg-zinc-950/80 border border-white/10 p-6 rounded-3xl flex items-start gap-4">
                    <div className="p-3 rounded-2xl" style={{ backgroundColor: `${config.primary_color}20`, color: config.primary_color }}>
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-1">Horario de Atención</h4>
                        <p className="text-zinc-400 text-sm">{block.content.hours || 'Lunes a Sábado de 9:00 AM a 6:00 PM'}</p>
                    </div>
                </div>
            </div>
        </section>
    )
}

// SERVICES
export function ServicesBlock({ block, config }: any) {
    const services = block.content.items && block.content.items.length > 0 ? block.content.items : [
        { title: 'Mantenimiento Preventivo', desc: 'Asegura la vida útil de tu motor con revisiones periódicas exhaustivas.' },
        { title: 'Reparación de Motor', desc: 'Solucionamos problemas mecánicos mayores con precisión y piezas originales.' },
        { title: 'Diagnóstico Electrónico', desc: 'Escaneo avanzado por computadora para detectar fallos silenciosos.' }
    ]

    return (
        <section className="max-w-5xl mx-auto w-full text-center">
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">{block.content.title || 'Nuestros Servicios'}</h2>
            <p className="text-zinc-400 font-medium mb-12">{block.content.subtitle || 'Especialistas en Alto Cilindraje y Scooters.'}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                {services.map((srv: any, i: number) => (
                    <div key={i} className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl hover:bg-zinc-900/80 transition-colors">
                        <div className="mb-6 p-4 inline-block rounded-2xl" style={{ backgroundColor: `${config.primary_color}15`, color: config.primary_color }}>
                            <Wrench className="w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">{srv.title}</h4>
                        <p className="text-zinc-400 text-sm leading-relaxed">{srv.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}

// GALLERY
export function GalleryBlock({ block, config }: any) {
    return (
        <section className="max-w-5xl mx-auto w-full text-center">
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">{block.content.title || 'Galería de Trabajos'}</h2>
            <p className="text-zinc-400 font-medium mb-10">{block.content.subtitle || 'Nuestros mejores proyectos'}</p>

            <div className="h-64 sm:h-96 rounded-3xl overflow-hidden border border-white/10 relative group bg-zinc-900">
                {block.content.image_url ? (
                    <img src={block.content.image_url} alt="Gallery" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                        <span className="text-6xl mb-4">📸</span>
                        Sube una imagen URL desde el Constructor
                    </div>
                )}
            </div>
        </section>
    )
}

// TESTIMONIALS
export function TestimonialsBlock({ block, config }: any) {
    const testimonials = block.content.items && block.content.items.length > 0 ? block.content.items : [
        { quote: 'Excelente servicio, mi vehículo quedó como nuevo en un tiempo récord. Los precios muy justos.', author: 'Cliente Satisfecho' },
        { quote: 'La mejor atención, rápidos y muy profesionales. Sin duda los recomiendo.', author: 'Usuario Frecuente' }
    ]

    return (
        <section className="max-w-4xl mx-auto w-full text-center">
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">{block.content.title || 'Testimonios'}</h2>
            <p className="text-zinc-400 font-medium mb-12">{block.content.subtitle || 'Lo que dice la gente de nosotros'}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {testimonials.map((t: any, i: number) => (
                    <div key={i} className="bg-zinc-950 border border-white/10 p-8 rounded-3xl relative">
                        <span className="text-5xl absolute top-4 left-4 opacity-10" style={{ color: config.primary_color }}>&quot;</span>
                        <div className="flex gap-1 mb-4 text-orange-500">
                            {'★★★★★'.split('').map((star, idx) => <span key={idx}>{star}</span>)}
                        </div>
                        <p className="text-zinc-300 italic mb-6 relative z-10">&quot;{t.quote}&quot;</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/20"></div>
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

// FAQ
export function FaqBlock({ block, config }: any) {
    const faqs = block.content.items && block.content.items.length > 0 ? block.content.items : [
        { q: '¿Tienen garantía los mantenimientos?', a: 'Sí, todas nuestras reparaciones cuentan con 30 días de garantía sobre la mano de obra.' },
        { q: '¿Cuánto tiempo tarda un diagnóstico?', a: 'Los diagnósticos generales toman de 1 a 3 horas hábiles.' },
        { q: '¿Puedo revisar el estado en línea?', a: '¡Absolutamente! Con nuestro módulo de Tracking aquí arriba podrás ver el progreso exacto en todo momento.' }
    ]

    return (
        <section className="max-w-3xl mx-auto w-full">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-white mb-4 tracking-tight">{block.content.title || 'Preguntas Frecuentes'}</h2>
                <p className="text-zinc-400 font-medium">{block.content.subtitle || 'Resolvemos tus dudas al instante'}</p>
            </div>

            <div className="space-y-4">
                {faqs.map((faq: any, i: number) => (
                    <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                        <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                            <span style={{ color: config.primary_color }}>Q.</span> {faq.q}
                        </h4>
                        <p className="text-zinc-400 text-sm ml-6">{faq.a}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}
