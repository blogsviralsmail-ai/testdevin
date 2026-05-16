"use client";

export function SkeletonCard() {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-3/4 mb-4" />
      <div className="h-3 bg-white/10 rounded w-1/2 mb-3" />
      <div className="h-3 bg-white/10 rounded w-full mb-3" />
      <div className="h-3 bg-white/10 rounded w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden animate-pulse">
      <div className="p-4 border-b border-white/[0.06]">
        <div className="h-4 bg-white/10 rounded w-48" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-6 py-3">
                <div className="h-3 bg-white/10 rounded w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, ri) => (
            <tr key={ri} className="border-b border-white/[0.04]">
              {Array.from({ length: cols }).map((_, ci) => (
                <td key={ci} className="px-6 py-4">
                  <div className={`h-3 bg-white/10 rounded ${ci === 0 ? 'w-32' : 'w-20'}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${count} gap-4 mb-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center animate-pulse">
          <div className="h-8 bg-white/10 rounded w-16 mx-auto mb-2" />
          <div className="h-3 bg-white/10 rounded w-24 mx-auto" />
        </div>
      ))}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-white/10 rounded w-48 animate-pulse" />
        <div className="h-10 bg-white/10 rounded w-32 animate-pulse" />
      </div>
      <SkeletonStats />
      <SkeletonTable />
    </div>
  );
}

export function EmptyState({ icon = "📭", title, description, actionLabel, onAction }: {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-12 text-center">
      <p className="text-5xl mb-4">{icon}</p>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-400 mb-4 max-w-md mx-auto">{description}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="px-5 py-2.5 bg-[#0EA5B8] text-white rounded-lg hover:bg-[#0891b2] text-sm font-medium transition">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl bg-red-900/20 border border-red-500/20 p-8 text-center">
      <p className="text-4xl mb-3">⚠️</p>
      <h3 className="text-lg font-semibold text-red-400 mb-2">Error</h3>
      <p className="text-sm text-slate-400 mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition">
          Try Again
        </button>
      )}
    </div>
  );
}
