import { Metadata } from 'next'
import BuilderClient from './BuilderClient'

export const metadata: Metadata = {
    title: 'Landing Page Builder | MotoFix'
}

export default function AdminBuilderPage() {
    return <BuilderClient />
}
