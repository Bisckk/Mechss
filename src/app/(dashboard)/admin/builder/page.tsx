'use client'

import { useState } from 'react'
import { Monitor, Smartphone, LayoutTemplate, Palette, Type, Upload } from 'lucide-react'

export default function AdminBuilderPage() {
    const [isMobilePreview, setIsMobilePreview] = useState(false)

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in zoom-in-95 duration-500 gap-4">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Constructor Landing Page</h1>
                    <p className="text-zinc-400 text-sm mt-1">Personaliza el sitio web de tu taller para tus clientes.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Toggle de Vista */}
                    <div className="flex bg-zinc-900 border border-white/5 p-1 rounded-lg">
                        <button
                            onClick={() => setIsMobilePreview(false)}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition ${!isMobilePreview ? 'text-white bg-white/10 shadow-sm' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Monitor className="w-4 h-4" /> Desktop
                        </button>
                        <button
                            onClick={() => setIsMobilePreview(true)}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition ${isMobilePreview ? 'text-white bg-white/10 shadow-sm' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Smartphone className="w-4 h-4" /> Mobile
                        </button>
                    </div>

                    <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                        Borrador
                    </button>
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-orange-500/20 active:scale-95">
                        Publicar
                    </button>
                </div>
            </div>

            {/* Main Builder Area */}
            <div className="flex max-lg:flex-col flex-1 min-h-0 gap-6 overflow-hidden mt-2">

                {/* Sidebar Config */}
                <aside className="w-full lg:w-80 flex flex-col bg-zinc-900/50 border border-white/5 rounded-2xl overflow-y-auto backdrop-blur-md shrink-0 scrollbar-none">
                    <div className="p-5 border-b border-white/5">
                        <h2 className="text-sm font-semibold text-white">Configuración del sitio</h2>
                    </div>

                    <div className="p-5 space-y-6">

                        {/* Logo Settings */}
                        <div>
                            <p className="flex items-center gap-2 text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
                                <LayoutTemplate className="w-3.5 h-3.5" /> Diseño Principal
                            </p>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
                                    <span className="text-zinc-600 font-medium text-xs">Logo</span>
                                </div>
                                <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white text-xs px-3 py-2 rounded-lg transition-colors border border-white/10">
                                    <Upload className="w-3.5 h-3.5" /> Subir
                                </button>
                            </div>

                            <div>
                                <label className="text-xs text-zinc-400 block mb-1">Texto Destacado (Hero)</label>
                                <textarea
                                    className="w-full bg-black/40 border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors h-24 resize-none"
                                    placeholder="El mejor taller mecánico..."
                                />
                            </div>
                        </div>

                        <div className="h-px bg-white/5 my-4" />

                        {/* Colors */}
                        <div>
                            <p className="flex items-center gap-2 text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
                                <Palette className="w-3.5 h-3.5" /> Colores
                            </p>

                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-500 ring-2 ring-white/20 cursor-pointer shadow-lg shadow-orange-500/20" />
                                <div className="w-8 h-8 rounded-full bg-blue-500 hover:ring-2 ring-white/20 cursor-pointer transition-all" />
                                <div className="w-8 h-8 rounded-full bg-emerald-500 hover:ring-2 ring-white/20 cursor-pointer transition-all" />
                                <div className="w-8 h-8 rounded-full bg-purple-500 hover:ring-2 ring-white/20 cursor-pointer transition-all" />
                                <div className="w-8 h-8 rounded-full border border-dashed border-zinc-600 flex items-center justify-center hover:bg-white/5 cursor-pointer transition-all">
                                    <span className="text-zinc-500 text-xs">+</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-white/5 my-4" />

                        {/* Typography */}
                        <div>
                            <p className="flex items-center gap-2 text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
                                <Type className="w-3.5 h-3.5" /> Tipografía
                            </p>

                            <select className="w-full bg-black/40 border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors">
                                <option>Inter (Moderno)</option>
                                <option>Roboto (Clásico)</option>
                                <option>Outfit (Tecnológico)</option>
                            </select>
                        </div>

                    </div>
                </aside>

                {/* Live Preview Pane */}
                <main className="flex-1 bg-black/60 rounded-2xl border border-white/5 flex items-center justify-center p-4 lg:p-8 overflow-hidden backdrop-blur-sm relative">

                    {/* Label de preview */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-full px-3 py-1 shadow-lg pointer-events-none">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-medium text-white tracking-wide">Preview Realtime</span>
                    </div>

                    <div
                        className={`
              bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col items-center justify-center relative
              ${isMobilePreview ? 'w-[375px] h-[812px] rounded-[3rem] ring-[8px] ring-zinc-800' : 'w-full h-full rounded-xl'}
            `}
                    >
                        {isMobilePreview && (
                            <div className="absolute top-0 w-full h-6 flex justify-center pt-2 z-50">
                                <div className="w-32 h-6 bg-zinc-800 rounded-b-2xl" />
                            </div>
                        )}

                        <LayoutTemplate className="w-16 h-16 text-zinc-800 mb-4" />
                        <h3 className="text-zinc-500 font-medium">Render de la landing page</h3>
                        <p className="text-zinc-700 text-xs mt-2 max-w-[250px] text-center">Aquí se previsualizarán los cambios realizados en el panel izquierdo.</p>
                    </div>
                </main>

            </div>
        </div>
    )
}
