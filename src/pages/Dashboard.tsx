import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare, Users, ArrowLeft, Share2, Bot, Settings, RefreshCw,
  Activity, TrendingUp, Sparkles, HelpCircle, Cpu, GraduationCap, Database,
  FileText, Zap, Timer, MessagesSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { useChatbot } from '@/hooks/useChatbot';
import { ChannelIcon } from '@/components/ChannelIcon';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCardsSkeleton, CardGridSkeleton } from '@/components/layout/PageSkeletons';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartCard, MessagesTrendChart, ActiveUsersChart, ChannelsChart, ResponseRateChart,
  type DailyPoint, type ChannelPoint,
} from '@/components/dashboard/DashboardCharts';

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

interface ActivityRow {
  channel: PlatformKey | 'web';
  content: string;
  created_at: string;
}

type TimelineKind = 'message' | 'knowledge' | 'channel' | 'notification';

interface TimelineEvent {
  kind: TimelineKind;
  title: string;
  detail?: string;
  channel?: PlatformKey | 'web';
  created_at: string;
}

interface BotMetrics {
  model: string;
  lastTrainedAt: string | null;
  knowledgeChars: number;
  knowledgeItems: number;
  documents: number;
  conversationsToday: number;
  automationRate: number;
  avgResponseSec: number | null;
}

function formatSize(chars: number) {
  const kb = chars / 1024;
  if (kb < 1) return `${chars} حرف`;
  if (kb < 1024) return `${kb.toFixed(1)} كيلوبايت`;
  return `${(kb / 1024).toFixed(1)} ميجابايت`;
}

const channelLabel = (c: ActivityRow['channel']) =>
  c === 'web' ? 'الدردشة على الموقع' : platformLabels[c];

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'الآن';
  if (m < 60) return `قبل ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} ساعة`;
  const d = Math.floor(h / 24);
  return `قبل ${d} يوم`;
}

