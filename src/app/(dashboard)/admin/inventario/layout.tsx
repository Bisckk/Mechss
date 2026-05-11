import Link from 'next/link'
import { Package, Users, ShoppingCart, BarChart2 } from 'lucide-react'

const TABS = [
    { href: '/admin/inventario',            label: 'Catálogo',         icon: Package },
    { href: '/admin/inventario/proveedores',label: 'Proveedores',      icon: Users },
    { href: '/admin/inventario/compras',    label: 'Órd. de Compra',   icon: ShoppingCart },
    { href: '/admin/inventario/kardex',     label: 'Kardex',           icon: BarChart2 },
]

export default function InventarioLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="space-y-0">
            {/* Sub-nav tabs */}
            <div className="flex items-center gap-1 bg-zinc-900/50 border border-white/5 rounded-2xl p-1 mb-6 overflow-x-auto scrollbar-none">
                {TABS.map(({ href, label, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all text-zinc-400 hover:text-white hover:bg-white/5 aria-[current=page]:bg-orange-500/10 aria-[current=page]:text-orange-400 aria-[current=page]:border aria-[current=page]:border-orange-500/20"
                    >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {label}
                    </Link>
                ))}
            </div>
            {children}
        </div>
    )
}
