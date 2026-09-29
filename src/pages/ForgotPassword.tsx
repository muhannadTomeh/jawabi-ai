import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setSubmitting(false);
    if (error) {
      setErrorMessage('تعذر إرسال الرسالة حالياً. حاول مرة أخرى بعد قليل.');
      return;
    }

    // Supabase intentionally returns the same result whether the account exists
    // or not, which prevents attackers from discovering registered addresses.
    setSubmitted(true);
  };

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <section className="w-full max-w-md rounded-2xl border bg-card p-6 text-right shadow-sm sm:p-8">
        <Link to="/" className="mb-8 inline-flex items-center gap-2">
          <img src="/assets/logo.png" alt="شعار جوابي" className="h-10 w-10" />
          <span className="text-xl font-bold">جوابي</span>
        </Link>

        {submitted ? (
          <div className="space-y-5 text-center" role="status">
            <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold">تحقق من بريدك الإلكتروني</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                إذا كان هناك حساب مرتبط بهذا البريد، فستصلك رسالة تحتوي على رابط آمن لتعيين كلمة مرور جديدة.
              </p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth">العودة إلى تسجيل الدخول</Link>
            </Button>
          </div>
        ) : (
          <>
            <Mail className="mb-4 h-10 w-10 text-primary" />
            <h1 className="text-2xl font-bold">استعادة كلمة المرور</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              أدخل بريدك الإلكتروني وسنرسل لك رابطاً لتعيين كلمة مرور جديدة.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recovery-email">البريد الإلكتروني</Label>
                <Input
                  id="recovery-email"
                  type="email"
                  autoComplete="email"
                  dir="ltr"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoFocus
                />
              </div>

              {errorMessage && (
                <p className="text-sm text-destructive" role="alert">{errorMessage}</p>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                إرسال رابط الاستعادة
              </Button>
            </form>

            <Link
              to="/auth"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ArrowRight className="h-4 w-4" />
              العودة إلى تسجيل الدخول
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