export default function DashboardPage() {
  const { chatbot, loading: chatbotLoading } = useChatbot();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [userMessages, setUserMessages] = useState(0);
  const [uniqueContacts, setUniqueContacts] = useState(0);
  const [topQuestions, setTopQuestions] = useState<TopQuestion[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [dailySeries, setDailySeries] = useState<DailyPoint[]>([]);
  const [channelDist, setChannelDist] = useState<ChannelPoint[]>([]);
  const [metrics, setMetrics] = useState<BotMetrics>({
    model: '—',
    lastTrainedAt: null,
    knowledgeChars: 0,
    knowledgeItems: 0,
    documents: 0,
    conversationsToday: 0,
    automationRate: 0,
    avgResponseSec: null,
  });

  // Refresh the "last updated" label without refetching data.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const load = async (isRefresh = false) => {
    if (!chatbot) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [
        tgChRes, socialRes,
        webCountRes, tgCountRes, waCountRes,
        webUserCountRes, tgUserCountRes, waUserCountRes,
        webUserMsgsRes, tgUserMsgsRes, waUserMsgsRes,
        waContactsRes, tgUsersRes,
        llmRes, knowledgeRes,
        webAllRes, tgAllRes, waAllRes,
      ] = await Promise.all([
        supabase.from('channels').select('platform, is_connected, created_at').eq('chatbot_id', chatbot.id),
        supabase.from('social_connections').select('platform, page_name, created_at').eq('chatbot_id', chatbot.id),
        supabase.from('web_chat_messages').select('id', { count: 'exact', head: true }).eq('chatbot_id', chatbot.id),
        supabase.from('telegram_messages').select('id', { count: 'exact', head: true }).eq('chatbot_id', chatbot.id),
        supabase.from('whatsapp_messages').select('id', { count: 'exact', head: true }).eq('chatbot_id', chatbot.id),
        supabase.from('web_chat_messages').select('id', { count: 'exact', head: true }).eq('chatbot_id', chatbot.id).eq('role', 'user'),
        supabase.from('telegram_messages').select('id', { count: 'exact', head: true }).eq('chatbot_id', chatbot.id).eq('role', 'user'),
        supabase.from('whatsapp_messages').select('id', { count: 'exact', head: true }).eq('chatbot_id', chatbot.id).eq('role', 'user'),
        supabase.from('web_chat_messages').select('content, created_at').eq('chatbot_id', chatbot.id).eq('role', 'user').order('created_at', { ascending: false }).limit(500),
        supabase.from('telegram_messages').select('content, created_at').eq('chatbot_id', chatbot.id).eq('role', 'user').order('created_at', { ascending: false }).limit(500),
        supabase.from('whatsapp_messages').select('content, created_at').eq('chatbot_id', chatbot.id).eq('role', 'user').order('created_at', { ascending: false }).limit(500),
        supabase.from('whatsapp_contacts').select('id', { count: 'exact', head: true }).eq('chatbot_id', chatbot.id),
        supabase.from('telegram_users').select('id', { count: 'exact', head: true }).eq('chatbot_id', chatbot.id),
        supabase.from('llm_settings').select('model').limit(1).maybeSingle(),
        supabase.from('knowledge_items').select('type, title, content, answer, created_at, last_synced_at').eq('chatbot_id', chatbot.id).limit(1000),
        supabase.from('web_chat_messages').select('user_id, role, created_at').eq('chatbot_id', chatbot.id).order('created_at', { ascending: false }).limit(400),
        supabase.from('telegram_messages').select('telegram_user_id, role, created_at').eq('chatbot_id', chatbot.id).order('created_at', { ascending: false }).limit(400),
        supabase.from('whatsapp_messages').select('phone_number, role, created_at').eq('chatbot_id', chatbot.id).order('created_at', { ascending: false }).limit(400),
      ]);

      const map: Record<PlatformKey, boolean> = {
        telegram: false, facebook: false, instagram: false, whatsapp: false,
      };
      (tgChRes.data || []).forEach((c: any) => {
        if (c.platform === 'telegram') map.telegram = !!c.is_connected;
      });
      (socialRes.data || []).forEach((c: any) => {
        if (c.platform in map) map[c.platform as PlatformKey] = true;
      });
      setChannels((Object.keys(map) as PlatformKey[]).map((p) => ({ platform: p, connected: map[p] })));

      setTotalMessages((webCountRes.count || 0) + (tgCountRes.count || 0) + (waCountRes.count || 0));
      setUserMessages((webUserCountRes.count || 0) + (tgUserCountRes.count || 0) + (waUserCountRes.count || 0));
      setUniqueContacts((waContactsRes.count || 0) + (tgUsersRes.count || 0));

      const counts = new Map<string, number>();
      const all: ActivityRow[] = [];
      const bucket = (rows: any[] | null | undefined, channel: ActivityRow['channel']) => {
        (rows || []).forEach((m) => {
          const k = (m.content || '').trim();
          if (!k) return;
          counts.set(k, (counts.get(k) || 0) + 1);
          if (m.created_at) all.push({ channel, content: k, created_at: m.created_at });
        });
      };
      bucket(webUserMsgsRes.data, 'web');
      bucket(tgUserMsgsRes.data, 'telegram');
      bucket(waUserMsgsRes.data, 'whatsapp');

      setTopQuestions(
        [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([question, count]) => ({ question, count }))
      );
      setActivity(
        all.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 60)
      );

      // ---- Bot overview metrics -------------------------------------------
      const kItems = (knowledgeRes.data || []) as any[];
      const knowledgeChars = kItems.reduce(
        (sum, k) => sum + ((k.content || '').length + (k.answer || '').length),
        0
      );
      const documents = kItems.filter((k) => k.type === 'file' || k.type === 'image').length;
      const lastTrainedAt = kItems
        .map((k) => k.last_synced_at || k.created_at)
        .filter(Boolean)
        .sort()
        .pop() || null;

      type Msg = { key: string; role: string; at: number };
      const msgs: Msg[] = [
        ...((webAllRes.data || []) as any[]).map((m) => ({ key: `w:${m.user_id}`, role: m.role, at: +new Date(m.created_at) })),
        ...((tgAllRes.data || []) as any[]).map((m) => ({ key: `t:${m.telegram_user_id}`, role: m.role, at: +new Date(m.created_at) })),
        ...((waAllRes.data || []) as any[]).map((m) => ({ key: `a:${m.phone_number}`, role: m.role, at: +new Date(m.created_at) })),
      ].sort((a, b) => a.at - b.at);

      const dayAgo = Date.now() - 86400000;
      const conversationsToday = new Set(msgs.filter((m) => m.at >= dayAgo).map((m) => m.key)).size;

      // Pair each user message with the next bot reply in the same conversation.
      const pending = new Map<string, number>();
      const deltas: number[] = [];
      let answered = 0;
      let asked = 0;
      msgs.forEach((m) => {
        if (m.role === 'user') {
          asked += 1;
          if (!pending.has(m.key)) pending.set(m.key, m.at);
        } else {
          const start = pending.get(m.key);
          if (start !== undefined) {
            const d = (m.at - start) / 1000;
            if (d >= 0 && d < 600) deltas.push(d);
            answered += 1;
            pending.delete(m.key);
          }
        }
      });
      const avgResponseSec = deltas.length
        ? Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10
        : null;
      const automationRate = asked > 0 ? Math.min(100, Math.round((answered / asked) * 100)) : 0;

      // ---- Chart series ----------------------------------------------------
      const days: { key: string; label: string; messages: number; users: Set<string> }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        days.push({ key: d.toDateString(), label: d.toLocaleDateString('ar', { weekday: 'short' }), messages: 0, users: new Set() });
      }
      const dayIndex = new Map(days.map((d) => [d.key, d]));
      msgs.forEach((m) => {
        const d = new Date(m.at);
        d.setHours(0, 0, 0, 0);
        const row = dayIndex.get(d.toDateString());
        if (!row) return;
        if (m.role === 'user') {
          row.messages += 1;
          row.users.add(m.key);
        }
      });
      setDailySeries(days.map((d) => ({ label: d.label, messages: d.messages, users: d.users.size })));

      const convByChannel = { web: new Set<string>(), telegram: new Set<string>(), whatsapp: new Set<string>() };
      msgs.forEach((m) => {
        if (m.key.startsWith('w:')) convByChannel.web.add(m.key);
        else if (m.key.startsWith('t:')) convByChannel.telegram.add(m.key);
        else if (m.key.startsWith('a:')) convByChannel.whatsapp.add(m.key);
      });
      setChannelDist([
        { label: 'الدردشة على الموقع', value: convByChannel.web.size, color: 'hsl(var(--primary))' },
        { label: platformLabels.telegram, value: convByChannel.telegram.size, color: 'hsl(199 89% 48%)' },
        { label: platformLabels.whatsapp, value: convByChannel.whatsapp.size, color: 'hsl(142 70% 45%)' },
      ]);

      // ---- Unified activity timeline ---------------------------------------
      const events: TimelineEvent[] = [];
      all.forEach((a) => {
        events.push({
          kind: 'message',
          title: 'وصلت رسالة جديدة',
          detail: a.content,
          channel: a.channel,
          created_at: a.created_at,
        });
      });
      kItems.forEach((k) => {
        const at = k.last_synced_at || k.created_at;
        if (!at) return;
        events.push({
          kind: 'knowledge',
          title: k.last_synced_at ? 'تمت مزامنة قاعدة المعرفة' : 'تم تحديث قاعدة المعرفة',
          detail: k.title || undefined,
          created_at: at,
        });
      });
      ((tgChRes.data || []) as any[]).forEach((c) => {
        if (!c.is_connected || !c.created_at) return;
        events.push({
          kind: 'channel',
          title: 'تم ربط قناة جديدة',
          detail: platformLabels[c.platform as PlatformKey] || c.platform,
          channel: c.platform as PlatformKey,
          created_at: c.created_at,
        });
      });
      ((socialRes.data || []) as any[]).forEach((c) => {
        if (!c.created_at) return;
        events.push({
          kind: 'channel',
          title: 'تم ربط قناة جديدة',
          detail: c.page_name || platformLabels[c.platform as PlatformKey] || c.platform,
          channel: c.platform as PlatformKey,
          created_at: c.created_at,
        });
      });
      setTimeline(
        events.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 12)
      );

      setMetrics({
        model: (llmRes.data as any)?.model || 'google/gemini-2.5-flash',
        lastTrainedAt,
        knowledgeChars,
        knowledgeItems: kItems.length,
        documents,
        conversationsToday,
        automationRate,
        avgResponseSec,
      });
      setSyncedAt(new Date());
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatbot]);

  const lastSync = syncedAt ? `آخر تحديث ${relativeTime(syncedAt.toISOString())}` : 'جارٍ التحديث…';
  void tick;

  if (chatbotLoading || loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <PageHeader title="لوحة التحكم" description="نظرة شاملة على أداء الشات بوت عبر جميع القنوات" />
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </div>
        <StatCardsSkeleton />
        <CardGridSkeleton count={2} />
      </div>
    );
  }

  const connectedCount = channels.filter((c) => c.connected).length;
  const engagementRate = totalMessages > 0 ? Math.round((userMessages / totalMessages) * 100) : 0;

  // Today vs. yesterday, derived from the loaded user messages.
  const now = Date.now();
  const day = 86400000;
  const todayCount = activity.filter((a) => now - +new Date(a.created_at) < day).length;
  const yesterdayCount = activity.filter((a) => {
    const age = now - +new Date(a.created_at);
    return age >= day && age < day * 2;
  }).length;
  const dayTrend = yesterdayCount === 0
    ? (todayCount > 0 ? 100 : 0)
    : Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100);
  const weekCount = activity.filter((a) => now - +new Date(a.created_at) < day * 7).length;

  return (
    <div className="space-y-10">
      {/* 1 — Page header */}
      <PageHeader
        title="لوحة التحكم"
        description="نظرة شاملة على أداء الشات بوت عبر جميع القنوات"
        actions={
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              {lastSync}
            </span>
            <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing}>
              <RefreshCw className={`ms-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        }
      />

      {/* 2 — Main bot overview (primary focal point) */}
      {chatbot && (
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div
            className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
            style={{ background: 'var(--gradient-primary)' }}
            aria-hidden
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <div className="rounded-2xl p-4 shadow-sm" style={{ background: 'var(--gradient-primary)' }}>
                <Bot className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="truncate text-2xl font-semibold tracking-tight text-foreground">
                    {chatbot.name}
                  </h2>
                  <StatusBadge status={chatbot.is_active ? 'active' : 'inactive'} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {chatbot.language} • نبرة {toneLabels[chatbot.tone] || chatbot.tone} •{' '}
                  {connectedCount} من {channels.length} قنوات متصلة
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild>
                <Link to="/dashboard/test">
                  <MessageSquare className="ms-2 h-4 w-4" />
                  تجربة البوت
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/dashboard/knowledge">
                  <GraduationCap className="ms-2 h-4 w-4" />
                  تدريب البوت
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/dashboard/settings">
                  <Settings className="ms-2 h-4 w-4" />
                  الإعدادات
                </Link>
              </Button>
            </div>
          </div>

          {/* Dense overview grid — the panel now carries real operational data */}
          <dl className="relative mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3 xl:grid-cols-6">
            {[
              {
                icon: Cpu,
                label: 'نموذج الذكاء الاصطناعي',
                value: metrics.model.split('/').pop(),
              },
              {
                icon: GraduationCap,
                label: 'آخر تدريب',
                value: metrics.lastTrainedAt ? relativeTime(metrics.lastTrainedAt) : 'لم يتم بعد',
              },
              {
                icon: Database,
                label: 'حجم قاعدة المعرفة',
                value: formatSize(metrics.knowledgeChars),
              },
              {
                icon: FileText,
                label: 'عدد المستندات',
                value: `${metrics.documents} من ${metrics.knowledgeItems}`,
              },
              {
                icon: MessagesSquare,
                label: 'محادثات اليوم',
                value: metrics.conversationsToday.toLocaleString('ar-SA'),
              },
              {
                icon: Zap,
                label: 'نسبة الأتمتة',
                value: `${metrics.automationRate}%`,
              },
              {
                icon: Timer,
                label: 'متوسط زمن الرد',
                value: metrics.avgResponseSec !== null ? `${metrics.avgResponseSec} ثانية` : '—',
              },
            ].map((m) => (
              <div key={m.label} className="bg-card p-4">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <m.icon className="h-3.5 w-3.5" />
                  {m.label}
                </dt>
                <dd className="mt-1.5 truncate text-sm font-semibold text-foreground" title={String(m.value)}>
                  {m.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* 3 — KPI cards */}
      <section>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          المؤشرات الرئيسية
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="رسائل اليوم"
            value={todayCount.toLocaleString('ar-SA')}
            icon={MessageSquare}
            description="رسائل واردة من العملاء"
            accent="primary"
            period="آخر 24 ساعة"
            trend={{ value: dayTrend, isPositive: dayTrend >= 0 }}
          />
          <StatCard
            title="إجمالي الرسائل"
            value={totalMessages.toLocaleString('ar-SA')}
            icon={TrendingUp}
            description={`${userMessages.toLocaleString('ar-SA')} منها من المستخدمين (${engagementRate}%)`}
            accent="info"
            period="منذ بداية التشغيل"
          />
          <StatCard
            title="جهات الاتصال"
            value={uniqueContacts.toLocaleString('ar-SA')}
            icon={Users}
            description="إجمالي المتفاعلين"
            accent="success"
            period={`${weekCount.toLocaleString('ar-SA')} رسالة خلال 7 أيام`}
          />
          <StatCard
            title="القنوات النشطة"
            value={connectedCount}
            icon={Share2}
            description={`من ${channels.length} قنوات`}
            accent="warning"
            period={connectedCount > 0 ? 'تعمل الآن' : 'لم يتم الربط بعد'}
          />
        </div>
      </section>

      {/* 4 — Charts + 5 — Recent activity */}
      <section className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="نشاط الرسائل — آخر ٧ أيام"
          description="رسائل العملاء الواردة يوميًا"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/analytics">
                الإحصائيات
                <ArrowLeft className="me-1 h-4 w-4" />
              </Link>
            </Button>
          }
        >
          <MessagesTrendChart data={dailySeries} />
        </ChartCard>

        <div className="card-elevated rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">آخر النشاطات</h3>
          </div>
          {timeline.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center gap-2 text-center">
              <Activity className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">لا توجد نشاطات بعد.</p>
              <p className="text-xs text-muted-foreground/70">
                ستظهر هنا الرسائل الواردة وتحديثات قاعدة المعرفة وربط القنوات.
              </p>
            </div>
          ) : (
            <ol className="relative max-h-[19rem] space-y-5 overflow-y-auto pe-1 ps-1">
              <span
                className="pointer-events-none absolute bottom-2 end-[13px] top-2 w-px bg-border"
                aria-hidden
              />
              {timeline.map((e, i) => {
                const style = timelineStyles[e.kind];
                const Icon = style.icon;
                return (
                  <li key={i} className="relative flex gap-3">
                    <span
                      className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-card ${style.bg}`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${style.fg}`} />
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-xs text-muted-foreground">{relativeTime(e.created_at)}</p>
                      <p className="mt-0.5 text-sm font-medium text-foreground">{e.title}</p>
                      {e.detail && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground" title={e.detail}>
                          {e.channel ? `${channelLabel(e.channel)} • ` : ''}
                          {e.detail}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>

      {/* 5b — Secondary charts */}
      <section className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="المستخدمون النشطون" description="عدد المتفاعلين الفريدين يوميًا">
          <ActiveUsersChart data={dailySeries} />
        </ChartCard>
        <ChartCard title="المحادثات حسب القناة" description="توزيع المحادثات على القنوات">
          <ChannelsChart data={channelDist} />
        </ChartCard>
        <ChartCard title="معدل رد الذكاء الاصطناعي" description="نسبة الرسائل التي أجاب عنها البوت">
          <ResponseRateChart rate={metrics.automationRate} avgSeconds={metrics.avgResponseSec} />
        </ChartCard>
      </section>

      {/* 6 — Connected channels + 7 — Popular questions */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="card-elevated rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">القنوات المتصلة</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/channels">
                عرض الكل
                <ArrowLeft className="me-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="space-y-2">
            {channels.map((c) => (
              <div
                key={c.platform}
                className="flex items-center justify-between rounded-xl border border-border/70 p-3 transition-colors hover:border-primary/30 hover:bg-accent/40"
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

        <div className="card-elevated rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">الأسئلة الأكثر شيوعاً</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/analytics">
                الإحصائيات
                <ArrowLeft className="me-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {topQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <HelpCircle className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">لا توجد رسائل بعد.</p>
            </div>
          ) : (
            <ol className="space-y-2">
              {topQuestions.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3 transition-colors hover:border-primary/30 hover:bg-accent/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span className="truncate text-sm text-foreground">{item.question}</span>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {item.count}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <p className="flex items-center justify-center gap-1.5 pb-2 text-xs text-muted-foreground sm:hidden">
        <Sparkles className="h-3.5 w-3.5" />
        {lastSync}
      </p>
    </div>
  );
}
