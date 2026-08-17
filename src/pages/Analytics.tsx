import { useEffect, useState } from 'react';
import { BarChart3, MessageSquare, TrendingUp, Share2, Loader2, Users } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { useChatbot } from '@/hooks/useChatbot';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  totalMessages: number;
  userMessages: number;
  botMessages: number;
  uniqueUsers: number;
  todayMessages: number;
  weekMessages: number;
}

export default function AnalyticsPage() {
  const { chatbot, loading: chatbotLoading } = useChatbot();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [channelCount, setChannelCount] = useState(0);

  useEffect(() => {
    if (!chatbot) return;

    async function fetchAnalytics() {
      setLoading(true);
      try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString();
        const cbId = chatbot!.id;

        // Only unique-users lookup pulls rows (small columns). Everything
        // else uses head-count queries so no payload is downloaded.
        const countFor = (table: 'telegram_messages' | 'whatsapp_messages' | 'messenger_messages') =>
          [
            supabase.from(table).select('id', { count: 'exact', head: true }).eq('chatbot_id', cbId),
            supabase.from(table).select('id', { count: 'exact', head: true }).eq('chatbot_id', cbId).eq('role', 'user'),
            supabase.from(table).select('id', { count: 'exact', head: true }).eq('chatbot_id', cbId).gte('created_at', todayStart),
            supabase.from(table).select('id', { count: 'exact', head: true }).eq('chatbot_id', cbId).gte('created_at', weekStart),
          ] as const;

        const [
          tgTotal, tgUser, tgToday, tgWeek,
          waTotal, waUser, waToday, waWeek,
          msTotal, msUser, msToday, msWeek,
          tgUsersRes, waUsersRes, msUsersRes,
          chRes,
        ] = await Promise.all([
          ...countFor('telegram_messages'),
          ...countFor('whatsapp_messages'),
          ...countFor('messenger_messages'),
          supabase.from('telegram_users').select('id', { count: 'exact', head: true }).eq('chatbot_id', cbId),
          supabase.from('whatsapp_contacts').select('id', { count: 'exact', head: true }).eq('chatbot_id', cbId),
          supabase.from('messenger_users').select('id', { count: 'exact', head: true }).eq('chatbot_id', cbId),
          supabase.from('channels').select('id', { count: 'exact', head: true }).eq('chatbot_id', cbId).eq('is_connected', true),
        ]);

        const total = (tgTotal.count || 0) + (waTotal.count || 0) + (msTotal.count || 0);
        const userCount = (tgUser.count || 0) + (waUser.count || 0) + (msUser.count || 0);

        setChannelCount(chRes.count || 0);
        setAnalytics({
          totalMessages: total,
          userMessages: userCount,
          botMessages: Math.max(0, total - userCount),
          uniqueUsers: (tgUsersRes.count || 0) + (waUsersRes.count || 0) + (msUsersRes.count || 0),
          todayMessages: (tgToday.count || 0) + (waToday.count || 0) + (msToday.count || 0),
          weekMessages: (tgWeek.count || 0) + (waWeek.count || 0) + (msWeek.count || 0),
        });
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [chatbot]);

  if (chatbotLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const data = analytics || {
    totalMessages: 0,
    userMessages: 0,
    botMessages: 0,
    uniqueUsers: 0,
    todayMessages: 0,
    weekMessages: 0,
  };

  return (
    <div className="animate-fade-in space-y-8" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">الإحصائيات</h1>
        <p className="mt-1 text-muted-foreground">
          تتبع أداء الشات بوت والتفاعل بناءً على البيانات الحقيقية
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي الرسائل"
          value={data.totalMessages.toLocaleString('ar-SA')}
          icon={MessageSquare}
        />
        <StatCard
          title="رسائل المستخدمين"
          value={data.userMessages.toLocaleString('ar-SA')}
          icon={TrendingUp}
        />
        <StatCard
          title="المستخدمين الفريدين"
          value={data.uniqueUsers.toLocaleString('ar-SA')}
          icon={Users}
        />
        <StatCard
          title="القنوات النشطة"
          value={channelCount.toLocaleString('ar-SA')}
          icon={Share2}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Message Breakdown */}
        <div className="card-elevated p-6">
          <h3 className="mb-4 font-semibold text-foreground">توزيع الرسائل</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">رسائل المستخدمين</span>
              <div className="flex items-center gap-3">
                <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${data.totalMessages > 0 ? (data.userMessages / data.totalMessages) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="w-12 text-left text-sm font-medium text-foreground">
                  {data.userMessages}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ردود البوت</span>
              <div className="flex items-center gap-3">
                <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{
                      width: `${data.totalMessages > 0 ? (data.botMessages / data.totalMessages) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="w-12 text-left text-sm font-medium text-foreground">
                  {data.botMessages}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Time-based Stats */}
        <div className="card-elevated p-6">
          <h3 className="mb-4 font-semibold text-foreground">النشاط الزمني</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
              <span className="text-sm text-muted-foreground">رسائل اليوم</span>
              <span className="text-2xl font-semibold text-foreground">
                {data.todayMessages.toLocaleString('ar-SA')}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
              <span className="text-sm text-muted-foreground">رسائل آخر ٧ أيام</span>
              <span className="text-2xl font-semibold text-foreground">
                {data.weekMessages.toLocaleString('ar-SA')}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
              <span className="text-sm text-muted-foreground">إجمالي كل الأوقات</span>
              <span className="text-2xl font-semibold text-foreground">
                {data.totalMessages.toLocaleString('ar-SA')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
