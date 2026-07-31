import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // The recovery link lands here with the session in the URL hash (or is
    // already exchanged by the Supabase client). Wait for it before allowing
    // the password update.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (password !== confirm) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error('تعذّر تحديث كلمة المرور', { description: error.message });
      return;
    }
    toast.success('تم تحديث كلمة المرور بنجاح');
    navigate('/dashboard', { replace: true });
  };

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 text-right">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">تعيين كلمة مرور جديدة</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ready
              ? 'أدخل كلمة المرور الجديدة لحسابك.'
              : 'جارٍ التحقق من رابط إعادة التعيين...'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password" className="block text-right">كلمة المرور الجديدة</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
                className="pe-10 text-left"
                autoComplete="new-password"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute inset-y-0 end-2 flex items-center text-muted-foreground hover:text-foreground"
                aria-label={show ? 'إخفاء' : 'إظهار'}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="block text-right">تأكيد كلمة المرور</Label>
            <Input
              id="confirm-password"
              type={show ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              dir="ltr"
              className="text-left"
              autoComplete="new-password"
              required
            />
          </div>

          <Button type="submit" className="h-11 w-full text-base" disabled={saving || !ready}>
            {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
            حفظ كلمة المرور
          </Button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/auth')}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          العودة لصفحة الدخول
        </button>
      </div>
    </div>
  );
}
