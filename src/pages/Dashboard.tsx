import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Users, ArrowLeft, Share2, Bot, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { useChatbot } from '@/hooks/useChatbot';
import { ChannelIcon } from '@/components/ChannelIcon';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCardsSkeleton, CardGridSkeleton } from '@/components/layout/PageSkeletons';
import { Skeleton } from '@/components/ui/skeleton';

type PlatformKey = 'telegram' | 'facebook' | 'instagram' | 'whatsapp';

const platformLabels: Record<PlatformKey, string> = {
  telegram: 'تيليجرام',
  facebook: 'فيسبوك ماسنجر',
  instagram: 'انستغرام',
  whatsapp: 'واتساب',
};

const toneLabels: Record<string, string> = {
  professional: 'احترافي',
  friendly: 'ودود',
  casual: 'عفوي',
  formal: 'رسمي',
};

interface ChannelRow {
  platform: PlatformKey;
  connected: boolean;
}

interface TopQuestion {
  question: string;
  count: number;
}

export default function DashboardPage() {
  const { chatbot, loading: chatbotLoading } = useChatbot();
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [userMessages, setUserMessages] = useState(0);
  const [uniqueContacts, setUniqueContacts] = useState(0);
  const [topQuestions, setTopQuestions] = useState<TopQuestion[]>([]);

  useEffect(() => {
    if (!chatbot) return;
    const load = async () => {
      setLoading(true);
      try {
        // For totals we only need counts (head:true) — no payload downloaded.
        // For "top questions" we only need the user-role content (server-side filter),
        // avoiding pulling all bot replies just to discard them client-side.
        const [
          tgChRes,
          socialRes,
          webCountRes,
          tgCountRes,
          waCountRes,
          webUserCountRes,
          tgUserCountRes,
          waUserCountRes,
          webUserMsgsRes,
          tgUserMsgsRes,
          waUserMsgsRes,
          waContactsRes,
          tgUsersRes,
        ] = await Promise.all([
          supabase.from('channels').select('platform, is_connected').eq('chatbot_id', chatbot.id),
          supabase.from('social_connections').select('platform').eq('chatbot_id', chatbot.id),
          supabase.from('web_chat_messages').select('id', { count: 'exact', head: true }).eq('chatbot_id', chatbot.id),
          supabase.from('telegram_messages').select('id', { count: 'exact', head: true }).eq('chatbot_id', chatbot.id),
          supabase.from('whatsapp_messages').select('id', { count: 'exact', head: true }).eq('chatbot_id', chatbot.id),
          supabase.from('web_chat_messages').select('id', { count: 'exact', head: true }).eq('chatbot_id', chatbot.id).eq('role', 'user'),
          supabase.from('telegram_messages').select('id', { count: 'exact', head: true }).eq('chatbot_id', chatbot.id).eq('role', 'user'),
          supabase.from('whatsapp_messages').select('id', { count: 'exact', head: true }).eq('chatbot_id', chatbot.id).eq('role', 'user'),
          supabase.from('web_chat_messages').select('content').eq('chatbot_id', chatbot.id).eq('role', 'user').limit(500),
          supabase.from('telegram_messages').select('content').eq('chatbot_id', chatbot.id).eq('role', 'user').limit(500),
          supabase.from('whatsapp_messages').select('content').eq('chatbot_id', chatbot.id).eq('role', 'user').limit(500),
          supabase.from('whatsapp_contacts').select('id', { count: 'exact', head: true }).eq('chatbot_id', chatbot.id),
          supabase.from('telegram_users').select('id', { count: 'exact', head: true }).eq('chatbot_id', chatbot.id),
        ]);

        // Channels: combine legacy `channels` (telegram) with social_connections (fb/ig/wa)
        const map: Record<PlatformKey, boolean> = {
          telegram: false,
          facebook: false,
          instagram: false,
          whatsapp: false,
        };
        (tgChRes.data || []).forEach((c: any) => {
          if (c.platform === 'telegram') map.telegram = !!c.is_connected;
        });
        (socialRes.data || []).forEach((c: any) => {
          if (c.platform in map) map[c.platform as PlatformKey] = true;
        });
        setChannels(
          (Object.keys(map) as PlatformKey[]).map((p) => ({ platform: p, connected: map[p] }))
        );

        setTotalMessages((webCountRes.count || 0) + (tgCountRes.count || 0) + (waCountRes.count || 0));
        setUserMessages((webUserCountRes.count || 0) + (tgUserCountRes.count || 0) + (waUserCountRes.count || 0));

        setUniqueContacts((waContactsRes.count || 0) + (tgUsersRes.count || 0));

        // Top questions: aggregate a bounded slice of recent user messages.
        const counts = new Map<string, number>();
        const bucket = (rows: any[] | null | undefined) => {
          (rows || []).forEach((m) => {
            const k = (m.content || '').trim();
            if (!k) return;
            counts.set(k, (counts.get(k) || 0) + 1);
          });
        };
        bucket(webUserMsgsRes.data);
        bucket(tgUserMsgsRes.data);
        bucket(waUserMsgsRes.data);
        const top = [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([question, count]) => ({ question, count }));
        setTopQuestions(top);
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [chatbot]);

  if (chatbotLoading || loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <PageHeader title="لوحة التحكم" description="إدارة الشات بوت ومتابعة الأداء" />
        <StatCardsSkeleton />
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </div>
        <CardGridSkeleton count={2} />
      </div>
    );
  }

  const connectedCount = channels.filter((c) => c.connected).length;

  return (
    <div className="space-y-8">
      <PageHeader title="لوحة التحكم" description="إدارة الشات بوت ومتابعة الأداء" />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي الرسائل"
          value={totalMessages.toLocaleString('ar-SA')}
          icon={MessageSquare}
          description="عبر جميع القنوات"
        />
        <StatCard
          title="رسائل المستخدمين"
          value={userMessages.toLocaleString('ar-SA')}
          icon={MessageSquare}
        />
        <StatCard
          title="جهات الاتصال"
          value={uniqueContacts.toLocaleString('ar-SA')}
          icon={Users}
          description="إجمالي المتفاعلين"
        />
        <StatCard
          title="القنوات النشطة"
          value={connectedCount}
          icon={Share2}
          description={`من ${channels.length} قنوات`}
        />
      </div>

      {chatbot && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">الشات بوت الخاص بك</h2>
          </div>
          <div className="card-elevated p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{chatbot.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {chatbot.language} • نبرة {toneLabels[chatbot.tone] || chatbot.tone}
                  </p>
                </div>
              </div>
              <StatusBadge status={chatbot.is_active ? 'active' : 'inactive'} />
            </div>
            <div className="mt-6 flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/settings">
                  <Settings className="ml-2 h-4 w-4" />
                  إعدادات
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/dashboard/test">
                  <MessageSquare className="ml-2 h-4 w-4" />
                  تجربة الشات
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card-elevated p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">القنوات المتصلة</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/channels">
                عرض الكل
                <ArrowLeft className="mr-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {channels.map((c) => (
              <div
                key={c.platform}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-3">
                  <ChannelIcon channel={c.platform} withBg />
                  <span className="font-medium text-foreground">{platformLabels[c.platform]}</span>
                </div>
                <StatusBadge status={c.connected ? 'connected' : 'disconnected'} />
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">الأسئلة الأكثر شيوعاً</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/analytics">
                الإحصائيات
                <ArrowLeft className="mr-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {topQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد رسائل بعد.</p>
          ) : (
            <div className="space-y-3">
              {topQuestions.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <span className="truncate text-sm text-foreground">{item.question}</span>
                  <span className="mr-2 shrink-0 text-sm font-medium text-muted-foreground">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
