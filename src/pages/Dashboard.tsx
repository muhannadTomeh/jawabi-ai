import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Users, ArrowLeft, Share2, Bot, Settings, Loader2, BookOpen, CheckCircle2, Circle, Rocket, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { useChatbot } from '@/hooks/useChatbot';
import { ChannelIcon } from '@/components/ChannelIcon';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

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
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const { chatbot, loading: chatbotLoading } = useChatbot();
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [userMessages, setUserMessages] = useState(0);
  const [uniqueContacts, setUniqueContacts] = useState(0);
  const [topQuestions, setTopQuestions] = useState<TopQuestion[]>([]);
  const [knowledgeCount, setKnowledgeCount] = useState(0);

  useEffect(() => {
    if (!chatbot) {
      if (!chatbotLoading) setLoading(false);
      return;
    }
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
          knowledgeCountRes,
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
          supabase.from('knowledge_items').select('id', { count: 'exact', head: true }).eq('chatbot_id', chatbot.id),
        ]);

        // Channels: combine legacy `channels` (telegram) with social_connections (fb/ig/wa)
        const map: Record<PlatformKey, boolean> = {
          telegram: false,
          facebook: false,
          instagram: false,
          whatsapp: false,
        };
        (tgChRes.data || []).forEach((c: { platform: string; is_connected: boolean | null }) => {
          if (c.platform === 'telegram') map.telegram = !!c.is_connected;
        });
        (socialRes.data || []).forEach((c: { platform: string }) => {
          if (c.platform in map) map[c.platform as PlatformKey] = true;
        });
        setChannels(
          (Object.keys(map) as PlatformKey[]).map((p) => ({ platform: p, connected: map[p] }))
        );

        setTotalMessages((webCountRes.count || 0) + (tgCountRes.count || 0) + (waCountRes.count || 0));
        setUserMessages((webUserCountRes.count || 0) + (tgUserCountRes.count || 0) + (waUserCountRes.count || 0));

        setUniqueContacts((waContactsRes.count || 0) + (tgUsersRes.count || 0));
        setKnowledgeCount(knowledgeCountRes.count || 0);

        // Top questions: aggregate a bounded slice of recent user messages.
        const counts = new Map<string, number>();
        const bucket = (rows: Array<{ content: string | null }> | null | undefined) => {
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
  }, [chatbot, chatbotLoading]);

  if (chatbotLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const connectedCount = channels.filter((c) => c.connected).length;
  const setupSteps = [
    {
      label: 'أضف معلومات نشاطك',
      description: 'عرّف المساعد باسم نشاطك وطريقة الرد المناسبة.',
      done: Boolean(chatbot?.business_name && chatbot?.custom_instructions),
      href: '/dashboard/settings',
      action: 'إكمال الإعدادات',
      icon: Settings,
    },
    {
      label: 'درّب المساعد على معلوماتك',
      description: knowledgeCount > 0 ? `${knowledgeCount.toLocaleString('ar-SA')} مصادر معرفة مضافة` : 'أضف نصاً، ملفاً أو أسئلة شائعة.',
      done: knowledgeCount > 0,
      href: '/dashboard/knowledge',
      action: 'إضافة معرفة',
      icon: BookOpen,
    },
    {
      label: 'جرّب محادثة حقيقية',
      description: 'تأكد من جودة الإجابات قبل مشاركة البوت.',
      done: userMessages > 0,
      href: '/dashboard/test',
      action: 'تجربة البوت',
      icon: MessageSquare,
    },
    {
      label: 'اربط قناة تواصل',
      description: connectedCount > 0 ? `${connectedCount.toLocaleString('ar-SA')} قنوات متصلة` : 'ابدأ بتيليجرام أو واتساب.',
      done: connectedCount > 0,
      href: '/dashboard/channels',
      action: 'ربط قناة',
      icon: Share2,
    },
  ];
  const completedSetupSteps = setupSteps.filter((step) => step.done).length;
  const setupProgress = Math.round((completedSetupSteps / setupSteps.length) * 100);
  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || 'بك';
  const unresolvedNotifications = notifications.filter((notification) => !notification.is_resolved).length;

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-primary">مرحباً {displayName} 👋</p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">لوحة التحكم</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">تابع أداء مساعدك وأكمل تجهيزه للعملاء.</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/dashboard/test">
            <MessageSquare className="ml-2 h-4 w-4" />
            جرّب المساعد
          </Link>
        </Button>
      </div>

      {unresolvedNotifications > 0 && (
        <Link
          to="/dashboard/inbox"
          className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition hover:border-amber-300 dark:border-amber-900/40 dark:bg-amber-950/20 sm:flex-row sm:items-center"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <AlertCircle className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block font-semibold text-foreground">لديك {unresolvedNotifications.toLocaleString('ar')} محادثات تحتاج تدخلك</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">راجع طلبات الموظف والأسئلة التي لم يستطع المساعد إجابتها.</span>
          </span>
          <span className="inline-flex items-center text-sm font-semibold text-primary">فتح المحادثات <ArrowLeft className="mr-1 h-4 w-4" /></span>
        </Link>
      )}

      {completedSetupSteps < setupSteps.length && (
        <section className="overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-sm">
          <div className="flex flex-col gap-5 border-b border-border bg-primary/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">جهّز مساعدك لاستقبال العملاء</h2>
                <p className="mt-1 text-sm text-muted-foreground">أكملت {completedSetupSteps} من {setupSteps.length} خطوات أساسية.</p>
              </div>
            </div>
            <div className="min-w-36">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">نسبة التجهيز</span>
                <span className="font-semibold text-primary">{setupProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-primary/10" aria-label={`نسبة التجهيز ${setupProgress}%`}>
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${setupProgress}%` }} />
              </div>
            </div>
          </div>
          <div className="grid gap-px bg-border sm:grid-cols-2">
            {setupSteps.map((step) => (
              <Link
                key={step.label}
                to={step.href}
                className="group flex items-start gap-3 bg-card p-4 transition-colors hover:bg-muted/50 sm:p-5"
              >
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/50" />
                )}
                <div className="min-w-0 flex-1">
                  <p className={step.done ? 'font-medium text-muted-foreground line-through' : 'font-medium text-foreground'}>{step.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.description}</p>
                  {!step.done && <span className="mt-2 inline-flex text-xs font-semibold text-primary group-hover:underline">{step.action}</span>}
                </div>
                <step.icon className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="card-elevated p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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
              <Link to="/dashboard/inbox">
                المحادثات
                <ArrowLeft className="mr-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {topQuestions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
              <MessageSquare className="mx-auto h-7 w-7 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium text-foreground">لا توجد محادثات بعد</p>
              <p className="mt-1 text-xs text-muted-foreground">جرّب البوت لتظهر أكثر الأسئلة تكراراً هنا.</p>
              <Button variant="link" size="sm" asChild className="mt-2">
                <Link to="/dashboard/test">ابدأ أول محادثة</Link>
              </Button>
            </div>
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
