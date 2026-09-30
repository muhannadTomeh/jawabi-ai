import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  Building2,
  CheckCircle2,
  Globe,
  Loader2,
  MessageSquare,
  Rocket,
  Send,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChatbot } from '@/hooks/useChatbot';
import { supabase } from '@/integrations/supabase/client';
import { embedKnowledgeItem } from '@/lib/knowledgeEmbedding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const CATEGORIES = [
  'متجر إلكتروني',
  'مطعم',
  'عيادة طبية',
  'تعليم وتدريب',
  'خدمات',
  'سياحة وسفر',
  'عقارات',
  'أخرى',
];

const categoryQuestions: Record<string, string[]> = {
  'متجر إلكتروني': ['ما المنتجات المتوفرة؟', 'ما سياسة الاستبدال والإرجاع؟'],
  مطعم: ['ما ساعات العمل؟', 'ما أشهر الوجبات لديكم؟'],
  'عيادة طبية': ['ما الخدمات المتوفرة؟', 'كيف أحجز موعدًا؟'],
  'تعليم وتدريب': ['ما الدورات المتوفرة؟', 'كيف يمكنني التسجيل؟'],
  خدمات: ['ما الخدمات التي تقدمونها؟', 'كيف أطلب الخدمة؟'],
  'سياحة وسفر': ['ما العروض المتوفرة؟', 'كيف أحجز رحلة؟'],
  عقارات: ['ما العقارات المتوفرة؟', 'كيف أتواصل مع مسؤول المبيعات؟'],
  أخرى: ['ما الخدمات التي تقدمونها؟', 'كيف يمكنني التواصل معكم؟'],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'bot';
}

