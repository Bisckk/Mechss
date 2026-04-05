'use client'

import { useState, useEffect, useCallback } from 'react'
import { Monitor, Smartphone, LayoutTemplate, Palette, Type, Save, Link as LinkIcon, Eye, EyeOff, Zap, Loader2, Shapes, ChevronUp, ChevronDown, Rocket, Search, ShoppingCart, Wrench, Image as ImageIcon, Star, MessageCircleQuestion, MapPin, Plus, Pipette, ArrowLeft, Trash2, Box, CheckCircle2, XCircle } from 'lucide-react'
import { getLandingPageConfigAction, updateLandingPageConfigAction, LandingPageConfig } from '@/lib/actions/builder'
import ImageUploader from '@/components/ui/ImageUploader'

import LandingClient from '@/app/t/[slug]/LandingClient'

type ToastType = 'success' | 'error'
interface Toast {
    id: number
    type: ToastType
    message: string
}

export default function BuilderClient({ initialConfig, workshop, products }: { initialConfig?: LandingPageConfig | null, workshop: any, products: any[] }) {
    const [config, setConfig] = useState<LandingPageConfig | null>(initialConfig || null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isMobilePreview, setIsMobilePreview] = useState(false)
    const [error, setError] = useState('')
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((type: ToastType, message: string) => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, type, message }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
    }, [])

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
        if (!initialConfig) {
            loadConfig()
        } else {
            setIsLoading(false)
        }
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

    const handleBlockContentChange = (id: string, contentField: string, value: string) => {
        if (!config) return
        const newBlocks = config.blocks.map(b => {
            if (b.id === id) {
                return { ...b, content: { ...b.content, [contentField]: value } }
            }
            return b
        })
        setConfig({ ...config, blocks: newBlocks })
    }

    const handleBlockArrayItemChange = (id: string, arrayName: string, itemIndex: number, field: string, value: string) => {
        if (!config) return
        const newBlocks = config.blocks.map(b => {
            if (b.id === id) {
                const currentArray = b.content[arrayName] || []
                const newArray = [...currentArray]
                newArray[itemIndex] = { ...newArray[itemIndex], [field]: value }
                return { ...b, content: { ...b.content, [arrayName]: newArray } }
            }
            return b
        })
        setConfig({ ...config, blocks: newBlocks })
    }

    const addBlockArrayItem = (id: string, arrayName: string, defaultItem: any) => {
        if (!config) return
        const newBlocks = config.blocks.map(b => {
            if (b.id === id) {
                const currentArray = b.content[arrayName] || []
                return { ...b, content: { ...b.content, [arrayName]: [...currentArray, defaultItem] } }
            }
            return b
        })
        setConfig({ ...config, blocks: newBlocks })
    }

    const deleteBlockArrayItem = (id: string, arrayName: string, itemIndex: number) => {
        if (!config) return
        const newBlocks = config.blocks.map(b => {
            if (b.id === id) {
                const currentArray = b.content[arrayName] || []
                return { ...b, content: { ...b.content, [arrayName]: currentArray.filter((_: any, i: number) => i !== itemIndex) } }
            }
            return b
        })
        setConfig({ ...config, blocks: newBlocks })
    }

    const handleBlockVisibility = (id: string, visible: boolean) => {
        if (!config) return
        const newBlocks = config.blocks.map(b => b.id === id ? { ...b, visible } : b)
        setConfig({ ...config, blocks: newBlocks })
    }

    const handleSave = async () => {
        if (!config) return
        setIsSaving(true)
        const res = await updateLandingPageConfigAction(config)
        if (res.ok) {
            showToast('success', '¡Landing page guardada con éxito!')
        } else {
            showToast('error', `Error al guardar: ${res.error}`)
        }
        setIsSaving(false)
    }

    const [activeTab, setActiveTab] = useState<'main' | 'block'>('main')
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)

    // ... (rest kept as logic)
    const moveBlock = (index: number, direction: 'up' | 'down') => {
        if (!config) return
        const newBlocks = [...config.blocks]
        if (direction === 'up' && index > 0) {
            const temp = newBlocks[index - 1]
            newBlocks[index - 1] = newBlocks[index]
            newBlocks[index] = temp
        } else if (direction === 'down' && index < newBlocks.length - 1) {
            const temp = newBlocks[index + 1]
            newBlocks[index + 1] = newBlocks[index]
            newBlocks[index] = temp
        }
        setConfig({ ...config, blocks: newBlocks })
    }

    const addBlock = (type: string) => {
        if (!config) return
        const newBlock = {
            id: `${type}_${Date.now()}`,
            type,
            visible: true,
            content: { title: `Nuevo Bloque` }
        }
        setConfig({ ...config, blocks: [...config.blocks, newBlock] })
    }

    const deleteBlock = (id: string) => {
        if (!config) return
        setConfig({ ...config, blocks: config.blocks.filter(b => b.id !== id) })
        if (activeBlockId === id) setActiveTab('main')
    }

    const openBlockEditor = (id: string) => {
        setActiveBlockId(id)
        setActiveTab('block')
    }

    if (isLoading) return <div className="p-8 text-white">Cargando constructor...</div>
    if (error || !config) return <div className="p-8 text-red-500">Error: {error || 'No se pudo cargar la configuración.'}</div>

    const activeBlock = config.blocks.find(b => b.id === activeBlockId)

    const BLOCK_TYPES = [
        { id: 'hero', label: 'Banner Principal', icon: Rocket },
        { id: 'tracking', label: 'Rastreo en Vivo', icon: Search },
        { id: 'ecommerce', label: 'Tienda en Línea', icon: ShoppingCart },
        { id: 'services', label: 'Servicios', icon: Wrench },
        { id: 'gallery', label: 'Galería de Trabajos', icon: ImageIcon },
        { id: 'testimonials', label: 'Testimonios', icon: Star },
        { id: 'faq', label: 'Preguntas Frecuentes', icon: MessageCircleQuestion },
        { id: 'contact', label: 'Mapa y Contacto', icon: MapPin },
    ]

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 overflow-hidden text-white font-sans animate-in fade-in duration-500">

            {/* Toast Notifications */}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border pointer-events-auto
                            animate-in slide-in-from-right-4 fade-in duration-300
                            ${toast.type === 'success'
                                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100 shadow-emerald-900/40'
                                : 'bg-rose-950/90 border-rose-500/30 text-rose-100 shadow-rose-900/40'
                            }`}
                        style={{ minWidth: 280 }}
                    >
                        {toast.type === 'success'
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            : <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        }
                        <p className="text-sm font-semibold leading-snug">{toast.message}</p>
                        <div
                            className={`absolute bottom-0 left-0 h-0.5 rounded-full animate-[shrink_4s_linear_forwards]
                                ${toast.type === 'success' ? 'bg-emerald-400/60' : 'bg-rose-400/60'}`}
                            style={{ width: '100%' }}
                        />
                    </div>
                ))}
            </div>

            {/* Panel de Controles (Izquierdo) */}
            <div className="w-[380px] bg-zinc-900 border-r border-white/5 flex flex-col h-full shrink-0 relative z-20 shadow-2xl">
                {/* Header */}
                <div className="p-5 border-b border-white/5 flex items-center justify-between bg-zinc-950/50 backdrop-blur-md">
                    <div className="flex items-center gap-2 font-bold text-white tracking-tight">
                        <Palette className="w-4 h-4 text-orange-500" />
                        Apariencia Web
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg hover:shadow-orange-500/20 active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Guardar
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto customize-scrollbar">
                    {activeTab === 'main' ? (
                        <div className="p-5 space-y-8">
                            {/* COLORES Y TIPOGRAFÍA */}
                            <section className="space-y-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shapes className="w-4 h-4 text-zinc-400" />
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Estética Base</h3>
                                </div>

                                {/* Color Tema */}
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 block mb-2">Color Primario</label>
                                    <div className="flex flex-wrap gap-2">
                                        {presetColors.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => handleChange('primary_color', c)}
                                                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 ${config.primary_color === c ? 'border-white scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                        <div className="relative">
                                            <input
                                                type="color"
                                                value={config.primary_color}
                                                onChange={(e) => handleChange('primary_color', e.target.value)}
                                                className="w-8 h-8 rounded-full border-2 border-white/10 opacity-0 absolute inset-0 cursor-pointer"
                                            />
                                            <div className="w-8 h-8 rounded-full border-2 border-white/10 flex items-center justify-center bg-zinc-800 text-xs text-zinc-400">
                                                <Pipette className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Forma de Botones */}
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 block mb-2">Forma de Botones</label>
                                    <div className="flex gap-2">
                                        {radiusOptions.map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => handleChange('button_radius', opt.id)}
                                                className={`flex-1 py-1.5 px-1 text-xs font-bold text-center border transition-all ${opt.id} ${config.button_radius === opt.id ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' : 'bg-black/40 border-white/10 text-zinc-500 hover:text-white'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Logo */}
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 block mb-2">Logo del Taller</label>
                                    <p className="text-[11px] text-zinc-600 mb-2">Se muestra en la cabecera de la landing page.</p>
                                    <ImageUploader
                                        value={config.logo_url || ''}
                                        onChange={(url) => handleChange('logo_url', url)}
                                        folder="landing"
                                        compact
                                    />
                                </div>

                                {/* Cover / Banner */}
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 block mb-2">Imagen de Portada</label>
                                    <p className="text-[11px] text-zinc-600 mb-2">Banner principal que aparece en la parte superior de la página.</p>
                                    <ImageUploader
                                        value={config.cover_url || ''}
                                        onChange={(url) => handleChange('cover_url', url)}
                                        folder="landing"
                                        compact
                                    />
                                </div>

                                {/* Tipografía */}
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 block mb-2">Tipografía Principal</label>
                                    <select
                                        value={config.font_family}
                                        onChange={(e) => handleChange('font_family', e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500/50"
                                    >
                                        {fontOptions.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                    </select>
                                </div>
                            </section>

                            <hr className="border-white/5" />

                            {/* REORDERABLE LAYERS */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <LayoutTemplate className="w-4 h-4 text-zinc-400" />
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Capas de la Página</h3>
                                </div>

                                <div className="space-y-2">
                                    {config.blocks.map((block, index) => {
                                        const typeInfo = BLOCK_TYPES.find(t => t.id === block.type)
                                        return (
                                            <div key={block.id} className="flex items-center bg-white/[0.02] border border-white/5 rounded-xl p-2 group hover:border-orange-500/30 transition-all">
                                                <div className="flex flex-col gap-1 mr-2 px-1">
                                                    <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="text-zinc-600 hover:text-white disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                                                    <button onClick={() => moveBlock(index, 'down')} disabled={index === config.blocks.length - 1} className="text-zinc-600 hover:text-white disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                                                </div>

                                                <div
                                                    className="flex-1 cursor-pointer flex items-center gap-3"
                                                    onClick={() => openBlockEditor(block.id)}
                                                >
                                                    <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400">
                                                        {typeInfo ? <typeInfo.icon className="w-5 h-5" /> : <Box className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-bold ${block.visible ? 'text-white' : 'text-zinc-500 line-through'}`}>{typeInfo?.label || block.type}</p>
                                                        <p className="text-xs text-zinc-500 truncate max-w-[150px]">{block.content.title || 'Sin Título'}</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleBlockVisibility(block.id, !block.visible)}
                                                        className="p-2 bg-black/40 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                                    >
                                                        {block.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 opacity-50" />}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteBlock(block.id)}
                                                        className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Menu Add Block */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                                        className="w-full py-3 mt-2 rounded-xl border border-dashed border-white/20 text-zinc-400 font-bold text-sm hover:border-orange-500/50 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Agregar Sección {isAddMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>

                                    {isAddMenuOpen && (
                                        <div className="mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-2 grid grid-cols-2 gap-2 z-50">
                                            {BLOCK_TYPES.map(bt => (
                                                <button
                                                    key={bt.id}
                                                    onClick={() => { addBlock(bt.id); setIsAddMenuOpen(false); }}
                                                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-zinc-950/50 hover:bg-orange-500/10 hover:text-orange-400 transition-colors text-xs text-zinc-300 font-medium text-center gap-2"
                                                >
                                                    <bt.icon className="w-6 h-6" />
                                                    {bt.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </section>
                        </div>
                    ) : (
                        <div className="p-5 animate-in slide-in-from-right-4 duration-300 space-y-6">
                            <button
                                onClick={() => setActiveTab('main')}
                                className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors bg-white/5 px-3 py-2 rounded-lg"
                            >
                                <ArrowLeft className="w-4 h-4" /> Volver a Capas
                            </button>

                            {activeBlock && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-black text-white capitalize flex items-center gap-3 border-b border-white/10 pb-4">
                                        {(() => {
                                            const TypeIcon = BLOCK_TYPES.find(t => t.id === activeBlock.type)?.icon || Box
                                            return <TypeIcon className="w-5 h-5 text-orange-500" />
                                        })()}
                                        Editando: {BLOCK_TYPES.find(t => t.id === activeBlock.type)?.label || activeBlock.type}
                                    </h2>

                                    {/* BLOCK EDITOR FORMS */}
                                    <div>
                                        <label className="text-xs text-zinc-500 block mb-1">Título</label>
                                        <input
                                            value={activeBlock.content.title || ''}
                                            onChange={(e) => handleBlockContentChange(activeBlock.id, 'title', e.target.value)}
                                            className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-sm focus:border-orange-500/50 outline-none text-white"
                                            placeholder="Título principal..."
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-zinc-500 block mb-1">Subtítulo / Texto Corto</label>
                                        <textarea
                                            value={activeBlock.content.subtitle || ''}
                                            onChange={(e) => handleBlockContentChange(activeBlock.id, 'subtitle', e.target.value)}
                                            className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-sm focus:border-orange-500/50 outline-none text-white min-h-[80px]"
                                            placeholder="Descripción o promesa de valor..."
                                        />
                                    </div>

                                    {(activeBlock.type === 'hero' || activeBlock.type === 'gallery') && (
                                        <div>
                                            <label className="text-xs text-zinc-500 block mb-1">Imagen</label>
                                            <ImageUploader
                                                value={activeBlock.content.image_url || ''}
                                                onChange={(url) => handleBlockContentChange(activeBlock.id, 'image_url', url)}
                                                folder="landing"
                                                compact
                                            />
                                        </div>
                                    )}

                                    {activeBlock.type === 'contact' && (
                                        <>
                                            <div>
                                                <label className="text-xs text-zinc-500 block mb-1">Dirección Física</label>
                                                <input
                                                    value={activeBlock.content.address || ''}
                                                    onChange={(e) => handleBlockContentChange(activeBlock.id, 'address', e.target.value)}
                                                    className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-sm focus:border-orange-500/50 outline-none text-white"
                                                    placeholder="Av. Las Américas 123..."
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-500 block mb-1">Horario de Atención</label>
                                                <input
                                                    value={activeBlock.content.hours || ''}
                                                    onChange={(e) => handleBlockContentChange(activeBlock.id, 'hours', e.target.value)}
                                                    className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-sm focus:border-orange-500/50 outline-none text-white"
                                                    placeholder="Lunes a Viernes de 9am a 6pm"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* DYNAMIC ARRAY EDITORS */}
                                    {activeBlock.type === 'services' && (
                                        <div className="pt-4 border-t border-white/5">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-sm font-bold text-white">Tarjetas de Servicio</h3>
                                                <button onClick={() => addBlockArrayItem(activeBlock.id, 'items', { title: 'Nuevo Servicio', desc: 'Descripción del servicio' })} className="text-xs bg-orange-500/20 text-orange-500 px-2 py-1 rounded hover:bg-orange-500/30">
                                                    + Añadir
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                {(activeBlock.content.items || []).map((item: any, i: number) => (
                                                    <div key={i} className="bg-white/5 p-3 rounded-xl relative group border border-white/5">
                                                        <button onClick={() => deleteBlockArrayItem(activeBlock.id, 'items', i)} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        <input value={item.title || ''} onChange={(e) => handleBlockArrayItemChange(activeBlock.id, 'items', i, 'title', e.target.value)} className="w-full bg-transparent border-b border-white/10 p-1 mb-2 text-sm text-white focus:outline-none focus:border-orange-500 font-bold" placeholder="Título" />
                                                        <textarea value={item.desc || ''} onChange={(e) => handleBlockArrayItemChange(activeBlock.id, 'items', i, 'desc', e.target.value)} className="w-full bg-black/20 rounded p-2 text-xs text-zinc-300 focus:outline-none min-h-[60px]" placeholder="Descripción" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeBlock.type === 'faq' && (
                                        <div className="pt-4 border-t border-white/5">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-sm font-bold text-white">Preguntas</h3>
                                                <button onClick={() => addBlockArrayItem(activeBlock.id, 'items', { q: '¿Nueva Pregunta?', a: 'Respuesta' })} className="text-xs bg-orange-500/20 text-orange-500 px-2 py-1 rounded hover:bg-orange-500/30">
                                                    + Añadir
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                {(activeBlock.content.items || []).map((item: any, i: number) => (
                                                    <div key={i} className="bg-white/5 p-3 rounded-xl relative group border border-white/5">
                                                        <button onClick={() => deleteBlockArrayItem(activeBlock.id, 'items', i)} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        <input value={item.q || ''} onChange={(e) => handleBlockArrayItemChange(activeBlock.id, 'items', i, 'q', e.target.value)} className="w-full bg-transparent border-b border-white/10 p-1 mb-2 text-sm text-white focus:outline-none focus:border-orange-500 font-bold" placeholder="Pregunta" />
                                                        <textarea value={item.a || ''} onChange={(e) => handleBlockArrayItemChange(activeBlock.id, 'items', i, 'a', e.target.value)} className="w-full bg-black/20 rounded p-2 text-xs text-zinc-300 focus:outline-none min-h-[60px]" placeholder="Respuesta" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeBlock.type === 'testimonials' && (
                                        <div className="pt-4 border-t border-white/5">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-sm font-bold text-white">Testimonios</h3>
                                                <button onClick={() => addBlockArrayItem(activeBlock.id, 'items', { quote: 'Excelente excelente', author: 'Juan' })} className="text-xs bg-orange-500/20 text-orange-500 px-2 py-1 rounded hover:bg-orange-500/30">
                                                    + Añadir
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                {(activeBlock.content.items || []).map((item: any, i: number) => (
                                                    <div key={i} className="bg-white/5 p-3 rounded-xl relative group border border-white/5 flex flex-col gap-2">
                                                        <button onClick={() => deleteBlockArrayItem(activeBlock.id, 'items', i)} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        <textarea value={item.quote || ''} onChange={(e) => handleBlockArrayItemChange(activeBlock.id, 'items', i, 'quote', e.target.value)} className="w-full bg-black/20 rounded p-2 text-xs text-zinc-300 focus:outline-none min-h-[60px] italic" placeholder="Cita del cliente" />
                                                        <input value={item.author || ''} onChange={(e) => handleBlockArrayItemChange(activeBlock.id, 'items', i, 'author', e.target.value)} className="w-full bg-transparent border-b border-white/10 p-1 text-sm text-white focus:outline-none focus:border-orange-500 font-bold" placeholder="Nombre (Ej. Juan)" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-white/5 bg-black/20">
                    <a href={`/t/${config.slug}`} target="_blank" className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg text-sm font-bold transition-all">
                        <LinkIcon className="w-4 h-4" />
                        Ver en Vivo
                    </a>
                </div>
            </div>

            {/* Panel de Preview (Derecho) */}
            <div className="flex-1 bg-black overflow-hidden flex flex-col relative">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

                {/* Barra de Toggles — fuera del frame, no interfiere */}
                <div className="relative z-30 shrink-0 flex items-center justify-center py-3 border-b border-white/5 bg-black/40 backdrop-blur-md">
                    <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 p-1 rounded-full">
                        <button
                            onClick={() => setIsMobilePreview(false)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all text-xs font-semibold ${!isMobilePreview ? 'bg-zinc-700 text-white shadow-inner' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Monitor className="w-3.5 h-3.5" />
                            Desktop
                        </button>
                        <button
                            onClick={() => setIsMobilePreview(true)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all text-xs font-semibold ${isMobilePreview ? 'bg-orange-500/20 text-orange-400' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Smartphone className="w-3.5 h-3.5" />
                            Mobile
                            {isMobilePreview && <span className="text-[9px] bg-orange-500/30 text-orange-300 px-1.5 py-0.5 rounded-full font-bold tracking-wide">FIRST</span>}
                        </button>
                    </div>
                </div>

                {/* Preview Window Wrapper */}
                <div className={`flex-1 overflow-hidden flex items-center justify-center transition-all duration-300 ${isMobilePreview ? 'py-6 px-4' : 'p-0'}`}>
                    <div
                        className={`relative overflow-hidden transition-all duration-500 shadow-2xl flex flex-col ${isMobilePreview
                            ? 'w-[375px] h-full max-h-[780px] rounded-[3rem] border-[8px] border-zinc-800 bg-black'
                            : 'w-full h-full rounded-none border-0 bg-black'
                        }`}
                    >
                        {/* Device chrome */}
                        {isMobilePreview ? (
                            <div className="h-7 w-full shrink-0 flex justify-center items-end pb-1 bg-zinc-900/80">
                                <div className="w-24 h-4 bg-zinc-950 rounded-full"></div>
                            </div>
                        ) : (
                            <div className="h-10 bg-zinc-900 border-b border-white/10 flex items-center px-4 gap-2 shrink-0">
                                <div className="w-3 h-3 rounded-full bg-rose-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                                <div className="ml-4 bg-black/50 px-4 py-1 rounded text-[10px] font-mono text-zinc-500 border border-white/5 flex items-center gap-2">
                                    🔒 mechss.com/t/{config.slug}
                                </div>
                            </div>
                        )}

                        {/* Rendering the TRUE PAGE LIVE */}
                        <div className="flex-1 overflow-y-auto customize-scrollbar bg-[#09090b] relative w-full">
                            <LandingClient config={config} workshop={workshop} products={products} mobile={isMobilePreview} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
