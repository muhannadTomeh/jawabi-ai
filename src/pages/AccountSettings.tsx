import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Lock,
  Shield,
  Palette,
  Bell,
  LogOut,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Camera,
  Trash2,
  Monitor,
  Sun,
  Moon,
  Globe,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/layout/PageSkeletons';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';

// ---------- helpers ----------

function scorePassword(pw: string) {
  let score = 0;
  if (!pw) return 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(score, 5);
}

function passwordStrengthLabel(score: number) {
  if (score <= 1) return { label: 'ضعيفة جدًا', color: 'bg-destructive' };
  if (score === 2) return { label: 'ضعيفة', color: 'bg-destructive' };
  if (score === 3) return { label: 'متوسطة', color: 'bg-warning' };
  if (score === 4) return { label: 'جيدة', color: 'bg-info' };
  return { label: 'قوية جدًا', color: 'bg-success' };
}

function formatDate(dt?: string | null) {
  if (!dt) return '—';
  try {
    return new Date(dt).toLocaleString('ar', { dateStyle: 'long', timeStyle: 'short' });
  } catch {
    return dt;
  }
}

// Compress an image file to a small square data URL for the avatar column.
async function fileToAvatarDataUrl(file: File, size = 256): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const minSide = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - minSide) / 2;
  const sy = (bitmap.height - minSide) / 2;
  ctx.drawImage(bitmap, sx, sy, minSide, minSide, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.85);
}

function applyTheme(pref: 'light' | 'dark' | 'system') {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = pref === 'dark' || (pref === 'system' && prefersDark);
  root.classList.toggle('dark', dark);
  try {
    localStorage.setItem('jawabi_theme', pref);
  } catch {}
}

// ---------- page ----------

