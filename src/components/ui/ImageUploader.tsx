'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Loader2, ImagePlus, Link2 } from 'lucide-react'
import { uploadImage } from '@/lib/uploadImage'

interface ImageUploaderProps {
    value: string               // current image URL
    onChange: (url: string) => void
    folder?: string             // storage folder (products, landing, gallery...)
    className?: string
    compact?: boolean           // smaller variant for inline use
}

export default function ImageUploader({ value, onChange, folder = 'general', className = '', compact = false }: ImageUploaderProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)
    const [error, setError] = useState('')
    const [mode, setMode] = useState<'upload' | 'url'>(value && value.startsWith('http') ? 'url' : 'upload')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFile = useCallback(async (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Solo se permiten archivos de imagen.')
            return
        }

        // Validate file size (10MB max before conversion)
        if (file.size > 10 * 1024 * 1024) {
            setError('La imagen no debe superar los 10MB.')
            return
        }

        setError('')
        setIsUploading(true)

        try {
            const publicUrl = await uploadImage(file, folder)
            onChange(publicUrl)
        } catch (e: any) {
            setError(e.message || 'Error al subir la imagen.')
        } finally {
            setIsUploading(false)
        }
    }, [folder, onChange])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }, [handleFile])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
        // Reset input so the same file can be selected again
        e.target.value = ''
    }

    const handleClear = () => {
        onChange('')
        setError('')
    }

    // ── Compact variant (for inline builder fields) ──────────
    if (compact) {
        return (
            <div className={`space-y-2 ${className}`}>
                {/* Mode Toggle */}
                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 w-fit">
                    <button
                        type="button"
                        onClick={() => setMode('upload')}
                        className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${mode === 'upload' ? 'bg-orange-500/20 text-orange-400' : 'text-zinc-500 hover:text-white'}`}
                    >
                        <Upload className="w-3 h-3 inline mr-1" />Subir
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('url')}
                        className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${mode === 'url' ? 'bg-orange-500/20 text-orange-400' : 'text-zinc-500 hover:text-white'}`}
                    >
                        <Link2 className="w-3 h-3 inline mr-1" />URL
                    </button>
                </div>

                {mode === 'url' ? (
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500/50"
                        placeholder="https://example.com/image.jpg"
                    />
                ) : (
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${isDragOver ? 'border-orange-500 bg-orange-500/10' :
                                value ? 'border-emerald-500/30 bg-emerald-500/5' :
                                    'border-white/10 bg-white/[0.02] hover:border-white/20'
                            }`}
                    >
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        {isUploading ? (
                            <div className="flex items-center justify-center gap-2 py-1">
                                <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                                <span className="text-xs text-orange-400 font-bold">Convirtiendo a WebP...</span>
                            </div>
                        ) : value ? (
                            <div className="flex items-center gap-3">
                                <img src={value} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                                <span className="text-xs text-emerald-400 font-bold flex-1 text-left truncate">Imagen cargada</span>
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleClear() }} className="p-1 text-zinc-400 hover:text-red-400">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2 py-1">
                                <Upload className="w-4 h-4 text-zinc-500" />
                                <span className="text-xs text-zinc-500">Click o arrastra una imagen</span>
                            </div>
                        )}
                    </div>
                )}

                {error && <p className="text-red-400 text-[10px] font-bold">{error}</p>}
            </div>
        )
    }

    // ── Full variant (for modals/forms) ──────────────────────
    return (
        <div className={`space-y-3 ${className}`}>
            {/* Mode Toggle */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 w-fit">
                <button
                    type="button"
                    onClick={() => setMode('upload')}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${mode === 'upload' ? 'bg-orange-500/20 text-orange-400' : 'text-zinc-500 hover:text-white'}`}
                >
                    <Upload className="w-3.5 h-3.5" /> Subir Archivo
                </button>
                <button
                    type="button"
                    onClick={() => setMode('url')}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${mode === 'url' ? 'bg-orange-500/20 text-orange-400' : 'text-zinc-500 hover:text-white'}`}
                >
                    <Link2 className="w-3.5 h-3.5" /> Pegar URL
                </button>
            </div>

            {mode === 'url' ? (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-orange-500/50"
                        placeholder="https://example.com/image.jpg"
                    />
                    {value && (
                        <button type="button" onClick={handleClear} className="p-3 text-zinc-400 hover:text-red-400 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ) : (
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${isDragOver ? 'border-orange-500 bg-orange-500/10' :
                            value ? 'border-emerald-500/30 bg-emerald-500/5' :
                                'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                        }`}
                >
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

                    {isUploading ? (
                        <div className="flex flex-col items-center gap-3 py-4">
                            <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
                            <div>
                                <p className="text-sm font-bold text-orange-400">Convirtiendo a WebP...</p>
                                <p className="text-[10px] text-zinc-500 mt-1">Optimizando tamaño y calidad</p>
                            </div>
                        </div>
                    ) : value ? (
                        <div className="flex items-center gap-4">
                            <img src={value} alt="Preview" className="w-20 h-20 rounded-xl object-cover border border-white/10 shadow-lg" />
                            <div className="flex-1 text-left">
                                <p className="text-sm font-bold text-emerald-400">Imagen cargada correctamente</p>
                                <p className="text-[10px] text-zinc-500 mt-1 font-mono truncate max-w-[200px]">{value.split('/').pop()}</p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleClear() }}
                                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 py-4">
                            <div className="p-4 rounded-full bg-white/5">
                                <ImagePlus className="w-8 h-8 text-zinc-500" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-zinc-300">Arrastra una imagen aquí</p>
                                <p className="text-xs text-zinc-500 mt-1">o haz click para seleccionar • JPG, PNG, GIF • máx 10MB</p>
                            </div>
                            <span className="text-[10px] bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full font-bold">
                                Se convierte automáticamente a WebP
                            </span>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p className="text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>
            )}
        </div>
    )
}