function defaultInstructions(name: string, category: string, description: string) {
  const context = description.trim() ? ` معلومات النشاط: ${description.trim()}` : '';
  return `أنت المساعد الرقمي لنشاط ${name} (${category}). أجب بالعربية بأسلوب واضح وودود اعتمادًا على قاعدة المعرفة فقط. إذا لم تجد معلومة مؤكدة، وضّح ذلك واطلب من العميل التواصل مع الموظف.${context}`;
}

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const { chatbot, loading: chatbotLoading, error: chatbotError, updateChatbot, refetch } = useChatbot();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [knowledgeText, setKnowledgeText] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!chatbot) return;
    if (chatbot.onboarding_completed) {
      navigate('/dashboard', { replace: true });
      return;
    }
    setBusinessName(chatbot.business_name || '');
    setCategory(chatbot.business_category || '');
    setLocation(chatbot.business_location || '');
    setDescription(chatbot.business_description || '');
    setStep(Math.min(3, Math.max(1, chatbot.onboarding_step || 1)));
  }, [chatbot, navigate]);

  const progress = useMemo(() => Math.round((step / 3) * 100), [step]);
  const suggestedQuestions = categoryQuestions[category] || categoryQuestions['أخرى'];

  if (authLoading || chatbotLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">نجهّز مساحة عملك…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth?mode=login" replace />;

  if (!chatbot) {
    return (
      <div dir="rtl" className="grid min-h-screen place-items-center bg-background p-6">
        <Card className="w-full max-w-md space-y-4 p-6 text-center">
          <Bot className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="text-xl font-semibold">تعذر تجهيز المساعد</h1>
          <p className="text-sm text-muted-foreground">{chatbotError || 'حدث خطأ غير متوقع. أعد المحاولة.'}</p>
          <Button onClick={() => refetch()} className="w-full">إعادة المحاولة</Button>
        </Card>
      </div>
    );
  }

  const saveBusiness = async (event: FormEvent) => {
    event.preventDefault();
    if (!businessName.trim() || !category) {
      toast.error('أدخل اسم النشاط واختر فئته');
      return;
    }
    setSaving(true);
    const result = await updateChatbot({
      business_name: businessName.trim(),
      business_category: category,
      business_location: location.trim() || null,
      business_description: description.trim() || null,
      name: businessName.trim(),
      public_slug: chatbot.public_slug || `${slugify(businessName)}-${chatbot.id.slice(0, 6)}`,
      custom_instructions: defaultInstructions(businessName.trim(), category, description),
      onboarding_step: 2,
    });
    setSaving(false);
    if (!result.success) {
      toast.error('تعذر حفظ معلومات النشاط');
      return;
    }
    setStep(2);
  };

  const saveKnowledge = async (skip = false) => {
    if (!skip && !knowledgeText.trim() && !websiteUrl.trim()) {
      toast.error('أضف معلومات نصية أو رابط موقع، أو اختر الإضافة لاحقًا');
      return;
    }
    setSaving(true);
    try {
      if (knowledgeText.trim()) {
        const { data, error } = await supabase
          .from('knowledge_items')
          .insert({
            chatbot_id: chatbot.id,
            type: 'text',
            title: `معلومات ${businessName || 'النشاط'}`,
            content: knowledgeText.trim(),
          })
          .select('id')
          .single();
        if (error) throw error;
        if (data?.id) void embedKnowledgeItem(data.id);
      }

      if (websiteUrl.trim()) {
        const { data, error } = await supabase.functions.invoke('fetch-url-content', {
          body: {
            url: websiteUrl.trim(),
            chatbot_id: chatbot.id,
            title: `موقع ${businessName || 'النشاط'}`,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      }

      const result = await updateChatbot({ onboarding_step: 3 });
      if (!result.success) throw result.error;
      setStep(3);
      setQuestion(suggestedQuestions[0]);
    } catch (knowledgeError) {
      console.error('Onboarding knowledge error:', knowledgeError);
      toast.error('تعذر حفظ مصدر المعرفة', { description: 'تحقق من الرابط أو حاول إضافة النص فقط.' });
    } finally {
      setSaving(false);
    }
  };

  const testAssistant = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!question.trim() || testing) return;
    setTesting(true);
    setAnswer('');
    const { data, error } = await supabase.functions.invoke('chat', {
      body: {
        message: question.trim(),
        chatbot_id: chatbot.id,
        user_id: user.id,
        conversation_history: [],
      },
    });
    setTesting(false);
    if (error) {
      toast.error('تعذر اختبار المساعد الآن');
      return;
    }
    setAnswer(data?.response || chatbot.fallback_message);
  };

  const finish = async () => {
    setSaving(true);
    const result = await updateChatbot({
      onboarding_completed: true,
      onboarding_step: 3,
      is_active: true,
    });
    setSaving(false);
    if (!result.success) {
      toast.error('تعذر إكمال الإعداد');
      return;
    }
    toast.success('أصبح مساعدك جاهزًا');
    navigate('/dashboard', { replace: true });
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-background to-primary/[0.04] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/assets/logo.png" alt="جوابي" className="h-11 w-11" />
              <div>
                <p className="font-semibold">جوابي</p>
                <p className="text-xs text-muted-foreground">إعداد مساعدك الأول</p>
              </div>
            </div>
            <span className="text-sm font-medium text-muted-foreground">{step} من 3</span>
          </div>
          <Progress value={progress} className="mt-5 h-2" />
        </header>

        {step === 1 && (
          <Card className="overflow-hidden border-primary/10 shadow-sm">
            <div className="border-b bg-primary/[0.04] p-6 sm:p-8">
              <span className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary"><Building2 className="h-6 w-6" /></span>
              <h1 className="text-2xl font-bold sm:text-3xl">لنبدأ بنشاطك</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">سنستخدم هذه المعلومات لبناء شخصية المساعد تلقائيًا.</p>
            </div>
            <form onSubmit={saveBusiness} className="space-y-5 p-6 sm:p-8">
              <div className="space-y-2">
                <Label htmlFor="business-name">اسم النشاط <span className="text-destructive">*</span></Label>
                <Input id="business-name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="مثال: متجر النور" maxLength={100} autoFocus />
              </div>
              <div className="space-y-2">
                <Label>نوع النشاط <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CATEGORIES.map((item) => (
                    <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-xl border px-3 py-2.5 text-sm transition ${category === item ? 'border-primary bg-primary/10 font-medium text-primary' : 'hover:border-primary/40 hover:bg-muted'}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business-location">المدينة والدولة</Label>
                  <Input id="business-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="عمّان، الأردن" maxLength={120} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="business-description">ماذا تقدم لعملائك؟</Label>
                  <Textarea id="business-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="صف نشاطك ومنتجاتك أو خدماتك بجملتين…" rows={3} maxLength={500} />
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ArrowLeft className="ml-2 h-4 w-4" />}
                متابعة
              </Button>
            </form>
          </Card>
        )}

        {step === 2 && (
          <Card className="overflow-hidden border-primary/10 shadow-sm">
            <div className="border-b bg-primary/[0.04] p-6 sm:p-8">
              <span className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary"><Sparkles className="h-6 w-6" /></span>
              <h1 className="text-2xl font-bold sm:text-3xl">علّم المساعد عن نشاطك</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">ابدأ بأهم المعلومات التي يسأل عنها عملاؤك. يمكنك إضافة ملفات ومصادر أخرى لاحقًا.</p>
            </div>
            <div className="space-y-5 p-6 sm:p-8">
              <div className="space-y-2">
                <Label htmlFor="knowledge-text">معلومات أساسية</Label>
                <Textarea id="knowledge-text" value={knowledgeText} onChange={(event) => setKnowledgeText(event.target.value)} placeholder="ساعات العمل، الخدمات، الأسعار، سياسة التوصيل والاستبدال، طرق التواصل…" rows={7} maxLength={5000} autoFocus />
                <p className="text-xs text-muted-foreground">اكتبها بطريقتك؛ لا تحتاج إلى تنسيق خاص.</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /> أو <span className="h-px flex-1 bg-border" /></div>
              <div className="space-y-2">
                <Label htmlFor="website-url" className="flex items-center gap-2"><Globe className="h-4 w-4" /> رابط موقعك</Label>
                <Input id="website-url" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://example.com" dir="ltr" />
              </div>
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                <Button variant="ghost" className="sm:w-auto" onClick={() => saveKnowledge(true)} disabled={saving}>سأضيف المعلومات لاحقًا</Button>
                <Button className="flex-1" size="lg" onClick={() => saveKnowledge(false)} disabled={saving}>
                  {saving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ArrowLeft className="ml-2 h-4 w-4" />}
                  حفظ ومتابعة
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="overflow-hidden border-primary/10 shadow-sm">
            <div className="border-b bg-primary/[0.04] p-6 sm:p-8">
              <span className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary"><MessageSquare className="h-6 w-6" /></span>
              <h1 className="text-2xl font-bold sm:text-3xl">جرّب أول محادثة</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">اسأل كما يسأل عميلك. تستطيع تعديل المعلومات والإجابات لاحقًا.</p>
            </div>
            <div className="space-y-5 p-6 sm:p-8">
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((item) => (
                  <button key={item} type="button" onClick={() => setQuestion(item)} className="rounded-full border bg-card px-3 py-1.5 text-xs transition hover:border-primary hover:text-primary">{item}</button>
                ))}
              </div>
              <form onSubmit={testAssistant} className="flex gap-2">
                <Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="اكتب سؤالًا لتجربة المساعد…" className="flex-1" autoFocus />
                <Button type="submit" size="icon" disabled={testing || !question.trim()} aria-label="إرسال السؤال">
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
              {(testing || answer) && (
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium"><Bot className="h-4 w-4 text-primary" /> إجابة المساعد</div>
                  {testing ? <div className="space-y-2"><div className="h-3 w-full animate-pulse rounded bg-muted" /><div className="h-3 w-4/5 animate-pulse rounded bg-muted" /></div> : <p className="whitespace-pre-wrap text-sm leading-7">{answer}</p>}
                </div>
              )}
              <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4 text-sm text-muted-foreground">
                <p className="flex items-center gap-2 font-medium text-foreground"><CheckCircle2 className="h-4 w-4 text-success" /> بعد الإكمال</p>
                <p className="mt-1 leading-6">ستتمكن من إضافة ملفات، ربط تيليجرام، ومشاركة رابط المحادثة مع عملائك.</p>
              </div>
              <Button size="lg" className="w-full" onClick={finish} disabled={saving}>
                {saving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Rocket className="ml-2 h-4 w-4" />}
                تفعيل المساعد والذهاب للوحة التحكم
              </Button>
            </div>
          </Card>
        )}

        <button onClick={() => navigate('/dashboard')} className="mx-auto mt-6 block text-xs text-muted-foreground transition hover:text-foreground">
          الخروج إلى لوحة التحكم
        </button>
      </div>
    </main>
  );
}
