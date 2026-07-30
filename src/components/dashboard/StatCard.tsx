import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatAccent = 'primary' | 'success' | 'warning' | 'info';

const accentStyles: Record<StatAccent, { icon: string; ring: string; glow: string; trendUp: string }> = {
  primary: {
    icon: 'bg-primary/10 text-primary',
    ring: 'hover:border-primary/30',
    glow: 'from-primary/10',
    trendUp: 'text-primary',
  },
  success: {
    icon: 'bg-success/10 text-success',
    ring: 'hover:border-success/30',
    glow: 'from-success/10',
    trendUp: 'text-success',
  },
  warning: {
    icon: 'bg-warning/10 text-warning',
    ring: 'hover:border-warning/30',
    glow: 'from-warning/10',
    trendUp: 'text-warning',
  },
  info: {
    icon: 'bg-info/10 text-info',
    ring: 'hover:border-info/30',
    glow: 'from-info/10',
    trendUp: 'text-info',
  },
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  /** Small caption shown at the bottom, e.g. "آخر 24 ساعة" */
  period?: string;
  accent?: StatAccent;
  trend?: {
    value: number;
    isPositive: boolean;
    /** Optional comparison label, defaults to "مقارنة بالفترة السابقة" */
    label?: string;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  period,
  accent = 'primary',
  trend,
  className,
}: StatCardProps) {
  const a = accentStyles[accent];
  const neutral = trend?.value === 0;
  const TrendIcon = neutral ? Minus : trend?.isPositive ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md',
        a.ring,
        className
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute -top-16 -left-10 h-32 w-32 rounded-full bg-gradient-to-b to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100',
          a.glow
        )}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-metric">
            {value}
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
          {description && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn('shrink-0 rounded-xl p-2.5', a.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(trend || period) && (
        <div className="relative mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
          {trend ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                neutral
                  ? 'bg-muted text-muted-foreground'
                  : trend.isPositive
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              <TrendIcon className="h-3.5 w-3.5" />
              {neutral ? '0%' : `${trend.isPositive ? '+' : '−'}${Math.abs(trend.value)}%`}
            </span>
          ) : (
            <span />
          )}
          {(period || trend?.label) && (
            <span className="truncate text-xs text-muted-foreground">
              {period || trend?.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
