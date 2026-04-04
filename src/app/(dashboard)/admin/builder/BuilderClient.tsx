'use client'

import { useState, useEffect } from 'react'
import { Monitor, Smartphone, LayoutTemplate, Palette, Type, Save, Link as LinkIcon, Eye, Zap, Loader2, Shapes } from 'lucide-react'
import { getLandingPageConfigAction, updateLandingPageConfigAction, LandingPageConfig } from '@/lib/actions/builder'

export default function BuilderClient() {
    const [config, setConfig] = useState<LandingPageConfig | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isMobilePreview, setIsMobilePreview] = useState(false)
    const [error, setError] = useState('')

    // Fonts supported by Tailwind/Google Fonts that we'll inject via style or rely on global CSS
    const fontOptions = [
        { id: 'Inter', label: 'Inter (Moderno)' },
        { id: 'Arial', label: 'Arial (Clásico)' },
        { id: 'monospace', label: 'Mono (Codificador)' },
        { id: 'system-ui', label: 'System (Nativo)' }
    ]

    const radiusOptions = [
        { id: 'rounded-none', label: 'Cuadrado' },
        { id: 'rounded-xl', label: 'Suave' },
        { id: 'rounded-full', label: 'Píldora' }
    ]

    const presetColors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f43f5e', '#eab308']

    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = async () => {
        setIsLoading(true)
        const res = await getLandingPageConfigAction()
        if (res.ok) {
            setConfig(res.data)
        } else {
            setError(res.error)
        }
        setIsLoading(false)
    }

    const handleChange = (field: keyof LandingPageConfig, value: any) => {
        if (!config) return
        setConfig({ ...config, [field]: value })
    }

    const handleBlockChange = (blockId: string, contentField: string, value: string) => {
        if (!config) return
        const newBlocks = config.blocks.map(b => {
            if (b.id === blockId) {
                return { ...b, content: { ...b.content, [contentField]: value } }
            }
            return b
        })
        setConfig({ ...config, blocks: newBlocks })
    }

    const handleSave = async () => {
        if (!config) return
        setIsSaving(true)
        setError('')
        const { id, workshop_id, ...updates } = config
        const res = await updateLandingPageConfigAction(updates)
        if (!res.ok) {
            setError(res.error)
        }
        setIsSaving(false)
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                <p className="text-zinc-500 font-semibold animate-pulse">Cargando constructor...</p>
            </div>
        )
    }

    if (!config) return null

    // For the preview panel
    const heroBlock = config.blocks.find(b => b.type === 'hero')
    const trackBlock = config.blocks.find(b => b.type === 'tracking')

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in zoom-in-95 duration-500 gap-4">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        <Palette className="w-6 h-6 text-orange-500" /> Constructor Landing Page
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-bold bg-white/10 text-white px-2 py-0.5 rounded border border-white/10 tracking-wider">
                            URL: /t/{config.slug}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Toggle de Vista */}
                    <div className="flex bg-zinc-900 border border-white/5 p-1 rounded-lg">
                        <button
                            onClick={() => setIsMobilePreview(false)}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition ${!isMobilePreview ? 'text-white bg-white/10 shadow-sm' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Monitor className="w-4 h-4" /> PC
                        </button>
                        <button
                            onClick={() => setIsMobilePreview(true)}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition ${isMobilePreview ? 'text-white bg-white/10 shadow-sm' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Smartphone className="w-4 h-4" /> Móvil
                        </button>
                    </div>

                    <a
                        href={`/t/${config.slug}`}
                        target="_blank"
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                    >
                        <Eye className="w-4 h-4" /> Ver en vivo
                    </a>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl p-3 font-medium flex-shrink-0">
                    {error}
                </div>
            )}

            {/* Main Builder Area */}
            <div className="flex max-lg:flex-col flex-1 min-h-0 gap-6 overflow-hidden mt-2">

                {/* Sidebar Config */}
                <aside className="w-full lg:w-80 flex flex-col bg-zinc-900/50 border border-white/5 rounded-2xl overflow-y-auto backdrop-blur-md shrink-0 scrollbar-thin scrollbar-thumb-zinc-700">
                    <div className="p-5 border-b border-white/5">
                        <h2 className="text-sm font-semibold text-white">Configuración del sitio</h2>
                    </div>

                    <div className="p-5 space-y-6 pb-20">

                        {/* General */}
                        <div>
                            <p className="flex items-center gap-2 text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
                                <LinkIcon className="w-3.5 h-3.5" /> Enlace (Slug)
                            </p>
                            <input
                                type="text"
                                value={config.slug}
                                onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
                                className="w-full bg-black/40 border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                            />
                        </div>

                        <div className="h-px bg-white/5 my-4" />

                        {/* Theme */}
                        <div>
                            <p className="flex items-center gap-2 text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
                                <Palette className="w-3.5 h-3.5" /> Diseño y Color
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-zinc-500 block mb-1">Color Principal</label>
                                    <div className="flex gap-2 mb-2">
                                        {presetColors.map(color => (
                                            <div
                                                key={color}
                                                onClick={() => handleChange('primary_color', color)}
                                                className="w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110"
                                                style={{ backgroundColor: color, border: config.primary_color === color ? '2px solid white' : 'none' }}
                                            />
                                        ))}
                                    </div>
                                    <input
                                        type="color"
                                        value={config.primary_color}
                                        onChange={(e) => handleChange('primary_color', e.target.value)}
                                        className="w-full h-8 cursor-pointer rounded-lg border-none bg-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-zinc-500 block mb-1 flex items-center gap-1"><Type className="w-3 h-3" /> Fuente</label>
                                    <select
                                        value={config.font_family}
                                        onChange={(e) => handleChange('font_family', e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-lg p-2 text-sm text-white focus:outline-none"
                                    >
                                        {fontOptions.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs text-zinc-500 block mb-1 flex items-center gap-1"><Shapes className="w-3 h-3" /> Bordes de Botones</label>
                                    <select
                                        value={config.button_radius}
                                        onChange={(e) => handleChange('button_radius', e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-lg p-2 text-sm text-white focus:outline-none"
                                    >
                                        {radiusOptions.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-white/5 my-4" />

                        {/* Content Blocks */}
                        <div>
                            <p className="flex items-center gap-2 text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
                                <LayoutTemplate className="w-3.5 h-3.5" /> Textos (Hero)
                            </p>

                            {heroBlock && (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={heroBlock.content.title || ''}
                                        onChange={(e) => handleBlockChange(heroBlock.id, 'title', e.target.value)}
                                        placeholder="Título principal"
                                        className="w-full bg-black/40 border border-white/5 rounded-lg p-2.5 text-sm text-white font-bold"
                                    />
                                    <textarea
                                        value={heroBlock.content.subtitle || ''}
                                        onChange={(e) => handleBlockChange(heroBlock.id, 'subtitle', e.target.value)}
                                        placeholder="Subtítulo..."
                                        rows={3}
                                        className="w-full bg-black/40 border border-white/5 rounded-lg p-2.5 text-sm text-white resize-none"
                                    />
                                    <input
                                        type="text"
                                        value={heroBlock.content.image_url || ''}
                                        onChange={(e) => handleBlockChange(heroBlock.id, 'image_url', e.target.value)}
                                        placeholder="URL de imagen de fondo (opcional)"
                                        className="w-full bg-black/40 border border-white/5 rounded-lg p-2.5 text-sm text-white font-mono placeholder:font-sans"
                                    />
                                </div>
                            )}
                        </div>

                    </div>
                </aside>

                {/* Live Preview Pane */}
                <main className="flex-1 bg-black/60 rounded-2xl border border-white/5 flex items-center justify-center p-4 lg:p-8 overflow-hidden backdrop-blur-sm relative">

                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-full px-3 py-1 shadow-lg pointer-events-none z-10">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-medium text-white tracking-wide">Live Preview</span>
                    </div>

                    <div
                        className={`
                            bg-[#09090b] border border-white/10 shadow-2xl overflow-y-auto overflow-x-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] relative
                            ${isMobilePreview ? 'w-[375px] h-[812px] rounded-[3rem] ring-[8px] ring-zinc-800' : 'w-full h-full rounded-xl'}
                        `}
                        style={{ fontFamily: config.font_family }}
                    >
                        {/* Mobile Notch */}
                        {isMobilePreview && (
                            <div className="sticky top-0 w-full h-6 flex justify-center pt-2 z-50 bg-[#09090b]">
                                <div className="w-32 h-6 bg-zinc-800 rounded-b-2xl" />
                            </div>
                        )}

                        {/* Rendering the actual Landing Page Preview inside the container */}
                        <div className="relative min-h-full pb-20">
                            {/* Decorative ambient light */}
                            <div
                                className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] blur-[100px] opacity-20 pointer-events-none"
                                style={{ backgroundColor: config.primary_color }}
                            ></div>

                            {/* Optional Hero Banner Image */}
                            {heroBlock?.content.image_url && (
                                <div className="absolute top-0 left-0 w-full h-[500px] pointer-events-none overflow-hidden">
                                    <div
                                        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 transition-all duration-700"
                                        style={{ backgroundImage: `url(${heroBlock.content.image_url})` }}
                                    ></div>
                                    {/* Gradient to fade into the background color */}
                                    <div
                                        className="absolute inset-0"
                                        style={{ background: `linear-gradient(to bottom, transparent 0%, transparent 40%, ${config.bg_color || '#09090b'} 100%)` }}
                                    ></div>
                                </div>
                            )}

                            <header className="px-6 py-5 border-b border-white/5 flex items-center justify-between relative z-10 backdrop-blur-md">
                                <div className="font-black text-xl tracking-tight flex items-center gap-2">
                                    <Zap className="w-5 h-5" style={{ color: config.primary_color }} />
                                    Logo
                                </div>
                            </header>

                            <section className="px-6 py-16 sm:py-24 text-center relative z-10">
                                <h1 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">
                                    {heroBlock?.content.title}
                                </h1>
                                <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
                                    {heroBlock?.content.subtitle}
                                </p>

                                {/* Mock Tracking Input Area */}
                                <div className="max-w-md mx-auto bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
                                    <h3 className="font-bold text-white mb-4 text-left">{trackBlock?.content.title || 'Rastrea tu moto'}</h3>
                                    <div className="flex gap-2">
                                        <input
                                            disabled
                                            placeholder="#REP-XXXXXXX"
                                            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 placeholder:text-zinc-600 focus:outline-none"
                                        />
                                        <button
                                            className={`px-6 py-3 font-bold text-white transition-opacity hover:opacity-90 ${config.button_radius}`}
                                            style={{ backgroundColor: config.primary_color }}
                                        >
                                            Buscar
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </main>

            </div>
        </div>
    )
}
