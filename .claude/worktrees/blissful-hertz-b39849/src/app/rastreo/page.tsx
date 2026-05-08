import { Metadata } from 'next'
import TrackingClient from './TrackingClient'

export const metadata: Metadata = {
    title: 'Rastreo de Reparación | MotoFix',
    description: 'Consulta el estado de tu moto en tiempo real. Ingresa tu código de seguimiento para ver el proceso de reparación.'
}

export default function TrackingPage() {
    return <TrackingClient />
}
