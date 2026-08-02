import { useQuery } from '@tanstack/react-query';
import { Gauge } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Props {
  chatbotId?: string | null;
}

/**
 * Shows how many messages the bot consumed today against its daily limit.
 * Reads through a security-definer RPC — the counters table itself is
 * closed to clients.
 */
export function DailyUsageCard({ chatbotId }: Props) {
  const { data } = useQuery({
    queryKey: ['daily-usage', chatbotId],
    enabled: !!chatbotId,
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_chatbot_daily_usage', {
        _chatbot_id: chatbotId!,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return {
        used: Number(row?.used ?? 0),
        limit: Number(row?.limit_value ?? 300),
        planName: (row as { plan_name?: string | null })?.plan_name ?? null,
      };
    },
  });

  const used = data?.used ?? 0;
  const limit = data?.limit ?? 300;
  const planName = data?.planName ?? null;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const near = pct >= 80;

  return (
    <div className="surface-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">استخدام اليوم</h3>
          {planName && (
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              باقة {planName}
            </span>
          )}
        </div>
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            near ? 'text-destructive' : 'text-foreground'
          )}
        >
          {used.toLocaleString('ar-SA')} من {limit.toLocaleString('ar-SA')} رسالة
        </span>
      </div>
      <Progress value={pct} className="mt-3 h-2" />
      <p className="mt-2 text-xs text-muted-foreground">
        {near
          ? 'اقتربت من الحد اليومي — قد تتوقف الردود مؤقتاً عند تجاوزه.'
          : 'يتم تصفير العدّاد تلقائياً كل 24 ساعة.'}
      </p>
    </div>
  );
}
