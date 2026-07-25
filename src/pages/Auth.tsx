import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Sparkles, MessageSquare, Bot, Globe, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { lovable } from '@/integrations/lovable';
import { supabase } from '@/integrations/supabase/client';

// Managed OAuth is served by Lovable hosting, so deployments on other hosts
// (Vercel, custom domains) run the OAuth round-trip on this origin and get the
// session handed back in the URL hash.
const BRIDGE_ORIGIN = 'https://jawabi-ai.lovable.app';
const isLovableHost = (hostname: string) => /(^|\.)lovable\.(app|dev)$/.test(hostname);

export default function AuthPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawNext = searchParams.get('next') || '';
  const nextPath =
    rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/onboarding';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');

  useEffect(() => {
    const oauthSuccess = sessionStorage.getItem('oauth_success');
    if (oauthSuccess) {
      sessionStorage.removeItem('oauth_success');
      toast.success('تم تسجيل الدخول بنجاح', {
        description: 'مرحباً بك في جوابي',
      });
    }
  }, []);

  // Install a session handed back by the login bridge (tokens arrive in the
  // hash, which never reaches a server), then scrub it from the URL.
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) return;

    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setOauthLoading('google');
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      setOauthLoading(null);
      if (error) {
        toast.error('فشل تسجيل الدخول', { description: error.message });
        return;
      }
      toast.success('تم تسجيل الدخول بنجاح', { description: 'مرحباً بك في جوابي' });
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={nextPath} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await signIn(loginEmail, loginPassword);

      if (error) {
        toast.error('فشل تسجيل الدخول', {
          description: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        });
      } else {
        toast.success('تم تسجيل الدخول بنجاح', {
          description: 'مرحباً بك في جوابي',
        });
      }
    } catch (err: any) {
      toast.error('فشل تسجيل الدخول', {
        description: err?.message || 'حدث خطأ غير متوقع',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await signUp(signupEmail, signupPassword, signupName);

      if (error) {
        toast.error('فشل إنشاء الحساب', {
          description: error.message,
        });
      } else {
        toast.success('تم إنشاء الحساب بنجاح', {
          description: 'يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب',
        });
      }
    } catch (err: any) {
      toast.error('فشل إنشاء الحساب', {
        description: err?.message || 'حدث خطأ غير متوقع',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider: 'google') => {
    setOauthLoading(provider);
    return handleOAuthInner(provider);
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = forgotEmail.trim();
    if (!email) return;
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSendingReset(false);
    if (error) {
      toast.error('تعذّر إرسال الرابط', { description: error.message });
      return;
    }
    toast.success('تم إرسال رابط إعادة التعيين', {
      description: 'تفقّد بريدك الإلكتروني واتبع الرابط لتعيين كلمة مرور جديدة.',
    });
    setForgotOpen(false);
    setForgotEmail('');
  };

  const handleOAuthInner = async (provider: 'google') => {
    setOauthLoading(provider);
    try {
      sessionStorage.setItem('oauth_pending', provider);
      const redirectTo =
        window.location.origin +
        '/auth' +
        (rawNext ? `?next=${encodeURIComponent(nextPath)}` : '');

      // Outside Lovable hosting (e.g. Vercel) the managed OAuth routes
      // (/~oauth/*) do not exist, so we run the flow on the Lovable origin and
      // come back here with the session.
      if (!isLovableHost(window.location.hostname)) {
        const bridge = new URL('/auth/bridge', BRIDGE_ORIGIN);
        bridge.searchParams.set('provider', provider);
        bridge.searchParams.set('return', redirectTo);
        window.location.href = bridge.toString();
        return;
      }

      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: redirectTo,
      });
      if (result.error) {
        toast.error('فشل تسجيل الدخول', { description: result.error.message });
        sessionStorage.removeItem('oauth_pending');
        setOauthLoading(null);
        return;
      }
      if (result.redirected) {
        sessionStorage.setItem('oauth_success', 'true');
        return;
      }
      // If we got here without redirect, tokens were received
      sessionStorage.removeItem('oauth_pending');
      toast.success('تم تسجيل الدخول بنجاح', {
        description: 'مرحباً بك في جوابي',
      });
    } catch (err: any) {
      toast.error('فشل تسجيل الدخول', { description: err?.message || 'حدث خطأ غير متوقع' });
      sessionStorage.removeItem('oauth_pending');
      setOauthLoading(null);
    }
  };

  return (
    <div dir="rtl" className="grid min-h-screen lg:grid-cols-2">
      {/* Brand side */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-12 text-primary-foreground lg:flex"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div
          aria-hidden
          className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-20 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl"
        />

        <Link to="/" className="relative z-10 inline-flex items-center gap-2 text-lg font-semibold">
          <ArrowLeft className="h-4 w-4" />
          العودة للرئيسية
        </Link>

        <div className="relative z-10 max-w-md">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            منصة جوابي
          </div>
          <h2 className="text-4xl font-bold leading-tight">
            بوت ذكي يخدم عملاءك<br />على مدار الساعة
          </h2>
          <p className="mt-4 text-base opacity-90">
            انضم لمئات الأعمال التي تستخدم جوابي لأتمتة خدمة العملاء وزيادة المبيعات.
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            {[
              { icon: Bot, text: "بوت يتحدث العربية وجميع اللهجات" },
              { icon: MessageSquare, text: "ربط مع واتساب، تيليجرام، فيسبوك وانستجرام" },
              { icon: Globe, text: "قاعدة معرفة قابلة للتدريب من أي مصدر" },
              { icon: CheckCircle2, text: "إعداد فوري بدون أي خبرة تقنية" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="opacity-95">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-xs opacity-80">
          © {new Date().getFullYear()} جوابي — جميع الحقوق محفوظة
        </div>
      </div>

      {/* Form side */}
      <div className="relative flex items-center justify-center bg-background p-6 sm:p-10">
        <Link
          to="/"
          className="absolute top-6 right-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          الرئيسية
        </Link>

          <div className="w-full max-w-md text-right">
          <div className="mb-8 text-center lg:text-right">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md lg:hidden">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">مرحباً بك 👋</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              سجّل دخولك أو أنشئ حساباً جديداً وابدأ تجربتك المجانية.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {/* Social auth buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base font-medium border-border hover:bg-[#f8f9ff] hover:border-[#4285F4]/30 transition-colors"
              disabled={!!oauthLoading}
              onClick={() => handleOAuth('google')}
            >
              {oauthLoading === 'google' ? (
                <Loader2 className="me-2 h-5 w-5 animate-spin" />
              ) : (
                <svg className="me-2 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span className="ms-1">تسجيل الدخول بـ Google</span>
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">أو</span>
            </div>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">إنشاء حساب</TabsTrigger>
              <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="block text-right">البريد الإلكتروني</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                    dir="ltr"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="block text-right">كلمة المرور</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    dir="ltr"
                    className="text-right"
                  />
                </div>
                <Button type="submit" className="w-full h-11 text-base" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  ) : null}
                  تسجيل الدخول
                </Button>
              </form>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="block text-right">الاسم الكامل</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="محمد أحمد"
                    required
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="block text-right">البريد الإلكتروني</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                    dir="ltr"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="block text-right">كلمة المرور</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    dir="ltr"
                    className="text-right"
                  />
                  <p className="text-xs text-muted-foreground">
                    يجب أن تكون 6 أحرف على الأقل
                  </p>
                </div>
                <Button type="submit" className="w-full h-11 text-base" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  ) : null}
                  إنشاء حساب
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
        </div>
      </div>
    </div>
  );
}

