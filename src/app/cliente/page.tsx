import { Metadata } from 'next'
import ClientePortalClient from './ClientePortalClient'

export const metadata: Metadata = {
    title: 'Portal del Cliente | MotoFix',
    description: 'Consulta el estado de tu servicio y el historial de reparaciones de tu moto.',
}

export default function ClientePortalPage() {
    return <ClientePortalClient />
}
