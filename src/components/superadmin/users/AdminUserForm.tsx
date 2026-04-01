'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { createAdminUser, createQuickWorkshop, type AdminUserFormData } from '@/lib/actions/superadmin'

interface Props {
  workshops: { id: string; name: string }[]
  planOptions: { id: string; name: string }[]
  onSuccess: () => void
  onCancel: () => void
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function AdminUserForm({ workshops, planOptions, onSuccess, onCancel }: Props) {
  const [isCreatingWorkshop, setIsCreatingWorkshop] = useState(false)
  const [formData, setFormData] = useState<AdminUserFormData>({
    full_name: '',
    email: '',
    password: '',
    workshop_id: '',
  })
  
  const [workshopData, setWorkshopData] = useState({
    name: '',
    slug: '',
    plan_id: planOptions[0]?.id ?? ''
  })

  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleWorkshopChange = (val: string) => {
    if (val === 'CREATE_NEW') {
      setIsCreatingWorkshop(true)
      setFormData(prev => ({ ...prev, workshop_id: '' }))
    } else {
      setIsCreatingWorkshop(false)
      setFormData(prev => ({ ...prev, workshop_id: val }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    startTransition(async () => {
      let finalWorkshopId = formData.workshop_id

      if (isCreatingWorkshop) {
        if (!workshopData.name || !workshopData.slug || !workshopData.plan_id) {
          setError('Por favor completa todos los campos del nuevo taller.')
          return
        }
        const wsRes = await createQuickWorkshop(workshopData)
        if (!wsRes.ok) {
          setError(wsRes.error)
          return
        }
        finalWorkshopId = wsRes.data.id
      }

      if (!finalWorkshopId) {
         setError('Por favor selecciona o crea un taller.')
         return
      }

      const res = await createAdminUser({ ...formData, workshop_id: finalWorkshopId })
      if (res.ok) {
        onSuccess()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative my-auto">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900/95 z-10">
          <h2 className="text-lg font-bold text-white">Nuevo Usuario Admin</h2>
          <button
            onClick={onCancel}
            className="text-zinc-500 hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[calc(100vh-140px)] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* User Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="full_name">
                Nombre Completo *
              </label>
              <input
                id="full_name"
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="email">
                Correo Electrónico *
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                placeholder="admin@taller.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="password">
                Contraseña Temporal *
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-5">
            <h3 className="text-sm font-bold text-white mb-3">Vincular a Taller</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5" htmlFor="workshop_id">
                  Seleccionar o Crear Taller *
                </label>
                <CustomSelect
                  value={isCreatingWorkshop ? 'CREATE_NEW' : formData.workshop_id}
                  onChange={handleWorkshopChange}
                  placeholder="Selecciona un taller existente..."
                  options={[
                    { value: 'CREATE_NEW', label: '＋ Crear Nuevo Taller', isAction: true },
                    ...workshops.map(w => ({ value: w.id, label: w.name, group: 'Talleres Existentes' }))
                  ]}
                />
              </div>

              {isCreatingWorkshop && (
                <div className="bg-zinc-800/50 border border-orange-500/20 rounded-xl p-4 space-y-4">
                  <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider">Detalles Básicos del Nuevo Taller</h4>
                  
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1" htmlFor="new_ws_name">
                      Nombre del Taller
                    </label>
                    <input
                      id="new_ws_name"
                      type="text"
                      required={isCreatingWorkshop}
                      value={workshopData.name}
                      onChange={(e) => setWorkshopData({ ...workshopData, name: e.target.value, slug: slugify(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-md text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1" htmlFor="new_ws_slug">
                      URL Slug
                    </label>
                    <div className="flex rounded-md overflow-hidden border border-zinc-700 focus-within:border-orange-500">
                      <span className="px-2 py-1.5 bg-zinc-800 text-zinc-500 text-xs border-r border-zinc-700">
                        motofix.co/
                      </span>
                      <input
                        id="new_ws_slug"
                        type="text"
                        required={isCreatingWorkshop}
                        value={workshopData.slug}
                        onChange={(e) => setWorkshopData({ ...workshopData, slug: slugify(e.target.value) })}
                        className="flex-1 px-2 py-1.5 bg-zinc-800 text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1" htmlFor="new_ws_plan">
                      Plan Inmediato
                    </label>
                    <CustomSelect
                      value={workshopData.plan_id}
                      onChange={(val) => setWorkshopData({ ...workshopData, plan_id: val })}
                      placeholder="Selecciona un plan..."
                      options={planOptions.map(p => ({ value: p.id, label: p.name }))}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex gap-3 justify-end items-center border-t border-zinc-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Procesando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string; group?: string; isAction?: boolean }[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open && menuRef.current) {
      setTimeout(() => {
        menuRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 10)
    }
  }, [open])

  const selectedOption = options.find(o => o.value === value)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all hover:bg-zinc-700/50 shadow-sm"
      >
        <span className={selectedOption ? (selectedOption.isAction ? 'text-orange-400 font-bold' : 'text-white') : 'text-zinc-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div 
          ref={menuRef}
          className="absolute z-[100] mt-1.5 w-full bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-56 overflow-y-auto"
        >
          <div className="p-1.5 space-y-0.5">
            {options.map((opt, i) => {
              const prev = options[i - 1]
              const showGroup = opt.group && (!prev || prev.group !== opt.group)
              return (
                <div key={opt.value}>
                  {showGroup && (
                    <div className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      {opt.group}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center ${
                      opt.isAction 
                        ? 'text-orange-400 font-bold hover:bg-orange-500/10' 
                        : value === opt.value
                          ? 'bg-zinc-700 text-white font-semibold'
                          : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
