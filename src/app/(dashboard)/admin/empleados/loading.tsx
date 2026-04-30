export default function EmpleadosLoading() {
    return (
        <div className="space-y-6 max-w-6xl mx-auto">

            {/* Header skeleton */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-36 bg-white/5 rounded-xl animate-pulse" />
                    <div className="h-4 w-64 bg-white/5 rounded-lg animate-pulse" />
                </div>
                <div className="h-10 w-40 bg-white/5 rounded-xl animate-pulse" />
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map(i => (
                    <div key={i} className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex items-center gap-4"
                        style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse flex-shrink-0" />
                        <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="h-7 w-8 bg-white/5 rounded animate-pulse" />
                            <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter tabs skeleton */}
            <div className="flex gap-2">
                {[80, 100, 120].map((w, i) => (
                    <div key={i} className="h-8 rounded-full bg-white/5 animate-pulse" style={{ width: w }} />
                ))}
            </div>

            {/* Cards skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[0, 1, 2, 3, 4, 5].map(i => (
                    <div
                        key={i}
                        className="bg-zinc-900 border border-white/5 rounded-2xl p-5 space-y-4 animate-pulse"
                        style={{ animationDelay: `${i * 60}ms` }}
                    >
                        {/* Top row */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex-shrink-0" />
                                <div className="space-y-2">
                                    <div className="h-4 w-28 bg-white/5 rounded" />
                                    <div className="h-3 w-20 bg-white/5 rounded" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-14 bg-white/5 rounded-md" />
                                <div className="w-7 h-7 rounded-lg bg-white/5" />
                            </div>
                        </div>
                        {/* Contact */}
                        <div className="space-y-2 pt-1">
                            <div className="h-3 w-full bg-white/5 rounded" />
                            <div className="h-3 w-3/4 bg-white/5 rounded" />
                            <div className="h-3 w-1/2 bg-white/5 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
