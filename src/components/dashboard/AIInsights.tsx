import { Link } from 'react-router-dom';
import {
  Brain, Gauge, Target, Sparkles, GraduationCap, Database, ArrowLeft, Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AIStats {
  automationRate: number;
  accuracy: number;
  confidence: number;
  knowledgeQuality: number;
  lastTrainedAt: string | null;
  suggestions: string[];
}

function scoreTone(v: number) {
  if (v >= 80) return { bar: 'bg-success', text: 'text-success', label: 'ممتاز' };
  if (v >= 55) return { bar: 'bg-warning', text: 'text-warning', label: 'جيد' };
  return { bar: 'bg-destructive', text: 'text-destructive', label: 'يحتاج تحسين' };
}

function MetricRing({
  icon: Icon, title, value, description,
}: {
  icon: typeof Brain;
  title: string;
  value: number;
  description: string;
}) {
  const tone = scoreTone(value);
  return (
    <div className="rounded-xl border border-border/70 bg-card p-3 transition-colors hover:border-primary/30">
      <div className="flex items-center gap-2">
        <span className="rounded-lg bg-primary/10 p-1.5 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <p className="flex-1 truncate text-sm font-semibold text-foreground">{title}</p>
        <span className={cn('text-xs font-semibold', tone.text)}>{tone.label}</span>
      </div>
      <p className="mt-2 text-metric">{value}%</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-500', tone.bar)}
          style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
        />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

export function AIInsights({
  stats, model, knowledgeLabel, relativeTime,
}: {
  stats: AIStats;
  model: string;
  knowledgeLabel: string;
  relativeTime: (iso: string) => string;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-4 shadow-sm sm:p-6">
      <div
        className="pointer-events-none absolute -top-24 left-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div className="relative mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-primary/10 p-2 text-primary">
            <Brain className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-section-title">ذكاء البوت</h3>
            <p className="text-card-desc">مؤشرات أداء الذكاء الاصطناعي وجودة المعرفة</p>
          </div>
        </div>
        <span className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground" dir="ltr">
          {model}
        </span>
      </div>

      <div className="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricRing
          icon={Gauge}
          title="نسبة الردود الآلية"
          value={stats.automationRate}
          description="رسائل تمت الإجابة عليها تلقائيًا دون تدخل بشري"
        />
        <MetricRing
          icon={Target}
          title="دقة الإجابات"
          value={stats.accuracy}
          description="ردود مبنية على قاعدة المعرفة بدل رسالة التعذّر"
        />
        <MetricRing
          icon={Sparkles}
          title="ثقة الذكاء الاصطناعي"
          value={stats.confidence}
          description="تقدير مركّب من الدقة والأتمتة وجودة المعرفة"
        />
        <MetricRing
          icon={Database}
          title="جودة قاعدة المعرفة"
          value={stats.knowledgeQuality}
          description={`الحجم الحالي: ${knowledgeLabel}`}
        />
      </div>

      <div className="relative mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            آخر تدريب
          </div>
          <p className="mt-1.5 text-sm font-semibold text-foreground">
            {stats.lastTrainedAt ? relativeTime(stats.lastTrainedAt) : 'لم يتم التدريب بعد'}
          </p>
          <Button asChild size="sm" variant="outline" className="mt-3">
            <Link to="/dashboard/knowledge">
              تدريب البوت
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/30 p-3 lg:col-span-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lightbulb className="h-4 w-4" />
            اقتراحات لتحسين المعرفة
          </div>
          {stats.suggestions.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              قاعدة المعرفة في حالة جيدة — لا توجد اقتراحات حالياً.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {stats.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
