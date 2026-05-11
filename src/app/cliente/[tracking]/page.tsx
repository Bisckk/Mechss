import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { lookupTrackingCodeAction } from '@/lib/actions/tracking'
import ClienteTrackingClient from './ClienteTrackingClient'

interface Props {
    params: Promise<{ tracking: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { tracking } = await params
    return {
        title: `Servicio #${tracking} | MotoFix`,
        description: 'Estado en tiempo real de tu reparación.',
    }
}

export default async function ClienteTrackingPage({ params }: Props) {
    const { tracking } = await params
    const res = await lookupTrackingCodeAction(tracking)

    if (!res.ok) notFound()

    return <ClienteTrackingClient initialData={res.data} tracking={tracking} />
}
