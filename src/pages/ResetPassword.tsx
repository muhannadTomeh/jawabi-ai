import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PASSWORD_MIN_LENGTH, validateNewPassword } from '@/lib/passwordPolicy';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { user, loading, isPasswordRecovery, completePasswordRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isPasswordRecovery)) {
      setErrorMessage('رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطاً جديداً.');
    }
  }, [isPasswordRecovery, loading, user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!user || !isPasswordRecovery) {
      setErrorMessage('رابط الاستعادة غير صالح أو انتهت صلاحيته.');
      return;
    }

    const policyError = validateNewPassword(password);
    if (policyError) {
      setErrorMessage(policyError);
      return;
    }
    if (password !== confirmation) {
      setErrorMessage('كلمتا المرور غير متطابقتين');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setErrorMessage('تعذر تحديث كلمة المرور. اطلب رابط استعادة جديداً وحاول مرة أخرى.');
      return;
    }

    completePasswordRecovery();
    toast.success('تم تحديث كلمة المرور بنجاح');
    navigate('/dashboard/account', { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const invalidRecovery = !user || !isPasswordRecovery;

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <section className="w-full max-w-md rounded-2xl border bg-card p-6 text-right shadow-sm sm:p-8">
        <Link to="/" className="mb-8 inline-flex items-center gap-2">
          <img src="/assets/logo.png" alt="شعار جوابي" className="h-10 w-10" />
          <span className="text-xl font-bold">جوابي</span>
        </Link>

        {invalidRecovery ? (
          <div className="space-y-5 text-center">
            <LockKeyhole className="mx-auto h-14 w-14 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-bold">تعذر فتح رابط الاستعادة</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                قد يكون الرابط منتهياً أو مستخدماً مسبقاً. اطلب رسالة استعادة جديدة.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link to="/forgot-password">طلب رابط جديد</Link>
            </Button>
          </div>
        ) : (
          <>
            <CheckCircle2 className="mb-4 h-10 w-10 text-primary" />
            <h1 className="text-2xl font-bold">تعيين كلمة مرور جديدة</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              استخدم {PASSWORD_MIN_LENGTH} أحرف على الأقل، مع حرف ورقم واحد على الأقل.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    dir="ltr"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={PASSWORD_MIN_LENGTH}
                    required
                    autoFocus
                    className="pl-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  dir="ltr"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  minLength={PASSWORD_MIN_LENGTH}
                  required
                />
              </div>

              {errorMessage && (
                <p className="text-sm text-destructive" role="alert">{errorMessage}</p>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حفظ كلمة المرور
              </Button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
