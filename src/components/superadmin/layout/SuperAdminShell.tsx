'use client'

import { useState, useEffect } from 'react'
import Sidebar, { type SidebarUser } from './Sidebar'
import TopBar from './TopBar'

interface Props {
  user:     SidebarUser
  children: React.ReactNode
}

export default function SuperAdminShell({ user, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        user={user}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          userName={user.full_name}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
