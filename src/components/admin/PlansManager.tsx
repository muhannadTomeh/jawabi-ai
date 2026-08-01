import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Star, Trash2, Pencil } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  messages_per_day: number;
  messages_per_minute_per_chatbot: number;
  max_channels: number;
  max_knowledge_items: number | null;
  allowed_model: string | null;
  is_default: boolean;
}

const emptyPlan = {
  name: '',
  slug: '',
  price_monthly: 0,
  messages_per_day: 300,
  messages_per_minute_per_chatbot: 60,
  max_channels: 4,
  max_knowledge_items: null as number | null,
  allowed_model: null as string | null,
  is_default: false,
};

export function PlansManager() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<typeof emptyPlan>(emptyPlan);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price_monthly', { ascending: true });
      if (error) throw error;
      return data as Plan[];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-plans'] });

  const openNew = () => {
    setEditing(null);
    setForm(emptyPlan);
    setOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setForm({ ...emptyPlan, ...plan });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: 'الاسم والمعرّف مطلوبان', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      price_monthly: Number(form.price_monthly) || 0,
      messages_per_day: Number(form.messages_per_day) || 300,
      messages_per_minute_per_chatbot: Number(form.messages_per_minute_per_chatbot) || 60,
      max_channels: Number(form.max_channels) || 4,
      max_knowledge_items:
        form.max_knowledge_items === null || String(form.max_knowledge_items) === ''
          ? null
          : Number(form.max_knowledge_items),
      allowed_model: form.allowed_model?.trim() ? form.allowed_model.trim() : null,
    };
    const { error } = editing
      ? await supabase.from('plans').update(payload).eq('id', editing.id)
      : await supabase.from('plans').insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: 'تعذّر الحفظ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editing ? 'تم تحديث الباقة' : 'تمت إضافة الباقة' });
    setOpen(false);
    refresh();
  };

  const makeDefault = async (plan: Plan) => {
    const { error: clearErr } = await supabase
      .from('plans')
      .update({ is_default: false })
      .eq('is_default', true);
    if (clearErr) {
      toast({ title: 'تعذّر التغيير', description: clearErr.message, variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('plans').update({ is_default: true }).eq('id', plan.id);
    if (error) {
      toast({ title: 'تعذّر التغيير', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: `«${plan.name}» صارت الباقة الافتراضية` });
    refresh();
  };

  const remove = async (plan: Plan) => {
    if (plan.is_default) {
      toast({ title: 'لا يمكن حذف الباقة الافتراضية', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('plans').delete().eq('id', plan.id);
    if (error) {
      toast({ title: 'تعذّر الحذف', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم حذف الباقة' });
    refresh();
  };

  return (
    <div dir="rtl" className="space-y-4 text-right">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">الباقات</h3>
          <p className="text-xs text-muted-foreground">
            تتحكم هذه القيم مباشرة بحدود الاستخدام المطبّقة على البوتات.
          </p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          باقة جديدة
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الباقة</TableHead>
              <TableHead>السعر/شهر</TableHead>
              <TableHead>رسائل/يوم</TableHead>
              <TableHead>رسائل/دقيقة</TableHead>
              <TableHead>القنوات</TableHead>
              <TableHead>عناصر المعرفة</TableHead>
              <TableHead>الموديل</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              [0, 1].map((i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {plans?.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {plan.name}
                    {plan.is_default && <Badge variant="secondary">افتراضية</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">{plan.slug}</span>
                </TableCell>
                <TableCell className="tabular-nums">{Number(plan.price_monthly)} ₪</TableCell>
                <TableCell className="tabular-nums">{plan.messages_per_day}</TableCell>
                <TableCell className="tabular-nums">{plan.messages_per_minute_per_chatbot}</TableCell>
                <TableCell className="tabular-nums">{plan.max_channels}</TableCell>
                <TableCell className="tabular-nums">{plan.max_knowledge_items ?? 'بلا حدود'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {plan.allowed_model ?? 'الافتراضي'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(plan)} aria-label="تعديل">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!plan.is_default && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => makeDefault(plan)}
                          aria-label="اجعلها افتراضية"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(plan)}
                          aria-label="حذف"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="text-right sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل الباقة' : 'باقة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>الاسم</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>المعرّف (slug)</Label>
              <Input
                value={form.slug}
                dir="ltr"
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>السعر الشهري (₪)</Label>
              <Input
                type="number"
                value={form.price_monthly}
                onChange={(e) => setForm({ ...form, price_monthly: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>رسائل/يوم</Label>
              <Input
                type="number"
                value={form.messages_per_day}
                onChange={(e) => setForm({ ...form, messages_per_day: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>رسائل/دقيقة لكل بوت</Label>
              <Input
                type="number"
                value={form.messages_per_minute_per_chatbot}
                onChange={(e) =>
                  setForm({ ...form, messages_per_minute_per_chatbot: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>أقصى عدد قنوات</Label>
              <Input
                type="number"
                value={form.max_channels}
                onChange={(e) => setForm({ ...form, max_channels: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>أقصى عناصر معرفة (فارغ = بلا حدود)</Label>
              <Input
                type="number"
                value={form.max_knowledge_items ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    max_knowledge_items: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>الموديل المسموح (اختياري)</Label>
              <Input
                dir="ltr"
                placeholder="google/gemini-2.5-flash"
                value={form.allowed_model ?? ''}
                onChange={(e) => setForm({ ...form, allowed_model: e.target.value || null })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'جارٍ الحفظ…' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}