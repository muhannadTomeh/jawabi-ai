import { useMemo, useState } from "react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Check, Trash2, MessageCircleReply, ShoppingCart, HelpCircle, UserCog, Send, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ListSkeleton } from "@/components/layout/PageSkeletons";

const typeMeta: Record<string, { icon: typeof Bell; color: string; ring: string; label: string }> = {
  sale: {
    icon: ShoppingCart,
    color: "text-primary bg-primary/10",
    ring: "ring-primary/20",
    label: "فرصة بيع",
  },
  unclear: {
    icon: HelpCircle,
    color: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
    ring: "ring-amber-500/20",
    label: "سؤال غير مفهوم",
  },
  human_request: {
    icon: UserCog,
    color: "text-sky-600 bg-sky-500/10 dark:text-sky-400",
    ring: "ring-sky-500/20",
    label: "طلب موظف",
  },
};

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} دقيقة`;
  const h = Math.round(m / 60);
  if (h < 24) return `قبل ${h} ساعة`;
  const d = Math.round(h / 24);
  if (d < 30) return `قبل ${d} يوم`;
  return new Date(iso).toLocaleDateString("ar");
};

const channelLabel: Record<string, string> = {
  telegram: "تلجرام",
  whatsapp: "واتساب",
  web: "الشات التجريبي",
};

export default function NotificationsPage() {
  const { notifications, loading, unreadCount, markRead, markAllRead, resolve, remove } = useNotifications();
  const [replyTarget, setReplyTarget] = useState<Notification | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "resolved">("all");

  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.is_read);
    if (filter === "resolved") return notifications.filter((n) => n.is_resolved);
    return notifications;
  }, [notifications, filter]);

  const sendReply = async () => {
    if (!replyTarget || !replyText.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-telegram-reply", {
        body: {
          chatbot_id: replyTarget.chatbot_id,
          telegram_user_id: Number(replyTarget.contact_identifier),
          message: replyText.trim(),
        },
      });
      if (error) throw error;
      toast.success("تم إرسال الرد");
      await resolve(replyTarget.id);
      setReplyTarget(null);
      setReplyText("");
    } catch (e) {
      console.error(e);
      toast.error("فشل إرسال الرد");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإشعارات"
        description="تنبيهات تتطلب تدخلك — طلبات شراء، أسئلة غير مفهومة، طلب موظف بشري."
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={markAllRead} className="rounded-full">
              <Check className="me-2 h-4 w-4" />
              تعليم الكل كمقروء ({unreadCount})
            </Button>
          ) : null
        }
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} dir="rtl">
        <TabsList className="rounded-full bg-muted/60 p-1">
          <TabsTrigger value="all" className="rounded-full px-4">
            الكل
            <span className="ms-2 text-[11px] text-muted-foreground">{notifications.length}</span>
          </TabsTrigger>
          <TabsTrigger value="unread" className="rounded-full px-4">
            غير مقروء
            {unreadCount > 0 && (
              <span className="ms-2 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved" className="rounded-full px-4">
            تمت المعالجة
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 border-dashed p-14 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bell className="h-7 w-7" />
          </div>
          <p className="font-medium">كل شيء تحت السيطرة</p>
          <p className="text-sm text-muted-foreground">لا توجد إشعارات في هذا التبويب.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const meta =
              typeMeta[n.type] || { icon: Bell, color: "text-muted-foreground bg-muted", ring: "ring-border", label: n.type };
            const Icon = meta.icon;
            return (
              <Card
                key={n.id}
                className={`group relative overflow-hidden rounded-lg border-border/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                  !n.is_read ? "bg-primary/[0.04] shadow-sm" : "bg-card"
                }`}
              >
                {!n.is_read && (
                  <span className="absolute inset-y-0 end-0 w-1 bg-gradient-to-b from-primary to-primary/40" />
                )}
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${meta.color} ${meta.ring}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold leading-tight">{n.title}</h3>
                      {!n.is_read && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                          جديد
                        </span>
                      )}
                      {n.is_resolved && <Badge variant="secondary" className="h-5 rounded-full text-[10px]">تمت المعالجة</Badge>}
                      <Badge variant="outline" className="h-5 rounded-full text-[10px]">
                        {channelLabel[n.channel] || n.channel}
                      </Badge>
                      <Badge variant="outline" className="h-5 rounded-full border-dashed text-[10px] text-muted-foreground">
                        {meta.label}
                      </Badge>
                    </div>
                    {n.last_message && (
                      <p className="mt-2 line-clamp-2 rounded-lg border-e-2 border-border bg-muted/50 px-3 py-2 text-sm text-foreground/80">
                        {n.last_message}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {n.contact_name && (
                        <>
                          <span>{n.contact_name}</span>
                          <Separator orientation="vertical" className="h-3" />
                        </>
                      )}
                      <time title={new Date(n.created_at).toLocaleString("ar")}>{relativeTime(n.created_at)}</time>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                    {n.channel === "telegram" && !n.is_resolved && (
                      <Button
                        size="sm"
                        className="rounded-full"
                        onClick={() => {
                          setReplyTarget(n);
                          markRead(n.id);
                        }}
                      >
                        <MessageCircleReply className="me-1 h-4 w-4" />
                        رد
                      </Button>
                    )}
                    {!n.is_read && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full"
                        title="تعليم كمقروء"
                        onClick={() => markRead(n.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title="حذف"
                      onClick={() => remove(n.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!replyTarget} onOpenChange={(o) => !o && setReplyTarget(null)}>
        <DialogContent className="rounded-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">الرد عبر تلجرام</DialogTitle>
          </DialogHeader>
          {replyTarget && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                إلى: <span className="text-foreground">{replyTarget.contact_name || replyTarget.contact_identifier}</span>
              </div>
              {replyTarget.last_message && (
                <div className="rounded-xl border border-border/60 bg-muted/60 p-3 text-sm">
                  <p className="mb-1 text-xs text-muted-foreground">آخر رسالة من الزبون:</p>
                  {replyTarget.last_message}
                </div>
              )}
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="اكتب ردك هنا..."
                rows={4}
                className="rounded-xl"
              />
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setReplyTarget(null)} disabled={sending}>
              إلغاء
            </Button>
            <Button className="rounded-full" onClick={sendReply} disabled={sending || !replyText.trim()}>
              {sending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Send className="me-2 h-4 w-4" />}
              إرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}