import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bot,
  CheckCheck,
  Inbox as InboxIcon,
  Loader2,
  RefreshCw,
  Search,
  Send,
  UserRound,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useChatbot } from '@/hooks/useChatbot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ChannelIcon } from '@/components/ChannelIcon';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type InboxChannel = 'telegram' | 'whatsapp' | 'messenger' | 'web';
type MessageRole = 'user' | 'assistant';

interface InboxMessage {
  id: string;
  channel: InboxChannel;
  contactId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

interface Conversation {
  key: string;
  channel: InboxChannel;
  contactId: string;
  contactName: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
  hasAttention: boolean;
}

interface AttentionItem {
  id: string;
  channel: string;
  contact_identifier: string;
  is_read: boolean;
  is_resolved: boolean;
}

interface TakeoverRow {
  channel: string;
  external_id: string;
  active: boolean;
}

const channelLabels: Record<InboxChannel, string> = {
  telegram: 'تيليجرام',
  whatsapp: 'واتساب',
  messenger: 'ماسنجر',
  web: 'الموقع',
};

const normalizeChannel = (channel: string): InboxChannel => {
  if (channel === 'facebook') return 'messenger';
  if (channel === 'telegram' || channel === 'whatsapp' || channel === 'messenger') return channel;
  return 'web';
};

const conversationKey = (channel: InboxChannel, contactId: string) => `${channel}:${contactId}`;

const normalizeRole = (role: string): MessageRole =>
  role === 'assistant' || role === 'bot' ? 'assistant' : 'user';

const formatConversationTime = (value: string) => {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('ar', { day: 'numeric', month: 'short' });
};

export default function InboxPage() {
  const { chatbot, loading: chatbotLoading } = useChatbot();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [attention, setAttention] = useState<AttentionItem[]>([]);
  const [takeovers, setTakeovers] = useState<TakeoverRow[]>([]);
  const [contactNames, setContactNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [mobileConversationOpen, setMobileConversationOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | InboxChannel>('all');
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingTakeover, setUpdatingTakeover] = useState(false);

  const loadInbox = useCallback(async (quiet = false) => {
    if (!chatbot) {
      if (!chatbotLoading) setLoading(false);
      return;
    }

    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const chatbotId = chatbot.id;
      const [
        telegramRes,
        whatsappRes,
        messengerRes,
        webRes,
        customersRes,
        telegramUsersRes,
        whatsappContactsRes,
        notificationsRes,
        takeoversRes,
      ] = await Promise.all([
        supabase.from('telegram_messages').select('id, telegram_user_id, role, content, created_at').eq('chatbot_id', chatbotId).order('created_at', { ascending: false }).limit(400),
        supabase.from('whatsapp_messages').select('id, phone_number, role, content, created_at').eq('chatbot_id', chatbotId).order('created_at', { ascending: false }).limit(400),
        supabase.from('messenger_messages').select('id, messenger_user_id, role, content, created_at').eq('chatbot_id', chatbotId).order('created_at', { ascending: false }).limit(400),
        supabase.from('web_chat_messages').select('id, user_id, role, content, created_at').eq('chatbot_id', chatbotId).order('created_at', { ascending: false }).limit(400),
        supabase.from('customers').select('channel, external_id, name, username, phone').eq('chatbot_id', chatbotId),
        supabase.from('telegram_users').select('telegram_user_id, first_name, username').eq('chatbot_id', chatbotId),
        supabase.from('whatsapp_contacts').select('phone_number, name').eq('chatbot_id', chatbotId),
        supabase.from('notifications').select('id, channel, contact_identifier, is_read, is_resolved').eq('chatbot_id', chatbotId).order('created_at', { ascending: false }).limit(200),
        supabase.from('conversation_takeovers').select('channel, external_id, active').eq('chatbot_id', chatbotId),
      ]);

      const firstError = [telegramRes, whatsappRes, messengerRes, webRes].find((result) => result.error)?.error;
      if (firstError) throw firstError;

      const nextMessages: InboxMessage[] = [
        ...(telegramRes.data || []).map((row) => ({
          id: row.id,
          channel: 'telegram' as const,
          contactId: String(row.telegram_user_id),
          role: normalizeRole(row.role),
          content: row.content,
          createdAt: row.created_at,
        })),
        ...(whatsappRes.data || []).map((row) => ({
          id: row.id,
          channel: 'whatsapp' as const,
          contactId: row.phone_number,
          role: normalizeRole(row.role),
          content: row.content,
          createdAt: row.created_at,
        })),
        ...(messengerRes.data || []).map((row) => ({
          id: row.id,
          channel: 'messenger' as const,
          contactId: row.messenger_user_id,
          role: normalizeRole(row.role),
          content: row.content,
          createdAt: row.created_at,
        })),
        ...(webRes.data || []).map((row) => ({
          id: row.id,
          channel: 'web' as const,
          contactId: row.user_id,
          role: normalizeRole(row.role),
          content: row.content,
          createdAt: row.created_at,
        })),
      ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const names: Record<string, string> = {};
      (customersRes.data || []).forEach((customer) => {
        const channel = normalizeChannel(customer.channel);
        names[conversationKey(channel, customer.external_id)] =
          customer.name || customer.username || customer.phone || customer.external_id;
      });
      (telegramUsersRes.data || []).forEach((contact) => {
        const id = String(contact.telegram_user_id);
        names[conversationKey('telegram', id)] = contact.first_name || contact.username || `عميل ${id.slice(-4)}`;
      });
      (whatsappContactsRes.data || []).forEach((contact) => {
        names[conversationKey('whatsapp', contact.phone_number)] = contact.name || contact.phone_number;
      });

      setMessages(nextMessages);
      setContactNames(names);
      setAttention((notificationsRes.data || []) as AttentionItem[]);
      setTakeovers((takeoversRes.data || []) as TakeoverRow[]);
    } catch (loadError) {
      console.error('Inbox load error:', loadError);
      setError('تعذر تحميل المحادثات. تحقق من الاتصال وحاول مجددًا.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [chatbot, chatbotLoading]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const unresolvedKeys = useMemo(() => new Set(
    attention
      .filter((item) => !item.is_resolved)
      .map((item) => conversationKey(normalizeChannel(item.channel), item.contact_identifier)),
  ), [attention]);

  const conversations = useMemo(() => {
    const grouped = new Map<string, Conversation>();
    messages.forEach((message) => {
      const key = conversationKey(message.channel, message.contactId);
      const existing = grouped.get(key);
      grouped.set(key, {
        key,
        channel: message.channel,
        contactId: message.contactId,
        contactName: contactNames[key] || (message.channel === 'web' ? `زائر ${message.contactId.slice(-5)}` : message.contactId),
        lastMessage: message.content,
        lastMessageAt: message.createdAt,
        messageCount: (existing?.messageCount || 0) + 1,
        hasAttention: unresolvedKeys.has(key),
      });
    });
    return [...grouped.values()].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    );
  }, [contactNames, messages, unresolvedKeys]);

  useEffect(() => {
    if (!selectedKey && conversations.length > 0) setSelectedKey(conversations[0].key);
    if (selectedKey && !conversations.some((conversation) => conversation.key === selectedKey)) {
      setSelectedKey(conversations[0]?.key || null);
    }
  }, [conversations, selectedKey]);

  const filteredConversations = useMemo(() => {
    const term = search.trim().toLowerCase();
    return conversations.filter((conversation) => {
      if (channelFilter !== 'all' && conversation.channel !== channelFilter) return false;
      if (attentionOnly && !conversation.hasAttention) return false;
      if (!term) return true;
      return conversation.contactName.toLowerCase().includes(term) || conversation.lastMessage.toLowerCase().includes(term);
    });
  }, [attentionOnly, channelFilter, conversations, search]);

  const selectedConversation = conversations.find((conversation) => conversation.key === selectedKey) || null;
  const selectedMessages = selectedConversation
    ? messages.filter((message) => conversationKey(message.channel, message.contactId) === selectedConversation.key)
    : [];
  const selectedTakeover = selectedConversation
    ? takeovers.find((row) => normalizeChannel(row.channel) === selectedConversation.channel && row.external_id === selectedConversation.contactId)?.active || false
    : false;

  const openConversation = async (conversation: Conversation) => {
    setSelectedKey(conversation.key);
    setMobileConversationOpen(true);
    const ids = attention
      .filter((item) => !item.is_read && conversationKey(normalizeChannel(item.channel), item.contact_identifier) === conversation.key)
      .map((item) => item.id);
    if (ids.length > 0) {
      await supabase.from('notifications').update({ is_read: true }).in('id', ids);
      setAttention((current) => current.map((item) => ids.includes(item.id) ? { ...item, is_read: true } : item));
    }
  };

  const resolveAttention = async () => {
    if (!selectedConversation) return;
    const ids = attention
      .filter((item) => !item.is_resolved && conversationKey(normalizeChannel(item.channel), item.contact_identifier) === selectedConversation.key)
      .map((item) => item.id);
    if (ids.length === 0) return;
    const { error: resolveError } = await supabase.from('notifications').update({ is_read: true, is_resolved: true }).in('id', ids);
    if (resolveError) {
      toast.error('تعذر إغلاق التنبيه');
      return;
    }
    setAttention((current) => current.map((item) => ids.includes(item.id) ? { ...item, is_read: true, is_resolved: true } : item));
    toast.success('تمت معالجة التنبيه');
  };

  const toggleTakeover = async (active: boolean) => {
    if (!selectedConversation || !chatbot) return;
    setUpdatingTakeover(true);
    const payload = {
      chatbot_id: chatbot.id,
      channel: selectedConversation.channel,
      external_id: selectedConversation.contactId,
      active,
      last_human_at: new Date().toISOString(),
      source: 'dashboard',
    };
    const { error: takeoverError } = await supabase
      .from('conversation_takeovers')
      .upsert(payload, { onConflict: 'chatbot_id,channel,external_id' });
    setUpdatingTakeover(false);
    if (takeoverError) {
      toast.error('تعذر تحديث وضع التدخل البشري');
      return;
    }
    setTakeovers((current) => [
      ...current.filter((row) => !(normalizeChannel(row.channel) === selectedConversation.channel && row.external_id === selectedConversation.contactId)),
      { channel: selectedConversation.channel, external_id: selectedConversation.contactId, active },
    ]);
    toast.success(active ? 'تم إيقاف الرد الآلي لهذه المحادثة' : 'عاد المساعد للرد تلقائيًا');
  };

  const sendReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedConversation || selectedConversation.channel !== 'telegram' || !reply.trim() || !chatbot) return;
    setSending(true);
    const { error: sendError } = await supabase.functions.invoke('send-telegram-reply', {
      body: {
        chatbot_id: chatbot.id,
        telegram_user_id: Number(selectedConversation.contactId),
        message: reply.trim(),
      },
    });
    setSending(false);
    if (sendError) {
      toast.error('تعذر إرسال الرد');
      return;
    }
    setReply('');
    await loadInbox(true);
  };

  if (chatbotLoading || loading) {
    return (
      <div className="grid min-h-[65vh] place-items-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">جارٍ جمع المحادثات من جميع القنوات…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5" dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-primary">مركز التواصل</p>
          <h1 className="text-2xl font-semibold sm:text-3xl">المحادثات</h1>
          <p className="mt-1 text-sm text-muted-foreground">تابع رسائل العملاء وتدخل عندما يحتاجون إلى موظف.</p>
        </div>
        <Button variant="outline" onClick={() => loadInbox(true)} disabled={refreshing} className="w-full sm:w-auto">
          <RefreshCw className={cn('ml-2 h-4 w-4', refreshing && 'animate-spin')} />
          تحديث
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <p className="mt-3 font-medium">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => loadInbox()}>إعادة المحاولة</Button>
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
          <InboxIcon className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h2 className="mt-4 text-lg font-semibold">لا توجد محادثات بعد</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            عندما يرسل عميل رسالة عبر رابط الموقع أو إحدى القنوات المتصلة، ستظهر محادثته هنا تلقائيًا.
          </p>
        </div>
      ) : (
        <div className="grid min-h-[650px] overflow-hidden rounded-2xl border bg-card shadow-sm md:grid-cols-[320px_minmax(0,1fr)]">
          <aside className={cn('min-h-0 flex-col border-l bg-muted/20', mobileConversationOpen ? 'hidden md:flex' : 'flex')}>
            <div className="space-y-3 border-b p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث في المحادثات…" className="pr-9" />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(['all', 'telegram', 'whatsapp', 'messenger', 'web'] as const).map((channel) => (
                  <button
                    key={channel}
                    onClick={() => setChannelFilter(channel)}
                    className={cn(
                      'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                      channelFilter === channel ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {channel === 'all' ? 'الكل' : channelLabels[channel]}
                  </button>
                ))}
              </div>
              <label className="flex cursor-pointer items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm">
                <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-500" /> تحتاج تدخلي</span>
                <Switch checked={attentionOnly} onCheckedChange={setAttentionOnly} />
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة.</p>
              ) : filteredConversations.map((conversation) => (
                <button
                  key={conversation.key}
                  onClick={() => openConversation(conversation)}
                  className={cn(
                    'flex w-full gap-3 border-b p-4 text-right transition-colors hover:bg-muted/60',
                    selectedKey === conversation.key && 'bg-primary/[0.07]',
                  )}
                >
                  <ChannelIcon channel={conversation.channel} withBg />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{conversation.contactName}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{formatConversationTime(conversation.lastMessageAt)}</span>
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{conversation.lastMessage}</span>
                      {conversation.hasAttention && <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-label="تحتاج تدخل" />}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className={cn('min-w-0 flex-col', mobileConversationOpen ? 'flex' : 'hidden md:flex')}>
            {selectedConversation ? (
              <>
                <header className="flex flex-wrap items-center gap-3 border-b px-4 py-3 sm:px-5">
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileConversationOpen(false)} aria-label="العودة للمحادثات">
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                  <ChannelIcon channel={selectedConversation.channel} withBg />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-semibold">{selectedConversation.contactName}</h2>
                      <Badge variant="outline">{channelLabels[selectedConversation.channel]}</Badge>
                      {selectedConversation.hasAttention && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">تحتاج تدخلك</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{selectedConversation.messageCount.toLocaleString('ar')} رسالة</p>
                  </div>
                  {selectedConversation.hasAttention && (
                    <Button variant="outline" size="sm" onClick={resolveAttention}>
                      <CheckCheck className="ml-2 h-4 w-4" /> تمت المعالجة
                    </Button>
                  )}
                </header>

                <div className="flex items-center justify-between gap-4 border-b bg-amber-50/50 px-4 py-3 dark:bg-amber-950/10 sm:px-5">
                  <div>
                    <p className="text-sm font-medium">التدخل البشري</p>
                    <p className="text-xs text-muted-foreground">عند تفعيله يتوقف المساعد الآلي عن الرد في هذه المحادثة.</p>
                  </div>
                  <Switch checked={selectedTakeover} onCheckedChange={toggleTakeover} disabled={updatingTakeover} />
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto bg-muted/20 p-4 sm:p-6">
                  {selectedMessages.map((message) => (
                    <div key={`${message.channel}-${message.id}`} className={cn('flex items-end gap-2', message.role === 'user' ? 'justify-start' : 'justify-end')}>
                      <span className={cn(
                        'grid h-7 w-7 shrink-0 place-items-center rounded-full',
                        message.role === 'user' ? 'bg-muted' : 'bg-primary/10',
                      )}>
                        {message.role === 'user' ? <UserRound className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5 text-primary" />}
                      </span>
                      <div className={cn(
                        'max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm sm:max-w-[70%]',
                        message.role === 'user' ? 'rounded-br-sm border bg-card' : 'rounded-bl-sm bg-primary text-primary-foreground',
                      )}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className="mt-1 text-[10px] opacity-60">{new Date(message.createdAt).toLocaleString('ar', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedConversation.channel === 'telegram' ? (
                  <form onSubmit={sendReply} className="flex items-center gap-2 border-t p-3 sm:p-4">
                    <Input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="اكتب ردًا للعميل…" disabled={sending} className="flex-1" />
                    <Button type="submit" size="icon" disabled={sending || !reply.trim()} aria-label="إرسال الرد">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                ) : (
                  <div className="border-t bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground">
                    الرد اليدوي من جوابي متاح حاليًا لمحادثات تيليجرام. يمكنك متابعة بقية القنوات من تطبيقاتها الأصلية.
                  </div>
                )}
              </>
            ) : (
              <div className="grid flex-1 place-items-center text-center text-muted-foreground">
                <div><InboxIcon className="mx-auto h-10 w-10 opacity-40" /><p className="mt-3">اختر محادثة لعرضها.</p></div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
