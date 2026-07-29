import { useEffect, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, Shield, User, Search, Mail, Phone, Bot, MessageSquare, Users as UsersIcon, Clock, CheckCircle2, XCircle, LogIn } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role?: 'admin' | 'user';
  chatbots_count?: number;
  email?: string | null;
  phone?: string | null;
  provider?: string;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  signed_up_at?: string;
  banned_until?: string | null;
  active_chatbots?: number;
  onboarding_completed?: boolean;
  business_name?: string | null;
  business_category?: string | null;
  business_location?: string | null;
  chatbots?: Array<{ id: string; name: string; is_active: boolean; bot_mode: string }>;
  channels?: string[];
  messages_count?: number;
  customers_count?: number;
  last_activity_at?: string | null;
}

interface UsersListProps {
  onViewUser?: (userId: string) => void;
}

const fmt = (d?: string | null) =>
  d ? format(new Date(d), 'dd MMM yyyy • HH:mm', { locale: ar }) : '—';

const channelLabels: Record<string, string> = {
  telegram: 'تيليجرام',
  messenger: 'ماسنجر',
  instagram: 'إنستغرام',
  whatsapp: 'واتساب',
  facebook: 'فيسبوك',
  web: 'الويب',
};

export function UsersList({ onViewUser }: UsersListProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [impersonateTarget, setImpersonateTarget] = useState<UserProfile | null>(null);
  const [reason, setReason] = useState('');
  const [impersonating, setImpersonating] = useState(false);

  const startImpersonation = async () => {
    if (!impersonateTarget) return;
    setImpersonating(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-impersonate', {
        body: {
          target_user_id: impersonateTarget.user_id,
          reason: reason || null,
          redirect_to: `${window.location.origin}/dashboard`,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      window.open(data.action_link, '_blank', 'noopener');
      toast({
        title: 'تم إنشاء جلسة دخول',
        description: 'افتحها في نافذة خاصة (Incognito) حتى لا تُستبدل جلستك كأدمن. العملية مسجّلة في سجل العمليات.',
      });
      setImpersonateTarget(null);
      setReason('');
    } catch (e) {
      toast({
        title: 'تعذّر الدخول للحساب',
        description: e instanceof Error ? e.message : 'خطأ غير معروف',
        variant: 'destructive',
      });
    } finally {
      setImpersonating(false);
    }
  };

  useEffect(() => {
    async function fetchUsers() {
      try {
        // Rich data (emails, activity, channels) via secured admin endpoint
        const { data: rich, error: richError } = await supabase.functions.invoke('admin-users');
        if (!richError && rich?.users) {
          setUsers(rich.users as UserProfile[]);
          return;
        }

        // Fetch profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        // Fetch user roles
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (rolesError) throw rolesError;

        // Fetch chatbots count per user
        const { data: chatbots, error: chatbotsError } = await supabase
          .from('chatbots')
          .select('user_id');

        if (chatbotsError) throw chatbotsError;

        // Map roles to users
        const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
        
        // Count chatbots per user
        const chatbotsCount = new Map<string, number>();
        chatbots?.forEach(c => {
          chatbotsCount.set(c.user_id, (chatbotsCount.get(c.user_id) || 0) + 1);
        });

        const enrichedUsers = (profiles || []).map(profile => ({
          ...profile,
          role: rolesMap.get(profile.user_id) as 'admin' | 'user' | undefined,
          chatbots_count: chatbotsCount.get(profile.user_id) || 0,
        }));

        setUsers(enrichedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.full_name, u.email, u.phone, u.business_name].some((v) =>
        v?.toLowerCase().includes(q)
      )
    );
  }, [users, query]);

  const getInitials = (name: string | null) => {
    if (!name) return 'م';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>المستخدمون</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-4">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          المستخدمون ({users.length})
        </CardTitle>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث بالاسم أو البريد أو النشاط التجاري..."
            className="pr-9 text-right"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            لا يوجد مستخدمون بعد
          </p>
        ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المستخدم</TableHead>
                <TableHead className="text-right">البريد الإلكتروني</TableHead>
                <TableHead className="text-right">النشاط التجاري</TableHead>
                <TableHead className="text-right">الصلاحية</TableHead>
                <TableHead className="text-right">الشات بوتات</TableHead>
                <TableHead className="text-right">القنوات</TableHead>
                <TableHead className="text-right">الرسائل</TableHead>
                <TableHead className="text-right">العملاء</TableHead>
                <TableHead className="text-right">آخر دخول</TableHead>
                <TableHead className="text-right">تاريخ التسجيل</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{user.full_name || 'مستخدم'}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.provider === 'google' ? 'Google' : 'بريد إلكتروني'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground" dir="ltr">
                    <div className="flex items-center justify-end gap-1">
                      {user.email_confirmed_at ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span className="text-xs">{user.email || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{user.business_name || '—'}</div>
                    <div className="text-xs text-muted-foreground">
                      {user.business_category || ''}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
                        <Shield className="h-3 w-3 me-1" />
                        أدمن
                      </Badge>
                    ) : (
                      <Badge variant="secondary">مستخدم</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {user.active_chatbots ?? 0}/{user.chatbots_count ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(user.channels || []).length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        (user.channels || []).map((c) => (
                          <Badge key={c} variant="outline" className="text-[10px]">
                            {channelLabels[c] || c}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{user.messages_count ?? 0}</TableCell>
                  <TableCell>{user.customers_count ?? 0}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {fmt(user.last_sign_in_at)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(user.signed_up_at || user.created_at), 'dd MMM yyyy', { locale: ar })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelected(user);
                        onViewUser?.(user.user_id);
                      }}
                    >
                      <Eye className="h-4 w-4 me-1" />
                      عرض
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </CardContent>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto" dir="rtl">
          <SheetHeader className="text-right">
            <SheetTitle>تفاصيل المستخدم</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-6 space-y-6 text-right">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selected.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(selected.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{selected.full_name || 'مستخدم'}</div>
                  <div className="text-xs text-muted-foreground" dir="ltr">{selected.email}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: MessageSquare, label: 'الرسائل', value: selected.messages_count ?? 0 },
                  { icon: UsersIcon, label: 'العملاء', value: selected.customers_count ?? 0 },
                  { icon: Bot, label: 'الشات بوتات', value: selected.chatbots_count ?? 0 },
                  { icon: Shield, label: 'الصلاحية', value: selected.role === 'admin' ? 'أدمن' : 'مستخدم' },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <s.icon className="h-3.5 w-3.5" />
                      {s.label}
                    </div>
                    <div className="mt-1 text-lg font-semibold">{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm">
                <Row icon={Mail} label="البريد" value={selected.email || '—'} />
                <Row icon={Phone} label="الهاتف" value={selected.phone || '—'} />
                <Row icon={CheckCircle2} label="تأكيد البريد" value={selected.email_confirmed_at ? 'مُفعّل' : 'غير مُفعّل'} />
                <Row icon={Clock} label="آخر دخول" value={fmt(selected.last_sign_in_at)} />
                <Row icon={Clock} label="آخر نشاط" value={fmt(selected.last_activity_at)} />
                <Row icon={Clock} label="تاريخ التسجيل" value={fmt(selected.signed_up_at || selected.created_at)} />
                <Row icon={CheckCircle2} label="أكمل الإعداد" value={selected.onboarding_completed ? 'نعم' : 'لا'} />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">النشاط التجاري</div>
                <div className="rounded-lg border border-border p-3 text-sm space-y-1">
                  <div>{selected.business_name || '—'}</div>
                  <div className="text-xs text-muted-foreground">
                    {[selected.business_category, selected.business_location].filter(Boolean).join(' • ') || '—'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">الشات بوتات</div>
                {(selected.chatbots || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">لا يوجد</p>
                ) : (
                  (selected.chatbots || []).map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                      <span>{b.name}</span>
                      <Badge variant={b.is_active ? 'default' : 'secondary'}>
                        {b.is_active ? 'نشط' : 'متوقف'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">القنوات المربوطة</div>
                <div className="flex flex-wrap gap-1">
                  {(selected.channels || []).length === 0 ? (
                    <span className="text-xs text-muted-foreground">لا يوجد</span>
                  ) : (
                    (selected.channels || []).map((c) => (
                      <Badge key={c} variant="outline">{channelLabels[c] || c}</Badge>
                    ))
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setImpersonateTarget(selected)}
              >
                <LogIn className="h-4 w-4 me-2" />
                الدخول لحساب المستخدم (للدعم)
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!impersonateTarget} onOpenChange={(o) => !o && setImpersonateTarget(null)}>
        <AlertDialogContent dir="rtl" className="text-right">
          <AlertDialogHeader>
            <AlertDialogTitle>الدخول لحساب {impersonateTarget?.full_name || impersonateTarget?.email}</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إنشاء رابط دخول مؤقت لمرة واحدة بدون إرسال أي إشعار للمستخدم. العملية تُسجَّل في سجل عمليات الأدمن.
              يُفضّل فتح الرابط في نافذة تصفح خاصة حتى لا تفقد جلستك كأدمن.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="سبب الدخول (اختياري — يظهر في السجل)"
            className="text-right"
          />
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel disabled={impersonating}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                startImpersonation();
              }}
              disabled={impersonating}
            >
              {impersonating && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              متابعة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-left" dir="auto">{value}</span>
    </div>
  );
}
