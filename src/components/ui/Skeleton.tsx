import { cn } from '@/lib/utils'

interface SkeletonProps {
    className?: string
    rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const ROUNDED = {
    sm:   'rounded',
    md:   'rounded-lg',
    lg:   'rounded-xl',
    xl:   'rounded-2xl',
    full: 'rounded-full',
} as const

export default function Skeleton({ className, rounded = 'lg' }: SkeletonProps) {
    return (
        <div className={cn('animate-pulse bg-white/5', ROUNDED[rounded], className)} />
    )
}

export function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={cn('bg-zinc-900 border border-white/5 rounded-2xl p-5 space-y-3', className)}>
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 flex-shrink-0" rounded="xl" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
        </div>
    )
}

export function SkeletonRow({ className }: { className?: string }) {
    return (
        <div className={cn('flex items-center gap-4 p-4 bg-zinc-900 border border-white/5 rounded-2xl', className)}>
            <Skeleton className="w-12 h-12 flex-shrink-0" rounded="xl" />
            <div className="flex-1 space-y-2 min-w-0">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-20" rounded="xl" />
            <Skeleton className="h-8 w-20" rounded="xl" />
        </div>
    )
}
