import { useEffect, useMemo, useState } from 'react';
import { Search, Users as UsersIcon, Trash2, Save, MoreHorizontal, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { TableSkeleton } from '@/components/layout/PageSkeletons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import { ChannelIcon } from '@/components/ChannelIcon';

type Tag = 'new' | 'prospect' | 'regular' | 'vip' | 'blocked';

interface Customer {
  id: string;
  chatbot_id: string;
  channel: string;
  external_id: string;
  name: string | null;
  username: string | null;
  phone: string | null;
  message_count: number;
  last_message: string | null;
  tag: Tag;
  notes: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

const tagLabels: Record<Tag, string> = {
  new: 'جديد',
  prospect: 'محتمل',
  regular: 'منتظم',
  vip: 'VIP',
  blocked: 'محظور',
};

const tagColors: Record<Tag, string> = {
  new: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  prospect: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  regular: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  vip: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  blocked: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const channelLabels: Record<string, string> = {
  web: 'الموقع',
  telegram: 'تيليجرام',
  whatsapp: 'واتساب',
  facebook: 'فيسبوك',
  instagram: 'انستغرام',
};

export default function CustomersPage() {
  const { chatbot, loading: chatbotLoading } = useChatbot();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [editing, setEditing] = useState<Customer | null>(null);

  const load = async () => {
    if (!chatbot) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('chatbot_id', chatbot.id)
      .order('last_seen_at', { ascending: false });
    if (error) toast.error('فشل تحميل العملاء');
    else setCustomers((data || []) as Customer[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [chatbot?.id]);

  const filtered = useMemo(() => {
    let list = [...customers];
    if (tagFilter !== 'all') list = list.filter((c) => c.tag === tagFilter);
    if (channelFilter !== 'all') list = list.filter((c) => c.channel === channelFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.username?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.external_id?.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case 'recent':
        list.sort((a, b) => b.last_seen_at.localeCompare(a.last_seen_at));
        break;
      case 'oldest':
        list.sort((a, b) => a.first_seen_at.localeCompare(b.first_seen_at));
        break;
      case 'messages':
        list.sort((a, b) => b.message_count - a.message_count);
        break;
      case 'name':
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
    }
    return list;
  }, [customers, search, tagFilter, channelFilter, sortBy]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: customers.length };
    (['new', 'prospect', 'regular', 'vip', 'blocked'] as Tag[]).forEach((t) => {
      c[t] = customers.filter((x) => x.tag === t).length;
    });
    return c;
  }, [customers]);

  const updateTag = async (id: string, tag: Tag) => {
    const { error } = await supabase.from('customers').update({ tag }).eq('id', id);
    if (error) return toast.error('فشل التحديث');
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, tag } : c)));
    toast.success('تم تحديث التصنيف');
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from('customers')
      .update({ name: editing.name, phone: editing.phone, notes: editing.notes, tag: editing.tag })
      .eq('id', editing.id);
    if (error) return toast.error('فشل الحفظ');
    toast.success('تم الحفظ');
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('حذف هذا العميل؟')) return;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) return toast.error('فشل الحذف');
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    toast.success('تم الحذف');
  };

  if (chatbotLoading || loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="العملاء" description="كل من تواصل مع البوت يُسجَّل هنا تلقائياً بدون تكرار" />
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="العملاء" description="كل من تواصل مع البوت يُسجَّل هنا تلقائياً بدون تكرار" />

      {/* Tag pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setTagFilter('all')}
          className={`rounded-md border px-2.5 py-1 text-[13px] font-medium transition-colors ${
            tagFilter === 'all'
              ? 'border-transparent bg-foreground text-background'
              : 'border-border/70 bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          الكل ({counts.all})
        </button>
        {(['new', 'prospect', 'regular', 'vip', 'blocked'] as Tag[]).map((t) => (
          <button
            key={t}
            onClick={() => setTagFilter(t)}
            className={`rounded-md border px-2.5 py-1 text-[13px] font-medium transition-colors ${
              tagFilter === t
                ? 'border-transparent bg-foreground text-background'
                : 'border-border/70 bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {tagLabels[t]} ({counts[t]})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو اسم المستخدم أو الرقم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="القناة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل القنوات</SelectItem>
            {Object.entries(channelLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">الأحدث تواصلاً</SelectItem>
            <SelectItem value="oldest">الأقدم تواصلاً</SelectItem>
            <SelectItem value="messages">الأكثر رسائل</SelectItem>
            <SelectItem value="name">الاسم (أبجدي)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data table */}
      {filtered.length === 0 ? (
        <div className="surface-panel empty-state">
          <div className="empty-state-icon">
            <UsersIcon className="h-5 w-5" />
          </div>
          <p className="mt-2 font-semibold text-foreground">لا يوجد عملاء بعد</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            سيظهر هنا كل شخص يتواصل مع البوت تلقائياً، بدون تكرار.
          </p>
        </div>
      ) : (
        <div className="surface-panel overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>الاسم</TableHead>
                  <TableHead className="hidden sm:table-cell">القناة</TableHead>
                  <TableHead>التصنيف</TableHead>
                  <TableHead className="hidden md:table-cell">الرسائل</TableHead>
                  <TableHead className="hidden lg:table-cell">آخر تواصل</TableHead>
                  <TableHead className="w-12 text-end">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {c.name || c.username || c.phone || c.external_id}
                        </p>
                        {(c.username || c.phone) && (
                          <p className="truncate text-xs text-muted-foreground" dir="ltr">
                            {c.username ? `@${c.username}` : c.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <ChannelIcon channel={c.channel} size={16} />
                        {channelLabels[c.channel] || c.channel}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={tagColors[c.tag]}>
                        {tagLabels[c.tag]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-sm tabular-nums text-muted-foreground md:table-cell">
                      {c.message_count}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                      {new Date(c.last_seen_at).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-44">
                          <DropdownMenuItem onClick={() => setEditing(c)}>
                            <Pencil className="me-2 h-4 w-4" />
                            تفاصيل وتعديل
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {(['new', 'prospect', 'regular', 'vip', 'blocked'] as Tag[])
                            .filter((t) => t !== c.tag)
                            .map((t) => (
                              <DropdownMenuItem key={t} onClick={() => updateTag(c.id, t)}>
                                تصنيف: {tagLabels[t]}
                              </DropdownMenuItem>
                            ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => remove(c.id)}>
                            <Trash2 className="me-2 h-4 w-4" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>تفاصيل العميل</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">الاسم</label>
                <Input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">الرقم</label>
                <Input value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} dir="ltr" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">التصنيف</label>
                <Select value={editing.tag} onValueChange={(v) => setEditing({ ...editing, tag: v as Tag })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['new', 'prospect', 'regular', 'vip', 'blocked'] as Tag[]).map((t) => (
                      <SelectItem key={t} value={t}>{tagLabels[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">ملاحظات</label>
                <Textarea
                  value={editing.notes || ''}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                <div>القناة: {channelLabels[editing.channel] || editing.channel}</div>
                <div>المعرّف: <span dir="ltr">{editing.external_id}</span></div>
                <div>عدد الرسائل: {editing.message_count}</div>
                <div>أول تواصل: {new Date(editing.first_seen_at).toLocaleString('ar-SA')}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>إلغاء</Button>
            <Button onClick={saveEdit}><Save className="ml-2 h-4 w-4" />حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}