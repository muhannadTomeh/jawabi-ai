import { useState, useEffect } from 'react';
import { ExternalLink, Settings, Loader2, Unlink, Copy, Check, Globe, Info, ChevronDown, MoreHorizontal } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CardGridSkeleton } from '@/components/layout/PageSkeletons';
import { FaTelegram, FaFacebookMessenger, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import type { IconType } from 'react-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useChatbot } from '@/hooks/useChatbot';
import { useToast } from '@/hooks/use-toast';
import { TelegramConnectDialog } from '@/components/channels/TelegramConnectDialog';
import { OAuthConnectDialog } from '@/components/channels/OAuthConnectDialog';
import { EmbedWidgetCard } from '@/components/channels/EmbedWidgetCard';

type Platform = 'telegram' | 'facebook' | 'instagram' | 'whatsapp';

interface Channel {
  id: string;
  chatbot_id: string;
  platform: string;
  is_connected: boolean;
  config: Record<string, string> | null;
  created_at: string;
  bot_status?: string;
}

interface SocialConnection {
  id: string;
  platform: string;
  page_id: string;
  page_name: string | null;
  created_at: string;
  bot_status?: string;
}

const channelInfo: Record<Platform, { name: string; description: string; color: string; textColor: string; Icon: IconType }> = {
  telegram: {
    name: 'تيليجرام',
    description: 'اربط بوت تيليجرام للرد على الرسائل تلقائياً',
    color: 'bg-[#0088cc]/10',
    textColor: 'text-[#0088cc]',
    Icon: FaTelegram,
  },
  facebook: {
    name: 'فيسبوك ماسنجر',
    description: 'اربط صفحة فيسبوك للرد على استفسارات العملاء عبر ماسنجر',
    color: 'bg-[#0084ff]/10',
    textColor: 'text-[#0084ff]',
    Icon: FaFacebookMessenger,
  },
  instagram: {
    name: 'انستغرام',
    description: 'اربط حساب انستغرام بزنس للرد على الرسائل المباشرة',
    color: 'bg-[#E4405F]/10',
    textColor: 'text-[#E4405F]',
    Icon: FaInstagram,
  },
  whatsapp: {
    name: 'واتساب',
    description: 'اربط واتساب بزنس للرد على رسائل العملاء تلقائياً',
    color: 'bg-[#25D366]/10',
    textColor: 'text-[#25D366]',
    Icon: FaWhatsapp,
  },
};

export default function ChannelsPage() {
  const { chatbot, loading: chatbotLoading } = useChatbot();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [telegramDialogOpen, setTelegramDialogOpen] = useState(false);
  const [oauthPlatform, setOauthPlatform] = useState<'facebook' | 'instagram' | 'whatsapp' | null>(null);
  const [disconnectPlatform, setDisconnectPlatform] = useState<Platform | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [togglingPlatform, setTogglingPlatform] = useState<Platform | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    if (!chatbot) return;

    try {
      // Fetch channels (telegram, legacy)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const session = (await supabase.auth.getSession()).data.session;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/manage-channel?action=list&chatbot_id=${chatbot.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setChannels((result.channels as Channel[]) || []);
      }

      // Fetch social connections
      const { data: connections } = await supabase
        .from('social_connections')
        .select('id, platform, page_id, page_name, created_at, bot_status')
        .eq('chatbot_id', chatbot.id);

      setSocialConnections(connections || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatbot) fetchData();
  }, [chatbot]);

  const isConnected = (platform: Platform): boolean => {
    if (platform === 'telegram') {
      return channels.some((c) => c.platform === 'telegram' && c.is_connected);
    }
    return socialConnections.some((c) => c.platform === platform);
  };

  const getConnectionInfo = (platform: Platform): string | null => {
    if (platform === 'telegram') {
      const ch = channels.find((c) => c.platform === 'telegram');
      return ch?.config?.bot_username ? `@${ch.config.bot_username}` : null;
    }
    const conn = socialConnections.find((c) => c.platform === platform);
    return conn?.page_name || null;
  };

  const getBotStatus = (platform: Platform): 'active' | 'inactive' => {
    if (platform === 'telegram') {
      const ch = channels.find((c) => c.platform === 'telegram');
      return (ch?.bot_status as 'active' | 'inactive') || 'active';
    }
    const conn = socialConnections.find((c) => c.platform === platform);
    return (conn?.bot_status as 'active' | 'inactive') || 'active';
  };

  const handleToggleBotStatus = async (platform: Platform, checked: boolean) => {
    if (!chatbot) return;
    const newStatus = checked ? 'active' : 'inactive';
    setTogglingPlatform(platform);
    try {
      if (platform === 'telegram') {
        const ch = channels.find((c) => c.platform === 'telegram');
        if (!ch) throw new Error('No telegram channel');
        const { error } = await supabase
          .from('channels')
          .update({ bot_status: newStatus })
          .eq('id', ch.id);
        if (error) throw error;
        setChannels((prev) => prev.map((c) => (c.id === ch.id ? { ...c, bot_status: newStatus } : c)));
      } else {
        const conn = socialConnections.find((c) => c.platform === platform);
        if (!conn) throw new Error('No connection');
        const { error } = await supabase
          .from('social_connections')
          .update({ bot_status: newStatus })
          .eq('id', conn.id);
        if (error) throw error;
        setSocialConnections((prev) => prev.map((c) => (c.id === conn.id ? { ...c, bot_status: newStatus } : c)));
      }
      toast({
        title: checked ? 'تم تفعيل البوت' : 'تم إيقاف البوت',
        description: `${channelInfo[platform].name}: ${checked ? 'نشط' : 'غير نشط'}`,
      });
    } catch (error) {
      console.error('Toggle error:', error);
      toast({ title: 'خطأ', description: 'تعذر تحديث حالة البوت', variant: 'destructive' });
    } finally {
      setTogglingPlatform(null);
    }
  };

  const handleConnect = (platform: Platform) => {
    if (platform === 'telegram') {
      setTelegramDialogOpen(true);
    } else {
      setOauthPlatform(platform);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectPlatform || !chatbot) return;
    setDisconnecting(true);

    try {
      if (disconnectPlatform === 'telegram') {
        const ch = channels.find((c) => c.platform === 'telegram');
        if (ch) {
          const session = (await supabase.auth.getSession()).data.session;
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-channel?action=disconnect`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session?.access_token}`,
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ channel_id: ch.id }),
            }
          );
        }
      } else {
        // Delete social connection
        await supabase
          .from('social_connections')
          .delete()
          .eq('chatbot_id', chatbot.id)
          .eq('platform', disconnectPlatform);

        // Also clean up channels table if needed
        const platformMap: Record<string, string> = { facebook: 'messenger', whatsapp: 'whatsapp' };
        const channelPlatform = platformMap[disconnectPlatform];
        if (channelPlatform) {
          const session = (await supabase.auth.getSession()).data.session;
          const ch = channels.find((c) => c.platform === channelPlatform);
          if (ch) {
            await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-channel?action=disconnect`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session?.access_token}`,
                  'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ channel_id: ch.id }),
              }
            );
          }
        }
      }

      toast({ title: 'تم إلغاء الربط', description: `تم إلغاء ربط ${channelInfo[disconnectPlatform].name}` });
      fetchData();
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء إلغاء الربط', variant: 'destructive' });
    } finally {
      setDisconnectPlatform(null);
      setDisconnecting(false);
    }
  };

  if (chatbotLoading || loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="القنوات" description="اربط الشات بوت بمنصات المراسلة" />
        <CardGridSkeleton count={4} />
      </div>
    );
  }

  const platforms: Platform[] = ['telegram', 'facebook', 'instagram', 'whatsapp'];
  const publicUrl = chatbot?.public_slug
    ? `${window.location.origin}/chat/${chatbot.public_slug}`
    : null;

  const copyLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast({ title: 'تم النسخ', description: 'تم نسخ رابط الشات بوت' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="القنوات" description="اربط الشات بوت بمنصات المراسلة" />

      <details className="card-elevated p-5 group">
        <summary className="flex items-center gap-3 cursor-pointer list-none">
          <div className="rounded-lg bg-amber-500/10 p-2">
            <Info className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">ملاحظة مهمة لربط قنوات Meta (فيسبوك / إنستغرام / واتساب)</h3>
            <p className="text-sm text-muted-foreground mt-0.5">تطبيق جوابي حالياً في وضع التطوير — يجب إضافتك كمختبِر (Tester) لتتمكن من الربط.</p>
          </div>
          <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-4 ps-11 space-y-3 text-sm text-foreground">
          <p>لربط أي قناة من Meta، يجب أن يضيفك مالك التطبيق كـ <strong>Tester</strong> أو <strong>Developer</strong> في Meta for Developers. الخطوات:</p>
          <ol className="list-decimal ps-6 space-y-1.5 text-muted-foreground">
            <li>أرسل لنا اسم حساب فيسبوك الخاص بك على: <a href="mailto:muhannad.tomeh22@gmail.com" className="text-primary hover:underline">muhannad.tomeh22@gmail.com</a></li>
            <li>سنرسل لك دعوة كـ Tester على تطبيق جوابي في Meta.</li>
            <li>افتح <a href="https://developers.facebook.com/settings/developer/requests/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">إعدادات المطوّر في Meta <ExternalLink className="h-3 w-3" /></a> واقبل الدعوة.</li>
            <li>ارجع إلى هذه الصفحة واضغط "ربط" على القناة المطلوبة.</li>
          </ol>
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            💡 <strong>تيليجرام</strong> يعمل مباشرة بدون هذه الخطوة. ننصح بالبدء به.
          </p>
        </div>
      </details>

      {publicUrl && (
        <div className="surface-panel p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/40">
              <Globe className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">رابط الشات بوت العام</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                شارك هذا الرابط مع عملائك ليتمكنوا من التحدث مع البوت مباشرة من المتصفح
              </p>
              <div className="mt-4 flex max-w-[600px] flex-col gap-2 sm:flex-row">
                <Input value={publicUrl} readOnly dir="ltr" className="font-mono text-sm" />
                <Button onClick={copyLink} variant="outline" className="shrink-0">
                  {copied ? <Check className="ml-2 h-4 w-4" /> : <Copy className="ml-2 h-4 w-4" />}
                  {copied ? 'تم النسخ' : 'نسخ'}
                </Button>
                <Button asChild variant="outline" className="shrink-0">
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="ml-2 h-4 w-4" />
                    فتح
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {chatbot?.public_slug && <EmbedWidgetCard slug={chatbot.public_slug} />}

      <div className="surface-panel overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>القناة</TableHead>
                <TableHead className="hidden md:table-cell">الحساب</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="hidden sm:table-cell">تشغيل البوت</TableHead>
                <TableHead className="w-12 text-end">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {platforms.map((platform) => {
                const info = channelInfo[platform];
                const connected = isConnected(platform);
                const connInfo = getConnectionInfo(platform);
                const botStatus = getBotStatus(platform);
                const isToggling = togglingPlatform === platform;
                const Icon = info.Icon;

                return (
                  <TableRow key={platform}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${info.color}`}>
                          <Icon className={`h-[18px] w-[18px] ${info.textColor}`} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{info.name}</p>
                          <p className="line-clamp-1 max-w-[320px] text-xs text-muted-foreground">
                            {info.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell" dir="ltr">
                      {connected && connInfo ? connInfo : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={connected ? 'connected' : 'disconnected'} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {connected ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`bot-status-${platform}`}
                            checked={botStatus === 'active'}
                            disabled={isToggling}
                            onCheckedChange={(checked) => handleToggleBotStatus(platform, checked)}
                          />
                          <Label
                            htmlFor={`bot-status-${platform}`}
                            className={`text-xs font-medium ${
                              botStatus === 'active' ? 'text-success' : 'text-muted-foreground'
                            }`}
                          >
                            {isToggling ? 'جارٍ التحديث...' : botStatus === 'active' ? 'نشط' : 'موقوف'}
                          </Label>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-end">
                      {connected ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-40">
                            <DropdownMenuItem onClick={() => handleConnect(platform)}>
                              <Settings className="me-2 h-4 w-4" />
                              إعدادات
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDisconnectPlatform(platform)}
                            >
                              <Unlink className="me-2 h-4 w-4" />
                              إلغاء الربط
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleConnect(platform)}>
                          <ExternalLink className="me-2 h-4 w-4" />
                          ربط
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Telegram Dialog */}
      {chatbot && (
        <TelegramConnectDialog
          open={telegramDialogOpen}
          onOpenChange={setTelegramDialogOpen}
          chatbotId={chatbot.id}
          existingChannel={channels.find((c) => c.platform === 'telegram') as any}
          onSuccess={fetchData}
        />
      )}

      {/* Unified OAuth Dialog */}
      {chatbot && oauthPlatform && (
        <OAuthConnectDialog
          open={!!oauthPlatform}
          onOpenChange={(open) => { if (!open) setOauthPlatform(null); }}
          platform={oauthPlatform}
          chatbotId={chatbot.id}
          onSuccess={fetchData}
        />
      )}

      {/* Disconnect Confirmation */}
      <AlertDialog open={!!disconnectPlatform} onOpenChange={() => setDisconnectPlatform(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء الربط</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إلغاء ربط {disconnectPlatform && channelInfo[disconnectPlatform].name}؟
              سيتوقف الشات بوت عن الرد على الرسائل من هذه القناة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel disabled={disconnecting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disconnecting ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري إلغاء الربط...
                </>
              ) : (
                'إلغاء الربط'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
