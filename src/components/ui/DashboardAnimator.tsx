'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'

/**
 * Zero-render client component that attaches GSAP stagger animations to
 * server-rendered dashboard pages. Drop it anywhere inside a server page —
 * it renders nothing to the DOM but runs on mount and targets elements
 * by the class names added to the server-rendered JSX.
 *
 * Class names it targets:
 *   .dash-header        → page title / badge area
 *   .dash-stat          → stat / KPI cards
 *   .dash-quick-action  → quick-action link tiles
 *   .dash-section       → larger content sections / panels
 *   .dash-activity      → timeline / activity list items
 *   .dash-row           → table rows or list items
 */
export default function DashboardAnimator() {
    useEffect(() => {
        const ease = 'expo.out'
        const f3d = true

        const ctx = gsap.context(() => {
            // Header appears first
            gsap.fromTo('.dash-header',
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.4, ease, force3D: f3d }
            )

            // Stat / KPI cards stagger in
            gsap.fromTo('.dash-stat',
                { opacity: 0, y: 18, scale: 0.97 },
                { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.07, ease, force3D: f3d, delay: 0.05 }
            )

            // Quick-action tiles stagger in after stats
            gsap.fromTo('.dash-quick-action',
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease, force3D: f3d, delay: 0.12 }
            )

            // Content sections fade up
            gsap.fromTo('.dash-section',
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease, force3D: f3d, delay: 0.2 }
            )

            // Activity / timeline items slide in from left
            gsap.fromTo('.dash-activity',
                { opacity: 0, x: -10 },
                { opacity: 1, x: 0, duration: 0.32, stagger: 0.055, ease, force3D: f3d, delay: 0.3 }
            )

            // Table rows
            gsap.fromTo('.dash-row',
                { opacity: 0, x: -8 },
                { opacity: 1, x: 0, duration: 0.3, stagger: 0.04, ease, force3D: f3d, delay: 0.25 }
            )
        })

        return () => ctx.revert()
    }, [])

    return null
}
