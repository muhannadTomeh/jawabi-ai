import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Reusable skeleton primitives to replace full-screen spinners.
 * Each variant approximates the layout of the page it's used in, so the
 * transition to real content feels instant instead of "loading -> pop".
 */

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid gap-4 border-b border-border bg-muted/30 p-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-2/3" />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4" style={{ width: `${50 + ((r + c) % 4) * 12}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Generic full-page skeleton used as the router-level fallback so we never
 * flash a blank screen or a naked spinner during lazy chunk load.
 */
export function PageSkeleton() {
  return (
    <div className="animate-fade-in space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeaderSkeleton />
      <StatCardsSkeleton />
      <CardGridSkeleton />
    </div>
  );
}