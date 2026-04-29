'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Phone, MapPin, Clock, Zap } from 'lucide-react'

gsap.registerPlugin(useGSAP, ScrollTrigger)

/* ── Inline SVG social icons ─────────────────────────────────────────────── */

function WhatsAppIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    )
}

function InstagramIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
        </svg>
    )
}

function FacebookIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    )
}

/* ── Types ───────────────────────────────────────────────────────────────── */

interface FooterProps {
    config: {
        primary_color: string
        logo_url?: string | null
        blocks?: any[]
    }
    workshop: {
        name: string
        phone: string | null
    }
    preview?: boolean
    mobile?: boolean
}

interface FooterContent {
    tagline?: string
    address?: string
    hours?: string
    whatsapp?: string
    instagram?: string
    facebook?: string
}

/* ── Component ───────────────────────────────────────────────────────────── */

export default function LandingFooter({ config, workshop, preview, mobile }: FooterProps) {
    const containerRef = useRef<HTMLElement>(null)

    const footerBlock = config.blocks?.find((b: any) => b.type === 'footer')
    const fc: FooterContent = footerBlock?.content ?? {}

    const socialLinks = [
        fc.whatsapp && {
            href: `https://wa.me/${fc.whatsapp.replace(/\D/g, '')}`,
            label: 'WhatsApp',
            icon: <WhatsAppIcon className="w-5 h-5" />,
            hover: 'hover:bg-emerald-500/15 hover:border-emerald-500/40 hover:text-emerald-400',
        },
        fc.instagram && {
            href: fc.instagram.startsWith('http')
                ? fc.instagram
                : `https://instagram.com/${fc.instagram.replace('@', '')}`,
            label: 'Instagram',
            icon: <InstagramIcon className="w-5 h-5" />,
            hover: 'hover:bg-pink-500/15 hover:border-pink-500/40 hover:text-pink-400',
        },
        fc.facebook && {
            href: fc.facebook.startsWith('http')
                ? fc.facebook
                : `https://facebook.com/${fc.facebook}`,
            label: 'Facebook',
            icon: <FacebookIcon className="w-5 h-5" />,
            hover: 'hover:bg-blue-500/15 hover:border-blue-500/40 hover:text-blue-400',
        },
    ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode; hover: string }[]

    const hasContact = workshop.phone || fc.address || fc.hours

    const quickLinks = [
        { label: 'Rastrear mi moto',   href: '#track_1'  },
        { label: 'Nuestros Servicios', href: '#services'  },
        { label: 'Catálogo',           href: '#ecommerce' },
        { label: 'Contáctanos',        href: '#contact'   },
    ]

    useGSAP(() => {
        if (preview) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        const st = { trigger: containerRef.current, start: 'top 92%', once: true }
        gsap.fromTo('.ft-brand',  { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, ease: 'expo.out', force3D: true, scrollTrigger: st })
        gsap.fromTo('.ft-col',    { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5,  ease: 'expo.out', force3D: true, stagger: 0.09, delay: 0.1, scrollTrigger: st })
        gsap.fromTo('.ft-bottom', { opacity: 0 },        { opacity: 1, duration: 0.4, ease: 'expo.out', delay: 0.32, scrollTrigger: st })
    }, { scope: containerRef })

    /* ── Icon pill ─────────────────────────────────────────────────────── */
    const IconPill = ({ children }: { children: React.ReactNode }) => (
        <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
            style={{ backgroundColor: `${config.primary_color}12`, borderColor: `${config.primary_color}28` }}
        >
            {children}
        </div>
    )

    /* ── Section label ─────────────────────────────────────────────────── */
    const SectionLabel = ({ children }: { children: React.ReactNode }) => (
        <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-600 mb-4">
            {children}
        </p>
    )

    /* ════════════════════════════════════════════════════════════════════
        MOBILE LAYOUT
    ════════════════════════════════════════════════════════════════════ */
    if (mobile) {
        return (
            <footer ref={containerRef} className="relative w-full mt-12 overflow-hidden">

                {/* Top glow line */}
                <div
                    className="absolute top-0 inset-x-0 h-px"
                    style={{ background: `linear-gradient(90deg, transparent 0%, ${config.primary_color} 30%, ${config.primary_color} 70%, transparent 100%)` }}
                />
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 blur-[60px] opacity-[0.10] pointer-events-none"
                    style={{ backgroundColor: config.primary_color }}
                />
                <div
                    className="absolute inset-0 opacity-[0.015] pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(${config.primary_color} 1px, transparent 1px), linear-gradient(90deg, ${config.primary_color} 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                    }}
                />

                <div className="relative z-10 w-full px-5 pt-10 pb-8">

                    {/* ── Brand (centered) ─────────────────────────────── */}
                    <div className="ft-brand flex flex-col items-center text-center gap-4 pb-8">

                        {config.logo_url && (
                            <img
                                src={config.logo_url}
                                alt={`Logo ${workshop.name}`}
                                className="h-20 w-auto max-w-[200px] object-contain"
                            />
                        )}

                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center border"
                                    style={{ backgroundColor: `${config.primary_color}18`, borderColor: `${config.primary_color}35` }}
                                >
                                    <Zap className="w-3.5 h-3.5" style={{ color: config.primary_color }} />
                                </div>
                                <span className="text-white font-black text-lg tracking-tight">{workshop.name}</span>
                            </div>
                            {fc.tagline && (
                                <p className="text-zinc-500 text-xs leading-relaxed max-w-[240px]">{fc.tagline}</p>
                            )}
                        </div>

                        {socialLinks.length > 0 && (
                            <div className="flex items-center gap-3">
                                {socialLinks.map(s => (
                                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                                        className={`w-12 h-12 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-zinc-400 transition-all duration-200 active:scale-95 ${s.hover}`}>
                                        {s.icon}
                                    </a>
                                ))}
                            </div>
                        )}

                        {/* Gradient divider */}
                        <div
                            className="w-full h-px mt-1"
                            style={{ background: `linear-gradient(90deg, transparent, ${config.primary_color}35, transparent)` }}
                        />
                    </div>

                    {/* ── 2-col: contact + links ───────────────────────── */}
                    <div className="grid grid-cols-2 gap-5">

                        {hasContact && (
                            <div className="ft-col flex flex-col">
                                <SectionLabel>Contacto</SectionLabel>
                                <div className="flex flex-col gap-3">
                                    {workshop.phone && (
                                        <a href={`tel:${workshop.phone}`} className="group flex items-center gap-2.5">
                                            <IconPill>
                                                <Phone className="w-3.5 h-3.5" style={{ color: config.primary_color }} />
                                            </IconPill>
                                            <span className="text-zinc-400 text-xs leading-tight group-hover:text-white transition-colors">
                                                {workshop.phone}
                                            </span>
                                        </a>
                                    )}
                                    {fc.address && (
                                        <div className="flex items-start gap-2.5">
                                            <IconPill>
                                                <MapPin className="w-3.5 h-3.5" style={{ color: config.primary_color }} />
                                            </IconPill>
                                            <span className="text-zinc-400 text-xs leading-relaxed pt-1.5">{fc.address}</span>
                                        </div>
                                    )}
                                    {fc.hours && (
                                        <div className="flex items-center gap-2.5">
                                            <IconPill>
                                                <Clock className="w-3.5 h-3.5" style={{ color: config.primary_color }} />
                                            </IconPill>
                                            <span className="text-zinc-400 text-xs leading-tight">{fc.hours}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="ft-col flex flex-col">
                            <SectionLabel>Navegación</SectionLabel>
                            <div className="flex flex-col gap-3">
                                {quickLinks.map(link => (
                                    <a key={link.label} href={link.href}
                                        className="group flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors">
                                        <span
                                            className="w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-[2]"
                                            style={{ backgroundColor: config.primary_color }}
                                        />
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Bottom bar ───────────────────────────────────── */}
                    <div
                        className="ft-bottom mt-10 pt-5 flex flex-col items-center gap-2"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                    >
                        <div className="flex items-center gap-1.5 text-xs text-zinc-700">
                            <span>Impulsado por</span>
                            <span className="font-black tracking-tight" style={{ color: `${config.primary_color}cc` }}>Mechss</span>
                            <Zap className="w-3 h-3" style={{ color: `${config.primary_color}70` }} />
                        </div>
                        <p className="text-zinc-600 text-[10px] text-center">
                            © {new Date().getFullYear()} <span className="text-zinc-500">{workshop.name}</span>. Todos los derechos reservados.
                        </p>
                    </div>

                </div>
            </footer>
        )
    }

    /* ════════════════════════════════════════════════════════════════════
        DESKTOP LAYOUT
    ════════════════════════════════════════════════════════════════════ */
    return (
        <footer ref={containerRef} className="relative w-full mt-16 overflow-hidden">

            {/* Decorative top line */}
            <div
                className="absolute top-0 inset-x-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent 0%, ${config.primary_color} 30%, ${config.primary_color} 70%, transparent 100%)` }}
            />
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-32 blur-[90px] opacity-[0.09] pointer-events-none"
                style={{ backgroundColor: config.primary_color }}
            />
            <div
                className="absolute inset-0 opacity-[0.015] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(${config.primary_color} 1px, transparent 1px), linear-gradient(90deg, ${config.primary_color} 1px, transparent 1px)`,
                    backgroundSize: '48px 48px',
                }}
            />
            <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full blur-[140px] opacity-[0.06] pointer-events-none" style={{ backgroundColor: config.primary_color }} />
            <div className="absolute top-8 -right-16 w-60 h-60 rounded-full blur-[120px] opacity-[0.04] pointer-events-none" style={{ backgroundColor: config.primary_color }} />

            <div className="relative z-10 w-full max-w-5xl mx-auto px-8 pt-14 pb-10">

                {/* 3-col grid */}
                <div className="grid grid-cols-3 gap-x-14">

                    {/* Brand */}
                    <div className="ft-brand flex flex-col gap-4">
                        {config.logo_url && (
                            <img
                                src={config.logo_url}
                                alt={`Logo ${workshop.name}`}
                                className="h-16 w-auto max-w-[160px] object-contain object-left"
                            />
                        )}
                        <div className="flex items-center gap-2.5">
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center border"
                                style={{ backgroundColor: `${config.primary_color}18`, borderColor: `${config.primary_color}35` }}
                            >
                                <Zap className="w-4 h-4" style={{ color: config.primary_color }} />
                            </div>
                            <span className="text-white font-black text-xl tracking-tight">{workshop.name}</span>
                        </div>
                        {fc.tagline && (
                            <p className="text-zinc-400 text-sm leading-relaxed">{fc.tagline}</p>
                        )}
                        {socialLinks.length > 0 && (
                            <div className="flex items-center gap-2 pt-1">
                                {socialLinks.map(s => (
                                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                                        className={`w-10 h-10 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-zinc-400 transition-all duration-200 active:scale-95 ${s.hover}`}>
                                        {s.icon}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Contact */}
                    {hasContact && (
                        <div className="ft-col flex flex-col gap-4">
                            <SectionLabel>Contacto</SectionLabel>
                            <div className="flex flex-col gap-3.5">
                                {workshop.phone && (
                                    <a href={`tel:${workshop.phone}`} className="group flex items-center gap-3">
                                        <IconPill><Phone className="w-3.5 h-3.5" style={{ color: config.primary_color }} /></IconPill>
                                        <span className="text-zinc-400 text-sm group-hover:text-white transition-colors">{workshop.phone}</span>
                                    </a>
                                )}
                                {fc.address && (
                                    <div className="flex items-start gap-3">
                                        <IconPill><MapPin className="w-3.5 h-3.5 mt-[1px]" style={{ color: config.primary_color }} /></IconPill>
                                        <span className="text-zinc-400 text-sm leading-relaxed pt-1.5">{fc.address}</span>
                                    </div>
                                )}
                                {fc.hours && (
                                    <div className="flex items-center gap-3">
                                        <IconPill><Clock className="w-3.5 h-3.5" style={{ color: config.primary_color }} /></IconPill>
                                        <span className="text-zinc-400 text-sm">{fc.hours}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Quick links */}
                    <div className="ft-col flex flex-col gap-4">
                        <SectionLabel>Accesos Rápidos</SectionLabel>
                        <div className="flex flex-col gap-3.5">
                            {quickLinks.map(link => (
                                <a key={link.label} href={link.href}
                                    className="group flex items-center gap-2.5 text-sm text-zinc-500 hover:text-white transition-colors">
                                    <span
                                        className="w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-[2]"
                                        style={{ backgroundColor: config.primary_color }}
                                    />
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div
                    className="ft-bottom mt-12 pt-6 flex items-center justify-between"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                    <p className="text-zinc-600 text-xs">
                        © {new Date().getFullYear()}{' '}
                        <span className="text-zinc-500">{workshop.name}</span>.
                        {' '}Todos los derechos reservados.
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-700">
                        <span>Impulsado por</span>
                        <span className="font-black tracking-tight" style={{ color: `${config.primary_color}cc` }}>Mechss</span>
                        <Zap className="w-3 h-3" style={{ color: `${config.primary_color}70` }} />
                    </div>
                </div>
            </div>
        </footer>
    )
}
