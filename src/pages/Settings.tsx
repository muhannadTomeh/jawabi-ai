import { useState, useEffect } from 'react';
import { Save, Bot, MessageSquare, Shield, Loader2, Send } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/layout/PageSkeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChatbot } from '@/hooks/useChatbot';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { chatbot, loading, updateChatbot } = useChatbot();
  const [saving, setSaving] = useState(false);

  const [botName, setBotName] = useState('');
  const [language, setLanguage] = useState('العربية');
  const [tone, setTone] = useState('professional');
  const [dialect, setDialect] = useState('formal');
  const [fallbackMessage, setFallbackMessage] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [botMode, setBotMode] = useState<'inquiries_only' | 'inquiries_sales' | 'inquiries_sales_followup'>('inquiries_sales');
  const [ownerTelegramChatId, setOwnerTelegramChatId] = useState('');

  const [handoverEnabled, setHandoverEnabled] = useState(true);
  const [keywords, setKeywords] = useState('بشري، موظف، مساعدة، دعم');
  const [handoverMessage, setHandoverMessage] = useState('');
  const [failedThreshold, setFailedThreshold] = useState(3);
  const [triggerOnSale, setTriggerOnSale] = useState(false);
  const [saleMessage, setSaleMessage] = useState('سأقوم بتحويلك إلى أحد موظفي المبيعات لإتمام طلبك.');
  const [handoverSettingsId, setHandoverSettingsId] = useState<string | null>(null);
  const [takeoverMode, setTakeoverMode] = useState(false);
  const [takeoverTimeout, setTakeoverTimeout] = useState(60);

  useEffect(() => {
    if (chatbot) {
      setBotName(chatbot.name);
      setLanguage(chatbot.language);
      setTone(chatbot.tone);
      setDialect((chatbot as any).dialect || 'formal');
      setFallbackMessage(chatbot.fallback_message);
      setWelcomeMessage((chatbot as any).welcome_message || '');
      setCustomInstructions((chatbot as any).custom_instructions || '');
      setBotMode(((chatbot as any).bot_mode || 'inquiries_sales'));
      setOwnerTelegramChatId(((chatbot as any).owner_telegram_chat_id || ''));
      loadHandover(chatbot.id);
    }
  }, [chatbot]);

  const loadHandover = async (chatbotId: string) => {
    const { data } = await supabase
      .from('handover_settings')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .maybeSingle();
    if (data) {
      setHandoverSettingsId(data.id);
      setHandoverEnabled(data.enabled);
      setKeywords((data.trigger_keywords || []).join('، '));
      setHandoverMessage(data.handover_message);
      setFailedThreshold(data.failed_responses_threshold ?? 3);
      setTriggerOnSale((data as any).trigger_on_sale ?? false);
      setSaleMessage((data as any).sale_message ?? 'سأقوم بتحويلك إلى أحد موظفي المبيعات لإتمام طلبك.');
      setTakeoverMode((data as any).takeover_mode_enabled ?? false);
      setTakeoverTimeout((data as any).takeover_timeout_minutes ?? 60);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateChatbot({
      name: botName,
      language,
      tone,
      dialect,
      fallback_message: fallbackMessage,
      welcome_message: welcomeMessage,
      custom_instructions: customInstructions,
      bot_mode: botMode,
      owner_telegram_chat_id: ownerTelegramChatId.trim() || null,
    } as any);

    let handoverOk = true;
    if (chatbot) {
      const payload = {
        chatbot_id: chatbot.id,
        enabled: handoverEnabled,
        trigger_keywords: keywords
          .split(/[،,]/)
          .map((k) => k.trim())
          .filter(Boolean),
        handover_message: handoverMessage,
        failed_responses_threshold: failedThreshold,
        trigger_on_sale: triggerOnSale,
        sale_message: saleMessage,
        takeover_mode_enabled: takeoverMode,
        takeover_timeout_minutes: takeoverTimeout,
      } as any;
      if (handoverSettingsId) {
        const { error } = await supabase
          .from('handover_settings')
          .update(payload)
          .eq('id', handoverSettingsId);
        handoverOk = !error;
      } else {
        const { data, error } = await supabase
          .from('handover_settings')
          .insert(payload)
          .select()
          .single();
        handoverOk = !error;
        if (data) setHandoverSettingsId(data.id);
      }
    }

    setSaving(false);
    if (result?.success && handoverOk) {
      toast.success('تم حفظ الإعدادات بنجاح');
    } else {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
        <PageHeader title="الإعدادات" description="تخصيص سلوك الشات بوت وردوده" />
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="الإعدادات"
        description="تخصيص سلوك الشات بوت وردوده"
        actions={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
            حفظ التغييرات
          </Button>
        }
      />

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6" dir="rtl">
        <TabsList className="justify-start">
          <TabsTrigger value="general" className="gap-2">
            <Bot className="h-4 w-4" />
            عام
          </TabsTrigger>
          <TabsTrigger value="handover" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            التحويل للدعم
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <div className="card-elevated p-6">
            <h3 className="mb-6 flex items-center gap-2 font-semibold text-foreground">
              <Bot className="h-5 w-5 text-primary" />
              إعدادات البوت
            </h3>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">اسم البوت</Label>
                <Input
                  id="name"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="مثال: مساعد الدعم"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">أضف نظامين مترابطين: (أ) نظام باقات (Plans) يتحكم بحدود Rate Limiting الموجودة، و(ب) لوحة إدارة API حقيقية داخل صفحة الأدمن بدل الإعدادات الوهمية الحالية.\n\n===========================================\n\nأ) نظام الباقات (Plans) وربطه بالـ Rate Limiting\n\n===========================================\n\n1. جدول جديد plans:\n\n- id uuid pk، name text (مثلاً \"مجاني\"، \"أساسي\"، \"احترافي\")، slug text unique\n\n- price_monthly numeric default 0\n\n- messages_per_day integer not null default 300\n\n- messages_per_minute_per_chatbot integer not null default 60\n\n- max_channels integer not null default 4\n\n- max_knowledge_items integer default null (null = بلا حدود)\n\n- allowed_model text (اسم الموديل المسموح لهذه الباقة، nullable = يستخدم الافتراضي العام)\n\n- is_default boolean default false (باقة واحدة فقط هي الافتراضية لأي حساب جديد)\n\n- created_at, updated_at\n\nأدرج صفًا واحدًا افتراضيًا \"مجاني\" بنفس القيم الحالية (300 رسالة/يوم، 60/دقيقة) وعلّمه is_default = true حتى ما ينكسر شي بالموجود.\n\n2. أضف عمود chatbots.plan_id uuid references plans(id)، واملأه تلقائيًا لكل الصفوف الحالية بمعرف الباقة الافتراضية \"مجاني\" عبر migration.\n\nعند إنشاء بوت جديد (تحقق من مكان الإنشاء في onboarding/الكود)، اربطه تلقائيًا بالباقة is_default = true.\n\n3. RLS: الجدول plans قراءة متاحة لكل مستخدم مسجّل (authenticated) حتى يظهر بصفحة الأسعار لاحقًا، لكن الكتابة (insert/update/delete) للأدمن فقط (has_role admin).\n\n4. عدّل ملف supabase/functions/_shared/rate-limit.ts ودالة enforceRateLimits: بدل الثوابت الحالية (IP_PER_MINUTE=20 ثابت، CHATBOT_PER_MINUTE=60 ثابت، DEFAULT_DAILY_LIMIT=300 ثابت)، اجعل حدي \"chatbot per minute\" و\"daily\" يُقرآن من plans عبر chatbots.plan_id (بجلب صف الخطة مع صف البوت في نفس الاستعلام الموجود أصلاً في chat/index.ts). حد الـ IP (20/دقيقة) يبقى ثابتًا على مستوى المنصة لأنه حماية عامة من الإساءة الآلية مو مرتبط بباقة مستخدم معين.\n\n5. أضف تبويب \"الباقات\" داخل صفحة /dashboard/admin (بجانب التبويبات الموجودة كالمستخدمين والمحادثات):\n\n- جدول يعرض كل الباقات بأعمدتها.\n\n- نموذج لإنشاء/تعديل باقة (كل الحقول أعلاه).\n\n- إمكانية تعيين باقة كافتراضية (يلغي الافتراضية عن الباقي تلقائيًا).\n\n- إمكانية تغيير باقة مستخدم معيّن من صفحة تفاصيل المستخدم/البوت في الأدمن (Select يختار الباقة الحالية للبوت).\n\n- لا تضف بوابة دفع أو Stripe الآن — فقط إدارة الباقات والحدود يدويًا من الأدمن، الدفع خطوة لاحقة منفصلة.\n\n6. تأكد أن دالة get_chatbot_daily_usage الموجودة ترجع أيضًا اسم الباقة الحالية، وحدّث بطاقة \"استخدام اليوم\" في Dashboard لتعرض اسم الباقة بجانب الاستهلاك.\n\n===========================================\n\nب) لوحة إدارة API حقيقية (بدل القائمة الوهمية الحالية)\n\n===========================================\n\nالمشكلة الحالية: src/components/admin/LlmSettings.tsx فيه مصفوفة MODELS مكتوبة يدويًا بالكود (أسماء موديلات ثابتة) — هذا غير مقبول لأنه لا يعكس الموديلات المتاحة فعليًا لمزوّد معيّن، ولا يتحقق من صحة المفتاح.\n\nالمطلوب استبداله بنظام حقيقي:\n\n1. أنشئ جدول api_providers:\n\n- id uuid pk، provider_key text unique (مثل 'lovable_gateway', 'openai', 'google', 'anthropic')\n\n- display_name text\n\n- api_key text nullable (المفتاح المخصص لهذا المزوّد، فارغ يعني استخدام مفتاح Lovable الافتراضي حيث ينطبق)\n\n- is_active boolean default false (المزوّد المفعّل حاليًا للاستخدام في المنصة — واحد فقط active في كل مرة)\n\n- last_validated_at timestamptz nullable\n\n- last_models_sync_at timestamptz nullable\n\n- created_at, updated_at\n\nRLS: قراءة وكتابة للأدمن فقط (has_role admin)، لا وصول إطلاقًا لغير الأدمن — هذا الجدول يحتوي مفاتيح حساسة.\n\n2. أنشئ جدول api_provider_models:\n\n- id uuid pk، provider_id uuid references api_providers(id) on delete cascade\n\n- model_id text (المعرف التقني الفعلي للموديل كما يرجعه الـ API، مثل \"gpt-4o\" أو \"gemini-2.5-flash\")\n\n- display_name text\n\n- fetched_at timestamptz default now()\n\nهذا الجدول يُملأ فقط عبر استدعاء API فعلي، لا تُدخل بيانات يدويًا أو وهمية أبدًا.\n\nRLS: قراءة لأي مستخدم authenticated (حتى تظهر بصفحة اختيار الموديل إذا لزم لاحقًا)، كتابة عبر service_role فقط (من الـ edge function).\n\n3. أنشئ Edge Function جديدة sync-provider-models:\n\n- تستقبل provider_key، وتتحقق أن الطالب أدمن (تحقق JWT + has_role، نفس نمط manage-channel).\n\n- حسب provider_key، تستدعي الـ API الحقيقي لجلب قائمة الموديلات المتاحة فعليًا بالمفتاح المُدخل:\n\n  - لو 'openai': GET https://api.openai.com/v1/models مع Authorization: Bearer <api_key>، فلتر النتائج لموديلات chat/completions المعروفة (تجاهل embeddings/whisper/tts/dall-e/moderation).\n\n  - لو 'google': GET https://generativelanguage.googleapis.com/v1beta/models?key=<api_key>، فلتر الموديلات التي تدعم generateContent.\n\n  - لو 'anthropic': GET https://api.anthropic.com/v1/models مع header x-api-key و anthropic-version.\n\n  - لو 'lovable_gateway': استخدم القائمة المعروفة من توثيق Lovable AI Gateway الفعلي إن وجد endpoint models، أو إذا ما فيه endpoint عام، اجلبها من التوثيق الرسمي المتاح للـ gateway وليس بيانات مخترعة — إذا تعذّر تمامًا، اترك هذا المزوّد بدون مزامنة تلقائية وبدل ذلك اعرض في الواجهة رسالة \"استخدم Lovable AI Gateway الافتراضي بدون تحديد موديل يدوي\" بدل قائمة وهمية.\n\n  - إذا فشل الاستدعاء (مفتاح خاطئ، صلاحية منتهية): أرجع خطأ واضحًا للواجهة (رسالة الخطأ الفعلية من مزوّد الـ API، لا رسالة عامة)، ولا تحفظ أي موديلات وهمية أو قديمة كبديل.\n\n- عند نجاح الجلب: احذف الموديلات القديمة لنفس provider_id من api_provider_models وأدرج القائمة الجديدة الحقيقية، وحدّث last_models_sync_at و last_validated_at في api_providers.\n\n4. أعد بناء src/components/admin/LlmSettings.tsx بالكامل (يمكن تسميته من جديد ApiIntegrations.tsx إذا كان أنسب معماريًا) بواجهة:\n\n- Tabs أو قائمة بمزوّدي الـ API: Lovable AI Gateway (افتراضي، مفعّل دائمًا كخيار احتياطي)، OpenAI، Google Gemini، Anthropic.\n\n- لكل مزوّد: حقل إدخال API Key (password field)، وزر \"حفظ ومزامنة الموديلات\" يستدعي sync-provider-models.\n\n- بعد المزامنة الناجحة: اعرض قائمة الموديلات الحقيقية المسترجعة (من api_provider_models) في Select حقيقي، مع طابع زمني \"آخر مزامنة: ...\" وزر تحديث يدوي.\n\n- إذا لم تتم أي مزامنة بعد لمزوّد معيّن: اعرض حالة فارغة واضحة \"لم تُجلب أي موديلات بعد — أدخل المفتاح واضغط مزامنة\" بدل أي قائمة افتراضية.\n\n- زر/Switch \"تفعيل هذا المزوّد\" لتحديد أي مزوّد هو المستخدم فعليًا في chat/visitor-chat (يُحدّث is_active في api_providers، ويُلغي التفعيل عن البقية تلقائيًا).\n\n- زر \"اختبار الاتصال\" منفصل يرسل رسالة تجريبية بسيطة للموديل المختار ويعرض نجاح/فشل فوري، دون التأثير على العملاء الحقيقيين.\n\n5. حدّث دالة القراءة في chat/index.ts و visitor-chat/index.ts: بدل القراءة من llm_settings القديم، اقرأ المزوّد المفعّل (is_active = true) من api_providers مع الموديل المحدد له، وإذا لم يوجد أي مزوّد مفعّل صراحة، استخدم Lovable AI Gateway بالمفتاح الافتراضي كسلوك احتياطي آمن (fail-safe) حتى لا يتوقف أي بوت عن العمل.\n\n6. لا تحذف جدول llm_settings القديم (تجنبًا لكسر أي مرجع)، لكن أوقف استخدامه في الكود الفعلي بعد الانتقال الكامل للنظام الجديد، ويمكن ترك ملاحظة تعليقية بذلك.\n\n7. بعد التنفيذ، اختبر يدويًا (أو بأقل استدعاءات ممكنة توفيرًا للتكلفة):\n\n- مزامنة موديلات OpenAI بمفتاح تجريبي صالح إن وُجد، وتأكد أن القائمة المعروضة تطابق ما يرجعه API فعليًا (اطبعها بالكونسول للمقارنة).\n\n- محاولة مزامنة بمفتاح خاطئ عمدًا، وتأكد من ظهور رسالة الخطأ الحقيقية وعدم حفظ أي موديل وهمي.\n\n- تأكد أن chat تستمر بالعمل طبيعيًا حتى بدون تفعيل أي مزوّد يدوي (fail-safe إلى Lovable Gateway).</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="العربية">العربية</SelectItem>
                    <SelectItem value="الإنجليزية">الإنجليزية</SelectItem>
                    <SelectItem value="الفرنسية">الفرنسية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">نبرة المحادثة</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                  <SelectTrigger id="tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">احترافي</SelectItem>
                    <SelectItem value="friendly">ودود</SelectItem>
                    <SelectItem value="casual">عفوي</SelectItem>
                    <SelectItem value="formal">رسمي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dialect">لهجة البوت</Label>
                <Select value={dialect} onValueChange={setDialect}>
                  <SelectTrigger id="dialect">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">عربية فصحى / رسمية</SelectItem>
                    <SelectItem value="palestinian">عامية فلسطينية</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  حدد اللهجة التي سيتحدث بها البوت مع المستخدمين.
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="welcome">رسالة الترحيب</Label>
                <Textarea
                  id="welcome"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={2}
                  placeholder="مثال: مرحباً! كيف يمكنني مساعدتك اليوم؟"
                />
                <p className="text-xs text-muted-foreground">
                  هذه الرسالة تُرسل تلقائياً عند بدء محادثة جديدة مع البوت.
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="fallback">رسالة عدم الفهم</Label>
                <Textarea
                  id="fallback"
                  value={fallbackMessage}
                  onChange={(e) => setFallbackMessage(e.target.value)}
                  rows={2}
                  placeholder="الرسالة التي تظهر عندما لا يفهم البوت السؤال..."
                />
                <p className="text-xs text-muted-foreground">
                  هذه الرسالة تُرسل عندما لا يستطيع الشات بوت فهم طلب المستخدم.
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="instructions">تعليمات إضافية للبوت</Label>
                <Textarea
                  id="instructions"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={4}
                  placeholder="مثال: إذا سأل المستخدم عن الأسعار، وجّهه للتواصل مع المبيعات. لا تجب عن الأسئلة السياسية..."
                />
                <p className="text-xs text-muted-foreground">
                  أوامر وتعليمات مخصصة تحدد كيف يتعامل البوت مع الأسئلة خارج قاعدة المعرفة.
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="botMode">وضع عمل البوت</Label>
                <Select value={botMode} onValueChange={(v) => setBotMode(v as typeof botMode)}>
                  <SelectTrigger id="botMode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inquiries_only">استفسارات فقط</SelectItem>
                    <SelectItem value="inquiries_sales">استفسارات + مبيعات</SelectItem>
                    <SelectItem value="inquiries_sales_followup">استفسارات + مبيعات + متابعة (قريباً)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  يتحكم بسلوك البوت: هل يكتفي بالإجابة على الأسئلة، أم يكتشف نية الشراء ويرسل إشعاراً للمالك.
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ownerTg" className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  معرّف محادثة المالك على تيليجرام
                </Label>
                <Input
                  id="ownerTg"
                  dir="ltr"
                  value={ownerTelegramChatId}
                  onChange={(e) => setOwnerTelegramChatId(e.target.value)}
                  placeholder="123456789"
                />
                <p className="text-xs text-muted-foreground">
                  عند اكتشاف نية شراء، سيرسل البوت ملخص الطلب على هذا المعرّف مع زر «تأكيد الطلب». يمكنك معرفة رقمك عبر @userinfobot.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Handover Settings */}
        <TabsContent value="handover" className="space-y-6">
          <div className="card-elevated p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">التحويل للدعم البشري</h3>
              </div>
              <Switch
                checked={handoverEnabled}
                onCheckedChange={setHandoverEnabled}
              />
            </div>

            <div className={handoverEnabled ? 'space-y-6' : 'pointer-events-none opacity-50 space-y-6'}>
              <div className="space-y-2">
                <Label htmlFor="keywords">كلمات التحويل</Label>
                <Input
                  id="keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="بشري، موظف، دعم"
                />
                <p className="text-xs text-muted-foreground">
                  كلمات مفصولة بفواصل تؤدي إلى التحويل عند اكتشافها
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="failedThreshold">عدد الرسائل غير المفهومة قبل التحويل</Label>
                <Input
                  id="failedThreshold"
                  type="number"
                  min={1}
                  max={10}
                  value={failedThreshold}
                  onChange={(e) => setFailedThreshold(Number(e.target.value) || 3)}
                />
                <p className="text-xs text-muted-foreground">
                  إذا فشل البوت في فهم الزبون هذا العدد من المرات المتتالية، يتم تحويله لموظف.
                </p>
              </div>

              <div className="rounded-lg border border-border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">التحويل عند نية الشراء</p>
                    <p className="text-sm text-muted-foreground">
                      تحويل الزبون لموظف مبيعات عند اكتشاف نية إجراء عملية شراء حقيقية
                    </p>
                  </div>
                  <Switch checked={triggerOnSale} onCheckedChange={setTriggerOnSale} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saleMsg">
                    {triggerOnSale ? 'رسالة التحويل للمبيعات' : 'الرسالة البديلة عند نية الشراء'}
                  </Label>
                  <Textarea
                    id="saleMsg"
                    value={saleMessage}
                    onChange={(e) => setSaleMessage(e.target.value)}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    {triggerOnSale
                      ? 'تُرسل عند تحويل الزبون لموظف المبيعات.'
                      : 'عند تعطيل التحويل، تُرسل هذه الرسالة بدلاً منه (مثل: رابط المتجر أو رقم التواصل).'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="handoverMsg">رسالة التحويل</Label>
                <Textarea
                  id="handoverMsg"
                  value={handoverMessage}
                  onChange={(e) => setHandoverMessage(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  الرسالة المرسلة للمستخدم عند تحويله لموظف الدعم
                </p>
              </div>
            </div>
          </div>

          <div className="card-elevated p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">وضع التدخل البشري</h3>
                  <p className="text-sm text-muted-foreground">
                    عندما يرد موظف يدوياً على المحادثة، يتوقف البوت مؤقتاً عن الرد لتفادي التداخل.
                  </p>
                </div>
              </div>
              <Switch
                checked={takeoverMode}
                onCheckedChange={setTakeoverMode}
              />
            </div>
            <div className={takeoverMode ? 'space-y-2' : 'pointer-events-none opacity-50 space-y-2'}>
              <Label htmlFor="takeoverTimeout">مدة إيقاف البوت (بالدقائق)</Label>
              <Input
                id="takeoverTimeout"
                type="number"
                min={5}
                max={1440}
                value={takeoverTimeout}
                onChange={(e) => setTakeoverTimeout(Number(e.target.value) || 60)}
              />
              <p className="text-xs text-muted-foreground">
                يبقى البوت متوقفاً في تلك المحادثة حتى تمر هذه المدة من دون تدخل بشري إضافي.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
