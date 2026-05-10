'use client'

import { useState } from 'react'
import Sidebar, { type SidebarUser } from './Sidebar'
import TopBar from './TopBar'

interface Props {
    user: SidebarUser
    children: React.ReactNode
}

export default function AdminShell({ user, children }: Props) {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-950">
            <Sidebar
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
                user={user}
            />

            <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
                <TopBar
                    onMenuClick={() => setMobileOpen(true)}
                    userName={user.full_name}
                    role={user.role}
                    workshopName={user.workshop_name}
                />

                {/* Main content background elements */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] top-[-200px] right-[-200px] opacity-60" />
                    <div className="absolute w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] bottom-[-100px] left-[10%] opacity-40" />
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay"></div>
                </div>

                <main className="flex-1 overflow-y-auto relative z-10 scrollbar-none">
                    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
