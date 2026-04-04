import { Metadata } from 'next'
import TallerClient from './TallerClient'

export const metadata: Metadata = {
    title: 'Taller Activo | Panel Admin',
    description: 'Panel de control del taller con seguimiento de reparaciones en tiempo real.'
}

export default function TallerPage() {
    return <TallerClient />
}
