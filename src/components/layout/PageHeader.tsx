import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  backTo?: string;
  showBack?: boolean;
  breadcrumbs?: Crumb[];
  className?: string;
}

/**
 * Unified page header. Provides consistent title, description, breadcrumbs,
 * back navigation and action slot across every dashboard page.
 * RTL-friendly (back arrow points right in Arabic reading direction).
 */
export function PageHeader({
  title,
  description,
  actions,
  backTo,
  showBack,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const hasBack = showBack || !!backTo;

  const handleBack = () => {
    if (backTo) navigate(backTo);
    else navigate(-1);
  };

  return (
    <div className={cn('mb-6 flex flex-col gap-3 animate-fade-in', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="مسار التنقل" className="flex items-center gap-1 text-sm text-muted-foreground">
          {breadcrumbs.map((c, i) => {
            const last = i === breadcrumbs.length - 1;
            return (
              <span key={i} className="flex items-center gap-1">
                {c.to && !last ? (
                  <Link to={c.to} className="hover:text-foreground transition-colors">
                    {c.label}
                  </Link>
                ) : (
                  <span className={last ? 'text-foreground font-medium' : ''}>{c.label}</span>
                )}
                {!last && <ChevronLeft className="h-3.5 w-3.5 opacity-60" />}
              </span>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {hasBack && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleBack}
                aria-label="رجوع"
                className="h-9 w-9 shrink-0 -ms-2"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            )}
            <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
          </div>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}