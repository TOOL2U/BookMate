interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-linear-to-r from-bg-card via-border-card to-bg-card bg-size-[200%_100%] rounded-xl2 ${className}`}
      style={{
        animation: 'shimmer 2s infinite linear',
        ...style,
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-bg-card border border-border-card rounded-xl2 p-6 space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-bg-card border border-border-card rounded-xl2 overflow-hidden">
      {/* Header */}
      <div className="border-b border-border-card p-4 flex gap-4">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-5 w-1/4" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-border-card p-4 flex gap-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-bg-card border border-border-card rounded-xl2 p-6">
      <Skeleton className="h-6 w-1/3 mb-4" />
      <div className="flex items-end justify-between gap-2 h-64">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="w-full"
            style={{ height: `${Math.random() * 80 + 20}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonKPI() {
  return (
    <div className="bg-bg-card border border-border-card rounded-xl2 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    </div>
  );
}