export default function AccountSettingsPage() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  // Profile
  const [profileId, setProfileId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initialProfile, setInitialProfile] = useState({ fullName: '', username: '', avatarUrl: '' });

  // Email
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPw, setShowEmailPw] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Preferences
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifInApp, setNotifInApp] = useState(true);
  const [notifHandover, setNotifHandover] = useState(true);
  const [initialPrefs, setInitialPrefs] = useState({
    language: 'ar',
    theme: 'system',
    notifEmail: true,
    notifInApp: true,
    notifHandover: true,
  });

  const pwScore = useMemo(() => scorePassword(newPassword), [newPassword]);
  const pwMeta = useMemo(() => passwordStrengthLabel(pwScore), [pwScore]);

  const profileDirty =
    fullName !== initialProfile.fullName ||
    username !== initialProfile.username ||
    (avatarUrl || '') !== initialProfile.avatarUrl;

  const prefsDirty =
    language !== initialPrefs.language ||
    theme !== initialPrefs.theme ||
    notifEmail !== initialPrefs.notifEmail ||
    notifInApp !== initialPrefs.notifInApp ||
    notifHandover !== initialPrefs.notifHandover;

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        console.error(error);
        toast.error('تعذر تحميل بيانات الحساب');
      }
      const meta: any = user.user_metadata || {};
      const fn = data?.full_name ?? meta.full_name ?? '';
      const un = (data as any)?.username ?? '';
      const av = data?.avatar_url ?? meta.avatar_url ?? '';
      const lang = ((data as any)?.language_preference as 'ar' | 'en') ?? 'ar';
      const th = ((data as any)?.theme_preference as 'light' | 'dark' | 'system') ?? 'system';
      const np = ((data as any)?.notification_preferences as any) || {};

      setProfileId(data?.id ?? null);
      setFullName(fn);
      setUsername(un);
      setAvatarUrl(av || null);
      setInitialProfile({ fullName: fn, username: un, avatarUrl: av || '' });

      setLanguage(lang);
      setTheme(th);
      setNotifEmail(np.email ?? true);
      setNotifInApp(np.in_app ?? true);
      setNotifHandover(np.handover ?? true);
      setInitialPrefs({
        language: lang,
        theme: th,
        notifEmail: np.email ?? true,
        notifInApp: np.in_app ?? true,
        notifHandover: np.handover ?? true,
      });

      setLoading(false);
    })();
  }, [user]);

  // ----- handlers -----

  const handlePickAvatar = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('الرجاء اختيار صورة صالحة');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }
    try {
      const dataUrl = await fileToAvatarDataUrl(file, 256);
      setAvatarUrl(dataUrl);
    } catch (err) {
      console.error(err);
      toast.error('تعذر معالجة الصورة');
    }
  };

  const handleRemoveAvatar = () => setAvatarUrl(null);

  const handleSaveProfile = async () => {
    if (!user) return;
    const trimmedName = fullName.trim();
    const trimmedUser = username.trim();
    if (!trimmedName) {
      toast.error('الاسم الكامل مطلوب');
      return;
    }
    if (trimmedUser && !/^[a-zA-Z0-9_.-]{3,32}$/.test(trimmedUser)) {
      toast.error('اسم المستخدم يجب أن يكون 3–32 حرفًا (أحرف/أرقام/._-)');
      return;
    }
    setSavingProfile(true);
    const payload: any = {
      user_id: user.id,
      full_name: trimmedName,
      username: trimmedUser || null,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    };
    const query = profileId
      ? supabase.from('profiles').update(payload).eq('id', profileId)
      : supabase.from('profiles').insert(payload);
    const { error } = await query;
    if (error) {
      if ((error as any).code === '23505') {
        toast.error('اسم المستخدم مستخدم مسبقًا');
      } else {
        toast.error(error.message);
      }
    } else {
      // Also mirror to auth user metadata for the sidebar.
      await supabase.auth.updateUser({ data: { full_name: trimmedName, avatar_url: avatarUrl } });
      setInitialProfile({ fullName: trimmedName, username: trimmedUser, avatarUrl: avatarUrl || '' });
      toast.success('تم حفظ التغييرات');
    }
    setSavingProfile(false);
  };

  const handleCancelProfile = () => {
    setFullName(initialProfile.fullName);
    setUsername(initialProfile.username);
    setAvatarUrl(initialProfile.avatarUrl || null);
  };

  const handleChangeEmail = async () => {
    if (!user?.email) return;
    const email = newEmail.trim();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('الرجاء إدخال بريد إلكتروني صالح');
      return;
    }
    if (email.toLowerCase() === user.email.toLowerCase()) {
      toast.error('البريد الإلكتروني الجديد مطابق للحالي');
      return;
    }
    if (!emailPassword) {
      toast.error('الرجاء إدخال كلمة المرور الحالية للتأكيد');
      return;
    }
    setChangingEmail(true);
    // Reverify the current password server-side before allowing the change.
    const { error: pwErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: emailPassword,
    });
    if (pwErr) {
      toast.error('كلمة المرور الحالية غير صحيحة');
      setChangingEmail(false);
      return;
    }
    const { error } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: window.location.origin + '/dashboard/account' },
    );
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('تم إرسال رابط التأكيد إلى البريد الجديد. الرجاء التحقق منه لإتمام التغيير.');
      setNewEmail('');
      setEmailPassword('');
    }
    setChangingEmail(false);
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    void 0;
    return handleChangePasswordInner();
  };

  const handleSendResetLink = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    setSendingReset(false);
    if (error) {
      toast.error('تعذّر إرسال الرابط', { description: error.message });
      return;
    }
    toast.success('تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني');
  };

  const handleChangePasswordInner = async () => {
    if (!user?.email) return;
    if (!currentPassword) {
      toast.error('الرجاء إدخال كلمة المرور الحالية');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (pwScore < 3) {
      toast.error('كلمة المرور ضعيفة. استخدم أحرفًا كبيرة وأرقامًا ورموزًا.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }
    if (newPassword === currentPassword) {
      toast.error('كلمة المرور الجديدة يجب أن تختلف عن الحالية');
      return;
    }
    setChangingPassword(true);
    const { error: pwErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (pwErr) {
      toast.error('كلمة المرور الحالية غير صحيحة');
      setChangingPassword(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('تم تحديث كلمة المرور بنجاح');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setChangingPassword(false);
  };

  const handleSavePrefs = async () => {
    if (!user) return;
    setSavingPrefs(true);
    const payload: any = {
      user_id: user.id,
      language_preference: language,
      theme_preference: theme,
      notification_preferences: {
        email: notifEmail,
        in_app: notifInApp,
        handover: notifHandover,
      },
      updated_at: new Date().toISOString(),
    };
    const query = profileId
      ? supabase.from('profiles').update(payload).eq('id', profileId)
      : supabase.from('profiles').insert({ ...payload, full_name: fullName });
    const { error } = await query;
    if (error) {
      toast.error(error.message);
    } else {
      applyTheme(theme);
      setInitialPrefs({
        language,
        theme,
        notifEmail,
        notifInApp,
        notifHandover,
      });
      toast.success('تم حفظ التفضيلات');
    }
    setSavingPrefs(false);
  };

  const handleCancelPrefs = () => {
    setLanguage(initialPrefs.language as 'ar' | 'en');
    setTheme(initialPrefs.theme as 'light' | 'dark' | 'system');
    setNotifEmail(initialPrefs.notifEmail);
    setNotifInApp(initialPrefs.notifInApp);
    setNotifHandover(initialPrefs.notifHandover);
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) {
      toast.error(error.message);
      setLoggingOutAll(false);
      return;
    }
    toast.success('تم تسجيل الخروج من جميع الأجهزة');
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6" dir="rtl">
        <PageHeader title="إعدادات الحساب" description="إدارة معلوماتك الشخصية والأمان وتفضيلات الحساب." />
        <PageSkeleton />
      </div>
    );
  }

  const initials = (fullName || user?.email || 'U').trim().charAt(0).toUpperCase();
  const lastSignInAt = (user as any)?.last_sign_in_at as string | undefined;
  const createdAt = (user as any)?.created_at as string | undefined;
  const passwordChangedAt =
    ((user as any)?.identities?.[0]?.last_sign_in_at as string | undefined) ||
    (user as any)?.updated_at;

  return (
    <div className="mx-auto max-w-4xl space-y-6 text-right" dir="rtl">
      <PageHeader
        title="إعدادات الحساب"
        description="إدارة معلوماتك الشخصية والأمان وتفضيلات الحساب."
        actions={
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
        }
      />

      {/* Personal information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <UserIcon className="h-5 w-5 text-primary" />
            المعلومات الشخصية
          </CardTitle>
          <CardDescription className="text-right">
            تظهر هذه المعلومات داخل لوحة التحكم فقط.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-start">
            <Avatar className="h-20 w-20 border">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button type="button" variant="outline" onClick={handlePickAvatar} className="gap-2">
                <Camera className="h-4 w-4" />
                تغيير الصورة
              </Button>
              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRemoveAvatar}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  إزالة
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: أحمد محمد"
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                dir="ltr"
                className="text-left"
                maxLength={32}
              />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input value={user?.email || ''} readOnly disabled dir="ltr" className="text-left" />
            </div>
            <div className="space-y-2">
              <Label>الدور</Label>
              <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3">
                <Badge variant={isAdmin ? 'default' : 'secondary'} className="gap-1">
                  <Shield className="h-3 w-3" />
                  {isAdmin ? 'مدير النظام' : 'مستخدم'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={handleCancelProfile}
              disabled={!profileDirty || savingProfile}
            >
              إلغاء التغييرات
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={!profileDirty || savingProfile}
              className="gap-2"
            >
              {savingProfile ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              حفظ التغييرات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Mail className="h-5 w-5 text-primary" />
            تغيير البريد الإلكتروني
          </CardTitle>
          <CardDescription className="text-right">
            سيتم إرسال رابط تأكيد إلى العنوان الجديد قبل تفعيل التغيير.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>البريد الإلكتروني الحالي</Label>
              <Input value={user?.email || ''} readOnly disabled dir="ltr" className="text-left" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEmail">البريد الإلكتروني الجديد</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@example.com"
                dir="ltr"
                className="text-left"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="emailPassword">كلمة المرور الحالية للتأكيد</Label>
            <div className="relative">
              <Input
                id="emailPassword"
                type={showEmailPw ? 'text' : 'password'}
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                dir="ltr"
                className="pe-10 text-left"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowEmailPw((v) => !v)}
                className="absolute inset-y-0 end-2 flex items-center text-muted-foreground hover:text-foreground"
                aria-label={showEmailPw ? 'إخفاء' : 'إظهار'}
              >
                {showEmailPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleChangeEmail} disabled={changingEmail} className="gap-2">
              {changingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              إرسال رابط التأكيد
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Lock className="h-5 w-5 text-primary" />
            تغيير كلمة المرور
          </CardTitle>
          <CardDescription className="text-right">
            استخدم كلمة مرور قوية تتضمن أحرفًا كبيرة وأرقامًا ورموزًا.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                dir="ltr"
                className="pe-10 text-left"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute inset-y-0 end-2 flex items-center text-muted-foreground hover:text-foreground"
                aria-label={showCurrent ? 'إخفاء' : 'إظهار'}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  dir="ltr"
                  className="pe-10 text-left"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute inset-y-0 end-2 flex items-center text-muted-foreground hover:text-foreground"
                  aria-label={showNew ? 'إخفاء' : 'إظهار'}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  dir="ltr"
                  className="pe-10 text-left"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 end-2 flex items-center text-muted-foreground hover:text-foreground"
                  aria-label={showConfirm ? 'إخفاء' : 'إظهار'}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {newPassword && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">قوة كلمة المرور</span>
                <span className="font-medium">{pwMeta.label}</span>
              </div>
              <Progress value={(pwScore / 5) * 100} className="h-1.5" />
              <ul className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                <li className={newPassword.length >= 8 ? 'text-success' : ''}>• 8 أحرف على الأقل</li>
                <li className={/[A-Z]/.test(newPassword) ? 'text-success' : ''}>• حرف كبير</li>
                <li className={/[0-9]/.test(newPassword) ? 'text-success' : ''}>• رقم</li>
                <li className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-success' : ''}>• رمز خاص</li>
              </ul>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-destructive">كلمتا المرور غير متطابقتين.</p>
              )}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="outline"
              onClick={handleSendResetLink}
              disabled={sendingReset}
              className="gap-2"
            >
              {sendingReset ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              نسيت كلمة المرور؟ أرسل رابط إعادة التعيين
            </Button>
            <Button onClick={handleChangePassword} disabled={changingPassword} className="gap-2">
              {changingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              تحديث كلمة المرور
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Shield className="h-5 w-5 text-primary" />
            الأمان والجلسات
          </CardTitle>
          <CardDescription className="text-right">
            راجع نشاط حسابك وقم بإنهاء الجلسات عند الحاجة.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                آخر تسجيل دخول
              </p>
              <p className="text-sm font-medium">{formatDate(lastSignInAt)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                آخر تحديث للحساب
              </p>
              <p className="text-sm font-medium">{formatDate(passwordChangedAt)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <UserIcon className="h-3.5 w-3.5" />
                تاريخ إنشاء الحساب
              </p>
              <p className="text-sm font-medium">{formatDate(createdAt)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                الجلسة الحالية
              </p>
              <p className="text-sm font-medium text-success">نشطة الآن</p>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium text-foreground">تسجيل الخروج من جميع الأجهزة</p>
              <p className="text-sm text-muted-foreground">
                سيتم إنهاء كل الجلسات النشطة على جميع الأجهزة الأخرى.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2" disabled={loggingOutAll}>
                  {loggingOutAll ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  إنهاء كل الجلسات
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-right">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    تأكيد إنهاء الجلسات
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-right">
                    سيتم تسجيل خروجك من جميع الأجهزة بما في ذلك الجهاز الحالي. هل تريد المتابعة؟
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogoutAll}>متابعة</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Palette className="h-5 w-5 text-primary" />
            التفضيلات
          </CardTitle>
          <CardDescription className="text-right">
            اللغة والمظهر وإعدادات الإشعارات.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                اضف كل الصفحات التي تلزم لأن يتم قبول موقعي في meta app
              </Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as 'ar' | 'en')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                المظهر
              </Label>
              <Select
                value={theme}
                onValueChange={(v) => {
                  const t = v as 'light' | 'dark' | 'system';
                  setTheme(t);
                  applyTheme(t);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <span className="flex items-center gap-2">
                      <Sun className="h-4 w-4" /> فاتح
                    </span>
                  </SelectItem>
                  <SelectItem value="dark">
                    <span className="flex items-center gap-2">
                      <Moon className="h-4 w-4" /> داكن
                    </span>
                  </SelectItem>
                  <SelectItem value="system">
                    <span className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" /> حسب النظام
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Bell className="h-4 w-4 text-primary" />
              الإشعارات
            </p>
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">إشعارات البريد الإلكتروني</p>
                  <p className="text-xs text-muted-foreground">
                    استلام تنبيهات مهمة على بريدك.
                  </p>
                </div>
                <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">إشعارات داخل المنصة</p>
                  <p className="text-xs text-muted-foreground">
                    عرض التنبيهات في جرس الإشعارات أعلى الصفحة.
                  </p>
                </div>
                <Switch checked={notifInApp} onCheckedChange={setNotifInApp} />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">تنبيهات التحويل البشري</p>
                  <p className="text-xs text-muted-foreground">
                    تنبيهات عند طلب العميل التحدث مع موظف.
                  </p>
                </div>
                <Switch checked={notifHandover} onCheckedChange={setNotifHandover} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={handleCancelPrefs}
              disabled={!prefsDirty || savingPrefs}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSavePrefs}
              disabled={!prefsDirty || savingPrefs}
              className="gap-2"
            >
              {savingPrefs ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              حفظ التفضيلات
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
