'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Phone, MapPin, Clock, Zap } from 'lucide-react'

gsap.registerPlugin(useGSAP, ScrollTrigger)

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
}

export default function LandingFooter({ config, workshop, preview }: FooterProps) {
    const containerRef = useRef<HTMLElement>(null)

    const contactBlock = config.blocks?.find(b => b.type === 'contact' && b.visible)
    const heroBlock = config.blocks?.find(b => b.type === 'hero' && b.visible)

    useGSAP(() => {
        if (preview) return

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReducedMotion) return

        gsap.fromTo('.footer-brand', { opacity: 0, y: 24 }, {
            opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
            scrollTrigger: { trigger: containerRef.current, start: 'top 92%', once: true }
        })
        gsap.fromTo('.footer-info-item', { opacity: 0, y: 16 }, {
            opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.1,
            scrollTrigger: { trigger: containerRef.current, start: 'top 90%', once: true }
        })
        gsap.fromTo('.footer-copy', { opacity: 0 }, {
            opacity: 1, duration: 0.5, delay: 0.4,
            scrollTrigger: { trigger: containerRef.current, start: 'top 90%', once: true }
        })
    }, { scope: containerRef })

    return (
        <footer ref={containerRef} className="relative w-full mt-8 pb-safe">
            {/* Top gradient rule */}
            <div
                className="h-px w-full"
                style={{ background: `linear-gradient(90deg, transparent 0%, ${config.primary_color} 40%, ${config.primary_color} 60%, transparent 100%)` }}
            />

            <div className="px-6 py-10 space-y-8">
                {/* Brand */}
                <div className="footer-brand flex items-center gap-3">
                    {config.logo_url ? (
                        <img
                            src={config.logo_url}
                            alt={workshop.name}
                            className="h-9 max-w-[130px] object-contain"
                        />
                    ) : (
                        <div className="flex items-center gap-2">
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${config.primary_color}20` }}
                            >
                                <Zap className="w-4 h-4" style={{ color: config.primary_color }} />
                            </div>
                            <span className="text-white font-black text-lg tracking-tight">{workshop.name}</span>
                        </div>
                    )}
                </div>

                {/* Info grid */}
                {(workshop.phone || contactBlock) && (
                    <div className="space-y-3">
                        {workshop.phone && (
                            <a
                                href={`tel:${workshop.phone}`}
                                className="footer-info-item flex items-center gap-3 group"
                            >
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: `${config.primary_color}15` }}
                                >
                                    <Phone className="w-3.5 h-3.5" style={{ color: config.primary_color }} />
                                </div>
                                <span className="text-zinc-400 text-sm group-hover:text-white transition-colors">
                                    {workshop.phone}
                                </span>
                            </a>
                        )}

                        {contactBlock?.content?.address && (
                            <div className="footer-info-item flex items-start gap-3">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                    style={{ backgroundColor: `${config.primary_color}15` }}
                                >
                                    <MapPin className="w-3.5 h-3.5" style={{ color: config.primary_color }} />
                                </div>
                                <span className="text-zinc-400 text-sm leading-relaxed">
                                    {contactBlock.content.address}
                                </span>
                            </div>
                        )}

                        {contactBlock?.content?.hours && (
                            <div className="footer-info-item flex items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: `${config.primary_color}15` }}
                                >
                                    <Clock className="w-3.5 h-3.5" style={{ color: config.primary_color }} />
                                </div>
                                <span className="text-zinc-400 text-sm">
                                    {contactBlock.content.hours}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Copyright */}
                <div className="footer-copy pt-4 border-t border-white/5 flex flex-col gap-1">
                    <p className="text-zinc-600 text-xs">
                        © {new Date().getFullYear()} {workshop.name}. Todos los derechos reservados.
                    </p>
                    <p className="text-zinc-700 text-xs">
                        Impulsado por{' '}
                        <span className="font-semibold" style={{ color: `${config.primary_color}99` }}>
                            Mechss
                        </span>
                    </p>
                </div>
            </div>
        </footer>
    )
}
