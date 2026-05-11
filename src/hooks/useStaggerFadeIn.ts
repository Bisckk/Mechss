'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

/**
 * Anima con stagger los elementos que coincidan con `selector`.
 * Misma firma de animación que el Sidebar (expo.out, fade+y+scale).
 * Solo corre una vez por montaje; ignora re-renders posteriores.
 */
export function useStaggerFadeIn(selector: string, delay = 0.05) {
    const animado = useRef(false)

    useEffect(() => {
        if (animado.current) return
        animado.current = true

        gsap.fromTo(
            selector,
            { opacity: 0, y: 12, scale: 0.97 },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.4,
                stagger: 0.055,
                ease: 'expo.out',
                force3D: true,
                delay,
            }
        )
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
}
