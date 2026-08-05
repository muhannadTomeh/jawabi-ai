import { useState, useEffect } from 'react';
import { 
  Loader2, Save, Cpu, KeyRound, RefreshCw, CheckCircle2, AlertCircle, 
  Search, ShieldCheck, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Provider {
  id: string;
  provider_key: string;
  display_name: string;
  api_key: string | null;
  is_active: boolean;
  last_validated_at: string | null;
  last_models_sync_at: string | null;
}

interface Model {
  id: string;
  model_id: string;
  display_name: string;
}

export function ApiIntegrations() {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Record<string, Model[]>>({});
  const [syncing, setSyncing] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data: pData } = await supabase
        .from('api_providers')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (pData) {
        setProviders(pData);
        const { data: mData } = await supabase
          .from('api_provider_models')
          .select('*');
        
        const mGroup: Record<string, Model[]> = {};
        mData?.forEach(m => {
          if (!mGroup[m.provider_id]) mGroup[m.provider_id] = [];
          mGroup[m.provider_id].push(m);
        });
        setModels(mGroup);
      }
    } catch (e) {
      console.error(e);
      toast.error('تعذر تحميل إعدادات المزوّدين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSync = async (provider: Provider) => {
    setSyncing(provider.id);
    try {
      const { data, error } = await supabase.functions.invoke('sync-provider-models', {
        body: { provider_key: provider.provider_key },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success(`تمت مزامنة ${data.count} موديل بنجاح`);
      await fetchAll();
    } catch (e: any) {
      toast.error('فشل المزامنة', { description: e.message });
    } finally {
      setSyncing(null);
    }
  };

  const handleUpdateKey = async (provider: Provider, key: string) => {
    setSaving(provider.id);
    try {
      const { error } = await supabase
        .from('api_providers')
        .update({ api_key: key.trim() || null })
        .eq('id', provider.id);
      if (error) throw error;
      toast.success('تم حفظ المفتاح');
      setProviders(prev => prev.map(p => p.id === provider.id ? { ...p, api_key: key } : p));
    } catch (e: any) {
      toast.error('فشل الحفظ', { description: e.message });
    } finally {
      setSaving(null);
    }
  };

  const handleToggleActive = async (provider: Provider) => {
    try {
      // Deactivate all first
      await supabase.from('api_providers').update({ is_active: false }).neq('id', provider.id);
      // Activate this one
      const { error } = await supabase
        .from('api_providers')
        .update({ is_active: true })
        .eq('id', provider.id);
      
      if (error) throw error;
      toast.success(`تم تفعيل ${provider.display_name}`);
      await fetchAll();
    } catch (e: any) {
      toast.error('تعذر تفعيل المزوّد', { description: e.message });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6 text-right">
      <div className="flex items-center gap-2">
        <Cpu className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">تكاملات الـ API والموديلات</h3>
      </div>
      
      <Tabs defaultValue={providers[0]?.id} className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50">
          {providers.map(p => (
            <TabsTrigger key={p.id} value={p.id} className="gap-2 py-2">
              {p.display_name}
              {p.is_active && <div className="h-1.5 w-1.5 rounded-full bg-success" />}
            </TabsTrigger>
          ))}
        </TabsList>

        {providers.map(p => (
          <TabsContent key={p.id} value={p.id} className="space-y-6 mt-0">
            <div className="card-elevated p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{p.display_name}</h4>
                  <p className="text-xs text-muted-foreground">إعدادات الاتصال وجلب الموديلات المتاحة</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`active-${p.id}`} className="text-xs">تفعيل المزوّد</Label>
                  <Switch 
                    id={`active-${p.id}`}
                    checked={p.is_active}
                    onCheckedChange={() => handleToggleActive(p)}
                  />
                </div>
              </div>

              {p.provider_key !== 'lovable_gateway' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs">
                    <KeyRound className="h-3 w-3" />
                    مفتاح الـ API
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      type="password" 
                      defaultValue={p.api_key || ''} 
                      placeholder="sk-..."
                      className="font-mono text-xs h-9"
                      dir="ltr"
                      onBlur={(e) => handleUpdateKey(p, e.target.value)}
                    />
                    <Button size="sm" variant="secondary" onClick={() => handleSync(p)} disabled={syncing === p.id}>
                      {syncing === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      <span className="ms-2">مزامنة</span>
                    </Button>
                  </div>
                </div>
              )}

              {p.provider_key === 'lovable_gateway' && (
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Lovable AI Gateway</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        هذا هو المزوّد الافتراضي المدمج. يستخدم مفاتيح المنصة ولا يتطلب إعداداً يدوياً.
                        يدعم مجموعة واسعة من الموديلات الرائدة تلقائياً.
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => handleSync(p)} disabled={syncing === p.id}>
                     {syncing === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                     <span className="ms-2 text-xs">تحديث قائمة الموديلات</span>
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">الموديلات المتاحة</Label>
                  {p.last_models_sync_at && (
                    <span className="text-[10px] text-muted-foreground">
                      آخر مزامنة: {format(new Date(p.last_models_sync_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                    </span>
                  )}
                </div>
                
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(models[p.id] || []).length > 0 ? (
                    models[p.id].map(m => (
                      <div key={m.id} className="flex items-center gap-2 p-2 rounded-md border border-border/50 bg-muted/20 text-xs">
                        <CheckCircle2 className="h-3 w-3 text-success" />
                        <span className="truncate" title={m.model_id}>{m.display_name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-6 text-center border border-dashed rounded-md">
                      <p className="text-xs text-muted-foreground">لا يوجد موديلات متاحة. يرجى المزامنة أولاً.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
